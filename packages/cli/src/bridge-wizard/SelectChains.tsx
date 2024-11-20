import {useBridgeWizardStore} from '@/bridge-wizard/bridgeWizardStore';
import {ChainListItem, initChainConfig} from '@/utils/superchainRegistry';
import {MultiSelect, Spinner} from '@inkjs/ui';
import {useQuery} from '@tanstack/react-query';
import {Box, Text} from 'ink';
import {useState} from 'react';
import {Address, createPublicClient, http, formatEther} from 'viem';

const getBalanceForChain = (chainListItem: ChainListItem, address: Address) => {
	const client = createPublicClient({
		transport: http(chainListItem.rpc[0]),
	});

	return client.getBalance({
		address,
	});
};

export const SelectChains = () => {
	const {wizardState, submitSelectChains} = useBridgeWizardStore();

	if (wizardState.stepId !== 'select-chains') {
		throw new Error('Invalid state');
	}

	const {
		data: chains,
		isLoading: isLoadingChains,
		error: loadChainsError,
	} = useQuery({
		queryKey: ['init-chain-config'],
		queryFn: async () => {
			return await initChainConfig();
		},
	});

	// TODO: break this out into separate keyed queries by chainId
	// TODO: handle errors
	const {
		data: balanceByChainId,
		isLoading: isLoadingBalances,
		error: loadBalancesError,
	} = useQuery({
		queryKey: ['balance', 'l2', wizardState.network, wizardState.address],
		queryFn: async () => {
			const chainsInNetwork = chains!.filter(
				chain => chain.parent.chain === wizardState.network,
			);
			const balances = await Promise.all(
				chainsInNetwork.map(chain =>
					getBalanceForChain(chain, wizardState.address),
				),
			);

			return Object.fromEntries(
				chainsInNetwork.map((chain, index) => [chain.chainId, balances[index]]),
			);
		},
		enabled:
			Boolean(chains) && chains!.length > 0 && Boolean(wizardState.address),
		staleTime: Infinity,
	});

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
			{loadBalancesError && (
				<Text color="yellow">⚠️ Unable to load balances</Text>
			)}
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
						label:
							isLoadingBalances || loadBalancesError
								? chain.name
								: `${chain.name} (${formatEther(
										balanceByChainId?.[chain.chainId] ?? 0n,
								  )} ETH)`,
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
