import {queryClient} from '@/commands/_app';
import {queryChainConfig} from '@/queries/chainConfig';
import {
	CHAIN_LIST_URL,
	ChainListItem,
} from '@/superchain-registry/fetchChainList';
import {useQuery} from '@tanstack/react-query';

const getQueryParams = (chainListURL: string) => {
	return {
		queryKey: ['chainListItemByIdentifier', chainListURL],
		queryFn: async () => {
			const chainList = await queryChainConfig(chainListURL);

			return chainList.reduce((acc, config) => {
				acc[config.identifier] = config;
				return acc;
			}, {} as Record<string, ChainListItem>);
		},
	};
};

export const queryMappingChainListItemByIdentifier = async (
	chainListURL: string = CHAIN_LIST_URL,
) => {
	return queryClient.fetchQuery(getQueryParams(chainListURL));
};

export const useMappingChainListItemByIdentifier = (
	chainListURL: string = CHAIN_LIST_URL,
) => {
	return useQuery({
		...getQueryParams(chainListURL),
		staleTime: Infinity, // For the duration of the CLI session, this is cached
	});
};
