import type { ImgHTMLAttributes } from "react";
import { responsiveImageAttributes } from "./responsive-image-model.mjs";

type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "alt"> & {
  src: string;
  alt: string;
  sizes: string;
  preferredWidth?: 480 | 768 | 1024 | 1440;
};

export function ResponsiveImage({ src, alt, sizes, preferredWidth, decoding = "async", ...props }: ResponsiveImageProps) {
  const responsive = responsiveImageAttributes(src, { sizes, preferredWidth });
  // Bu bileşen Next Image yerine projenin kendi boyutlandırılmış WebP hattını kullanır.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} {...responsive} alt={alt} decoding={decoding} />;
}
