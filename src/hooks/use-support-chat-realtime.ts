import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to subscribe to Supabase Realtime changes for support messages.
 */
export function useSupportChatRealtime(
  conversationId: string | null,
  onNewMessage: (payload: { new: { id: string; sender_id: string; body: string; created_at: string } }) => void
) {
  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    const realtimeChannel = supabase
      .channel(`support_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onNewMessage
      )
      .subscribe()

    return () => {
      void realtimeChannel.unsubscribe()
    }
  }, [conversationId, onNewMessage])
}
