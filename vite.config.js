import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app works both on Vercel and from a subpath.
export default defineConfig({
  base: './',
  plugins: [react()],
})
