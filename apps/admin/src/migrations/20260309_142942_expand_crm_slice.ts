import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`crm_contacts_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`crm_contacts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`crm_contacts_tags_order_idx\` ON \`crm_contacts_tags\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_contacts_tags_parent_id_idx\` ON \`crm_contacts_tags\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_contacts\` (
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
    sql`CREATE UNIQUE INDEX \`crm_contacts_email_idx\` ON \`crm_contacts\` (\`email\`);`,
  );
  await db.run(sql`CREATE INDEX \`crm_contacts_user_idx\` ON \`crm_contacts\` (\`user_id\`);`);
  await db.run(
    sql`CREATE INDEX \`crm_contacts_updated_at_idx\` ON \`crm_contacts\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`crm_contacts_created_at_idx\` ON \`crm_contacts\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`crm_activities\` (
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
  await db.run(
    sql`ALTER TABLE \`users\` ADD \`crm_contact_id\` integer REFERENCES crm_contacts(id);`,
  );
  await db.run(sql`CREATE INDEX \`users_crm_contact_idx\` ON \`users\` (\`crm_contact_id\`);`);
  await db.run(
    sql`ALTER TABLE \`carts\` ADD \`crm_contact_id\` integer REFERENCES crm_contacts(id);`,
  );
  await db.run(sql`CREATE INDEX \`carts_crm_contact_idx\` ON \`carts\` (\`crm_contact_id\`);`);
  await db.run(
    sql`ALTER TABLE \`orders\` ADD \`crm_contact_id\` integer REFERENCES crm_contacts(id);`,
  );
  await db.run(sql`CREATE INDEX \`orders_crm_contact_idx\` ON \`orders\` (\`crm_contact_id\`);`);
  await db.run(
    sql`ALTER TABLE \`marketing_email_events\` ADD \`crm_contact_id\` integer REFERENCES crm_contacts(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`marketing_email_events_crm_contact_idx\` ON \`marketing_email_events\` (\`crm_contact_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_contacts_id\` integer REFERENCES crm_contacts(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`crm_activities_id\` integer REFERENCES crm_activities(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_contacts_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_contacts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_crm_activities_id_idx\` ON \`payload_locked_documents_rels\` (\`crm_activities_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`crm_contacts_tags\`;`);
  await db.run(sql`DROP TABLE \`crm_contacts\`;`);
  await db.run(sql`DROP TABLE \`crm_activities\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`marketing_opt_in\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`_verified\` integer,
  	\`_verificationtoken\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_users\`("id", "name", "marketing_opt_in", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "_verified", "_verificationtoken", "login_attempts", "lock_until") SELECT "id", "name", "marketing_opt_in", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "_verified", "_verificationtoken", "login_attempts", "lock_until" FROM \`users\`;`,
  );
  await db.run(sql`DROP TABLE \`users\`;`);
  await db.run(sql`ALTER TABLE \`__new_users\` RENAME TO \`users\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`);
  await db.run(sql`CREATE TABLE \`__new_carts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`secret\` text,
  	\`customer_id\` integer,
  	\`purchased_at\` text,
  	\`subtotal\` numeric,
  	\`currency\` text DEFAULT 'USD',
  	\`customer_email\` text,
  	\`marketing_opt_in\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`customer_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_carts\`("id", "secret", "customer_id", "purchased_at", "subtotal", "currency", "customer_email", "marketing_opt_in", "updated_at", "created_at") SELECT "id", "secret", "customer_id", "purchased_at", "subtotal", "currency", "customer_email", "marketing_opt_in", "updated_at", "created_at" FROM \`carts\`;`,
  );
  await db.run(sql`DROP TABLE \`carts\`;`);
  await db.run(sql`ALTER TABLE \`__new_carts\` RENAME TO \`carts\`;`);
  await db.run(sql`CREATE INDEX \`carts_secret_idx\` ON \`carts\` (\`secret\`);`);
  await db.run(sql`CREATE INDEX \`carts_customer_idx\` ON \`carts\` (\`customer_id\`);`);
  await db.run(sql`CREATE INDEX \`carts_updated_at_idx\` ON \`carts\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`carts_created_at_idx\` ON \`carts\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`__new_orders\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`shipping_address_title\` text,
  	\`shipping_address_first_name\` text,
  	\`shipping_address_last_name\` text,
  	\`shipping_address_company\` text,
  	\`shipping_address_address_line1\` text,
  	\`shipping_address_address_line2\` text,
  	\`shipping_address_city\` text,
  	\`shipping_address_state\` text,
  	\`shipping_address_postal_code\` text,
  	\`shipping_address_country\` text,
  	\`shipping_address_phone\` text,
  	\`customer_id\` integer,
  	\`customer_email\` text,
  	\`status\` text DEFAULT 'processing',
  	\`amount\` numeric,
  	\`currency\` text DEFAULT 'USD',
  	\`contact_email\` text,
  	\`contact_first_name\` text,
  	\`contact_last_name\` text,
  	\`contact_phone\` text,
  	\`contact_marketing_opt_in\` integer DEFAULT false,
  	\`account_invite_token\` text,
  	\`account_invite_expires_at\` text,
  	\`account_invite_redeemed_at\` text,
  	\`account_invite_user_id\` integer,
  	\`access_token\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`customer_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`account_invite_user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_orders\`("id", "shipping_address_title", "shipping_address_first_name", "shipping_address_last_name", "shipping_address_company", "shipping_address_address_line1", "shipping_address_address_line2", "shipping_address_city", "shipping_address_state", "shipping_address_postal_code", "shipping_address_country", "shipping_address_phone", "customer_id", "customer_email", "status", "amount", "currency", "contact_email", "contact_first_name", "contact_last_name", "contact_phone", "contact_marketing_opt_in", "account_invite_token", "account_invite_expires_at", "account_invite_redeemed_at", "account_invite_user_id", "access_token", "updated_at", "created_at") SELECT "id", "shipping_address_title", "shipping_address_first_name", "shipping_address_last_name", "shipping_address_company", "shipping_address_address_line1", "shipping_address_address_line2", "shipping_address_city", "shipping_address_state", "shipping_address_postal_code", "shipping_address_country", "shipping_address_phone", "customer_id", "customer_email", "status", "amount", "currency", "contact_email", "contact_first_name", "contact_last_name", "contact_phone", "contact_marketing_opt_in", "account_invite_token", "account_invite_expires_at", "account_invite_redeemed_at", "account_invite_user_id", "access_token", "updated_at", "created_at" FROM \`orders\`;`,
  );
  await db.run(sql`DROP TABLE \`orders\`;`);
  await db.run(sql`ALTER TABLE \`__new_orders\` RENAME TO \`orders\`;`);
  await db.run(sql`CREATE INDEX \`orders_customer_idx\` ON \`orders\` (\`customer_id\`);`);
  await db.run(
    sql`CREATE INDEX \`orders_account_invite_account_invite_user_idx\` ON \`orders\` (\`account_invite_user_id\`);`,
  );
  await db.run(
    sql`CREATE UNIQUE INDEX \`orders_access_token_idx\` ON \`orders\` (\`access_token\`);`,
  );
  await db.run(sql`CREATE INDEX \`orders_updated_at_idx\` ON \`orders\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`orders_created_at_idx\` ON \`orders\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`__new_marketing_email_events\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`campaign\` text NOT NULL,
  	\`dedupe_key\` text NOT NULL,
  	\`recipient_email\` text NOT NULL,
  	\`user_id\` integer,
  	\`order_id\` integer,
  	\`cart_id\` integer,
  	\`sent_at\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`cart_id\`) REFERENCES \`carts\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_marketing_email_events\`("id", "campaign", "dedupe_key", "recipient_email", "user_id", "order_id", "cart_id", "sent_at", "updated_at", "created_at") SELECT "id", "campaign", "dedupe_key", "recipient_email", "user_id", "order_id", "cart_id", "sent_at", "updated_at", "created_at" FROM \`marketing_email_events\`;`,
  );
  await db.run(sql`DROP TABLE \`marketing_email_events\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_marketing_email_events\` RENAME TO \`marketing_email_events\`;`,
  );
  await db.run(
    sql`CREATE UNIQUE INDEX \`marketing_email_events_dedupe_key_idx\` ON \`marketing_email_events\` (\`dedupe_key\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`marketing_email_events_recipient_email_idx\` ON \`marketing_email_events\` (\`recipient_email\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`marketing_email_events_user_idx\` ON \`marketing_email_events\` (\`user_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`marketing_email_events_order_idx\` ON \`marketing_email_events\` (\`order_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`marketing_email_events_cart_idx\` ON \`marketing_email_events\` (\`cart_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`marketing_email_events_updated_at_idx\` ON \`marketing_email_events\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`marketing_email_events_created_at_idx\` ON \`marketing_email_events\` (\`created_at\`);`,
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
  	FOREIGN KEY (\`payload_folders_id\`) REFERENCES \`payload_folders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "payload_folders_id") SELECT "id", "order", "parent_id", "path", "users_id", "pages_id", "posts_id", "categories_id", "media_id", "redirects_id", "forms_id", "form_submissions_id", "search_id", "addresses_id", "variants_id", "variant_types_id", "variant_options_id", "products_id", "carts_id", "orders_id", "transactions_id", "marketing_email_events_id", "payload_folders_id" FROM \`payload_locked_documents_rels\`;`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_payload_folders_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_folders_id\`);`,
  );
}
