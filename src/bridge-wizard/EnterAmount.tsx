import {useBridgeWizardStore} from '@/bridge-wizard/bridgeWizardStore';
import {Select, Spinner} from '@inkjs/ui';
import {useQuery} from '@tanstack/react-query';
import {Box, Text} from 'ink';
import {formatEther, parseEther} from 'viem';
import {createPublicClient, http} from 'viem';
import {Address} from 'viem';
import {mainnet, sepolia} from 'viem/chains';

const getBalanceForNetworkL1 = (network: string, address: Address) => {
	// TODO support supersim
	const chain = network === 'mainnet' ? mainnet : sepolia;
	const client = createPublicClient({
		transport: http(),
		chain,
	});

	return client.getBalance({
		address,
	});
};

const useBalance = (network: string, address: Address) => {
	return useQuery({
		queryKey: ['balance', 'l1', network, address],
		queryFn: () => getBalanceForNetworkL1(network, address),
		staleTime: Infinity,
	});
};

const supportedAmounts: bigint[] = [
	parseEther('0.01'),
	parseEther('0.05'),
	parseEther('0.1'),
	parseEther('0.25'),
	parseEther('0.5'),
];

export const EnterAmount = () => {
	const {state, setAmount} = useBridgeWizardStore();

	if (state.step !== 'enter-amount') {
		throw new Error('Invalid state');
	}

	const {data: balance, isLoading: isLoadingBalance} = useBalance(
		state.network,
		state.address,
	);

	const numChains = state.chainIds.length;

	return (
		<Box flexDirection="column" gap={1}>
			<Text bold>
				How much would you like to bridge to {numChains} chain
				{numChains === 1 ? '' : 's'}?{' '}
			</Text>

			<Box paddingLeft={2}>
				<Text dimColor>Balance on {state.network}: </Text>
				{isLoadingBalance ? (
					<Spinner />
				) : balance ? (
					<Text color="green">{formatEther(balance)} ETH</Text>
				) : (
					<Text color="yellow">Unable to fetch balance</Text>
				)}
			</Box>

			<Box>
				<Select
					options={supportedAmounts.map(amount => {
						const perChainAmount = Number(formatEther(amount)).toFixed(2);
						const totalAmount = Number(
							formatEther(amount * BigInt(numChains)),
						).toFixed(2);
						return {
							label: `${perChainAmount.padStart(
								4,
							)} ETH × ${numChains} chains = ${totalAmount.padStart(
								4,
							)} ETH total`,
							value: amount.toString(),
						};
					})}
					onChange={amount => setAmount(BigInt(amount))}
				/>
			</Box>
		</Box>
	);
};
