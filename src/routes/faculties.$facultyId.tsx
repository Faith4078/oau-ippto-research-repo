import { createFileRoute } from "@tanstack/react-router";
import {
	DetailPlaceholderPage,
	detailPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/faculties/$facultyId")({
	head: () => publicHead(pageSeo.facultyDetail),
	component: FacultyDetailPage,
});

function FacultyDetailPage() {
	const { facultyId } = Route.useParams();

	return (
		<DetailPlaceholderPage config={detailPages.faculty} param={facultyId} />
	);
}
