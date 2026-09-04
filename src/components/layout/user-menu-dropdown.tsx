'use client'

import Link from 'next/link'
import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import {
  User,
  MapPin,
  ShoppingCart,
  Package,
  Bell,
  MessageSquare,
  Heart,
  Store,
  ShieldAlert,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import type { AuthUser } from '@/lib/auth/dal'

interface UserMenuDropdownProps {
  user: AuthUser
  isSeller: boolean
  isAdmin: boolean
  labels: {
    myProfile: string
    myAddresses: string
    cart: string
    orders: string
    notifications: string
    chat: string
    wishlist: string
    following: string
    sellerDashboard: string
    adminDashboard: string
    signOut: string
  }
  signOutAction: () => Promise<void>
}

export function UserMenuDropdown({
  user,
  isSeller,
  isAdmin,
  labels,
  signOutAction,
}: UserMenuDropdownProps) {
  const [open, setOpen] = React.useState(false)

  const displayName = user.fullName.trim() || user.email || 'Warungpedia'
  const initial = (displayName[0] ?? 'W').toUpperCase()

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="flex cursor-pointer items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-neutral-800"
          aria-label={labels.myProfile}
        >
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 font-display text-sm font-bold text-white shadow-xs"
          >
            {initial}
          </span>
          <span className="hidden max-w-28 truncate text-sm font-semibold text-neutral-800 lg:inline dark:text-neutral-100">
            {displayName}
          </span>
          <ChevronDown className="hidden size-3.5 text-neutral-400 lg:inline" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-2xl border border-neutral-200/90 bg-white p-2 shadow-card outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 dark:border-neutral-800 dark:bg-neutral-900"
        >
          {/* Header user info */}
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5 dark:bg-neutral-800/60">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-100 font-display text-base font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-50">
                {displayName}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>

          {/* Links */}
          <div className="mt-1 space-y-0.5 border-t border-neutral-100 pt-1 dark:border-neutral-800">
            <Link
              href="/account/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <User className="size-4 text-neutral-400" />
              {labels.myProfile}
            </Link>
            <Link
              href="/account/addresses"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <MapPin className="size-4 text-neutral-400" />
              {labels.myAddresses}
            </Link>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <ShoppingCart className="size-4 text-neutral-400" />
              {labels.cart}
            </Link>
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Package className="size-4 text-neutral-400" />
              {labels.orders}
            </Link>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Bell className="size-4 text-neutral-400" />
              {labels.notifications}
            </Link>
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <MessageSquare className="size-4 text-neutral-400" />
              {labels.chat}
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Heart className="size-4 text-neutral-400" />
              {labels.wishlist}
            </Link>

            {/* Special roles */}
            {isSeller ? (
              <Link
                href="/seller"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-brand-50/70 px-3 py-2 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-200 dark:hover:bg-brand-900/60"
              >
                <Store className="size-4 text-brand-600 dark:text-brand-400" />
                {labels.sellerDashboard}
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-amber-50/70 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/60"
              >
                <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
                {labels.adminDashboard}
              </Link>
            ) : null}
          </div>

          {/* Sign out */}
          <div className="mt-1 border-t border-neutral-100 pt-1 dark:border-neutral-800">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/40"
              >
                <LogOut className="size-4 text-danger-500" />
                {labels.signOut}
              </button>
            </form>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
