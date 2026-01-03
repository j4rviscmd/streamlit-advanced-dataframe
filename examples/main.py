import pandas as pd
import streamlit as st

from streamlit_advanced_dataframe import advanced_dataframe


def main():
    TITLE = "Advanced DataFrame"
    st.set_page_config(page_title=TITLE, layout="wide")
    st.title(TITLE)

    empty = pd.DataFrame(columns=["A", "B", "C"])
    advanced_dataframe(empty, show_summary=False)
    st.dataframe(empty)

    # サンプルデータ3: 数値データ
    st.header("13. 数値データのソート確認")
    df_numbers = pd.DataFrame(
        {
            "整数": [10, 5, 8, 3, 15, 1, 12],
            "小数": [3.14, 2.71, 1.41, 9.81, 6.28, 4.67, 8.85],
            "負の数": [-5, 10, -3, 8, -12, 0, 7],
        }
    )
    advanced_dataframe(
        data=df_numbers,
        height=250,
        key="numbers_table",
        use_container_width=True,
    )

    # Phase 4: 集計行のデモ（100行データでスクロール確認）
    st.header("1. 集計行機能デモ(100行データ)")

    # 100行のランダムデータを生成（カラムを増やして横スクロール確認）
    import random

    random.seed(42)  # 再現性のため

    categories = [
        "食品",
        "家電",
        "衣類",
        "書籍",
        "雑貨",
        "スポーツ",
        "玩具",
        "美容",
    ]
    manufacturers = [
        "メーカーAメーカーAメーカーAメーカーA",
        "メーカーB",
        "メーカーC",
        "メーカーD",
        "メーカーE",
    ]
    df_100 = pd.DataFrame(
        {
            "商品ID": [f"P{i:04d}" for i in range(1, 101)],
            "商品名": [f"商品{i}" for i in range(1, 101)],
            "カテゴリ": [random.choice(categories) for _ in range(100)],
            "メーカー": [random.choice(manufacturers) for _ in range(100)],
            "価格": [random.randint(500, 50000) for _ in range(100)],
            "原価": [random.randint(300, 30000) for _ in range(100)],
            "在庫数": [random.randint(0, 100) for _ in range(100)],
            "販売数": [random.randint(0, 500) for _ in range(100)],
            "評価": [round(random.uniform(3.0, 5.0), 1) for _ in range(100)],
            "在庫あり": [random.choice([True, False]) for _ in range(100)],
            "セール中": [random.choice([True, False]) for _ in range(100)],
            "新商品": [random.choice([True, False]) for _ in range(100)],
        }
    )

    st.markdown("**集計行に注目:** スクロールしても下部に固定されています")

    advanced_dataframe(
        data=df_100,
        height=400,
        # use_container_width=True,
        filterable_columns=[
            "カテゴリ",
            "メーカー",
            "価格",
            "原価",
            "在庫数",
            "販売数",
            "在庫あり",
            "セール中",
            "新商品",
        ],
        show_row_count=True,
        show_summary=False,
        key="aggregation_100_table",
    )

    # 仮想スクロールのパフォーマンステスト（10,000行）
    st.header("2. 仮想スクロールパフォーマンステスト(10,000行)")
    # 10,000行のランダムデータを生成
    df_10000 = pd.DataFrame(
        {
            "ID": [f"ID{i:05d}" for i in range(1, 10001)],
            "商品名": [f"商品{i}" for i in range(1, 10001)],
            "カテゴリ": [random.choice(categories) for _ in range(10000)],
            "メーカー": [random.choice(manufacturers) for _ in range(10000)],
            "価格": [random.randint(500, 50000) for _ in range(10000)],
            "在庫数": [random.randint(0, 100) for _ in range(10000)],
            "販売数": [random.randint(0, 500) for _ in range(10000)],
            "在庫あり": [random.choice([True, False]) for _ in range(10000)],
            "セール中": [random.choice([True, False]) for _ in range(10000)],
        }
    )

    st.markdown(
        "**パフォーマンステスト:** スクロール、ソート、フィルタ、検索の応答性を確認してください"
    )

    st.dataframe(df_10000, hide_index=True)
    advanced_dataframe(
        data=df_10000,
        use_container_width=True,
        height=600,
        # filterable_columns=[
        #     "カテゴリ",
        #     "メーカー",
        #     "価格",
        #     "在庫数",
        #     "在庫あり",
        #     "セール中",
        # ],
        show_row_count=True,
        show_summary=True,
        key="virtual_scroll_10000_table",
    )

    # Phase 4: 行展開機能 + 行選択機能 + 集計行のデモ（最新機能を上に配置）
    st.header("3. 行展開 + 行選択 + 集計行機能")
    # 階層データを作成（最大4階層のネスト例）
    expandable_data = pd.DataFrame(
        [
            {
                "カテゴリ": "食品",
                "売上": 50000,
                "在庫": 150,
                "在庫あり": True,
                "セール中": False,
                "subRows": [
                    {
                        "カテゴリ": "野菜",
                        "売上": 20000,
                        "在庫": 60,
                        "在庫あり": True,
                        "セール中": True,
                        "subRows": [
                            {
                                "カテゴリ": "キャベツ",
                                "売上": 8000,
                                "在庫": 25,
                                "在庫あり": True,
                                "セール中": False,
                            },
                            {
                                "カテゴリ": "トマト",
                                "売上": 12000,
                                "在庫": 35,
                                "在庫あり": True,
                                "セール中": True,
                            },
                        ],
                    },
                    {
                        "カテゴリ": "果物",
                        "売上": 30000,
                        "在庫": 90,
                        "在庫あり": True,
                        "セール中": False,
                        "subRows": [
                            {
                                "カテゴリ": "りんご",
                                "売上": 15000,
                                "在庫": 45,
                                "在庫あり": True,
                                "セール中": False,
                            },
                            {
                                "カテゴリ": "みかん",
                                "売上": 15000,
                                "在庫": 45,
                                "在庫あり": True,
                                "セール中": True,
                                "subRows": [
                                    {
                                        "カテゴリ": "愛媛産",
                                        "売上": 8000,
                                        "在庫": 25,
                                        "在庫あり": True,
                                        "セール中": False,
                                    },
                                    {
                                        "カテゴリ": "和歌山産",
                                        "売上": 7000,
                                        "在庫": 20,
                                        "在庫あり": False,
                                        "セール中": True,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                "カテゴリ": "家電",
                "売上": 120000,
                "在庫": 45,
                "在庫あり": True,
                "セール中": True,
                "subRows": [
                    {
                        "カテゴリ": "テレビ",
                        "売上": 80000,
                        "在庫": 20,
                        "在庫あり": True,
                        "セール中": True,
                        "subRows": [
                            {
                                "カテゴリ": "4K",
                                "売上": 50000,
                                "在庫": 12,
                                "在庫あり": True,
                                "セール中": False,
                            },
                            {
                                "カテゴリ": "8K",
                                "売上": 30000,
                                "在庫": 8,
                                "在庫あり": False,
                                "セール中": True,
                            },
                        ],
                    },
                    {
                        "カテゴリ": "冷蔵庫",
                        "売上": 40000,
                        "在庫": 25,
                        "在庫あり": True,
                        "セール中": False,
                    },
                ],
            },
            {
                "カテゴリ": "衣類",
                "売上": 35000,
                "在庫": 200,
                "在庫あり": True,
                "セール中": False,
                "subRows": [
                    {
                        "カテゴリ": "メンズ",
                        "売上": 15000,
                        "在庫": 80,
                        "在庫あり": True,
                        "セール中": False,
                    },
                    {
                        "カテゴリ": "レディース",
                        "売上": 20000,
                        "在庫": 120,
                        "在庫あり": True,
                        "セール中": True,
                    },
                ],
            },
        ]
    )

    selected_expandable_row = advanced_dataframe(
        data=expandable_data,
        height=400,
        expandable=True,
        selection_mode="single-row",
        filterable_columns=["カテゴリ", "売上", "在庫", "在庫あり", "セール中"],
        show_row_count=True,
        key="expandable_selection_table",
    )

    if selected_expandable_row is not None:
        st.success(f"選択された行: {selected_expandable_row}")
        st.write("選択された行のデータ:")
        st.dataframe(
            expandable_data.iloc[[selected_expandable_row]],
            use_container_width=True,
        )
    else:
        st.info("行が選択されていません")

    # Phase 3: ヘッダ結合（カラムグループ）機能のデモ
    st.header("4. ヘッダ結合（カラムグループ）機能（Phase 3）")

    df_groups = pd.DataFrame(
        {
            "商品名": ["商品A", "商品B", "商品C", "商品D", "商品E"],
            "カテゴリ": ["食品", "家電", "衣類", "書籍", "雑貨"],
            "価格": [1000, 2000, 1500, 3000, 2500],
            "在庫数": [50, 30, 45, 20, 35],
            "販売数": [120, 85, 95, 60, 110],
            "評価": [4.5, 4.8, 4.2, 4.0, 4.6],
        }
    )

    st.markdown(
        """
    **ヘッダ結合のデモ:** 「基本情報」「在庫情報」「評価」の3つのグループ
    """
    )

    advanced_dataframe(
        data=df_groups,
        filterable_columns=[*df_groups.columns],
        height=300,
        header_groups=[
            {"header": "基本情報", "columns": ["商品名", "カテゴリ"]},
            {"header": "在庫情報", "columns": ["価格", "在庫数", "販売数"]},
            {"header": "評価", "columns": ["評価"]},
        ],
        key="groups_table",
    )

    # エラーケース検証: 数値と文字列が混在したカラム
    st.header("14. 混在データテスト（数値 + 文字列）")
    st.markdown(
        """
    **テスト項目:**
    - 「価格」カラム: 数値と文字列（"未定"、"N/A"など）が混在
    - 「在庫」カラム: 数値とNone/nullが混在
    - 「評価」カラム: 数値と空文字が混在
    """
    )

    df_mixed = pd.DataFrame(
        {
            "商品名": ["商品A", "商品B", "商品C", "商品D", "商品E", "商品F"],
            "価格": [
                1000,
                "未定",
                2500,
                "N/A",
                3000,
                "要問合せ",
            ],  # 数値+文字列
            "在庫": [50, None, 30, 0, None, 100],  # 数値+None
            "評価": [4.5, 4.2, "", 3.8, "★★★", 4.9],  # 数値+空文字+絵文字
            "カテゴリ": ["食品", "家電", "衣類", "書籍", "雑貨", "食品"],
        }
    )

    st.write("元データ:")
    st.dataframe(df_mixed, hide_index=True)

    st.write("advanced_dataframe で表示:")
    advanced_dataframe(
        data=df_mixed,
        height=300,
        filterable_columns=["価格", "在庫", "評価", "カテゴリ"],
        show_row_count=True,
        key="mixed_data_table",
    )


if __name__ == "__main__":
    main()
