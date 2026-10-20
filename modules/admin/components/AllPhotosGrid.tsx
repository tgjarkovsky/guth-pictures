import Image from "next/image";
import { type GalleryPhoto } from "@/modules/gallery/lib/gallery";
import { CLOUD, watermarkedUrl } from "./galleryImage";

interface Props {
  photos: GalleryPhoto[];
  favorites: string[] | undefined;
}

export function AllPhotosGrid({ photos, favorites }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-medium">Všechny fotky ({photos.length})</h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
        {photos.map((photo) => {
          const isFav = favorites?.includes(photo.lrId);
          return (
            <div
              key={photo.lrId}
              className={`relative aspect-square bg-zinc-900 overflow-hidden ${
                isFav ? "ring-2 ring-white" : ""
              }`}
            >
              <Image
                src={watermarkedUrl(photo.cloudinaryId, CLOUD)}
                alt={photo.filename}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
