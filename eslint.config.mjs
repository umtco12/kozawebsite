import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import next from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "dist/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  jsxA11y.flatConfigs.recommended,
  next.configs["core-web-vitals"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      /* vinext beta istemci yönlendiricisi `next/link` tıklamalarını yakalıyor ancak gezinmeyi
         tamamlayamıyor; bu yüzden menü ve haber kartları tıklanamaz hale geliyordu. Ziyaretçi
         sitesi ve yönetim paneli bilinçli olarak tarayıcının kendi gezinmesini kullanan sade
         <a href> etiketleriyle çalışır. Çerçeve sürümü yükseltilip Link davranışı doğrulanınca
         bu kural yeniden açılmalıdır. */
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
