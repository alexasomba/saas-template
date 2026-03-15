import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-d1-sqlite";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` ADD \`access_token\` text;`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`orders_access_token_idx\` ON \`orders\` (\`access_token\`);`,
  );
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`paystack_customer_i_d\` text;`);
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`paystack_reference\` text;`);
  await db.run(sql`ALTER TABLE \`transactions\` DROP COLUMN \`stripe_customer_i_d\`;`);
  await db.run(sql`ALTER TABLE \`transactions\` DROP COLUMN \`stripe_payment_intent_i_d\`;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`orders_access_token_idx\`;`);
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`access_token\`;`);
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`stripe_customer_i_d\` text;`);
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`stripe_payment_intent_i_d\` text;`);
  await db.run(sql`ALTER TABLE \`transactions\` DROP COLUMN \`paystack_customer_i_d\`;`);
  await db.run(sql`ALTER TABLE \`transactions\` DROP COLUMN \`paystack_reference\`;`);
}
