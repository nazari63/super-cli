import {useWizardStore} from '@/wizard/wizardStore';
import {Box, Text} from 'ink';
import {TextInput} from '@inkjs/ui';
export const ConfigureSalt = () => {
	const {state, setSalt} = useWizardStore();

	if (state.step !== 'configure-salt') {
		throw new Error('Invalid state');
	}

	return (
		<Box flexDirection="column" gap={1} paddingX={1}>
			<Box marginBottom={1}>
				<Text>Enter a salt value (press Enter to confirm):</Text>
			</Box>
			<TextInput
				onSubmit={salt => setSalt(salt)}
				defaultValue={'ethers phoenix'}
			/>
		</Box>
	);
};
