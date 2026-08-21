"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardPage } from "#/components/dashboard/dashboard-shell.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard/super-admin")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title: "Super Admin Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Super administrator dashboard preview for users, roles, permissions, faculties, departments, settings, audit logs, and failed jobs.",
			},
		],
	}),
	component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
	return (
		<DashboardPage workspace={workspaces["super-admin"]}>
			<AccountApprovalQueue />
		</DashboardPage>
	);
}

type PendingAccount = {
	id: string;
	staffId: string;
	name: string;
	email: string;
	createdAt: string;
};

function AccountApprovalQueue() {
	const [accounts, setAccounts] = useState<PendingAccount[]>([]);
	const [loading, setLoading] = useState(true);
	const [actingOn, setActingOn] = useState<string | null>(null);

	const loadAccounts = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/admin/accounts", {
				cache: "no-store",
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "Approval queue could not be loaded.",
				);
			setAccounts(payload.data ?? []);
		} catch (error) {
			toast.error("Approval queue unavailable", {
				description:
					error instanceof Error ? error.message : "Try again shortly.",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadAccounts();
	}, [loadAccounts]);

	async function review(
		account: PendingAccount,
		status: "active" | "rejected",
	) {
		const reason =
			status === "rejected"
				? window.prompt("Reason for rejection")?.trim()
				: null;
		if (status === "rejected" && !reason) return;
		setActingOn(account.id);
		try {
			const response = await fetch("/api/admin/accounts", {
				body: JSON.stringify({ userId: account.id, status, reason }),
				headers: { "content-type": "application/json" },
				method: "POST",
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "Account could not be updated.",
				);
			setAccounts((current) =>
				current.filter((item) => item.id !== account.id),
			);
			toast.success(
				status === "active" ? "Account approved" : "Account rejected",
			);
		} catch (error) {
			toast.error("Account action failed", {
				description:
					error instanceof Error ? error.message : "Try again shortly.",
			});
		} finally {
			setActingOn(null);
		}
	}

	return (
		<Card className="rounded-lg border-[#d8d8d8] shadow-none">
			<CardHeader className="flex-row items-start justify-between gap-4">
				<div>
					<CardTitle>Account approval queue</CardTitle>
					<CardDescription>
						Verify pending lecturer and IPTTO access requests.
					</CardDescription>
				</div>
				<Button onClick={() => void loadAccounts()} size="sm" variant="outline">
					<RefreshCw className="h-4 w-4" />
					Refresh
				</Button>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-[#6b7280]">Loading pending accounts…</p>
				) : accounts.length === 0 ? (
					<p className="text-sm text-[#6b7280]">
						No accounts are awaiting approval.
					</p>
				) : (
					<div className="divide-y divide-[#e5e7eb]">
						{accounts.map((account) => (
							<div
								className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
								key={account.id}
							>
								<div>
									<p className="font-medium">{account.name}</p>
									<p className="text-sm text-[#6b7280]">
										{account.staffId} · {account.email}
									</p>
								</div>
								<div className="flex gap-2">
									<Button
										disabled={actingOn === account.id}
										onClick={() => void review(account, "active")}
										size="sm"
									>
										<CheckCircle2 className="h-4 w-4" />
										Approve
									</Button>
									<Button
										disabled={actingOn === account.id}
										onClick={() => void review(account, "rejected")}
										size="sm"
										variant="outline"
									>
										<XCircle className="h-4 w-4" />
										Reject
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
