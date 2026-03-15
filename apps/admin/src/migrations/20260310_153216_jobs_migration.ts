import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`tax_classes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`rate\` numeric DEFAULT 0 NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`tax_classes_title_idx\` ON \`tax_classes\` (\`title\`);`);
  await db.run(
    sql`CREATE INDEX \`tax_classes_updated_at_idx\` ON \`tax_classes\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`tax_classes_created_at_idx\` ON \`tax_classes\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`shipping_classes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`shipping_classes_title_idx\` ON \`shipping_classes\` (\`title\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_classes_updated_at_idx\` ON \`shipping_classes\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_classes_created_at_idx\` ON \`shipping_classes\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`shipping_zones_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`country\` text DEFAULT 'NG',
  	\`state\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`shipping_zones\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`shipping_zones_locations_order_idx\` ON \`shipping_zones_locations\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_locations_parent_id_idx\` ON \`shipping_zones_locations\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`shipping_zones_blocks_flat_rate\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`cost\` numeric DEFAULT 0 NOT NULL,
  	\`tax_status\` text DEFAULT 'none',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`shipping_zones\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_flat_rate_order_idx\` ON \`shipping_zones_blocks_flat_rate\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_flat_rate_parent_id_idx\` ON \`shipping_zones_blocks_flat_rate\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_flat_rate_path_idx\` ON \`shipping_zones_blocks_flat_rate\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`shipping_zones_blocks_free_shipping\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`requires\` text DEFAULT 'none',
  	\`min_amount\` numeric,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`shipping_zones\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_free_shipping_order_idx\` ON \`shipping_zones_blocks_free_shipping\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_free_shipping_parent_id_idx\` ON \`shipping_zones_blocks_free_shipping\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_free_shipping_path_idx\` ON \`shipping_zones_blocks_free_shipping\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`shipping_zones_blocks_local_pickup\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`cost\` numeric DEFAULT 0,
  	\`tax_status\` text DEFAULT 'none',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`shipping_zones\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_local_pickup_order_idx\` ON \`shipping_zones_blocks_local_pickup\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_local_pickup_parent_id_idx\` ON \`shipping_zones_blocks_local_pickup\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_blocks_local_pickup_path_idx\` ON \`shipping_zones_blocks_local_pickup\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`shipping_zones\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE INDEX \`shipping_zones_updated_at_idx\` ON \`shipping_zones\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`shipping_zones_created_at_idx\` ON \`shipping_zones\` (\`created_at\`);`,
  );
  await db.run(sql`ALTER TABLE \`products\` ADD \`tax_status\` text DEFAULT 'taxable';`);
  await db.run(
    sql`ALTER TABLE \`products\` ADD \`tax_class_id\` integer REFERENCES tax_classes(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`products\` ADD \`shipping_class_id\` integer REFERENCES shipping_classes(id);`,
  );
  await db.run(sql`ALTER TABLE \`products\` ADD \`length\` numeric;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`width\` numeric;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`height\` numeric;`);
  await db.run(sql`CREATE INDEX \`products_tax_class_idx\` ON \`products\` (\`tax_class_id\`);`);
  await db.run(
    sql`CREATE INDEX \`products_shipping_class_idx\` ON \`products\` (\`shipping_class_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`dimensions_length\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`dimensions_width\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`dimensions_height\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`shipping_class\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_tax_status\` text DEFAULT 'taxable';`);
  await db.run(
    sql`ALTER TABLE \`_products_v\` ADD \`version_tax_class_id\` integer REFERENCES tax_classes(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`_products_v\` ADD \`version_shipping_class_id\` integer REFERENCES shipping_classes(id);`,
  );
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_length\` numeric;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_width\` numeric;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_height\` numeric;`);
  await db.run(
    sql`CREATE INDEX \`_products_v_version_version_tax_class_idx\` ON \`_products_v\` (\`version_tax_class_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_version_shipping_class_idx\` ON \`_products_v\` (\`version_shipping_class_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_dimensions_length\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_dimensions_width\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_dimensions_height\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_shipping_class\`;`);
  await db.run(sql`ALTER TABLE \`carts\` ADD \`shipping_method\` text;`);
  await db.run(sql`ALTER TABLE \`carts\` ADD \`shipping_total\` numeric;`);
  await db.run(sql`ALTER TABLE \`carts\` ADD \`tax_total\` numeric;`);
  await db.run(sql`ALTER TABLE \`orders\` ADD \`shipping_method\` text;`);
  await db.run(sql`ALTER TABLE \`orders\` ADD \`shipping_total\` numeric;`);
  await db.run(sql`ALTER TABLE \`orders\` ADD \`tax_total\` numeric;`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`tax_classes_id\` integer REFERENCES tax_classes(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`shipping_classes_id\` integer REFERENCES shipping_classes(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`shipping_zones_id\` integer REFERENCES shipping_zones(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tax_classes_id_idx\` ON \`payload_locked_documents_rels\` (\`tax_classes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_shipping_classes_id_idx\` ON \`payload_locked_documents_rels\` (\`shipping_classes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_shipping_zones_id_idx\` ON \`payload_locked_documents_rels\` (\`shipping_zones_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`tax_classes\`;`);
  await db.run(sql`DROP TABLE \`shipping_classes\`;`);
  await db.run(sql`DROP TABLE \`shipping_zones_locations\`;`);
  await db.run(sql`DROP TABLE \`shipping_zones_blocks_flat_rate\`;`);
  await db.run(sql`DROP TABLE \`shipping_zones_blocks_free_shipping\`;`);
  await db.run(sql`DROP TABLE \`shipping_zones_blocks_local_pickup\`;`);
  await db.run(sql`DROP TABLE \`shipping_zones\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`product_type\` text DEFAULT 'simple',
  	\`is_virtual\` integer DEFAULT false,
  	\`is_downloadable\` integer DEFAULT false,
  	\`is_subscription\` integer DEFAULT false,
  	\`description\` text,
  	\`inventory\` numeric DEFAULT 0,
  	\`enable_variants\` integer,
  	\`price_in_u_s_d_enabled\` integer,
  	\`price_in_u_s_d\` numeric,
  	\`price_in_n_g_n_enabled\` integer,
  	\`price_in_n_g_n\` numeric,
  	\`sku\` text,
  	\`weight\` numeric,
  	\`dimensions_length\` numeric,
  	\`dimensions_width\` numeric,
  	\`dimensions_height\` numeric,
  	\`shipping_class\` text,
  	\`external_url\` text,
  	\`external_button_text\` text DEFAULT 'Buy Now',
  	\`download_limit\` numeric DEFAULT -1,
  	\`download_expiry\` numeric DEFAULT -1,
  	\`exclude_global_addons\` integer DEFAULT false,
  	\`subscription_price\` numeric,
  	\`subscription_price_n_g_n\` numeric,
  	\`period\` text DEFAULT 'month',
  	\`interval\` numeric DEFAULT 1,
  	\`trial_days\` numeric DEFAULT 0,
  	\`expiry_length\` numeric DEFAULT 0,
  	\`sign_up_fee\` numeric DEFAULT 0,
  	\`sign_up_fee_n_g_n\` numeric DEFAULT 0,
  	\`meta_title\` text,
  	\`meta_image_id\` integer,
  	\`meta_description\` text,
  	\`generate_slug\` integer DEFAULT true,
  	\`slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`deleted_at\` text,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_products\`("id", "title", "product_type", "is_virtual", "is_downloadable", "is_subscription", "description", "inventory", "enable_variants", "price_in_u_s_d_enabled", "price_in_u_s_d", "price_in_n_g_n_enabled", "price_in_n_g_n", "sku", "weight", "dimensions_length", "dimensions_width", "dimensions_height", "shipping_class", "external_url", "external_button_text", "download_limit", "download_expiry", "exclude_global_addons", "subscription_price", "subscription_price_n_g_n", "period", "interval", "trial_days", "expiry_length", "sign_up_fee", "sign_up_fee_n_g_n", "meta_title", "meta_image_id", "meta_description", "generate_slug", "slug", "updated_at", "created_at", "deleted_at", "_status") SELECT "id", "title", "product_type", "is_virtual", "is_downloadable", "is_subscription", "description", "inventory", "enable_variants", "price_in_u_s_d_enabled", "price_in_u_s_d", "price_in_n_g_n_enabled", "price_in_n_g_n", "sku", "weight", "dimensions_length", "dimensions_width", "dimensions_height", "shipping_class", "external_url", "external_button_text", "download_limit", "download_expiry", "exclude_global_addons", "subscription_price", "subscription_price_n_g_n", "period", "interval", "trial_days", "expiry_length", "sign_up_fee", "sign_up_fee_n_g_n", "meta_title", "meta_image_id", "meta_description", "generate_slug", "slug", "updated_at", "created_at", "deleted_at", "_status" FROM \`products\`;`,
  );
  await db.run(sql`DROP TABLE \`products\`;`);
  await db.run(sql`ALTER TABLE \`__new_products\` RENAME TO \`products\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`products_meta_meta_image_idx\` ON \`products\` (\`meta_image_id\`);`,
  );
  await db.run(sql`CREATE UNIQUE INDEX \`products_slug_idx\` ON \`products\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`products_deleted_at_idx\` ON \`products\` (\`deleted_at\`);`);
  await db.run(sql`CREATE INDEX \`products__status_idx\` ON \`products\` (\`_status\`);`);
  await db.run(sql`CREATE TABLE \`__new__products_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_product_type\` text DEFAULT 'simple',
  	\`version_is_virtual\` integer DEFAULT false,
  	\`version_is_downloadable\` integer DEFAULT false,
  	\`version_is_subscription\` integer DEFAULT false,
  	\`version_description\` text,
  	\`version_inventory\` numeric DEFAULT 0,
  	\`version_enable_variants\` integer,
  	\`version_price_in_u_s_d_enabled\` integer,
  	\`version_price_in_u_s_d\` numeric,
  	\`version_price_in_n_g_n_enabled\` integer,
  	\`version_price_in_n_g_n\` numeric,
  	\`version_sku\` text,
  	\`version_weight\` numeric,
  	\`version_dimensions_length\` numeric,
  	\`version_dimensions_width\` numeric,
  	\`version_dimensions_height\` numeric,
  	\`version_shipping_class\` text,
  	\`version_external_url\` text,
  	\`version_external_button_text\` text DEFAULT 'Buy Now',
  	\`version_download_limit\` numeric DEFAULT -1,
  	\`version_download_expiry\` numeric DEFAULT -1,
  	\`version_exclude_global_addons\` integer DEFAULT false,
  	\`version_subscription_price\` numeric,
  	\`version_subscription_price_n_g_n\` numeric,
  	\`version_period\` text DEFAULT 'month',
  	\`version_interval\` numeric DEFAULT 1,
  	\`version_trial_days\` numeric DEFAULT 0,
  	\`version_expiry_length\` numeric DEFAULT 0,
  	\`version_sign_up_fee\` numeric DEFAULT 0,
  	\`version_sign_up_fee_n_g_n\` numeric DEFAULT 0,
  	\`version_meta_title\` text,
  	\`version_meta_image_id\` integer,
  	\`version_meta_description\` text,
  	\`version_generate_slug\` integer DEFAULT true,
  	\`version_slug\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version_deleted_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__products_v\`("id", "parent_id", "version_title", "version_product_type", "version_is_virtual", "version_is_downloadable", "version_is_subscription", "version_description", "version_inventory", "version_enable_variants", "version_price_in_u_s_d_enabled", "version_price_in_u_s_d", "version_price_in_n_g_n_enabled", "version_price_in_n_g_n", "version_sku", "version_weight", "version_dimensions_length", "version_dimensions_width", "version_dimensions_height", "version_shipping_class", "version_external_url", "version_external_button_text", "version_download_limit", "version_download_expiry", "version_exclude_global_addons", "version_subscription_price", "version_subscription_price_n_g_n", "version_period", "version_interval", "version_trial_days", "version_expiry_length", "version_sign_up_fee", "version_sign_up_fee_n_g_n", "version_meta_title", "version_meta_image_id", "version_meta_description", "version_generate_slug", "version_slug", "version_updated_at", "version_created_at", "version_deleted_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "parent_id", "version_title", "version_product_type", "version_is_virtual", "version_is_downloadable", "version_is_subscription", "version_description", "version_inventory", "version_enable_variants", "version_price_in_u_s_d_enabled", "version_price_in_u_s_d", "version_price_in_n_g_n_enabled", "version_price_in_n_g_n", "version_sku", "version_weight", "version_dimensions_length", "version_dimensions_width", "version_dimensions_height", "version_shipping_class", "version_external_url", "version_external_button_text", "version_download_limit", "version_download_expiry", "version_exclude_global_addons", "version_subscription_price", "version_subscription_price_n_g_n", "version_period", "version_interval", "version_trial_days", "version_expiry_length", "version_sign_up_fee", "version_sign_up_fee_n_g_n", "version_meta_title", "version_meta_image_id", "version_meta_description", "version_generate_slug", "version_slug", "version_updated_at", "version_created_at", "version_deleted_at", "version__status", "created_at", "updated_at", "latest", "autosave" FROM \`_products_v\`;`,
  );
  await db.run(sql`DROP TABLE \`_products_v\`;`);
  await db.run(sql`ALTER TABLE \`__new__products_v\` RENAME TO \`_products_v\`;`);
  await db.run(sql`CREATE INDEX \`_products_v_parent_idx\` ON \`_products_v\` (\`parent_id\`);`);
  await db.run(
    sql`CREATE INDEX \`_products_v_version_meta_version_meta_image_idx\` ON \`_products_v\` (\`version_meta_image_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_version_slug_idx\` ON \`_products_v\` (\`version_slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_version_updated_at_idx\` ON \`_products_v\` (\`version_updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_version_created_at_idx\` ON \`_products_v\` (\`version_created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_version_deleted_at_idx\` ON \`_products_v\` (\`version_deleted_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_version__status_idx\` ON \`_products_v\` (\`version__status\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_created_at_idx\` ON \`_products_v\` (\`created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_updated_at_idx\` ON \`_products_v\` (\`updated_at\`);`,
  );
  await db.run(sql`CREATE INDEX \`_products_v_latest_idx\` ON \`_products_v\` (\`latest\`);`);
  await db.run(sql`CREATE INDEX \`_products_v_autosave_idx\` ON \`_products_v\` (\`autosave\`);`);
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
  	\`product_addons_id\` integer,
  	\`subscriptions_id\` integer,
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
  	FOREIGN KEY (\`product_addons_id\`) REFERENCES \`product_addons\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subscriptions_id\`) REFERENCES \`subscriptions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
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
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "product_addons_id", "subscriptions_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "crm_webhook_events_id", "crm_companies_id", "crm_deals_id", "crm_quotes_id", "crm_invoices_id", "crm_notes_id", "crm_segments_id", "crm_tickets_id", "payload_folders_id") SELECT "id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "product_addons_id", "subscriptions_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "crm_contacts_id", "crm_activities_id", "crm_webhook_events_id", "crm_companies_id", "crm_deals_id", "crm_quotes_id", "crm_invoices_id", "crm_notes_id", "crm_segments_id", "crm_tickets_id", "payload_folders_id" FROM \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  );
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
    sql`CREATE INDEX \`payload_locked_documents_rels_product_addons_id_idx\` ON \`payload_locked_documents_rels\` (\`product_addons_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_subscriptions_id_idx\` ON \`payload_locked_documents_rels\` (\`subscriptions_id\`);`,
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
  await db.run(sql`ALTER TABLE \`carts\` DROP COLUMN \`shipping_method\`;`);
  await db.run(sql`ALTER TABLE \`carts\` DROP COLUMN \`shipping_total\`;`);
  await db.run(sql`ALTER TABLE \`carts\` DROP COLUMN \`tax_total\`;`);
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`shipping_method\`;`);
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`shipping_total\`;`);
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`tax_total\`;`);
}
