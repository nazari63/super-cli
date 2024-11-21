import {useDeployCreate2WizardStore} from '@/deploy-create2-wizard/deployCreate2WizardStore';
import {Box, Text} from 'ink';
import {TextInput} from '@inkjs/ui';

export const EnterFoundryProjectPath = () => {
	const {wizardState, submitEnterFoundryProjectPath} =
		useDeployCreate2WizardStore();

	if (wizardState.stepId !== 'enter-foundry-project-path') {
		throw new Error('Invalid state');
	}

	return (
		<Box flexDirection="column">
			<Box>
				<Text>Enter the path to your foundry project (default: "."):</Text>
			</Box>
			<TextInput
				onSubmit={foundryProjectPath => {
					const projectPath = foundryProjectPath.trim();
					submitEnterFoundryProjectPath({
						foundryProjectPath: projectPath === '' ? '.' : projectPath,
					});
				}}
			/>
		</Box>
	);
};
