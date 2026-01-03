import { Component, ErrorInfo, ReactNode } from 'react'

/**
 * ErrorBoundaryのProps型
 */
interface ErrorBoundaryProps {
  children: ReactNode
  /** フォールバックUIのカスタマイズ（オプション） */
  fallback?: ReactNode
}

/**
 * ErrorBoundaryのState型
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary - ReactコンポーネントのエラーをキャッチしてフォールバックUIを表示
 *
 * 使用例:
 * ```tsx
 * <ErrorBoundary>
 *   <AdvancedDataFrame {...props} />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * エラー発生時にstateを更新
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  /**
   * propsが変更されたらエラー状態をリセット（Streamlit再実行時に回復可能にする）
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      })
    }
  }

  /**
   * エラー情報をコンソールに出力
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // コンソールにエラー詳細を出力（デバッグ用）
    console.error('[AdvancedDataFrame] コンポーネントエラー:', error)
    console.error('[AdvancedDataFrame] コンポーネントスタック:', errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが指定されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback
      }

      // デフォルトのフォールバックUI（Streamlit風）
      return <ErrorFallbackUI error={this.state.error} />
    }

    return this.props.children
  }
}

/**
 * ErrorFallbackUIのProps型
 */
interface ErrorFallbackUIProps {
  error: Error | null
}

/**
 * ErrorFallbackUI - エラー発生時に表示するフォールバックUI
 * Streamlitのエラー表示に近いデザイン
 */
function ErrorFallbackUI({ error }: ErrorFallbackUIProps) {
  // ダークモード判定（documentのclassから取得）
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '6px',
        backgroundColor: isDark
          ? 'rgba(239, 68, 68, 0.15)'
          : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '18px' }}>&#9888;</span>
        <span
          style={{
            fontWeight: 600,
            fontSize: '14px',
            color: isDark ? '#fca5a5' : '#dc2626',
          }}
        >
          コンポーネントでエラーが発生しました
        </span>
      </div>
      {error && (
        <div
          style={{
            fontSize: '12px',
            color: isDark ? '#d1d5db' : '#4b5563',
            backgroundColor: isDark
              ? 'rgba(0, 0, 0, 0.2)'
              : 'rgba(0, 0, 0, 0.05)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            overflowX: 'auto',
          }}
        >
          <div style={{ marginBottom: '4px', fontWeight: 500 }}>
            {error.name}: {error.message}
          </div>
        </div>
      )}
      <div
        style={{
          marginTop: '8px',
          fontSize: '11px',
          color: isDark ? '#9ca3af' : '#6b7280',
        }}
      >
        詳細はブラウザのコンソールを確認してください
      </div>
    </div>
  )
}

export default ErrorBoundary
