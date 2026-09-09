import { describe, expect, it } from "vitest";

import {
	createReportsService,
	type DashboardReport,
	type PublicationAnalytics,
	publicationAnalyticsPeriodForRange,
	type ReportsRepository,
} from "../../../src/application/reports.ts";
import type { AuthenticatedActor } from "../../../src/application/authorization.ts";

const departmentAdmin: AuthenticatedActor = {
	userId: "user-1",
	status: "active",
	roles: [
		{
			role: "department_administrator",
			facultyId: "faculty-1",
			departmentId: "department-1",
		},
	],
};

const superAdmin: AuthenticatedActor = {
	userId: "super-1",
	status: "active",
	roles: [{ role: "super_administrator" }],
};

describe("reports application service", () => {
	it("returns public aggregate stats without leaking private record fields", async () => {
		const repository: ReportsRepository = {
			async getPublicRepositoryStats() {
				return {
					researchRecords: 12,
					publications: 18,
					researchers: 5,
					innovations: 3,
					patents: 2,
					faculties: 1,
					departments: 4,
					lastUpdatedAt: new Date("2026-01-02T00:00:00.000Z"),
					privateRecords: 99,
				} as never;
			},
			async getDashboardReport() {
				throw new Error("not used");
			},
			async getPublicationAnalytics() {
				throw new Error("not used");
			},
		};

		const service = createReportsService({ reportsRepository: repository });
		const result = await service.getPublicRepositoryStats();

		expect(result.ok).toBe(true);
		expect(result.ok ? result.value : null).toEqual({
			researchRecords: 12,
			publications: 18,
			researchers: 5,
			innovations: 3,
			patents: 2,
			faculties: 1,
			departments: 4,
			lastUpdatedAt: new Date("2026-01-02T00:00:00.000Z"),
		});
		expect(result.ok ? "privateRecords" in result.value : true).toBe(false);
	});

	it("enforces dashboard report authorization at the service boundary", async () => {
		const service = createReportsService({
			reportsRepository: createDashboardRepository(),
		});

		const result = await service.getDashboardReport(null, {
			scope: {
				facultyId: "faculty-1",
				departmentId: "department-1",
			},
		});

		expect(result).toEqual({
			ok: false,
			error: {
				code: "AUTHENTICATION_REQUIRED",
				message: "You must be signed in to perform this action.",
			},
		});
	});

	it("builds publication analytics periods with a previous matching duration", () => {
		expect(
			publicationAnalyticsPeriodForRange(
				"30d",
				new Date("2026-03-01T12:00:00.000Z"),
			),
		).toMatchObject({
			bucket: "week",
			from: new Date("2026-01-31T00:00:00.000Z"),
			label: "Last 30 days",
			previousFrom: new Date("2026-01-01T00:00:00.000Z"),
			previousTo: new Date("2026-01-30T23:59:59.999Z"),
			range: "30d",
			to: new Date("2026-03-01T12:00:00.000Z"),
		});
	});

	it("prevents scoped admins from loading broad publication analytics", async () => {
		const service = createReportsService({
			reportsRepository: createDashboardRepository(),
		});

		const result = await service.getPublicationAnalytics(departmentAdmin);

		expect(result).toEqual({
			ok: false,
			error: {
				code: "FORBIDDEN",
				message: "You do not have permission to perform this action.",
			},
		});
	});

	it("returns scoped publication analytics for department admins", async () => {
		let capturedScope: unknown = null;
		let capturedPeriod: unknown = null;
		const service = createReportsService({
			now: () => new Date("2026-03-01T12:00:00.000Z"),
			reportsRepository: createDashboardRepository(undefined, (input) => {
				capturedScope = input.scope;
				capturedPeriod = input.period;
			}),
		});

		const result = await service.getPublicationAnalytics(departmentAdmin, {
			range: "30d",
			scope: { departmentId: "department-1" },
		});

		expect(result.ok).toBe(true);
		expect(capturedScope).toEqual({
			departmentId: "department-1",
			facultyId: null,
			ownerId: null,
		});
		expect(capturedPeriod).toMatchObject({
			bucket: "week",
			range: "30d",
		});
		expect(result.ok ? result.value.metrics[0]?.label : null).toBe(
			"Total publications",
		);
	});

	it("allows super administrators to load university publication analytics", async () => {
		let capturedScope: unknown = null;
		const service = createReportsService({
			reportsRepository: createDashboardRepository(undefined, (input) => {
				capturedScope = input.scope;
			}),
		});

		const result = await service.getPublicationAnalytics(superAdmin, {
			range: "365d",
		});

		expect(result.ok).toBe(true);
		expect(capturedScope).toEqual({
			departmentId: null,
			facultyId: null,
			ownerId: null,
		});
	});

	it("returns scoped dashboard report contracts for authorized dashboard users", async () => {
		let capturedScope: unknown = null;
		const service = createReportsService({
			now: () => new Date("2026-03-01T00:00:00.000Z"),
			reportsRepository: createDashboardRepository((report) => {
				capturedScope = report.scope;
			}),
		});

		const result = await service.getDashboardReport(departmentAdmin, {
			scope: {
				facultyId: "faculty-1",
				departmentId: "department-1",
			},
			period: {
				from: new Date("2026-01-01T00:00:00.000Z"),
				to: new Date("2026-01-31T23:59:59.000Z"),
			},
		});

		expect(result.ok).toBe(true);
		expect(capturedScope).toEqual({
			facultyId: "faculty-1",
			departmentId: "department-1",
			ownerId: null,
		});
		expect(result.ok ? result.value : null).toMatchObject<DashboardReport>({
			scope: {
				facultyId: "faculty-1",
				departmentId: "department-1",
			},
			period: {
				from: new Date("2026-01-01T00:00:00.000Z"),
				to: new Date("2026-01-31T23:59:59.000Z"),
			},
			metrics: [
				{
					key: "researchRecords",
					label: "Research records",
					value: 7,
					previousValue: null,
					changePercent: null,
				},
			],
			researchByStatus: [
				{
					status: "department_review",
					count: 4,
				},
			],
			recentActivityCount: 6,
			generatedAt: new Date("2026-03-01T00:00:00.000Z"),
		});
	});

	it("rejects invalid report periods", async () => {
		const service = createReportsService({
			reportsRepository: createDashboardRepository(),
		});

		const result = await service.getDashboardReport(departmentAdmin, {
			scope: {
				facultyId: "faculty-1",
				departmentId: "department-1",
			},
			period: {
				from: new Date("2026-02-01T00:00:00.000Z"),
				to: new Date("2026-01-01T00:00:00.000Z"),
			},
		});

		expect(result).toEqual({
			ok: false,
			error: {
				code: "INVALID_REPORT_PERIOD",
				message: "Report period start date must be before the end date.",
			},
		});
	});
});

function createDashboardRepository(
	onReport?: (input: { scope: unknown }) => void,
	onAnalytics?: (input: { period: unknown; scope: unknown }) => void,
): ReportsRepository {
	return {
		async getPublicRepositoryStats() {
			throw new Error("not used");
		},
		async getDashboardReport(input) {
			onReport?.(input);

			return {
				scope: {
					facultyId: input.scope.facultyId ?? null,
					departmentId: input.scope.departmentId ?? null,
				},
				period: input.period,
				metrics: [
					{
						key: "researchRecords",
						label: "Research records",
						value: 7,
						previousValue: null,
						changePercent: null,
					},
				],
				researchByStatus: [
					{
						status: "department_review",
						count: 4,
					},
				],
				recentActivityCount: 6,
				generatedAt: new Date("2026-03-01T00:00:00.000Z"),
			};
		},
		async getPublicationAnalytics(input) {
			onAnalytics?.(input);

			return createPublicationAnalytics(input);
		},
	};
}

function createPublicationAnalytics(input: {
	period: PublicationAnalytics["period"];
	scope: { departmentId?: string | null; facultyId?: string | null };
}): PublicationAnalytics {
	return {
		byAccessLevel: [],
		byDepartment: [],
		byFaculty: [],
		byStatus: [],
		byType: [],
		generatedAt: new Date("2026-03-01T00:00:00.000Z"),
		metrics: [
			{
				changePercent: 25,
				helpText: "Publication records captured in the selected duration.",
				key: "publications",
				label: "Total publications",
				previousValue: 8,
				unit: "count",
				value: 10,
			},
		],
		period: input.period,
		recentPublications: [],
		scope: {
			departmentId: input.scope.departmentId ?? null,
			facultyId: input.scope.facultyId ?? null,
			label: "Test scope",
			level: input.scope.departmentId
				? "department"
				: input.scope.facultyId
					? "faculty"
					: "university",
		},
		trend: [],
	};
}
