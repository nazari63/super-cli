import {ForgeArtifact, readForgeArtifact} from '@/forge/readForgeArtifact';
import fs from 'fs/promises';
import path from 'path';

const findSolidityFiles = async (dir: string): Promise<string[]> => {
	const entries = await fs.readdir(dir, {withFileTypes: true});
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...(await findSolidityFiles(fullPath)));
		} else if (entry.isFile() && entry.name.endsWith('.sol')) {
			files.push(fullPath);
		}
	}

	return files;
};

type ForgeProjectConfig = {
	outDir: string;
	srcDir: string;
};

export class ForgeProjectPaths {
	constructor(
		private projectPath: string,
		private config: ForgeProjectConfig,
	) {}

	getSrcDir(): string {
		return path.join(this.projectPath, this.config.srcDir);
	}

	getArtifactDir(): string {
		return path.join(this.projectPath, this.config.outDir);
	}

	getArtifactPath(contractFileName: string): string {
		return path.join(
			this.getArtifactDir(),
			`${contractFileName}`,
			`${
				contractFileName.endsWith('.sol')
					? contractFileName.slice(0, -4)
					: contractFileName
			}.json`,
		);
	}
}

export class ForgeProject {
	private paths: ForgeProjectPaths;

	constructor(
		projectPath: string,
		config: ForgeProjectConfig = {
			outDir: 'out',
			srcDir: 'src',
		},
	) {
		this.paths = new ForgeProjectPaths(projectPath, config);
	}

	async listContracts(): Promise<string[]> {
		try {
			const files = await findSolidityFiles(this.paths.getSrcDir());
			return files.map(file => path.relative(this.paths.getSrcDir(), file));
		} catch (error) {
			console.error('Error listing contracts:', error);
			return [];
		}
	}

	async getArtifact(contractFileName: string): Promise<ForgeArtifact> {
		const artifactPath = this.paths.getArtifactPath(contractFileName);
		const artifact = await readForgeArtifact(artifactPath);
		return artifact;
	}
}
