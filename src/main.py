import streamlit as st

from components.advanced_dataframe.my_component import (
    my_component as advanced_dataframe,
)


def main():
    TITLE = "Sample App"
    st.set_page_config(page_title=TITLE, layout="wide")
    st.title(TITLE)
    advanced_dataframe("piyo")


if __name__ == "__main__":
    main()
