import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`crm_webhook_events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`provider\` text NOT NULL,
  	\`event_key\` text NOT NULL,
  	\`received_at\` text NOT NULL,
  	\`payload\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_webhook_events_event_key_idx\` ON \`crm_webhook_events\` (\`event_key\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_webhook_events_updated_at_idx\` ON \`crm_webhook_events\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_webhook_events_created_at_idx\` ON \`crm_webhook_events\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_quotes_line_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`variant_id\` integer,
  	\`description\` text,
  	\`quantity\` numeric NOT NULL,
  	\`unit_price\` numeric,
  	\`line_total\` numeric,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`variant_id\`) REFERENCES \`variants\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`crm_quotes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`crm_quotes_line_items_order_idx\` ON \`crm_quotes_line_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_quotes_line_items_parent_id_idx\` ON \`crm_quotes_line_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_quotes_line_items_product_idx\` ON \`crm_quotes_line_items\` (\`product_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_quotes_line_items_variant_idx\` ON \`crm_quotes_line_items\` (\`variant_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_quotes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`quote_number\` text NOT NULL,
  	\`contact_id\` integer NOT NULL,
  	\`company_id\` integer,
  	\`deal_id\` integer,
  	\`owner_id\` integer,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`currency\` text DEFAULT 'NGN' NOT NULL,
  	\`subtotal\` numeric DEFAULT 0 NOT NULL,
  	\`discount\` numeric DEFAULT 0,
  	\`tax\` numeric DEFAULT 0,
  	\`total\` numeric DEFAULT 0 NOT NULL,
  	\`expires_at\` text,
  	\`sent_at\` text,
  	\`accepted_at\` text,
  	\`notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`contact_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`company_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`deal_id\`) REFERENCES \`crm_deals\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_quotes_quote_number_idx\` ON \`crm_quotes\` (\`quote_number\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_quotes_contact_idx\` ON \`crm_quotes\` (\`contact_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_quotes_company_idx\` ON \`crm_quotes\` (\`company_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_quotes_deal_idx\` ON \`crm_quotes\` (\`deal_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_quotes_owner_idx\` ON \`crm_quotes\` (\`owner_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_quotes_updated_at_idx\` ON \`crm_quotes\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`crm_quotes_created_at_idx\` ON \`crm_quotes\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`crm_invoices_line_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`product_id\` integer,
  	\`variant_id\` integer,
  	\`description\` text,
  	\`quantity\` numeric NOT NULL,
  	\`unit_price\` numeric,
  	\`line_total\` numeric,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`variant_id\`) REFERENCES \`variants\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`crm_invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`crm_invoices_line_items_order_idx\` ON \`crm_invoices_line_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_invoices_line_items_parent_id_idx\` ON \`crm_invoices_line_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_invoices_line_items_product_idx\` ON \`crm_invoices_line_items\` (\`product_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_invoices_line_items_variant_idx\` ON \`crm_invoices_line_items\` (\`variant_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_invoices\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`invoice_number\` text NOT NULL,
  	\`contact_id\` integer NOT NULL,
  	\`company_id\` integer,
  	\`quote_id\` integer,
  	\`order_id\` integer,
  	\`owner_id\` integer,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`currency\` text DEFAULT 'NGN' NOT NULL,
  	\`subtotal\` numeric DEFAULT 0 NOT NULL,
  	\`tax\` numeric DEFAULT 0,
  	\`total\` numeric DEFAULT 0 NOT NULL,
  	\`balance_due\` numeric DEFAULT 0 NOT NULL,
  	\`issue_date\` text,
  	\`due_date\` text,
  	\`paid_at\` text,
  	\`payment_method\` text DEFAULT 'paystack' NOT NULL,
  	\`paystack_customer_code\` text,
  	\`paystack_payment_request_i_d\` numeric,
  	\`paystack_request_code\` text,
  	\`paystack_payment_request_status\` text,
  	\`paystack_offline_reference\` text,
  	\`paystack_pdf_u_r_l\` text,
  	\`paystack_last_synced_at\` text,
  	\`bank_transfer_instructions_account_name\` text,
  	\`bank_transfer_instructions_account_number\` text,
  	\`bank_transfer_instructions_bank_name\` text,
  	\`bank_transfer_instructions_reference\` text,
  	\`bank_transfer_instructions_notes\` text,
  	\`notes\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`contact_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`company_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`quote_id\`) REFERENCES \`crm_quotes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_invoices_invoice_number_idx\` ON \`crm_invoices\` (\`invoice_number\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_invoices_contact_idx\` ON \`crm_invoices\` (\`contact_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_invoices_company_idx\` ON \`crm_invoices\` (\`company_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_invoices_quote_idx\` ON \`crm_invoices\` (\`quote_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_invoices_order_idx\` ON \`crm_invoices\` (\`order_id\`);`);
  await db.run(sql`CREATE INDEX \`crm_invoices_owner_idx\` ON \`crm_invoices\` (\`owner_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_invoices_updated_at_idx\` ON \`crm_invoices\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_invoices_created_at_idx\` ON \`crm_invoices\` (\`created_at\`);`,
  );
  await db.run(sql`ALTER TABLE \`crm_contacts\` ADD \`owner_id\` integer REFERENCES users(id);`);
  await db.run(
    sql`ALTER TABLE \`crm_contacts\` ADD \`account_manager_id\` integer REFERENCES users(id);`,
  );
  await db.run(sql`ALTER TABLE \`crm_contacts\` ADD \`paystack_customer_code\` text;`);
  await db.run(sql`CREATE INDEX \`crm_contacts_owner_idx\` ON \`crm_contacts\` (\`owner_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_contacts_account_manager_idx\` ON \`crm_contacts\` (\`account_manager_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`crm_companies\` ADD \`owner_id\` integer REFERENCES users(id);`);
  await db.run(sql`CREATE INDEX \`crm_companies_owner_idx\` ON \`crm_companies\` (\`owner_id\`);`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_webhook_events_id\` integer REFERENCES crm_webhook_events(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_quotes_id\` integer REFERENCES crm_quotes(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_invoices_id\` integer REFERENCES crm_invoices(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_webhook_events_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_webhook_events_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_quotes_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_quotes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_invoices_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_invoices_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`crm_webhook_events\`;`);
  await db.run(sql`DROP TABLE \`crm_quotes_line_items\`;`);
  await db.run(sql`DROP TABLE \`crm_quotes\`;`);
  await db.run(sql`DROP TABLE \`crm_invoices_line_items\`;`);
  await db.run(sql`DROP TABLE \`crm_invoices\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_crm_contacts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`email\` text NOT NULL,
  	\`name\` text,
  	\`phone\` text,
  	\`user_id\` integer,
  	\`company_id\` integer,
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
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`company_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_crm_contacts\`("id", "email", "name", "phone", "user_id", "company_id", "marketing_opt_in", "lifecycle_stage", "total_orders", "total_spend", "first_order_at", "last_order_at", "last_cart_at", "last_campaign_sent_at", "updated_at", "created_at") SELECT "id", "email", "name", "phone", "user_id", "company_id", "marketing_opt_in", "lifecycle_stage", "total_orders", "total_spend", "first_order_at", "last_order_at", "last_cart_at", "last_campaign_sent_at", "updated_at", "created_at" FROM \`crm_contacts\`;`,
  );
  await db.run(sql`DROP TABLE \`crm_contacts\`;`);
  await db.run(sql`ALTER TABLE \`__new_crm_contacts\` RENAME TO \`crm_contacts\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_contacts_email_idx\` ON \`crm_contacts\` (\`email\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_contacts_user_idx\` ON \`crm_contacts\` (\`user_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_contacts_company_idx\` ON \`crm_contacts\` (\`company_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_contacts_updated_at_idx\` ON \`crm_contacts\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_contacts_created_at_idx\` ON \`crm_contacts\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_crm_companies\` (
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
    sql`INSERT INTO \`__new_crm_companies\`("id", "name", "website", "phone", "industry", "updated_at", "created_at") SELECT "id", "name", "website", "phone", "industry", "updated_at", "created_at" FROM \`crm_companies\`;`,
  );
  await db.run(sql`DROP TABLE \`crm_companies\`;`);
  await db.run(sql`ALTER TABLE \`__new_crm_companies\` RENAME TO \`crm_companies\`;`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`crm_companies_name_idx\` ON \`crm_companies\` (\`name\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_companies_updated_at_idx\` ON \`crm_companies\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_companies_created_at_idx\` ON \`crm_companies\` (\`created_at\`);`,
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
  	\`crm_companies_id\` integer,
  	\`crm_deals_id\` integer,
  	\`crm_notes_id\` integer,
  	\`crm_segments_id\` integer,
  	\`crm_tickets_id\` integer,
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
  	FOREIGN KEY (\`crm_companies_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_deals_id\`) REFERENCES \`crm_deals\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_notes_id\`) REFERENCES \`crm_notes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_segments_id\`) REFERENCES \`crm_segments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_tickets_id\`) REFERENCES \`crm_tickets\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_folders_id\`) REFERENCES \`payload_folders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "crm_companies_id", "crm_deals_id", "crm_notes_id", "crm_segments_id", "crm_tickets_id", "payload_folders_id") SELECT "id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "crm_companies_id", "crm_deals_id", "crm_notes_id", "crm_segments_id", "crm_tickets_id", "payload_folders_id" FROM \`payload_locked_documents_rels\`;`,
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
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_payload_folders_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_folders_id\`);`,
  );
}
