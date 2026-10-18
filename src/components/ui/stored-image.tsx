import type { ComponentProps } from "react";
import { useStoredImage } from "@/hooks/use-stored-image";

type StoredImageProps = Omit<ComponentProps<"img">, "src"> & { src: string | Blob };

export function StoredImage({ src, ...props }: StoredImageProps) {
  const resolvedSource = useStoredImage(src);
  if (!resolvedSource) return null;
  return <img src={resolvedSource} {...props} />;
}
