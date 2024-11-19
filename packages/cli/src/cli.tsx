#!/usr/bin/env node --no-warnings
import Pastel from 'pastel';

const app = new Pastel({
	importMeta: import.meta,
});

await app.run();
