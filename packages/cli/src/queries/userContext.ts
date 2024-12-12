import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useDb} from '@/db/dbContext';
import {
	getUserContext,
	UserContext,
	updateUserContext,
} from '@/models/userContext';

export const useUserContext = () => {
	const db = useDb();
	return useQuery({
		queryKey: ['userContext'],
		queryFn: () => getUserContext(db),
	});
};

export const useUpdateUserContext = () => {
	const queryClient = useQueryClient();
	const db = useDb();

	return useMutation({
		mutationFn: (context: Partial<UserContext>) =>
			updateUserContext(db, context),
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['userContext']});
		},
	});
};
