export interface Passage {
  id: string;
  title: string;
  text: string[];
  src: string;
}

export type QuestionType = 'pg' | 'bs' | 'mcma';

export interface BaseQuestion {
  id: number;
  p: string; // passage key
  type: QuestionType;
  text: string;
}

export interface PgQuestion extends BaseQuestion {
  type: 'pg';
  opts: [string, string][];
  ans: string;
}

export interface BsQuestion extends BaseQuestion {
  type: 'bs';
  labels: [string, string];
  rows: [string, string, string][]; // [key, statementText, correctLabel]
}

export interface McmaQuestion extends BaseQuestion {
  type: 'mcma';
  opts: [string, string][];
  ans: string[]; // array of correct keys
}

export type Question = PgQuestion | BsQuestion | McmaQuestion;

export const PASSAGES: Record<string, Passage> = {
  p1: {
    id: "p1",
    title: "Benteng Otanaha: Jejak Sejarah di Puncak Gorontalo",
    text: [
      "Benteng Otanaha adalah simbol ketangguhan, identitas budaya, sekaligus warisan sejarah yang berdiri kokoh di atas Bukit Dembe, Kota Gorontalo. Benteng ini terletak di tepi Danau Limboto dan dikelilingi oleh hijaunya perbukitan, benteng ini tidak hanya memikat secara visual, namun juga menyimpan jejak dari masa perjuangan masyarakat Gorontalo melawan bangsa asing sejak abad ke-15.",
      "Menurut catatan sejarah dan tradisi lokal, Benteng Otanaha dibangun oleh Raja Ilato, yang merupakan tokoh penting dalam sejarah Kerajaan Gorontalo, sebagai bagian dari strategi pertahanan menghadapi ancaman Portugis dan bajak laut dari Mindanao yang kerap masuk melalui Teluk Tomini. Yang uniknya benteng ini dibangun dari bahan alami seperti batu dan putih telur yang dijadikan sebagai perekat, menunjukkan kecanggihan lokal dalam teknik bangunan saat itu. Kompleks benteng ini terdiri dari tiga struktur utama: Otanaha, Otahiya, dan Ulupahu, yang seluruhnya dibangun di titik-titik strategis pada puncak perbukitan. Letaknya yang tinggi memungkinkan jarak pandangan luas ke arah danau dan sekitarnya, menjadikan tempat ini sangat ideal untuk dijadikan sebagai menara pengintai dan benteng pertahanan.",
      "Dari sisi sosial, masyarakat di sekitar Benteng Otanaha, khususnya di Kelurahan Dembe I, belum sepenuhnya mampu mengelola potensi ini secara optimal. Tingkat partisipasi warga dalam kegiatan pariwisata masih rendah, disebabkan oleh kurangnya pelatihan, keterampilan, serta kesadaran akan potensi ekonomi yang ditawarkan wisata sejarah. Bahkan, hampir 40% warga di wilayah tersebut tergolong dalam kategori keluarga miskin.",
      "Kajian spasial Dwi Randayani Butulipu, Ivan Taslim, (2018) dan analisis SWOT yang dilakukan para peneliti menunjukkan bahwa kawasan ini sangat layak untuk dikembangkan, asalkan disertai dengan langkah nyata, seperti peningkatan infrastruktur dasar, kolaborasi lintas sektor, dan peningkatan kapasitas masyarakat sekitar. Jika dilakukan dengan benar, kawasan Benteng Otanaha tidak hanya akan menjadi destinasi wisata yang populer, tetapi juga motor penggerak ekonomi lokal berbasis budaya dan sejarah."
    ],
    src: "Dikutip dari kompasiana.com — Benteng Otanaha: Jejak Sejarah di Puncak Gorontalo"
  },
  p2: {
    id: "p2",
    title: "Gubernur Gorontalo Gandeng JICA Selamatkan Danau Limboto",
    text: [
      "GORONTALO (ANTARA) — Gubernur Gorontalo Gusnar Ismail mengajak Badan Kerja Sama Internasional Jepang atau Japan International Cooperation Agency (JICA) untuk turut berperan aktif dalam upaya penyelamatan Danau Limboto. Hal tersebut disampaikan Gubernur dalam audiensi bersama perwakilan JICA yang turut dihadiri Forum Daerah Aliran Sungai (Fordas) Gorontalo, Senin.",
      "Dalam pertemuan tersebut, Gusnar menyoroti kondisi Danau Limboto yang semakin kritis akibat sedimentasi dan penurunan kualitas lingkungan. Ia menegaskan bahwa Danau Limboto telah lama menjadi perhatian pemerintah pusat dan daerah, namun upaya penyelamatannya belum menunjukkan hasil yang signifikan. \"Kita sudah bicara soal Danau Limboto selama 20 tahun lebih, tapi sampai hari ini belum ada kemajuan yang berarti. Saya harap JICA bisa menjadi mitra strategis untuk mengubah kondisi ini,\" ujar Gusnar. Ia mengungkapkan keinginannya agar Danau Limboto dapat direvitalisasi seperti Danau Biwa di Jepang, yang dulunya penuh eceng gondok namun kini menjadi sumber air bersih utama bagi Kyoto. Untuk itu, Gusnar meminta tiga fokus utama kepada JICA yakni penanganan sedimentasi, pemanfaatan danau sebagai objek wisata dan konservasi, serta pengembangan sektor perikanan air tawar secara berkelanjutan.",
      "Menanggapi hal tersebut, Kepala Kantor Perwakilan JICA Indonesia Takeda Sachiko menyambut positif komitmen Pemerintah Provinsi Gorontalo. Ia menilai pendekatan lingkungan yang ditekankan Gubernur menjadi kunci penting dalam rencana kolaborasi ke depan. Ia mengatakan bahwa penyelamatan Danau Limboto tidak bisa dilepaskan dari konteks perubahan iklim yang kini menjadi isu global. Oleh karena itu, JICA berkomitmen untuk berkoordinasi lebih lanjut dengan pihak-pihak terkait guna menyusun strategi pemulihan dan pengelolaan danau yang komprehensif."
    ],
    src: "Dikutip dari gorontalo.antaranews.com"
  },
  p3: {
    id: "p3",
    title: "Kosmetik Halal",
    text: [
      "Industri halal secara luas mencakup berbagai sektor, termasuk makanan, farmasi, pariwisata, keuangan, hingga kosmetik, yang semuanya tunduk pada prinsip-prinsip syariah. Khususnya dalam sektor kosmetik, produk halal dianggap lebih aman dan sesuai dengan nilai keagamaan, tidak hanya bagi konsumen Muslim tetapi juga non-Muslim. Pada tahun 2022, pengeluaran global untuk produk halal mencapai USD 2,29 triliun dan diperkirakan meningkat menjadi USD 3,1 triliun pada tahun 2027.",
      "Di Indonesia, potensi pasar kosmetik halal sangat besar. Indonesia menempati posisi kedua dalam konsumsi kosmetik halal secara global dengan nilai pasar sekitar USD 8,4 miliar. Peningkatan pesat jumlah pengguna internet yang mencapai 220 juta orang pada tahun 2022 mendorong pergeseran perilaku konsumen ke arah barang yang paling sering dibeli secara daring. Perubahan preferensi ini menuntut perusahaan agar dapat tetap kompetitif dalam lanskap digital yang terus berkembang.",
      "Ketika konsumen merasa puas terhadap kualitas dan nilai yang ditawarkan suatu produk, mereka lebih cenderung melakukan pembelian ulang dan merekomendasikan produk tersebut kepada orang lain. Oleh karena itu, perusahaan harus memprioritaskan pengalaman positif konsumen dalam setiap aspek layanan dan produk.",
      "Generasi Z, yaitu mereka yang lahir antara tahun 1995-2010, menjadi fokus utama dalam penelitian ini karena memiliki potensi besar sebagai konsumen masa kini dan mendatang. Generasi ini sangat akrab dengan teknologi, lebih memilih belanja online, dan memiliki ekspektasi tinggi terhadap kualitas serta pengalaman pengguna. Namun, mereka juga dikenal kurang loyal terhadap merek, sehingga mudah berpindah ke kompetitor."
    ],
    src: "Dikutip dari Fianto, dkk. (2025), Shirkah: Jurnal of Economics and Business"
  },
  p4: {
    id: "p4",
    title: "Perahu Kertas — Dee / Dewi Lestari",
    text: [
      "Di ruangan tamu yang digunakan bersama itu, tampak karton pipih lebar bekas pizza menganga terbuka. Sebuah teve yang tak ditonton menyala dengan suara sayup. Empat orang duduk di lantai, berbincang asyik sambil tertawa-tawa, dengan dus pizza kosong sebagai pusat bagaikan kawanan Indian yang mengelilingi api unggun.",
      "“Kugy ... giliran lu kasih ide.” “Oke,” Kugy berdehem, “di lingkaran suci ini, sebutkan hal paling aneh yang pernah kita lakukan. Ayo, yang jujur, ya!” “Maaf, sebetulnya gua kurang setuju,” Noni angkat tangan. Mereka tergelak-gelak, termasuk Kugy.",
      "Noni berpikir sejenak. “Waktu SD gua pernah ikut drama sekolah, dan dapat peran jadi Pak Raden. Lengkap dengan kumis palsu.” Semua terkikik-kikik. Giliran Keenan. “Hmm. Lipsync lagu Meggy Z. Lengkap dengan joget.” Pengakuan Keenan disambut sunyi. Semua terlongo, takjub. “Jadi, waktu itu ada malam kesenian di sekolah gua di Amsterdam, dan karena mereka tahu gua dari Indonesia, gua diminta menyumbangkan satu kesenian yang khas Indonesia. Tapi mereka suka banget. Satu sekolah ikut joget.” Tiba-tiba terdengar suara tepuk tangan yang diprakarsai oleh Eko.",
      "Giliran Kugy. Anak itu berpikir keras. Betul kata Noni, pikirnya, berhubung hampir semua yang ia lakukan cenderung aneh, susah sekali memilih satu. “Ayo, dong. Lama banget, sih,” desak Eko tak sabar. “Bentar, bentar. Susah banget, nih,” gumam Kugy."
    ],
    src: "Dikutip dari novel Perahu Kertas karya Dewi Lestari (2009)"
  },
  p5: {
    id: "p5",
    title: "Bahasa Bapak — Tri Utami Suleman",
    text: [
      "Kabut. Sudah hampir seminggu kampung Tutun diakrabi hujan. Untungnya kampung itu berada di dataran tinggi sehingga tidak mudah banjir. Tidak banyak yang mengeluh dengan cuaca yang sedang moody-an akhir-akhir ini.",
      "“Kalau banjir nanti, anak-anak diliburkan seperti sekolah di kampung sebelah,” ujar Oma Sisa Ni'u kepada Tutun yang sedang berkemas. “Kalau sekolah tidak diliburkan, Wahyu tetap harus sekolah,” Laki-laki itu menimpali perkataan ibunya sambil terus berkemas.",
      "Angin subuh memaksa masuk dari dinding pitate rumah mereka. Tutun kembali lagi ke kamar setelah selesai mengemas baju ke ransel tuanya. Ia melayangkan kecup hangat di dahi Wahyu sebelum ia pamit dan mencium tangan Oma Sisa. “Saya hanya empat hari, Ma. Hanya pembangunan kamar mandi rumah. Nanti di Tolinggula saya menginap di rumah sepupunya basi Ilyas.”",
      "“Saya titip Wahyu, Mama wua. Kalau sebentar hujan, antarkan dia pakai payung ke sekolah atau bisa minta tumpangan bentor Pa'ade Nanu, nanti saya bayar kalau saya sudah pulang.” “Dia harus tetap sekolah. Hujan bukan jadi alasan, sekolahnya juga tidak jauh. Lebih baik kehujanan saat pergi menuntut ilmu, daripada nanti susah. Wahyu tidak boleh berakhir seperti saya, Ma.”"
    ],
    src: "Dikutip dari cerpen Bahasa Bapak, Tri Utami Suleman (Antologi 15 Penulis Gorontalo)"
  },
  p6: {
    id: "p6",
    title: "Tabungan untuk Masa Depan",
    text: [
      "Suci: (dengan sopan) Selamat pagi, Pak Bambang. Saya ingin mendiskusikan tentang menabung, Pak.",
      "Pak Bambang: (tersenyum) Tentu, itu keputusan yang cerdas untuk masa depanmu, Suci. Apakah kamu memiliki tujuan tertentu dalam menabung? Selanjutnya, kamu perlu membuat anggaran bulanan untuk mengatur pengeluaran dan menentukan berapa jumlah yang bisa kamu sisihkan untuk ditabung. Penting juga untuk memilih produk tabungan yang sesuai dengan kebutuhanmu — bandingkan suku bunga dan biaya administrasi yang ditawarkan oleh berbagai bank.",
      "Suci: Saya akan meluangkan waktu untuk melakukan riset lebih lanjut, Pak.",
      "Pak Bambang: Terakhir, jangan lupa untuk konsisten dan disiplin dalam menabung. Bahkan dengan jumlah kecil, jika dilakukan secara teratur, akan memberikan hasil yang besar di masa depan.",
      "Mereka berdua tersenyum satu sama lain, dan Suci pergi dengan semangat untuk memulai perjalanan menabungnya."
    ],
    src: "Dikutip dari id.scribd.com — Tabungan Untuk Masa Depan"
  },
  p7: {
    id: "p7",
    title: "Peran Pohon dalam Menjaga Keseimbangan Alam",
    text: [
      "Pohon merupakan salah satu unsur penting dalam menjaga keseimbangan alam. Keberadaan pohon tidak hanya memperindah lingkungan, tetapi juga memiliki peran besar dalam menjaga kehidupan di bumi. Sayangnya, seiring dengan meningkatnya pembangunan dan aktivitas manusia, jumlah pohon di berbagai wilayah semakin berkurang.",
      "Penghasil Oksigen bagi Kehidupan — Salah satu peran utama pohon adalah menghasilkan oksigen melalui proses fotosintesis. Inilah sebabnya mengapa kawasan yang memiliki banyak pepohonan biasanya memiliki udara yang lebih sejuk dan bersih.",
      "Menjaga Keseimbangan Iklim — Pepohonan mampu menyerap karbon dioksida, salah satu gas penyebab pemanasan global. Hutan yang luas sering disebut sebagai “paru-paru bumi” karena kemampuannya menyerap karbon dalam jumlah besar.",
      "Mencegah Banjir dan Erosi — Akar pohon memiliki kemampuan menyerap air dan menahan tanah agar tidak mudah terbawa oleh aliran air, sehingga mengurangi risiko banjir dan erosi.",
      "Menjadi Habitat Berbagai Makhluk Hidup — Pohon juga menjadi tempat tinggal bagi berbagai jenis makhluk hidup. Tanpa pohon, banyak makhluk hidup akan kehilangan tempat tinggal dan sumber makanan mereka."
    ],
    src: "Dikutip dari tulisan Rudi Sianturi, rri.co.id"
  },
  p8: {
    id: "p8",
    title: "Cara Menggunakan APAR dengan Benar",
    text: [
      "Cara menggunakan APAR adalah pengetahuan penting yang sebaiknya dimiliki setiap orang. APAR merupakan singkatan dari Alat Pemadam Api Ringan. Sebelum digunakan, pastikan APAR dalam kondisi baik, yaitu tekanan berada di area normal, segel masih utuh, dan belum melewati masa kedaluwarsa.",
      "1) Tarik pin pengaman — Pin ini berfungsi untuk mencegah tuas tertekan secara tidak sengaja.",
      "2) Arahkan ujung selang ke api — arahkan nozzle ke bagian dasar api, bukan ke nyala apinya, dengan jarak aman sekitar 1,5–2 meter.",
      "3) Tekan tuas APAR — tekan secara penuh agar media pemadam keluar dengan tekanan maksimal.",
      "4) Arahkan semburan dari kiri ke kanan — gerakkan nozzle secara perlahan untuk menyapu seluruh area api."
    ],
    src: "Dikutip dari alodokter.com & damkar.bandaacehkota.go.id"
  },
  p9: {
    id: "p9",
    title: "Rapor — Puisi",
    text: [
      "“bilangan tidak pernah benar-benar hilang,” kata bu guru suatu hari di depan kelas, “ia hanya berpindah tempat setelah dikurangi.” aku tidak begitu mengerti. sebab angka satu di rumah kami sudah lama pergi, dan tidak pernah kembali.",
      "di buku matematika, 2 – 1 = 1. mudah sekali. tetapi di rumah, tiga piring dikurangi satu, meja makan tetap terlalu besar. dua pasang sandal dikurangi satu— tetap menunggu suara yang tidak pulang.",
      "kata papa, aku harus belajar lebih giat. barangkali supaya nanti aku pandai menghitung. tapi semakin sering aku belajar pengurangan, semakin takut aku pulang. takut rumus itu sedang mengerjakan keluargaku.",
      "hari pembagian rapor, nilai matematikaku turun. bu guru menulis, “perlu lebih banyak latihan.” aku ingin bertanya, latihan yang bagaimana agar orang tidak terus berkurang?"
    ],
    src: "Puisi Salman Alade, omong-omong.com"
  },
  p10: {
    id: "p10",
    title: "Negosiasi Wawancara Kerja",
    text: [
      "HRD: Selamat pagi, Saudara. Silakan memperkenalkan diri dan menjelaskan alasan Anda melamar di perusahaan kami.",
      "Pelamar: Nama saya Raka, lulusan SMK Teknik Komputer dan Jaringan dengan pengalaman PKL enam bulan sebagai teknisi jaringan.",
      "HRD: Berdasarkan pengalaman tersebut, berapa gaji yang Anda harapkan? — Pelamar: Saya berharap sekitar Rp4.000.000 per bulan.",
      "HRD: Untuk karyawan baru, perusahaan kami biasanya menawarkan Rp3.500.000. — Pelamar: Saya berharap ada penyesuaian; saya memiliki kemampuan instalasi, pemeliharaan, dan pemecahan masalah jaringan, serta bersedia mengikuti pelatihan tambahan.",
      "HRD: Jika kami menawarkan Rp3.700.000 dengan fasilitas pelatihan dan evaluasi gaji setelah enam bulan, bagaimana pendapat Anda? — Pelamar: (...) — HRD: Baik, kami dapat memberikan evaluasi setelah enam bulan sesuai kebijakan perusahaan."
    ],
    src: "Dialog negosiasi wawancara kerja"
  }
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    p: 'p1',
    type: 'pg',
    text: 'Makna kata <i>spasial</i> pada teks di atas adalah….',
    opts: [
      ['A', 'Berkenaan dengan Ruang atau Tempat'],
      ['B', 'Karakteristik Fisik Tiga Dimensi'],
      ['C', 'Penataan dan Distribusi Geografis'],
      ['D', 'Kemampuan Visual perseptual'],
      ['E', 'Perspektif Jarak dan Posisi']
    ],
    ans: 'A'
  },
  {
    id: 2,
    p: 'p1',
    type: 'bs',
    text: 'Berdasarkan isi teks, tentukan apakah pernyataan hubungan makna berikut Benar atau Salah!',
    labels: ['Benar', 'Salah'],
    rows: [
      ['A', 'Paragraf kedua berfungsi menjelaskan latar belakang sejarah dan teknik pembangunan Benteng Otanaha yang disebutkan pada paragraf pertama.', 'Benar'],
      ['B', 'Paragraf ketiga memiliki hubungan pertentangan (kontras) dengan paragraf kedua terkait fungsi lokasi Benteng Otanaha.', 'Salah'],
      ['D', 'Paragraf kelima berisi hubungan syarat/solusi untuk mengatasi permasalahan potensi wisata dan ekonomi warga yang dijelaskan pada paragraf keempat.', 'Benar']
    ]
  },
  {
    id: 3,
    p: 'p1',
    type: 'pg',
    text: 'Berdasarkan bacaan di atas, manakah fakta yang <b>paling akurat</b> mengenai sejarah dan bahan pembuatan Benteng Otanaha?',
    opts: [
      ['A', 'Benteng Otanaha dibangun oleh bangsa Portugis sebagai markas pertahanan di Gorontalo.'],
      ['B', 'Perekat struktur batu pada Benteng Otanaha menggunakan kombinasi semen dan putih telur.'],
      ['C', 'Raja Ilato membangun Benteng Otanaha untuk menahan ancaman Portugis dan bajak laut Mindanao.'],
      ['D', 'Kompleks Benteng Otanaha dibangun pada abad ke-15 oleh masyarakat Kelurahan Dembe I.'],
      ['E', 'Benteng Otanaha dirancang oleh peneliti Dwi Randayani Butulipu dengan bahan alami setempat.']
    ],
    ans: 'C'
  },
  {
    id: 4,
    p: 'p2',
    type: 'bs',
    text: 'Cermati penggunaan kata-kata dalam wacana. Tentukan apakah pernyataan mengenai identifikasi kata serapan berikut Benar atau Salah!',
    labels: ['Benar', 'Salah'],
    rows: [
      ['A', 'Kata audiensi pada paragraf pertama dan revitalisasi pada paragraf ketiga merupakan kata serapan dari bahasa asing yang masing-masing bermakna pertemuan resmi dan proses menghidupkan kembali.', 'Benar'],
      ['B', 'Kata sedimentasi pada paragraf kedua dan konservasi pada paragraf ketiga merupakan kata serapan dari bahasa asing yang digunakan di bidang lingkungan hidup dan sains.', 'Benar'],
      ['C', 'Kata penyelamatan pada paragraf pertama dan perikanan pada paragraf ketiga merupakan kata serapan dari bahasa Belanda yang mengalami penyesuaian imbuhan.', 'Salah'],
      ['D', 'Kata kolaborasi pada paragraf ketiga dan komprehensif pada paragraf keempat merupakan kata serapan dari bahasa asing yang masing-masing bermakna kerja sama dan menyeluruh.', 'Benar']
    ]
  },
  {
    id: 5,
    p: 'p2',
    type: 'mcma',
    text: 'Manakah dari pernyataan-pernyataan berikut yang BENAR mengenai identifikasi kata serapan dari bahasa asing atau bahasa daerah? <i>(Jawaban benar lebih dari satu)</i>',
    opts: [
      ['A', 'Kata strategis dan komprehensif diserap dari bahasa asing dan berfungsi sebagai kata sifat (adjektiva) dalam kalimat.'],
      ['B', 'Kata mitra pada paragraf kedua merupakan kata serapan dari bahasa Belanda yang berkedudukan sebagai kata benda (nomina).'],
      ['C', 'Kata teknologi dan koordinasi diserap dari bahasa asing yang masing-masing berkaitan dengan bidang ilmu pengetahuan dan tata kelola.'],
      ['D', 'Kata penyelamatan dan pendekatan merupakan kata serapan dari bahasa Portugis yang mengalami penyesuaian ejaan.'],
      ['E', 'Kata kritis dan global merupakan kata serapan asing yang masing-masing menyatakan keadaan gawat dan jangkauan dunia.']
    ],
    ans: ['A', 'C', 'E']
  },
  {
    id: 6,
    p: 'p2',
    type: 'pg',
    text: 'Ide pokok yang disampaikan dalam keseluruhan teks berita tersebut adalah …',
    opts: [
      ['A', 'Penawaran bantuan teknologi dan ilmu pengetahuan dari pihak JICA untuk pengembangan sektor perikanan air tawar di Gorontalo.'],
      ['B', 'Kolaborasi strategis antara Pemprov Gorontalo dan JICA dalam upaya penyelamatan dan pengelolaan berkelanjutan Danau Limboto.'],
      ['C', 'Keberhasilan Pemerintah Jepang dalam merespons fenomena eceng gondok di Danau Biwa sebagai model penanganan danau purba.'],
      ['D', 'Keterlibatan Forum Daerah Aliran Sungai (Fordas) Gorontalo dalam mengatasi dampak perubahan iklim di wilayah pesisir.'],
      ['E', 'Keprihatinan Gubernur Gorontalo atas kegagalan penanganan masalah sedimentasi Danau Limboto selama dua dekade terakhir.']
    ],
    ans: 'B'
  },
  {
    id: 7,
    p: 'p2',
    type: 'pg',
    text: 'Cermati paragraf terakhir kalimat keempat pada teks berita di atas! Kalimat tersebut menunjukkan hubungan antarkalimat ....',
    opts: [
      ['A', 'sebab-akibat (kausalitas), yaitu komitmen koordinasi JICA merupakan akibat/konsekuensi logis dari pandangan bahwa penyelamatan Danau Limboto berkaitan erat dengan isu perubahan iklim global.'],
      ['B', 'pertentangan (konsesif), yaitu komitmen koordinasi JICA berlawanan dengan penilaian perwakilan JICA terhadap pendekatan lingkungan yang ditekankan oleh Gubernur.'],
      ['C', 'perbandingan (komparasi), yaitu membandingkan langkah konkret yang akan diambil JICA dengan strategi pemulihan danau yang telah dijalankan oleh Pemprov Gorontalo.'],
      ['D', 'rincian contoh (eksemplifikasi), yaitu memberikan contoh bentuk koordinasi teknis serta lokasi spesifik di lapangan yang akan dikunjungi oleh tim JICA.'],
      ['E', 'penambahan sejajar (korelatif), yaitu menambahkan informasi baru mengenai riwayat proyek lingkungan yang pernah dikerjakan JICA bersama Pemprov Gorontalo pada masa lalu.']
    ],
    ans: 'A'
  },
  {
    id: 8,
    p: 'p3',
    type: 'pg',
    text: 'Di antara kelompok kata berikut, manakah yang <b>seluruhnya</b> merupakan kata serapan dari bahasa asing yang terdapat dalam bacaan di atas?',
    opts: [
      ['A', 'industri, potensi, pembelian'],
      ['B', 'konsumen, preferensi, ekspektasi'],
      ['C', 'sektor, perilaku, kompetitor'],
      ['D', 'kualitas, pengalaman, loyal'],
      ['E', 'teknologi, keuangan, digital']
    ],
    ans: 'B'
  },
  {
    id: 9,
    p: 'p3',
    type: 'pg',
    text: 'Cermati penggunaan kosakata seperti <i>daring, lanskap digital, belanja online, pengalaman pengguna,</i> dan <i>kompetitor</i> dalam bacaan di atas! Penggunaan kelompok kosakata tersebut menandai keberadaan fenomena …',
    opts: [
      ['A', 'Penurunan tingkat kepercayaan masyarakat terhadap keamanan dan kehalalan produk kosmetik lokal.'],
      ['B', 'Pergeseran pola transaksi dan perilaku konsumsi masyarakat menuju pasar berbasis digital dan internet.'],
      ['C', 'Dominasi sistem perdagangan konvensional yang menuntut perusahaan membuka banyak toko fisik.'],
      ['D', 'Ketidakmampuan Generasi Z dalam memanfaatkan perkembangan teknologi untuk memenuhi kebutuhan harian.'],
      ['E', 'Pemusatan kegiatan industri kosmetik global yang hanya menyasar kelompok konsumen generasi tua.']
    ],
    ans: 'B'
  },
  {
    id: 10,
    p: 'p3',
    type: 'pg',
    text: 'Kerangka pokok pikiran yang paling tepat dan berurutan untuk menggambarkan struktur teks tersebut adalah …',
    opts: [
      ['A', 'P1: Potensi & pertumbuhan pasar kosmetik halal global. P2: Potensi pasar Indonesia & pergeseran belanja daring. P3: Faktor kepuasan konsumen. P4: Karakteristik Generasi Z sebagai target pasar digital.'],
      ['B', 'P1: Peran hukum syariah bagi non-Muslim. P2: Dominasi Indonesia sebagai produsen utama. P3: Promosi media sosial. P4: Rendahnya daya beli Generasi Z.'],
      ['C', 'P1: Pertumbuhan belanja makanan & pariwisata syariah. P2: Dampak negatif internet pada toko fisik. P3: Strategi diskon harga. P4: Loyalitas tinggi Generasi Z.'],
      ['D', 'P1: Teknologi digital untuk efisiensi industri. P2: Peringkat pengguna internet Asia Tenggara. P3: Layanan purna jual. P4: Batasan usia Generasi Z.'],
      ['E', 'P1: Keunggulan bahan baku alami. P2: Hambatan internet dalam transaksi. P3: Perbandingan kepuasan Muslim & non-Muslim. P4: Persaingan memperebutkan tenaga kerja.']
    ],
    ans: 'A'
  },
  {
    id: 11,
    p: 'p4',
    type: 'pg',
    text: 'Penggunaan kata “lipsync” dalam teks menunjukkan adanya kata serapan yang digunakan dalam konteks ....',
    opts: [
      ['A', 'kegiatan seni pertunjukan'],
      ['B', 'kegiatan pembelajaran'],
      ['C', 'kegiatan olahraga'],
      ['D', 'kegiatan kewirausahaan'],
      ['E', 'kegiatan jurnalistik']
    ],
    ans: 'A'
  },
  {
    id: 12,
    p: 'p4',
    type: 'pg',
    text: 'Berdasarkan keseluruhan teks, karakter tokoh Kugy yang paling kuat ditunjukkan melalui tindakan dan perkataannya adalah ....',
    opts: [
      ['A', 'serius dan berhati-hati dalam menyampaikan pengalaman kepada teman-temannya'],
      ['B', 'spontan dan humoris sehingga menganggap hal-hal tidak biasa sebagai sesuatu yang menarik'],
      ['C', 'pemalu dan tertutup sehingga membutuhkan dorongan teman untuk berbicara'],
      ['D', 'kompetitif dan ambisius karena berusaha menunjukkan pengalaman paling menarik'],
      ['E', 'kritis dan tegas karena sering menilai pengalaman teman-temannya']
    ],
    ans: 'B'
  },
  {
    id: 13,
    p: 'p4',
    type: 'pg',
    text: 'Setelah membaca keseluruhan teks, respons emosional yang paling mungkin muncul pada pembaca adalah ....',
    opts: [
      ['A', 'prihatin karena tokoh-tokohnya mengalami tekanan dalam hubungan pertemanan'],
      ['B', 'tegang karena percakapan para tokoh mengarah pada pertentangan yang serius'],
      ['C', 'terhibur karena interaksi para tokoh memperlihatkan keakraban, spontanitas, dan humor'],
      ['D', 'kecewa karena pengalaman tokoh-tokohnya tidak mendapatkan penghargaan dari lingkungan'],
      ['E', 'khawatir karena tokoh-tokohnya menghadapi situasi yang berpotensi menimbulkan masalah']
    ],
    ans: 'C'
  },
  {
    id: 14,
    p: 'p4',
    type: 'pg',
    text: 'Peristiwa lipsync Keenan yang membuat seluruh warga sekolah ikut berjoget paling relevan dengan kehidupan sehari-hari apabila dimaknai sebagai ....',
    opts: [
      ['A', 'kemampuan seseorang sebaiknya disesuaikan dengan harapan orang lain agar memperoleh penerimaan sosial'],
      ['B', 'kemampuan sederhana dapat tetap bernilai ketika digunakan secara percaya diri dan sesuai dengan situasi'],
      ['C', 'keberhasilan seseorang dalam suatu kegiatan terutama ditentukan oleh kemampuan menghibur orang lain'],
      ['D', 'seseorang perlu memilih kemampuan yang berbeda dari orang lain agar memperoleh perhatian lingkungan'],
      ['E', 'apresiasi dari lingkungan merupakan ukuran utama untuk menentukan bernilai atau tidaknya suatu kemampuan']
    ],
    ans: 'B'
  },
  {
    id: 15,
    p: 'p5',
    type: 'pg',
    text: 'Penggunaan kata “moody-an” pada paragraf pertama teks tersebut menunjukkan adanya kata serapan yang digunakan dalam konteks ....',
    opts: [
      ['A', 'fenomena alam dan kondisi cuaca'],
      ['B', 'kondisi psikologis dan emosi seseorang'],
      ['C', 'kegiatan pembelajaran di sekolah'],
      ['D', 'perhubungan dan sarana transportasi'],
      ['E', 'aktivitas pekerjaan dan pertukangan']
    ],
    ans: 'A'
  },
  {
    id: 16,
    p: 'p5',
    type: 'bs',
    text: 'Berdasarkan isi penggalan cerpen "Bahasa Bapak", tentukan apakah simpulan unsur intrinsik dan nilai berikut Benar atau Salah!',
    labels: ['Benar', 'Salah'],
    rows: [
      ['A', 'Simpulan Latar: Peristiwa dalam cerpen terjadi pada waktu subuh di sebuah pemukiman dataran tinggi yang udaranya dingin dan sering diguyur hujan.', 'Benar'],
      ['B', 'Simpulan Konflik: Konflik utama yang dialami Tutun adalah perselisihan dan percekcokan tajam dengan ibunya (Oma Sisa) karena perbedaan pendapat tentang biaya sekolah Wahyu.', 'Salah'],
      ['C', 'Simpulan Nilai Moral: Nilai moral utama dari sosok Tutun adalah pentingnya pengorbanan dan tanggung jawab orang tua dalam memperjuangkan pendidikan anak di tengah keterbatasan ekonomi.', 'Benar']
    ]
  },
  {
    id: 17,
    p: 'p5',
    type: 'pg',
    text: 'Peristiwa dan prinsip hidup tokoh Tutun ("Wahyu tidak boleh berakhir seperti saya, Ma") paling relevan dengan realitas kehidupan sehari-hari masyarakat saat ini, yaitu ...',
    opts: [
      ['A', 'Sikap orang tua di daerah terpencil yang terpaksa membiarkan anak-anaknya bekerja demi membantu perekonomian keluarga.'],
      ['B', 'Perjuangan gigih seorang kepala keluarga dari kalangan kurang mampu yang menaruh harapan besar pada pendidikan demi memutus rantai kemiskinan anaknya.'],
      ['C', 'Kebiasaan masyarakat pedesaan yang menyerahkan seluruh tanggung jawab pengasuhan dan pendidikan anak kepada nenek atau kakek.'],
      ['D', 'Fenomena orang tua yang menuntut anak-anak mereka meraih prestasi akademik tinggi di sekolah tanpa memedulikan kondisi kesehatan anak.'],
      ['E', 'Kecenderungan masyarakat pekerja harian yang lebih memilih memprioritaskan kebutuhan hidup mendesak dibandingkan biaya sekolah anak.']
    ],
    ans: 'B'
  },
  {
    id: 18,
    p: 'p5',
    type: 'mcma',
    text: 'Berdasarkan teks cerpen di atas, manakah pernyataan/bagian teks yang tepat menggambarkan karakter tokoh Tutun sebagai ayah yang bertanggung jawab dan mementingkan pendidikan anak? <i>(Jawaban benar dapat lebih dari satu)</i>',
    opts: [
      ['A', 'Tutun tetap bersiap berangkat bekerja ke Tolinggula walau cuaca subuh sangat dingin dan berisiko hujan.'],
      ['B', 'Tutun melarang Wahyu bersekolah jika hujan turun agar anak tersebut tidak jatuh sakit saat ditinggal.'],
      ['C', 'Tutun berpesan kepada ibunya agar Wahyu tetap diantarkan sekolah menggunakan payung atau bentor jika hari hujan.'],
      ['D', 'Ungkapan "Wahyu tidak boleh berakhir seperti saya, Ma" secara tepat menggambarkan tekad kuat Tutun demi masa depan anaknya.']
    ],
    ans: ['A', 'C', 'D']
  },
  {
    id: 19,
    p: 'p6',
    type: 'mcma',
    text: 'Berdasarkan kutipan drama di atas, pilih dua kosakata teknis sebagai petunjuk fenomena yang dibahas!',
    opts: [
      ['A', 'Drama mengangkat fenomena literasi keuangan.'],
      ['B', 'Drama membahas konflik persahabatan.'],
      ['C', 'Drama menyoroti pentingnya mempertimbangkan layanan perbankan sebelum menabung.'],
      ['D', 'Drama berfokus pada persaingan dunia kerja.'],
      ['E', 'Drama mengangkat masalah lingkungan hidup.']
    ],
    ans: ['A', 'C']
  },
  {
    id: 20,
    p: 'p6',
    type: 'pg',
    text: 'Berdasarkan penyelesaian drama tersebut, simpulan yang paling tepat mengenai respons emosional yang ingin dibangun pengarang kepada pembaca adalah ....',
    opts: [
      ['A', 'Pembaca merasa iba karena Suci belum memiliki tabungan yang cukup untuk memenuhi kebutuhannya.'],
      ['B', 'Pembaca terdorong merasakan optimisme dan keyakinan bahwa kebiasaan kecil yang dilakukan secara disiplin dapat membawa perubahan positif di masa depan.'],
      ['C', 'Pembaca merasa khawatir karena Suci harus memilih produk tabungan yang paling menguntungkan.'],
      ['D', 'Pembaca merasa kecewa karena Pak Bambang hanya memberikan nasihat tanpa bantuan nyata.'],
      ['E', 'Pembaca merasa bingung karena Suci belum menentukan tujuan menabung sejak awal.']
    ],
    ans: 'B'
  },
  {
    id: 21,
    p: 'p6',
    type: 'pg',
    text: 'Berdasarkan perkembangan karakter Suci dan arah percakapan dalam kutipan tersebut, prediksi akhir cerita yang paling logis adalah ...',
    opts: [
      ['A', 'Suci membatalkan rencana menabung karena merasa prosesnya terlalu rumit.'],
      ['B', 'Suci mengikuti saran Pak Bambang dengan mulai menyusun anggaran dan menabung secara rutin demi mencapai tujuan yang telah ditetapkannya.'],
      ['C', 'Pak Bambang membuka rekening tabungan atas nama Suci tanpa melibatkan dirinya.'],
      ['D', 'Suci memutuskan menggunakan seluruh penghasilannya untuk memenuhi kebutuhan sehari-hari tanpa menyisihkan tabungan.'],
      ['E', 'Suci memilih meminjam uang kepada teman-temannya agar tujuan keuangannya lebih cepat tercapai.']
    ],
    ans: 'B'
  },
  {
    id: 22,
    p: 'p7',
    type: 'pg',
    text: 'Kerangka yang paling tepat untuk menggambarkan isi wacana tersebut adalah ....',
    opts: [
      ['A', 'Pengertian pohon – Jenis pohon – Cara menanam pohon – Kesimpulan'],
      ['B', 'Pentingnya pohon – Permasalahan berkurangnya pohon – Peran pohon (penghasil oksigen, menjaga iklim, mencegah banjir dan erosi, habitat makhluk hidup)'],
      ['C', 'Hutan Indonesia – Pemanasan global – Bencana alam – Penutup'],
      ['D', 'Pembangunan kota – Penebangan liar – Reboisasi – Kesimpulan'],
      ['E', 'Lingkungan bersih – Udara sejuk – Hujan – Hewan hutan']
    ],
    ans: 'B'
  },
  {
    id: 23,
    p: 'p7',
    type: 'mcma',
    text: 'Berdasarkan keseluruhan isi wacana, pilih simpulan yang paling tepat mengenai konflik tersirat dan nilai yang ingin disampaikan penulis!',
    opts: [
      ['A', 'Pembangunan dan aktivitas manusia dapat mengurangi jumlah pohon sehingga keseimbangan lingkungan perlu dijaga.'],
      ['B', 'Menjaga keberadaan pohon merupakan wujud tanggung jawab terhadap kelestarian ekosistem.'],
      ['C', 'Pohon hanya diperlukan di kawasan hutan karena lingkungan perkotaan tidak terlalu bergantung pada pepohonan.'],
      ['D', 'Keberadaan pohon hanya bermanfaat bagi hewan yang hidup di hutan.'],
      ['E', 'Cara terbaik menjaga lingkungan adalah menghentikan seluruh pembangunan.']
    ],
    ans: ['A', 'B']
  },
  {
    id: 24,
    p: 'p7',
    type: 'bs',
    text: 'Tentukan apakah setiap pernyataan berikut Benar atau Salah berdasarkan hubungan makna antarkalimat dan antarparagraf pada teks.',
    labels: ['Benar', 'Salah'],
    rows: [
      ['1', 'Paragraf kedua berfungsi sebagai penghubung yang menjelaskan masalah berkurangnya pohon sebelum paragraf-paragraf berikutnya menguraikan dampak dan fungsinya.', 'Benar'],
      ['2', 'Kalimat “Inilah sebabnya mengapa kawasan yang memiliki banyak pepohonan biasanya memiliki udara yang lebih sejuk dan bersih” merupakan bukan akibat dari penjelasan tentang proses fotosintesis pada kalimat sebelumnya.', 'Salah'],
      ['3', 'Hubungan antara paragraf “Menjaga Keseimbangan Iklim” dan “Mencegah Banjir dan Erosi” menunjukkan bahwa kedua paragraf membahas fungsi pohon yang saling melengkapi dalam menjaga lingkungan.', 'Benar'],
      ['4', 'Kalimat “Tanpa pohon, banyak makhluk hidup akan kehilangan tempat tinggal dan sumber makanan mereka” memperkuat gagasan utama paragraf tentang pohon sebagai habitat berbagai makhluk hidup.', 'Benar']
    ]
  },
  {
    id: 25,
    p: 'p7',
    type: 'pg',
    text: 'Seorang editor mengusulkan agar ungkapan "paru-paru bumi" diganti menjadi "organ pernapasan bumi" dengan alasan lebih ilmiah. Penilaian yang paling tepat terhadap usulan tersebut adalah ....',
    opts: [
      ['A', 'Usulan tersebut tepat karena istilah ilmiah selalu lebih efektif daripada ungkapan kiasan dalam semua jenis teks.'],
      ['B', 'Usulan tersebut kurang tepat karena ungkapan "paru-paru bumi" merupakan metafora yang sudah lazim digunakan untuk memperjelas fungsi hutan tanpa mengubah makna objektif teks.'],
      ['C', 'Usulan tersebut tepat karena ungkapan kiasan tidak boleh digunakan dalam teks yang membahas lingkungan.'],
      ['D', 'Usulan tersebut kurang tepat karena frasa "organ pernapasan bumi" memiliki makna yang sama persis dengan istilah ilmiah tentang fotosintesis.'],
      ['E', 'Usulan tersebut tepat karena dapat menghilangkan hubungan antara pembangunan dan berkurangnya jumlah pohon.']
    ],
    ans: 'B'
  },
  {
    id: 26,
    p: 'p8',
    type: 'pg',
    text: 'Susunan bagan langkah-langkah penggunaan APAR yang tepat berdasarkan teks tersebut adalah ....',
    opts: [
      ['A', 'Sembur dari kiri ke kanan → Tekan tuas APAR → Arahkan ujung selang ke api → Tarik pin pengaman'],
      ['B', 'Tekan tuas APAR → Tarik pin pengaman → Arahkan ujung selang ke api → Sapu dari setiap sisi'],
      ['C', 'Sembur dari kiri ke kanan → Tarik pin pengaman → Tekan tuas APAR → Arahkan ujung selang ke api'],
      ['D', 'Tarik pin pengaman → Tekan tuas APAR → Arahkan ujung selang ke api → Sapu dari setiap sisi'],
      ['E', 'Tarik pin pengaman → Arahkan ujung selang ke api → Tekan tuas APAR → Sapu dari setiap sisi']
    ],
    ans: 'E'
  },
  {
    id: 27,
    p: 'p8',
    type: 'bs',
    text: 'Tentukan apakah penilaian mengenai penggunaan bahasa dalam teks tersebut Sesuai atau Tidak Sesuai!',
    labels: ['Sesuai', 'Tidak Sesuai'],
    rows: [
      ['A', 'Penggunaan kata kerja imperatif (seperti tarik, arahkan, tekan) pada judul setiap langkah sudah tepat karena memperjelas instruksi tindakan langsung kepada pembaca.', 'Sesuai'],
      ['B', 'Penggunaan kata sapaan "Anda" pada paragraf pembuka membuat teks menjadi tidak komunikatif dan terlalu informal sehingga menyalahi kaidah teks prosedur baku.', 'Tidak Sesuai'],
      ['C', 'Pencantuman istilah teknis/asing seperti nozzle dan pin pengaman disampaikan secara komunikatif dan disertai padanannya sehingga membantu pemahaman teknis pembaca.', 'Sesuai'],
      ['D', 'Penggunaan konjungsi tujuan dan kausalitas (seperti agar, karena, sehingga) dalam setiap langkah berfungsi memberikan alasan logis di balik instruksi tindakan yang diberikan.', 'Sesuai']
    ]
  },
  {
    id: 28,
    p: 'p9',
    type: 'pg',
    text: 'Pernyataan yang paling tepat dalam menggambarkan kondisi psikologis tokoh "aku" sebagai anak yang mengalami kecemasan mendalam dalam puisi tersebut adalah...',
    opts: [
      ['A', 'Tokoh "aku" merasa gembira karena menemukan cara yang mudah dalam menyelesaikan soal-soal matematika di sekolah.'],
      ['B', 'Tokoh "aku" merasa dendam dan benci kepada bu guru karena selalu memberi nilai yang buruk di dalam rapornya.'],
      ['C', 'Tokoh "aku" mengalami rasa takut untuk pulang ke rumah karena mengasosiasikan pelajaran pengurangan dengan hilangnya anggota keluarga.'],
      ['D', 'Tokoh "aku" merasa bangga atas nasihat yang diberikan papanya untuk menjadi anak yang pandai berhitung.'],
      ['E', 'Tokoh "aku" merasa acuh tak acuh dan tidak peduli lagi terhadap kondisi keutuhan keluarganya di rumah.']
    ],
    ans: 'C'
  },
  {
    id: 29,
    p: 'p9',
    type: 'pg',
    text: 'Suasana dominan yang dibangun oleh penyair pada puisi "Rapor" melalui penggunaan diksi terkait kondisi rumah dan keluarga adalah....',
    opts: [
      ['A', 'Mencekam dan menegangkan akibat amarah tokoh papa di rumah.'],
      ['B', 'Sunyi dan penuh duka akibat kehilangan sosok di dalam keluarga.'],
      ['C', 'Religius dan pasrah dalam menerima takdir dan keputusan Tuhan.'],
      ['D', 'Kecewa dan jengkel atas buruknya sistem pembelajaran di sekolah.'],
      ['E', 'Menakutkan dan horor karena munculnya suara misterius di malam hari.']
    ],
    ans: 'B'
  },
  {
    id: 30,
    p: 'p10',
    type: 'mcma',
    text: 'Berdasarkan dinamika tuturan dan penawaran titik temu dari HRD pada bagian akhir dialog di atas, pilih prediksi respon dialog atau akhir negosiasi yang LOGIS dan SESUAI untuk melengkapi bagian yang rumpang! <i>(Jawaban benar lebih dari satu)</i>',
    opts: [
      ['A', '"Tawaran tersebut sangat menarik dan adil, Bapak. Saya menerima penawaran Rp3.700.000 beserta fasilitas pelatihan dan evaluasi gaji tersebut."'],
      ['B', '"Maaf Bapak, saya tidak dapat menerima penawaran tersebut karena angka Rp3.700.000 masih di bawah estimasi awal saya sebesar Rp4.000.000."'],
      ['C', '"Terima kasih atas penawarannya, Bapak. Opsi tersebut dapat saya terima karena memberikan ruang pengembangan diri melalui pelatihan serta jaminan evaluasi kinerja setelah enam bulan."'],
      ['D', '"Saya setuju, tetapi saya meminta agar evaluasi gaji dilakukan setelah dua minggu bekerja tanpa perlu mengikuti fasilitas pelatihan yang ditawarkan."'],
      ['E', '"Penawaran itu cukup kompromistis, Bapak. Saya menyetujui besaran gaji dan syarat tersebut serta siap memberikan kontribusi terbaik bagi perusahaan."']
    ],
    ans: ['A', 'C', 'E']
  }
];

export function calculateScore(answers: Record<number, any>): { correct: number; total: number; score: number } {
  let correct = 0;
  const total = QUESTIONS.length;

  QUESTIONS.forEach(q => {
    const a = answers[q.id];
    if (a === undefined || a === null) return;

    if (q.type === 'pg') {
      if (a === q.ans) correct++;
    } else if (q.type === 'mcma') {
      if (Array.isArray(a) && a.length === q.ans.length && q.ans.every(x => a.includes(x))) {
        correct++;
      }
    } else if (q.type === 'bs') {
      if (typeof a === 'object' && q.rows.every(r => a[r[0]] === r[2])) {
        correct++;
      }
    }
  });

  const score = Math.round((correct / total) * 1000) / 10;
  return { correct, total, score };
}

export function isQuestionAnswered(q: Question, a: any): boolean {
  if (a === undefined || a === null) return false;
  if (q.type === 'pg') return typeof a === 'string' && a.length > 0;
  if (q.type === 'mcma') return Array.isArray(a) && a.length > 0;
  if (q.type === 'bs') {
    if (!a || typeof a !== 'object') return false;
    return q.rows.every(r => a[r[0]] !== undefined);
  }
  return false;
}
