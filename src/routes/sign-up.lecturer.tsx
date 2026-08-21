"use client";

import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardPenLine, XCircle } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
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
import { staffSignUpEndpoint } from "#/lib/auth.ts";
import {
	getPasswordRequirements,
	isValidPassword,
	passwordPolicyPattern,
	passwordPolicyText,
} from "#/lib/password-policy.ts";

export const Route = createFileRoute("/sign-up/lecturer")({
	head: () => ({
		meta: [
			{
				title: "Lecturer Sign Up | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Lecturer signup for the Obafemi Awolowo University IPTTO Research Repository.",
			},
		],
	}),
	component: LecturerSignUpPage,
});

function LecturerSignUpPage() {
	const firstNameInputId = useId();
	const lastNameInputId = useId();
	const staffIdInputId = useId();
	const emailInputId = useId();
	const facultyInputId = useId();
	const departmentInputId = useId();
	const passwordInputId = useId();
	const [error, setError] = useState<string>();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [password, setPassword] = useState("");
	const [faculty, setFaculty] = useState("");
	const [organizationOptions, setOrganizationOptions] = useState<{
		faculties: Array<{ id: string; name: string }>;
		departments: Array<{ id: string; facultyId: string; name: string }>;
	}>({ faculties: [], departments: [] });
	const departments = useMemo(() => {
		return organizationOptions.departments.filter(
			(item) => item.facultyId === faculty,
		);
	}, [faculty, organizationOptions]);

	useEffect(() => {
		void fetch("/api/organization-options")
			.then((response) => response.json())
			.then((payload) =>
				setOrganizationOptions(
					payload.data ?? { faculties: [], departments: [] },
				),
			)
			.catch(() =>
				setError("Faculty and department options could not be loaded."),
			);
	}, []);
	const passwordRequirements = getPasswordRequirements(password);
	const passwordIsValid = isValidPassword(password);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(undefined);

		const formData = new FormData(event.currentTarget);
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
			const response = await fetch(staffSignUpEndpoint, {
				body: JSON.stringify({
					departmentId: String(formData.get("departmentId") ?? ""),
					email: String(formData.get("email") ?? ""),
					facultyId: String(formData.get("facultyId") ?? ""),
					firstName: String(formData.get("firstName") ?? ""),
					kind: "lecturer",
					lastName: String(formData.get("lastName") ?? ""),
					password: String(formData.get("password") ?? ""),
					staffId: String(formData.get("staffId") ?? ""),
				}),
				headers: {
					"content-type": "application/json",
				},
				method: "POST",
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				const message =
					payload?.error?.message ?? "Lecturer signup could not be completed.";
				setError(message);
				toast.error("Signup failed", {
					description: message,
				});
				return;
			}

			toast.success("Lecturer request submitted", {
				description: "Your request is pending administrator approval.",
			});
			event.currentTarget.reset();
			setFaculty("");
			setPassword("");
		} catch {
			const message =
				"Lecturer signup could not be completed. Try again in a moment.";
			setError(message);
			toast.error("Signup failed", {
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
						<ClipboardPenLine className="h-4 w-4" />
						Lecturer access
					</div>
					<h1 className="text-4xl font-semibold leading-[1.04] tracking-normal sm:text-5xl">
						Sign up for lecturer access.
					</h1>
				</div>

				<Card className="w-full rounded-lg border-[#d8d8d8] bg-[#f0f0f0] shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl leading-tight tracking-normal">
							Lecturer Sign Up
						</CardTitle>
						<CardDescription>Create your lecturer account.</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="grid gap-6" onSubmit={handleSubmit}>
							<FieldGroup>
								<div className="grid gap-5 sm:grid-cols-2">
									<Field>
										<FieldLabel htmlFor={firstNameInputId}>
											First name
										</FieldLabel>
										<Input
											autoComplete="given-name"
											className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
											id={firstNameInputId}
											name="firstName"
											required
											type="text"
										/>
									</Field>

									<Field>
										<FieldLabel htmlFor={lastNameInputId}>Last name</FieldLabel>
										<Input
											autoComplete="family-name"
											className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
											id={lastNameInputId}
											name="lastName"
											required
											type="text"
										/>
									</Field>
								</div>

								<Field>
									<FieldLabel htmlFor={staffIdInputId}>Staff ID</FieldLabel>
									<Input
										autoComplete="username"
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={staffIdInputId}
										name="staffId"
										pattern="AC/[0-9]{4}"
										placeholder="AC/1234"
										required
										title="Use AC/ followed by exactly 4 digits, for example AC/1234."
										type="text"
									/>
									<FieldDescription>
										Staff IDs must be in the format AC/ followed by exactly 4
										digits
									</FieldDescription>
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
								</Field>

								<Field>
									<FieldLabel htmlFor={facultyInputId}>Faculty</FieldLabel>
									<select
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										id={facultyInputId}
										name="facultyId"
										onChange={(event) => setFaculty(event.target.value)}
										required
										value={faculty}
									>
										<option value="">Select faculty</option>
										{organizationOptions.faculties.map((item) => (
											<option key={item.id} value={item.id}>
												{item.name}
											</option>
										))}
									</select>
								</Field>

								<Field>
									<FieldLabel htmlFor={departmentInputId}>
										Department
									</FieldLabel>
									<select
										className="h-12 rounded border-[#d8d8d8] bg-white text-base md:text-base"
										disabled={!faculty}
										id={departmentInputId}
										name="departmentId"
										required
									>
										<option value="">Select department</option>
										{departments.map((item) => (
											<option key={item.id} value={item.id}>
												{item.name}
											</option>
										))}
									</select>
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
								</Field>
							</FieldGroup>

							<FieldError>{error}</FieldError>

							<Button
								className="h-12 rounded bg-[#146ef5] text-base text-white hover:bg-[#0d5fdc]"
								disabled={isSubmitting}
								type="submit"
							>
								<ClipboardPenLine className="h-5 w-5" />
								{isSubmitting ? "Creating account" : "Create account"}
							</Button>
						</form>
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
