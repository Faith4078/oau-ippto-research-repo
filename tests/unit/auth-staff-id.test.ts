import { describe, expect, it } from "vitest";
import {
	betterAuthStaffIdStrategy,
	buildStaffSignUpPayload,
	buildStaffSignInPayload,
	isAdministrativeStaffId,
	isLecturerStaffId,
	normalizeStaffId,
} from "../../src/lib/auth.ts";
import { validateStaffSignUpInput } from "../../src/lib/auth-signup.ts";

describe("staff ID sign-in scaffolding", () => {
	it("normalizes staff IDs before they are sent as Better Auth usernames", () => {
		expect(normalizeStaffId("  OAU/STAFF/123  ")).toBe("oau/staff/123");
	});

	it("builds the username sign-in payload expected by Better Auth", () => {
		expect(
			buildStaffSignInPayload({
				staffId: " OAU/IPTTO/001 ",
				password: "correct horse battery staple",
			}),
		).toEqual({
			username: "oau/iptto/001",
			password: "correct horse battery staple",
		});
	});

	it("documents the Better Auth username plugin strategy", () => {
		expect(betterAuthStaffIdStrategy.endpoint).toBe("/api/auth/sign-in/username");
		expect(betterAuthStaffIdStrategy.identifierField).toBe("username");
	});

	it("accepts AC plus exactly four digits for lecturer signup only", () => {
		expect(isLecturerStaffId("AC/1234")).toBe(true);
		expect(isLecturerStaffId(" ac/1234 ")).toBe(true);
		expect(isLecturerStaffId("AC/123")).toBe(false);
		expect(isLecturerStaffId("AC/12345")).toBe(false);
		expect(isLecturerStaffId("AC/12A4")).toBe(false);
		expect(isLecturerStaffId("AT/1302")).toBe(false);
	});

	it("accepts AT plus exactly four digits for IPTTO and administrative staff signup", () => {
		expect(isAdministrativeStaffId("AT/1302")).toBe(true);
		expect(isAdministrativeStaffId(" at/1302 ")).toBe(true);
		expect(isAdministrativeStaffId("AT/130")).toBe(false);
		expect(isAdministrativeStaffId("AT/13024")).toBe(false);
		expect(isAdministrativeStaffId("AT/13A2")).toBe(false);
		expect(isAdministrativeStaffId("AC/1234")).toBe(false);
	});

	it("builds the username signup payload expected by Better Auth", () => {
		expect(
			buildStaffSignUpPayload({
				departmentId: "00000000-0000-4000-8000-000000000201",
				email: "amina@oauife.edu.ng",
				facultyId: "00000000-0000-4000-8000-000000000101",
				firstName: "Amina",
				kind: "lecturer",
				lastName: "Adeyemi",
				password: "Pass12!A",
				staffId: " AC/1234 ",
			}),
		).toEqual({
			displayUsername: "AC/1234",
			email: "auth+ac-1234@oauife.edu.ng",
			name: "Amina Adeyemi",
			password: "Pass12!A",
			username: "ac/1234",
		});
	});

	it("validates the lecturer signup fields and AC/ staff ID prefix", () => {
		const result = validateStaffSignUpInput({
			departmentId: "00000000-0000-4000-8000-000000000201",
			email: "amina@oauife.edu.ng",
			facultyId: "00000000-0000-4000-8000-000000000101",
			firstName: "Amina",
			kind: "lecturer",
			lastName: "Adeyemi",
			password: "Pass12!A",
			staffId: "AT/1302",
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.fieldErrors.staffId).toContain(
			"Lecturer Staff ID must use AC/ followed by exactly 4 digits, for example AC/1234.",
		);
	});

	it("validates the IPTTO signup fields and AT/ staff ID prefix", () => {
		const result = validateStaffSignUpInput({
			kind: "iptto",
			email: "innovation@oauife.edu.ng",
			name: "Innovation Desk",
			password: "Pass12!A",
			staffId: "AC/1234",
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.fieldErrors.staffId).toContain(
			"IPTTO/admin Staff ID must use AT/ followed by exactly 4 digits, for example AT/1302.",
		);
	});

	it("requires signup passwords to be exactly 8 characters", () => {
		const result = validateStaffSignUpInput({
			kind: "iptto",
			email: "innovation@oauife.edu.ng",
			name: "Innovation Desk",
			password: "short",
			staffId: "AT/1302",
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.fieldErrors.password).toContain(
			"Password must be exactly 8 characters.",
		);
	});

	it("requires signup passwords to include uppercase lowercase number and a special symbol", () => {
		const result = validateStaffSignUpInput({
			kind: "iptto",
			email: "innovation@oauife.edu.ng",
			name: "Innovation Desk",
			password: "Pass1234",
			staffId: "AT/1302",
		});

		expect(result.ok).toBe(false);
		expect(result.ok ? null : result.fieldErrors.password).toContain(
			"Use exactly 8 characters with uppercase, lowercase, a number, and a special symbol.",
		);
	});
});
