import { describe, expect, it } from "vitest";

import {
	createSearchPage,
	createSearchService,
	type NormalizedSearchRequest,
	normalizeSearchRequest,
	type SearchIndex,
	type SearchPage,
} from "../../../src/application/search.ts";

describe("search application service", () => {
	it("normalizes keyword, filters, pagination, and ranking contract", async () => {
		let capturedRequest: NormalizedSearchRequest | null = null;
		const searchIndex: SearchIndex = {
			async searchPublic(request) {
				capturedRequest = request;

				return createSearchPage({
					items: [
						{
							id: "research-1",
							entityType: "research",
							title: "Sustainable energy systems",
							summary: "Public research summary",
							url: "/research/research-1",
							rank: 1,
							score: 0.82,
							matchedFields: ["title"],
							highlights: [],
							facultyId: "faculty-1",
							departmentId: "department-1",
							year: 2025,
							metadata: { researchArea: "Energy" },
						},
					],
					page: request.page,
					pageSize: request.pageSize,
					totalItems: 1,
					sort: request.sort,
					appliedFilters: request.filters,
				});
			},
		};

		const service = createSearchService({ searchIndex });
		const result = await service.searchPublic({
			keyword: "  sustainable   energy ",
			filters: {
				facultyId: "faculty-1",
				departmentId: "department-1",
				year: 2025,
				keywords: ["Energy", "energy", ""],
				entityTypes: ["research"],
			},
			page: 2,
			pageSize: 10,
		});

		expect(result.ok).toBe(true);
		expect(capturedRequest).toMatchObject({
			keyword: "sustainable energy",
			page: 2,
			pageSize: 10,
			offset: 10,
			sort: "relevance",
			visibility: "public",
			filters: {
				facultyId: "faculty-1",
				departmentId: "department-1",
				year: 2025,
				keywords: ["energy"],
				entityTypes: ["research"],
			},
		});

		const page = result.ok ? result.value : null;
		expect(page).toMatchObject<SearchPage>({
			items: [
				expect.objectContaining({
					entityType: "research",
					rank: 1,
					score: 0.82,
				}),
			],
			page: 2,
			pageSize: 10,
			totalItems: 1,
			totalPages: 1,
			hasNextPage: false,
			hasPreviousPage: true,
			sort: "relevance",
			appliedFilters: expect.any(Object),
		});
	});

	it("rejects invalid year filters before hitting the search index", () => {
		const result = normalizeSearchRequest({
			filters: {
				year: 1899,
			},
		});

		expect(result).toEqual({
			ok: false,
			error: {
				code: "INVALID_SEARCH_FILTER",
				message: "Search year must be 1900 or later.",
			},
		});
	});

	it("clamps pagination to the supported search contract", () => {
		const result = normalizeSearchRequest({
			page: -4,
			pageSize: 1000,
		});

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value.page : null).toBe(1);
		expect(result.ok ? result.value.pageSize : null).toBe(100);
	});
});
