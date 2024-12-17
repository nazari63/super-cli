import {Hash, parseEther, toHex} from 'viem';
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';

import {
	createTransactionTaskId,
	TransactionTask,
} from '@/transaction-task/transactionTask';
import {optimismSepolia} from 'viem/chains';

export type TransactionTaskEntry = {
	id: string;
	request: TransactionTask;
	hash?: Hash;
	createdAt: Date;
};

type TransactionTaskStore = {
	taskEntryById: Record<string, TransactionTaskEntry>;

	createTask: (task: TransactionTask) => void;
	completeTask: (id: string, hash: Hash) => void;
};

export const useTransactionTaskStore = create(
	immer<TransactionTaskStore>(set => ({
		taskEntryById: {
			'tester-task-1': {
				id: 'tester-task-1',
				request: {
					chainId: optimismSepolia.id,
					to: '0x0000000000000000000000000000000000000000',
					value: toHex(parseEther('0.000000000000000001')),
				},
				createdAt: new Date(),
			},
		},
		createTask: (task: TransactionTask) => {
			set(state => {
				const id = createTransactionTaskId(task);
				state.taskEntryById[id] = {
					id,
					request: task,
					createdAt: new Date(),
				};
			});
		},
		completeTask: (id: string, hash: Hash) => {
			set(state => {
				if (state.taskEntryById[id]) {
					state.taskEntryById[id].hash = hash;
				}
			});
		},
	})),
);
