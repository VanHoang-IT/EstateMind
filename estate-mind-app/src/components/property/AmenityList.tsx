import {
  ArrowUpDown,
  Car,
  Dumbbell,
  Flame,
  GraduationCap,
  ShieldCheck,
  ShoppingBag,
  Sofa,
  Sparkles,
  ToyBrick,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";

interface AmenityListProps {
  amenities?: string | null;
}

interface AmenityMeta {
  label: string;
  icon: LucideIcon;
  group: "INTERNAL" | "NEARBY";
}

const AMENITY_MAP: Record<string, AmenityMeta> = {
  POOL: { label: "Hồ bơi", icon: Waves, group: "INTERNAL" },
  GYM: { label: "Phòng gym", icon: Dumbbell, group: "INTERNAL" },
  SPA: { label: "Spa", icon: Sparkles, group: "INTERNAL" },
  BBQ: { label: "Khu BBQ", icon: Flame, group: "INTERNAL" },
  PLAYGROUND: { label: "Khu vui chơi", icon: ToyBrick, group: "INTERNAL" },
  SECURITY: { label: "An ninh 24/7", icon: ShieldCheck, group: "INTERNAL" },
  ELEVATOR: { label: "Thang máy", icon: ArrowUpDown, group: "INTERNAL" },
  PARKING: { label: "Chỗ đậu xe", icon: Car, group: "INTERNAL" },
  FURNISHED: { label: "Đầy đủ nội thất", icon: Sofa, group: "INTERNAL" },
  MALL: { label: "Trung tâm thương mại", icon: ShoppingBag, group: "NEARBY" },
  SCHOOL: { label: "Trường học", icon: GraduationCap, group: "NEARBY" },
  PARK: { label: "Công viên", icon: Trees, group: "NEARBY" },
};

function AmenityGroup({ title, codes }: { title: string; codes: string[] }) {
  if (codes.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#8a938d]">
        {title}
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {codes.map((code) => {
          const { label, icon: Icon } = AMENITY_MAP[code];

          return (
            <div
              key={code}
              className="flex items-center gap-2.5 text-sm text-[#3d4742]"
            >
              <Icon size={18} className="shrink-0 text-[#007a5a]" />
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AmenityList({ amenities }: AmenityListProps) {
  const codes = (amenities ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code in AMENITY_MAP);

  if (codes.length === 0) {
    return null;
  }

  const internal = codes.filter((c) => AMENITY_MAP[c].group === "INTERNAL");
  const nearby = codes.filter((c) => AMENITY_MAP[c].group === "NEARBY");

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-[#202523]">Tiện ích</h2>

      <AmenityGroup title="Tiện ích nội khu" codes={internal} />
      <AmenityGroup title="Tiện ích xung quanh" codes={nearby} />
    </div>
  );
}
