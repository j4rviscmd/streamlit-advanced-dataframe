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
 * Streamlitから受け取るProps
 * 各フェーズで段階的に拡張される
 */
export interface StreamlitProps {
  /** テーブルに表示するデータ（行の配列） */
  data: RowData[]
  /** カラム設定の配列 */
  columns: ColumnConfig[]
  /** テーブルの高さ（px）、未指定時は自動調整 */
  height?: number
  /** テーブルを親要素の幅いっぱいに表示するか（デフォルト: false） */
  fullWidth?: boolean
  /** 行選択機能を有効化するか（デフォルト: false）Phase 2で追加 */
  enableRowSelection?: boolean

  // 以下、Phase 3以降で追加予定
  // enableFilters?: boolean
  // enableGlobalSearch?: boolean
  // columnGroups?: ColumnGroup[]
  // expandable?: boolean
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

/**
 * セルの位置情報
 * rowIndexとcolumnIdでセルを一意に特定
 */
export interface CellPosition {
  /** 行インデックス（0始まり） */
  rowIndex: number
  /** カラムID */
  columnId: string
}

/**
 * セル選択範囲
 * 開始セルと終了セルで矩形範囲を定義
 */
export interface CellSelection {
  /** 選択開始セル */
  start: CellPosition
  /** 選択終了セル */
  end: CellPosition
}
