import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,ts,tsx,vue,svelte}": "vp check --fix",
    "*.{json,md,css}": "vp fmt",
    "package.json": "vp pm dedupe --check",
  },
  fmt: {
    ignorePatterns: [],
  },
  lint: {
    plugins: [],
    categories: {},
    rules: {},
    settings: {
      "jsx-a11y": {
        components: {},
        attributes: {},
      },
      next: {
        rootDir: [],
      },
      react: {
        formComponents: [],
        linkComponents: [],
        componentWrapperFunctions: [],
      },
      jsdoc: {
        ignorePrivate: false,
        ignoreInternal: false,
        ignoreReplacesDocs: true,
        overrideReplacesDocs: true,
        augmentsExtendsReplacesDocs: false,
        implementsReplacesDocs: false,
        exemptDestructuredRootsFromChecks: false,
        tagNamePreference: {},
      },
      vitest: {
        typecheck: false,
      },
    },
    env: {
      builtin: true,
    },
    globals: {},
    ignorePatterns: [],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  run: {
    tasks: {
      build: {
        command: "vp run build --filter !my-better-t-app",
        dependsOn: ["lint"],
      },
      lint: {
        command: "vp lint",
      },
      "check-types": {
        command: "vp check-types",
      },
      test: {
        command: "vp run test --filter !my-better-t-app",
      },
      dev: {
        command: "vp run dev --filter !my-better-t-app",
        cache: false,
      },
      "db:push": {
        command: "vp run @my-better-t-app/db#db:push",
        cache: false,
      },
      "db:generate": {
        command: "vp run @my-better-t-app/db#db:generate",
        cache: false,
      },
      deploy: {
        command: "vp run @my-better-t-app/infra#deploy",
        cache: false,
      },
      destroy: {
        command: "vp run @my-better-t-app/infra#destroy",
        cache: false,
      },
    },
  },
});
