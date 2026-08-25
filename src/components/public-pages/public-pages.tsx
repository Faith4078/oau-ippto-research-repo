"use client";

import {
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	BookOpen,
	Building2,
	CalendarDays,
	ChartNoAxesCombined,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	CircleHelp,
	Download,
	FileSearch,
	Filter,
	FlaskConical,
	GraduationCap,
	LayoutDashboard,
	Lightbulb,
	LogOut,
	Mail,
	MapPin,
	Menu,
	Newspaper,
	Phone,
	Scale,
	Search,
	SlidersHorizontal,
	Users,
	X,
} from "lucide-react";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";

import { signOutAndRedirectHome } from "#/lib/sign-out.ts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const siteName = "OAU IPTTO Research Repository";
const baseUrl = "https://research.oauife.edu.ng";

type PublicIcon = ComponentType<{ className?: string }>;
type SchemaType =
	| "WebPage"
	| "CollectionPage"
	| "FAQPage"
	| "ContactPage"
	| "ScholarlyArticle"
	| "Person"
	| "Organization"
	| "CreativeWork";

type PageSeo = {
	title: string;
	description: string;
	path: string;
	schemaType?: SchemaType;
};

export type CardItem = {
	title: string;
	meta: string;
	description: string;
	href?: string;
	tags: Array<string>;
};

type StatItem = {
	label: string;
	value: string;
};

type CollectionConfig = {
	seo: PageSeo;
	eyebrow: string;
	title: string;
	description: string;
	icon: PublicIcon;
	searchPlaceholder: string;
	filterLabel: string;
	sortLabel: string;
	stats: Array<StatItem>;
	items: Array<CardItem>;
	sidebarTitle: string;
	sidebarItems: Array<string>;
	emptyTitle: string;
	emptyText: string;
	resultLabel: string;
};

type DetailConfig = {
	seo: PageSeo;
	eyebrow: string;
	title: string;
	description: string;
	icon: PublicIcon;
	sections: Array<{ title: string; body: string }>;
	facts: Array<{ label: string; value: string }>;
	related: Array<CardItem>;
	backHref: string;
	backLabel: string;
	paramLabel: string;
	actions: Array<{ label: string; href: string; icon: PublicIcon }>;
};

const navLinks = [
	{ label: "Public Research", href: "/research" },
	{ label: "Researchers", href: "/researchers" },
	{ label: "Publications", href: "/publications" },
	{ label: "Departments", href: "/departments" },
	{ label: "Faculties", href: "/faculties" },
	{ label: "Research Areas", href: "/research-areas" },
	{ label: "Innovations", href: "/innovations" },
	{ label: "Patents", href: "/patents" },
	{ label: "Reports", href: "/reports" },
];

const staffAccessLinks = [
	{ label: "Lecturer sign up", href: "/sign-up/lecturer" },
	{ label: "IPTTO sign up", href: "/sign-up/iptto" },
];

const publicLinks = [
	{ label: "Find Research", href: "/research" },
	{ label: "Researchers", href: "/researchers" },
	{ label: "Publications", href: "/publications" },
	{ label: "Departments", href: "/departments" },
	{ label: "Faculties", href: "/faculties" },
	{ label: "Research Areas", href: "/research-areas" },
	{ label: "Innovations", href: "/innovations" },
	{ label: "Patents", href: "/patents" },
	{ label: "Reports", href: "/reports" },
	{ label: "News", href: "/news" },
	{ label: "FAQ", href: "/faq" },
	{ label: "Contact", href: "/contact" },
];

const sharedStats = [
	{ value: "12k", label: "Research works" },
	{ value: "380", label: "Researchers" },
	{ value: "96", label: "Departments" },
];

export const pageSeo = {
	research: {
		title: "Find Research | OAU IPTTO",
		description:
			"Search and filter public research outputs from Obafemi Awolowo University by keyword, department, faculty, year, type, and research area.",
		path: "/research",
		schemaType: "CollectionPage",
	},
	researchDetail: {
		title: "Research Details | OAU IPTTO",
		description:
			"Read the summary, see the authors, download available documents, and find related research.",
		path: "/research/demo-record",
		schemaType: "ScholarlyArticle",
	},
	researchers: {
		title: "Researchers Directory | OAU IPTTO Research Repository",
		description:
			"Discover public researcher profiles, expertise, departments, publications, metrics, and collaboration interests at Obafemi Awolowo University.",
		path: "/researchers",
		schemaType: "CollectionPage",
	},
	researcherProfile: {
		title: "Researcher Profile | OAU IPTTO Research Repository",
		description:
			"View a public researcher profile with biography, interests, publications, metrics, department, faculty, and contact details.",
		path: "/researchers/demo-profile",
		schemaType: "Person",
	},
	publications: {
		title: "Publications | OAU IPTTO Research Repository",
		description:
			"Browse journal articles, conference papers, books, book chapters, technical reports, theses, dissertations, and working papers.",
		path: "/publications",
		schemaType: "CollectionPage",
	},
	departments: {
		title: "Departments | OAU IPTTO Research Repository",
		description:
			"Explore departments, researchers, research outputs, innovations, patents, and public statistics across Obafemi Awolowo University.",
		path: "/departments",
		schemaType: "CollectionPage",
	},
	departmentDetail: {
		title: "Department Profile | OAU IPTTO Research Repository",
		description:
			"View a public department profile with researchers, research outputs, innovations, patents, and statistics.",
		path: "/departments/demo-department",
		schemaType: "Organization",
	},
	faculties: {
		title: "Faculties | OAU IPTTO Research Repository",
		description:
			"Browse faculties and discover their departments, researchers, outputs, innovations, patents, and research statistics.",
		path: "/faculties",
		schemaType: "CollectionPage",
	},
	facultyDetail: {
		title: "Faculty Profile | OAU IPTTO Research Repository",
		description:
			"View a public faculty profile with departments, researchers, outputs, and institutional research statistics.",
		path: "/faculties/demo-faculty",
		schemaType: "Organization",
	},
	researchAreas: {
		title: "Research Areas | OAU IPTTO Research Repository",
		description:
			"Choose a research area to find relevant work across OAU departments and faculties.",
		path: "/research-areas",
		schemaType: "CollectionPage",
	},
	innovations: {
		title: "Innovation Showcase | OAU IPTTO Research Repository",
		description:
			"Explore OAU innovations, the research behind them, their current stage, and possible uses.",
		path: "/innovations",
		schemaType: "CollectionPage",
	},
	innovationDetail: {
		title: "Innovation Detail | OAU IPTTO Research Repository",
		description:
			"See what an innovation does, the research behind it, its current stage, and possible uses.",
		path: "/innovations/demo-innovation",
		schemaType: "CreativeWork",
	},
	patents: {
		title: "Patents | OAU IPTTO Research Repository",
		description:
			"Find OAU patents by inventor, research area, filing stage, or possible use.",
		path: "/patents",
		schemaType: "CollectionPage",
	},
	patentDetail: {
		title: "Patent Detail | OAU IPTTO Research Repository",
		description:
			"See who created an invention, what it does, its filing stage, and how it may be used.",
		path: "/patents/demo-patent",
		schemaType: "CreativeWork",
	},
	reports: {
		title: "Reports and Statistics | OAU IPTTO Research Repository",
		description:
			"See public figures and trends for OAU research, innovations, patents, and partnerships.",
		path: "/reports",
		schemaType: "CollectionPage",
	},
	news: {
		title: "News and Events | OAU IPTTO Research Repository",
		description:
			"Read public news, events, calls, workshops, and announcements from the OAU IPTTO research repository.",
		path: "/news",
		schemaType: "CollectionPage",
	},
	faq: {
		title: "FAQ | OAU IPTTO Research Repository",
		description:
			"Get quick answers about finding research, managing your profile, adding work, innovations, and patents.",
		path: "/faq",
		schemaType: "FAQPage",
	},
	contact: {
		title: "Contact | OAU IPTTO Research Repository",
		description:
			"Contact OAU IPTTO for help finding research, correcting information, or discussing a partnership.",
		path: "/contact",
		schemaType: "ContactPage",
	},
} satisfies Record<string, PageSeo>;

export function publicHead(seo: PageSeo) {
	const canonical = `${baseUrl}${seo.path}`;

	return {
		meta: [
			{ title: seo.title },
			{ name: "description", content: seo.description },
			{ property: "og:title", content: seo.title },
			{ property: "og:description", content: seo.description },
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: canonical },
			{ property: "og:site_name", content: siteName },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: seo.title },
			{ name: "twitter:description", content: seo.description },
		],
		links: [{ rel: "canonical", href: canonical }],
		scripts: [
			{
				type: "application/ld+json",
				children: JSON.stringify({
					"@context": "https://schema.org",
					"@type": seo.schemaType ?? "WebPage",
					name: seo.title,
					description: seo.description,
					url: canonical,
					isPartOf: {
						"@type": "WebSite",
						name: siteName,
						url: baseUrl,
						potentialAction: {
							"@type": "SearchAction",
							target: `${baseUrl}/research?q={search_term_string}`,
							"query-input": "required name=search_term_string",
						},
					},
					publisher: {
						"@type": "CollegeOrUniversity",
						name: "Obafemi Awolowo University",
						url: "https://oauife.edu.ng",
					},
				}),
			},
		],
	};
}

export const collectionPages = {
	research: collection(
		pageSeo.research,
		"OAU Research",
		"Find OAU Research",
		"Search by topic, title, researcher, faculty, department, year, or type.",
		FileSearch,
		"Search by title, author, keyword, or abstract",
		"Faculty or department",
		"Newest first",
		[
			{ value: "12k", label: "Research works" },
			{ value: "54", label: "Research areas" },
			{ value: "7", label: "Publication types" },
		],
		[
			card(
				"Smart energy systems for resilient communities",
				"Renewable Energy | Faculty of Technology | 2026",
				"Applied work on cleaner power distribution, rural access, and resilient infrastructure planning.",
				"/research/smart-energy-systems",
				["Energy", "Engineering", "Open access"],
			),
			card(
				"Public health intelligence for community response",
				"Medicine | College of Health Sciences | 2025",
				"Clinical and data-driven research supporting faster public health decisions and policy planning.",
				"/research/public-health-intelligence",
				["Medicine", "Data", "Citation ready"],
			),
			card(
				"Climate-smart crop systems for food security",
				"Agriculture | Faculty of Agriculture | 2024",
				"Field-tested research connecting agronomy, local productivity, and sustainable food systems.",
				"/research/climate-smart-crops",
				["Agriculture", "Climate", "Document available"],
			),
		],
		"Filters",
		[
			"Keyword search",
			"Faculty",
			"Department",
			"Researcher",
			"Year",
			"Publication type",
			"Access level",
		],
		"No research matches your search",
		"Try a broader keyword, clear one selected filter, or review related research areas.",
		"3 results",
	),
	researchers: collection(
		pageSeo.researchers,
		"Researchers Directory",
		"Find Experts Across the University",
		"Discover researchers by name, discipline, department, faculty, interest, and public collaboration focus.",
		Users,
		"Search researchers, interests, or departments",
		"Research interest",
		"Most publications",
		[
			{ value: "380", label: "Profiles" },
			{ value: "96", label: "Departments" },
			{ value: "28", label: "Industry links" },
		],
		[
			card(
				"Prof. Amina Adebayo",
				"Department of Electrical and Electronic Engineering",
				"Works on renewable power systems, grid intelligence, and energy access for underserved communities.",
				"/researchers/amina-adebayo",
				["Energy", "Smart grid", "Faculty of Technology"],
			),
			card(
				"Dr. Tunde Ogunleye",
				"Department of Community Health",
				"Focuses on public health analytics, epidemiology, and health systems strengthening.",
				"/researchers/tunde-ogunleye",
				["Medicine", "Public health", "Data science"],
			),
			card(
				"Dr. Kemi Fasina",
				"Department of Crop Production and Protection",
				"Researches climate-smart agriculture, crop resilience, and farmer-centred innovation.",
				"/researchers/kemi-fasina",
				["Agriculture", "Climate", "Food security"],
			),
		],
		"Profile fields",
		[
			"Biography",
			"Research interests",
			"Publications",
			"At a glance",
			"Department",
			"Faculty",
			"Public contact details",
		],
		"No researcher profiles match this search",
		"Try a different name, department, faculty, or research interest.",
		"3 researcher profiles",
	),
	publications: collection(
		pageSeo.publications,
		"Publications",
		"Browse Publications",
		"Find journal articles, conference papers, books, reports, theses, dissertations, and working papers.",
		BookOpen,
		"Search publications by title, author, journal, or keyword",
		"Publication type",
		"Most cited",
		[
			{ value: "8.4k", label: "Journal articles" },
			{ value: "2.1k", label: "Conference papers" },
			{ value: "1.5k", label: "Other publications" },
		],
		[
			card(
				"Journal article on sustainable microgrid optimisation",
				"Journal Article | 2026 | Open access",
				"See the authors, publication details, search words, and available document.",
				"/research/sustainable-microgrid-optimisation",
				["Journal article", "Engineering", "Energy"],
			),
			card(
				"Conference paper on AI-assisted clinical triage",
				"Conference Paper | 2025 | Abstract available",
				"Conference paper connecting health research, machine learning, and public policy.",
				"/research/ai-clinical-triage",
				["Conference paper", "AI", "Medicine"],
			),
			card(
				"Technical report on regional food systems resilience",
				"Technical Report | 2024 | Document available",
				"Public report prepared for stakeholders in agriculture, development planning, and local industry.",
				"/research/food-systems-resilience",
				["Technical report", "Agriculture", "Policy"],
			),
		],
		"Publication types",
		[
			"Journal articles",
			"Conference papers",
			"Books",
			"Book chapters",
			"Technical reports",
			"Theses and dissertations",
			"Working papers",
		],
		"No publications match these criteria",
		"Change the publication type, year, author, or keyword to broaden the list.",
		"3 publications",
	),
	departments: collection(
		pageSeo.departments,
		"Departments",
		"Explore Research by Department",
		"Choose a department to see its researchers, publications, innovations, patents, and key figures.",
		Building2,
		"Search departments, faculties, publications, or subjects",
		"Faculty",
		"Most publications",
		sharedStats,
		[
			card(
				"Electrical and Electronic Engineering",
				"Faculty of Technology",
				"Research in energy systems, telecommunications, embedded systems, controls, and applied electronics.",
				"/departments/electrical-electronic-engineering",
				["124 researchers", "892 research works", "11 patents"],
			),
			card(
				"Community Health",
				"College of Health Sciences",
				"Public health research, health systems, epidemiology, community intervention, and policy translation.",
				"/departments/community-health",
				["61 researchers", "744 research works", "6 innovations"],
			),
			card(
				"Crop Production and Protection",
				"Faculty of Agriculture",
				"Crop systems, pest management, climate adaptation, seed systems, and food security research.",
				"/departments/crop-production-protection",
				["58 researchers", "618 research works", "9 innovations"],
			),
		],
		"Department profile includes",
		["Researchers", "Research", "Innovations", "Patents", "Key figures"],
		"No departments found",
		"Try searching by faculty name, department name, or research strength.",
		"3 departments",
	),
	faculties: collection(
		pageSeo.faculties,
		"Faculties",
		"Discover Faculty Research Strengths",
		"Choose a faculty to see its departments, researchers, publications, and innovations.",
		GraduationCap,
		"Search faculties, departments, or research areas",
		"Research strength",
		"Most departments",
		[
			{ value: "13", label: "Faculties" },
			{ value: "96", label: "Departments" },
			{ value: "12k", label: "Research works" },
		],
		[
			card(
				"Faculty of Technology",
				"Engineering, systems, infrastructure, and applied design",
				"Home to departments advancing energy, computing, materials, civil systems, and industrial technology.",
				"/faculties/technology",
				["12 departments", "3.2k research works", "26 patents"],
			),
			card(
				"College of Health Sciences",
				"Clinical research, public health, and biomedical discovery",
				"Supports research across health systems, medicine, public health, and biomedical sciences.",
				"/faculties/health-sciences",
				["8 departments", "2.7k research works", "18 innovations"],
			),
			card(
				"Faculty of Agriculture",
				"Food systems, production, resilience, and rural innovation",
				"Connects field research, agribusiness, food security, and sustainable agricultural technology.",
				"/faculties/agriculture",
				["7 departments", "1.9k research works", "14 innovations"],
			),
		],
		"Faculty profile includes",
		[
			"Departments",
			"Researchers",
			"Research",
			"Statistics",
			"Innovation activity",
		],
		"No faculties match this view",
		"Try searching by faculty, department, or research area.",
		"3 faculties",
	),
	researchAreas: collection(
		pageSeo.researchAreas,
		"Research Areas",
		"Start Discovery by Discipline",
		"Choose a subject to find related research across OAU departments and faculties.",
		FlaskConical,
		"Search research areas or keywords",
		"Faculty cluster",
		"Most active",
		[
			{ value: "54", label: "Areas" },
			{ value: "190", label: "Keywords" },
			{ value: "12k", label: "Related research" },
		],
		[
			card(
				"Artificial Intelligence and Data Science",
				"Cross-faculty research area",
				"Methods, applications, and responsible systems spanning health, agriculture, engineering, and education.",
				"/research?area=artificial-intelligence",
				["Filtered research", "AI", "Data"],
			),
			card(
				"Renewable Energy and Infrastructure",
				"Technology and environmental systems",
				"Research on clean power, resilient infrastructure, energy access, and applied systems design.",
				"/research?area=renewable-energy",
				["Filtered research", "Energy", "Infrastructure"],
			),
			card(
				"Food Security and Sustainable Agriculture",
				"Agriculture and social impact",
				"Research supporting crop resilience, productivity, rural livelihoods, and food systems policy.",
				"/research?area=food-security",
				["Filtered research", "Agriculture", "Policy"],
			),
		],
		"Area links",
		[
			"Artificial intelligence",
			"Cybersecurity",
			"Renewable energy",
			"Environmental science",
			"Medicine",
			"Education",
			"Humanities",
		],
		"No research areas match this search",
		"Try a broader discipline, keyword, or faculty cluster.",
		"3 research areas",
	),
	innovations: collection(
		pageSeo.innovations,
		"Innovation Showcase",
		"Explore OAU Innovations",
		"See what each innovation does, who created it, its current stage, and where it could be used.",
		Lightbulb,
		"Search innovations, technologies, inventors, or markets",
		"Current stage",
		"Most recent",
		[
			{ value: "96", label: "Innovations" },
			{ value: "28", label: "Industry links" },
			{ value: "14", label: "Pilot projects" },
		],
		[
			card(
				"Low-cost solar drying system for smallholder processing",
				"Prototype validation | Agriculture and Energy",
				"Technology supporting post-harvest quality, reduced waste, and small enterprise productivity.",
				"/innovations/solar-drying-system",
				["Prototype", "Food systems", "Industry ready"],
			),
			card(
				"Rapid community health reporting toolkit",
				"Field pilot | Public health",
				"Digital reporting tool for faster community health monitoring and response.",
				"/innovations/health-reporting-toolkit",
				["Pilot", "Health", "Software"],
			),
			card(
				"Bio-based water treatment media",
				"Technology review | Environmental science",
				"Research-backed treatment material for safer local water systems and industrial applications.",
				"/innovations/bio-water-treatment-media",
				["Review", "Environment", "Materials"],
			),
		],
		"Innovation filters",
		[
			"Technology summary",
			"Linked research",
			"Current stage",
			"Industry applications",
			"Commercialisation stage",
		],
		"No innovations match these filters",
		"Try another stage, area of use, inventor, or search word.",
		"3 innovations",
	),
	patents: collection(
		pageSeo.patents,
		"Patents",
		"Browse OAU Patents",
		"Find inventions by inventor, filing stage, research area, or possible use.",
		Scale,
		"Search patents, inventors, technology areas, or status",
		"Patent status",
		"Newest filing",
		[
			{ value: "42", label: "Patents" },
			{ value: "17", label: "Filed" },
			{ value: "9", label: "Granted" },
		],
		[
			card(
				"Adaptive microgrid controller",
				"Filed | Energy systems | 2026",
				"Control method for resilient distributed power systems with renewable generation sources.",
				"/patents/adaptive-microgrid-controller",
				["Filed", "Energy", "Inventor group"],
			),
			card(
				"Bio-composite filtration medium",
				"Under review | Environmental technology | 2025",
				"Filtration material designed for affordable water treatment and industrial remediation pathways.",
				"/patents/bio-composite-filtration",
				["Under review", "Water", "Materials"],
			),
			card(
				"Post-harvest crop quality sensor",
				"Granted | Agriculture | 2024",
				"Sensor-supported monitoring for storage quality, market readiness, and reduced crop losses.",
				"/patents/crop-quality-sensor",
				["Granted", "Agriculture", "Device"],
			),
		],
		"Patent profile includes",
		[
			"Inventors",
			"Patent status",
			"Technology summary",
			"Research area",
			"Industry applications",
		],
		"No patents match your search",
		"Try a different inventor, technology area, patent status, or filing year.",
		"3 patents",
	),
	reports: collection(
		pageSeo.reports,
		"OAU Research at a Glance",
		"Reports and Statistics",
		"See public figures and trends for OAU research, innovations, patents, and partnerships.",
		ChartNoAxesCombined,
		"Search reports, statistics, years, or faculties",
		"Report type",
		"Latest report",
		[
			{ value: "12k", label: "Public research" },
			{ value: "18%", label: "Growth this year" },
			{ value: "28", label: "Industry collaborations" },
		],
		[
			card(
				"OAU research summary",
				"Institutional report | 2026",
				"A clear summary of OAU publications, research areas, public access, and growth.",
				undefined,
				["Key figures", "Research", "Public information"],
			),
			card(
				"Innovation and technology transfer activity",
				"IPTTO report | 2026",
				"A public summary of OAU innovations, patents, partnerships, and trials.",
				undefined,
				["Innovation", "Patents", "Partnerships"],
			),
			card(
				"Faculty research visibility overview",
				"Analytics report | 2025",
				"Public figures across faculties, departments, research areas, and publication types.",
				undefined,
				["Faculties", "Departments", "Trends"],
			),
		],
		"Public safeguards",
		[
			"Private work is not included",
			"Summary figures only",
			"No restricted files",
			"No personal private data",
		],
		"No public reports match this view",
		"Try a different year, report type, or faculty filter.",
		"3 public reports",
	),
	news: collection(
		pageSeo.news,
		"News and Events",
		"Research News and Events",
		"See OAU research announcements, opportunities, workshops, events, and innovation updates.",
		Newspaper,
		"Search news, events, workshops, or calls",
		"Content type",
		"Newest update",
		[
			{ value: "18", label: "Updates" },
			{ value: "6", label: "Upcoming events" },
			{ value: "4", label: "Open calls" },
		],
		[
			card(
				"How to add your research: workshop for academic staff",
				"Event | 18 August 2026",
				"A practical session on completing your profile, adding publications, and sending research for review.",
				undefined,
				["Workshop", "Researchers", "Adding research"],
			),
			card(
				"IPTTO opens call for innovation disclosure updates",
				"Announcement | 04 August 2026",
				"Researchers with promising technologies can update public innovation summaries for review.",
				undefined,
				["Innovation", "IPTTO", "Call"],
			),
			card(
				"New public statistics dashboard published",
				"News | 22 July 2026",
				"The reports page now shows clear public figures for research and innovations.",
				undefined,
				["Reports", "Statistics", "Public"],
			),
		],
		"Browse updates",
		["News", "Events", "Workshops", "Open calls", "Announcements"],
		"No updates match this search",
		"Try a different content type, date, or keyword.",
		"3 updates",
	),
} satisfies Record<string, CollectionConfig>;

export const detailPages = {
	research: detail(
		pageSeo.researchDetail,
		"Research",
		"Smart Energy Systems for Resilient Communities",
		"Read the summary, meet the authors, see publication details, and find related work.",
		FileSearch,
		"Research Details",
		"/research",
		"Back to all research",
		[
			{ label: "Authors", value: "Prof. Amina Adebayo, Dr. S. Bello" },
			{ label: "Department", value: "Electrical and Electronic Engineering" },
			{ label: "Faculty", value: "Faculty of Technology" },
			{ label: "Publication date", value: "12 May 2026" },
			{ label: "Document", value: "Details available; document coming soon" },
		],
		[
			{
				title: "Abstract",
				body: "This study examines smart energy systems for resilient communities, focusing on distributed control, renewable generation, rural power access, and infrastructure planning.",
			},
			{
				title: "How to cite this research",
				body: "Use the authors, title, where and when it was published, DOI when available, and the link to this page.",
			},
			{
				title: "Keywords",
				body: "Renewable energy, smart grid, distributed systems, energy access, resilient infrastructure.",
			},
		],
		collectionPages.research.items.slice(1),
		[
			{ label: "Download citation", href: "/research", icon: Download },
			{
				label: "Find related research",
				href: "/research?area=renewable-energy",
				icon: Search,
			},
		],
	),
	researcher: detail(
		pageSeo.researcherProfile,
		"Researcher Profile",
		"Prof. Amina Adebayo",
		"Learn about this researcher's interests, publications, department, and approved contact details.",
		Users,
		"Researcher slug",
		"/researchers",
		"Back to researchers",
		[
			{ label: "Department", value: "Electrical and Electronic Engineering" },
			{ label: "Faculty", value: "Faculty of Technology" },
			{ label: "Published research", value: "84 items" },
			{
				label: "Research interests",
				value: "Energy systems, smart grids, controls",
			},
			{ label: "Public contact", value: "researcher@example.edu.ng" },
		],
		[
			{
				title: "Biography",
				body: "Prof. Adebayo leads applied research in resilient energy systems, grid intelligence, and community power access.",
			},
			{
				title: "Research at a glance",
				body: "See publication types, recent research, and collaborations at a glance.",
			},
			{
				title: "Selected publications",
				body: "Explore this researcher's approved publications, co-authors, department, and research areas.",
			},
		],
		collectionPages.publications.items,
		[
			{ label: "View publications", href: "/publications", icon: BookOpen },
			{
				label: "Browse department",
				href: "/departments/electrical-electronic-engineering",
				icon: Building2,
			},
		],
	),
	department: detail(
		pageSeo.departmentDetail,
		"Department Profile",
		"Electrical and Electronic Engineering",
		"Explore this department's researchers, publications, innovations, patents, and key figures.",
		Building2,
		"Department slug",
		"/departments",
		"Back to departments",
		[
			{ label: "Faculty", value: "Faculty of Technology" },
			{ label: "Researchers", value: "124" },
			{ label: "Published research", value: "892" },
			{ label: "Innovations", value: "18" },
			{ label: "Patents", value: "11" },
		],
		[
			{
				title: "Research activity",
				body: "See the department's published research, active researchers, innovations, and areas of strength.",
			},
			{
				title: "People and publications",
				body: "Visitors can move from a department to researcher profiles, publications, innovations, and patents.",
			},
			{
				title: "Statistics",
				body: "These figures include public information only.",
			},
		],
		collectionPages.research.items,
		[
			{ label: "View researchers", href: "/researchers", icon: Users },
			{
				label: "Search department research",
				href: "/research?department=electrical-electronic-engineering",
				icon: Search,
			},
		],
	),
	faculty: detail(
		pageSeo.facultyDetail,
		"Faculty Profile",
		"Faculty of Technology",
		"Explore this faculty's departments, researchers, publications, innovations, patents, and key figures.",
		GraduationCap,
		"Faculty slug",
		"/faculties",
		"Back to faculties",
		[
			{ label: "Departments", value: "12" },
			{ label: "Researchers", value: "246" },
			{ label: "Published research", value: "3.2k" },
			{ label: "Innovations", value: "31" },
			{ label: "Patents", value: "26" },
		],
		[
			{
				title: "Faculty overview",
				body: "Explore the faculty's departments, areas of expertise, publications, innovations, patents, and recent work.",
			},
			{
				title: "Departments",
				body: "Each department listing links to its public profile and filtered research results.",
			},
			{
				title: "Public statistics",
				body: "These figures help you understand the faculty without showing private work.",
			},
		],
		collectionPages.departments.items,
		[
			{ label: "View departments", href: "/departments", icon: Building2 },
			{
				label: "Browse faculty research",
				href: "/research?faculty=technology",
				icon: Search,
			},
		],
	),
	innovation: detail(
		pageSeo.innovationDetail,
		"Innovation Detail",
		"Low-cost Solar Drying System",
		"See what this innovation does, the research behind it, its current stage, and where it could be used.",
		Lightbulb,
		"Innovation slug",
		"/innovations",
		"Back to innovations",
		[
			{ label: "Current stage", value: "Prototype testing" },
			{ label: "Research area", value: "Agriculture and Energy" },
			{ label: "Industry use", value: "Smallholder processing" },
			{ label: "Related research", value: "4 publications" },
			{ label: "Public contact", value: "IPTTO office" },
		],
		[
			{
				title: "Technology summary",
				body: "The public summary explains the technology, evidence base, readiness level, and application pathway.",
			},
			{
				title: "Research links",
				body: "Explore the approved research, people, and departments behind this innovation.",
			},
			{
				title: "Industry applications",
				body: "Application notes help partners understand fit, constraints, and collaboration routes.",
			},
		],
		collectionPages.innovations.items.slice(1),
		[
			{ label: "Contact IPTTO", href: "/contact", icon: Mail },
			{
				label: "View linked research",
				href: "/research?area=food-security",
				icon: Search,
			},
		],
	),
	patent: detail(
		pageSeo.patentDetail,
		"Patent Detail",
		"Adaptive Microgrid Controller",
		"See who created this invention, what it does, its filing stage, and where it could be used.",
		Scale,
		"Patent slug",
		"/patents",
		"Back to patents",
		[
			{ label: "Patent status", value: "Filed" },
			{ label: "Inventors", value: "Prof. Amina Adebayo and team" },
			{ label: "Research area", value: "Energy systems" },
			{ label: "Industry use", value: "Distributed power systems" },
			{ label: "Public information", value: "Summary available" },
		],
		[
			{
				title: "Technology summary",
				body: "Read a public summary, meet the inventors, check the filing stage, and find related research.",
			},
			{
				title: "Research area",
				body: "See the research area and public work that support this invention.",
			},
			{
				title: "Industry applications",
				body: "Public application notes explain the technology opportunity without exposing restricted details.",
			},
		],
		collectionPages.patents.items.slice(1),
		[
			{ label: "Contact IPTTO", href: "/contact", icon: Mail },
			{ label: "Browse patents", href: "/patents", icon: Scale },
		],
	),
} satisfies Record<string, DetailConfig>;

export function CollectionPage({
	config,
	liveItems = [],
}: {
	config: CollectionConfig;
	liveItems?: Array<CardItem>;
}) {
	const items = mergeCollectionItems(liveItems, config.items);

	return (
		<PublicPageShell>
			<PageHero config={config} />
			<section className="section-wrap pt-0">
				<div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
					<div className="space-y-4">
						<SearchFilterPanel config={config} />
						<div className="grid gap-4">
							{items.map((item) => (
								<ResultCard item={item} key={item.title} />
							))}
						</div>
						<Pagination
							label={
								liveItems.length > 0
									? `${liveItems.length} results`
									: config.resultLabel
							}
						/>
						<EmptyState title={config.emptyTitle} text={config.emptyText} />
					</div>
					<Sidebar title={config.sidebarTitle} items={config.sidebarItems} />
				</div>
			</section>
		</PublicPageShell>
	);
}

function mergeCollectionItems(
	liveItems: Array<CardItem>,
	staticItems: Array<CardItem>,
) {
	const liveTitles = new Set(liveItems.map((item) => item.title));

	return [
		...liveItems,
		...staticItems.filter((item) => !liveTitles.has(item.title)),
	];
}

export function DetailPlaceholderPage({
	config,
	param,
}: {
	config: DetailConfig;
	param?: string;
}) {
	return (
		<PublicPageShell>
			<section className="section-wrap pb-12 pt-32">
				<a
					className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#146ef5]"
					href={config.backHref}
				>
					<ArrowLeft className="h-4 w-4" />
					{config.backLabel}
				</a>
				<div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
					<div>
						<span className="eyebrow">
							<config.icon className="h-4 w-4" />
							{config.eyebrow}
						</span>
						<h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
							{config.title}
						</h1>
						<p className="mt-5 max-w-3xl text-base leading-8 text-[#6b7280] sm:text-lg">
							{config.description}
						</p>
						{param ? (
							<p className="mt-4 text-sm font-medium text-[#6b7280]">
								{config.paramLabel}:{" "}
								<span className="text-[#080808]">{param}</span>
							</p>
						) : null}
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							{config.actions.map((action) => (
								<a
									className="btn-primary w-fit"
									href={action.href}
									key={action.label}
								>
									<action.icon className="h-5 w-5" />
									{action.label}
								</a>
							))}
						</div>
					</div>
					<RecordFacts facts={config.facts} />
				</div>
			</section>
			<section className="section-wrap pt-0">
				<div className="grid gap-4 lg:grid-cols-3">
					{config.sections.map((section) => (
						<article
							className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-5"
							key={section.title}
						>
							<h2 className="text-xl font-semibold">{section.title}</h2>
							<p className="mt-3 text-sm leading-6 text-[#6b7280]">
								{section.body}
							</p>
						</article>
					))}
				</div>
			</section>
			<section className="section-wrap pt-0">
				<div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<span className="eyebrow">You May Also Like</span>
						<h2 className="mt-4 text-3xl font-semibold tracking-normal">
							Continue discovery
						</h2>
					</div>
				</div>
				<div className="grid gap-4 lg:grid-cols-2">
					{config.related.map((item) => (
						<ResultCard item={item} key={item.title} />
					))}
				</div>
			</section>
		</PublicPageShell>
	);
}

export function FaqPageContent() {
	const faqs = [
		{
			question: "Who can search this site?",
			answer:
				"Anyone can search public research, researchers, innovations, and patents without signing in.",
		},
		{
			question: "What content appears publicly?",
			answer:
				"Only information and documents approved for public viewing appear on this site.",
		},
		{
			question: "How do I cite research I find here?",
			answer:
				"Open the research page and use the authors, title, publication date, DOI when available, and the page link.",
		},
		{
			question: "Can researchers update their profiles?",
			answer:
				"Sign in with your approved staff account, open your profile, and make your changes there.",
		},
		{
			question: "How are innovations and patents handled?",
			answer:
				"Only approved summaries are shown publicly. IPTTO keeps sensitive invention details private.",
		},
		{
			question: "Who should industry partners contact?",
			answer:
				"Industry partners should contact IPTTO through the public contact page for technology transfer, licensing, and collaboration enquiries.",
		},
	];

	return (
		<PublicPageShell>
			<section className="section-wrap pb-12 pt-32">
				<span className="eyebrow">
					<CircleHelp className="h-4 w-4" />
					FAQ
				</span>
				<h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
					Frequently Asked Questions
				</h1>
				<p className="mt-5 max-w-3xl text-base leading-8 text-[#6b7280] sm:text-lg">
					Quick answers about finding research, viewing documents, profiles,
					innovations, patents, and getting help.
				</p>
			</section>
			<section className="section-wrap pt-0">
				<div className="grid gap-4 lg:grid-cols-2">
					{faqs.map((faq) => (
						<article
							className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-5"
							key={faq.question}
						>
							<h2 className="text-xl font-semibold">{faq.question}</h2>
							<p className="mt-3 text-sm leading-6 text-[#6b7280]">
								{faq.answer}
							</p>
						</article>
					))}
				</div>
			</section>
		</PublicPageShell>
	);
}

export function ContactPageContent() {
	const contactCards = [
		{
			icon: Mail,
			title: "Research site help",
			text: "repository@oauife.edu.ng",
		},
		{
			icon: Phone,
			title: "IPTTO office",
			text: "+234 000 000 0000",
		},
		{
			icon: MapPin,
			title: "Visit",
			text: "Obafemi Awolowo University, Ile-Ife, Osun State",
		},
	];

	return (
		<PublicPageShell>
			<section className="section-wrap pb-12 pt-32">
				<div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
					<div>
						<span className="eyebrow">
							<Mail className="h-4 w-4" />
							Contact
						</span>
						<h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
							Contact OAU IPTTO
						</h1>
						<p className="mt-5 max-w-3xl text-base leading-8 text-[#6b7280] sm:text-lg">
							Get help using the site, ask about public research, or start a
							conversation about technology transfer and industry collaboration.
						</p>
						<div className="mt-8 grid gap-3">
							{[
								"Help using the site",
								"Technology transfer enquiries",
								"Correct research information",
							].map((item) => (
								<div
									className="flex items-center gap-3 text-sm font-medium"
									key={item}
								>
									<CheckCircle2 className="h-5 w-5 text-[#146ef5]" />
									{item}
								</div>
							))}
						</div>
					</div>
					<Card className="rounded-lg border-[#d8d8d8] bg-[#f0f0f0] py-0 shadow-none">
						<CardHeader className="px-5 pt-5">
							<CardTitle>Send an enquiry</CardTitle>
							<CardDescription>
								Use this form for help with the site, research information, or
								an IPTTO partnership.
							</CardDescription>
						</CardHeader>
						<CardContent className="px-5 pb-5">
							<form className="grid gap-3">
								<FormField id="name" label="Name" placeholder="Your name" />
								<FormField
									id="email"
									label="Email"
									placeholder="you@example.com"
									type="email"
								/>
								<label className="text-sm font-semibold" htmlFor="topic">
									Topic
								</label>
								<select
									className="min-h-12 rounded border border-[#d8d8d8] bg-white px-4 outline-none focus:border-[#146ef5]"
									id="topic"
								>
									<option>Help using the site</option>
									<option>Innovation partnership</option>
									<option>Patent or licensing enquiry</option>
									<option>Correct research information</option>
								</select>
								<label className="text-sm font-semibold" htmlFor="message">
									Message
								</label>
								<textarea
									className="min-h-32 rounded border border-[#d8d8d8] bg-white px-4 py-3 outline-none focus:border-[#146ef5]"
									id="message"
									placeholder="How can IPTTO help?"
								/>
								<button className="btn-primary mt-2" type="button">
									<Mail className="h-5 w-5" />
									Send enquiry
								</button>
							</form>
						</CardContent>
					</Card>
				</div>
			</section>
			<section className="section-wrap pt-0">
				<div className="grid gap-4 md:grid-cols-3">
					{contactCards.map((cardItem) => (
						<article
							className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-5"
							key={cardItem.title}
						>
							<div className="feature-icon">
								<cardItem.icon className="h-5 w-5" />
							</div>
							<h2 className="mt-5 text-xl font-semibold">{cardItem.title}</h2>
							<p className="mt-3 text-sm leading-6 text-[#6b7280]">
								{cardItem.text}
							</p>
						</article>
					))}
				</div>
			</section>
		</PublicPageShell>
	);
}

function collection(
	seo: PageSeo,
	eyebrow: string,
	title: string,
	description: string,
	icon: PublicIcon,
	searchPlaceholder: string,
	filterLabel: string,
	sortLabel: string,
	stats: Array<StatItem>,
	items: Array<CardItem>,
	sidebarTitle: string,
	sidebarItems: Array<string>,
	emptyTitle: string,
	emptyText: string,
	resultLabel: string,
): CollectionConfig {
	return {
		seo,
		eyebrow,
		title,
		description,
		icon,
		searchPlaceholder,
		filterLabel,
		sortLabel,
		stats,
		items,
		sidebarTitle,
		sidebarItems,
		emptyTitle,
		emptyText,
		resultLabel,
	};
}

function detail(
	seo: PageSeo,
	eyebrow: string,
	title: string,
	description: string,
	icon: PublicIcon,
	paramLabel: string,
	backHref: string,
	backLabel: string,
	facts: Array<{ label: string; value: string }>,
	sections: Array<{ title: string; body: string }>,
	related: Array<CardItem>,
	actions: Array<{ label: string; href: string; icon: PublicIcon }>,
): DetailConfig {
	return {
		seo,
		eyebrow,
		title,
		description,
		icon,
		paramLabel,
		backHref,
		backLabel,
		facts,
		sections,
		related,
		actions,
	};
}

function card(
	title: string,
	meta: string,
	description: string,
	href: string | undefined,
	tags: Array<string>,
): CardItem {
	return { title, meta, description, href, tags };
}

export function PublicPageShell({ children }: { children: ReactNode }) {
	return (
		<main className="min-h-screen bg-white text-[#080808]">
			<PublicHeader />
			{children}
			<PublicFooter />
		</main>
	);
}

function PublicHeader() {
	const { dashboardHref, isSignedIn } = useDashboardLink();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-[#d8d8d8] bg-white/90 backdrop-blur-xl">
			<nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<a className="flex items-center gap-3 text-[#080808]" href="/">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#146ef5] text-white">
						<FileSearch className="h-5 w-5" />
					</div>
					<div className="leading-tight">
						<strong className="block text-sm font-semibold">OAU IPTTO</strong>
						<span className="text-xs text-[#6b7280]">Research repository</span>
					</div>
				</a>
				<button
					aria-expanded={isOpen}
					aria-label="Open navigation menu"
					className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded border border-[#d8d8d8] bg-white text-[#080808] transition hover:border-[#146ef5] hover:text-[#146ef5] active:scale-[0.98]"
					onClick={() => setIsOpen(true)}
					type="button"
				>
					<Menu className="h-5 w-5" />
				</button>
			</nav>
			<NavigationDrawer
				dashboardHref={dashboardHref}
				isOpen={isOpen}
				isSignedIn={isSignedIn}
				onClose={() => setIsOpen(false)}
			/>
		</header>
	);
}

function NavigationDrawer({
	dashboardHref,
	isOpen,
	isSignedIn,
	onClose,
}: {
	dashboardHref: string;
	isOpen: boolean;
	isSignedIn: boolean;
	onClose: () => void;
}) {
	return (
		<div
			aria-hidden={!isOpen}
			className={`fixed inset-0 z-50 transition ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
		>
			<button
				aria-label="Close navigation menu"
				className={`absolute inset-0 cursor-pointer bg-black/30 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
				onClick={onClose}
				type="button"
			/>
			<aside
				className={`absolute right-0 top-0 flex h-dvh w-[min(88vw,390px)] flex-col overflow-hidden bg-white p-5 shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				<div className="flex items-center justify-between gap-4 border-[#d8d8d8] border-b pb-4">
					<strong className="text-sm font-semibold">Menu</strong>
					<button
						aria-label="Close navigation menu"
						className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded border border-[#d8d8d8] hover:border-[#146ef5] hover:text-[#146ef5]"
						onClick={onClose}
						type="button"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<div className="mt-6 grid flex-1 gap-2 overflow-y-auto pb-4">
					{navLinks.map((link) => (
						<a
							className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#eef4ff] hover:text-[#146ef5]"
							href={link.href}
							key={link.href}
							onClick={onClose}
						>
							{link.label}
						</a>
					))}
				</div>
				<div className="grid shrink-0 gap-2 border-[#d8d8d8] border-t pt-5">
					{isSignedIn ? (
						<>
							<a
								className="btn-primary h-11"
								href={dashboardHref}
								onClick={onClose}
							>
								<LayoutDashboard className="h-4 w-4" />
								Dashboard
							</a>
							<button
								className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded border border-[#d8d8d8] bg-white px-4 text-sm font-semibold text-[#080808] transition hover:border-[#146ef5] hover:text-[#146ef5] active:scale-[0.98]"
								onClick={() => void signOutAndRedirectHome()}
								type="button"
							>
								<LogOut className="h-4 w-4" />
								Logout
							</button>
						</>
					) : (
						<>
							{staffAccessLinks.map((link) => (
								<a
									className="rounded-lg border border-[#d8d8d8] px-3 py-3 text-sm font-semibold hover:border-[#146ef5] hover:text-[#146ef5]"
									href={link.href}
									key={link.href}
									onClick={onClose}
								>
									{link.label}
								</a>
							))}
							<a className="btn-primary h-11" href="/sign-in" onClick={onClose}>
								Staff sign in
							</a>
						</>
					)}
				</div>
			</aside>
		</div>
	);
}

function useDashboardLink() {
	const [dashboardHref, setDashboardHref] = useState("/dashboard");
	const [isSignedIn, setIsSignedIn] = useState(false);

	useEffect(() => {
		let isMounted = true;

		async function readSession() {
			try {
				const response = await fetch("/api/dashboard/me");
				if (!response.ok) return;
				const payload = (await response.json()) as {
					data?: { roles?: string[] };
				};
				const href = dashboardHrefForRoles(payload.data?.roles ?? []);
				if (isMounted) {
					setDashboardHref(href);
					setIsSignedIn(true);
				}
			} catch {
				if (isMounted) setIsSignedIn(false);
			}
		}

		void readSession();
		return () => {
			isMounted = false;
		};
	}, []);

	return { dashboardHref, isSignedIn };
}

function dashboardHrefForRoles(roles: string[]) {
	if (roles.includes("super_administrator")) return "/dashboard/super-admin";
	if (roles.includes("faculty_administrator"))
		return "/dashboard/faculty-admin";
	if (roles.includes("department_administrator")) {
		return "/dashboard/department-admin";
	}
	if (roles.includes("iptto_officer")) return "/dashboard/iptto-officer";
	if (roles.includes("lecturer")) return "/dashboard/lecturer";
	return "/dashboard";
}

function PublicFooter() {
	return (
		<footer className="site-footer">
			<div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
				<div>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded bg-[#146ef5] text-white">
							<FileSearch className="h-5 w-5" />
						</div>
						<div>
							<strong className="block">OAU IPTTO</strong>
							<span className="text-sm text-[#6b7280]">
								Official Research Repository
							</span>
						</div>
					</div>
					<p className="mt-5 max-w-xl text-sm leading-6 text-[#6b7280]">
						Public pages help anyone find approved research, researchers,
						publications, innovations, patents, reports, and institutional
						research structures.
					</p>
				</div>
				<div>
					<h2 className="text-base font-semibold">Public pages</h2>
					<div className="footer-links">
						{publicLinks.map((link) => (
							<a href={link.href} key={link.href}>
								{link.label}
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}

function PageHero({ config }: { config: CollectionConfig }) {
	return (
		<section className="section-wrap pb-12 pt-32">
			<div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
				<div>
					<span className="eyebrow">
						<config.icon className="h-4 w-4" />
						{config.eyebrow}
					</span>
					<h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
						{config.title}
					</h1>
					<p className="mt-5 max-w-3xl text-base leading-8 text-[#6b7280] sm:text-lg">
						{config.description}
					</p>
				</div>
				<div className="grid grid-cols-3 gap-3 rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-3">
					{config.stats.map((stat) => (
						<div
							className="rounded-lg border border-[#d8d8d8] bg-white p-3"
							key={stat.label}
						>
							<strong className="block text-2xl font-bold">{stat.value}</strong>
							<span className="mt-2 block text-xs leading-5 text-[#6b7280]">
								{stat.label}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function SearchFilterPanel({ config }: { config: CollectionConfig }) {
	return (
		<div className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-4">
			<div className="grid gap-3 lg:grid-cols-[1fr_210px_180px_52px]">
				<label
					className="search-box min-h-14"
					htmlFor={`${config.eyebrow}-search`}
				>
					<Search className="h-5 w-5 text-[#146ef5]" />
					<input
						id={`${config.eyebrow}-search`}
						placeholder={config.searchPlaceholder}
						type="search"
					/>
				</label>
				<label className="flex min-h-14 items-center gap-2 rounded border border-[#d8d8d8] bg-white px-4 text-sm font-medium text-[#6b7280]">
					<Filter className="h-4 w-4 text-[#146ef5]" />
					<select
						aria-label={config.filterLabel}
						className="min-w-0 flex-1 bg-transparent text-[#080808] outline-none"
					>
						<option>{config.filterLabel}</option>
						{config.sidebarItems.slice(0, 4).map((item) => (
							<option key={item}>{item}</option>
						))}
					</select>
				</label>
				<label className="flex min-h-14 items-center gap-2 rounded border border-[#d8d8d8] bg-white px-4 text-sm font-medium text-[#6b7280]">
					<SlidersHorizontal className="h-4 w-4 text-[#146ef5]" />
					<select
						aria-label="Sort"
						className="min-w-0 flex-1 bg-transparent text-[#080808] outline-none"
					>
						<option>{config.sortLabel}</option>
						<option>Oldest first</option>
						<option>A to Z</option>
						<option>Highest activity</option>
					</select>
				</label>
				<button
					aria-label="Search"
					className="flex min-h-14 items-center justify-center rounded bg-[#146ef5] text-white hover:bg-[#0d5fdc]"
					type="button"
				>
					<Search className="h-5 w-5" />
				</button>
			</div>
			<div className="mt-4 flex flex-col justify-between gap-3 text-sm text-[#6b7280] sm:flex-row sm:items-center">
				<span>Showing {config.resultLabel} from public data</span>
				<div className="flex flex-wrap gap-2">
					{["2026", "Open access", "Faculty filter"].map((chipText) => (
						<button
							className="trust-chip bg-white"
							type="button"
							key={chipText}
						>
							{chipText}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

function ResultCard({ item }: { item: CardItem }) {
	const content = (
		<article className="group rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-5 hover:border-[#146ef5] hover:bg-white">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
				<div>
					<p className="text-sm font-medium text-[#146ef5]">{item.meta}</p>
					<h2 className="mt-3 text-2xl font-semibold leading-tight tracking-normal">
						{item.title}
					</h2>
				</div>
				{item.href ? (
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white text-[#146ef5] group-hover:bg-[#146ef5] group-hover:text-white">
						<ArrowRight className="h-5 w-5" />
					</div>
				) : null}
			</div>
			<p className="mt-4 max-w-3xl text-sm leading-6 text-[#6b7280]">
				{item.description}
			</p>
			<div className="mt-5 flex flex-wrap gap-2">
				{item.tags.map((tag) => (
					<span className="trust-chip bg-white" key={tag}>
						{tag}
					</span>
				))}
			</div>
		</article>
	);

	return item.href ? <a href={item.href}>{content}</a> : content;
}

function RecordFacts({
	facts,
}: {
	facts: Array<{ label: string; value: string }>;
}) {
	return (
		<aside className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-4">
			<h2 className="text-lg font-semibold">Key details</h2>
			<div className="mt-4 divide-y divide-[#d8d8d8]">
				{facts.map((fact) => (
					<div
						className="grid gap-1 py-3 sm:grid-cols-[130px_1fr] lg:grid-cols-1"
						key={fact.label}
					>
						<span className="text-sm font-medium text-[#6b7280]">
							{fact.label}
						</span>
						<strong className="text-sm font-semibold text-[#080808]">
							{fact.value}
						</strong>
					</div>
				))}
			</div>
		</aside>
	);
}

function Pagination({ label }: { label: string }) {
	return (
		<nav
			aria-label="Pagination"
			className="flex flex-col justify-between gap-3 rounded-lg border border-[#d8d8d8] bg-white p-4 text-sm text-[#6b7280] sm:flex-row sm:items-center"
		>
			<span>Page 1 of 1 for {label}</span>
			<div className="flex items-center gap-2">
				<button className="trust-chip bg-white" type="button">
					<ChevronLeft className="h-4 w-4" />
					Previous
				</button>
				<span className="trust-chip border-[#146ef5] bg-[#146ef5] text-white">
					1
				</span>
				<button className="trust-chip bg-white" type="button">
					Next
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</nav>
	);
}

function Sidebar({ title, items }: { title: string; items: Array<string> }) {
	return (
		<aside className="rounded-lg border border-[#d8d8d8] bg-[#080808] p-5 text-white lg:sticky lg:top-28">
			<h2 className="text-xl font-semibold">{title}</h2>
			<div className="mt-5 grid gap-3">
				{items.map((item) => (
					<div
						className="flex items-center gap-3 rounded border border-white/15 bg-white/8 p-3 text-sm"
						key={item}
					>
						<BadgeCheck className="h-4 w-4 shrink-0 text-[#146ef5]" />
						<span>{item}</span>
					</div>
				))}
			</div>
		</aside>
	);
}

function EmptyState({ title, text }: { title: string; text: string }) {
	return (
		<div className="rounded-lg border border-dashed border-[#d8d8d8] bg-white p-6 text-center">
			<CalendarDays className="mx-auto h-8 w-8 text-[#146ef5]" />
			<h2 className="mt-4 text-xl font-semibold">{title}</h2>
			<p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6b7280]">
				{text}
			</p>
		</div>
	);
}

function FormField({
	id,
	label,
	placeholder,
	type = "text",
}: {
	id: string;
	label: string;
	placeholder: string;
	type?: string;
}) {
	return (
		<>
			<label className="text-sm font-semibold" htmlFor={id}>
				{label}
			</label>
			<input
				className="min-h-12 rounded border border-[#d8d8d8] bg-white px-4 outline-none focus:border-[#146ef5]"
				id={id}
				placeholder={placeholder}
				type={type}
			/>
		</>
	);
}
