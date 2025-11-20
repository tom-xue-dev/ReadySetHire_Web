/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API_LOGS: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}