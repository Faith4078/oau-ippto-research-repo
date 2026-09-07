"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, IdCard, XCircle } from "lucide-react";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { isAdministrativeStaffId, staffSignUpEndpoint } from "#/lib/auth.ts";
import {
	getPasswordRequirements,
	isValidPassword,
	passwordPolicyPattern,
	passwordPolicyText,
} from "#/lib/password-policy.ts";

export const Route = createFileRoute("/sign-up/iptto")({
	head: () => ({
		meta: [
			{
				title: "IPTTO Sign Up | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"IPTTO staff signup for the Obafemi Awolowo University IPTTO Research Repository.",
			},
		],
	}),
	component: IpttoSignUpPage,
});

function IpttoSignUpPage() {
	const nameInputId = useId();
	const staffIdInputId = useId();
	const emailInputId = useId();
	const passwordInputId = useId();
	const [error, setError] = useState<string>();
	const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [password, setPassword] = useState("");
	const passwordRequirements = getPasswordRequirements(password);
	const passwordIsValid = isValidPassword(password);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);
		setFieldErrors({});

		const form = event.currentTarget;
		const formData = new FormData(form);
		const name = String(formData.get("name") ?? "").trim();
		const staffId = String(formData.get("staffId") ?? "").trim();
		const email = String(formData.get("email") ?? "").trim();
		const nextPassword = String(formData.get("password") ?? "");

		const clientErrors: Record<string, string[]> = {};
		if (!name) clientErrors.name = ["Name is required."];
		if (!staffId) {
			clientErrors.staffId = ["Staff ID is required."];
		} else if (!isAdministrativeStaffId(staffId)) {
			clientErrors.staffId = [
				"IPTTO/admin Staff ID must use AT/ followed by exactly 4 digits, for example AT/1302.",
			];
		}
		if (!email) {
			clientErrors.email = ["Institutional email is required."];
		}
		if (!isValidPassword(nextPassword)) {
			clientErrors.password = [passwordPolicyText];
		}

		if (Object.keys(clientErrors).length > 0) {
			setFieldErrors(clientErrors);
			const firstMessage =
				Object.values(clientErrors)[0]?.[0] ??
				"Check the highlighted signup fields.";
			setError(firstMessage);
			toast.error("Check signup details", {
				description: firstMessage,
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(staffSignUpEndpoint, {
				body: JSON.stringify({
					email,
					kind: "iptto",
					name,
					password: nextPassword,
					staffId,
				}),
				headers: {
					"content-type": "application/json",
				},
				method: "POST",
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				const serverFieldErrors = payload?.error?.fieldErrors ?? {};
				setFieldErrors(serverFieldErrors);
				const firstFieldError = Object.values(serverFieldErrors).flat()[0];
				const message =
					firstFieldError ??
					payload?.error?.message ??
					payload?.message ??
					"We could not create your account.";
				setError(message);
				toast.error("Account not created", {
					description: message,
				});
				return;
			}

			toast.success("Signup request submitted", {
				description:
					"Your request is now under review. A super administrator must approve your account before you can sign in. You will be notified once a decision is made.",
				duration: 8000,
			});
			form.reset();
			setPassword("");
			setFieldErrors({});
		} catch {
			const message =
				"We could not create your account. Check your connection and try again.";
			setError(message);
			toast.error("Account not created", {
				description: message,
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[#080808] sm:px-6 lg:px-8">
			<section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
				<div className="max-w-xl">
					<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8d8d8] bg-[#eef4ff] px-3 py-1 text-sm font-medium text-[#146ef5]">
						<IdCard className="h-4 w-4" />
						IPTTO access
					</div>
					<h1 className="text-4xl font-semibold leading-[1.04] tracking-normal sm:text-5xl">
						Manage ideas from research to impact.
					</h1>
				</div>

				<Card className="w-full rounded-lg border-[#d8d8d8] bg-[#f0f0f0] shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl leading-tight tracking-normal">
							IPTTO Sign Up
						</CardTitle>
						<CardDescription>
							Enter your OAU details. Your account will be reviewed before you
							can sign in.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="grid gap-6" onSubmit={handleSubmit}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor={nameInputId}>Name</FieldLabel>
									<Input
										autoComplete="name"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={nameInputId}
										name="name"
										required
										type="text"
									/>
									{fieldErrors.name?.[0] && (
										<FieldError>{fieldErrors.name[0]}</FieldError>
									)}
								</Field>

								<Field>
									<FieldLabel htmlFor={emailInputId}>
										Institutional email
									</FieldLabel>
									<Input
										autoComplete="email"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={emailInputId}
										name="email"
										required
										type="email"
									/>
									{fieldErrors.email?.[0] && (
										<FieldError>{fieldErrors.email[0]}</FieldError>
									)}
								</Field>

								<Field>
									<FieldLabel htmlFor={staffIdInputId}>Staff ID</FieldLabel>
									<Input
										autoComplete="username"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={staffIdInputId}
										name="staffId"
										pattern="AT/[0-9]{4}"
										placeholder="AT/1302"
										required
										title="Use AT/ followed by exactly 4 digits, for example AT/1302."
										type="text"
									/>
									<p className="text-sm text-[#6b7280]">
										Enter AT/ followed by your 4 staff ID digits.
									</p>
									{fieldErrors.staffId?.[0] && (
										<FieldError>{fieldErrors.staffId[0]}</FieldError>
									)}
								</Field>

								<Field>
									<FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
									<Input
										autoComplete="new-password"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										aria-invalid={password.length > 0 && !passwordIsValid}
										id={passwordInputId}
										maxLength={8}
										minLength={8}
										name="password"
										onChange={(event) => setPassword(event.target.value)}
										pattern={passwordPolicyPattern}
										required
										title={passwordPolicyText}
										type="password"
										value={password}
									/>
									<PasswordRequirementHelper
										password={password}
										requirements={passwordRequirements}
									/>
									{fieldErrors.password?.[0] && (
										<FieldError>{fieldErrors.password[0]}</FieldError>
									)}
								</Field>
							</FieldGroup>

							{error && <FieldError>{error}</FieldError>}

							<Button
								className="h-12 rounded bg-[#146ef5] text-base text-white hover:bg-[#0d5fdc]"
								disabled={isSubmitting}
								type="submit"
							>
								<IdCard className="h-5 w-5" />
								{isSubmitting ? "Creating account" : "Create account"}
							</Button>
						</form>
						<p className="mt-6 border-t border-[#d8d8d8] pt-5 text-sm text-[#6b7280]">
							Already requested access?{" "}
							<a
								className="font-medium text-[#146ef5] hover:underline"
								href="/sign-in"
							>
								Sign in
							</a>
							{" · "}
							<a
								className="font-medium text-[#080808] hover:underline"
								href="/"
							>
								Public repository
							</a>
						</p>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}

function PasswordRequirementHelper({
	password,
	requirements,
}: {
	password: string;
	requirements: ReturnType<typeof getPasswordRequirements>;
}) {
	return (
		<div className="space-y-2 text-sm">
			<p className="text-[#6b7280]">{passwordPolicyText}</p>
			<ul className="grid gap-1">
				{requirements.map((requirement) => {
					const Icon = requirement.valid ? CheckCircle2 : XCircle;
					const showError = password.length > 0 && !requirement.valid;

					return (
						<li
							className={
								requirement.valid
									? "flex items-center gap-2 text-emerald-700"
									: showError
										? "flex items-center gap-2 text-red-700"
										: "flex items-center gap-2 text-[#6b7280]"
							}
							key={requirement.id}
						>
							<Icon className="h-4 w-4" />
							{requirement.label}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
