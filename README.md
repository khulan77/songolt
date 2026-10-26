# «Нээгдэх ном» — #songoltnom

Доктор Эдит Эва Эгэрийн «Сонголт» номын санаагаар уншигч өөрийн «дотоод шорон»-гоо олох интерактив туршлага. Бүрий их сургуулийн #songoltnom уралдаанд зориулав.

Cover → Intro → 5 бүлэг → Үр дүн → Сонголт (pledge) → Хуваалцах карт (1080×1920 PNG).

## Стек

- Next.js 16 (App Router, `cacheComponents`), TypeScript strict, Tailwind CSS v4
- `framer-motion` — хуудас эргэлт, цэцэг дэлбэрэлт
- `html-to-image` — хуваалцах карт
- `next/font/google` — PT Serif / PT Sans (`cyrillic-ext` нь Ө ө Ү ү-г агуулна)
- Page-flip сан ашиглаагүй: эргэлт нь CSS 3D + Framer Motion (`components/Page.tsx`, `components/Spread.tsx`)
- Supabase тоолуурт сан хэрэггүй — PostgREST `rpc` endpoint-ийг `fetch`-ээр шууд дууддаг (`lib/counter.ts`)

## Суулгах, ажиллуулах

```sh
bun install
bun run dev        # http://localhost:3000
bun test           # оноо тооцох логикийн unit test
bun run lint
bunx tsc --noEmit
bun run build && bun run start
```

## Asset-ууд (`public/`)

| Файл | Зориулалт | Байхгүй бол |
| --- | --- | --- |
| `public/cover.png` | Номын жинхэнэ хавтас (544×794). Хаалттай ном ба хуваалцах картанд. | Хавтас нь бичвэргүй, хар хөх өнгөтэй, өргөст мөчиртэй хувилбараар харагдана; карт дээрх жижиг хавтас нуугдана. |
| `public/audio/piano.mp3` | 16с төгөлдөр хуурын давталт | Дууны товч нуугдана. |

Asset байгаа эсэхийг build үед шалгадаг тул файл нэмсний дараа дахин build/deploy хийнэ.

`assets/PTSerif-*.ttf` — зөвхөн `app/opengraph-image.tsx`-д (Satori-д кирилл фонт хэрэгтэй). SIL Open Font License.

## Орчны хувьсагчид

Бүгд сонголттой. `.env.local` эсвэл Vercel → Project → Settings → Environment Variables.

| Хувьсагч | Тайлбар |
| --- | --- |
| `NEXT_PUBLIC_REEL_URL` | Байвал Share дэлгэцэд «Киног үзэх» товч гарна (шинэ табд). |
| `NEXT_PUBLIC_SITE_URL` | OG зургийн үнэмлэхүй URL. Vercel дээр автоматаар `VERCEL_PROJECT_PRODUCTION_URL`-ийг ашиглана. |
| `NEXT_PUBLIC_ENABLE_COUNTER` | `true` бол нийт хүний тоолуур идэвхжинэ. |
| `NEXT_PUBLIC_SUPABASE_URL` | Тоолуурт. Жишээ: `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Тоолуурт, Supabase-ийн anon (public) түлхүүр. |

## Vercel-д байршуулах

1. Repo-г GitHub руу push хийнэ.
2. vercel.com → **Add New Project** → repo-г сонгоно. Framework: Next.js (автоматаар танина).
3. Install command: `bun install`, build: `bun run build` (Vercel `bun.lock`-ийг танина).
4. Хэрэгтэй орчны хувьсагчдыг нэмээд **Deploy**.

Эсвэл CLI: `bunx vercel` → `bunx vercel --prod`.

## Нэмэлт: нийт хүний тоолуур (Supabase)

**Хэрэглэгчийн бичсэн текст хэзээ ч илгээгдэхгүй.** «Картаа үүсгэх» дарахад зөвхөн тоо 1-ээр нэмэгдэнэ. Тохируулаагүй эсвэл алдаа гарвал тэр мөр зүгээр л харагдахгүй.

Supabase → SQL Editor дээр:

```sql
create table if not exists public.pledges_count (
  id    int primary key default 1 check (id = 1),
  count bigint not null default 0
);
insert into public.pledges_count (id, count) values (1, 0)
  on conflict (id) do nothing;

alter table public.pledges_count enable row level security;
-- Хүснэгтэд шууд хандах эрх өгөхгүй; зөвхөн доорх функцээр.

create or replace function public.increment_pledges()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.pledges_count set count = count + 1 where id = 1
  returning count;
$$;

revoke all on function public.increment_pledges() from public;
grant execute on function public.increment_pledges() to anon;
```

Дараа нь `NEXT_PUBLIC_ENABLE_COUNTER=true`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`-г тохируулна.

## Бүтэц

```
app/            layout (фонт, metadata, lang="mn"), page, opengraph-image, icon.svg
components/     BookExperience (useReducer төлөвийн машин), Cover, Spread, Page (3D хуудас),
                ChoiceOption, Branch (өргөс → цэцэг), ResultView, PledgeView,
                ShareCard, ShareView, SoundToggle, GoldDust, RibbonProgress
lib/            content.ts (бүх текст нэг газар), scoring.ts (+ test), audio.ts, branch.ts, counter.ts
```

Бүх текст `lib/content.ts` дотор байгаа.

## Хүртээмж

- Tab-аар бүх товч, хариулт руу очно; алтлаг 2px focus-ring.
- `←` `→` хуудас шилжинэ, `1`–`4` хариулт сонгоно. Утсан дээр баруун тийш шудрахад өмнөх хуудас.
- Хуудас солигдоход `aria-live="polite"` бүсэд бүлгийн нэр уншигдана.
- `prefers-reduced-motion: reduce` үед тоосонцор, 3D эргэлт, курсорын оч унтарч энгийн fade болно.

## Ёс зүй

Номоос шууд эшлэлгүй, хуарангийн бодит дүрслэлгүй (зөвхөн гэрэл, сүүдэр, мөчир). Хэрэглэгчийн текст зөвхөн тухайн хөтчийн санах ойд байна — хадгалагдахгүй, илгээгдэхгүй. Үр дүн нь сэтгэлзүйн оношилгоо биш.
