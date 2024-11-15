import {initChainConfig} from '@/utils/superchainRegistry';
import {InvalidWizardStep} from '@/wizard/InvalidWizardStep';
import {useWizardStore} from '@/wizard/wizardStore';
import {MultiSelect, Spinner} from '@inkjs/ui';
import {useQuery} from '@tanstack/react-query';
import {Box, Text} from 'ink';
import {useState} from 'react';

export const SelectChains = () => {
	const {state, selectChains} = useWizardStore();

	const {
		data: chains,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['init-chain-config'],
		queryFn: async () => {
			return await initChainConfig();
		},
	});

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (state.step !== 'select-chains') {
		return <InvalidWizardStep />;
	}

	if (isLoading) {
		return (
			<Box flexDirection="column">
				<Spinner label="Loading chains from superchain registry..." />
			</Box>
		);
	}

	if (error || !chains) {
		return (
			<Box flexDirection="column">
				<Text color="red">
					❌ Failed to load chains from superchain registry
				</Text>
				{error && <Text>{error.toString()}</Text>}
			</Box>
		);
	}

	if (chains.length === 0) {
		return (
			<Box flexDirection="column">
				<Text color="yellow">⚠️ No chains found</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" gap={1} paddingX={1}>
			<Text>
				<Text color="cyan">Select chains to deploy to</Text>
				<Text color="gray"> (</Text>
				<Text color="yellow">↑↓</Text>
				<Text color="gray"> to navigate, </Text>
				<Text color="yellow">space</Text>
				<Text color="gray"> to select, </Text>
				<Text color="yellow">enter</Text>
				<Text color="gray"> to confirm, more options available below </Text>
				<Text color="yellow">↓</Text>
				<Text color="gray">)</Text>
			</Text>
			<MultiSelect
				options={chains
					.filter(chain => chain.parent.chain === state.network)
					.map(chain => ({
						label: chain.name,
						value: chain.chainId.toString(),
					}))}
				onSubmit={chainIdStrs => {
					if (chainIdStrs.length === 0) {
						setErrorMessage('You must select at least one chain');
						return;
					}

					selectChains(chainIdStrs.map(Number));
				}}
			/>
			{errorMessage && <Text color="red">{errorMessage}</Text>}
		</Box>
	);
};
