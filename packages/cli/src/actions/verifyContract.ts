import {fromFoundryArtifactPath} from '@/forge/foundryProject';
import {queryMappingChainListItemByIdentifier} from '@/queries/chainRegistryItemByIdentifier';
import {useContractVerificationStore} from '@/stores/contractVerification';
import {zodSupportedNetwork} from '@/superchain-registry/fetchChainList';
import {zodAddress} from '@/validators/schemas';
import {verifyContractOnBlockscout} from '@/verify/blockscout';
import {createStandardJsonInput} from '@/verify/createStandardJsonInput';
import {identifyExplorer} from '@/verify/identifyExplorerType';
import {option} from 'pastel';
import {z} from 'zod';

export const zodVerifyContractParams = z.object({
	forgeArtifactPath: z
		.string()
		.describe(
			option({
				description: 'Path to the Forge artifact',
				alias: 'f',
			}),
		)
		.min(1),
	contractAddress: zodAddress.describe(
		option({description: 'Contract address', alias: 'a'}),
	),
	network: zodSupportedNetwork.describe(
		option({
			description: 'Network to verify on',
			alias: 'n',
		}),
	),
	chains: z.array(z.string()).describe(
		option({
			description: 'Chains to verify on',
			alias: 'c',
		}),
	),
});

const getVerifyContractContext = async (
	params: z.infer<typeof zodVerifyContractParams>,
) => {
	const {forgeArtifactPath, network, chains} = params;
	const chainIdentifiers = chains.map(chain => `${network}/${chain}`);

	const chainListItemByIdentifier =
		await queryMappingChainListItemByIdentifier();
	const {foundryProject, contractFileName} = await fromFoundryArtifactPath(
		forgeArtifactPath,
	);

	return {
		selectedChainList: chainIdentifiers.map(
			identifier => chainListItemByIdentifier[identifier],
		),
		foundryProject,
		contractFileName,
	};
};

export const verifyContract = async (
	params: z.infer<typeof zodVerifyContractParams>,
) => {
	const store = useContractVerificationStore.getState();

	const {contractAddress, chains} = params;

	let context: Awaited<ReturnType<typeof getVerifyContractContext>>;
	try {
		context = await getVerifyContractContext(params);

		store.setPrepareSuccess(
			context.selectedChainList.map(chain => chain!.chainId),
		);
	} catch (e) {
		store.setPrepareError(e as Error);
		return;
	}

	const {foundryProject, contractFileName} = context;

	// TODO: Type this
	let standardJsonInput: any;
	try {
		standardJsonInput = await createStandardJsonInput(
			foundryProject.baseDir,
			contractFileName,
		);
		store.setGenerateSuccess();
	} catch (e) {
		store.setGenerateError(e as Error);
		return;
	}

	await Promise.all(
		context.selectedChainList.map(async chain => {
			const chainId = chain!.chainId;
			const explorer = chain!.explorers[0]!;

			store.setVerifyPending(chainId);

			const explorerType = await identifyExplorer(explorer).catch(() => null);

			if (explorerType !== 'blockscout') {
				throw new Error('Unsupported explorer');
			}

			try {
				await verifyContractOnBlockscout(
					chain!.explorers[0]!,
					contractAddress,
					contractFileName.replace('.sol', ''),
					standardJsonInput,
				);
				store.setVerifySuccess(chainId);
			} catch (e) {
				store.setVerifyError(chainId, e as Error);
				return;
			}
		}),
	);
};
