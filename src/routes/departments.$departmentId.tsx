import { createFileRoute } from "@tanstack/react-router";
import {
	LivePublicRecordPage,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/departments/$departmentId")({
	head: () => publicHead(pageSeo.departmentDetail),
	component: DepartmentDetailPage,
});

function DepartmentDetailPage() {
	const { departmentId } = Route.useParams();

	return <LivePublicRecordPage id={departmentId} type="department" />;
}
