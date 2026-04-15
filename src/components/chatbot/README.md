# Chatbot AI Module

Modul chatbot AI untuk aplikasi Pengkajian SLF dengan fitur lengkap seperti ChatGPT, Canva AI, Slide AI, Image Generation, dan Excel Generation.

## Struktur Modul

```
src/components/chatbot/
├── ChatContainer.js          # Container utama chat interface
├── CanvaAIStudio.js          # AI-powered design studio
├── FloatingChatButton.js     # Floating action button untuk quick access
└── index.js                  # Export semua komponen
```

## Fitur

### 1. AI Chat (ChatGPT-style)
- Interface percakapan seperti ChatGPT
- Multi-session chat dengan history
- Data context dari project SLF
- Suggested actions berdasarkan konteks

### 2. Canva AI Studio
- AI-powered design generation
- Template untuk dokumen SLF
- Export ke berbagai format (PNG, JPG, PDF, PPTX)
- Style presets (Professional, Modern, Minimal, Technical)

### 3. Slide AI
- Generate presentasi otomatis
- Template slide untuk laporan SLF
- Export ke PowerPoint (.pptx)

### 4. Image Generation
- Generate gambar ilustrasi teknis
- AI-powered visualisasi

### 5. Excel Generation
- Generate spreadsheet untuk perhitungan
- Export ke Excel (.xlsx)
- Formula dan styling otomatis

## Penggunaan

### Akses Chatbot

1. **Via Sidebar**: Klik menu "AI Chatbot" atau "AI Design Studio"
2. **Via Floating Button**: Klik tombol chat di pojok kanan bawah (setelah login)
3. **Via URL**: Akses langsung ke `/#/chatbot` atau `/#/canva-studio`

### Integrasi dengan Project

Chatbot dapat diakses dengan konteks project:

```javascript
// Navigasi ke chatbot dengan project context
window.navigate('chatbot', { 
  id: 'project-uuid',
  moduleContext: 'fire-protection' 
});
```

### Quick Actions

Dalam chat interface, tersedia quick action buttons:
- **Gambar**: Generate gambar ilustrasi
- **Slide**: Buat presentasi
- **Excel**: Generate spreadsheet
- **Analisis**: Analisis data project

## Arsitektur Clean

Modul ini mengikuti prinsip Clean Architecture:

### Domain Layer
- `ChatMessage` - Entity pesan chat
- `ChatSession` - Entity session chat
- `IChatRepository` - Interface repository
- `IChatbotService` - Interface service

### Application Layer
- `SendMessage` - Use case mengirim pesan
- `CreateChatSession` - Use case membuat session
- `GenerateContent` - Use case generate content
- `GetChatHistory` - Use case mengambil history
- `ListChatSessions` - Use case list sessions

### Infrastructure Layer
- `SupabaseChatRepository` - Implementasi repository dengan Supabase
- `ChatbotService` - Implementasi service dengan AI providers
- `ApplicationDataProvider` - Provider data aplikasi untuk context

### Presentation Layer
- `ChatContainer` - UI container chat
- `CanvaAIStudio` - UI design studio
- `FloatingChatButton` - UI floating button

## Database Schema

Tabel yang dibuat di Supabase:

### chat_sessions
```sql
- id (text, primary key)
- title (text)
- messages (jsonb)
- context (jsonb)
- project_id (uuid, nullable)
- module_context (text, nullable)
- settings (jsonb)
- user_id (uuid)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### generated_contents
```sql
- id (uuid, primary key)
- session_id (text)
- type (text) - 'image'|'slide'|'excel'|'document'
- title (text)
- content (jsonb)
- file_url (text)
- file_name (text)
- metadata (jsonb)
- user_id (uuid)
- created_at (timestamptz)
```

## Setup Database

Jalankan SQL di `supabase_chat_tables.sql` untuk membuat tabel dan RLS policies.

## Event System

Chatbot menggunakan custom events untuk komunikasi:

```javascript
// Send message
document.dispatchEvent(new CustomEvent('chat-send-message', {
  detail: { sessionId, content, projectId, moduleContext }
}));

// Create session
document.dispatchEvent(new CustomEvent('chat-create-session', {
  detail: { projectId, moduleContext }
}));

// Generate content
document.dispatchEvent(new CustomEvent('chat-generate-content', {
  detail: { sessionId, type, prompt }
}));

// Generate design (Canva)
document.dispatchEvent(new CustomEvent('canva-generate', {
  detail: { prompt, style, format }
}));

// Floating chat message
document.dispatchEvent(new CustomEvent('floating-chat-message', {
  detail: { content, projectId, moduleContext }
}));
```

## Konfigurasi

Environment variables yang dibutuhkan:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_AI_PROXY_URL=your_edge_function_url  # Optional, untuk production
```

## Dependencies

Tidak ada dependencies tambahan. Menggunakan:
- Supabase client (sudah ada)
- AI Router (sudah ada)
- xlsx (sudah ada di package.json)

## Testing

Untuk testing manual:
1. Login ke aplikasi
2. Klik menu "AI Chatbot" di sidebar
3. Kirim pesan test
4. Coba quick actions (Gambar, Slide, Excel)
5. Test floating button di pojok kanan bawah

## Troubleshooting

### Chatbot tidak muncul
- Pastikan sudah login
- Cek console untuk error
- Pastikan tabel database sudah dibuat

### AI tidak merespon
- Cek koneksi internet
- Pastikan AI proxy URL sudah dikonfigurasi
- Cek rate limit API

### Floating button tidak muncul
- Muncul hanya setelah login
- Delay 3 detik setelah load
- Cek apakah styles sudah ter-inject

## Roadmap

- [ ] Voice input untuk chat
- [ ] File upload dalam chat
- [ ] Collaborative chat (multiple users)
- [ ] AI model selection UI
- [ ] Chat templates/snippets
- [ ] Export chat history
- [ ] Mobile-optimized mini chat
