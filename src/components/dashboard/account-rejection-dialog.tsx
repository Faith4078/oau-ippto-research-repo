"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "#/components/ui/button.tsx";

type AccountRejectionDialogProps = {
	accountName: string;
	busy?: boolean;
	onCancel: () => void;
	onConfirm: (reason: string) => void;
};

export function AccountRejectionDialog({
	accountName,
	busy = false,
	onCancel,
	onConfirm,
}: AccountRejectionDialogProps) {
	const [reason, setReason] = useState("");
	const titleId = useId();
	const descriptionId = useId();
	const reasonRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const previouslyFocused = document.activeElement;
		reasonRef.current?.focus();

		return () => {
			if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
		};
	}, []);

	useEffect(() => {
		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape" && !busy) onCancel();
		}

		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [busy, onCancel]);

	const trimmedReason = reason.trim();

	return (
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
			role="presentation"
		>
			<div
				aria-describedby={descriptionId}
				aria-labelledby={titleId}
				aria-modal="true"
				className="w-full max-w-md rounded-lg border border-[#d8d8d8] bg-white p-6 shadow-xl"
				role="dialog"
			>
				<h2 className="text-xl font-semibold" id={titleId}>
					Decline account request
				</h2>
				<p className="mt-2 text-sm text-[#6b7280]" id={descriptionId}>
					Decline the signup request from {accountName}. The applicant will not
					be able to sign in.
				</p>

				<label
					className="mt-5 grid gap-2 text-sm font-semibold"
					htmlFor="rejection-reason"
				>
					Reason for declining
					<textarea
						className="min-h-28 rounded border border-[#d8d8d8] px-3 py-2 font-normal outline-none focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
						disabled={busy}
						id="rejection-reason"
						onChange={(event) => setReason(event.target.value)}
						ref={reasonRef}
						value={reason}
					/>
				</label>

				<div className="mt-6 flex justify-end gap-3">
					<Button
						disabled={busy}
						onClick={onCancel}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						disabled={busy || !trimmedReason}
						onClick={() => onConfirm(trimmedReason)}
						type="button"
						variant="destructive"
					>
						{busy ? "Declining…" : "Confirm decline"}
					</Button>
				</div>
			</div>
		</div>
	);
}
