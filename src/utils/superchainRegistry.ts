import { Chain, defineChain } from "viem"
import { mainnet, sepolia } from "viem/chains"
import { chainConfig } from 'viem/op-stack'

export type ChainList = ChainListItem[]
export type SupportedNetwork = 'mainnet' | 'sepolia'
export type ChainListItem = {
    name: string
    identifier: `${string}/${string}`
    chainId: number
    rpc: string[]
    explorers: string[]
    parent: {
      type: "L2",
      chain: "mainnet" | "sepolia"
    }
}

let chainByID = {} as Record<number, Chain>
let chainByName = {} as Record<string, Chain>

const chainListURL = 'https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/refs/heads/main/chainList.json'

export async function initChainConfig(): Promise<ChainList> {
    const response = await fetch(chainListURL)
    const chainList = await response.json() as ChainList

    chainByID = chainList.reduce((acc, config) => {
        const stringId = config.identifier.split('/')[1] as string
        const rpcURL = process.env[`${stringId.toUpperCase()}_RPC_URL`] ?? config.rpc[0] as string
    
        const isMainnet = config.parent.chain === 'mainnet'

        // TODO: Does not support custom gas tokens
        acc[config.chainId] = defineChain({
            ...chainConfig,
            id: config.chainId,
            name: stringId,
            sourceId: isMainnet ? mainnet.id : sepolia.id,
            nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
            },
            blockExplorers: {
                default: {
                    name: "Blockscout",
                    url: config.explorers[0] as string,
                },
            },
            rpcUrls: {
                default: {
                    http: [rpcURL],
                },
            },
            multicall: {
                address: "0xcA11bde05977b3631167028862bE2a173976CA11",
            },
        })

        return acc
    }, {} as Record<number, Chain>)


    chainByName = chainList.reduce((acc, config) => {
        if (chainByID[config.chainId]) {
            acc[config.identifier] = chainByID[config.chainId] as Chain
        }
        return acc
    }, {} as Record<string, Chain>)

    return chainList
}

export function getChainByNetworkIdentifier(l1ID: string, l2ID: string): Chain | undefined {
    return chainByName[`${l1ID}/${l2ID}`]
}

export function getChainByID(id: number): Chain | undefined {
    return chainByID[id]
}
