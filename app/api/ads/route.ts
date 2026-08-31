import { AdvertisementConflictError, AdvertisementNotFoundError, getActiveAdvertisement, listAdvertisements, saveAdvertisement } from "../../../db";
import { adPlacements, validateAdvertisement } from "../../../db/ad-model.mjs";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  return Response.json({ advertisements: deliveryState(listAdvertisements(500)), placements: adPlacements });
}

function deliveryState<T extends { id: number; placement: string; state: string }>(advertisements: T[]) {
  const servingIds = new Set(adPlacements.map((placement) => getActiveAdvertisement(placement.key)?.id).filter(Boolean));
  return advertisements.map((advertisement) => ({ ...advertisement, eligible: advertisement.state === "live", serving: servingIds.has(advertisement.id) }));
}

function validRecordId(value: unknown) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function write(request: Request, method: "POST" | "PATCH") {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  try {
    const payload = await request.json() as Record<string, unknown>;
    if (method === "POST" && payload.id != null) return Response.json({ error: "Yeni reklam oluştururken kayıt kimliği gönderilemez." }, { status: 400 });
    const id = method === "PATCH" ? validRecordId(payload.id) : null;
    if (method === "PATCH" && id === null) return Response.json({ error: "Güncellenecek reklam kaydı seçilmedi.", fields: { id: "Geçerli bir reklam kaydı seçin." } }, { status: 400 });
    const expectedUpdatedAt = method === "PATCH" ? validRecordId(payload.updatedAt) : undefined;
    if (method === "PATCH" && expectedUpdatedAt === null) return Response.json({ error: "Reklamın güncel sürüm bilgisi eksik.", code: "VERSION_REQUIRED" }, { status: 400 });
    const result = validateAdvertisement(payload);
    if (!result.valid) return Response.json({ error: "Reklam alanlarını kontrol edin.", fields: result.errors }, { status: 400 });
    const saved = saveAdvertisement({ ...result.value, id: id ?? undefined }, auth.user!, expectedUpdatedAt ?? undefined);
    return Response.json({ ok: true, advertisement: deliveryState([saved])[0] }, { status: method === "POST" ? 201 : 200 });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
    if (error instanceof AdvertisementNotFoundError) return Response.json({ error: error.message, code: "NOT_FOUND" }, { status: 404 });
    if (error instanceof AdvertisementConflictError) return Response.json({ error: error.message, code: "EDIT_CONFLICT" }, { status: 409 });
    console.error("Reklam kaydı hatası", error);
    return Response.json({ error: "Reklam şu anda kaydedilemedi. Lütfen yeniden deneyin." }, { status: 500 });
  }
}

export async function POST(request: Request) { return write(request, "POST"); }
export async function PATCH(request: Request) { return write(request, "PATCH"); }
