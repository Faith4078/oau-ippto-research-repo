"use client";

import { Link } from "@tanstack/react-router";
import { Eye, RefreshCw, Search, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";
import type { RoleKey, UserStatus } from "#/domain/organization.ts";

type UserDirectoryScope = "faculty" | "super";

type DirectoryUser = {
	departmentId: string | null;
	email: string;
	facultyId: string | null;
	id: string;
	name: string;
	roleAssignments?: Array<{
		assignedAt: string;
		departmentId: string | null;
		facultyId: string | null;
		role: RoleKey;
	}>;
	roles: RoleKey[];
	staffId: string;
	status: UserStatus;
};

type OrganizationOptions = {
	departments: Array<{ facultyId: string; id: string; name: string }>;
	faculties: Array<{ id: string; name: string }>;
};

type RoleFilter = "all" | RoleKey;
type StatusFilter = "all" | UserStatus;

const roleLabels: Record<RoleKey, string> = {
	department_administrator: "Department Admins",
	faculty_administrator: "Faculty Admins",
	iptto_officer: "IPTTO Officers",
	lecturer: "Lecturers",
	super_administrator: "Super Admins",
	visitor: "Visitors",
};

const statusLabels: Record<StatusFilter, string> = {
	active: "Active",
	all: "All statuses",
	deactivated: "Deactivated",
	invited: "Invited",
	pending: "Pending",
	rejected: "Rejected",
	suspended: "Suspended",
};

const baseRoleOptions: RoleFilter[] = [
	"all",
	"lecturer",
	"department_administrator",
	"faculty_administrator",
	"iptto_officer",
	"super_administrator",
];

export function UserRoleDirectory({ scope }: { scope: UserDirectoryScope }) {
	const [loading, setLoading] = useState(true);
	const [organization, setOrganization] = useState<OrganizationOptions>({
		departments: [],
		faculties: [],
	});
	const [roleFilter, setRoleFilter] = useState<RoleFilter>(
		scope === "faculty" ? "department_administrator" : "faculty_administrator",
	);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [users, setUsers] = useState<DirectoryUser[]>([]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [usersResponse, organizationResponse] = await Promise.all([
				fetch("/api/admin/users", { cache: "no-store" }),
				fetch("/api/organization-options"),
			]);
			const [usersPayload, organizationPayload] = await Promise.all([
				usersResponse.json(),
				organizationResponse.json(),
			]);
			if (!usersResponse.ok) {
				throw new Error(
					usersPayload.error?.message ?? "Staff accounts could not be loaded.",
				);
			}

			setUsers(usersPayload.data ?? []);
			setOrganization(
				organizationPayload.data ?? { departments: [], faculties: [] },
			);
		} catch (error) {
			toast.error("User directory unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const departmentById = useMemo(
		() =>
			new Map(
				organization.departments.map((department) => [
					department.id,
					department.name,
				]),
			),
		[organization.departments],
	);
	const facultyById = useMemo(
		() =>
			new Map(
				organization.faculties.map((faculty) => [faculty.id, faculty.name]),
			),
		[organization.faculties],
	);

	const roleOptions = useMemo(
		() =>
			baseRoleOptions.filter(
				(role) => scope === "super" || role !== "super_administrator",
			),
		[scope],
	);

	const filteredUsers = useMemo(
		() =>
			users.filter((user) => {
				if (roleFilter !== "all" && !user.roles.includes(roleFilter)) {
					return false;
				}
				if (statusFilter !== "all" && user.status !== statusFilter) {
					return false;
				}

				const haystack = [
					user.name,
					user.staffId,
					user.email,
					user.facultyId ? facultyById.get(user.facultyId) : null,
					user.departmentId ? departmentById.get(user.departmentId) : null,
				]
					.filter((value): value is string => Boolean(value))
					.join(" ")
					.toLowerCase();

				return haystack.includes(search.trim().toLowerCase());
			}),
		[departmentById, facultyById, roleFilter, search, statusFilter, users],
	);

	const counts = useMemo(
		() =>
			new Map(
				roleOptions.map((role) => [
					role,
					role === "all"
						? users.length
						: users.filter((user) => user.roles.includes(role)).length,
				]),
			),
		[roleOptions, users],
	);

	const title = scope === "super" ? "Users by role" : "Faculty users by role";
	const description =
		scope === "super"
			? "Filter all staff by active responsibility across the platform."
			: "View users in your faculty by lecturer and administrator role.";
	const userDetailBasePath =
		scope === "super"
			? "/dashboard/super-admin/users"
			: "/dashboard/faculty-admin/users";

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-sm font-semibold text-[#146ef5]">User directory</p>
					<h1 className="mt-2 text-4xl font-semibold tracking-normal">
						{title}
					</h1>
					<p className="mt-3 max-w-3xl text-[#6b7280]">{description}</p>
				</div>
				<Button onClick={() => void load()} size="sm" variant="outline">
					<RefreshCw className="h-4 w-4" />
					Refresh
				</Button>
			</header>

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{roleOptions
					.filter((role) => role !== "all")
					.map((role) => (
						<button
							className="rounded-lg border border-[#d8d8d8] bg-white p-4 text-left hover:border-[#146ef5]"
							key={role}
							onClick={() => setRoleFilter(role)}
							type="button"
						>
							<p className="text-sm font-medium text-[#6b7280]">
								{roleLabels[role]}
							</p>
							<p className="mt-2 text-3xl font-semibold">
								{counts.get(role) ?? 0}
							</p>
						</button>
					))}
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
						<div>
							<CardTitle>Role-filtered users</CardTitle>
							<CardDescription>
								Choose a role, status, or search term to narrow the list.
							</CardDescription>
						</div>
						<div className="grid gap-3 md:grid-cols-3">
							<select
								className="h-9 rounded border border-[#d8d8d8] bg-white px-3 text-sm"
								onChange={(event) =>
									setRoleFilter(event.target.value as RoleFilter)
								}
								value={roleFilter}
							>
								{roleOptions.map((role) => (
									<option key={role} value={role}>
										{role === "all" ? "All roles" : roleLabels[role]}
									</option>
								))}
							</select>
							<select
								className="h-9 rounded border border-[#d8d8d8] bg-white px-3 text-sm"
								onChange={(event) =>
									setStatusFilter(event.target.value as StatusFilter)
								}
								value={statusFilter}
							>
								{Object.entries(statusLabels).map(([status, label]) => (
									<option key={status} value={status}>
										{label}
									</option>
								))}
							</select>
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[#6b7280]" />
								<Input
									aria-label="Search users"
									className="pl-9"
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search users"
									value={search}
								/>
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<LoadingSkeleton label="Loading users" rows={4} />
					) : filteredUsers.length === 0 ? (
						<p className="rounded-lg border border-dashed border-[#d8d8d8] p-6 text-center text-sm font-medium text-[#6b7280]">
							No users match those filters.
						</p>
					) : (
						<div className="divide-y divide-[#e5e7eb]">
							{filteredUsers.map((user) => (
								<UserRow
									departmentName={
										user.departmentId
											? (departmentById.get(user.departmentId) ?? null)
											: null
									}
									facultyName={
										user.facultyId
											? (facultyById.get(user.facultyId) ?? null)
											: null
									}
									detailHref={`${userDetailBasePath}/${user.id}`}
									key={user.id}
									user={user}
								/>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function UserRow({
	departmentName,
	detailHref,
	facultyName,
	user,
}: {
	departmentName: string | null;
	detailHref: string;
	facultyName: string | null;
	user: DirectoryUser;
}) {
	const organization = [departmentName, facultyName]
		.filter((value): value is string => Boolean(value))
		.join(" · ");

	return (
		<div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-start md:justify-between">
			<div className="min-w-0">
				<p className="font-medium">{user.name}</p>
				<p className="text-sm text-[#6b7280]">
					{user.staffId} · {user.email}
				</p>
				{organization ? (
					<p className="mt-1 text-sm text-[#6b7280]">{organization}</p>
				) : null}
			</div>
			<div className="flex flex-wrap items-center gap-2 md:justify-end">
				<Button asChild size="sm" variant="outline">
					<Link to={detailHref}>
						<Eye className="h-4 w-4" />
						View
					</Link>
				</Button>
				<span className="inline-flex items-center gap-1 rounded-full border border-[#d8d8d8] px-2.5 py-1 text-xs font-semibold capitalize">
					<UsersRound className="h-3.5 w-3.5" />
					{user.status}
				</span>
				{user.roles.length === 0 ? (
					<span className="rounded-full border border-[#d8d8d8] px-2.5 py-1 text-xs font-semibold text-[#6b7280]">
						No role
					</span>
				) : (
					user.roles.map((role) => (
						<span
							className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[#146ef5] text-xs font-semibold"
							key={role}
						>
							{roleLabels[role] ?? role.replaceAll("_", " ")}
						</span>
					))
				)}
			</div>
		</div>
	);
}
