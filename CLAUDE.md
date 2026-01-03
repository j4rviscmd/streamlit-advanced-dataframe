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

## 実装済み機能一覧

| カテゴリ | 機能 | 説明 |
|---------|------|------|
| **基本表示** | ソート | 単一カラムの昇順/降順ソート |
| | カラムリサイズ | ドラッグでカラム幅を調整 |
| | カラム並び替え | ドラッグ&ドロップでカラム順序変更 |
| **データ操作** | カラムフィルタ | テキスト/数値範囲/セレクト/日付フィルタ |
| | グローバル検索 | 全カラム対象の検索・ハイライト |
| | 行選択 | 単一選択/複数選択モード |
| | セル選択 | 範囲選択、クリップボードコピー対応 |
| **表示カスタマイズ** | ヘッダ結合 | カラムグループによるヘッダ結合 |
| | カラム表示/非表示 | `column_order`で制御 |
| | prefix/suffix | カラムごとに値の前後に文字列追加 |
| **高度な表示** | 行展開 | 階層データの展開・折りたたみ |
| | 仮想スクロール | 10万行でも60fps維持 |
| | 集計行 | 数値合計、Bool率の自動計算 |
| **テーマ** | ダーク/ライト | Streamlitテーマに自動追従 |

---

## Python API

```python
from streamlit_advanced_dataframe import advanced_dataframe

selected_rows = advanced_dataframe(
    data: pd.DataFrame,                    # 表示するDataFrame
    *,
    height: int = 600,                     # テーブルの高さ（px）
    use_container_width: bool = False,     # 親要素の幅いっぱいに表示
    selection_mode: Literal["single-row", "multi-row"] | None = None,
                                           # 行選択モード
    filterable_columns: list[str] | None = None,
                                           # フィルタ有効カラム
    show_row_count: bool = False,          # フィルタ時の行数表示
    column_order: list[str] | None = None, # 表示カラムと順序
    header_groups: list[dict] | None = None,
                                           # ヘッダグループ設定
    expandable: bool = False,              # 行展開機能
    sub_rows_key: str = "subRows",         # サブ行データのキー
    show_summary: bool = True,             # 集計行の表示
    column_config: dict[str, dict] | None = None,
                                           # カラムごとの表示設定（prefix/suffix）
    key: str | None = None,                # コンポーネントキー
) -> list[int]                             # 選択された行インデックス
```

### 使用例

```python
import pandas as pd
from streamlit_advanced_dataframe import advanced_dataframe

df = pd.DataFrame({
    "商品名": ["商品A", "商品B", "商品C"],
    "価格": [1000, 2500, 1800],
    "割引率": [10, 15, 5],
    "在庫あり": [True, False, True],
})

# 基本的な使い方
advanced_dataframe(data=df, height=400)

# フィルタ + 行選択 + prefix/suffix
selected = advanced_dataframe(
    data=df,
    height=400,
    selection_mode="multi-row",
    filterable_columns=["商品名", "価格", "在庫あり"],
    show_row_count=True,
    column_config={
        "価格": {"prefix": "¥"},
        "割引率": {"suffix": "%"},
    },
)

# ヘッダグループ
advanced_dataframe(
    data=df,
    header_groups=[
        {"header": "商品情報", "columns": ["商品名", "価格"]},
        {"header": "状態", "columns": ["割引率", "在庫あり"]},
    ],
)
```

---

## ディレクトリ構造

```
streamlit_advanced_dataframe/
├── __init__.py                 # Python API エントリーポイント
└── frontend/
    ├── src/
    │   ├── MyComponent.tsx     # Streamlit連携エントリーポイント
    │   ├── components/
    │   │   ├── AdvancedDataFrame.tsx  # メインテーブル
    │   │   ├── ColumnFilter.tsx       # フィルタUI
    │   │   ├── FilterStatus.tsx       # フィルタ状態表示
    │   │   ├── TableToolbar.tsx       # ツールバー（検索）
    │   │   └── ErrorBoundary.tsx      # エラーハンドリング
    │   ├── hooks/
    │   │   ├── useStreamlitTheme.ts   # テーマ取得
    │   │   └── useColumnType.ts       # カラム型判定
    │   └── types/
    │       └── table.ts               # 型定義
    └── dist/                   # ビルド成果物
```

---

## 開発環境

### 起動方法

```bash
# フロントエンド開発サーバー起動
cd streamlit_advanced_dataframe/frontend
npm run dev

# 別ターミナルでStreamlitアプリ起動
streamlit run examples/main.py
```

### ビルド

```bash
cd streamlit_advanced_dataframe/frontend
npm run build
```

---

## コーディング規約

### Python側

- 新しい引数には必ずデフォルト値を設定（後方互換性維持）
- snake_case → camelCase変換してフロントエンドに渡す
- NaN/NaTは`to_json`でnullに変換

### TypeScript側

- `ColumnConfig`インターフェースで型定義
- Streamlitテーマに追従（`useStreamlitTheme`フック使用）
- TanStack Table v8のAPIを使用

---

## UI/UX要件

### 標準st.dataframeとの統一性

- Streamlitの標準`st.dataframe`のUIを再現
- テーマ（light/dark）に自動追従
- フォント、色、余白、ボーダーを標準に合わせる

---

## エラーハンドリング

| ケース | 対応方法 |
|--------|---------|
| NaN/None混在 | `to_json`でnullに変換 |
| コンポーネントクラッシュ | ErrorBoundaryでキャッチ |
| 空データ（カラムあり） | ヘッダ + empty行 |
| 空データ（カラムなし） | 空ヘッダ + empty行 |

---

## ブランチ戦略

- **mainブランチへの直接コミット禁止**
- すべての変更はfeatureブランチから
- ブランチ命名: `feature/{機能名}`, `fix/{バグ名}`, `refactor/{対象}`

---

## 禁止事項

1. **標準st.dataframeのUIを独自に変更禁止**
   - 見た目は標準に完全準拠
   - カスタマイズは機能のみ

2. **後方互換性を破壊する変更禁止**
   - 既存のpropsのデフォルト値を変更しない
   - 型定義の破壊的変更は避ける

3. **Context7を使わずにライブラリAPIを推測禁止**
   - TanStack Tableの機能実装前に必ずContext7で最新ドキュメント確認

---

## リリース準備

### PyPI公開

1. `pyproject.toml`のメタデータ更新
2. `README.md`に使用例とドキュメント記載
3. `frontend/dist`ビルド確認
4. バージョニング（semantic versioning）

---

## 参考リンク

- **TanStack Table**: https://tanstack.com/table/latest/docs/framework/react
- **Streamlit Custom Components**: https://docs.streamlit.io/develop/concepts/custom-components
- **Context7 MCP**: ライブラリの最新API確認用

