"use client";

import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Send } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { staffPasswordResetRequestEndpoint } from "#/lib/auth.ts";

type ResetRequestResponse = {
	data?: {
		accepted: boolean;
		expiresAt: string | null;
		resetUrl: string | null;
	};
	error?: {
		message?: string;
		fieldErrors?: Record<string, string[]>;
	};
};

export const Route = createFileRoute("/forgot-password")({
	head: () => ({
		meta: [
			{
				title: "Forgot Password | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Staff password reset request page for the Obafemi Awolowo University IPTTO Research Repository.",
			},
		],
	}),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const staffIdInputId = useId();
	const [error, setError] = useState<string>();
	const [resetUrl, setResetUrl] = useState<string>();
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setResetUrl(undefined);

		const formData = new FormData(event.currentTarget);
		const staffId = String(formData.get("staffId") ?? "");

		setIsSubmitting(true);

		try {
			const response = await fetch(staffPasswordResetRequestEndpoint, {
				body: JSON.stringify({ staffId }),
				headers: {
					"content-type": "application/json",
				},
				method: "POST",
			});
			const payload = (await response
				.json()
				.catch(() => null)) as ResetRequestResponse | null;

			if (!response.ok) {
				const message =
					payload?.error?.fieldErrors?.staffId?.[0] ??
					payload?.error?.message ??
					"We could not start the password reset.";
				setError(message);
				toast.error("Instructions not sent", {
					description: message,
				});
				return;
			}

			if (payload?.data?.resetUrl) {
				setResetUrl(payload.data.resetUrl);
			}

			toast.success("Check your email", {
				description: payload?.data?.resetUrl
					? "Use the link below to choose a new password."
					: "If this Staff ID has an active account, reset instructions have been sent.",
			});
		} catch {
			const message =
				"We could not send the instructions. Check your connection and try again.";
			setError(message);
			toast.error("Instructions not sent", {
				description: message,
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[#080808] sm:px-6 lg:px-8">
			<section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
				<div className="max-w-xl">
					<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8d8d8] bg-[#eef4ff] px-3 py-1 text-sm font-medium text-[#146ef5]">
						<KeyRound className="h-4 w-4" />
						Password help
					</div>
					<h1 className="text-4xl font-semibold leading-[1.04] tracking-normal sm:text-5xl">
						Forgot your password?
					</h1>
					<p className="mt-5 text-base leading-7 text-[#6b7280]">
						Enter your OAU Staff ID and we will help you choose a new one.
					</p>
				</div>

				<Card className="w-full rounded-lg border-[#d8d8d8] bg-[#f0f0f0] shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl leading-tight tracking-normal">
							Forgot Password
						</CardTitle>
						<CardDescription>
							We will send instructions to the email linked to your account.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="grid gap-6" onSubmit={handleSubmit}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor={staffIdInputId}>Staff ID</FieldLabel>
									<Input
										autoComplete="username"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base uppercase md:text-base"
										id={staffIdInputId}
										name="staffId"
										pattern="(AC|AT)/[0-9]{4}"
										placeholder="AC/1234 or AT/1302"
										required
										type="text"
									/>
									<FieldDescription>
										Lecturers: AC/ plus 4 digits. IPTTO and platform staff: AT/
										plus 4 digits.
									</FieldDescription>
								</Field>
							</FieldGroup>

							<FieldError>{error}</FieldError>

							{resetUrl ? (
								<div className="rounded border border-[#d8d8d8] bg-white p-4 text-sm text-[#4b5563]">
									<p className="font-medium text-[#080808]">
										Continue to reset your password
									</p>
									<a
										className="mt-3 inline-flex rounded bg-[#146ef5] px-4 py-2 font-medium text-white no-underline hover:bg-[#0d5fdc]"
										href={resetUrl}
									>
										Choose a new password
									</a>
								</div>
							) : null}

							<Button
								className="h-12 rounded bg-[#146ef5] text-base text-white hover:bg-[#0d5fdc]"
								disabled={isSubmitting}
								type="submit"
							>
								<Send className="h-5 w-5" />
								{isSubmitting
									? "Sending instructions"
									: "Send reset instructions"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
