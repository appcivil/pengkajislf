# =================================================================
#  PANDUAN DEPLOYMENT SUPABASE EDGE FUNCTION: AI PROXY
# =================================================================
# 
# TUJUAN:
#   Menjaga semua AI API key (OpenAI, Claude, Gemini, dll) 
#   tetap aman di sisi server, TIDAK terekspos di bundle browser.
#
# LANGKAH DEPLOYMENT:
#
# 1. Install Supabase CLI (jika belum):
#    npm install -g supabase
#    atau: https://supabase.com/docs/guides/cli
#
# 2. Login ke Supabase:
#    supabase login
#
# 3. Link ke project Anda:
#    supabase link --project-ref <project-ref-anda>
#
# 4. Set SEMUA API key sebagai secret di Supabase (BUKAN di .env!):
#    supabase secrets set GEMINI_API_KEY=AIzaSy...
#    supabase secrets set OPENAI_API_KEY=sk-proj-...
#    supabase secrets set CLAUDE_API_KEY=sk-ant-...
#    supabase secrets set GROQ_API_KEY=gsk_...
#    supabase secrets set OPENROUTER_API_KEY=sk-or-...
#    supabase secrets set MISTRAL_API_KEY=a1w5...
#    supabase secrets set HF_API_TOKEN=hf_...
#    supabase secrets set HF_SLF_OPUS_URL=https://api-inference.huggingface.co/...
#
# 5. Deploy Edge Function:
#    supabase functions deploy ai-proxy
#
# 6. Dapatkan URL Edge Function:
#    Format: https://<project-ref-anda>.supabase.co/functions/v1/ai-proxy
#    Masukkan ke .env sebagai:
#    VITE_AI_PROXY_URL=https://<project-ref-anda>.supabase.co/functions/v1/ai-proxy
#
# 7. HAPUS semua VITE_*_API_KEY dari .env (kecuali SUPABASE keys)
#    Ini BUKAN saran — `npm run build` akan MENOLAK berjalan bila kunci AI
#    masih terpasang di environment build (scripts/check-client-secrets.mjs).
#
# 8. VERIFIKASI bahwa fungsi menolak pemanggil yang tidak berhak:
#
#    a) Tanpa header Authorization → harus 401
#       curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/ai-proxy" \
#         -H "Content-Type: application/json" -d '{"provider":"gemini","prompt":"hai"}'
#
#    b) Dengan anon key (nilai yang ada di bundel publik) → harus 401,
#       BUKAN 200. Anon key adalah JWT yang sah, jadi pemeriksaan "apakah
#       header Authorization ada" saja tidak cukup — fungsi ini juga
#       memverifikasi token ke GoTrue dan menolak role 'anon'.
#       curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/ai-proxy" \
#         -H "Authorization: Bearer <ANON_KEY>" \
#         -H "Content-Type: application/json" -d '{"provider":"gemini","prompt":"hai"}'
#
#    c) Dengan access_token hasil login → harus 200
#
#    Langkah (b) yang paling penting: bila ia mengembalikan 200, kunci AI Anda
#    dapat dipakai siapa pun di internet atas biaya Anda.
#
# 9. ROTASI kunci yang pernah dikirim ke environment build klien.
#    Sebelumnya .github/workflows/deploy.yml meneruskan 7 kunci penyedia ke
#    langkah `npm run build`, sehingga kunci itu terbit sebagai teks biasa di
#    bundel publik pada setiap deploy. Kunci yang sudah terbit
#    HARUS dianggap bocor — hapus blok itu (sudah dilakukan) dan rotasi
#    ketujuh kunci di dashboard masing-masing penyedia.
#
# =================================================================
