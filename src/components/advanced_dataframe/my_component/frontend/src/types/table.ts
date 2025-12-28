/**
 * 型定義ファイル - Phase 1
 * TanStack Tableとの連携、Streamlitからのpropsを定義
 */

/**
 * テーブルの行データ型
 * Phase 1では任意のキー・値を持つオブジェクト
 */
export type RowData = Record<string, unknown>

/**
 * カラム定義の基本型
 * Phase 1では最小限の定義
 */
export interface ColumnConfig {
  /** カラムID（DataFrameのカラム名） */
  id: string
  /** 表示用ヘッダテキスト */
  header: string
  /** ソート可否（デフォルト: true） */
  enableSorting?: boolean
  /** リサイズ可否（デフォルト: true） */
  enableResizing?: boolean
}

/**
 * Streamlitから受け取るProps（Phase 1版）
 * 各フェーズで段階的に拡張される
 */
export interface StreamlitProps {
  /** テーブルに表示するデータ（行の配列） */
  data: RowData[]
  /** カラム設定の配列 */
  columns: ColumnConfig[]
  /** テーブルの高さ（px）、未指定時は自動調整 */
  height?: number

  // 以下、Phase 2以降で追加予定
  // enableFilters?: boolean
  // enableGlobalSearch?: boolean
  // enableRowSelection?: boolean
  // columnGroups?: ColumnGroup[]
  // expandable?: boolean
  // pageSize?: number
  // enableExport?: boolean
}

/**
 * Streamlitのテーマ情報
 * renderData.themeから取得
 */
export interface StreamlitTheme {
  /** テーマのベース（'light' | 'dark'） */
  base: 'light' | 'dark'
  /** プライマリカラー */
  primaryColor: string
  /** 背景色 */
  backgroundColor: string
  /** セカンダリ背景色 */
  secondaryBackgroundColor: string
  /** テキスト色 */
  textColor: string
  /** フォントファミリー */
  font: string
}
