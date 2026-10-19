# Kya fix hua (SarkariYogta review)
1. Duplicate: ek entry 2-3 columns me dikhti thi -> src/lib/jobKind.ts (ek hi rule). Import me same title ka dusra slug ab merge hota hai.
2. SECURITY: /api/admin/import aur /extract bina login open the -> ab login+role (admin/editor) zaroori.
3. Import ab sirf bheje hue fields update karta hai (pehle date-extend par age 18-30 / fee 0 overwrite ho jati thi).
4. Extractor ne fake data (130 posts, Rs1500 fee, 18-27 age, 2026-11-04/25 dates) bana diya tha -> ab null + warning.
5. Publish se pehle required-field check. Job page par fake age fallback hata diya.
6. .env.local zip se hata diya, "page - Copy" files delete, galat schema.sql ko .WRONG-FILE.txt kiya.
7. supabase/dedupe.sql: DB me mojood duplicates dhoondhne/hatane ke liye.
