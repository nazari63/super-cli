import {Wizard} from '@/wizard/Wizard';

const Index = () => {
	return <Wizard onSubmit={form => console.log(form)} />;
};

export default Index;
