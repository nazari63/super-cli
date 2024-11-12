import { Address, Hash, Hex, parseAbi, WalletClient } from "viem";
import { estimateContractGas, simulateContract } from "viem/actions";
import { CREATEX_ADDRESS } from "./constants.js";

const deployCreate2ContractABI = parseAbi([
    'function deployCreate2(bytes32 salt, bytes initCode) payable returns (address newContract)'
])

export type DeployCreate2ContractParameters = {
    client: WalletClient
    salt: Hex
    initCode: Hex
    createXAddress?: Address
}

export const deployCreate2Contract = async ({
    client,
    salt,
    initCode,
    createXAddress,
}: DeployCreate2ContractParameters): Promise<Hash> => {
    const hash = await client.writeContract({
        abi: deployCreate2ContractABI,
        chain: client.chain,
        account: client.account?.address as Address,
        address: createXAddress ?? CREATEX_ADDRESS,
        functionName: 'deployCreate2',
        args: [salt, initCode]
    })

    return hash
}

export const simulateDeployCreate2Contract = async ({
    client,
    salt,
    initCode,
    createXAddress,
}: DeployCreate2ContractParameters): Promise<Address> => {
    const result = await simulateContract(client, {
        abi: deployCreate2ContractABI,
        account: client.account?.address as Address,
        address: createXAddress ?? CREATEX_ADDRESS,
        functionName: 'deployCreate2',
        args: [salt, initCode]
    })

    return result.result as Address
}

export const estimateDeployCreate2Contract = async ({
    client,
    salt,
    initCode,
    createXAddress,
}: DeployCreate2ContractParameters): Promise<BigInt> => {
    return await estimateContractGas(client, {
        abi: deployCreate2ContractABI,
        address: createXAddress ?? CREATEX_ADDRESS,
        functionName: 'deployCreate2',
        args: [salt, initCode]
    })
}
