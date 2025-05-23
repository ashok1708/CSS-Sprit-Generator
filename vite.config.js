import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const host = new URL( "http://localhost")
    .hostname;
let hmrConfig;

if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 5173,
    clientPort: 5173,
  };
}

export default defineConfig({
  plugins: [react()],
})
