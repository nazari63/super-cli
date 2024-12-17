import {
	completeTransactionTask,
	listTransactionTasks,
	TransactionTaskEntry,
} from "@/api";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hexToBigInt } from "viem";
import { useSendTransaction, useSwitchChain } from "wagmi";
import { Loader2, SendHorizontal, CheckCircle } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const Task = ({ task }: { task: TransactionTaskEntry }) => {
	const queryClient = useQueryClient();
	const { sendTransaction, isPending, error } = useSendTransaction({
		mutation: {
			onSuccess: async (hash) => {
				await completeTransactionTask(task.id, hash);
				queryClient.invalidateQueries({
					queryKey: ["listTransactionTasks"],
				});
				toast.success("Transaction sent successfully");
			},
			onError: (error) => {
				console.error(error);
				toast.error(`Transaction failed: ${error.message}`);
			},
		},
	});
	const { switchChainAsync } = useSwitchChain();

	return (
		<TableRow className="group">
			<TableCell>
				<span className="font-mono text-sm">{task.request.chainId}</span>
			</TableCell>
			<TableCell>
				<code className="rounded bg-muted px-2 py-1 text-xs">
					{task.request.to}
				</code>
			</TableCell>
			<TableCell>
				{task.request.value && (
					<code className="font-mono text-sm">{task.request.value}</code>
				)}
			</TableCell>
			<TableCell className="min-w-[160px] flex justify-end pr-4">
				{task.hash ? (
					<code className="rounded bg-muted px-2 py-1 text-xs truncate max-w-[300px]">
						{task.hash}
					</code>
				) : (
					<Button
						size="sm"
						variant="outline"
						className="w-[120px] transition-colors hover:bg-primary hover:text-primary-foreground"
						disabled={isPending}
						onClick={async () => {
							await switchChainAsync({
								chainId: task.request.chainId,
							});
							sendTransaction({
								chainId: task.request.chainId,
								to: task.request.to,
								data: task.request.data,
								value: task.request.value
									? hexToBigInt(task.request.value)
									: undefined,
							});
						}}
					>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span className="text-xs">Sending...</span>
							</>
						) : (
							<>
								<SendHorizontal className="mr-2 h-4 w-4" />
								<span className="text-xs">Send</span>
							</>
						)}
					</Button>
				)}
			</TableCell>
		</TableRow>
	);
};

export const TransactionTasks = () => {
	const {
		data: transactionTasks,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["listTransactionTasks"],
		queryFn: async () => {
			return listTransactionTasks();
		},
		// TODO: update when we have websockets
		refetchInterval: 2000,
	});

	if (error) {
		return null;
	}

	if (isLoading || !transactionTasks) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-6 w-6 animate-spin" />
			</div>
		);
	}

	if (transactionTasks.length === 0) {
		return (
			<div className="rounded-lg border border-border/50 p-8 text-center">
				<p className="text-sm text-muted-foreground">No transactions found</p>
			</div>
		);
	}

	const pendingTasks = transactionTasks.filter((task) => !task.hash);
	const completedTasks = transactionTasks.filter((task) => task.hash);

	return (
		<Tabs defaultValue="pending" className="space-y-4">
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="pending" className="flex items-center gap-2">
					<SendHorizontal className="h-4 w-4" />
					Pending
					<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
						{pendingTasks.length}
					</span>
				</TabsTrigger>
				<TabsTrigger value="completed" className="flex items-center gap-2">
					<CheckCircle className="h-4 w-4" />
					Completed
					<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
						{completedTasks.length}
					</span>
				</TabsTrigger>
			</TabsList>

			<TabsContent value="pending">
				<Card>
					<CardContent className="">
						{pendingTasks.length === 0 ? (
							<div className="flex items-center justify-center py-12 text-muted-foreground">
								No pending transactions
							</div>
						) : (
							<div className="rounded-lg border bg-card/50">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[100px]">Chain</TableHead>
											<TableHead>To</TableHead>
											<TableHead>Value</TableHead>
											<TableHead className="flex justify-end items-center pr-6">
												Action
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{pendingTasks.map((task) => (
											<Task key={task.id} task={task} />
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="completed">
				<Card>
					<CardContent className="pt-6">
						{completedTasks.length === 0 ? (
							<div className="flex items-center justify-center py-12 text-muted-foreground">
								No completed transactions
							</div>
						) : (
							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[100px]">Chain</TableHead>
											<TableHead>To</TableHead>
											<TableHead>Value</TableHead>
											<TableHead>Transaction Hash</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{completedTasks.map((task) => (
											<Task key={task.id} task={task} />
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
};
