import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`product_addons_blocks_multiple_choice_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`price_type\` text DEFAULT 'flat' NOT NULL,
  	\`price\` numeric DEFAULT 0 NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons_blocks_multiple_choice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_multiple_choice_options_order_idx\` ON \`product_addons_blocks_multiple_choice_options\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_multiple_choice_options_parent_id_idx\` ON \`product_addons_blocks_multiple_choice_options\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_multiple_choice_options_image_idx\` ON \`product_addons_blocks_multiple_choice_options\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_multiple_choice\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`display_as\` text DEFAULT 'dropdown' NOT NULL,
  	\`default_option\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_multiple_choice_order_idx\` ON \`product_addons_blocks_multiple_choice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_multiple_choice_parent_id_idx\` ON \`product_addons_blocks_multiple_choice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_multiple_choice_path_idx\` ON \`product_addons_blocks_multiple_choice\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_checkboxes_options\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`price_type\` text DEFAULT 'flat' NOT NULL,
  	\`price\` numeric DEFAULT 0 NOT NULL,
  	\`default_checked\` integer DEFAULT false,
  	\`hidden\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons_blocks_checkboxes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_checkboxes_options_order_idx\` ON \`product_addons_blocks_checkboxes_options\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_checkboxes_options_parent_id_idx\` ON \`product_addons_blocks_checkboxes_options\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_checkboxes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_checkboxes_order_idx\` ON \`product_addons_blocks_checkboxes\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_checkboxes_parent_id_idx\` ON \`product_addons_blocks_checkboxes\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_checkboxes_path_idx\` ON \`product_addons_blocks_checkboxes\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_short_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`restriction\` text DEFAULT 'any' NOT NULL,
  	\`placeholder\` text,
  	\`max_length\` numeric,
  	\`price_type\` text DEFAULT 'flat' NOT NULL,
  	\`price\` numeric DEFAULT 0 NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_short_text_order_idx\` ON \`product_addons_blocks_short_text\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_short_text_parent_id_idx\` ON \`product_addons_blocks_short_text\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_short_text_path_idx\` ON \`product_addons_blocks_short_text\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_long_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`placeholder\` text,
  	\`max_length\` numeric,
  	\`price_type\` text DEFAULT 'flat' NOT NULL,
  	\`price\` numeric DEFAULT 0 NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_long_text_order_idx\` ON \`product_addons_blocks_long_text\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_long_text_parent_id_idx\` ON \`product_addons_blocks_long_text\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_long_text_path_idx\` ON \`product_addons_blocks_long_text\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_file_upload\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`price_type\` text DEFAULT 'flat' NOT NULL,
  	\`price\` numeric DEFAULT 0 NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_file_upload_order_idx\` ON \`product_addons_blocks_file_upload\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_file_upload_parent_id_idx\` ON \`product_addons_blocks_file_upload\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_file_upload_path_idx\` ON \`product_addons_blocks_file_upload\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_customer_price\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`prefilled_price\` numeric,
  	\`min_price\` numeric,
  	\`max_price\` numeric,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_customer_price_order_idx\` ON \`product_addons_blocks_customer_price\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_customer_price_parent_id_idx\` ON \`product_addons_blocks_customer_price\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_customer_price_path_idx\` ON \`product_addons_blocks_customer_price\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_quantity\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`prefilled_quantity\` numeric,
  	\`min_quantity\` numeric,
  	\`max_quantity\` numeric,
  	\`price_type\` text DEFAULT 'flat' NOT NULL,
  	\`price\` numeric DEFAULT 0 NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_quantity_order_idx\` ON \`product_addons_blocks_quantity\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_quantity_parent_id_idx\` ON \`product_addons_blocks_quantity\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_quantity_path_idx\` ON \`product_addons_blocks_quantity\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_blocks_date_picker\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`required\` integer DEFAULT false,
  	\`price_type\` text DEFAULT 'flat' NOT NULL,
  	\`price\` numeric DEFAULT 0 NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_date_picker_order_idx\` ON \`product_addons_blocks_date_picker\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_date_picker_parent_id_idx\` ON \`product_addons_blocks_date_picker\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_blocks_date_picker_path_idx\` ON \`product_addons_blocks_date_picker\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`display_order\` numeric DEFAULT 10,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_updated_at_idx\` ON \`product_addons\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_created_at_idx\` ON \`product_addons\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`product_addons_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`categories_id\` integer,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`product_addons_rels_order_idx\` ON \`product_addons_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_rels_parent_idx\` ON \`product_addons_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_rels_path_idx\` ON \`product_addons_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_rels_categories_id_idx\` ON \`product_addons_rels\` (\`categories_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`product_addons_rels_products_id_idx\` ON \`product_addons_rels\` (\`products_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`product_addons_id\` integer REFERENCES product_addons(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_product_addons_id_idx\` ON \`payload_locked_documents_rels\` (\`product_addons_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`product_addons_blocks_multiple_choice_options\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_multiple_choice\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_checkboxes_options\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_checkboxes\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_short_text\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_long_text\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_file_upload\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_customer_price\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_quantity\`;`);
  await db.run(sql`DROP TABLE \`product_addons_blocks_date_picker\`;`);
  await db.run(sql`DROP TABLE \`product_addons\`;`);
  await db.run(sql`DROP TABLE \`product_addons_rels\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
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
  	\`crm_webhook_events_id\` integer,
  	\`crm_companies_id\` integer,
  	\`crm_deals_id\` integer,
  	\`crm_quotes_id\` integer,
  	\`crm_invoices_id\` integer,
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
  	FOREIGN KEY (\`crm_webhook_events_id\`) REFERENCES \`crm_webhook_events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_companies_id\`) REFERENCES \`crm_companies\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_deals_id\`) REFERENCES \`crm_deals\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_quotes_id\`) REFERENCES \`crm_quotes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_invoices_id\`) REFERENCES \`crm_invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_notes_id\`) REFERENCES \`crm_notes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_segments_id\`) REFERENCES \`crm_segments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`crm_tickets_id\`) REFERENCES \`crm_tickets\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_folders_id\`) REFERENCES \`payload_folders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "crm_webhook_events_id", "crm_companies_id", "crm_deals_id", "crm_quotes_id", "crm_invoices_id", "crm_notes_id", "crm_segments_id", "crm_tickets_id", "payload_folders_id") SELECT "id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "crm_webhook_events_id", "crm_companies_id", "crm_deals_id", "crm_quotes_id", "crm_invoices_id", "crm_notes_id", "crm_segments_id", "crm_tickets_id", "payload_folders_id" FROM \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_webhook_events_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_webhook_events_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_companies_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_companies_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_deals_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_deals_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_quotes_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_quotes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_invoices_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_invoices_id\`);`,
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
