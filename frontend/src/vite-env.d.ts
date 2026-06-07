/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_DEV_PROXY: string;
  // add more env variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
