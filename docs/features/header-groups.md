# Header Groups

Group multiple columns under a single header using the `header_groups` parameter.

## Basic Usage

```python
advanced_dataframe(
    data=df,
    height=300,
    header_groups=[
        {"header": "Product Info", "columns": ["Name", "Category"]},
        {"header": "Inventory", "columns": ["Price", "Stock", "Sales"]},
        {"header": "Review", "columns": ["Rating"]}
    ]
)
```

## Configuration

Each group is a dictionary with:

| Key | Type | Description |
|-----|------|-------------|
| `header` | `str` | Display name of the group |
| `columns` | `list[str]` | Column names to include |

## Example

```python
import pandas as pd
from streamlit_advanced_dataframe import advanced_dataframe

df = pd.DataFrame({
    "Name": ["Product A", "Product B", "Product C"],
    "Category": ["Electronics", "Clothing", "Food"],
    "Price": [1000, 2000, 500],
    "Stock": [50, 30, 100],
    "Sales": [120, 85, 200],
    "Rating": [4.5, 4.8, 4.2]
})

advanced_dataframe(
    data=df,
    height=300,
    header_groups=[
        {"header": "Product Info", "columns": ["Name", "Category"]},
        {"header": "Inventory", "columns": ["Price", "Stock", "Sales"]},
        {"header": "Review", "columns": ["Rating"]}
    ]
)
```

## Notes

- Columns not included in any group will display with their normal headers
- Groups are displayed in the order specified
- Column order within a group follows the `columns` array order
