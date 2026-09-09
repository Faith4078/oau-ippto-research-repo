"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AccountRejectionDialog } from "#/components/dashboard/account-rejection-dialog.tsx";
import { DashboardShell } from "#/components/dashboard/dashboard-shell.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";
import { requireDashboardRole } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard/super-admin")({
	// The parent "/dashboard" route already resolved the signed-in user (one
	// network round trip); reuse it from context instead of re-fetching it
	// here, which used to double the auth work done for every navigation.
	beforeLoad: ({ context }) => {
		requireDashboardRole(context.user, ["super_administrator"]);
	},
	head: () => ({
		meta: [
			{
				title: "Super Admin Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Approve accounts, manage access, and keep the OAU research platform running smoothly.",
			},
		],
	}),
	component: SuperAdminDashboard,
});

function SuperAdminDashboard() {
	return (
		<DashboardShell workspace={workspaces["super-admin"]}>
			<div className="space-y-6">
				<header>
					<p className="text-sm font-semibold text-[#146ef5]">
						Super Administrator
					</p>
					<h1 className="mt-2 text-4xl font-semibold tracking-normal">
						Platform access and operations
					</h1>
					<p className="mt-3 max-w-3xl text-[#6b7280]">
						Approve real account requests and inspect automatic work that needs
						attention.
					</p>
				</header>
				<AccountApprovalQueue />
				<UserAccessPanel />
				<FailedJobsPanel />
			</div>
		</DashboardShell>
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
	const [accountToReject, setAccountToReject] = useState<PendingAccount | null>(
		null,
	);

	const loadAccounts = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/admin/accounts", {
				cache: "no-store",
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "Account requests could not be loaded.",
				);
			setAccounts(payload.data ?? []);
		} catch (error) {
			toast.error("Account requests unavailable", {
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
		reason: string | null = null,
	) {
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
			setAccountToReject(null);
			toast.success(
				status === "active" ? "The account was updated" : "Account rejected",
			);
		} catch (error) {
			toast.error("Account not updated", {
				description:
					error instanceof Error ? error.message : "Try again shortly.",
			});
		} finally {
			setActingOn(null);
		}
	}

	return (
		<Card
			className="rounded-lg border-[#d8d8d8] shadow-none"
			id="account-requests"
		>
			<CardHeader className="flex-row items-start justify-between gap-4">
				<div>
					<CardTitle>Account requests</CardTitle>
					<CardDescription>
						Check each person's details, then approve or decline access.
					</CardDescription>
				</div>
				<Button onClick={() => void loadAccounts()} size="sm" variant="outline">
					<RefreshCw className="h-4 w-4" />
					Refresh
				</Button>
			</CardHeader>
			<CardContent>
				{loading ? (
					<LoadingSkeleton label="Loading account requests" rows={3} />
				) : accounts.length === 0 ? (
					<p className="text-sm text-[#6b7280]">
						No account requests need your review.
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
										onClick={() => setAccountToReject(account)}
										size="sm"
										variant="outline"
									>
										<XCircle className="h-4 w-4" />
										Decline
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
			{accountToReject ? (
				<AccountRejectionDialog
					accountName={accountToReject.name}
					busy={actingOn === accountToReject.id}
					onCancel={() => setAccountToReject(null)}
					onConfirm={(reason) =>
						void review(accountToReject, "rejected", reason)
					}
				/>
			) : null}
		</Card>
	);
}

type AccessUser = {
	id: string;
	name: string;
	roles: string[];
	staffId: string;
};

type OrganizationOptions = {
	departments: Array<{ facultyId: string; id: string; name: string }>;
	faculties: Array<{ id: string; name: string }>;
};

function UserAccessPanel() {
	const [users, setUsers] = useState<AccessUser[]>([]);
	const [organization, setOrganization] = useState<OrganizationOptions>({
		departments: [],
		faculties: [],
	});
	const [saving, setSaving] = useState(false);
	const [role, setRole] = useState("department_administrator");
	const [facultyId, setFacultyId] = useState("");
	const [departmentId, setDepartmentId] = useState("");
	const [userId, setUserId] = useState("");

	const load = useCallback(async () => {
		try {
			const [usersResponse, organizationResponse] = await Promise.all([
				fetch("/api/admin/users", { cache: "no-store" }),
				fetch("/api/organization-options"),
			]);
			const usersPayload = await usersResponse.json();
			const organizationPayload = await organizationResponse.json();
			if (!usersResponse.ok) {
				throw new Error(
					usersPayload.error?.message ?? "Staff accounts could not be loaded.",
				);
			}
			setUsers(
				(usersPayload.data ?? []).filter(
					(user: AccessUser) =>
						!user.roles.some((role) =>
							["lecturer", "iptto_officer", "super_administrator"].includes(
								role,
							),
						),
				),
			);
			setOrganization(
				organizationPayload.data ?? { departments: [], faculties: [] },
			);
		} catch (error) {
			toast.error("User access unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function save(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		try {
			const response = await fetch("/api/admin/users", {
				body: JSON.stringify({
					departmentId:
						role === "department_administrator" ? departmentId || null : null,
					facultyId: [
						"faculty_administrator",
						"department_administrator",
					].includes(role)
						? facultyId || null
						: null,
					role,
					userId,
				}),
				headers: { "content-type": "application/json" },
				method: "POST",
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload.error?.message ?? "Access could not be saved.");
			}
			toast.success("User access updated");
			await load();
		} catch (error) {
			toast.error("Access not updated", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setSaving(false);
		}
	}

	const departments = organization.departments.filter(
		(item) => !facultyId || item.facultyId === facultyId,
	);
	return (
		<Card id="user-access">
			<CardHeader>
				<CardTitle>Set administrator responsibility</CardTitle>
				<CardDescription>
					Assign a dedicated administrator to one department or faculty.
					Lecturer accounts are kept separate.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
					<label className="grid gap-2 text-sm font-semibold">
						Staff member
						<select
							className="h-11 rounded border px-3"
							onChange={(event) => setUserId(event.target.value)}
							required
							value={userId}
						>
							<option value="">Choose staff member</option>
							{users.map((user) => (
								<option key={user.id} value={user.id}>
									{user.name} ({user.staffId})
								</option>
							))}
						</select>
					</label>
					<label className="grid gap-2 text-sm font-semibold">
						Access role
						<select
							className="h-11 rounded border px-3"
							onChange={(event) => {
								setRole(event.target.value);
								setFacultyId("");
								setDepartmentId("");
							}}
							value={role}
						>
							<option value="department_administrator">
								Department Administrator
							</option>
							<option value="faculty_administrator">
								Faculty Administrator
							</option>
						</select>
					</label>
					{["faculty_administrator", "department_administrator"].includes(
						role,
					) && (
						<label className="grid gap-2 text-sm font-semibold">
							Faculty
							<select
								className="h-11 rounded border px-3"
								onChange={(event) => {
									setFacultyId(event.target.value);
									setDepartmentId("");
								}}
								required
								value={facultyId}
							>
								<option value="">Choose faculty</option>
								{organization.faculties.map((faculty) => (
									<option key={faculty.id} value={faculty.id}>
										{faculty.name}
									</option>
								))}
							</select>
						</label>
					)}
					{role === "department_administrator" && (
						<label className="grid gap-2 text-sm font-semibold">
							Department
							<select
								className="h-11 rounded border px-3"
								onChange={(event) => setDepartmentId(event.target.value)}
								required
								value={departmentId}
							>
								<option value="">Choose department</option>
								{departments.map((department) => (
									<option key={department.id} value={department.id}>
										{department.name}
									</option>
								))}
							</select>
						</label>
					)}
					<Button
						className="md:col-span-2 md:w-fit"
						disabled={saving || !userId}
						type="submit"
					>
						{saving ? "Saving…" : "Save user access"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

type FailedJob = {
	attempts: number;
	errorMessage: string | null;
	id: string;
	maxAttempts: number;
	type: string;
	updatedAt: string;
};

function FailedJobsPanel() {
	const [jobs, setJobs] = useState<FailedJob[]>([]);
	const [loading, setLoading] = useState(true);
	const load = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/jobs/failed?page=1&pageSize=25", {
				cache: "no-store",
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "Platform tasks could not be loaded.",
				);
			setJobs(payload.data ?? []);
		} catch (error) {
			toast.error("Platform tasks unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setLoading(false);
		}
	}, []);
	useEffect(() => {
		void load();
	}, [load]);
	return (
		<Card id="platform-attention">
			<CardHeader className="flex-row items-start justify-between">
				<div>
					<CardTitle>Automatic work needing attention</CardTitle>
					<CardDescription>
						Failed search, summary, and background tasks appear here with the
						recorded reason.
					</CardDescription>
				</div>
				<Button onClick={() => void load()} size="sm" variant="outline">
					<RefreshCw className="h-4 w-4" />
					Refresh
				</Button>
			</CardHeader>
			<CardContent>
				{loading ? (
					<LoadingSkeleton label="Checking platform tasks" rows={2} />
				) : jobs.length === 0 ? (
					<p className="rounded border border-dashed p-6 text-center font-medium">
						No failed automatic tasks.
					</p>
				) : (
					<div className="space-y-3">
						{jobs.map((job) => (
							<article
								className="rounded border border-red-200 bg-red-50 p-4"
								key={job.id}
							>
								<p className="font-semibold">{job.type.replaceAll("_", " ")}</p>
								<p className="mt-1 text-sm text-red-800">
									{job.errorMessage ?? "No error detail was recorded."}
								</p>
								<p className="mt-2 text-xs text-[#6b7280]">
									Attempt {job.attempts} of {job.maxAttempts}
								</p>
							</article>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
