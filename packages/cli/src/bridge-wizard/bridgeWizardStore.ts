import {defineWizard, InferStepId} from '@/wizard-builder/defineWizard';
import {z} from 'zod';
import {formatEther} from 'viem';
import {Address as ZodAddress} from 'abitype/zod';
import {createWizardStore} from '@/wizard-builder/createWizardStore';

const bridgeWizard = defineWizard()
	.addStep({
		id: 'select-network',
		schema: z.object({
			network: z.string(),
		}),
		title: 'Select Network',
		getSummary: state => `${state.network}`,
	})
	.addStep({
		id: 'enter-private-key',
		schema: z.object({
			privateKey: z.string(),
			address: ZodAddress,
		}),
		title: 'Enter Private Key',
		getSummary: state => `${state.address}`,
	})
	.addStep({
		id: 'select-chains',
		schema: z.object({
			chainIds: z.array(z.number()),
		}),
		title: 'Select Chains',
		getSummary: state => `${state.chainIds.join(', ')}`,
	})
	.addStep({
		id: 'enter-amount',
		schema: z.object({
			amount: z.bigint(),
		}),
		title: 'Enter Amount',
		getSummary: state => {
			const perChainAmount = Number(formatEther(state.amount)).toFixed(2);
			const totalAmount = Number(
				formatEther(state.amount * BigInt(state.chainIds.length)),
			).toFixed(2);
			return `${perChainAmount} ETH × ${state.chainIds.length} chains = ${totalAmount} ETH total`;
		},
	})
	.build();

export const bridgeWizardIndexByStepId = bridgeWizard.reduce(
	(acc, step, index) => {
		acc[step.id] = index;
		return acc;
	},
	{} as Record<BridgeWizardStepId, number>,
);

export type BridgeWizardStepId = InferStepId<typeof bridgeWizard>;

export const useBridgeWizardStore = createWizardStore(bridgeWizard);
