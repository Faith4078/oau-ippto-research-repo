"use client";

import {
	CheckCircle2,
	Gavel,
	Handshake,
	Lightbulb,
	RefreshCw,
	RotateCcw,
	Send,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "#/components/dashboard/dashboard-shell.tsx";
import { ResearchReviewWorkspace } from "#/components/dashboard/research-review-workspace.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import type { DashboardRow } from "#/presentation/dashboard/data.ts";
import { workspaces } from "#/presentation/dashboard/data.ts";

type Summary = {
	stats: {
		commercialization: number;
		innovations: number;
		patents: number;
		reviews: number;
	};
	rows: DashboardRow[];
};

export function IpttoWorkspace() {
	const [summary, setSummary] = useState<Summary | null>(null);
	const [loading, setLoading] = useState(true);
	const [actingOn, setActingOn] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/dashboard/iptto-summary", {
				cache: "no-store",
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "IPTTO work could not be loaded.",
				);
			setSummary(payload.data ?? null);
		} catch (error) {
			toast.error("IPTTO workspace unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function innovationAction(
		row: DashboardRow,
		action: "approve" | "request_changes" | "reject" | "publish" | "archive",
	) {
		const isReview = ["approve", "request_changes", "reject"].includes(action);
		const notes =
			action === "request_changes" || action === "reject"
				? window.prompt(
						action === "reject"
							? "Why is this innovation being rejected?"
							: "What should the researcher change?",
					)
				: null;
		if ((action === "request_changes" || action === "reject") && !notes?.trim())
			return;
		setActingOn(row.id);
		try {
			const endpoint = isReview
				? `/api/innovations/${row.id}/review`
				: `/api/innovations/${row.id}/${action}`;
			const response = await fetch(endpoint, {
				body: isReview
					? JSON.stringify({
							decision:
								action === "approve"
									? "approved"
									: action === "request_changes"
										? "changes_requested"
										: "rejected",
							notes,
						})
					: undefined,
				headers: isReview ? { "content-type": "application/json" } : undefined,
				method: "POST",
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "The innovation was not updated.",
				);
			const messages = {
				approve: "Innovation approved",
				archive: "Innovation archived",
				publish: "Innovation published",
				reject: "Innovation rejected",
				request_changes: "Changes requested",
			};
			toast.success(messages[action]);
			await load();
		} catch (error) {
			toast.error("Innovation not updated", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setActingOn(null);
		}
	}

	return (
		<DashboardShell workspace={workspaces["iptto-officer"]}>
			<div className="space-y-8">
				<header>
					<p className="text-sm font-semibold text-[#146ef5]">
						IPTTO workspace
					</p>
					<h1 className="mt-2 text-4xl font-semibold tracking-normal">
						Innovations, patents and commercialization
					</h1>
					<p className="mt-3 max-w-3xl text-[#6b7280]">
						Review protectable work, maintain patent records, and move approved
						innovations into public visibility.
					</p>
				</header>
				<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<IpttoStat
						label="Innovations"
						value={summary?.stats.innovations ?? 0}
					/>
					<IpttoStat label="Patents" value={summary?.stats.patents ?? 0} />
					<IpttoStat
						label="Commercial activities"
						value={summary?.stats.commercialization ?? 0}
					/>
					<IpttoStat
						label="Reviews saved"
						value={summary?.stats.reviews ?? 0}
					/>
				</section>

				<Card id="innovation-pipeline">
					<CardHeader className="flex-row items-start justify-between">
						<div>
							<CardTitle>Innovation and patent pipeline</CardTitle>
							<CardDescription>
								Live records ordered by most recent activity.
							</CardDescription>
						</div>
						<Button onClick={() => void load()} variant="outline">
							<RefreshCw className="h-4 w-4" />
							Refresh
						</Button>
					</CardHeader>
					<CardContent className="space-y-3">
						{loading ? (
							<p className="text-sm text-[#6b7280]">Loading IPTTO work…</p>
						) : !summary?.rows.length ? (
							<p className="rounded border border-dashed p-6 text-center font-medium">
								No innovation, patent or commercialization records yet.
							</p>
						) : (
							summary.rows.map((row) => (
								<article
									className="flex flex-col gap-3 rounded border border-[#d8d8d8] p-4 lg:flex-row lg:items-center lg:justify-between"
									key={`${row.type}-${row.id}`}
								>
									<div>
										<h2 className="font-semibold">{row.title}</h2>
										<p className="mt-1 text-sm text-[#6b7280]">
											{row.type} · {row.owner} · {row.department}
										</p>
										<p className="mt-2 text-sm font-medium text-[#146ef5]">
											{row.status}
										</p>
									</div>
									{row.type === "Innovation" && (
										<div className="flex flex-wrap gap-2">
											{row.status === "Under Review" && (
												<>
													<Button
														disabled={actingOn === row.id}
														onClick={() =>
															void innovationAction(row, "approve")
														}
													>
														<CheckCircle2 className="h-4 w-4" />
														Approve
													</Button>
													<Button
														disabled={actingOn === row.id}
														onClick={() =>
															void innovationAction(row, "request_changes")
														}
														variant="outline"
													>
														<RotateCcw className="h-4 w-4" />
														Request changes
													</Button>
													<Button
														disabled={actingOn === row.id}
														onClick={() => void innovationAction(row, "reject")}
														variant="outline"
													>
														<XCircle className="h-4 w-4" />
														Reject
													</Button>
												</>
											)}
											{row.status === "Approved" && (
												<Button
													disabled={actingOn === row.id}
													onClick={() => void innovationAction(row, "publish")}
												>
													<Send className="h-4 w-4" />
													Publish
												</Button>
											)}
											{!["Archived", "Published"].includes(row.status) && (
												<Button
													disabled={actingOn === row.id}
													onClick={() => void innovationAction(row, "archive")}
													variant="outline"
												>
													Archive
												</Button>
											)}
										</div>
									)}
								</article>
							))
						)}
					</CardContent>
				</Card>

				<PatentRegistration onCreated={load} />
				<CommercializationRegistration
					onCreated={load}
					rows={summary?.rows ?? []}
				/>
				<section id="research-review">
					<ResearchReviewWorkspace embedded stage="iptto" />
				</section>
			</div>
		</DashboardShell>
	);
}

function CommercializationRegistration({
	onCreated,
	rows,
}: {
	onCreated: () => Promise<void>;
	rows: DashboardRow[];
}) {
	const [saving, setSaving] = useState(false);
	const relatedRecords = rows.filter((row) =>
		["Innovation", "Patent"].includes(row.type),
	);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const [recordType, recordId] = String(
			form.get("relatedRecord") ?? "",
		).split(":");
		setSaving(true);
		try {
			const response = await fetch("/api/commercialization", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					innovationId: recordType === "Innovation" ? recordId : null,
					patentId: recordType === "Patent" ? recordId : null,
					type: String(form.get("type")),
					title: String(form.get("title")),
					partnerName: String(form.get("partnerName") ?? "") || null,
					status: "In progress",
					amount: null,
					currency: null,
					startedOn: new Date().toISOString().slice(0, 10),
					completedOn: null,
					notes: String(form.get("notes") ?? "") || null,
					metadata: {},
				}),
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ??
						"The commercial activity could not be saved.",
				);
			toast.success("Commercial activity recorded");
			event.currentTarget.reset();
			await onCreated();
		} catch (error) {
			toast.error("Commercial activity not saved", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setSaving(false);
		}
	}

	return (
		<Card id="commercialization">
			<CardHeader>
				<CardTitle>Record commercial activity</CardTitle>
				<CardDescription>
					Link a partnership, licence or industry engagement to an existing
					innovation or patent.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{relatedRecords.length === 0 ? (
					<p className="rounded border border-dashed p-6 text-sm text-[#6b7280]">
						Create an innovation or patent record before adding commercial
						activity.
					</p>
				) : (
					<form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
						<label className="grid gap-2 text-sm font-semibold">
							Related innovation or patent
							<select
								className="h-10 rounded-md border border-input bg-background px-3 text-sm"
								name="relatedRecord"
								required
							>
								<option value="">Choose a record</option>
								{relatedRecords.map((row) => (
									<option
										key={`${row.type}-${row.id}`}
										value={`${row.type}:${row.id}`}
									>
										{row.type}: {row.title}
									</option>
								))}
							</select>
						</label>
						<label className="grid gap-2 text-sm font-semibold">
							Activity type
							<select
								className="h-10 rounded-md border border-input bg-background px-3 text-sm"
								name="type"
								required
							>
								<option value="partnership">Partnership</option>
								<option value="licensing">Licensing</option>
								<option value="industry_engagement">Industry engagement</option>
								<option value="spinout">Spinout</option>
								<option value="grant">Grant</option>
								<option value="milestone">Milestone</option>
								<option value="other">Other</option>
							</select>
						</label>
						<label
							className="grid gap-2 text-sm font-semibold"
							htmlFor="commercial-title"
						>
							Activity title
							<Input id="commercial-title" name="title" required />
						</label>
						<label
							className="grid gap-2 text-sm font-semibold"
							htmlFor="commercial-partner"
						>
							Partner name (optional)
							<Input id="commercial-partner" name="partnerName" />
						</label>
						<label
							className="grid gap-2 text-sm font-semibold md:col-span-2"
							htmlFor="commercial-notes"
						>
							Notes (optional)
							<Input id="commercial-notes" name="notes" />
						</label>
						<Button
							className="md:col-span-2 md:w-fit"
							disabled={saving}
							type="submit"
						>
							<Handshake className="h-4 w-4" />
							{saving ? "Saving…" : "Record activity"}
						</Button>
					</form>
				)}
			</CardContent>
		</Card>
	);
}

function PatentRegistration({ onCreated }: { onCreated: () => Promise<void> }) {
	const [saving, setSaving] = useState(false);
	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setSaving(true);
		try {
			const response = await fetch("/api/patents", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					title: String(form.get("title") ?? ""),
					applicationNumber:
						String(form.get("applicationNumber") ?? "") || null,
					jurisdiction: String(form.get("jurisdiction") ?? "Nigeria"),
					status: "idea_disclosure",
					inventors: [
						{
							name: String(form.get("inventor") ?? ""),
							affiliation: "Obafemi Awolowo University",
						},
					],
					supportingFiles: [],
					metadata: {},
				}),
			});
			const payload = await response.json();
			if (!response.ok)
				throw new Error(
					payload.error?.message ?? "Patent record could not be created.",
				);
			toast.success("Patent record created");
			event.currentTarget.reset();
			await onCreated();
		} catch (error) {
			toast.error("Patent not saved", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setSaving(false);
		}
	}
	return (
		<Card id="patent-register">
			<CardHeader>
				<CardTitle>Register a patent lead</CardTitle>
				<CardDescription>
					Record the invention and inventor so filing work can begin.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
					<label
						className="grid gap-2 text-sm font-semibold"
						htmlFor="patent-title"
					>
						Patent title
						<Input id="patent-title" name="title" required />
					</label>
					<label
						className="grid gap-2 text-sm font-semibold"
						htmlFor="patent-inventor"
					>
						Inventor name
						<Input id="patent-inventor" name="inventor" required />
					</label>
					<label
						className="grid gap-2 text-sm font-semibold"
						htmlFor="patent-application"
					>
						Application number (optional)
						<Input id="patent-application" name="applicationNumber" />
					</label>
					<label
						className="grid gap-2 text-sm font-semibold"
						htmlFor="patent-jurisdiction"
					>
						Jurisdiction
						<Input
							defaultValue="Nigeria"
							id="patent-jurisdiction"
							name="jurisdiction"
							required
						/>
					</label>
					<Button
						className="md:col-span-2 md:w-fit"
						disabled={saving}
						type="submit"
					>
						<Gavel className="h-4 w-4" />
						{saving ? "Saving…" : "Create patent record"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function IpttoStat({ label, value }: { label: string; value: number }) {
	return (
		<Card>
			<CardContent className="flex items-center gap-4 p-4">
				<span className="flex h-10 w-10 items-center justify-center rounded bg-[#eef4ff] text-[#146ef5]">
					<Lightbulb className="h-5 w-5" />
				</span>
				<div>
					<p className="text-sm text-[#6b7280]">{label}</p>
					<p className="text-2xl font-semibold">{value}</p>
				</div>
			</CardContent>
		</Card>
	);
}
