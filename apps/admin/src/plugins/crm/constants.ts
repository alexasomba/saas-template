export const MARKETING_EVENT_COLLECTION = "marketing-email-events";
export const CRM_CONTACTS_COLLECTION = "crm-contacts";
export const CRM_ACTIVITIES_COLLECTION = "crm-activities";
export const CRM_WEBHOOK_EVENTS_COLLECTION = "crm-webhook-events";
export const CRM_COMPANIES_COLLECTION = "crm-companies";
export const CRM_DEALS_COLLECTION = "crm-deals";
export const CRM_QUOTES_COLLECTION = "crm-quotes";
export const CRM_INVOICES_COLLECTION = "crm-invoices";
export const CRM_NOTES_COLLECTION = "crm-notes";
export const CRM_SEGMENTS_COLLECTION = "crm-segments";
export const CRM_TICKETS_COLLECTION = "crm-tickets";

export const CAMPAIGN_SLUGS = {
  abandonedCart: "abandoned-cart",
  firstTimeBuyer: "first-time-buyer",
  invoiceDueReminder: "invoice-due-reminder",
  invoiceOverdueReminder: "invoice-overdue-reminder",
  quoteExpiryReminder: "quote-expiry-reminder",
  winBack: "win-back",
} as const;

export const CRM_ACTIVITY_TYPES = {
  campaignSent: "campaign-sent",
  cartIdentified: "cart-identified",
  dealCreated: "deal-created",
  dealStageChanged: "deal-stage-changed",
  invoiceCreated: "invoice-created",
  invoicePaid: "invoice-paid",
  invoicePartiallyPaid: "invoice-partially-paid",
  invoicePaymentRecorded: "invoice-payment-recorded",
  invoiceStatusChanged: "invoice-status-changed",
  noteAdded: "note-added",
  orderPlaced: "order-placed",
  orderStatusChanged: "order-status-changed",
  quoteCreated: "quote-created",
  quoteStatusChanged: "quote-status-changed",
  ticketCreated: "ticket-created",
  ticketStatusChanged: "ticket-status-changed",
  userSynced: "user-synced",
} as const;

export const DEFAULT_ABANDONED_CART_DELAY_HOURS = 4;
export const DEFAULT_WIN_BACK_DELAY_DAYS = 30;

export type CampaignSlug = (typeof CAMPAIGN_SLUGS)[keyof typeof CAMPAIGN_SLUGS];
export type CRMActivityType = (typeof CRM_ACTIVITY_TYPES)[keyof typeof CRM_ACTIVITY_TYPES];
