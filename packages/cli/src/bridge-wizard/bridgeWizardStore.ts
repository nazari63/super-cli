import {create} from 'zustand';
import {BridgeWizardStep} from './bridgeWizardSteps';
import {Address, Hex} from 'viem';

export type BridgeWizardStore = {
	state: BridgeWizardStep;

	// Actions
	selectNetwork: (network: string) => void;
	setPrivateKey: (privateKey: Hex, address: Address) => void;
	selectChains: (chainIds: number[]) => void;
	setAmount: (amount: bigint) => void;
};

const initialState = {
	step: 'select-network',
} as const;

export const useBridgeWizardStore = create<BridgeWizardStore>(set => ({
	state: initialState,

	selectNetwork: (network: string) =>
		set(store => {
			if (store.state.step !== 'select-network') {
				throw new Error('Cannot select network in current step');
			}

			return {
				state: {
					...store.state,
					step: 'enter-private-key',
					network,
				},
			};
		}),

	setPrivateKey: (privateKey: Hex, address: Address) =>
		set(store => {
			if (store.state.step !== 'enter-private-key') {
				throw new Error('Cannot set private key in current step');
			}

			return {
				state: {
					...store.state,
					step: 'select-chains',
					privateKey,
					address,
				},
			};
		}),

	selectChains: (chainIds: number[]) =>
		set(store => {
			if (store.state.step !== 'select-chains') {
				throw new Error('Cannot select chains in current step');
			}

			return {
				state: {
					...store.state,
					step: 'enter-amount',
					chainIds,
				},
			};
		}),

	setAmount: (amount: bigint) =>
		set(store => {
			if (store.state.step !== 'enter-amount') {
				throw new Error('Cannot set amount in current step');
			}

			return {
				state: {
					...store.state,
					step: 'confirm-transaction',
					amount,
				},
			};
		}),
}));
