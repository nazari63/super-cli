import {Box, Text} from 'ink';
import {useEffect} from 'react';
import {
	verifyContract,
	zodVerifyContractParams,
} from '@/actions/verifyContract';
import {z} from 'zod';
import {useContractVerificationStore} from '@/stores/contractVerification';
import {Spinner} from '@inkjs/ui';
import {useMappingChainById} from '@/queries/chainById';

const zodVerifyContractCommandParams = zodVerifyContractParams;

const VerifyCommand = ({
	options,
}: {
	options: z.infer<typeof zodVerifyContractCommandParams>;
}) => {
	useEffect(() => {
		verifyContract(options);
	}, []);

	const {currentStep, stateByChainId} = useContractVerificationStore();
	const {data: chainById} = useMappingChainById();

	if (currentStep === 'prepare' || !chainById) {
		return (
			<Box>
				<Spinner label="Preparing..." />
			</Box>
		);
	}

	if (currentStep === 'generate-standard-json-input') {
		return (
			<Box>
				<Spinner label="Generating standard JSON input..." />
			</Box>
		);
	}

	const chains = Object.values(stateByChainId).sort(
		(a, b) => a.chainId - b.chainId,
	);

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold>Superchain Contract Verification</Text>
			</Box>
			{chains.map(chain => (
				<Box key={chain.chainId} flexDirection="column">
					<Box gap={1}>
						<Box width={24}>
							<Text color="blue">{`${options.network}/${
								chainById[chain.chainId]!.name
							}`}</Text>
						</Box>
						{chain.verificationStatus === 'pending' && (
							<Box gap={1}>
								<Spinner />
								<Text dimColor>Verification in progress...</Text>
							</Box>
						)}
						{chain.verificationStatus === 'success' && (
							<Text color="green">
								✓ Verification successful{' '}
								{`${
									chainById[chain.chainId]?.blockExplorers?.default.url
								}/address/${options.contractAddress}`}
							</Text>
						)}
						{chain.verificationStatus === 'failure' && (
							<Text color="red">✗ Verification failed</Text>
						)}
					</Box>
					{chain.error && (
						<Box marginLeft={2}>
							<Text color="red" dimColor>
								Error: {chain.error.message || JSON.stringify(chain.error)}
							</Text>
						</Box>
					)}
				</Box>
			))}
		</Box>
	);
};

export default VerifyCommand;
export const options = zodVerifyContractCommandParams;
