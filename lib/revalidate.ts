import { revalidatePath } from "next/cache";

const LOCALES = ["cs", "en"] as const;

/** Paths are given without locale; "" is the locale root. */
export function revalidateLocalized(paths: string[]) {
  for (const path of paths) {
    for (const locale of LOCALES) revalidatePath(`/${locale}${path}`);
  }
}

export const CONTENT_PAGES = [
  "", "/sluzby", "/firemni-portrety", "/sluzby/portretni-foceni",
  "/sluzby/brandove-foceni", "/sluzby/eventy-a-svatby", "/o-mne",
];

export const IMAGE_PAGES = [
  "", "/sluzby/portretni-foceni", "/firemni-portrety", "/sluzby/eventy-a-svatby",
];

export const BLOG_INDEX = ["/blog"];
