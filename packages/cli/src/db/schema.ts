import {InferSelectModel} from 'drizzle-orm';
import {int, sqliteTable, text} from 'drizzle-orm/sqlite-core';

export const metadataTable = sqliteTable('metadata', {
	id: text('id')
		.primaryKey()
		.$default(() => 'singleton'),
	version: text('version')
		.notNull()
		.$default(() => '0.0.1'),
});

export const deploymentIntents = sqliteTable('deployment_intents', {
	id: text('id').primaryKey(),
	type: text('type').notNull(),
	artifactLocalPath: text('artifact_local_path').notNull(),
	network: text('network').notNull(),
	chainIds: text('chain_ids').notNull(),
	creationParams: text('creation_params', {mode: 'json'}).notNull(),
	initializationParams: text('initialization_params', {mode: 'json'}),
	createdAt: int('created_at')
		.notNull()
		.$default(() => new Date().getTime()),
	updatedAt: int('updated_at')
		.notNull()
		.$default(() => new Date().getTime()),
});

export type DeploymentIntent = InferSelectModel<typeof deploymentIntents>;
