import {SupportedNetwork} from '@/utils/superchainRegistry';
import {useBridgeWizardStore} from '@/bridge-wizard/bridgeWizardStore';
import {Select} from '@inkjs/ui';
import {Box, Text} from 'ink';

const supportedNetworks: SupportedNetwork[] = ['mainnet', 'sepolia'];

export const SelectNetwork = () => {
	const {state, selectNetwork} = useBridgeWizardStore();

	if (state.step !== 'select-network') {
		throw new Error('Invalid state');
	}

	return (
		<Box flexDirection="column">
			<Text bold>Which L1 network do you want to bridge from?</Text>
			<Select
				options={supportedNetworks.map(network => ({
					label: network,
					value: network,
				}))}
				onChange={selectNetwork}
			/>
		</Box>
	);
};
