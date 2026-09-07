import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/researchers")({
	component: ResearchersLayout,
});

function ResearchersLayout() {
	return <Outlet />;
}
