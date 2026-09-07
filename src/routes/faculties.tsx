import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/faculties")({
	component: FacultiesLayout,
});

function FacultiesLayout() {
	return <Outlet />;
}
