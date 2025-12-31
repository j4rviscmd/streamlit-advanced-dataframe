/**
 * テーブルツールバーコンポーネント
 *
 * st.dataframeの標準UIを踏襲した、テーブル右上に表示されるツールバー。
 * ホバー時に表示され、グローバル検索などの機能を提供します。
 */

import { useStreamlitTheme } from '@/hooks/useStreamlitTheme'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface TableToolbarProps {
  /** 検索クエリ */
  searchQuery: string
  /** 検索クエリの変更ハンドラ */
  onSearchChange: (query: string) => void
  /** 現在の一致インデックス（1始まり、0は一致なし） */
  currentMatchIndex: number
  /** 総一致件数 */
  totalMatches: number
  /** 次の一致箇所へジャンプ */
  onNextMatch: () => void
  /** 前の一致箇所へジャンプ */
  onPrevMatch: () => void
  /** ツールバーが表示されているかどうか（親のhover状態） */
  isVisible: boolean
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  currentMatchIndex,
  totalMatches,
  onNextMatch,
  onPrevMatch,
  isVisible,
}: TableToolbarProps) {
  const { theme, isDark, textColor } = useStreamlitTheme()

  // 検索窓の表示状態
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 検索窓を開く
  const handleSearchIconClick = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  // 検索窓を閉じる
  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false)
    onSearchChange('')
  }, [onSearchChange])

  // 検索窓が開いたらフォーカス
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Escapeキーで検索窓を閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        handleSearchClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, handleSearchClose])

  // 検索入力欄でのEnterキー押下時に次の一致箇所へジャンプ
  const handleSearchInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && totalMatches > 0) {
        onNextMatch()
      }
    },
    [totalMatches, onNextMatch],
  )

  return (
    <div
      className={cn(
        'fixed top-2 left-2 z-30 flex items-center gap-1 transition-opacity duration-200',
        isVisible || isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {/* 検索窓 */}
      {isSearchOpen ? (
        <div
          className="flex items-center gap-1 rounded-md px-3 py-1.5 shadow-lg"
          style={{
            backgroundColor: isDark ? '#262730' : '#FFFFFF',
            border: `1px solid ${isDark ? 'rgba(250, 250, 250, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          {/* 検索入力欄 */}
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchInputKeyDown}
            placeholder="Type to search"
            className="w-48 bg-transparent text-sm outline-none"
            style={{
              color: textColor,
              fontFamily: theme.font,
            }}
          />

          {/* 一致件数表示 */}
          {searchQuery && totalMatches > 0 && (
            <span
              className="text-xs whitespace-nowrap"
              style={{
                color: isDark ? '#888' : '#666',
              }}
            >
              {currentMatchIndex} of {totalMatches} results
            </span>
          )}

          {/* 上下ナビゲーションボタン */}
          {searchQuery && totalMatches > 0 && (
            <>
              <button
                onClick={onPrevMatch}
                className="p-1 rounded transition-colors"
                title="Previous match"
                style={{
                  color: isDark ? '#E0E0E0' : '#333',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={onNextMatch}
                className="p-1 rounded transition-colors"
                title="Next match"
                style={{
                  color: isDark ? '#E0E0E0' : '#333',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <ChevronDown size={16} />
              </button>
            </>
          )}

          {/* 閉じるボタン */}
          <button
            onClick={handleSearchClose}
            className="p-1 rounded transition-colors"
            title="Close search"
            style={{
              color: isDark ? '#E0E0E0' : '#333',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        // 検索アイコンボタン
        <button
          onClick={handleSearchIconClick}
          className="p-2 rounded-md transition-colors"
          title="Search"
          style={{
            backgroundColor: isDark ? '#262730' : '#FFFFFF',
            color: textColor,
            border: `1px solid ${isDark ? 'rgba(250, 250, 250, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <Search size={18} />
        </button>
      )}
    </div>
  )
}
