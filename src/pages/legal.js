/**
 * LEGAL PAGE
 * Halaman Kebijakan Privasi & Syarat Ketentuan (Privacy Policy & TOS).
 * Kepatuhan PSE (Penyelenggara Sistem Elektronik) Komdigi/Kominfo & UU ITE.
 */
import { APP_CONFIG } from '../lib/config.js';

export async function legalPage() {
  const root = document.getElementById('page-root') || document.body;
  const year = new Date().getFullYear();

  const html = `
    <div class="legal-page">
      <div class="legal-container">
        <header class="legal-header">
           <button class="btn btn-ghost" onclick="window.history.back()">
             <i class="fas fa-arrow-left"></i> Kembali
           </button>
           <h1 class="legal-title">Kebijakan Privasi & Syarat Ketentuan</h1>
           <p class="legal-subtitle">Terakhir Diperbarui: 31 Maret 2026 &bullet; Versi ${APP_CONFIG.version}</p>
        </header>

        <section class="legal-section">
          <h2>1. Pendahuluan</h2>
          <p>Selamat datang di Smart AI Pengkaji SLF. Aplikasi ini dikembangkan untuk membantu tenaga ahli dalam melakukan pengkajian teknis kelaikan fungsi bangunan gedung sesuai dengan Peraturan Pemerintah Nomor 16 Tahun 2021.</p>
        </section>

        <section class="legal-section">
          <h2>2. Kepatuhan UU ITE</h2>
          <p>Sistem ini beroperasi di bawah payung hukum Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE) beserta perubahannya.</p>
          <ul>
            <li><strong>Tanda Tangan Elektronik (TTE):</strong> Seluruh TTE yang dihasilkan melalui sistem ini mematuhi prinsip keabsahan dalam Pasal 11 UU ITE, di mana data pembuatan TTE terkait erat dengan pendandatangan dan hanya berada dalam kuasa penandatangan.</li>
            <li><strong>Integritas Data:</strong> Sistem menggunakan algoritma SHA-256 untuk memverifikasi bahwa informasi elektronik tidak mengalami perubahan sejak waktu penandatanganan.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>3. Kebijakan Privasi & Data</h2>
          <p>Kami menghormati privasi data teknis Anda dan klien Anda:</p>
          <ul>
            <li><strong>Penyimpanan Data:</strong> Data proyek disimpan secara aman di infrastruktur Cloud (Supabase) dan Google Drive pribadi/perusahaan yang dikonfigurasi oleh pengguna.</li>
            <li><strong>Kerahasiaan:</strong> Kami tidak menyebarluaskan data teknis bangunan (Laporan, Foto, Hasil Audit) kepada pihak ketiga tanpa persetujuan pengguna.</li>
            <li><strong>Audit Log:</strong> Untuk keperluan akuntabilitas, sistem mencatat riwayat aktivitas (Audit Trail) yang hanya dapat diakses oleh Administrator Sistem.</li>
          </ul>
        </section>

        <section class="legal-section">
          <h2>4. Batasan Tanggung Jawab</h2>
          <p>Smart AI Pengkaji SLF adalah alat bantu analisis berbasis Kecerdasan Buatan (AI). Hasil analisis AI tetap memerlukan validasi dan pengesahan akhir oleh Tenaga Ahli bersertifikat (Sertifikat Kompetensi Kerja/SKA) sebelum didaftarkan ke sistem SIMBG.</p>
        </section>

        <footer class="legal-footer">
          <p>&copy; ${year} Smart AI Pengkaji SLF &bullet; Penyelenggara Sistem Elektronik (Sistem Internal)</p>
          <div class="legal-badges">
            <span class="l-badge"><i class="fas fa-check-shield"></i> ITE Compliant</span>
            <span class="l-badge"><i class="fas fa-lock"></i> SSL Secured</span>
            <span class="l-badge"><i class="fas fa-user-check"></i> PSE Verified</span>
          </div>
        </footer>
      </div>
    </div>

    <style>
      .legal-page { min-height: 100vh; background: #fff; color: #1e293b; padding: 40px 20px; font-family: 'Inter', sans-serif; line-height: 1.6; }
      .legal-container { max-width: 800px; margin: 0 auto; }
      .legal-header { border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
      .legal-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 20px 0 10px; }
      .legal-subtitle { font-size: 0.9rem; color: #64748b; }
      
      .legal-section { margin-bottom: 40px; }
      .legal-section h2 { font-size: 1.25rem; font-weight: 700; color: #1e3a8a; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
      .legal-section p { margin-bottom: 15px; color: #334155; }
      .legal-section ul { padding-left: 20px; margin-bottom: 15px; list-style-type: disc; }
      .legal-section li { margin-bottom: 10px; }
      .legal-section strong { font-weight: 700; color: #0f172a; }

      .legal-footer { border-top: 1px solid #f1f5f9; padding-top: 30px; margin-top: 60px; text-align: center; color: #94a3b8; font-size: 0.85rem; }
      .legal-badges { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
      .l-badge { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.75rem; color: #64748b; background: #f8fafc; padding: 6px 12px; border-radius: 50px; border: 1px solid #e2e8f0; }
      
      @media (max-width: 640px) {
        .legal-title { font-size: 1.5rem; }
      }
    </style>
  `;

  root.innerHTML = html;
  return html;
}
