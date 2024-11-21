import {Box, Text, Newline} from 'ink';
import {useEffect} from 'react';

import {Spinner, UnorderedList, Badge, Alert} from '@inkjs/ui';
import {useDeploymentsStore} from '@/stores/deployments';
import {
	deployCreateXCreate2,
	deployCreateXCreate2ComputeAddress,
	DeployCreateXCreate2Params,
	zodDeployCreateXCreate2Params,
} from '@/actions/deployCreateXCreate2';
import {useQuery} from '@tanstack/react-query';
import {useMappingChainById} from '@/queries/chainById';

const statusBadge = {
	pending: <Spinner />,
	success: <Badge color="green">Done</Badge>,
	skipped: <Badge color="yellow">Skipped</Badge>,
	error: (
		<Badge color="red">
			<Text color="white" bold>
				Failed
			</Text>
		</Badge>
	),
};

const useDeterministicAddress = (params: DeployCreateXCreate2Params) => {
	return useQuery({
		// TODO check this query key is consistent
		queryKey: ['deterministicAddress', params],
		queryFn: async () => {
			return deployCreateXCreate2ComputeAddress(params);
		},
	});
};

const DeployCreate2Command = ({
	options,
}: {
	options: DeployCreateXCreate2Params;
}) => {
	const {data: chainById} = useMappingChainById();

	useEffect(() => {
		deployCreateXCreate2(options);
	}, [options]);

	const {data: deterministicAddress, isLoading: isAddressLoading} =
		useDeterministicAddress(options);

	const deployment = useDeploymentsStore(state =>
		deterministicAddress ? state.deployments[deterministicAddress] : undefined,
	);

	if (!chainById || isAddressLoading || !deterministicAddress || !deployment) {
		return <Spinner />;
	}

	return (
		<Box flexDirection="column" gap={1} paddingTop={2} paddingX={2}>
			<Text bold>Superchain ERC20 Deployment</Text>

			{deployment?.creationParams.initCode && (
				<Box flexDirection="column">
					<Text bold>Initialization Code:</Text>
					<Alert variant="success">{deployment?.creationParams.initCode}</Alert>
				</Box>
			)}

			{deployment?.deterministicAddress && (
				<Box flexDirection="column" width={50}>
					<Text bold>Deterministic Address:</Text>
					<Alert variant="success">{deployment?.deterministicAddress}</Alert>
				</Box>
			)}

			{deployment?.chainIds && (
				<Box flexDirection="column">
					<Text bold>Plan</Text>
					<UnorderedList>
						{deployment?.chainIds.map(chainId => (
							<UnorderedList.Item key={chainId}>
								<Text bold>{chainById[chainId]!.name}</Text>
								<UnorderedList>
									<UnorderedList.Item>
										<Box flexDirection="column">
											<Box flexDirection="row">
												<Text bold>Pre-Deployment Verification: </Text>
												{
													statusBadge[
														deployment!.steps[chainId]!.preVerification.status
													]
												}
											</Box>
											{deployment!.steps[chainId]!.preVerification.message && (
												<Alert variant="error">
													{deployment!.steps[chainId]!.preVerification.message}
												</Alert>
											)}
										</Box>
									</UnorderedList.Item>

									<UnorderedList.Item>
										<Box flexDirection="column">
											<Box flexDirection="row">
												<Text bold>Simulation: </Text>
												{
													statusBadge[
														deployment!.steps[chainId]!.simulation.status
													]
												}
											</Box>
											{deployment!.steps[chainId]!.simulation.message && (
												<Alert variant="error">
													{deployment!.steps[chainId]!.simulation.message}
												</Alert>
											)}
											{deployment!.steps[chainId]!.simulation.selector && (
												<Alert variant="error">
													{deployment!.steps[chainId]!.simulation.selector}
												</Alert>
											)}
										</Box>
									</UnorderedList.Item>

									<UnorderedList.Item>
										<Box flexDirection="row">
											<Text bold>Execution: </Text>
											{
												statusBadge[
													deployment!.steps[chainId]!.execution.status
												]
											}
										</Box>
										{deployment!.steps[chainId]!.execution.message && (
											<Alert variant="error">
												{deployment!.steps[chainId]!.execution.message}
											</Alert>
										)}
									</UnorderedList.Item>
								</UnorderedList>
							</UnorderedList.Item>
						))}
					</UnorderedList>
				</Box>
			)}

			{!!deployment?.broadcasts.length && (
				<Box flexDirection="column">
					<Text bold>Broadcasts</Text>
					<UnorderedList>
						{deployment?.broadcasts.map(broadcast => (
							<UnorderedList.Item key={broadcast.chainId}>
								<Box flexDirection="row">
									<Text bold>{chainById[broadcast.chainId]!.name}: </Text>
									<Text>{broadcast.hash}</Text>
								</Box>
							</UnorderedList.Item>
						))}
					</UnorderedList>
				</Box>
			)}

			{deployment?.state === 'completed' && (
				<Text bold>Deployment run completed</Text>
			)}

			<Newline />
		</Box>
	);
};

export default DeployCreate2Command;
export const options = zodDeployCreateXCreate2Params;
