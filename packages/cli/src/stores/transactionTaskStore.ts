import {Hash} from 'viem';
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';

import {createTransactionTaskId, TransactionTask} from '@/util/transactionTask';

export type TransactionTaskEntry = {
	id: string;
	request: TransactionTask;
	result?: TaskResult;
	createdAt: Date;
};

type TaskResult =
	| {
			type: 'success';
			hash: Hash;
	  }
	| {
			type: 'error';
			error: Error;
	  };

type TransactionTaskStore = {
	taskEntryById: Record<string, TransactionTaskEntry>;

	createTask: (task: TransactionTask) => void;
	completeTask: (id: string, result: TaskResult) => void;
};

export const useTransactionTaskStore = create(
	immer<TransactionTaskStore>(set => ({
		taskEntryById: {},
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
		completeTask: (id: string, result: TaskResult) => {
			set(state => {
				if (state.taskEntryById[id]) {
					state.taskEntryById[id].result = result;
				}
			});
		},
	})),
);

const taskListener: Record<string, (result: TaskResult) => void> = {};

const alertListener = (id: string, result: TaskResult) => {
	const listener = taskListener[id];
	delete taskListener[id];

	if (listener) {
		listener(result);
	}
};

export const requestTransactionTask = async (
	task: TransactionTask,
): Promise<Hash> => {
	return new Promise((resolve, reject) => {
		const id = createTransactionTaskId(task);
		useTransactionTaskStore.getState().createTask(task);

		taskListener[id] = (result: TaskResult) => {
			if (result.type === 'success') {
				resolve(result.hash);
			} else {
				reject(result.error);
			}
		};
	});
};

export const onNewTask = (task: TransactionTask) => {
	useTransactionTaskStore.getState().createTask(task);
};

export const onTaskSuccess = (id: string, hash: Hash) => {
	const result = {type: 'success', hash} as const;
	useTransactionTaskStore.getState().completeTask(id, result);

	alertListener(id, result);
};

export const onTaskError = (id: string, error: Error) => {
	const result = {type: 'error', error} as const;

	useTransactionTaskStore.getState().completeTask(id, result);

	alertListener(id, result);
};
