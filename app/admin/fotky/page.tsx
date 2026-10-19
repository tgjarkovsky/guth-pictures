import { getGalleryPhotos } from "@/lib/cloudinary";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { AdminDashboard } from "@/modules/admin/components/AdminDashboard";
import { AdminShell } from "@/modules/admin/components/AdminShell";

export default async function FotkyPage() {
  const [photos, images, cs, en] = await Promise.all([
    getGalleryPhotos("portfolio"),
    getImages(),
    getContent("cs"),
    getContent("en"),
  ]);
  const heroTriptych = images.heroTriptych;
  return (
    <AdminShell>
      <AdminDashboard photos={photos} heroTriptych={heroTriptych} editorial={images.editorial} references={{ cs: cs.testimonials, en: en.testimonials }} />
    </AdminShell>
  );
}
