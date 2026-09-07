"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowRight,
	BadgeCheck,
	BookOpen,
	Database,
	FileSearch,
	GraduationCap,
	Handshake,
	LayoutDashboard,
	Lightbulb,
	LockKeyhole,
	LogOut,
	Menu,
	Scale,
	Search,
	Sparkles,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { signOutAndRedirectHome } from "#/lib/sign-out.ts";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

const universityName = "Obafemi Awolowo University";

const headerLinks = [
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

const statistics = [
	{ value: "—", label: "Published Research" },
	{ value: "—", label: "Publications" },
	{ value: "—", label: "Active Researchers" },
	{ value: "—", label: "Departments" },
	{ value: "—", label: "Faculties" },
	{ value: "—", label: "Innovations" },
	{ value: "—", label: "Patents" },
];

type FeaturedResearchItem = {
	area: string;
	title: string;
	text: string;
	href: string;
};

const publicationTypes = [
	"Journal Articles",
	"Conference Papers",
	"Books",
	"Book Chapters",
	"Technical Reports",
	"Theses & Dissertations",
	"Working Papers",
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
		title: "Everything in One Place",
		text: "Find OAU publications, researchers, innovations, and patents without searching multiple sources.",
	},
	{
		icon: BadgeCheck,
		title: "Reviewed by OAU",
		text: "Published research has been checked and approved by the university.",
	},
	{
		icon: Handshake,
		title: "Find People to Work With",
		text: "Discover experts and opportunities for academic or industry partnerships.",
	},
	{
		icon: LockKeyhole,
		title: "Research That Stays Available",
		text: "OAU research is kept safe and accessible for future researchers.",
	},
];

const footerLinks = [
	{ label: "Research", href: "/research" },
	{ label: "Researchers", href: "/researchers" },
	{ label: "Departments", href: "/departments" },
	{ label: "Faculties", href: "/faculties" },
	{ label: "Innovations", href: "/innovations" },
	{ label: "Patents", href: "/patents" },
	{ label: "Reports", href: "/reports" },
	{ label: "News", href: "/news" },
	{ label: "FAQ", href: "/faq" },
	{ label: "Contact", href: "/contact" },
];

function Home() {
	const [repositoryStats, setRepositoryStats] = useState(statistics);
	const [featuredResearch, setFeaturedResearch] = useState<
		FeaturedResearchItem[]
	>([]);
	const [isStatsLoading, setIsStatsLoading] = useState(true);
	const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		void fetch("/api/public-statistics", {
			headers: { Accept: "application/json" },
		})
			.then((response) => {
				if (!response.ok) throw new Error("Statistics unavailable");
				return response.json();
			})
			.then((payload) => {
				if (cancelled || !payload.data) return;
				setRepositoryStats([
					{
						value: String(payload.data.researchRecords),
						label: "Published Research",
					},
					{ value: String(payload.data.publications), label: "Publications" },
					{
						value: String(payload.data.researchers),
						label: "Active Researchers",
					},
					{ value: String(payload.data.departments), label: "Departments" },
					{ value: String(payload.data.faculties), label: "Faculties" },
					{ value: String(payload.data.innovations), label: "Innovations" },
					{ value: String(payload.data.patents), label: "Patents" },
				]);
			})
			.catch(() => undefined)
			.finally(() => {
				if (!cancelled) setIsStatsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		void fetch("/api/public-research", {
			headers: { Accept: "application/json" },
		})
			.then((response) => {
				if (!response.ok) throw new Error("Research unavailable");
				return response.json();
			})
			.then((payload) => {
				if (cancelled || !Array.isArray(payload.data)) return;
				setFeaturedResearch(
					payload.data
						.slice(0, 3)
						.map(
							(item: {
								title: string;
								description: string;
								href: string;
								tags?: string[];
							}) => ({
								area: item.tags?.[0] ?? "Published Research",
								title: item.title,
								text: item.description,
								href: item.href,
							}),
						),
				);
			})
			.catch(() => undefined)
			.finally(() => {
				if (!cancelled) setIsFeaturedLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

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
								OAU Research and Innovation
							</div>
							<h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] tracking-normal sm:text-6xl lg:text-[76px]">
								Find OAU Research, Researchers, and Innovations
							</h1>
							<p className="mt-6 max-w-3xl text-base leading-8 text-white/86 sm:text-lg">
								Search trusted research from across {universityName}. Discover
								publications, experts, patents, and ideas ready for real-world
								use.
							</p>
							<div className="mt-8 flex">
								<a className="btn-secondary-dark" href="#researchers">
									<Users className="h-5 w-5" />
									Find a Researcher
								</a>
							</div>
						</div>

						<div className="hero-panel rise-in [animation-delay:160ms]">
							<p className="text-sm font-medium text-[#6b7280]">
								Research at a Glance
							</p>
							<div className="mt-4 grid grid-cols-2 gap-3">
								{repositoryStats.slice(0, 4).map((metric) => (
									<div className="metric-tile" key={metric.label}>
										<strong className="min-h-10">
											{isStatsLoading ? (
												<>
													<span className="sr-only">
														Loading {metric.label}
													</span>
													<span
														aria-hidden="true"
														className="mt-1 block h-8 w-16 animate-pulse rounded bg-[#d8d8d8]"
													/>
												</>
											) : (
												metric.value
											)}
										</strong>
										<span>{metric.label}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="overview" className="section-wrap pt-0">
				<div className="section-heading">
					<span className="eyebrow">OAU Research at a Glance</span>
					<h2>One Place for Research Across OAU</h2>
					<p>
						Explore journal articles, conference papers, postgraduate research,
						innovations, and patents from across the university.
					</p>
				</div>

				<div className="stats-grid">
					{repositoryStats.map((metric, index) => (
						<div
							className="stat-card rise-in"
							key={metric.label}
							style={{ animationDelay: `${index * 35}ms` }}
						>
							<strong className="min-h-10">
								{isStatsLoading ? (
									<>
										<span className="sr-only">Loading {metric.label}</span>
										<span
											aria-hidden="true"
											className="mt-1 block h-8 w-16 animate-pulse rounded bg-[#d8d8d8]"
										/>
									</>
								) : (
									metric.value
								)}
							</strong>
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
							Research Making a Difference
						</h2>
						<p className="mt-4 max-w-2xl text-[#6b7280]">
							See work tackling real problems in energy, health, agriculture,
							and more.
						</p>
					</div>
					<a className="btn-secondary" href="/research">
						View All Research
						<ArrowRight className="h-5 w-5" />
					</a>
				</div>
				<div className="story-grid">
					{isFeaturedLoading ? (
						<div className="lg:col-span-3">
							<LoadingSkeleton label="Loading featured research" rows={3} />
						</div>
					) : featuredResearch.length ? (
						featuredResearch.map((item) => (
							<a href={item.href} key={item.href}>
								<article className="story-card h-full">
									<span>{item.area}</span>
									<h3>{item.title}</h3>
									<p>{item.text}</p>
								</article>
							</a>
						))
					) : (
						<div className="story-card lg:col-span-3">
							<h3>Published research is being prepared</h3>
							<p>
								Browse the catalogue to see all currently available records.
							</p>
						</div>
					)}
				</div>
			</section>

			<section className="section-wrap grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
				<ContentPanel
					cta="Browse Publications"
					eyebrow="Latest Publications"
					href="/publications"
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
				<div className="researcher-visual">
					<img
						alt="University academic reviewing research papers in his office"
						src="/oau-academic-researcher.png"
					/>
				</div>
				<ContentPanel
					cta="Explore Researcher Profiles"
					eyebrow="Meet Our Researchers"
					href="/researchers"
					icon={Users}
					text="Find OAU experts by name, department, or research interest and explore their published work."
					title="Find the Right Researcher"
				/>
			</section>

			<section id="areas" className="section-wrap pt-0">
				<div className="section-heading">
					<span className="eyebrow">Research Areas</span>
					<h2>Explore Research by Discipline</h2>
					<p>Choose a subject to find related research and experts.</p>
				</div>
				<div className="tag-cloud">
					{researchAreas.map((area) => (
						<a href={`/research?query=${encodeURIComponent(area)}`} key={area}>
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
							See how OAU ideas become useful products, protected inventions,
							and industry partnerships—with support from IPTTO.
						</p>
						<a className="btn-primary mt-8 w-fit" href="/innovations">
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
									See the people, research, and next steps behind this work.
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
					href="/patents"
					icon={Scale}
					text="Explore inventions developed at OAU, who created them, and how they may be used."
					title="Protecting Innovation"
				/>
				<TagPanel items={patentItems} title="Patent profiles provide" />
			</section>

			<section className="section-wrap pt-0">
				<div className="faculty-visual">
					<img
						alt="University research faculty deliberating around a meeting table"
						src="/research-faculty-deliberation.png"
					/>
				</div>
			</section>

			<section className="section-wrap pt-0">
				<div className="section-heading">
					<span className="eyebrow">Why Use This Site?</span>
					<h2>Trusted OAU Research, Easy to Find</h2>
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
					cta="Add Your Research"
					eyebrow="For Researchers"
					href="/sign-in"
					icon={GraduationCap}
					text="Add your work once so students, collaborators, funders, policymakers, and industry partners can find it."
					title="Help More People Find Your Research"
				/>
				<div className="tag-panel">
					<h3>Fast paths for contributors</h3>
					<div className="mt-5 grid gap-3">
						<div className="contributor-step">
							<BadgeCheck className="h-5 w-5 text-[#146ef5]" />
							<span>Add your research and send it for review.</span>
						</div>
						<div className="contributor-step">
							<Users className="h-5 w-5 text-[#146ef5]" />
							<span>Keep your public profile complete and up to date.</span>
						</div>
						<div className="contributor-step">
							<Lightbulb className="h-5 w-5 text-[#146ef5]" />
							<span>
								Tell IPTTO about ideas with patent or commercial potential.
							</span>
						</div>
					</div>
				</div>
			</section>

			<section id="contact" className="px-4 pb-20 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-6 sm:p-10">
					<div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
						<div>
							<span className="eyebrow">Start Exploring</span>
							<h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal">
								Find Research. Meet Experts. Build Partnerships.
							</h2>
							<p className="mt-4 max-w-2xl text-[#6b7280]">
								Search trusted OAU work or connect with the people behind it.
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
							<a className="btn-primary" href="/research">
								<Search className="h-5 w-5" />
								Search Research
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
