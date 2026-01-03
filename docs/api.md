# API Reference

## advanced_dataframe

```python
from streamlit_advanced_dataframe import advanced_dataframe

selected_rows = advanced_dataframe(
    data: pd.DataFrame,
    *,
    height: int = 600,
    use_container_width: bool = False,
    selection_mode: Literal["single-row", "multi-row"] | None = None,
    filterable_columns: list[str] | None = None,
    show_row_count: bool = False,
    column_order: list[str] | None = None,
    header_groups: list[dict] | None = None,
    expandable: bool = False,
    sub_rows_key: str = "subRows",
    show_summary: bool = True,
    column_config: dict[str, dict] | None = None,
    key: str | None = None,
) -> list[int]
```

## Parameters

### data
- **Type:** `pd.DataFrame`
- **Required:** Yes
- **Description:** The DataFrame to display.

### height
- **Type:** `int`
- **Default:** `600`
- **Description:** Table height in pixels.

### use_container_width
- **Type:** `bool`
- **Default:** `False`
- **Description:** Whether to expand the table to fill the parent container width.

### selection_mode
- **Type:** `"single-row"` | `"multi-row"` | `None`
- **Default:** `None`
- **Description:** Row selection mode.
    - `None`: Row selection disabled
    - `"single-row"`: Only one row can be selected
    - `"multi-row"`: Multiple rows can be selected

### filterable_columns
- **Type:** `list[str]` | `None`
- **Default:** `None`
- **Description:** List of column names to enable filtering. Filter types are auto-detected based on data types.

### show_row_count
- **Type:** `bool`
- **Default:** `False`
- **Description:** Whether to show row count when filters are applied (e.g., "Showing 25 of 100 rows").

### column_order
- **Type:** `list[str]` | `None`
- **Default:** `None`
- **Description:** List of column names to display (order is preserved). Only specified columns are displayed.

### header_groups
- **Type:** `list[dict]` | `None`
- **Default:** `None`
- **Description:** Header group configuration for merging headers.

    Each element should be:
    ```python
    {"header": "Group Name", "columns": ["col1", "col2"]}
    ```

### expandable
- **Type:** `bool`
- **Default:** `False`
- **Description:** Whether to enable row expansion for hierarchical data.

### sub_rows_key
- **Type:** `str`
- **Default:** `"subRows"`
- **Description:** Key name for sub-row data in hierarchical structures.

### show_summary
- **Type:** `bool`
- **Default:** `True`
- **Description:** Whether to display the summary row at the bottom.
    - Numeric columns show sum
    - Boolean columns show True percentage (%)

### column_config
- **Type:** `dict[str, dict]` | `None`
- **Default:** `None`
- **Description:** Per-column display configuration.

    ```python
    {
        "Price": {"prefix": "$"},
        "Discount": {"suffix": "%"}
    }
    ```

### key
- **Type:** `str` | `None`
- **Default:** `None`
- **Description:** Unique key for the Streamlit component.

## Returns

- **Type:** `list[int]`
- **Description:** List of selected row indices (0-based). Returns empty list `[]` when no rows are selected or `selection_mode` is `None`.

## Examples

### Basic

```python
advanced_dataframe(data=df, height=400)
```

### With Selection

```python
selected = advanced_dataframe(
    data=df,
    height=400,
    selection_mode="multi-row"
)
if selected:
    st.dataframe(df.iloc[selected])
```

### With Filters

```python
advanced_dataframe(
    data=df,
    height=400,
    filterable_columns=["name", "age", "city"],
    show_row_count=True
)
```

### With Header Groups

```python
advanced_dataframe(
    data=df,
    height=400,
    header_groups=[
        {"header": "Personal Info", "columns": ["name", "age"]},
        {"header": "Location", "columns": ["city"]}
    ]
)
```

### With Column Config

```python
advanced_dataframe(
    data=df,
    height=400,
    column_config={
        "price": {"prefix": "$"},
        "discount": {"suffix": "%"}
    }
)
```
