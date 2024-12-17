import type {AppProps} from 'pastel';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useInput} from 'ink';
import {DbProvider} from '@/db/dbContext';
import {useState} from 'react';
import {Spinner} from '@inkjs/ui';

export const queryClient = new QueryClient();

export default function App({Component, commandProps}: AppProps) {
	const [isExiting, setIsExiting] = useState(false);


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
