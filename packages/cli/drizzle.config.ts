import {defineConfig} from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: './src/models/**/*.ts',
	dialect: 'sqlite',
});
