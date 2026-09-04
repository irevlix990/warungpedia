'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, TrendingUp } from 'lucide-react'
import { cn } from '@/utils/cn'

const POPULAR_SUGGESTIONS = [
  'Handphone',
  'Laptop',
  'Sepatu Sneakers',
  'Skincare',
  'Baju Batik',
  'Vitamin C',
  'Headphone',
  'Jam Tangan',
]

interface SearchFormProps {
  placeholder: string
}

/**
 * Site-wide search box with debounced suggestions and popular terms.
 * Navigates to the search route with the query.
 */
export function SearchForm({ placeholder }: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const isTyping = query.trim().length > 0
  const filteredSuggestions = isTyping
    ? POPULAR_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : POPULAR_SUGGESTIONS.slice(0, 5)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSubmit = useCallback(
    (term?: string) => {
      const searchTerm = (term ?? query).trim()
      if (!searchTerm) return
      setShowSuggestions(false)
      inputRef.current?.blur()
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
      setQuery('')
    },
    [query, router]
  )

  function handleSelectSuggestion(suggestion: string) {
    handleSubmit(suggestion)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        role="search"
        aria-label={placeholder}
      >
        <div
          className={cn(
            'relative flex items-center rounded-xl border transition-all duration-200',
            focused
              ? 'border-brand-500 bg-white shadow-xs ring-2 ring-brand-500/20 dark:bg-neutral-900'
              : 'border-neutral-300 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600'
          )}
        >
          <Search
            className={cn(
              'ml-3 size-4 shrink-0 transition-colors',
              focused ? 'text-brand-500' : 'text-neutral-400'
            )}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              setFocused(true)
              setShowSuggestions(true)
            }}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className="h-10 w-full bg-transparent px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
            autoComplete="off"
          />
          {isTyping && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="mr-2 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            >
              <X className="size-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="mr-1.5 hidden rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 sm:block"
          >
            Cari
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card dark:border-neutral-800 dark:bg-neutral-900">
          <p className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            <TrendingUp className="size-3" />
            {isTyping ? 'Saran' : 'Pencarian Populer'}
          </p>
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800/80"
            >
              <Search className="size-3.5 text-neutral-300 dark:text-neutral-600" />
              <span className="flex-1 truncate">{suggestion}</span>
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                ↵
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}