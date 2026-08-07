import { ProjectsAdminPage } from "@/components/dashboard/projects/ProjectsAdminPage";

type ProjectsAdminRouteProps = {
  params: Promise<{ lang: string }>;
};

export default async function ProjectsAdminRoute({ params }: ProjectsAdminRouteProps) {
  await params;

  return <ProjectsAdminPage />;
}
