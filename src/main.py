import pandas as pd
import streamlit as st

from components.advanced_dataframe.my_component import (
    my_component as advanced_dataframe,
)


def main():
    TITLE = "Advanced DataFrame - Phase 1, 2, 3 & 4 Demo"
    st.set_page_config(page_title=TITLE, layout="wide")
    st.title(TITLE)

    st.markdown(
        """
    ## 実装済み機能

    ### Phase 1:
    - ✅ 基本的なデータ表示
    - ✅ カラムソート（ヘッダをクリック）
    - ✅ カラム幅のリサイズ（ヘッダの右端をドラッグ）
    - ✅ Streamlitテーマ対応
    - ✅ セル選択とクリップボードコピー
    - ✅ 数値カラムの自動検出と右寄せ、3桁区切り表示

    ### Phase 2:
    - ✅ 行選択（単一行選択）
    - ✅ カラムフィルタ（テキスト検索）
    - ✅ カラムフィルタ（テキスト + 複数選択）
    - ✅ カラムフィルタ（数値範囲）
    - ✅ カラムフィルタ（日付範囲）
    - ✅ グローバル検索（全カラム横断検索、一致箇所ハイライト）

    ### Phase 3:
    - ✅ カラム並び替え（ドラッグ&ドロップ）
    - ✅ カラム表示/非表示
    - ✅ ヘッダ結合（カラムグループ）

    ### Phase 4:
    - ✅ 行展開（階層データ表示）
    - ✅ 集計行（数値合計、Bool率表示、スクロール固定） ← NEW!
    """
    )

    # Phase 4: 集計行のデモ（100行データでスクロール確認）
    st.header("1. 集計行機能デモ（100行データ）← NEW!")
    st.markdown(
        """
    **集計行の動作確認用に100行のランダムデータを生成:**
    - 数値カラム（価格、在庫数）の合計
    - Boolean型カラム（在庫あり、セール中）のTrue率
    - テーブルをスクロールしても集計行が下部に固定表示される
    """
    )

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
        "メーカーA",
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
        # full_width=True,
        enable_filters=[
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
        show_filter_records=True,
        show_aggregation=True,
        key="aggregation_100_table",
    )

    # 仮想スクロールのパフォーマンステスト（10,000行）
    st.header("2. 仮想スクロールパフォーマンステスト（10,000行）← NEW!")
    st.markdown(
        """
    **@tanstack/react-virtualを使用した仮想スクロール実装:**
    - 10,000行のデータでもスムーズにスクロール可能
    - 表示領域内の行のみをレンダリング（約20-30行）
    - 初期表示時間 < 1秒
    - スクロール性能: 50-60fps
    """
    )

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

    advanced_dataframe(
        data=df_10000,
        height=600,
        enable_filters=["カテゴリ", "メーカー", "価格", "在庫数", "在庫あり", "セール中"],
        show_filter_records=True,
        show_aggregation=True,
        key="virtual_scroll_10000_table",
    )

    # Phase 4: 行展開機能 + 行選択機能 + 集計行のデモ（最新機能を上に配置）
    st.header("3. 行展開 + 行選択 + 集計行機能（Phase 4）← NEW!")
    st.markdown(
        """
    `expandable=True`と`enable_row_selection=True`と`enable_filters`を同時に有効にできます。

    **機能:**
    - ✅ 階層データの展開・折りたたみ（▶/▼ボタン）
    - ✅ チェックボックスで行選択（Streamlitテーマカラー対応）
    - ✅ Boolean型カラムはチェックボックスで表示（読み取り専用）
    - ✅ カラムフィルタ機能（テキスト、数値範囲など）
    - ✅ **集計行（テーブル下部に固定、スクロール時も表示）** ← NEW!
      - 数値カラム: 親行の合計を表示
      - Boolean型カラム: True率を%で表示
    - ✅ サブ行データは`subRows`キーに指定（キー名は`sub_rows_key`でカスタマイズ可能）
    - ✅ 任意の階層レベルをサポート
    """
    )

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

    st.markdown(
        """
    **デモ:** 左端のチェックボックスで行選択、▶ボタンでサブ行を展開してください

    **階層構造:**
    - 食品 → 野菜 → キャベツ/トマト（3階層）
    - 食品 → 果物 → りんご/みかん → 愛媛産/和歌山産（**4階層**）
    - 家電 → テレビ → 4K/8K（3階層）

    **Boolean型カラム:** 「在庫あり」「セール中」はチェックボックスで表示されます

    **フィルタ:** カラムヘッダの🔍アイコンでフィルタリングできます

    **集計行:** テーブル下部に固定表示（スクロールしても隠れません）
    - 「売上」「在庫」: 親行3件（食品、家電、衣類）の合計
    - 「在庫あり」「セール中」: 親行のTrue率を%で表示

    ※ 理論上は**無制限にネスト可能**です（TanStack Tableの仕様）
    """
    )

    selected_expandable_row = advanced_dataframe(
        data=expandable_data,
        height=400,
        expandable=True,
        enable_row_selection=True,
        enable_filters=["カテゴリ", "売上", "在庫", "在庫あり", "セール中"],
        show_filter_records=True,
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
    st.markdown(
        """
    `column_groups`パラメータで複数のカラムをグループ化し、ヘッダを結合できます。

    **機能:**
    - ✅ Python APIでグループ設定を指定（`column_groups=[{'header': '...', 'columns': ['...', '...']}]`）
    - ✅ グループ化されたカラムは1つのヘッダの下にまとめられる
    - ✅ グループに属さないカラムは通常のヘッダとして表示される
    - ✅ 'id'キーは省略可能（省略時は'header'を使用）
    """
    )

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
        enable_filters=[*df_groups.columns],
        height=300,
        column_groups=[
            {"header": "基本情報", "columns": ["商品名", "カテゴリ"]},
            {"header": "在庫情報", "columns": ["価格", "在庫数", "販売数"]},
            {"header": "評価", "columns": ["評価"]},
        ],
        key="groups_table",
    )

    # Phase 3: カラム表示/非表示機能のデモ
    st.header("5. カラム表示/非表示機能（Phase 3）")
    st.markdown(
        """
    `visible_columns`パラメータで表示するカラムを指定できます。

    **機能:**
    - ✅ Python APIで表示カラムを指定（`visible_columns=['カラム名', ...]`）
    - ✅ 指定されたカラムのみが表示される
    - ✅ カラムの表示順序は元のDataFrameの順序に従う
    """
    )

    df_visibility = pd.DataFrame(
        {
            "商品名": ["商品A", "商品B", "商品C", "商品D", "商品E"],
            "価格": [1000, 2000, 1500, 3000, 2500],
            "在庫数": [50, 30, 45, 20, 35],
            "カテゴリ": ["食品", "家電", "衣類", "書籍", "雑貨"],
            "評価": [4.5, 4.8, 4.2, 4.0, 4.6],
            "販売数": [120, 85, 95, 60, 110],
        }
    )

    st.markdown(
        """
    **カラム表示/非表示のデモ:** 「商品名」「価格」「評価」のみを表示
    """
    )

    advanced_dataframe(
        data=df_visibility,
        height=300,
        visible_columns=["商品名", "価格", "評価"],
        key="visibility_table",
    )

    # Phase 3: カラム並び替え機能のデモ
    st.header("6. カラム並び替え機能（Phase 3）")
    st.markdown(
        """
    カラムヘッダをドラッグ&ドロップで並び替えできます。

    **機能:**
    - ✅ ヘッダのドラッグ&ドロップで順序変更
    - ✅ ドラッグ中のカラムは半透明表示
    - ✅ カーソルが移動アイコンに変化
    - ✅ 選択カラム（チェックボックス）は並び替え不可
    """
    )

    df_reorder = pd.DataFrame(
        {
            "商品名": ["商品A", "商品B", "商品C", "商品D", "商品E"],
            "価格": [1000, 2000, 1500, 3000, 2500],
            "在庫数": [50, 30, 45, 20, 35],
            "カテゴリ": ["食品", "家電", "衣類", "書籍", "雑貨"],
            "評価": [4.5, 4.8, 4.2, 4.0, 4.6],
        }
    )

    st.markdown(
        """
    **並び替えのデモ:** カラムヘッダをドラッグして順序を変更してください。
    """
    )

    advanced_dataframe(
        data=df_reorder,
        height=300,
        key="reorder_table",
    )

    # Phase 2: グローバル検索機能のデモ
    st.header("7. グローバル検索機能（Phase 2）")
    st.markdown(
        """
    テーブルにマウスをホバーすると、右上に検索アイコン（🔍）が表示されます。
    クリックすると検索窓が開き、全カラムを対象とした検索が可能です。

    **機能:**
    - ✅ 全カラム横断検索（部分一致）
    - ✅ 一致箇所の赤系ハイライト表示
    - ✅ 一致件数のカウント表示（例: "1 of 2 results"）
    - ✅ ↑↓ボタンで次/前の一致箇所へジャンプ
    - ✅ ×ボタンで検索をクリア・閉じる
    - ✅ Escキーで検索窓を閉じる
    """
    )

    df_search = pd.DataFrame(
        {
            "商品名": [
                "iPhone 15",
                "Galaxy S24",
                "Pixel 8",
                "Xperia 5",
                "AQUOS sense8",
            ],
            "メーカー": ["Apple", "Samsung", "Google", "Sony", "Sharp"],
            "価格": [159800, 139800, 128000, 114800, 39800],
            "カテゴリ": [
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
            ],
        }
    )

    st.markdown(
        """
    **検索のデモ:** テーブルをホバーして右上の🔍アイコンをクリックし、「Apple」「800」などで検索してください。
    """
    )

    advanced_dataframe(
        data=df_search,
        height=300,
        key="search_table",
    )

    # Phase 2: 日付フィルタ機能のデモ
    st.header("8. 日付フィルタ機能（Phase 2）")
    st.markdown(
        """
    日付カラムのフィルタアイコン（🔍）をクリックして、日付範囲でフィルタできます。

    **機能:**
    - ✅ 開始日・終了日を個別に入力（YYYY-MM-DD形式）
    - ✅ 個別クリアボタン（×）とすべてクリアボタン
    """
    )

    df_dates = pd.DataFrame(
        {
            "商品名": [
                "商品A",
                "商品B",
                "商品C",
                "商品D",
                "商品E",
                "商品F",
                "商品G",
                "商品H",
            ],
            "発売日": [
                "2024-01-15",
                "2024-03-20",
                "2024-06-10",
                "2024-09-05",
                "2024-12-01",
                "2024-02-28",
                "2024-07-14",
                "2024-11-23",
            ],
            "価格": [1000, 2000, 1500, 3000, 2500, 1800, 2200, 2800],
            "在庫数": [50, 30, 45, 20, 35, 40, 25, 15],
        }
    )

    st.markdown(
        """
    **フィルタのデモ:** 「発売日」カラムで日付範囲フィルタを試してください。

    **FilterStatus表示:** フィルタ適用時に「全8件中○件を表示」と表示されます（`show_filter_records=True`）
    """
    )

    advanced_dataframe(
        data=df_dates,
        height=400,
        enable_filters=["発売日", "価格", "在庫数"],
        show_filter_records=True,
        key="date_table",
    )

    # Phase 2: カラムフィルタ機能のデモ
    st.header("9. カラムフィルタ機能（Phase 2）")
    st.markdown(
        """
    ヘッダのフィルタアイコン（🔍）をクリックして、フィルタを適用できます。
    フィルタタイプは、カラムのデータ型から自動判定されます。

    **現在実装済み:**
    - ✅ テキストフィルタ（部分一致検索）
    - ✅ テキストフィルタ + 複数選択（ユニーク値10個以下の場合）
    - ✅ 数値範囲フィルタ（最小値・最大値）
    - ✅ 日付範囲フィルタ（開始日・終了日）
    """
    )

    df_filter = pd.DataFrame(
        {
            "商品名": [
                "iPhone 15 Pro",
                "Galaxy S24",
                "Pixel 8 Pro",
                "Xperia 5 V",
                "AQUOS sense8",
                "Redmi Note 13",
                "Nothing Phone (2)",
                "Motorola edge 40",
            ],
            "カテゴリ": [
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
                "スマートフォン",
            ],
            "メーカー": [
                "Apple",
                "Samsung",
                "Google",
                "Sony",
                "Sharp",
                "Xiaomi",
                "Nothing",
                "Motorola",
            ],
            "価格": [
                159800,
                139800,
                128000,
                114800,
                39800,
                29800,
                79800,
                59800,
            ],
            "在庫数": [15, 22, 18, 10, 45, 60, 8, 25],
        }
    )

    st.markdown("**フィルタのデモ:**")
    st.markdown(
        """
        - 「商品名」: テキストフィルタ（部分一致検索）
        - 「メーカー」: テキストフィルタ + 複数選択（ユニーク値が10個以下）
        - 「価格」「在庫数」: 数値範囲フィルタ（最小値・最大値で絞り込み）

    **FilterStatus表示:** フィルタ適用時に「全8件中○件を表示」と表示されます
        """
    )

    advanced_dataframe(
        data=df_filter,
        height=400,
        enable_filters=["商品名", "メーカー", "価格", "在庫数"],
        show_filter_records=True,
        key="filter_table",
    )

    # Phase 2: 行選択機能のデモ
    st.header("10. 行選択機能（Phase 2）+ Boolean型表示")
    df_selection = pd.DataFrame(
        {
            "商品名": [
                "ノートPC",
                "マウス",
                "キーボード",
                "モニター",
                "ヘッドセット",
            ],
            "価格": [120000, 3000, 8000, 45000, 12000],
            "在庫数": [15, 50, 30, 20, 25],
            "在庫あり": [True, True, True, False, True],
            "セール中": [False, True, False, True, False],
            "カテゴリ": [
                "PC",
                "周辺機器",
                "周辺機器",
                "ディスプレイ",
                "オーディオ",
            ],
        }
    )

    st.markdown(
        """
    左端のチェックボックスをクリックして行を選択できます。

    **Boolean型カラムの表示:** 「在庫あり」「セール中」カラムはチェックボックスで表示されます（読み取り専用）
    """
    )

    selected_row = advanced_dataframe(
        data=df_selection,
        height=300,
        enable_row_selection=True,
        key="selection_table",
    )

    if selected_row is not None:
        st.success(f"選択された行: {selected_row}")
        st.write("選択された行のデータ:")
        st.dataframe(
            df_selection.iloc[[selected_row]], use_container_width=True
        )
    else:
        st.info("行が選択されていません")

    # サンプルデータ1: 基本的なデータ
    st.header("11. 基本的なテーブル表示")
    df_basic = pd.DataFrame(
        {
            "名前": ["Alice", "Bob", "Charlie", "David", "Eve"],
            "年齢": [25, 30, 35, 28, 32],
            "都市": ["東京", "大阪", "東京", "福岡", "札幌"],
            "スコア": [85, 92, 78, 88, 95],
        }
    )

    st.write("**標準のst.dataframe（比較用）:**")

    def on_select():
        pass

    st.dataframe(
        df_basic,
        selection_mode="single-row",
        on_select=on_select,
        height=200,
    )

    st.write("**advanced_dataframe（Phase 1版）:**")
    advanced_dataframe(data=df_basic, height=250, key="basic_table")

    # サンプルデータ2: 多数のカラム
    st.header("12. 多数のカラムを持つテーブル")
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

    advanced_dataframe(
        data=df_many_cols,
        height=350,
        key="many_cols_table",
        full_width=True,
    )

    # サンプルデータ3: 数値データ
    st.header("13. 数値データのソート確認")
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
