import {createClient} from '@libsql/client';
import {drizzle} from 'drizzle-orm/libsql';
import {migrate} from 'drizzle-orm/libsql/migrator';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs/promises';
import os from 'os';

import 'dotenv/config';

const isDevMode = process.env['SUP_DEV_MODE'] === 'true';

const dbFileName = isDevMode ? 'sup.dev.db' : 'sup.db';

const dbDir = path.join(os.homedir(), '.sup');
const dbFile = path.join(dbDir, dbFileName);

const createDir = async () => {
	// no-op if dir already exists
	if (
		await fs
			.stat(dbDir)
			.then(stat => stat.isDirectory())
			.catch(() => false)
	) {
		return;
	}
	await fs.mkdir(dbDir, {recursive: true});
};

export async function initializeDatabase() {
	try {
		await createDir();

		const client = createClient({
			url: `file:${dbFile}`,
		});

		const db = drizzle(client);

		return db;
	} catch (error) {
		throw new Error(`Failed to initialize database: ${error}`);
	}
}

export type DB = Awaited<ReturnType<typeof initializeDatabase>>;

export async function runMigrations(db: DB) {
	try {
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
