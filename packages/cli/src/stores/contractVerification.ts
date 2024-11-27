import {FoundryProject} from '@/forge/foundryProject';
import {Prettify} from '@/wizard-builder/utils';
import {create, StateCreator} from 'zustand';

type ContractVerificationStep =
	| 'prepare'
	| 'generate-standard-json-input'
	| 'verify'
	| 'completed';

type SharedSlice = {
	currentStep: ContractVerificationStep;
	stateByChainId: Record<number, ChainContractVerificationState>;
	setCurrentStep: (step: ContractVerificationStep) => void;
};

const createSharedSlice: StateCreator<SharedSlice> = set => ({
	currentStep: 'prepare',
	stateByChainId: {},
	setCurrentStep: (step: ContractVerificationStep) => set({currentStep: step}),
});

type PrepareSlice = {
	prepareError: Error | null;
	setPrepareSuccess: (chainIds: number[]) => void;
	setPrepareError: (error: Error) => void;
};

const createPrepareSlice: StateCreator<
	PrepareSlice & SharedSlice,
	[],
	[],
	PrepareSlice
> = set => ({
	prepareError: null,
	foundryProject: null,
	contractFileName: null,

	setPrepareSuccess: (chainIds: number[]) =>
		set({
			prepareError: null,
			currentStep: 'generate-standard-json-input',
			stateByChainId: Object.fromEntries(
				chainIds.map(chainId => [
					chainId,
					{chainId, verificationStatus: 'idle'},
				]),
			),
		}),

	setPrepareError: error =>
		set({
			prepareError: error,
		}),
});

type StandardJsonInputSlice = {
	generateError: Error | null;
	setGenerateSuccess: () => void;
	setGenerateError: (error: Error) => void;
};

const createStandardJsonInputSlice: StateCreator<
	StandardJsonInputSlice & SharedSlice,
	[],
	[],
	StandardJsonInputSlice
> = set => ({
	generateError: null,

	setGenerateSuccess: () =>
		set({
			generateError: null,
			currentStep: 'verify',
		}),

	setGenerateError: error =>
		set({
			generateError: error,
		}),
});

type ChainContractVerificationState =
	| {chainId: number} & (
			| {
					verificationStatus: 'idle';
			  }
			| {
					verificationStatus: 'pending';
			  }
			| {
					verificationStatus: 'success';
			  }
			| {
					verificationStatus: 'failure';
					error: Error;
			  }
	  );

type VerifySlice = {
	setVerifyPending: (chainId: number) => void;
	setVerifySuccess: (chainId: number) => void;
	setVerifyError: (chainId: number, error: Error) => void;
};

export const createVerifySlice: StateCreator<
	VerifySlice & SharedSlice,
	[],
	[],
	VerifySlice
> = (set, get) => ({
	setVerifyPending: chainId =>
		set(state => ({
			stateByChainId: {
				...state.stateByChainId,
				[chainId]: {chainId, verificationStatus: 'pending'},
			},
		})),

	setVerifySuccess: chainId => {
		const allSuccess = Object.values(get().stateByChainId).every(
			state => state.verificationStatus === 'success',
		);

		set(state => ({
			...(allSuccess ? {currentStep: 'completed'} : {}),
			stateByChainId: {
				...state.stateByChainId,
				[chainId]: {chainId, verificationStatus: 'success'},
			},
		}));
	},
	setVerifyError: (chainId, error) => {
		set(state => ({
			stateByChainId: {
				...state.stateByChainId,
				[chainId]: {
					chainId,
					verificationStatus: 'failure',
					error,
				},
			},
		}));
	},
});

type VerificationStore = Prettify<
	SharedSlice & PrepareSlice & StandardJsonInputSlice & VerifySlice
>;

export const useContractVerificationStore = create<VerificationStore>()(
	(...args) => ({
		...createSharedSlice(...args),
		...createPrepareSlice(...args),
		...createStandardJsonInputSlice(...args),
		...createVerifySlice(...args),
	}),
);
