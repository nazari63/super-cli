import {useDeployCreate2WizardStore} from '@/deploy-create2-wizard/deployCreate2WizardStore';
import {Box, Text} from 'ink';
import {Spinner} from '@inkjs/ui';
import {useUserContext} from '@/queries/userContext';
import {PathInput} from '@/components/path-input/PathInput';

export const EnterFoundryProjectPath = () => {
	const {wizardState, submitEnterFoundryProjectPath} =
		useDeployCreate2WizardStore();

	const {data: userContext, isLoading: isUserContextLoading} = useUserContext();

	if (wizardState.stepId !== 'enter-foundry-project-path') {
		throw new Error('Invalid state');
	}

	if (isUserContextLoading || !userContext) {
		return <Spinner />;
	}

	return (
		<Box flexDirection="column">
			<Box>
				<Text>Enter the path to your foundry project (default: "."):</Text>
			</Box>
			<PathInput
				defaultValue={userContext.forgeProjectPath ?? ''}
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
