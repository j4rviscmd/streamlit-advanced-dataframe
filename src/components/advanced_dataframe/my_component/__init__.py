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
    key: str | None = None,
) -> Any:
    """
    高機能DataFrameコンポーネント（Phase 1版）

    Streamlitの標準st.dataframeを拡張した高機能テーブルコンポーネント。
    TanStack Tableを使用し、ソート、リサイズなどの機能を提供します。

    Phase 1機能:
    - 基本的なデータ表示
    - カラムソート（単一カラム、昇順/降順）
    - カラム幅のリサイズ
    - Streamlitテーマ対応（ライト/ダーク）

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
    key : str or None, optional
        Streamlitコンポーネントの一意なキー

    Returns
    -------
    Any
        コンポーネントの戻り値（Phase 1では使用しない）

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
    >>> # デフォルト（内容に合わせて幅調整: fit-content）
    >>> advanced_dataframe(data=df, height=400, key="my_table")
    >>> # 親要素の幅いっぱいに表示する場合
    >>> advanced_dataframe(data=df, height=400, full_width=True, key="my_table2")
    """
    # DataFrameをJSON形式に変換（Reactで受け取りやすい形式）
    data_json: list[dict[Hashable, Any]] = data.to_dict("records")

    # カラム設定を生成
    columns_json: list[dict[str, Any]] = [
        {
            "id": col,
            "header": col,
            "enableSorting": True,
            "enableResizing": True,
        }
        for col in data.columns
    ]

    # コンポーネントを呼び出し
    component_value = _component_func(
        data=data_json,
        columns=columns_json,
        height=height,
        full_width=full_width,
        key=key,
        default=None,
    )

    return component_value


# 後方互換性のため、旧名称も維持
my_component = advanced_dataframe
