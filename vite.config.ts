import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*.{js,ts,tsx,vue,svelte}": "vp check --fix",
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
        command: "vp build",
        dependsOn: ["lint"],
      },
      lint: {
        command: "vp lint",
      },
      "check-types": {
        command: "vp check-types",
      },
      dev: {
        command: "vp dev",
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
