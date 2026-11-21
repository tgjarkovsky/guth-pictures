import { cloudinaryUrl } from "@/lib/cloudinary-utils";

/** Cloudinary public ID, or a full https URL (handy for a photo hosted elsewhere). */
export function voucherPhotoSrc(photo: string): string {
  if (/^https?:\/\//.test(photo)) return photo;
  return cloudinaryUrl(photo, "c_fill,g_auto,w_670,h_1240,q_85,f_jpg");
}
