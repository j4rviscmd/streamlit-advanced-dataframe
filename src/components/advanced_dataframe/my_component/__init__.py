import os
from typing import Any, Hashable

import pandas as pd
import streamlit.components.v1 as components

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
_RELEASE = False

# Declare a Streamlit component
if not _RELEASE:
    _component_func = components.declare_component(
        "advanced_dataframe",
        url="http://localhost:5173",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/dist")
    _component_func = components.declare_component(
        "advanced_dataframe", path=build_dir
    )


def advanced_dataframe(
    data: pd.DataFrame,
    height: int = 600,
    full_width: bool = False,
    enable_row_selection: bool = False,
    enable_filters: list[str] | None = None,
    show_filter_records: bool = False,
    visible_columns: list[str] | None = None,
    column_groups: list[dict[str, Any]] | None = None,
    expandable: bool = False,
    sub_rows_key: str = "subRows",
    key: str | None = None,
) -> Any:
    """
    高機能DataFrameコンポーネント

    Streamlitの標準st.dataframeを拡張した高機能テーブルコンポーネント。
    TanStack Tableを使用し、ソート、リサイズ、行選択などの機能を提供します。

    Phase 1機能:
    - 基本的なデータ表示
    - カラムソート（単一カラム、昇順/降順）
    - カラム幅のリサイズ
    - Streamlitテーマ対応（ライト/ダーク）
    - セル選択とクリップボードコピー
    - 数値カラムの自動検出と右寄せ、3桁区切り表示

    Phase 2機能:
    - 行選択（単一行選択）
    - カラムフィルタ（テキスト、数値範囲、セレクト、日付範囲）
    - グローバル検索（全カラム横断検索、一致箇所ハイライト）

    Parameters
    ----------
    data : pd.DataFrame
        表示するDataFrame
    height : int, optional
        テーブルの高さ（px）、デフォルトは600
    full_width : bool, optional
        テーブルを親要素の幅いっぱいに表示するか、デフォルトはFalse
        Falseの場合、テーブルの内容に合わせて幅が調整されます（fit-content）
        Trueの場合、親要素の幅いっぱいに表示されます
    enable_row_selection : bool, optional
        行選択機能を有効化するか、デフォルトはFalse
        Trueの場合、左端にチェックボックスが表示され、行を選択できます
    enable_filters : list[str] or None, optional
        フィルタ機能を有効化するカラム名のリスト、デフォルトはNone
        指定されたカラムにフィルタアイコンが表示され、フィルタリングが可能になります
        フィルタタイプ（テキスト、数値範囲、セレクト、日付）は自動判定されます
    show_filter_records : bool, optional
        フィルタレコード数の表示を有効化するか、デフォルトはFalse
        Trueの場合、フィルタ適用時に「全100件中25件を表示」のような表示が追加されます
    visible_columns : list[str] or None, optional
        表示するカラム名のリスト、デフォルトはNone（全カラム表示）
        指定されたカラムのみが表示されます。カラムの表示順序は元のDataFrameの順序に従います
    column_groups : list[dict] or None, optional
        カラムグループ設定（ヘッダ結合）、デフォルトはNone（グループ化なし）
        各要素は {'header': 'グループ名', 'columns': ['カラム1', 'カラム2']} の形式
        'id'キーは省略可能（省略時は'header'を使用）
        グループに属さないカラムは通常のヘッダとして表示されます
    expandable : bool, optional
        行展開機能を有効化するか、デフォルトはFalse
        Trueの場合、階層データを展開・折りたたみ表示できます
        データには`sub_rows_key`で指定したキーにサブ行のリストを含める必要があります
    sub_rows_key : str, optional
        サブ行データのキー名、デフォルトは"subRows"
        各行のこのキーにサブ行のリスト（dict）を含めることで階層表示されます
    key : str or None, optional
        Streamlitコンポーネントの一意なキー

    Note
    ----
    グローバル検索機能は常に有効です。テーブル右上に検索アイコンが表示され、
    全カラムを対象とした検索が可能です。検索クエリに一致するセルは赤系背景でハイライト表示されます。

    Returns
    -------
    int | None
        選択された行のインデックス（0始まり）
        行選択機能が無効、または選択されていない場合はNone

    Examples
    --------
    >>> import streamlit as st
    >>> import pandas as pd
    >>> from components.advanced_dataframe.my_component import advanced_dataframe
    >>>
    >>> df = pd.DataFrame({
    ...     "name": ["Alice", "Bob", "Charlie"],
    ...     "age": [25, 30, 35],
    ...     "city": ["Tokyo", "Osaka", "Kyoto"]
    ... })
    >>> # 基本的な使い方
    >>> advanced_dataframe(data=df, height=400, key="my_table")
    >>>
    >>> # 行選択機能を有効化
    >>> selected_row = advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     enable_row_selection=True,
    ...     key="selectable_table"
    ... )
    >>> if selected_row is not None:
    ...     st.write(f"選択された行: {selected_row}")
    ...     st.write(df.iloc[selected_row])
    >>>
    >>> # フィルタ機能を有効化
    >>> advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     enable_filters=["name", "age", "city"],
    ...     key="filterable_table"
    ... )
    >>
    >>> # カラムグループ（ヘッダ結合）
    >>> advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     column_groups=[
    ...         {"header": "個人情報", "columns": ["name", "age"]},
    ...         {"header": "所在地", "columns": ["city"]}
    ...     ],
    ...     key="grouped_table"
    ... )
    """
    # DataFrameをJSON形式に変換（Reactで受け取りやすい形式）
    data_json: list[dict[Hashable, Any]] = data.to_dict("records")

    # カラム設定を生成
    columns_json: list[dict[str, Any]] = []
    for col in data.columns:
        col_config: dict[str, Any] = {
            "id": col,
            "header": col,
            "enableSorting": True,
            "enableResizing": True,
        }

        # フィルタが有効なカラムの場合、filterConfigを追加
        if enable_filters and col in enable_filters:
            col_config["filterConfig"] = {
                "enabled": True,
                # typeは省略（フロントエンドで自動判定）
            }

        columns_json.append(col_config)

    # コンポーネントを呼び出し
    component_value = _component_func(
        data=data_json,
        columns=columns_json,
        height=height,
        full_width=full_width,
        enable_row_selection=enable_row_selection,
        show_filter_records=show_filter_records,
        visible_columns=visible_columns,
        column_groups=column_groups,
        expandable=expandable,
        sub_rows_key=sub_rows_key,
        key=key,
        default=None,
    )

    return component_value


# 後方互換性のため、旧名称も維持
my_component = advanced_dataframe
