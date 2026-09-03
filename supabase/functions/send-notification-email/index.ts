// Supabase Edge Function: send-notification-email
//
// Receives a POST payload from the database (pg_net webhook triggered by
// `maybe_send_email_notification` in migration 009) and sends a transactional
// notification email via Resend.
//
// Environment ("Settings → Function secrets"):
//   RESEND_API_KEY  — Resend API key
//   RESEND_FROM     — verified sender, e.g. "Warungpedia <noreply@ex.com>"
//   PUBLIC_APP_URL  — base URL used to build a clickable link (optional)
//
// The webhook URL is stored in `settings` under
// 'notifications.email_url' and delivered over pg_net.

interface NotificationPayload {
  to: string
  title: string
  body: string
  link?: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return new Response('RESEND_API_KEY is not configured', {
      status: 503,
      headers: corsHeaders,
    })
  }

  let payload: NotificationPayload
  try {
    payload = (await req.json()) as NotificationPayload
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
  }

  if (!payload.to || !payload.title) {
    return new Response('Missing to/title', { status: 400, headers: corsHeaders })
  }

  const from =
    Deno.env.get('RESEND_FROM') ?? 'Warungpedia <onboarding@resend.dev>'
  const appUrl = Deno.env.get('PUBLIC_APP_URL') ?? 'http://localhost:3000'
  const link = payload.link ? `${appUrl}${payload.link}` : appUrl
  const body = payload.body ? payload.body + '\n\n' : ''
  const text = `${body}Lihat di Warungpedia: ${link}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.title,
      text,
    }),
  })

  const out = await res.text()
  if (!res.ok) {
    return new Response(out, { status: res.status, headers: corsHeaders })
  }

  return new Response(out, { status: 200, headers: corsHeaders })
})