import PropertyCarousel from "@/components/property/PropertyCarousel";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=90";

interface Props {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: Props) {
  const galleryImages = images.length > 0 ? images : [FALLBACK_IMAGE];

  return (
    <PropertyCarousel
      images={galleryImages}
      title={title || "Ảnh bất động sản"}
    />
  );
}
