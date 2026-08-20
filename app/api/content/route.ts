import { getContentRows, upsertContentItem } from "../../../db";
import {
  defaultContent,
  isValidContentUpdate,
  mergeContentRows,
} from "./content-model.mjs";

type ContentKey = "leads" | "writers";

export async function GET() {
  try {
    const rows = getContentRows();
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
    upsertContentItem(payload.key!, payload.value);

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Veritabanı henüz hazır değil." },
      { status: 503 },
    );
  }
}
