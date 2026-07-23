"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { favoriteService } from "@/services/favoriteService";

export default function FavoriteButton({ propertyId }: { propertyId: number }) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    favoriteService.isFavorited(propertyId).then(setFavorited).catch(() => {});
  }, [user, propertyId]);

  async function toggle() {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (favorited) {
        await favoriteService.removeFavorite(propertyId);
        setFavorited(false);
      } else {
        await favoriteService.addFavorite(propertyId);
        setFavorited(true);
      }
    } catch {
      // bỏ qua
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!user || busy}
      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        favorited
          ? "text-red-600 border-red-200 bg-red-50"
          : "text-gray-600 border-gray-300 hover:border-red-300 hover:text-red-500"
      }`}
      title={user ? undefined : "Đăng nhập để lưu tin"}
    >
      <svg className="w-4 h-4" fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>
      {favorited ? "Đã lưu" : "Lưu tin"}
    </button>
  );
}
