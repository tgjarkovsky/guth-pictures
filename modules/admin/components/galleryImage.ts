export const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export function watermarkedUrl(cloudinaryId: string, cloudName: string) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/l_text:Arial_32_bold:PREVIEW,co_white,o_50,g_center/c_fit,w_600/${cloudinaryId}.jpg`;
}
