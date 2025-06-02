const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const glob = require('glob');

const app = express();
const PORT = process.env.PORT || 3002;

// CORS ve statik dosyalar için middleware
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// JSON dosya klasörü - sadece 2020_2024_course_details_json kullanılıyor
const COURSE_JSON_DIR = path.join(__dirname, '2020_2024_course_details_json');

// Klasörü kontrol et ve yoksa oluştur
if (!fs.existsSync(COURSE_JSON_DIR)) {
    console.log(`Ders JSON klasörü oluşturuluyor: ${COURSE_JSON_DIR}`);
    fs.mkdirSync(COURSE_JSON_DIR, { recursive: true });
} else {
    console.log(`Ders JSON klasörü mevcut: ${COURSE_JSON_DIR}`);
    try {
        // Windows sistemlerinde glob pattern ile arama yaparken yolu düzelt
        const fixedPattern = path.join(COURSE_JSON_DIR, '**', '*.json').replace(/\\/g, '/');
        const jsonFiles = glob.sync(fixedPattern);
        console.log(`Bu klasörde ${jsonFiles.length} JSON dosyası bulunuyor`);
        
        // İlk dosyayı kontrol et
        if (jsonFiles.length > 0) {
            try {
                const firstFile = fs.readFileSync(jsonFiles[0], 'utf8');
                const parsed = JSON.parse(firstFile);
                if (parsed && parsed.dersGenel && parsed.dersGenel.dersKodu) {
                    console.log(`Örnek dosya: ${jsonFiles[0]}`);
                    console.log(`Örnek ders kodu: ${parsed.dersGenel.dersKodu}`);
                    if (parsed.dersGenel.dersTuru) {
                        console.log(`Örnek ders türü: ${parsed.dersGenel.dersTuru}`);
                    }
                    if (parsed.dersGenel.secmeliDersKodu) {
                        console.log(`Örnek seçmeli ders kodu: ${parsed.dersGenel.secmeliDersKodu}`);
                    }
                }
            } catch (err) {
                console.error(`İlk dosya okuma hatası: ${err.message}`);
            }
        }
    } catch (err) {
        console.error(`JSON dosya sayımı yapılırken hata: ${err.message}`);
    }
}

// Kurs JSON dosyalarını listeleme endpoint'i
app.get('/api/list-course-json-files', (req, res) => {
    try {
        console.log('JSON dosyaları taranıyor...');
        
        // Hem kök dizinde hem alt klasörlerde JSON dosyalarını bul
        // Windows sistemlerinde ** ile arama yaparken normalize et
        const fixedPattern = path.join(COURSE_JSON_DIR, '**', '*.json').replace(/\\/g, '/');
        const dirFiles = glob.sync(fixedPattern);
        
        console.log(`${COURSE_JSON_DIR} klasöründe ${dirFiles.length} JSON dosyası bulundu`);
        
        if (dirFiles.length === 0) {
            console.error('JSON dosyası bulunamadı! Klasör kontrolü yapılmalı.');
            return res.status(404).json({ error: 'JSON dosyası bulunamadı', path: COURSE_JSON_DIR });
        }
        
        // Relative URL'leri döndür
        const fileUrls = dirFiles.map(file => {
            return '/' + path.relative(__dirname, file).replace(/\\/g, '/'); // Windows için path ayarlaması
        });
        
        console.log(`Toplam ${fileUrls.length} JSON dosyası bulundu`);
        res.json(fileUrls);
    } catch (error) {
        console.error('JSON dosyaları taranırken hata:', error);
        res.status(500).json({ error: 'JSON dosyaları listelenirken bir hata oluştu', message: error.message });
    }
});

// Tüm JSON dosyalarının içeriğini kontrol ederek ders kodu eşlemesi yapan endpoint
app.get('/api/course-code-map', async (req, res) => {
    try {
        console.log('Ders kodu haritası oluşturuluyor...');
        const courseCodeMap = {
            '2020': {},
            '2024': {}
        };
        
        // Tüm JSON dosyalarını tara
        // Windows sistemlerinde ** ile arama yaparken normalize et
        const fixedPattern = path.join(COURSE_JSON_DIR, '**', '*.json').replace(/\\/g, '/');
        const allFiles = glob.sync(fixedPattern);
        
        console.log(`${allFiles.length} JSON dosyası taranacak...`);
        
        if (allFiles.length === 0) {
            console.error('JSON dosyası bulunamadı! Klasör kontrolü yapılmalı.');
            return res.status(404).json({ error: 'JSON dosyası bulunamadı', path: COURSE_JSON_DIR });
        }
        
        // Her dosyayı paralel olarak işle
        const filePromises = allFiles.map(async (filePath) => {
            try {
                const fileContent = await fs.promises.readFile(filePath, 'utf8');
                const data = JSON.parse(fileContent);
                
                // Dosya içeriğinden ders kodu ve müfredat yılını çıkar
                if (data.dersGenel) {
                    const relativePath = '/' + path.relative(__dirname, filePath).replace(/\\/g, '/');
                    
                    // Ana ders kodu
                    if (data.dersGenel.dersKodu) {
                        const courseCode = data.dersGenel.dersKodu.toUpperCase();
                        const curriculum = data.dersGenel.mufredatOlusturulmaYili || '';
                        
                        // Seçmeli ders kodu
                        const optionalCourseCode = data.dersGenel.secmeliDersKodu 
                            ? data.dersGenel.secmeliDersKodu.toUpperCase() 
                            : null;
                        
                        // Ders türüne bakalım
                        const courseType = data.dersGenel.dersTuru || '';
                        const isOptional = courseType.toLowerCase().includes('seçmeli');
                        
                        // Curriculum'a göre haritaya ekle
                        if (curriculum === '2020' || curriculum === '2024') {
                            // Ana ders kodu ile ekle
                            courseCodeMap[curriculum][courseCode] = relativePath;
                            console.log(`Eşleşme bulundu: ${curriculum} - ${courseCode} -> ${relativePath}`);
                            
                            // Seçmeli ders kodu varsa onu da ekle
                            if (optionalCourseCode) {
                                courseCodeMap[curriculum][optionalCourseCode] = relativePath;
                                console.log(`Seçmeli ders kodu eklendi: ${curriculum} - ${optionalCourseCode} -> ${relativePath}`);
                            }
                            
                            // CE/CEN dönüşümlerini de ekle
                            app.addCECENVariants(courseCodeMap[curriculum], courseCode, relativePath);
                            
                            // Seçmeli ders kodu için de dönüşüm ekle
                            if (optionalCourseCode) {
                                app.addCECENVariants(courseCodeMap[curriculum], optionalCourseCode, relativePath);
                            }
                        } else {
                            // Curriculum bilinmiyorsa, her iki müfredata da ekle
                            // Bu kesinlikle her iki müfredata da eklenmelidir, çünkü her iki tarafta da görüntülenmesi gerekir
                            courseCodeMap['2020'][courseCode] = relativePath;
                            courseCodeMap['2024'][courseCode] = relativePath;
                            console.log(`Müfredat bilinmiyor, her ikisine de eklendi: ${courseCode} -> ${relativePath}`);
                            
                            // Seçmeli ders kodu varsa her iki müfredata da ekle
                            if (optionalCourseCode) {
                                courseCodeMap['2020'][optionalCourseCode] = relativePath;
                                courseCodeMap['2024'][optionalCourseCode] = relativePath;
                                console.log(`Seçmeli ders kodu her ikisine de eklendi: ${optionalCourseCode} -> ${relativePath}`);
                            }
                            
                            // Her iki müfredat için CE/CEN dönüşümlerini ekle
                            app.addCECENVariants(courseCodeMap['2020'], courseCode, relativePath);
                            app.addCECENVariants(courseCodeMap['2024'], courseCode, relativePath);
                            
                            // Seçmeli ders için de dönüşüm ekle
                            if (optionalCourseCode) {
                                app.addCECENVariants(courseCodeMap['2020'], optionalCourseCode, relativePath);
                                app.addCECENVariants(courseCodeMap['2024'], optionalCourseCode, relativePath);
                            }
                        }
                    } else {
                        console.warn(`${filePath} dosyasında dersGenel.dersKodu alanı bulunamadı`);
                        
                        // Dosya adı formatı analizi
                        const filename = path.basename(filePath, '.json');
                        
                        // Dosya adında ders kodu aramayı dene
                        app.extractCourseCodeFromFilename(filename, courseCodeMap, relativePath);
                    }
                } else {
                    console.warn(`${filePath} dosyasında dersGenel alanı bulunamadı`);
                    
                    // Dosya adı formatı analizi
                    const filename = path.basename(filePath, '.json');
                    
                    // Dosya adında ders kodu aramayı dene
                    app.extractCourseCodeFromFilename(filename, courseCodeMap, relativePath);
                }
            } catch (error) {
                console.error(`${filePath} dosyası işlenirken hata:`, error.message);
            }
        });
        
        // CE/CEN dönüşümlerini haritaya ekleyen yardımcı fonksiyon
        app.addCECENVariants = (map, courseCode, filePath) => {
            if (courseCode.startsWith('CE') && !courseCode.startsWith('CEN')) {
                const alternativeCode = courseCode.replace('CE', 'CEN');
                map[alternativeCode] = filePath;
                console.log(`Alternatif eşleşme eklendi: ${alternativeCode} -> ${filePath}`);
            } else if (courseCode.startsWith('CEN')) {
                const alternativeCode = courseCode.replace('CEN', 'CE');
                map[alternativeCode] = filePath;
                console.log(`Alternatif eşleşme eklendi: ${alternativeCode} -> ${filePath}`);
            }
        };
        
        // Dosya adından ders kodu ve müfredat çıkaran yardımcı fonksiyon
        app.extractCourseCodeFromFilename = (filename, courseCodeMap, filePath) => {
            // 2020-1-ce101.json veya 2024-5-seccen05-2-cen331-buyuk-veriye-giris.json
            const matches = filename.match(/^(20\d\d)[-_]?(\d+)[-_]?([a-zA-Z]+\d+)/i);
            
            if (matches) {
                const curriculum = matches[1]; // 2020 veya 2024
                const courseCode = matches[3].toUpperCase(); // CE101, CEN331 vb.
                
                if ((curriculum === '2020' || curriculum === '2024') && courseCode) {
                    courseCodeMap[curriculum][courseCode] = filePath;
                    console.log(`Dosya adından eşleşme: ${curriculum} - ${courseCode} -> ${filePath}`);
                    
                    // CE/CEN dönüşümlerini ekle
                    app.addCECENVariants(courseCodeMap[curriculum], courseCode, filePath);
                }
            } else {
                // Basit ders kodu kontrolü (MAT181 gibi)
                const simpleMatch = filename.match(/^([a-zA-Z]+\d+)$/i);
                if (simpleMatch) {
                    const courseCode = simpleMatch[1].toUpperCase();
                    
                    // Her iki müfredata da ekle
                    courseCodeMap['2020'][courseCode] = filePath;
                    courseCodeMap['2024'][courseCode] = filePath;
                    console.log(`Basit ders kodu eşleşme: ${courseCode} -> ${filePath}`);
                    
                    // CE/CEN dönüşümlerini her iki müfredata da ekle
                    app.addCECENVariants(courseCodeMap['2020'], courseCode, filePath);
                    app.addCECENVariants(courseCodeMap['2024'], courseCode, filePath);
                }
            }
        };
        
        // Tüm dosya işlemlerinin tamamlanmasını bekle
        await Promise.allSettled(filePromises);
        
        console.log('Ders kodu haritası oluşturuldu:');
        console.log(`2020 müfredatı: ${Object.keys(courseCodeMap['2020']).length} ders`);
        console.log(`2024 müfredatı: ${Object.keys(courseCodeMap['2024']).length} ders`);
        
        res.json(courseCodeMap);
    } catch (error) {
        console.error('Ders kodu haritası oluşturulurken hata:', error);
        res.status(500).json({ error: 'Ders kodu haritası oluşturulurken bir hata oluştu', message: error.message });
    }
});

// Özel ders kodu için JSON arama endpoint'i
app.get('/api/find-course-json/:courseCode', (req, res) => {
    try {
        const courseCode = req.params.courseCode.toUpperCase();
        console.log(`${courseCode} için JSON dosyası aranıyor...`);
        
        // Course code'a göre dosya ara (farklı formatları da dene)
        const variants = [
            courseCode,
            courseCode.replace(/([A-Z]+)(\d+)/, '$1-$2'), // MAT181 -> MAT-181
            courseCode.replace(/([A-Z]+)(\d+)/, '$1 $2'), // MAT181 -> MAT 181
            courseCode.toLowerCase(),                      // MAT181 -> mat181
            courseCode.toUpperCase()                       // mat181 -> MAT181
        ];
        
        // CE/CEN dönüşümlerini de ekle
        if (courseCode.startsWith('CE') && !courseCode.startsWith('CEN')) {
            const cenVariant = courseCode.replace('CE', 'CEN');
            variants.push(cenVariant);
            variants.push(cenVariant.replace(/([A-Z]+)(\d+)/, '$1-$2'));
            variants.push(cenVariant.replace(/([A-Z]+)(\d+)/, '$1 $2'));
        } else if (courseCode.startsWith('CEN')) {
            const ceVariant = courseCode.replace('CEN', 'CE');
            variants.push(ceVariant);
            variants.push(ceVariant.replace(/([A-Z]+)(\d+)/, '$1-$2'));
            variants.push(ceVariant.replace(/([A-Z]+)(\d+)/, '$1 $2'));
        }
        
        console.log(`Aranacak varyasyonlar: ${variants.join(', ')}`);
        
        // Tüm olası JSON dosyalarını bul
        let matchingFiles = [];
        
        console.log(`${COURSE_JSON_DIR} klasöründe arama yapılıyor...`);
        
        // 1. Önce dosya adında ara
        for (const variant of variants) {
            // Dosya adı içinde ders kodunu ara
            const fixedPattern = path.join(COURSE_JSON_DIR, '**', `*${variant}*.json`).replace(/\\/g, '/');
            console.log(`Arama pattern: ${fixedPattern}`);
            
            // Eşleşen dosyaları bul
            const files = glob.sync(fixedPattern);
            matchingFiles = [...matchingFiles, ...files];
        }
        
        // 2. İçerikleri de kontrol ederek ara
        if (matchingFiles.length === 0) {
            console.log("Dosya adında bulunamadı, içeriklerde aranıyor...");
            // Windows sistemlerinde ** ile arama yaparken önce normalize et
            const fixedPattern = path.join(COURSE_JSON_DIR, '**', '*.json').replace(/\\/g, '/');
            const allFiles = glob.sync(fixedPattern);
            
            for (const filePath of allFiles) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const data = JSON.parse(content);
                    
                    if (data.dersGenel) {
                        let match = false;
                        
                        // Ana ders kodu kontrolü
                        if (data.dersGenel.dersKodu) {
                            const fileCode = data.dersGenel.dersKodu.toUpperCase();
                            if (variants.includes(fileCode)) {
                                match = true;
                                console.log(`İçerikte ana ders kodu eşleşmesi: ${fileCode} (${filePath})`);
                            }
                        }
                        
                        // Seçmeli ders kodu kontrolü
                        if (data.dersGenel.secmeliDersKodu) {
                            const optionalCode = data.dersGenel.secmeliDersKodu.toUpperCase();
                            if (variants.includes(optionalCode)) {
                                match = true;
                                console.log(`İçerikte seçmeli ders kodu eşleşmesi: ${optionalCode} (${filePath})`);
                            }
                        }
                        
                        if (match) {
                            matchingFiles.push(filePath);
                        }
                    }
                } catch (err) {
                    console.error(`${filePath} dosyası okunurken hata: ${err.message}`);
                }
            }
        }
        
        // Tekrar eden dosyaları kaldır
        matchingFiles = [...new Set(matchingFiles)];
        
        if (matchingFiles.length > 0) {
            console.log(`${courseCode} için ${matchingFiles.length} dosya bulundu`);
            
            // URL formatına dönüştür
            const fileUrls = matchingFiles.map(file => {
                return '/' + path.relative(__dirname, file).replace(/\\/g, '/');
            });
            
            res.json(fileUrls);
        } else {
            console.log(`${courseCode} için dosya bulunamadı`);
            res.status(404).json({ error: 'Dosya bulunamadı' });
        }
    } catch (error) {
        console.error('Ders JSON dosyası aranırken hata:', error);
        res.status(500).json({ error: 'Ders dosyası aranırken bir hata oluştu', message: error.message });
    }
});

// Sunucuyu başlatma fonksiyonu
const startServer = (port, retryCount = 0) => {
    const MAX_RETRIES = 10; // Maksimum deneme sayısı
    
    // Maksimum deneme sayısını aştıysak, sunucuyu başlatmaktan vazgeç
    if (retryCount >= MAX_RETRIES) {
        console.error(`Sunucu ${MAX_RETRIES} denemeden sonra başlatılamadı.`);
        return;
    }
    
    console.log(`${port} portu deneniyor... (Deneme: ${retryCount + 1}/${MAX_RETRIES})`);
    
    // Sunucuyu oluştur
    const server = app.listen(port)
        .on('listening', () => {
            console.log(`Kariyer Haritası sunucusu çalışıyor: http://localhost:${port}`);
        })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} kullanımda, yeni port deneniyor: ${port + 1}`);
                
                // Mevcut sunucuyu kapat ve yeni port ile dene
                server.close(() => {
                    setTimeout(() => {
                        startServer(port + 1, retryCount + 1);
                    }, 500); // Yarım saniye bekle
                });
            } else {
                console.error('Sunucu başlatılırken beklenmeyen hata:', err);
            }
        });
};

// Sunucuyu başlat
console.log(`Sunucu başlatılıyor, başlangıç portu: ${PORT}`);
startServer(PORT); 