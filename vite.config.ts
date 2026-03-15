import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,ts,tsx,vue,svelte}": ["vp check --fix", "vp test related"],
    "*.{json,md,css}": "vp fmt",
    "package.json": "vp dedupe --check",
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
        command: "vp run build --filter !saas-template",
        dependsOn: ["lint"],
      },
      lint: {
        command: "vp lint",
      },
      "check-types": {
        command: "vp check-types",
      },
      test: {
        command: "vp run test --filter !saas-template",
      },
      dev: {
        command: "vp run dev --filter !saas-template",
        cache: false,
      },
      "db:push": {
        command: "vp run @workspace/db#db:push",
        cache: false,
      },
      "db:generate": {
        command: "vp run @workspace/db#db:generate",
        cache: false,
      },
      deploy: {
        command: "vp run @workspace/infra#deploy",
        cache: false,
      },
      destroy: {
        command: "vp run @workspace/infra#destroy",
        cache: false,
      },
    },
  },
});
