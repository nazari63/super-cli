import {create} from 'zustand';

type State<T> =
	| {status: 'pending'; data: undefined; error: null}
	| {status: 'success'; data: T; error: null}
	| {status: 'error'; data: undefined; error: Error}
	| {status: 'idle'; data: undefined; error: null};

type Operation<T> = {
	key: unknown[];
	fn: () => Promise<T>;
};

type OperationStore = {
	statusById: Record<string, State<any>>;
	onIdle: (id: unknown[]) => void;
	onPending: (id: unknown[]) => void;
	onSuccess: (id: unknown[], data: any) => void;
	onError: (id: unknown[], error: Error) => void;
};

const createKey = (key: unknown[]) => key.join('-');

export const useOperationStore = create<OperationStore>()(set => ({
	statusById: {},
	onPending: (id: unknown[]) => {
		set(state => ({
			statusById: {
				...state.statusById,
				[createKey(id)]: {status: 'pending', data: undefined, error: null},
			},
		}));
	},
	onSuccess: (id: unknown[], data: any) => {
		set(state => ({
			statusById: {
				...state.statusById,
				[createKey(id)]: {status: 'success', data, error: null},
			},
		}));
	},
	onError: (id: unknown[], error: Error) => {
		set(state => ({
			statusById: {
				...state.statusById,
				[createKey(id)]: {status: 'error', data: undefined, error},
			},
		}));
	},
	onIdle: (id: unknown[]) => {
		set(state => ({
			statusById: {
				...state.statusById,
				[createKey(id)]: {status: 'idle', data: undefined, error: null},
			},
		}));
	},
}));

export const runOperation = async <T>(operation: Operation<T>) => {
	useOperationStore.getState().onPending(operation.key);

	try {
		const data = await operation.fn();
		useOperationStore.getState().onSuccess(operation.key, data);
		return data;
	} catch (error) {
		useOperationStore.getState().onError(operation.key, error as Error);
		throw error;
	}
};

export const runOperationsMany = async <T extends Operation<any>[]>(
	operations: [...T],
): Promise<{[K in keyof T]: T[K] extends Operation<infer R> ? R : never}> => {
	const results = await Promise.all(
		operations.map(operation => runOperation(operation)),
	);
	return results as {
		[K in keyof T]: T[K] extends Operation<infer R> ? R : never;
	};
};

const idleState = {status: 'idle', data: undefined, error: null} as const;

export const useOperation = <T>(operation: Operation<T>): State<T> => {
	const status = useOperationStore(
		state => state.statusById[createKey(operation.key)],
	);

	return status ?? idleState;
};

export const useOperationWithKey = <T>(key: unknown[]): State<T> => {
	const status = useOperationStore(state => state.statusById[createKey(key)]);

	return status ?? idleState;
};

export const useManyOperations = <T extends Operation<any>[]>(
	operations: [...T],
): {[K in keyof T]: State<T[K] extends Operation<infer R> ? R : never>} => {
	const statuses = useOperationStore(state =>
		operations.map(operation => state.statusById[createKey(operation.key)]),
	);

	return statuses.map(status => status ?? idleState) as any;
};
