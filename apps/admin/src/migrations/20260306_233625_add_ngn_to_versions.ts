import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`variants\` ADD \`price_in_n_g_n_enabled\` integer;`);
  await db.run(sql`ALTER TABLE \`variants\` ADD \`price_in_n_g_n\` numeric;`);
  await db.run(sql`ALTER TABLE \`_variants_v\` ADD \`version_price_in_n_g_n_enabled\` integer;`);
  await db.run(sql`ALTER TABLE \`_variants_v\` ADD \`version_price_in_n_g_n\` numeric;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`price_in_n_g_n_enabled\` integer;`);
  await db.run(sql`ALTER TABLE \`products\` ADD \`price_in_n_g_n\` numeric;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_price_in_n_g_n_enabled\` integer;`);
  await db.run(sql`ALTER TABLE \`_products_v\` ADD \`version_price_in_n_g_n\` numeric;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`variants\` DROP COLUMN \`price_in_n_g_n_enabled\`;`);
  await db.run(sql`ALTER TABLE \`variants\` DROP COLUMN \`price_in_n_g_n\`;`);
  await db.run(sql`ALTER TABLE \`_variants_v\` DROP COLUMN \`version_price_in_n_g_n_enabled\`;`);
  await db.run(sql`ALTER TABLE \`_variants_v\` DROP COLUMN \`version_price_in_n_g_n\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`price_in_n_g_n_enabled\`;`);
  await db.run(sql`ALTER TABLE \`products\` DROP COLUMN \`price_in_n_g_n\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_price_in_n_g_n_enabled\`;`);
  await db.run(sql`ALTER TABLE \`_products_v\` DROP COLUMN \`version_price_in_n_g_n\`;`);
}
