import {rollupChainToIdentifier} from '@/util/chains/chainIdentifier';
import {networks} from '@/util/chains/networks';

export const sourceChains = networks.map(network => network.sourceChain);

export const rollupChains = networks.flatMap(network => network.chains);

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
