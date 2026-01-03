# streamlit-advanced-dataframe

[![PyPI version](https://img.shields.io/pypi/v/streamlit-advanced-dataframe)](https://pypi.org/project/streamlit-advanced-dataframe/)
[![Python version](https://img.shields.io/pypi/pyversions/streamlit-advanced-dataframe)](https://pypi.org/project/streamlit-advanced-dataframe/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/pypi/dm/streamlit-advanced-dataframe)](https://pypi.org/project/streamlit-advanced-dataframe/)

Streamlit's `st.dataframe` with advanced features using TanStack Table.

## Documentation

For full documentation, features, and API reference, see the [Documentation](https://j4rviscmd.github.io/streamlit-advanced-dataframe/).

## Quick Start

```bash
pip install streamlit-advanced-dataframe
```

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
