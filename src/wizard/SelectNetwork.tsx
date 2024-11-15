import {SupportedNetwork} from '@/utils/superchainRegistry';
import {InvalidWizardStep} from '@/wizard/InvalidWizardStep';
import {useWizardStore} from '@/wizard/wizardStore';
import {Select} from '@inkjs/ui';
import {Box, Text} from 'ink';

const supportedNetworks: SupportedNetwork[] = ['mainnet', 'sepolia'];

export const SelectNetwork = () => {
	const {state, selectNetwork} = useWizardStore();

	if (state.step !== 'select-network') {
		return <InvalidWizardStep />;
	}

	return (
		<Box flexDirection="column" gap={1} paddingX={1}>
			<Text>Select which network you want to deploy to (testnet/mainnet)</Text>
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
