import type { CollectionAfterReadHook } from "payload";

import type { AppUser } from "@/types/user";

export const populateAuthors: CollectionAfterReadHook = async ({ doc, req: { payload } }) => {
  if (!doc?.authors || doc.authors.length === 0) {
    return doc;
  }

  const authorDocs: AppUser[] = [];

  for (const author of doc.authors) {
    try {
      const authorDoc = (await payload.findByID({
        id: typeof author === "object" ? author?.id : author,
        collection: "users",
        depth: 0,
      })) as AppUser | null;

      if (authorDoc) {
        authorDocs.push(authorDoc);
      }
    } catch {
      // ignore missing authors to avoid breaking renders
      payload.logger.warn(`Failed to populate author for post with author id '${String(author)}'`);
    }
  }

  if (authorDocs.length > 0) {
    doc.populatedAuthors = authorDocs.map((authorDoc) => ({
      id: authorDoc.id,
      name: authorDoc.name,
    }));
  }

  return doc;
};
