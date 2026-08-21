import { describe, expect, it, vi } from "vitest";

import {
	createTransactionalEmailSender,
	renderAccountStatusEmail,
	renderPasswordResetEmail,
	shouldExposePasswordResetDebugLink,
} from "../../src/infrastructure/email/transactional-email.ts";

describe("transactional email", () => {
	it("renders password reset email without placing the token in the subject", () => {
		const message = renderPasswordResetEmail({
			resetUrl: "https://repository.oauife.edu.ng/reset-password?token=secret",
			to: "lecturer@oauife.edu.ng",
		});

		expect(message.subject).toBe("Reset your OAU IPTTO Repository password");
		expect(message.text).toContain("https://repository.oauife.edu.ng/reset-password?token=secret");
		expect(message.subject).not.toContain("secret");
	});

	it("renders each supported account status notification", () => {
		for (const status of ["active", "rejected", "suspended", "deactivated"] as const) {
			const message = renderAccountStatusEmail({
				reason: status === "active" ? null : "Contact the repository office.",
				status,
				to: "staff@oauife.edu.ng",
			});

			expect(message.subject.toLowerCase()).toContain(status);
			expect(message.text).toContain("OAU IPTTO Research Repository");
		}
	});

	it("only exposes reset links in non-production explicit debug mode", () => {
		expect(
			shouldExposePasswordResetDebugLink({
				NODE_ENV: "development",
				PASSWORD_RESET_DEBUG: "true",
			}),
		).toBe(true);
		expect(
			shouldExposePasswordResetDebugLink({
				NODE_ENV: "production",
				PASSWORD_RESET_DEBUG: "true",
			}),
		).toBe(false);
		expect(
			shouldExposePasswordResetDebugLink({ NODE_ENV: "development" }),
		).toBe(false);
	});

	it("sends through the configured HTTP provider", async () => {
		const fetch = vi.fn(async () => new Response(null, { status: 202 }));
		const sender = createTransactionalEmailSender(
			{
				EMAIL_API_TOKEN: "provider-token",
				EMAIL_API_URL: "https://email.example.test/send",
				EMAIL_FROM: "Repository <repository@oauife.edu.ng>",
			},
			fetch,
		);

		await sender.send({
			html: "<p>Hello</p>",
			subject: "Account active",
			text: "Hello",
			to: "staff@oauife.edu.ng",
		});

		expect(fetch).toHaveBeenCalledWith(
			"https://email.example.test/send",
			expect.objectContaining({
				method: "POST",
				headers: expect.objectContaining({ authorization: "Bearer provider-token" }),
			}),
		);
	});
});
