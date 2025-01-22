import {
	mainnetChains,
	sepoliaChains,
	supersimL1,
	supersimL2A,
	supersimL2B,
	supersimL2C,
	supersimL2D,
	supersimL2E,
} from '@eth-optimism/viem/chains';
import {Chain, mainnet, sepolia} from 'viem/chains';

type Network = {
	sourceChain: Chain;
	chains: Chain[];
};

export const mainnetNetwork = {
	sourceChain: mainnet,
	chains: mainnetChains,
} as const satisfies Network;

export const sepoliaNetwork = {
	sourceChain: sepolia,
	chains: sepoliaChains,
} as const satisfies Network;

export const supersimNetwork = {
	sourceChain: supersimL1,
	chains: [supersimL2A, supersimL2B, supersimL2C, supersimL2D, supersimL2E],
} as const satisfies Network;

// TODO: update this
export const sepoliaDev0Network = {
	sourceChain: sepolia,
	chains: [],
} as const satisfies Network;

export const networks = [
	mainnetNetwork,
	sepoliaNetwork,
	sepoliaDev0Network,
	supersimNetwork,
];
