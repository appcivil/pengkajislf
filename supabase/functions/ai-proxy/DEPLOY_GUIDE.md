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
#    supabase link --project-ref hrzplcqeadhvbrfhlfuh
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
#    Format: https://hrzplcqeadhvbrfhlfuh.supabase.co/functions/v1/ai-proxy
#    Masukkan ke .env sebagai:
#    VITE_AI_PROXY_URL=https://hrzplcqeadhvbrfhlfuh.supabase.co/functions/v1/ai-proxy
#
# 7. HAPUS semua VITE_*_API_KEY dari .env (kecuali SUPABASE keys)
#
# =================================================================
