import type { LucideIcon } from "lucide-react";
import {
	Archive,
	BadgeCheck,
	BarChart3,
	BookOpenCheck,
	Building2,
	ClipboardCheck,
	FileClock,
	FilePlus2,
	FlaskConical,
	FolderKanban,
	Gavel,
	History,
	Lightbulb,
	LockKeyhole,
	Network,
	Settings,
	ShieldCheck,
	Users,
} from "lucide-react";

export type DashboardRole =
	| "lecturer"
	| "department-admin"
	| "faculty-admin"
	| "iptto-officer"
	| "super-admin";

export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

export type StatCardData = {
	label: string;
	value: string;
	trend: string;
	icon: LucideIcon;
	tone: StatusTone;
};

export type DashboardRow = {
	id: string;
	title: string;
	owner: string;
	department: string;
	date: string;
	type: string;
	status: string;
	tone: StatusTone;
};

export type DashboardWorkspace = {
	role: DashboardRole;
	title: string;
	description: string;
	persona: string;
	primaryAction: string;
	secondaryAction: string;
	stats: Array<StatCardData>;
	filters: Array<string>;
	tabs: Array<string>;
	rows: Array<DashboardRow>;
	emptyTitle: string;
	emptyText: string;
	emptyAction: string;
	quickActions: Array<{ label: string; icon: LucideIcon }>;
	sections: Array<{ title: string; text: string; icon: LucideIcon }>;
};

export const roleLabels: Record<DashboardRole, string> = {
	lecturer: "Lecturer",
	"department-admin": "Department Admin",
	"faculty-admin": "Faculty Admin",
	"iptto-officer": "IPTTO Officer",
	"super-admin": "Super Admin",
};

export const dashboardNav: Array<{
	label: string;
	href: string;
	icon: LucideIcon;
	role: DashboardRole;
}> = [
	{
		label: "Lecturer",
		href: "/dashboard/lecturer",
		icon: BookOpenCheck,
		role: "lecturer",
	},
	{
		label: "Department",
		href: "/dashboard/department-admin",
		icon: Building2,
		role: "department-admin",
	},
	{
		label: "Faculty",
		href: "/dashboard/faculty-admin",
		icon: Network,
		role: "faculty-admin",
	},
	{
		label: "IPTTO",
		href: "/dashboard/iptto-officer",
		icon: Lightbulb,
		role: "iptto-officer",
	},
	{
		label: "Super Admin",
		href: "/dashboard/super-admin",
		icon: ShieldCheck,
		role: "super-admin",
	},
];

const sharedRows: Array<DashboardRow> = [
	{
		id: "OAU-RR-2401",
		title: "Smart irrigation for cassava farms",
		owner: "Dr. A. Adeyemi",
		department: "Agricultural Engineering",
		date: "30 Jul 2026",
		type: "Journal Article",
		status: "Department Review",
		tone: "warning",
	},
	{
		id: "OAU-RR-2398",
		title: "Clinical data model for community triage",
		owner: "Prof. K. Bello",
		department: "Medicine",
		date: "28 Jul 2026",
		type: "Technical Report",
		status: "Published",
		tone: "success",
	},
	{
		id: "OAU-RR-2387",
		title: "Low-cost solar drying chamber",
		owner: "Dr. T. Okafor",
		department: "Mechanical Engineering",
		date: "25 Jul 2026",
		type: "Innovation",
		status: "IPTTO Review",
		tone: "info",
	},
	{
		id: "OAU-RR-2379",
		title: "Language preservation corpus",
		owner: "Dr. S. Adebayo",
		department: "Linguistics",
		date: "22 Jul 2026",
		type: "Dataset",
		status: "Needs Changes",
		tone: "danger",
	},
];

export const workspaces: Record<DashboardRole, DashboardWorkspace> = {
	lecturer: {
		role: "lecturer",
		title: "Lecturer Workspace",
		description:
			"Track research submissions, drafts, uploads, review status, and profile completeness.",
		persona: "Dr. A. Adeyemi",
		primaryAction: "Submit Research",
		secondaryAction: "Upload Files",
		stats: [
			{
				label: "Active Submissions",
				value: "18",
				trend: "+4 this month",
				icon: FileClock,
				tone: "info",
			},
			{
				label: "Draft Records",
				value: "6",
				trend: "2 ready to submit",
				icon: Archive,
				tone: "neutral",
			},
			{
				label: "Published Outputs",
				value: "42",
				trend: "+18% this year",
				icon: BadgeCheck,
				tone: "success",
			},
			{
				label: "Profile Complete",
				value: "86%",
				trend: "Add ORCID next",
				icon: Users,
				tone: "warning",
			},
		],
		filters: ["All records", "Draft", "Submitted", "Needs changes"],
		tabs: ["Submissions", "Drafts", "Review status", "Upload history"],
		rows: sharedRows,
		emptyTitle: "No draft research yet",
		emptyText:
			"Start a record and attach metadata before sending it to review.",
		emptyAction: "Create Draft",
		quickActions: [
			{ label: "New research record", icon: FilePlus2 },
			{ label: "Update profile", icon: Users },
			{ label: "View upload history", icon: History },
		],
		sections: [
			{
				title: "Researcher Profile Summary",
				text: "Public profile, research interests, ORCID, publications, and department affiliation are ready for review.",
				icon: Users,
			},
			{
				title: "Review Status",
				text: "Department, faculty, IPTTO, approval, rejection, and publication states are tracked from this workspace.",
				icon: ClipboardCheck,
			},
		],
	},
	"department-admin": {
		role: "department-admin",
		title: "Department Review Queue",
		description:
			"Review lecturer submissions, leave comments, approve records, and monitor departmental output.",
		persona: "Department Administrator",
		primaryAction: "Review Queue",
		secondaryAction: "Export Comments",
		stats: [
			{
				label: "Pending Review",
				value: "24",
				trend: "7 over SLA",
				icon: ClipboardCheck,
				tone: "warning",
			},
			{
				label: "Approved This Week",
				value: "16",
				trend: "+5 from last week",
				icon: BadgeCheck,
				tone: "success",
			},
			{
				label: "Researchers",
				value: "58",
				trend: "9 incomplete profiles",
				icon: Users,
				tone: "info",
			},
			{
				label: "Department Outputs",
				value: "412",
				trend: "+31 this quarter",
				icon: BarChart3,
				tone: "success",
			},
		],
		filters: ["All departments", "Pending", "Approved", "Rejected"],
		tabs: ["Queue", "Comments", "Statistics", "Researchers"],
		rows: sharedRows.filter((row) => row.status !== "Published"),
		emptyTitle: "No submissions awaiting department action",
		emptyText:
			"New lecturer submissions will appear here for review and comments.",
		emptyAction: "Refresh Queue",
		quickActions: [
			{ label: "Approve selected", icon: BadgeCheck },
			{ label: "Request changes", icon: ClipboardCheck },
			{ label: "View researchers", icon: Users },
		],
		sections: [
			{
				title: "Department Statistics",
				text: "Submission volume, approval speed, active researchers, and publication output for the department.",
				icon: BarChart3,
			},
			{
				title: "Review Comments",
				text: "Approval notes and revision requests are organized against the selected submission queue.",
				icon: ClipboardCheck,
			},
		],
	},
	"faculty-admin": {
		role: "faculty-admin",
		title: "Faculty Administration",
		description:
			"Coordinate faculty review queues, cross-department output, approval actions, and reports.",
		persona: "Faculty Administrator",
		primaryAction: "Open Faculty Queue",
		secondaryAction: "Generate Report",
		stats: [
			{
				label: "Faculty Queue",
				value: "37",
				trend: "11 high priority",
				icon: FolderKanban,
				tone: "warning",
			},
			{
				label: "Departments",
				value: "9",
				trend: "All reporting",
				icon: Building2,
				tone: "success",
			},
			{
				label: "Monthly Output",
				value: "128",
				trend: "+22% from June",
				icon: BarChart3,
				tone: "info",
			},
			{
				label: "Approval Actions",
				value: "64",
				trend: "18 escalated",
				icon: BadgeCheck,
				tone: "neutral",
			},
		],
		filters: [
			"All faculties",
			"By department",
			"Awaiting approval",
			"Escalated",
		],
		tabs: ["Review queue", "Reports", "Departments", "Approvals"],
		rows: sharedRows,
		emptyTitle: "No faculty records match these filters",
		emptyText:
			"Clear filters or switch departments to inspect another review queue.",
		emptyAction: "Clear Filters",
		quickActions: [
			{ label: "Approve faculty batch", icon: BadgeCheck },
			{ label: "Compare departments", icon: Network },
			{ label: "Export report", icon: BarChart3 },
		],
		sections: [
			{
				title: "Cross-Department Output",
				text: "Publication and innovation volume by department, output type, and review stage.",
				icon: Network,
			},
			{
				title: "Faculty Reports",
				text: "Monthly and quarterly reports prepared for academic leadership review.",
				icon: BarChart3,
			},
		],
	},
	"iptto-officer": {
		role: "iptto-officer",
		title: "IPTTO Review Desk",
		description:
			"Manage innovation records, patents, commercialization activity, reviews, and supporting files.",
		persona: "IPTTO Officer",
		primaryAction: "New Innovation",
		secondaryAction: "Patent Register",
		stats: [
			{
				label: "Innovations",
				value: "52",
				trend: "8 under review",
				icon: Lightbulb,
				tone: "info",
			},
			{
				label: "Patent Files",
				value: "19",
				trend: "3 filing soon",
				icon: Gavel,
				tone: "warning",
			},
			{
				label: "Commercial Leads",
				value: "11",
				trend: "4 active talks",
				icon: FlaskConical,
				tone: "success",
			},
			{
				label: "Supporting Files",
				value: "184",
				trend: "R2 metadata pending",
				icon: Archive,
				tone: "neutral",
			},
		],
		filters: ["All IPTTO records", "Innovation", "Patent", "Commercialization"],
		tabs: ["Innovations", "Patents", "Reviews", "Supporting files"],
		rows: [
			{
				id: "IPTTO-INN-014",
				title: "Low-cost solar drying chamber",
				owner: "Dr. T. Okafor",
				department: "Mechanical Engineering",
				date: "30 Jul 2026",
				type: "Innovation",
				status: "Prior Art Review",
				tone: "info",
			},
			{
				id: "IPTTO-PAT-009",
				title: "Cassava irrigation control assembly",
				owner: "Dr. A. Adeyemi",
				department: "Agricultural Engineering",
				date: "27 Jul 2026",
				type: "Patent",
				status: "Filing Soon",
				tone: "warning",
			},
			{
				id: "IPTTO-COM-006",
				title: "Solar dryer licensing discussion",
				owner: "IPTTO Desk",
				department: "Technology Transfer",
				date: "24 Jul 2026",
				type: "Commercialization",
				status: "Active Lead",
				tone: "success",
			},
		],
		emptyTitle: "No IPTTO records in this view",
		emptyText:
			"Innovation, patent, and commercialization records will be shown here.",
		emptyAction: "Add Innovation",
		quickActions: [
			{ label: "Review innovation queue", icon: Lightbulb },
			{ label: "Record patent", icon: Gavel },
			{ label: "Log commercialization", icon: FlaskConical },
		],
		sections: [
			{
				title: "Commercialization Activity",
				text: "Licensing conversations, partnerships, spinouts, and commercialization milestones under active tracking.",
				icon: FlaskConical,
			},
			{
				title: "IPTTO Reviews",
				text: "Review outcomes, prior art notes, supporting file checks, and publication readiness decisions.",
				icon: ClipboardCheck,
			},
		],
	},
	"super-admin": {
		role: "super-admin",
		title: "System Administration",
		description:
			"Manage users, roles, permissions, faculties, departments, settings, audit logs, and failed jobs.",
		persona: "Super Administrator",
		primaryAction: "Invite User",
		secondaryAction: "Audit Logs",
		stats: [
			{
				label: "Users",
				value: "486",
				trend: "22 pending setup",
				icon: Users,
				tone: "info",
			},
			{
				label: "Roles",
				value: "6",
				trend: "Central policy",
				icon: LockKeyhole,
				tone: "neutral",
			},
			{
				label: "Faculties",
				value: "13",
				trend: "96 departments",
				icon: Building2,
				tone: "success",
			},
			{
				label: "Failed Jobs",
				value: "5",
				trend: "Needs inspection",
				icon: Settings,
				tone: "danger",
			},
		],
		filters: ["All system areas", "Users", "Permissions", "Failed jobs"],
		tabs: [
			"Users",
			"Roles",
			"Faculties",
			"Departments",
			"Audit logs",
			"Settings",
		],
		rows: [
			{
				id: "USR-1024",
				title: "Faculty reviewer access request",
				owner: "Dr. M. Salami",
				department: "Faculty of Technology",
				date: "30 Jul 2026",
				type: "Permission",
				status: "Pending",
				tone: "warning",
			},
			{
				id: "JOB-0881",
				title: "Keyword extraction retry",
				owner: "Background worker",
				department: "System",
				date: "30 Jul 2026",
				type: "Failed Job",
				status: "Failed",
				tone: "danger",
			},
		],
		emptyTitle: "No administrative records found",
		emptyText:
			"System users, permissions, audit logs, and failed jobs appear here.",
		emptyAction: "Reset View",
		quickActions: [
			{ label: "Invite user", icon: Users },
			{ label: "Manage roles", icon: LockKeyhole },
			{ label: "Inspect failed jobs", icon: Settings },
		],
		sections: [
			{
				title: "Roles and Permissions",
				text: "Role policies, permission assignments, and access review actions for institutional administration.",
				icon: LockKeyhole,
			},
			{
				title: "Audit Trail",
				text: "Administrative events, failed jobs, and security activity will be inspected from this area.",
				icon: History,
			},
		],
	},
};
