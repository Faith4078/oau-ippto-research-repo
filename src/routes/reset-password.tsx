"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Save, XCircle } from "lucide-react";
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
import { staffPasswordResetCompleteEndpoint } from "#/lib/auth.ts";
import {
	getPasswordRequirements,
	isValidPassword,
	passwordPolicyPattern,
	passwordPolicyText,
} from "#/lib/password-policy.ts";

export const Route = createFileRoute("/reset-password")({
	head: () => ({
		meta: [
			{
				title: "Reset Password | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Staff password reset page for the Obafemi Awolowo University IPTTO Research Repository.",
			},
		],
	}),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const tokenInputId = useId();
	const passwordInputId = useId();
	const [error, setError] = useState<string>();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [password, setPassword] = useState("");
	const query = new URLSearchParams(
		typeof window === "undefined" ? "" : window.location.search,
	);
	const tokenFromUrl = query.get("token") ?? "";
	const passwordRequirements = getPasswordRequirements(password);
	const passwordIsValid = isValidPassword(password);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);

		const formData = new FormData(event.currentTarget);
		const token = String(formData.get("token") ?? "");
		const nextPassword = String(formData.get("password") ?? "");

		if (!isValidPassword(nextPassword)) {
			const message = passwordPolicyText;
			setError(message);
			toast.error("Update your password", {
				description: message,
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(staffPasswordResetCompleteEndpoint, {
				body: JSON.stringify({
					password: nextPassword,
					token,
				}),
				headers: {
					"content-type": "application/json",
				},
				method: "POST",
			});
			const payload = await response.json().catch(() => null);

			if (!response.ok) {
				const message =
					payload?.error?.fieldErrors?.password?.[0] ??
					payload?.error?.fieldErrors?.token?.[0] ??
					payload?.error?.message ??
					"Password reset could not be completed.";
				setError(message);
				toast.error("Reset failed", {
					description: message,
				});
				return;
			}

			toast.success("Password reset complete", {
				description: "You can sign in with your new password.",
			});
			window.setTimeout(() => window.location.assign("/sign-in"), 600);
		} catch {
			const message =
				"Password reset could not be completed. Try again in a moment.";
			setError(message);
			toast.error("Reset failed", {
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
						New password
					</div>
					<h1 className="text-4xl font-semibold leading-[1.04] tracking-normal sm:text-5xl">
						Create your new password.
					</h1>
					<p className="mt-5 text-base leading-7 text-[#6b7280]">
						Your new password must be exactly 8 characters and include
						uppercase, lowercase, a number, and a special symbol.
					</p>
				</div>

				<Card className="w-full rounded-lg border-[#d8d8d8] bg-[#f0f0f0] shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl leading-tight tracking-normal">
							Reset Password
						</CardTitle>
						<CardDescription>{passwordPolicyText}</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="grid gap-6" onSubmit={handleSubmit}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor={tokenInputId}>Reset token</FieldLabel>
									<Input
										autoComplete="off"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										defaultValue={tokenFromUrl}
										id={tokenInputId}
										name="token"
										required
										type="text"
									/>
								</Field>

								<Field data-invalid={password.length > 0 && !passwordIsValid}>
									<FieldLabel htmlFor={passwordInputId}>
										New password
									</FieldLabel>
									<Input
										autoComplete="new-password"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={passwordInputId}
										maxLength={8}
										minLength={8}
										name="password"
										onChange={(event) => setPassword(event.target.value)}
										pattern={passwordPolicyPattern}
										required
										type="password"
										value={password}
									/>
									<FieldDescription>{passwordPolicyText}</FieldDescription>
									<div className="grid gap-2 text-sm">
										{passwordRequirements.map((requirement) => {
											const Icon = requirement.valid ? CheckCircle2 : XCircle;

											return (
												<div
													className={
														requirement.valid
															? "flex items-center gap-2 text-[#166534]"
															: "flex items-center gap-2 text-[#b42318]"
													}
													key={requirement.id}
												>
													<Icon className="h-4 w-4" />
													<span>{requirement.label}</span>
												</div>
											);
										})}
									</div>
								</Field>
							</FieldGroup>

							<FieldError>{error}</FieldError>

							<Button
								className="h-12 rounded bg-[#146ef5] text-base text-white hover:bg-[#0d5fdc]"
								disabled={isSubmitting}
								type="submit"
							>
								<Save className="h-5 w-5" />
								{isSubmitting ? "Saving password" : "Save new password"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
