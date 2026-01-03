# Expandable Rows

Display hierarchical data with expandable/collapsible rows.

## Basic Usage

```python
advanced_dataframe(
    data=df,
    height=400,
    expandable=True
)
```

## Data Structure

Include sub-rows under the `subRows` key (or custom key via `sub_rows_key`):

```python
data = pd.DataFrame([
    {
        "Category": "Electronics",
        "Sales": 120000,
        "subRows": [
            {"Category": "TV", "Sales": 80000},
            {"Category": "Phone", "Sales": 40000}
        ]
    },
    {
        "Category": "Clothing",
        "Sales": 50000,
        "subRows": [
            {"Category": "Men's", "Sales": 20000},
            {"Category": "Women's", "Sales": 30000}
        ]
    }
])
```

## Custom Sub-Rows Key

```python
data = pd.DataFrame([
    {
        "name": "Parent",
        "children": [  # Custom key
            {"name": "Child 1"},
            {"name": "Child 2"}
        ]
    }
])

advanced_dataframe(
    data=data,
    expandable=True,
    sub_rows_key="children"  # Specify custom key
)
```

## Nested Hierarchies

Supports up to 5 levels of nesting (recommended maximum):

```python
data = pd.DataFrame([
    {
        "Category": "Food",
        "subRows": [
            {
                "Category": "Fruits",
                "subRows": [
                    {"Category": "Apple"},
                    {"Category": "Orange"}
                ]
            },
            {
                "Category": "Vegetables",
                "subRows": [
                    {"Category": "Carrot"},
                    {"Category": "Tomato"}
                ]
            }
        ]
    }
])
```

!!! warning "Deep Hierarchies"
    Hierarchies deeper than 5 levels will show a warning.
    Deep nesting may impact usability and performance.

## With Row Selection

Expandable rows work with row selection:

```python
selected = advanced_dataframe(
    data=data,
    height=400,
    expandable=True,
    selection_mode="single-row"
)
```
