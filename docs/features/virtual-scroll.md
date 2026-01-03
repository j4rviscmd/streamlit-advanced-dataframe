# Virtual Scroll

Advanced DataFrame uses virtualization to handle large datasets efficiently.

## How It Works

Only visible rows are rendered in the DOM. As you scroll, rows are dynamically created and destroyed, maintaining a consistent frame rate.

## Performance

| Rows | Performance |
|------|-------------|
| 1,000 | Instant |
| 10,000 | Smooth 60fps |
| 100,000 | Smooth 60fps |
| 1,000,000 | Usable (may have initial load time) |

## Example: 10,000 Rows

```python
import pandas as pd
import random
from streamlit_advanced_dataframe import advanced_dataframe

random.seed(42)
categories = ["A", "B", "C", "D", "E"]

df = pd.DataFrame({
    "ID": [f"ID{i:05d}" for i in range(1, 10001)],
    "Name": [f"Item {i}" for i in range(1, 10001)],
    "Category": [random.choice(categories) for _ in range(10000)],
    "Value": [random.randint(100, 10000) for _ in range(10000)],
    "Active": [random.choice([True, False]) for _ in range(10000)]
})

advanced_dataframe(
    data=df,
    height=500,
    filterable_columns=["Category", "Value", "Active"],
    show_row_count=True,
    show_summary=True
)
```

## Tips for Large Datasets

1. **Use filters** - Reduce visible data with column filters
2. **Limit columns** - Use `column_order` to show only needed columns
3. **Disable summary** - Set `show_summary=False` for faster rendering

```python
advanced_dataframe(
    data=large_df,
    height=600,
    column_order=["ID", "Name", "Value"],  # Only essential columns
    show_summary=False  # Faster for large data
)
```
