import { describe, it, expect } from 'vitest'
import {
  notificationPrefsSchema,
  markNotificationReadSchema,
  sendMessageSchema,
  openConversationSchema,
} from '../communication'

const UUID = '00000000-0000-4000-8000-000000000001'

describe('notificationPrefs schema', () => {
  it('accepts full prefs with per-type toggles', () => {
    const r = notificationPrefsSchema.safeParse({
      email: true,
      push: false,
      types: { ORDER_UPDATE: true, CHAT: false },
    })
    expect(r.success).toBe(true)
    expect(r.success && r.data.email).toBe(true)
  })

  it('defaults email and push to on', () => {
    const r = notificationPrefsSchema.safeParse({ types: {} })
    expect(r.success).toBe(true)
    expect(r.success && r.data.email).toBe(true)
    expect(r.success && r.data.push).toBe(true)
  })
})

describe('markNotificationRead schema', () => {
  it('accepts a valid notification id', () => {
    const r = markNotificationReadSchema.safeParse({
      notificationId: UUID,
    })
    expect(r.success).toBe(true)
  })

  it('rejects a non-uuid id', () => {
    const r = markNotificationReadSchema.safeParse({
      notificationId: 'x',
    })
    expect(r.success).toBe(false)
  })
})

describe('sendMessage schema', () => {
  it('accepts a non-empty message', () => {
    const r = sendMessageSchema.safeParse({
      conversationId: UUID,
      body: 'Halo, kapan pesanan dikirim?',
    })
    expect(r.success).toBe(true)
  })

  it('rejects an empty or whitespace-only message', () => {
    expect(
      sendMessageSchema.safeParse({ conversationId: UUID, body: '' }).success
    ).toBe(false)
    expect(
      sendMessageSchema.safeParse({ conversationId: UUID, body: '   ' }).success
    ).toBe(false)
  })

  it('rejects an invalid conversation id', () => {
    const r = sendMessageSchema.safeParse({
      conversationId: 'none',
      body: 'hai',
    })
    expect(r.success).toBe(false)
  })
})

describe('openConversation schema', () => {
  it('accepts a valid order id', () => {
    const r = openConversationSchema.safeParse({ orderId: UUID })
    expect(r.success).toBe(true)
  })

  it('rejects an invalid order id', () => {
    const r = openConversationSchema.safeParse({ orderId: '' })
    expect(r.success).toBe(false)
  })
})