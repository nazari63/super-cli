import {rollupChainToIdentifier} from '@/util/chains/chainIdentifier';
import {networks} from '@/util/chains/networks';
import {
	supersimL1,
	supersimL2A,
	supersimL2B,
	supersimL2C,
	supersimL2D,
} from '@eth-optimism/viem/chains';
import {base, baseSepolia, optimism, optimismSepolia} from 'viem/chains';

// TODO: move this override logic into @eth-optimism/viem/chains
const TEMP_overrideBlockExplorerUrlByChainId = {
	[baseSepolia.id]: 'https://base-sepolia.blockscout.com/',
	[base.id]: 'https://base.blockscout.com/',
	[optimismSepolia.id]: 'https://optimism-sepolia.blockscout.com/',
	[optimism.id]: 'https://optimism.blockscout.com/',
} as Record<number, string>;

const TEMP_overrideContracts = {
	[supersimL2A.id]: {
		l1StandardBridge: {
			[supersimL1.id]: {
				address: '0x8d515eb0e5f293b16b6bbca8275c060bae0056b0',
			},
		},
	},
	[supersimL2B.id]: {
		l1StandardBridge: {
			[supersimL1.id]: {
				address: '0x67b2ab287a32bb9ace84f6a5a30a62597b10ade9',
			},
		},
	},
	[supersimL2C.id]: {
		l1StandardBridge: {
			[supersimL1.id]: {
				address: '0x65eb775a012b1f7d7a99ea13bf51e5dd4ba629e3',
			},
		},
	},
	[supersimL2D.id]: {
		l1StandardBridge: {
			[supersimL1.id]: {
				address: '0xe9a71816c99292dd4eb79cd0aadae1213c143d61',
			},
		},
	},
} as const;

export const sourceChains = networks.map(network => network.sourceChain);

export const rollupChains = networks
	.flatMap(network => network.chains)
	.map(chain => {
		let newChain = {
			...chain,
		};
		if (TEMP_overrideBlockExplorerUrlByChainId[chain.id]) {
			newChain = {
				...newChain,
				blockExplorers: {
					default: {
						name: 'Blockscout',
						url: TEMP_overrideBlockExplorerUrlByChainId[chain.id]!,
					},
				},
			} as const;
		}
		// @ts-expect-error
		if (TEMP_overrideContracts[chain.id]) {
			newChain = {
				...newChain,
				contracts: {
					...newChain.contracts,
					// @ts-expect-error
					...TEMP_overrideContracts[chain.id],
				},
			} as const;
		}
		return newChain;
	});

export const chains = [...sourceChains, ...rollupChains] as const;

type RollupChains = typeof rollupChains;

type Chains = typeof chains;

export const chainById = chains.reduce((acc, chain) => {
	acc[chain.id] = chain;
	return acc;
}, {} as Record<number, Chains[number]>);

export const rollupChainByIdentifier = rollupChains.reduce((acc, chain) => {
	acc[rollupChainToIdentifier(chain)] = chain;
	return acc;
}, {} as Record<string, RollupChains[number]>);
