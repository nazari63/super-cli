import {useDeployCreate2WizardStore} from '@/deploy-create2-wizard/deployCreate2WizardStore';
import {Box, Text} from 'ink';
import {TextInput} from '@inkjs/ui';
import {privateKeyToAccount, PrivateKeyToAccountErrorType} from 'viem/accounts';
import {useState} from 'react';
import {Account, isHex} from 'viem';

export const EnterPrivateKey = () => {
	const {wizardState, submitEnterPrivateKey} = useDeployCreate2WizardStore();

	if (wizardState.stepId !== 'enter-private-key') {
		throw new Error('Invalid state');
	}

	const [errorMessage, setErrorMessage] = useState<string>('');
	const [resetKey, setResetKey] = useState(0);

	return (
		<Box flexDirection="column">
			<Box>
				<Text bold>Enter your private key for your account:</Text>
			</Box>
			<TextInput
				key={resetKey}
				onSubmit={privateKey => {
					if (!isHex(privateKey)) {
						setErrorMessage('Invalid private key: must start with 0x');
						setResetKey(prev => prev + 1);
						return;
					}

					let account: Account;
					try {
						account = privateKeyToAccount(privateKey);
					} catch (err) {
						const error = err as PrivateKeyToAccountErrorType;
						setErrorMessage(
							// @ts-expect-error
							`Invalid private key: ${error.shortMessage ?? error.message}`,
						);
						setResetKey(prev => prev + 1);
						return;
					}

					submitEnterPrivateKey({
						privateKey,
						address: account.address,
					});
				}}
			/>
			{errorMessage && (
				<Box>
					<Text color="red">{errorMessage ? `❌ ${errorMessage}` : ' '}</Text>
				</Box>
			)}
		</Box>
	);
};
