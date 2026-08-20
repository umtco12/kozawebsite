import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contentItems } from "../../../db/schema";

const defaults={
  leads:[
    {category:"Gündem",title:"Türkiye'nin gündemi Koza TV'de: Günün öne çıkan gelişmeleri",summary:"Ankara'dan dünyaya, günün tüm gelişmeleri doğrulanmış bilgi ve güçlü analizlerle Koza TV'de.",image:"/news/gundem.jpg"},
    {category:"Siyaset",title:"Siyasetin nabzı: Kritik görüşmenin tüm ayrıntıları",summary:"Karar merkezlerindeki son gelişmeler, kulisler ve uzman değerlendirmeleri anbean aktarılıyor.",image:"/news/politika.jpg"},
    {category:"Dünya",title:"Dünyadan sıcak gelişme: Liderler olağanüstü toplandı",summary:"Diplomasi trafiğinin perde arkası ve bölgesel etkileri Koza TV muhabirlerinin anlatımıyla.",image:"/news/dunya.jpg"}
  ],
  writers:[
    {name:"Mehmet Ali Güller",title:"Yeni dünyanın güç dengeleri"},{name:"Esmehan Güneri",title:"Ekonomide haftanın kritik başlıkları"},{name:"Kemal Deniz",title:"Siyasette yeni dönemin işaretleri"},{name:"Enes Arınç",title:"Sahanın içinden: Futbolun değişen yüzü"}
  ]
};

export async function GET(){
  try{const rows=await getDb().select().from(contentItems);const content={...defaults};for(const row of rows){if(row.key==="leads"||row.key==="writers") content[row.key]=JSON.parse(row.value)}return Response.json(content)}catch{return Response.json(defaults)}
}
export async function PATCH(request:Request){
  const payload=await request.json() as {key?:"leads"|"writers";value?:unknown};
  if(!payload.key||!Array.isArray(payload.value)||!(["leads","writers"] as string[]).includes(payload.key))return Response.json({error:"Geçersiz içerik"},{status:400});
  try{const db=getDb();const existing=await db.select().from(contentItems).where(eq(contentItems.key,payload.key)).limit(1);if(existing.length){await db.update(contentItems).set({value:JSON.stringify(payload.value),updatedAt:new Date()}).where(eq(contentItems.key,payload.key))}else{await db.insert(contentItems).values({key:payload.key,value:JSON.stringify(payload.value)})}return Response.json({ok:true})}catch{return Response.json({error:"Veritabanı henüz hazır değil."},{status:503})}
}
