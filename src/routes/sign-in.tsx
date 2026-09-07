"use client";

import { createFileRoute } from "@tanstack/react-router";
import { LockKeyhole, LogIn } from "lucide-react";
import { useEffect, useId, useState } from "react";

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
import {
	betterAuthStaffIdStrategy,
	buildStaffSignInPayload,
} from "#/lib/auth.ts";

export const Route = createFileRoute("/sign-in")({
	head: () => ({
		meta: [
			{
				title: "Staff Sign In | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Staff sign-in page for the Obafemi Awolowo University IPTTO Research Repository.",
			},
		],
	}),
	component: SignInPage,
});

function SignInPage() {
	const staffIdInputId = useId();
	const passwordInputId = useId();
	const [error, setError] = useState<string>();
	const [isHydrated, setIsHydrated] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);

		const formData = new FormData(event.currentTarget);
		const staffId = String(formData.get("staffId") ?? "");
		const password = String(formData.get("password") ?? "");

		if (!staffId.trim() || !password) {
			setError("Enter your Staff ID and password.");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(betterAuthStaffIdStrategy.endpoint, {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify(buildStaffSignInPayload({ staffId, password })),
			});

			if (!response.ok) {
				setError("Check your Staff ID and password, then try again.");
				return;
			}

			window.location.assign("/dashboard");
		} catch {
			setError(
				"We could not sign you in. Check your connection and try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[#080808] sm:px-6 lg:px-8">
			<section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
				<div className="max-w-xl">
					<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8d8d8] bg-[#eef4ff] px-3 py-1 text-sm font-medium text-[#146ef5]">
						<LockKeyhole className="h-4 w-4" />
						Staff access
					</div>
					<h1 className="text-4xl font-semibold leading-[1.04] tracking-normal sm:text-5xl">
						Welcome back.
					</h1>
					<p className="mt-5 text-base leading-7 text-[#6b7280]">
						Sign in to add research, complete reviews, or manage the platform.
					</p>
				</div>

				<Card className="w-full rounded-lg border-[#d8d8d8] bg-[#f0f0f0] shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl leading-tight tracking-normal">
							Staff Sign In
						</CardTitle>
						<CardDescription>
							Use your OAU Staff ID and password.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							className="grid gap-6"
							method="post"
							noValidate
							onSubmit={handleSubmit}
						>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor={staffIdInputId}>Staff ID</FieldLabel>
									<Input
										autoComplete="username"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={staffIdInputId}
										name="staffId"
										pattern="(AC|AT)/[0-9]{4}"
										placeholder="AC/1234 or AT/1024"
										required
										title="Use AC/ or AT/ followed by exactly 4 digits."
										type="text"
									/>
									<FieldDescription>
										Lecturers: AC/ plus 4 digits. IPTTO and platform staff: AT/
										plus 4 digits.
									</FieldDescription>
								</Field>

								<Field>
									<FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
									<Input
										autoComplete="current-password"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={passwordInputId}
										name="password"
										required
										type="password"
									/>
									<FieldDescription>
										<a
											className="font-medium text-[#146ef5] underline-offset-4 hover:underline"
											href="/forgot-password"
										>
											Forgot your password?
										</a>
									</FieldDescription>
								</Field>
							</FieldGroup>

							<FieldError>{error}</FieldError>

							<Button
								className="h-12 rounded bg-[#146ef5] text-base text-white hover:bg-[#0d5fdc]"
								disabled={!isHydrated || isSubmitting}
								type="submit"
							>
								<LogIn className="h-5 w-5" />
								{isSubmitting ? "Signing in" : "Sign in"}
							</Button>
						</form>
						<div className="mt-6 border-t border-[#d8d8d8] pt-5 text-sm text-[#6b7280]">
							<p>Need staff access?</p>
							<div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
								<a
									className="font-medium text-[#146ef5] hover:underline"
									href="/sign-up/lecturer"
								>
									Lecturer account request
								</a>
								<a
									className="font-medium text-[#146ef5] hover:underline"
									href="/sign-up/iptto"
								>
									IPTTO account request
								</a>
							</div>
							<a
								className="mt-4 inline-block font-medium text-[#080808] hover:underline"
								href="/"
							>
								Back to the public repository
							</a>
						</div>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
