import type { CollectionConfig, Config } from "payload";
import { describe, expect, it } from "vitest";

import {
  CRM_COMPANIES_COLLECTION,
  CRM_CONTACTS_COLLECTION,
  CRM_DEALS_COLLECTION,
  CRM_INVOICES_COLLECTION,
  CRM_NOTES_COLLECTION,
  CRM_QUOTES_COLLECTION,
  CRM_SEGMENTS_COLLECTION,
  CRM_TICKETS_COLLECTION,
  MARKETING_EVENT_COLLECTION,
} from "@/plugins/crm/constants";
import { crmPlugin } from "@/plugins/crm";
import type { AppUser } from "@/types/user";

const getCollection = async (slug: string) => {
  const plugin = crmPlugin();
  const config = await Promise.resolve(plugin({ collections: [] } as unknown as Config));

  return config.collections?.find(
    (candidate: CollectionConfig) => candidate.slug === slug,
  ) as CollectionConfig;
};

const canAccess = (
  collection: CollectionConfig,
  operation: keyof NonNullable<CollectionConfig["access"]>,
  user?: Partial<AppUser>,
) => {
  const access = collection.access?.[operation];

  if (typeof access !== "function") {
    throw new Error(`Missing access function for ${collection.slug}.${operation}`);
  }

  return access({
    id: undefined,
    data: undefined,
    doc: undefined,
    req: {
      user: user as AppUser,
    },
  } as never);
};

describe("crm access matrix", () => {
  it("grants marketing users campaign and segment access without sales pipeline writes", async () => {
    const marketingEvents = await getCollection(MARKETING_EVENT_COLLECTION);
    const segments = await getCollection(CRM_SEGMENTS_COLLECTION);
    const deals = await getCollection(CRM_DEALS_COLLECTION);

    const marketingUser = { id: 1, roles: ["marketing"] } as Partial<AppUser>;

    expect(canAccess(marketingEvents, "create", marketingUser)).toBe(true);
    expect(canAccess(segments, "update", marketingUser)).toBe(true);
    expect(canAccess(deals, "create", marketingUser)).toBe(false);
  });

  it("scopes sales users to owned deals for reads and writes", async () => {
    const deals = await getCollection(CRM_DEALS_COLLECTION);

    const salesUser = { id: 2, roles: ["sales"] } as Partial<AppUser>;

    expect(canAccess(deals, "create", salesUser)).toBe(true);
    expect(canAccess(deals, "read", salesUser)).toEqual({
      owner: {
        equals: 2,
      },
    });
    expect(canAccess(deals, "update", salesUser)).toEqual({
      owner: {
        equals: 2,
      },
    });
  });

  it("scopes service users to assigned or unassigned tickets and blocks deal writes", async () => {
    const deals = await getCollection(CRM_DEALS_COLLECTION);
    const tickets = await getCollection(CRM_TICKETS_COLLECTION);

    const serviceUser = { id: 3, roles: ["service"] } as Partial<AppUser>;

    expect(canAccess(tickets, "read", serviceUser)).toEqual({
      or: [
        {
          assignee: {
            equals: 3,
          },
        },
        {
          assignee: {
            exists: false,
          },
        },
      ],
    });
    expect(canAccess(tickets, "update", serviceUser)).toEqual({
      assignee: {
        equals: 3,
      },
    });
    expect(canAccess(deals, "update", serviceUser)).toBe(false);
  });

  it("grants finance users read-only access across CRM operational records", async () => {
    const marketingEvents = await getCollection(MARKETING_EVENT_COLLECTION);
    const deals = await getCollection(CRM_DEALS_COLLECTION);
    const invoices = await getCollection(CRM_INVOICES_COLLECTION);
    const tickets = await getCollection(CRM_TICKETS_COLLECTION);

    const financeUser = { id: 4, roles: ["finance"] } as Partial<AppUser>;

    expect(canAccess(deals, "read", financeUser)).toBe(true);
    expect(canAccess(tickets, "read", financeUser)).toBe(true);
    expect(canAccess(invoices, "update", financeUser)).toBe(true);
    expect(canAccess(marketingEvents, "read", financeUser)).toBe(false);
    expect(canAccess(deals, "create", financeUser)).toBe(false);
  });

  it("scopes sales users to owned quotes and blocks invoice writes", async () => {
    const quotes = await getCollection(CRM_QUOTES_COLLECTION);
    const invoices = await getCollection(CRM_INVOICES_COLLECTION);

    const salesUser = { id: 9, roles: ["sales"] } as Partial<AppUser>;

    expect(canAccess(quotes, "create", salesUser)).toBe(true);
    expect(canAccess(quotes, "read", salesUser)).toEqual({
      owner: {
        equals: 9,
      },
    });
    expect(canAccess(invoices, "read", salesUser)).toEqual({
      owner: {
        equals: 9,
      },
    });
    expect(canAccess(invoices, "update", salesUser)).toBe(false);
  });

  it("scopes contact and company access by ownership for sales users", async () => {
    const contacts = await getCollection(CRM_CONTACTS_COLLECTION);
    const companies = await getCollection(CRM_COMPANIES_COLLECTION);

    const salesUser = { id: 6, roles: ["sales"] } as Partial<AppUser>;

    expect(canAccess(contacts, "read", salesUser)).toEqual({
      or: [
        {
          owner: {
            equals: 6,
          },
        },
        {
          accountManager: {
            equals: 6,
          },
        },
      ],
    });
    expect(canAccess(companies, "update", salesUser)).toEqual({
      owner: {
        equals: 6,
      },
    });
  });

  it("scopes note updates to the author for sales and service users", async () => {
    const notes = await getCollection(CRM_NOTES_COLLECTION);

    const salesUser = { id: 7, roles: ["sales"] } as Partial<AppUser>;
    const serviceUser = { id: 8, roles: ["service"] } as Partial<AppUser>;

    expect(canAccess(notes, "update", salesUser)).toEqual({
      author: {
        equals: 7,
      },
    });
    expect(canAccess(notes, "update", serviceUser)).toEqual({
      author: {
        equals: 8,
      },
    });
  });

  it("grants revops users marketing, sales, and service operational writes", async () => {
    const marketingEvents = await getCollection(MARKETING_EVENT_COLLECTION);
    const deals = await getCollection(CRM_DEALS_COLLECTION);
    const invoices = await getCollection(CRM_INVOICES_COLLECTION);
    const quotes = await getCollection(CRM_QUOTES_COLLECTION);
    const tickets = await getCollection(CRM_TICKETS_COLLECTION);

    const revopsUser = { id: 5, roles: ["revops"] } as Partial<AppUser>;

    expect(canAccess(marketingEvents, "update", revopsUser)).toBe(true);
    expect(canAccess(deals, "update", revopsUser)).toBe(true);
    expect(canAccess(quotes, "update", revopsUser)).toBe(true);
    expect(canAccess(invoices, "update", revopsUser)).toBe(true);
    expect(canAccess(tickets, "update", revopsUser)).toBe(true);
  });
});
