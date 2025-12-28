/**
 * Streamlitテーマ取得hook
 * renderData.themeからテーマ情報を取得し、コンポーネントで使用可能な形式で返す
 */

import { useRenderData } from 'streamlit-component-lib-react-hooks'
import { StreamlitTheme } from '@/types/table'

/**
 * Streamlitのテーマ情報と便利な派生値を返すhook
 */
export function useStreamlitTheme() {
  const renderData = useRenderData()
  const theme = renderData.theme as StreamlitTheme | undefined

  // テーマ情報がない場合のデフォルト値（ライトテーマ）
  const defaultTheme: StreamlitTheme = {
    base: 'light',
    primaryColor: '#FF4B4B',
    backgroundColor: '#FFFFFF',
    secondaryBackgroundColor: '#F0F2F6',
    textColor: '#31333F',
    font: 'sans-serif',
  }

  const currentTheme = theme || defaultTheme

  return {
    /** テーマオブジェクト全体 */
    theme: currentTheme,
    /** ダークモードかどうか */
    isDark: currentTheme.base === 'dark',
    /** プライマリカラー */
    primaryColor: currentTheme.primaryColor,
    /** 背景色 */
    backgroundColor: currentTheme.backgroundColor,
    /** セカンダリ背景色（テーブルのヘッダなどに使用） */
    secondaryBackgroundColor: currentTheme.secondaryBackgroundColor,
    /** テキスト色 */
    textColor: currentTheme.textColor,
    /** フォント */
    font: currentTheme.font,
  }
}
