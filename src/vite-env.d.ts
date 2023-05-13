/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JIOSAAVN_ENDPOINT: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
