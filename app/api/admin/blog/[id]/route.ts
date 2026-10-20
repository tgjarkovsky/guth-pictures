import { NextRequest, NextResponse } from "next/server";
import { BLOG_INDEX, revalidateLocalized } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/admin-route";
import { getBlogPostById, deleteBlogPost } from "@/modules/blog/lib/blog";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  // Single read for slug (needed for revalidation)
  const post = await getBlogPostById(id);
  const deleted = await deleteBlogPost(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (post) {
    revalidateLocalized([...BLOG_INDEX, `/blog/${post.slug}`]);
  }
  return NextResponse.json({ ok: true });
}
