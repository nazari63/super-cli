import { TransactionTasks } from "@/components/TransactionTasks";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/Providers";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function App() {
	return (
		<Providers>
			<Toaster />
			<div className="flex flex-col gap-4 p-8">
				<ConnectButton />
				<TransactionTasks />
			</div>
		</Providers>
	);
}

export default App;
