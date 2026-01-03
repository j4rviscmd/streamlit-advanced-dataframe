"""
Streamlit Advanced DataFrame

Streamlitの標準st.dataframeを拡張した高機能カスタムコンポーネント。
TanStack Tableを使用し、ソート、フィルタ、行選択などの機能を提供します。

Usage:
    from streamlit_advanced_dataframe import advanced_dataframe

    df = pd.DataFrame({"name": ["Alice", "Bob"], "age": [25, 30]})
    advanced_dataframe(df, height=400)
"""

import json
import os
from typing import Any, Hashable, Literal

import pandas as pd
import streamlit as st
import streamlit.components.v1 as components

__all__ = ["advanced_dataframe"]

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


def _check_max_depth(
    data: list[dict[Hashable, Any]],
    sub_rows_key: str,
    current_depth: int = 1,
) -> int:
    """
    階層データの最大深度を再帰的にチェックする

    Parameters
    ----------
    data : list[dict]
        チェック対象のデータ（records形式）
    sub_rows_key : str
        サブ行データのキー名
    current_depth : int, optional
        現在の深度（内部使用）、デフォルトは1

    Returns
    -------
    int
        最大深度
    """
    max_depth = current_depth

    for row in data:
        if sub_rows_key in row and isinstance(row[sub_rows_key], list):
            sub_rows = row[sub_rows_key]
            if sub_rows:
                # サブ行の深度を再帰的にチェック
                sub_depth = _check_max_depth(
                    sub_rows,
                    sub_rows_key,
                    current_depth + 1,
                )
                max_depth = max(max_depth, sub_depth)

    return max_depth


def advanced_dataframe(
    data: pd.DataFrame,
    *,
    height: int = 600,
    use_container_width: bool = False,
    selection_mode: Literal["single-row", "multi-row"] | None = None,
    filterable_columns: list[str] | None = None,
    show_row_count: bool = False,
    column_order: list[str] | None = None,
    header_groups: list[dict[str, Any]] | None = None,
    expandable: bool = False,
    sub_rows_key: str = "subRows",
    show_summary: bool = True,
    key: str | None = None,
) -> list[int]:
    """
    高機能DataFrameコンポーネント

    Streamlitの標準st.dataframeを拡張した高機能テーブルコンポーネント。
    TanStack Tableを使用し、ソート、フィルタ、行選択などの機能を提供します。

    Parameters
    ----------
    data : pd.DataFrame
        表示するDataFrame
    height : int, optional
        テーブルの高さ（px）、デフォルトは600
    use_container_width : bool, optional
        テーブルを親要素の幅いっぱいに表示するか、デフォルトはFalse
        Falseの場合、テーブルの内容に合わせて幅が調整されます（fit-content）
        Trueの場合、親要素の幅いっぱいに表示されます
    selection_mode : {"single-row", "multi-row"} or None, optional
        行選択モード、デフォルトはNone（行選択無効）
        - "single-row": 単一行選択（1行のみ選択可能）
        - "multi-row": 複数行選択（複数行を同時に選択可能）
    filterable_columns : list[str] or None, optional
        フィルタ機能を有効化するカラム名のリスト、デフォルトはNone
        指定されたカラムにフィルタアイコンが表示され、フィルタリングが可能になります
        フィルタタイプ（テキスト、数値範囲、セレクト、日付）は自動判定されます
    show_row_count : bool, optional
        フィルタ適用時の行数表示を有効化するか、デフォルトはFalse
        Trueの場合、「全100件中25件を表示」のような表示が追加されます
    column_order : list[str] or None, optional
        表示するカラム名のリスト（順序も反映）、デフォルトはNone（全カラム表示）
        指定されたカラムのみが指定順で表示されます
    header_groups : list[dict] or None, optional
        ヘッダグループ設定（ヘッダ結合）、デフォルトはNone（グループ化なし）
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
    show_summary : bool, optional
        サマリー行の表示を有効化するか、デフォルトはTrue
        Trueの場合、テーブル下部に固定されたサマリー行が表示されます
        数値カラムは合計、Boolean型カラムはTrue率（%）を表示します
        階層データの場合は親行のみを集計対象とします
    key : str or None, optional
        Streamlitコンポーネントの一意なキー

    Note
    ----
    グローバル検索機能は常に有効です。テーブル右上に検索アイコンが表示され、
    全カラムを対象とした検索が可能です。検索クエリに一致するセルは赤系背景で
    ハイライト表示されます。

    Returns
    -------
    list[int]
        選択された行のインデックスのリスト（0始まり）
        selection_modeがNone、または選択されていない場合は空リスト[]

    Examples
    --------
    >>> import streamlit as st
    >>> import pandas as pd
    >>> from streamlit_advanced_dataframe import advanced_dataframe
    >>>
    >>> df = pd.DataFrame({
    ...     "name": ["Alice", "Bob", "Charlie"],
    ...     "age": [25, 30, 35],
    ...     "city": ["Tokyo", "Osaka", "Kyoto"]
    ... })
    >>>
    >>> # 基本的な使い方
    >>> advanced_dataframe(data=df, height=400, key="my_table")
    >>>
    >>> # 単一行選択
    >>> selected_rows = advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     selection_mode="single-row",
    ...     key="selectable_table"
    ... )
    >>> if selected_rows:
    ...     st.write(f"選択された行: {selected_rows}")
    ...     st.write(df.iloc[selected_rows])
    >>>
    >>> # 複数行選択
    >>> selected_rows = advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     selection_mode="multi-row",
    ...     key="multi_selectable_table"
    ... )
    >>> if selected_rows:
    ...     st.write(f"選択された行: {selected_rows}")
    ...     st.write(df.iloc[selected_rows])
    >>>
    >>> # フィルタ機能を有効化
    >>> advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     filterable_columns=["name", "age", "city"],
    ...     show_row_count=True,
    ...     key="filterable_table"
    ... )
    >>>
    >>> # ヘッダグループ（ヘッダ結合）
    >>> advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     header_groups=[
    ...         {"header": "個人情報", "columns": ["name", "age"]},
    ...         {"header": "所在地", "columns": ["city"]}
    ...     ],
    ...     key="grouped_table"
    ... )
    """
    # DataFrameをJSON形式に変換（Reactで受け取りやすい形式）
    # to_json → json.loads でNaN/NaT を null に変換（JSONではNaNは無効な値のため）
    data_json: list[dict[Hashable, Any]] = json.loads(
        data.to_json(orient="records", default_handler=str)
    )

    # 展開機能が有効な場合、最大深度をチェック
    if expandable:
        max_depth = _check_max_depth(data_json, sub_rows_key)
        if max_depth > 5:
            st.warning(
                f"⚠️ **階層の深さが{max_depth}階層あります。**  \n"
                f"パフォーマンスとユーザビリティのため、**5階層以下を推奨**します。  \n"
                f"深い階層はユーザーが構造を理解しづらくなる可能性があります。",
                icon="⚠️",
            )

    # カラム設定を生成
    columns_json: list[dict[str, Any]] = []
    for col in data.columns:
        # sub_rows_keyで指定されたカラムは表示カラムから除外
        if expandable and col == sub_rows_key:
            continue

        col_config: dict[str, Any] = {
            "id": col,
            "header": col,
            "enableSorting": True,
            "enableResizing": True,
        }

        # フィルタが有効なカラムの場合、filterConfigを追加
        if filterable_columns and col in filterable_columns:
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
        use_container_width=use_container_width,
        selection_mode=selection_mode,
        show_row_count=show_row_count,
        column_order=column_order,
        header_groups=header_groups,
        expandable=expandable,
        sub_rows_key=sub_rows_key,
        show_summary=show_summary,
        key=key,
        default=[],
    )

    # 戻り値を常にlist[int]で返す
    if component_value is None:
        return []
    return component_value
