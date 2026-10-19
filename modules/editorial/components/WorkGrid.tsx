import type { EditorialImage, Testimonial, TestimonialService } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";

export type WorkItem = { image: EditorialImage; review?: Testimonial };

const clientPhoto = (t: Testimonial): EditorialImage => ({
  publicId: t.photo ?? "",
  alt: { cs: t.author, en: t.author },
  focal: { desktop: "50% 30%", mobile: "50% 30%" },
});

export const reviewedWork = (testimonials: Testimonial[], service: TestimonialService): WorkItem[] =>
  testimonials
    .filter((t) => t.photo && (t.service ?? "creative") === service)
    .map((t) => ({ image: clientPhoto(t), review: t }));

type Props = { items: WorkItem[]; locale: string; sizes: (index: number) => string; placeholderLabel: string };

// Client photos; each carries its review, revealed over the photo on hover/focus (always shown on touch).
export function WorkGrid({ items, locale, sizes, placeholderLabel }: Props) {
  return (
    <div className="ed-home-work__grid">
      {items.map(({ image, review }, index) => (
        <figure key={`${image.publicId}-${index}`} className="ed-home-story" tabIndex={review ? 0 : undefined}>
          <div className="ed-home-story__photo">
            <EditorialImageView image={image} locale={locale} quality="best" sizes={sizes(index)} placeholderLabel={placeholderLabel} />
          </div>
          {review && (
            <figcaption>
              <blockquote>{review.quote}</blockquote>
              <span>{review.author}{review.role && `, ${review.role}`}</span>
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
