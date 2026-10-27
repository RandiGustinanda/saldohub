function transactionPage() {
  return {
    order: {
      id: 'SH-2026-00125',
      customer: 'Admin',
      email: 'admin@example.com',
      paypal: 'admin.paypal@example.com',
      date: '28 Oktober 2026',
      amount: 1450000,
      fee: 50000
    },
    files: [],
    dragging: false,
    savedProof: false,
    copied: false,
    toast: { show: false, type: 'success', title: '', message: '' },
    toastTimer: null,

    get total() { return this.order.amount + this.order.fee; },
    rp(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); },

    addFiles(fileList) {
      const allowed = /\.(jpg|jpeg|png|webp|pdf|zip|rar)$/i;
      Array.from(fileList || []).forEach(file => {
        if (!allowed.test(file.name)) {
          this.notify('Format tidak didukung', 'Pilih file JPG, PNG, WEBP, PDF, ZIP, atau RAR.', 'error');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          this.notify('Ukuran file terlalu besar', file.name + ' melebihi batas 10 MB.', 'error');
          return;
        }
        if (this.files.some(f => f.name === file.name && f.size === file.size)) return;
        const ext = file.name.split('.').pop().toUpperCase();
        this.files.push({
          key: file.name + '-' + file.size + '-' + Date.now() + '-' + Math.random(),
          name: file.name,
          size: file.size,
          sizeLabel: this.formatSize(file.size),
          ext: ext.length > 5 ? 'FILE' : ext,
          raw: file
        });
      });
      this.savedProof = false;
    },
    handleDrop(event) {
      this.dragging = false;
      this.addFiles(event.dataTransfer.files);
    },
    removeFile(index) {
      this.files.splice(index, 1);
      this.savedProof = false;
    },
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    saveProof() {
      if (!this.files.length) {
        this.notify('Belum ada file', 'Pilih bukti pengiriman terlebih dahulu.', 'error');
        return;
      }
      this.savedProof = true;
      this.notify('Preview berhasil', 'File siap dilampirkan pada transaksi. Belum ada file yang diunggah ke server.');
    },

    downloadInvoice() {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        this.notify('PDF belum tersedia', 'Pastikan koneksi internet aktif agar pustaka PDF dapat dimuat.', 'error');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const NAVY = [27, 35, 71];
      const GOLD = [168, 134, 66];
      const INK = [31, 41, 55];
      const MUTED = [107, 102, 85];
      const L = 22, R = 188;
      const set = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);

      // Latar & bingkai ganda
      doc.setFillColor(253, 251, 246);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.rect(10, 10, 190, 277);
      doc.setLineWidth(0.2);
      doc.rect(12.5, 12.5, 185, 272);

      // Header
      doc.setFont('times', 'bold');
      doc.setFontSize(28);
      set(NAVY);
      doc.text('Saldo', L, 33);
      const w = doc.getTextWidth('Saldo');
      set(GOLD);
      doc.text('Hub', L + w, 33);

      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      set(MUTED);
      doc.text('Layanan Saldo Digital', L, 40);

      doc.setFontSize(22);
      set(NAVY);
      doc.text('INVOICE', R, 31, { align: 'right', charSpace: 2.5 });
      doc.setFontSize(9);
      set(GOLD);
      doc.text('BUKTI TRANSAKSI RESMI', R, 38, { align: 'right', charSpace: 1.2 });

      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.5);
      doc.line(L, 47, R, 47);
      doc.setLineWidth(0.15);
      doc.line(L, 48.6, R, 48.6);

      // Meta invoice
      const label = (t, x, y, align) => {
        doc.setFont('times', 'normal'); doc.setFontSize(8); set(MUTED);
        doc.text(t.toUpperCase(), x, y, { align: align || 'left', charSpace: 1.2 });
      };
      const value = (t, x, y, align) => {
        doc.setFont('times', 'bold'); doc.setFontSize(12); set(NAVY);
        doc.text(t, x, y, { align: align || 'left' });
      };
      label('Nomor invoice', L, 60);      value('INV-' + this.order.id, L, 66);
      label('Tanggal terbit', 105, 60, 'center'); value(this.order.date, 105, 66, 'center');
      label('Status', R, 60, 'right');    value('LUNAS', R, 66, 'right');

      // Ditagihkan kepada
      label('Ditagihkan kepada', L, 84);
      doc.setFont('times', 'bold'); doc.setFontSize(15); set(NAVY);
      doc.text(this.order.customer, L, 92);
      doc.setFont('times', 'normal'); doc.setFontSize(11); set(INK);
      doc.text(this.order.email, L, 99);
      doc.text('Email PayPal: ' + this.order.paypal, L, 105.5);

      label('Metode pembayaran', R, 84, 'right');
      doc.setFont('times', 'bold'); doc.setFontSize(12); set(NAVY);
      doc.text('PayPal', R, 92, { align: 'right' });
      doc.setFont('times', 'normal'); doc.setFontSize(11); set(INK);
      doc.text('Transfer saldo digital', R, 99, { align: 'right' });

      // Tabel
      let y = 124;
      doc.setFillColor(...NAVY);
      doc.rect(L, y, R - L, 9, 'F');
      doc.setFont('times', 'normal'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
      doc.text('DESKRIPSI', L + 4, y + 6, { charSpace: 1.5 });
      doc.text('JUMLAH', R - 4, y + 6, { align: 'right', charSpace: 1.5 });

      const rows = [
        ['Saldo PayPal', 'Pembelian saldo digital', this.order.amount],
        ['Biaya layanan', 'Biaya administrasi transaksi', this.order.fee]
      ];
      y += 9;
      rows.forEach(r => {
        doc.setFont('times', 'bold'); doc.setFontSize(12); set(NAVY);
        doc.text(r[0], L + 4, y + 8);
        doc.setFont('times', 'italic'); doc.setFontSize(9.5); set(MUTED);
        doc.text(r[1], L + 4, y + 13.5);
        doc.setFont('times', 'normal'); doc.setFontSize(12); set(INK);
        doc.text(this.rp(r[2]), R - 4, y + 9.5, { align: 'right' });
        doc.setDrawColor(226, 218, 196);
        doc.setLineWidth(0.2);
        doc.line(L, y + 18, R, y + 18);
        y += 18;
      });

      // Total
      y += 8;
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.7);
      doc.line(L + 80, y, R, y);
      doc.setLineWidth(0.2);
      doc.line(L + 80, y + 15, R, y + 15);
      doc.setFont('times', 'normal'); doc.setFontSize(9); set(MUTED);
      doc.text('TOTAL PEMBAYARAN', L + 84, y + 9.5, { charSpace: 1.2 });
      doc.setFont('times', 'bold'); doc.setFontSize(17); set(NAVY);
      doc.text(this.rp(this.total), R - 4, y + 10, { align: 'right' });

      // Terbilang
      doc.setFont('times', 'italic'); doc.setFontSize(10.5); set(MUTED);
      doc.text('Terbilang: Satu juta lima ratus ribu rupiah', L, y + 9.5);

      // Cap LUNAS
      doc.setDrawColor(47, 125, 91);
      doc.setTextColor(47, 125, 91);
      doc.setLineWidth(0.8);
      doc.setFont('times', 'bold'); doc.setFontSize(20);
      doc.text('LUNAS', 158, 215, { align: 'center', angle: 8, charSpace: 3 });

      // Tanda tangan
      doc.setFont('times', 'normal'); doc.setFontSize(10.5); set(MUTED);
      doc.text('Hormat kami,', R, 238, { align: 'right' });
      doc.setDrawColor(154, 146, 122);
      doc.setLineWidth(0.3);
      doc.line(R - 48, 256, R, 256);
      doc.setFont('times', 'italic'); doc.setFontSize(11); set(NAVY);
      doc.text('SaldoHub Admin', R, 262, { align: 'right' });

      // Footer
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.3);
      doc.line(L, 272, R, 272);
      doc.setFont('times', 'italic'); doc.setFontSize(9.5); set(MUTED);
      doc.text('Terima kasih telah mempercayakan transaksi Anda kepada SaldoHub.', 105, 278, { align: 'center' });

      doc.save('Invoice-' + this.order.id + '.pdf');
      this.notify('Invoice dibuat', 'PDF invoice berhasil diunduh.');
    },

    copyOrderId() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.order.id).then(() => {
          this.copied = true;
          setTimeout(() => this.copied = false, 1600);
        }).catch(() => this.notify('ID transaksi', this.order.id));
      } else {
        this.notify('ID transaksi', this.order.id);
      }
    },
    sendNotification() {
      this.notify('Simulasi notifikasi', 'Dalam versi produksi, email berisi status pesanan dan tautan bukti akan dikirim ke ' + this.order.email + '.');
    },
    notify(title, message, type = 'success') {
      this.toast = { show: true, type, title, message };
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.toast.show = false, 4200);
    }
  };
}