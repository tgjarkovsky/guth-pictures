import { ImageResponse } from "next/og";

// Same viewfinder as app/icon.svg, full-bleed because iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 32 32">
        <rect width="32" height="32" fill="#232120" />
        <path
          d="M7.5 12.5V7.5h5M19.5 7.5h5v5M24.5 19.5v5h-5M12.5 24.5h-5v-5"
          fill="none"
          stroke="#f1eee9"
          strokeWidth="3"
          strokeLinecap="square"
        />
        <circle cx="16" cy="16" r="3.2" fill="#c4574a" />
      </svg>
    ),
    size
  );
}
