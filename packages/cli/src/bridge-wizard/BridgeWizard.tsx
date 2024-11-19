import {
	BridgeWizardStateVariables,
	BridgeWizardStep,
	bridgeWizardStepMetadatas,
	indexByBridgeWizardStep,
} from '@/bridge-wizard/bridgeWizardSteps';
import {useBridgeWizardStore} from '@/bridge-wizard/bridgeWizardStore';
import {EnterAmount} from '@/bridge-wizard/EnterAmount';
import {EnterPrivateKey} from '@/bridge-wizard/EnterPrivateKey';
import {SelectChains} from '@/bridge-wizard/SelectChains';
import {SelectNetwork} from '@/bridge-wizard/SelectNetwork';
import {Box, Text} from 'ink';

const WizardProgress = ({state}: {state: BridgeWizardStep}) => {
	const currentIndex = indexByBridgeWizardStep[state.step];

	return (
		<Box flexDirection="column">
			{bridgeWizardStepMetadatas.map(({step, title, getSummary}, index) => {
				const isPast = index < currentIndex;
				const isCurrent = index === currentIndex;

				return (
					<Box key={step} gap={1} paddingX={1}>
						<Text color={isPast ? 'green' : isCurrent ? 'blue' : 'gray'}>
							{isPast ? '✓' : isCurrent ? '>' : '○'}
						</Text>
						<Text color={isCurrent ? 'blue' : 'white'}> {title}</Text>
						{isPast && (
							<Text color="yellow">
								{getSummary(state as unknown as BridgeWizardStateVariables)}
							</Text>
						)}
					</Box>
				);
			})}
		</Box>
	);
};

export const BridgeWizard = ({
	onSubmit,
}: {
	onSubmit: (form: BridgeWizardStateVariables) => void;
}) => {
	const {state} = useBridgeWizardStore();

	return (
		<Box flexDirection="column" gap={1}>
			<Text bold color="blue">
				🌉 Bridge Wizard
			</Text>
			<WizardProgress state={state} />

			<Box flexDirection="column">
				{state.step === 'select-network' && <SelectNetwork />}
				{state.step === 'enter-private-key' && <EnterPrivateKey />}
				{state.step === 'select-chains' && <SelectChains />}
				{state.step === 'enter-amount' && <EnterAmount />}
			</Box>
		</Box>
	);
};
