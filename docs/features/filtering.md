# Column Filtering

Enable filtering on specific columns using the `filterable_columns` parameter.

## Basic Usage

```python
advanced_dataframe(
    data=df,
    height=400,
    filterable_columns=["Category", "Price", "Stock", "Available"]
)
```

## Filter Types

Filter types are **auto-detected** based on column data types:

| Data Type | Filter Type |
|-----------|-------------|
| String | Text search |
| Numeric (int, float) | Range slider |
| Boolean | Select (True/False) |
| DateTime | Date range picker |

## Show Row Count

Display the number of filtered rows:

```python
advanced_dataframe(
    data=df,
    height=400,
    filterable_columns=["Category", "Price"],
    show_row_count=True  # Shows "Showing 25 of 100 rows"
)
```

## Example

```python
import pandas as pd
import random
from streamlit_advanced_dataframe import advanced_dataframe

random.seed(42)
categories = ["Electronics", "Clothing", "Food", "Books", "Sports"]

df = pd.DataFrame({
    "Product": [f"Product {i}" for i in range(1, 101)],
    "Category": [random.choice(categories) for _ in range(100)],
    "Price": [random.randint(100, 10000) for _ in range(100)],
    "Stock": [random.randint(0, 100) for _ in range(100)],
    "Available": [random.choice([True, False]) for _ in range(100)]
})

advanced_dataframe(
    data=df,
    height=400,
    filterable_columns=["Category", "Price", "Stock", "Available"],
    show_row_count=True
)
```
