"use client";

import { UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import {
	type ResearchSubmissionFormValues,
	ResearchSubmissionUploadError,
	submitResearchWithDirectUpload,
} from "#/presentation/research-submission/direct-upload.ts";

const facultyOptions = [
	{
		id: "00000000-0000-0000-0000-000000000101",
		label: "Faculty of Technology",
	},
	{
		id: "00000000-0000-0000-0000-000000000102",
		label: "Faculty of Science",
	},
	{
		id: "00000000-0000-0000-0000-000000000103",
		label: "Faculty of Agriculture",
	},
];

const departmentOptions = [
	{
		id: "00000000-0000-0000-0000-000000000201",
		facultyId: "00000000-0000-0000-0000-000000000101",
		label: "Computer Science and Engineering",
	},
	{
		id: "00000000-0000-0000-0000-000000000202",
		facultyId: "00000000-0000-0000-0000-000000000102",
		label: "Biochemistry and Molecular Biology",
	},
	{
		id: "00000000-0000-0000-0000-000000000203",
		facultyId: "00000000-0000-0000-0000-000000000103",
		label: "Crop Production and Protection",
	},
];

const publicationTypes = [
	{ value: "journal_article", label: "Journal article" },
	{ value: "conference_paper", label: "Conference paper" },
	{ value: "book", label: "Book" },
	{ value: "book_chapter", label: "Book chapter" },
	{ value: "technical_report", label: "Technical report" },
	{ value: "thesis", label: "Thesis" },
	{ value: "dissertation", label: "Dissertation" },
	{ value: "working_paper", label: "Working paper" },
	{ value: "other", label: "Other" },
] as const;

const initialValues: ResearchSubmissionFormValues = {
	title: "",
	abstract: "",
	authorsText: "",
	departmentId: departmentOptions[0]?.id ?? "",
	facultyId: facultyOptions[0]?.id ?? "",
	keywordsText: "",
	publicationType: "journal_article",
	publicationTitle: "",
	publisher: "",
	journal: "",
	volume: "",
	issue: "",
	pages: "",
	doi: "",
	isbn: "",
	url: "",
	publishedOn: "",
	citation: "",
	accessLevel: "public",
	researchArea: "",
	startedOn: "",
	completedOn: "",
	requiresIpttoReview: false,
	fileChecksum: "",
	commercializationStatus: "",
	fundingInfo: "",
	comment: "",
	imageChecksum: "",
};

type SubmissionState =
	| { status: "idle" }
	| { status: "submitting" }
	| { status: "success"; message: string }
	| { status: "error"; message: string };

export function ResearchSubmissionForm() {
	const [values, setValues] =
		useState<ResearchSubmissionFormValues>(initialValues);
	const [file, setFile] = useState<File | null>(null);
	const [image, setImage] = useState<File | null>(null);
	const [submissionState, setSubmissionState] = useState<SubmissionState>({
		status: "idle",
	});
	const filteredDepartments = useMemo(
		() =>
			departmentOptions.filter(
				(department) => department.facultyId === values.facultyId,
			),
		[values.facultyId],
	);

	function updateValue<Key extends keyof ResearchSubmissionFormValues>(
		key: Key,
		value: ResearchSubmissionFormValues[Key],
	) {
		setValues((current) => ({ ...current, [key]: value }));
	}

	function updateFaculty(facultyId: string) {
		const nextDepartment =
			departmentOptions.find((department) => department.facultyId === facultyId)
				?.id ?? "";

		setValues((current) => ({
			...current,
			facultyId,
			departmentId: nextDepartment,
		}));
	}

	function updateAccessLevel(
		accessLevel: ResearchSubmissionFormValues["accessLevel"],
	) {
		setValues((current) => ({
			...current,
			accessLevel,
			requiresIpttoReview:
				accessLevel === "private" ? true : current.requiresIpttoReview,
		}));
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await submitForm();
	}

	async function submitForm() {
		const validationMessage = validateSubmissionForm(values, file);

		if (validationMessage) {
			toast.error("Complete the research form", {
				description: validationMessage,
			});
			setSubmissionState({
				status: "error",
				message: validationMessage,
			});
			return;
		}

		if (!file) {
			toast.error("Attach a research document", {
				description: "A PDF, PNG, or JPEG file is required before submission.",
			});
			setSubmissionState({
				status: "error",
				message: "Attach the research document before submitting.",
			});
			return;
		}

		setSubmissionState({ status: "submitting" });

		try {
			await submitResearchWithDirectUpload({ file, image, values });
			toast.success("Research submitted", {
				description: "Your research is now awaiting IPTTO review.",
			});
			setSubmissionState({
				status: "success",
				message: "Your research and document were submitted for IPTTO review.",
			});
		} catch (error) {
			if (error instanceof ResearchSubmissionUploadError) {
				const message =
					"Your research was submitted for IPTTO review, but the document could not be attached. Please try adding the document again.";

				toast.warning("Research submitted without the document", {
					description: "Please try adding the document again.",
				});
				setSubmissionState({
					status: "success",
					message,
				});
				return;
			}

			const message = describeSubmissionError(error);
			toast.error("Research not submitted", {
				description: message,
			});
			setSubmissionState({
				status: "error",
				message,
			});
		}
	}

	return (
		<form className="space-y-5" noValidate onSubmit={handleSubmit}>
			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						About your research
					</CardTitle>
					<CardDescription>
						Tell reviewers and readers what the research is about.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4">
					<FieldGroup className="gap-4">
						<Field>
							<FieldLabel htmlFor="title">Title</FieldLabel>
							<Input
								id="title"
								minLength={5}
								onChange={(event) => updateValue("title", event.target.value)}
								required
								value={values.title}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="abstract">Abstract</FieldLabel>
							<textarea
								className="min-h-36 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
								id="abstract"
								minLength={50}
								onChange={(event) =>
									updateValue("abstract", event.target.value)
								}
								required
								value={values.abstract}
							/>
						</Field>
						<div className="grid gap-4 md:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="faculty">Faculty</FieldLabel>
								<select
									className="h-10 rounded border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
									id="faculty"
									onChange={(event) => updateFaculty(event.target.value)}
									required
									value={values.facultyId}
								>
									{facultyOptions.map((faculty) => (
										<option key={faculty.id} value={faculty.id}>
											{faculty.label}
										</option>
									))}
								</select>
							</Field>
							<Field>
								<FieldLabel htmlFor="department">Department</FieldLabel>
								<select
									className="h-10 rounded border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
									id="department"
									onChange={(event) =>
										updateValue("departmentId", event.target.value)
									}
									required
									value={values.departmentId}
								>
									{filteredDepartments.map((department) => (
										<option key={department.id} value={department.id}>
											{department.label}
										</option>
									))}
								</select>
							</Field>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="researchArea">Research area</FieldLabel>
								<Input
									id="researchArea"
									onChange={(event) =>
										updateValue("researchArea", event.target.value)
									}
									required
									value={values.researchArea}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="accessLevel">
									Who can view this research?
								</FieldLabel>
								<select
									className="h-10 rounded border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
									id="accessLevel"
									onChange={(event) =>
										updateAccessLevel(
											event.target
												.value as ResearchSubmissionFormValues["accessLevel"],
										)
									}
									value={values.accessLevel}
								>
									<option value="public">Everyone</option>
									{/* Temporarily disabled: "Approved OAU staff only" (accessLevel="restricted") */}
									<option value="private">Only me and reviewers</option>
								</select>
							</Field>
						</div>
					</FieldGroup>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						Authors and search words
					</CardTitle>
					<CardDescription>
						Add each author on a new line, starting with the main contact.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 p-4 md:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="authors">Authors</FieldLabel>
						<textarea
							className="min-h-28 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="authors"
							onChange={(event) =>
								updateValue("authorsText", event.target.value)
							}
							placeholder="Dr. A. Adeyemi <adeyemi@oauife.edu.ng>"
							required
							value={values.authorsText}
						/>
						<FieldDescription>
							Enter each name exactly as it should appear publicly.
						</FieldDescription>
					</Field>
					<Field>
						<FieldLabel htmlFor="keywords">Search words</FieldLabel>
						<textarea
							className="min-h-28 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="keywords"
							onChange={(event) =>
								updateValue("keywordsText", event.target.value)
							}
							placeholder="renewable energy, smart irrigation, crop yield"
							required
							value={values.keywordsText}
						/>
						<FieldDescription>
							Add words people may use to find this research. Separate them with
							commas or new lines.
						</FieldDescription>
					</Field>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						Publication details
					</CardTitle>
					<CardDescription>
						If this work has already been published, add the details you have.
						You can leave any that do not apply blank.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Field>
							<FieldLabel htmlFor="publicationType">
								Publication type
							</FieldLabel>
							<select
								className="h-10 rounded border border-[#d8d8d8] bg-white px-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
								id="publicationType"
								onChange={(event) =>
									updateValue(
										"publicationType",
										event.target
											.value as ResearchSubmissionFormValues["publicationType"],
									)
								}
								value={values.publicationType}
							>
								{publicationTypes.map((type) => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</select>
						</Field>
						<Field>
							<FieldLabel htmlFor="publicationTitle">
								Title as published
							</FieldLabel>
							<Input
								id="publicationTitle"
								onChange={(event) =>
									updateValue("publicationTitle", event.target.value)
								}
								placeholder="Leave blank if it is the same as the research title"
								value={values.publicationTitle}
							/>
						</Field>
						<TextInputField
							id="publisher"
							label="Publisher"
							onChange={(value) => updateValue("publisher", value)}
							value={values.publisher}
						/>
						<TextInputField
							id="journal"
							label="Journal or conference"
							onChange={(value) => updateValue("journal", value)}
							value={values.journal}
						/>
						<TextInputField
							id="volume"
							label="Volume"
							onChange={(value) => updateValue("volume", value)}
							value={values.volume}
						/>
						<TextInputField
							id="issue"
							label="Issue"
							onChange={(value) => updateValue("issue", value)}
							value={values.issue}
						/>
						<TextInputField
							id="pages"
							label="Pages"
							onChange={(value) => updateValue("pages", value)}
							value={values.pages}
						/>
						<TextInputField
							id="doi"
							label="DOI / permanent article ID (optional)"
							onChange={(value) => updateValue("doi", value)}
							placeholder="Example: 10.1000/xyz123"
							value={values.doi}
						/>
						<TextInputField
							id="isbn"
							label="ISBN / book number (optional)"
							onChange={(value) => updateValue("isbn", value)}
							placeholder="For books and book chapters"
							value={values.isbn}
						/>
						<Field>
							<FieldLabel htmlFor="publishedOn">Published on</FieldLabel>
							<Input
								id="publishedOn"
								onChange={(event) =>
									updateValue("publishedOn", event.target.value)
								}
								type="date"
								value={values.publishedOn}
							/>
						</Field>
						<TextInputField
							id="url"
							label="Link to the published work"
							onChange={(value) => updateValue("url", value)}
							type="url"
							value={values.url}
						/>
						<Field>
							<FieldLabel htmlFor="citation">
								How this work should be cited (optional)
							</FieldLabel>
							<textarea
								className="min-h-24 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
								id="citation"
								onChange={(event) =>
									updateValue("citation", event.target.value)
								}
								value={values.citation}
							/>
							<FieldDescription>
								Paste the citation here if the publisher provided one.
							</FieldDescription>
						</Field>
					</div>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						Research document and dates
					</CardTitle>
					<CardDescription>
						Attach the document you want reviewers to read, then add the project
						dates if you know them.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 p-4 md:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="file">Research document</FieldLabel>
						<Input
							accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
							id="file"
							onChange={(event) => setFile(event.target.files?.[0] ?? null)}
							required
							type="file"
						/>
						<FieldDescription>
							PDF, PNG, or JPG. Maximum upload size is 50 MB.
						</FieldDescription>
					</Field>
					<Field>
						<FieldLabel htmlFor="startedOn">Research start date</FieldLabel>
						<Input
							id="startedOn"
							onChange={(event) => updateValue("startedOn", event.target.value)}
							type="date"
							value={values.startedOn}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="completedOn">
							Research completion date
						</FieldLabel>
						<Input
							id="completedOn"
							onChange={(event) =>
								updateValue("completedOn", event.target.value)
							}
							type="date"
							value={values.completedOn}
						/>
					</Field>
					<Field className="md:col-span-2" orientation="horizontal">
						<input
							checked={values.requiresIpttoReview}
							className="mt-1 size-4 rounded border-[#d8d8d8]"
							id="requiresIpttoReview"
							onChange={(event) =>
								updateValue("requiresIpttoReview", event.target.checked)
							}
							type="checkbox"
						/>
						<div>
							<FieldLabel htmlFor="requiresIpttoReview">
								This work may have commercial or patent potential
							</FieldLabel>
							<FieldDescription>
								Select this and the IPTTO team will help assess and protect the
								idea.
							</FieldDescription>
						</div>
					</Field>
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
						<FieldLabel htmlFor="commercializationStatus">
							Patent / prototype / commercialization status (optional)
						</FieldLabel>
						<Input
							id="commercializationStatus"
							onChange={(event) =>
								updateValue("commercializationStatus", event.target.value)
							}
							placeholder="e.g. Patent pending, prototype built"
							value={values.commercializationStatus}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="fundingInfo">
							Funding information (optional)
						</FieldLabel>
						<Input
							id="fundingInfo"
							onChange={(event) =>
								updateValue("fundingInfo", event.target.value)
							}
							placeholder="e.g. Self-funded, seeking a research grant"
							value={values.fundingInfo}
						/>
					</Field>
					<Field className="md:col-span-2">
						<FieldLabel htmlFor="comment">Comment (optional)</FieldLabel>
						<textarea
							className="min-h-28 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="comment"
							onChange={(event) => updateValue("comment", event.target.value)}
							placeholder="This research needs X funding to be achieved, should you be interested. Kindly reach out via this mail."
							value={values.comment}
						/>
						<FieldDescription>
							Use this space for anything readers should know, such as a funding
							request and how to reach you.
						</FieldDescription>
					</Field>
					<Field className="md:col-span-2">
						<FieldLabel htmlFor="researchImage">
							Upload an image of the research (optional)
						</FieldLabel>
						<Input
							accept=".png,.jpg,.jpeg,image/png,image/jpeg"
							id="researchImage"
							onChange={(event) => setImage(event.target.files?.[0] ?? null)}
							type="file"
						/>
						<FieldDescription>
							PNG or JPG. You can add this now or upload it later.
						</FieldDescription>
					</Field>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div
						className="text-sm text-[#6b7280]"
						data-testid="submission-status"
					>
						{submissionState.status === "idle" && "Submit"}
						{(submissionState.status === "success" ||
							submissionState.status === "error") &&
							submissionState.message}
						{submissionState.status === "submitting" &&
							"Submitting your research and attaching the document…"}
					</div>
					<Button
						className="h-11 rounded bg-[#146ef5] px-4 text-white hover:bg-[#0d5fdc]"
						disabled={submissionState.status === "submitting"}
						onClick={() => void submitForm()}
						type="button"
					>
						<UploadCloud className="h-4 w-4" />
						{submissionState.status === "submitting" ? "Submitting…" : "Submit"}
					</Button>
				</CardContent>
				{submissionState.status === "success" ? (
					<CardContent className="flex flex-wrap gap-3 border-[#d8d8d8] border-t p-4">
						<Button
							asChild
							className="h-10 rounded bg-[#146ef5] px-4 text-white hover:bg-[#0d5fdc]"
							type="button"
						>
							<a href="/dashboard/lecturer">View my submissions</a>
						</Button>
						<Button
							asChild
							className="h-10 rounded border-[#d8d8d8] bg-white px-4 text-[#080808] hover:border-[#146ef5] hover:bg-white"
							type="button"
							variant="outline"
						>
							<a href="/research">Browse all research</a>
						</Button>
					</CardContent>
				) : null}
			</Card>
		</form>
	);
}

function describeSubmissionError(error: unknown): string {
	if (error instanceof z.ZodError) {
		return (
			error.issues[0]?.message ?? "Check your research details and try again."
		);
	}

	if (error instanceof TypeError) {
		return "We could not submit your research. Check your connection and try again.";
	}

	if (error instanceof Error && error.message) {
		return error.message;
	}

	return "We could not submit your research. Check your connection and try again.";
}

function validateSubmissionForm(
	values: ResearchSubmissionFormValues,
	file: File | null,
) {
	if (values.title.trim().length < 5) {
		return "Enter a research title with at least 5 characters.";
	}

	if (values.abstract.trim().length < 50) {
		return "Enter an abstract with at least 50 characters.";
	}

	if (!values.authorsText.trim()) {
		return "Add at least one author.";
	}

	if (!values.keywordsText.trim()) {
		return "Add at least one keyword.";
	}

	if (!values.researchArea.trim()) {
		return "Enter the research area.";
	}

	if (values.url.trim() && !isValidUrl(values.url.trim())) {
		return "Enter a valid publication URL, starting with https://.";
	}

	if (!file) {
		return "Attach a PDF, PNG, or JPEG research document.";
	}

	return null;
}

function isValidUrl(value: string): boolean {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

function TextInputField({
	id,
	label,
	onChange,
	placeholder,
	type = "text",
	value,
}: {
	id: string;
	label: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: React.HTMLInputTypeAttribute;
	value: string;
}) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Input
				id={id}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				type={type}
				value={value}
			/>
		</Field>
	);
}
