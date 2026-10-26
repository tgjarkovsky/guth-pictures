import type { Metadata } from "next";
import { PozyApp } from "@/modules/pozy/components/PozyApp";
import poses from "@/tools/pose-pack/poses.json";

// Hidden page: link is sent to clients pre-filtered, e.g. /cs/pozy?stitek=business&zaber=full
export const metadata: Metadata = {
  title: "Pózy na focení",
  robots: { index: false, follow: false },
};

const param = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);

export default async function PozyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const list = poses.map(({ id, tags, shot, label }) => ({ id, tags, shot, label }));
  return <PozyApp poses={list} initial={{ tag: param(sp.stitek), shot: param(sp.zaber) }} />;
}
