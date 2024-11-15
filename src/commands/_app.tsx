import type {AppProps} from 'pastel';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App({Component, commandProps}: AppProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<Component {...commandProps} />
		</QueryClientProvider>
	);
}
