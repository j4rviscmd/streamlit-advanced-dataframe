# Basic Usage

## Simple Table Display

The most basic usage is just passing a DataFrame.

```python
import pandas as pd
from streamlit_advanced_dataframe import advanced_dataframe

df = pd.DataFrame({
    "Name": ["Alice", "Bob", "Charlie", "Diana", "Eve"],
    "Age": [25, 30, 35, 28, 32],
    "City": ["Tokyo", "Osaka", "Kyoto", "Nagoya", "Fukuoka"],
    "Score": [85.5, 92.0, 78.5, 88.0, 95.5]
})

advanced_dataframe(data=df, height=300)
```

## Built-in Features

Without any additional configuration, you get:

- **Sorting** - Click any column header to sort
- **Column Resize** - Drag the column border to resize
- **Column Reorder** - Drag and drop column headers
- **Global Search** - Click the search icon in the toolbar
- **Summary Row** - Auto-calculated at the bottom

## Height and Width

```python
# Fixed height
advanced_dataframe(data=df, height=400)

# Use container width
advanced_dataframe(data=df, height=400, use_container_width=True)
```

## Show/Hide Summary Row

```python
# Hide summary row
advanced_dataframe(data=df, show_summary=False)
```
