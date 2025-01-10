import {queryClient} from '@/commands/_app';
import {queryMappingChainById} from '@/queries/chainById';
import {querySuperchainRegistryChainList} from '@/queries/superchainRegistryChainList';
import {useQuery} from '@tanstack/react-query';
import {Chain} from 'viem';

const getQueryParams = () => {
	return {
		queryKey: ['chainByIdentifier'],
		queryFn: async () => {
			const chainList = await querySuperchainRegistryChainList();
			const chainById = await queryMappingChainById();

			return chainList.reduce((acc, config) => {
				acc[config.identifier] = chainById[config.chainId]!;
				return acc;
			}, {} as Record<string, Chain>);
		},
	};
};

export const queryMappingChainByIdentifier = async () => {
	return queryClient.fetchQuery(getQueryParams());
};

export const useMappingChainByIdentifier = () => {
	return useQuery({
		...getQueryParams(),
		staleTime: Infinity, // For the duration of the CLI session, this is cached
	});
};
