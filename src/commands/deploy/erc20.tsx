import { computeCreate2Address } from '../../contracts/createx/computeCreate2Address.js';
import { getEncodedConstructorArgs } from '../../utils/abi.js';
import { readForgeArtifact } from '../../utils/forge.js';
import { Box, Text, Newline } from 'ink'
import { option } from 'pastel';
import { useEffect, useState } from 'react';
import { concatHex, createPublicClient, createWalletClient, http, PublicClient, toHex, isHex, PrivateKeyAccount, WalletClient, Hex, Address } from 'viem';
import zod from 'zod'
import { fromError } from 'zod-validation-error';
import { privateKeyToAccount } from 'viem/accounts';
import { deployCreate2Contract, simulateDeployCreate2Contract } from '../../contracts/createx/deployCreate2Contract.js';
import { getChainByID, getChainByNetworkIdentifier, initChainConfig, SupportedNetwork } from '../../utils/superchainRegistry.js';
import { Spinner, UnorderedList, Badge, Alert } from '@inkjs/ui';
import { useDeploymentsStore, makeDeploymentPlan } from '../../stores/deployments.js';

export const options = zod.object({
	name: zod
        .string()
        .describe(option({
            description: 'Contract Name',
            alias: 'n',
        }))
        .min(3),
    forgeArtifactPath: zod
        .string()
        .describe(option({
            description: 'Path to the Forge artifact',
            alias: 'f',
        }))
        .min(1),
    constructorArgs: zod
        .string()
        .describe(option({
            description: 'Arguments to the constructor',
            alias: 'cargs',
        }))
        .min(4)
        .optional(),
    initArgs: zod
        .string()
        .describe(option({
            description: 'Arguments to initialize the ERC20 contract',
            alias: 'iargs',
        }))
        .min(4)
        .optional(),
    salt: zod
        .string()
        .describe(option({
            description: 'Salt',
            alias: 's',
        })),
    privateKey: zod
        .string()
        .describe(option({
            description: 'Signer private key',
            alias: 'pk',
        }))
        .refine((value) => {
            return isHex(value) && value.startsWith('0x') && value.length === 66
        }, {
            message: 'Invalid private key',
        }),
    chains: zod
        .string()
        .describe(option({
            description: 'Chains to deploy to',
            alias: 'c',
        })),
    network: zod
        .string()
        .default('mainnet')
        .describe(option({
            description: 'Network to deploy to',
            alias: 'n',
        })),
})

export type Props = {
    options: zod.infer<typeof options>
};

function getDeploymentPublicClients(chains: string[], l1Id: SupportedNetwork): PublicClient[] {
    return chains.map((l2Id) => {
        if (!getChainByNetworkIdentifier(l1Id, l2Id)) {
            throw new Error(`Chain ${l2Id} not found`)
        }

        const chain = getChainByNetworkIdentifier(l1Id, l2Id)
        return createPublicClient({ chain, transport: http() })
    })
}

function getDeploymentSignerClient(account: PrivateKeyAccount, chainId: number): WalletClient {
    return createWalletClient({ account, chain: getChainByID(chainId), transport: http() })
}

const statusBadge = {
    pending: <Spinner />,
    success: <Badge color="green">Done</Badge>,
    skipped: <Badge color="yellow">Skipped</Badge>,
    error: <Badge color="red"><Text color="white" bold>Failed</Text></Badge>,
}

const DeployErc20Command = (props: Props) => {
    const { forgeArtifactPath, constructorArgs, privateKey, chains, network, salt } = props.options

    const [deterministicAddresses, setDeterministicAddresses] = useState<Address | '0x'>('0x')
    const { addDeployment, updateDeploymentState, updateDeploymentStepStatus, addDeploymentBroadcast } = useDeploymentsStore()
    const deployment = useDeploymentsStore((state) => state.deployments[deterministicAddresses])

    try {
        options.parse(props.options)
    } catch (e) {
        const userFriendlyErrors = fromError(e)
        console.log(userFriendlyErrors.toString())
        return null
    }

    useEffect(() => {
        (async () => {
            await initChainConfig()

            const artifact = readForgeArtifact(forgeArtifactPath)            
            let initCode = artifact.bytecode.object

            const encodedConstructorArgs = getEncodedConstructorArgs(artifact.abi, constructorArgs?.split(','))
            if (encodedConstructorArgs) {
                initCode = concatHex([initCode, encodedConstructorArgs])
            }

            const account = privateKeyToAccount(privateKey.trim() as Hex)
            const creationSalt32Bytes = toHex(salt, { size: 32 })

            const superchainClients = getDeploymentPublicClients(chains.split(','), network as SupportedNetwork)

            const erc20Address = await computeCreate2Address({
                owner: account.address,
                client: superchainClients[0] as PublicClient,
                salt: creationSalt32Bytes,
                initCode,
            })
            setDeterministicAddresses(erc20Address)

            addDeployment({
                deployment: makeDeploymentPlan({
                    type: 'superchain-erc20',
                    deterministicAddress: erc20Address,
                    network: network as SupportedNetwork,
                    chainIds: superchainClients.map((client) => client.chain!.id),
                    creationParams: {
                        initCode,
                        salt: creationSalt32Bytes,
                        constructorArgs: encodedConstructorArgs,
                    },
                }),
            })

            const skippedExecutionChains = new Set<number>()
            for (let superchainClient of superchainClients) {                
                const isErc20AlreadyDeployed = await superchainClient.getCode({ address: erc20Address })


                if (isErc20AlreadyDeployed) {
                    skippedExecutionChains.add(superchainClient.chain!.id)
                }

                updateDeploymentStepStatus({
                    address: erc20Address,
                    chainId: superchainClient.chain!.id,
                    state: 'preVerification',
                    status: isErc20AlreadyDeployed ? 'error' : 'success',
                    message: isErc20AlreadyDeployed ? 'Contract already deployed to address' : undefined,
                })
            }

            updateDeploymentState(erc20Address, 'simulation')

            for (let superchainClient of superchainClients) {
                const chainId = superchainClient.chain!.id
                const walletClient = getDeploymentSignerClient(account, chainId)

                let address: Address | undefined

                try {
                    address = await simulateDeployCreate2Contract({
                        client: walletClient,
                        salt: creationSalt32Bytes,
                        initCode: initCode,
                    })

                    updateDeploymentStepStatus({
                        address: erc20Address,
                        chainId: superchainClient.chain!.id,
                        state: 'simulation',
                        status: address !== erc20Address ? 'error' : 'success',
                        message: address !== erc20Address ? 'Deployment address mismatch' : undefined,
                    })
                } catch (e) {
                    const err = e as Error

                    updateDeploymentStepStatus({
                        address: erc20Address,
                        chainId: superchainClient.chain!.id,
                        state: 'simulation',
                        status: 'error',
                        message: err.message,
                    })
                }

                if (address !== erc20Address) {
                    skippedExecutionChains.add(chainId)
                }
            }     
            
            updateDeploymentState(erc20Address, 'execution')

            for (let superchainClient of superchainClients) {
                if (skippedExecutionChains.has(superchainClient.chain!.id)) {
                    updateDeploymentStepStatus({
                        address: erc20Address,
                        chainId: superchainClient.chain!.id,
                        state: 'execution',
                        status: 'skipped',
                    })
                    continue
                }

                const hash = await deployCreate2Contract({
                    client: getDeploymentSignerClient(account, superchainClient.chain!.id),
                    salt: creationSalt32Bytes,
                    initCode: initCode,
                })

                const receipt = await superchainClient.waitForTransactionReceipt({ hash })

                addDeploymentBroadcast({
                    address: erc20Address,
                    broadcast: {
                        chainId: superchainClient.chain!.id,
                        type: 'createxCreate2Deploy',
                        hash,
                        blockNumber: receipt.blockNumber,
                    },
                })

                updateDeploymentStepStatus({
                    address: erc20Address,
                    chainId: superchainClient.chain!.id,
                    state: 'execution',
                    status: receipt.status === 'success' ? 'success' : 'error',
                })
            }

            updateDeploymentState(erc20Address, 'completed')
        })()
    }, [
        addDeployment,
        updateDeploymentState,
        updateDeploymentStepStatus,
        addDeploymentBroadcast,
        setDeterministicAddresses,
    ])

    return (
        <Box flexDirection='column' gap={1} paddingTop={2} paddingX={2}>
            <Text bold>
                Superchain ERC20 Deployment
            </Text>

            {deployment?.creationParams.initCode && (
                <Box flexDirection='column'>
                    <Text bold>Initialization Code:</Text>
                    <Alert variant="success">{deployment?.creationParams.initCode}</Alert>
                </Box>
            )}

            {deployment?.deterministicAddress && (
                <Box flexDirection='column' width={50}>
                    <Text bold>Deterministic Address:</Text>
                    <Alert variant="success">{deployment?.deterministicAddress}</Alert>
                </Box>
            )}

            {deployment?.chainIds && (
                <Box flexDirection='column'>
                    <Text bold>Plan</Text>
                    <UnorderedList>
                        {deployment?.chainIds.map((chainId) => (
                            <UnorderedList.Item key={chainId}>
                                <Text bold>{getChainByID(chainId)!.name}</Text>
                                <UnorderedList>
                                    <UnorderedList.Item>
                                    <Box flexDirection='column'>
                                            <Box flexDirection='row'>
                                                <Text bold>Pre-Deployment Verification: </Text>
                                                {statusBadge[deployment!.steps[chainId]!.preVerification.status]}
                                            </Box>
                                            {deployment!.steps[chainId]!.preVerification.message && (
                                                <Alert variant='error'>{deployment!.steps[chainId]!.preVerification.message}</Alert>
                                            )}
                                        </Box>
                                    </UnorderedList.Item>

                                    <UnorderedList.Item>
                                        <Box flexDirection='column'>
                                            <Box flexDirection='row'>
                                                <Text bold>Simulation: </Text>
                                                {statusBadge[deployment!.steps[chainId]!.simulation.status]}
                                            </Box>
                                            {deployment!.steps[chainId]!.simulation.message && (
                                                <Alert variant='error'>{deployment!.steps[chainId]!.simulation.message}</Alert>
                                            )}
                                            {deployment!.steps[chainId]!.simulation.selector && (
                                                <Alert variant='error'>{deployment!.steps[chainId]!.simulation.selector}</Alert>
                                            )}
                                        </Box>
                                    </UnorderedList.Item>

                                    <UnorderedList.Item>
                                        <Box flexDirection='row'>
                                            <Text bold>Execution: </Text>
                                            {statusBadge[deployment!.steps[chainId]!.execution.status]}
                                        </Box>
                                        {deployment!.steps[chainId]!.execution.message && (
                                            <Alert variant='error'>{deployment!.steps[chainId]!.execution.message}</Alert>
                                        )}
                                    </UnorderedList.Item>
                                </UnorderedList>
                            </UnorderedList.Item>
                        ))}
                    </UnorderedList>
                </Box>
            )}

            {!!deployment?.broadcasts.length && (
                <Box flexDirection='column'>
                    <Text bold>Broadcasts</Text>
                    <UnorderedList>
                        {deployment?.broadcasts.map((broadcast) => (
                            <UnorderedList.Item key={broadcast.chainId}>
                                <Box flexDirection='row'>
                                    <Text bold>{getChainByID(broadcast.chainId)!.name}: </Text>
                                    <Text>{broadcast.hash}</Text>
                                </Box>
                            </UnorderedList.Item>
                        ))}
                    </UnorderedList>
                </Box>
            )}

            {deployment?.state === 'completed' && <Text bold>Deployment run completed</Text>}

            <Newline />
        </Box>
    )
}

export default DeployErc20Command
