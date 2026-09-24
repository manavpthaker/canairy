/// <reference types="vite/client" />

// Everything here ships to every visitor's browser. Never put a secret key in a VITE_ variable.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
