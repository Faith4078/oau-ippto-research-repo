import { describe, expect, it, vi } from "vitest";

import {
	buildResearchSubmissionPayload,
	submitResearchWithDirectUpload,
	type ResearchSubmissionFormValues,
} from "#/presentation/research-submission/direct-upload.ts";

const baseValues: ResearchSubmissionFormValues = {
	title: "Smart irrigation for cassava farms",
	abstract:
		"This research documents a smart irrigation control model for cassava farms and evaluates its impact on water use, crop yield, and field maintenance decisions.",
	authorsText: "Dr. A. Adeyemi <adeyemi@oauife.edu.ng>\nProf. K. Bello",
	departmentId: "00000000-0000-0000-0000-000000000201",
	facultyId: "00000000-0000-0000-0000-000000000101",
	keywordsText: "Irrigation, Cassava\nWater use",
	publicationType: "journal_article",
	publicationTitle: "",
	publisher: "OAU Press",
	journal: "Journal of Applied Agriculture",
	volume: "12",
	issue: "2",
	pages: "44-59",
	doi: "10.1000/oau.2026.12",
	isbn: "",
	url: "https://example.com/research",
	publishedOn: "2026-07-30",
	citation: "Adeyemi, A. and Bello, K. Smart irrigation for cassava farms.",
	accessLevel: "restricted",
	researchArea: "Agricultural technology",
	startedOn: "2025-01-01",
	completedOn: "2026-06-30",
	requiresIpttoReview: true,
	fileChecksum: "0123456789abcdef",
};

describe("research direct upload client", () => {
	it("normalizes the full submission form into the server schema", () => {
		const payload = buildResearchSubmissionPayload({
			file: new File(["paper"], "Cassava Paper.pdf", {
				type: "application/pdf",
			}),
			values: baseValues,
		});

		expect(payload).toMatchObject({
			title: "Smart irrigation for cassava farms",
			departmentId: "00000000-0000-0000-0000-000000000201",
			facultyId: "00000000-0000-0000-0000-000000000101",
			keywords: ["irrigation", "cassava", "water use"],
			accessLevel: "restricted",
			requiresIpttoReview: true,
			researchArea: "Agricultural technology",
		});
		expect(payload.authors).toEqual([
			{
				name: "Dr. A. Adeyemi",
				email: "adeyemi@oauife.edu.ng",
				isCorresponding: true,
			},
			{
				name: "Prof. K. Bello",
				email: null,
				isCorresponding: false,
			},
		]);
		expect(payload.publication.title).toBe(payload.title);
		expect(payload.files[0]).toMatchObject({
			filename: "Cassava Paper.pdf",
			mimeType: "application/pdf",
			fileSizeBytes: 5,
			checksum: "0123456789abcdef",
			accessLevel: "restricted",
			purpose: "research_document",
		});
	});

	it("creates the submission, uploads directly to R2, then confirms metadata", async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				jsonResponse({
					data: {
						id: "00000000-0000-0000-0000-000000000601",
						status: "submitted",
					},
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					data: {
						url: "https://r2.example.com/upload",
						method: "PUT",
						expiresAt: "2026-07-30T12:00:00.000Z",
						headers: {
							"content-type": "application/pdf",
							"x-amz-meta-purpose": "research_document",
						},
						objectKey: "research-repository/research_document/record/file.pdf",
					},
				}),
			)
			.mockResolvedValueOnce(new Response(null, { status: 200 }))
			.mockResolvedValueOnce(
				jsonResponse({
					data: {
						id: "00000000-0000-0000-0000-000000000701",
						objectKey: "research-repository/research_document/record/file.pdf",
						filename: "Cassava Paper.pdf",
						mimeType: "application/pdf",
						fileSizeBytes: 5,
						accessLevel: "restricted",
						purpose: "research_document",
					},
				}),
			);

		const result = await submitResearchWithDirectUpload(
			{
				file: new File(["paper"], "Cassava Paper.pdf", {
					type: "application/pdf",
				}),
				values: baseValues,
			},
			fetcher,
		);

		expect(result.submission.id).toBe("00000000-0000-0000-0000-000000000601");
		expect(result.files).toHaveLength(1);
		expect(fetcher).toHaveBeenCalledTimes(4);
		expect(fetcher.mock.calls[0]?.[0]).toBe("/api/research/submissions");
		expect(fetcher.mock.calls[1]?.[0]).toBe("/api/files/signed-upload-url");
		expect(fetcher.mock.calls[2]?.[0]).toBe("https://r2.example.com/upload");
		expect(fetcher.mock.calls[2]?.[1]).toMatchObject({
			method: "PUT",
			headers: {
				"content-type": "application/pdf",
				"x-amz-meta-purpose": "research_document",
			},
		});
		expect(fetcher.mock.calls[3]?.[0]).toBe("/api/files/confirm-upload");
		expect(JSON.parse(fetcher.mock.calls[3]?.[1]?.body as string)).toMatchObject({
			researchRecordId: "00000000-0000-0000-0000-000000000601",
			objectKey: "research-repository/research_document/record/file.pdf",
		});
	});
});

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}
