import fs from 'fs/promises';
import path from 'path';
import {
	Address,
	Hash,
	Hex,
	numberToHex,
	Transaction,
	TransactionReceipt,
} from 'viem';

export type CreateBroadcastParams = {
	contractName: string;
	contractAddress: Address;
	contractArguments?: any[];
	foundryProjectRoot: string;
};

export type AddTransactionParams = {
	contractAddress: Address;
	chainId: number;
	hash: Hash;
	transaction: Transaction;
	receipt: TransactionReceipt;
};

export type Broadcast = {
	chainId: number;
	hash: Hash;
	transaction: Transaction;
	receipt: TransactionReceipt;
};

export type MultichainBroadcast = {
	name: string;
	address: Address;
	timestamp: number;
	type: 'CREATE2';
	contractArguments: any[];
	foundryProjectRoot: string;
	transactions: Record<number, Broadcast>;
};

export type TransactionBroadcast = {
	hash: Hash;
	transactionType: string;
	contractName: string;
	contractAddress: Address;
	function: string | null;
	arguments: any[];
	transaction: {
		from: Address;
		to: Address;
		value: Hex;
		input: Hex;
		nonce: Hex;
		gas: Hex;
		chainId: Hex;
	};
	additionalContracts: any[];
	isFixedGasLimit: boolean;
};

export type Deployment = {
	transactions: TransactionBroadcast[];
	receipts: TransactionReceipt[];
	timestamp: number;
	chain: number;
};

export type RunArtifact = {
	deployments: Deployment[];
	timestamp: number;
};

const DEFAULT_OUTPUT_DIR = path.join('broadcast', 'multi');

export const writeMultichainBroadcast = async (
	multichainBroadcast: MultichainBroadcast,
) => {
	const {
		transactions,
		address,
		name,
		timestamp,
		type,
		contractArguments,
		foundryProjectRoot,
	} = multichainBroadcast;

	if (!Object.keys(transactions).length) {
		return;
	}

	const outputDir = path.join(foundryProjectRoot, DEFAULT_OUTPUT_DIR);

	const runArtifact = {
		deployments: [],
		timestamp,
	} as RunArtifact;

	Object.keys(transactions).forEach(chainIdStr => {
		const chainId = Number(chainIdStr);

		if (!transactions[chainId]) {
			return;
		}

		const {hash, transaction, receipt} = transactions[chainId];

		const transactionData = {
			hash,
			transactionType: type,
			contractName: name,
			contractAddress: address,
			function: null,
			arguments: contractArguments,
			transaction: {
				from: receipt.from,
				to: receipt.to,
				gas: transaction.gas,
				value: transaction.value,
				input: transaction.input,
				nonce: numberToHex(transaction.nonce),
				chainId: numberToHex(chainId),
				additionalContracts: [],
				isFixedGasLimit: false,
			},
		} as unknown as TransactionBroadcast;

		const receiptData = {
			status: receipt.status === 'success' ? '0x1' : '0x0',
			cumulativeGasUsed: receipt.cumulativeGasUsed,
			logs: receipt.logs,
			logsBloom: receipt.logsBloom,
			type: transaction.typeHex,
			transactionHash: receipt.transactionHash,
			transactionIndex: numberToHex(receipt.transactionIndex),
			blockHash: receipt.blockHash,
			blockNumber: receipt.blockNumber,
			gasUsed: receipt.gasUsed,
			effectiveGasPrice: receipt.effectiveGasPrice,
			blobGasPrice: receipt.blobGasPrice,
			from: receipt.from,
			to: receipt.to,
			contractAddress: receipt.contractAddress,
		} as unknown as TransactionReceipt;

		const deployment: Deployment = {
			transactions: [transactionData],
			receipts: [receiptData],
			timestamp,
			chain: chainId,
		};

		runArtifact.deployments.push(deployment);
	});

	const latestDirname = path.join(outputDir, `${name}-latest`);
	const timestampDirname = path.join(outputDir, `${name}-${timestamp}`);
	await fs.mkdir(latestDirname, {recursive: true});
	await fs.mkdir(timestampDirname, {recursive: true});

	const fileContents = JSON.stringify(
		runArtifact,
		(_, val) => (typeof val === 'bigint' ? numberToHex(val) : val),
		2,
	);

	await fs.writeFile(path.join(latestDirname, 'run.json'), fileContents);
	await fs.writeFile(path.join(timestampDirname, 'run.json'), fileContents);
};
