import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountRejectionDialog } from "#/components/dashboard/account-rejection-dialog.tsx";

describe("account rejection dialog", () => {
	it("collects a reason and exposes explicit confirm and cancel actions", () => {
		const onCancel = vi.fn();
		const onConfirm = vi.fn();

		render(
			<AccountRejectionDialog
				accountName="Pending Lecturer"
				onCancel={onCancel}
				onConfirm={onConfirm}
			/>,
		);

		expect(
			screen.getByRole("dialog", { name: "Decline account request" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Reason for declining")).toHaveFocus();
		expect(
			screen.getByRole("button", { name: "Confirm decline" }),
		).toBeDisabled();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalledOnce();

		fireEvent.change(screen.getByLabelText("Reason for declining"), {
			target: { value: "Staff ID could not be verified." },
		});
		fireEvent.click(screen.getByRole("button", { name: "Confirm decline" }));

		expect(onConfirm).toHaveBeenCalledWith("Staff ID could not be verified.");
	});
});
