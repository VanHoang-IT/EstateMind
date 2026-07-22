'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    params.set('page', '1'); 
    if (search) params.set('search', search);
    if (district) params.set('district', district);

    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-4 border border-gray-200 rounded-md shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
      <div className="w-full md:flex-grow relative">
        <input
          type="text"
          placeholder="Nhập địa điểm, tên dự án, căn hộ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500 text-gray-800"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>

      <div className="w-full md:w-48">
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-red-500 bg-white text-gray-700"
        >
          <option value="">Tất cả Quận/Huyện</option>
          <option value="Sơn Trà">Sơn Trà</option>
          <option value="Hải Châu">Hải Châu</option>
          <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
          <option value="Liên Chiểu">Liên Chiểu</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-6 py-2 rounded-md transition-colors"
      >
        Tìm kiếm
      </button>
    </form>
  );
}