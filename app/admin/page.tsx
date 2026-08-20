import Link from "next/link";
import { AdminPanel } from "./panel";
export const dynamic="force-dynamic";
export default function Admin(){return <main className="admin-shell"><aside className="admin-side"><Link className="admin-logo" href="/"><img src="/koza-logo.png" alt="Koza TV" /></Link><nav><a className="active">▦ Genel Bakış</a><a>▤ Haberler</a><a>▣ Manşet Slider</a><a>✎ Köşe Yazıları</a><a>▶ Videolar</a><a>▦ Yayın Akışı</a><a>⌁ Reklamlar</a><a>⚙ Ayarlar</a></nav><Link href="/">← Siteye dön</Link></aside><section className="admin-main"><header><div><span>YÖNETİM PANELİ</span><h1>İçerik Merkezi</h1></div><div className="admin-user">KD <span>Kemal Deniz<br/><small>Yayın Yönetmeni</small></span></div></header><AdminPanel/></section></main>}
