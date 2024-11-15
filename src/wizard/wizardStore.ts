import {WizardStep} from '@/wizard/wizardSteps';
import {create} from 'zustand';

export type WizardStore = {
	state: WizardStep;

	// Actions
	selectContract: (contract: string) => void;
	setConstructorArgs: (args: string[]) => void;
	setSalt: (salt: string) => void;
	selectNetwork: (network: string) => void;
	selectChains: (chainIds: number[]) => void;
	setPrivateKey: (privateKey: string) => void;
	reset: () => void;
};

const initialState = {
	step: 'select-contract',
	forgeProjectPath: '../superchainerc20-starter/packages/contracts',
} as const;

// const initialState = {
// 	step: 'configure-constructor-arguments',
// 	forgeProjectPath: '../superchainerc20-starter/packages/contracts',
// 	selectedContract: 'L2NativeSuperchainERC20.sol',
// } as const;

// todo use immer to update state
export const useWizardStore = create<WizardStore>(set => ({
	state: initialState,

	selectContract: (contract: string) =>
		set(store => {
			if (store.state.step !== 'select-contract') {
				throw new Error('Cannot select contract in current step');
			}

			return {
				state: {
					...store.state,
					step: 'configure-constructor-arguments',
					selectedContract: contract,
				},
			};
		}),

	setConstructorArgs: (args: string[]) =>
		set(store => {
			if (store.state.step !== 'configure-constructor-arguments') {
				throw new Error('Cannot set constructor arguments in current step');
			}

			return {
				state: {
					...store.state,
					step: 'configure-salt',
					constructorArguments: args,
				},
			};
		}),

	setSalt: (salt: string) =>
		set(store => {
			if (store.state.step !== 'configure-salt') {
				throw new Error('Cannot set salt in current step');
			}

			return {
				state: {
					...store.state,
					step: 'select-network',
					salt,
				},
			};
		}),

	selectNetwork: (network: string) =>
		set(store => {
			if (store.state.step !== 'select-network') {
				throw new Error('Cannot select network in current step');
			}

			return {
				state: {
					...store.state,
					step: 'select-chains',
					network,
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
					step: 'enter-private-key',
					chainIds,
				},
			};
		}),

	setPrivateKey: (privateKey: string) =>
		set(store => {
			if (store.state.step !== 'enter-private-key') {
				throw new Error('Cannot set private key in current step');
			}

			return {
				state: {
					...store.state,
					step: 'completed',
					privateKey,
				},
			};
		}),

	reset: () =>
		set(() => ({
			state: initialState,
		})),
}));
