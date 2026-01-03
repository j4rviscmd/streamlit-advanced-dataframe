import { AdvancedDataFrame } from '@/components/AdvancedDataFrame'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useStreamlitTheme } from '@/hooks/useStreamlitTheme'
import { StreamlitProps } from '@/types/table'
import { useEffect, useMemo, useRef } from 'react'
import { Streamlit } from 'streamlit-component-lib'
import { useRenderData } from 'streamlit-component-lib-react-hooks'

/**
 * MyComponent - Streamlitとの連携エントリーポイント
 * Pythonから渡されたpropsをAdvancedDataFrameに渡す
 */
function MyComponent() {
  const renderData = useRenderData()
  const { isDark } = useStreamlitTheme()
  // コンポーネントがマウントされているかどうかを追跡
  const isMountedRef = useRef(true)
  // コンテナ要素のref
  const containerRef = useRef<HTMLDivElement>(null)

  // Pythonから渡された引数を取得（useMemoで参照を安定化）
  const data = useMemo(
    () => renderData.args['data'] || [],
    [renderData.args],
  )
  const columns = useMemo(
    () => renderData.args['columns'] || [],
    [renderData.args],
  )
  const height = renderData.args['height']
  const useContainerWidth = renderData.args['use_container_width']
  const selectionMode = renderData.args['selection_mode']
  const showRowCount = renderData.args['show_row_count']
  const columnOrder = renderData.args['column_order']
  const headerGroups = renderData.args['header_groups']
  const expandable = renderData.args['expandable']
  const subRowsKey = renderData.args['sub_rows_key']
  const showSummary = renderData.args['show_summary']

  // StreamlitPropsに変換
  const props: StreamlitProps = {
    data,
    columns,
    height,
    useContainerWidth,
    selectionMode,
    showRowCount,
    columnOrder,
    headerGroups,
    expandable,
    subRowsKey,
    showSummary,
  }

  // マウント状態の追跡
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ResizeObserverでコンテナサイズの変更を監視し、フレーム高さを自動更新
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      if (isMountedRef.current) {
        Streamlit.setFrameHeight()
      }
    })

    observer.observe(containerRef.current)

    // 初回も明示的に高さを設定
    Streamlit.setFrameHeight()

    return () => {
      observer.disconnect()
    }
  }, [])

  // データやpropsが変わった時にStreamlitにフレームの高さを通知
  useEffect(() => {
    if (isMountedRef.current) {
      Streamlit.setFrameHeight()
    }
  }, [data, columns, height, expandable, showRowCount])

  // Streamlitテーマに応じて.darkクラスを適用（shadcn/ui用）
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div ref={containerRef}>
      <ErrorBoundary>
        <AdvancedDataFrame {...props} />
      </ErrorBoundary>
    </div>
  )
}

export default MyComponent
