import { zodSupportedNetwork } from '@/superchain-registry/fetchChainList';
import {Address, Hash, Hex} from 'viem';
import { z } from 'zod';
import {create} from 'zustand';

export type DeploymentPlanState =
	| 'preVerification'
	| 'simulation'
	| 'execution'
	| 'completed';

export type DeploymentPlanStepStatus = {
	chainId: number;
	status: 'pending' | 'success' | 'error' | 'skipped';
	message?: string;
	error?: Error;
	selector?: Hex;
};

export type DeploymentPlanStep = {
	preVerification: DeploymentPlanStepStatus;
	simulation: DeploymentPlanStepStatus;
	execution: DeploymentPlanStepStatus;
	completed: DeploymentPlanStepStatus;
};

export type DeploymentNetworks = z.infer<typeof zodSupportedNetwork>;

export const allowedStateTransitions: Record<
	DeploymentPlanState,
	DeploymentPlanState[]
> = {
	preVerification: ['simulation'],
	simulation: ['execution'],
	execution: ['completed'],
	completed: [],
};

export type DeploymentPlan = {
	type: 'superchain-erc20' | 'createx-create2';
	state: DeploymentPlanState;
	network: DeploymentNetworks;
	chainIds: number[];
	deterministicAddress: Address;
	creationParams: {
		constructorArgs?: Hex;
		initializationArgs?: Hex;
		salt: Hex;
		initCode: Hex;
	};
	broadcasts: {
		chainId: number;
		type: 'createxCreate2Deploy';
		hash: Hash;
		blockNumber: bigint;
	}[];
	steps: Record<number, DeploymentPlanStep>;
};

export type DeploymentsStore = {
	deployments: Record<Address, DeploymentPlan>;
	addDeployment: (params: AddDeploymentParameters) => void;
	updateDeploymentState: (
		address: Address,
		newState: DeploymentPlanState,
	) => void;
	updateDeploymentStepStatus: (params: UpdateStepStatusParameters) => void;
	addDeploymentBroadcast: (params: AddBroadcastParameters) => void;
};

export type AddDeploymentParameters = {
	deployment: DeploymentPlan;
};

export type UpdateStateParameters = {
	address: Address;
	newState: DeploymentPlanState;
};

export type UpdateStepStatusParameters = {
	address: Address;
	chainId: number;
	state: DeploymentPlanState;
	status: 'pending' | 'success' | 'error' | 'skipped';
	message?: string;
	error?: Error;
	selector?: Hex;
};

export type AddBroadcastParameters = {
	address: Address;
	broadcast: {
		chainId: number;
		type: 'createxCreate2Deploy';
		hash: Hash;
		blockNumber: bigint;
	};
};

function assertDeploymentExists(
	deployments: DeploymentsStore['deployments'],
	address: Address,
) {
	if (!deployments[address]) {
		throw new Error(`Deployment not found for address: ${address}`);
	}
}

export type MakeDeploymentPlanParameters = {
	// TODO make union type to support both superchain-erc20 and createx-create2
	type: 'superchain-erc20' | 'createx-create2';

	deterministicAddress: Address;
	chainIds: number[];
	network: DeploymentNetworks;

	creationParams: {
		constructorArgs?: Hex;
		initializationArgs?: Hex;
		salt: Hex;
		initCode: Hex;
	};
};

export function makeDeploymentPlan(
	params: MakeDeploymentPlanParameters,
): DeploymentPlan {
	const {type, deterministicAddress, network, chainIds, creationParams} =
		params;

	return {
		type,
		deterministicAddress,
		network,
		chainIds,
		creationParams,
		state: 'preVerification',
		steps: params.chainIds.reduce((steps, chainId) => {
			steps[chainId] = {
				preVerification: {chainId, status: 'pending'},
				simulation: {chainId, status: 'pending'},
				execution: {chainId, status: 'pending'},
				completed: {chainId, status: 'pending'},
			} as DeploymentPlanStep;
			return steps;
		}, {} as Record<number, DeploymentPlanStep>),
		broadcasts: [],
	} as DeploymentPlan;
}

export const useDeploymentsStore = create<DeploymentsStore>(set => ({
	deployments: {},
	addDeployment: (params: AddDeploymentParameters) => {
		const {deployment} = params;

		set(state => ({
			deployments: {
				...state.deployments,
				[deployment.deterministicAddress]: deployment,
			},
		}));
	},
	updateDeploymentState: (address: Address, newState: DeploymentPlanState) => {
		set(state => {
			assertDeploymentExists(state.deployments, address);

			const currentState = state.deployments[address]
				?.state as DeploymentPlanState;

			if (!allowedStateTransitions[currentState].includes(newState)) {
				throw new Error(`Invalid state transition: ${newState}`);
			}

			return {
				deployments: {
					...state.deployments,
					[address]: {...state.deployments[address], state: newState},
				},
			};
		});
	},
	updateDeploymentStepStatus: (params: UpdateStepStatusParameters) => {
		const {
			address,
			chainId,
			state: nextState,
			status,
			message,
			error,
			selector,
		} = params;

		set(state => {
			assertDeploymentExists(state.deployments, address);

			const nextSteps = {
				...state.deployments[address]?.steps,
				[chainId]: {
					...state.deployments[address]?.steps[chainId],
					[nextState]: {
						...state.deployments[address]?.steps[chainId]?.[nextState],
						status,
						message,
						error,
						selector,
					},
				},
			};

			return {
				deployments: {
					...state.deployments,
					[address]: {
						...state.deployments[address],
						steps: nextSteps,
					},
				},
			};
		});
	},
	addDeploymentBroadcast: (params: AddBroadcastParameters) => {
		const {address, broadcast} = params;

		set(state => {
			assertDeploymentExists(state.deployments, address);

			const nextBroadcasts = [
				...(state.deployments[address]?.broadcasts ?? []),
				broadcast,
			];

			return {
				deployments: {
					...state.deployments,
					[address]: {
						...state.deployments[address],
						broadcasts: nextBroadcasts,
					},
				},
			};
		});
	},
}));
