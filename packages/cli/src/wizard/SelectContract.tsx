import {ForgeProject} from '@/forge/ForgeProject';
import {InvalidWizardStep} from '@/wizard/InvalidWizardStep';
import {useWizardStore} from '@/wizard/wizardStore';
import {Select, Spinner} from '@inkjs/ui';
import {useQuery} from '@tanstack/react-query';
import {Box, Text} from 'ink';

export const SelectContract = () => {
	const {state, selectContract} = useWizardStore();

	if (state.step !== 'select-contract') {
		return <InvalidWizardStep />;
	}

	const {
		data: contracts,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['list-contracts', state.forgeProjectPath],
		queryFn: async () => {
			const forgeProject = new ForgeProject(state.forgeProjectPath);
			return await forgeProject.listContracts();
		},
	});

	if (isLoading) {
		return (
			<Box flexDirection="column">
				<Spinner label="Loading contracts..." />
			</Box>
		);
	}

	if (error || !contracts) {
		return (
			<Box flexDirection="column">
				<Text color="red">❌ Failed to load contracts</Text>
				{error && <Text>{error.toString()}</Text>}
			</Box>
		);
	}

	if (contracts.length === 0) {
		return (
			<Box flexDirection="column">
				<Text color="yellow">⚠️ No contracts found in project</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" gap={1} paddingX={1}>
			<Text>Select which contract you want to deploy</Text>
			<Select
				options={contracts.map(contractName => ({
					label: contractName,
					value: contractName,
				}))}
				onChange={selectContract}
			/>
		</Box>
	);
};
