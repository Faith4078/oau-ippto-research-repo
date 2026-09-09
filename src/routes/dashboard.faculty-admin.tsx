"use client";

import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "#/components/dashboard/dashboard-shell.tsx";
import { ResearchReviewWorkspace } from "#/components/dashboard/research-review-workspace.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

export const Route = createFileRoute("/dashboard/faculty-admin")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["faculty_administrator", "super_administrator"],
		}),
	head: () => ({
		meta: [
			{
				title: "Faculty Admin Dashboard | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Review faculty research, compare departments, and create clear reports.",
			},
		],
	}),
	component: FacultyAdminDashboard,
});

function FacultyAdminDashboard() {
	const location = useLocation();
	const isOverview = location.pathname === "/dashboard/faculty-admin";

	return (
		<DashboardShell workspace={workspaces["faculty-admin"]}>
			{isOverview ? (
				<div className="space-y-6">
					<ResearchReviewWorkspace embedded stage="faculty" />
					<DepartmentAdministratorAccessPanel />
				</div>
			) : (
				<Outlet />
			)}
		</DashboardShell>
	);
}

type AccessUser = {
	facultyId: string | null;
	id: string;
	name: string;
	roles: string[];
	staffId: string;
	status: string;
};

type DashboardIdentity = {
	facultyId: string | null;
	roleAssignments?: Array<{
		facultyId: string | null;
		role: string;
	}>;
};

type OrganizationOptions = {
	departments: Array<{ facultyId: string; id: string; name: string }>;
	faculties: Array<{ id: string; name: string }>;
};

function DepartmentAdministratorAccessPanel() {
	const [departmentId, setDepartmentId] = useState("");
	const [facultyId, setFacultyId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [organization, setOrganization] = useState<OrganizationOptions>({
		departments: [],
		faculties: [],
	});
	const [saving, setSaving] = useState(false);
	const [userId, setUserId] = useState("");
	const [users, setUsers] = useState<AccessUser[]>([]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [usersResponse, organizationResponse, meResponse] =
				await Promise.all([
					fetch("/api/admin/users", { cache: "no-store" }),
					fetch("/api/organization-options"),
					fetch("/api/dashboard/me", { cache: "no-store" }),
				]);
			const usersPayload = await usersResponse.json();
			const organizationPayload = await organizationResponse.json();
			const mePayload = await meResponse.json();
			if (!usersResponse.ok) {
				throw new Error(
					usersPayload.error?.message ?? "Staff accounts could not be loaded.",
				);
			}
			if (!meResponse.ok) {
				throw new Error(
					mePayload.error?.message ?? "Faculty access could not be confirmed.",
				);
			}
			const identity = mePayload.data as DashboardIdentity;
			const facultyAssignment = identity.roleAssignments?.find(
				(assignment) =>
					assignment.role === "faculty_administrator" && assignment.facultyId,
			);
			setFacultyId(facultyAssignment?.facultyId ?? identity.facultyId ?? null);
			setUsers(usersPayload.data ?? []);
			setOrganization(
				organizationPayload.data ?? { departments: [], faculties: [] },
			);
		} catch (error) {
			toast.error("Department admin setup unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const departments = useMemo(
		() =>
			organization.departments.filter(
				(department) => department.facultyId === facultyId,
			),
		[facultyId, organization.departments],
	);
	const candidates = useMemo(
		() =>
			users.filter(
				(user) =>
					user.status === "active" &&
					user.facultyId === facultyId &&
					!user.roles.some((role) =>
						[
							"department_administrator",
							"faculty_administrator",
							"iptto_officer",
							"super_administrator",
						].includes(role),
					),
			),
		[facultyId, users],
	);
	const facultyName =
		organization.faculties.find((faculty) => faculty.id === facultyId)?.name ??
		"your faculty";

	async function save(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!facultyId) return;
		setSaving(true);
		try {
			const response = await fetch("/api/admin/users", {
				body: JSON.stringify({
					departmentId,
					facultyId,
					role: "department_administrator",
					userId,
				}),
				headers: { "content-type": "application/json" },
				method: "POST",
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload.error?.message ?? "Access could not be saved.");
			}
			toast.success("Department administrator assigned");
			setDepartmentId("");
			setUserId("");
			await load();
		} catch (error) {
			toast.error("Access not updated", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card id="department-admin-access">
			<CardHeader>
				<CardTitle>Create department administrator</CardTitle>
				<CardDescription>
					Assign an active staff member in {facultyName} to manage one
					department review queue.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading ? (
					<LoadingSkeleton label="Loading faculty access options" rows={3} />
				) : !facultyId ? (
					<p className="text-sm text-[#6b7280]">
						Your account needs a faculty assignment before you can create
						department administrators.
					</p>
				) : (
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
								{candidates.map((user) => (
									<option key={user.id} value={user.id}>
										{user.name} ({user.staffId})
									</option>
								))}
							</select>
						</label>
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
						<Button
							className="md:col-span-2 md:w-fit"
							disabled={saving || !userId || !departmentId}
							type="submit"
						>
							{saving ? "Saving…" : "Assign department admin"}
						</Button>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
