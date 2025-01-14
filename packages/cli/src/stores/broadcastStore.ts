import { Address, Hash, Transaction, TransactionReceipt } from "viem";
import { create } from "zustand";

export type CreateBroadcastParams = {
    contractName: string;
    contractAddress: Address;
    contractArguments?: any[];
    foundryProjectRoot: string;
}

export type AddTransactionParams = {
    contractAddress: Address;
    chainId: number;
    hash: Hash;
    transaction: Transaction;
    receipt: TransactionReceipt;
}

export type MultichainBroadcast = {
    name: string;
    address: Address;
    timestamp: number;
    type: 'CREATE2';
    contractArguments: any[];
    foundryProjectRoot: string;
    transactions: Record<number, {
        chainId: number;
        hash: Hash;
        transaction: Transaction;
        receipt: TransactionReceipt;
    }>
}

export type BroadcastStore = {
    broadcasts: Record<Address, MultichainBroadcast>;
    createBroadcast: (params: CreateBroadcastParams) => void;
    addTransaction: (params: AddTransactionParams) => void;
}

export const useBroadcastStore = create<BroadcastStore>()(
	set => ({
		broadcasts: {},
		createBroadcast: (params: CreateBroadcastParams) => {
            const {contractName, contractAddress, contractArguments, foundryProjectRoot} = params;

            const timeInSecs = Math.floor(Date.now() / 1000);

            const broadcast = {
                name: contractName,
                address: contractAddress,
                timestamp: timeInSecs,
                transactions: {},
                type: 'CREATE2',
                contractArguments,
                foundryProjectRoot,
            }

            set(state => ({
				...state,
                broadcasts: {
                    ...state.broadcasts,
                    [contractAddress]: broadcast,
                },
			}));
		},
        addTransaction: (params: AddTransactionParams) => {
            const { contractAddress, chainId, hash, transaction, receipt } = params;

            set(state => {
                const broadcast = state.broadcasts[contractAddress];

                if (!broadcast) {
                    return state;
                }

                broadcast.transactions[chainId] = {
                    chainId,
                    hash,
                    transaction,
                    receipt,
                }

                return state
            })
        }
	})
);