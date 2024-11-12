import { Address, concatHex, encodePacked, Hex, keccak256, parseAbi, PublicClient, toBytes, toHex, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { CREATEX_ADDRESS, RedeployProtectionFlag } from "./constants.js";

const computeCreate2AddressFunctionABI = parseAbi([
    'function computeCreate2Address(bytes32 salt, bytes32 initCodeHash) view returns (address computedAddress)'
])

export type ComputeCreate2AddressParameters = {
    owner: Address
    client: PublicClient
    salt: Hex
    initCode: Hex
    createXAddress?: Address
}

export const computeCreate2Address = async ({
    owner,
    client,
    salt,
    initCode,
    createXAddress,
}: ComputeCreate2AddressParameters): Promise<Address> => {
    return await readContract(client, {
        abi: computeCreate2AddressFunctionABI,
        address: createXAddress ?? CREATEX_ADDRESS,
        functionName: 'computeCreate2Address',
        args: [guardedSalt(owner, client.chain?.id as number, salt), keccak256(initCode)]
    })
}

export function createPermissionedSalt(owner: Address, salt: Hex, protectionFlag: RedeployProtectionFlag) {
    const saltPrefix = toHex(owner, { size: 20 })
    const saltSuffix = toHex(salt, { size: 11 })
    const protection = toHex(protectionFlag ? 1 : 0, { size: 1 })
    return concatHex([saltPrefix, protection, saltSuffix])
}

// CreateX adds a guarded salt: https://github.com/pcaversaccio/createx/blob/ab60cc031b38111a5fad9358d018240dfa78cb8e/src/CreateX.sol#L873-L912
// We need to provide this version of the salt to the computeCreate2Address call
function guardedSalt(owner: Address, chainId: number, salt: Hex): Hex {
    const bytes = toBytes(salt, { size: 32 })
    const protectionByte = bytes[20]

    if (salt.startsWith(owner) && toHex(protectionByte as number, { size: 1 }) === '0x01') {
        // Configures a permissioned deploy protection as well as a cross-chain redeploy protection.
        return keccak256(encodePacked(['address', 'uint', 'bytes32'], [owner, BigInt(chainId), salt]))
    } else if (salt.startsWith(owner) && toHex(protectionByte as number, { size: 1 }) === '0x00') {
        // Configures solely a permissioned deploy protection.
        const owner32Byte = toBytes(owner, { size: 32 })
        return keccak256(concatHex([toHex(owner32Byte, { size: 32 }), salt]))
    } else if (salt.startsWith(owner)) {
        // Reverts if the 21st byte is greater than `0x01` in order to enforce developer explicitness.
        throw new Error('Invalid salt')
    } else if (owner === zeroAddress) {
        // Configures solely a cross-chain redeploy protection. In order to prevent a pseudo-randomly
        // generated cross-chain redeploy protection, we enforce the zero address check for the first 20 bytes.
        const chainId32Bytes = toBytes(BigInt(chainId), { size: 32 })
        return keccak256(concatHex([toHex(chainId32Bytes, { size: 32 }), salt]))
    } else if (salt.startsWith(zeroAddress) && parseInt(toHex(protectionByte as number, { size: 1 })) > parseInt('0x01')) {
        // Reverts if the 21st byte is greater than `0x01` in order to enforce developer explicitness.
        throw new Error('Invalid salt')
    }
    
    // the salt value `salt` is hashed to prevent the safeguard mechanisms from being bypassed.
    return keccak256(encodePacked(['bytes32'], [salt]))
}
