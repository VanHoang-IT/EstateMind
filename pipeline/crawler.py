import json
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


# =========================.
# DANH MỤC CRAWL
# (category_path, category_id, property_type_id, listing_type)
# property_type_id: 1 = BÁN, 2 = THUÊ
# =========================
CATEGORIES = [
    # ---- BÁN (property_type_id = 1) ----
    ("ban-can-ho-chung-cu-tp-hcm",               1,  1, "BAN"),
    ("ban-can-ho-chung-cu-mini-tp-hcm",          2,  1, "BAN"),
    ("ban-nha-rieng-tp-hcm",                     3,  1, "BAN"),
    ("ban-nha-biet-thu-lien-ke-tp-hcm",          4,  1, "BAN"),
    ("ban-nha-mat-pho-tp-hcm",                   5,  1, "BAN"),
    ("ban-shophouse-nha-pho-thuong-mai-tp-hcm",  6,  1, "BAN"),
    ("ban-dat-nen-du-an-tp-hcm",                 7,  1, "BAN"),
    ("ban-dat-tp-hcm",                           8,  1, "BAN"),
    ("ban-trang-trai-khu-nghi-duong-tp-hcm",     9,  1, "BAN"),
    ("ban-condotel-tp-hcm",                     10,  1, "BAN"),
    ("ban-kho-nha-xuong-tp-hcm",                11,  1, "BAN"),
    ("ban-loai-bat-dong-san-khac-tp-hcm",       12,  1, "BAN"),

    # ---- THUÊ (property_type_id = 2) ----
    ("cho-thue-can-ho-chung-cu-tp-hcm",               13, 2, "THUE"),
    ("cho-thue-can-ho-chung-cu-mini-tp-hcm",          14, 2, "THUE"),
    ("cho-thue-nha-rieng-tp-hcm",                     15, 2, "THUE"),
    ("cho-thue-nha-biet-thu-lien-ke-tp-hcm",          16, 2, "THUE"),
    ("cho-thue-nha-mat-pho-tp-hcm",                   17, 2, "THUE"),
    ("cho-thue-shophouse-nha-pho-thuong-mai-tp-hcm",  18, 2, "THUE"),
    ("cho-thue-nha-tro-phong-tro-tp-hcm",             19, 2, "THUE"),
    ("cho-thue-van-phong-tp-hcm",                     20, 2, "THUE"),
    ("cho-thue-sang-nhuong-cua-hang-ki-ot-tp-hcm",    21, 2, "THUE"),
    ("cho-thue-kho-nha-xuong-dat-tp-hcm",             22, 2, "THUE"),
    ("cho-thue-loai-bat-dong-san-khac-tp-hcm",        23, 2, "THUE"),
]

PAGES_PER_CATEGORY = 10
LISTING_TYPES_TO_CRAWL = ("BAN", "THUE")

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
    except Exception:
        return ""


# =========================
# LAT/LNG EXTRACT
# =========================
HCM_LAT_RANGE = (10.30, 11.20)
HCM_LNG_RANGE = (106.20, 107.60)


def is_valid_hcm_coordinate(lat, lng):
    return (
        HCM_LAT_RANGE[0] <= lat <= HCM_LAT_RANGE[1]
        and HCM_LNG_RANGE[0] <= lng <= HCM_LNG_RANGE[1]
    )


def extract_lat_lng(driver):
    try:
        scripts = driver.find_elements(By.TAG_NAME, "script")
        blob = " ".join(s.get_attribute("innerHTML") or "" for s in scripts)
    except Exception:
        return None, None

    number = r"(-?\d{1,3}(?:\.\d+)?)"
    patterns = (
        rf"[\"']?latitude[\"']?\s*[:=]\s*[\"']?{number}[\"']?.{{0,500}}?"
        rf"[\"']?longitude[\"']?\s*[:=]\s*[\"']?{number}",
        rf"[\"']?longitude[\"']?\s*[:=]\s*[\"']?{number}[\"']?.{{0,500}}?"
        rf"[\"']?latitude[\"']?\s*[:=]\s*[\"']?{number}",
    )
    for index, pattern in enumerate(patterns):
        for match in re.finditer(pattern, blob, re.IGNORECASE | re.DOTALL):
            first, second = float(match.group(1)), float(match.group(2))
            lat, lng = (first, second) if index == 0 else (second, first)
            if is_valid_hcm_coordinate(lat, lng):
                return lat, lng
    return None, None


def wait_for_coords(driver, max_wait=6.0, step=0.8):
    """Thăm dò toạ độ: có thì trả ngay, chưa có thì ngủ ngắn rồi thử lại."""
    waited = 0.0
    lat, lng = extract_lat_lng(driver)

    while lat is None and waited < max_wait:
        time.sleep(step)
        waited += step
        lat, lng = extract_lat_lng(driver)

    return lat, lng


# =========================
# IMAGE HELPERS
# =========================
RESIZE_RE = re.compile(r"/(?:resize|crop)/\d+x\d+/", re.IGNORECASE)


def clean_image_src(src):
    if not src:
        return ""
    src = src.strip()
    if src.startswith(("data:", "blob:")):
        return ""
    return RESIZE_RE.sub("/", src)


def extract_images(driver):
    images = []
    try:
        elements = driver.find_elements(By.CSS_SELECTOR, ".re__media-thumb-item img")
        for el in elements:
            src = el.get_attribute("data-src") or el.get_attribute("src")
            if src:
                images.append(clean_image_src(src))
        return list(dict.fromkeys(i for i in images if i))
    except Exception as e:
        print("⚠️ image extract error:", e)
        return []


# =========================
# ĐẶC ĐIỂM BẤT ĐỘNG SẢN
# Quét toàn bộ khối "Đặc điểm bất động sản" theo cặp nhãn - giá trị.
# Không cố định tên trường: batdongsan thêm trường mới thì tự có.
# =========================
SPECS_CONTAINER = (
    "#product-detail-web > div.re__section.re__pr-specs"
    ".re__pr-specs-v1.js__section.js__li-specs"
)


def extract_specs(driver):
    try:
        pairs = driver.execute_script(
            """
            const box = document.querySelector(arguments[0]);
            if (!box) return [];

            const out = [];
            const items = box.querySelectorAll("[class*='specs-content-item']");

            items.forEach(item => {
                const titleEl = item.querySelector("[class*='item-title'], [class*='title']");
                const valueEl = item.querySelector("[class*='item-value'], [class*='value']");
                if (!titleEl || !valueEl) return;

                const title = (titleEl.innerText || '').trim();
                const value = (valueEl.innerText || '').trim();
                if (title && value) out.push([title, value]);
            });

            return out;
            """,
            SPECS_CONTAINER,
        )
    except Exception as e:
        print("⚠️ specs extract error:", e)
        return {}

    specs = {}

    for entry in pairs or []:
        if not entry or len(entry) < 2:
            continue

        title = " ".join(str(entry[0]).split())
        value = " ".join(str(entry[1]).split())

        if title and value and title not in specs:
            specs[title] = value

    return specs


def specs_to_json(specs):
    if not specs:
        return ""
    return json.dumps(specs, ensure_ascii=False)


# =========================
# DETAIL CRAWL
# Trả về (data, images, is_expired)
# =========================
def crawl_detail(driver, url, main_image="", max_attempts=3):
    # Chờ #product-detail-web (chỉ có ở trang thật) thay vì body/h1 —
    # trang Cloudflare challenge cũng có body và h1 nên dễ lấy nhầm trang rỗng.
    loaded = False

    for attempt in range(1, max_attempts + 1):
        driver.get(url)

        try:
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "#product-detail-web")
                )
            )
            loaded = True
            break
        except Exception:
            # Trang hết hạn KHÔNG có #product-detail-web -> kiểm tra trước khi thử lại.
            try:
                body_text = driver.find_element(By.TAG_NAME, "body").text
                normalized_body = " ".join(body_text.lower().split())

                if "tin đăng này đã hết hạn" in normalized_body:
                    print(f"⛔ TIN HẾT HẠN: {url}")
                    return None, [], True
            except Exception:
                pass

            if attempt < max_attempts:
                print(f"   ⏳ Chưa qua Cloudflare (lần {attempt}), chờ rồi thử lại...")
                time.sleep(random.uniform(8, 14))

    if not loaded:
        print("   ⚠️ Bỏ qua tin này, không tải được nội dung.")
        return None, [], False

    time.sleep(random.uniform(1.5, 2.5))

    # Kiểm tra lần nữa: có tin hết hạn vẫn render #product-detail-web.
    try:
        body_text = driver.find_element(By.TAG_NAME, "body").text
        normalized_body = " ".join(body_text.lower().split())

        if "tin đăng này đã hết hạn" in normalized_body:
            print(f"⛔ TIN HẾT HẠN: {url}")
            return None, [], True
    except Exception as e:
        print("⚠️ Không kiểm tra được trạng thái hết hạn:", e)

    title = safe_text(driver, "h1")
    if "Liên hệ ngay" in title:
        title = title.split("Liên hệ ngay")[0].strip()

    latitude, longitude = wait_for_coords(driver)
    images = extract_images(driver)
    specs = extract_specs(driver)

    if not main_image and images:
        main_image = images[0]

    address_val = safe_text(driver, "#product-detail-web > div.re__ldp-address > span > span.re__address-line-1")
    district_val = safe_text(driver, "#product-detail-web > div.re__ldp-address > span > span.re__address-line-2")

    data = {
        "url": url,
        "title": title,
        "main_image": main_image,
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
        "latitude": latitude if latitude is not None else "",
        "longitude": longitude if longitude is not None else "",
        "specs_json": specs_to_json(specs),
        "crawl_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    print(f"✅ {title[:55]} | lat={latitude} | {len(images)} ảnh | "
          f"{len(specs)} đặc điểm | cover={'có' if main_image else 'KHÔNG'}")
    return data, images, False


# =========================
# LIST PAGE
# =========================
def crawl_list(driver, page, category_path):
    url = f"https://batdongsan.com.vn/{category_path}/p{page}"
    print(f"\n🌐 LIST PAGE {page} ({category_path})")
    driver.get(url)

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    except Exception:
        return []

    # Chờ container tin thật — cho Cloudflare thời gian giải challenge.
    try:
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#product-lists-web"))
        )
    except Exception:
        pass

    time.sleep(random.uniform(2, 4))

    try:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1.5)
    except Exception:
        pass

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

    cover_map = {}
    try:
        pairs = driver.execute_script("""
            const links = document.querySelectorAll('#product-lists-web a[href]');
            return Array.from(links).map(a => {
                const img = a.querySelector('img');
                const src = img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '';
                return [a.href, src];
            });
        """)
        for href, src in pairs:
            if href and src and href not in cover_map:
                cover_map[href] = clean_image_src(src.strip())
    except Exception as e:
        print("⚠️ cover extract error (bỏ qua):", e)

    results = [{"url": u, "main_image": cover_map.get(u, "")} for u in urls]

    print(f"🔗 FOUND LINKS: {len(results)}")
    return results


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

    output_file = "data/properties_raw.csv"
    images_file = "data/property_images_raw.csv"

    crawled_urls = set()
    if os.path.exists(output_file):
        try:
            crawled_urls = set(pd.read_csv(output_file)["url"].dropna())
            print(f"↩️ RESUME: đã có {len(crawled_urls)} tin, sẽ bỏ qua")
        except Exception as e:
            print("⚠️ KHÔNG ĐỌC ĐƯỢC FILE RESUME:", e)

    print("🚀 START CRAWLER ĐA DANH MỤC (BÁN + THUÊ)")

    try:
        targets = [c for c in CATEGORIES if c[3] in LISTING_TYPES_TO_CRAWL]

        print(f"📋 Sẽ crawl {len(targets)} danh mục: {LISTING_TYPES_TO_CRAWL}")

        for category_path, category_id, property_type_id, listing_type in targets:
            stop_category = False

            print(
                f"\n========== {listing_type} | "
                f"property_type_id={property_type_id} | "
                f"category_id={category_id} | {category_path} =========="
            )

            for page in range(1, PAGES_PER_CATEGORY + 1):
                entries = crawl_list(driver, page, category_path=category_path)

                if not entries:
                    print("   ⚠️ Trang rỗng, chờ thêm rồi thử lại...")
                    time.sleep(random.uniform(5, 8))
                    entries = crawl_list(driver, page, category_path=category_path)

                if not entries:
                    print("   ℹ️ Hết tin, sang danh mục khác.")
                    break

                skipped = 0
                new_count = 0

                for entry in entries:
                    url = entry["url"]

                    if url in crawled_urls:
                        skipped += 1
                        continue

                    new_count += 1

                    try:
                        data, images, is_expired = crawl_detail(
                            driver,
                            url,
                            entry["main_image"]
                        )

                        if is_expired:
                            print(
                                f"⛔ GẶP TIN HẾT HẠN -> DỪNG CATEGORY "
                                f"{category_id} ({category_path})"
                            )
                            stop_category = True
                            break

                        if data:
                            data["category_id"] = category_id
                            data["property_type_id"] = property_type_id
                            data["listing_type"] = listing_type

                            save_row(output_file, data)
                            save_images(images_file, url, images)
                            crawled_urls.add(url)
                            print(
                                f"💾 SAVED | category_id={category_id} | "
                                f"property_type_id={property_type_id} | {listing_type}"
                            )

                        time.sleep(random.uniform(2, 4))

                    except Exception as e:
                        print("❌ detail error:", e)

                print(f"   ↪️ Trang {page}: {new_count} tin mới | {skipped} tin đã có, bỏ qua")

                if stop_category:
                    print(f"➡️ CHUYỂN SANG CATEGORY TIẾP THEO SAU category_id={category_id}")
                    break

            time.sleep(random.uniform(2, 4))

    finally:
        try:
            driver.quit()
        except Exception:
            pass

    print(f"\n🎯 DONE -> {output_file} & {images_file}")


if __name__ == "__main__":
    main()