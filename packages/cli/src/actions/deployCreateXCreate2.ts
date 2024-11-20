import {computeCreate2Address} from '@/contracts/createx/computeCreate2Address';
import {
	deployCreate2Contract,
	simulateDeployCreate2Contract,
} from '@/contracts/createx/deployCreate2Contract';
import {queryMappingChainByIdentifier} from '@/queries/chainByIdentifier';
import {queryForgeArtifact} from '@/queries/forgeArtifact';
import {makeDeploymentPlan, useDeploymentsStore} from '@/stores/deployments';
import {zodSupportedNetwork} from '@/superchain-registry/fetchChainList';
import {getEncodedConstructorArgs} from '@/utils/abi';
import {zodPrivateKey} from '@/validators/schemas';
import {option} from 'pastel';
import {
	concatHex,
	createPublicClient,
	PublicClient,
	http,
	toHex,
	createWalletClient,
	Address,
	publicActions,
} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import z from 'zod';

export const zodDeployCreateXCreate2Params = z.object({
	forgeArtifactPath: z
		.string()
		.describe(
			option({
				description: 'Path to the Forge artifact',
				alias: 'f',
			}),
		)
		.min(1),
	constructorArgs: z
		.string()
		.describe(
			option({
				description: 'Arguments to the constructor',
				alias: 'cargs',
			}),
		)
		.min(4)
		.optional(),
	initArgs: z
		.string()
		.describe(
			option({
				description: 'Arguments to initialize the ERC20 contract',
				alias: 'iargs',
			}),
		)
		.min(4)
		.optional(),
	salt: z.string().describe(
		option({
			description: 'Salt',
			alias: 's',
		}),
	),
	privateKey: zodPrivateKey.describe(
		option({
			description: 'Signer private key',
			alias: 'pk',
		}),
	),
	chains: z
		.string()
		.transform(value => value.split(','))
		.describe(
			option({
				description: 'Chains to deploy to',
				alias: 'c',
			}),
		),
	network: zodSupportedNetwork.describe(
		option({
			description: 'Network to deploy to',
			alias: 'n',
		}),
	),
});

export type DeployCreateXCreate2Params = z.infer<
	typeof zodDeployCreateXCreate2Params
>;

const createDeployContext = async ({
	forgeArtifactPath,
	privateKey,
	salt,
	chains,
	network,
	constructorArgs,
}: DeployCreateXCreate2Params) => {
	const chainByIdentifier = await queryMappingChainByIdentifier();
	const artifact = await queryForgeArtifact(forgeArtifactPath);

	const chainIdentifiers = chains.map(chain => `${network}/${chain}`);

	const encodedConstructorArgs = getEncodedConstructorArgs(
		artifact.abi,
		constructorArgs?.split(','),
	);

	let initCode = encodedConstructorArgs
		? concatHex([artifact.bytecode.object, encodedConstructorArgs])
		: artifact.bytecode.object;

	const account = privateKeyToAccount(privateKey);
	const creationSalt32Bytes = toHex(salt, {size: 32});

	const selectedChains = chainIdentifiers.map(
		chainIdentifier => chainByIdentifier[chainIdentifier]!,
	);

	const publicClients = selectedChains.map(chain => {
		return createPublicClient({chain, transport: http()});
	});

	return {
		account,
		creationSalt32Bytes,
		initCode,
		publicClients,
		chainByIdentifier,
		selectedChains,
	};
};

export const deployCreateXCreate2ComputeAddress = async (
	params: DeployCreateXCreate2Params,
) => {
	const {account, creationSalt32Bytes, initCode, publicClients} =
		await createDeployContext(params);

	const deterministicAddress = await computeCreate2Address({
		owner: account.address,
		client: publicClients[0] as PublicClient,
		salt: creationSalt32Bytes,
		initCode,
	});

	return deterministicAddress;
};

export const deployCreateXCreate2 = async (
	params: DeployCreateXCreate2Params,
) => {
	const {
		account,
		creationSalt32Bytes,
		initCode,
		publicClients,
		selectedChains,
	} = await createDeployContext(params);

	const {network} = params;

	const deploymentsStore = useDeploymentsStore.getState();

	const deterministicAddress = await deployCreateXCreate2ComputeAddress(params);

	deploymentsStore.addDeployment({
		deployment: makeDeploymentPlan({
			type: 'createx-create2',
			deterministicAddress,
			network,
			chainIds: selectedChains.map(chain => chain.id),
			creationParams: {
				initCode,
				salt: creationSalt32Bytes,
			},
		}),
	});

	const skippedExecutionChainIds = new Set<number>();
	for (let publicClient of publicClients) {
		const isAlreadyDeployed = await publicClient.getCode({
			address: deterministicAddress,
		});

		if (isAlreadyDeployed) {
			skippedExecutionChainIds.add(publicClient.chain!.id);
		}

		deploymentsStore.updateDeploymentStepStatus({
			address: deterministicAddress,
			chainId: publicClient.chain!.id,
			state: 'preVerification',
			status: isAlreadyDeployed ? 'error' : 'success',
			message: isAlreadyDeployed
				? 'Contract already deployed to address'
				: undefined,
		});
	}

	deploymentsStore.updateDeploymentState(deterministicAddress, 'simulation');

	for (let chain of selectedChains) {
		const walletClient = createWalletClient({
			account,
			chain,
			transport: http(),
		});

		let address: Address | undefined;
		try {
			address = await simulateDeployCreate2Contract({
				client: walletClient,
				salt: creationSalt32Bytes,
				initCode: initCode,
			});

			deploymentsStore.updateDeploymentStepStatus({
				address: deterministicAddress,
				chainId: chain.id,
				state: 'simulation',
				status: address !== deterministicAddress ? 'error' : 'success',
				message:
					address !== deterministicAddress
						? 'Deployment address mismatch'
						: undefined,
			});
		} catch (e) {
			const err = e as Error;

			deploymentsStore.updateDeploymentStepStatus({
				address: deterministicAddress,
				chainId: chain.id,
				state: 'simulation',
				status: 'error',
				message: err.message,
			});
		}

		if (address !== deterministicAddress) {
			skippedExecutionChainIds.add(chain.id);
		}
	}

	deploymentsStore.updateDeploymentState(deterministicAddress, 'execution');

	for (let chain of selectedChains) {
		// TODO refactor this
		const walletClient = createWalletClient({
			account,
			chain,
			transport: http(),
		}).extend(publicActions);

		if (skippedExecutionChainIds.has(chain.id)) {
			deploymentsStore.updateDeploymentStepStatus({
				address: deterministicAddress,
				chainId: chain.id,
				state: 'execution',
				status: 'skipped',
			});
			continue;
		}

		const hash = await deployCreate2Contract({
			client: walletClient,
			salt: creationSalt32Bytes,
			initCode: initCode,
		});

		const receipt = await walletClient.waitForTransactionReceipt({
			hash,
		});

		deploymentsStore.addDeploymentBroadcast({
			address: deterministicAddress,
			broadcast: {
				chainId: chain.id,
				type: 'createxCreate2Deploy',
				hash,
				blockNumber: receipt.blockNumber,
			},
		});

		deploymentsStore.updateDeploymentStepStatus({
			address: deterministicAddress,
			chainId: chain.id,
			state: 'execution',
			status: receipt.status === 'success' ? 'success' : 'error',
		});
	}

	deploymentsStore.updateDeploymentState(deterministicAddress, 'completed');
};
