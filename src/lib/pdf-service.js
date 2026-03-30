// ============================================================
//  PDF SERVICE — Export Laporan SLF ke PDF
//  Menggunakan html2pdf.js (CDN lazy-loaded)
//  Format: A4, Margin PUPR Standard
// ============================================================

import { getSettings } from './settings.js';

/**
 * Mendapatkan konfigurasi laporan dari Pengaturan (Global)
 */
async function getReportConfig() {
  const settings = await getSettings();
  return {
    consultantName: settings.consultant.name.toUpperCase(),
    consultantTagline: settings.consultant.address,
    docTitle: 'LAPORAN TEKNIS KAJIAN SLF BANGUNAN GEDUNG',
    logo: settings.consultant.logo,
    website: 'Smart AI Pengkaji SLF'
  };
}

/**
 * Lazy load html2pdf.js dari CDN
 */
async function loadHtml2Pdf() {
  if (window.html2pdf) return window.html2pdf;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // Hapus integrity hash untuk mencegah error SRI mismatch di beberapa browser/jaringan
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error('Gagal memuat library html2pdf.js dari CDN. Pastikan ada koneksi internet.'));
    document.head.appendChild(script);
  });
}

/**
 * Generate PDF dari halaman laporan
 * @param {HTMLElement} element - Element yang akan di-convert ke PDF
 * @param {Object} proyek - Data proyek
 * @param {Function} onProgress - Callback progress (0-100)
 */
export async function generatePDF(element, proyek, onProgress) {
  try {
    if (onProgress) onProgress(10, 'Memuat library PDF...');
    const html2pdf = await loadHtml2Pdf();
    
    if (onProgress) onProgress(20, 'Mengambil pengaturan identitas...');
    const config = await getReportConfig();

    if (onProgress) onProgress(40, 'Menyiapkan konten laporan...');

    // Clone element to manipulate without affecting the DOM
    const clone = element.cloneNode(true);

    // Apply print-specific styles to the clone
    applyPrintStyles(clone);

    if (onProgress) onProgress(50, 'Mengonversi ke format PDF...');

    const tanggal = new Date().toISOString().split('T')[0];
    const fileName = `SLF_${(proyek.nama_bangunan || 'Laporan').replace(/\s+/g, '_')}_${tanggal}.pdf`;

    const opt = {
      margin: [25, 10, 20, 10], // mm: [Top, Right, Bottom, Left] -> Top margin 25mm to fit header, Bottom 20mm for footer
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        // Hapus hardcoded windowWidth dan biarkan ukurannya natural berdasarkan scroll/container clone
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.pdf-page-break',
        avoid: ['.report-item-card', '.report-field', 'tr', 'td', 'th', 'h2', 'h3'],
        after: '.pdf-page-break-after'
      },
    };

    if (onProgress) onProgress(70, 'Merender halaman PDF & Menambah Header/Footer...');

    // Save process using Promise chain to inject Headers and Footers via jsPDF API natively
    await html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
      const totalPages = pdf.internal.getNumberOfPages();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // -- DRAW HEADER -- (Kecuali Halaman 1 jika itu Cover)
        // Set up Header Font
        pdf.setFontSize(10);
        pdf.setTextColor(17, 24, 39); // Dark text
        pdf.setFont("helvetica", "bold");
        
        // Custom Logo (Jika ada Base64)
        if (config.logo) {
          try {
            pdf.addImage(config.logo, 'PNG', 10, 8, 10, 10);
          } catch (e) {
            // Fallback: Blue Box if image fails
            pdf.setFillColor(30, 58, 138); 
            pdf.rect(10, 8, 8, 8, 'F');
          }
        } else {
          // Default Logo Placeholder (Blue Box)
          pdf.setFillColor(30, 58, 138); 
          pdf.rect(10, 8, 8, 8, 'F');
        }
        
        // Consultant Name
        pdf.text(config.consultantName, config.logo ? 23 : 22, 12);
        
        // Tagline & Right align text
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139); // slate-500
        
        const tagline = config.consultantTagline.length > 80 
          ? config.consultantTagline.substring(0, 77) + '...'
          : config.consultantTagline;
        pdf.text(tagline, config.logo ? 23 : 22, 16);
        
        pdf.setFontSize(8);
        pdf.text(config.docTitle, pageWidth - 10, 14, { align: 'right' });
        
        // Header Line
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setLineWidth(0.3);
        pdf.line(10, 19, pageWidth - 10, 19);

        // -- DRAW FOOTER --
        // Footer Line
        pdf.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
        
        pdf.setFontSize(7);
        pdf.text('Dihasilkan otomatis oleh Smart AI Pengkaji SLF | ' + config.consultantName, 10, pageHeight - 10);
        
        // Page Number
        pdf.setFont("helvetica", "bold");
        pdf.text(`Halaman ${i} / ${totalPages}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
      }
    }).save();

    if (onProgress) onProgress(100, 'Selesai!');
    return fileName;
  } catch (err) {
    if (onProgress) onProgress(100, 'Gagal', true);
    console.error('PDF Generation Error:', err);
    throw new Error(err.message || 'Gagal generate PDF');
  }
}

/**
 * Generate PDF menggunakan browser print (fallback)
 * Lebih stabil untuk styling yang kompleks
 */
export function generatePDFViaPrint() {
  // Trigger browser print dialog
  window.print();
}

/**
 * Apply print-specific inline styles pada cloned element
 */
function applyPrintStyles(container) {
  // Set explicit positioning to prevent left-cutoff from HTML2Canvas
  container.style.position = 'relative';
  container.style.margin = '0 auto';
  container.style.padding = '0';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '190mm'; // Precisely fit A4 viewport (210mm - 20mm margins)
  container.style.boxSizing = 'border-box';
  
  // Set base font and ensure dark text
  container.style.fontFamily = "'Calibri', 'Segoe UI', sans-serif";
  container.style.color = '#111827';
  container.style.backgroundColor = 'white';

  // Make sure ALL text colors that are light are darkened for PDF visibility
  const allElements = container.querySelectorAll('*');
  allElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.color === 'rgb(255, 255, 255)' && !el.closest('.laporan-cover') && !el.closest('.badge-status')) {
      el.style.color = '#111827';
    }
    // Prevent layout breakage inside cards
    if (el.style.maxWidth) el.style.maxWidth = '100%';
  });

  // Style the cover
  const cover = container.querySelector('.laporan-cover');
  if (cover) {
    cover.style.backgroundColor = '#1e3a8a';
    cover.style.color = 'white';
    cover.style.textAlign = 'center';
    cover.style.padding = '60px 40px';
    cover.style.minHeight = '275mm';
    cover.style.display = 'flex';
    cover.style.flexDirection = 'column';
    cover.style.justifyContent = 'center';
    
    // Ensure all text in cover is white
    cover.querySelectorAll('*').forEach(el => {
      el.style.color = 'white';
    });
  }

  // Remove no-print elements
  const noPrint = container.querySelectorAll('.no-print');
  noPrint.forEach(el => el.remove());

  // Restore border for tables that might lose it in printing
  const tables = container.querySelectorAll('.laporan-section > table');
  tables.forEach(table => {
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.tableLayout = 'auto';
    table.querySelectorAll('th, td').forEach(cell => {
      cell.style.border = '1px solid #d1d5db';
    });
  });

  // Ensure page breaks
  const sections = container.querySelectorAll('.laporan-section');
  sections.forEach(section => {
    section.style.pageBreakBefore = 'always';
    section.style.padding = '0';
    section.style.borderBottom = 'none';
  });
}
