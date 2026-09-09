"use client";

import {
	BarChart3,
	BookOpenCheck,
	Building2,
	Download,
	FileText,
	Globe2,
	Hash,
	Layers3,
	RefreshCw,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
	PublicationAnalytics,
	PublicationAnalyticsGroup,
	PublicationAnalyticsMetric,
	PublicationAnalyticsRange,
	PublicationAnalyticsRecentItem,
	PublicationTrendPoint,
} from "#/application/reports.ts";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";
import { cn } from "#/lib/utils.ts";

type PublicationAnalyticsView = "department" | "faculty" | "super";

type PublicationAnalyticsPayload = Omit<
	PublicationAnalytics,
	"generatedAt" | "period" | "recentPublications"
> & {
	generatedAt: string | Date;
	period: Omit<
		PublicationAnalytics["period"],
		"from" | "previousFrom" | "previousTo" | "to"
	> & {
		from: string | Date;
		previousFrom: string | Date;
		previousTo: string | Date;
		to: string | Date;
	};
	recentPublications: Array<
		Omit<PublicationAnalyticsRecentItem, "publishedOn"> & {
			publishedOn: string | Date | null;
		}
	>;
};

const rangeOptions: Array<{ label: string; value: PublicationAnalyticsRange }> =
	[
		{ label: "30 days", value: "30d" },
		{ label: "90 days", value: "90d" },
		{ label: "180 days", value: "180d" },
		{ label: "12 months", value: "365d" },
	];

const viewCopy: Record<
	PublicationAnalyticsView,
	{ description: string; eyebrow: string; title: string }
> = {
	department: {
		description:
			"Track publication output for your department, compare it with the previous matching duration, and identify metadata gaps before work goes public.",
		eyebrow: "Department publication analytics",
		title: "Department publication performance",
	},
	faculty: {
		description:
			"Compare department contribution, publication types, visibility, and metadata quality across your faculty.",
		eyebrow: "Faculty publication analytics",
		title: "Faculty publication performance",
	},
	super: {
		description:
			"Monitor university-wide publication output, faculty contribution, visibility readiness, and publication metadata coverage.",
		eyebrow: "University publication analytics",
		title: "Publication performance across OAU",
	},
};

const metricIcons: Record<PublicationAnalyticsMetric["key"], typeof BarChart3> =
	{
		activeDepartments: Building2,
		activeFaculties: Layers3,
		doiCoverageRate: Hash,
		linkedResearchRecords: FileText,
		publications: BookOpenCheck,
		publicVisibilityRate: Globe2,
	};

export function PublicationAnalyticsPage({
	view,
}: {
	view: PublicationAnalyticsView;
}) {
	const [analytics, setAnalytics] =
		useState<PublicationAnalyticsPayload | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [range, setRange] = useState<PublicationAnalyticsRange>("365d");

	const loadAnalytics = useCallback(async () => {
		setError(null);
		setLoading(true);
		try {
			const response = await fetch(
				`/api/dashboard/publication-analytics?view=${view}&range=${range}`,
				{ cache: "no-store" },
			);
			const payload = await response.json();

			if (!response.ok) {
				throw new Error(
					payload.error?.message ??
						"Publication analytics could not be loaded.",
				);
			}

			setAnalytics(payload.data ?? null);
		} catch (loadError) {
			const message =
				loadError instanceof Error ? loadError.message : "Try again shortly.";
			setError(message);
			toast.error("Publication analytics unavailable", {
				description: message,
			});
		} finally {
			setLoading(false);
		}
	}, [range, view]);

	useEffect(() => {
		void loadAnalytics();
	}, [loadAnalytics]);

	const comparisonLabel = useMemo(() => {
		if (!analytics) return "previous matching duration";

		return `${formatDate(analytics.period.previousFrom)} – ${formatDate(
			analytics.period.previousTo,
		)}`;
	}, [analytics]);
	const copy = viewCopy[view];

	return (
		<div className="space-y-6">
			<header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
				<div>
					<p className="text-sm font-semibold text-[#146ef5]">{copy.eyebrow}</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
						{copy.title}
					</h1>
					<p className="mt-3 max-w-3xl text-[#6b7280]">{copy.description}</p>
					{analytics ? (
						<p className="mt-2 text-sm text-[#6b7280]">
							Scope:{" "}
							<span className="font-semibold text-[#080808]">
								{analytics.scope.label}
							</span>{" "}
							· Current period: {formatDate(analytics.period.from)} –{" "}
							{formatDate(analytics.period.to)}
						</p>
					) : null}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex rounded border border-[#d8d8d8] bg-white p-1">
						{rangeOptions.map((option) => (
							<button
								className={cn(
									"rounded px-3 py-2 text-sm font-semibold",
									range === option.value
										? "bg-[#146ef5] text-white"
										: "text-[#6b7280] hover:text-[#080808]",
								)}
								key={option.value}
								onClick={() => setRange(option.value)}
								type="button"
							>
								{option.label}
							</button>
						))}
					</div>
					<Button
						disabled={loading}
						onClick={() => void loadAnalytics()}
						variant="outline"
					>
						<RefreshCw className="h-4 w-4" />
						Refresh
					</Button>
					<Button
						disabled={!analytics}
						onClick={() => analytics && downloadAnalyticsCsv(analytics)}
						variant="outline"
					>
						<Download className="h-4 w-4" />
						Export CSV
					</Button>
				</div>
			</header>

			{loading ? (
				<LoadingSkeleton label="Loading publication analytics" rows={7} />
			) : error ? (
				<AnalyticsEmptyState
					description={error}
					title="Publication analytics could not be loaded"
				/>
			) : analytics ? (
				<>
					<MetricGrid
						comparisonLabel={comparisonLabel}
						metrics={analytics.metrics}
					/>
					<div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
						<PublicationTrendChart
							periodLabel={analytics.period.label}
							points={analytics.trend}
						/>
						<BreakdownCard
							description="How publication records split across journal articles, conference papers, books, theses, and other types."
							items={analytics.byType}
							title="Publication type mix"
						/>
					</div>
					<div className="grid gap-6 xl:grid-cols-2">
						<BreakdownCard
							description={
								analytics.scope.level === "university"
									? "Faculty contribution for the selected duration, with public-ready publication counts included."
									: "Faculty contribution within the selected administrative scope."
							}
							items={analytics.byFaculty}
							title="Publication output by faculty"
						/>
						<BreakdownCard
							description="Top contributing departments, including the previous matching duration for context."
							items={analytics.byDepartment}
							title="Publication output by department"
						/>
					</div>
					<div className="grid gap-6 xl:grid-cols-2">
						<BreakdownCard
							description="Shows whether publication records are attached to public, restricted, or private research."
							items={analytics.byAccessLevel}
							title="Visibility readiness"
						/>
						<BreakdownCard
							description="Shows workflow status for research records that have publication metadata."
							items={analytics.byStatus}
							title="Research status behind publications"
						/>
					</div>
					<RecentPublicationsTable
						publications={analytics.recentPublications}
					/>
					<p className="text-xs text-[#6b7280]">
						Generated {formatDateTime(analytics.generatedAt)}. Comparisons use{" "}
						{comparisonLabel}.
					</p>
				</>
			) : (
				<AnalyticsEmptyState
					description="No publication analytics were returned for this scope."
					title="No analytics available"
				/>
			)}
		</div>
	);
}

function MetricGrid({
	comparisonLabel,
	metrics,
}: {
	comparisonLabel: string;
	metrics: readonly PublicationAnalyticsMetric[];
}) {
	return (
		<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{metrics.map((metric) => {
				const Icon = metricIcons[metric.key];
				return (
					<Card
						className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none"
						key={metric.key}
					>
						<CardContent className="p-4">
							<div className="mb-4 flex items-start justify-between gap-3">
								<span className="flex h-10 w-10 items-center justify-center rounded border border-[#cfe0ff] bg-[#eef4ff] text-[#146ef5]">
									<Icon className="h-5 w-5" />
								</span>
								<ChangeBadge changePercent={metric.changePercent} />
							</div>
							<p className="text-sm font-medium text-[#6b7280]">
								{metric.label}
							</p>
							<strong className="mt-2 block text-3xl font-semibold tracking-normal">
								{formatMetricValue(metric)}
							</strong>
							<p className="mt-2 text-sm text-[#6b7280]">{metric.helpText}</p>
							<p className="mt-3 text-xs font-medium text-[#6b7280]">
								Previous: {formatMetricPreviousValue(metric)} ·{" "}
								{comparisonLabel}
							</p>
						</CardContent>
					</Card>
				);
			})}
		</section>
	);
}

function PublicationTrendChart({
	periodLabel,
	points,
}: {
	periodLabel: string;
	points: readonly PublicationTrendPoint[];
}) {
	const maxCount = Math.max(
		1,
		...points.flatMap((point) => [point.count, point.previousCount]),
	);

	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
				<CardTitle>Publication trend</CardTitle>
				<CardDescription>
					{periodLabel} compared with the previous matching duration.
				</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto p-4">
				<div className="mb-4 flex flex-wrap gap-4 text-sm text-[#6b7280]">
					<span className="inline-flex items-center gap-2">
						<span className="h-3 w-3 rounded-sm bg-[#146ef5]" /> Current
					</span>
					<span className="inline-flex items-center gap-2">
						<span className="h-3 w-3 rounded-sm bg-[#b8cffb]" /> Previous
					</span>
				</div>
				<div
					className="grid min-w-150 items-end gap-3 border-[#d8d8d8] border-b bg-[linear-gradient(to_top,#f0f0f0_1px,transparent_1px)] bg-size-[100%_48px] pb-6"
					style={{
						gridTemplateColumns: `repeat(${Math.max(
							points.length,
							1,
						)}, minmax(36px, 1fr))`,
					}}
				>
					{points.map((point) => (
						<div
							className="flex min-w-0 flex-col items-center gap-2"
							key={point.label}
						>
							<div className="flex h-56 w-full max-w-13 items-end justify-center gap-1 rounded bg-[#f7f7f7] px-1">
								<span
									title={`${point.previousCount} publications in previous period`}
									className="w-3 rounded-t bg-[#b8cffb]"
									style={{
										height: `${barHeight(point.previousCount, maxCount)}%`,
									}}
								/>
								<span
									title={`${point.count} publications in current period`}
									className="w-3 rounded-t bg-[#146ef5]"
									style={{ height: `${barHeight(point.count, maxCount)}%` }}
								/>
							</div>
							<span className="max-w-16 truncate text-xs text-[#6b7280]">
								{point.label}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function BreakdownCard({
	description,
	items,
	title,
}: {
	description: string;
	items: readonly PublicationAnalyticsGroup[];
	title: string;
}) {
	const maxCount = Math.max(1, ...items.map((item) => item.count));

	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="p-4">
				{items.length ? (
					<div className="space-y-4">
						{items.map((item) => (
							<div key={`${item.id ?? item.label}-${item.label}`}>
								<div className="mb-2 flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate font-semibold">{item.label}</p>
										<p className="text-xs text-[#6b7280]">
											{item.secondaryLabel ??
												`${formatPercent(item.sharePercent)} of selected period`}
										</p>
									</div>
									<div className="text-right">
										<p className="font-semibold">{item.count}</p>
										<ChangeText changePercent={item.changePercent} />
									</div>
								</div>
								<div className="h-2 overflow-hidden rounded-full bg-[#f0f0f0]">
									<div
										className="h-full rounded-full bg-[#146ef5]"
										style={{ width: `${barHeight(item.count, maxCount)}%` }}
									/>
								</div>
								<p className="mt-1 text-xs text-[#6b7280]">
									{item.previousCount} previous ·{" "}
									{formatPercent(item.sharePercent)} share
									{typeof item.publicCount === "number"
										? ` · ${item.publicCount} public`
										: ""}
								</p>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-[#6b7280]">
						No publication data in this duration.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function RecentPublicationsTable({
	publications,
}: {
	publications: readonly PublicationAnalyticsPayload["recentPublications"][number][];
}) {
	return (
		<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
			<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
				<CardTitle>Recent publication records</CardTitle>
				<CardDescription>
					Latest publications in the selected scope and duration, with metadata
					that admins usually need to inspect.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				{publications.length ? (
					<div className="overflow-x-auto">
						<table className="w-full min-w-220 border-collapse text-left text-sm">
							<thead className="bg-[#f7f7f7] text-xs font-semibold text-[#6b7280]">
								<tr>
									<th className="px-4 py-3">Publication</th>
									<th className="px-4 py-3">Faculty / Department</th>
									<th className="px-4 py-3">Type</th>
									<th className="px-4 py-3">Date</th>
									<th className="px-4 py-3">DOI</th>
									<th className="px-4 py-3">Status</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#d8d8d8]">
								{publications.map((publication) => (
									<tr className="hover:bg-[#f7f7f7]" key={publication.id}>
										<td className="max-w-90 px-4 py-4">
											<strong className="block truncate font-semibold text-[#080808]">
												{publication.title}
											</strong>
											<span className="block truncate text-xs text-[#6b7280]">
												{publication.owner ?? "Unknown owner"}
												{publication.journal ? ` · ${publication.journal}` : ""}
											</span>
										</td>
										<td className="px-4 py-4 text-[#6b7280]">
											{publication.faculty ?? "Unknown faculty"}
											<span className="block text-xs">
												{publication.department ?? "Unknown department"}
											</span>
										</td>
										<td className="px-4 py-4">
											{readableLabel(publication.type)}
										</td>
										<td className="px-4 py-4 text-[#6b7280]">
											{publication.publishedOn
												? formatDate(publication.publishedOn)
												: "No date"}
										</td>
										<td className="px-4 py-4 text-[#6b7280]">
											{publication.doi || "Missing"}
										</td>
										<td className="px-4 py-4">
											<span className="inline-flex rounded-full border border-[#d8d8d8] px-2.5 py-1 text-xs font-semibold">
												{readableLabel(publication.status)}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="p-4 text-sm text-[#6b7280]">
						No recent publication records in this duration.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function ChangeBadge({ changePercent }: { changePercent: number | null }) {
	if (changePercent === null) {
		return (
			<span className="rounded-full bg-[#f0f0f0] px-2.5 py-1 text-xs font-semibold text-[#6b7280]">
				New baseline
			</span>
		);
	}

	const positive = changePercent > 0;
	const negative = changePercent < 0;

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
				positive && "bg-emerald-50 text-emerald-700",
				negative && "bg-amber-50 text-amber-700",
				!positive && !negative && "bg-[#f0f0f0] text-[#6b7280]",
			)}
		>
			{positive ? <TrendingUp className="h-3 w-3" /> : null}
			{negative ? <TrendingDown className="h-3 w-3" /> : null}
			{positive ? "+" : ""}
			{formatPercent(changePercent)}
		</span>
	);
}

function ChangeText({ changePercent }: { changePercent: number | null }) {
	if (changePercent === null) {
		return <span className="text-xs text-[#6b7280]">New baseline</span>;
	}

	return (
		<span
			className={cn(
				"text-xs",
				changePercent >= 0 ? "text-emerald-700" : "text-amber-700",
			)}
		>
			{changePercent > 0 ? "+" : ""}
			{formatPercent(changePercent)}
		</span>
	);
}

function AnalyticsEmptyState({
	description,
	title,
}: {
	description: string;
	title: string;
}) {
	return (
		<Card className="rounded-lg border-[#d8d8d8] shadow-none">
			<CardContent className="p-8 text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded bg-[#eef4ff] text-[#146ef5]">
					<BarChart3 className="h-6 w-6" />
				</div>
				<h2 className="mt-4 text-lg font-semibold tracking-normal">{title}</h2>
				<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b7280]">
					{description}
				</p>
			</CardContent>
		</Card>
	);
}

function downloadAnalyticsCsv(analytics: PublicationAnalyticsPayload) {
	const rows = [
		["Section", "Name", "Current", "Previous", "Change percent", "Extra"],
		...analytics.metrics.map((metric) => [
			"Metric",
			metric.label,
			formatMetricValue(metric),
			formatMetricPreviousValue(metric),
			metric.changePercent ?? "",
			metric.helpText,
		]),
		...analytics.byFaculty.map((item) => analyticsGroupCsvRow("Faculty", item)),
		...analytics.byDepartment.map((item) =>
			analyticsGroupCsvRow("Department", item),
		),
		...analytics.byType.map((item) => analyticsGroupCsvRow("Type", item)),
		...analytics.byAccessLevel.map((item) =>
			analyticsGroupCsvRow("Access", item),
		),
		...analytics.byStatus.map((item) => analyticsGroupCsvRow("Status", item)),
	];
	const csv = rows
		.map((row) =>
			row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
		)
		.join("\n");
	const url = URL.createObjectURL(
		new Blob([csv], { type: "text/csv;charset=utf-8" }),
	);
	const link = document.createElement("a");
	link.href = url;
	link.download = `publication-analytics-${analytics.period.range}.csv`;
	link.click();
	URL.revokeObjectURL(url);
	toast.success("Publication analytics exported");
}

function analyticsGroupCsvRow(
	section: string,
	item: PublicationAnalyticsGroup,
) {
	return [
		section,
		item.label,
		item.count,
		item.previousCount,
		item.changePercent ?? "",
		`${formatPercent(item.sharePercent)} share${typeof item.publicCount === "number" ? `; ${item.publicCount} public` : ""}`,
	];
}

function barHeight(value: number, maxValue: number): number {
	if (value <= 0) return 4;
	return Math.max(8, Math.round((value / maxValue) * 100));
}

function formatMetricValue(metric: PublicationAnalyticsMetric): string {
	return metric.unit === "percent"
		? formatPercent(metric.value)
		: String(metric.value);
}

function formatMetricPreviousValue(metric: PublicationAnalyticsMetric): string {
	if (metric.previousValue === null) {
		return "No baseline";
	}

	return metric.unit === "percent"
		? formatPercent(metric.previousValue)
		: String(metric.previousValue);
}

function formatPercent(value: number): string {
	return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}

function formatDate(value: Date | string): string {
	return new Intl.DateTimeFormat(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(value));
}

function formatDateTime(value: Date | string): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function readableLabel(value: string): string {
	return value
		.split("_")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}
