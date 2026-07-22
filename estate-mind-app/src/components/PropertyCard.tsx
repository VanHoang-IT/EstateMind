import { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const fallbackImage = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden group cursor-pointer">
      
      {/* 1. Phần hình ảnh & Tem VIP có Lazy Loading */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-200">
        <img 
          src={fallbackImage} 
          alt={property.title}
          // --- BẬT LAZY LOADING CHO FRONTEND ---
          loading="lazy" 
          // ------------------------------------
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm z-10">
          VIP
        </span>
      </div>
      
      {/* 2. Phần nội dung thông tin */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-sm font-semibold text-gray-800 uppercase line-clamp-2 mb-2 hover:text-red-600 transition-colors">
          {property.title}
        </h3>
        
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-base font-bold text-red-600">
            {property.price ? `${property.price.toLocaleString('vi-VN')} tỷ` : "Giá thỏa thuận"}
          </span>
          {property.area && (
            <span className="text-sm text-gray-600">
              · {property.area} m²
            </span>
          )}
        </div>

        <div className="flex items-start gap-1 text-xs text-gray-500 mb-4">
          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span className="line-clamp-1">{property.address || property.district}</span>
        </div>

        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">Đăng hôm nay</span>
          <button className="text-gray-400 hover:text-red-500 transition-colors border border-gray-200 rounded p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}