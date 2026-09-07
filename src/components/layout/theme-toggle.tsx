'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative grid size-9 place-items-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
      title={resolvedTheme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      aria-label={resolvedTheme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  )
}
