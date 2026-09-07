'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Image from 'next/image'
import {
  MessageCircle,
  Send,
  Loader2,
  CheckCheck,
  Search,
  User,
  ShieldAlert,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/providers/toast-provider'
import { playNotificationSound } from '@/utils/chat-sound'
import { sendAdminSupportReplyAction } from '@/app/actions/chat'

interface AdminConv {
  id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  user_avatar_url: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  created_at: string
}

interface AdminMsg {
  id: string
  sender_id: string
  sender_name: string | null
  sender_email: string | null
  body: string
  is_read: boolean
  created_at: string
}

export function AdminSupportChatDashboard({
  initialConversations,
  adminUserId,
}: {
  initialConversations: AdminConv[]
  adminUserId: string
}) {
  const [conversations, setConversations] = useState<AdminConv[]>(initialConversations)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  )
  const [messages, setMessages] = useState<AdminMsg[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [inputText, setInputText] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, startSendTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 0. Fetch conversations on mount using the browser client (has admin JWT)
  useEffect(() => {
    let ignore = false
    const supabase = createClient()
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('admin_get_support_conversations')
        if (ignore) return
        if (!error && data && data.length > 0) {
          setConversations(data)
          setSelectedConvId((prev) => prev ?? data[0].id)
        }
      } catch {
        // ignore network errors
      }
    })()
    return () => { ignore = true }
  }, [])

  // 1. Fetch messages when active conversation changes
  useEffect(() => {
    let ignore = false
    if (selectedConvId) {
      const supabase = createClient()
      void (async () => {
        try {
          const { data, error } = await supabase.rpc('admin_get_support_messages', {
            p_conversation_id: selectedConvId,
          })
          if (ignore) return
          if (!error && data) {
            setMessages(data)
            void supabase.rpc('admin_mark_conversation_read', {
              p_conversation_id: selectedConvId,
            })
            setConversations((prev) =>
              prev.map((c) => (c.id === selectedConvId ? { ...c, unread_count: 0 } : c))
            )
          }
        } catch {
          // ignore network errors
        } finally {
          if (!ignore) setIsLoadingMessages(false)
        }
      })()
    }
    return () => { ignore = true }
  }, [selectedConvId])

  // 2. Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Supabase Realtime for incoming messages across all support conversations
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-support-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
        },
        async (payload) => {
          const newRow = payload.new as {
            id: string
            conversation_id: string
            sender_id: string
            body: string
            is_read: boolean
            created_at: string
          }

          if (!newRow) return

          // If message is in currently viewed conversation
          if (newRow.conversation_id === selectedConvId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev
              return [
                ...prev,
                {
                  id: newRow.id,
                  sender_id: newRow.sender_id,
                  sender_name: 'Pengguna',
                  sender_email: '',
                  body: newRow.body,
                  is_read: newRow.is_read,
                  created_at: newRow.created_at,
                },
              ]
            })

            // Mark read if it's from the user
            if (newRow.sender_id !== adminUserId) {
              await supabase.rpc('admin_mark_conversation_read', {
                p_conversation_id: selectedConvId,
              })
            }
          }

          // If message is from user (not admin), play chime and show toast
          if (newRow.sender_id !== adminUserId) {
            playNotificationSound()
            toast.info('Pesan Support Baru dari User', newRow.body)
          }

          // Refresh conversation list
          const { data: convData } = await supabase.rpc('admin_get_support_conversations')
          if (convData) {
            setConversations(convData)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [selectedConvId, adminUserId])

  // 4. Send reply
  const handleSend = () => {
    if (!inputText.trim() || !selectedConvId || isSending) return

    const text = inputText.trim()
    const tempId = `temp-${crypto.randomUUID()}`

    // Optimistic append
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender_id: adminUserId,
        sender_name: 'Admin',
        sender_email: 'admin@warungpedia.id',
        body: text,
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ])
    setInputText('')

    startSendTransition(async () => {
      const fd = new FormData()
      fd.set('conversationId', selectedConvId)
      fd.set('body', text)
      const res = await sendAdminSupportReplyAction(undefined, fd)

      if (!res.success) {
        toast.error('Gagal mengirim balasan.', res.message)
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      }
    })
  }

  const selectedConversation = conversations.find((c) => c.id === selectedConvId)

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      (c.user_name && c.user_name.toLowerCase().includes(q)) ||
      (c.user_email && c.user_email.toLowerCase().includes(q)) ||
      (c.last_message && c.last_message.toLowerCase().includes(q))
    )
  })

  return (
    <div className="flex h-[75vh] min-h-[550px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* ─── SIDEBAR (Conversation List) ────────────────────────── */}
      <div className="w-80 shrink-0 border-r border-neutral-200 flex flex-col bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950/40">
        {/* Search Header */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-1.5 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              <MessageCircle className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-700 mb-2" />
              Belum ada percakapan pengguna.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-white dark:hover:bg-neutral-800/50 ${
                    isSelected
                      ? 'bg-white dark:bg-neutral-800 border-l-4 border-l-brand-600 shadow-xs'
                      : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    {conv.user_avatar_url ? (
                      <Image
                        src={conv.user_avatar_url}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-xs dark:bg-brand-950 dark:text-brand-300">
                        {conv.user_name ? conv.user_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-xs text-neutral-900 truncate dark:text-neutral-100">
                        {conv.user_name || conv.user_email || 'Pengguna'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-neutral-500 truncate dark:text-neutral-400">
                      {conv.last_message || 'Belum ada pesan'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ─── MAIN CHAT AREA ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-6 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 font-semibold text-xs dark:bg-neutral-800 dark:text-neutral-300">
                  {selectedConversation.user_name
                    ? selectedConversation.user_name.charAt(0).toUpperCase()
                    : <User className="h-4 w-4" />}
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                    {selectedConversation.user_name || 'Pengguna'}
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    {selectedConversation.user_email}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-neutral-50/40 dark:bg-neutral-950/40">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-neutral-400 text-xs">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Memuat pesan...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-neutral-400 text-xs">
                  Belum ada pesan dalam percakapan ini.
                </div>
              ) : (
                messages.map((m) => {
                  const isFromAdmin = m.sender_id === adminUserId
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-xs leading-relaxed break-words ${
                          isFromAdmin
                            ? 'bg-brand-600 text-white rounded-br-xs'
                            : 'bg-white text-neutral-900 border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                            isFromAdmin ? 'text-brand-100' : 'text-neutral-400'
                          }`}
                        >
                          <span>
                            {new Date(m.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isFromAdmin && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  placeholder="Ketik balasan untuk pengguna... (Shift+Enter untuk baris baru)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isSending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                  title="Kirim balasan"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-8 text-neutral-400">
            <ShieldAlert className="h-12 w-12 mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              Pilih Percakapan
            </p>
            <p className="text-xs text-neutral-500 max-w-xs mt-1">
              Pilih pengguna dari daftar di sebelah kiri untuk melihat pesan dan memberikan bantuan.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
