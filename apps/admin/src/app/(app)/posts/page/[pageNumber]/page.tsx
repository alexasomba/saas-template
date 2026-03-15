import type { Metadata } from "next/types";

import { CollectionArchive } from "@/components/CollectionArchive";
import { PageRange } from "@/components/PageRange";
import { Pagination } from "@/components/Pagination";
import { retrySQLiteBusy } from "@/utilities/retrySQLiteBusy";
import { shouldGenerateStaticParamsFromDB } from "@/utilities/runtimeEnv";
import configPromise from "@payload-config";
import { getPayload } from "payload";
import React from "react";
import PageClient from "./page.client";
import { notFound } from "next/navigation";

export const revalidate = 600;

type Args = {
  params: Promise<{
    pageNumber: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise;
  const payload = await getPayload({ config: configPromise });

  const sanitizedPageNumber = Number(pageNumber);

  if (!Number.isInteger(sanitizedPageNumber)) notFound();

  const posts = await payload.find({
    collection: "posts",
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
    overrideAccess: false,
  });

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Posts</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise;
  return {
    title: `Posts Page ${pageNumber || ""}`,
  };
}

export async function generateStaticParams() {
  if (!shouldGenerateStaticParamsFromDB(process.env)) {
    return [];
  }

  try {
    const payload = await getPayload({ config: configPromise });
    const posts = await retrySQLiteBusy(() =>
      payload.find({
        collection: "posts",
        draft: false,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        select: {
          slug: true,
        },
      }),
    );

    const totalPages = Math.ceil(posts.docs.length / 12);

    const pages: { pageNumber: string }[] = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push({ pageNumber: String(i) });
    }

    return pages;
  } catch (error) {
    console.error("generateStaticParams error for posts/page/[pageNumber]:", error);
    return [];
  }
}
