import { getContentRows, upsertContentItem } from "../../../db";
import {
  defaultContent,
  isValidContentUpdate,
  mergeContentRows,
} from "./content-model.mjs";
import { authorizeAdmin } from "../write-access";

type ContentKey = "leads" | "writers";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]);
  if (auth.response) return auth.response;
  try {
    const rows = getContentRows();
    return Response.json(mergeContentRows(rows));
  } catch {
    return Response.json(defaultContent);
  }
}

export async function PATCH(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
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
