"use client";

import { LayoutDashboard, LockKeyhole, LogOut, Users } from "lucide-react";

import { signOutAndRedirectHome } from "#/lib/sign-out.ts";

const secondaryActionClass =
	"inline-flex h-11 items-center justify-center gap-2 rounded border border-[#d8d8d8] bg-white px-3 text-sm font-semibold text-[#080808] transition hover:border-[#146ef5] hover:text-[#146ef5] active:scale-[0.98]";
const primaryActionClass =
	"inline-flex h-11 items-center justify-center gap-2 rounded bg-[#146ef5] px-3 text-sm font-semibold text-white transition hover:bg-[#0d5fdc] active:scale-[0.98]";

export function PublicNavActions({
	dashboardHref,
	isSignedIn,
}: {
	dashboardHref: string;
	isSignedIn: boolean;
}) {
	if (isSignedIn) {
		return (
			<>
				<a
					aria-label="Open dashboard"
					className={primaryActionClass}
					href={dashboardHref}
				>
					<LayoutDashboard className="h-4 w-4" />
					<span className="hidden sm:inline">Dashboard</span>
				</a>
				<button
					aria-label="Logout"
					className={`${secondaryActionClass} cursor-pointer`}
					onClick={() => void signOutAndRedirectHome()}
					type="button"
				>
					<LogOut className="h-4 w-4" />
					<span className="hidden sm:inline">Logout</span>
				</button>
			</>
		);
	}

	return (
		<>
			<a aria-label="Sign up" className={secondaryActionClass} href="/sign-up">
				<Users className="h-4 w-4" />
				<span className="hidden sm:inline">Sign up</span>
			</a>
			<a aria-label="Sign in" className={primaryActionClass} href="/sign-in">
				<LockKeyhole className="h-4 w-4" />
				<span className="hidden sm:inline">Sign in</span>
			</a>
		</>
	);
}
