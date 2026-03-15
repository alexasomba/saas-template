import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`products_downloadable_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`file_id\` integer,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`products_downloadable_files_order_idx\` ON \`products_downloadable_files\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`products_downloadable_files_parent_id_idx\` ON \`products_downloadable_files\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`products_downloadable_files_file_idx\` ON \`products_downloadable_files\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_products_v_version_downloadable_files\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`file_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_products_v_version_downloadable_files_order_idx\` ON \`_products_v_version_downloadable_files\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_downloadable_files_parent_id_idx\` ON \`_products_v_version_downloadable_files\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_products_v_version_downloadable_files_file_idx\` ON \`_products_v_version_downloadable_files\` (\`file_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`products\` ADD \`product_type\` text DEFAULT 'simple';`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`is_virtual\` integer DEFAULT false;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`is_downloadable\` integer DEFAULT false;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`sku\` text;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`weight\` numeric;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`dimensions_length\` numeric;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`dimensions_width\` numeric;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`dimensions_height\` numeric;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`shipping_class\` text;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`external_url\` text;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`external_button_text\` text DEFAULT 'Buy Now';`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`download_limit\` numeric DEFAULT -1;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`download_expiry\` numeric DEFAULT -1;`);
  await db.run(
    sql`ALTER TABLE \`_products_v\` ADD \`version_product_type\` text DEFAULT 'simple';`,
  );
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_is_virtual\` integer DEFAULT false;`);
  await db.run(
    sql`ALTER TABLE \`_products_v\` ADD \`version_is_downloadable\` integer DEFAULT false;`,
  );
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_sku\` text;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_weight\` numeric;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_dimensions_length\` numeric;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_dimensions_width\` numeric;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_dimensions_height\` numeric;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_shipping_class\` text;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_external_url\` text;`);
  await db.run(
    sql`ALTER TABLE \`_products_v\` ADD \`version_external_button_text\` text DEFAULT 'Buy Now';`,
  );
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_download_limit\` numeric DEFAULT -1;`);
  await db.run(
    sql`ALTER TABLE \`_products_v\` ADD \`version_download_expiry\` numeric DEFAULT -1;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`products_downloadable_files\`;`);
  await db.run(sql`DROP TABLE \`_products_v_version_downloadable_files\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`product_type\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`is_virtual\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`is_downloadable\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`sku\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`weight\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`dimensions_length\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`dimensions_width\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`dimensions_height\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`shipping_class\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`external_url\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`external_button_text\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`download_limit\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`download_expiry\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_product_type\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_is_virtual\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_is_downloadable\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_sku\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_weight\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_dimensions_length\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_dimensions_width\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_dimensions_height\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_shipping_class\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_external_url\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_external_button_text\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_download_limit\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_download_expiry\`;`);
}
