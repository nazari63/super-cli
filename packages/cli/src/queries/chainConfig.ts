import {queryClient} from '@/commands/_app';
import {
	CHAIN_LIST_URL,
	fetchChainList,
} from '@/superchain-registry/fetchChainList';
import {useQuery} from '@tanstack/react-query';

const getQueryParams = (chainListURL: string) => {
	return {
		queryKey: ['chainConfig', chainListURL],
		queryFn: () => fetchChainList(chainListURL),
	};
};

export const queryChainConfig = async (
	chainListURL: string = CHAIN_LIST_URL,
) => {
	return queryClient.fetchQuery(getQueryParams(chainListURL));
};

export const useChainConfig = (chainListURL: string = CHAIN_LIST_URL) => {
	return useQuery({
		...getQueryParams(chainListURL),
		staleTime: Infinity, // For the duration of the CLI session, this is cached
	});
};
