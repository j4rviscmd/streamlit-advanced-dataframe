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

  // フレーム高さを確実に設定するヘルパー関数
  // requestAnimationFrameを2回使用してDOM描画完了を待つ
  const setFrameHeightSafely = () => {
    if (!isMountedRef.current) return
    // 1回目のrAF: ブラウザの次の描画フレームを待つ
    requestAnimationFrame(() => {
      if (!isMountedRef.current) return
      // 2回目のrAF: レイアウト計算が完了するのを待つ
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          Streamlit.setFrameHeight()
        }
      })
    })
  }

  // 初回マウント時にフレーム高さを設定
  useEffect(() => {
    setFrameHeightSafely()
  }, [])

  // データやpropsが変わった時にStreamlitにフレームの高さを通知
  useEffect(() => {
    setFrameHeightSafely()
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
    <ErrorBoundary>
      <AdvancedDataFrame {...props} />
    </ErrorBoundary>
  )
}

export default MyComponent
