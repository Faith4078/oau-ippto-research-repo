"use client";

import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Building2,
	Mail,
	RefreshCw,
	ShieldCheck,
	UserCircle2,
	UsersRound,
} from "lucide-react";
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
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";
import type { RoleKey, UserStatus } from "#/domain/organization.ts";

type AdminDetailScope = "faculty" | "super";

type FacultyRecord = {
	code: string | null;
	departmentCount: number;
	description: string | null;
	id: string;
	name: string;
};

type DepartmentRecord = {
	code: string | null;
	description: string | null;
	facultyId: string;
	facultyName: string;
	id: string;
	name: string;
};

type DirectoryUser = {
	departmentId: string | null;
	email: string;
	facultyId: string | null;
	id: string;
	name: string;
	roleAssignments?: RoleAssignment[];
	roles: RoleKey[];
	staffId: string;
	status: UserStatus;
};

type RoleAssignment = {
	assignedAt: string | null;
	departmentId: string | null;
	facultyId: string | null;
	role: RoleKey;
};

type AdminDetailData = {
	departments: DepartmentRecord[];
	faculties: FacultyRecord[];
	users: DirectoryUser[];
};

const emptyAdminDetailData: AdminDetailData = {
	departments: [],
	faculties: [],
	users: [],
};

const roleLabels: Record<RoleKey, string> = {
	department_administrator: "Department Administrator",
	faculty_administrator: "Faculty Administrator",
	iptto_officer: "IPTTO Officer",
	lecturer: "Lecturer",
	super_administrator: "Super Administrator",
	visitor: "Visitor",
};

export function FacultyDetailPage({ facultyId }: { facultyId: string }) {
	const { data, error, loading, reload } = useAdminDetailData();
	const faculty = data.faculties.find((record) => record.id === facultyId);
	const departments = data.departments.filter(
		(department) => department.facultyId === facultyId,
	);
	const facultyAdmins = data.users.filter((user) =>
		userHasScopedRole(user, "faculty_administrator", { facultyId }),
	);

	return (
		<div className="space-y-6">
			<DetailHeader
				backHref="/dashboard/super-admin/faculties"
				backLabel="Back to faculties"
				description="Review the departments and faculty administrators attached to this faculty."
				kicker="Faculty detail"
				onRefresh={reload}
				title={faculty?.name ?? "Faculty detail"}
			/>
			<DetailBody
				error={error}
				loading={loading}
				notFoundLabel="Faculty was not found or is outside your access."
				onRetry={reload}
				present={Boolean(faculty)}
			>
				{faculty ? (
					<>
						<div className="grid gap-4 md:grid-cols-3">
							<SummaryCard
								label="Faculty code"
								value={faculty.code ?? "Not set"}
							/>
							<SummaryCard
								label="Departments"
								value={String(departments.length)}
							/>
							<SummaryCard
								label="Faculty admins"
								value={String(facultyAdmins.length)}
							/>
						</div>
						<DescriptionCard
							description={faculty.description}
							title="Faculty notes"
						/>
						<DepartmentsCard departments={departments} title="Departments" />
						<PeopleCard
							description="Faculty administrators assigned to this faculty scope."
							emptyLabel="No faculty administrators are assigned yet."
							scope="super"
							title="Faculty administrators"
							users={facultyAdmins}
						/>
					</>
				) : null}
			</DetailBody>
		</div>
	);
}

export function DepartmentDetailPage({
	departmentId,
	scope,
}: {
	departmentId: string;
	scope: AdminDetailScope;
}) {
	const { data, error, loading, reload } = useAdminDetailData();
	const facultyById = useMemo(
		() => facultyMap(data.faculties),
		[data.faculties],
	);
	const department = data.departments.find(
		(record) => record.id === departmentId,
	);
	const departmentAdmins = data.users.filter((user) =>
		userHasScopedRole(user, "department_administrator", { departmentId }),
	);
	const lecturers = data.users.filter((user) =>
		userHasScopedRole(user, "lecturer", { departmentId }),
	);
	const backHref =
		scope === "super"
			? "/dashboard/super-admin/departments"
			: "/dashboard/faculty-admin/departments";

	return (
		<div className="space-y-6">
			<DetailHeader
				backHref={backHref}
				backLabel="Back to departments"
				description="Review administrators and lecturers attached to this department."
				kicker="Department detail"
				onRefresh={reload}
				title={department?.name ?? "Department detail"}
			/>
			<DetailBody
				error={error}
				loading={loading}
				notFoundLabel="Department was not found or is outside your access."
				onRetry={reload}
				present={Boolean(department)}
			>
				{department ? (
					<>
						<div className="grid gap-4 md:grid-cols-3">
							<SummaryCard
								label="Department code"
								value={department.code ?? "Not set"}
							/>
							<SummaryCard
								label="Administrators"
								value={String(departmentAdmins.length)}
							/>
							<SummaryCard label="Lecturers" value={String(lecturers.length)} />
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Department profile</CardTitle>
								<CardDescription>
									Core organization details for this department.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-2">
								<InfoRow
									icon={Building2}
									label="Faculty"
									value={department.facultyName}
								/>
								<InfoRow
									icon={ShieldCheck}
									label="Faculty code"
									value={
										facultyById.get(department.facultyId)?.code ?? "Not set"
									}
								/>
								<div className="md:col-span-2">
									<p className="text-sm font-semibold">Description</p>
									<p className="mt-1 text-[#6b7280] text-sm">
										{department.description ?? "No description has been added."}
									</p>
								</div>
							</CardContent>
						</Card>
						<PeopleCard
							description="Department administrators assigned to this department scope."
							emptyLabel="No department administrators are assigned yet."
							scope={scope}
							title="Department administrators"
							users={departmentAdmins}
						/>
						<PeopleCard
							description="Lecturers whose profile belongs to this department."
							emptyLabel="No lecturers are attached to this department yet."
							scope={scope}
							title="Lecturers"
							users={lecturers}
						/>
					</>
				) : null}
			</DetailBody>
		</div>
	);
}

export function UserDetailPage({
	scope,
	userId,
}: {
	scope: AdminDetailScope;
	userId: string;
}) {
	const { data, error, loading, reload } = useAdminDetailData();
	const departmentById = useMemo(
		() => departmentMap(data.departments),
		[data.departments],
	);
	const facultyById = useMemo(
		() => facultyMap(data.faculties),
		[data.faculties],
	);
	const user = data.users.find((record) => record.id === userId);
	const assignments = user ? normalizedRoleAssignments(user) : [];
	const backHref =
		scope === "super"
			? "/dashboard/super-admin/users"
			: "/dashboard/faculty-admin/users";
	const department = user?.departmentId
		? departmentById.get(user.departmentId)
		: null;
	const faculty = user?.facultyId ? facultyById.get(user.facultyId) : null;

	return (
		<div className="space-y-6">
			<DetailHeader
				backHref={backHref}
				backLabel="Back to users"
				description="Inspect this account, its organization membership, and assigned role scopes."
				kicker="User detail"
				onRefresh={reload}
				title={user?.name ?? "User detail"}
			/>
			<DetailBody
				error={error}
				loading={loading}
				notFoundLabel="User was not found or is outside your access."
				onRetry={reload}
				present={Boolean(user)}
			>
				{user ? (
					<>
						<div className="grid gap-4 md:grid-cols-3">
							<SummaryCard label="Status" value={statusLabel(user.status)} />
							<SummaryCard label="Roles" value={String(user.roles.length)} />
							<SummaryCard
								label="Department"
								value={department?.name ?? "Not assigned"}
							/>
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Account profile</CardTitle>
								<CardDescription>
									Identity and organization membership for this staff account.
								</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-2">
								<InfoRow
									icon={UserCircle2}
									label="Staff ID"
									value={user.staffId}
								/>
								<InfoRow icon={Mail} label="Email" value={user.email} />
								<InfoRow
									icon={Building2}
									label="Department"
									value={department?.name ?? "Not assigned"}
								/>
								<InfoRow
									icon={ShieldCheck}
									label="Faculty"
									value={faculty?.name ?? "Not assigned"}
								/>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>Roles and scopes</CardTitle>
								<CardDescription>
									Each role is shown with the faculty or department it applies
									to.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{assignments.length === 0 ? (
									<EmptyState label="No roles have been assigned to this user." />
								) : (
									<div className="divide-y divide-[#e5e7eb]">
										{assignments.map((assignment) => (
											<div
												className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
												key={`${assignment.role}-${assignment.facultyId ?? "all"}-${assignment.departmentId ?? "all"}`}
											>
												<div>
													<p className="font-medium">
														{roleLabels[assignment.role]}
													</p>
													<p className="text-[#6b7280] text-sm">
														{roleScopeLabel(
															assignment,
															departmentById,
															facultyById,
														)}
													</p>
												</div>
												<span className="rounded-full border border-[#d8d8d8] px-2.5 py-1 text-[#6b7280] text-xs font-semibold">
													{assignment.assignedAt
														? `Assigned ${formatDate(assignment.assignedAt)}`
														: "Profile role"}
												</span>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</>
				) : null}
			</DetailBody>
		</div>
	);
}

function DepartmentsCard({
	departments,
	title,
}: {
	departments: DepartmentRecord[];
	title: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>
					Departments currently attached to this faculty.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{departments.length === 0 ? (
					<EmptyState label="No departments are attached yet." />
				) : (
					<div className="divide-y divide-[#e5e7eb]">
						{departments.map((department) => (
							<div
								className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
								key={department.id}
							>
								<div>
									<p className="font-medium">{department.name}</p>
									<p className="text-[#6b7280] text-sm">
										{department.code ? `${department.code} · ` : ""}
										{department.description ?? "No description"}
									</p>
								</div>
								<Button asChild size="sm" variant="outline">
									<Link
										params={{ departmentId: department.id }}
										to="/dashboard/super-admin/departments/$departmentId"
									>
										View department
									</Link>
								</Button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function DetailBody({
	children,
	error,
	loading,
	notFoundLabel,
	onRetry,
	present,
}: {
	children: React.ReactNode;
	error: string | null;
	loading: boolean;
	notFoundLabel: string;
	onRetry: () => void;
	present: boolean;
}) {
	if (loading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<LoadingSkeleton label="Loading details" rows={4} />
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Details unavailable</CardTitle>
					<CardDescription>{error}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button onClick={onRetry} size="sm" variant="outline">
						<RefreshCw className="h-4 w-4" />
						Try again
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!present) {
		return <EmptyState label={notFoundLabel} />;
	}

	return <>{children}</>;
}

function DetailHeader({
	backHref,
	backLabel,
	description,
	kicker,
	onRefresh,
	title,
}: {
	backHref: string;
	backLabel: string;
	description: string;
	kicker: string;
	onRefresh: () => void;
	title: string;
}) {
	return (
		<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<Button asChild size="sm" variant="outline">
					<Link to={backHref}>
						<ArrowLeft className="h-4 w-4" />
						{backLabel}
					</Link>
				</Button>
				<p className="mt-5 text-[#146ef5] text-sm font-semibold">{kicker}</p>
				<h1 className="mt-2 text-4xl font-semibold tracking-normal">{title}</h1>
				<p className="mt-3 max-w-3xl text-[#6b7280]">{description}</p>
			</div>
			<Button onClick={onRefresh} size="sm" variant="outline">
				<RefreshCw className="h-4 w-4" />
				Refresh
			</Button>
		</header>
	);
}

function DescriptionCard({
	description,
	title,
}: {
	description: string | null;
	title: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-[#6b7280] text-sm">
					{description ?? "No description has been added."}
				</p>
			</CardContent>
		</Card>
	);
}

function EmptyState({ label }: { label: string }) {
	return (
		<p className="rounded-lg border border-dashed border-[#d8d8d8] p-6 text-center text-[#6b7280] text-sm font-medium">
			{label}
		</p>
	);
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

function facultyMap(faculties: FacultyRecord[]) {
	return new Map(faculties.map((faculty) => [faculty.id, faculty]));
}

function departmentMap(departments: DepartmentRecord[]) {
	return new Map(departments.map((department) => [department.id, department]));
}

function InfoRow({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Building2;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-[#e5e7eb] p-4">
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#eef4ff] text-[#146ef5]">
				<Icon className="h-4 w-4" />
			</span>
			<div>
				<p className="text-[#6b7280] text-xs font-semibold uppercase tracking-wide">
					{label}
				</p>
				<p className="mt-1 font-medium">{value}</p>
			</div>
		</div>
	);
}

function normalizedRoleAssignments(user: DirectoryUser): RoleAssignment[] {
	if (user.roleAssignments?.length) return user.roleAssignments;

	return user.roles.map((role) => ({
		assignedAt: null,
		departmentId:
			role === "department_administrator" || role === "lecturer"
				? user.departmentId
				: null,
		facultyId:
			role === "department_administrator" ||
			role === "faculty_administrator" ||
			role === "lecturer"
				? user.facultyId
				: null,
		role,
	}));
}

function PeopleCard({
	description,
	emptyLabel,
	scope,
	title,
	users,
}: {
	description: string;
	emptyLabel: string;
	scope: AdminDetailScope;
	title: string;
	users: DirectoryUser[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{users.length === 0 ? (
					<EmptyState label={emptyLabel} />
				) : (
					<div className="divide-y divide-[#e5e7eb]">
						{users.map((user) => (
							<div
								className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
								key={user.id}
							>
								<div>
									<p className="font-medium">{user.name}</p>
									<p className="text-[#6b7280] text-sm">
										{user.staffId} · {user.email}
									</p>
								</div>
								<div className="flex flex-wrap items-center gap-2 sm:justify-end">
									<span className="inline-flex items-center gap-1 rounded-full border border-[#d8d8d8] px-2.5 py-1 text-xs font-semibold capitalize">
										<UsersRound className="h-3.5 w-3.5" />
										{user.status}
									</span>
									<Button asChild size="sm" variant="outline">
										<UserDetailLink scope={scope} userId={user.id} />
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

function UserDetailLink({
	scope,
	userId,
}: {
	scope: AdminDetailScope;
	userId: string;
}) {
	if (scope === "super") {
		return (
			<Link params={{ userId }} to="/dashboard/super-admin/users/$userId">
				View user
			</Link>
		);
	}

	return (
		<Link params={{ userId }} to="/dashboard/faculty-admin/users/$userId">
			View user
		</Link>
	);
}

function roleScopeLabel(
	assignment: RoleAssignment,
	departmentById: Map<string, DepartmentRecord>,
	facultyById: Map<string, FacultyRecord>,
) {
	if (assignment.departmentId) {
		const department = departmentById.get(assignment.departmentId);
		const faculty = assignment.facultyId
			? facultyById.get(assignment.facultyId)
			: department
				? facultyById.get(department.facultyId)
				: null;
		return [department?.name ?? "Unknown department", faculty?.name]
			.filter((value): value is string => Boolean(value))
			.join(" · ");
	}

	if (assignment.facultyId) {
		return facultyById.get(assignment.facultyId)?.name ?? "Unknown faculty";
	}

	return "University-wide";
}

function statusLabel(status: UserStatus) {
	return status.replaceAll("_", " ");
}

function SummaryCard({ label, value }: { label: string; value: string }) {
	return (
		<Card>
			<CardContent className="pt-6">
				<p className="text-[#6b7280] text-sm font-medium">{label}</p>
				<p className="mt-2 text-2xl font-semibold">{value}</p>
			</CardContent>
		</Card>
	);
}

function useAdminDetailData() {
	const [data, setData] = useState<AdminDetailData>(emptyAdminDetailData);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [facultiesResponse, departmentsResponse, usersResponse] =
				await Promise.all([
					fetch("/api/admin/organization/faculties", { cache: "no-store" }),
					fetch("/api/admin/organization/departments", { cache: "no-store" }),
					fetch("/api/admin/users", { cache: "no-store" }),
				]);
			const [facultiesPayload, departmentsPayload, usersPayload] =
				await Promise.all([
					facultiesResponse.json(),
					departmentsResponse.json(),
					usersResponse.json(),
				]);

			if (!facultiesResponse.ok) {
				throw new Error(
					facultiesPayload.error?.message ?? "Faculties could not be loaded.",
				);
			}
			if (!departmentsResponse.ok) {
				throw new Error(
					departmentsPayload.error?.message ??
						"Departments could not be loaded.",
				);
			}
			if (!usersResponse.ok) {
				throw new Error(
					usersPayload.error?.message ?? "Users could not be loaded.",
				);
			}

			setData({
				departments: departmentsPayload.data ?? [],
				faculties: facultiesPayload.data ?? [],
				users: usersPayload.data ?? [],
			});
		} catch (loadError) {
			const message =
				loadError instanceof Error ? loadError.message : "Try again.";
			setError(message);
			toast.error("Details unavailable", { description: message });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	return { data, error, loading, reload: load };
}

function userHasScopedRole(
	user: DirectoryUser,
	role: RoleKey,
	scope: { departmentId?: string; facultyId?: string },
): boolean {
	return normalizedRoleAssignments(user).some((assignment) => {
		if (assignment.role !== role) return false;
		if (scope.departmentId)
			return assignment.departmentId === scope.departmentId;
		if (scope.facultyId) return assignment.facultyId === scope.facultyId;
		return true;
	});
}
