import path from 'path';

// TODO: update to use foundry.toml

export const getSrcDir = (foundryProjectPath: string) => {
	return path.join(foundryProjectPath, 'src');
};

export const getArtifactDir = (foundryProjectPath: string) => {
	return path.join(foundryProjectPath, 'out');
};

export const getArtifactPathForContract = (
	foundryProjectPath: string,
	contractFileName: string,
) => {
	return path.join(
		getArtifactDir(foundryProjectPath),
		`${contractFileName}`,
		`${
			contractFileName.endsWith('.sol')
				? contractFileName.slice(0, -4)
				: contractFileName
		}.json`,
	);
};
