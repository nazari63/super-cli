import fs from 'fs';
import {Abi, Hash, Hex} from 'viem';

type CompilerOutputSource = {
	keccak256: Hash;
	urls: string[];
	license: string;
};

type ForgeArtifact = {
	abi: Abi;
	bytecode: {
		object: Hex;
	};
	metadata: {
		compiler: {
			version: string;
		};
		language: 'Solidity' | 'Vyper';
		sources: Record<string, CompilerOutputSource>;
		version: number;
	};
};

function readForgeArtifact(artifactPath: string): ForgeArtifact {
	let artifactFileContents;
	try {
		artifactFileContents = fs.readFileSync(artifactPath, 'utf8');
	} catch (e) {
		console.error(e);
		throw new Error('Failed to read forge artifact');
	}

	let artifactJSON;
	try {
		artifactJSON = JSON.parse(artifactFileContents);
	} catch (e) {
		console.error(e);
		throw new Error('Failed to parse forge artifact');
	}

	if (!artifactJSON.abi) {
		throw new Error('Forge artifact is missing ABI!');
	}

	if (!artifactJSON.bytecode || !artifactJSON.bytecode.object) {
		throw new Error('Forge artifact is missing bytecode!');
	}

	if (
		!artifactJSON.metadata ||
		!artifactJSON.metadata.sources ||
		!artifactJSON.metadata.compiler ||
		!artifactJSON.metadata.version
	) {
		throw new Error('Forge artifact is missing metadata!');
	}

	return artifactJSON as ForgeArtifact;
}
