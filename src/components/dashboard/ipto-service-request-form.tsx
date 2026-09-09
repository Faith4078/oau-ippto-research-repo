"use client";

import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingSkeleton } from "#/components/ui/loading-skeleton.tsx";

type ExistingResearchOption = {
	id: string;
	title: string;
	statusLabel: string;
};

const serviceOptions = [
	{
		value: "ip_protection",
		label: "Patent filing / IP protection",
	},
	{
		value: "commercialization",
		label: "Commercialization support",
	},
	{
		value: "prototyping_funding",
		label: "Prototyping or funding support",
	},
	{
		value: "licensing",
		label: "Licensing support",
	},
	{
		value: "other",
		label: "Other",
	},
] as const;

const technologyReadinessLevels = Array.from(
	{ length: 9 },
	(_value, index) => index + 1,
);

type ResearchBasis = "existing" | "new";

type FormValues = {
	researchBasis: ResearchBasis;
	researchRecordId: string;
	title: string;
	summary: string;
	requestedServices: string[];
	intellectualPropertyNotes: string;
	industryApplicationsText: string;
	technologyReadinessLevel: string;
};

const initialValues: FormValues = {
	researchBasis: "existing",
	researchRecordId: "",
	title: "",
	summary: "",
	requestedServices: [],
	intellectualPropertyNotes: "",
	industryApplicationsText: "",
	technologyReadinessLevel: "",
};

type SubmissionState =
	| { status: "idle" }
	| { status: "submitting" }
	| { status: "success"; message: string }
	| { status: "error"; message: string };

export function IpttoServiceRequestForm() {
	const [values, setValues] = useState<FormValues>(initialValues);
	const [research, setResearch] = useState<ExistingResearchOption[]>([]);
	const [researchLoading, setResearchLoading] = useState(true);
	const [submissionState, setSubmissionState] = useState<SubmissionState>({
		status: "idle",
	});

	const loadResearch = useCallback(async () => {
		setResearchLoading(true);

		try {
			const response = await fetch("/api/research/submissions", {
				cache: "no-store",
			});
			const payload = await response.json();

			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? "Your research could not be loaded.",
				);
			}

			const options: ExistingResearchOption[] = (payload.data ?? []).map(
				(item: { id: string; title: string; statusLabel: string }) => ({
					id: item.id,
					title: item.title,
					statusLabel: item.statusLabel,
				}),
			);

			setResearch(options);
			setValues((current) =>
				current.researchRecordId
					? current
					: { ...current, researchRecordId: options[0]?.id ?? "" },
			);
		} catch (error) {
			toast.error("Research unavailable", {
				description: error instanceof Error ? error.message : "Try again.",
			});
		} finally {
			setResearchLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadResearch();
	}, [loadResearch]);

	function updateValue<Key extends keyof FormValues>(
		key: Key,
		value: FormValues[Key],
	) {
		setValues((current) => ({ ...current, [key]: value }));
	}

	function toggleRequestedService(service: string, checked: boolean) {
		setValues((current) => ({
			...current,
			requestedServices: checked
				? [...current.requestedServices, service]
				: current.requestedServices.filter((value) => value !== service),
		}));
	}

	function selectedResearchTitle() {
		return research.find((item) => item.id === values.researchRecordId)?.title;
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await submitForm();
	}

	async function submitForm() {
		const validationMessage = validateRequestForm(values);

		if (validationMessage) {
			toast.error("Complete the service request form", {
				description: validationMessage,
			});
			setSubmissionState({ status: "error", message: validationMessage });
			return;
		}

		setSubmissionState({ status: "submitting" });

		const isExisting = values.researchBasis === "existing";
		const title = isExisting
			? (selectedResearchTitle() ?? values.title)
			: values.title;
		const technologyReadinessLevel = values.technologyReadinessLevel
			? Number(values.technologyReadinessLevel)
			: null;
		const industryApplications = values.industryApplicationsText
			.split(/[,\n]/)
			.map((value) => value.trim())
			.filter((value) => value.length > 0);

		const payload = {
			title,
			summary: values.summary.trim(),
			researchRecordId: isExisting ? values.researchRecordId : null,
			technologyReadinessLevel,
			industryApplications:
				industryApplications.length > 0 ? industryApplications : null,
			intellectualPropertyNotes:
				values.intellectualPropertyNotes.trim() || null,
			metadata: { requestedServices: values.requestedServices },
		};

		try {
			const response = await fetch("/api/innovations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const responsePayload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(
					responsePayload.error?.message ??
						"Your IPTTO service request could not be submitted.",
				);
			}

			toast.success("Request submitted", {
				description: "IPTTO will review your request and follow up with you.",
			});
			setSubmissionState({
				status: "success",
				message: "Your IPTTO service request was submitted for review.",
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Your IPTTO service request could not be submitted.";

			toast.error("Request not submitted", { description: message });
			setSubmissionState({ status: "error", message });
		}
	}

	return (
		<form className="space-y-5" noValidate onSubmit={handleSubmit}>
			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						What is this request for?
					</CardTitle>
					<CardDescription>
						Choose whether this request is about research you already submitted,
						or new research you have not added yet.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 p-4">
					<div className="grid gap-3 sm:grid-cols-2">
						<label
							className="flex cursor-pointer items-start gap-3 rounded border border-[#d8d8d8] p-4 has-checked:border-[#146ef5] has-checked:bg-[#eef4ff]"
							htmlFor="research-basis-existing"
						>
							<input
								checked={values.researchBasis === "existing"}
								className="mt-1"
								id="research-basis-existing"
								name="researchBasis"
								onChange={() => updateValue("researchBasis", "existing")}
								type="radio"
								value="existing"
							/>
							<span>
								<span className="block font-semibold">Existing research</span>
								<span className="block text-sm text-[#6b7280]">
									Link this request to research you have already submitted.
								</span>
							</span>
						</label>
						<label
							className="flex cursor-pointer items-start gap-3 rounded border border-[#d8d8d8] p-4 has-checked:border-[#146ef5] has-checked:bg-[#eef4ff]"
							htmlFor="research-basis-new"
						>
							<input
								checked={values.researchBasis === "new"}
								className="mt-1"
								id="research-basis-new"
								name="researchBasis"
								onChange={() => updateValue("researchBasis", "new")}
								type="radio"
								value="new"
							/>
							<span>
								<span className="block font-semibold">New research</span>
								<span className="block text-sm text-[#6b7280]">
									Describe research that is not in the repository yet.
								</span>
							</span>
						</label>
					</div>

					{values.researchBasis === "existing" ? (
						researchLoading ? (
							<LoadingSkeleton label="Loading your research" rows={2} />
						) : research.length === 0 ? (
							<div className="rounded border border-dashed p-4 text-center text-sm text-[#6b7280]">
								You have not submitted any research yet.{" "}
								<Link
									className="font-semibold text-[#146ef5]"
									to="/dashboard/lecturer/submit"
								>
									Add research
								</Link>{" "}
								first, or choose "New research" above.
							</div>
						) : (
							<Field>
								<FieldLabel htmlFor="researchRecordId">
									Choose your research
								</FieldLabel>
								<select
									className="h-10 rounded border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
									id="researchRecordId"
									onChange={(event) =>
										updateValue("researchRecordId", event.target.value)
									}
									required
									value={values.researchRecordId}
								>
									{research.map((item) => (
										<option key={item.id} value={item.id}>
											{item.title} — {item.statusLabel}
										</option>
									))}
								</select>
							</Field>
						)
					) : (
						<FieldGroup className="gap-4">
							<Field>
								<FieldLabel htmlFor="title">Research title</FieldLabel>
								<Input
									id="title"
									minLength={5}
									onChange={(event) => updateValue("title", event.target.value)}
									required
									value={values.title}
								/>
							</Field>
						</FieldGroup>
					)}
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						Describe your request
					</CardTitle>
					<CardDescription>
						Tell IPTTO what you need and why, so they can respond with the right
						support.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4">
					<FieldGroup className="gap-4">
						<Field>
							<FieldLabel htmlFor="summary">
								What are you requesting, and why?
							</FieldLabel>
							<textarea
								className="min-h-32 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
								id="summary"
								minLength={20}
								onChange={(event) => updateValue("summary", event.target.value)}
								placeholder="Describe the research, its current stage, and the IPTTO support you're asking for."
								required
								value={values.summary}
							/>
							<FieldDescription>
								At least 20 characters. This is what IPTTO reviewers will read
								first.
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel>What IPTTO support do you need?</FieldLabel>
							<div className="grid gap-2 sm:grid-cols-2">
								{serviceOptions.map((option) => (
									<label
										className="flex items-center gap-2 rounded border border-[#d8d8d8] px-3 py-2 text-sm has-checked:border-[#146ef5] has-checked:bg-[#eef4ff]"
										htmlFor={`service-${option.value}`}
										key={option.value}
									>
										<input
											checked={values.requestedServices.includes(option.value)}
											id={`service-${option.value}`}
											onChange={(event) =>
												toggleRequestedService(
													option.value,
													event.target.checked,
												)
											}
											type="checkbox"
										/>
										{option.label}
									</label>
								))}
							</div>
							<FieldDescription>
								Select every kind of support that applies.
							</FieldDescription>
						</Field>
					</FieldGroup>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						Additional details (optional)
					</CardTitle>
					<CardDescription>
						Add these now if you have them, or come back and fill them in later.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 p-4 md:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="intellectualPropertyNotes">
							Existing IP or patent notes
						</FieldLabel>
						<textarea
							className="min-h-24 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="intellectualPropertyNotes"
							onChange={(event) =>
								updateValue("intellectualPropertyNotes", event.target.value)
							}
							placeholder="e.g. Prior art already searched, provisional patent filed"
							value={values.intellectualPropertyNotes}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="industryApplications">
							Potential industry applications
						</FieldLabel>
						<textarea
							className="min-h-24 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="industryApplications"
							onChange={(event) =>
								updateValue("industryApplicationsText", event.target.value)
							}
							placeholder="Agriculture, healthcare, renewable energy…"
							value={values.industryApplicationsText}
						/>
						<FieldDescription>
							Separate each one with a comma or a new line.
						</FieldDescription>
					</Field>
					<Field>
						<FieldLabel htmlFor="technologyReadinessLevel">
							Technology readiness level
						</FieldLabel>
						<select
							className="h-10 rounded border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="technologyReadinessLevel"
							onChange={(event) =>
								updateValue("technologyReadinessLevel", event.target.value)
							}
							value={values.technologyReadinessLevel}
						>
							<option value="">Not sure / prefer not to say</option>
							{technologyReadinessLevels.map((level) => (
								<option key={level} value={level}>
									TRL {level}
								</option>
							))}
						</select>
					</Field>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div
						className="text-sm text-[#6b7280]"
						data-testid="service-request-status"
					>
						{submissionState.status === "idle" && "Submit your request"}
						{(submissionState.status === "success" ||
							submissionState.status === "error") &&
							submissionState.message}
						{submissionState.status === "submitting" &&
							"Submitting your request…"}
					</div>
					<Button
						className="h-11 rounded bg-[#146ef5] px-4 text-white hover:bg-[#0d5fdc]"
						disabled={submissionState.status === "submitting"}
						onClick={() => void submitForm()}
						type="button"
					>
						<Send className="h-4 w-4" />
						{submissionState.status === "submitting"
							? "Submitting…"
							: "Submit request"}
					</Button>
				</CardContent>
				{submissionState.status === "success" ? (
					<CardContent className="flex flex-wrap gap-3 border-[#d8d8d8] border-t p-4">
						<Button
							asChild
							className="h-10 rounded bg-[#146ef5] px-4 text-white hover:bg-[#0d5fdc]"
							type="button"
						>
							<Link to="/dashboard/lecturer">Back to my research</Link>
						</Button>
					</CardContent>
				) : null}
			</Card>
		</form>
	);
}

function validateRequestForm(values: FormValues): string | null {
	if (values.researchBasis === "existing" && !values.researchRecordId) {
		return "Choose which research this request is about.";
	}

	if (values.researchBasis === "new" && values.title.trim().length < 5) {
		return "Enter a research title with at least 5 characters.";
	}

	if (values.summary.trim().length < 20) {
		return "Describe your request with at least 20 characters.";
	}

	if (values.requestedServices.length === 0) {
		return "Select at least one kind of IPTTO support you need.";
	}

	return null;
}
