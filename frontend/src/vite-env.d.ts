/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_LOGO_URL: string;
  readonly VITE_APP_COMPANY_NAME: string;
  readonly VITE_APP_PRIMARY_COLOR: string;
  // Añade aquí otras variables de entorno...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
