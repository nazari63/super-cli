import {BridgeWizard} from '@/bridge-wizard/BridgeWizard';

const Index = () => {
	return <BridgeWizard onSubmit={form => console.log(form)} />;
};

export default Index;
