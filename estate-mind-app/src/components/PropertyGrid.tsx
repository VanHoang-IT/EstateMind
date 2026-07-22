'use client';

import { useState } from 'react';
import { Property } from '@/types/property';
import PropertyCard from './PropertyCard';
import { propertyService } from '@/services/propertyService';

interface Props {
  initialProperties: Property[];
  search: string;
  district: string;
}

export default function PropertyGrid({ initialProperties, search, district }: Props) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProperties.length === 8);

  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    
    try {
      const newProperties = await propertyService.getProperties(nextPage, 8, search, district);
      
      setProperties((prev) => [...prev, ...newProperties]);
      setPage(nextPage);
      
      if (newProperties.length < 8) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Lỗi khi tải thêm:", error);
    } finally {
      setLoading(false);
    }
  };

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-md border border-dashed border-gray-300 py-16 text-center">
        <p className="text-gray-500">Không tìm thấy bất động sản nào phù hợp.</p>
      </div>
    );
  }

  return (
    <>
      {/* Lưới hiển thị Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Nút Xem tiếp */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => loadMore()}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-8 py-2.5 rounded-md hover:bg-gray-50 font-medium text-sm flex items-center justify-center transition-colors w-[200px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải...
              </span>
            ) : (
              'Xem tiếp'
            )}
          </button>
        </div>
      )}
    </>
  );
}