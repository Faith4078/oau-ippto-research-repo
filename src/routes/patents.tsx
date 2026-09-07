import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/patents")({
	component: PatentsLayout,
});

function PatentsLayout() {
	return <Outlet />;
}
