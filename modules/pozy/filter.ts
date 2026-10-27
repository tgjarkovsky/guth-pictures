export type Pose = { id: string; tags: string[]; shot: string; label: string };
export type PoseFilter = { tag?: string; shot?: string };

export const filterPoses = (poses: Pose[], { tag, shot }: PoseFilter) =>
  poses.filter((p) => (!tag || p.tags.includes(tag)) && (!shot || p.shot === shot));

export const uniqueValues = (values: string[]) => [...new Set(values)];

export const filterToQuery = ({ tag, shot }: PoseFilter) => {
  const params = new URLSearchParams();
  if (tag) params.set("stitek", tag);
  if (shot) params.set("zaber", shot);
  const q = params.toString();
  return q ? `?${q}` : "";
};

export const keepAllowed = (ids: unknown, allowed: string[]): string[] =>
  Array.isArray(ids) ? [...new Set(ids.filter((id): id is string => typeof id === "string" && allowed.includes(id)))] : [];
