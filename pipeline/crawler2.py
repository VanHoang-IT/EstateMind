"""Crawler Batdongsan.com.vn cho EstateMind.

Selenium lo điều hướng và cuộn trang; toàn bộ bóc tách chạy trên page_source
bằng BeautifulSoup nên có thể kiểm thử offline.

Đầu ra:
    data/properties_raw.csv        15 cột contract của pipeline
    data/property_images_raw.csv   post_url, image_url
    data/properties_meta.csv       ID chuẩn hóa lấy từ pageTrackingData
    data/crawl_errors.log
    data/blocked_pages/           HTML lưu lại khi trang không hiện nội dung

Chạy thử:
    python crawler2.py --pages 1 --max-new 5
Chạy chính thức:
    python crawler2.py --pages 20 --category ban-can-ho-chung-cu-tp-hcm
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

from bs4 import BeautifulSoup, Tag
from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "https://batdongsan.com.vn"
SOURCE_DOMAIN = "batdongsan.com.vn"

DATA_DIR = Path("data")
PROPERTIES_CSV = DATA_DIR / "properties_raw.csv"
IMAGES_CSV = DATA_DIR / "property_images_raw.csv"
META_CSV = DATA_DIR / "properties_meta.csv"
ERROR_LOG = DATA_DIR / "crawl_errors.log"
SNAPSHOT_DIR = DATA_DIR / "blocked_pages"

PROPERTY_COLUMNS = [
    "url", "title", "description", "url_crawl", "main_image",
    "address", "district", "price_raw", "area_raw", "bedrooms",
    "post_date", "latitude", "longitude", "crawl_date", "category_source",
]
IMAGE_COLUMNS = ["post_url", "image_url"]
META_COLUMNS = [
    "url", "product_id", "cate_id", "city_code",
    "district_id", "ward_id", "street_id", "product_type",
]

HCM_LAT_RANGE = (10.30, 11.20)
HCM_LNG_RANGE = (106.20, 107.60)

MIN_DELAY, MAX_DELAY = 1.5, 3.0

WHITESPACE_RE = re.compile(r"\s+")
DETAIL_URL_RE = re.compile(r"-pr\d+(?:\b|/|\?|#)", re.IGNORECASE)
RESIZE_RE = re.compile(r"/(?:resize|crop)/\d+x\d+/", re.IGNORECASE)

CATEGORY_SLUGS = (
    ("ban-can-ho-chung-cu-mini", "MINI_APARTMENT"),
    ("ban-can-ho-chung-cu", "APARTMENT"),
    ("ban-nha-mat-pho", "TOWNHOUSE"),
    ("ban-nha-biet-thu-lien-ke", "VILLA"),
    ("ban-nha-rieng", "HOUSE"),
    ("ban-shophouse-nha-pho-thuong-mai", "SHOPHOUSE"),
    ("ban-dat-nen-du-an", "PROJECT_LAND"),
    ("ban-dat", "LAND"),
    ("ban-condotel", "CONDOTEL"),
    ("ban-kho-nha-xuong", "WAREHOUSE"),
    ("ban-trang-trai-khu-nghi-duong", "FARM"),
)

CITY_TOKENS = ("hồ chí minh", "tphcm", "tp.hcm", "tp hcm", "sài gòn")
DISTRICT_PREFIX_RE = re.compile(
    r"^(Quận|Huyện|Thị xã|Thành phố|TP\.?)\s+\S", re.IGNORECASE
)

ITEM_SELECTORS = (
    "#product-detail-web [class*='specs-content-item']",
    "#product-detail-web [class*='short-info-item']",
    "#product-detail-web .re__pr-short-info > div",
    "#product-detail-web .re__pr-config > div",
)

BLOCK_SIGNALS = (
    "verifying you are human",
    "verify you are human",
    "security service to protect against malicious bots",
    "just a moment",
    "access denied",
    "cf-chl-",
)


# --------------------------------------------------------------------------
# Tiện ích chuỗi / URL / ảnh
# --------------------------------------------------------------------------
def clean_text(value: object) -> str:
    if value is None:
        return ""
    return WHITESPACE_RE.sub(" ", str(value)).strip()


def normalize_property_url(url: str, base_url: str = BASE_URL) -> str:
    """Bỏ query string và dấu / cuối để chống trùng ổn định."""
    if not url:
        return ""
    parts = urlsplit(urljoin(base_url, url.strip()))
    host = parts.netloc.lower().replace("www.", "")
    if host != SOURCE_DOMAIN:
        return ""
    path = re.sub(r"/{2,}", "/", parts.path).rstrip("/")
    if not path:
        return ""
    return urlunsplit(("https", SOURCE_DOMAIN, path, "", ""))


def clean_image_src(src: str, base_url: str = BASE_URL) -> str:
    """Trả về ảnh gốc: bỏ cả /resize/WxH/ lẫn /crop/WxH/."""
    if not src:
        return ""
    src = src.strip()
    if not src or src.startswith(("data:", "blob:")):
        return ""
    return RESIZE_RE.sub("/", urljoin(base_url, src))


def looks_like_property_image(url: str) -> bool:
    if not url:
        return False
    parts = urlsplit(url)
    host, path = parts.netloc.lower(), parts.path.lower()
    valid_host = (
        re.fullmatch(r"file\d*\.batdongsan\.com\.vn", host) is not None
        or host == "pgimgs.com"
        or host.endswith(".pgimgs.com")
    )
    if not valid_host:
        return False
    blocked = ("logo", "icon", "avatar", "sprite", "loading", "placeholder", "umov")
    return not any(word in path for word in blocked)


def category_from_url(url: str) -> str:
    path = urlsplit(url).path.lower()
    for slug, name in CATEGORY_SLUGS:
        if slug in path:
            return name
    return "OTHER"


# --------------------------------------------------------------------------
# Bóc tách theo nhãn
# --------------------------------------------------------------------------
def label_value_pairs(soup: BeautifulSoup) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    seen: set[int] = set()
    for item in soup.select(", ".join(ITEM_SELECTORS)):
        if id(item) in seen:
            continue
        seen.add(id(item))

        value_node = item.select_one("[class*='value'], .value")
        if value_node is None:
            continue
        value = clean_text(value_node.get_text(" ", strip=True))
        if not value:
            continue

        title_node = item.select_one("[class*='title'], .title")
        if title_node is not None:
            title = clean_text(title_node.get_text(" ", strip=True))
        else:
            whole = clean_text(item.get_text(" ", strip=True))
            title = clean_text(whole.replace(value, "", 1))
        title = title.rstrip(":").strip()
        if title:
            pairs.append((title.casefold(), value))
    return pairs


def value_by_label(pairs: list[tuple[str, str]], labels: tuple[str, ...]) -> str:
    for label in labels:
        target = label.casefold()
        for title, value in pairs:
            if title == target:
                return value
    for label in labels:
        target = label.casefold()
        for title, value in pairs:
            if target in title:
                return value
    return ""


# --------------------------------------------------------------------------
# Địa chỉ, tọa độ, ảnh, tracking
# --------------------------------------------------------------------------
def first_text(soup: BeautifulSoup, selectors: tuple[str, ...]) -> str:
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            value = clean_text(node.get_text(" ", strip=True))
            if value:
                return value
    return ""


def extract_district(address_line_1: str) -> str:
    """Lấy quận/huyện từ address-line-1.

    KHÔNG dùng address-line-2 vì sau sáp nhập nó chứa tên PHƯỜNG mới,
    ví dụ "(Phường Phú Thạnh, Hồ Chí Minh mới)".
    """
    parts = [p.strip() for p in (address_line_1 or "").split(",") if p.strip()]
    for part in reversed(parts):
        lowered = part.casefold()
        if any(token in lowered for token in CITY_TOKENS):
            continue
        if lowered.startswith("phường") or lowered.startswith("xã"):
            continue
        if DISTRICT_PREFIX_RE.match(part):
            return part
    for part in reversed(parts):
        lowered = part.casefold()
        if any(token in lowered for token in CITY_TOKENS):
            continue
        if lowered.startswith(("phường", "xã", "đường", "số")):
            continue
        return part
    return ""


def extract_lat_lng(html: str) -> tuple[float | None, float | None]:
    number = r"(-?\d{1,3}(?:\.\d+)?)"
    patterns = (
        rf"[\"']?latitude[\"']?\s*[:=]\s*[\"']?{number}[\"']?.{{0,500}}?"
        rf"[\"']?longitude[\"']?\s*[:=]\s*[\"']?{number}",
        rf"[\"']?longitude[\"']?\s*[:=]\s*[\"']?{number}[\"']?.{{0,500}}?"
        rf"[\"']?latitude[\"']?\s*[:=]\s*[\"']?{number}",
    )
    for index, pattern in enumerate(patterns):
        for match in re.finditer(pattern, html or "", re.IGNORECASE | re.DOTALL):
            first, second = float(match.group(1)), float(match.group(2))
            lat, lng = (first, second) if index == 0 else (second, first)
            if HCM_LAT_RANGE[0] <= lat <= HCM_LAT_RANGE[1] and \
               HCM_LNG_RANGE[0] <= lng <= HCM_LNG_RANGE[1]:
                return lat, lng

    embed = re.search(r"maps/embed/v1/place\?q=([\d.]+),([\d.]+)", html or "")
    if embed:
        lat, lng = float(embed.group(1)), float(embed.group(2))
        if HCM_LAT_RANGE[0] <= lat <= HCM_LAT_RANGE[1] and \
           HCM_LNG_RANGE[0] <= lng <= HCM_LNG_RANGE[1]:
            return lat, lng
    return None, None


def extract_images(soup: BeautifulSoup, page_url: str) -> list[str]:
    """Ưu tiên album popup vì href ở đó là ảnh gốc, không qua resize/crop."""
    images: list[str] = []

    for node in soup.select(".js__product-media[href]"):
        src = clean_image_src(str(node.get("href", "")), page_url)
        if looks_like_property_image(src):
            images.append(src)

    if not images:
        for thumb in soup.select(".re__media-thumb-item"):
            if thumb.get("data-filter") == "video":
                continue
            img = thumb.select_one("img")
            if img is None:
                continue
            for attr in ("data-src", "data-lazy-src", "src"):
                src = clean_image_src(str(img.get(attr, "")), page_url)
                if looks_like_property_image(src):
                    images.append(src)
                    break

    return list(dict.fromkeys(images))


def extract_page_tracking(html: str) -> dict[str, object]:
    """Đọc window.pageTrackingData — ID chuẩn hóa do chính nguồn cấp."""
    for match in re.finditer(r"JSON\.parse\('(\{.*?\})'\)", html or "", re.DOTALL):
        blob = match.group(1)
        if "pageTrackingType" not in blob:
            continue
        try:
            parsed = json.loads(blob.replace("\\'", "'"))
        except json.JSONDecodeError:
            continue
        products = parsed.get("products") or []
        if not products:
            continue
        product = products[0]
        return {
            "product_id": product.get("productId", ""),
            "cate_id": product.get("cateId", ""),
            "city_code": product.get("cityCode", ""),
            "district_id": product.get("districtId", ""),
            "ward_id": product.get("wardId", ""),
            "street_id": product.get("streetId", ""),
            "product_type": product.get("productType", ""),
        }
    return {}


def is_blocked_page(html: str) -> bool:
    sample = clean_text((html or "")[:30_000]).casefold()
    if "product-detail-web" in (html or "") or "product-lists-web" in (html or ""):
        return False
    return any(signal in sample for signal in BLOCK_SIGNALS)


# --------------------------------------------------------------------------
# Parse trang danh sách / trang chi tiết
# --------------------------------------------------------------------------
def parse_list_page(html: str, page_url: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html or "", "lxml")
    root = soup.select_one("#product-lists-web") or soup

    entries: dict[str, str] = {}
    for anchor in root.select("a[href]"):
        url = normalize_property_url(str(anchor.get("href", "")), page_url)
        if not url or not DETAIL_URL_RE.search(url):
            continue
        if entries.get(url):
            continue
        cover = ""
        card = anchor
        for _ in range(6):
            if card is None:
                break
            img = card.select_one("img")
            if img is not None:
                for attr in ("data-src", "src"):
                    candidate = clean_image_src(str(img.get(attr, "")), page_url)
                    if looks_like_property_image(candidate):
                        cover = candidate
                        break
            if cover:
                break
            parent = card.parent
            card = parent if isinstance(parent, Tag) else None
        entries[url] = cover

    return [{"url": url, "main_image": cover} for url, cover in entries.items()]


def parse_detail_page(html: str, url: str, crawl_date: str,
                      list_main_image: str = "") -> tuple[dict, list[str], dict]:
    soup = BeautifulSoup(html or "", "lxml")
    pairs = label_value_pairs(soup)

    title = first_text(soup, ("#product-detail-web h1", "h1"))
    title = title.split("Liên hệ ngay", 1)[0].strip()

    address = first_text(soup, (
        "#product-detail-web .re__ldp-address .re__address-line-1",
        "#product-detail-web span.re__address-line-1",
        "#product-detail-web [class*='address-line-1']",
    ))
    district = extract_district(address)

    description = first_text(soup, (
        "#product-detail-web .re__pr-description .re__section-body",
        "#product-detail-web .re__pr-description",
        "#product-detail-web [class*='pr-description']",
    ))
    description = re.sub(r"^Thông tin mô tả\s*", "", description, flags=re.IGNORECASE)

    images = extract_images(soup, url)
    main_image = clean_image_src(list_main_image, url)
    if not main_image and images:
        main_image = images[0]

    latitude, longitude = extract_lat_lng(html)
    normalized_url = normalize_property_url(url)

    data = {
        "url": normalized_url,
        "title": title,
        "description": description,
        "url_crawl": SOURCE_DOMAIN,
        "main_image": main_image,
        "address": address,
        "district": district,
        "price_raw": value_by_label(pairs, ("Khoảng giá", "Mức giá", "Giá")),
        "area_raw": value_by_label(pairs, ("Diện tích",)),
        "bedrooms": value_by_label(pairs, ("Phòng ngủ", "Số phòng ngủ")),
        "post_date": value_by_label(pairs, ("Ngày đăng",)),
        "latitude": latitude if latitude is not None else "",
        "longitude": longitude if longitude is not None else "",
        "crawl_date": crawl_date,
        "category_source": category_from_url(normalized_url or url),
    }

    meta = extract_page_tracking(html)
    if meta:
        meta["url"] = normalized_url
    return data, images, meta


# --------------------------------------------------------------------------
# Lưu CSV
# --------------------------------------------------------------------------
def append_rows(path: Path, columns: list[str], rows: list[dict]) -> int:
    if not rows:
        return 0
    path.parent.mkdir(parents=True, exist_ok=True)
    has_header = path.exists() and path.stat().st_size > 0
    with path.open("a", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=columns, extrasaction="ignore")
        if not has_header:
            writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})
    return len(rows)


def load_column(path: Path, column: str) -> set[str]:
    if not path.exists() or path.stat().st_size == 0:
        return set()
    with path.open("r", newline="", encoding="utf-8-sig") as file:
        return {
            (row.get(column) or "").strip()
            for row in csv.DictReader(file)
            if (row.get(column) or "").strip()
        }


def load_image_pairs(path: Path) -> set[tuple[str, str]]:
    if not path.exists() or path.stat().st_size == 0:
        return set()
    with path.open("r", newline="", encoding="utf-8-sig") as file:
        return {
            ((row.get("post_url") or "").strip(), (row.get("image_url") or "").strip())
            for row in csv.DictReader(file)
            if (row.get("post_url") or "").strip()
        }


def log_error(message: str) -> None:
    ERROR_LOG.parent.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with ERROR_LOG.open("a", encoding="utf-8") as file:
        file.write(f"[{stamp}] {message}\n")


# --------------------------------------------------------------------------
# Selenium — luồng điều hướng giữ NGUYÊN như crawler.py cũ
# --------------------------------------------------------------------------
def init_driver() -> webdriver.Chrome:
    """Giống hệt crawler.py cũ: không đặt page_load_timeout, không headless."""
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    return webdriver.Chrome(options=options)


def polite_delay() -> None:
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))


def save_snapshot(url: str, html: str) -> Path:
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-zA-Z0-9_-]+", "_", url)[-100:]
    path = SNAPSHOT_DIR / f"{datetime.now():%Y%m%d_%H%M%S}_{slug}.html"
    path.write_text(html or "", encoding="utf-8", errors="ignore")
    return path


def open_page(driver: webdriver.Chrome, url: str, ready_selector: str) -> str | None:
    """Chờ <body> rồi ngủ như file cũ, sau đó mới kiểm tra nội dung thật.

    Khoảng ngủ này chính là lúc Cloudflare tự hoàn tất thử thách.
    """
    try:
        driver.get(url)
    except WebDriverException as exc:
        log_error(f"NAV_FAIL {url}: {exc.__class__.__name__}")
        print(f"   ❌ Không mở được trang: {exc.__class__.__name__}")
        return None

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    except TimeoutException:
        log_error(f"NO_BODY {url}")
        return None

    time.sleep(random.uniform(2.5, 4.0))

    # Nếu nội dung chưa có, cho thêm thời gian — challenge thường tự xong.
    if ready_selector not in driver.page_source:
        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, f"#{ready_selector}"))
            )
            time.sleep(1.0)
        except TimeoutException:
            pass

    html = driver.page_source
    if ready_selector in html:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1.5)
        return driver.page_source

    snapshot = save_snapshot(url, html)
    blocked = is_blocked_page(html)
    log_error(f"{'BLOCKED' if blocked else 'NO_CONTENT'} {url}: "
              f"title={driver.title!r} len={len(html)} snapshot={snapshot}")
    print(f"   ⚠️ Không thấy #{ready_selector} | title={driver.title!r} | {len(html)} ký tự")
    print(f"      đã lưu: {snapshot}")
    return "__BLOCKED__" if blocked else None


# --------------------------------------------------------------------------
# Vòng chạy chính
# --------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Crawl Batdongsan.com.vn cho EstateMind")
    parser.add_argument("--category", default="ban-can-ho-chung-cu-tp-hcm")
    parser.add_argument("--pages", type=int, default=5)
    parser.add_argument("--start-page", type=int, default=1)
    parser.add_argument("--max-new", type=int, default=0)
    return parser.parse_args()


def run(args: argparse.Namespace) -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    crawled = load_column(PROPERTIES_CSV, "url")
    image_pairs = load_image_pairs(IMAGES_CSV)
    meta_done = load_column(META_CSV, "url")
    print(f"↩️  Đã có {len(crawled)} tin trong CSV, sẽ bỏ qua.")

    new_count = image_count = failed = blocked = 0
    consecutive_blocked = 0
    driver = init_driver()

    try:
        last_page = args.start_page + args.pages - 1
        for page in range(args.start_page, last_page + 1):
            if args.max_new and new_count >= args.max_new:
                break

            list_url = f"{BASE_URL}/{args.category}/p{page}"
            print(f"\n🌐 Trang {page}/{last_page}: {list_url}")

            html = open_page(driver, list_url, "product-lists-web")
            if html in (None, "__BLOCKED__"):
                failed += 1
                print("   ↷ Bỏ qua trang này.")
                polite_delay()
                continue

            entries = parse_list_page(html, list_url)
            print(f"   🔗 {len(entries)} tin trên trang")
            if not entries:
                print("   ℹ️ Hết tin, dừng.")
                break

            for entry in entries:
                if args.max_new and new_count >= args.max_new:
                    break
                if entry["url"] in crawled:
                    continue

                detail_html = open_page(driver, entry["url"], "product-detail-web")

                if detail_html == "__BLOCKED__":
                    blocked += 1
                    consecutive_blocked += 1
                    if consecutive_blocked >= 8:
                        print("   ⛔ Bị chặn 8 tin liên tiếp. Dừng.")
                        break
                    print("   ↷ Bỏ qua tin này, đi tiếp.")
                    polite_delay()
                    continue
                if detail_html is None:
                    failed += 1
                    polite_delay()
                    continue
                consecutive_blocked = 0

                crawl_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                data, images, meta = parse_detail_page(
                    detail_html, entry["url"], crawl_date, entry["main_image"]
                )

                if not data["url"] or not data["title"]:
                    failed += 1
                    log_error(f"INVALID {entry['url']}")
                    print("   ⚠️ Thiếu URL hoặc tiêu đề, KHÔNG ghi CSV.")
                    polite_delay()
                    continue

                append_rows(PROPERTIES_CSV, PROPERTY_COLUMNS, [data])
                crawled.add(data["url"])

                new_images = [
                    {"post_url": data["url"], "image_url": src}
                    for src in images if (data["url"], src) not in image_pairs
                ]
                for row in new_images:
                    image_pairs.add((row["post_url"], row["image_url"]))
                image_count += append_rows(IMAGES_CSV, IMAGE_COLUMNS, new_images)

                if meta and meta.get("url") and meta["url"] not in meta_done:
                    append_rows(META_CSV, META_COLUMNS, [meta])
                    meta_done.add(meta["url"])

                new_count += 1
                print(f"   ✅ {data['title'][:58]}")
                print(f"      giá={data['price_raw']!r} dt={data['area_raw']!r} "
                      f"pn={data['bedrooms']!r} quận={data['district']!r} "
                      f"lat={data['latitude']} ảnh={len(new_images)}")
                polite_delay()

            if consecutive_blocked >= 8:
                break
            polite_delay()

    except KeyboardInterrupt:
        print("\n⏹️  Dừng theo yêu cầu người dùng.")
    finally:
        driver.quit()

    print("\n================ HOÀN TẤT ================")
    print(f"Tin mới      : {new_count}")
    print(f"Ảnh mới      : {image_count}")
    print(f"Lỗi          : {failed}")
    print(f"Lần bị chặn  : {blocked}")
    print(f"Properties   : {PROPERTIES_CSV}")
    print(f"Images       : {IMAGES_CSV}")
    print(f"Meta         : {META_CSV}")
    return 0


if __name__ == "__main__":
    sys.exit(run(parse_args()))