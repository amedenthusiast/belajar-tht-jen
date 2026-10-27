# Belajar THT - ruang belajar Jennel

Website statis untuk GitHub Pages, berisi 175 soal dari bank soal yang telah disusun.

## Penggunaan

- Pilih satu dari tujuh topik (25 soal per topik), atau Random 25 soal campur.
- Pilihan pertama dikunci. Jawaban benar berwarna hijau; pilihan salah berwarna merah, sementara jawaban yang benar juga ditunjukkan.
- Pembahasan A-E serta rujukan halaman cetak dan PDF langsung tampil di bawah pilihan.
- Progres berdasarkan jumlah soal yang dijawab: setiap jawaban menambah 4%, hingga 100%.
- Gunakan Sebelumnya, Berikutnya, atau nomor soal untuk berpindah.
- Tombol Selesai muncul pada soal terakhir atau setelah seluruh soal dijawab. Skor adalah jumlah benar / 25 x 100. Penyelesaian dengan jawaban kosong memerlukan konfirmasi; yang kosong bernilai 0.
- Tinjau pembahasan setelah selesai untuk membaca semua alasan, termasuk nomor yang belum dijawab.

## Progres dan offline

Progres tersimpan otomatis di `localStorage` per peramban/perangkat, terpisah untuk setiap topik dan sesi acak. Menutup tab lalu membuka situs kembali melanjutkan posisi terakhir. Menggunakan tombol Semua topik menyimpan sesi lalu kembali ke menu.

Ulangi sesi mengosongkan topik aktif saja. Acak sesi baru mengambil 25 soal unik lagi. Reset semua progres mengosongkan progres aplikasi ini saja, setelah konfirmasi. Data lain di peramban tidak dihapus.

Service worker menyimpan aset dan seluruh soal setelah pemuatan pertama berhasil pada HTTPS. Situs dapat digunakan kembali saat offline jika cache telah selesai disiapkan. Progres tetap terpisah dari cache; penghapusan data situs/peramban atau mode privat dapat menghilangkannya. Tidak ada sinkronisasi antarperangkat, akun, analitik, CDN, atau font eksternal.

## Publikasi

GitHub repository Settings > Pages > Deploy from a branch > main > / (root) > Save.

Alamat: https://amedenthusiast.github.io/belajar-tht-jen/

Website tidak memerlukan instalasi dependensi atau proses build. README yang sudah ada tetap dipertahankan. Berkas PDF buku sumber tidak diunggah.

## Struktur

- `index.html`, `styles.css`: tampilan.
- `app.js`: interaksi dan penyimpanan.
- `engine.mjs`: pemilihan soal, skor, validasi progres tersimpan.
- `data/chapter-1.json` sampai `chapter-7.json`: bank soal dan alasan setiap pilihan.
- `sw.js`: cache offline untuk aset pada direktori situs ini.
- `icon.svg`: ikon lokal.
- `.nojekyll`: publikasi langsung sebagai website statis.

Jika mengubah berkas yang dipra-cache, naikkan versi CACHE pada `sw.js`. Hindari mengubah ID soal tanpa mempertimbangkan migrasi/reset progres tersimpan. Sebelum publikasi, validasi jumlah soal, lima opsi per soal, indeks jawaban, dan referensi. Bank ini bahan belajar mandiri, bukan soal resmi atau kisi-kisi seleksi FKUI/RSCM.
