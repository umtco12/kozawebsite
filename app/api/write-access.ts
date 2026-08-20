export function canWriteFromRequest(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost || request.headers.get("host") || new URL(request.url).host)
    .split(",")[0]
    .trim()
    .replace(/^\[|\](:\d+)?$/g, "")
    .split(":")[0]
    .toLowerCase();

  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function rejectExternalWrite(request: Request) {
  if (canWriteFromRequest(request)) return null;
  return Response.json(
    { error: "Yönetim girişi tamamlanana kadar dış içerik yazma işlemleri kapalıdır." },
    { status: 403 },
  );
}
