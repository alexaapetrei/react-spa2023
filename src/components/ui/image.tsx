import { useState } from "react";
import { cn } from "../../lib/utils";
import { useStoredImage } from "@/hooks/use-stored-image";

type ImageProps = {
  src: string | Blob;
  alt: string;
  className?: string;
  containerClassName?: string;
};

export default function Image({ src, alt, className, containerClassName }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const resolvedSource = useStoredImage(src);

  return (
    <div className={cn("relative", containerClassName)}>
      {!loaded && <div className="absolute inset-0 bg-muted rounded-lg animate-pulse" />}
      <img
        src={resolvedSource}
        alt={alt}
        className={cn(
          "max-w-full rounded-lg shadow-md transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
