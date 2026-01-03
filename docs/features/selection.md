# Row Selection

Enable row selection to allow users to select one or more rows.

## Selection Modes

| Mode | Description |
|------|-------------|
| `None` | No selection (default) |
| `"single-row"` | Only one row can be selected |
| `"multi-row"` | Multiple rows can be selected |

## Single Row Selection

```python
selected = advanced_dataframe(
    data=df,
    height=300,
    selection_mode="single-row"
)

if selected:
    st.write(f"Selected row index: {selected[0]}")
    st.dataframe(df.iloc[selected])
```

## Multi Row Selection

```python
selected = advanced_dataframe(
    data=df,
    height=300,
    selection_mode="multi-row"
)

if selected:
    st.write(f"Selected {len(selected)} rows")
    st.dataframe(df.iloc[selected])
```

## Return Value

The function returns a `list[int]` containing the indices of selected rows:

- Empty list `[]` when no rows are selected
- `[0]` when row at index 0 is selected
- `[0, 2, 5]` when rows at indices 0, 2, and 5 are selected

## Example with Actions

```python
import pandas as pd
import streamlit as st
from streamlit_advanced_dataframe import advanced_dataframe

df = pd.DataFrame({
    "Product": ["Apple", "Banana", "Orange", "Grape", "Melon"],
    "Price": [150, 100, 120, 300, 500],
    "Stock": [50, 80, 30, 20, 10]
})

selected = advanced_dataframe(
    data=df,
    height=250,
    selection_mode="multi-row"
)

if selected:
    total = df.iloc[selected]["Price"].sum()
    st.success(f"Total price of selected items: ${total}")

    if st.button("Delete Selected"):
        df = df.drop(index=selected)
        st.rerun()
```
