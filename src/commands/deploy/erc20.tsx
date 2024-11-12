import { computeCreate2Address } from '../../contracts/createx/computeCreate2Address.js';
import { getEncodedConstructorArgs } from '../../utils/abi.js';
import { readForgeArtifact } from '../../utils/forge.js';
import { Box, Text } from 'ink'
import { option } from 'pastel';
import { useEffect, useState } from 'react';
import { concatHex, createPublicClient, createWalletClient, http, PublicClient, toHex, isHex, PrivateKeyAccount, WalletClient, Hex, Hash } from 'viem';
import zod from 'zod'
import { fromError } from 'zod-validation-error';
import { privateKeyToAccount } from 'viem/accounts';
import { deployCreate2Contract, simulateDeployCreate2Contract } from '../../contracts/createx/deployCreate2Contract.js';
import { getChainByID, getChainByNetworkIdentifier, initChainConfig, SupportedNetwork } from '../../utils/superchainRegistry.js';
import { Spinner, UnorderedList, Badge } from '@inkjs/ui';

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

type PlanStatus = {
    verification: 'loading' | 'success' | 'error'
    simulation: 'loading' | 'success' | 'error'
    execution: 'loading' | 'success' | 'error'
}

const statusBadge = {
    loading: <Spinner />,
    success: <Badge color="green">Done</Badge>,
    error: <Badge color="red"><Text color="white" bold>Failed</Text></Badge>,
}

const DeployErc20Command = (props: Props) => {
    const { forgeArtifactPath, constructorArgs, privateKey, chains, network, salt } = props.options
    const [deterministicAddresses, setDeterministicAddresses] = useState<string | undefined>()
    const [initCode, setInitCode] = useState<Hex | undefined>()

    const [plan, setPlan] = useState<Record<string, PlanStatus>>(chains.split(',').reduce((acc, chain) => {
        acc[chain] = {
            verification: 'loading',
            simulation: 'loading',
            execution: 'loading',
        }
        return acc
    }, {} as Record<string, PlanStatus>))
    
    const [broadcasts, setBroadcasts] = useState<{
        chain: string
        hash: Hash
    }[]>([])

    try {
        options.parse(props.options)
    } catch (e) {
        const userFriendlyErrors = fromError(e)
        console.log(userFriendlyErrors.toString())
        return null
    }

    const parsedChains = chains.split(',').map((chain) => chain.trim())

    useEffect(() => {
        (async () => {
            await initChainConfig()

            const artifact = readForgeArtifact(forgeArtifactPath)            
            let initCode = artifact.bytecode.object

            const encodedConstructorArgs = getEncodedConstructorArgs(artifact.abi, constructorArgs?.split(','))
            if (encodedConstructorArgs) {
                initCode = concatHex([initCode, encodedConstructorArgs])
                setInitCode(initCode)
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

            for (let superchainClient of superchainClients) {
                const isErc20AlreadyDeployed = await superchainClient.getCode({ address: erc20Address })


                setPlan(prev => ({
                    ...prev,
                    [superchainClient.chain!.name]: {
                        verification: isErc20AlreadyDeployed ? 'error' : 'success',
                        simulation: 'loading',
                        execution: 'loading',
                    }
                }))

                if (isErc20AlreadyDeployed) {
                    throw new Error('Implementation already deployed')
                }

            }

            for (let superchainClient of superchainClients) {
                const chainId = superchainClient.chain!.id
                const walletClient = getDeploymentSignerClient(account, chainId)

                const address = await simulateDeployCreate2Contract({
                    client: walletClient,
                    salt: creationSalt32Bytes,
                    initCode: initCode,
                })

                if (address !== erc20Address) {
                    throw new Error('Deployment address mismatch')
                }

                setPlan(prev => ({
                    ...prev,
                    [superchainClient.chain!.name]: {
                        ...prev[superchainClient.chain!.name] as PlanStatus,
                        simulation: 'success',
                    }
                }))
            }     
            
            for (let superchainClient of superchainClients) {
                const hash = await deployCreate2Contract({
                    client: getDeploymentSignerClient(account, superchainClient.chain!.id),
                    salt: creationSalt32Bytes,
                    initCode: initCode,
                })

                await superchainClient.waitForTransactionReceipt({ hash })


                setBroadcasts(prev => ([
                    ...prev,
                    {
                        chain: superchainClient.chain!.name,
                        hash,
                    }
                ]))

                setPlan(prev => ({
                    ...prev,
                    [superchainClient.chain!.name]: {
                        ...prev[superchainClient.chain!.name] as PlanStatus,
                        execution: 'success',
                    }
                }))
            }
        })()
    }, [])

    return (
        <Box flexDirection='column' gap={1} paddingX={2}>
            <Text bold>
                Superchain ERC20 Deployment
            </Text>

            {initCode && (
                <Box flexDirection='column'>
                <Text bold>Initialization Code:</Text>
                    <Text>{initCode}</Text>
                </Box>
            )}

            {deterministicAddresses && (
                <Box flexDirection='column'>
                <Text bold>Deterministic Address:</Text>
                    <Text>{deterministicAddresses}</Text>
                </Box>
            )}

            {parsedChains && (
                <Box flexDirection='column'>
                    <Text bold>Plan</Text>
                    <UnorderedList>
                        {parsedChains.map((chain) => (
                            <UnorderedList.Item key={chain}>
                                <Text bold>{chain}</Text>
                                <UnorderedList>
                                    <UnorderedList.Item>
                                        <Box flexDirection='row'>
                                            <Text bold>Pre-Deployment Verification: </Text>
                                            {statusBadge[plan[chain]!.verification]}
                                        </Box>
                                    </UnorderedList.Item>

                                    <UnorderedList.Item>
                                        <Box flexDirection='row'>
                                            <Text bold>Simulation: </Text>
                                            {statusBadge[plan[chain]!.simulation]}
                                        </Box>
                                    </UnorderedList.Item>

                                    <UnorderedList.Item>
                                        <Box flexDirection='row'>
                                            <Text bold>Execution: </Text>
                                            {statusBadge[plan[chain]!.execution]}
                                        </Box>
                                    </UnorderedList.Item>
                                </UnorderedList>
                            </UnorderedList.Item>
                        ))}
                    </UnorderedList>
                </Box>
            )}

            {broadcasts.length > 0 && (
                <Box flexDirection='column'>
                    <Text bold>Broadcasts</Text>
                    <UnorderedList>
                        {broadcasts.map((broadcast) => (
                            <UnorderedList.Item key={broadcast.chain}>
                                <Box flexDirection='row'>
                                    <Text bold>{broadcast.chain}: </Text>
                                    <Text>{broadcast.hash}</Text>
                                </Box>
                            </UnorderedList.Item>
                        ))}
                    </UnorderedList>
                </Box>
            )}
        </Box>
    )
}

export default DeployErc20Command
