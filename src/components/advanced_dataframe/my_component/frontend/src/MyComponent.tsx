import { AdvancedDataFrame } from '@/components/AdvancedDataFrame'
import { StreamlitProps } from '@/types/table'
import { useEffect } from 'react'
import { Streamlit } from 'streamlit-component-lib'
import { useRenderData } from 'streamlit-component-lib-react-hooks'

/**
 * MyComponent - Streamlitとの連携エントリーポイント
 * Pythonから渡されたpropsをAdvancedDataFrameに渡す
 */
function MyComponent() {
  const renderData = useRenderData()

  // Pythonから渡された引数を取得
  const data = renderData.args['data'] || []
  const columns = renderData.args['columns'] || []
  const height = renderData.args['height']
  const fullWidth = renderData.args['full_width']

  // StreamlitPropsに変換
  const props: StreamlitProps = {
    data,
    columns,
    height,
    fullWidth,
  }

  // コンポーネントのマウント時にStreamlitにフレームの高さを通知
  useEffect(() => {
    Streamlit.setFrameHeight()
  }, [])

  return <AdvancedDataFrame {...props} />
}

export default MyComponent
