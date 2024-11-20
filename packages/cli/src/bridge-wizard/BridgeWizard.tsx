import {
	bridgeWizardIndexByStepId,
	BridgeWizardStepId,
	useBridgeWizardStore,
} from '@/bridge-wizard/bridgeWizardStore';
import {EnterAmount} from '@/bridge-wizard/EnterAmount';
import {EnterPrivateKey} from '@/bridge-wizard/EnterPrivateKey';
import {SelectChains} from '@/bridge-wizard/SelectChains';
import {SelectNetwork} from '@/bridge-wizard/SelectNetwork';
import {Box, Text} from 'ink';

type StepStatus = 'done' | 'current' | 'upcoming';

type StepProgress = {
	status: StepStatus;
	title: string;
	summary?: string;
};

const useStepProgress = ({
	stepId,
}: {
	stepId: BridgeWizardStepId;
}): StepProgress => {
	const {steps, wizardState} = useBridgeWizardStore();

	const currentIndex = bridgeWizardIndexByStepId[wizardState.stepId];
	const stepIndex = bridgeWizardIndexByStepId[stepId];

	const step = steps[stepIndex]!;

	if (stepIndex < currentIndex) {
		return {
			status: 'done' as const,
			title: step.title,
			summary: step.getSummary
				? step.getSummary(wizardState as unknown as any)
				: undefined,
		};
	}

	if (stepIndex === currentIndex) {
		return {
			status: 'current' as const,
			title: step.title,
		};
	}

	return {
		status: 'upcoming' as const,
		title: step.title,
	};
};

const WizardProgressForStep = ({stepId}: {stepId: BridgeWizardStepId}) => {
	const {status, title, summary} = useStepProgress({stepId});

	return (
		<Box gap={1} paddingX={1}>
			<Text
				color={
					status === 'done' ? 'green' : status === 'current' ? 'blue' : 'gray'
				}
			>
				{status === 'done' ? '✓' : status === 'current' ? '>' : '○'}
			</Text>
			<Text color={status === 'current' ? 'blue' : 'white'}> {title}</Text>
			{status === 'done' && summary && <Text color="yellow">{summary}</Text>}
		</Box>
	);
};

const WizardProgress = () => {
	const {steps, wizardState} = useBridgeWizardStore();
	if (wizardState.stepId === 'completed') {
		return (
			<Box>
				<Text>Completed</Text>
			</Box>
		);
	}
	return (
		<Box flexDirection="column">
			{steps.map(({id}) => {
				return <WizardProgressForStep stepId={id} key={id} />;
			})}
		</Box>
	);
};

export const BridgeWizard = () => {
	const {wizardState} = useBridgeWizardStore();

	const stepId = wizardState.stepId;

	return (
		<Box flexDirection="column" gap={1}>
			<Text bold color="blue">
				🌉 Bridge Wizard
			</Text>
			<WizardProgress />

			<Box flexDirection="column">
				{stepId === 'select-network' && <SelectNetwork />}
				{stepId === 'enter-private-key' && <EnterPrivateKey />}
				{stepId === 'select-chains' && <SelectChains />}
				{stepId === 'enter-amount' && <EnterAmount />}
			</Box>
		</Box>
	);
};
