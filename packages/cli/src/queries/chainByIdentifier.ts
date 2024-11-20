import {queryClient} from '@/commands/_app';
import {queryMappingChainById} from '@/queries/chainById';
import {queryChainConfig} from '@/queries/chainConfig';
import {CHAIN_LIST_URL} from '@/superchain-registry/fetchChainList';
import {useQuery} from '@tanstack/react-query';
import {Chain} from 'viem';

const getQueryParams = (chainListURL: string) => {
	return {
		queryKey: ['chainByIdentifier', chainListURL],
		queryFn: async () => {
			const chainList = await queryChainConfig(chainListURL);
			const chainById = await queryMappingChainById(chainListURL);

			return chainList.reduce((acc, config) => {
				acc[config.identifier] = chainById[config.chainId]!;
				return acc;
			}, {} as Record<string, Chain>);
		},
	};
};

export const queryMappingChainByIdentifier = async (
	chainListURL: string = CHAIN_LIST_URL,
) => {
	return queryClient.fetchQuery(getQueryParams(chainListURL));
};

export const useMappingChainByIdentifier = (
	chainListURL: string = CHAIN_LIST_URL,
) => {
	return useQuery({
		...getQueryParams(chainListURL),
		staleTime: Infinity, // For the duration of the CLI session, this is cached
	});
};
