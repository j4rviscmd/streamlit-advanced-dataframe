import pandas as pd
import streamlit as st

from components.advanced_dataframe.my_component import advanced_dataframe


def main():
    TITLE = "Advanced DataFrame - Phase 1 Demo"
    st.set_page_config(page_title=TITLE, layout="wide")
    st.title(TITLE)

    st.markdown(
        """
    ## Phase 1機能デモ

    実装済み機能:
    - ✅ 基本的なデータ表示
    - ✅ カラムソート（ヘッダをクリック）
    - ✅ カラム幅のリサイズ（ヘッダの右端をドラッグ）
    - ✅ Streamlitテーマ対応
    """
    )

    # サンプルデータ1: 基本的なデータ
    st.header("1. 基本的なテーブル表示")
    df_basic = pd.DataFrame(
        {
            "名前": ["Alice", "Bob", "Charlie", "David", "Eve"],
            "年齢": [25, 30, 35, 28, 32],
            "都市": ["東京", "大阪", "京都", "福岡", "札幌"],
            "スコア": [85, 92, 78, 88, 95],
        }
    )

    st.write("**標準のst.dataframe（比較用）:**")
    st.dataframe(df_basic, height=200)

    st.write("**advanced_dataframe（Phase 1版）:**")
    advanced_dataframe(data=df_basic, height=350, key="basic_table")

    # サンプルデータ2: 多数のカラム
    st.header("2. 多数のカラムを持つテーブル")
    df_many_cols = pd.DataFrame(
        {
            "ID": range(1, 11),
            "商品名": [f"商品{i}" for i in range(1, 11)],
            "カテゴリ": ["食品", "家電", "衣類", "書籍", "雑貨"] * 2,
            "価格": [
                1000,
                25000,
                3500,
                1200,
                800,
                2000,
                35000,
                4500,
                1500,
                900,
            ],
            "在庫数": [50, 10, 30, 100, 75, 20, 5, 40, 80, 60],
            "評価": [4.5, 4.8, 4.2, 4.0, 4.6, 4.3, 4.9, 4.1, 4.4, 4.7],
        }
    )

    advanced_dataframe(data=df_many_cols, height=350, key="many_cols_table")

    # サンプルデータ3: 数値データ
    st.header("3. 数値データのソート確認")
    df_numbers = pd.DataFrame(
        {
            "整数": [10, 5, 8, 3, 15, 1, 12],
            "小数": [3.14, 2.71, 1.41, 9.81, 6.28, 4.67, 8.85],
            "負の数": [-5, 10, -3, 8, -12, 0, 7],
        }
    )

    st.write("各カラムをクリックしてソート順を確認してください（昇順↑/降順↓）")
    advanced_dataframe(data=df_numbers, height=250, key="numbers_table")

    # 使い方説明
    st.header("使い方")
    st.markdown(
        """
    ### ソート
    - カラムヘッダをクリックすると、そのカラムでソートされます
    - 2回クリックすると降順↓になります
    - 3回クリックするとソートが解除されます

    ### カラム幅のリサイズ
    - カラムヘッダの右端にマウスを持っていくと、リサイズハンドルが表示されます
    - ドラッグして幅を調整できます

    ### テーマ
    - Streamlitのテーマ設定（Settings > Theme）を変更すると、テーブルの色も自動的に変わります
    """
    )


if __name__ == "__main__":
    main()
