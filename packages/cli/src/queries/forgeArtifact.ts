import {queryClient} from '@/commands/_app';
import {readForgeArtifact} from '@/forge/readForgeArtifact';
import {QueryOptions, useQuery} from '@tanstack/react-query';

const getQueryParams = (artifactPath: string) => {
	return {
		queryKey: ['forgeArtifact', artifactPath],
		queryFn: () => readForgeArtifact(artifactPath),
	} satisfies QueryOptions;
};

export const queryForgeArtifact = async (artifactPath: string) => {
	return queryClient.fetchQuery(getQueryParams(artifactPath));
};

export const useForgeArtifact = (artifactPath: string) => {
	return useQuery({
		...getQueryParams(artifactPath),
		staleTime: Infinity, // For the duration of the CLI session, we want to use the cached artifact
	});
};
