import {wagmiConfig} from '@/commands/_app';
import {
	onTaskSuccess,
	useTransactionTaskStore,
} from '@/stores/transactionTaskStore';
import {sendTransaction} from '@wagmi/core';
import {PrivateKeyAccount} from 'viem/accounts';

export const sendAllTransactionTasks = async (account: PrivateKeyAccount) => {
	const taskEntryById = useTransactionTaskStore.getState().taskEntryById;

	await Promise.all(
		Object.values(taskEntryById).map(async task => {
			const hash = await sendTransaction(wagmiConfig, {
				to: task.request.to,
				data: task.request.data,
				account,
				chainId: task.request.chainId,
			});

			onTaskSuccess(task.id, hash);
		}),
	);
};
