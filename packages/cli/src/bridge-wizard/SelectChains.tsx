import {useBridgeWizardStore} from '@/bridge-wizard/bridgeWizardStore';
import {useChainConfig} from '@/queries/chainConfig';
import {MultiSelect, Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import {useState} from 'react';

export const SelectChains = () => {
	const {wizardState, submitSelectChains} = useBridgeWizardStore();

	if (wizardState.stepId !== 'select-chains') {
		throw new Error('Invalid state');
	}

	const {
		data: chains,
		isLoading: isLoadingChains,
		error: loadChainsError,
	} = useChainConfig();

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (isLoadingChains) {
		return (
			<Box flexDirection="column">
				<Spinner
					label={`Loading chains from superchain registry for ${wizardState.network}...`}
				/>
			</Box>
		);
	}

	if (loadChainsError || !chains) {
		return (
			<Box flexDirection="column">
				<Text color="red">
					❌ Failed to load chains from superchain registry
				</Text>
				<Text color="red">{loadChainsError?.toString()}</Text>
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
		<Box flexDirection="column">
			<Text>
				<Text color="cyan" bold>
					Select chains to bridge to{' '}
				</Text>
				<Text color="gray">(</Text>
				<Text color="yellow">↑↓</Text>
				<Text color="gray"> navigate - more below, </Text>
				<Text color="yellow">space</Text>
				<Text color="gray"> select, </Text>
				<Text color="yellow">enter</Text>
				<Text color="gray"> to confirm)</Text>
			</Text>
			<MultiSelect
				options={chains
					.filter(chain => chain.parent.chain === wizardState.network)
					.map(chain => ({
						label: `${chain.name} (${chain.chainId})`,
						value: chain.chainId.toString(),
					}))}
				onSubmit={chainIdStrs => {
					if (chainIdStrs.length === 0) {
						setErrorMessage('You must select at least one chain');
						return;
					}
					submitSelectChains({
						chainIds: chainIdStrs.map(Number),
					});
				}}
			/>
			{errorMessage && <Text color="red">{errorMessage}</Text>}
		</Box>
	);
};
