"use client";

import { Link } from "@tanstack/react-router";
import {
	BookOpenCheck,
	Clock3,
	FilePlus2,
	LockKeyhole,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "#/components/dashboard/dashboard-shell.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";
import { workspaces } from "#/presentation/dashboard/data.ts";

type Submission = {
	accessLevel: string;
	date: string;
	department: string;
	id: string;
	published: boolean;
	statusLabel: string;
	title: string;
	type: string;
};

export function LecturerWorkspace() {
	const [items, setItems] = useState<Submission[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");

	useEffect(() => {
		void (async () => {
			try {
				const response = await fetch("/api/research/submissions", {
					cache: "no-store",
				});
				const payload = await response.json();
				if (!response.ok)
					throw new Error(
						payload.error?.message ?? "Your research could not be loaded.",
					);
				setItems(payload.data ?? []);
			} catch (error) {
				toast.error("Research unavailable", {
					description: error instanceof Error ? error.message : "Try again.",
				});
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const visible = useMemo(() => {
		const value = query.trim().toLowerCase();
		return value
			? items.filter((item) =>
					[item.title, item.type, item.department, item.statusLabel].some(
						(part) => part.toLowerCase().includes(value),
					),
				)
			: items;
	}, [items, query]);

	return (
		<DashboardShell workspace={workspaces.lecturer}>
			<div className="space-y-6">
				<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-semibold text-[#146ef5]">
							Lecturer workspace
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-normal">
							My research
						</h1>
						<p className="mt-3 text-[#6b7280]">
							Submit research once, then follow every review decision until it
							becomes public.
						</p>
					</div>
					<Button
						asChild
						className="bg-[#146ef5] text-white hover:bg-[#0d5fdc] focus-visible:ring-[#146ef5]/35"
						size="lg"
					>
						<Link to="/dashboard/lecturer/submit">
							<FilePlus2 className="h-4 w-4" />
							Add research
						</Link>
					</Button>
				</header>

				<section className="grid gap-3 sm:grid-cols-3">
					<LecturerStat
						icon={Clock3}
						label="In review"
						value={items.filter((item) => !item.published).length}
					/>
					<LecturerStat
						icon={BookOpenCheck}
						label="Published"
						value={items.filter((item) => item.published).length}
					/>
					<LecturerStat
						icon={LockKeyhole}
						label="Restricted or private"
						value={items.filter((item) => item.accessLevel !== "public").length}
					/>
				</section>

				<Card id="my-research">
					<CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<CardTitle>Your submissions</CardTitle>
							<CardDescription>
								Real records from your account—not sample data.
							</CardDescription>
						</div>
						<label
							className="flex h-11 items-center gap-2 rounded border border-[#d8d8d8] px-3 md:w-96"
							htmlFor="lecturer-research-search"
						>
							<Search className="h-4 w-4 text-[#146ef5]" />
							<span className="sr-only">Search your research</span>
							<Input
								className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
								id="lecturer-research-search"
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search title, type, or status"
								value={query}
							/>
						</label>
					</CardHeader>
					<CardContent className="space-y-3">
						{loading ? (
							<LoadingSkeleton label="Loading your research" rows={3} />
						) : visible.length === 0 ? (
							<div className="rounded border border-dashed p-8 text-center">
								<p className="font-semibold">
									{query
										? "No matching research"
										: "You have not submitted research yet"}
								</p>
								{query ? (
									<Button
										className="mt-3"
										onClick={() => setQuery("")}
										variant="outline"
									>
										Clear search
									</Button>
								) : (
									<Button asChild className="mt-3">
										<Link to="/dashboard/lecturer/submit">
											Add your first research
										</Link>
									</Button>
								)}
							</div>
						) : (
							visible.map((item) => (
								<article
									className="flex flex-col gap-3 rounded border border-[#d8d8d8] p-4 sm:flex-row sm:items-center sm:justify-between"
									key={item.id}
								>
									<div>
										<h2 className="font-semibold">{item.title}</h2>
										<p className="mt-1 text-sm text-[#6b7280]">
											{item.type} · {item.department} · {item.date}
										</p>
										<p className="mt-2 text-sm font-medium text-[#146ef5]">
											{item.statusLabel}
										</p>
									</div>
									{item.published && (
										<Button asChild variant="outline">
											<a
												href={`/research/${item.id}`}
												rel="noopener noreferrer"
												target="_blank"
											>
												View public page
											</a>
										</Button>
									)}
								</article>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardShell>
	);
}

function LecturerStat({
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
