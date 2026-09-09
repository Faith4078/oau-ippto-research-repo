"use client";

import { UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Field, FieldDescription, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingSkeletonFrame } from "#/components/ui/loading-skeleton.tsx";
import { uploadAvatarWithDirectUpload } from "#/presentation/profile/avatar-upload.ts";

type ProfileFormValues = {
	title: string;
	bio: string;
	researchInterestsText: string;
	orcid: string;
	phone: string;
	publicEmail: string;
	recoveryEmail: string;
};

type ProfileApiResponse = {
	userId: string;
	name: string;
	email: string | null;
	staffId: string;
	title: string | null;
	bio: string | null;
	researchInterests: string[];
	orcid: string | null;
	phone: string | null;
	publicEmail: string | null;
	recoveryEmail: string | null;
	avatarFileId: string | null;
	avatarUrl: string | null;
};

type LoadState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "ready"; identity: { name: string; email: string | null } };

type SaveState =
	| { status: "idle" }
	| { status: "saving" }
	| { status: "success"; message: string }
	| { status: "error"; message: string };

const emptyValues: ProfileFormValues = {
	title: "",
	bio: "",
	researchInterestsText: "",
	orcid: "",
	phone: "",
	publicEmail: "",
	recoveryEmail: "",
};

export function LecturerProfileForm() {
	const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
	const [values, setValues] = useState<ProfileFormValues>(emptyValues);
	const [avatarFileId, setAvatarFileId] = useState<string | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
	const avatarPreviewUrl = useMemo(
		() => (avatarFile ? URL.createObjectURL(avatarFile) : null),
		[avatarFile],
	);

	useEffect(() => {
		return () => {
			if (avatarPreviewUrl) {
				URL.revokeObjectURL(avatarPreviewUrl);
			}
		};
	}, [avatarPreviewUrl]);

	useEffect(() => {
		let isMounted = true;

		async function loadProfile() {
			setLoadState({ status: "loading" });

			try {
				const response = await fetch("/api/dashboard/profile", {
					cache: "no-store",
				});
				const payload = await response.json().catch(() => ({}));

				if (!isMounted) {
					return;
				}

				if (!response.ok) {
					throw new Error(
						payload.error?.message ?? "Your profile could not be loaded.",
					);
				}

				const profile = payload.data as ProfileApiResponse;

				setValues({
					title: profile.title ?? "",
					bio: profile.bio ?? "",
					researchInterestsText: profile.researchInterests.join(", "),
					orcid: profile.orcid ?? "",
					phone: profile.phone ?? "",
					publicEmail: profile.publicEmail ?? "",
					recoveryEmail: profile.recoveryEmail ?? "",
				});
				setAvatarFileId(profile.avatarFileId);
				setAvatarUrl(profile.avatarUrl);
				setLoadState({
					status: "ready",
					identity: { name: profile.name, email: profile.email },
				});
			} catch (error) {
				if (isMounted) {
					setLoadState({
						status: "error",
						message:
							error instanceof Error
								? error.message
								: "Your profile could not be loaded.",
					});
				}
			}
		}

		void loadProfile();

		return () => {
			isMounted = false;
		};
	}, []);

	function updateValue<Key extends keyof ProfileFormValues>(
		key: Key,
		value: ProfileFormValues[Key],
	) {
		setValues((current) => ({ ...current, [key]: value }));
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await saveProfile();
	}

	async function saveProfile() {
		setSaveState({ status: "saving" });

		try {
			let nextAvatarFileId = avatarFileId;

			if (avatarFile) {
				nextAvatarFileId = await uploadAvatarWithDirectUpload(avatarFile);
			}

			const response = await fetch("/api/dashboard/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: emptyToNull(values.title),
					bio: emptyToNull(values.bio),
					researchInterests: splitList(values.researchInterestsText),
					orcid: emptyToNull(values.orcid),
					phone: emptyToNull(values.phone),
					publicEmail: emptyToNull(values.publicEmail),
					recoveryEmail: emptyToNull(values.recoveryEmail),
					...(nextAvatarFileId ? { avatarFileId: nextAvatarFileId } : {}),
				}),
			});
			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? "Your profile could not be saved.",
				);
			}

			const profile = payload.data as ProfileApiResponse;

			setAvatarFileId(profile.avatarFileId);
			setAvatarUrl(profile.avatarUrl);
			setAvatarFile(null);
			toast.success("Profile updated", {
				description: "Your changes are now visible on your public profile.",
			});
			setSaveState({
				status: "success",
				message: "Your changes were saved.",
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Your profile could not be saved.";

			toast.error("Profile not saved", { description: message });
			setSaveState({ status: "error", message });
		}
	}

	if (loadState.status === "loading") {
		return (
			<Card className="rounded-lg border-[#d8d8d8] bg-white">
				<CardContent className="p-6">
					<LoadingSkeletonFrame label="Loading your profile" />
				</CardContent>
			</Card>
		);
	}

	if (loadState.status === "error") {
		return (
			<Card className="rounded-lg border-[#d8d8d8] bg-white">
				<CardContent className="p-6">
					<p className="font-semibold">Your profile could not be loaded</p>
					<p className="mt-2 text-sm text-[#6b7280]">{loadState.message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<form className="space-y-5" noValidate onSubmit={handleSubmit}>
			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						Public profile
					</CardTitle>
					<CardDescription>
						This appears when someone browsing research clicks your name.
						{loadState.identity.email
							? ` Signed in as ${loadState.identity.name} (${loadState.identity.email}).`
							: ` Signed in as ${loadState.identity.name}.`}
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 p-4">
					<Field>
						<FieldLabel htmlFor="avatar">Profile picture</FieldLabel>
						<div className="flex items-center gap-4">
							<span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d8d8d8] bg-[#f0f0f0]">
								{avatarPreviewUrl ? (
									<img
										alt="Selected profile"
										className="h-full w-full object-cover"
										src={avatarPreviewUrl}
									/>
								) : avatarUrl ? (
									<img
										alt="Current profile"
										className="h-full w-full object-cover"
										src={avatarUrl}
									/>
								) : (
									<span className="text-xs text-[#6b7280]">No photo</span>
								)}
							</span>
							<Input
								accept=".png,.jpg,.jpeg,image/png,image/jpeg"
								className="max-w-xs"
								id="avatar"
								onChange={(event) =>
									setAvatarFile(event.target.files?.[0] ?? null)
								}
								type="file"
							/>
						</div>
						<FieldDescription>
							PNG or JPG. Visible to anyone who views your public profile.
						</FieldDescription>
					</Field>
					<div className="grid gap-4 md:grid-cols-2">
						<Field>
							<FieldLabel htmlFor="title">Title</FieldLabel>
							<Input
								id="title"
								onChange={(event) => updateValue("title", event.target.value)}
								placeholder="e.g. Professor, Senior Lecturer"
								value={values.title}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="orcid">ORCID (optional)</FieldLabel>
							<Input
								id="orcid"
								onChange={(event) => updateValue("orcid", event.target.value)}
								placeholder="0000-0000-0000-0000"
								value={values.orcid}
							/>
						</Field>
					</div>
					<Field>
						<FieldLabel htmlFor="bio">Biography</FieldLabel>
						<textarea
							className="min-h-32 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="bio"
							onChange={(event) => updateValue("bio", event.target.value)}
							placeholder="Tell visitors about your work and expertise."
							value={values.bio}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="researchInterests">
							Research interests
						</FieldLabel>
						<textarea
							className="min-h-24 rounded border border-[#d8d8d8] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
							id="researchInterests"
							onChange={(event) =>
								updateValue("researchInterestsText", event.target.value)
							}
							placeholder="renewable energy, smart irrigation, crop yield"
							value={values.researchInterestsText}
						/>
						<FieldDescription>
							Separate each interest with a comma or a new line.
						</FieldDescription>
					</Field>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardHeader className="border-[#d8d8d8] border-b px-4 py-4">
					<CardTitle className="text-base tracking-normal">
						Contact details
					</CardTitle>
					<CardDescription>
						These are only shown publicly if you choose to add them.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 p-4 md:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="publicEmail">
							Public contact email (optional)
						</FieldLabel>
						<Input
							id="publicEmail"
							onChange={(event) =>
								updateValue("publicEmail", event.target.value)
							}
							placeholder="you@oauife.edu.ng"
							type="email"
							value={values.publicEmail}
						/>
						<FieldDescription>
							Shown on your public profile for people interested in your work.
						</FieldDescription>
					</Field>
					<Field>
						<FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
						<Input
							id="phone"
							onChange={(event) => updateValue("phone", event.target.value)}
							value={values.phone}
						/>
						<FieldDescription>Not shown publicly.</FieldDescription>
					</Field>
					<Field className="md:col-span-2">
						<FieldLabel htmlFor="recoveryEmail">
							Recovery email (optional)
						</FieldLabel>
						<Input
							id="recoveryEmail"
							onChange={(event) =>
								updateValue("recoveryEmail", event.target.value)
							}
							type="email"
							value={values.recoveryEmail}
						/>
						<FieldDescription>
							Used only for account recovery. Not shown publicly.
						</FieldDescription>
					</Field>
				</CardContent>
			</Card>

			<Card className="gap-0 rounded-lg border-[#d8d8d8] bg-white py-0 shadow-none">
				<CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="text-sm text-[#6b7280]" data-testid="profile-status">
						{saveState.status === "idle" && "Save your profile"}
						{(saveState.status === "success" || saveState.status === "error") &&
							saveState.message}
						{saveState.status === "saving" && "Saving your profile…"}
					</div>
					<Button
						className="h-11 rounded bg-[#146ef5] px-4 text-white hover:bg-[#0d5fdc]"
						disabled={saveState.status === "saving"}
						onClick={() => void saveProfile()}
						type="button"
					>
						<UploadCloud className="h-4 w-4" />
						{saveState.status === "saving" ? "Saving…" : "Save profile"}
					</Button>
				</CardContent>
			</Card>
		</form>
	);
}

function splitList(value: string): string[] {
	return value
		.split(/[\n,]/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function emptyToNull(value: string): string | null {
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}
