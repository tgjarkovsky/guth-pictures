import Image from "next/image";
import { blurUrl, cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { EditorialImage } from "@/modules/admin/lib/content";

type Props = {
  image: EditorialImage;
  locale: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  placeholderLabel?: string;
  /** "best" trades bytes for the least visible compression. */
  quality?: "best";
};

export function EditorialImageView({
  image,
  locale,
  sizes,
  priority = false,
  className = "",
  placeholderLabel,
  quality,
}: Props) {
  const alt = locale === "en" ? image.alt.en : image.alt.cs;
  if (!image.publicId) {
    return (
      <div
        role="img"
        aria-label={placeholderLabel ?? alt}
        className={`editorial-image-placeholder ${className}`}
      >
        <span>{placeholderLabel ?? alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={cloudinaryUrl(image.publicId, quality === "best" ? "q_auto:best" : "")}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={blurUrl(image.publicId)}
      className={`editorial-image ${className}`}
      style={{
        "--focus-desktop": image.focal.desktop,
        "--focus-mobile": image.focal.mobile,
      } as React.CSSProperties}
    />
  );
}
