type WizardStepWithPreviousState<
	TStep extends string,
	TPrev extends WizardStep,
	TNew extends keyof WizardStateVariables,
> = Omit<TPrev, 'step'> & {
	step: TStep;
} & Pick<WizardStateVariables, TNew>;

export type WizardStateVariables = {
	forgeProjectPath: string;
	selectedContract: string;
	constructorArguments: string[];
	salt: string;
	network: string;
	chainIds: number[];
	privateKey: string;
};

type WizardSelectContractStep = {
	step: 'select-contract';
} & Pick<WizardStateVariables, 'forgeProjectPath'>;

type WizardConfigureConstructorArgumentsStep = WizardStepWithPreviousState<
	'configure-constructor-arguments',
	WizardSelectContractStep,
	'selectedContract'
>;

type WizardConfigureSaltStep = WizardStepWithPreviousState<
	'configure-salt',
	WizardConfigureConstructorArgumentsStep,
	'constructorArguments'
>;

type WizardSelectNetworkStep = WizardStepWithPreviousState<
	'select-network',
	WizardConfigureSaltStep,
	'salt'
>;

type WizardSelectChainsStep = WizardStepWithPreviousState<
	'select-chains',
	WizardSelectNetworkStep,
	'network'
>;

type WizardEnterPrivateKeyStep = WizardStepWithPreviousState<
	'enter-private-key',
	WizardSelectChainsStep,
	'chainIds'
>;

type WizardCompletedStep = WizardStepWithPreviousState<
	'completed',
	WizardEnterPrivateKeyStep,
	'privateKey'
>;

export type WizardStep =
	| WizardSelectContractStep
	| WizardConfigureConstructorArgumentsStep
	| WizardConfigureSaltStep
	| WizardSelectNetworkStep
	| WizardSelectChainsStep
	| WizardEnterPrivateKeyStep
	| WizardCompletedStep;

export const wizardStepMetadatas = [
	{
		step: 'select-contract',
		title: '📄 Select a contract to deploy',
	},
	{
		step: 'configure-constructor-arguments',
		title: '🔧 Configure constructor arguments',
	},
	{
		step: 'configure-salt',
		title: '🧂 Configure salt',
	},
	{
		step: 'select-network',
		title: '🌐 Select a network',
	},
	{
		step: 'select-chains',
		title: '🔗 Select chains to deploy to',
	},
	{
		step: 'enter-private-key',
		title: '🔑 Enter your private key to deploy with',
	},
	{
		step: 'completed',
		title: '🚀 Preparing to deploy...',
	},
] as const satisfies {
	step: WizardStep['step'];
	title: string;
}[];
