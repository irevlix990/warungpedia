import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDictionary } from '@/lib/i18n'

export default async function AuthErrorPage() {
  const t = getDictionary()

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Autentikasi gagal</CardTitle>
        <CardDescription>
          Tautan atau sesi tidak valid atau telah kedaluwarsa. Silakan coba lagi.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Link href="/auth/signin">
          <Button variant="outline">{t.auth.backToSignIn}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
