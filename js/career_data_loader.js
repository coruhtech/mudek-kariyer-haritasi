/**
 * Bilgisayar Mühendisliği Kariyer Haritası - Veri Yükleme Modülü
 * 
 * Bu modül, kariyer haritası için gerekli tüm veri dosyalarını
 * yükleyip işleyerek kullanılabilir JavaScript nesneleri haline getirir.
 */

/**
 * Kariyer haritası veri yükleyici ana nesnesi
 */
const CareerDataLoader = {
    // Yüklenen veri nesneleri
    data: {
        // CSV verilerini saklayacak nesneler
        courses2020: [],
        courses2024: [],
        
        // JSON verilerini saklayacak nesneler
        careerPaths: null,
        electiveGroups: null,
        careerPathRequirements: null
    },
    
    /**
     * Tüm kariyer verilerini yükler
     * @returns {Promise} Veri yükleme işlemi tamamlandığında çözülen Promise
     */
    loadAllData: async function() {
        try {
            console.log("Veri dosyaları yükleniyor...");
            
            // Önce data yolu denesin, sonra career_data, eğer başarısız olursa doğrudan dosya adlarını denesin
            const dataPaths = {
                courses2020: [
                    '/data/2020_curriculum_courses.csv',
                    '/career_data/2020_curriculum_courses.csv',
                    '2020_curriculum_courses.csv'
                ],
                courses2024: [
                    '/data/2024_curriculum_courses.csv', 
                    '/career_data/2024_curriculum_courses.csv',
                    '2024_curriculum_courses.csv'
                ],
                careerPaths: [
                    '/data/career_paths.json', 
                    '/career_data/career_paths.json',
                    'career_paths.json'
                ],
                electiveGroups: [
                    '/data/elective_groups.json', 
                    '/career_data/elective_groups.json',
                    'elective_groups.json'
                ],
                careerPathRequirements: [
                    '/data/career_path_requirements.json', 
                    '/career_data/career_path_requirements.json',
                    'career_path_requirements.json'
                ]
            };
            
            console.log("Dosya yolları:", dataPaths);
            
            // Her dosyayı alternatif yolları deneyerek yüklemeyi dene
            const courses2020 = await this.tryLoadWithAlternatives(dataPaths.courses2020, this.loadCSV.bind(this));
            console.log("2020 müfredatı yüklendi:", courses2020?.length || 0, "ders");
            
            const courses2024 = await this.tryLoadWithAlternatives(dataPaths.courses2024, this.loadCSV.bind(this));
            console.log("2024 müfredatı yüklendi:", courses2024?.length || 0, "ders");
            
            const careerPaths = await this.tryLoadWithAlternatives(dataPaths.careerPaths, this.loadJSON.bind(this));
            console.log("Kariyer yolları yüklendi:", careerPaths?.career_paths?.length || 0, "yol");
            
            const electiveGroups = await this.tryLoadWithAlternatives(dataPaths.electiveGroups, this.loadJSON.bind(this));
            console.log("Seçmeli gruplar yüklendi:", electiveGroups ? "evet" : "hayır");
            
            const careerRequirements = await this.tryLoadWithAlternatives(dataPaths.careerPathRequirements, this.loadJSON.bind(this));
            console.log("Kariyer gereksinimleri yüklendi:", careerRequirements ? "evet" : "hayır");
            
            // Veri doğrulama
            if (!courses2020 || courses2020.length === 0) {
                console.warn("2020 müfredat verisi boş veya yüklenemedi!");
            }
            
            if (!courses2024 || courses2024.length === 0) {
                console.warn("2024 müfredat verisi boş veya yüklenemedi!");
            }
            
            // Yüklenen verileri sakla
            this.data.courses2020 = courses2020 || [];
            this.data.courses2024 = courses2024 || [];
            this.data.careerPaths = careerPaths || { career_paths: [] };
            this.data.electiveGroups = electiveGroups || { elective_groups_2020: [], elective_groups_2024: [] };
            this.data.careerPathRequirements = careerRequirements || { requirements: {} };
            
            // Dönemlere göre ders dağılımını kontrol et
            this.logCoursesDistribution(this.data.courses2020, "2020");
            this.logCoursesDistribution(this.data.courses2024, "2024");
            
            console.log("Tüm kariyer verileri başarıyla yüklendi");
            return this.data;
        } catch (error) {
            console.error("Veri yükleme hatası:", error);
            throw error;
        }
    },
    
    /**
     * Derslerin dönemlere göre dağılımını loglar
     * @param {Array} courses - Dersler dizisi
     * @param {string} label - Log için etiket
     */
    logCoursesDistribution: function(courses, label) {
        if (!courses || !Array.isArray(courses)) {
            console.warn(`${label} müfredatı için ders listesi geçerli değil:`, courses);
            return;
        }
        
        console.log(`${label} müfredatı ders dağılımı (${courses.length} ders):`);
        for (let semester = 1; semester <= 8; semester++) {
            const semesterCourses = courses.filter(
                course => Number(course.Semester) === semester
            );
            console.log(`  Dönem ${semester}: ${semesterCourses.length} ders`);
        }
    },
    
    /**
     * Alternatif yolları deneyerek bir dosyayı yüklemeyi dener
     * @param {Array<string>} pathAlternatives - Denenmesi gereken dosya yolları
     * @param {Function} loadFunction - Yükleme fonksiyonu (loadCSV veya loadJSON)
     * @returns {Promise<any>} Yüklenen veri
     */
    tryLoadWithAlternatives: async function(pathAlternatives, loadFunction) {
        let lastError = null;
        
        for (const path of pathAlternatives) {
            try {
                console.log(`'${path}' yolu deneniyor...`);
                return await loadFunction(path);
            } catch (error) {
                console.log(`'${path}' yolu başarısız, diğer alternatifi deniyorum`);
                lastError = error;
            }
        }
        
        // Tüm alternatifler başarısız olduysa son hatayı fırlat
        throw lastError || new Error("Dosya yüklenemedi ve hata detayı yok");
    },
    
    /**
     * CSV dosyasını yükler ve parse eder
     * @param {string} filePath - CSV dosyasının yolu
     * @returns {Promise<Array>} CSV satırlarını içeren nesne dizisi
     */
    loadCSV: async function(filePath) {
        try {
            console.log(`CSV dosyası yükleniyor: ${filePath}`);
            const response = await fetch(filePath);
            
            if (!response.ok) {
                console.error(`CSV yanıt durumu: ${response.status} ${response.statusText}`);
                throw new Error(`CSV dosyası yüklenemedi: ${filePath} (${response.status} ${response.statusText})`);
            }
            
            const csvText = await response.text();
            console.log(`CSV içeriği yüklendi (${csvText.length} karakter)`);
            return this.parseCSV(csvText);
        } catch (error) {
            console.error(`CSV yükleme hatası (${filePath}):`, error);
            throw error;
        }
    },
    
    /**
     * CSV metnini parse ederek JavaScript nesnelerine dönüştürür
     * @param {string} csvText - CSV içeriği
     * @returns {Array} - Nesne dizisi
     */
    parseCSV: function(csvText) {
        // Satırlara ayır ve başlık satırını al
        const lines = csvText.split('\n');
        
        if (lines.length === 0) {
            console.error("CSV dosyası boş veya geçersiz");
            return [];
        }
        
        const headers = lines[0].split(',').map(header => header.trim());
        console.log("CSV başlıkları:", headers);
        
        // Başlık satırı hariç diğer satırları işle
        const result = lines.slice(1)
            .filter(line => line.trim() !== '') // Boş satırları filtrele
            .map(line => {
                const values = this.parseCSVLine(line);
                const row = {};
                
                // Her bir değeri uygun başlık altında nesneye ekle
                headers.forEach((header, index) => {
                    if (index < values.length) {
                        // Career Paths alanını diziye çevir
                        if (header === 'Career Paths' && values[index]) {
                            row[header] = values[index].split(';');
                        } else {
                            row[header] = values[index];
                        }
                    } else {
                        // Eksik değerler için boş değer ata
                        row[header] = '';
                    }
                });
                
                return row;
            });
            
        console.log(`CSV parse edildi: ${result.length} satır`);
        return result;
    },
    
    /**
     * Tek bir CSV satırını değerlerine ayırır (tırnak içindeki virgülleri de doğru şekilde işler)
     * @param {string} line - CSV satırı
     * @returns {Array} - Değerler dizisi
     */
    parseCSVLine: function(line) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // Son değeri ekle
        values.push(currentValue);
        
        return values;
    },
    
    /**
     * JSON dosyasını yükler ve parse eder
     * @param {string} filePath - JSON dosyasının yolu
     * @returns {Promise<Object>} Parse edilmiş JSON nesnesi
     */
    loadJSON: async function(filePath) {
        try {
            console.log(`JSON dosyası yükleniyor: ${filePath}`);
            const response = await fetch(filePath);
            
            if (!response.ok) {
                console.error(`JSON yanıt durumu: ${response.status} ${response.statusText}`);
                throw new Error(`JSON dosyası yüklenemedi: ${filePath} (${response.status} ${response.statusText})`);
            }
            
            const jsonData = await response.json();
            console.log(`JSON verisi yüklendi: ${Object.keys(jsonData).length} ana öğe`);
            return jsonData;
        } catch (error) {
            console.error(`JSON yükleme hatası (${filePath}):`, error);
            throw error;
        }
    },
    
    /**
     * Belirli bir müfredat için tüm dersleri döndürür
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @returns {Array} - Ders nesneleri dizisi
     */
    getCourses: function(curriculum) {
        if (curriculum === '2020') {
            return this.data.courses2020;
        } else if (curriculum === '2024') {
            return this.data.courses2024;
        } else {
            console.error(`Geçersiz müfredat: ${curriculum}`);
            return [];
        }
    },
    
    /**
     * Belirli bir döneme ait dersleri döndürür
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @param {number} semester - Dönem numarası (1-8)
     * @returns {Array} - Ders nesneleri dizisi
     */
    getCoursesBySemester: function(curriculum, semester) {
        const courses = this.getCourses(curriculum);
        return courses.filter(course => Number(course.Semester) === semester);
    },
    
    /**
     * Belirli bir ders koduna sahip dersi döndürür
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @param {string} courseCode - Ders kodu
     * @returns {Object|null} - Ders nesnesi veya null
     */
    getCourseByCode: function(curriculum, courseCode) {
        const courses = this.getCourses(curriculum);
        return courses.find(course => course['Course Code'] === courseCode) || null;
    },
    
    /**
     * Belirli bir kariyer yoluna ait dersleri döndürür
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @param {string} careerPath - Kariyer yolu kimliği
     * @returns {Array} - Ders nesneleri dizisi
     */
    getCoursesByCareerPath: function(curriculum, careerPath) {
        const courses = this.getCourses(curriculum);
        return courses.filter(course => 
            course['Career Paths'] && 
            course['Career Paths'].includes(careerPath)
        );
    },
    
    /**
     * Tüm kariyer yollarını döndürür
     * @returns {Array} - Kariyer yolu nesneleri dizisi
     */
    getCareerPaths: function() {
        return this.data.careerPaths?.career_paths || [];
    },
    
    /**
     * Belirli bir kariyer yolu kimliğine göre kariyer yolunu döndürür
     * @param {string} careerId - Kariyer yolu kimliği
     * @returns {Object|null} - Kariyer yolu nesnesi veya null
     */
    getCareerPathById: function(careerId) {
        const careerPaths = this.getCareerPaths();
        return careerPaths.find(career => career.id === careerId) || null;
    },
    
    /**
     * Belirli bir müfredat için seçmeli ders gruplarını döndürür
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @returns {Array} - Seçmeli ders grubu nesneleri dizisi
     */
    getElectiveGroups: function(curriculum) {
        if (curriculum === '2020') {
            return this.data.electiveGroups?.elective_groups_2020 || [];
        } else if (curriculum === '2024') {
            return this.data.electiveGroups?.elective_groups_2024 || [];
        } else {
            console.error(`Geçersiz müfredat: ${curriculum}`);
            return [];
        }
    },
    
    /**
     * Belirli bir seçmeli ders grubu ID'sine göre grubu döndürür
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @param {string} groupId - Grup kimliği
     * @returns {Object|null} - Seçmeli ders grubu nesnesi veya null
     */
    getElectiveGroupById: function(curriculum, groupId) {
        const groups = this.getElectiveGroups(curriculum);
        return groups.find(group => group.group_id === groupId) || null;
    },
    
    /**
     * Belirli bir kariyer yolu için gereksinimleri döndürür
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @param {string} careerId - Kariyer yolu kimliği
     * @returns {Object|null} - Kariyer gereksinimleri nesnesi veya null
     */
    getCareerRequirements: function(curriculum, careerId) {
        const requirements = this.data.careerPathRequirements?.requirements;
        if (!requirements || !requirements[curriculum]) {
            console.error(`Geçersiz müfredat veya gereksinimler bulunamadı: ${curriculum}`);
            return null;
        }
        
        const careerPathways = requirements[curriculum].career_pathways;
        return careerPathways[careerId] || null;
    },
    
    /**
     * Kariyer yolları arasındaki ilişkileri döndürür
     * @returns {Array} - Kariyer yolu ilişkileri dizisi
     */
    getCareerPathRelations: function() {
        return this.data.careerPaths?.career_path_relations || [];
    },
    
    /**
     * İki kariyer yolu arasındaki ilişkiyi döndürür
     * @param {string} path1 - İlk kariyer yolu kimliği
     * @param {string} path2 - İkinci kariyer yolu kimliği
     * @returns {Object|null} - Kariyer yolu ilişki nesnesi veya null
     */
    getRelationBetweenPaths: function(path1, path2) {
        const relations = this.getCareerPathRelations();
        
        return relations.find(relation => 
            (relation.path1 === path1 && relation.path2 === path2) ||
            (relation.path1 === path2 && relation.path2 === path1)
        ) || null;
    },
    
    /**
     * Belirli bir kariyer yolu için önerilen dersleri döndürür
     * @param {string} careerId - Kariyer yolu kimliği
     * @param {string} curriculum - Müfredat versiyonu ('2020' veya '2024')
     * @returns {Object} - Önerilen dersler nesnesi
     */
    getRecommendedCourses: function(careerId, curriculum) {
        console.log(`${careerId} kariyer yolu için ${curriculum} müfredatında ders önerileri alınıyor`);
        
        try {
            // Kariyer yolu bilgilerini al
            const careerPath = this.getCareerPathById(careerId);
            if (!careerPath) {
                console.error(`Kariyer yolu bulunamadı: ${careerId}`);
                return { coreCourses: [], recommendedElectives: [] };
            }
            
            // Kariyer gereksinimlerini al
            const requirements = this.getCareerRequirements(curriculum, careerId);
            
            // Gerekli ders kodlarını belirle
            let coreCoursesCodes = [];
            let recommendedElectivesCodes = [];
            
            if (requirements) {
                // Kariyer gereksinimleri varsa onları kullan
                coreCoursesCodes = requirements.required_courses || [];
                recommendedElectivesCodes = requirements.recommended_electives || [];
            } else {
                // Gereksinimler yoksa, kariyer yolundaki temel dersleri kullan
                const coreCoursesProperty = curriculum === '2020' ? 'core_courses_2020' : 'core_courses_2024';
                coreCoursesCodes = careerPath[coreCoursesProperty] || [];
            }
            
            console.log(`Zorunlu dersler: ${coreCoursesCodes.join(', ')}`);
            console.log(`Önerilen seçmeli dersler: ${recommendedElectivesCodes.join(', ')}`);
            
            // Ders nesnelerini al
            const coreCourses = coreCoursesCodes
                .map(code => this.getCourseByCode(curriculum, code))
                .filter(Boolean)
                .map(course => ({
                    code: course['Course Code'],
                    name: course['Course Name'],
                    credits: course.ECTS || 'N/A',
                    semester: course.Semester || 'N/A'
                }));
            
            const recommendedElectives = recommendedElectivesCodes
                .map(code => this.getCourseByCode(curriculum, code))
                .filter(Boolean)
                .map(course => ({
                    code: course['Course Code'],
                    name: course['Course Name'],
                    credits: course.ECTS || 'N/A',
                    semester: course.Semester || 'N/A'
                }));
            
            console.log(`${coreCourses.length} zorunlu ve ${recommendedElectives.length} seçmeli ders bulundu`);
            
            return {
                coreCourses,
                recommendedElectives
            };
        } catch (error) {
            console.error(`Ders önerileri alınırken hata: ${error.message}`, error);
            return { coreCourses: [], recommendedElectives: [] };
        }
    },
    
    /**
     * İlgi alanlarına göre kariyer yolları önerir
     * @param {Array<string>} interests - İlgi alanları listesi
     * @returns {Array} - Önerilen kariyer yolları
     */
    recommendCareerPaths: function(interests) {
        console.log(`İlgi alanlarına göre kariyer yolları öneriliyor: ${interests.join(', ')}`);
        
        try {
            const careerPaths = this.getCareerPaths();
            
            // Her kariyer yolu için bir eşleşme puanı hesapla
            const rankedPaths = careerPaths.map(path => {
                // Kariyer yolunun becerileri ile ilgi alanları arasındaki örtüşmeyi hesapla
                const matchingSkills = path.skills.filter(skill => 
                    interests.some(interest => 
                        skill.toLowerCase().includes(interest.toLowerCase()) || 
                        interest.toLowerCase().includes(skill.toLowerCase())
                    )
                );
                
                // Eşleşme puanı = eşleşen beceri sayısı / toplam beceri sayısı
                const matchScore = matchingSkills.length / Math.max(interests.length, 1);
                
                return {
                    ...path,
                    matchScore,
                    matchingSkills
                };
            });
            
            // Eşleşme puanına göre sırala ve en iyi 3 kariyer yolunu döndür
            return rankedPaths
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 3);
        } catch (error) {
            console.error(`Kariyer yolları önerilirken hata: ${error.message}`, error);
            return [];
        }
    }
};

// Modülü dışa aktar
window.careerDataLoader = CareerDataLoader;