import { Epilogue, Syne } from "next/font/google";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminShell } from "@/modules/admin/components/AdminShell";
import { StoriesAdmin } from "@/modules/stories/components/StoriesAdmin";

// písma editorial webu: Syne jen na wordmark, nadpisy a text Epilogue; latin-ext kvůli češtině
const display = Syne({ subsets: ["latin", "latin-ext"], weight: ["700"] });
const sans = Epilogue({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "800"] });

export default async function StoriesPage() {
  const photos = await getGalleryPhotos("portfolio");
  return (
    <AdminShell>
      <div style={{
        "--story-font-display": display.style.fontFamily,
        "--story-font-sans": sans.style.fontFamily,
      } as React.CSSProperties}>
        <StoriesAdmin galleryPhotos={photos} />
      </div>
    </AdminShell>
  );
}
