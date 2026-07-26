import pandas as pd
import os

from clean_data import clean_dataset
from transform import transform, transform_images
from load_db import insert_dataframe, get_property_url_mapping, insert_images_dataframe


def main():
    # TRỎ ĐÚNG ĐƯỜNG DẪN ĐẾN BỘ DỮ LIỆU THÔ SỐ 2
    raw_file = "data/batdongsan_live_2.csv"
    images_file = "data/batdongsan_images_2.csv"
    clean_file = "data/batdongsan_clean_2.csv"

    print("===== PHẦN 1: XỬ LÝ PROPERTY (BỘ SỐ 2) =====")
    print("Bước 1: Đọc và làm sạch dữ liệu...")
    clean_dataset(raw_file, clean_file)

    if not os.path.exists(clean_file):
        print("❌ Lỗi: Không tạo được file dữ liệu sạch số 2!")
        return

    print("\nBước 2: Chuẩn bị transform dữ liệu...")
    df_clean = pd.read_csv(clean_file)
    property_df = transform(df_clean)

    print(f"Bước 3: Bắt đầu đẩy {len(property_df)} dòng vào Database...")
    insert_dataframe(property_df)

    print("\n===== PHẦN 2: XỬ LÝ HÌNH ẢNH (BỘ SỐ 2) =====")
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

    print("\n🎉 HOÀN TẤT TOÀN BỘ DATA PIPELINE - BỘ SỐ 2!")


if __name__ == "__main__":
    main()