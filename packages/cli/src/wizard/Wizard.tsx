import {Box, Text} from 'ink';
import figures from 'figures';
import {useWizardStore} from '@/wizard/wizardStore';
import {SelectContract} from '@/wizard/SelectContract';
import {ConfigureConstructorArguments} from '@/wizard/ConfigureConstructorArguments';
import {SelectChains} from '@/wizard/SelectChains';
import {
	WizardStateVariables,
	WizardStep,
	wizardStepMetadatas,
} from '@/wizard/wizardSteps';
import {ConfigureSalt} from '@/wizard/ConfigureSalt';
import {SelectNetwork} from '@/wizard/SelectNetwork';
import {EnterPrivateKey} from '@/wizard/EnterPrivateKey';

const WizardProgress = ({currentStep}: {currentStep: WizardStep['step']}) => {
	const currentIndex = wizardStepMetadatas.findIndex(
		step => step.step === currentStep,
	);

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold color="blue">
					✨ Superchain Deployment Wizard
				</Text>
			</Box>

			<Box marginBottom={1} flexDirection="column">
				{wizardStepMetadatas.map(({step, title}, index) => {
					const isPast = index < currentIndex;
					const isCurrent = index === currentIndex;

					return (
						<Box key={step}>
							<Text>
								<Text color={isPast ? 'green' : isCurrent ? 'blue' : 'gray'}>
									{isPast
										? figures.tick
										: isCurrent
										? figures.play
										: figures.circle}
								</Text>
								<Text color={isCurrent ? 'blue' : 'white'}> {title}</Text>
							</Text>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
};

export const Wizard = ({
	onSubmit,
}: {
	onSubmit: (form: WizardStateVariables) => void;
}) => {
	const {state} = useWizardStore();

	return (
		<Box flexDirection="column" height={30}>
			<WizardProgress currentStep={state.step} />

			<Box paddingX={1}>
				{state.step === 'select-contract' && <SelectContract />}
				{state.step === 'configure-constructor-arguments' && (
					<ConfigureConstructorArguments />
				)}
				{state.step === 'configure-salt' && <ConfigureSalt />}
				{state.step === 'select-network' && <SelectNetwork />}
				{state.step === 'select-chains' && <SelectChains />}
				{state.step === 'enter-private-key' && (
					<EnterPrivateKey
						onSubmit={privateKey => {
							onSubmit({
								...state,
								privateKey,
							});
						}}
					/>
				)}
			</Box>
		</Box>
	);
};
