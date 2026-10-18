import { notFound } from "next/navigation";
import { PostDetailPage } from "@/components/dashboard/content/PostDetailPage";
import { getPost } from "@/lib/content/posts";

export const dynamic = "force-dynamic";

export default async function DashboardContentPostPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  return <PostDetailPage key={post.id} lang={lang} initialPost={post} />;
}
