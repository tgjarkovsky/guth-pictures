// Server-safe: page components call reviewedWork() while WorkGrid is a client component.
import type { EditorialImage, Testimonial, TestimonialService } from "@/modules/admin/lib/content";

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
