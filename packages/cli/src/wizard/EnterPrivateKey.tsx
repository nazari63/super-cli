import {useWizardStore} from '@/wizard/wizardStore';
import {Box, Text} from 'ink';
import {TextInput} from '@inkjs/ui';

export const EnterPrivateKey = ({
	onSubmit,
}: {
	onSubmit: (privateKey: string) => void;
}) => {
	const {state} = useWizardStore();

	if (state.step !== 'enter-private-key') {
		throw new Error('Invalid state');
	}

	return (
		<Box flexDirection="column" gap={1} paddingX={1}>
			<Box marginBottom={1}>
				<Text>
					Enter your private key to deploy with (press Enter to confirm):
				</Text>
			</Box>
			<TextInput onSubmit={privateKey => onSubmit(privateKey)} />
		</Box>
	);
};
