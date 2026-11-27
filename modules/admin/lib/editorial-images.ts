import type { EditorialImage, EditorialImages, SiteImages, NormalizedSiteImages } from "./content";

const image = (publicId = "", cs = "", en = ""): EditorialImage => ({
  publicId,
  alt: { cs, en },
  focal: { desktop: "50% 50%", mobile: "50% 50%" },
});

const emptyImages = (count: number): EditorialImage[] =>
  Array.from({ length: count }, () => image());

export function defaultEditorialImages(): EditorialImages {
  return {
    home: {
      belt: [
        image("portfolio/scppmskdespdikncpzhz", "Kreativní portrét s výrazným světlem", "Creative portrait with expressive light"),
        image("portfolio/z1tvyvvw0kg6tga3iwef", "Portrét v červených šatech", "Portrait in a red dress"),
        image("portfolio/p55ackdjary2vyt0dalj", "Portrét ve slunečním světle", "Portrait in sunlight"),
      ],
      stories: [
        image("portfolio/z1tvyvvw0kg6tga3iwef", "Portrét v červených šatech", "Portrait in a red dress"),
        image("portfolio/p55ackdjary2vyt0dalj", "Portrét ve slunečním světle", "Portrait in sunlight"),
        image("portfolio/scppmskdespdikncpzhz", "Detail kreativního portrétu", "Creative portrait detail"),
      ],
      photographer: image(
        "site/fqny2o2ot6t7ab68muhc",
        "Fotograf Tomáš Guth Jarkovský",
        "Photographer Tomáš Guth Jarkovský",
      ),
      tools: { foceni101: image(), lightPlanner: image() },
    },
    portrait: {
      hero: image(
        "portfolio/scppmskdespdikncpzhz",
        "Kreativní portrét s výrazným světlem",
        "Creative portrait with expressive light",
      ),
      gallery: [
        image("portfolio/z1tvyvvw0kg6tga3iwef", "Portrét v červených šatech", "Portrait in a red dress"),
        image("portfolio/p55ackdjary2vyt0dalj", "Portrét ve slunečním světle", "Portrait in sunlight"),
        image("portfolio/scppmskdespdikncpzhz", "Detail kreativního portrétu", "Creative portrait detail"),
      ],
    },
    business: { hero: image(), headshots: emptyImages(3), atWork: emptyImages(3) },
    events: { hero: image(), weddingHero: image(), reportage: emptyImages(4), weddingGallery: emptyImages(3) },
    brand: { hero: image(), work: emptyImages(1) },
  };
}

export const isImageNode = (node: unknown): node is EditorialImage =>
  typeof node === "object" && node !== null && typeof (node as { publicId?: unknown }).publicId === "string";

type Tree = { [key: string]: Tree | undefined } | undefined;

function normalizeNode(template: unknown, stored: unknown): unknown {
  if (Array.isArray(template)) {
    const entries = Array.isArray(stored) ? stored : template;
    return entries.map((entry, index) => normalizeNode(template[index] ?? image(), entry));
  }
  const value = stored as Tree;
  if (isImageNode(template)) {
    const v = value as Partial<EditorialImage> | undefined;
    return {
      publicId: v?.publicId ?? template.publicId,
      alt: { cs: v?.alt?.cs ?? template.alt.cs, en: v?.alt?.en ?? template.alt.en },
      focal: {
        desktop: v?.focal?.desktop ?? template.focal.desktop,
        mobile: v?.focal?.mobile ?? template.focal.mobile,
      },
    };
  }
  return Object.fromEntries(
    Object.entries(template as object).map(([key, t]) => [key, normalizeNode(t, value?.[key])]),
  );
}

// KV saved before the belt existed has home.hero and the belt was hero + stories.
function migrateLegacyBelt(editorial: SiteImages["editorial"]): SiteImages["editorial"] {
  const home = editorial?.home as (Partial<EditorialImages["home"]> & { hero?: EditorialImage }) | undefined;
  if (!editorial || !home || home.belt || !home.hero) return editorial;
  const { hero, ...rest } = home;
  const belt = [hero, ...(home.stories ?? [])].filter((photo) => photo.publicId);
  return { ...editorial, home: { ...rest, belt: [...new Map(belt.map((photo) => [photo.publicId, photo])).values()] } as EditorialImages["home"] };
}

export function normalizeImages(data: Partial<SiteImages> = {}): NormalizedSiteImages {
  return {
    profile: data.profile ?? "",
    ...(data.heroTriptych && { heroTriptych: data.heroTriptych }),
    editorial: normalizeNode(defaultEditorialImages(), migrateLegacyBelt(data.editorial)) as EditorialImages,
  };
}
