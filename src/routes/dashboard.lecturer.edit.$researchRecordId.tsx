"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ResearchSubmissionForm } from "#/components/dashboard/research-submission-form.tsx";
import { Button } from "#/components/ui/button.tsx";
import { LoadingSkeletonFrame } from "#/components/ui/loading-skeleton.tsx";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";
import type { ResearchSubmissionFormValues } from "#/presentation/research-submission/direct-upload.ts";

export const Route = createFileRoute(
	"/dashboard/lecturer/edit/$researchRecordId",
)({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({
			locationHref: location.href,
			roles: ["lecturer"],
		}),
	head: () => ({
		meta: [
			{
				title: "Edit Research | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content: "Update the details of a research record you submitted.",
			},
		],
	}),
	component: LecturerResearchEditPage,
});

type EditableSubmission = {
	id: string;
	status: string;
	editable: boolean;
	values: ResearchSubmissionFormValues;
	hasExistingDocument: boolean;
};

type LoadState =
	| { status: "loading" }
	| { status: "not-found" }
	| { status: "not-editable"; recordStatus: string }
	| { status: "ready"; submission: EditableSubmission }
	| { status: "error"; message: string };

function LecturerResearchEditPage() {
	const { researchRecordId } = Route.useParams();
	const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

	useEffect(() => {
		let isMounted = true;

		async function loadSubmission() {
			setLoadState({ status: "loading" });

			try {
				const response = await fetch(
					`/api/research/submissions/${researchRecordId}`,
					{ cache: "no-store" },
				);
				const payload = await response.json().catch(() => ({}));

				if (!isMounted) {
					return;
				}

				if (response.status === 404) {
					setLoadState({ status: "not-found" });
					return;
				}

				if (!response.ok) {
					throw new Error(
						payload.error?.message ?? "This research could not be loaded.",
					);
				}

				const record = payload.data as ApiRecord;

				if (!record.editable) {
					setLoadState({
						status: "not-editable",
						recordStatus: record.status,
					});
					return;
				}

				setLoadState({
					status: "ready",
					submission: {
						id: record.id,
						status: record.status,
						editable: record.editable,
						values: formValuesFromRecord(record),
						hasExistingDocument: record.files.some(
							(file) => file.purpose === "research_document",
						),
					},
				});
			} catch (error) {
				if (isMounted) {
					setLoadState({
						status: "error",
						message:
							error instanceof Error
								? error.message
								: "This research could not be loaded.",
					});
				}
			}
		}

		void loadSubmission();

		return () => {
			isMounted = false;
		};
	}, [researchRecordId]);

	return (
		<div className="mx-auto max-w-5xl space-y-5">
			<div className="rounded-lg border border-[#d8d8d8] bg-white p-4">
				<Link
					className="text-sm font-semibold text-[#146ef5]"
					to="/dashboard/lecturer"
				>
					Back to my research
				</Link>
				<h1 className="mt-4 text-3xl font-semibold tracking-normal">
					Edit Research
				</h1>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">
					Update the details below, then save your changes.
				</p>
			</div>

			{loadState.status === "loading" ? (
				<div className="rounded-lg border border-[#d8d8d8] bg-white p-6">
					<LoadingSkeletonFrame label="Loading your research" />
				</div>
			) : null}

			{loadState.status === "not-found" ? (
				<div className="rounded-lg border border-[#d8d8d8] bg-white p-6">
					<p className="font-semibold">This research record was not found</p>
					<p className="mt-2 text-sm text-[#6b7280]">
						It may have been deleted, or it may belong to another account.
					</p>
					<Button asChild className="mt-4">
						<Link to="/dashboard/lecturer">Back to my research</Link>
					</Button>
				</div>
			) : null}

			{loadState.status === "not-editable" ? (
				<div className="rounded-lg border border-[#d8d8d8] bg-white p-6">
					<p className="font-semibold">This research can no longer be edited</p>
					<p className="mt-2 text-sm text-[#6b7280]">
						Research in "{loadState.recordStatus.replace(/_/g, " ")}" status is
						{loadState.recordStatus === "published"
							? " already public and can only be changed through IPTTO."
							: " no longer editable from this page."}
					</p>
					<Button asChild className="mt-4">
						<Link to="/dashboard/lecturer">Back to my research</Link>
					</Button>
				</div>
			) : null}

			{loadState.status === "error" ? (
				<div className="rounded-lg border border-[#d8d8d8] bg-white p-6">
					<p className="font-semibold">Your research could not be loaded</p>
					<p className="mt-2 text-sm text-[#6b7280]">{loadState.message}</p>
				</div>
			) : null}

			{loadState.status === "ready" ? (
				<ResearchSubmissionForm
					hasExistingDocument={loadState.submission.hasExistingDocument}
					initialFormValues={loadState.submission.values}
					mode="edit"
					researchRecordId={loadState.submission.id}
				/>
			) : null}
		</div>
	);
}

type ApiAuthor = {
	name: string;
	email: string | null;
	affiliation: string | null;
	orcid: string | null;
	isCorresponding: boolean;
	contribution: string | null;
};

type ApiPublication = {
	type: ResearchSubmissionFormValues["publicationType"];
	title: string | null;
	publisher: string | null;
	journal: string | null;
	volume: string | null;
	issue: string | null;
	pages: string | null;
	doi: string | null;
	isbn: string | null;
	url: string | null;
	publishedOn: string | null;
	citation: string | null;
} | null;

type ApiFile = {
	id: string;
	filename: string;
	mimeType: string;
	purpose: string;
};

type ApiRecord = {
	id: string;
	title: string;
	abstract: string;
	status: string;
	editable: boolean;
	accessLevel: ResearchSubmissionFormValues["accessLevel"];
	facultyId: string;
	departmentId: string;
	researchArea: string | null;
	startedOn: string | null;
	completedOn: string | null;
	requiresIpttoReview: boolean;
	commercializationStatus: string | null;
	fundingInfo: string | null;
	comment: string | null;
	authors: ApiAuthor[];
	keywords: string[];
	publication: ApiPublication;
	files: ApiFile[];
};

function formValuesFromRecord(record: ApiRecord): ResearchSubmissionFormValues {
	const orderedAuthors = [...record.authors].sort(
		(a, b) => Number(b.isCorresponding) - Number(a.isCorresponding),
	);

	return {
		title: record.title,
		abstract: record.abstract,
		authorsText: orderedAuthors
			.map((author) =>
				author.email ? `${author.name} <${author.email}>` : author.name,
			)
			.join("\n"),
		departmentId: record.departmentId,
		facultyId: record.facultyId,
		keywordsText: record.keywords.join(", "),
		publicationType: record.publication?.type ?? "journal_article",
		publicationTitle: record.publication?.title ?? "",
		publisher: record.publication?.publisher ?? "",
		journal: record.publication?.journal ?? "",
		volume: record.publication?.volume ?? "",
		issue: record.publication?.issue ?? "",
		pages: record.publication?.pages ?? "",
		doi: record.publication?.doi ?? "",
		isbn: record.publication?.isbn ?? "",
		url: record.publication?.url ?? "",
		publishedOn: record.publication?.publishedOn ?? "",
		citation: record.publication?.citation ?? "",
		accessLevel: record.accessLevel,
		researchArea: record.researchArea ?? "",
		startedOn: record.startedOn ?? "",
		completedOn: record.completedOn ?? "",
		requiresIpttoReview: record.requiresIpttoReview,
		fileChecksum: "",
		commercializationStatus: record.commercializationStatus ?? "",
		fundingInfo: record.fundingInfo ?? "",
		comment: record.comment ?? "",
		imageChecksum: "",
	};
}
