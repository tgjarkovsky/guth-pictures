"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { EditorialImage, Testimonial } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import type { WorkItem } from "./work-items";

type Reviewed = { image: EditorialImage; review: Testimonial };

const isReviewed = (item: WorkItem): item is Reviewed => Boolean(item.review);
const wrap = (index: number, length: number) => (index + length) % length;

type Props = { items: WorkItem[]; locale: string; sizes: string[]; placeholderLabel: string };

// Client photos; each carries its review, revealed over the photo on hover/focus (always shown on touch).
// Clicking a reviewed photo opens it uncropped next to the full quote.
export function WorkGrid({ items, locale, sizes, placeholderLabel }: Props) {
  const reviews = items.filter(isReviewed);
  const [open, setOpen] = useState<number | null>(null);
  const cs = locale !== "en";

  return (
    <div className="ed-home-work__grid">
      {items.map((item, index) => (
        <figure key={`${item.image.publicId}-${index}`} className="ed-home-story">
          <div className="ed-home-story__photo">
            <EditorialImageView image={item.image} locale={locale} quality="best" sizes={sizes[index]} placeholderLabel={placeholderLabel} />
          </div>
          {item.review && (
            <>
              <figcaption>
                {item.review.quote && <blockquote>{item.review.quote}</blockquote>}
                <span>{byline(item.review)}</span>
              </figcaption>
              <button
                type="button"
                className="ed-home-story__open"
                aria-label={`${cs ? "Otevřít referenci" : "Open review"}: ${item.review.author}`}
                onClick={() => setOpen(reviews.indexOf(item as Reviewed))}
              />
            </>
          )}
        </figure>
      ))}
      {open !== null && <ReviewLightbox reviews={reviews} index={open} cs={cs} onNavigate={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}

const byline = (r: Testimonial) => (r.role ? `${r.author}, ${r.role}` : r.author);

type LightboxProps = { reviews: Reviewed[]; index: number; cs: boolean; onNavigate: (index: number) => void; onClose: () => void };

function ReviewLightbox({ reviews, index, cs, onNavigate, onClose }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const { image, review } = reviews[index];
  const many = reviews.length > 1;
  const go = (step: number) => onNavigate(wrap(index + step, reviews.length));

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!many) return;
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || !many) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
  };

  return (
    <dialog
      ref={ref}
      className="ed-review-lightbox"
      aria-label={cs ? "Reference" : "Review"}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={onTouchEnd}
    >
      <figure key={review.id} className="ed-review-lightbox__body">
        <div className="ed-review-lightbox__photo">
          <Image
            src={cloudinaryUrl(image.publicId, "q_auto:best")}
            alt={review.author}
            fill
            sizes="(min-width: 900px) 62vw, 100vw"
            className="ed-review-lightbox__img"
          />
        </div>
        <figcaption>
          {review.quote && <blockquote>{review.quote}</blockquote>}
          <span>{byline(review)}</span>
        </figcaption>
      </figure>
      <button type="button" className="ed-review-lightbox__close" aria-label={cs ? "Zavřít" : "Close"} onClick={onClose}>×</button>
      {many && (
        <nav className="ed-review-lightbox__nav" aria-label={cs ? "Další reference" : "More reviews"}>
          <button type="button" aria-label={cs ? "Předchozí" : "Previous"} onClick={() => go(-1)}>‹</button>
          <span>{index + 1} / {reviews.length}</span>
          <button type="button" aria-label={cs ? "Další" : "Next"} onClick={() => go(1)}>›</button>
        </nav>
      )}
    </dialog>
  );
}
