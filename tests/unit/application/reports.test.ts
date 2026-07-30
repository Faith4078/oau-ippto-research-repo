import { describe, expect, it } from "vitest";

import {
	createReportsService,
	type DashboardReport,
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
	};
}
