import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth-helpers";
import { ArticleForm } from "@/components/editor/article-form";

export const metadata = { title: "New article" };

export default async function NewArticlePage() {
  await requireStaff();
  const sections = await prisma.section.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">New article</h1>
      <ArticleForm sections={sections} />
    </div>
  );
}
