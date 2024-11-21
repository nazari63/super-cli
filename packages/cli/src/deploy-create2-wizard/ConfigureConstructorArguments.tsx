import {useDeployCreate2WizardStore} from '@/deploy-create2-wizard/deployCreate2WizardStore';
import {getConstructorAbi} from '@/utils/abi';
import {Box} from 'ink';
import {AbiItemForm} from '@/deploy-create2-wizard/AbiItemForm';
import {getArtifactPathForContract} from '@/forge/foundryProject';
import {useForgeArtifact} from '@/queries/forgeArtifact';
import {Spinner} from '@inkjs/ui';

export const ConfigureConstructorArguments = () => {
	const {wizardState, submitConfigureConstructorArguments} =
		useDeployCreate2WizardStore();

	if (wizardState.stepId !== 'configure-constructor-arguments') {
		throw new Error('Invalid state');
	}

	const path = getArtifactPathForContract(
		wizardState.foundryProjectPath,
		wizardState.selectedContract,
	);

	const {data: artifact, isLoading} = useForgeArtifact(path);

	if (isLoading || !artifact) {
		return (
			<Box flexDirection="column">
				<Spinner label="Loading artifact..." />
			</Box>
		);
	}

	const constructorAbi = getConstructorAbi(artifact.abi);

	if (!constructorAbi) {
		throw new Error('No constructor ABI found');
	}

	return (
		<Box flexDirection="column">
			<AbiItemForm
				abiItem={constructorAbi}
				onSubmit={result => {
					// TODO fix type
					submitConfigureConstructorArguments({constructorArgs: result});
				}}
			/>
		</Box>
	);
};
