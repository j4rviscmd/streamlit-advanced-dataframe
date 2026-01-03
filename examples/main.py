"""
Advanced DataFrame - Demo Application

This demo showcases all features of the advanced_dataframe component.
"""

import random

import pandas as pd
import streamlit as st

from streamlit_advanced_dataframe import advanced_dataframe


def main():
    st.set_page_config(
        page_title="Advanced DataFrame Demo",
        page_icon="📊",
        layout="wide",
    )

    st.title("📊 Advanced DataFrame")
    st.markdown(
        "An enhanced DataFrame component for Streamlit, powered by TanStack Table."
    )

    # =========================================================================
    # 1. Full-Featured Showcase (Hero Demo)
    # =========================================================================
    st.header("1. Full-Featured Showcase")
    st.markdown(
        """
        This demo combines **all features** in one table:
        - ✅ Multi-row selection
        - ✅ Column filtering (text, number, boolean)
        - ✅ Header groups
        - ✅ Prefix/suffix formatting
        - ✅ Summary row
        - ✅ Row count display
        - ✅ Sorting, resizing, reordering (always enabled)
        - ✅ Global search (click 🔍 icon)
        """
    )

    # Generate 100 rows of product data
    random.seed(42)
    categories = ["Electronics", "Clothing", "Food", "Books", "Sports", "Home", "Toys"]
    brands = ["BrandA", "BrandB", "BrandC", "BrandD", "BrandE"]

    df_hero = pd.DataFrame(
        {
            "product_id": [f"P{i:04d}" for i in range(1, 101)],
            "name": [f"Product {i}" for i in range(1, 101)],
            "category": [random.choice(categories) for _ in range(100)],
            "brand": [random.choice(brands) for _ in range(100)],
            "price": [random.randint(10, 500) for _ in range(100)],
            "cost": [random.randint(5, 300) for _ in range(100)],
            "margin": [round(random.uniform(10, 50), 1) for _ in range(100)],
            "stock": [random.randint(0, 200) for _ in range(100)],
            "sold": [random.randint(0, 1000) for _ in range(100)],
            "rating": [round(random.uniform(3.0, 5.0), 1) for _ in range(100)],
            "in_stock": [random.choice([True, False]) for _ in range(100)],
            "featured": [random.choice([True, False]) for _ in range(100)],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
advanced_dataframe(
    data=df_hero,
    height=500,
    use_container_width=True,
    selection_mode="multi-row",
    filterable_columns=[
        "name", "category", "brand", "price",
        "stock", "rating", "in_stock", "featured"
    ],
    show_row_count=True,
    header_groups=[
        {"header": "Product Info", "columns": ["product_id", "name", "category", "brand"]},
        {"header": "Pricing", "columns": ["price", "cost", "margin"]},
        {"header": "Inventory", "columns": ["stock", "sold", "in_stock", "featured"]},
        {"header": "Reviews", "columns": ["rating"]},
    ],
    column_config={
        "price": {"prefix": "$"},
        "cost": {"prefix": "$"},
        "margin": {"suffix": "%"},
    },
    show_summary=True,
    key="hero_demo",
)
''',
            language="python",
        )

    selected_hero = advanced_dataframe(
        data=df_hero,
        height=500,
        use_container_width=True,
        selection_mode="multi-row",
        filterable_columns=[
            "name",
            "category",
            "brand",
            "price",
            "stock",
            "rating",
            "in_stock",
            "featured",
        ],
        show_row_count=True,
        header_groups=[
            {
                "header": "Product Info",
                "columns": ["product_id", "name", "category", "brand"],
            },
            {"header": "Pricing", "columns": ["price", "cost", "margin"]},
            {"header": "Inventory", "columns": ["stock", "sold", "in_stock", "featured"]},
            {"header": "Reviews", "columns": ["rating"]},
        ],
        column_config={
            "price": {"prefix": "$"},
            "cost": {"prefix": "$"},
            "margin": {"suffix": "%"},
        },
        show_summary=True,
        key="hero_demo",
    )

    if selected_hero:
        st.success(f"Selected {len(selected_hero)} row(s): {selected_hero}")

    st.divider()

    # =========================================================================
    # 2. Basic Usage
    # =========================================================================
    st.header("2. Basic Usage")
    st.markdown(
        """
        The simplest way to use `advanced_dataframe`. Just pass a DataFrame!

        **Parameters shown:**
        - `data` - The DataFrame to display (required)
        - `height` - Table height in pixels (default: 600)
        - `use_container_width` - Expand to fill container width (default: False)
        - `key` - Unique component key
        """
    )

    df_basic = pd.DataFrame(
        {
            "name": ["Alice", "Bob", "Charlie", "Diana", "Eve"],
            "age": [25, 30, 35, 28, 32],
            "city": ["New York", "London", "Tokyo", "Paris", "Sydney"],
            "score": [85.5, 92.0, 78.5, 88.0, 95.5],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
# Minimal usage
advanced_dataframe(data=df, key="basic_table")

# With height customization
advanced_dataframe(data=df, height=300, key="basic_height")

# Expand to container width
advanced_dataframe(data=df, use_container_width=True, key="basic_width")
''',
            language="python",
        )

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Default width (fit-content):**")
        advanced_dataframe(data=df_basic, height=250, key="basic_default")

    with col2:
        st.markdown("**use_container_width=True:**")
        advanced_dataframe(
            data=df_basic, height=250, use_container_width=True, key="basic_full_width"
        )

    st.divider()

    # =========================================================================
    # 3. Row Selection
    # =========================================================================
    st.header("3. Row Selection")
    st.markdown(
        """
        Enable row selection with `selection_mode` parameter.

        **Options:**
        - `None` (default) - Selection disabled
        - `"single-row"` - Only one row can be selected
        - `"multi-row"` - Multiple rows can be selected
        """
    )

    df_selection = pd.DataFrame(
        {
            "employee": ["John Smith", "Jane Doe", "Bob Wilson", "Alice Brown"],
            "department": ["Engineering", "Marketing", "Sales", "Engineering"],
            "salary": [75000, 65000, 55000, 80000],
            "years": [5, 3, 7, 2],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
# Single row selection
selected = advanced_dataframe(
    data=df,
    selection_mode="single-row",
    key="single_select",
)

# Multi-row selection
selected = advanced_dataframe(
    data=df,
    selection_mode="multi-row",
    key="multi_select",
)

# Use selected rows
if selected:
    st.write(df.iloc[selected])
''',
            language="python",
        )

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Single-row selection:**")
        selected_single = advanced_dataframe(
            data=df_selection,
            height=250,
            selection_mode="single-row",
            key="single_select",
        )
        if selected_single:
            st.info(f"Selected row index: {selected_single[0]}")

    with col2:
        st.markdown("**Multi-row selection:**")
        selected_multi = advanced_dataframe(
            data=df_selection,
            height=250,
            selection_mode="multi-row",
            key="multi_select",
        )
        if selected_multi:
            st.info(f"Selected row indices: {selected_multi}")

    st.divider()

    # =========================================================================
    # 4. Column Filtering
    # =========================================================================
    st.header("4. Column Filtering")
    st.markdown(
        """
        Enable column filters with `filterable_columns`.
        Filter types are **auto-detected** based on column data type:

        | Data Type | Filter Type |
        |-----------|-------------|
        | String | Text search |
        | Number | Range slider |
        | Boolean | Checkbox |
        | Date | Date range |
        """
    )

    df_filter = pd.DataFrame(
        {
            "title": [
                "The Great Gatsby",
                "1984",
                "To Kill a Mockingbird",
                "Pride and Prejudice",
                "The Catcher in the Rye",
                "Lord of the Flies",
                "Animal Farm",
                "Brave New World",
            ],
            "author": [
                "F. Scott Fitzgerald",
                "George Orwell",
                "Harper Lee",
                "Jane Austen",
                "J.D. Salinger",
                "William Golding",
                "George Orwell",
                "Aldous Huxley",
            ],
            "year": [1925, 1949, 1960, 1813, 1951, 1954, 1945, 1932],
            "pages": [180, 328, 281, 432, 277, 224, 112, 288],
            "rating": [4.2, 4.5, 4.3, 4.1, 3.9, 3.8, 4.4, 4.0],
            "available": [True, True, False, True, False, True, True, False],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
advanced_dataframe(
    data=df,
    filterable_columns=["title", "author", "year", "pages", "rating", "available"],
    show_row_count=True,  # Shows "Showing X of Y rows"
    key="filter_demo",
)
''',
            language="python",
        )

    advanced_dataframe(
        data=df_filter,
        height=350,
        use_container_width=True,
        filterable_columns=["title", "author", "year", "pages", "rating", "available"],
        show_row_count=True,
        key="filter_demo",
    )

    st.divider()

    # =========================================================================
    # 5. Column Configuration (prefix/suffix)
    # =========================================================================
    st.header("5. Column Configuration (Prefix/Suffix)")
    st.markdown(
        """
        Format cell values with `column_config` to add prefixes or suffixes.

        **Options per column:**
        - `prefix` - String before the value (e.g., "$", "¥")
        - `suffix` - String after the value (e.g., "%", " USD")
        """
    )

    df_config = pd.DataFrame(
        {
            "item": ["Laptop", "Phone", "Tablet", "Watch", "Headphones"],
            "price_usd": [999, 699, 449, 299, 199],
            "price_eur": [920, 640, 410, 275, 180],
            "discount": [10, 15, 5, 20, 25],
            "profit_margin": [22.5, 18.3, 25.0, 30.2, 15.8],
            "tax_rate": [8.5, 8.5, 8.5, 8.5, 8.5],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
advanced_dataframe(
    data=df,
    column_config={
        "price_usd": {"prefix": "$"},
        "price_eur": {"prefix": "€"},
        "discount": {"suffix": "% OFF"},
        "profit_margin": {"prefix": "+", "suffix": "%"},
        "tax_rate": {"suffix": "%"},
    },
    key="config_demo",
)
''',
            language="python",
        )

    advanced_dataframe(
        data=df_config,
        height=280,
        use_container_width=True,
        column_config={
            "price_usd": {"prefix": "$"},
            "price_eur": {"prefix": "€"},
            "discount": {"suffix": "% OFF"},
            "profit_margin": {"prefix": "+", "suffix": "%"},
            "tax_rate": {"suffix": "%"},
        },
        show_summary=True,
        key="config_demo",
    )

    st.divider()

    # =========================================================================
    # 6. Column Order
    # =========================================================================
    st.header("6. Column Order")
    st.markdown(
        """
        Control which columns to display and their order with `column_order`.

        - Only listed columns are shown
        - Columns appear in the specified order
        - Useful for hiding internal/technical columns
        """
    )

    df_order = pd.DataFrame(
        {
            "id": [1, 2, 3, 4, 5],
            "internal_code": ["X001", "X002", "X003", "X004", "X005"],
            "customer_name": ["Acme Corp", "Tech Inc", "Global Ltd", "Local Co", "Big Corp"],
            "email": [
                "acme@example.com",
                "tech@example.com",
                "global@example.com",
                "local@example.com",
                "big@example.com",
            ],
            "revenue": [50000, 75000, 120000, 30000, 200000],
            "created_at": ["2024-01-15", "2024-02-20", "2024-03-10", "2024-04-05", "2024-05-01"],
            "updated_at": ["2024-06-01", "2024-06-15", "2024-06-20", "2024-06-25", "2024-06-30"],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
# Show only selected columns in custom order
advanced_dataframe(
    data=df,
    column_order=["customer_name", "email", "revenue", "created_at"],
    key="order_demo",
)
''',
            language="python",
        )

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**All columns (default):**")
        advanced_dataframe(
            data=df_order,
            height=250,
            key="order_all",
        )

    with col2:
        st.markdown("**Custom column order:**")
        advanced_dataframe(
            data=df_order,
            height=250,
            column_order=["customer_name", "email", "revenue", "created_at"],
            key="order_custom",
        )

    st.divider()

    # =========================================================================
    # 7. Header Groups
    # =========================================================================
    st.header("7. Header Groups")
    st.markdown(
        """
        Group related columns under merged headers with `header_groups`.

        **Configuration format:**
        ```python
        header_groups=[
            {"header": "Group Name", "columns": ["col1", "col2"]},
            ...
        ]
        ```
        """
    )

    df_groups = pd.DataFrame(
        {
            "student": ["Emma", "Liam", "Olivia", "Noah", "Ava"],
            "grade": ["A", "B+", "A-", "B", "A"],
            "math": [95, 82, 88, 79, 92],
            "science": [88, 85, 92, 81, 90],
            "english": [92, 78, 85, 83, 95],
            "attendance": [98, 92, 95, 88, 99],
            "participation": [90, 85, 88, 80, 95],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
advanced_dataframe(
    data=df,
    header_groups=[
        {"header": "Student Info", "columns": ["student", "grade"]},
        {"header": "Academic Scores", "columns": ["math", "science", "english"]},
        {"header": "Engagement", "columns": ["attendance", "participation"]},
    ],
    key="groups_demo",
)
''',
            language="python",
        )

    advanced_dataframe(
        data=df_groups,
        height=280,
        use_container_width=True,
        header_groups=[
            {"header": "Student Info", "columns": ["student", "grade"]},
            {"header": "Academic Scores", "columns": ["math", "science", "english"]},
            {"header": "Engagement", "columns": ["attendance", "participation"]},
        ],
        column_config={
            "attendance": {"suffix": "%"},
            "participation": {"suffix": "%"},
        },
        show_summary=True,
        key="groups_demo",
    )

    st.divider()

    # =========================================================================
    # 8. Expandable Rows
    # =========================================================================
    st.header("8. Expandable Rows")
    st.markdown(
        """
        Display hierarchical data with expandable rows using `expandable=True`.

        **Requirements:**
        - Data must contain nested rows under `subRows` key (or custom key via `sub_rows_key`)
        - Supports multiple nesting levels (recommended: ≤5 levels)
        """
    )

    df_expandable = pd.DataFrame(
        [
            {
                "region": "North America",
                "revenue": 500000,
                "growth": 12.5,
                "profitable": True,
                "subRows": [
                    {
                        "region": "USA",
                        "revenue": 350000,
                        "growth": 10.2,
                        "profitable": True,
                        "subRows": [
                            {"region": "California", "revenue": 150000, "growth": 15.0, "profitable": True},
                            {"region": "New York", "revenue": 120000, "growth": 8.5, "profitable": True},
                            {"region": "Texas", "revenue": 80000, "growth": 5.0, "profitable": False},
                        ],
                    },
                    {"region": "Canada", "revenue": 100000, "growth": 18.0, "profitable": True},
                    {"region": "Mexico", "revenue": 50000, "growth": 22.0, "profitable": False},
                ],
            },
            {
                "region": "Europe",
                "revenue": 400000,
                "growth": 8.0,
                "profitable": True,
                "subRows": [
                    {"region": "UK", "revenue": 150000, "growth": 5.5, "profitable": True},
                    {"region": "Germany", "revenue": 130000, "growth": 7.0, "profitable": True},
                    {"region": "France", "revenue": 120000, "growth": 12.0, "profitable": True},
                ],
            },
            {
                "region": "Asia Pacific",
                "revenue": 300000,
                "growth": 25.0,
                "profitable": True,
                "subRows": [
                    {"region": "Japan", "revenue": 120000, "growth": 3.0, "profitable": True},
                    {"region": "China", "revenue": 100000, "growth": 35.0, "profitable": True},
                    {"region": "Australia", "revenue": 80000, "growth": 15.0, "profitable": True},
                ],
            },
        ]
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
# Data structure with subRows
df = pd.DataFrame([
    {
        "region": "North America",
        "revenue": 500000,
        "subRows": [
            {"region": "USA", "revenue": 350000, "subRows": [...]},
            {"region": "Canada", "revenue": 100000},
        ]
    },
    ...
])

# Enable expandable rows
selected = advanced_dataframe(
    data=df,
    expandable=True,
    selection_mode="single-row",
    key="expandable_demo",
)
''',
            language="python",
        )

    selected_expand = advanced_dataframe(
        data=df_expandable,
        height=400,
        use_container_width=True,
        expandable=True,
        selection_mode="single-row",
        filterable_columns=["region", "revenue", "growth", "profitable"],
        column_config={
            "revenue": {"prefix": "$"},
            "growth": {"suffix": "%"},
        },
        show_row_count=True,
        key="expandable_demo",
    )

    if selected_expand:
        st.info(f"Selected row index: {selected_expand}")

    st.divider()

    # =========================================================================
    # 9. Summary Row
    # =========================================================================
    st.header("9. Summary Row")
    st.markdown(
        """
        Display aggregated values with `show_summary` (enabled by default).

        **Automatic calculations:**
        - **Numeric columns**: Sum of values
        - **Boolean columns**: Percentage of True values
        - **Other columns**: Empty
        """
    )

    df_summary = pd.DataFrame(
        {
            "project": ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
            "budget": [100000, 150000, 80000, 200000, 120000],
            "spent": [85000, 140000, 75000, 180000, 95000],
            "tasks": [45, 62, 38, 85, 50],
            "completed": [True, False, True, True, False],
            "on_track": [True, True, True, False, True],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
# Summary row enabled (default)
advanced_dataframe(
    data=df,
    show_summary=True,
    key="summary_on",
)

# Summary row disabled
advanced_dataframe(
    data=df,
    show_summary=False,
    key="summary_off",
)
''',
            language="python",
        )

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**show_summary=True (default):**")
        advanced_dataframe(
            data=df_summary,
            height=280,
            show_summary=True,
            column_config={
                "budget": {"prefix": "$"},
                "spent": {"prefix": "$"},
            },
            key="summary_on",
        )

    with col2:
        st.markdown("**show_summary=False:**")
        advanced_dataframe(
            data=df_summary,
            height=280,
            show_summary=False,
            column_config={
                "budget": {"prefix": "$"},
                "spent": {"prefix": "$"},
            },
            key="summary_off",
        )

    st.divider()

    # =========================================================================
    # 10. Virtual Scrolling Performance
    # =========================================================================
    st.header("10. Virtual Scrolling Performance")
    st.markdown(
        """
        Handle large datasets efficiently with built-in virtual scrolling.

        **Performance:**
        - Renders only visible rows
        - Maintains 60fps even with 100,000+ rows
        - No configuration needed - automatic!
        """
    )

    # Generate 10,000 rows
    random.seed(123)
    statuses = ["Active", "Pending", "Completed", "Cancelled"]
    priorities = ["Low", "Medium", "High", "Critical"]

    df_large = pd.DataFrame(
        {
            "id": [f"TKT-{i:06d}" for i in range(1, 10001)],
            "title": [f"Support Ticket #{i}" for i in range(1, 10001)],
            "status": [random.choice(statuses) for _ in range(10000)],
            "priority": [random.choice(priorities) for _ in range(10000)],
            "response_time": [random.randint(1, 72) for _ in range(10000)],
            "satisfaction": [round(random.uniform(1.0, 5.0), 1) for _ in range(10000)],
            "resolved": [random.choice([True, False]) for _ in range(10000)],
        }
    )

    with st.expander("View Code", expanded=False):
        st.code(
            '''
# 10,000 rows - virtual scrolling is automatic
advanced_dataframe(
    data=df_large,  # 10,000 rows
    height=500,
    use_container_width=True,
    filterable_columns=[...],
    show_row_count=True,
    key="large_demo",
)
''',
            language="python",
        )

    st.info("📊 **10,000 rows** - Try scrolling, filtering, and sorting!")

    advanced_dataframe(
        data=df_large,
        height=500,
        use_container_width=True,
        filterable_columns=["title", "status", "priority", "response_time", "satisfaction", "resolved"],
        show_row_count=True,
        column_config={
            "response_time": {"suffix": "h"},
        },
        show_summary=True,
        key="large_demo",
    )

    # =========================================================================
    # Footer
    # =========================================================================
    st.divider()
    st.markdown(
        """
        ---
        **Advanced DataFrame** - Built with [TanStack Table](https://tanstack.com/table)
        for [Streamlit](https://streamlit.io)

        [GitHub Repository](https://github.com/j4rviscmd/streamlit-advanced-dataframe)
        """
    )


if __name__ == "__main__":
    main()
