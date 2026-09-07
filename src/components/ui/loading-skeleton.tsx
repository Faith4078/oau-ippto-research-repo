import type { ReactNode } from "react";

type LoadingSkeletonProps = {
	label?: string;
	rows?: number;
};

const skeletonRowKeys = ["first", "second", "third", "fourth", "fifth"];

export function LoadingSkeleton({
	label = "Loading content",
	rows = 3,
}: LoadingSkeletonProps) {
	return (
		<output aria-busy="true" aria-live="polite" className="space-y-4">
			<span className="sr-only">{label}</span>
			{skeletonRowKeys.slice(0, rows).map((rowKey) => (
				<div
					className="animate-pulse rounded-lg border border-[#e5e7eb] bg-white p-5"
					key={`${label}-${rowKey}`}
				>
					<div className="h-3 w-24 rounded-full bg-[#e5e7eb]" />
					<div className="mt-4 h-5 w-3/4 rounded-full bg-[#d8d8d8]" />
					<div className="mt-4 h-3 w-full rounded-full bg-[#eef0f3]" />
					<div className="mt-2 h-3 w-5/6 rounded-full bg-[#eef0f3]" />
				</div>
			))}
		</output>
	);
}

export function LoadingSkeletonFrame({
	children,
	label = "Loading content",
}: {
	children?: ReactNode;
	label?: string;
}) {
	return (
		<output aria-busy="true" aria-live="polite" className="animate-pulse">
			<span className="sr-only">{label}</span>
			{children ?? (
				<>
					<div className="h-4 w-28 rounded-full bg-[#d8d8d8]" />
					<div className="mt-6 h-10 w-3/4 rounded-lg bg-[#e5e7eb]" />
					<div className="mt-5 h-4 w-full rounded-full bg-[#eef0f3]" />
					<div className="mt-3 h-4 w-5/6 rounded-full bg-[#eef0f3]" />
				</>
			)}
		</output>
	);
}
