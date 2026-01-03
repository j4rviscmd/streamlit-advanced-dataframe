# Column Config

Customize column display with prefix and suffix using the `column_config` parameter.

## Basic Usage

```python
advanced_dataframe(
    data=df,
    height=300,
    column_config={
        "Price": {"prefix": "$"},
        "Discount": {"suffix": "%"},
        "Margin": {"prefix": "+", "suffix": "%"}
    }
)
```

## Configuration Options

| Key | Type | Description |
|-----|------|-------------|
| `prefix` | `str` | String to display before the value |
| `suffix` | `str` | String to display after the value |

## Example

```python
import pandas as pd
from streamlit_advanced_dataframe import advanced_dataframe

df = pd.DataFrame({
    "Product": ["Product A", "Product B", "Product C"],
    "Price": [1000, 2500, 1800],
    "Discount": [10, 15, 5],
    "Margin": [25.5, 30.2, 18.8]
})

advanced_dataframe(
    data=df,
    height=250,
    column_config={
        "Price": {"prefix": "$"},
        "Discount": {"suffix": "%"},
        "Margin": {"prefix": "+", "suffix": "%"}
    }
)
```

**Display Result:**

| Product | Price | Discount | Margin |
|---------|-------|----------|--------|
| Product A | $1000 | 10% | +25.5% |
| Product B | $2500 | 15% | +30.2% |
| Product C | $1800 | 5% | +18.8% |

## Notes

- Prefix/suffix are **not applied** to Boolean columns (True/False display)
- Summary row values also include prefix/suffix
- Original data values are unchanged; only display is affected
