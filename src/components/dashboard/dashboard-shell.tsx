"use client";

import { Link, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
	BadgeCheck,
	BookOpenCheck,
	Building2,
	CalendarDays,
	CheckCircle2,
	ChevronDown,
	Download,
	FileClock,
	Filter,
	Gavel,
	House,
	Lightbulb,
	LockKeyhole,
	LogOut,
	Menu,
	MoreHorizontal,
	Plus,
	ShieldCheck,
	SlidersHorizontal,
	UserCircle2,
	UsersRound,
	X,
	XCircle,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingSkeletonFrame } from "#/components/ui/loading-skeleton.tsx";
import { signOutAndRedirectHome } from "#/lib/sign-out.ts";
import { cn } from "#/lib/utils.ts";
import {
	type DashboardRole,
	type DashboardRow,
	type DashboardWorkspace,
	roleLabels,
	type StatusTone,
} from "#/presentation/dashboard/data.ts";
import { formatDashboardName } from "#/presentation/dashboard/display-name.ts";

type LecturerSubmissionItem = {
	id: string;
	title: string;
	statusLabel: string;
	accessLevel: string;
	department: string;
	date: string;
	type: string;
	published: boolean;
};

type LecturerTopBarIdentity = {
	departmentName: string | null;
	email: string | null;
	facultyName: string | null;
};

type DashboardUser = {
	id: string;
	staffId: string;
	name: string;
	email: string | null;
	roles: Array<string>;
	departmentId: string | null;
	facultyId: string | null;
};

type IpttoDashboardSummary = {
	stats: {
		innovations: number;
		patents: number;
		commercialization: number;
		reviews: number;
	};
	rows: Array<DashboardRow>;
};

const toneClasses: Record<StatusTone, string> = {
	success: "border-emerald-200 bg-emerald-50 text-emerald-700",
	warning: "border-amber-200 bg-amber-50 text-amber-700",
	info: "border-[#cfe0ff] bg-[#eef4ff] text-[#146ef5]",
	danger: "border-red-200 bg-red-50 text-red-700",
	neutral: "border-[#d8d8d8] bg-white text-[#6b7280]",
};

const workspaceNavByRole: Record<
	DashboardRole,
	{
		primary: Array<{ label: string; icon: LucideIcon; href: string }>;
		secondary: Array<{ label: string; icon: LucideIcon; href: string }>;
	}
> = {
	lecturer: {
		primary: [
			{
				label: "Home",
				icon: House,
				href: "/dashboard/lecturer",
			},
			{
				label: "Profile",
				icon: UserCircle2,
				href: "/dashboard/lecturer/profile",
			},
			{
				label: "Add Research",
				icon: SlidersHorizontal,
				href: "/dashboard/lecturer/submit",
			},
		],
		secondary: [
			{
				label: "Request IPTTO Services",
				icon: Lightbulb,
				href: "/dashboard/lecturer/request-service",
			},
		],
	},
	"department-admin": {
		primary: [
			{ label: "Needs Review", icon: FileClock, href: "#review-queue" },
			{ label: "Review Guide", icon: CheckCircle2, href: "#review-guide" },
			{
				label: "Department Report",
				icon: CalendarDays,
				href: "#dashboard-report",
			},
		],
		secondary: [],
	},
	"faculty-admin": {
		primary: [
			{
				label: "Needs Review",
				icon: FileClock,
				href: "/dashboard/faculty-admin#review-queue",
			},
			{
				label: "Departments",
				icon: Building2,
				href: "/dashboard/faculty-admin/departments",
			},
			{
				label: "Users by Role",
				icon: UsersRound,
				href: "/dashboard/faculty-admin/users",
			},
		],
		secondary: [
			{
				label: "Department Summary",
				icon: SlidersHorizontal,
				href: "/dashboard/faculty-admin#department-summary",
			},
			{
				label: "Faculty Report",
				icon: CalendarDays,
				href: "/dashboard/faculty-admin#dashboard-report",
			},
		],
	},
	"iptto-officer": {
		primary: [
			{
				label: "Innovation Pipeline",
				icon: SlidersHorizontal,
				href: "#innovation-pipeline",
			},
			{
				label: "Research Review",
				icon: CheckCircle2,
				href: "#research-review",
			},
		],
		secondary: [],
	},
	"super-admin": {
		primary: [
			{
				label: "Home",
				icon: House,
				href: "/dashboard/super-admin",
			},
			{
				label: "Faculties",
				icon: BookOpenCheck,
				href: "/dashboard/super-admin/faculties",
			},
			{
				label: "Departments",
				icon: Building2,
				href: "/dashboard/super-admin/departments",
			},
			{
				label: "Users by Role",
				icon: UsersRound,
				href: "/dashboard/super-admin/users",
			},
		],
		secondary: [],
	},
};

function getWorkspaceNav(role: DashboardRole) {
	return workspaceNavByRole[role];
}

type WorkspaceNavItem = { label: string; icon: LucideIcon; href: string };

/**
 * A route href (e.g. "/dashboard/lecturer/submit") is active when it matches
 * the current page. A hash href (e.g. "#review-queue") never changes the
 * page, so it's active once it's the most recently clicked in-page anchor
 * (tracked in `activeHash`); until anything is clicked, the first item in
 * the nav is highlighted as the sensible default.
 */
function buildNavItemActiveStates(
	nav: { primary: Array<WorkspaceNavItem>; secondary: Array<WorkspaceNavItem> },
	context: { pathname: string; activeHash: string | null },
): {
	primary: Map<string, boolean>;
	secondary: Map<string, boolean>;
} {
	const isActive = (href: string) =>
		href.startsWith("#")
			? context.activeHash === href
			: context.pathname === href;

	const allItems = [...nav.primary, ...nav.secondary];
	const anyActive = allItems.some((item) => isActive(item.href));
	const fallbackHref = allItems[0]?.href;

	const toEntries = (items: Array<WorkspaceNavItem>) =>
		new Map(
			items.map((item) => [
				item.href,
				anyActive ? isActive(item.href) : item.href === fallbackHref,
			]),
		);

	return {
		primary: toEntries(nav.primary),
		secondary: toEntries(nav.secondary),
	};
}

const throughputBars = [
	{ label: "W1", height: 34 },
	{ label: "W2", height: 58 },
	{ label: "W3", height: 46 },
	{ label: "W4", height: 82 },
	{ label: "W5", height: 28 },
	{ label: "W6", height: 74 },
	{ label: "W7", height: 66 },
	{ label: "W8", height: 90 },
];

export function DashboardShell({
	workspace,
	children,
}: {
	workspace: DashboardWorkspace;
	children: ReactNode;
}) {
	const isResponsiveWorkspace = isNonAdminWorkspace(workspace.role);
	const workspaceNav = getWorkspaceNav(workspace.role);
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [isDesktop, setIsDesktop] = useState(false);
	const [isIdentityLoading, setIsIdentityLoading] = useState(true);
	const [signedInName, setSignedInName] = useState<string | null>(null);
	const [lecturerIdentity, setLecturerIdentity] =
		useState<LecturerTopBarIdentity | null>(null);
	const [activeHash, setActiveHash] = useState<string | null>(null);
	const displayName = formatDashboardName(signedInName ?? workspace.persona);
	const pathname = useLocation({
		select: (state) => state.pathname.replace(/\/+$/, "") || "/",
	});

	useEffect(() => {
		const readHash = () => setActiveHash(window.location.hash || null);
		readHash();
		window.addEventListener("hashchange", readHash);
		return () => window.removeEventListener("hashchange", readHash);
	}, []);

	const navItemStates = buildNavItemActiveStates(workspaceNav, {
		activeHash,
		pathname,
	});

	useEffect(() => {
		let cancelled = false;
		setIsIdentityLoading(true);
		setSignedInName(null);
		setLecturerIdentity(null);

		void fetch("/api/dashboard/me", { cache: "no-store" })
			.then((response) => (response.ok ? response.json() : null))
			.then((payload) => {
				if (cancelled) {
					return;
				}

				const data = payload?.data ?? null;
				const name = data?.name;
				if (typeof name === "string" && name.trim()) {
					setSignedInName(name.trim());
				}

				if (workspace.role === "lecturer") {
					setLecturerIdentity({
						departmentName:
							typeof data?.departmentName === "string"
								? data.departmentName
								: null,
						email: typeof data?.email === "string" ? data.email : null,
						facultyName:
							typeof data?.facultyName === "string" ? data.facultyName : null,
					});
				}

				setIsIdentityLoading(false);
			})
			.catch(() => {
				if (!cancelled) {
					setIsIdentityLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [workspace.role]);

	useEffect(() => {
		const query = window.matchMedia("(min-width: 1024px)");
		const updateDesktopState = () => setIsDesktop(query.matches);
		updateDesktopState();
		query.addEventListener("change", updateDesktopState);
		return () => query.removeEventListener("change", updateDesktopState);
	}, []);

	useEffect(() => {
		if (!isMobileSidebarOpen) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsMobileSidebarOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [isMobileSidebarOpen]);

	return (
		<main className="min-h-screen bg-[#f0f0f0] text-[#080808]">
			<div className="mx-auto flex min-h-screen w-full max-w-360 bg-white">
				{isResponsiveWorkspace && isMobileSidebarOpen ? (
					<button
						aria-label="Close dashboard navigation"
						className="fixed inset-0 z-40 bg-black/35 lg:hidden"
						onClick={() => setIsMobileSidebarOpen(false)}
						type="button"
					/>
				) : null}
				<aside
					aria-hidden={
						isResponsiveWorkspace && !isDesktop && !isMobileSidebarOpen
							? true
							: undefined
					}
					aria-label="Dashboard navigation"
					className={cn(
						"w-67 shrink-0 flex-col border-[#d8d8d8] border-r bg-[#f7f7f7]",
						isResponsiveWorkspace
							? cn(
									"fixed inset-y-0 left-0 z-50 flex shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
									isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
								)
							: "flex flex-col",
					)}
					inert={isResponsiveWorkspace && !isDesktop && !isMobileSidebarOpen}
				>
					<div className="flex h-20 items-center justify-between border-[#d8d8d8] border-b px-5">
						<Link className="flex items-center gap-3" to="/dashboard">
							<div className="flex h-10 w-10 items-center justify-center rounded bg-[#146ef5] text-white">
								<ShieldCheck className="h-5 w-5" />
							</div>
							<div className="leading-tight">
								<strong className="block text-sm font-semibold">
									OAU IPTTO
								</strong>
								<span className="text-xs text-[#6b7280]">Staff dashboard</span>
							</div>
						</Link>
						{isResponsiveWorkspace ? (
							<button
								aria-label="Close dashboard navigation"
								className="flex h-10 w-10 items-center justify-center rounded border border-[#d8d8d8] bg-white lg:hidden"
								onClick={() => setIsMobileSidebarOpen(false)}
								type="button"
							>
								<X className="h-5 w-5" />
							</button>
						) : null}
					</div>

					<nav className="flex-1 space-y-6 p-4">
						<SidebarGroup label="Workspace">
							{workspaceNav.primary.map((item) => (
								<SidebarButton
									active={navItemStates.primary.get(item.href) ?? false}
									href={item.href}
									icon={item.icon}
									key={item.label}
									label={item.label}
									onClick={() => setIsMobileSidebarOpen(false)}
								/>
							))}
						</SidebarGroup>
						{workspaceNav.secondary.length > 0 ? (
							<SidebarGroup label="Tools">
								{workspaceNav.secondary.map((item) => (
									<SidebarButton
										active={navItemStates.secondary.get(item.href) ?? false}
										href={item.href}
										icon={item.icon}
										key={item.label}
										label={item.label}
										onClick={() => setIsMobileSidebarOpen(false)}
									/>
								))}
							</SidebarGroup>
						) : null}
					</nav>

					<SidebarFooter
						displayName={displayName}
						isIdentityLoading={isIdentityLoading}
						workspace={workspace}
					/>
				</aside>

				<section className="min-w-0 flex-1">
					<TopBar
						displayName={displayName}
						identity={workspace.role === "lecturer" ? lecturerIdentity : null}
						isIdentityLoading={isIdentityLoading}
						onMenuClick={() => setIsMobileSidebarOpen(true)}
						showMenu={isResponsiveWorkspace}
					/>
					<div
						className={cn(
							isResponsiveWorkspace ? "p-3 sm:p-6 lg:p-8" : "p-4 sm:p-6 lg:p-8",
						)}
					>
						{children}
					</div>
				</section>
			</div>
		</main>
	);
}

function isNonAdminWorkspace(role: DashboardRole) {
	return role === "lecturer" || role === "iptto-officer";
}

function shouldShowConfirmationPreview(role: DashboardRole) {
	return role === "department-admin" || role === "faculty-admin";
}

function TopBar({
	displayName,
	identity,
	isIdentityLoading,
	onMenuClick,
	showMenu,
}: {
	displayName: string;
	identity: LecturerTopBarIdentity | null;
	isIdentityLoading: boolean;
	onMenuClick: () => void;
	showMenu: boolean;
}) {
	const identityDetails = identity
		? [identity.departmentName, identity.facultyName, identity.email].filter(
				(value): value is string => Boolean(value?.trim()),
			)
		: [];

	return (
		<header className="sticky top-0 z-30 border-[#d8d8d8] border-b bg-white/95 backdrop-blur">
			<div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
				{showMenu ? (
					<button
						aria-label="Open dashboard navigation"
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#d8d8d8] bg-white lg:hidden"
						onClick={onMenuClick}
						type="button"
					>
						<Menu className="h-5 w-5" />
					</button>
				) : null}
				<div className="min-w-0 flex-1">
					{isIdentityLoading ? (
						<IdentityLoadingSkeleton label="Loading signed-in user" />
					) : (
						<p className="truncate text-sm font-semibold">{displayName}</p>
					)}
					{identityDetails.length > 0 ? (
						<p className="mt-0.5 truncate text-xs text-[#6b7280]">
							{identityDetails.join(" · ")}
						</p>
					) : null}
				</div>
				<div className="ml-auto flex items-center gap-2">
					<button
						aria-label="Sign out"
						className="flex h-10 w-10 items-center justify-center rounded border border-[#d8d8d8] bg-white text-[#080808]"
						onClick={() => void signOutAndRedirectHome()}
						type="button"
					>
						<LogOut className="h-4 w-4" />
					</button>
				</div>
			</div>
		</header>
	);
}

function SidebarGroup({
	children,
	label,
}: {
	children: ReactNode;
	label: string;
}) {
	return (
		<div>
			<p className="mb-2 px-2 text-xs font-medium text-[#6b7280]">{label}</p>
			<div className="grid gap-1">{children}</div>
		</div>
	);
}

function SidebarFooter({
	displayName,
	isIdentityLoading,
	workspace,
}: {
	displayName: string;
	isIdentityLoading: boolean;
	workspace: DashboardWorkspace;
}) {
	return (
		<div className="space-y-3 border-[#d8d8d8] border-t p-4">
			<div>
				<p className="mb-2 text-xs font-medium text-[#6b7280]">Signed in as</p>
				<div className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#d8d8d8] bg-white p-3 text-left">
					<span className="flex min-w-0 items-center gap-3">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#080808] text-white">
							<UserCircle2 className="h-5 w-5" />
						</span>
						<span className="min-w-0">
							{isIdentityLoading ? (
								<IdentityLoadingSkeleton label="Loading signed-in user" />
							) : (
								<strong className="block truncate text-sm font-semibold">
									{displayName}
								</strong>
							)}
							<span className="block truncate text-xs text-[#6b7280]">
								{roleLabels[workspace.role]}
							</span>
						</span>
					</span>
				</div>
			</div>
			<button
				className="flex w-full items-center justify-center gap-2 rounded border border-[#d8d8d8] bg-white px-3 py-2.5 text-sm font-medium text-[#080808] hover:border-[#146ef5]"
				onClick={() => void signOutAndRedirectHome()}
				type="button"
			>
				<LogOut className="h-4 w-4" />
				Logout
			</button>
		</div>
	);
}

function IdentityLoadingSkeleton({ label }: { label: string }) {
	return (
		<LoadingSkeletonFrame label={label}>
			<span className="block h-4 w-28 rounded-full bg-[#d8d8d8]" />
		</LoadingSkeletonFrame>
	);
}

function SidebarButton({
	active,
	href,
	icon: Icon,
	label,
	onClick,
}: {
	active?: boolean;
	href: string;
	icon: LucideIcon;
	label: string;
	onClick?: () => void;
}) {
	const className = cn(
		"flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-[#6b7280]",
		active && "bg-white text-[#080808]",
	);

	// In-page anchors (e.g. "#dashboard-report") scroll on the current page.
	// Route links, including route links with hashes, should use client-side
	// navigation so they can leave nested dashboard sections first.
	if (href.startsWith("#")) {
		return (
			<a className={className} href={href} onClick={onClick}>
				<Icon className="h-4 w-4" />
				{label}
			</a>
		);
	}

	return (
		<Link className={className} onClick={onClick} to={href}>
			<Icon className="h-4 w-4" />
			{label}
		</Link>
	);
}

export function DashboardPage({
	children,
	workspace,
}: {
	children?: ReactNode;
	workspace: DashboardWorkspace;
}) {
	const isResponsiveWorkspace = isNonAdminWorkspace(workspace.role);
	const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(
		null,
	);
	const [liveRows, setLiveRows] = useState<Array<DashboardRow>>([]);
	const [lecturerSubmissions, setLecturerSubmissions] = useState<
		Array<LecturerSubmissionItem>
	>([]);
	const [lecturerRowsLoaded, setLecturerRowsLoaded] = useState(false);
	const [ipttoSummary, setIpttoSummary] =
		useState<IpttoDashboardSummary | null>(null);

	const effectiveWorkspace = getEffectiveWorkspace({
		dashboardUser,
		ipttoSummary,
		lecturerRowsLoaded,
		lecturerSubmissions,
		liveRows,
		workspace,
	});

	useEffect(() => {
		let cancelled = false;

		async function loadDashboardUser() {
			try {
				const response = await fetch("/api/dashboard/me");

				if (!response.ok) {
					return;
				}

				const payload = (await response.json()) as {
					data?: DashboardUser;
				};

				if (!cancelled) {
					setDashboardUser(payload.data ?? null);
				}
			} catch {
				if (!cancelled) {
					setDashboardUser(null);
				}
			}
		}

		void loadDashboardUser();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (workspace.role !== "lecturer") {
			return;
		}

		let cancelled = false;

		async function loadLecturerSubmissions() {
			try {
				const response = await fetch("/api/research/submissions");

				if (!response.ok) {
					return;
				}

				const payload = (await response.json()) as {
					data?: Array<LecturerSubmissionItem>;
				};

				if (!cancelled) {
					const submissions = payload.data ?? [];
					setLecturerSubmissions(submissions);
					setLiveRows(submissions.map(toDashboardRow));
					setLecturerRowsLoaded(true);
				}
			} catch {
				if (!cancelled) {
					setLecturerSubmissions([]);
					setLiveRows([]);
					setLecturerRowsLoaded(true);
				}
			}
		}

		void loadLecturerSubmissions();

		return () => {
			cancelled = true;
		};
	}, [workspace.role]);

	useEffect(() => {
		if (workspace.role !== "iptto-officer") {
			return;
		}

		let cancelled = false;

		async function loadIpttoSummary() {
			try {
				const response = await fetch("/api/dashboard/iptto-summary");

				if (!response.ok) {
					return;
				}

				const payload = (await response.json()) as {
					data?: IpttoDashboardSummary;
				};

				if (!cancelled) {
					setIpttoSummary(payload.data ?? null);
				}
			} catch {
				if (!cancelled) {
					setIpttoSummary(null);
				}
			}
		}

		void loadIpttoSummary();

		return () => {
			cancelled = true;
		};
	}, [workspace.role]);

	return (
		<DashboardShell workspace={effectiveWorkspace}>
			<div className="space-y-6">
				<PageHeader workspace={effectiveWorkspace} />
				<ActionBanner
					isResponsiveWorkspace={isResponsiveWorkspace}
					workspace={effectiveWorkspace}
				/>
				<StatGrid
					isResponsiveWorkspace={isResponsiveWorkspace}
					stats={effectiveWorkspace.stats}
				/>
				<InsightGrid
					isResponsiveWorkspace={isResponsiveWorkspace}
					workspace={effectiveWorkspace}
				/>
				{children}
				<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
					<div className="min-w-0 space-y-6">
						<DataPanel
							isResponsiveWorkspace={isResponsiveWorkspace}
							workspace={effectiveWorkspace}
						/>
					</div>
					<aside className="space-y-6">
						<WorkspaceForm workspace={effectiveWorkspace} />
						<QuickActions workspace={effectiveWorkspace} />
						{effectiveWorkspace.sections.map((section) => (
							<PlaceholderSection
								icon={section.icon}
								key={section.title}
								text={section.text}
								title={section.title}
							/>
						))}
						{shouldShowConfirmationPreview(effectiveWorkspace.role) && (
							<ConfirmationDialog />
						)}
					</aside>
				</div>
			</div>
		</DashboardShell>
	);
}

function getEffectiveWorkspace(input: {
	dashboardUser: DashboardUser | null;
	ipttoSummary: IpttoDashboardSummary | null;
	lecturerRowsLoaded: boolean;
	lecturerSubmissions: Array<LecturerSubmissionItem>;
	liveRows: Array<DashboardRow>;
	workspace: DashboardWorkspace;
}): DashboardWorkspace {
	const persona = input.dashboardUser
		? `${input.dashboardUser.name} (${input.dashboardUser.staffId})`
		: input.workspace.persona;

	if (input.workspace.role === "lecturer" && input.lecturerRowsLoaded) {
		return {
			...input.workspace,
			persona,
			rows: input.liveRows,
			stats: lecturerStatsFromSubmissions(input.lecturerSubmissions),
			description: input.dashboardUser
				? `Welcome back, ${input.dashboardUser.name}. Follow your research from first draft to publication.`
				: input.workspace.description,
		};
	}

	if (input.workspace.role === "iptto-officer" && input.ipttoSummary) {
		return {
			...input.workspace,
			persona,
			rows: input.ipttoSummary.rows,
			stats: ipttoStatsFromSummary(input.ipttoSummary),
			description: input.dashboardUser
				? `Welcome back, ${input.dashboardUser.name}. Review innovations, patents, and commercial opportunities here.`
				: input.workspace.description,
		};
	}

	return {
		...input.workspace,
		persona,
	};
}

function lecturerStatsFromSubmissions(
	submissions: Array<LecturerSubmissionItem>,
): DashboardWorkspace["stats"] {
	const active = submissions.filter((item) => !item.published).length;
	const published = submissions.filter((item) => item.published).length;
	const publicOutputs = submissions.filter(
		(item) => item.accessLevel === "public",
	).length;

	return [
		{
			label: "Being Reviewed",
			value: String(active),
			trend: `${submissions.length} research items in total`,
			icon: FileClock,
			tone: active > 0 ? "info" : "neutral",
		},
		{
			label: "Published Research",
			value: String(published),
			trend: published > 0 ? "Visible to the public" : "Nothing published yet",
			icon: BadgeCheck,
			tone: published > 0 ? "success" : "neutral",
		},
		{
			label: "Visible to Everyone",
			value: String(publicOutputs),
			trend: "Appears on the public research page",
			icon: BookOpenCheck,
			tone: publicOutputs > 0 ? "success" : "neutral",
		},
		{
			label: "Private/Restricted",
			value: String(submissions.length - publicOutputs),
			trend: "Only approved people can view these",
			icon: LockKeyhole,
			tone: "warning",
		},
	];
}

function ipttoStatsFromSummary(
	summary: IpttoDashboardSummary,
): DashboardWorkspace["stats"] {
	return [
		{
			label: "Innovations",
			value: String(summary.stats.innovations),
			trend: "Innovations currently being managed",
			icon: Lightbulb,
			tone: "info",
		},
		{
			label: "Patents",
			value: String(summary.stats.patents),
			trend: "Patents currently being managed",
			icon: Gavel,
			tone: "warning",
		},
		{
			label: "Commercialization",
			value: String(summary.stats.commercialization),
			trend: "Live partner activities",
			icon: CalendarDays,
			tone: "success",
		},
		{
			label: "Reviews Completed",
			value: String(summary.stats.reviews),
			trend: "Decisions saved by the IPTTO team",
			icon: CheckCircle2,
			tone: "neutral",
		},
	];
}

function toDashboardRow(item: LecturerSubmissionItem): DashboardRow {
	return {
		id: item.id,
		title: item.title,
		owner: "You",
		department: item.department,
		date: item.date,
		type: item.type,
		status: item.statusLabel,
		tone: item.published ? "success" : "info",
	};
}

function PageHeader({ workspace }: { workspace: DashboardWorkspace }) {
	const isResponsiveWorkspace = isNonAdminWorkspace(workspace.role);

	return (
		<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
			<div>
				<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#146ef5]">
					<ShieldCheck className="h-3.5 w-3.5" />
					{roleLabels[workspace.role]} view
				</div>
				<h1 className="text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
					{workspace.title}
				</h1>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280] sm:text-base">
					{workspace.description}
				</p>
			</div>
			<ActionButtonGroup
				isResponsiveWorkspace={isResponsiveWorkspace}
				primary={workspace.primaryAction}
				secondary={workspace.secondaryAction}
			/>
		</div>
	);
}

function ActionButtonGroup({
	isResponsiveWorkspace,
	primary,
	secondary,
}: {
	isResponsiveWorkspace: boolean;
	primary: string;
	secondary: string;
}) {
	return (
		<div
			className={cn(
				isResponsiveWorkspace
					? "grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2"
					: "flex flex-col gap-2 sm:flex-row",
			)}
		>
			<Button
				asChild={primary === "Submit Research"}
				className="h-11 rounded bg-[#146ef5] px-4 text-white hover:bg-[#0d5fdc]"
				type="button"
			>
				{primary === "Submit Research" ? (
					<Link to="/dashboard/lecturer/submit">
						<Plus className="h-4 w-4" />
						{primary}
					</Link>
				) : (
					<>
						<Plus className="h-4 w-4" />
						{primary}
					</>
				)}
			</Button>
			<Button
				className="h-11 rounded border-[#d8d8d8] bg-white px-4 text-[#080808] hover:border-[#146ef5] hover:bg-white"
				type="button"
				variant="outline"
			>
				<Download className="h-4 w-4" />
				{secondary}
			</Button>
		</div>
	);
}

function ActionBanner({
	isResponsiveWorkspace,
	workspace,
}: {
	isResponsiveWorkspace: boolean;
	workspace: DashboardWorkspace;
}) {
	return (
		<section className="overflow-hidden rounded-lg border border-[#cfe0ff] bg-[#146ef5] text-white">
			<div
				className={cn(
					"grid gap-4 md:grid-cols-[1fr_auto] md:items-center",
					isResponsiveWorkspace ? "p-4 sm:p-5" : "p-5",
				)}
			>
				<div>
					<p className="text-sm font-medium text-white/78">
						Your work at a glance
					</p>
					<h2
						className={cn(
							"mt-1 font-semibold tracking-normal",
							isResponsiveWorkspace ? "text-lg sm:text-xl" : "text-xl",
						)}
					>
						{workspace.primaryAction} and keep institutional review moving.
					</h2>
				</div>
				<Button
					className={cn(
						"h-10 rounded bg-white px-4 text-[#146ef5] hover:bg-[#eef4ff]",
						isResponsiveWorkspace && "w-full sm:w-auto",
					)}
					type="button"
				>
					<CheckCircle2 className="h-4 w-4" />
					Open Workspace
				</Button>
			</div>
		</section>
	);
}

function StatGrid({
	isResponsiveWorkspace,
	stats,
}: {
	isResponsiveWorkspace: boolean;
	stats: DashboardWorkspace["stats"];
}) {
	return (
		<section
			className={cn(
				"grid gap-3 xl:grid-cols-4",
				isResponsiveWorkspace
					? "grid-cols-1 min-[460px]:grid-cols-2"
					: "sm:grid-cols-2",
			)}
		>
			{stats.map((stat) => (
				<Card
					className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none"
					key={stat.label}
				>
					<CardContent className="p-4">
						<div className="mb-5 flex items-center justify-between gap-3">
							<span
								className={cn(
									"flex h-9 w-9 items-center justify-center rounded border",
									toneClasses[stat.tone],
								)}
							>
								<stat.icon className="h-4 w-4" />
							</span>
						</div>
						<p className="text-sm font-medium text-[#6b7280]">{stat.label}</p>
						<strong className="mt-2 block text-3xl font-semibold tracking-normal">
							{stat.value}
						</strong>
						<span className="mt-2 block text-sm font-medium text-[#146ef5]">
							{stat.trend}
						</span>
					</CardContent>
				</Card>
			))}
		</section>
	);
}

function InsightGrid({
	isResponsiveWorkspace,
	workspace,
}: {
	isResponsiveWorkspace: boolean;
	workspace: DashboardWorkspace;
}) {
	const copy = getInsightCopy(workspace.role);

	return (
		<section
			className={cn(
				"grid xl:grid-cols-[minmax(0,1fr)_340px]",
				isResponsiveWorkspace ? "gap-4 xl:gap-6" : "gap-6",
			)}
		>
			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						{copy.barTitle}
					</CardTitle>
					<CardDescription>{copy.barDescription}</CardDescription>
				</CardHeader>
				<CardContent
					className={cn(isResponsiveWorkspace && "overflow-x-auto", "p-4")}
				>
					<div
						className={cn(
							"grid h-55 grid-cols-8 items-end gap-3 border-[#d8d8d8] border-b bg-[linear-gradient(to_top,#f0f0f0_1px,transparent_1px)] bg-size-[100%_44px] px-1 pb-6",
							isResponsiveWorkspace && "min-w-130 sm:min-w-0",
						)}
					>
						{throughputBars.map((bar) => (
							<div
								className="flex min-w-0 flex-col items-center gap-2"
								key={bar.label}
							>
								<div className="flex h-36 w-full max-w-12 items-end rounded bg-[#f0f0f0]">
									<div
										className="w-full rounded bg-[#146ef5]"
										style={{ height: `${bar.height}%` }}
									/>
								</div>
								<span className="truncate text-xs text-[#6b7280]">
									{bar.label}
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						{copy.lineTitle}
					</CardTitle>
					<CardDescription>{copy.lineDescription}</CardDescription>
				</CardHeader>
				<CardContent
					className={cn(isResponsiveWorkspace && "overflow-x-auto", "p-4")}
				>
					<svg
						aria-label="Review progress line chart"
						className={cn("h-55 w-full", isResponsiveWorkspace && "min-w-75")}
						role="img"
						viewBox="0 0 320 220"
					>
						<path
							d="M12 175 H308 M12 132 H308 M12 88 H308 M12 44 H308"
							fill="none"
							stroke="#f0f0f0"
							strokeWidth="1"
						/>
						<path
							d="M18 148 L58 178 L98 118 L138 142 L178 64 L218 162 L258 116 L302 52"
							fill="none"
							stroke="#146ef5"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="3"
						/>
						{[
							[18, 148],
							[58, 178],
							[98, 118],
							[138, 142],
							[178, 64],
							[218, 162],
							[258, 116],
							[302, 52],
						].map(([cx, cy]) => (
							<circle
								cx={cx}
								cy={cy}
								fill="#ffffff"
								key={`${cx}-${cy}`}
								r="4"
								stroke="#146ef5"
								strokeWidth="2"
							/>
						))}
					</svg>
				</CardContent>
			</Card>
		</section>
	);
}

function getInsightCopy(role: DashboardRole) {
	switch (role) {
		case "lecturer":
			return {
				barTitle: "Research Activity",
				barDescription:
					"Research started, documents added, and work sent for review each week.",
				lineTitle: "Review Progress",
				lineDescription:
					"Movement across department, faculty, and IPTTO stages.",
			};
		case "iptto-officer":
			return {
				barTitle: "Innovation Pipeline",
				barDescription:
					"Innovation, patent, and commercialization intake by week.",
				lineTitle: "IPTTO Review Pace",
				lineDescription:
					"Prior art checks, supporting files, and publication readiness.",
			};
		case "super-admin":
			return {
				barTitle: "System Activity",
				barDescription:
					"Account, access, faculty, and department activity each week.",
				lineTitle: "Platform Health",
				lineDescription:
					"Important activity, incomplete tasks, and access changes.",
			};
		default:
			return {
				barTitle: "Reviews Completed",
				barDescription: "Research reviewed and decisions made each week.",
				lineTitle: "Time to Decision",
				lineDescription:
					"How quickly research is approved, returned for changes, or prepared for publication.",
			};
	}
}

function DataPanel({
	isResponsiveWorkspace,
	workspace,
}: {
	isResponsiveWorkspace: boolean;
	workspace: DashboardWorkspace;
}) {
	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardHeader className="flex flex-col gap-4 border-[#d8d8d8] border-b px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<CardTitle className="text-xl tracking-normal">
						{workspace.tabs[0]}
					</CardTitle>
					<CardDescription className="mt-1">
						Everything that needs your attention, in one place.
					</CardDescription>
				</div>
				<FilterBar
					filters={workspace.filters}
					isResponsiveWorkspace={isResponsiveWorkspace}
				/>
			</CardHeader>
			<div
				className={cn(
					"gap-3 border-[#d8d8d8] border-b px-4 py-3",
					isResponsiveWorkspace
						? "grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
						: "flex flex-wrap items-center justify-between",
				)}
			>
				<div
					className={cn(
						"flex max-w-full gap-2 overflow-x-auto",
						isResponsiveWorkspace && "pb-1",
					)}
				>
					{workspace.tabs.map((tab, index) => (
						<button
							className={cn(
								"shrink-0 border-[#d8d8d8] border-b-2 px-2 py-2 text-sm font-semibold text-[#6b7280]",
								index === 0 && "border-[#146ef5] text-[#080808]",
							)}
							key={tab}
							type="button"
						>
							{tab}
						</button>
					))}
				</div>
				<div
					className={cn(
						isResponsiveWorkspace
							? "grid grid-cols-2 gap-2 sm:flex"
							: "flex gap-2",
					)}
				>
					<Button className="h-9 rounded px-3" type="button" variant="outline">
						<Filter className="h-4 w-4" />
						Filter
					</Button>
					<Button className="h-9 rounded px-3" type="button" variant="outline">
						<Download className="h-4 w-4" />
						Export
					</Button>
				</div>
			</div>
			{workspace.rows.length > 0 ? (
				<DataTable
					isResponsiveWorkspace={isResponsiveWorkspace}
					rows={workspace.rows}
					role={workspace.role}
				/>
			) : (
				<EmptyState
					action={workspace.emptyAction}
					text={workspace.emptyText}
					title={workspace.emptyTitle}
				/>
			)}
		</Card>
	);
}

function FilterBar({
	filters,
	isResponsiveWorkspace,
}: {
	filters: Array<string>;
	isResponsiveWorkspace: boolean;
}) {
	return (
		<div
			className={cn(
				"flex gap-2",
				isResponsiveWorkspace
					? "overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0"
					: "flex-wrap",
			)}
		>
			{filters.map((filter, index) => (
				<button
					className={cn(
						"rounded border px-3 py-2 text-sm font-medium",
						isResponsiveWorkspace && "shrink-0",
						index === 0
							? "border-[#146ef5] bg-[#eef4ff] text-[#146ef5]"
							: "border-[#d8d8d8] bg-white text-[#6b7280]",
					)}
					key={filter}
					type="button"
				>
					{filter}
				</button>
			))}
		</div>
	);
}

function DataTable({
	isResponsiveWorkspace,
	rows,
	role,
}: {
	isResponsiveWorkspace: boolean;
	rows: Array<DashboardRow>;
	role: DashboardRole;
}) {
	const showBulkSelection = !isNonAdminWorkspace(role);
	const showOwner = role !== "lecturer";

	return (
		<div className="overflow-x-auto">
			<table
				className={cn(
					"w-full border-collapse text-left",
					isResponsiveWorkspace ? "min-w-190 md:min-w-215" : "min-w-215",
				)}
			>
				<thead className="bg-[#f7f7f7] text-xs font-semibold text-[#6b7280]">
					<tr>
						{showBulkSelection && (
							<th className="w-10 px-4 py-3">
								<input aria-label="Select all rows" type="checkbox" />
							</th>
						)}
						<th className="px-4 py-3">Research</th>
						{showOwner && <th className="px-4 py-3">Owner</th>}
						<th className="px-4 py-3">Department</th>
						<th className="px-4 py-3">Date</th>
						<th className="px-4 py-3">Type</th>
						<th className="px-4 py-3">Status</th>
						<th className="px-4 py-3 text-right">Actions</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-[#d8d8d8] text-sm">
					{rows.map((row) => (
						<tr className="hover:bg-[#f7f7f7]" key={row.id}>
							{showBulkSelection && (
								<td className="px-4 py-4">
									<input aria-label={`Select ${row.id}`} type="checkbox" />
								</td>
							)}
							<td className="max-w-70 px-4 py-4">
								<strong className="block truncate font-semibold text-[#080808]">
									{row.title}
								</strong>
								<span className="text-xs text-[#6b7280]">{row.id}</span>
							</td>
							{showOwner && (
								<td className="px-4 py-4 font-medium">{row.owner}</td>
							)}
							<td className="px-4 py-4 text-[#6b7280]">{row.department}</td>
							<td className="px-4 py-4 text-[#6b7280]">{row.date}</td>
							<td className="px-4 py-4">{row.type}</td>
							<td className="px-4 py-4">
								<StatusChip label={row.status} tone={row.tone} />
							</td>
							<td className="px-4 py-4 text-right">
								<button
									aria-label={`Open actions for ${row.id}`}
									className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#d8d8d8] bg-white"
									type="button"
								>
									<MoreHorizontal className="h-4 w-4" />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
				toneClasses[tone],
			)}
		>
			<span className="h-1.5 w-1.5 rounded-full bg-current" />
			{label}
		</span>
	);
}

function EmptyState({
	action,
	text,
	title,
}: {
	action: string;
	text: string;
	title: string;
}) {
	return (
		<div className="p-6 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-[#eef4ff] text-[#146ef5]">
				<FileClock className="h-6 w-6" />
			</div>
			<h2 className="mt-4 text-lg font-semibold tracking-normal">{title}</h2>
			<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b7280]">
				{text}
			</p>
			<Button
				className="mt-5 h-10 rounded bg-[#146ef5] px-4 text-white hover:bg-[#0d5fdc]"
				type="button"
			>
				<Plus className="h-4 w-4" />
				{action}
			</Button>
		</div>
	);
}

function WorkspaceForm({ workspace }: { workspace: DashboardWorkspace }) {
	const formCopy = getWorkspaceFormCopy(workspace);

	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
				<CardTitle className="text-base tracking-normal">
					{formCopy.title}
				</CardTitle>
				<CardDescription>{formCopy.description}</CardDescription>
			</CardHeader>
			<CardContent className="p-4">
				<form className="grid gap-4">
					<FieldGroup className="gap-4">
						<Field>
							<FieldLabel htmlFor={`${workspace.role}-primary`}>
								{formCopy.primaryLabel}
							</FieldLabel>
							<Input
								className="h-10 rounded border-[#d8d8d8] bg-white"
								id={`${workspace.role}-primary`}
								placeholder={formCopy.primaryPlaceholder}
								type="text"
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor={`${workspace.role}-status`}>
								{formCopy.secondaryLabel}
							</FieldLabel>
							<select
								className="h-10 rounded border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus:border-[#146ef5] focus:ring-3 focus:ring-[#146ef5]/15"
								id={`${workspace.role}-status`}
							>
								{workspace.filters.map((filter) => (
									<option key={filter}>{filter}</option>
								))}
							</select>
							<FieldDescription>{formCopy.helperText}</FieldDescription>
						</Field>
					</FieldGroup>
					<Button
						className="h-10 rounded bg-[#146ef5] text-white hover:bg-[#0d5fdc]"
						type="button"
					>
						<CheckCircle2 className="h-4 w-4" />
						{formCopy.action}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function getWorkspaceFormCopy(workspace: DashboardWorkspace) {
	switch (workspace.role) {
		case "lecturer":
			return {
				title: "Add Research",
				description:
					"Start with a title. You can add the remaining details and document next.",
				primaryLabel: "Research title",
				primaryPlaceholder: "Enter the title of your research",
				secondaryLabel: "Type of research",
				action: "Start Research",
				helperText:
					"You can save your progress and return before sending it for review.",
			};
		case "department-admin":
			return {
				title: "Give Feedback",
				description: "Explain clearly what the lecturer should do next.",
				primaryLabel: "Your feedback",
				primaryPlaceholder: "Describe what is good or what needs to change",
				secondaryLabel: "Research to review",
				action: "Save Feedback",
				helperText: "Choose a piece of research before saving your feedback.",
			};
		case "faculty-admin":
			return {
				title: "Faculty Report",
				description: "Create a report for the people and period you choose.",
				primaryLabel: "Report name",
				primaryPlaceholder: "July faculty research report",
				secondaryLabel: "What to include",
				action: "Generate Report",
				helperText: "Choose what the report should cover first.",
			};
		case "iptto-officer":
			return {
				title: "Innovation Intake",
				description: "Capture an innovation or patent lead.",
				primaryLabel: "Technology title",
				primaryPlaceholder: "Enter innovation title",
				secondaryLabel: "What are you adding?",
				action: "Register Technology",
				helperText:
					"Choose whether this is an innovation, patent, or partnership activity.",
			};
		case "super-admin":
			return {
				title: "User Access",
				description: "Start a role or permission request.",
				primaryLabel: "Staff ID or email",
				primaryPlaceholder: "Search staff account",
				secondaryLabel: "Admin area",
				action: "Prepare Invite",
				helperText: "Review role and organization access before inviting.",
			};
	}
}

function QuickActions({ workspace }: { workspace: DashboardWorkspace }) {
	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardHeader className="px-4 py-4">
				<CardTitle className="text-base tracking-normal">
					Quick Actions
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-2 px-4 pb-4">
				{workspace.quickActions.map((action) => (
					<button
						className="flex items-center justify-between gap-3 rounded border border-[#d8d8d8] bg-white p-3 text-left text-sm font-semibold hover:border-[#146ef5]"
						key={action.label}
						type="button"
					>
						<span className="flex items-center gap-3">
							<span className="flex h-8 w-8 items-center justify-center rounded bg-[#eef4ff] text-[#146ef5]">
								<action.icon className="h-4 w-4" />
							</span>
							{action.label}
						</span>
						<ChevronDown className="h-4 w-4 -rotate-90 text-[#6b7280]" />
					</button>
				))}
			</CardContent>
		</Card>
	);
}

function PlaceholderSection({
	icon: Icon,
	text,
	title,
}: {
	icon: LucideIcon;
	text: string;
	title: string;
}) {
	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#080808] text-white">
						<Icon className="h-4 w-4" />
					</div>
					<div>
						<h2 className="text-base font-semibold tracking-normal">{title}</h2>
						<p className="mt-2 text-sm leading-6 text-[#6b7280]">{text}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function ConfirmationDialog() {
	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardHeader className="px-4 py-4">
				<CardTitle className="text-base tracking-normal">
					Confirmation Dialog
				</CardTitle>
				<CardDescription>
					Approval, rejection, archive, and publish actions confirm intent.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-4 pb-4">
				<div className="rounded-lg border border-[#d8d8d8] bg-[#f7f7f7] p-3">
					<p className="text-sm font-semibold">
						Approve the selected research?
					</p>
					<div className="mt-3 flex gap-2">
						<Button
							className="h-9 flex-1 rounded bg-[#146ef5] text-white hover:bg-[#0d5fdc]"
							type="button"
						>
							<CheckCircle2 className="h-4 w-4" />
							Confirm
						</Button>
						<Button
							className="h-9 flex-1 rounded border-[#d8d8d8] bg-white"
							type="button"
							variant="outline"
						>
							<XCircle className="h-4 w-4" />
							Cancel
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
