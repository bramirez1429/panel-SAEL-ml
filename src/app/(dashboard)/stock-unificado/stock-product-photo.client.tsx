"use client";

import Image from "next/image";
import { useState } from "react";

type Props = Readonly<{
  imageUrl: string | null;
  alt: string;
}>;

/** Vista segura con fallback cuando la plataforma no informa imagen o falla la carga. */
export function StockProductPhoto({ imageUrl, alt }: Props) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(imageUrl?.startsWith("https://") && !failed);

  return (
    <div style={{
      display: "grid",
      placeItems: "center",
      width: 112,
      height: 126,
      border: "1px solid #e6ebf3",
      borderRadius: 12,
      background: "#f8faff",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {hasImage && imageUrl ? (
        <Image
          unoptimized
          src={imageUrl}
          alt={alt}
          width={110}
          height={124}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <span role="img" aria-label="Foto no disponible" style={{
          color: "#8290aa",
          fontSize: 11,
          textAlign: "center",
          padding: 10,
          lineHeight: 1.4,
        }}>
          Sin foto disponible
        </span>
      )}
    </div>
  );
}
