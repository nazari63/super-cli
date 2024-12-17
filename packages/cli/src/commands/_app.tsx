import type {AppProps} from 'pastel';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useInput} from 'ink';
import {DbProvider} from '@/db/dbContext';
import {useEffect, useState} from 'react';
import {startServer} from '@/server/startServer';
import {Spinner} from '@inkjs/ui';

export const queryClient = new QueryClient();

export default function App({Component, commandProps}: AppProps) {
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		let server: Awaited<ReturnType<typeof startServer>> | undefined;

		// Start the server and store the reference
		startServer()
			.then(s => {
				server = s;
			})
			.catch(err => {
				console.error('Failed to start server:', err);
			});

		// Cleanup function
		return () => {
			if (server) {
				setIsExiting(true);
				// Use the callback to ensure the server is fully closed
				server.close(err => {
					if (err) {
						console.error('Error while closing server:', err);
					}
					process.exit();
				});
			}
		};
	}, []);

	useInput((input, key) => {
		if (input === 'c' && key.ctrl) {
			setIsExiting(true);
			process.exit();
		}
	});

	if (isExiting) {
		return <Spinner label="Shutting down..." />;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<DbProvider>
				<Component {...commandProps} />
			</DbProvider>
		</QueryClientProvider>
	);
}
