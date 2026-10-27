import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PozyApp } from "@/modules/pozy/components/PozyApp";
import { getPoseLink } from "@/modules/pozy/lib/picks";
import poses from "@/tools/pose-pack/poses.json";

export const metadata: Metadata = {
  title: "Výběr póz",
  robots: { index: false, follow: false },
};

export default async function PozyPickPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getPoseLink(slug);
  if (!link) notFound();
  const list = poses
    .filter((p) => link.poseIds.includes(p.id))
    .map(({ id, tags, shot, label }) => ({ id, tags, shot, label }));
  return <PozyApp poses={list} initial={{}} pick={{ slug, ids: link.picks?.ids ?? [], note: link.picks?.note }} />;
}
