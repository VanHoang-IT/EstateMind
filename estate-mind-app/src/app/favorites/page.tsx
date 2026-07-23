"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { favoriteService } from "@/services/favoriteService";
import { Property } from "@/types/property";
import PropertyCard from "@/components/PropertyCard";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    favoriteService
      .getFavorites()
      .then(setProperties)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return <div className="min-h-[50vh] flex items-center justify-center text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tin đã lưu</h1>

      {loading && <p className="text-gray-400">Đang tải...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && properties.length === 0 && (
        <div className="bg-white rounded-md border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">Bạn chưa lưu tin nào.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}
