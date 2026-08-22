import { notFound } from "next/navigation";
import { redirectIfMapped } from "../legacy-redirect";

export const dynamic = "force-dynamic";

/* Hiçbir rotaya uymayan adresler: yönetim panelindeki eşleme tablosunda varsa kalıcı
   yönlendirme yapılır, yoksa özel 404 ekranı gösterilir. */
export default async function LegacyPath({ params }: { params: Promise<{ eskiAdres?: string[] }> }) {
  const { eskiAdres } = await params;
  redirectIfMapped(`/${(eskiAdres ?? []).join("/")}`);
  notFound();
}
