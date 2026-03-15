import * as migration_20260306_190107_init_schema from "./20260306_190107_init_schema";
import * as migration_20260306_233625_add_ngn_to_versions from "./20260306_233625_add_ngn_to_versions";
import * as migration_20260308_082557 from "./20260308_082557";
import * as migration_20260308_234822 from "./20260308_234822";
import * as migration_20260309_135024_add_crm_automation from "./20260309_135024_add_crm_automation";
import * as migration_20260309_142942_expand_crm_slice from "./20260309_142942_expand_crm_slice";
import * as migration_20260309_150152_add_crm_segments_and_notes from "./20260309_150152_add_crm_segments_and_notes";
import * as migration_20260309_221519_crm_commercial_and_paystack_hardening from "./20260309_221519_crm_commercial_and_paystack_hardening";
import * as migration_20260310_131339 from "./20260310_131339";
import * as migration_20260310_133315 from "./20260310_133315";
import * as migration_20260310_133640 from "./20260310_133640";
import * as migration_20260310_153216_jobs_migration from "./20260310_153216_jobs_migration";

export const migrations = [
  {
    up: migration_20260306_190107_init_schema.up,
    down: migration_20260306_190107_init_schema.down,
    name: "20260306_190107_init_schema",
  },
  {
    up: migration_20260306_233625_add_ngn_to_versions.up,
    down: migration_20260306_233625_add_ngn_to_versions.down,
    name: "20260306_233625_add_ngn_to_versions",
  },
  {
    up: migration_20260308_082557.up,
    down: migration_20260308_082557.down,
    name: "20260308_082557",
  },
  {
    up: migration_20260308_234822.up,
    down: migration_20260308_234822.down,
    name: "20260308_234822",
  },
  {
    up: migration_20260309_135024_add_crm_automation.up,
    down: migration_20260309_135024_add_crm_automation.down,
    name: "20260309_135024_add_crm_automation",
  },
  {
    up: migration_20260309_142942_expand_crm_slice.up,
    down: migration_20260309_142942_expand_crm_slice.down,
    name: "20260309_142942_expand_crm_slice",
  },
  {
    up: migration_20260309_150152_add_crm_segments_and_notes.up,
    down: migration_20260309_150152_add_crm_segments_and_notes.down,
    name: "20260309_150152_add_crm_segments_and_notes",
  },
  {
    up: migration_20260309_221519_crm_commercial_and_paystack_hardening.up,
    down: migration_20260309_221519_crm_commercial_and_paystack_hardening.down,
    name: "20260309_221519_crm_commercial_and_paystack_hardening",
  },
  {
    up: migration_20260310_131339.up,
    down: migration_20260310_131339.down,
    name: "20260310_131339",
  },
  {
    up: migration_20260310_133315.up,
    down: migration_20260310_133315.down,
    name: "20260310_133315",
  },
  {
    up: migration_20260310_133640.up,
    down: migration_20260310_133640.down,
    name: "20260310_133640",
  },
  {
    up: migration_20260310_153216_jobs_migration.up,
    down: migration_20260310_153216_jobs_migration.down,
    name: "20260310_153216_jobs_migration",
  },
];
