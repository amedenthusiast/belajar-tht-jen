# Belajar THT - ruang belajar Jennel

Website statis untuk GitHub Pages, berisi 175 soal. Bank aktif `klinis-v2` memuat revisi seluruh vignette dan pengecoh, teori inti, alasan setiap pilihan, serta poin penting belajar mandiri.

## Penggunaan

- Pilih satu dari tujuh topik (25 soal per topik), atau Random 25 soal campur.
- Pilihan pertama dikunci. Jawaban benar berwarna hijau; pilihan salah berwarna merah, sementara jawaban yang benar juga ditunjukkan.
- Pembahasan A-E serta rujukan halaman cetak dan PDF langsung tampil di bawah pilihan.
- Progres berdasarkan jumlah soal yang dijawab: setiap jawaban menambah 4%, hingga 100%.
- Gunakan Sebelumnya, Berikutnya, atau nomor soal untuk berpindah.
- Tombol Selesai muncul pada soal terakhir atau setelah seluruh soal dijawab. Skor adalah jumlah benar / 25 x 100. Penyelesaian dengan jawaban kosong memerlukan konfirmasi; yang kosong bernilai 0.
- Tinjau pembahasan setelah selesai untuk membaca semua alasan, termasuk nomor yang belum dijawab.

## Progres dan offline

## Leaderboard lokal dan cadangan

Setelah menekan Selesai (serta konfirmasi bila ada soal kosong), sesi ditandai selesai dan nama diminta. Catatan hanya dibuat ketika nama valid disimpan. Menutup dialog atau memilih Simpan nanti belum mencatat skor; hasil yang sudah selesai dapat disimpan dari halaman hasil. ID percobaan mencegah pencatatan ganda pada sesi yang sama.

Setiap catatan memuat nama, bab/mode, versi bank soal, tanggal, skor, dan jumlah benar/salah/kosong. Leaderboard disimpan pada peramban/perangkat yang sama; bukan penyimpanan server atau leaderboard bersama. Reset latihan tidak menghapus catatan. Penghapusan data peramban tetap dapat menghilangkan riwayat, sehingga ekspor cadangan berkala diperlukan.

Gunakan Leaderboard > Ekspor cadangan untuk mengunduh JSON. Impor cadangan memvalidasi format, skor, nama, tanggal dan ID; data digabung tanpa menggandakan sesi yang sama. Konflik ID atau data tidak konsisten ditolak tanpa menimpa riwayat. Untuk pindah perangkat, pindahkan berkas ekspor dan impor pada peramban tujuan. Cadangan dapat berisi nama peserta: simpan dan bagikan sesuai kebutuhan pribadi.

Peringkat secara default hanya membandingkan `klinis-v2`; tampilan semua versi merupakan riwayat. Soal yang berubah tidak boleh dihitung ulang memakai jawaban dari bank lama. Progres versi pertama dibiarkan pada kunci penyimpanan lamanya dan sesi v2 disimpan terpisah. Tidak ada data lama yang diam-diam digunakan untuk menghitung skor soal baru.

## Progres latihan dan offline

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
- `leaderboard.mjs`, `history-ui.mjs`: validasi riwayat, penyimpanan lokal, prompt nama, filter, ekspor/impor.
- `data/chapter-1.json` sampai `chapter-7.json`: bank soal dan alasan setiap pilihan.
- `sw.js`: cache offline untuk aset pada direktori situs ini.
- `icon.svg`: ikon lokal.
- `.nojekyll`: publikasi langsung sebagai website statis.

Jika mengubah berkas yang dipra-cache, naikkan versi CACHE pada `sw.js`. Hindari mengubah ID soal tanpa mempertimbangkan migrasi/reset progres tersimpan. Sebelum publikasi, validasi jumlah soal, lima opsi per soal, indeks jawaban, dan referensi. Bank ini bahan belajar mandiri, bukan soal resmi atau kisi-kisi seleksi FKUI/RSCM.
