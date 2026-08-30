import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file output so the same dist/index.html works on GitHub Pages
// and as a self-contained artifact.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
})
