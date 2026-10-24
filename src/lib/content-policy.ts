import type { SiteContent } from "./types";

/** The visitor-facing document must never contain draft albums. */
export function publicContent(content: SiteContent): SiteContent {
  return {
    ...content,
    albums: content.albums.filter((album) => album.published),
  };
}
