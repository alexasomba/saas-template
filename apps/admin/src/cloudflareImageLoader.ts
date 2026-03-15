// Docs: https://developers.cloudflare.com/images/image-resizing/
export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const params = [`width=${width}`, `format=auto`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const paramsString = params.join(",");

  // If the src is an absolute URL, Cloudflare Image Resizing can fetch it if it's on the same domain or an allowed remote domain.
  // For relative paths, it works perfectly against the main domain where the app is hosted.
  const separator = src.startsWith("/") ? "" : "/";
  return `/cdn-cgi/image/${paramsString}${separator}${src}`;
}
