import { createFileRoute } from "@tanstack/react-router";
import {
	LivePublicRecordPage,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/faculties/$facultyId")({
	head: () => publicHead(pageSeo.facultyDetail),
	component: FacultyDetailPage,
});

function FacultyDetailPage() {
	const { facultyId } = Route.useParams();

	return <LivePublicRecordPage id={facultyId} type="faculty" />;
}
