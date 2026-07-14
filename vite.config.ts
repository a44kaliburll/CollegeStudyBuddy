import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // relative base so the build also works from file:// inside the Electron app
  base: './',
  plugins: [react(), tailwindcss()],
})
