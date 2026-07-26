import pandas as pd
import os

from config import CSV_FILE
from clean_data import clean_dataset
from transform import transform, transform_images
from load_db import insert_dataframe, get_property_url_mapping, insert_images_dataframe


def main():
    raw_file = CSV_FILE
    images_file = "data/batdongsan_images_1.csv"

    # ĐỔI TÊN FILE NÀY ĐỂ KHÔNG GHI ĐÈ FILE GỐC
    clean_file = "data/batdongsan_clean_1.csv"

    print("===== PHẦN 1: XỬ LÝ PROPERTY =====")
    print("Bước 1: Đọc và làm sạch dữ liệu (Lọc Null, Thỏa thuận)...")
    clean_dataset(raw_file, clean_file)

    if not os.path.exists(clean_file):
        print("❌ Lỗi: Không tạo được file dữ liệu sạch!")
        return

    print("\nBước 2: Chuẩn bị transform dữ liệu...")
    df_clean = pd.read_csv(clean_file)
    property_df = transform(df_clean)

    print(f"Bước 3: Bắt đầu đẩy {len(property_df)} dòng vào Database...")
    insert_dataframe(property_df)

    print("\n===== PHẦN 2: XỬ LÝ HÌNH ẢNH =====")
    print("Bước 4: Đọc dữ liệu hình ảnh và query DB mapping...")
    try:
        img_df = pd.read_csv(images_file)
        mapping_df = get_property_url_mapping()

        print("Bước 5: Map Foreign Key cho hình ảnh...")
        images_ready_df = transform_images(img_df, mapping_df)

        print(f"Bước 6: Bắt đầu đẩy {len(images_ready_df)} hình ảnh vào Database...")
        insert_images_dataframe(images_ready_df)

    except FileNotFoundError:
        print(f"⚠️ Không tìm thấy file hình ảnh {images_file}, bỏ qua phần insert ảnh.")

    print("\n🎉 HOÀN TẤT TOÀN BỘ DATA PIPELINE!")


if __name__ == "__main__":
    main()