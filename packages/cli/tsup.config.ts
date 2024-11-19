/* eslint-disable no-console */
import { defineConfig } from 'tsup'
import { wasmLoader } from 'esbuild-plugin-wasm'

const wasmPlugin = wasmLoader({ mode: 'embedded' })

export default defineConfig({
  name: 'super',
  format: 'esm',
  entry: ['src/**/*.(ts|tsx)'],
  target: 'node18',
  splitting: false,
  sourcemap: true,
  clean: true,
  esbuildPlugins: [wasmPlugin],
})
