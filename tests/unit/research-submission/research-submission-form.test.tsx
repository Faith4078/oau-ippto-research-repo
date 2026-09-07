import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResearchSubmissionForm } from "#/components/dashboard/research-submission-form.tsx";

describe("lecturer research submission form", () => {
	it("shows the submit button and status text", () => {
		render(<ResearchSubmissionForm />);

		expect(
			screen.getByRole("button", { name: "Submit" }),
		).toBeInTheDocument();
		expect(screen.getAllByText("Submit").length).toBeGreaterThanOrEqual(2);
	});
});
