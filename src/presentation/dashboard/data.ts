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
	Gavel,
	History,
	Lightbulb,
	LockKeyhole,
	Network,
	Settings,
	ShieldCheck,
	Users,
} from "lucide-react";

import type { DashboardDestination } from "#/application/dashboard-workspaces.ts";

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
	"department-admin": "Department Administrator",
	"faculty-admin": "Faculty Administrator",
	"iptto-officer": "IPTTO Officer",
	"super-admin": "Super Administrator",
};

export const dashboardNav: Array<{
	label: string;
	href: DashboardDestination;
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
		status: "With department reviewer",
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
		status: "With IPTTO",
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
		title: "My Research",
		description:
			"Add your research, see what needs attention, and follow its progress to publication.",
		persona: "Dr. A. Adeyemi",
		primaryAction: "Add Research",
		secondaryAction: "Add a Document",
		stats: [
			{
				label: "Being Reviewed",
				value: "18",
				trend: "+4 this month",
				icon: FileClock,
				tone: "info",
			},
			{
				label: "Unfinished Research",
				value: "6",
				trend: "2 ready to submit",
				icon: Archive,
				tone: "neutral",
			},
			{
				label: "Published Research",
				value: "42",
				trend: "+18% this year",
				icon: BadgeCheck,
				tone: "success",
			},
			{
				label: "Profile Complete",
				value: "86%",
				trend: "Add your ORCID researcher ID next",
				icon: Users,
				tone: "warning",
			},
		],
		filters: ["All research", "Unfinished", "In review", "Needs changes"],
		tabs: ["My research", "Unfinished", "Review progress", "Documents"],
		rows: sharedRows,
		emptyTitle: "No draft research yet",
		emptyText:
			"Add the research title and details now. You can finish and send it for review later.",
		emptyAction: "Add Research",
		quickActions: [
			{ label: "Add new research", icon: FilePlus2 },
			{ label: "Update profile", icon: Users },
			{ label: "View my documents", icon: History },
		],
		sections: [
			{
				title: "Your Public Profile",
				text: "Check how your name, research interests, ORCID researcher ID, publications, and department will appear to visitors.",
				icon: Users,
			},
			{
				title: "What Happens Next",
				text: "See who is reviewing your research, whether changes are needed, and when it becomes public.",
				icon: ClipboardCheck,
			},
		],
	},
	"department-admin": {
		role: "department-admin",
		title: "Department Research Review",
		description:
			"Check research from your department, give clear feedback, and approve work that is ready.",
		persona: "Department Administrator",
		primaryAction: "Review Research",
		secondaryAction: "Download Feedback",
		stats: [
			{
				label: "Needs Your Review",
				value: "24",
				trend: "7 are overdue",
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
				label: "Department Research",
				value: "412",
				trend: "+31 this quarter",
				icon: BarChart3,
				tone: "success",
			},
		],
		filters: ["All departments", "Needs review", "Approved", "Not approved"],
		tabs: ["Needs review", "Feedback", "Department summary", "Researchers"],
		rows: sharedRows.filter((row) => row.status !== "Published"),
		emptyTitle: "No submissions awaiting department action",
		emptyText:
			"New lecturer submissions will appear here for review and comments.",
		emptyAction: "Check Again",
		quickActions: [
			{ label: "Approve selected", icon: BadgeCheck },
			{ label: "Request changes", icon: ClipboardCheck },
			{ label: "View researchers", icon: Users },
		],
		sections: [
			{
				title: "Department at a Glance",
				text: "See how much research the department submits and publishes, and how quickly reviews are completed.",
				icon: BarChart3,
			},
			{
				title: "Feedback to Lecturers",
				text: "View the comments and requested changes for each piece of research.",
				icon: ClipboardCheck,
			},
		],
	},
	"faculty-admin": {
		role: "faculty-admin",
		title: "Faculty Administration",
		description:
			"Manage departments, assign department administrators, and monitor faculty structure.",
		persona: "Faculty Administrator",
		primaryAction: "Manage Departments",
		secondaryAction: "Assign Admins",
		stats: [
			{
				label: "Departments",
				value: "9",
				trend: "All reporting",
				icon: Building2,
				tone: "success",
			},
			{
				label: "Faculty Users",
				value: "128",
				trend: "Across departments",
				icon: BarChart3,
				tone: "info",
			},
			{
				label: "Department Admins",
				value: "64",
				trend: "Assigned reviewers",
				icon: BadgeCheck,
				tone: "neutral",
			},
		],
		filters: ["All faculties", "By department", "Admins", "Lecturers"],
		tabs: ["Departments", "Users", "Administrators"],
		rows: sharedRows,
		emptyTitle: "No faculty records match these filters",
		emptyText:
			"Clear the filters or choose another department to see more users.",
		emptyAction: "Clear Filters",
		quickActions: [
			{ label: "Manage departments", icon: Building2 },
			{ label: "Assign department admins", icon: BadgeCheck },
			{ label: "View users", icon: Users },
		],
		sections: [
			{
				title: "Department Structure",
				text: "Keep faculty departments current and aligned with administrator assignments.",
				icon: Network,
			},
			{
				title: "Faculty Users",
				text: "Track lecturers and department administrators attached to the faculty.",
				icon: BarChart3,
			},
		],
	},
	"iptto-officer": {
		role: "iptto-officer",
		title: "Innovations and Patents",
		description:
			"Help promising ideas move from research to protection, partnership, and real-world use.",
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
				label: "Patents",
				value: "19",
				trend: "3 filing soon",
				icon: Gavel,
				tone: "warning",
			},
			{
				label: "Commercial Opportunities",
				value: "11",
				trend: "4 active talks",
				icon: FlaskConical,
				tone: "success",
			},
			{
				label: "Documents",
				value: "184",
				trend: "12 need details",
				icon: Archive,
				tone: "neutral",
			},
		],
		filters: [
			"Everything",
			"Innovations",
			"Patents",
			"Commercial opportunities",
		],
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
		emptyTitle: "Nothing to show here yet",
		emptyText:
			"Innovations, patents, and commercial opportunities will appear here.",
		emptyAction: "Add Innovation",
		quickActions: [
			{ label: "Review new innovations", icon: Lightbulb },
			{ label: "Record patent", icon: Gavel },
			{ label: "Add commercial activity", icon: FlaskConical },
		],
		sections: [
			{
				title: "Commercialization Activity",
				text: "Keep track of licensing conversations, partnerships, spinouts, and important next steps.",
				icon: FlaskConical,
			},
			{
				title: "IPTTO Reviews",
				text: "See review decisions, similar inventions found, supporting documents, and next steps.",
				icon: ClipboardCheck,
			},
		],
	},
	"super-admin": {
		role: "super-admin",
		title: "Manage the Platform",
		description:
			"Approve accounts, manage access, update faculties and departments, and keep the platform running smoothly.",
		persona: "Super Administrator",
		primaryAction: "Invite User",
		secondaryAction: "Activity History",
		stats: [
			{
				label: "Users",
				value: "486",
				trend: "22 pending setup",
				icon: Users,
				tone: "info",
			},
			{
				label: "Access Groups",
				value: "6",
				trend: "Controls what people can do",
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
				label: "Tasks Needing Attention",
				value: "5",
				trend: "Needs inspection",
				icon: Settings,
				tone: "danger",
			},
		],
		filters: ["Everything", "People", "Access", "Needs attention"],
		tabs: [
			"Users",
			"Access",
			"Faculties",
			"Departments",
			"Activity history",
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
				title: "Search words could not be prepared",
				owner: "Automatic task",
				department: "Platform",
				date: "30 Jul 2026",
				type: "Needs Attention",
				status: "Not Completed",
				tone: "danger",
			},
		],
		emptyTitle: "Nothing needs attention",
		emptyText:
			"Account requests, access changes, platform activity, and tasks needing attention will appear here.",
		emptyAction: "Show Everything",
		quickActions: [
			{ label: "Invite user", icon: Users },
			{ label: "Manage access", icon: LockKeyhole },
			{ label: "View tasks needing attention", icon: Settings },
		],
		sections: [
			{
				title: "Who Can Do What",
				text: "Choose which parts of the platform each person can view or manage.",
				icon: LockKeyhole,
			},
			{
				title: "Platform Activity",
				text: "Review important account changes, incomplete automatic tasks, and sign-in activity.",
				icon: History,
			},
		],
	},
};
