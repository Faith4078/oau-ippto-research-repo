"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BadgeCheck,
	BookOpen,
	Building2,
	CalendarDays,
	ChartNoAxesCombined,
	Database,
	FileSearch,
	GraduationCap,
	Handshake,
	Lightbulb,
	LockKeyhole,
	Menu,
	Scale,
	Search,
	Sparkles,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PublicNavActions } from "#/components/public-pages/public-nav-actions.tsx";

const universityName = "Obafemi Awolowo University";

const headerLinks = [
	{ label: "Home", href: "/", icon: Database },
	{ label: "Public Research", href: "/research", icon: FileSearch },
	{ label: "Researchers", href: "/researchers", icon: Users },
	{ label: "Publications", href: "/publications", icon: BookOpen },
	{ label: "Departments", href: "/departments", icon: Building2 },
	{ label: "Faculties", href: "/faculties", icon: GraduationCap },
	{ label: "Research Areas", href: "/research-areas", icon: Sparkles },
	{ label: "Innovations", href: "/innovations", icon: Lightbulb },
	{ label: "Patents", href: "/patents", icon: Scale },
	{ label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
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
	id: string;
	area: string;
	title: string;
	text: string;
	href: string;
	authorName: string | null;
	publishedDate: string;
	imageFileId: string | null;
};

type PublicationDisplayItem = {
	id: string;
	title: string;
	type: string;
	journal: string | null;
	publishedDate: string;
	href: string;
	authorName: string | null;
	imageFileId: string | null;
	researchRecordId: string;
};

type InnovationDisplayItem = {
	id: string;
	title: string;
	summary: string;
	href: string;
	trl: number | null;
};

type PatentDisplayItem = {
	id: string;
	title: string;
	href: string;
	status: string;
};

/** Mirrors `SearchResultPayload` from `#/components/public-pages/public-pages.tsx` — the same `/api/search` response shape the innovations/patents collection pages already consume. */
type SearchResultPayload = {
	id: string;
	entityType:
		| "research"
		| "researcher"
		| "publication"
		| "innovation"
		| "patent";
	title: string;
	summary: string;
	url: string;
	year: number | null;
	metadata: Record<string, string | number | boolean | null>;
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
	const [featuredImageUrls, setFeaturedImageUrls] = useState<
		Record<string, string>
	>({});
	const [isStatsLoading, setIsStatsLoading] = useState(true);
	const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
	const [publications, setPublications] = useState<PublicationDisplayItem[]>(
		[],
	);
	const [publicationImageUrls, setPublicationImageUrls] = useState<
		Record<string, string>
	>({});
	const [isPublicationsLoading, setIsPublicationsLoading] = useState(true);
	const [innovations, setInnovations] = useState<InnovationDisplayItem[]>([]);
	const [isInnovationsLoading, setIsInnovationsLoading] = useState(true);
	const [patents, setPatents] = useState<PatentDisplayItem[]>([]);
	const [isPatentsLoading, setIsPatentsLoading] = useState(true);

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
								id: string;
								title: string;
								description: string;
								href: string;
								tags?: string[];
								authorName?: string | null;
								publishedDate?: string;
								imageFileId?: string | null;
							}) => ({
								id: item.id,
								area: item.tags?.[0] ?? "Published Research",
								title: item.title,
								text: item.description,
								href: item.href,
								authorName: item.authorName ?? null,
								publishedDate: item.publishedDate ?? "Published",
								imageFileId: item.imageFileId ?? null,
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

	useEffect(() => {
		const itemsWithImages = featuredResearch.filter((item) => item.imageFileId);
		if (!itemsWithImages.length) return;

		let cancelled = false;
		void Promise.all(
			itemsWithImages.map(async (item) => {
				try {
					const response = await fetch("/api/files/signed-download-url", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							fileId: item.imageFileId,
							researchRecordId: item.id,
						}),
					});
					if (!response.ok) return null;
					const payload = (await response.json()) as {
						data?: { url?: string };
					};
					return payload.data?.url
						? ([item.id, payload.data.url] as const)
						: null;
				} catch {
					return null;
				}
			}),
		).then((results) => {
			if (cancelled) return;
			const resolved = Object.fromEntries(
				results.filter((entry): entry is readonly [string, string] =>
					Boolean(entry),
				),
			);
			setFeaturedImageUrls((previous) => ({ ...previous, ...resolved }));
		});

		return () => {
			cancelled = true;
		};
	}, [featuredResearch]);

	useEffect(() => {
		let cancelled = false;
		void fetch("/api/public-publications", {
			headers: { Accept: "application/json" },
		})
			.then((response) => {
				if (!response.ok) throw new Error("Publications unavailable");
				return response.json();
			})
			.then((payload) => {
				if (cancelled || !Array.isArray(payload.data)) return;
				setPublications(payload.data as PublicationDisplayItem[]);
			})
			.catch(() => undefined)
			.finally(() => {
				if (!cancelled) setIsPublicationsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		const itemsWithImages = publications.filter((item) => item.imageFileId);
		if (!itemsWithImages.length) return;

		let cancelled = false;
		void Promise.all(
			itemsWithImages.map(async (item) => {
				try {
					const response = await fetch("/api/files/signed-download-url", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							fileId: item.imageFileId,
							researchRecordId: item.researchRecordId,
						}),
					});
					if (!response.ok) return null;
					const payload = (await response.json()) as {
						data?: { url?: string };
					};
					return payload.data?.url
						? ([item.id, payload.data.url] as const)
						: null;
				} catch {
					return null;
				}
			}),
		).then((results) => {
			if (cancelled) return;
			const resolved = Object.fromEntries(
				results.filter((entry): entry is readonly [string, string] =>
					Boolean(entry),
				),
			);
			setPublicationImageUrls((previous) => ({ ...previous, ...resolved }));
		});

		return () => {
			cancelled = true;
		};
	}, [publications]);

	useEffect(() => {
		let cancelled = false;
		void fetch("/api/search", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				keyword: "",
				filters: { entityTypes: ["innovation"] },
				page: 1,
				pageSize: 4,
				sort: "newest",
			}),
		})
			.then((response) => {
				if (!response.ok) throw new Error("Innovations unavailable");
				return response.json();
			})
			.then((payload) => {
				if (cancelled) return;
				const items = (payload.data?.items ?? []) as SearchResultPayload[];
				setInnovations(
					items.map((item) => ({
						id: item.id,
						title: item.title,
						summary:
							item.summary ||
							"See the research and next steps behind this work.",
						href: item.url,
						trl:
							typeof item.metadata.technologyReadinessLevel === "number"
								? item.metadata.technologyReadinessLevel
								: null,
					})),
				);
			})
			.catch(() => undefined)
			.finally(() => {
				if (!cancelled) setIsInnovationsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		void fetch("/api/search", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				keyword: "",
				filters: { entityTypes: ["patent"] },
				page: 1,
				pageSize: 4,
				sort: "newest",
			}),
		})
			.then((response) => {
				if (!response.ok) throw new Error("Patents unavailable");
				return response.json();
			})
			.then((payload) => {
				if (cancelled) return;
				const items = (payload.data?.items ?? []) as SearchResultPayload[];
				setPatents(
					items.map((item) => ({
						id: item.id,
						title: item.title,
						href: item.url,
						status: String(item.metadata.status ?? "filed"),
					})),
				);
			})
			.catch(() => undefined)
			.finally(() => {
				if (!cancelled) setIsPatentsLoading(false);
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
					<Link className="btn-secondary" to="/research">
						View All Research
						<ArrowRight className="h-5 w-5" />
					</Link>
				</div>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{isFeaturedLoading ? (
						<>
							<span className="sr-only" aria-live="polite">
								Loading featured research
							</span>
							<FeaturedCardSkeleton />
							<FeaturedCardSkeleton />
							<FeaturedCardSkeleton />
						</>
					) : featuredResearch.length ? (
						featuredResearch.map((item) => (
							<FeaturedResearchCard
								imageUrl={featuredImageUrls[item.id]}
								item={item}
								key={item.href}
							/>
						))
					) : (
						<div className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-6 text-center sm:col-span-2 lg:col-span-3">
							<h3 className="text-xl font-semibold">
								Published research is being prepared
							</h3>
							<p className="mt-2 text-sm text-[#6b7280]">
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

			<section className="section-wrap pt-0">
				<div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
					<div>
						<span className="eyebrow">Recent Publications</span>
						<h2 className="mt-4 text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
							Fresh From OAU Researchers
						</h2>
					</div>
					<Link className="btn-secondary" to="/publications">
						View All Publications
						<ArrowRight className="h-5 w-5" />
					</Link>
				</div>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{isPublicationsLoading ? (
						<>
							<span className="sr-only" aria-live="polite">
								Loading recent publications
							</span>
							<FeaturedCardSkeleton />
							<FeaturedCardSkeleton />
							<FeaturedCardSkeleton />
						</>
					) : publications.length ? (
						publications
							.slice(0, 6)
							.map((item) => (
								<PublicationCard
									imageUrl={publicationImageUrls[item.id]}
									item={item}
									key={item.id}
								/>
							))
					) : (
						<div className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-6 text-center sm:col-span-2 lg:col-span-3">
							<h3 className="text-xl font-semibold">
								Publications are being prepared
							</h3>
							<p className="mt-2 text-sm text-[#6b7280]">
								Browse the catalogue to see all currently available
								publications.
							</p>
						</div>
					)}
				</div>
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
						<Link className="btn-primary mt-8 w-fit" to="/innovations">
							<Lightbulb className="h-5 w-5" />
							Explore Innovations
						</Link>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						{isInnovationsLoading ? (
							<>
								<span className="sr-only" aria-live="polite">
									Loading innovations
								</span>
								<ImpactCardSkeleton />
								<ImpactCardSkeleton />
								<ImpactCardSkeleton />
								<ImpactCardSkeleton />
							</>
						) : innovations.length ? (
							innovations
								.slice(0, 4)
								.map((item) => <InnovationCard item={item} key={item.id} />)
						) : (
							<div className="impact-card sm:col-span-2">
								<Lightbulb className="h-6 w-6 text-[#146ef5]" />
								<strong>Innovations are being prepared</strong>
								<p>Check back soon for published innovation records.</p>
							</div>
						)}
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
				<div className="tag-panel">
					<h3>Recent Patent Activity</h3>
					<div className="mt-5 grid gap-3">
						{isPatentsLoading ? (
							<>
								<span className="sr-only" aria-live="polite">
									Loading patents
								</span>
								<PatentRowSkeleton />
								<PatentRowSkeleton />
								<PatentRowSkeleton />
							</>
						) : patents.length ? (
							patents
								.slice(0, 4)
								.map((item) => <PatentRow item={item} key={item.id} />)
						) : (
							<p className="text-sm text-[#6b7280]">
								Patent activity is being prepared.
							</p>
						)}
					</div>
				</div>
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
							<Link className="btn-primary" to="/research">
								<Search className="h-5 w-5" />
								Search Research
							</Link>
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
				<Link
					className="flex items-center gap-3 text-[#080808] no-underline"
					to="/"
				>
					<div className="flex h-9 w-9 items-center justify-center rounded bg-[#146ef5] text-white">
						<Database className="h-5 w-5" />
					</div>
					<div className="leading-tight">
						<strong className="block text-sm font-semibold">OAU IPTTO</strong>
						<span className="text-xs text-[#6b7280]">Research repository</span>
					</div>
				</Link>
				<div className="ml-auto flex items-center gap-2">
					<PublicNavActions
						dashboardHref={dashboardHref}
						isSignedIn={isSignedIn}
					/>
					<button
						aria-expanded={isOpen}
						aria-label="Open navigation menu"
						className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded border border-[#d8d8d8] bg-white text-[#080808] transition hover:border-[#146ef5] hover:text-[#146ef5] active:scale-[0.98]"
						onClick={() => setIsOpen(true)}
						type="button"
					>
						<Menu className="h-5 w-5" />
					</button>
				</div>
			</nav>
			<HomeNavigationDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</header>
	);
}

function HomeNavigationDrawer({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
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
				className={`absolute right-0 top-0 flex h-dvh w-[min(86vw,340px)] flex-col overflow-hidden border-[#e5e7eb] border-l bg-white p-4 shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
			>
				<div className="flex items-center justify-between gap-4 border-[#e5e7eb] border-b pb-3">
					<div>
						<strong className="block text-sm font-semibold">Explore</strong>
						<span className="text-xs text-[#6b7280]">Repository sections</span>
					</div>
					<button
						aria-label="Close navigation menu"
						className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#d8d8d8] text-[#6b7280] transition hover:border-[#146ef5] hover:text-[#146ef5]"
						onClick={onClose}
						type="button"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="mt-4 grid flex-1 content-start gap-1 overflow-y-auto pb-3">
					{headerLinks.map((link) => {
						const Icon = link.icon;

						return (
							<Link
								className="group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#f4f7ff] hover:text-[#146ef5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146ef5]/30"
								key={link.href}
								onClick={onClose}
								to={link.href}
							>
								<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f7f7f7] text-[#6b7280] transition group-hover:bg-white group-hover:text-[#146ef5]">
									<Icon className="h-4 w-4" />
								</span>
								<span>{link.label}</span>
							</Link>
						);
					})}
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
			<Link className="btn-primary mt-8 w-fit" to={href}>
				<Icon className="h-5 w-5" />
				{cta}
			</Link>
		</div>
	);
}

function FeaturedResearchCard({
	item,
	imageUrl,
}: {
	item: FeaturedResearchItem;
	imageUrl?: string;
}) {
	return (
		<Link
			className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#d8d8d8] bg-white transition hover:-translate-y-1 hover:border-[#146ef5] hover:shadow-lg"
			to={item.href}
		>
			<div className="aspect-video w-full shrink-0 overflow-hidden bg-[#f0f0f0]">
				{imageUrl ? (
					<img
						alt={item.title}
						className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
						src={imageUrl}
					/>
				) : (
					<ResearchImagePlaceholder />
				)}
			</div>
			<div className="flex flex-1 flex-col gap-2 p-5">
				<span className="w-fit rounded-full border border-[#d8d8d8] bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#146ef5]">
					{item.area}
				</span>
				<h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-normal text-[#080808]">
					{item.title}
				</h3>
				<div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-[#6b7280]">
					<span className="inline-flex items-center gap-1">
						<Users className="h-3.5 w-3.5" />
						{item.authorName ?? "OAU Researcher"}
					</span>
					<span className="inline-flex items-center gap-1">
						<CalendarDays className="h-3.5 w-3.5" />
						{item.publishedDate}
					</span>
				</div>
			</div>
		</Link>
	);
}

/** A tasteful, offline-safe placeholder shown when a research record has no uploaded image. */
function ResearchImagePlaceholder() {
	return (
		<div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eef4ff] via-[#e3ecff] to-[#c9dcff]">
			<div
				aria-hidden="true"
				className="absolute inset-0 opacity-60"
				style={{
					backgroundImage:
						"radial-gradient(circle at 18% 22%, rgba(20,110,245,0.28), transparent 42%), radial-gradient(circle at 82% 78%, rgba(20,110,245,0.22), transparent 45%)",
				}}
			/>
			<div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/70 text-[#146ef5] shadow-sm backdrop-blur-sm">
				<BookOpen className="h-6 w-6" />
			</div>
		</div>
	);
}

function FeaturedCardSkeleton() {
	return (
		<div
			aria-hidden="true"
			className="flex h-full flex-col overflow-hidden rounded-lg border border-[#d8d8d8] bg-white"
		>
			<div className="aspect-video w-full animate-pulse bg-[#e5e7eb]" />
			<div className="flex flex-1 flex-col gap-3 p-5">
				<div className="h-5 w-24 animate-pulse rounded-full bg-[#eef0f3]" />
				<div className="h-4 w-full animate-pulse rounded-full bg-[#d8d8d8]" />
				<div className="h-4 w-2/3 animate-pulse rounded-full bg-[#d8d8d8]" />
				<div className="mt-auto flex items-center gap-3 pt-2">
					<div className="h-3 w-20 animate-pulse rounded-full bg-[#eef0f3]" />
					<div className="h-3 w-16 animate-pulse rounded-full bg-[#eef0f3]" />
				</div>
			</div>
		</div>
	);
}

function PublicationCard({
	item,
	imageUrl,
}: {
	item: PublicationDisplayItem;
	imageUrl?: string;
}) {
	return (
		<Link
			className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#d8d8d8] bg-white transition hover:-translate-y-1 hover:border-[#146ef5] hover:shadow-lg"
			to={item.href}
		>
			<div className="aspect-video w-full shrink-0 overflow-hidden bg-[#f0f0f0]">
				{imageUrl ? (
					<img
						alt={item.title}
						className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
						src={imageUrl}
					/>
				) : (
					<ResearchImagePlaceholder />
				)}
			</div>
			<div className="flex flex-1 flex-col gap-2 p-5">
				<span className="w-fit rounded-full border border-[#d8d8d8] bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#146ef5]">
					{formatPublicationType(item.type)}
				</span>
				<h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-normal text-[#080808]">
					{item.title}
				</h3>
				{item.journal ? (
					<p className="line-clamp-1 text-xs text-[#6b7280]">{item.journal}</p>
				) : null}
				<div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-[#6b7280]">
					<span className="inline-flex items-center gap-1">
						<Users className="h-3.5 w-3.5" />
						{item.authorName ?? "OAU Researcher"}
					</span>
					<span className="inline-flex items-center gap-1">
						<CalendarDays className="h-3.5 w-3.5" />
						{item.publishedDate}
					</span>
				</div>
			</div>
		</Link>
	);
}

function formatPublicationType(type: string) {
	return type
		.replace(/_/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function InnovationCard({ item }: { item: InnovationDisplayItem }) {
	return (
		<Link className="impact-card group flex flex-col gap-2" to={item.href}>
			<div className="flex items-center justify-between gap-3">
				<Lightbulb className="h-6 w-6 text-[#146ef5]" />
				<span className="impact-card-badge">
					{item.trl ? `TRL ${item.trl}` : "Published"}
				</span>
			</div>
			<strong className="line-clamp-2">{item.title}</strong>
			<p className="line-clamp-3">{item.summary}</p>
		</Link>
	);
}

function ImpactCardSkeleton() {
	return (
		<div aria-hidden="true" className="impact-card flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<div className="h-6 w-6 animate-pulse rounded-full bg-white/15" />
				<div className="h-5 w-14 animate-pulse rounded-full bg-white/15" />
			</div>
			<div className="mt-4 h-4 w-full animate-pulse rounded-full bg-white/15" />
			<div className="h-4 w-2/3 animate-pulse rounded-full bg-white/15" />
			<div className="mt-2 h-3 w-full animate-pulse rounded-full bg-white/10" />
			<div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
		</div>
	);
}

function PatentRow({ item }: { item: PatentDisplayItem }) {
	return (
		<Link
			className="contributor-step justify-between gap-3 transition hover:border-[#146ef5]"
			to={item.href}
		>
			<span className="flex min-w-0 items-center gap-3">
				<Scale className="h-5 w-5 shrink-0 text-[#146ef5]" />
				<span className="truncate">{item.title}</span>
			</span>
			<span className="shrink-0 rounded-full border border-[#d8d8d8] bg-white px-2 py-0.5 text-xs font-semibold text-[#146ef5]">
				{formatPatentStatus(item.status)}
			</span>
		</Link>
	);
}

function formatPatentStatus(status: string) {
	return status
		.replace(/_/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PatentRowSkeleton() {
	return (
		<div aria-hidden="true" className="contributor-step justify-between gap-3">
			<span className="flex min-w-0 items-center gap-3">
				<div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-[#eef0f3]" />
				<div className="h-3.5 w-40 animate-pulse rounded-full bg-[#eef0f3]" />
			</span>
			<div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-[#eef0f3]" />
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
							<Link key={link.href} to={link.href}>
								{link.label}
							</Link>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
