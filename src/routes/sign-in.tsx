"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn } from "lucide-react";
import { useEffect, useId, useState } from "react";
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
	const [showPassword, setShowPassword] = useState(false);

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
				const message = await readAuthErrorMessage(
					response,
					"Check your Staff ID and password, then try again.",
				);
				setError(message);
				toast.error("Sign in failed", { description: message });
				return;
			}

			const accessResponse = await fetch("/api/dashboard/me", {
				cache: "no-store",
			});

			if (!accessResponse.ok) {
				const message = await readAuthErrorMessage(
					accessResponse,
					"Your account cannot access the dashboard yet.",
				);
				await clearRejectedSignInSession();
				setError(message);
				toast.error("Sign in failed", { description: message, duration: 8000 });
				return;
			}

			window.location.assign("/dashboard");
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "We could not sign you in. Check your connection and try again.",
			);
			toast.error("Sign in failed", {
				description:
					error instanceof Error
						? error.message
						: "We could not sign you in. Check your connection and try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[#080808] sm:px-6 lg:px-8">
			<section className="w-full max-w-5xl">
				<Link
					className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#146ef5] hover:underline"
					to="/"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to the public repository
				</Link>
				<div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
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
											Lecturers: AC/ plus 4 digits. IPTTO and platform staff:
											AT/ plus 4 digits.
										</FieldDescription>
									</Field>

									<Field>
										<FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
										<div className="relative">
											<Input
												autoComplete="current-password"
												className="h-12 rounded border-[#d8d8d8] bg-white pr-12 text-base md:text-base"
												id={passwordInputId}
												name="password"
												required
												type={showPassword ? "text" : "password"}
											/>
											<button
												aria-label={
													showPassword ? "Hide password" : "Show password"
												}
												aria-pressed={showPassword}
												className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#6b7280] hover:text-[#080808] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146ef5]"
												onClick={() => setShowPassword((visible) => !visible)}
												type="button"
											>
												{showPassword ? (
													<EyeOff aria-hidden="true" className="h-5 w-5" />
												) : (
													<Eye aria-hidden="true" className="h-5 w-5" />
												)}
											</button>
										</div>
										<FieldDescription>
											<Link
												className="font-medium text-[#146ef5] underline-offset-4 hover:underline"
												to="/forgot-password"
											>
												Forgot your password?
											</Link>
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
									<Link
										className="font-medium text-[#146ef5] hover:underline"
										to="/sign-up"
									>
										Create an account request
									</Link>
								</div>
								<Link
									className="mt-4 inline-block font-medium text-[#080808] hover:underline"
									to="/"
								>
									Back to the public repository
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>
		</main>
	);
}

async function readAuthErrorMessage(response: Response, fallback: string) {
	const payload = await response.json().catch(() => null);

	return errorMessageFromPayload(payload) ?? fallback;
}

function errorMessageFromPayload(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	if (
		"error" in payload &&
		payload.error &&
		typeof payload.error === "object"
	) {
		const error = payload.error;
		if ("fieldErrors" in error && error.fieldErrors) {
			const firstFieldError = Object.values(error.fieldErrors).flat()[0];
			if (typeof firstFieldError === "string") {
				return firstFieldError;
			}
		}
		if ("message" in error && typeof error.message === "string") {
			return error.message;
		}
	}

	if ("message" in payload && typeof payload.message === "string") {
		return payload.message;
	}

	return null;
}

async function clearRejectedSignInSession() {
	await fetch("/api/auth/sign-out", {
		body: JSON.stringify({}),
		credentials: "include",
		headers: {
			"content-type": "application/json",
		},
		method: "POST",
	}).catch(() => null);
}
