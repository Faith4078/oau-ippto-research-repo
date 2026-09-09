"use client";

import {
	createFileRoute,
	Link,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	ClipboardPenLine,
	Lightbulb,
} from "lucide-react";

import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";

const signUpOptions = [
	{
		label: "I'm a Lecturer",
		description:
			"Request access to add research, attach documents, and track review progress.",
		href: "/sign-up/lecturer",
		icon: ClipboardPenLine,
	},
	{
		label: "I'm an IPTTO officer",
		description:
			"Request access to review research, manage innovations, and support IP workflows.",
		href: "/sign-up/iptto",
		icon: Lightbulb,
	},
] as const;

export const Route = createFileRoute("/sign-up")({
	head: () => ({
		meta: [
			{
				title: "Sign Up | OAU IPTTO Research Repository",
			},
			{
				name: "description",
				content:
					"Choose the right account request for the Obafemi Awolowo University IPTTO Research Repository.",
			},
		],
	}),
	component: SignUpPage,
});

function SignUpPage() {
	const location = useLocation();
	const pathname = location.pathname.replace(/\/+$/, "");

	if (pathname !== "/sign-up") {
		return <Outlet />;
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
				<div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
					<div className="max-w-xl">
						<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8d8d8] bg-[#eef4ff] px-3 py-1 text-sm font-medium text-[#146ef5]">
							Account request
						</div>
						<h1 className="text-4xl font-semibold leading-[1.04] tracking-normal sm:text-5xl">
							Choose your staff account type.
						</h1>
						<p className="mt-5 text-base leading-7 text-[#6b7280]">
							Select the option that matches your role. We will send you to the
							correct account request form.
						</p>
						<p className="mt-5 text-sm text-[#6b7280]">
							Already approved?{" "}
							<Link
								className="font-semibold text-[#146ef5] hover:underline"
								to="/sign-in"
							>
								Staff sign in
							</Link>
						</p>
					</div>
					<div className="grid gap-4">
						{signUpOptions.map((option) => {
							const Icon = option.icon;

							return (
								<Card
									className="rounded-lg border-[#d8d8d8] bg-[#f0f0f0] shadow-none transition hover:border-[#146ef5] hover:bg-[#eef4ff]"
									key={option.href}
								>
									<CardHeader className="gap-3">
										<div className="flex h-12 w-12 items-center justify-center rounded bg-[#146ef5] text-white">
											<Icon className="h-6 w-6" />
										</div>
										<CardTitle className="text-2xl tracking-normal">
											{option.label}
										</CardTitle>
										<CardDescription className="text-base leading-7 text-[#6b7280]">
											{option.description}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Button
											asChild
											className="h-12 rounded bg-[#146ef5] text-base text-white hover:bg-[#0d5fdc]"
										>
											<Link to={option.href}>
												Continue
												<ArrowRight className="h-5 w-5" />
											</Link>
										</Button>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			</section>
		</main>
	);
}
