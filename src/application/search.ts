import type { EntityId } from "../domain/common.ts";
import type { InnovationStatus, PatentStatus } from "../domain/innovation.ts";
import type { PublicationType } from "../domain/research.ts";
import { fail, ok, type Result } from "./result.ts";

const defaultPage = 1;
const defaultPageSize = 20;
const maxPageSize = 100;

export type SearchEntityType =
	| "research"
	| "researcher"
	| "publication"
	| "innovation"
	| "patent";

export type SearchSort = "relevance" | "newest" | "oldest" | "title";

export type SearchFilters = {
	facultyId?: EntityId;
	departmentId?: EntityId;
	researcherId?: EntityId;
	year?: number;
	type?: PublicationType;
	keywords?: readonly string[];
	researchArea?: string;
	innovationStatus?: InnovationStatus;
	patentStatus?: PatentStatus;
	entityTypes?: readonly SearchEntityType[];
};

export type SearchRequest = {
	keyword?: string;
	filters?: SearchFilters;
	page?: number;
	pageSize?: number;
	sort?: SearchSort;
};

export type NormalizedSearchRequest = {
	keyword: string;
	filters: {
		facultyId: EntityId | null;
		departmentId: EntityId | null;
		researcherId: EntityId | null;
		year: number | null;
		type: PublicationType | null;
		keywords: readonly string[];
		researchArea: string | null;
		innovationStatus: InnovationStatus | null;
		patentStatus: PatentStatus | null;
		entityTypes: readonly SearchEntityType[];
	};
	page: number;
	pageSize: number;
	offset: number;
	sort: SearchSort;
	visibility: "public";
};

export type SearchResultItem = {
	id: EntityId;
	entityType: SearchEntityType;
	title: string;
	summary: string;
	url: string;
	rank: number;
	score: number;
	matchedFields: readonly string[];
	highlights: readonly string[];
	facultyId: EntityId | null;
	departmentId: EntityId | null;
	year: number | null;
	metadata: Record<string, string | number | boolean | null>;
};

export type SearchPage = {
	items: readonly SearchResultItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	sort: SearchSort;
	appliedFilters: NormalizedSearchRequest["filters"];
};

export type SearchIndex = {
	searchPublic(input: NormalizedSearchRequest): Promise<SearchPage>;
};

export type SearchService = ReturnType<typeof createSearchService>;

export function createSearchService(dependencies: {
	searchIndex: SearchIndex;
}) {
	return {
		async searchPublic(request: SearchRequest): Promise<Result<SearchPage>> {
			const normalized = normalizeSearchRequest(request);

			if (!normalized.ok) {
				return normalized;
			}

			return ok(await dependencies.searchIndex.searchPublic(normalized.value));
		},
	};
}

export function normalizeSearchRequest(
	request: SearchRequest,
): Result<NormalizedSearchRequest> {
	const page = normalizePositiveInteger(request.page, defaultPage);
	const pageSize = Math.min(
		normalizePositiveInteger(request.pageSize, defaultPageSize),
		maxPageSize,
	);
	const year = request.filters?.year;

	if (year !== undefined && (!Number.isInteger(year) || year < 1900)) {
		return fail("INVALID_SEARCH_FILTER", "Search year must be 1900 or later.");
	}

	const entityTypes =
		request.filters?.entityTypes && request.filters.entityTypes.length > 0
			? uniqueList(request.filters.entityTypes)
			: ([
					"research",
					"researcher",
					"publication",
					"innovation",
					"patent",
				] satisfies SearchEntityType[]);

	return ok({
		keyword: normalizeText(request.keyword),
		filters: {
			facultyId: request.filters?.facultyId ?? null,
			departmentId: request.filters?.departmentId ?? null,
			researcherId: request.filters?.researcherId ?? null,
			year: year ?? null,
			type: request.filters?.type ?? null,
			keywords: normalizeKeywords(request.filters?.keywords),
			researchArea: normalizeNullableText(request.filters?.researchArea),
			innovationStatus: request.filters?.innovationStatus ?? null,
			patentStatus: request.filters?.patentStatus ?? null,
			entityTypes,
		},
		page,
		pageSize,
		offset: (page - 1) * pageSize,
		sort: request.sort ?? "relevance",
		visibility: "public",
	});
}

export function createSearchPage(input: {
	items: readonly SearchResultItem[];
	page: number;
	pageSize: number;
	totalItems: number;
	sort: SearchSort;
	appliedFilters: NormalizedSearchRequest["filters"];
}): SearchPage {
	const totalPages = Math.max(1, Math.ceil(input.totalItems / input.pageSize));

	return {
		...input,
		totalPages,
		hasNextPage: input.page < totalPages,
		hasPreviousPage: input.page > 1,
	};
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
	if (value === undefined || !Number.isFinite(value)) {
		return fallback;
	}

	return Math.max(1, Math.floor(value));
}

function normalizeNullableText(value: string | undefined) {
	const normalized = normalizeText(value);
	return normalized.length > 0 ? normalized : null;
}

function normalizeText(value: string | undefined) {
	return value?.trim().replace(/\s+/g, " ") ?? "";
}

function normalizeKeywords(values: readonly string[] | undefined) {
	return uniqueList(
		values
			?.map((value) => normalizeText(value).toLowerCase())
			.filter((value) => value.length > 0) ?? [],
	);
}

function uniqueList<T>(values: readonly T[]): readonly T[] {
	return Array.from(new Set(values));
}
