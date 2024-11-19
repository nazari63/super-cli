import {Box, Text} from 'ink';

export const InvalidWizardStep = () => (
	<Box flexDirection="column">
		<Text color="red">⚠️ Invalid wizard state</Text>
	</Box>
);
