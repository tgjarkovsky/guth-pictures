// next/image loader: Cloudinary resizes and encodes once. The default optimizer
// re-encoded Cloudinary's already-lossy output (q_auto → WebP q75), visibly degrading photos.

const UPLOAD = "/image/upload/";
const TRANSFORM_PARAM = /^(a|ac|af|ar|b|bo|br|c|co|cs|d|dl|dn|dpr|du|e|eo|f|fl|fn|fps|g|h|if|ki|l|o|p|pg|q|r|so|sp|t|u|vc|vs|w|x|y|z)_/;

const QUALITY_ONLY = /^q_[^,]+$/;

const isTransform = (segment: string) => segment.split(",").every((part) => TRANSFORM_PARAM.test(part));

// A src may carry a lone quality segment (e.g. "q_auto:best"); it replaces the default
// in the final step instead of staying in the chain, so the photo is encoded only once.
export default function cloudinaryLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const at = src.indexOf(UPLOAD);
  if (!src.startsWith("https://res.cloudinary.com/") || at === -1) return src;

  const parts = src.slice(at + UPLOAD.length).split("/");
  const quality = parts.find((segment) => QUALITY_ONLY.test(segment)) ?? "q_auto:good";
  const segments = parts.filter((segment) => !QUALITY_ONLY.test(segment));
  const transforms = segments.findIndex((segment) => !isTransform(segment));
  segments.splice(transforms, 0, `c_limit,w_${width},${quality},f_auto`);
  return src.slice(0, at + UPLOAD.length) + segments.join("/");
}
