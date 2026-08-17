import pandas as pd
import os

from clean_data import clean_dataset
from transform import transform, transform_images
from load_db import (
    insert_dataframe,
    get_property_url_mapping,
    insert_images_dataframe,
    backfill_main_image,
)


def main():
    raw_file = "data/properties_raw.csv"
    images_file = "data/property_images_raw.csv"
    clean_file = "data/batdongsan_clean.csv"

    print("===== PHẦN 1: XỬ LÝ PROPERTY =====")
    print("Bước 1: Đọc và làm sạch dữ liệu...")

    if not os.path.exists(raw_file):
        print(f"❌ Không tìm thấy {raw_file}. Chạy crawler.py trước.")
        return

    clean_dataset(raw_file, clean_file)

    if not os.path.exists(clean_file):
        print("❌ Lỗi: Không tạo được file dữ liệu sạch!")
        return

    print("\nBước 2: Chuẩn bị transform dữ liệu...")
    df_clean = pd.read_csv(clean_file)

    if df_clean.empty:
        print("❌ File sạch không có dòng nào. Dừng.")
        return

    property_df = transform(df_clean)

    if property_df.empty:
        print("❌ Sau transform không còn dòng nào. Dừng.")
        return

    print(f"\nBước 3: Bắt đầu đẩy {len(property_df)} dòng vào Database...")
    insert_dataframe(property_df)

    print("\n===== PHẦN 2: XỬ LÝ HÌNH ẢNH =====")
    print("Bước 4: Đọc dữ liệu hình ảnh và query DB mapping...")

    try:
        img_df = pd.read_csv(images_file)
        mapping_df = get_property_url_mapping()

        print(f"   Ảnh trong CSV     : {len(img_df)}")
        print(f"   Property trong DB : {len(mapping_df)}")

        print("Bước 5: Map Foreign Key cho hình ảnh...")
        images_ready_df = transform_images(img_df, mapping_df)

        print(f"Bước 6: Bắt đầu đẩy {len(images_ready_df)} hình ảnh vào Database...")
        insert_images_dataframe(images_ready_df)

    except FileNotFoundError:
        print(f"⚠️ Không tìm thấy file hình ảnh {images_file}, bỏ qua phần insert ảnh.")

    print("\n===== PHẦN 3: BACKFILL ẢNH ĐẠI DIỆN =====")
    print("Bước 7: Bù main_image cho các tin còn thiếu...")
    backfill_main_image()

    print("\n🎉 HOÀN TẤT TOÀN BỘ DATA PIPELINE!")


if __name__ == "__main__":
    main()