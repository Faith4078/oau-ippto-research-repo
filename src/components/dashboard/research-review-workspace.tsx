"use client";

import {
	CheckCircle2,
	Clock3,
	Download,
	RotateCcw,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
	buildResearchReviewDecision,
	type ResearchReviewDecision,
	type ResearchReviewStage,
} from "#/application/dashboard-workspaces.ts";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { workspaces } from "#/presentation/dashboard/data.ts";

import { DashboardShell } from "./dashboard-shell.tsx";

type ReviewItem = {
	abstract: string;
	createdAt: string;
	department: string;
	faculty: string;
	id: string;
	owner: string;
	requiresIpttoReview: boolean;
	status: "submitted" | "department_review" | "faculty_review" | "iptto_review";
	title: string;
};

const stageCopy = {
	department: {
		description:
			"Check research from your department, explain any changes clearly, and send ready work to Faculty review.",
		empty: "No department research is waiting for you.",
		role: "department-admin" as const,
		title: "Department Review Queue",
	},
	faculty: {
		description:
			"Review work approved by departments and send it to IPTTO when intellectual-property review is required.",
		empty: "No faculty research is waiting for you.",
		role: "faculty-admin" as const,
		title: "Faculty Review Queue",
	},
	iptto: {
		description:
			"Make the final research decision for work that needs intellectual-property and commercialization review.",
		empty: "No research is waiting for IPTTO review.",
		role: "iptto-officer" as const,
		title: "IPTTO Research Review",
	},
};

export function ResearchReviewWorkspace({
	embedded = false,
	stage,
}: {
	embedded?: boolean;
	stage: ResearchReviewStage;
}) {
	const copy = stageCopy[stage];
	const content = <ResearchReviewContent copy={copy} stage={stage} />;

	if (embedded) return content;

	return (
		<DashboardShell workspace={workspaces[copy.role]}>{content}</DashboardShell>
	);
}

function ResearchReviewContent({
	copy,
	stage,
}: {
	copy: (typeof stageCopy)[ResearchReviewStage];
	stage: ResearchReviewStage;
}) {
	const [items, setItems] = useState<ReviewItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [actingOn, setActingOn] = useState<string | null>(null);
	const [pendingDecision, setPendingDecision] = useState<{
		decision: Exclude<ResearchReviewDecision, "approve">;
		id: string;
	} | null>(null);
	const [comment, setComment] = useState("");
	const [reportLoading, setReportLoading] = useState(false);

	const loadQueue = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch(
				`/api/dashboard/research-review?stage=${stage}`,
				{
					cache: "no-store",
				},
			);
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? "The review queue could not be loaded.",
				);
			}
			setItems(payload.data ?? []);
		} catch (error) {
			toast.error("Review queue unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setLoading(false);
		}
	}, [stage]);

	useEffect(() => {
		void loadQueue();
	}, [loadQueue]);

	const visibleItems = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return items;
		return items.filter((item) =>
			[item.title, item.owner, item.department, item.faculty].some((value) =>
				value.toLowerCase().includes(normalized),
			),
		);
	}, [items, query]);

	const overdue = items.filter(
		(item) => Date.now() - new Date(item.createdAt).getTime() > 7 * 86_400_000,
	).length;
	const researchers = new Set(items.map((item) => item.owner)).size;
	const departments = new Set(items.map((item) => item.department)).size;

	async function decide(item: ReviewItem, decision: ResearchReviewDecision) {
		const explanation = comment.trim();
		if (decision !== "approve" && explanation.length < 2) {
			toast.error("Add a clear explanation before continuing.");
			return;
		}

		setActingOn(item.id);
		try {
			const response = await fetch("/api/research/approval-transitions", {
				body: JSON.stringify(
					buildResearchReviewDecision({
						comment: decision === "approve" ? null : explanation,
						currentStatus: item.status,
						decision,
						requiresIpttoReview: item.requiresIpttoReview,
						researchRecordId: item.id,
						stage,
					}),
				),
				headers: { "content-type": "application/json" },
				method: "POST",
			});
			const payload = await response.json();
			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? "The decision was not saved.",
				);
			}
			await loadQueue();
			setPendingDecision(null);
			setComment("");
			toast.success(
				decision === "approve"
					? "Research approved"
					: decision === "request_changes"
						? "Research returned with feedback"
						: "Research rejected",
			);
		} catch (error) {
			toast.error("Decision not saved", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setActingOn(null);
		}
	}

	async function downloadReport() {
		setReportLoading(true);
		try {
			const response = await fetch("/api/dashboard/report", {
				cache: "no-store",
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "The report could not be generated.",
				);
			const rows = [
				["Metric", "Current value", "Previous value", "Change percent"],
				...(payload.data?.metrics ?? []).map(
					(metric: {
						changePercent: number | null;
						label: string;
						previousValue: number | null;
						value: number;
					}) => [
						metric.label,
						metric.value,
						metric.previousValue ?? "",
						metric.changePercent ?? "",
					],
				),
			];
			const csv = rows
				.map((row) =>
					row
						.map((value: unknown) => `"${String(value).replaceAll('"', '""')}"`)
						.join(","),
				)
				.join("\n");
			const url = URL.createObjectURL(
				new Blob([csv], { type: "text/csv;charset=utf-8" }),
			);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${stage}-research-report.csv`;
			link.click();
			URL.revokeObjectURL(url);
			toast.success("Report downloaded");
		} catch (error) {
			toast.error("Report unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setReportLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			<header>
				<p className="text-sm font-semibold text-[#146ef5]">{copy.title}</p>
				<h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
					Research awaiting your decision
				</h1>
				<p className="mt-3 max-w-3xl text-[#6b7280]">{copy.description}</p>
			</header>

			<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReviewStat icon={Clock3} label="Waiting" value={items.length} />
				<ReviewStat
					icon={RotateCcw}
					label="Older than 7 days"
					value={overdue}
				/>
				<ReviewStat icon={Users} label="Researchers" value={researchers} />
				<ReviewStat
					icon={CheckCircle2}
					label="Departments"
					value={departments}
				/>
			</section>

			{stage === "faculty" && (
				<Card id="department-summary">
					<CardHeader>
						<CardTitle>Department summary</CardTitle>
						<CardDescription>
							{departments} departments currently have work at Faculty review.
						</CardDescription>
					</CardHeader>
				</Card>
			)}

			<Card id="dashboard-report">
				<CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>
							{stage === "faculty"
								? "Faculty research report"
								: stage === "department"
									? "Department research report"
									: "IPTTO research report"}
						</CardTitle>
						<CardDescription>
							Download current research totals and workflow status as a
							spreadsheet-ready CSV file.
						</CardDescription>
					</div>
					<Button
						disabled={reportLoading}
						onClick={() => void downloadReport()}
						variant="outline"
					>
						<Download className="h-4 w-4" />
						{reportLoading ? "Preparing…" : "Download report"}
					</Button>
				</CardHeader>
			</Card>

			<Card id="review-queue">
				<CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<CardTitle>{copy.title}</CardTitle>
						<CardDescription>
							Open each summary and record one clear decision.
						</CardDescription>
					</div>
					<label
						className="flex h-11 w-full items-center gap-2 rounded border border-[#d8d8d8] px-3 md:max-w-sm"
						htmlFor={`${stage}-research-search`}
					>
						<Search className="h-4 w-4 text-[#146ef5]" />
						<span className="sr-only">Search this review queue</span>
						<Input
							className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
							id={`${stage}-research-search`}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search title, researcher, or department"
							value={query}
						/>
					</label>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<p className="text-sm text-[#6b7280]">Loading research…</p>
					) : visibleItems.length === 0 ? (
						<div className="rounded border border-dashed border-[#d8d8d8] p-8 text-center">
							<p className="font-semibold">
								{query ? "No matching research" : copy.empty}
							</p>
							{query && (
								<Button
									className="mt-3"
									onClick={() => setQuery("")}
									variant="outline"
								>
									Clear search
								</Button>
							)}
						</div>
					) : (
						visibleItems.map((item) => (
							<article
								className="rounded-lg border border-[#d8d8d8] p-4"
								key={item.id}
							>
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="max-w-3xl">
										<h2 className="text-lg font-semibold">{item.title}</h2>
										<p className="mt-1 text-sm text-[#6b7280]">
											{item.owner} · {item.department} · {item.faculty}
										</p>
										<p className="mt-3 text-sm leading-6">{item.abstract}</p>
										{item.requiresIpttoReview && (
											<p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
												IPTTO review required
											</p>
										)}
									</div>
									<div className="flex shrink-0 flex-wrap gap-2">
										<Button
											disabled={actingOn === item.id}
											onClick={() => void decide(item, "approve")}
										>
											<CheckCircle2 className="h-4 w-4" />
											{item.status === "submitted" ? "Begin review" : "Approve"}
										</Button>
										{item.status !== "submitted" && (
											<Button
												disabled={actingOn === item.id}
												onClick={() => {
													setComment("");
													setPendingDecision({
														decision: "request_changes",
														id: item.id,
													});
												}}
												variant="outline"
											>
												<RotateCcw className="h-4 w-4" /> Return
											</Button>
										)}
										<Button
											disabled={actingOn === item.id}
											onClick={() => {
												setComment("");
												setPendingDecision({ decision: "reject", id: item.id });
											}}
											variant="outline"
										>
											<XCircle className="h-4 w-4" /> Reject
										</Button>
									</div>
								</div>

								{pendingDecision?.id === item.id && (
									<div className="mt-4 rounded bg-[#f7f7f7] p-4">
										<label
											className="text-sm font-semibold"
											htmlFor={`comment-${item.id}`}
										>
											{pendingDecision.decision === "reject"
												? "Reason for rejection"
												: "Changes the lecturer should make"}
										</label>
										<textarea
											className="mt-2 min-h-24 w-full rounded border border-[#d8d8d8] bg-white p-3 text-sm"
											id={`comment-${item.id}`}
											onChange={(event) => setComment(event.target.value)}
											placeholder="Write a clear explanation"
											value={comment}
										/>
										<div className="mt-3 flex gap-2">
											<Button
												disabled={actingOn === item.id}
												onClick={() =>
													void decide(item, pendingDecision.decision)
												}
											>
												Save decision
											</Button>
											<Button
												onClick={() => setPendingDecision(null)}
												variant="outline"
											>
												Cancel
											</Button>
										</div>
									</div>
								)}
							</article>
						))
					)}
				</CardContent>
			</Card>

			<Card id="review-guide">
				<CardHeader>
					<CardTitle>How to make a useful decision</CardTitle>
					<CardDescription>
						Approve complete work. Return fixable work with specific
						instructions. Reject only when it cannot continue, and always
						explain why.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	);
}

function ReviewStat({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Clock3;
	label: string;
	value: number;
}) {
	return (
		<Card>
			<CardContent className="flex items-center gap-4 p-4">
				<span className="flex h-10 w-10 items-center justify-center rounded bg-[#eef4ff] text-[#146ef5]">
					<Icon className="h-5 w-5" />
				</span>
				<div>
					<p className="text-sm text-[#6b7280]">{label}</p>
					<p className="text-2xl font-semibold">{value}</p>
				</div>
			</CardContent>
		</Card>
	);
}
