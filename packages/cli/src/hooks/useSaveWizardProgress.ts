import {WizardId} from '@/models/userContext';
import {useUpdateUserContext} from '@/queries/userContext';
import {useEffect} from 'react';

export const useSaveWizardProgress = (
	wizardId: WizardId,
	wizardState: any,
	stepIdsToSkip: string[],
) => {
	const {mutate: updateUserContext} = useUpdateUserContext();

	useEffect(() => {
		if (stepIdsToSkip.includes(wizardState.stepId)) {
			return;
		}
		updateUserContext({lastWizardId: wizardId, lastWizardState: wizardState});
	}, [wizardId, wizardState]);
};
