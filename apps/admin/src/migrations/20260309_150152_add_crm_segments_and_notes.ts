import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`crm_companies\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`website\` text,
  	\`phone\` text,
  	\`industry\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_companies_name_idx\` ON \`crm_companies\` (\`name\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_companies_updated_at_idx\` ON \`crm_companies\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_companies_created_at_idx\` ON \`crm_companies\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_deals\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`primary_contact_id\` integer NOT NULL,
  	\`company_id\` integer,
  	\`owner_id\` integer,
  	\`stage\` text DEFAULT 'lead' NOT NULL,
  	\`value\` numeric DEFAULT 0,
  	\`expected_close_date\` text,
  	\`notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`primary_contact_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`company_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`CREATE INDEX \`crm_deals_primary_contact_idx\` ON \`crm_deals\` (\`primary_contact_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_deals_company_idx\` ON \`crm_deals\` (\`company_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_deals_owner_idx\` ON \`crm_deals\` (\`owner_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_deals_updated_at_idx\` ON \`crm_deals\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`crm_deals_created_at_idx\` ON \`crm_deals\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`crm_notes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`subject\` text NOT NULL,
  	\`category\` text DEFAULT 'internal' NOT NULL,
  	\`body\` text NOT NULL,
  	\`author_id\` integer,
  	\`contact_id\` integer,
  	\`company_id\` integer,
  	\`deal_id\` integer,
  	\`ticket_id\` integer,
  	\`order_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`contact_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`company_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`deal_id\`) REFERENCES \`crm_deals\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`ticket_id\`) REFERENCES \`crm_tickets\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`crm_notes_author_idx\` ON \`crm_notes\` (\`author_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_notes_contact_idx\` ON \`crm_notes\` (\`contact_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_notes_company_idx\` ON \`crm_notes\` (\`company_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_notes_deal_idx\` ON \`crm_notes\` (\`deal_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_notes_ticket_idx\` ON \`crm_notes\` (\`ticket_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_notes_order_idx\` ON \`crm_notes\` (\`order_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_notes_updated_at_idx\` ON \`crm_notes\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`crm_notes_created_at_idx\` ON \`crm_notes\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`crm_segments_lifecycle_stages\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`crm_segments\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`crm_segments_lifecycle_stages_order_idx\` ON \`crm_segments_lifecycle_stages\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_segments_lifecycle_stages_parent_id_idx\` ON \`crm_segments_lifecycle_stages\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_segments_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`crm_segments\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`crm_segments_tags_order_idx\` ON \`crm_segments_tags\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_segments_tags_parent_id_idx\` ON \`crm_segments_tags\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_segments\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`description\` text,
  	\`marketing_opt_in_only\` integer DEFAULT false,
  	\`minimum_total_orders\` numeric,
  	\`minimum_total_spend\` numeric,
  	\`last_order_before_days\` numeric,
  	\`estimated_contacts\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`crm_segments_name_idx\` ON \`crm_segments\` (\`name\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_segments_updated_at_idx\` ON \`crm_segments\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_segments_created_at_idx\` ON \`crm_segments\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_tickets\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`subject\` text NOT NULL,
  	\`contact_id\` integer NOT NULL,
  	\`company_id\` integer,
  	\`order_id\` integer,
  	\`assignee_id\` integer,
  	\`status\` text DEFAULT 'open' NOT NULL,
  	\`priority\` text DEFAULT 'medium' NOT NULL,
  	\`channel\` text DEFAULT 'web' NOT NULL,
  	\`description\` text NOT NULL,
  	\`resolution\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`contact_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`company_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`assignee_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`crm_tickets_contact_idx\` ON \`crm_tickets\` (\`contact_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_tickets_company_idx\` ON \`crm_tickets\` (\`company_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_tickets_order_idx\` ON \`crm_tickets\` (\`order_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_tickets_assignee_idx\` ON \`crm_tickets\` (\`assignee_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_tickets_updated_at_idx\` ON \`crm_tickets\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_tickets_created_at_idx\` ON \`crm_tickets\` (\`created_at\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`crm_contacts\` ADD \`company_id\` integer REFERENCES crm_companies(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_contacts_company_idx\` ON \`crm_contacts\` (\`company_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`crm_activities\` ADD \`deal_id\` integer REFERENCES crm_deals(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`crm_activities\` ADD \`ticket_id\` integer REFERENCES crm_tickets(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`crm_activities\` ADD \`note_id\` integer REFERENCES crm_notes(id);`,
  );
  await db.run(sql`CREATE INDEX \`crm_activities_deal_idx\` ON \`crm_activities\` (\`deal_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_activities_ticket_idx\` ON \`crm_activities\` (\`ticket_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_activities_note_idx\` ON \`crm_activities\` (\`note_id\`);`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_companies_id\` integer REFERENCES crm_companies(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_deals_id\` integer REFERENCES crm_deals(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_notes_id\` integer REFERENCES crm_notes(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_segments_id\` integer REFERENCES crm_segments(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_tickets_id\` integer REFERENCES crm_tickets(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_companies_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_companies_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_deals_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_deals_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_notes_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_notes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_segments_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_segments_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_tickets_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_tickets_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`crm_companies\`;`);
  await db.run(sql`DROP TABLE \`crm_deals\`;`);
  await db.run(sql`DROP TABLE \`crm_notes\`;`);
  await db.run(sql`DROP TABLE \`crm_segments_lifecycle_stages\`;`);
  await db.run(sql`DROP TABLE \`crm_segments_tags\`;`);
  await db.run(sql`DROP TABLE \`crm_segments\`;`);
  await db.run(sql`DROP TABLE \`crm_tickets\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_crm_contacts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`email\` text NOT NULL,
  	\`name\` text,
  	\`phone\` text,
  	\`user_id\` integer,
  	\`marketing_opt_in\` integer DEFAULT false,
  	\`lifecycle_stage\` text DEFAULT 'subscriber' NOT NULL,
  	\`total_orders\` numeric DEFAULT 0,
  	\`total_spend\` numeric DEFAULT 0,
  	\`first_order_at\` text,
  	\`last_order_at\` text,
  	\`last_cart_at\` text,
  	\`last_campaign_sent_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_crm_contacts\`("id", "email", "name", "phone", "user_id", "marketing_opt_in", "lifecycle_stage", "total_orders", "total_spend", "first_order_at", "last_order_at", "last_cart_at", "last_campaign_sent_at", "updated_at", "created_at") SELECT "id", "email", "name", "phone", "user_id", "marketing_opt_in", "lifecycle_stage", "total_orders", "total_spend", "first_order_at", "last_order_at", "last_cart_at", "last_campaign_sent_at", "updated_at", "created_at" FROM \`crm_contacts\`;`,
  );
  await db.run(sql`DROP TABLE \`crm_contacts\`;`);
  await db.run(sql`ALTER TABLE \`__new_crm_contacts\` RENAME TO \`crm_contacts\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_contacts_email_idx\` ON \`crm_contacts\` (\`email\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_contacts_user_idx\` ON \`crm_contacts\` (\`user_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_contacts_updated_at_idx\` ON \`crm_contacts\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_contacts_created_at_idx\` ON \`crm_contacts\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_crm_activities\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`event_key\` text NOT NULL,
  	\`type\` text NOT NULL,
  	\`summary\` text NOT NULL,
  	\`occurred_at\` text NOT NULL,
  	\`contact_id\` integer NOT NULL,
  	\`order_id\` integer,
  	\`cart_id\` integer,
  	\`marketing_event_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`contact_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`marketing_event_id\`) REFERENCES \`marketing_email_events\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_crm_activities\`("id", "event_key", "type", "summary", "occurred_at", "contact_id", "order_id", "cart_id", "marketing_event_id", "updated_at", "created_at") SELECT "id", "event_key", "type", "summary", "occurred_at", "contact_id", "order_id", "cart_id", "marketing_event_id", "updated_at", "created_at" FROM \`crm_activities\`;`,
  );
  await db.run(sql`DROP TABLE \`crm_activities\`;`);
  await db.run(sql`ALTER TABLE \`__new_crm_activities\` RENAME TO \`crm_activities\`;`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_activities_event_key_idx\` ON \`crm_activities\` (\`event_key\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_activities_contact_idx\` ON \`crm_activities\` (\`contact_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_activities_order_idx\` ON \`crm_activities\` (\`order_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_activities_cart_idx\` ON \`crm_activities\` (\`cart_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_activities_marketing_event_idx\` ON \`crm_activities\` (\`marketing_event_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_activities_updated_at_idx\` ON \`crm_activities\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_activities_created_at_idx\` ON \`crm_activities\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`pages_id\` integer,
  	\`posts_id\` integer,
  	\`categories_id\` integer,
  	\`media_id\` integer,
  	\`redirects_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	\`search_id\` integer,
  	\`addresses_id\` integer,
  	\`variants_id\` integer,
  	\`variant_types_id\` integer,
  	\`variant_options_id\` integer,
  	\`products_id\` integer,
  	\`carts_id\` integer,
  	\`orders_id\` integer,
  	\`transactions_id\` integer,
  	\`marketing_email_events_id\` integer,
  	\`crm_contacts_id\` integer,
  	\`crm_activities_id\` integer,
  	\`payload_folders_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`search_id\`) REFERENCES \`search\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`addresses_id\`) REFERENCES \`addresses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`variants_id\`) REFERENCES \`variants\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`variant_types_id\`) REFERENCES \`variant_types\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`variant_options_id\`) REFERENCES \`variant_options\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`carts_id\`) REFERENCES \`carts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`transactions_id\`) REFERENCES \`transactions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`marketing_email_events_id\`) REFERENCES \`marketing_email_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_contacts_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_activities_id\`) REFERENCES \`crm_activities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_folders_id\`) REFERENCES \`payload_folders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "payload_folders_id") SELECT "id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "payload_folders_id" FROM \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` ("order");`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_search_id_idx\` ON \`payload_locked_documents_rels\` (\`search_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_addresses_id_idx\` ON \`payload_locked_documents_rels\` (\`addresses_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_variants_id_idx\` ON \`payload_locked_documents_rels\` (\`variants_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_variant_types_id_idx\` ON \`payload_locked_documents_rels\` (\`variant_types_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_variant_options_id_idx\` ON \`payload_locked_documents_rels\` (\`variant_options_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_carts_id_idx\` ON \`payload_locked_documents_rels\` (\`carts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_transactions_id_idx\` ON \`payload_locked_documents_rels\` (\`transactions_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_marketing_email_events_id_idx\` ON \`payload_locked_documents_rels\` (\`marketing_email_events_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_contacts_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_contacts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_activities_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_activities_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_payload_folders_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_folders_id\`);`,
  );
}
