/// <reference types="vitest" />

// import './src/config.mjs'
import { defineConfig } from 'vitest/config'
delete process.env.DEBUG

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		globals: true,
		mockReset: true
	}
})
