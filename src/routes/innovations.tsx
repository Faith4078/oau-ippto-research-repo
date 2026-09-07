import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/innovations")({
	component: InnovationsLayout,
});

function InnovationsLayout() {
	return <Outlet />;
}
