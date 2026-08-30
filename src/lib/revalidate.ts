import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Rebuild the public pages an article can appear on. Called after any change
 * that affects what readers see (publish, edit-while-published, unpublish,
 * delete). See big-01 "on-demand revalidation".
 */
export function revalidateArticle(opts: { slug: string; sectionSlug: string; authorId: string }) {
  revalidatePath("/"); // home: hero + trending + rails
  revalidatePath(`/${opts.sectionSlug}`); // section index
  revalidatePath(`/article/${opts.slug}`); // the article itself
  revalidatePath(`/author/${opts.authorId}`); // author page
}
