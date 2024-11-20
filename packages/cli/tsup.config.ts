/* eslint-disable no-console */
import { defineConfig } from 'tsup'


export default defineConfig({
  name: 'super',
  format: 'esm',
  entry: ['src/**/*.(ts|tsx)'],
  target: 'node18',
  splitting: false,
  sourcemap: true,
  clean: true,
})
