import type {AppProps} from 'pastel';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useInput} from 'ink';
import {useEffect} from 'react';
import {runMigrations} from '@/db/db';

export const queryClient = new QueryClient();

export default function App({Component, commandProps}: AppProps) {
	useInput((input, key) => {
		if (input === 'c' && key.ctrl) {
			process.exit();
		}
	});

	useEffect(() => {
		runMigrations('file:local.db');
	});

	return (
		<QueryClientProvider client={queryClient}>
			<Component {...commandProps} />
		</QueryClientProvider>
	);
}
