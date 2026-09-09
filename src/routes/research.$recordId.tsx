"use client";

import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicResearchDetail } from "#/routes/api/public-research.ts";
import {
	PublicPageShell,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";
import { LoadingSkeletonFrame } from "@/components/ui/loading-skeleton";

export const Route = createFileRoute("/research/$recordId")({
	head: () => publicHead(pageSeo.researchDetail),
	component: ResearchDetailPage,
});

function ResearchDetailPage() {
	const { recordId } = Route.useParams();
	const [record, setRecord] = useState<PublicResearchDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function loadImage() {
			if (!record?.imageFileId) {
				setImageUrl(null);
				return;
			}

			try {
				const response = await fetch("/api/files/signed-download-url", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fileId: record.imageFileId,
						researchRecordId: record.id,
					}),
				});

				if (!response.ok) {
					if (isMounted) {
						setImageUrl(null);
					}
					return;
				}

				const payload = (await response.json()) as {
					data?: { url?: string };
				};

				if (isMounted) {
					setImageUrl(payload.data?.url ?? null);
				}
			} catch {
				if (isMounted) {
					setImageUrl(null);
				}
			}
		}

		void loadImage();

		return () => {
			isMounted = false;
		};
	}, [record?.imageFileId, record?.id]);

	useEffect(() => {
		let isMounted = true;

		async function readRecord() {
			setIsLoading(true);

			try {
				const response = await fetch(
					`/api/public-research?recordId=${encodeURIComponent(recordId)}`,
				);

				if (!response.ok) {
					if (isMounted) {
						setRecord(null);
					}
					return;
				}

				const payload = (await response.json()) as {
					data?: PublicResearchDetail;
				};

				if (isMounted) {
					setRecord(payload.data ?? null);
				}
			} catch {
				if (isMounted) {
					setRecord(null);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		}

		void readRecord();

		return () => {
			isMounted = false;
		};
	}, [recordId]);

	if (record) {
		return <LiveResearchDetail imageUrl={imageUrl} record={record} />;
	}

	if (isLoading) {
		return (
			<PublicPageShell>
				<section className="section-wrap pb-12 pt-32">
					<div className="max-w-3xl rounded-xl border border-[#e5e7eb] bg-white p-6">
						<LoadingSkeletonFrame label="Loading research record" />
					</div>
				</section>
			</PublicPageShell>
		);
	}

	return (
		<PublicPageShell>
			<section className="section-wrap pb-20 pt-32">
				<span className="eyebrow">Record unavailable</span>
				<h1 className="mt-5 text-4xl font-semibold">
					This public research record was not found
				</h1>
				<p className="mt-4 max-w-2xl text-[#6b7280]">
					It may have been unpublished, archived, restricted, or the link may be
					incorrect.
				</p>
				<a className="btn-primary mt-8 w-fit" href="/research">
					<ArrowLeft className="h-5 w-5" />
					Back to all research
				</a>
			</section>
		</PublicPageShell>
	);
}

function LiveResearchDetail({
	record,
	imageUrl,
}: {
	record: PublicResearchDetail;
	imageUrl: string | null;
}) {
	const facts = [
		{ label: "Faculty", value: record.faculty },
		{ label: "Department", value: record.department },
		{ label: "Year", value: record.year },
		{ label: "Who can view this?", value: formatAccess(record.accessLevel) },
		...(record.commercializationStatus
			? [
					{
						label: "Patent / commercialization status",
						value: record.commercializationStatus,
					},
				]
			: []),
	];

	return (
		<PublicPageShell>
			<section className="section-wrap pb-12 pt-32">
				<a
					className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#146ef5]"
					href="/research"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to all research
				</a>
				<div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
					<div>
						<span className="eyebrow">
							<BookOpenCheck className="h-4 w-4" />
							Research
						</span>
						<h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
							{record.title}
						</h1>
						<p className="mt-5 max-w-3xl text-base leading-8 text-[#6b7280] sm:text-lg">
							{record.abstract}
						</p>
						{imageUrl ? (
							<img
								alt={record.title}
								className="mt-6 max-h-96 w-full max-w-2xl rounded-lg border border-[#d8d8d8] object-cover"
								src={imageUrl}
							/>
						) : null}
						<div className="mt-6 flex flex-wrap gap-2">
							{record.tags.map((tag) => (
								<span
									className="rounded-full border border-[#d8d8d8] bg-white px-3 py-1 text-xs font-medium text-[#4b5563]"
									key={tag}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
					<aside className="rounded-lg border border-[#d8d8d8] bg-[#f0f0f0] p-5">
						<h2 className="text-lg font-semibold">Key details</h2>
						<dl className="mt-4 grid gap-4">
							{facts.map((fact) => (
								<div key={fact.label}>
									<dt className="text-xs font-semibold uppercase text-[#6b7280]">
										{fact.label}
									</dt>
									<dd className="mt-1 text-sm font-medium text-[#080808]">
										{fact.value}
									</dd>
								</div>
							))}
						</dl>
					</aside>
				</div>
			</section>
			<section className="section-wrap pt-0">
				<div className="grid gap-4 lg:grid-cols-3">
					<article className="rounded-lg border border-[#d8d8d8] bg-white p-5">
						<h2 className="text-xl font-semibold">Authors</h2>
						<p className="mt-3 text-sm leading-6 text-[#6b7280]">
							{record.authors.length ? record.authors.join(", ") : "Not listed"}
						</p>
					</article>
					<article className="rounded-lg border border-[#d8d8d8] bg-white p-5">
						<h2 className="text-xl font-semibold">Publication</h2>
						<p className="mt-3 text-sm leading-6 text-[#6b7280]">
							{record.publicationTitle ?? record.title}
						</p>
						{record.publicationType ? (
							<p className="mt-2 text-xs font-medium uppercase text-[#6b7280]">
								{record.publicationType.replace(/_/g, " ")}
							</p>
						) : null}
					</article>
					<article className="rounded-lg border border-[#d8d8d8] bg-white p-5">
						<h2 className="text-xl font-semibold">Citation</h2>
						<p className="mt-3 text-sm leading-6 text-[#6b7280]">
							{record.citation ?? "Citation details are being prepared."}
						</p>
					</article>
					{record.fundingInfo ? (
						<article className="rounded-lg border border-[#d8d8d8] bg-white p-5">
							<h2 className="text-xl font-semibold">Funding</h2>
							<p className="mt-3 text-sm leading-6 text-[#6b7280]">
								{record.fundingInfo}
							</p>
						</article>
					) : null}
					{record.comment ? (
						<article className="rounded-lg border border-[#d8d8d8] bg-white p-5 lg:col-span-3">
							<h2 className="text-xl font-semibold">
								Note from the researcher
							</h2>
							<p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6b7280]">
								{record.comment}
							</p>
						</article>
					) : null}
				</div>
			</section>
		</PublicPageShell>
	);
}

function formatAccess(accessLevel: string) {
	switch (accessLevel.toLowerCase()) {
		case "public":
			return "Everyone";
		case "restricted":
			return "Approved OAU staff only";
		case "private":
			return "You and authorised OAU reviewers";
		default:
			return accessLevel;
	}
}
