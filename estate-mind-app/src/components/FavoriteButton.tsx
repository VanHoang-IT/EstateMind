"use client";

import { useEffect, useState } from "react";

import { Heart } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import { favoriteService } from "@/services/favoriteService";

interface FavoriteSnapshot {
  userKey: string;
  propertyId: number;
  value: boolean;
}

export default function FavoriteButton({ propertyId }: { propertyId: number }) {
  const { user, loading: authLoading } = useAuth();

  const [favoriteSnapshot, setFavoriteSnapshot] =
    useState<FavoriteSnapshot | null>(null);

  const [busy, setBusy] = useState(false);

  const userKey = user?.username ?? "";

  const canUseFavorites =
    user?.userRole === "ROLE_CUSTOMER" || user?.userRole === "ROLE_SELLER";

  const favorited =
    Boolean(userKey) &&
    canUseFavorites &&
    favoriteSnapshot?.userKey === userKey &&
    favoriteSnapshot?.propertyId === propertyId &&
    favoriteSnapshot.value;

  useEffect(() => {
    if (authLoading || !userKey || !canUseFavorites) {
      return;
    }

    let ignore = false;

    favoriteService
      .isFavorited(propertyId)
      .then((value) => {
        if (ignore) {
          return;
        }

        setFavoriteSnapshot({
          userKey,
          propertyId,
          value,
        });
      })
      .catch((error) => {
        console.error("Không thể kiểm tra trạng thái yêu thích:", error);

        if (ignore) {
          return;
        }

        setFavoriteSnapshot({
          userKey,
          propertyId,
          value: false,
        });
      });

    return () => {
      ignore = true;
    };
  }, [authLoading, userKey, canUseFavorites, propertyId]);

  async function toggleFavorite() {
    if (!user || !canUseFavorites || busy) {
      return;
    }

    setBusy(true);

    try {
      if (favorited) {
        await favoriteService.removeFavorite(propertyId);

        setFavoriteSnapshot({
          userKey,
          propertyId,
          value: false,
        });

        return;
      }

      await favoriteService.addFavorite(propertyId);

      setFavoriteSnapshot({
        userKey,
        propertyId,
        value: true,
      });
    } catch (error) {
      console.error("Không thể thay đổi trạng thái yêu thích:", error);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div
        aria-hidden="true"
        className="
          h-11
          w-11
          rounded-full
          border
          border-[#e0e6e2]
          bg-white
        "
      />
    );
  }
  if (!user || !canUseFavorites) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={busy}
      aria-label={
        favorited ? "Xóa khỏi danh sách yêu thích" : "Lưu bất động sản"
      }
      title={favorited ? "Xóa khỏi danh sách yêu thích" : "Lưu bất động sản"}
      className="
        grid
        h-11
        w-11
        place-items-center
        rounded-full
        border
        border-[#d8e0dc]
        bg-white
        text-[#58645e]
        transition

        hover:border-brand
        hover:text-brand

        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <Heart size={19} className={favorited ? "fill-brand text-brand" : ""} />
    </button>
  );
}
