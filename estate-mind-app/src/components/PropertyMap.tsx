interface Props {
  latitude?: number;
  longitude?: number;
  title?: string;
}

export default function PropertyMap({ latitude, longitude, title }: Props) {
  if (latitude == null || longitude == null) {
    return (
      <div className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-[#ccd6d0] bg-[#f2f5f3] px-6 text-center text-sm text-[#7d8881]">
        Bất động sản này chưa có tọa độ bản đồ.
      </div>
    );
  }

  const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dce3df] bg-white shadow-[0_8px_28px_rgba(25,45,35,0.04)]">
      <iframe
        title={title || "Vị trí bất động sản"}
        src={src}
        width="100%"
        height="380"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block border-0"
      />
    </div>
  );
}
