import "@rainbow-me/rainbowkit/styles.css";

import {
	QueryClient,
	QueryClientProvider,
	useQuery,
} from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createWagmiConfig } from "@/wagmiConfig";
import { getMappingChainById } from "@/api";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const queryClient = new QueryClient();

const WagmiProviderWrapper = ({ children }: { children: React.ReactNode }) => {
	const { data, isLoading, error } = useQuery({
		queryKey: ["getMappingChainById"],
		queryFn: getMappingChainById,
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive" className="max-w-md mx-auto mt-8">
				<AlertDescription>Unable to connect to the CLI.</AlertDescription>
			</Alert>
		);
	}

	if (!data) {
		return (
			<Alert variant="destructive" className="max-w-md mx-auto mt-8">
				<AlertDescription>No chain configuration found.</AlertDescription>
			</Alert>
		);
	}

	const wagmiConfig = createWagmiConfig(data.chainById);

	return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<QueryClientProvider client={queryClient}>
			<WagmiProviderWrapper>
				<RainbowKitProvider
					theme={lightTheme({
						fontStack: "system",
						borderRadius: "medium",
						overlayBlur: "small",
					})}
				>
					{children}
				</RainbowKitProvider>
			</WagmiProviderWrapper>
		</QueryClientProvider>
	);
};
