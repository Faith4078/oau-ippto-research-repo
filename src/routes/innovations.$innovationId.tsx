import { createFileRoute } from "@tanstack/react-router";
import {
	DetailPlaceholderPage,
	detailPages,
	pageSeo,
	publicHead,
} from "@/components/public-pages/public-pages";

export const Route = createFileRoute("/innovations/$innovationId")({
	head: () => publicHead(pageSeo.innovationDetail),
	component: InnovationDetailPage,
});

function InnovationDetailPage() {
	const { innovationId } = Route.useParams();

	return (
		<DetailPlaceholderPage
			config={detailPages.innovation}
			param={innovationId}
		/>
	);
}
