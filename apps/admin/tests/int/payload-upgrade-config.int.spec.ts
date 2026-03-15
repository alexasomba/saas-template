import { describe, expect, it } from "vitest";
import type { CollectionConfig, Config } from "payload";

import {
  scheduledDraftVersions,
  setPublishedAtIfPublishing,
} from "@/collections/shared/versioning";
import { crmPlugin } from "@/plugins/crm";
import { importExportCollections, importExportLimits } from "@/plugins/importExportConfig";

describe("payload upgrade config", () => {
  it("keeps scheduled drafts enabled for pages and posts", () => {
    expect(scheduledDraftVersions).toEqual({
      drafts: {
        autosave: {
          interval: 100,
        },
        schedulePublish: true,
      },
      maxPerDoc: 50,
    });
  });

  it("sets publishedAt when a document is published without a manual date", () => {
    const pageResult = setPublishedAtIfPublishing({
      siblingData: { _status: "published" },
      value: undefined,
    });
    const postResult = setPublishedAtIfPublishing({
      siblingData: { _status: "published" },
      value: undefined,
    });

    expect(pageResult).toBeInstanceOf(Date);
    expect(postResult).toBeInstanceOf(Date);
  });

  it("does not overwrite a manual publishedAt value or draft state", () => {
    const manualDate = new Date("2026-03-09T12:00:00.000Z");

    expect(
      setPublishedAtIfPublishing({
        siblingData: { _status: "published" },
        value: manualDate,
      }),
    ).toBe(manualDate);

    expect(
      setPublishedAtIfPublishing({
        siblingData: { _status: "draft" },
        value: undefined,
      }),
    ).toBeUndefined();
  });

  it("keeps import/export guardrails aligned with the upgrade plan", () => {
    expect(importExportLimits).toEqual({
      exportLimit: 500,
      importLimit: 250,
    });

    expect(importExportCollections).toEqual([
      {
        slug: "pages",
        export: { limit: 200 },
        import: { defaultVersionStatus: "draft", limit: 100 },
      },
      {
        slug: "posts",
        export: { limit: 300 },
        import: { defaultVersionStatus: "draft", limit: 150 },
      },
      {
        slug: "categories",
        export: { limit: 200 },
        import: { limit: 100 },
      },
      {
        slug: "users",
        export: false,
        import: false,
      },
      {
        slug: "products",
        export: { limit: 500 },
        import: { defaultVersionStatus: "draft", limit: 250 },
      },
      {
        slug: "orders",
        export: { limit: 500 },
        import: false,
      },
    ]);
  });

  it("prevents the CRM plugin from re-creating migrated crmContact indexes at runtime", async () => {
    const baseCollections: CollectionConfig[] = [
      { slug: "users", fields: [] },
      { slug: "carts", fields: [] },
      { slug: "orders", fields: [] },
    ];

    const plugin = crmPlugin();
    const config = await Promise.resolve(
      plugin({
        collections: baseCollections,
      } as Config),
    );

    const getCRMContactField = (slug: string) => {
      const collection = config.collections?.find(
        (candidate: CollectionConfig) => candidate.slug === slug,
      );
      const fields = collection?.fields ?? [];

      return fields.find((field) => "name" in field && field.name === "crmContact");
    };

    expect(getCRMContactField("users")).toMatchObject({
      name: "crmContact",
      index: false,
      type: "relationship",
    });
    expect(getCRMContactField("carts")).toMatchObject({
      name: "crmContact",
      index: false,
      type: "relationship",
    });
    expect(getCRMContactField("orders")).toMatchObject({
      name: "crmContact",
      index: false,
      type: "relationship",
    });
  });

  it("registers CRM document workflow actions for deals, quotes, invoices, and orders", async () => {
    const baseCollections: CollectionConfig[] = [
      { slug: "users", fields: [] },
      { slug: "carts", fields: [] },
      { slug: "orders", fields: [] },
    ];

    const plugin = crmPlugin();
    const config = await Promise.resolve(
      plugin({
        collections: baseCollections,
      } as Config),
    );

    const getBeforeDocumentControls = (slug: string) => {
      const collection = config.collections?.find(
        (candidate: CollectionConfig) => candidate.slug === slug,
      );

      return collection?.admin?.components?.edit?.beforeDocumentControls;
    };

    expect(getBeforeDocumentControls("crm-deals")).toEqual(
      expect.arrayContaining(["@/components/crm/AdminWorkflowActions#DealWorkflowActions"]),
    );
    expect(getBeforeDocumentControls("crm-quotes")).toEqual(
      expect.arrayContaining(["@/components/crm/AdminWorkflowActions#QuoteWorkflowActions"]),
    );
    expect(getBeforeDocumentControls("crm-invoices")).toEqual(
      expect.arrayContaining(["@/components/crm/AdminWorkflowActions#InvoiceWorkflowActions"]),
    );
    expect(getBeforeDocumentControls("orders")).toEqual(
      expect.arrayContaining(["@/components/crm/AdminWorkflowActions#OrderWorkflowActions"]),
    );
  });
});
