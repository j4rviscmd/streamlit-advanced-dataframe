"""
Streamlit Advanced DataFrame

An enhanced custom component extending Streamlit's standard st.dataframe.
Powered by TanStack Table, providing sorting, filtering, row selection,
and more features.

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
    Recursively check the maximum depth of hierarchical data.

    Parameters
    ----------
    data : list[dict]
        Data to check (records format).
    sub_rows_key : str
        Key name for sub-row data.
    current_depth : int, optional
        Current depth (internal use). Default is 1.

    Returns
    -------
    int
        Maximum depth.
    """
    max_depth = current_depth

    for row in data:
        if sub_rows_key in row and isinstance(row[sub_rows_key], list):
            sub_rows = row[sub_rows_key]
            if sub_rows:
                # Recursively check sub-row depth
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
    column_config: dict[str, dict[str, Any]] | None = None,
    key: str | None = None,
) -> list[int]:
    """
    Advanced DataFrame Component

    An enhanced table component extending Streamlit's standard st.dataframe.
    Powered by TanStack Table, providing sorting, filtering, row selection,
    and more features.

    Parameters
    ----------
    data : pd.DataFrame
        The DataFrame to display.
    height : int, optional
        Table height in pixels. Default is 600.
    use_container_width : bool, optional
        Whether to expand the table to fill the parent container width.
        Default is False.
        When False, the table width adjusts to fit content (fit-content).
        When True, the table expands to the full width of the parent container.
    selection_mode : {"single-row", "multi-row"} or None, optional
        Row selection mode. Default is None (row selection disabled).
        - "single-row": Single row selection (only one row can be selected)
        - "multi-row": Multiple row selection (multiple rows can be selected)
    filterable_columns : list[str] or None, optional
        List of column names to enable filtering. Default is None.
        Specified columns will display a filter icon enabling filtering.
        Filter types (text, numeric range, select, date) are auto-detected.
    show_row_count : bool, optional
        Whether to show row count when filters are applied. Default is False.
        When True, displays "Showing 25 of 100 rows" style message.
    column_order : list[str] or None, optional
        List of column names to display (order is preserved). Default is None
        (all columns displayed).
        Only specified columns are displayed in the given order.
    header_groups : list[dict] or None, optional
        Header group configuration (header merging). Default is None
        (no grouping).
        Each element should be {'header': 'Group Name',
        'columns': ['col1', 'col2']}.
        The 'id' key is optional (uses 'header' value if omitted).
        Columns not in any group are displayed with normal headers.
    expandable : bool, optional
        Whether to enable row expansion. Default is False.
        When True, hierarchical data can be expanded/collapsed.
        Data must contain sub-row lists under the key specified
        by `sub_rows_key`.
    sub_rows_key : str, optional
        Key name for sub-row data. Default is "subRows".
        Include a list of sub-row dicts under this key in each row
        for hierarchical display.
    show_summary : bool, optional
        Whether to display the summary row. Default is True.
        When True, a fixed summary row appears at the bottom of the table.
        Numeric columns show sum, Boolean columns show True percentage (%).
        For hierarchical data, only parent rows are included in calculations.
    column_config : dict[str, dict[str, Any]] or None, optional
        Per-column display configuration. Default is None.
        Use column names as keys with the following options:
        - "prefix": String to display before cell value (e.g., "$", "¥")
        - "suffix": String to display after cell value (e.g., "%", " USD")
        Not applied to Boolean columns (remains True/False display).
    key : str or None, optional
        Unique key for the Streamlit component.

    Note
    ----
    Global search is always enabled. A search icon appears at the top-right
    of the table, allowing search across all columns. Cells matching the
    search query are highlighted with a red-tinted background.

    Returns
    -------
    list[int]
        List of selected row indices (0-based).
        Returns empty list [] when selection_mode is None or no rows
        are selected.

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
    >>> # Basic usage
    >>> advanced_dataframe(data=df, height=400, key="my_table")
    >>>
    >>> # Single row selection
    >>> selected_rows = advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     selection_mode="single-row",
    ...     key="selectable_table"
    ... )
    >>> if selected_rows:
    ...     st.write(f"Selected rows: {selected_rows}")
    ...     st.write(df.iloc[selected_rows])
    >>>
    >>> # Multiple row selection
    >>> selected_rows = advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     selection_mode="multi-row",
    ...     key="multi_selectable_table"
    ... )
    >>> if selected_rows:
    ...     st.write(f"Selected rows: {selected_rows}")
    ...     st.write(df.iloc[selected_rows])
    >>>
    >>> # Enable column filters
    >>> advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     filterable_columns=["name", "age", "city"],
    ...     show_row_count=True,
    ...     key="filterable_table"
    ... )
    >>>
    >>> # Header groups (merged headers)
    >>> advanced_dataframe(
    ...     data=df,
    ...     height=400,
    ...     header_groups=[
    ...         {"header": "Personal Info", "columns": ["name", "age"]},
    ...         {"header": "Location", "columns": ["city"]}
    ...     ],
    ...     key="grouped_table"
    ... )
    >>>
    >>> # Per-column prefix/suffix configuration
    >>> df_sales = pd.DataFrame({
    ...     "product": ["Product A", "Product B"],
    ...     "price": [1000, 2000],
    ...     "discount": [10, 20]
    ... })
    >>> advanced_dataframe(
    ...     data=df_sales,
    ...     height=300,
    ...     column_config={
    ...         "price": {"prefix": "$"},
    ...         "discount": {"suffix": "%"}
    ...     },
    ...     key="prefix_suffix_table"
    ... )
    """
    # Convert DataFrame to JSON format (React-friendly format)
    # to_json → json.loads converts NaN/NaT to null (NaN is invalid in JSON)
    data_json: list[dict[Hashable, Any]] = json.loads(
        data.to_json(orient="records", default_handler=str)
    )

    # Check maximum depth when expandable is enabled
    if expandable:
        max_depth = _check_max_depth(data_json, sub_rows_key)
        if max_depth > 5:
            st.warning(
                f"⚠️ **Hierarchy depth is {max_depth} levels.**  \n"
                f"For performance and usability, **5 levels or less is "
                f"recommended.**  \n"
                f"Deep hierarchies may be difficult for users to understand.",
                icon="⚠️",
            )

    # Generate column configuration
    columns_json: list[dict[str, Any]] = []
    for col in data.columns:
        # Exclude column specified by sub_rows_key from display
        if expandable and col == sub_rows_key:
            continue

        col_config: dict[str, Any] = {
            "id": col,
            "header": col,
            "enableSorting": True,
            "enableResizing": True,
        }

        # Add filterConfig for columns with filtering enabled
        if filterable_columns and col in filterable_columns:
            col_config["filterConfig"] = {
                "enabled": True,
                # type is omitted (auto-detected on frontend)
            }

        # Merge prefix/suffix from column_config
        if column_config and col in column_config:
            config = column_config[col]
            if "prefix" in config:
                col_config["prefix"] = config["prefix"]
            if "suffix" in config:
                col_config["suffix"] = config["suffix"]

        columns_json.append(col_config)

    # Call the component
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

    # Always return list[int]
    if component_value is None:
        return []
    return component_value
