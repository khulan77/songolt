// Нэмэлт тоолуур. Зөвхөн тоог нэмэгдүүлнэ — хэрэглэгчийн текст хэзээ ч илгээгдэхгүй.
// supabase-js сан шаардлагагүй: PostgREST-ийн rpc endpoint-ийг шууд дуудна.

const enabled = process.env.NEXT_PUBLIC_ENABLE_COUNTER === "true";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const counterEnabled = Boolean(enabled && url && key);

/** Тоог 1-ээр нэмээд шинэ утгыг буцаана. Алдаа гарвал null (чимээгүй). */
export async function incrementPledges(): Promise<number | null> {
  if (!counterEnabled) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/increment_pledges`, {
      method: "POST",
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!res.ok) return null;
    const n: unknown = await res.json();
    return typeof n === "number" ? n : null;
  } catch {
    return null;
  }
}
