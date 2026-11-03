import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { EditorialImage } from "@/modules/admin/lib/content";

const THUMB = "c_fill,ar_4:5,g_auto,w_560,q_auto,f_auto";
const MIN_PHOTOS = 8;

// Whole rounds of the list, so a short list still fills the screen and the seam of the loop keeps its order.
export function beltPhotos(images: EditorialImage[], min = MIN_PHOTOS): EditorialImage[] {
  if (images.length === 0) return [];
  const rounds = Math.ceil(min / images.length);
  return Array.from({ length: rounds }, () => images).flat();
}

// Decorative, CSS-only belt of portraits. The second group is a copy of the first one, so translating
// the track by -50% loops seamlessly. No JS: the animation runs on the compositor.
export function PhotoBelt({ images }: { images: EditorialImage[] }) {
  const photos = beltPhotos(images);
  if (photos.length === 0) return null;
  return (
    <div className="ed-belt" aria-hidden="true">
      <div className="ed-belt__track">
        {[0, 1].map((copy) => (
          <div key={copy} className="ed-belt__group">
            {photos.map((image, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={cloudinaryUrl(image.publicId, THUMB)} alt="" decoding="async" loading={copy === 0 ? "eager" : "lazy"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
