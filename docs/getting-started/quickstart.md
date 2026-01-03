# Quick Start

## Basic Usage

```python
import pandas as pd
import streamlit as st
from streamlit_advanced_dataframe import advanced_dataframe

st.title("My App")

df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "Diana", "Eve"],
    "age": [25, 30, 35, 28, 32],
    "city": ["Tokyo", "Osaka", "Kyoto", "Nagoya", "Fukuoka"],
    "score": [85.5, 92.0, 78.5, 88.0, 95.5]
})

advanced_dataframe(data=df, height=400)
```

## With Row Selection

```python
selected = advanced_dataframe(
    data=df,
    height=400,
    selection_mode="multi-row"
)

if selected:
    st.write("Selected rows:", selected)
    st.dataframe(df.iloc[selected])
```

## With Filters

```python
advanced_dataframe(
    data=df,
    height=400,
    filterable_columns=["name", "age", "city"],
    show_row_count=True
)
```

## Next Steps

- [Filtering](../features/filtering.md) - Learn about column filters
- [Row Selection](../features/selection.md) - Single and multi-row selection
- [API Reference](../api.md) - Full parameter documentation
