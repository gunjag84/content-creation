import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// Plugin to copy schema.sql to build output
function copySchemaPlugin() {
  return {
    name: 'copy-schema',
    closeBundle() {
      const src = resolve(__dirname, 'src/main/db/schema.sql')
      const dest = resolve(__dirname, 'out/main/schema.sql')
      const destDir = resolve(__dirname, 'out/main')

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true })
      }

      copyFileSync(src, dest)
      console.log('Copied schema.sql to build output')
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copySchemaPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main': resolve('src/main')
      }
    },
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
