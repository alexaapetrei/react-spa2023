import { useState, useEffect } from "react";

export function useImage(imageId: number | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageId || imageId === 0) {
      setSrc(null);
      return;
    }

    setLoading(true);
    setSrc(null);
    setLoading(false);
  }, [imageId]);

  return { src, loading };
}
