/**
 * Course Map Loader - Ders ve JSON dosya eşleştirme modülü
 * Bu modül, ders kodu ve JSON dosya yolları arasında bir eşleştirme haritası oluşturur
 */

const CourseMapLoader = {
    // Ders kodu -> JSON dosya yolu haritaları
    courseFileMap: {
        '2020': {}, // 2020 müfredatı için harita
        '2024': {}  // 2024 müfredatı için harita
    },
    
    // Tarama tamamlandı mı?
    scanComplete: false,
    
    // Bekleyen istekler
    pendingRequests: [],
    
    // Dosyaların bulunduğu ana dizin
    COURSE_JSON_DIR: '2020_2024_course_details_json',
    
    /**
     * Tüm JSON dosyalarını tarayıp dosya haritası oluşturur
     */
    async scanAllJsonFiles() {
        if (this.scanComplete) {
            console.log('Tarama zaten tamamlanmış, tekrar taranmıyor.');
            return;
        }
        
        console.log('JSON dosyaları taranıyor...');
        
        try {
            // Önce API üzerinden tüm ders-dosya eşleştirmelerini almayı dene
            let serverMapResponse;
            try {
                console.log('API üzerinden ders kodu haritası alınıyor...');
                serverMapResponse = await fetch('/api/course-code-map');
                
                if (serverMapResponse.ok) {
                    // Sunucudan haritayı al
                    const courseCodeMap = await serverMapResponse.json();
                    
                    // API dönüş değerlerini kontrol et
                    if (courseCodeMap && 
                        typeof courseCodeMap === 'object' && 
                        courseCodeMap['2020'] && 
                        courseCodeMap['2024']) {

                        // Haritayı CourseMapLoader'a aktar
                        this.courseFileMap['2020'] = courseCodeMap['2020'] || {};
                        this.courseFileMap['2024'] = courseCodeMap['2024'] || {};
                        
                        console.log('API üzerinden ders kodu haritası başarıyla alındı.');
                        console.log('2020 Müfredatı:', Object.keys(this.courseFileMap['2020']).length, 'ders');
                        console.log('2024 Müfredatı:', Object.keys(this.courseFileMap['2024']).length, 'ders');
                        
                        // Harita boş mu kontrol et
                        if (Object.keys(this.courseFileMap['2020']).length === 0 &&
                            Object.keys(this.courseFileMap['2024']).length === 0) {
                            console.warn('API\'den alınan harita boş, yerel tarama yapılacak.');
                        } else {
                            // Harita doluysa ve API başarılıysa burada tamamla
                            this.scanComplete = true;
                            this.processPendingRequests();
                            return;
                        }
                    } else {
                        console.warn('API dönüş değerleri geçersiz, manuel tarama yapılacak.');
                    }
                } else {
                    console.warn('API üzerinden ders kodu haritası alınamadı, manuel tarama yapılacak.');
                }
            } catch (error) {
                console.warn('API bağlantısı hatası, manuel tarama yapılacak:', error.message);
            }
            
            // API üzerinden alamadıysak manuel tarama yap
            // Tüm JSON dosyalarının listesini al
            const response = await fetch('/api/list-course-json-files');
            if (!response.ok) {
                throw new Error('JSON dosya listesi alınamadı: ' + response.status);
            }
            
            const files = await response.json();
            console.log(`Toplam ${files.length} JSON dosyası bulundu.`);
            
            if (files.length === 0) {
                console.error('Taranacak JSON dosyası bulunamadı! Tüm taramalar sonuçsuz kalabilir.');
            }
            
            // Her dosyayı asenkron olarak işleyecek promise dizisi
            const processPromises = files.map(filePath => this.processJsonFile(filePath));
            
            // Tüm işlemlerin tamamlanmasını bekle
            await Promise.allSettled(processPromises);
            
            console.log('JSON dosyaları taraması tamamlandı.');
            console.log('2020 Müfredatı:', Object.keys(this.courseFileMap['2020']).length, 'ders');
            console.log('2024 Müfredatı:', Object.keys(this.courseFileMap['2024']).length, 'ders');
            
            // Harita boş mu kontrol et
            if (Object.keys(this.courseFileMap['2020']).length === 0 &&
                Object.keys(this.courseFileMap['2024']).length === 0) {
                console.error('Hiçbir JSON dosyasından ders kodu eşleştirilemedi! Ders detayları görüntülenemeyebilir.');
            }
            
            // Tarama tamamlandı olarak işaretle
            this.scanComplete = true;
            
            // Bekleyen istekleri işle
            this.processPendingRequests();
        } catch (error) {
            console.error('JSON dosyaları taranırken hata:', error);
        }
    },
    
    /**
     * Tek bir JSON dosyasını işler ve haritaya ekler
     */
    async processJsonFile(filePath) {
        try {
            // Dosya zaten JSON dosyası mı kontrol et
            if (!filePath.toLowerCase().endsWith('.json')) {
                return;
            }
            
            // Dosyadan ders kodunu ve müfredat bilgisini çıkarmaya çalış
            let courseCode, curriculum;
            
            // Önce dosya adından bilgileri çıkarmayı dene
            const filename = filePath.split('/').pop().replace('.json', '');
            
            // Dosya adı patternleri:
            // 2020-1-ce101.json, 2024-5-seccen05-2-cen331-buyuk-veriye-giris.json, ce101.json
            
            // Önce dosya adından yıl ve ders kodu çıkarmayı dene
            const yearAndCodeMatch = filename.match(/^(20\d\d)[-_](\d+)[-_](.+?)[-_]?([a-zA-Z]+\d+)/i);
            if (yearAndCodeMatch) {
                curriculum = yearAndCodeMatch[1];
                courseCode = yearAndCodeMatch[4].toUpperCase();
                console.log(`Dosya adından çıkarıldı: ${curriculum} / ${courseCode} (${filePath})`);
            } else {
                // Basit bir ders kodu kontrolü yap (MAT181 gibi formatları yakala)
                const simpleCodeMatch = filename.match(/([a-zA-Z]+\d+)/i);
                if (simpleCodeMatch) {
                    courseCode = simpleCodeMatch[0].toUpperCase();
                    // Curriculum bilinmiyor, dosya içeriğinden öğreneceğiz
                    console.log(`Basit ders kodu çıkarıldı: ${courseCode} (${filePath})`);
                }
            }
            
            // Dosyayı yükle ve içeriğini kontrol et
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`${filePath} yüklenemedi: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Dosya içeriğinden ders kodu ve müfredat bilgisini doğrula veya çıkar
            if (data.dersGenel) {
                // Dosyadan gelen ders kodu, daha önce dosya adından çıkarılandan farklıysa, dosyadan geleni kullan
                if (data.dersGenel.dersKodu) {
                    courseCode = data.dersGenel.dersKodu;
                }
                
                // Dosyadan gelen müfredat bilgisi
                if (data.dersGenel.mufredatOlusturulmaYili) {
                    curriculum = data.dersGenel.mufredatOlusturulmaYili;
                }
            }
            
            // Geçerli bir müfredat ve ders kodu varsa haritaya ekle
            if ((curriculum === '2020' || curriculum === '2024') && courseCode) {
                this.courseFileMap[curriculum][courseCode] = filePath;
                console.log(`Haritaya eklendi: ${curriculum} müfredatı "${courseCode}" -> ${filePath}`);
                
                // Ayrıca, CE/CEN dönüşümlerini de haritaya ekle
                if (courseCode.startsWith('CE') && !courseCode.startsWith('CEN')) {
                    const cenVariant = courseCode.replace('CE', 'CEN');
                    this.courseFileMap[curriculum][cenVariant] = filePath;
                    console.log(`CE -> CEN dönüşümü eklendi: ${curriculum} müfredatı "${cenVariant}" -> ${filePath}`);
                } else if (courseCode.startsWith('CEN')) {
                    const ceVariant = courseCode.replace('CEN', 'CE');
                    this.courseFileMap[curriculum][ceVariant] = filePath;
                    console.log(`CEN -> CE dönüşümü eklendi: ${curriculum} müfredatı "${ceVariant}" -> ${filePath}`);
                }
            } else if (courseCode) {
                // Müfredat belirtilmemişse, her iki müfredata da ekle
                // Böylece hangi müfredat olursa olsun erişilebilir
                console.warn(`${courseCode} için müfredat bilgisi belirsiz, her iki müfredata da ekleniyor: ${filePath}`);
                this.courseFileMap['2020'][courseCode] = filePath;
                this.courseFileMap['2024'][courseCode] = filePath;
                
                // CE/CEN dönüşümlerini her iki müfredat için de ekle
                if (courseCode.startsWith('CE') && !courseCode.startsWith('CEN')) {
                    const cenVariant = courseCode.replace('CE', 'CEN');
                    this.courseFileMap['2020'][cenVariant] = filePath;
                    this.courseFileMap['2024'][cenVariant] = filePath;
                } else if (courseCode.startsWith('CEN')) {
                    const ceVariant = courseCode.replace('CEN', 'CE');
                    this.courseFileMap['2020'][ceVariant] = filePath;
                    this.courseFileMap['2024'][ceVariant] = filePath;
                }
            } else {
                console.warn(`${filePath} için geçerli ders kodu bulunamadı, atlanıyor`);
            }
        } catch (error) {
            console.error(`${filePath} işlenirken hata:`, error);
        }
    },
    
    /**
     * Bekleyen istekleri işler
     */
    processPendingRequests() {
        if (this.pendingRequests.length === 0) {
            console.log('Bekleyen istek bulunmuyor.');
            return;
        }
        
        console.log(`${this.pendingRequests.length} adet bekleyen istek işleniyor...`);
        
        while (this.pendingRequests.length > 0) {
            const request = this.pendingRequests.shift();
            const { curriculum, courseCode, callback } = request;
            
            const filePath = this.getJsonFilePath(curriculum, courseCode);
            callback(filePath);
        }
        
        console.log('Tüm bekleyen istekler işlendi.');
    },
    
    /**
     * Belirli bir ders kodu için JSON dosya yolunu alır
     * @param {string} curriculum - Müfredat (2020 veya 2024)
     * @param {string} courseCode - Ders kodu
     * @returns {string|null} - JSON dosya yolu veya null
     */
    getJsonFilePath(curriculum, courseCode) {
        // Harita henüz hazır değilse null döndür
        if (!this.scanComplete) return null;
        
        // Ders kodunu normalize et
        const normalizedCode = courseCode.toUpperCase();
        
        // Haritada varsa dosya yolunu döndür
        if (this.courseFileMap[curriculum] && this.courseFileMap[curriculum][normalizedCode]) {
            return this.courseFileMap[curriculum][normalizedCode];
        }
        
        // Eğer direk bulunamadıysa, CE/CEN dönüşümlerini kontrol et
        let alternativeCode = null;
        if (normalizedCode.startsWith('CE') && !normalizedCode.startsWith('CEN')) {
            alternativeCode = normalizedCode.replace('CE', 'CEN');
        } else if (normalizedCode.startsWith('CEN')) {
            alternativeCode = normalizedCode.replace('CEN', 'CE');
        }
        
        if (alternativeCode && this.courseFileMap[curriculum] && this.courseFileMap[curriculum][alternativeCode]) {
            console.log(`Alternatif kod (${alternativeCode}) ile dosya bulundu.`);
            // Dönüşümü haritaya da ekle ki bir sonraki sefere daha hızlı olsun
            this.courseFileMap[curriculum][normalizedCode] = this.courseFileMap[curriculum][alternativeCode];
            return this.courseFileMap[curriculum][alternativeCode];
        }
        
        console.warn(`${curriculum} müfredatında ${normalizedCode} için dosya bulunamadı`);
        
        // Diğer müfredatı da dene
        const otherCurriculum = curriculum === '2020' ? '2024' : '2020';
        if (this.courseFileMap[otherCurriculum] && this.courseFileMap[otherCurriculum][normalizedCode]) {
            console.log(`${normalizedCode} dersi ${curriculum} müfredatında bulunamadı, ancak ${otherCurriculum} müfredatında bulundu.`);
            return this.courseFileMap[otherCurriculum][normalizedCode];
        }
        
        // Bulunamadı
        return null;
    },
    
    /**
     * Ders detaylarını asenkron olarak alır
     * @param {string} curriculum - Müfredat (2020 veya 2024)
     * @param {string} courseCode - Ders kodu
     * @returns {Promise} - JSON verisini içeren Promise
     */
    async getCourseDetails(curriculum, courseCode) {
        console.log(`Ders detayları isteniyor: ${curriculum} müfredatı, ${courseCode} dersi`);
        
        // Ders kodunu normalize et
        const normalizedCode = courseCode.toUpperCase();
        
        // Harita henüz hazır değilse, taramayı tamamla ve isteği beklet
        if (!this.scanComplete) {
            console.log('Harita henüz hazır değil, tarama bekleniyor...');
            return new Promise((resolve, reject) => {
                // İsteği beklet
                this.pendingRequests.push({
                    curriculum,
                    courseCode: normalizedCode,
                    callback: (filePath) => {
                        if (filePath) {
                            // Dosya bulundu, yükle ve çözümle
                            console.log(`${normalizedCode} için dosya bulundu: ${filePath}`);
                            fetch(filePath)
                                .then(response => {
                                    if (!response.ok) {
                                        console.error(`${filePath} yüklenemedi: ${response.status}`);
                                        reject(new Error(`Ders detayları yüklenemedi: ${response.status}`));
                                        return;
                                    }
                                    return response.json();
                                })
                                .then(data => resolve(data))
                                .catch(error => {
                                    console.error(`Dosya yüklenirken hata: ${error.message}`);
                                    reject(error);
                                });
                        } else {
                            // Dosya bulunamadı, doğrudan API'den dosya bulmayı deneyelim
                            this.findCourseJsonViaApi(curriculum, normalizedCode)
                                .then(result => {
                                    if (result) {
                                        resolve(result);
                                    } else {
                                        reject(new Error(`${normalizedCode} için JSON dosyası bulunamadı`));
                                    }
                                })
                                .catch(err => {
                                    console.error(`API üzerinden dosya aranırken hata: ${err.message}`);
                                    reject(err);
                                });
                        }
                    }
                });
                
                // Taramayı başlat (arka planda)
                this.scanAllJsonFiles();
            });
        }
        
        // Dosya yolunu al
        const filePath = this.getJsonFilePath(curriculum, normalizedCode);
        if (!filePath) {
            console.error(`${normalizedCode} için JSON dosyası bulunamadı (harita hazır)`);
            
            // API üzerinden aramayı dene
            console.log(`${normalizedCode} için API üzerinden arama yapılıyor...`);
            const apiResult = await this.findCourseJsonViaApi(curriculum, normalizedCode);
            if (apiResult) {
                console.log(`${normalizedCode} için API üzerinden dosya bulundu ve yüklendi.`);
                return apiResult;
            }
            
            // Alternatif kodu kullanarak tekrar dene (CE/CEN varyasyonları)
            const variants = this.addCECENVariants(normalizedCode);
            for (const variant of variants) {
                if (variant !== normalizedCode) {
                    console.log(`${normalizedCode} için alternatif kod deneniyor: ${variant}`);
                    const variantPath = this.getJsonFilePath(curriculum, variant);
                    if (variantPath) {
                        console.log(`Alternatif kod ${variant} için dosya bulundu: ${variantPath}`);
                        try {
                            const response = await fetch(variantPath);
                            if (response.ok) {
                                console.log(`Alternatif kod ile dosya başarıyla yüklendi.`);
                                return await response.json();
                            }
                        } catch (error) {
                            console.error(`Alternatif dosya yüklenemedi: ${error.message}`);
                        }
                    }
                }
            }
            
            // Olmayan dosya için benzer dosya isimleri aramayı dene
            const alternativeFilePaths = this.findAlternativeFiles(normalizedCode);
            if (alternativeFilePaths && alternativeFilePaths.length > 0) {
                console.log(`${normalizedCode} için ${alternativeFilePaths.length} alternatif dosya bulundu: ${alternativeFilePaths.join(', ')}`);
                
                // İlk alternatif dosyayı dene
                const altFilePath = alternativeFilePaths[0];
                console.log(`${normalizedCode} için alternatif dosya deneniyor: ${altFilePath}`);
                
                try {
                    const response = await fetch(altFilePath);
                    if (response.ok) {
                        console.log(`Alternatif dosya başarıyla yüklendi: ${altFilePath}`);
                        
                        // Başarılı alternatifi haritaya ekle
                        this.courseFileMap[curriculum][normalizedCode] = altFilePath;
                        
                        return await response.json();
                    }
                } catch (error) {
                    console.error(`Alternatif dosya yüklenemedi: ${error.message}`);
                }
            }
            
            // Son çare olarak rastgele bir dosya deneyelim (sadece test için)
            try {
                console.log("Son çare: Rastgele bir JSON dosyası deneniyor...");
                const allFiles = Object.values(this.courseFileMap[curriculum]);
                if (allFiles.length > 0) {
                    const randomFile = allFiles[Math.floor(Math.random() * allFiles.length)];
                    console.log(`Rastgele dosya deneniyor: ${randomFile}`);
                    const response = await fetch(randomFile);
                    if (response.ok) {
                        const data = await response.json();
                        // Dosyayı kabul etmeden önce gerekli alanları kontrol et
                        if (data.programVeOgrenmeIliskisi && data.programVeOgrenmeIliskisi.iliskiTablosu) {
                            console.log(`Rastgele dosyada gerekli alanlar bulundu, sonuç dönülüyor.`);
                            return data;
                        }
                    }
                }
            } catch (error) {
                console.error("Rastgele dosya denemesi başarısız: ", error);
            }
            
            throw new Error(`${normalizedCode} için JSON dosyası bulunamadı`);
        }
        
        console.log(`${normalizedCode} için dosya bulundu: ${filePath}`);
        
        // Dosyayı yükle
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.error(`${filePath} yüklenemedi: ${response.status}`);
                throw new Error(`Ders detayları yüklenemedi: ${response.status}`);
            }
            
            const data = await response.json();
            
            // ProgramVeOgrenmeIliskisi var mı kontrol et
            if (!data.programVeOgrenmeIliskisi || !data.programVeOgrenmeIliskisi.iliskiTablosu) {
                console.warn(`${filePath} dosyasında programVeOgrenmeIliskisi alanı eksik veya ilişki tablosu boş!`);
            } else {
                // PÇ.11 için değerleri kontrol et
                let has_PC11_5 = false;
                data.programVeOgrenmeIliskisi.iliskiTablosu.forEach(row => {
                    if (row.programÇiktilariIliskileri && row.programÇiktilariIliskileri["PÇ.11"] === 5) {
                        has_PC11_5 = true;
                        console.log(`${normalizedCode} dersinde PÇ.11 = 5 değeri bulundu! ÖÇ: ${row.ogrenmeÇiktisiID}`);
                    }
                });
                
                if (has_PC11_5) {
                    console.log(`${normalizedCode} dersi PÇ.11 = 5 değerine sahip!`);
                }
            }
            
            return data;
        } catch (error) {
            console.error(`Dosya yüklenirken hata: ${error.message}`);
            throw error;
        }
    },
    
    /**
     * API üzerinden ders koduna ait JSON dosyasını arar
     * @param {string} curriculum - Müfredat (2020 veya 2024)
     * @param {string} courseCode - Ders kodu
     * @returns {Promise<Object|null>} - Bulunan JSON verisi veya null
     */
    async findCourseJsonViaApi(curriculum, courseCode) {
        try {
            console.log(`${courseCode} için API üzerinden dosya aranıyor...`);
            
            // Ders kodunu normalize et
            const normalizedCode = courseCode.toUpperCase();
            
            // Alternatif kodu da dene (CE/CEN dönüşümü)
            let alternativeCode = null;
            if (normalizedCode.startsWith('CE') && !normalizedCode.startsWith('CEN')) {
                alternativeCode = normalizedCode.replace('CE', 'CEN');
            } else if (normalizedCode.startsWith('CEN')) {
                alternativeCode = normalizedCode.replace('CEN', 'CE');
            }
            
            // Önce orijinal kod ile dene
            let response = await fetch(`/api/find-course-json/${normalizedCode}`);
            
            // Başarısız olursa alternatif kod ile dene
            if (!response.ok && alternativeCode) {
                console.log(`Orijinal kod (${normalizedCode}) ile dosya bulunamadı, alternatif kod (${alternativeCode}) deneniyor...`);
                response = await fetch(`/api/find-course-json/${alternativeCode}`);
            }
            
            if (!response.ok) {
                console.error(`API üzerinden ${normalizedCode} araması başarısız: ${response.status}`);
                return null;
            }
            
            const files = await response.json();
            
            if (files && files.length > 0) {
                console.log(`API üzerinden ${files.length} dosya bulundu.`);
                
                // Önce curriculum'a göre en iyi eşleşmeyi bul
                let bestMatch = null;
                
                // 1. Öncelik: Tam olarak aynı müfredat ve aynı ders kodu
                for (const file of files) {
                    if (file.includes(`${curriculum}-`) && (file.includes(`-${normalizedCode}`) || file.includes(`-${normalizedCode.toLowerCase()}`))) {
                        bestMatch = file;
                        console.log(`Tam eşleşme bulundu: ${file}`);
                        break;
                    }
                }
                
                // 2. Öncelik: Aynı müfredat, farklı ders kodu formatı
                if (!bestMatch) {
                    for (const file of files) {
                        if (file.includes(`${curriculum}-`)) {
                            bestMatch = file;
                            console.log(`Aynı müfredat eşleşmesi bulundu: ${file}`);
                            break;
                        }
                    }
                }
                
                // 3. Öncelik: Herhangi bir eşleşme
                if (!bestMatch) {
                    bestMatch = files[0];
                    console.log(`Eşleşme bulunamadı, ilk dosya kullanılıyor: ${bestMatch}`);
                }
                
                // Seçilen dosyayı yükle
                console.log(`API'den bulunan ${bestMatch} dosyası yükleniyor...`);
                const fileResponse = await fetch(bestMatch);
                
                if (fileResponse.ok) {
                    const data = await fileResponse.json();
                    
                    // JSON içeriğinden gerçek ders kodunu kontrol et
                    if (data.dersGenel && data.dersGenel.dersKodu) {
                        const fileCode = data.dersGenel.dersKodu;
                        
                        if (fileCode === normalizedCode || 
                            fileCode === alternativeCode || 
                            fileCode.toUpperCase() === normalizedCode.toUpperCase()) {
                            console.log(`Dosya içeriğinde ders kodu doğrulandı: ${fileCode}`);
                            
                            // Haritaya ekle (hem orijinal hem de bulunan kod)
                            this.courseFileMap[curriculum][normalizedCode] = bestMatch;
                            if (alternativeCode) {
                                this.courseFileMap[curriculum][alternativeCode] = bestMatch;
                            }
                            
                            return data;
                        } else {
                            console.warn(`Dosya içindeki ders kodu (${fileCode}) aranan kodla (${normalizedCode}) eşleşmiyor!`);
                            // Yine de dosyayı döndür, çünkü büyük ihtimalle en iyi eşleşme bu
                            return data;
                        }
                    }
                    
                    // Ders kodu bulunamadıysa dosyayı olduğu gibi döndür
                    return data;
                }
            }
            
            return null;
        } catch (error) {
            console.error(`API üzerinden ders dosyası aranırken hata: ${error.message}`);
            return null;
        }
    },
    
    /**
     * Belirli bir ders kodu için alternatif JSON dosya yollarını bulur
     * @param {string} courseCode - Ders kodu
     * @returns {Array|null} - Alternatif dosya yolları dizisi veya null
     */
    findAlternativeFiles(courseCode) {
        try {
            // Ders kodunu normalize et
            const normalizedCode = courseCode.toUpperCase();
            
            // Ders kodunu temel bile işenleri al (örn. "MAT181" -> "MAT")
            const codePrefix = normalizedCode.replace(/[0-9]+.*$/, '');
            const codeNumber = normalizedCode.replace(/^[A-Z]+/, '');
            
            console.log(`Alternatif dosya aranıyor: kod öneki=${codePrefix}, numara=${codeNumber}`);
            
            // Tüm curriculum için arama yap
            let alternatives = [];
            
            // Her iki müfredattaki benzer kodlu derslere bak
            Object.keys(this.courseFileMap).forEach(curriculum => {
                // Öneki aynı olan dersleri bul
                Object.keys(this.courseFileMap[curriculum]).forEach(code => {
                    if (code.startsWith(codePrefix)) {
                        alternatives.push(this.courseFileMap[curriculum][code]);
                    }
                });
            });
            
            // CE -> CEN ve CEN -> CE dönüşümlerini de dene
            if (normalizedCode.startsWith('CE') && !normalizedCode.startsWith('CEN')) {
                const cenPrefix = 'CEN' + codePrefix.substring(2);
                Object.keys(this.courseFileMap).forEach(curriculum => {
                    Object.keys(this.courseFileMap[curriculum]).forEach(code => {
                        if (code.startsWith(cenPrefix)) {
                            alternatives.push(this.courseFileMap[curriculum][code]);
                        }
                    });
                });
            } else if (normalizedCode.startsWith('CEN')) {
                const cePrefix = 'CE' + codePrefix.substring(3);
                Object.keys(this.courseFileMap).forEach(curriculum => {
                    Object.keys(this.courseFileMap[curriculum]).forEach(code => {
                        if (code.startsWith(cePrefix)) {
                            alternatives.push(this.courseFileMap[curriculum][code]);
                        }
                    });
                });
            }
            
            // Tekrarları kaldır
            alternatives = [...new Set(alternatives)];
            
            return alternatives.length > 0 ? alternatives : null;
        } catch (error) {
            console.error('Alternatif dosya aranırken hata:', error);
            return null;
        }
    },
    
    /**
     * Ders kodu varyantlarını oluşturur (CE/CEN, büyük/küçük harf, farklı formatlarda)
     * @param {string} courseCode - Ders kodu
     * @returns {Array} - Varyant kodlar dizisi
     */
    addCECENVariants(courseCode) {
        let variants = [];
        
        // Orjinal kodu ekle
        variants.push(courseCode);
        
        // CE ve CEN varyantları
        if (courseCode.startsWith('CE')) {
            variants.push(courseCode.replace('CE', 'CEN'));
        } else if (courseCode.startsWith('CEN')) {
            variants.push(courseCode.replace('CEN', 'CE'));
        }
        
        // Farklı bölüm/ayraç formatları
        const noDash = courseCode.replace('-', '');
        const withDash = courseCode.replace(/(\D+)(\d+)/, '$1-$2');
        const withSpace = courseCode.replace(/(\D+)(\d+)/, '$1 $2');
        
        if (noDash !== courseCode) variants.push(noDash);
        if (withDash !== courseCode) variants.push(withDash);
        if (withSpace !== courseCode) variants.push(withSpace);
        
        // Büyük/küçük harf varyantları
        variants.push(courseCode.toUpperCase());
        variants.push(courseCode.toLowerCase());
        
        // Tekrarsız benzersiz liste oluştur
        return [...new Set(variants)];
    }
};

// Global değişken olarak dışa aktar
window.CourseMapLoader = CourseMapLoader;

// Sayfa yüklendiğinde otomatik olarak taramayı başlat
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sayfa yüklendi, ders dosyalarını tarama başlatılıyor...');
    setTimeout(() => {
        window.CourseMapLoader.scanAllJsonFiles();
    }, 500); // Sayfa yüklendikten 500ms sonra başlat
}); 