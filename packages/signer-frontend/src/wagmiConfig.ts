import { Chain } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const createWagmiConfig = (chainById: Record<number, Chain>) => {
	return getDefaultConfig({
		chains: Object.values(chainById) as [Chain, ...Chain[]],
		appName: "SUP Signer UI",
		// TODO: use a real one
		projectId: "1234567890",
	});
};
