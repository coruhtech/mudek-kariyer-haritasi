# RTEÜ Bilgisayar Mühendisliği Kariyer Yol Haritası

🎯 **Recep Tayyip Erdoğan Üniversitesi Bilgisayar Mühendisliği öğrencileri için kapsamlı ve interaktif kariyer rehberi**

Bu proje, bilgisayar mühendisliği öğrencilerinin kariyer planlaması yapabilmeleri için geliştirilmiş modern ve kullanıcı dostu bir web uygulamasıdır. Platform, 2020 ve 2024 müfredatlarını analiz ederek öğrencilere kişiselleştirilmiş ders önerileri ve kariyer yönlendirmesi sunar.

## 🌟 Özellikler

### 🚀 Kariyer Keşfi
- **6 Ana Kariyer Yolu**: Yazılım Geliştirme, Siber Güvenlik, Veri Bilimi, Web & Mobil Geliştirme, Yapay Zeka & Makine Öğrenimi, Sistem & Network Yönetimi
- **Detaylı İş Pozisyonları**: Her kariyer yolu için güncel pozisyon bilgileri
- **Beceri Haritası**: Gerekli teknik ve soft skill'ler
- **Sektör Analizi**: İş piyasası trendleri ve maaş bilgileri

### 📚 Akıllı Müfredat Sistemi
- **Çift Müfredat Desteği**: 2020 ve 2024 müfredatlarının karşılaştırmalı analizi
- **Dinamik Ders Eşleştirme**: JSON tabanlı detaylı ders bilgi sistemi
- **Seçmeli Ders Optimizasyonu**: Kariyer hedeflerine uygun seçmeli ders önerileri
- **İlerleme Takibi**: Dönemlik ve yıllık ders planlaması

### 🎯 Kişiselleştirme
- **İlgi Alanı Testi**: Kapsamlı profil oluşturma
- **Akıllı Öneri Sistemi**: AI destekli kariyer ve ders tavsiyeleri
- **Sertifika Rehberi**: Her alan için güncel ve geçerli sertifikalar
- **Kaynak Önerileri**: Kitap, kurs ve eğitim materyalleri

### 💻 Modern Teknoloji Altyapısı
- **Responsive Design**: Tüm cihazlarda optimal deneyim
- **Real-time Updates**: Dinamik içerik güncellemeleri
- **Progressive Web App**: Offline çalışma desteği
- **SEO Optimized**: Arama motoru dostu yapı

## 🛠️ Teknoloji Stack

### Frontend
- **HTML5 & CSS3**: Modern web standartları
- **JavaScript (ES6+)**: Vanilla JS ile performans odaklı geliştirme
- **Bootstrap 5**: Responsive UI framework
- **Chart.js**: Veri görselleştirme ve interaktif grafikler
- **Font Awesome 6**: Modern ikon seti

### Backend
- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Minimal ve esnek web framework
- **CORS**: Cross-origin resource sharing desteği
- **Glob**: Dosya pattern matching
- **Nodemon**: Development ortamı için hot-reload

### Veri Yönetimi
- **JSON**: Yapılandırılmış veri formatı
- **CSV**: Müfredat verilerinin depolanması
- **Dynamic File Loading**: Dosya tabanlı içerik yönetimi

## 📋 Proje Yapısı

```
mudek-kariyer-haritasi/
├── 📁 assets/                      # Statik dosyalar ve görseller
├── 📁 css/                         # Stil dosyaları
│   └── career_map.css              # Ana stil dosyası
├── 📁 js/                          # JavaScript modülleri
│   ├── career_map.js               # Ana uygulama mantığı
│   ├── career_data_loader.js       # Veri yükleme modülü
│   └── course_map_loader.js        # Ders eşleştirme sistemi
├── 📁 data/                        # Veri dosyaları
│   ├── career_paths.json           # Kariyer yolları tanımları
│   ├── career_path_requirements.json # Kariyer gereksinimleri
│   ├── elective_groups.json        # Seçmeli ders grupları
│   ├── 2020_curriculum_courses.csv # 2020 müfredatı
│   └── 2024_curriculum_courses.csv # 2024 müfredatı
├── 📁 2020_2024_course_details_json/ # Detaylı ders bilgileri
├── 📁 career_data/                 # Ek kariyer verileri
├── 📄 index.html                   # Ana sayfa
├── 📄 server.js                    # Express.js sunucusu
├── 📄 package.json                 # Proje konfigürasyonu
└── 📄 README.md                    # Bu dosya
```

## ⚡ Hızlı Başlangıç

### 📥 Kurulum

```bash
# 1. Projeyi bilgisayarınıza indirin
git clone https://github.com/username/mudek-kariyer-haritasi.git
cd mudek-kariyer-haritasi

# 2. Bağımlılıkları yükleyin
npm install

# 3. Geliştirme sunucusunu başlatın
npm run dev

# 4. Tarayıcınızda açın
# http://localhost:3002
```

### 🚀 Üretim Ortamı

```bash
# Üretim modunda çalıştırma
npm start

# Docker ile çalıştırma (opsiyonel)
docker build -t kariyer-haritasi .
docker run -p 3002:3002 kariyer-haritasi
```

## 📖 Kullanım Kılavuzu

### 1. 🎯 Kariyer Keşfi
- Ana sayfada **"Kariyer Yollarını Keşfet"** butonuna tıklayın
- İlginizi çeken kariyer alanını seçin
- Detaylı bilgiler, gerekli beceriler ve sertifikaları inceleyin

### 2. 📚 Müfredat Analizi
- **"Müfredat"** sekmesine gidin
- 2020 ve 2024 müfredatları arasında geçiş yapın
- **"Karşılaştırma"** sekmesinden değişiklikleri görün

### 3. 🎯 Kişisel Tavsiyeler
- **"Kişisel Tavsiyeler"** bölümüne gidin
- İlgi alanlarınızı seçin (en az 3 tane)
- **"Tavsiyeleri Göster"** butonuna tıklayın
- Size özel kariyer yolu ve ders önerilerini görüntüleyin

### 4. 📊 İlerleme Takibi
- Seçtiğiniz dersleri işaretleyin
- Kariyer hedeflerinize olan mesafenizi takip edin
- Sertifika planınızı oluşturun

## 🔧 Geliştirici Kılavuzu

### API Endpoints

```javascript
// Mevcut JSON dosyalarını listele
GET /api/list-course-json-files

// Ders kodu haritasını al
GET /api/course-code-map

// Kariyer verilerini al
GET /data/career_paths.json

// Müfredat verilerini al
GET /data/{year}_curriculum_courses.csv
```

### Veri Formatları

#### Kariyer Yolu Veri Yapısı
```json
{
  "id": "software-development",
  "name": "Yazılım Geliştirme",
  "description": "...",
  "skills": ["Java", "Python", "Git"],
  "certificates": ["Oracle Java", "Microsoft Azure"],
  "jobPositions": ["Junior Developer", "Senior Developer"]
}
```

#### Ders Veri Yapısı
```json
{
  "dersGenel": {
    "dersKodu": "CE101",
    "dersAdi": "Bilgisayar Programlama",
    "mufredatOlusturulmaYili": "2024",
    "dersTuru": "Zorunlu"
  }
}
```

## 📝 Kariyer Haritası Güncelleme Rehberi

Bu bölüm, kariyer haritasına yeni alanlar eklemek, mevcut alanları güncellemek veya kaldırmak için adım adım yönergeleri içerir.

### 🎯 Yeni Kariyer Yolu Ekleme

#### 1. Kariyer Yolu Tanımı Ekleme

**📁 Dosya**: `data/career_paths.json`

```json
{
  "id": "unique-career-id",
  "name": "Kariyer Alanı Adı",
  "icon": "fas fa-icon-name",        // Font Awesome ikonu
  "color": "#hexkod",               // Renk kodu
  "description": "Kariyer alanının detaylı açıklaması...",
  "skills": [                       // Gerekli beceriler
    "Beceri 1",
    "Beceri 2",
    "Beceri 3"
  ],
  "job_titles": [                   // İş pozisyonları
    "Pozisyon 1",
    "Pozisyon 2"
  ],
  "industry_trends": [              // Sektör trendleri
    "Trend 1",
    "Trend 2"
  ],
  "certifications": [               // Sertifikalar
    {
      "name": "Sertifika Adı",
      "organization": "Kuruluş",
      "url": "https://sertifika.url"
    }
  ],
  "core_courses_2020": [            // 2020 müfredatı dersleri
    "CE101", "CE102"
  ],
  "core_courses_2024": [            // 2024 müfredatı dersleri
    "CEN101", "CEN102"
  ]
}
```

#### 2. Kariyer Gereksinimleri Ekleme

**📁 Dosya**: `data/career_path_requirements.json`

```json
{
  "requirements": {
    "2020": {
      "career_pathways": {
        "unique-career-id": {
          "required_courses": ["CE101", "CE102"],
          "recommended_electives": ["CE201", "CE202"],
          "expected_english_percentage": 35.0
        }
      }
    },
    "2024": {
      "career_pathways": {
        "unique-career-id": {
          "required_courses": ["CEN101", "CEN102"],
          "recommended_electives": ["CEN201", "CEN202"],
          "expected_english_percentage": 35.0
        }
      }
    }
  }
}
```

#### 3. Frontend Güncellemesi

**📁 Dosya**: `js/career_map.js`

Gerekli değişiklikler otomatik olarak JSON dosyalarından yüklenecektir. Özel renk veya ikon ayarlaması gerekiyorsa CSS'e ekleyin.

### ✏️ Mevcut Kariyer Yolu Güncelleme

#### Beceri Güncelleme
```json
{
  "id": "existing-career",
  "skills": [
    "Yeni Beceri",      // Ekle
    "Güncel Beceri",    // Güncelle
    // "Eski Beceri"    // Kaldır (yoruma al veya sil)
  ]
}
```

#### Sertifika Güncelleme
```json
{
  "certifications": [
    {
      "name": "Yeni Sertifika 2024",
      "organization": "Güncel Kuruluş",
      "url": "https://yeni.sertifika.url",
      "validity": "3 yıl",              // Opsiyonel
      "difficulty": "Intermediate"       // Opsiyonel
    }
  ]
}
```

### 🗑️ Kariyer Yolu Kaldırma

#### 1. JSON Dosyalarından Kaldırma
- `career_paths.json` dosyasından ilgili kariyer objesi silin
- `career_path_requirements.json` dosyasından gereksinim bilgilerini silin

#### 2. Bağımlılık Kontrolü
```bash
# Kaldırılan kariyer ID'sini diğer dosyalarda arayın
grep -r "kaldırılan-kariyer-id" data/
grep -r "kaldırılan-kariyer-id" js/
```

### 📚 Ders Bilgisi Güncelleme

#### Yeni Ders Ekleme

**📁 Klasör**: `2020_2024_course_details_json/`

```json
{
  "dersGenel": {
    "dersKodu": "CEN999",
    "dersAdi": "Yeni Teknoloji Dersi",
    "dersAdiIngilizce": "New Technology Course",
    "mufredatOlusturulmaYili": "2024",
    "dersTuru": "Seçmeli",
    "secmeliDersKodu": "SECCEN07-1",
    "donem": 7,
    "kredi": 3,
    "teorikSaat": 3,
    "uygulamaSaat": 0,
    "laboratuvarSaat": 0,
    "ects": 6
  },
  "dersIcerigi": {
    "turkceAciklama": "Dersin Türkçe açıklaması...",
    "ingilizceAciklama": "Course description in English...",
    "onKosullar": ["CEN301", "CEN302"],
    "ogrenimCiktilarTurkce": [
      "Öğrenme çıktısı 1",
      "Öğrenme çıktısı 2"
    ],
    "ogrenimCiktilariIngilizce": [
      "Learning outcome 1",
      "Learning outcome 2"
    ]
  },
  "akademikBilgiler": {
    "ogretimUyesi": "Dr. Öğr. Üyesi Adı SOYADI",
    "email": "email@erdogan.edu.tr",
    "ofis": "MMF-XXX",
    "telefon": "+90 464 223 xxxx"
  }
}
```

#### Müfredat CSV Güncelleme

**📁 Dosyalar**: `data/2020_curriculum_courses.csv`, `data/2024_curriculum_courses.csv`

```csv
Dönem,Ders Kodu,Ders Adı,Ders Türü,Kredi,ECTS,T+U+L,Ön Koşul
7,CEN999,Yeni Teknoloji Dersi,Seçmeli,3,6,3+0+0,"CEN301, CEN302"
```

### 🔄 Seçmeli Ders Grupları Güncelleme

**📁 Dosya**: `data/elective_groups.json`

#### Yeni Grup Ekleme
```json
{
  "elective_groups": {
    "SECCEN09-1": {
      "group_name": "Yeni Alan Seçmeli Dersleri",
      "group_description": "9. dönem yeni alan seçmeli dersleri",
      "semester": 9,
      "curriculum_year": "2024",
      "courses": [
        {
          "course_code": "CEN999",
          "course_name": "Yeni Teknoloji Dersi",
          "credits": 3,
          "ects": 6
        }
      ]
    }
  }
}
```

### 🧪 Değişiklikleri Test Etme

#### 1. Veri Doğrulaması
```bash
# JSON dosyalarının geçerliliğini kontrol edin
node -e "console.log(JSON.parse(require('fs').readFileSync('data/career_paths.json')))"
node -e "console.log(JSON.parse(require('fs').readFileSync('data/career_path_requirements.json')))"
```

#### 2. Sunucu Restart
```bash
# Değişiklikleri görmek için sunucuyu yeniden başlatın
npm run dev
```

#### 3. Frontend Testi
- Kariyer yolları sayfasında yeni eklenen alanın göründüğünü kontrol edin
- Ders eşleştirmelerinin doğru çalıştığını test edin
- Kişisel tavsiye algoritmasının çalıştığını onaylayın

### 📊 Veri Tutarlılığı Kontrolleri

#### Zorunlu Kontroller
```javascript
// Ders kodlarının tutarlılığı
const checkCourseConsistency = () => {
  // 2020 ve 2024 müfredatlarında ders kodları
  // career_paths.json ile requirements.json eşleşmesi
  // JSON dosyalarında eksik alan kontrolü
};

// Kariyer ID tutarlılığı
const checkCareerIdConsistency = () => {
  // Tüm dosyalarda aynı ID'lerin kullanılması
  // Özel karakter ve boşluk kontrolü
};
```

### 🚨 Sık Karşılaşılan Hatalar

#### JSON Syntax Hatası
```bash
# Hata: SyntaxError: Unexpected token
# Çözüm: JSON formatını kontrol edin
jsonlint data/career_paths.json
```

#### Ders Kodu Eşleşmeme
```bash
# Hata: Ders bulunamadı
# Çözüm: 2020_2024_course_details_json/ klasöründe dosya var mı kontrol edin
```

#### Müfredat Tutarsızlığı
```bash
# Hata: Müfredat yılı bulunamadı
# Çözüm: mufredatOlusturulmaYili alanını "2020" veya "2024" olarak ayarlayın
```

### 🔐 Backup ve Güvenlik

#### Değişiklik Öncesi Backup
```bash
# Veri dosyalarını yedekleyin
cp -r data/ data_backup_$(date +%Y%m%d)/
cp -r 2020_2024_course_details_json/ course_backup_$(date +%Y%m%d)/
```

#### Git Commit Önerileri
```bash
# Anlamlı commit mesajları kullanın
git add .
git commit -m "feat: Blockchain ve Kripto para kariyer yolu eklendi"
git commit -m "update: Siber güvenlik sertifikaları güncellendi"
git commit -m "fix: CEN301 ders kodu düzeltildi"
```

### 📈 Performans Optimizasyonu

#### Büyük Veri Setleri İçin
- JSON dosyalarını 50KB altında tutun
- Gereksiz nested objeler kullanmayın
- Kurs detay dosyalarını optimize edin

#### Caching Stratejisi
```javascript
// Büyük JSON dosyaları için
localStorage.setItem('career_paths', JSON.stringify(data));
```

---

**💡 İpucu**: Değişiklik yapmadan önce mevcut veri yapısını anlayın ve küçük testlerle başlayın. Büyük değişiklikler için önce development ortamında test edin.

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak için:

1. **Fork** edin (`git checkout -b yeni-ozellik`)
2. **Değişiklik** yapın (`git commit -m 'Yeni özellik: XYZ eklendi'`)
3. **Push** edin (`git push origin yeni-ozellik`)
4. **Pull Request** oluşturun

### 🐛 Hata Bildirimi
- GitHub Issues kullanarak hata bildirebilirsiniz
- Lütfen hata açıklaması, adımlar ve sistem bilgilerini ekleyin

### 💡 Özellik Önerisi
- Yeni özellik önerilerinizi Issues bölümünde paylaşın
- Önerinizin detaylı açıklamasını yapın

## 📊 Proje İstatistikleri

- **Toplam Kod Satırı**: ~15,000+
- **Supported Courses**: 200+ ders
- **Career Paths**: 6 ana alan
- **JSON Files**: 150+ detaylı ders dosyası
- **Curriculum Years**: 2020 & 2024

## 🌐 Tarayıcı Uyumluluğu

| Tarayıcı | Minimum Versiyon | Test Durumu |
|----------|------------------|-------------|
| Chrome   | 90+             | ✅ Destekleniyor |
| Firefox  | 88+             | ✅ Destekleniyor |
| Safari   | 14+             | ✅ Destekleniyor |
| Edge     | 90+             | ✅ Destekleniyor |

## 🔒 Güvenlik

- CORS yapılandırması ile güvenli API erişimi
- XSS koruması ile güvenli içerik rendering
- Input validation ile veri güvenliği

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 Proje Ekibi

- **Dr. Öğr. Üyesi Uğur CORUH**: Proje Yöneticisi ve Ana Geliştirici
- **MUDEK Team**: Proje geliştiricileri  
- **RTEÜ Bilgisayar Mühendisliği**: Akademik danışmanlık

## 📞 İletişim & Destek

### 👨‍💻 Proje Geliştirici
- 📧 **Dr. Öğr. Üyesi Uğur CORUH**: ugur.coruh@erdogan.edu.tr
- 🎓 **Unvan**: RTEÜ Bilgisayar Mühendisliği Bölümü Öğretim Üyesi

### 🏫 RTEÜ Bilgisayar Mühendisliği Bölümü
- 📧 **E-posta**: bilgisayar@erdogan.edu.tr
- 🌐 **Bölüm Web Sitesi**: [RTEÜ Bilgisayar Mühendisliği](https://bilgisayar-mmf.erdogan.edu.tr/)
- 🏢 **Fakülte Web Sitesi**: [Mühendislik ve Mimarlık Fakültesi](https://mmf.erdogan.edu.tr/)
- 📍 **Adres**: Recep Tayyip Erdogan Üniversitesi, Mühendislik ve Mimarlık Fakültesi, Zihni Derin Yerleşkesi – Fener Mahallesi 53100 Merkez/RİZE
- ☎️ **Telefon**: +90 (464) 223 75 18
- 📠 **Faks**: +90 (464) 223 75 18/1602

### 💻 Proje Desteği
- 📱 **GitHub**: Issues bölümünden teknik destek alabilirsiniz
- 📧 **Proje İletişim**: ugur.coruh@erdogan.edu.tr (teknik sorular ve geliştirme için)
- 📧 **Genel Sorular**: bilgisayar@erdogan.edu.tr (bölüm ile ilgili genel sorular için)

### 🎓 MÜDEK Akreditasyonu
Bu proje [MÜDEK (Mühendislik Değerlendirme Kurulu)](https://www.mudek.org.tr/) akreditasyonu kapsamında geliştirilmiştir. RTEÜ Bilgisayar Mühendisliği Bölümü MÜDEK akreditasyonuna sahiptir.

## 🔄 Sürüm Geçmişi

### v1.0.0 (Mevcut)
- ✅ 6 kariyer yolu desteği
- ✅ Çift müfredat analizi
- ✅ Kişiselleştirilmiş öneriler
- ✅ Responsive tasarım
- ✅ JSON tabanlı ders sistemi

### Gelecek Güncellemeler
- 🔄 AI destekli kariyer analizi
- 🔄 Mobil uygulama desteği
- 🔄 Çoklu dil desteği
- 🔄 Sosyal medya entegrasyonu

---

**© 2025 RTEÜ Bilgisayar Mühendisliği Bölümü - MUDEK Projesi**

**👨‍💻 Proje Geliştirici**: Dr. Öğr. Üyesi Uğur CORUH (ugur.coruh@erdogan.edu.tr)

> *"Geleceğin teknoloji liderlerini yetiştirmek için tasarlandı."* 