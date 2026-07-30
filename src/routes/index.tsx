"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	BadgeCheck,
	BookOpen,
	Building2,
	Database,
	FileSearch,
	FlaskConical,
	Globe2,
	GraduationCap,
	Handshake,
	LayoutDashboard,
	Lightbulb,
	LockKeyhole,
	LogOut,
	Menu,
	Network,
	Scale,
	Search,
	ShieldCheck,
	Sparkles,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { signOutAndRedirectHome } from "#/lib/sign-out.ts";

const universityName = "Obafemi Awolowo University";

const headerLinks = [
	{ label: "Search", href: "#search" },
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

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{
				title:
					"Obafemi Awolowo University Research Repository | Publications, Researchers, Innovations & Patents",
			},
			{
				name: "description",
				content:
					"Explore the official research repository of Obafemi Awolowo University. Discover publications, researchers, departments, innovations, patents, and scholarly outputs that advance knowledge and create societal impact.",
			},
			{
				property: "og:title",
				content: "Discover Research at Obafemi Awolowo University",
			},
			{
				property: "og:description",
				content:
					"Search research publications, explore researcher profiles, discover innovations, and learn about the groundbreaking work shaping the future at Obafemi Awolowo University.",
			},
		],
	}),
	component: Home,
});

const quickFilters = [
	"Publications",
	"Researchers",
	"Departments",
	"Faculties",
	"Research Areas",
	"Innovations",
	"Patents",
];

const statistics = [
	{ value: "12k", label: "Research Publications" },
	{ value: "380", label: "Active Researchers" },
	{ value: "96", label: "Departments" },
	{ value: "13", label: "Faculties" },
	{ value: "54", label: "Research Areas" },
	{ value: "96", label: "Innovations" },
	{ value: "42", label: "Patents" },
	{ value: "28", label: "Industry Collaborations" },
];

const featuredResearch = [
	{
		area: "Renewable Energy",
		title: "Smart energy systems for resilient communities",
		text: "Applied research focused on cleaner power distribution, energy access, and sustainable infrastructure.",
	},
	{
		area: "Medicine",
		title: "Public health intelligence for better outcomes",
		text: "Scholarly work connecting clinical insight, data, and policy to improve community health decisions.",
	},
	{
		area: "Agriculture",
		title: "Food security through field-tested innovation",
		text: "Research outputs supporting improved crop systems, agribusiness resilience, and local productivity.",
	},
];

const publicationTypes = [
	"Journal Articles",
	"Conference Papers",
	"Books",
	"Book Chapters",
	"Technical Reports",
	"Theses & Dissertations",
	"Working Papers",
];

const researcherProfileItems = [
	"Biography",
	"Research Interests",
	"Publications",
	"Research Metrics",
	"Current Projects",
	"Department",
	"Faculty",
	"Contact Information",
];

const researchAreas = [
	"Artificial Intelligence",
	"Data Science",
	"Cybersecurity",
	"Agriculture",
	"Renewable Energy",
	"Engineering",
	"Environmental Science",
	"Medicine",
	"Education",
	"Economics",
	"Social Sciences",
	"Humanities",
];

const innovationItems = [
	"Commercialised Technologies",
	"Research Innovations",
	"Technology Transfer Projects",
	"Industry Partnerships",
	"Start-up Initiatives",
	"Innovation Showcase",
];

const patentItems = [
	"Technology Summary",
	"Inventors",
	"Patent Status",
	"Research Area",
	"Industry Applications",
];

const valueCards = [
	{
		icon: FileSearch,
		title: "Comprehensive Discovery",
		text: "Access publications, innovations, patents, and research outputs from across the university in one place.",
	},
	{
		icon: BadgeCheck,
		title: "Verified Academic Content",
		text: "Published records are managed through institutional workflows to ensure quality, consistency, and reliability.",
	},
	{
		icon: Handshake,
		title: "Collaboration Opportunities",
		text: "Find experts, identify collaborators, and discover opportunities for academic and industry partnerships.",
	},
	{
		icon: LockKeyhole,
		title: "Long-Term Preservation",
		text: "Research outputs are securely preserved, ensuring continued accessibility for future generations of researchers.",
	},
];

const footerLinks = [
	"Research",
	"Researchers",
	"Departments",
	"Faculties",
	"Innovations",
	"Patents",
	"Reports",
	"News",
	"FAQ",
	"Contact",
];

const trustItems = [
	{ icon: LockKeyhole, label: "Secure preservation" },
	{ icon: Globe2, label: "Public discovery" },
	{ icon: Network, label: "Institutional workflows" },
	{ icon: ShieldCheck, label: "Verified records" },
];

function Home() {
	return (
		<main className="min-h-screen bg-[#ffffff] text-[#080808]">
			<Header />
			<section className="hero-stage">
				<div className="hero-backdrop" />
				<div className="mx-auto flex min-h-[calc(100svh-104px)] w-full max-w-7xl items-end px-4 pb-8 pt-24 sm:px-6 lg:px-8">
					<div className="grid w-full gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
						<div className="max-w-4xl pb-4 text-white rise-in">
							<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/14 px-3 py-1 text-sm font-medium backdrop-blur-md">
								<Sparkles className="h-4 w-4" />
								Official Research Repository
							</div>
							<h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] tracking-normal sm:text-6xl lg:text-[76px]">
								Discover Research That Shapes the Future
							</h1>
							<p className="mt-6 max-w-3xl text-base leading-8 text-white/86 sm:text-lg">
								The {universityName} Research Repository is the university's
								official digital platform for preserving, showcasing, and
								sharing scholarly research, publications, innovations, patents,
								and academic expertise.
							</p>
							<p className="mt-4 max-w-3xl text-base leading-8 text-white/78 sm:text-lg">
								Whether you are a student, researcher, industry partner,
								policymaker, or member of the public, the repository connects
								you with trusted knowledge that drives innovation and creates
								societal impact.
							</p>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row">
								<a className="btn-primary" href="#search">
									<Search className="h-5 w-5" />
									Explore Research
								</a>
								<a className="btn-secondary-dark" href="#researchers">
									<Users className="h-5 w-5" />
									Meet Our Researchers
								</a>
							</div>
						</div>

						<div className="hero-panel rise-in [animation-delay:160ms]">
							<p className="text-sm font-medium text-[#6b7280]">
								Research at a Glance
							</p>
							<div className="mt-4 grid grid-cols-2 gap-3">
								{statistics.slice(0, 4).map((metric) => (
									<div className="metric-tile" key={metric.label}>
										<strong>{metric.value}</strong>
										<span>{metric.label}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="border-b border-[#d8d8d8] bg-white px-4 py-6 sm:px-6 lg:px-8">
				<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
					<p className="max-w-xl text-sm leading-6 text-[#6b7280]">
						Immediate access to research, researchers, innovations,
						publications, departments, faculties, patents, reports, and
						university expertise.
					</p>
					<div className="flex flex-wrap gap-2">
						{trustItems.map((item) => (
							<div className="trust-chip" key={item.label}>
								<item.icon className="h-4 w-4" />
								{item.label}
							</div>
						))}
					</div>
				</div>
			</section>

			<section id="search" className="section-wrap">
				<div className="search-panel rise-in">
					<div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
						<div>
							<span className="eyebrow">Global Search</span>
							<h2 className="mt-4 text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
								Search the Repository
							</h2>
							<p className="mt-4 text-base leading-7 text-[#6b7280]">
								Quickly find research papers, publications, researchers,
								departments, innovations, patents, research areas, and reports
								using keywords, titles, authors, or subjects.
							</p>
						</div>
						<div>
							<label className="search-box" htmlFor="repository-search">
								<Search className="h-5 w-5 text-[#146ef5]" />
								<input
									id="repository-search"
									placeholder="Search research titles, researchers, keywords, departments, or innovations..."
									type="search"
								/>
							</label>
							<div className="mt-4 flex flex-wrap gap-2">
								{quickFilters.map((filter) => (
									<a className="trust-chip" href="#featured" key={filter}>
										{filter}
									</a>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="overview" className="section-wrap pt-0">
				<div className="section-heading">
					<span className="eyebrow">Repository Overview</span>
					<h2>Advancing Knowledge Through Research</h2>
					<p>
						Research is at the heart of every great university. Our repository
						brings together the intellectual contributions of our academic
						community into a single, searchable platform that supports learning,
						collaboration, innovation, and informed decision-making.
					</p>
					<p>
						From peer-reviewed journal articles and conference papers to
						patents, innovations, technical reports, and postgraduate research,
						every contribution reflects our commitment to academic excellence
						and meaningful societal impact.
					</p>
				</div>

				<div className="stats-grid">
					{statistics.map((metric, index) => (
						<div
							className="stat-card rise-in"
							key={metric.label}
							style={{ animationDelay: `${index * 35}ms` }}
						>
							<strong>{metric.value}</strong>
							<span>{metric.label}</span>
						</div>
					))}
				</div>
			</section>

			<section id="featured" className="section-wrap">
				<div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
					<div>
						<span className="eyebrow">Featured Research</span>
						<h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
							Selected research recognised for quality and contribution.
						</h2>
						<p className="mt-4 max-w-2xl text-[#6b7280]">
							Explore research recognised for its academic quality, innovation,
							and contribution to addressing real-world challenges across
							diverse disciplines.
						</p>
					</div>
					<a className="btn-secondary" href="#search">
						View All Research
						<ArrowRight className="h-5 w-5" />
					</a>
				</div>
				<div className="story-grid">
					{featuredResearch.map((item) => (
						<article className="story-card" key={item.title}>
							<span>{item.area}</span>
							<h3>{item.title}</h3>
							<p>{item.text}</p>
						</article>
					))}
				</div>
			</section>

			<section className="section-wrap grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
				<ContentPanel
					cta="Browse Publications"
					eyebrow="Latest Publications"
					href="#search"
					icon={BookOpen}
					text="Stay up to date with the latest scholarly publications contributed by our researchers."
					title="Recently Published"
				/>
				<TagPanel items={publicationTypes} title="Publication types include" />
			</section>

			<section
				id="researchers"
				className="section-wrap grid gap-8 pt-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-start"
			>
				<TagPanel
					items={researcherProfileItems}
					title="Each researcher profile includes"
				/>
				<ContentPanel
					cta="Explore Researcher Profiles"
					eyebrow="Meet Our Researchers"
					href="#search"
					icon={Users}
					text="Discover researchers leading innovative projects, advancing knowledge within their disciplines, and collaborating with institutions and industries around the world."
					title="Research Excellence Starts with Our People"
				/>
			</section>

			<section id="areas" className="section-wrap pt-0">
				<div className="section-heading">
					<span className="eyebrow">Research Areas</span>
					<h2>Explore Research by Discipline</h2>
					<p>
						Browse research organised into subject areas to discover expertise,
						ongoing investigations, and interdisciplinary collaborations.
					</p>
				</div>
				<div className="tag-cloud">
					{researchAreas.map((area) => (
						<a href="#search" key={area}>
							{area}
						</a>
					))}
				</div>
			</section>

			<section className="bg-[#080808] px-4 py-20 text-white sm:px-6 lg:px-8">
				<div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
					<div>
						<span className="eyebrow border-white/20 bg-white/10 text-white">
							Innovation & Technology Transfer
						</span>
						<h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
							From Research to Real-World Impact
						</h2>
						<p className="mt-5 max-w-xl text-base leading-7 text-white/70">
							Innovation extends beyond publication. Through the Intellectual
							Property and Technology Transfer Office (IPTTO), research outcomes
							are transformed into practical solutions, technologies, patents,
							and industry partnerships that benefit society.
						</p>
						<a className="btn-primary mt-8 w-fit" href="#search">
							<Lightbulb className="h-5 w-5" />
							Explore Innovations
						</a>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						{innovationItems.map((item) => (
							<div className="impact-card" key={item}>
								<Lightbulb className="h-6 w-6 text-[#146ef5]" />
								<strong>{item}</strong>
								<p>
									Discover the people, evidence, and pathways connected to this
									innovation activity.
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="section-wrap grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
				<ContentPanel
					cta="View Patents"
					eyebrow="Patents & Intellectual Property"
					href="#search"
					icon={Scale}
					text="Discover publicly available information about patents, intellectual property, and technologies developed through research conducted at the university."
					title="Protecting Innovation"
				/>
				<TagPanel items={patentItems} title="Patent profiles provide" />
			</section>

			<section className="section-wrap grid gap-8 pt-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
				<div className="faculty-visual">
					<Building2 className="h-12 w-12 text-[#146ef5]" />
					<GraduationCap className="h-12 w-12 text-[#146ef5]" />
					<FlaskConical className="h-12 w-12 text-[#146ef5]" />
				</div>
				<ContentPanel
					cta="Browse Faculties"
					eyebrow="Departments & Faculties"
					href="#areas"
					icon={Building2}
					text="Research excellence is driven by collaboration across departments and faculties. Explore the people, publications, and projects shaping each academic discipline."
					title="Research Across Every Faculty"
				/>
			</section>

			<section className="section-wrap pt-0">
				<div className="section-heading">
					<span className="eyebrow">Why Use This Repository?</span>
					<h2>A Trusted Gateway to University Research</h2>
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{valueCards.map((card, index) => (
						<article
							className="feature-surface rise-in"
							key={card.title}
							style={{ animationDelay: `${index * 55}ms` }}
						>
							<div className="feature-icon">
								<card.icon className="h-5 w-5" />
							</div>
							<h3>{card.title}</h3>
							<p>{card.text}</p>
						</article>
					))}
				</div>
			</section>

			<section className="section-wrap grid gap-8 pt-0 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
				<ContentPanel
					cta="Learn How to Contribute"
					eyebrow="For Researchers"
					href="#contact"
					icon={GraduationCap}
					text="The repository enables researchers to increase the visibility of their work, manage academic profiles, preserve institutional knowledge, and showcase research achievements to collaborators, funding organisations, policymakers, and industry."
					title="Share Your Research with a Global Audience"
				/>
				<div className="tag-panel">
					<h3>Fast paths for contributors</h3>
					<div className="mt-5 grid gap-3">
						<div className="contributor-step">
							<BadgeCheck className="h-5 w-5 text-[#146ef5]" />
							<span>Submit research outputs for institutional review.</span>
						</div>
						<div className="contributor-step">
							<Users className="h-5 w-5 text-[#146ef5]" />
							<span>Keep researcher profiles complete and discoverable.</span>
						</div>
						<div className="contributor-step">
							<Lightbulb className="h-5 w-5 text-[#146ef5]" />
							<span>Share innovation and patent opportunities with IPTTO.</span>
						</div>
					</div>
				</div>
			</section>

			<section id="contact" className="px-4 pb-20 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-6 sm:p-10">
					<div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
						<div>
							<span className="eyebrow">Final Call to Action</span>
							<h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal">
								Explore Knowledge. Inspire Innovation. Create Impact.
							</h2>
							<p className="mt-4 max-w-2xl text-[#6b7280]">
								The {universityName} Research Repository connects people with
								trusted research that advances scholarship, strengthens
								collaboration, supports innovation, and contributes to solving
								local and global challenges.
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
							<a className="btn-primary" href="#search">
								<Search className="h-5 w-5" />
								Explore Repository
							</a>
							<a className="btn-secondary" href="#featured">
								Browse Research
								<ArrowRight className="h-5 w-5" />
							</a>
						</div>
					</div>
				</div>
			</section>

			<Footer />
		</main>
	);
}

function Header() {
	const { dashboardHref, isSignedIn } = useDashboardLink();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-white/88 backdrop-blur-xl">
			<nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<a
					className="flex items-center gap-3 text-[#080808] no-underline"
					href="/"
				>
					<div className="flex h-9 w-9 items-center justify-center rounded bg-[#146ef5] text-white">
						<Database className="h-5 w-5" />
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
			<HomeNavigationDrawer
				dashboardHref={dashboardHref}
				isOpen={isOpen}
				isSignedIn={isSignedIn}
				onClose={() => setIsOpen(false)}
			/>
		</header>
	);
}

function HomeNavigationDrawer({
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
					{headerLinks.map((link) => (
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
								<LockKeyhole className="h-4 w-4" />
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
				if (isMounted) {
					setDashboardHref(dashboardHrefForRoles(payload.data?.roles ?? []));
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

function ContentPanel({
	cta,
	eyebrow,
	href,
	icon: Icon,
	text,
	title,
}: {
	cta: string;
	eyebrow: string;
	href: string;
	icon: typeof Database;
	text: string;
	title: string;
}) {
	return (
		<div>
			<span className="eyebrow">{eyebrow}</span>
			<h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
				{title}
			</h2>
			<p className="mt-5 max-w-xl text-base leading-7 text-[#6b7280]">{text}</p>
			<a className="btn-primary mt-8 w-fit" href={href}>
				<Icon className="h-5 w-5" />
				{cta}
			</a>
		</div>
	);
}

function TagPanel({ items, title }: { items: Array<string>; title: string }) {
	return (
		<div className="tag-panel">
			<h3>{title}</h3>
			<div className="mt-5 flex flex-wrap gap-2">
				{items.map((item) => (
					<span key={item}>{item}</span>
				))}
			</div>
		</div>
	);
}

function Footer() {
	return (
		<footer className="site-footer">
			<div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8">
				<div>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded bg-[#146ef5] text-white">
							<Database className="h-5 w-5" />
						</div>
						<div>
							<strong className="block">OAU IPTTO</strong>
							<span className="text-sm text-[#6b7280]">
								Official Research Repository
							</span>
						</div>
					</div>
					<p className="mt-5 max-w-xl text-sm leading-6 text-[#6b7280]">
						The {universityName} Research Repository is the university's
						official platform for preserving, managing, and showcasing scholarly
						publications, innovations, patents, and research activities.
					</p>
				</div>
				<div>
					<h3 className="text-base font-semibold">Quick Links</h3>
					<div className="footer-links">
						{footerLinks.map((link) => (
							<a href="#search" key={link}>
								{link}
							</a>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
