import {Address, formatEther, Hex} from 'viem';

type BridgeWizardStepWithPreviousState<
	TStep extends string,
	TPrev extends BridgeWizardStep,
	TNew extends keyof BridgeWizardStateVariables,
> = Omit<TPrev, 'step'> & {
	step: TStep;
} & Pick<BridgeWizardStateVariables, TNew>;

export type BridgeWizardStateVariables = {
	privateKey: Hex;
	address: Address;
	network: string;
	chainIds: number[];
	amount: bigint;
};

type BridgeWizardSelectNetworkStep = {
	step: 'select-network';
};

type BridgeWizardEnterPrivateKeyStep = BridgeWizardStepWithPreviousState<
	'enter-private-key',
	BridgeWizardSelectNetworkStep,
	'network'
>;

type BridgeWizardSelectChainsStep = BridgeWizardStepWithPreviousState<
	'select-chains',
	BridgeWizardEnterPrivateKeyStep,
	'privateKey' | 'address'
>;

type BridgeWizardEnterAmountStep = BridgeWizardStepWithPreviousState<
	'enter-amount',
	BridgeWizardSelectChainsStep,
	'chainIds'
>;

type BridgeWizardConfirmTransactionStep = BridgeWizardStepWithPreviousState<
	'confirm-transaction',
	BridgeWizardEnterAmountStep,
	'amount'
>;

export type BridgeWizardStep =
	| BridgeWizardSelectNetworkStep
	| BridgeWizardEnterPrivateKeyStep
	| BridgeWizardSelectChainsStep
	| BridgeWizardEnterAmountStep
	| BridgeWizardConfirmTransactionStep;

export const bridgeWizardStepMetadatas = [
	{
		step: 'select-network',
		title: 'Select network',
		getSummary: (state: BridgeWizardStateVariables) => `${state.network}`,
	},
	{
		step: 'enter-private-key',
		title: 'Connect account',
		getSummary: (state: BridgeWizardStateVariables) => `${state.address}`,
	},
	{
		step: 'select-chains',
		title: 'Select chains',
		getSummary: (state: BridgeWizardStateVariables) =>
			`${state.chainIds.map(chainId => `${chainId}`).join(', ')}`,
	},
	{
		step: 'enter-amount',
		title: 'Enter amount',
		getSummary: (state: BridgeWizardStateVariables) => {
			const perChainAmount = Number(formatEther(state.amount)).toFixed(2);
			const totalAmount = Number(
				formatEther(state.amount * BigInt(state.chainIds.length)),
			).toFixed(2);
			return `${perChainAmount} ETH × ${state.chainIds.length} chains = ${totalAmount} ETH total`;
		},
	},
	{
		step: 'confirm-transaction',
		title: 'Confirm transaction',
		getSummary: () => '',
	},
] as const satisfies {
	step: BridgeWizardStep['step'];
	title: string;
	getSummary: (state: BridgeWizardStateVariables) => string;
}[];

export const bridgeWizardStepMetadataByStep = bridgeWizardStepMetadatas.reduce(
	(acc, metadata) => {
		acc[metadata.step] = metadata;
		return acc;
	},
	{} as Record<
		BridgeWizardStep['step'],
		(typeof bridgeWizardStepMetadatas)[number]
	>,
);

export const indexByBridgeWizardStep = bridgeWizardStepMetadatas.reduce(
	(acc, metadata, index) => {
		acc[metadata.step] = index;
		return acc;
	},
	{} as Record<BridgeWizardStep['step'], number>,
);

export const isAfterStep = (
	currentStep: BridgeWizardStep['step'],
	targetStep: BridgeWizardStep['step'],
) => {
	return (
		indexByBridgeWizardStep[currentStep] > indexByBridgeWizardStep[targetStep]
	);
};
