import {queryClient} from '@/commands/_app';
import {queryChainConfig} from '@/queries/chainConfig';
import {CHAIN_LIST_URL} from '@/superchain-registry/fetchChainList';
import {useQuery} from '@tanstack/react-query';
import {Chain, defineChain} from 'viem';
import {mainnet, sepolia} from 'viem/chains';
import {chainConfig} from 'viem/op-stack';

const getQueryParams = (chainListURL: string) => {
	return {
		queryKey: ['chainById', chainListURL],
		queryFn: async () => {
			const chainList = await queryChainConfig();

			const chainByID = chainList.reduce((acc, config) => {
				const stringId = config.identifier.split('/')[1] as string;
				const rpcURL =
					process.env[`${stringId.toUpperCase()}_RPC_URL`] ??
					(config.rpc[0] as string);

				const isMainnet = config.parent.chain === 'mainnet';

				// TODO: Does not support custom gas tokens
				acc[config.chainId] = defineChain({
					...chainConfig,
					id: config.chainId,
					name: stringId,
					sourceId: isMainnet ? mainnet.id : sepolia.id,
					nativeCurrency: {
						name: 'Ether',
						symbol: 'ETH',
						decimals: 18,
					},
					blockExplorers: {
						default: {
							name: 'Blockscout',
							url: config.explorers[0] as string,
						},
					},
					rpcUrls: {
						default: {
							http: [rpcURL],
						},
					},
					multicall: {
						address: '0xcA11bde05977b3631167028862bE2a173976CA11',
					},
				});

				return acc;
			}, {} as Record<number, Chain>);

			return chainByID;
		},
	};
};

export const queryMappingChainById = async (
	chainListURL: string = CHAIN_LIST_URL,
) => {
	return queryClient.fetchQuery(getQueryParams(chainListURL));
};

export const useMappingChainById = (chainListURL: string = CHAIN_LIST_URL) => {
	return useQuery({
		...getQueryParams(chainListURL),
		staleTime: Infinity, // For the duration of the CLI session, this is cached
	});
};
