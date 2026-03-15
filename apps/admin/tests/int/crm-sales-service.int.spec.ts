import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  syncDealCRMActivityAfterChange,
  syncNoteCRMActivityAfterChange,
  syncTicketCRMActivityAfterChange,
} from "@/plugins/crm/hooks";

type DealChangeArgs = Parameters<typeof syncDealCRMActivityAfterChange>[0];
type TicketChangeArgs = Parameters<typeof syncTicketCRMActivityAfterChange>[0];
type NoteChangeArgs = Parameters<typeof syncNoteCRMActivityAfterChange>[0];

describe("crm sales and service activities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a deal creation activity with the deal relation", async () => {
    const create = vi.fn().mockResolvedValue({ id: 91 });
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

    await syncDealCRMActivityAfterChange({
      doc: {
        id: 91,
        title: "Warehouse Expansion",
        primaryContact: 12,
        createdAt: "2026-03-09T08:00:00.000Z",
      } as DealChangeArgs["doc"],
      operation: "create",
      req: {
        payload: {
          create,
          find,
        },
      } as unknown as DealChangeArgs["req"],
    } as DealChangeArgs);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-activities",
        data: expect.objectContaining({
          contact: 12,
          deal: 91,
          type: "deal-created",
        }),
      }),
    );
  });

  it("records ticket status changes with the linked ticket", async () => {
    const create = vi.fn().mockResolvedValue({ id: 72 });
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });

    await syncTicketCRMActivityAfterChange({
      doc: {
        id: 72,
        contact: 18,
        status: "resolved",
        subject: "Delivery damaged",
        updatedAt: "2026-03-09T09:00:00.000Z",
      } as TicketChangeArgs["doc"],
      operation: "update",
      previousDoc: {
        id: 72,
        contact: 18,
        status: "open",
        subject: "Delivery damaged",
      } as TicketChangeArgs["previousDoc"],
      req: {
        payload: {
          create,
          find,
        },
      } as unknown as TicketChangeArgs["req"],
    } as TicketChangeArgs);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-activities",
        data: expect.objectContaining({
          contact: 18,
          ticket: 72,
          type: "ticket-status-changed",
        }),
      }),
    );
  });

  it("derives the contact for a note linked through a deal", async () => {
    const create = vi.fn().mockResolvedValue({ id: 303 });
    const find = vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 });
    const findByID = vi.fn().mockResolvedValue({
      id: 55,
      primaryContact: 7,
    });

    await syncNoteCRMActivityAfterChange({
      doc: {
        id: 303,
        deal: 55,
        subject: "Qualified lead call",
        createdAt: "2026-03-09T10:00:00.000Z",
      } as NoteChangeArgs["doc"],
      operation: "create",
      req: {
        payload: {
          create,
          find,
          findByID,
        },
      } as unknown as NoteChangeArgs["req"],
    } as NoteChangeArgs);

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-deals",
        id: 55,
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "crm-activities",
        data: expect.objectContaining({
          contact: 7,
          deal: 55,
          note: 303,
          type: "note-added",
        }),
      }),
    );
  });
});
