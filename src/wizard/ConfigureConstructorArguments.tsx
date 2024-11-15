import {ForgeProject} from '@/forge/ForgeProject';
import {useWizardStore} from '@/wizard/wizardStore';
import {getConstructorAbi} from '@/utils/abi';
import {useQuery} from '@tanstack/react-query';
import {Box, Text} from 'ink';
import {AbiItemForm} from '@/wizard/AbiItemForm';

export const ConfigureConstructorArguments = () => {
	const {state, setConstructorArgs} = useWizardStore();

	if (state.step !== 'configure-constructor-arguments') {
		throw new Error('Invalid state');
	}

	const {data, isLoading} = useQuery({
		queryKey: ['artifact', state.selectedContract],
		queryFn: async () => {
			const forgeProject = new ForgeProject(state.forgeProjectPath);
			return await forgeProject.getArtifact(state.selectedContract);
		},
	});

	if (isLoading || !data) {
		return <Text>Loading...</Text>;
	}

	const constructorAbi = getConstructorAbi(data.abi);

	if (!constructorAbi) {
		throw new Error('No constructor ABI found');
	}

	return (
		<Box flexDirection="column" gap={1} paddingX={1}>
			<AbiItemForm
				abiItem={constructorAbi}
				onSubmit={result => {
					setConstructorArgs(result);
				}}
			/>
		</Box>
	);
};
