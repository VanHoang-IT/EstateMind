import time
import random
import re
import pandas as pd
import os

from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# =========================
# INIT DRIVER
# =========================
def init_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    return webdriver.Chrome(options=options)


# =========================
# SAFE TEXT
# =========================
def safe_text(driver, css):
    try:
        return driver.find_element(By.CSS_SELECTOR, css).text.strip()
    except:
        return ""


# =========================
# LAT/LNG EXTRACT (ĐÃ FIX)
# =========================
# Bounding box gần đúng của TP.HCM (sau sáp nhập, bao gồm cả Bình Dương,
# Bà Rịa - Vũng Tàu cũ) — nới rộng một chút để không loại nhầm toạ độ hợp lệ.
HCM_LAT_RANGE = (10.30, 11.20)
HCM_LNG_RANGE = (106.20, 107.60)


def is_valid_hcm_coordinate(lat: float, lng: float) -> bool:
    """Kiểm tra toạ độ có hợp lý nằm trong khu vực TP.HCM không."""
    return (
        HCM_LAT_RANGE[0] <= lat <= HCM_LAT_RANGE[1]
        and HCM_LNG_RANGE[0] <= lng <= HCM_LNG_RANGE[1]
    )


def extract_lat_lng(driver):
    """
    Tìm toạ độ của tin đăng trong script chứa 'getListingRecommendationParams'.

    LƯU Ý: script này có thể chứa toạ độ của NHIỀU tin (bao gồm cả các tin
    "đề xuất/liên quan" ở cuối trang, có thể ở bất kỳ tỉnh thành nào) —
    không chỉ toạ độ của tin đang xem.

    Trước đây code chỉ lấy CẶP LAT/LNG ĐẦU TIÊN tìm thấy trong script ->
    nếu tin đề xuất đầu tiên không phải ở TP.HCM, sẽ lấy nhầm toạ độ sai
    hoàn toàn (đã xảy ra thực tế: nhiều tin bị gán nhầm toạ độ Hà Nội).

    Cách sửa: quét TẤT CẢ các cặp lat/lng tìm được, chỉ chấp nhận cặp đầu
    tiên nằm trong phạm vi hợp lý của TP.HCM. Nếu không có cặp nào hợp lệ
    -> trả về None, None (thà thiếu dữ liệu còn hơn lưu sai vị trí).
    """
    try:
        scripts = driver.find_elements(
            By.XPATH,
            "//script[contains(text(), 'getListingRecommendationParams')]"
        )
        for s in scripts:
            content = s.get_attribute("innerHTML") or s.get_attribute("textContent")
            if not content:
                continue

            lat_matches = re.findall(r'latitude:\s*([-\d.]+)', content)
            lng_matches = re.findall(r'longitude:\s*([-\d.]+)', content)

            for lat_str, lng_str in zip(lat_matches, lng_matches):
                try:
                    lat = float(lat_str)
                    lng = float(lng_str)
                except ValueError:
                    continue

                if is_valid_hcm_coordinate(lat, lng):
                    return lat, lng
                # Nếu không hợp lệ -> bỏ qua, thử cặp tiếp theo trong script

        print("⚠️ Không tìm được toạ độ hợp lệ (TP.HCM) trong script — bỏ trống lat/lng.")
        return None, None

    except Exception as e:
        print("⚠️ lat/lng error:", e)
        return None, None


# =========================
# IMAGES EXTRACT
# =========================
def extract_images(driver):
    """
    Tìm tất cả các thẻ img trong slide ảnh, lấy data-src hoặc src.
    Loại bỏ đoạn '/resize/200x200/' để lấy được link ảnh gốc kích thước lớn.
    """
    images = []
    try:
        elements = driver.find_elements(By.CSS_SELECTOR, ".re__media-thumb-item img")
        for el in elements:
            src = el.get_attribute("data-src") or el.get_attribute("src")
            if src:
                full_img_src = src.replace("/resize/200x200/", "/")
                images.append(full_img_src)

        return list(dict.fromkeys(images))
    except Exception as e:
        print("⚠️ image extract error:", e)
        return []


# =========================
# DETAIL CRAWL
# =========================
def crawl_detail(driver, url):
    driver.get(url)
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    except:
        return None, []

    time.sleep(random.uniform(2, 3))

    # ===== TITLE =====
    title = safe_text(driver, "h1")
    if "Liên hệ ngay" in title:
        title = title.split("Liên hệ ngay")[0].strip()

    # ===== LAT/LNG & IMAGES =====
    latitude, longitude = extract_lat_lng(driver)
    images = extract_images(driver)

    # ===== BÓC TÁCH ADDRESS & DISTRICT =====
    address_val = safe_text(driver, "#product-detail-web > div.re__ldp-address > span > span.re__address-line-1")
    district_val = safe_text(driver, "#product-detail-web > div.re__ldp-address > span > span.re__address-line-2")

    data = {
        "url": url,
        "title": title,
        "address": address_val,
        "district": district_val,
        "price_raw": safe_text(driver, ".re__pr-short-info.js__pr-short-info > div:nth-child(1) > span.value"),
        "area_raw": safe_text(driver,
                              "#product-detail-web > div.re__pr-short-info.js__pr-short-info > div:nth-child(2) > span.value"),
        "bedrooms": safe_text(driver,
                              "#product-detail-web > div.re__pr-short-info.js__pr-short-info > div:nth-child(3) > span.value"),
        "description": safe_text(driver,
                                 "#product-detail-web > div.re__section.re__pr-description.js__section.js__li-description > div"),
        "post_date": safe_text(driver,
                               "#product-detail-web > div.re__pr-short-info.re__pr-config.js__pr-config > div:nth-child(1) > span.value"),
        "latitude": latitude,
        "longitude": longitude,
        "crawl_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    print(f"✅ {title} | lat={latitude} lng={longitude} | {len(images)} photos")
    return data, images


# =========================
# LIST PAGE (LINH HOẠT ĐƯỜNG DẪN)
# =========================
def crawl_list(driver, page, category_path):
    url = f"https://batdongsan.com.vn/{category_path}/p{page}"
    print(f"\n🌐 LIST PAGE {page} ({category_path})")
    driver.get(url)

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    except:
        return []

    time.sleep(random.uniform(2, 4))

    try:
        urls = driver.execute_script("""
            const links = document.querySelectorAll('#product-lists-web a[href]');
            return Array.from(links).map(a => a.href);
        """)
    except Exception as e:
        print("⚠️ list extract error:", e)
        urls = []

    detail_pattern = re.compile(r'-pr\d+', re.IGNORECASE)
    urls = [u for u in urls if u and "batdongsan.com.vn" in u and detail_pattern.search(u)]
    urls = list(dict.fromkeys(urls))

    print(f"🔗 FOUND LINKS: {len(urls)}")
    return urls


# =========================
# SAVE CSV
# =========================
def save_row(file, data):
    df = pd.DataFrame([data])
    file_exists = os.path.isfile(file)
    df.to_csv(file, mode="a", header=not file_exists, index=False, encoding="utf-8-sig")


def save_images(file, url, images):
    if not images:
        return

    rows = [{"post_url": url, "image_url": img} for img in images]
    df = pd.DataFrame(rows)

    file_exists = os.path.isfile(file)
    df.to_csv(file, mode="a", header=not file_exists, index=False, encoding="utf-8-sig")


# =========================
# MAIN
# =========================
def main():
    driver = init_driver()

    os.makedirs("data", exist_ok=True)

    output_file = "data/batdongsan_live_1.csv"
    images_file = "data/batdongsan_images_1.csv"

    if os.path.exists(output_file): os.remove(output_file)
    if os.path.exists(images_file): os.remove(images_file)

    print("🚀 START CRAWLER - BỘ SỐ 1")

    try:
        for page in range(50, 200):
            urls = crawl_list(driver, page, category_path="nha-dat-ban-tp-hcm")

            for url in urls:
                try:
                    data, images = crawl_detail(driver, url)

                    if data:
                        save_row(output_file, data)
                        save_images(images_file, url, images)
                        print("💾 SAVED Data & Images")

                    time.sleep(random.uniform(1, 2))

                except Exception as e:
                    print("❌ detail error:", e)

    finally:
        driver.quit()

    print(f"\n🎯 DONE -> {output_file} & {images_file}")


if __name__ == "__main__":
    main()