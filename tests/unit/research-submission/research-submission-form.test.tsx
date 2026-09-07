import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResearchSubmissionForm } from "#/components/dashboard/research-submission-form.tsx";

describe("lecturer research submission form", () => {
	it("explains that submission sends research to IPTTO review", () => {
		render(<ResearchSubmissionForm />);

		expect(
			screen.getByRole("button", { name: "Submit for IPTTO review" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Check your details, then submit your research for IPTTO review."),
		).toBeInTheDocument();
	});
});
