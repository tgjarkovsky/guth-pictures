import { Epilogue, Syne } from "next/font/google";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminShell } from "@/modules/admin/components/AdminShell";
import { StoriesAdmin } from "@/modules/stories/components/StoriesAdmin";

// stejná písma jako editorial web (nadpisy Syne, text Epilogue), latin-ext kvůli češtině
const display = Syne({ subsets: ["latin", "latin-ext"], weight: ["700", "800"] });
const sans = Epilogue({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"] });

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
