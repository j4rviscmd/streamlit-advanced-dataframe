<!-- markdownlint-disable -->
# CLAUDE.md - streamlit-advanced-dataframe プロジェクト固有ルール

このファイルは `streamlit-advanced-dataframe` プロジェクトの開発ルールを定義します。
グローバルの `~/.claude/CLAUDE.md` と併せて適用されます。

---

## プロジェクト概要

**目的**: Streamlitの標準`st.dataframe`を拡張した高機能カスタムコンポーネント`advanced_dataframe`の開発

**技術スタック**:
- **バックエンド**: Python 3.12+, Streamlit 1.52+
- **フロントエンド**: React 19, TypeScript 5.8+, TanStack Table v8
- **スタイリング**: Tailwind CSS v4
- **ビルドツール**: Vite 6

**リポジトリ**: https://github.com/j4rviscmd/streamlit-advanced-dataframe

---

## 開発プロセス

### フェーズ駆動開発

このプロジェクトは5つのフェーズに分けて段階的に開発します。

#### **必須ルール**:
1. **1フェーズ = 1 featureブランチ**
   - ブランチ命名: `feature/phase{N}-{description}`
   - 例: `feature/phase1-basic-ui`, `feature/phase2-filtering`

2. **各フェーズ完了時にユーザー動作確認必須**
   - 実装完了後、必ずデモアプリ（`src/main.py`）を更新
   - ユーザーに動作確認を依頼し、承認を得てから次フェーズへ進む
   - 承認なしで次フェーズに進むことは禁止

3. **フェーズごとにPython API（props）を拡張**
   - 各フェーズで `my_component/__init__.py` の引数を追加
   - TypeScript型定義（`frontend/src/types/table.ts`）も同期更新
   - 後方互換性を維持（既存propsのデフォルト値設定）

#### フェーズ一覧

| フェーズ | 内容 | 主要ファイル |
|---------|------|------------|
| Phase 1 | 基本UI・テーブル基盤<br>（TanStack Table統合、ソート、リサイズ） | `AdvancedDataFrame.tsx`, `useStreamlitTheme.ts` |
| Phase 2 | データ操作・検索<br>（フィルタ、グローバル検索、行選択） | `ColumnFilter.tsx`, `TableToolbar.tsx` |
| Phase 3 | 表示カスタマイズ<br>（ヘッダ結合、カラム表示/非表示、並び替え） | `ColumnHeader.tsx`, カラムグループ対応 |
| Phase 4 | 高度なデータ表示<br>（行展開、仮想スクロール） | `ExpandableRow.tsx`, 仮想化対応 |
| Phase 5 | 付加機能<br>（エクスポート、集計、条件付き書式） | `export.ts`, `AggregationRow.tsx` |

---

## コーディング規約

### Python側（`my_component/__init__.py`）

```python
def advanced_dataframe(
    data: pd.DataFrame,
    # 常にデフォルト値を設定（後方互換性）
    height: int = 600,
    key: Optional[str] = None,
    # 新しいフェーズで追加するpropsもデフォルト値必須
    enable_filters: bool = False,  # Phase 2で追加
    column_groups: Optional[List[Dict]] = None,  # Phase 3で追加
    **kwargs
) -> Any:
    """
    高機能DataFrameコンポーネント。

    Args:
        data: 表示するDataFrame
        height: テーブルの高さ（px）
        key: Streamlitコンポーネントのキー
        enable_filters: カラムフィルタの有効化（Phase 2+）
        column_groups: ヘッダグループ設定（Phase 3+）

    Returns:
        コンポーネントの戻り値（選択行など）
    """
    # データをJSON形式に変換（Reactで受け取りやすい形式）
    data_json = data.to_dict('records')
    columns_json = [{"id": col, "header": col} for col in data.columns]

    return _component_func(
        data=data_json,
        columns=columns_json,
        height=height,
        enableFilters=enable_filters,  # camelCaseに変換
        columnGroups=column_groups,
        key=key,
        default=None
    )
```

### TypeScript側（`frontend/src/types/table.ts`）

```typescript
/**
 * Streamlitから受け取るProps型定義
 * 各フェーズで拡張される
 */
export interface StreamlitProps {
  // Phase 1
  data: RowData[]
  columns: ColumnDef<RowData>[]
  height?: number

  // Phase 2
  enableFilters?: boolean
  enableGlobalSearch?: boolean
  enableRowSelection?: boolean

  // Phase 3
  columnGroups?: ColumnGroup[]
  enableColumnVisibility?: boolean

  // Phase 4
  expandable?: boolean
  subRowsKey?: string
  pageSize?: number

  // Phase 5
  enableExport?: boolean
  aggregationConfig?: Record<string, AggregationType>
}
```

### React Component構造

```
frontend/src/
├── MyComponent.tsx              # エントリーポイント（Streamlit連携）
├── components/
│   ├── AdvancedDataFrame.tsx    # メインテーブルコンポーネント
│   ├── ColumnFilter.tsx         # フィルタUI
│   ├── ColumnHeader.tsx         # カスタムヘッダ
│   ├── ExpandableRow.tsx        # 展開可能行
│   └── TableToolbar.tsx         # ツールバー（検索、エクスポートなど）
├── hooks/
│   ├── useTableState.ts         # テーブル状態管理
│   └── useStreamlitTheme.ts     # Streamlitテーマ取得
├── types/
│   └── table.ts                 # 型定義（StreamlitProps, RowData, etc.）
└── styles/
    └── streamlit-table.css      # 標準dataframeスタイル再現
```

---

## UI/UX要件

### 標準st.dataframeとの統一性

**絶対厳守**:
- Streamlitの標準`st.dataframe`のUIとアニメーション感を完全再現
- テーマ（light/dark）に自動追従
- フォント、色、余白、ボーダーを標準に合わせる

### スタイル確認方法

1. Streamlitの標準`st.dataframe`を表示
2. ブラウザ開発者ツールでスタイルを確認
3. 取得したCSSを`streamlit-table.css`に適用

```typescript
// useStreamlitTheme.ts - テーマ取得例
export function useStreamlitTheme() {
  const renderData = useRenderData()
  const theme = renderData.theme

  return {
    isDark: theme?.base === 'dark',
    primaryColor: theme?.primaryColor || '#FF4B4B',
    backgroundColor: theme?.backgroundColor || '#FFFFFF',
    secondaryBackgroundColor: theme?.secondaryBackgroundColor || '#F0F2F6',
    textColor: theme?.textColor || '#31333F',
    font: theme?.font || 'sans-serif',
  }
}
```

---

## テスト・デバッグ

### デモアプリ（`src/main.py`）の管理

各フェーズで以下を追加:

```python
import streamlit as st
import pandas as pd
from components.advanced_dataframe.my_component import my_component as advanced_dataframe

st.title("Advanced DataFrame Demo")

# サンプルデータ
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 30, 35],
    "city": ["Tokyo", "Osaka", "Kyoto"]
})

# Phase 1: 基本表示
st.header("Phase 1: 基本表示")
advanced_dataframe(data=df, height=400, key="phase1")

# Phase 2: フィルタ（Phase 2実装後に追加）
# st.header("Phase 2: フィルタ機能")
# advanced_dataframe(data=df, enable_filters=True, key="phase2")

# ... 以下各フェーズで追加
```

### 動作確認手順

```bash
# フロントエンド開発サーバー起動
cd src/components/advanced_dataframe/my_component/frontend
npm run dev

# 別ターミナルでStreamlitアプリ起動
cd /Users/maedatakurou/work/dev/streamlit-advanced-dataframe
streamlit run src/main.py
```

---

## TanStack Table使用ガイドライン

### 必須情報源

- **公式ドキュメント**: https://tanstack.com/table/latest/docs/framework/react
- **Context7で最新情報確認**: 実装前に必ずContext7 MCPで最新APIを確認すること
  - ライブラリID: `/websites/tanstack_table` または `/tanstack/table`

### 推奨パターン

```typescript
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

function AdvancedDataFrame({ data, columns }: Props) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // フェーズごとに追加
    // getSortedRowModel: getSortedRowModel(),        // Phase 1
    // getFilteredRowModel: getFilteredRowModel(),    // Phase 2
    // getExpandedRowModel: getExpandedRowModel(),    // Phase 4
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## パフォーマンス要件

### ベンチマーク目標

- **10万行のデータで60fps維持**（Phase 4で仮想スクロール実装後）
- 初回レンダリング: 1秒以内
- ソート/フィルタ操作: 200ms以内

### 最適化方針

1. **Phase 4まで**: 通常のレンダリング（~1000行まで快適）
2. **Phase 4以降**: `@tanstack/react-virtual`で仮想化対応

---

## ブランチ戦略

### mainブランチ保護

- **mainブランチへの直接コミット禁止**（グローバルCLAUDE.mdのルールを適用）
- すべての変更はfeatureブランチから

### フェーズごとのブランチ運用

```bash
# Phase 1開始
git checkout -b feature/phase1-basic-ui

# 実装・コミット
git add .
git commit -m "feat(phase1): TanStack Table統合と基本表示実装"

# PR作成・レビュー・マージ後
git checkout main
git pull origin main

# Phase 2開始
git checkout -b feature/phase2-filtering
```

---

## 禁止事項

1. **フェーズを飛び越えた実装禁止**
   - Phase 1が完了していないのにPhase 2の機能を実装しない
   - 必ずユーザーの動作確認と承認を経てから次へ進む

2. **標準st.dataframeのUIを独自に変更禁止**
   - 見た目は標準に完全準拠
   - カスタマイズは機能のみ

3. **後方互換性を破壊する変更禁止**
   - 既存のpropsのデフォルト値を変更しない
   - 型定義の破壊的変更は避ける

4. **Context7を使わずにライブラリAPIを推測禁止**
   - TanStack Tableの機能実装前に必ずContext7で最新ドキュメント確認

---

## リリース準備（Phase 5完了後）

### PyPI公開準備

1. `pyproject.toml`のメタデータ更新
2. `README.md`に使用例とドキュメント記載
3. `frontend/dist`ビルド確認
4. バージョニング（semantic versioning: `0.1.0` → `1.0.0`）

### ドキュメント

- README.mdに全機能の使用例
- APIリファレンス（docstring）
- GIFでデモ動画

---

## 質問・不明点がある場合

1. **TanStack Table関連**: Context7 MCP (`/websites/tanstack_table`)
2. **Streamlit Custom Components**: https://docs.streamlit.io/develop/concepts/custom-components
3. **プロジェクト方針**: このCLAUDE.mdを参照

---

**最終更新**: 2025-12-28
**プロジェクトステータス**: Phase 1準備中
