import { useEffect, useState } from "react";

export function useStoredImage(image?: string | Blob): string | undefined {
  const [source, setSource] = useState<string>();

  useEffect(() => {
    if (!image || typeof image === "string") {
      setSource(image || undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setSource(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  return source;
}
