import "server-only";
import { randomBytes } from "crypto";
import { getKv } from "@/lib/kv";

export interface PosePicks {
  ids: string[];
  note?: string;
  updatedAt: string;
}

export interface PoseLink {
  slug: string;
  client: string;
  poseIds: string[];
  createdAt: string;
  picks?: PosePicks;
}

const key = (slug: string) => `posepick:${slug}`;
const INDEX = "posepicks:index";

export async function listPoseLinks(): Promise<PoseLink[]> {
  const kv = await getKv();
  if (!kv) return [];
  const slugs = (await kv.smembers(INDEX)) as string[];
  if (!slugs.length) return [];
  const records = await Promise.all(slugs.map((s) => kv.get<PoseLink>(key(s))));
  return (records.filter(Boolean) as PoseLink[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPoseLink(slug: string): Promise<PoseLink | null> {
  const kv = await getKv();
  if (!kv) return null;
  return kv.get<PoseLink>(key(slug));
}

export async function createPoseLink(client: string, poseIds: string[]): Promise<PoseLink> {
  const kv = await getKv();
  if (!kv) throw new Error("KV unavailable");
  const record: PoseLink = {
    slug: randomBytes(9).toString("base64url"),
    client,
    poseIds,
    createdAt: new Date().toISOString(),
  };
  await kv.set(key(record.slug), record);
  await kv.sadd(INDEX, record.slug);
  return record;
}

export async function deletePoseLink(slug: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await Promise.all([kv.del(key(slug)), kv.srem(INDEX, slug)]);
}

export async function savePicks(slug: string, ids: string[], note?: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const record = await kv.get<PoseLink>(key(slug));
  if (!record) return;
  await kv.set(key(slug), {
    ...record,
    picks: { ids, ...(note ? { note } : {}), updatedAt: new Date().toISOString() },
  } satisfies PoseLink);
}
