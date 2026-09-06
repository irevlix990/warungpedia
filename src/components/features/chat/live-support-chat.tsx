'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Sparkles,
  Minimize2,
  CheckCheck,
  Loader2,
  ShieldCheck,
  LogIn,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/providers/toast-provider'
import { playNotificationSound } from '@/utils/chat-sound'
import { sendSupportMessageAction, markSupportConversationReadAction } from '@/app/actions/chat'
import type { SupportMessage } from '@/types/communication'

interface LiveMessage extends SupportMessage {
  pending?: boolean
}

const QUICK_PROMPTS = [
  'Halo Admin, mau tanya status pesanan saya.',
  'Bagaimana cara mengajukan pengembalian barang?',
  'Apakah ada voucher promo yang sedang aktif?',
]

export function LiveSupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, startSendTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 1. Check user auth status on mount
  useEffect(() => {
    const supabase = createClient()

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        setUserId(null)
      }
    }

    void checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. Fetch conversation ID and existing messages
  useEffect(() => {
    let ignore = false
    if (userId) {
      const supabase = createClient()
      void (async () => {
        try {
          let { data: conv } = await supabase
            .from('support_conversations')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

          if (!conv) {
            const { data: newConvId } = await supabase.rpc('get_or_create_support_conversation')
            if (newConvId) {
              conv = { id: newConvId }
            }
          }

          if (conv?.id && !ignore) {
            setConversationId(conv.id)

            const { data: dbMessages } = await supabase
              .from('support_messages')
              .select('id, sender_id, body, is_read, created_at')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true })
              .limit(150)

            if (dbMessages && !ignore) {
              const mapped: LiveMessage[] = dbMessages.map((m) => ({
                id: m.id,
                senderId: m.sender_id,
                body: m.body,
                isRead: m.is_read,
                createdAt: m.created_at,
              }))
              setMessages(mapped)

              const unread = mapped.filter(
                (m) => !m.isRead && m.senderId !== userId
              ).length
              setUnreadCount(unread)
            }
          }
        } catch {
          // ignore
        } finally {
          if (!ignore) setIsLoadingMessages(false)
        }
      })()
    }
    return () => {
      ignore = true
    }
  }, [userId])

  // 3. Mark read when chat window is open
  const handleOpenChat = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next && unreadCount > 0) {
        setUnreadCount(0)
        void markSupportConversationReadAction()
      }
      return next
    })
    setIsMinimized(false)
  }

  // 4. Scroll to bottom smoothly on message update
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  // 5. Supabase Realtime Subscription for incoming messages
  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`live-chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as {
            id: string
            conversation_id: string
            sender_id: string
            body: string
            is_read: boolean
            created_at: string
          }

          if (!newMsg) return

          const incoming: LiveMessage = {
            id: newMsg.id,
            senderId: newMsg.sender_id,
            body: newMsg.body,
            isRead: newMsg.is_read,
            createdAt: newMsg.created_at,
          }

          setMessages((prev) => {
            // Avoid duplicate if already optimistically added
            if (prev.some((m) => m.id === incoming.id)) return prev
            // Replace matching pending message
            const pendingIndex = prev.findIndex(
              (m) => m.pending && m.body === incoming.body && m.senderId === incoming.senderId
            )
            if (pendingIndex !== -1) {
              const copy = [...prev]
              copy[pendingIndex] = incoming
              return copy
            }
            return [...prev, incoming]
          })

          // Handle incoming admin message
          if (incoming.senderId !== userId) {
            playNotificationSound()

            if (!isOpen || isMinimized) {
              setUnreadCount((c) => c + 1)
              toast.info('Pesan baru dari Admin Warungpedia', incoming.body)
            } else {
              void markSupportConversationReadAction()
            }
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, userId, isOpen, isMinimized])

  // 6. Handle send message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim()
    if (!text || isSending || !userId) return

    const tempId = `temp-${crypto.randomUUID()}`
    const optimisticMessage: LiveMessage = {
      id: tempId,
      senderId: userId,
      body: text,
      isRead: false,
      createdAt: new Date().toISOString(),
      pending: true,
    }

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMessage])
    setInputText('')

    startSendTransition(async () => {
      const fd = new FormData()
      fd.set('body', text)
      const res = await sendSupportMessageAction(undefined, fd)

      if (!res.success) {
        toast.error('Gagal mengirim pesan.', res.message || 'Coba lagi beberapa saat.')
        // Rollback optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ─── CHAT WINDOW ───────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`mb-4 w-[92vw] max-w-[380px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl transition-all duration-300 ease-out dark:border-neutral-800 dark:bg-neutral-900 ${
            isMinimized
              ? 'h-14'
              : 'h-[520px] max-h-[82vh] flex flex-col'
          }`}
          role="dialog"
          aria-label="Live Chat Dukungan Pelanggan"
        >
          {/* Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 px-4 text-white dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-2 ring-white/20">
                <Headphones className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-brand-700 bg-emerald-400" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <span>Bantuan Warungpedia</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                </div>
                <p className="text-[11px] text-brand-100 font-medium flex items-center gap-1 mt-0.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Admin Siap Melayani
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                title={isMinimized ? 'Perbesar' : 'Perkecil'}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                title="Tutup chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Body / Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/60 dark:bg-neutral-950/60 text-xs">
                {/* Intro card */}
                <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-neutral-800 dark:border-brand-900/30 dark:bg-brand-950/30 dark:text-neutral-200">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-brand-900 dark:text-brand-300 text-xs">
                        Halo! Selamat datang di Live Chat Warungpedia
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Ada yang bisa kami bantu seputar pesanan, pengiriman, atau toko Anda? Kirim pesan Anda di bawah!
                      </p>
                    </div>
                  </div>
                </div>

                {!userId && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-center dark:border-amber-900/30 dark:bg-amber-950/30">
                    <LogIn className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-400 mb-1.5" />
                    <p className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                      Silakan Masuk Terlebih Dahulu
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                      Masuk ke akun Anda untuk memulai percakapan langsung dengan Admin.
                    </p>
                    <Link
                      href="/auth/login"
                      className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                    >
                      Masuk ke Akun
                    </Link>
                  </div>
                )}

                {userId && isLoadingMessages && (
                  <div className="flex items-center justify-center py-6 text-neutral-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Memuat riwayat chat...</span>
                  </div>
                )}

                {userId && !isLoadingMessages && messages.length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
                      Pilih pertanyaan cepat atau ketik pesan Anda:
                    </p>
                    <div className="flex flex-col gap-1.5 text-left">
                      {QUICK_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="rounded-lg border border-neutral-200 bg-white p-2 text-[11px] text-neutral-700 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-brand-600 dark:hover:bg-neutral-800"
                        >
                          💬 {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message items */}
                {messages.map((msg) => {
                  const isMine = msg.senderId === userId
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm text-[12px] leading-relaxed break-words ${
                          isMine
                            ? 'bg-brand-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/70 dark:border-neutral-700/70 rounded-bl-xs'
                        } ${msg.pending ? 'opacity-70' : ''}`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                            isMine ? 'text-brand-100' : 'text-neutral-400'
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            <CheckCheck
                              className={`h-3 w-3 ${
                                msg.pending
                                  ? 'text-brand-300'
                                  : msg.isRead
                                  ? 'text-emerald-200'
                                  : 'text-brand-200'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer / Input */}
              {userId ? (
                <div className="border-t border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Ketik pesan... (Enter untuk kirim)"
                      className="max-h-24 min-h-[38px] flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-brand-500"
                    />
                    <button
                      type="button"
                      disabled={!inputText.trim() || isSending}
                      onClick={() => handleSendMessage()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Kirim pesan"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 ml-0.5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-neutral-400">
                    <span>Shift + Enter untuk baris baru</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Tersambung
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* ─── FLOATING LAUNCHER BALLOON (Facebook-style) ─────────── */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleOpenChat}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-brand-500/30 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-500/30"
          aria-label={isOpen ? 'Tutup Live Chat' : 'Buka Live Chat dengan Admin'}
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-200 rotate-0 hover:rotate-90" />
          ) : (
            <MessageCircle className="h-7 w-7 transition-transform duration-200" />
          )}

          {/* Pulse effect */}
          {!isOpen && (
            <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-brand-500 opacity-20 duration-1000" />
          )}

          {/* Unread badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white dark:ring-neutral-900 animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Hover Pill Tooltip */}
        {!isOpen && (
          <div className="pointer-events-none absolute bottom-3 right-16 hidden opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:block group-hover:opacity-100 sm:block">
            <div className="whitespace-nowrap rounded-xl bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-neutral-800">
              💬 Chat dengan Admin Warungpedia
              <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-4 border-transparent border-l-neutral-900 dark:border-l-neutral-800" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
