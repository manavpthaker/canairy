/// <reference types="vite/client" />

// Everything here ships to every visitor's browser. Never put a secret key in a VITE_ variable.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_USE_MOCK_DATA?: string
  readonly VITE_CANAIRY_AI_ENABLED?: string
  readonly VITE_ANTHROPIC_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
