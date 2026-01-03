# streamlit-advanced-dataframe

Streamlit's `st.dataframe` with advanced features using TanStack Table.

## Installation

```bash
pip install streamlit-advanced-dataframe
```

## Usage

```python
import pandas as pd
from streamlit_advanced_dataframe import advanced_dataframe

df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 30, 35],
    "city": ["Tokyo", "Osaka", "Kyoto"]
})

# Basic usage
advanced_dataframe(data=df, height=400, key="my_table")

# Single row selection
selected = advanced_dataframe(
    data=df,
    selection_mode="single-row",
    key="selectable_table"
)
if selected:
    st.write(f"Selected rows: {selected}")  # Returns list[int]

# Multi-row selection
selected = advanced_dataframe(
    data=df,
    selection_mode="multi-row",
    key="multi_selectable_table"
)
if selected:
    st.dataframe(df.iloc[selected])  # Show selected rows

# Filter columns
advanced_dataframe(
    data=df,
    filterable_columns=["name", "age", "city"],
    show_row_count=True,
    key="filterable_table"
)

# Header groups
advanced_dataframe(
    data=df,
    header_groups=[
        {"header": "Personal Info", "columns": ["name", "age"]},
        {"header": "Location", "columns": ["city"]}
    ],
    key="grouped_table"
)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | `pd.DataFrame` | required | DataFrame to display |
| `height` | `int` | `600` | Table height in pixels |
| `use_container_width` | `bool` | `False` | Use full container width |
| `selection_mode` | `"single-row"` \| `"multi-row"` \| `None` | `None` | Row selection mode |
| `filterable_columns` | `list[str]` \| `None` | `None` | Columns to enable filtering |
| `show_row_count` | `bool` | `False` | Show filtered row count |
| `column_order` | `list[str]` \| `None` | `None` | Columns to display (in order) |
| `header_groups` | `list[dict]` \| `None` | `None` | Header group configuration |
| `expandable` | `bool` | `False` | Enable row expansion |
| `sub_rows_key` | `str` | `"subRows"` | Key for sub-row data |
| `show_summary` | `bool` | `True` | Show summary row |
| `key` | `str` \| `None` | `None` | Streamlit component key |

## Returns

`list[int]` - List of selected row indices (0-based). Returns an empty list `[]` when no rows are selected or `selection_mode` is `None`.
