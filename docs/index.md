# Advanced DataFrame

**Streamlit's `st.dataframe` with advanced features using TanStack Table.**

[![PyPI version](https://img.shields.io/pypi/v/streamlit-advanced-dataframe)](https://pypi.org/project/streamlit-advanced-dataframe/)
[![Python version](https://img.shields.io/pypi/pyversions/streamlit-advanced-dataframe)](https://pypi.org/project/streamlit-advanced-dataframe/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/pypi/dm/streamlit-advanced-dataframe)](https://pypi.org/project/streamlit-advanced-dataframe/)

## Live Demo

Check out the [Demo](https://app-advanced-dataframe-ezjlvffyxpev3iima6ttwr.streamlit.app/) page to see all features in action.

## Features

- **Sorting** - Click column headers to sort
- **Column Resize** - Drag column borders to resize
- **Column Reorder** - Drag and drop columns
- **Column Filters** - Text, numeric range, select, date filters
- **Global Search** - Search across all columns with highlighting
- **Row Selection** - Single or multi-row selection mode
- **Header Groups** - Merge column headers
- **Expandable Rows** - Hierarchical data display
- **Virtual Scroll** - Handle 100k+ rows at 60fps
- **Summary Row** - Auto-calculated sum/percentage
- **Theme** - Auto-follows Streamlit light/dark theme

## Quick Install

```bash
pip install streamlit-advanced-dataframe
```

## Quick Start

```python
import pandas as pd
from streamlit_advanced_dataframe import advanced_dataframe

df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 30, 35],
    "city": ["Tokyo", "Osaka", "Kyoto"]
})

advanced_dataframe(data=df, height=400)
```
