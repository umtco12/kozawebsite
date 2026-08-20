import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contentItems } from "../../../db/schema";
import {
  defaultContent,
  isValidContentUpdate,
  mergeContentRows,
} from "./content-model.mjs";

type ContentKey = "leads" | "writers";

export async function GET() {
  try {
    const rows = await getDb().select().from(contentItems);
    return Response.json(mergeContentRows(rows));
  } catch {
    return Response.json(defaultContent);
  }
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as {
    key?: ContentKey;
    value?: unknown;
  };

  if (!isValidContentUpdate(payload)) {
    return Response.json({ error: "Geçersiz içerik" }, { status: 400 });
  }

  try {
    const db = getDb();
    const existing = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.key, payload.key!))
      .limit(1);
    const value = JSON.stringify(payload.value);

    if (existing.length) {
      await db
        .update(contentItems)
        .set({ value, updatedAt: new Date() })
        .where(eq(contentItems.key, payload.key!));
    } else {
      await db.insert(contentItems).values({ key: payload.key!, value });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Veritabanı henüz hazır değil." },
      { status: 503 },
    );
  }
}
