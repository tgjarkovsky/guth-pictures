import { NextRequest, NextResponse } from "next/server";
import { readJson, requireAdmin } from "@/lib/admin-route";
import { getDrafts, saveDrafts, getQueue, saveQueue } from "@/modules/stories/lib/store";
import type { StoryDraft } from "@/modules/stories/lib/types";
import { validateApproveBody, type ApproveBody } from "./validation";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson<Record<string, unknown>>(req);
  if (body instanceof NextResponse) return body;
  const error = validateApproveBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { draftId, videoPublicId, publishAt } = body as ApproveBody;

  const drafts = await getDrafts();
  const saved = drafts.find(d => d.id === draftId);
  if (!saved) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  // video se renderuje z editoru, takže si pamatujeme i neuložené úpravy (stejné id)
  const edited = body.draft as StoryDraft | undefined;
  const draft = edited && typeof edited === "object" && edited.id === draftId && Array.isArray(edited.photos) ? edited : saved;

  await saveQueue([
    ...(await getQueue()),
    { id: `q-${Date.now()}`, template: draft.template, videoPublicId, publishAt, status: "queued", draft },
  ]);
  await saveDrafts(drafts.filter(d => d.id !== draftId));
  return NextResponse.json({ ok: true });
}
