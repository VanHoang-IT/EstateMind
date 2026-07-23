interface Props {
  latitude?: number;
  longitude?: number;
  title?: string;
}

// Dùng Google Maps "embed" qua URL thô — không cần API key, phù hợp cho nhu
// cầu hiển thị vị trí đơn giản. Nếu sau này cần tương tác nhiều hơn (vẽ pin
// tùy biến, tính khoảng cách...) thì mới cần tới Leaflet/Google Maps JS SDK.
export default function PropertyMap({ latitude, longitude, title }: Props) {
  if (latitude == null || longitude == null) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-md h-64 flex items-center justify-center text-sm text-gray-400">
        Chưa có thông tin vị trí trên bản đồ.
      </div>
    );
  }

  const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="rounded-md overflow-hidden border border-gray-200 h-64">
      <iframe
        title={title || "Vị trí bất động sản"}
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
