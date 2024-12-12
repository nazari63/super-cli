import {createClient} from '@libsql/client';
import {drizzle} from 'drizzle-orm/libsql';
import {migrate} from 'drizzle-orm/libsql/migrator';
import {metadataTable, deploymentIntents} from '@/db/schema';
import path from 'path';
import {fileURLToPath} from 'url';

export async function initializeDatabase(dbUrl: string) {
	try {
		const client = createClient({
			url: dbUrl,
		});

		const db = drizzle(client, {
			schema: {metadataTable, deploymentIntents},
		});

		return db;
	} catch (error) {
		throw new Error(`Failed to initialize database: ${error}`);
	}
}

export async function runMigrations(dbUrl: string) {
	try {
		const client = createClient({
			url: dbUrl,
		});
		const db = drizzle(client);

		const __dirname = path.dirname(fileURLToPath(import.meta.url));

		// Resolve migrations path relative to your package
		const migrationsPath = path.join(__dirname, '../../drizzle');

		await migrate(db, {
			migrationsFolder: migrationsPath,
		});
	} catch (error) {
		throw new Error(`Failed to run migrations: ${error}`);
	}
}
