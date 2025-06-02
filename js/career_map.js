/**
 * Bilgisayar Mühendisliği Kariyer Haritası JavaScript Fonksiyonları
 * Bu dosya, kariyer haritalarını interaktif hale getiren tüm işlevleri içerir.
 */

// Genel değişkenler
let currentCurriculum = '2020'; // Varsayılan müfredat
let courseData = {}; // Tüm ders verileri burada saklanacak
let careerPathsData = []; // Kariyer yolları verileri
let electiveGroupsData = {}; // Seçmeli ders grupları verileri
let careerRequirementsData = {}; // Kariyer gereksinimleri verileri

// Müfredat seçimini saklamak için yerel depolama kullanılacak
if (localStorage.getItem('preferredCurriculum')) {
    currentCurriculum = localStorage.getItem('preferredCurriculum');
}

// İlgi alanları listesi
const interestAreas = [
    "Algoritmalar", "Veri Yapıları", "Yazılım Geliştirme", "Web Geliştirme", 
    "Veri Tabanları", "Siber Güvenlik", "Yapay Zeka", "Makine Öğrenimi", 
    "Mobil Uygulama Geliştirme", "Veri Bilimi", "Bulut Bilişim", "DevOps",
    "Ağ Teknolojileri", "Gömülü Sistemler", "IoT", "Oyun Geliştirme",
    "UI/UX Tasarımı", "Büyük Veri", "Blok Zinciri", "Kuantum Hesaplama"
];

// Seçili ilgi alanları
let selectedInterests = [];

/**
 * DOM yüklendikten sonra çalışacak ana fonksiyon
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Tüm veri dosyalarını yükle
    try {
        await loadAllData();
        
        // Kariyer yolu bilgilerinden renk nesnesini oluştur
        initializeCareerColors();
        
        // URL parametrelerine göre müfredatı belirle
        determineCurrentCurriculum();
        
        // UI bileşenlerini başlat
        initializeUI();
    } catch (error) {
        console.error("Kariyer haritası başlatma hatası:", error);
        showErrorMessage("Veri yükleme hatası oluştu. Lütfen sayfayı yenileyin.");
    }
});

/**
 * Tüm veri dosyalarını yükle
 */
async function loadAllData() {
    try {
        // Tüm verileri yükle ve global değişkenlere ata
        const data = await window.careerDataLoader.loadAllData();
        
        console.log("Yüklenen ham veri:", data);
        
        // Veri kontrolü
        if (!data.courses2020 || !data.courses2020.length) {
            console.error("2020 müfredatı verileri yüklenemedi!");
        }
        
        if (!data.courses2024 || !data.courses2024.length) {
            console.error("2024 müfredatı verileri yüklenemedi!");
        }
        
        // Verileri global değişkenlere ata
        courseData = {
            '2020': data.courses2020 || [],
            '2024': data.courses2024 || []
        };
        
        careerPathsData = data.careerPaths?.career_paths || [];
        
        electiveGroupsData = {
            '2020': data.electiveGroups?.elective_groups_2020 || [],
            '2024': data.electiveGroups?.elective_groups_2024 || []
        };
        
        careerRequirementsData = data.careerPathRequirements?.requirements || {};
        
        // Her iki müfredat için de ders sayılarını detaylı logla
        console.log("2020 müfredatı kurs sayısı:", courseData['2020'].length);
        console.log("2024 müfredatı kurs sayısı:", courseData['2024'].length);
        
        // Dönemlere göre ders dağılımlarını kontrol et
        for (let curriculum of ['2020', '2024']) {
            console.log(`${curriculum} müfredatı dönem dağılımı:`);
            for (let semester = 1; semester <= 8; semester++) {
                const semesterCourses = courseData[curriculum].filter(
                    course => Number(course.Semester) === semester
                );
                console.log(`  Dönem ${semester}: ${semesterCourses.length} ders`);
            }
        }
        
        console.log("Veriler başarıyla yüklendi:", {
            courses2020: courseData['2020'].length + " ders",
            courses2024: courseData['2024'].length + " ders",
            careerPaths: careerPathsData.length + " kariyer yolu",
            electiveGroups: {
                '2020': electiveGroupsData['2020'].length + " grup",
                '2024': electiveGroupsData['2024'].length + " grup"
            }
        });
        
        return true;
    } catch (error) {
        console.error("Veri yükleme hatası:", error);
        throw error;
    }
}

/**
 * Kariyer yolları renk nesnesini oluştur
 */
let careerPathColors = {};

function initializeCareerColors() {
    careerPathsData.forEach(path => {
        careerPathColors[path.id] = {
            name: path.name,
            color: path.color,
            icon: path.icon
        };
    });
    
    console.log("Kariyer renkleri hazırlandı:", careerPathColors);
}

/**
 * URL parametrelerine göre müfredatı belirle
 */
function determineCurrentCurriculum() {
    const urlParams = new URLSearchParams(window.location.search);
    const curriculum = urlParams.get('curriculum');
    
    console.log("Müfredat belirleniyor. URL'den:", curriculum);
    console.log("Şu anki müfredat:", currentCurriculum);
    console.log("localStorage'da kayıtlı müfredat:", localStorage.getItem('preferredCurriculum'));
    
    let newCurriculum = currentCurriculum; // Varsayılan olarak mevcut değeri tut
    
    if (curriculum === '2020' || curriculum === '2024') {
        console.log(`URL'den müfredat parametresi bulundu: ${curriculum}`);
        newCurriculum = curriculum;
    } else {
        // URL'den müfredat belirtilmemişse, önce yerel depolamadan kontrol et
        const savedCurriculum = localStorage.getItem('preferredCurriculum');
        if (savedCurriculum === '2020' || savedCurriculum === '2024') {
            console.log(`Kaydedilmiş müfredat bulundu: ${savedCurriculum}`);
            newCurriculum = savedCurriculum;
        } else {
            // Dosya adından anlamaya çalış
        const filename = window.location.pathname.split('/').pop();
        if (filename.includes('2020')) {
                console.log(`Dosya adından müfredat belirlendi: 2020 (${filename})`);
                newCurriculum = '2020';
        } else if (filename.includes('2024')) {
                console.log(`Dosya adından müfredat belirlendi: 2024 (${filename})`);
                newCurriculum = '2024';
            } else {
                console.log(`Dosya adından müfredat belirlenemedi: ${filename}, varsayılan kullanılacak: 2020`);
                newCurriculum = '2020'; // Varsayılan olarak 2020
        }
    }
    }
    
    // Değişiklik varsa güncelle ve kaydet
    if (newCurriculum !== currentCurriculum) {
        console.log(`Müfredat değiştirildi: ${currentCurriculum} -> ${newCurriculum}`);
        currentCurriculum = newCurriculum;
        localStorage.setItem('preferredCurriculum', currentCurriculum);
        
        // courseData içeriğini kontrol et
        console.log(`${currentCurriculum} müfredatı için ders sayısı:`, courseData[currentCurriculum]?.length || 0);
    } else {
        console.log(`Müfredat değişmedi: ${currentCurriculum}`);
    }
    
    // Müfredat seçim düğmelerini güncelle
    updateCurriculumSelectionButtons();
    
    console.log(`Aktif müfredat: ${currentCurriculum}`);
    return currentCurriculum;
}

/**
 * Tüm UI bileşenlerini başlat
 */
function initializeUI() {
    // Kariyer yolu seçicisini ve diğer UI elementlerini hazırla
    initializeCareerPathSelector();
    populateCourseTables();
    initializeCourseTables();
    initializeRoadmapVisualization();
    initializeCareerComparison();
    initializeSearchFilter();
    setupAccordionMemory();
    setupInteractiveElements();
    initializeCourseHighlighting();
    updateElectiveGroups();
    
    // MUDEK analiz panelini oluştur
    initializeMudekAnalysisPanel();
    
    // URL parametrelerine göre seçili kariyer yolunu ayarla
    applyUrlParameters();
    
    // Yükleme göstergesini gizle
    hideLoadingIndicator();
    
    // Geliştirici seçeneklerini ekle (ana ekrandan gizli olarak)
    addDeveloperTools();
}

/**
 * Yükleme göstergesini gizle
 */
function hideLoadingIndicator() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Ana içeriği göster
    const content = document.getElementById('page-content');
    if (content) {
        content.style.display = 'block';
    }
    
    // Müfredat seçim düğmelerini ekle
    addCurriculumSelectionButtons();
}

/**
 * Hata mesajı göster
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger text-center m-3';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${message}`;
    
    // Yükleme göstergesini gizle ve hata mesajını göster
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.display = 'none';
        loader.parentNode.insertBefore(errorDiv, loader.nextSibling);
    } else {
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
}

/**
 * Kariyer yolu seçicisini başlat
 */
function initializeCareerPathSelector() {
    const selector = document.getElementById('careerPathSelect');
    
    if (!selector) return;
    
    // Seçiciyi kariyer yolları ile doldur
    let optionsHtml = '<option value="all">Tüm Dersler</option>';
    
    careerPathsData.forEach(path => {
        optionsHtml += `<option value="${path.id}">${path.name}</option>`;
    });
    
    selector.innerHTML = optionsHtml;
    
    // Seçim değiştiğinde tetiklenecek olay
    selector.addEventListener('change', function() {
        const selectedPath = this.value;
        
        // Seçilen kariyer yolunu URL'e ekle
        const url = new URL(window.location.href);
        url.searchParams.set('career', selectedPath);
        window.history.pushState({}, '', url);
        
        highlightCareerPathCourses(selectedPath);
        updateRoadmapVisualization(selectedPath);
        updateRequiredCoursesList(selectedPath);
        
        // Seçilen kariyer yolu için renk temasını güncelle
        updateColorTheme(selectedPath);
    });
}

/**
 * URL parametrelerine göre seçili kariyer yolunu ayarla
 */
function applyUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const career = urlParams.get('career');
    
    if (career) {
        const selector = document.getElementById('careerPathSelect');
        if (selector && selector.querySelector(`option[value="${career}"]`)) {
            selector.value = career;
            selector.dispatchEvent(new Event('change'));
        }
    }
}

/**
 * Ders tablolarını dönemlik olarak doldur
 */
function populateCourseTables() {
    console.log(`populateCourseTables çağrıldı. Aktif müfredat: ${currentCurriculum}`);
    console.log(`Mevcut dersler:`, courseData[currentCurriculum]?.length || 0);
    
    if (!courseData[currentCurriculum] || courseData[currentCurriculum].length === 0) {
        console.error(`${currentCurriculum} müfredatına ait ders verisi bulunamadı!`);
        return;
    }
    
    // 1-8 dönemleri için tabloları doldur
    for (let semester = 1; semester <= 8; semester++) {
        populateSemesterTable(semester);
    }
    
    console.log(`Tüm dönem tabloları güncellendi.`);
}

/**
 * Belirli bir dönem için ders tablosunu doldur
 */
function populateSemesterTable(semester) {
    const tableContainer = document.getElementById(`semester${semester}`);
    if (!tableContainer) {
        console.log(`semester${semester} için konteyner bulunamadı`);
        return;
    }
    
    // Tablonun tbody elementini bul veya oluştur
    let tableBody = tableContainer.querySelector('.table-course tbody');
    
    if (!tableBody) {
        const table = tableContainer.querySelector('.table-course');
        if (table) {
            tableBody = table.querySelector('tbody');
        } else {
            // Tablo yoksa oluştur
            const newTable = document.createElement('table');
            newTable.className = 'table table-hover table-course';
            newTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Ders Kodu</th>
                        <th>Ders Adı</th>
                        <th>Tür</th>
                        <th>Dil</th>
                        <th>İlgili Kariyer Yolları</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            tableContainer.appendChild(newTable);
            tableBody = newTable.querySelector('tbody');
        }
    }
    
    // İlgili döneme ait dersleri al
    const semesterCourses = courseData[currentCurriculum].filter(
        course => Number(course.Semester) === semester
    );
    
    console.log(`${semester}. dönem dersleri (${currentCurriculum}): ${semesterCourses.length} adet`);
    
    // Tabloyu temizle
    tableBody.innerHTML = '';
    
    // Dersleri tabloya ekle
    semesterCourses.forEach(course => {
        const row = document.createElement('tr');
        
        // Ders türüne göre CSS sınıfı ekle
        const courseTypeClass = course.Type === 'Mandatory' ? 'type-mandatory' : 'type-elective';
        
        // Kariyer yolları badge'leri
        let careerBadges = '';
        if (course['Career Paths'] && course['Career Paths'].length > 0) {
            course['Career Paths'].forEach(pathId => {
                if (careerPathColors[pathId]) {
                    careerBadges += `
                        <span class="path-label" 
                              style="background-color: ${careerPathColors[pathId].color};" 
                              title="${careerPathColors[pathId].name}"></span>
                    `;
                }
            });
        }
        
        row.innerHTML = `
            <td>${course['Course Code']}</td>
            <td>${course['Course Name']}</td>
            <td><span class="course-type ${courseTypeClass}">${course.Type === 'Mandatory' ? 'Zorunlu' : 'Seçmeli'}</span></td>
            <td>${course.Language === 'English' ? 'İngilizce' : 'Türkçe'}</td>
            <td>${careerBadges}</td>
        `;
        
        // Kariyer yolları için CSS sınıfları ekle
        if (course['Career Paths'] && course['Career Paths'].length > 0) {
            course['Career Paths'].forEach(pathId => {
                row.classList.add(`course-${pathId}`);
            });
        }
        
        // Müfredat bilgisini veri özniteliği olarak ekle
        row.setAttribute('data-curriculum', currentCurriculum);
        
        // Satırı tabloya ekle
        tableBody.appendChild(row);
    });
}

/**
 * Ders tablolarını interaktif hale getir
 */
function initializeCourseTables() {
    const tables = document.querySelectorAll('.table-course');
    
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            // Her satıra tıklanabilme özelliği ekle
            row.addEventListener('click', function() {
                const courseCode = this.querySelector('td:first-child').textContent;
                showCourseDetails(courseCode);
            });
            
            // Hover efekti ekle
            row.classList.add('course-row-hover');
        });
    });
}

/**
 * Seçilen kariyer yoluna göre dersleri vurgula
 */
function highlightCareerPathCourses(careerPath) {
    // Tüm ders satırlarını normal hale getir
    const allRows = document.querySelectorAll('.table-course tbody tr');
    allRows.forEach(row => {
        row.classList.remove('table-primary', 'table-success', 'table-warning');
    });
    
    if (careerPath === 'all') return;
    
    // İlgili kariyer yolundaki dersleri vurgula
    const careerRows = document.querySelectorAll(`.course-${careerPath}`);
    careerRows.forEach(row => {
        row.classList.add('table-primary');
    });
    
    // Varsa kariyer gereksinimleri bilgisini al
    const requirements = window.careerDataLoader.getCareerRequirements(currentCurriculum, careerPath);
    if (requirements) {
        // Zorunlu dersler için vurgulama
        if (requirements.required_courses && requirements.required_courses.length > 0) {
            requirements.required_courses.forEach(courseCode => {
                const rows = document.querySelectorAll(`.table-course tbody tr`);
                rows.forEach(row => {
                    const rowCourseCode = row.querySelector('td:first-child').textContent;
                    if (rowCourseCode === courseCode) {
                        row.classList.add('table-success');
                    }
                });
            });
        }
        
        // Önerilen seçmeli dersler için vurgulama
        if (requirements.recommended_electives && requirements.recommended_electives.length > 0) {
            requirements.recommended_electives.forEach(courseCode => {
                const rows = document.querySelectorAll(`.table-course tbody tr`);
                rows.forEach(row => {
                    const rowCourseCode = row.querySelector('td:first-child').textContent;
                    if (rowCourseCode === courseCode) {
                        row.classList.add('table-warning');
                    }
                });
            });
        }
    }
}

/**
 * Ders detaylarını göster
 */
function showCourseDetails(courseCode) {
    console.log(`Ders detayları gösteriliyor: ${courseCode}`);
    
    // Modal elementi yoksa oluştur
    let modal = document.getElementById('courseDetailModal');
    if (!modal) {
        const modalHTML = `
            <div class="modal fade" id="courseDetailModal" tabindex="-1" aria-labelledby="courseDetailModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="course-detail-title"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                        </div>
                        <div class="modal-body">
                            <div id="course-detail-loading" class="text-center p-3">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Yükleniyor...</span>
                                </div>
                                <p class="mt-2">Ders detayları yükleniyor...</p>
                            </div>
                            <div id="course-detail-content" class="d-none">
                                <div class="tab-content" id="course-detail-tab-content">
                                    <!-- Tab içeriği dinamik olarak oluşturulacak -->
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('courseDetailModal');
        console.log("courseDetailModal oluşturuldu");
    }
    
    const modalTitle = modal.querySelector('#course-detail-title');
    const modalBody = modal.querySelector('.modal-body');
    const loadingElement = modal.querySelector('#course-detail-loading');
    const contentElement = modal.querySelector('#course-detail-content');
    
    // Loading göster, content gizle
    loadingElement.classList.remove('d-none');
    contentElement.classList.add('d-none');
    
    // Ders bilgisini CareerDataLoader'dan al
    const course = window.careerDataLoader.getCourseByCode(currentCurriculum, courseCode);
    
    let foundInOtherCurriculum = false;
    let otherCurriculum = currentCurriculum === '2020' ? '2024' : '2020';
    
    // Eğer mevcut müfredatta ders bulunamadıysa, diğer müfredatta arama yap
    if (!course) {
        const otherCourse = window.careerDataLoader.getCourseByCode(otherCurriculum, courseCode);
        if (otherCourse) {
            foundInOtherCurriculum = true;
            
            modalTitle.textContent = `${courseCode}: ${otherCourse['Course Name']}`;
            contentElement.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Bilgi:</strong> Bu ders, ${currentCurriculum} müfredatında bulunamamıştır, ancak ${otherCurriculum} müfredatında mevcuttur. 
                    Aşağıda ${otherCurriculum} müfredatındaki detaylar gösterilmektedir.
                </div>
                <div class="tab-content" id="course-detail-tab-content">
                    <!-- Tab içeriği dinamik olarak oluşturulacak -->
                </div>
            `;
            
            // Modalı göster
            const courseModal = new bootstrap.Modal(modal);
            courseModal.show();
            
            // Her iki müfredatta da json dosyasını arama
            loadCourseDetailWithMapLoader(courseCode, otherCurriculum, modal);
            return;
        }
    }
    
    if (course || foundInOtherCurriculum) {
        // Eğer course bulundu veya diğer müfredatta bulunduysa
        if (!foundInOtherCurriculum) {
        // Modal başlığını ayarla
        modalTitle.textContent = `${courseCode}: ${course['Course Name']}`;
        
        // İlgili kariyer yollarını bul
        const relatedCareerPaths = course['Career Paths'] || [];
        
            // Temel ders özellikleri
            const semester = course.Semester;
            
            // İlgili kariyer yolları vs bilgilerini oluştur
            let careerHtml = '';
            if (relatedCareerPaths.length > 0) {
                careerHtml = '<div class="d-flex flex-wrap gap-2 mb-3">';
                relatedCareerPaths.forEach(pathId => {
                    const careerPath = careerPathColors[pathId];
                    if (careerPath) {
                        careerHtml += `
                            <span class="badge" style="background-color: ${careerPath.color}">
                                <i class="${careerPath.icon}"></i> ${careerPath.name}
                            </span>
                        `;
                    }
                });
                careerHtml += '</div>';
            } else {
                careerHtml = '<p class="text-muted small">Bu ders belirli bir kariyer yoluyla doğrudan ilişkilendirilmemiştir.</p>';
            }
            
            // Tab içeriği için container oluştur
            contentElement.innerHTML = `
                <div class="row mb-3">
                    <div class="col-md-4">
                        <strong>Eğitim Dili:</strong> ${course.Language === 'English' ? 'İngilizce' : 'Türkçe'}
                    </div>
                    <div class="col-md-4">
                        <strong>ECTS:</strong> ${course.ECTS}
                    </div>
                    <div class="col-md-4">
                        <strong>Tür:</strong> ${course.Type === 'Mandatory' ? 'Zorunlu' : 'Seçmeli'}
                    </div>
                </div>
                
                <div class="alert alert-light border">
                    <p class="mb-0 text-center">
                        <i class="fas fa-calendar-day me-2"></i>
                        <strong>Dönem ${semester}</strong> dersidir.
                    </p>
                </div>
                
                <h5>Kariyer Yolları İlişkisi</h5>
                ${careerHtml}
                
                <div class="tab-content" id="course-detail-tab-content">
                    <!-- Tab içeriği dinamik olarak oluşturulacak -->
                </div>
            `;
        }
        
        // Modalı göster
        const courseModal = new bootstrap.Modal(modal);
        courseModal.show();
        
        // Hem mevcut müfredatta hem de diğer müfredatta arayarak ders detaylarını yükle
        // Eğer mevcut müfredatta bulunamazsa, diğer müfredattaki kullanılır
        if (foundInOtherCurriculum) {
            loadCourseDetailWithMapLoader(courseCode, otherCurriculum, modal);
        } else {
            loadCourseDetailWithMapLoader(courseCode, currentCurriculum, modal);
        }
        
    } else {
        // Ders bulunamadı
        modalTitle.textContent = `${courseCode}`;
        contentElement.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Ders bilgisi bulunamadı!</strong>
                </div>
            <p>Bu ders kodu (${courseCode}) mevcut müfredatta (${currentCurriculum}) bulunamadı.</p>
            <p>Bu dosya adı formatında veya 2020_2024_course_details_json klasöründe bu ders koduna ait bir dosya olmayabilir.</p>
            <div class="alert alert-info">
                <p><strong>Öneriler:</strong></p>
                <ul>
                    <li>Müfredatı değiştirerek arama yapmayı deneyebilirsiniz</li>
                    <li>Ders kodunun yazılışını kontrol edebilirsiniz</li>
                    <li>Farklı bir ders seçebilirsiniz</li>
                </ul>
            </div>
        `;
        
        // Loading gizle, content göster
        loadingElement.classList.add('d-none');
        contentElement.classList.remove('d-none');
        
        const courseModal = new bootstrap.Modal(modal);
        courseModal.show();
    }
}

/**
 * Ders detay içeriğini göster (Modal içinde)
 * @param {Object} detailData - Ders detay verileri
 * @param {HTMLElement} modal - Modal element
 */
function showCourseDetailContent(detailData, modal) {
    // Yükleniyor göstergesini gizle ve içerik alanını göster
    const loadingElement = modal.querySelector('#course-detail-loading');
    const contentElement = modal.querySelector('#course-detail-content');
    loadingElement.classList.add('d-none');
    contentElement.classList.remove('d-none');
    
    // Tab içeriğini oluştur
    createTabContent(detailData, modal);
}

/**
 * Tab içeriğini oluştur
 * @param {Object} detailData - Ders detay verileri 
 * @param {HTMLElement} modal - Modal element
 */
function createTabContent(detailData, modal) {
    const tabContentContainer = modal.querySelector('#course-detail-tab-content');
    
    // Ders Genel Bilgileri
    let tabsHTML = `
        <ul class="nav nav-tabs" id="courseDetailTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="general-tab" data-bs-toggle="tab" data-bs-target="#general" type="button" 
                        role="tab" aria-controls="general" aria-selected="true">
                    <i class="fas fa-info-circle me-1"></i> Genel Bilgiler
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="content-tab" data-bs-toggle="tab" data-bs-target="#content" type="button"
                        role="tab" aria-controls="content" aria-selected="false">
                    <i class="fas fa-book me-1"></i> Ders İçeriği
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="learning-tab" data-bs-toggle="tab" data-bs-target="#learning" type="button"
                        role="tab" aria-controls="learning" aria-selected="false">
                    <i class="fas fa-graduation-cap me-1"></i> Öğrenim Çıktıları
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="mudek-tab" data-bs-toggle="tab" data-bs-target="#mudek" type="button"
                        role="tab" aria-controls="mudek" aria-selected="false">
                    <i class="fas fa-table me-1"></i> ÖÇ-PÇ İlişki Matrisi
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="weekly-tab" data-bs-toggle="tab" data-bs-target="#weekly" type="button"
                        role="tab" aria-controls="weekly" aria-selected="false">
                    <i class="fas fa-calendar-week me-1"></i> Haftalık İçerik
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="evaluation-tab" data-bs-toggle="tab" data-bs-target="#evaluation" type="button"
                        role="tab" aria-controls="evaluation" aria-selected="false">
                    <i class="fas fa-clipboard-check me-1"></i> Değerlendirme
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="workload-tab" data-bs-toggle="tab" data-bs-target="#workload" type="button"
                        role="tab" aria-controls="workload" aria-selected="false">
                    <i class="fas fa-tasks me-1"></i> İş Yükü
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="sustainability-tab" data-bs-toggle="tab" data-bs-target="#sustainability" type="button"
                        role="tab" aria-controls="sustainability" aria-selected="false">
                    <i class="fas fa-leaf me-1"></i> Toplumsal Katkı
                </button>
            </li>
        </ul>
        <div class="tab-content border border-top-0 rounded-bottom p-3" id="courseDetailTabContent">
            <!-- Genel Bilgiler Tab -->
            <div class="tab-pane fade show active" id="general" role="tabpanel" aria-labelledby="general-tab">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Ders Kodu:</strong> ${detailData.dersGenel?.dersKodu || 'Belirtilmemiş'}</p>
                        <p><strong>Ders Adı:</strong> ${detailData.dersGenel?.dersAdi || 'Belirtilmemiş'}</p>
                        <p><strong>Ders Türü:</strong> ${detailData.dersGenel?.dersTuru || 'Belirtilmemiş'}</p>
                        <p><strong>Dersin Seviyesi:</strong> ${detailData.dersGenel?.dersinSeviyesi || 'Belirtilmemiş'}</p>
                        <p><strong>AKTS Kredisi:</strong> ${detailData.dersGenel?.dersinAKTSKredisi || 'Belirtilmemiş'}</p>
                        <p><strong>Eğitim Dili:</strong> ${detailData.dersGenel?.egitimDili || 'Belirtilmemiş'}</p>
                        <p><strong>Fakülte:</strong> ${detailData.dersGenel?.fakulte || 'Belirtilmemiş'}</p>
                        <p><strong>Bölüm:</strong> ${detailData.dersGenel?.bolum || 'Belirtilmemiş'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Dönem:</strong> ${detailData.dersGenel?.dersinVerildigiYariyil || 'Belirtilmemiş'}</p>
                        <p><strong>Teorik Saat:</strong> ${detailData.dersGenel?.haftalikDersSaatiKuramsal || '0'}</p>
                        <p><strong>Uygulama Saati:</strong> ${detailData.dersGenel?.haftalikUygulamaSaati || '0'}</p>
                        <p><strong>Lab Saati:</strong> ${detailData.dersGenel?.haftalikLaboratuvarSaati || detailData.dersGenel?.haftalikLaboratuarSaati || '0'}</p>
                        <p><strong>Müfredat Yılı:</strong> ${detailData.dersGenel?.mufredatOlusturulmaYili || 'Belirtilmemiş'}</p>
                        <p><strong>Öğretim Sistemi:</strong> ${detailData.dersGenel?.ogretimSistemi || 'Belirtilmemiş'}</p>
                        <p><strong>Yarıyıl:</strong> ${detailData.dersGenel?.ogretimYiliDonemi || 'Belirtilmemiş'}</p>
                        <p><strong>Ders Kredisi:</strong> ${detailData.dersGenel?.dersKredisi || 'Belirtilmemiş'}</p>
                        ${detailData.dersGenel?.secmeliDersKodu ? `<p><strong>Seçmeli Ders Kodu:</strong> ${detailData.dersGenel.secmeliDersKodu}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- İçerik Tab -->
            <div class="tab-pane fade" id="content" role="tabpanel" aria-labelledby="content-tab">
                ${
                    detailData.dersIcerik ? 
                    `<div class="mb-3">
                        <h6 class="fw-bold">Dersin Amacı</h6>
                        <p>${detailData.dersIcerik.dersinAmaci || 'Belirtilmemiş'}</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="fw-bold">Dersin İçeriği</h6>
                        <p>${detailData.dersIcerik.dersinIcerigi || 'Belirtilmemiş'}</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="fw-bold">Ön Koşul Dersler</h6>
                        <p>${detailData.dersIcerik.dersinOnKosuluOlanDersler || 'Bulunmuyor'}</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="fw-bold">Önerilen Kaynaklar</h6>
                        <p>${detailData.dersIcerik.dersinKitabiMalzemesiOnerilenKaynaklar ? detailData.dersIcerik.dersinKitabiMalzemesiOnerilenKaynaklar.replace(/\n/g, '<br>') : 'Belirtilmemiş'}</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="fw-bold">Önerilen Hususlar</h6>
                        <p>${detailData.dersIcerik.dersinIcinOnerilenHususlar || 'Belirtilmemiş'}</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6 class="fw-bold">Dersi Veren</h6>
                        <p>${detailData.dersIcerik.dersiVerenOgretimUyesiOgretimGorevlisi || 'Belirtilmemiş'}</p>
                    </div>`
                    : '<div class="alert alert-warning">İçerik bilgisi bulunamadı.</div>'
                }
            </div>
            
            <!-- Öğrenim Çıktıları Tab -->
            <div class="tab-pane fade" id="learning" role="tabpanel" aria-labelledby="learning-tab">
                ${
                    (detailData.ogrenimCiktilari && detailData.ogrenimCiktilari.length > 0) || 
                    (detailData.dersOgrenmeÇiktilari && detailData.dersOgrenmeÇiktilari.length > 0) ?
                    `<ol class="list-group list-group-numbered">
                        ${(detailData.ogrenimCiktilari || detailData.dersOgrenmeÇiktilari || []).map(cikti => 
                            `<li class="list-group-item">${cikti.cikti || cikti.aciklama}</li>`
                        ).join('')}
                    </ol>` 
                    : '<div class="alert alert-warning">Öğrenim çıktısı bilgisi bulunamadı.</div>'
                }
            </div>
            
            <!-- ÖÇ-PÇ İlişki Matrisi Tab -->
            <div class="tab-pane fade" id="mudek" role="tabpanel" aria-labelledby="mudek-tab">
                ${
                    detailData.programVeOgrenmeIliskisi ?
                    `<div class="mb-3">
                    <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>İlişki Ölçekleri:</strong> ${detailData.programVeOgrenmeIliskisi.iliskiOlcekleri || '0-5 arası değerler (0: İlişki yok, 5: Çok güçlü ilişki)'}
                    </div>
                    </div>
                    
                    <div class="table-responsive mb-4">
                        <table class="table table-bordered table-sm mudek-matrix">
                            <thead class="table-light">
                                <tr>
                                    <th>Öğrenim Çıktısı</th>
                                    ${Object.keys(detailData.programVeOgrenmeIliskisi.iliskiTablosu[0]?.programÇiktilariIliskileri || {}).map(pc => 
                                        `<th class="text-center">${pc}</th>`
                                    ).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${detailData.programVeOgrenmeIliskisi.iliskiTablosu.map(row => 
                                    `<tr>
                                        <td>${row.ogrenmeÇiktisiID}</td>
                                        ${Object.entries(row.programÇiktilariIliskileri).map(([pc, value]) => {
                                            let cellClass = '';
                                            if (value >= 4) {
                                                cellClass = 'bg-success text-white';
                                            } else if (value >= 2) {
                                                cellClass = 'bg-info text-dark';
                                            } else if (value >= 1) {
                                                cellClass = 'bg-warning text-dark';
            } else {
                                                cellClass = 'bg-light text-muted';
                                            }
                                            return `<td class="text-center ${cellClass}">${value}</td>`;
                                        }).join('')}
                                    </tr>`
                                ).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div id="ocPcRadarChart" style="height: 300px;"></div>
                        </div>
                        <div class="col-md-6">
                            <div id="pcCoverageChart" style="height: 300px;"></div>
                        </div>
                    </div>
                    
                    <h6 class="mt-4 mb-3">Program Çıktıları Açıklamaları</h6>
                    <div class="accordion" id="programOutcomesAccordion">
                        ${
                            (detailData.programCiktilari && detailData.programCiktilari.length > 0) ?
                            detailData.programCiktilari.map((pc, index) => 
                                `<div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#pc-collapse-${index}">
                                            ${pc.id}: ${pc.kategori}
                                        </button>
                                    </h2>
                                    <div id="pc-collapse-${index}" class="accordion-collapse collapse" data-bs-parent="#programOutcomesAccordion">
                                        <div class="accordion-body">
                                            ${pc.aciklama}
                                        </div>
                                    </div>
                                </div>`
                            ).join('')
                            : '<div class="alert alert-warning">Program çıktıları açıklamaları bulunamadı.</div>'
                        }
                    </div>`
                    : '<div class="alert alert-warning">ÖÇ-PÇ İlişki matrisi bilgisi bulunamadı.</div>'
                }
            </div>
            
            <!-- Haftalık İçerik Tab -->
            <div class="tab-pane fade" id="weekly" role="tabpanel" aria-labelledby="weekly-tab">
                ${
                    (detailData.haftalikDersIcerikleri && detailData.haftalikDersIcerikleri.length > 0) ?
                    `<div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Hafta</th>
                                    <th>İçerik</th>
                                    <th>İlgili Çıktılar</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detailData.haftalikDersIcerikleri.map(hafta => 
                                    `<tr>
                                        <td>${hafta.hafta}</td>
                                        <td>${hafta.icerik}</td>
                                        <td>${hafta.iliskiliOgrenmeÇiktisi || ''}</td>
                                    </tr>`
                                ).join('')}
                            </tbody>
                        </table>
                    </div>`
                    : '<div class="alert alert-warning">Haftalık ders içerikleri bulunamadı.</div>'
                }
            </div>
            
            <!-- Değerlendirme Tab -->
            <div class="tab-pane fade" id="evaluation" role="tabpanel" aria-labelledby="evaluation-tab">
                ${
                    detailData.dersDegerlendirme ?
                    `<div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Yarıyıl İçi Etkinlikleri</h6>
                        </div>
                        <div class="card-body">
                <div class="table-responsive">
                                <table class="table table-striped">
                        <thead>
                            <tr>
                                            <th>Etkinlik</th>
                                            <th>Sayı</th>
                                            <th>Katkı Yüzdesi</th>
                            </tr>
                        </thead>
                        <tbody>
                                        ${detailData.dersDegerlendirme.yariyilIciEtkinlikleri ? 
                                            detailData.dersDegerlendirme.yariyilIciEtkinlikleri.map(item => 
                                            `<tr>
                                                <td>${item.etkinlik}</td>
                                                <td class="text-center">${item.sayi}</td>
                                                <td class="text-center">%${item.katkiYuzdesi}</td>
                                            </tr>`
                                        ).join('') : '<tr><td colspan="3" class="text-center">Yarıyıl içi etkinlik bilgisi bulunamadı.</td></tr>'}
                                    </tbody>
                                    <tfoot class="table-secondary">
                                        <tr>
                                            <th colspan="2" class="text-end">Toplam:</th>
                                            <th class="text-center">%${detailData.dersDegerlendirme.yariyilIciToplam || 0}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Yarıyıl Sonu Etkinlikleri</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Etkinlik</th>
                                            <th>Sayı</th>
                                            <th>Katkı Yüzdesi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${detailData.dersDegerlendirme.yariyilSonuEtkinlikleri ? 
                                            detailData.dersDegerlendirme.yariyilSonuEtkinlikleri.map(item => 
                                            `<tr>
                                                <td>${item.etkinlik}</td>
                                                <td class="text-center">${item.sayi}</td>
                                                <td class="text-center">%${item.katkiYuzdesi}</td>
                                            </tr>`
                                        ).join('') : '<tr><td colspan="3" class="text-center">Yarıyıl sonu etkinlik bilgisi bulunamadı.</td></tr>'}
                                    </tbody>
                                    <tfoot class="table-secondary">
                                        <tr>
                                            <th colspan="2" class="text-end">Toplam:</th>
                                            <th class="text-center">%${detailData.dersDegerlendirme.yariyilSonuToplam || 0}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Genel Değerlendirme</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Değerlendirme</th>
                                            <th>Katkı Yüzdesi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${detailData.dersDegerlendirme.genelDegerlendirme ? 
                                            detailData.dersDegerlendirme.genelDegerlendirme.map(item => 
                                            `<tr>
                                                <td>${item.degerlendirme}</td>
                                                <td class="text-center">%${item.katkiYuzdesi}</td>
                                            </tr>`
                                        ).join('') : '<tr><td colspan="2" class="text-center">Genel değerlendirme bilgisi bulunamadı.</td></tr>'}
                                    </tbody>
                                    <tfoot class="table-secondary">
                                        <tr>
                                            <th class="text-end">Toplam:</th>
                                            <th class="text-center">%${detailData.dersDegerlendirme.genelDegerlendirmeToplam || 0}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>`
                    : '<div class="alert alert-warning">Değerlendirme bilgisi bulunamadı.</div>'
                }
            </div>
            
            <!-- İş Yükü Tab -->
            <div class="tab-pane fade" id="workload" role="tabpanel" aria-labelledby="workload-tab">
                ${
                    detailData.dersIsYuku ?
                    `<div class="card mb-4">
                        <div class="card-header bg-light">
                            <h6 class="mb-0">Ders İş Yükü Dağılımı</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Etkinlik</th>
                                            <th>Sayısı</th>
                                            <th>Süresi (Saat)</th>
                                            <th>Toplam İş Yükü</th>
                    </tr>
                                    </thead>
                                    <tbody>
                                        ${detailData.dersIsYuku.etkinlikler ? 
                                            detailData.dersIsYuku.etkinlikler.map(item => 
                                            `<tr>
                                                <td>${item.etkinlik}</td>
                                                <td class="text-center">${item.sayi}</td>
                                                <td class="text-center">${item.sure}</td>
                                                <td class="text-center">${item.toplamIsYuku}</td>
                                            </tr>`
                                        ).join('') : 
                                        Object.entries(detailData.dersIsYuku).filter(([key, value]) => 
                                            typeof value === 'object' && value !== null && !Array.isArray(value) && key !== 'etkinlikler'
                                        ).map(([key, value]) => 
                                            `<tr>
                                                <td>${key}</td>
                                                <td class="text-center">${value.sayi || '-'}</td>
                                                <td class="text-center">${value.sure || '-'}</td>
                                                <td class="text-center">${(value.sayi && value.sure) ? (value.sayi * value.sure) : '-'}</td>
                                            </tr>`
                                        ).join('')}
                        </tbody>
                                    <tfoot class="table-secondary">
                                        <tr>
                                            <th colspan="3" class="text-end">Toplam AKTS İş Yükü:</th>
                                            <th class="text-center">${detailData.dersIsYuku.toplamIsYuku || 
                                                Object.values(detailData.dersIsYuku)
                                                    .filter(value => typeof value === 'object' && value !== null)
                                                    .reduce((total, item) => {
                                                        return total + ((item.sayi && item.sure) ? (item.sayi * item.sure) : 0);
                                                    }, 0)} saat</th>
                                        </tr>
                                    </tfoot>
                    </table>
                            </div>
                            <div class="alert alert-info mt-3">
                                <p class="mb-0"><strong>AKTS Kredisi:</strong> ${detailData.dersIsYuku.dersAKTSKredisi || detailData.dersGenel?.dersinAKTSKredisi || '?'}</p>
                                <p class="mb-0"><strong>Hesaplama:</strong> ${detailData.dersIsYuku.hesaplama || "Toplam İş Yükü (Saat) / 25"}</p>
                            </div>
                        </div>
                    </div>`
                    : '<div class="alert alert-warning">İş yükü bilgisi bulunamadı.</div>'
                }
            </div>
            
            <!-- Sürdürülebilirlik Tab -->
            <div class="tab-pane fade" id="sustainability" role="tabpanel" aria-labelledby="sustainability-tab">
                ${
                    detailData.toplumsalKatkiVeSurdurulebilirlik ?
                    `<div class="row">
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0"><i class="fas fa-leaf me-2"></i> Sürdürülebilir Kalkınma Amaçları</h5>
                                </div>
                                <div class="card-body">
                                    <ul class="list-group">
                                    ${
                                        detailData.toplumsalKatkiVeSurdurulebilirlik.surdurulebilirKalkinmaAmaclari && 
                                        detailData.toplumsalKatkiVeSurdurulebilirlik.surdurulebilirKalkinmaAmaclari.length > 0 ?
                                        detailData.toplumsalKatkiVeSurdurulebilirlik.surdurulebilirKalkinmaAmaclari.map(item => 
                                            item.secili ?
                                            `<li class="list-group-item d-flex align-items-center">
                                                <span class="badge bg-success me-2"><i class="fas fa-check"></i></span>
                                                ${item.amac}
                                            </li>` :
                                            `<li class="list-group-item d-flex align-items-center text-muted">
                                                <span class="badge bg-light text-muted me-2"><i class="fas fa-minus"></i></span>
                                                ${item.amac}
                                            </li>`
                                        ).join('') :
                                        '<li class="list-group-item">Sürdürülebilir kalkınma amaçları bulunamadı.</li>'
                                    }
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-4">
                            <div class="card h-100">
                                <div class="card-header bg-info text-white">
                                    <h5 class="mb-0"><i class="fas fa-hands-helping me-2"></i> Toplumsal Katkı Alanları</h5>
                                </div>
                                <div class="card-body">
                                    <ul class="list-group">
                                    ${
                                        detailData.toplumsalKatkiVeSurdurulebilirlik.toplumsalKatkiAlanlari && 
                                        detailData.toplumsalKatkiVeSurdurulebilirlik.toplumsalKatkiAlanlari.length > 0 ?
                                        detailData.toplumsalKatkiVeSurdurulebilirlik.toplumsalKatkiAlanlari.map(item => 
                                            item.secili ?
                                            `<li class="list-group-item d-flex align-items-center">
                                                <span class="badge bg-info me-2"><i class="fas fa-check"></i></span>
                                                ${item.alan}
                                            </li>` :
                                            `<li class="list-group-item d-flex align-items-center text-muted">
                                                <span class="badge bg-light text-muted me-2"><i class="fas fa-minus"></i></span>
                                                ${item.alan}
                                            </li>`
                                        ).join('') :
                                        '<li class="list-group-item">Toplumsal katkı alanları bulunamadı.</li>'
                                    }
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>`
                    : '<div class="alert alert-warning">Toplumsal katkı ve sürdürülebilirlik bilgisi bulunamadı.</div>'
                }
            </div>
                </div>
            `;
    
    tabContentContainer.innerHTML = tabsHTML;
    
    // ÖÇ-PÇ ilişki matrisini görselleştir
    if (detailData.programVeOgrenmeIliskisi) {
        setTimeout(() => {
            renderPCOCCharts(detailData);
        }, 300);
    }
}

/**
 * CourseMapLoader kullanarak ders detaylarını yükle
 */
async function loadCourseDetailWithMapLoader(courseCode, curriculum, modal) {
    const loadingElement = modal.querySelector('#course-detail-loading');
    const contentElement = modal.querySelector('#course-detail-content');
    
    try {
        // CourseMapLoader üzerinden ders detaylarını al
        console.log(`${curriculum} müfredatı, ${courseCode} ders detayları alınıyor...`);
        
        // Önce belirtilen müfredatta ara
        let detailData = null;
        try {
            detailData = await window.CourseMapLoader.getCourseDetails(curriculum, courseCode);
        } catch (error) {
            console.log(`${curriculum} müfredatında bulunamadı: ${error.message}`);
            
            // Diğer müfredatta ara
            const otherCurriculum = curriculum === '2020' ? '2024' : '2020';
            try {
                console.log(`${otherCurriculum} müfredatında aranıyor...`);
                detailData = await window.CourseMapLoader.getCourseDetails(otherCurriculum, courseCode);
                
                // Diğer müfredatta bulundu, bilgi mesajı göster
                if (!modal.querySelector('.curriculum-change-alert')) {
                    const alertHTML = `
                        <div class="alert alert-info curriculum-change-alert">
                            <i class="fas fa-info-circle me-2"></i>
                            Bu ders detayı ${curriculum} müfredatında bulunamadı, ${otherCurriculum} müfredatından alınmıştır.
            </div>
        `;
                    contentElement.insertAdjacentHTML('afterbegin', alertHTML);
                }
                
            } catch (innerError) {
                console.log(`${otherCurriculum} müfredatında da bulunamadı: ${innerError.message}`);
                throw new Error(`Ders detayları bulunamadı (${courseCode})`);
            }
        }
        
        if (detailData) {
            // Ders detaylarını gösterme fonksiyonunu çağır
            showCourseDetailContent(detailData, modal);
    } else {
            throw new Error(`Ders detayları bulunamadı (${courseCode})`);
        }
    } catch (error) {
        console.error('Ders detayları yüklenirken hata:', error);
        
        // Hata durumunda uygun mesaj göster
        loadingElement.classList.add('d-none');
        contentElement.classList.remove('d-none');
        
        contentElement.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>Hata:</strong> ${error.message}
            </div>
            <p>Bu dosya adı formatında 2020_2024_course_details_json klasöründe bu ders koduna ait bir dosya olmayabilir veya dosya formatı uygun değil.</p>
            <div class="alert alert-info">
                <p><strong>Öneriler:</strong></p>
                <ul>
                    <li>Ders kodunun yazılışını kontrol edebilirsiniz (ör: CE103 veya CEN103)</li>
                    <li>Farklı bir ders seçebilirsiniz</li>
                    <li>JSON dosyalarının adlandırması kontrol edilebilir</li>
                </ul>
            </div>
        `;
    }
}

/**
 * ÖÇ-PÇ ilişki matrisini görselleştir
 * @param {Object} detailData - Ders detay verisi
 * @param {string} courseCode - Ders kodu
 */
function renderPCOCCharts(detailData, courseCode) {
    // ApexCharts kütüphanesinin yüklendiğinden emin ol
    if (typeof ApexCharts === 'undefined') {
        loadApexCharts().then(() => {
            renderPCOCCharts(detailData, courseCode);
        });
        return;
    }
    
    // ÖÇ-PÇ İlişkisi Radar Grafiği
    const pcData = {};
    const ocIds = [];
    
    // Veriyi hazırla
    detailData.programVeOgrenmeIliskisi.iliskiTablosu.forEach(row => {
        ocIds.push(row.ogrenmeÇiktisiID);
        
        Object.entries(row.programÇiktilariIliskileri).forEach(([pc, value]) => {
            if (!pcData[pc]) {
                pcData[pc] = [];
            }
            pcData[pc].push(parseInt(value));
        });
    });
    
    // En yüksek 3 PC'yi bul (en fazla toplam puanı olan)
    const pcSums = Object.entries(pcData).map(([pc, values]) => {
        return {
            pc,
            sum: values.reduce((a, b) => a + b, 0)
        };
    }).sort((a, b) => b.sum - a.sum);
    
    const topPcs = pcSums.slice(0, 3).map(item => item.pc);
    
    // Radar Grafiği
    const radarSeries = topPcs.map(pc => {
        return {
            name: pc,
            data: pcData[pc]
        };
    });
    
    const radarOptions = {
        chart: {
            type: 'radar',
            height: 300,
            toolbar: {
                show: false
            }
        },
        series: radarSeries,
        title: {
            text: 'ÖÇ-PÇ İlişki Radar Grafiği',
            align: 'center'
        },
        xaxis: {
            categories: ocIds
        },
        yaxis: {
            show: false,
            min: 0,
            max: 5
        },
        fill: {
            opacity: 0.4
        },
        markers: {
            size: 4
        },
        stroke: {
            width: 2
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val.toFixed(0);
                }
            }
        }
    };
    
    const radarChart = new ApexCharts(document.getElementById('ocPcRadarChart'), radarOptions);
    radarChart.render();
    
    // Program çıktıları kapsama grafiği (Heatmap)
    const heatmapData = Object.entries(pcData).map(([pc, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return {
            pc,
            avg: parseFloat(avg.toFixed(1))
        };
    }).sort((a, b) => a.pc.localeCompare(b.pc));
    
    // Bar chart olarak PÇ kapsaması
    const barOptions = {
        chart: {
            type: 'bar',
            height: 300,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                dataLabels: {
                    position: 'top',
                },
                colors: {
                    ranges: [{
                        from: 0,
                        to: 1.9,
                        color: '#F44336'
                    }, {
                        from: 2,
                        to: 3.4,
                        color: '#FFC107'
                    }, {
                        from: 3.5,
                        to: 5,
                        color: '#4CAF50'
                    }]
                }
            }
        },
        dataLabels: {
            enabled: true,
            offsetX: 0,
            style: {
                fontSize: '12px',
                colors: ['#fff']
            }
        },
        series: [{
            name: 'Ortalama Katkı',
            data: heatmapData.map(item => item.avg)
        }],
        title: {
            text: 'Program Çıktıları Kapsama Düzeyi',
            align: 'center'
        },
        xaxis: {
            categories: heatmapData.map(item => item.pc),
            labels: {
                show: true
            },
            min: 0,
            max: 5
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val.toFixed(1) + ' / 5.0';
                }
            }
        }
    };
    
    const barChart = new ApexCharts(document.getElementById('pcCoverageChart'), barOptions);
    barChart.render();
}

/**
 * ApexCharts kütüphanesini dinamik olarak yükle
 */
function loadApexCharts() {
    return new Promise((resolve, reject) => {
        if (typeof ApexCharts !== 'undefined') {
            resolve();
            return;
        }
        
        // Script ekle
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
        
        // CSS ekle
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/apexcharts/dist/apexcharts.css';
        document.head.appendChild(link);
    });
}

/**
 * Yol haritası görselleştirmesini başlat
 */
function initializeRoadmapVisualization() {
    const roadmapContainer = document.getElementById('roadmapVisualization');
    
    if (!roadmapContainer) return;
    
    // Varsayılan yol haritasını göster
    updateRoadmapVisualization('all');
}

/**
 * Seçilen kariyer yoluna göre yol haritasını güncelle
 */
function updateRoadmapVisualization(careerPath) {
    const roadmapContainer = document.getElementById('roadmapVisualization');
    
    if (!roadmapContainer) return;
    
    let html = '';
    
    if (careerPath === 'all') {
        html = `
            <div class="text-center p-5">
                <i class="fas fa-route fa-3x mb-3 text-muted"></i>
                <h4>Lütfen bir kariyer yolu seçin</h4>
                <p>Detaylı yol haritasını görmek için yukarıdaki menüden bir kariyer yolu seçin.</p>
            </div>
        `;
    } else {
        // Kariyer yolu bilgisini ve gereksinimlerini al
        const careerPathInfo = window.careerDataLoader.getCareerPathById(careerPath);
        const requirements = window.careerDataLoader.getCareerRequirements(currentCurriculum, careerPath);
        
        if (careerPathInfo) {
            // Ders kodlarını formatla (içerik yüklenmemiş olabilir)
            const requiredCourses = requirements?.required_courses || [];
            const recommendedCourses = requirements?.recommended_electives || [];
            
            // Zorunlu dersler
            const requiredCourseObjects = requiredCourses.map(code => 
                window.careerDataLoader.getCourseByCode(currentCurriculum, code)
            ).filter(Boolean);
            
            // Önerilen dersler
            const recommendedCourseObjects = recommendedCourses.map(code => 
                window.careerDataLoader.getCourseByCode(currentCurriculum, code)
            ).filter(Boolean);
            
            html = `
                <div class="roadmap-header" style="background-color: ${careerPathInfo.color}">
                    <h4><i class="${careerPathInfo.icon}"></i> ${careerPathInfo.name} Kariyer Yolu</h4>
                </div>
                <div class="roadmap-content p-3">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="mb-4">
                                <h5>Kariyer Açıklaması</h5>
                                <p>${careerPathInfo.description}</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-header" style="background-color: ${careerPathInfo.color}30">
                                    <h5 class="mb-0">İstatistikler</h5>
                                </div>
                                <div class="card-body">
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            Zorunlu Dersler
                                            <span class="badge bg-primary rounded-pill">${requiredCourseObjects.length}</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            Önerilen Seçmeli Dersler
                                            <span class="badge bg-primary rounded-pill">${recommendedCourseObjects.length}</span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            Beklenen İngilizce Ders Oranı
                                            <span class="badge bg-success rounded-pill">%${requirements?.expected_english_percentage || 0}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <h5>Temel Beceriler</h5>
                            <div class="d-flex flex-wrap gap-2 mb-4">
            `;
            
            // Beceriler
            careerPathInfo.skills.forEach(skill => {
                html += `<span class="badge bg-secondary">${skill}</span>`;
            });
            
            html += `
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5>Endüstri Trendleri</h5>
                            <ul class="small">
            `;
            
            // Endüstri trendleri
            careerPathInfo.industry_trends.forEach(trend => {
                html += `<li>${trend}</li>`;
            });
            
            html += `
                            </ul>
                        </div>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <h5>Olası İş Unvanları</h5>
                            <div class="d-flex flex-wrap gap-2 mb-4">
            `;
            
            // İş unvanları
            careerPathInfo.job_titles.forEach(title => {
                html += `<span class="badge bg-info text-dark">${title}</span>`;
            });
            
            html += `
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5>Kariyer Sertifikaları</h5>
                            <ul class="small">
            `;
            
            // Sertifikalar
            if (careerPathInfo.certifications && careerPathInfo.certifications.length > 0) {
                careerPathInfo.certifications.forEach(cert => {
                    html += `<li><a href="${cert.url}" target="_blank">${cert.name}</a> (${cert.organization})</li>`;
                });
            } else {
                html += `<li class="text-muted">Sertifika bilgisi bulunamadı.</li>`;
            }
            
            html += `
                            </ul>
                        </div>
                    </div>
                    
                    <h5 class="mt-4">Yıl Bazlı Yol Haritası</h5>
                    <div class="roadmap-timeline">
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <h5>1. Yıl: Temel Bilgiler</h5>
                                <p>Algoritma, programlama ve matematik temelleri</p>
                                <div class="courses-chips">
            `;
            
            // 1. ve 2. dönem derslerini ekle
            const year1Courses = [...requiredCourseObjects, ...recommendedCourseObjects]
                .filter(course => course.Semester <= 2);
            
            year1Courses.forEach(course => {
                html += `<span class="course-chip">${course['Course Code']}</span>`;
            });
            
            html += `
                                </div>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <h5>2. Yıl: Temel Mühendislik</h5>
                                <p>Veri yapıları, nesne yönelimli programlama</p>
                                <div class="courses-chips">
            `;
            
            // 3. ve 4. dönem derslerini ekle
            const year2Courses = [...requiredCourseObjects, ...recommendedCourseObjects]
                .filter(course => course.Semester > 2 && course.Semester <= 4);
            
            year2Courses.forEach(course => {
                html += `<span class="course-chip">${course['Course Code']}</span>`;
            });
            
            html += `
                                </div>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <h5>3. Yıl: Uzmanlaşma</h5>
                                <p>Alanınıza özgü seçmeli dersler</p>
                                <div class="courses-chips">
            `;
            
            // 5. ve 6. dönem derslerini ekle
            const year3Courses = [...requiredCourseObjects, ...recommendedCourseObjects]
                .filter(course => course.Semester > 4 && course.Semester <= 6);
            
            year3Courses.forEach(course => {
                html += `<span class="course-chip">${course['Course Code']}</span>`;
            });
            
            html += `
                                </div>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <h5>4. Yıl: İleri Seviye</h5>
                                <p>Bitirme projesi ve ileri uzmanlık</p>
                                <div class="courses-chips">
            `;
            
            // 7. ve 8. dönem derslerini ekle
            const year4Courses = [...requiredCourseObjects, ...recommendedCourseObjects]
                .filter(course => course.Semester > 6 && course.Semester <= 8);
            
            year4Courses.forEach(course => {
                html += `<span class="course-chip">${course['Course Code']}</span>`;
            });
            
            html += `
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html = `
                <div class="alert alert-warning">
                    <p>Kariyer yolu bilgisi bulunamadı.</p>
                </div>
            `;
        }
    }
    
    roadmapContainer.innerHTML = html;
}

/**
 * Kariyer yolları karşılaştırma modülünü başlat
 */
function initializeCareerComparison() {
    const comparisonContainer = document.getElementById('careerComparison');
    
    if (!comparisonContainer) return;
    
    let html = '<div class="row row-cols-1 row-cols-md-3 g-4">';
    
    // Tüm kariyer yolları için kartlar oluştur
    careerPathsData.forEach(path => {
        // Her kariyer yolu için 3 temel beceri ve 3 trend seç
        const skills = path.skills.slice(0, 3);
        const trends = path.industry_trends.slice(0, 3);
        
        html += `
            <div class="col">
                <div class="card h-100 career-card" data-career="${path.id}">
                    <div class="card-header text-white" style="background-color: ${path.color}">
                        <i class="${path.icon}"></i> ${path.name}
                    </div>
                    <div class="card-body">
                        <p class="small">${path.description.substring(0, 100)}...</p>
                        
                        <h6><i class="fas fa-fire me-1 text-danger"></i> Endüstri Trendleri:</h6>
                        <ul class="trend-list small">
        `;
        
        trends.forEach(trend => {
            html += `<li>${trend}</li>`;
        });
        
        html += `
                        </ul>
                        <h6><i class="fas fa-check-circle me-1 text-success"></i> Anahtar Beceriler:</h6>
                        <div class="d-flex flex-wrap gap-1 mb-2">
        `;
        
        skills.forEach(skill => {
            html += `<span class="badge bg-secondary">${skill}</span>`;
        });
        
        html += `
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-outline-primary w-100 select-career-btn" data-career="${path.id}">
                            Bu Yolu Seç
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Örtüşme tablosunu ekle
    html += `
        <h5 class="mt-4 mb-3">Yollar Arası Örtüşme</h5>
        <div class="table-responsive">
            <table class="table table-bordered table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Kariyer Yolu</th>
    `;
    
    // Tablo başlıkları
    careerPathsData.slice(0, 7).forEach(path => {
        html += `<th>${path.name}</th>`;
    });
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Kariyer yolları arası ilişkileri göster
    const relations = window.careerDataLoader.getCareerPathRelations();
    
    careerPathsData.slice(0, 7).forEach((path, rowIndex) => {
        html += `
            <tr>
                <th class="table-light">${path.name}</th>
        `;
        
        // Diğer kariyer yolları ile ilişkisini göster
        careerPathsData.slice(0, 7).forEach((colPath, colIndex) => {
            if (rowIndex === colIndex) {
                html += `<td class="table-secondary">-</td>`;
            } else {
                // İki kariyer yolu arasındaki ilişkiyi bul
                const relation = relations.find(r => 
                    (r.path1 === path.id && r.path2 === colPath.id) ||
                    (r.path1 === colPath.id && r.path2 === path.id)
                );
                
                if (relation) {
                    html += `<td>${relation.overlap_percentage}%</td>`;
                } else {
                    html += `<td>-</td>`;
                }
            }
        });
        
        html += `</tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    comparisonContainer.innerHTML = html;
    
    // "Bu Yolu Seç" butonlarına olay dinleyicileri ekle
    document.querySelectorAll('.select-career-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const careerPath = this.getAttribute('data-career');
            const selector = document.getElementById('careerPathSelect');
            
            if (selector) {
                selector.value = careerPath;
                selector.dispatchEvent(new Event('change'));
                
                // Sayfayı uygun bölüme kaydır
                document.getElementById('curriculum').scrollIntoView({ behavior: 'smooth' });
                
                // Modal'ı kapat
                const modal = bootstrap.Modal.getInstance(document.getElementById('careerComparisonModal'));
                if (modal) {
                    modal.hide();
                }
            }
        });
    });
}

/**
 * Ders arama ve filtreleme işlevselliğini başlat
 */
function initializeSearchFilter() {
    const searchInput = document.getElementById('courseSearchInput');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        
        // Tüm ders satırlarını kontrol et
        const rows = document.querySelectorAll('.table-course tbody tr');
        
        rows.forEach(row => {
            const courseCode = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const courseName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            
            // Arama metni ders kodu veya adında geçiyorsa satırı göster, aksi halde gizle
            if (courseCode.includes(searchText) || courseName.includes(searchText)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        // Arama sonucu yoksa bilgi mesajı göster
        document.querySelectorAll('.tab-pane').forEach(pane => {
            const visibleRows = pane.querySelectorAll('tbody tr:not([style*="display: none"])');
            const noResultsMsg = pane.querySelector('.no-results-message');
            
            if (visibleRows.length === 0 && searchText) {
                if (!noResultsMsg) {
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'alert alert-info no-results-message';
                    msgDiv.innerHTML = `"${searchText}" ile eşleşen ders bulunamadı.`;
                    pane.appendChild(msgDiv);
                }
            } else if (noResultsMsg) {
                noResultsMsg.remove();
            }
        });
    });
}

/**
 * Accordion bellek özelliğini kur
 */
function setupAccordionMemory() {
    // Açık accordion öğelerini hatırla
    document.querySelectorAll('.accordion-button').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-bs-target');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            localStorage.setItem(`accordion_${targetId}`, isExpanded ? 'closed' : 'open');
        });
        
        // Sayfa yüklendiğinde hatırlanan durumu uygula
        const targetId = button.getAttribute('data-bs-target');
        const remembered = localStorage.getItem(`accordion_${targetId}`);
        
        if (remembered === 'open') {
            const targetElement = document.querySelector(targetId);
            
            if (targetElement && !targetElement.classList.contains('show')) {
                new bootstrap.Collapse(targetElement).show();
                button.classList.remove('collapsed');
                button.setAttribute('aria-expanded', 'true');
            }
        }
    });
}

/**
 * Tüm interaktif elementlerin kurulumunu yap
 */
function setupInteractiveElements() {
    // Daha fazla bilgi butonları
    document.querySelectorAll('.info-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const infoId = this.getAttribute('data-info');
            const infoContent = document.getElementById(infoId);
            
            if (infoContent) {
                // Bootstrap tooltip yerine popover kullanabiliriz
                const popover = new bootstrap.Popover(this, {
                    container: 'body',
                    html: true,
                    content: infoContent.innerHTML,
                    trigger: 'focus'
                });
                
                popover.show();
            }
        });
    });
    
    // Sekme değişikliğinde URL'i güncelle
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const targetId = e.target.getAttribute('data-bs-target').substring(1);
            
            const url = new URL(window.location.href);
            url.searchParams.set('tab', targetId);
            window.history.pushState({}, '', url);
        });
    });
    
    // Sayfa yüklendiğinde URL'deki sekmeyi seç
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab) {
        const tabEl = document.querySelector(`button[data-bs-target="#${tab}"]`);
        
        if (tabEl) {
            const bsTab = new bootstrap.Tab(tabEl);
            bsTab.show();
        }
    }
    
    // Müfredat değiştirme butonları
    document.querySelectorAll('[data-curriculum]').forEach(button => {
        button.addEventListener('click', function() {
            const curriculum = this.getAttribute('data-curriculum');
            
            if (curriculum === '2020' || curriculum === '2024') {
                // Eğer zaten o sayfadaysak, sayfayı yenile
                if (window.location.pathname.includes(curriculum)) {
                    window.location.reload();
                } else {
                    // Değilse, ilgili sayfaya yönlendir
                    window.location.href = `${curriculum}_kariyer_haritasi.html`;
                }
            }
        });
    });
    
    // Sertifika seçici
    const certSelect = document.getElementById('certificationSelect');
    if (certSelect) {
        certSelect.addEventListener('change', function() {
            const selectedPath = this.value;
            updateCertificationsList(selectedPath);
        });
    }
}

/**
 * Sertifikalar listesini güncelle
 */
function updateCertificationsList(careerPath) {
    const certList = document.getElementById('certificationsList');
    if (!certList) return;
    
    let html = '';
    
    if (careerPath === 'all') {
        html = `
            <div class="alert alert-light border">
                <p class="mb-0 text-center text-muted">Lütfen bir sertifika kategorisi seçin</p>
            </div>
        `;
    } else {
        // Seçilen kariyer yoluna ait sertifikaları göster
        const career = window.careerDataLoader.getCareerPathById(careerPath);
        
        if (career && career.certifications && career.certifications.length > 0) {
            html = '<ul class="list-group">';
            
            career.certifications.forEach(cert => {
                html += `
                    <li class="list-group-item">
                        <h6>${cert.name}</h6>
                        <p class="mb-1 small">${cert.organization}</p>
                        <a href="${cert.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-external-link-alt me-1"></i> Detaylar
                        </a>
                    </li>
                `;
            });
            
            html += '</ul>';
        } else {
            html = `
                <div class="alert alert-light border">
                    <p class="mb-0 text-center text-muted">Bu kariyer yolu için sertifika bilgisi bulunamadı.</p>
                </div>
            `;
        }
    }
    
    certList.innerHTML = html;
}

/**
 * Seçilen kariyer yoluna göre renk temasını güncelle
 */
function updateColorTheme(careerPath) {
    // Ana tema rengini değiştir
    if (careerPath !== 'all' && careerPathColors[careerPath]) {
        const color = careerPathColors[careerPath].color;
        
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Navbar'ın rengini değiştir
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.backgroundColor = careerPathColors[careerPath].color;
        }
    } else {
        // Varsayılan renklere geri dön
        document.documentElement.style.setProperty('--primary-color', '#3498db');
        
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.style.backgroundColor = '#2c3e50';
        }
    }
}

/**
 * Seçilen kariyer yoluna göre zorunlu dersler listesini güncelle
 */
function updateRequiredCoursesList(careerPath) {
    const requiredCoursesContainer = document.getElementById('requiredCourses');
    
    if (!requiredCoursesContainer) return;
    
    if (careerPath === 'all') {
        requiredCoursesContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> Zorunlu ve önerilen dersleri görmek için bir kariyer yolu seçin.
            </div>
        `;
        return;
    }
    
    // Kariyer yolu ve gereksinimleri al
    const career = window.careerDataLoader.getCareerPathById(careerPath);
    const requirements = window.careerDataLoader.getCareerRequirements(currentCurriculum, careerPath);
    
    if (!career || !requirements) {
        requiredCoursesContainer.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i> Bu kariyer yolu için gereklilik bilgisi bulunamadı.
            </div>
        `;
        return;
    }
    
    // Gerekli ders kodlarını al
    const requiredCourseCodes = requirements.required_courses || [];
    const recommendedCourseCodes = requirements.recommended_electives || [];
    
    // Ders nesnelerini al
    const requiredCourses = requiredCourseCodes
        .map(code => window.careerDataLoader.getCourseByCode(currentCurriculum, code))
        .filter(Boolean);
    
    const recommendedCourses = recommendedCourseCodes
        .map(code => window.careerDataLoader.getCourseByCode(currentCurriculum, code))
        .filter(Boolean);
    
    // HTML içeriğini oluştur
    let html = `
        <div class="card">
            <div class="card-header" style="background-color: ${career.color}; color: white;">
                <h5 class="mb-0"><i class="${career.icon}"></i> ${career.name} için Önemli Dersler</h5>
            </div>
            <div class="card-body">
    `;
    
    // Zorunlu dersler
    if (requiredCourses.length > 0) {
        html += `
            <h6>Odaklanılması Gereken Zorunlu Dersler:</h6>
            <ul class="required-courses-list mb-4">
        `;
        
        requiredCourses.forEach(course => {
            html += `
                <li>
                    <strong>${course['Course Code']}</strong>: 
                    ${course['Course Name']} 
                    <span class="badge ${course.Language === 'English' ? 'bg-info' : 'bg-secondary'}">
                        ${course.Language === 'English' ? 'İngilizce' : 'Türkçe'}
                    </span>
                </li>
            `;
        });
        
        html += `</ul>`;
    } else {
        html += `<p class="text-muted small">Bu kariyer yolu için belirlenmiş özel zorunlu dersler bulunamadı.</p>`;
    }
    
    // Önerilen seçmeli dersler
    if (recommendedCourses.length > 0) {
        html += `
            <h6>Önerilen Seçmeli Dersler:</h6>
            <ul class="recommended-courses-list">
        `;
        
        recommendedCourses.forEach(course => {
            html += `
                <li>
                    <strong>${course['Course Code']}</strong>: 
                    ${course['Course Name']} 
                    <span class="badge ${course.Language === 'English' ? 'bg-info' : 'bg-secondary'}">
                        ${course.Language === 'English' ? 'İngilizce' : 'Türkçe'}
                    </span>
                    ${course.Group ? `<small class="text-muted">(${course.Group})</small>` : ''}
                </li>
            `;
        });
        
        html += `</ul>`;
    } else {
        html += `<p class="text-muted small">Bu kariyer yolu için belirlenmiş önerilen seçmeli dersler bulunamadı.</p>`;
    }
    
    html += `
            </div>
            <div class="card-footer">
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">Beklenen İngilizce ders oranı: <strong>%${requirements.expected_english_percentage || 0}</strong></small>
                    <button class="btn btn-sm btn-outline-primary" onclick="document.getElementById('careerPathSelect').value='${careerPath}'; document.getElementById('careerPathSelect').dispatchEvent(new Event('change'));">
                        <i class="fas fa-sync-alt me-1"></i> Güncelleş
                    </button>
                </div>
            </div>
        </div>
    `;
    
    requiredCoursesContainer.innerHTML = html;
}

/**
 * Seçmeli ders gruplarını güncelle
 */
function updateElectiveGroups() {
    const electiveLists = {
        '2020': document.getElementById('electiveGroup2020'),
        '2024': document.getElementById('electiveGroup2024')
    };
    
    // Her iki müfredat için de seçmeli grupları güncelle
    Object.keys(electiveLists).forEach(curriculum => {
        const container = electiveLists[curriculum];
        if (!container) return;
        
        // Seçmeli grupları al
        const groups = window.careerDataLoader.getElectiveGroups(curriculum);
        if (!groups || groups.length === 0) {
            container.innerHTML = `<p class="text-muted small p-3">Seçmeli ders grubu bulunamadı.</p>`;
            return;
        }
        
        // HTML içeriğini oluştur
        let html = `<ul class="list-group list-group-flush">`;
        
        groups.forEach(group => {
            if (!group.group_id.startsWith('SECPFS')) {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${group.name} (${group.group_id})
                        <span class="badge bg-primary rounded-pill">${group.courses_to_select} ders</span>
                    </li>
                `;
            }
        });
        
        html += `</ul>`;
        container.innerHTML = html;
    });
}

/**
 * Ders vurgulama işlevselliğini başlat
 */
function initializeCourseHighlighting() {
    // Ders satırlarını işle
    document.querySelectorAll('.table-course tbody tr').forEach(row => {
        // Kariyer yolları ilişkilendirmeleri zaten populateCourseTables() içinde yapıldı
        row.classList.add('course-row-hover');
    });
}

/**
 * RGB renk değerini HEX formatına dönüştür
 */
function rgbToHex(rgb) {
    if (!rgb) return '';
    
    // rgb(r, g, b) formatından r, g, b değerlerini çıkar
    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    
    if (!rgbMatch) return rgb;
    
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    
    return "#" + hex(rgbMatch[1]) + hex(rgbMatch[2]) + hex(rgbMatch[3]);
}

/**
 * Kariyer Haritası
 * 
 * Kariyer yollarını görselleştirmek ve kullanıcı etkileşimlerini yönetmek için kod.
 */

/**
 * Ana uygulama başlatma fonksiyonu
 */
async function initializeCareerMap() {
    try {
        // CourseMapLoader halihazırda otomatik olarak taramayı başlatıyor, 
        // ancak tarama tamamlanmamışsa bekletmek için bir kontrol yapalım
        console.log('Kariyer haritası başlatılıyor...');
        
        if (window.CourseMapLoader && !window.CourseMapLoader.scanComplete) {
            console.log('Ders dosya eşleştirme taraması henüz tamamlanmamış, tarama durumunu kontrol ediyoruz...');
            
            // Tarama durumunu kontrol et ve gerekirse başlat
            await window.CourseMapLoader.scanAllJsonFiles();
        } else {
            console.log('Ders dosya eşleştirme taraması zaten tamamlanmış veya başlatılmış.');
        }
        
        // Veri yükleme işlemleri
        const allData = await window.careerDataLoader.loadAllData();
        
        // Kariyer yollarını görüntüle
        renderCareerPaths(allData.careerPaths);
        
        // Müfredat bilgilerini görüntüle
        renderCurriculum2020(allData.courses2020);
        renderCurriculum2024(allData.courses2024);
        renderCurriculumComparison(allData.courses2020, allData.courses2024);
        
        // İlgi alanlarını oluştur
        renderInterestAreas();
        
        // Olay dinleyicileri ekle
        setupEventListeners();
        
        console.log('Kariyer Haritası başarıyla yüklendi!');
    } catch (error) {
        console.error('Kariyer Haritası yüklenirken hata:', error);
        displayErrorMessage('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
}

/**
 * Kariyer yollarını görselleştirir
 * @param {Array} careerPaths - Kariyer yolları dizisi
 */
function renderCareerPaths(careerPaths) {
    console.log("Kariyer yolları render ediliyor:", careerPaths);
    
    const container = document.getElementById('career-paths-container');
    if (!container) {
        console.error("career-paths-container elementi bulunamadı!");
        return;
    }
    
    console.log("Container bulundu, içerik temizleniyor");
    container.innerHTML = '';
    
    try {
        if (!careerPaths || !careerPaths.career_paths) {
            console.error("Geçersiz kariyer yolu verisi:", careerPaths);
            container.innerHTML = '<div class="alert alert-danger">Kariyer yolu verisi yüklenemedi veya geçersiz.</div>';
            return;
        }
        
        const paths = careerPaths.career_paths;
        console.log(`${paths.length} kariyer yolu render ediliyor`);
        
        paths.forEach((path, index) => {
            console.log(`Kariyer yolu hazırlanıyor: ${path.name} (${index + 1}/${paths.length})`);
            
            const cardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="path-card">
                        <div class="path-header ${path.id}" id="path-header-${path.id}" style="background-color: ${path.color};">
                            <div class="d-flex align-items-center">
                                <i class="${path.icon} me-2"></i>
                                <h4 class="mb-0">${path.name}</h4>
                            </div>
                        </div>
                        <div class="card-body">
                            <p>${path.description}</p>
                            
                            <h5 class="mt-3">Temel Beceriler</h5>
                            <div class="mb-3">
                                ${path.skills.map(skill => `<span class="course-tag">${skill}</span>`).join('')}
                            </div>
                            
                            <h5>Kariyer Pozisyonları</h5>
                            <ul class="mb-3">
                                ${path.job_titles.map(title => `<li>${title}</li>`).join('')}
                            </ul>
                            
                            <h5>Endüstri Trendleri</h5>
                            <div class="mb-3">
                                ${path.industry_trends.map(trend => 
                                    `<div class="trend-item">${trend}</div>`).join('')}
                            </div>
                            
                            <button class="btn btn-primary view-courses-btn" 
                                    data-career-id="${path.id}" 
                                    data-career-name="${path.name}">
                                Dersleri Görüntüle
                            </button>
                            
                            <button class="btn btn-outline-secondary view-certs-btn mt-2" 
                                    data-career-id="${path.id}" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#certModal">
                                Sertifika Önerileri
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML += cardHTML;
        });
        
        console.log("Tüm kariyer yolları başarıyla eklendi");
        
        // Sertifika modeli ekle
        addCertificateModal(paths);
    } catch (error) {
        console.error("Kariyer yolları render edilirken hata:", error);
        container.innerHTML = `<div class="alert alert-danger">Kariyer yolları gösterilirken bir hata oluştu: ${error.message}</div>`;
    }
}

/**
 * Sertifika önerileri için modal ekler
 * @param {Array} careerPaths - Kariyer yolları dizisi
 */
function addCertificateModal(careerPaths) {
    // Modal HTML'ini oluştur
    const modalHTML = `
        <div class="modal fade" id="certModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="certModalTitle">Sertifika Önerileri</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                    </div>
                    <div class="modal-body" id="certModalBody">
                        <!-- Sertifika içeriği JavaScript ile doldurulacak -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı body'ye ekle
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // View certificates butonlarına olay dinleyicisi ekle
    document.querySelectorAll('.view-certs-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const careerId = event.target.getAttribute('data-career-id');
            const careerPath = careerPaths.find(path => path.id === careerId);
            
            if (careerPath) {
                document.getElementById('certModalTitle').textContent = 
                    `${careerPath.name} için Sertifika Önerileri`;
                
                let certHTML = '<div class="list-group">';
                careerPath.certifications.forEach(cert => {
                    certHTML += `
                        <a href="${cert.url}" target="_blank" class="list-group-item list-group-item-action">
                            <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1">${cert.name}</h5>
                                <small>${cert.organization}</small>
                            </div>
                            <p class="mb-1">Sertifika veren kurum: ${cert.organization}</p>
                            <small>Detaylar için tıklayın</small>
                        </a>
                    `;
                });
                certHTML += '</div>';
                
                document.getElementById('certModalBody').innerHTML = certHTML;
            }
        });
    });
}

/**
 * 2020 müfredatını görselleştirir
 * @param {Array} courses - 2020 müfredatı dersleri
 */
function renderCurriculum2020(courses) {
    console.log("2020 müfredatı verileri:", courses);
    
    const container = document.getElementById('curriculum-2020-container');
    if (!container) {
        console.error("curriculum-2020-container elementi bulunamadı!");
        return;
    }
    
    if (!courses || !courses.length) {
        console.error("2020 müfredatı verileri bulunamadı veya boş:", courses);
        container.innerHTML = '<div class="alert alert-warning">2020 müfredatı verileri yüklenemedi.</div>';
        return;
    }
    
    const years = {
        1: [],
        2: [],
        3: [],
        4: []
    };
    
    // Dersleri yıllara göre grupla
    courses.forEach(course => {
        console.log("İşlenen ders:", course);
        
        // CSV'den gelen Semester alanını kullan
        const semester = parseInt(course.Semester);
        if (isNaN(semester)) {
            console.warn("Geçersiz dönem değeri:", course);
            return;
        }
        
        const year = semester <= 2 ? 1 : 
                    semester <= 4 ? 2 :
                    semester <= 6 ? 3 : 4;
        
        years[year].push(course);
    });
    
    // Her yıl için HTML oluştur
    let html = '<div class="row">';
    
    for (let year = 1; year <= 4; year++) {
        const yearCourses = years[year];
        console.log(`${year}. yıl dersleri: ${yearCourses.length} adet`);
        
        html += `
            <div class="col-md-6 mb-4">
                <div class="year-section">
                    <h3 class="year-header">${year}. Yıl</h3>
                    <div class="semester-container">
                        <h4>Güz Dönemi</h4>
                        <ul class="course-list">
        `;
        
        // Güz dönemi (tek sayılı dönemler: 1, 3, 5, 7)
        const fallSemester = (year-1)*2 + 1;
        const fallCourses = yearCourses.filter(course => parseInt(course.Semester) === fallSemester);
        
        if (fallCourses.length > 0) {
            fallCourses.forEach(course => {
                html += `
                    <li data-bs-toggle="tooltip" title="${course['Course Name']} (${course.ECTS} ECTS)">
                        <a href="#" class="course-link" data-course-code="${course['Course Code']}">
                            ${course['Course Code']} - ${course['Course Name']}
                        </a>
                    </li>
                `;
            });
        } else {
            html += `<li class="text-muted">Bu dönem için ders bulunamadı</li>`;
        }
        
        html += `
                        </ul>
                        
                        <h4 class="mt-3">Bahar Dönemi</h4>
                        <ul class="course-list">
        `;
        
        // Bahar dönemi (çift sayılı dönemler: 2, 4, 6, 8)
        const springSemester = (year-1)*2 + 2;
        const springCourses = yearCourses.filter(course => parseInt(course.Semester) === springSemester);
        
        if (springCourses.length > 0) {
            springCourses.forEach(course => {
                html += `
                    <li data-bs-toggle="tooltip" title="${course['Course Name']} (${course.ECTS} ECTS)">
                        <a href="#" class="course-link" data-course-code="${course['Course Code']}">
                            ${course['Course Code']} - ${course['Course Name']}
                        </a>
                    </li>
                `;
            });
        } else {
            html += `<li class="text-muted">Bu dönem için ders bulunamadı</li>`;
        }
                
        html += `
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Tooltip'leri etkinleştir
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Ders linklerine olay dinleyicileri ekle - container içindeki linklere özel olarak ekle
    container.querySelectorAll('.course-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const courseCode = this.getAttribute('data-course-code');
            console.log(`2020 müfredatından ders detayları gösteriliyor: ${courseCode}`);
            showCourseDetails(courseCode);
        });
    });
}

/**
 * 2024 müfredatını görselleştirir
 * @param {Array} courses - 2024 müfredatı dersleri
 */
function renderCurriculum2024(courses) {
    console.log("2024 müfredatı verileri:", courses);
    
    const container = document.getElementById('curriculum-2024-container');
    if (!container) {
        console.error("curriculum-2024-container elementi bulunamadı!");
        return;
    }
    
    if (!courses || !courses.length) {
        console.error("2024 müfredatı verileri bulunamadı veya boş:", courses);
        container.innerHTML = '<div class="alert alert-warning">2024 müfredatı verileri yüklenemedi.</div>';
        return;
    }
    
    const years = {
        1: [],
        2: [],
        3: [],
        4: []
    };
    
    // Dersleri yıllara göre grupla
    courses.forEach(course => {
        console.log("İşlenen ders:", course);
        
        // CSV'den gelen Semester alanını kullan
        const semester = parseInt(course.Semester);
        if (isNaN(semester)) {
            console.warn("Geçersiz dönem değeri:", course);
            return;
        }
        
        const year = semester <= 2 ? 1 : 
                    semester <= 4 ? 2 :
                    semester <= 6 ? 3 : 4;
        
        years[year].push(course);
    });
    
    // Her yıl için HTML oluştur
    let html = '<div class="row">';
    
    for (let year = 1; year <= 4; year++) {
        const yearCourses = years[year];
        console.log(`${year}. yıl dersleri: ${yearCourses.length} adet`);
        
        html += `
            <div class="col-md-6 mb-4">
                <div class="year-section">
                    <h3 class="year-header">${year}. Yıl</h3>
                    <div class="semester-container">
                        <h4>Güz Dönemi</h4>
                        <ul class="course-list">
        `;
        
        // Güz dönemi (tek sayılı dönemler: 1, 3, 5, 7)
        const fallSemester = (year-1)*2 + 1;
        const fallCourses = yearCourses.filter(course => parseInt(course.Semester) === fallSemester);
        
        if (fallCourses.length > 0) {
            fallCourses.forEach(course => {
                html += `
                    <li data-bs-toggle="tooltip" title="${course['Course Name']} (${course.ECTS} ECTS)">
                        <a href="#" class="course-link" data-course-code="${course['Course Code']}">
                            ${course['Course Code']} - ${course['Course Name']}
                        </a>
                    </li>
                `;
            });
        } else {
            html += `<li class="text-muted">Bu dönem için ders bulunamadı</li>`;
        }
        
        html += `
                        </ul>
                        
                        <h4 class="mt-3">Bahar Dönemi</h4>
                        <ul class="course-list">
        `;
        
        // Bahar dönemi (çift sayılı dönemler: 2, 4, 6, 8)
        const springSemester = (year-1)*2 + 2;
        const springCourses = yearCourses.filter(course => parseInt(course.Semester) === springSemester);
        
        if (springCourses.length > 0) {
            springCourses.forEach(course => {
                html += `
                    <li data-bs-toggle="tooltip" title="${course['Course Name']} (${course.ECTS} ECTS)">
                        <a href="#" class="course-link" data-course-code="${course['Course Code']}">
                            ${course['Course Code']} - ${course['Course Name']}
                        </a>
                    </li>
                `;
            });
        } else {
            html += `<li class="text-muted">Bu dönem için ders bulunamadı</li>`;
        }
                
        html += `
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Tooltip'leri etkinleştir
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Ders linklerine olay dinleyicileri ekle - container içindeki linklere özel olarak ekle
    container.querySelectorAll('.course-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const courseCode = this.getAttribute('data-course-code');
            console.log(`Ders detayları gösteriliyor: ${courseCode}`);
            showCourseDetails(courseCode);
        });
    });
}

/**
 * Müfredat karşılaştırmasını görselleştirir
 * @param {Array} courses2020 - 2020 müfredatı dersleri
 * @param {Array} courses2024 - 2024 müfredatı dersleri
 */
function renderCurriculumComparison(courses2020, courses2024) {
    console.log("Müfredat karşılaştırması yapılıyor...");
    console.log("2020 müfredatı ders sayısı:", courses2020?.length || 0);
    console.log("2024 müfredatı ders sayısı:", courses2024?.length || 0);
    
    const container = document.getElementById('curriculum-comparison-container');
    if (!container) {
        console.error("curriculum-comparison-container elementi bulunamadı!");
        return;
    }
    
    // Veri doğrulaması
    if (!courses2020 || !Array.isArray(courses2020) || !courses2024 || !Array.isArray(courses2024)) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <p><i class="fas fa-exclamation-triangle me-2"></i> Müfredat verileri karşılaştırma için yeterli değil.</p>
                <p>2020 müfredatı: ${courses2020?.length || 0} ders, 2024 müfredatı: ${courses2024?.length || 0} ders</p>
            </div>
        `;
        return;
    }
    
    console.log("Karşılaştırma için dersler hazırlanıyor...");
    
    // Ders adlarını normalize etme yardımcı fonksiyonu
    function normalizeCourseName(name) {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/[-_,.;:]/g, ' ') // Özel karakterleri boşluğa çevir
            .replace(/\s+/g, ' ')      // Birden fazla boşluğu tek boşluğa indir
            .trim();                   // Baştaki ve sondaki boşlukları kaldır
    }
    
    // İki ders adı arasındaki benzerliği hesapla (0-1 arası)
    function calculateSimilarity(name1, name2) {
        const normalizedName1 = normalizeCourseName(name1);
        const normalizedName2 = normalizeCourseName(name2);
        
        // Tam eşleşme kontrolü
        if (normalizedName1 === normalizedName2) {
            return 1;
        }
        
        // Birbirinin alt metni mi kontrolü
        if (normalizedName1.includes(normalizedName2) || normalizedName2.includes(normalizedName1)) {
            const lengthRatio = Math.min(normalizedName1.length, normalizedName2.length) / 
                                Math.max(normalizedName1.length, normalizedName2.length);
            return 0.8 * lengthRatio; // Alt metin olma durumuna göre skor hesapla
        }
        
        // Levenshtein mesafesi (düzenleme mesafesi) hesapla
        const maxLength = Math.max(normalizedName1.length, normalizedName2.length);
        if (maxLength === 0) return 1; // İki string de boş ise
        
        // Basitleştirilmiş Levenshtein hesaplaması yerine, kelimeler üzerinden karşılaştırma yapalım
        const words1 = normalizedName1.split(' ').filter(w => w.length > 2); // Anlamlı kelimeleri al
        const words2 = normalizedName2.split(' ').filter(w => w.length > 2);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        // Ortak kelime sayısını bul
        let commonWords = 0;
        for (const word1 of words1) {
            if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
                commonWords++;
            }
        }
        
        // Benzerlik skoru: ortak kelime sayısı / toplam kelime sayısı
        return commonWords / Math.max(words1.length, words2.length);
    }
    
    // Tüm 2020 ve 2024 derslerini dönem dönem karşılaştır
    const result = {
        addedCourses: [],    // 2024'te eklenmiş dersler
        removedCourses: [],  // 2020'de olup 2024'te kaldırılmış dersler
        shiftedCourses: [],  // Dönemi değişmiş dersler
        changedCourses: []   // İçeriği değişmiş dersler
    };
    
    // 2020'de olup 2024'te olmayan dersleri bul (kaldırılanlar)
    for (const course2020 of courses2020) {
        // Bu ders 2024'te var mı?
        const similarCourses = courses2024.filter(course2024 => {
            // Aynı ders kodu veya benzer isim?
            if (course2020['Course Code'] === course2024['Course Code']) {
                return true;
            }
            
            const similarity = calculateSimilarity(course2020['Course Name'], course2024['Course Name']);
            return similarity > 0.7; // %70'ten fazla benzerlik varsa aynı ders kabul et
        });
        
        if (similarCourses.length === 0) {
            // Bu ders kaldırılmış
            result.removedCourses.push({
                course: course2020,
                reason: 'Müfredattan çıkarılmış'
            });
        } else {
            // Benzer ders(ler) var
            const bestMatch = similarCourses[0];
            
            // Ders dönem değişikliği kontrolü
            if (course2020.Semester !== bestMatch.Semester) {
                result.shiftedCourses.push({
                    oldCourse: course2020,
                    newCourse: bestMatch,
                    oldSemester: course2020.Semester,
                    newSemester: bestMatch.Semester
                });
            }
            
            // İçerik değişikliği kontrolü (farklı ad, farklı ECTS, vb.)
            if (course2020['Course Name'] !== bestMatch['Course Name'] || 
                course2020.ECTS !== bestMatch.ECTS) {
                result.changedCourses.push({
                    oldCourse: course2020,
                    newCourse: bestMatch,
                    changes: []
                });
            }
        }
    }
    
    // 2024'te eklenmiş dersleri bul
    for (const course2024 of courses2024) {
        // Bu ders 2020'de var mı?
        const similarCourses = courses2020.filter(course2020 => {
            // Aynı ders kodu veya benzer isim?
            if (course2020['Course Code'] === course2024['Course Code']) {
                return true;
            }
            
            const similarity = calculateSimilarity(course2020['Course Name'], course2024['Course Name']);
            return similarity > 0.7; // %70'ten fazla benzerlik varsa aynı ders kabul et
        });
        
        if (similarCourses.length === 0) {
            // Bu ders yeni eklenmiş
            result.addedCourses.push({
                course: course2024,
                reason: 'Yeni eklenen ders'
            });
        }
    }
    
    // Sonuçları ekrana yansıt
    let html = `
        <div class="alert alert-info">
            <p>2020 ve 2024 müfredatlarının karşılaştırması:</p>
            <ul>
                <li>Eklenen ders sayısı: ${result.addedCourses.length}</li>
                <li>Kaldırılan ders sayısı: ${result.removedCourses.length}</li>
                <li>Dönemi değişen ders sayısı: ${result.shiftedCourses.length}</li>
                <li>İçeriği değişen ders sayısı: ${result.changedCourses.length}</li>
            </ul>
        </div>
    `;
    
    // Dönemi değişen dersler
    if (result.shiftedCourses.length > 0) {
        html += `
            <h4>Dönemi Değişen Dersler</h4>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Eski Dönem</th>
                            <th>Yeni Dönem</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        result.shiftedCourses.forEach(shift => {
            html += `
                <tr>
                    <td><a href="#" class="course-link" data-curriculum="2024" data-course-code="${shift.newCourse['Course Code']}">${shift.newCourse['Course Code']}</a></td>
                    <td>${shift.newCourse['Course Name']}</td>
                    <td>${shift.oldSemester}</td>
                    <td>${shift.newSemester}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Eklenen dersler
    if (result.addedCourses.length > 0) {
        html += `
            <h4>Yeni Eklenen Dersler</h4>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Dönem</th>
                            <th>ECTS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        result.addedCourses.forEach(added => {
            html += `
                <tr>
                    <td><a href="#" class="course-link" data-curriculum="2024" data-course-code="${added.course['Course Code']}">${added.course['Course Code']}</a></td>
                    <td>${added.course['Course Name']}</td>
                    <td>${added.course.Semester}</td>
                    <td>${added.course.ECTS}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Kaldırılan dersler
    if (result.removedCourses.length > 0) {
        html += `
            <h4>Kaldırılan Dersler</h4>
            <div class="table-responsive">
                <table class="table table-sm table-hover">
                    <thead>
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Dönem</th>
                            <th>ECTS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        result.removedCourses.forEach(removed => {
            html += `
                <tr>
                    <td><a href="#" class="course-link" data-curriculum="2020" data-course-code="${removed.course['Course Code']}">${removed.course['Course Code']}</a></td>
                    <td>${removed.course['Course Name']}</td>
                    <td>${removed.course.Semester}</td>
                    <td>${removed.course.ECTS}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Ders detayları linklerine olay dinleyicisi ekle
    container.querySelectorAll('.course-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const courseCode = this.getAttribute('data-course-code');
            const curriculum = this.getAttribute('data-curriculum');
            
            console.log(`Karşılaştırma tablosundan ders detayı görüntüleniyor: ${courseCode} (${curriculum} müfredatı)`);
            
            // Geçici olarak müfredatı değiştir
            const originalCurriculum = currentCurriculum;
            currentCurriculum = curriculum;
            
            // Ders detaylarını göster
            showCourseDetails(courseCode);
            
            // Müfredatı geri al
            currentCurriculum = originalCurriculum;
        });
    });
}

/**
 * İlgi alanlarını render eder
 */
function renderInterestAreas() {
    const container = document.getElementById('interests-container');
    if (!container) return;
    
    // İlgi alanları HTML'ini oluştur
    interestAreas.forEach(interest => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-primary interest-btn';
        btn.setAttribute('data-interest', interest);
        btn.textContent = interest;
        
        container.appendChild(btn);
    });
}

/**
 * Tüm olay dinleyicilerini ayarlar
 */
function setupEventListeners() {
    // Kariyer yolları için ders görüntüleme butonları
    document.querySelectorAll('.view-courses-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const careerId = event.target.getAttribute('data-career-id');
            const careerName = event.target.getAttribute('data-career-name');
            
            await showCourseRecommendations(careerId, careerName);
        });
    });
    
    // İlgi alanı seçimi butonları
    document.querySelectorAll('.interest-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const interest = event.target.getAttribute('data-interest');
            
            // İlgi alanını seçilmiş listeye ekle/çıkar
            if (event.target.classList.contains('btn-primary')) {
                // Seçimi kaldır
                event.target.classList.remove('btn-primary');
                event.target.classList.add('btn-outline-primary');
                selectedInterests = selectedInterests.filter(i => i !== interest);
            } else {
                // En fazla 3 ilgi alanı seçilebilir
                if (selectedInterests.length >= 3) {
                    alert('En fazla 3 ilgi alanı seçebilirsiniz.');
                    return;
                }
                
                // Seçimi ekle
                event.target.classList.remove('btn-outline-primary');
                event.target.classList.add('btn-primary');
                selectedInterests.push(interest);
            }
        });
    });
    
    // Tavsiyeleri göster butonu
    const recommendBtn = document.getElementById('get-recommendations');
    if (recommendBtn) {
        recommendBtn.addEventListener('click', async () => {
            if (selectedInterests.length === 0) {
                alert('Lütfen en az bir ilgi alanı seçin.');
                return;
            }
            
            await showPersonalRecommendations(selectedInterests);
        });
    }
}

/**
 * Belirli bir kariyer yolu için ders önerilerini gösterir
 * @param {string} careerId - Kariyer yolu ID'si
 * @param {string} careerName - Kariyer yolu adı
 */
async function showCourseRecommendations(careerId, careerName) {
    try {
        // Modal oluştur veya varsa kullan
        let courseModal = document.getElementById('courseRecommendationModal');
        
        if (!courseModal) {
            const modalHTML = `
                <div class="modal fade" id="courseRecommendationModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="courseModalTitle">Ders Önerileri</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                            </div>
                            <div class="modal-body" id="courseModalBody">
                                <ul class="nav nav-tabs" id="curriculumRecommendationTab" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="cr-2024-tab" data-bs-toggle="tab" 
                                                data-bs-target="#cr-2024" type="button" role="tab">
                                            2024 Müfredatı
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="cr-2020-tab" data-bs-toggle="tab" 
                                                data-bs-target="#cr-2020" type="button" role="tab">
                                            2020 Müfredatı
                                        </button>
                                    </li>
                                </ul>
                                <div class="tab-content pt-3" id="curriculumRecommendationTabContent">
                                    <div class="tab-pane fade show active" id="cr-2024" role="tabpanel">
                                        <div id="recommendations-2024">Yükleniyor...</div>
                                    </div>
                                    <div class="tab-pane fade" id="cr-2020" role="tabpanel">
                                        <div id="recommendations-2020">Yükleniyor...</div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            courseModal = document.getElementById('courseRecommendationModal');
        }
        
        // Modal başlığını güncelle
        document.getElementById('courseModalTitle').textContent = 
            `${careerName} Kariyer Yolu için Ders Önerileri`;
        
        // Modal'ı göster
        const modal = new bootstrap.Modal(courseModal);
        modal.show();
        
        // Ders önerilerini asenkron olarak yükle
        const recommendations2024 = await window.careerDataLoader.getRecommendedCourses(careerId, '2024');
        const recommendations2020 = await window.careerDataLoader.getRecommendedCourses(careerId, '2020');
        
        // 2024 önerilerini görüntüle
        renderCourseRecommendations('recommendations-2024', recommendations2024);
        
        // 2020 önerilerini görüntüle
        renderCourseRecommendations('recommendations-2020', recommendations2020);
        
    } catch (error) {
        console.error('Ders önerileri yüklenirken hata:', error);
        displayErrorMessage('Ders önerileri yüklenirken bir hata oluştu.');
    }
}

/**
 * Ders önerilerini görüntüler
 * @param {string} containerId - İçerik konteyneri ID'si
 * @param {Object} recommendations - Ders önerileri nesnesi
 */
function renderCourseRecommendations(containerId, recommendations) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { coreCourses, recommendedElectives } = recommendations;
    
    let html = '';
    
    // Zorunlu dersler
    if (coreCourses.length > 0) {
        html += `
            <h4>Zorunlu Dersler</h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Kredi</th>
                            <th>Dönem</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coreCourses.map(course => `
                            <tr>
                                <td><a href="#" class="course-detail-link" data-course-code="${course.code}"><strong>${course.code}</strong></a></td>
                                <td><a href="#" class="course-detail-link" data-course-code="${course.code}">${course.name}</a></td>
                                <td>${course.credits}</td>
                                <td>${course.semester}. Dönem</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += '<p>Bu kariyer yolu için zorunlu ders bulunamadı.</p>';
    }
    
    // Önerilen seçmeli dersler
    if (recommendedElectives.length > 0) {
        html += `
            <h4 class="mt-4">Önerilen Seçmeli Dersler</h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Kredi</th>
                            <th>Dönem</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recommendedElectives.map(course => `
                            <tr>
                                <td><a href="#" class="course-detail-link" data-course-code="${course.code}"><strong>${course.code}</strong></a></td>
                                <td><a href="#" class="course-detail-link" data-course-code="${course.code}">${course.name}</a></td>
                                <td>${course.credits}</td>
                                <td>${course.semester}. Dönem</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += '<p class="mt-4">Bu kariyer yolu için önerilen seçmeli ders bulunamadı.</p>';
    }
    
    container.innerHTML = html;
    
    // Ders detayı link olaylarını ekle
    const detailLinks = container.querySelectorAll('.course-detail-link');
    detailLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const courseCode = this.getAttribute('data-course-code');
            showCourseDetails(courseCode);
        });
    });
}

/**
 * Kişisel tavsiyeleri gösterir
 * @param {Array} interests - Seçilen ilgi alanları
 */
async function showPersonalRecommendations(interests) {
    try {
        // Yükleniyor göstergesi göster
        const container = document.getElementById('recommendations-container');
        if (container) {
            container.classList.remove('d-none');
            
            // Yükleniyor içeriği ekle
            document.getElementById('recommended-careers').innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Yükleniyor...</span></div></div>';
            document.getElementById('recommended-courses').innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border text-success" role="status"><span class="visually-hidden">Yükleniyor...</span></div></div>';
            document.getElementById('recommended-certs').innerHTML = '<div class="d-flex justify-content-center"><div class="spinner-border text-info" role="status"><span class="visually-hidden">Yükleniyor...</span></div></div>';
        }
        
        console.log(`Seçilen ilgi alanları: ${interests.join(', ')}`);
        
        // Kariyer yolu önerilerini al
        const recommendedPaths = await window.careerDataLoader.recommendCareerPaths(interests);
        console.log(`Önerilen kariyer yolları: ${recommendedPaths.length} adet`);
        
        // Önerilen kariyer yollarını görüntüle
        renderRecommendedCareers(recommendedPaths);
        
        // Önerilen dersleri al ve görüntüle
        if (recommendedPaths.length > 0) {
            // Aktif müfredata göre önerileri al
            const topPathId = recommendedPaths[0].id;
            const recommendations = await window.careerDataLoader.getRecommendedCourses(topPathId, currentCurriculum);
            
            console.log(`${topPathId} için ${currentCurriculum} müfredatında ders önerileri alındı`);
            
            renderRecommendedCourses(recommendations);
            renderRecommendedCertifications(recommendedPaths[0]);
        } else {
            document.getElementById('recommended-courses').innerHTML = 
                '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> Ders önerisi oluşturulamadı. Lütfen farklı ilgi alanları seçin.</div>';
            
            document.getElementById('recommended-certs').innerHTML = 
                '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> Sertifika önerisi oluşturulamadı. Lütfen farklı ilgi alanları seçin.</div>';
        }
        
        // Tavsiyeler bölümüne kaydır
        document.getElementById('recommendations-container').scrollIntoView({
            behavior: 'smooth'
        });
        
        // Kullanıcı seçimlerini kaydet
        localStorage.setItem('selectedInterests', JSON.stringify(interests));
        
        // Başarı mesajı göster
        showToastMessage(`${interests.length} ilgi alanına göre kariyer önerileri oluşturuldu`);
        
    } catch (error) {
        console.error('Kişisel öneriler oluşturulurken hata:', error);
        displayErrorMessage('Öneriler oluşturulurken bir hata oluştu: ' + error.message);
        
        // Hata durumunda içerikleri temizle
        const containers = ['recommended-careers', 'recommended-courses', 'recommended-certs'];
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i> Veriler yüklenirken hata oluştu: ${error.message}</div>`;
            }
        });
    }
}

/**
 * Önerilen kariyer yollarını görüntüler
 * @param {Array} recommendedPaths - Önerilen kariyer yolları
 */
function renderRecommendedCareers(recommendedPaths) {
    const container = document.getElementById('recommended-careers');
    if (!container) return;
    
    if (!recommendedPaths || recommendedPaths.length === 0) {
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> Seçilen ilgi alanlarına göre uygun kariyer yolu bulunamadı.</div>';
        return;
    }
    
    let html = '';
    
    // İlk öneri için detaylı kart göster
    const topPath = recommendedPaths[0];
    const topMatchPercent = Math.round(topPath.matchScore * 100);
    
    html += `
        <div class="card mb-4 border-primary">
            <div class="card-header bg-primary bg-opacity-25">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="${topPath.icon}"></i> ${topPath.name}</h5>
                    <span class="badge bg-primary">${topMatchPercent}% Uyum</span>
                </div>
            </div>
            <div class="card-body">
                <p>${topPath.description}</p>
                
                <h6 class="mt-3">Önemli Beceriler:</h6>
                <div class="d-flex flex-wrap gap-2 mb-3">
                    ${topPath.skills.slice(0, 6).map(skill => 
                        `<span class="badge bg-secondary">${skill}</span>`
                    ).join('')}
                </div>
                
                <div class="d-flex justify-content-end">
                    <button class="btn btn-outline-primary btn-sm view-courses-btn" 
                            data-career-id="${topPath.id}" 
                            data-career-name="${topPath.name}">
                        <i class="fas fa-book me-1"></i> Tüm Dersleri Görüntüle
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Diğer öneriler için daha basit kartlar göster
    if (recommendedPaths.length > 1) {
        html += '<h6 class="mb-3">Diğer Uyumlu Kariyer Yolları:</h6>';
        html += '<div class="list-group">';
        
        recommendedPaths.slice(1).forEach((path) => {
            const matchPercent = Math.round(path.matchScore * 100);
            
            html += `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1"><i class="${path.icon}"></i> ${path.name}</h6>
                        <small>${matchPercent}% Uyum</small>
                    </div>
                    <p class="mb-1 small">${path.description.substring(0, 100)}...</p>
                    <div class="d-flex justify-content-end mt-2">
                        <button class="btn btn-sm btn-outline-secondary view-courses-btn" 
                                data-career-id="${path.id}" 
                                data-career-name="${path.name}">
                            Detaylar
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    container.innerHTML = html;
    
    // Yeni eklenen butonlara olay dinleyicileri ekle
    container.querySelectorAll('.view-courses-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const careerId = event.target.getAttribute('data-career-id');
            const careerName = event.target.getAttribute('data-career-name');
            
            await showCourseRecommendations(careerId, careerName);
        });
    });
}

/**
 * Önerilen dersleri görüntüler
 * @param {Object} recommendations - Ders önerileri
 */
function renderRecommendedCourses(recommendations) {
    const container = document.getElementById('recommended-courses');
    if (!container) return;
    
    if (!recommendations) {
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> Ders önerileri alınamadı.</div>';
        return;
    }
    
    const { coreCourses, recommendedElectives } = recommendations;
    
    // Boş veri kontrolü
    if ((!coreCourses || coreCourses.length === 0) && 
        (!recommendedElectives || recommendedElectives.length === 0)) {
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> Seçilen kariyer yolu için uygun ders önerisi bulunamadı.</div>';
        return;
    }
    
    let html = '';
    
    // Müfredat bilgisini ekle
    html += `
        <div class="alert alert-info mb-3">
            <div class="d-flex align-items-center">
                <div class="me-3"><i class="fas fa-info-circle fa-2x"></i></div>
                <div>
                    <h6 class="mb-1">Müfredat Bilgisi</h6>
                    <p class="mb-0 small">Bu öneriler <strong>${currentCurriculum}</strong> müfredatına göre hazırlanmıştır. 
                    <a href="#" onclick="switchCurriculumForRecommendations(event)">Diğer müfredata geçmek için tıklayın</a>.</p>
                </div>
            </div>
        </div>
    `;
    
    // Ders öncelikleri ve dağılımları
    let coursesShown = 0;
    
    // Zorunlu dersler (en önemli 5 tanesini göster)
    if (coreCourses && coreCourses.length > 0) {
        const displayCourses = coreCourses.slice(0, 5);
        coursesShown += displayCourses.length;
        
        html += `
            <h6 class="mb-3"><i class="fas fa-star text-warning me-2"></i>Temel Dersler</h6>
            <div class="table-responsive mb-4">
                <table class="table table-hover table-sm">
                    <thead class="table-light">
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Dönem</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        displayCourses.forEach(course => {
            html += `
                <tr>
                    <td><a href="#" class="course-detail-link" data-course-code="${course.code}"><span class="badge bg-primary">${course.code}</span></a></td>
                    <td><a href="#" class="course-detail-link" data-course-code="${course.code}">${course.name}</a></td>
                    <td>${course.semester || '-'}. Dönem</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Daha fazla gösterilmeyen ders varsa bilgi ver
        if (coreCourses.length > 5) {
            html += `<p class="small text-muted mb-4">+ ${coreCourses.length - 5} temel ders daha. Tüm dersleri görmek için "Tüm Dersleri Görüntüle" butonuna tıklayın.</p>`;
        }
    }
    
    // Seçmeli dersler
    if (recommendedElectives && recommendedElectives.length > 0) {
        // Gösterilecek toplam ders sayısını 10'a tamamlayacak kadar seçmeli ders göster
        const displayCount = Math.min(recommendedElectives.length, 10 - coursesShown);
        const displayCourses = recommendedElectives.slice(0, displayCount);
        
        html += `
            <h6 class="mb-3"><i class="fas fa-lightbulb text-success me-2"></i>Önerilen Seçmeli Dersler</h6>
            <div class="table-responsive">
                <table class="table table-hover table-sm">
                    <thead class="table-light">
                        <tr>
                            <th>Ders Kodu</th>
                            <th>Ders Adı</th>
                            <th>Dönem</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        displayCourses.forEach(course => {
            html += `
                <tr>
                    <td><a href="#" class="course-detail-link" data-course-code="${course.code}"><span class="badge bg-success">${course.code}</span></a></td>
                    <td><a href="#" class="course-detail-link" data-course-code="${course.code}">${course.name}</a></td>
                    <td>${course.semester || '-'}. Dönem</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Daha fazla gösterilmeyen ders varsa bilgi ver
        if (recommendedElectives.length > displayCount) {
            html += `<p class="small text-muted">+ ${recommendedElectives.length - displayCount} seçmeli ders daha. Tüm dersleri görmek için "Tüm Dersleri Görüntüle" butonuna tıklayın.</p>`;
        }
    }
    
    container.innerHTML = html;
    
    // Ders detayı link olaylarını ekle
    const detailLinks = container.querySelectorAll('.course-detail-link');
    detailLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const courseCode = this.getAttribute('data-course-code');
            showCourseDetails(courseCode);
        });
    });
}

/**
 * Önerilen sertifikaları görüntüler
 * @param {Object} careerPath - Kariyer yolu nesnesi
 */
function renderRecommendedCertifications(careerPath) {
    const container = document.getElementById('recommended-certs');
    if (!container || !careerPath) return;
    
    const certs = careerPath?.certifications;
    
    if (!certs || certs.length === 0) {
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> Bu kariyer yolu için sertifika önerisi bulunamadı.</div>';
        return;
    }
    
    let html = `
        <div class="alert alert-info mb-3">
            <i class="fas fa-certificate me-2"></i>
            <strong>${careerPath.name}</strong> kariyer yolu için önerilen sertifikalar ve eğitimler
        </div>
    `;
    
    html += '<div class="row">';
    
    certs.forEach(cert => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card h-100 border-info">
                    <div class="card-body">
                        <h5 class="card-title">${cert.name}</h5>
                        <h6 class="card-subtitle mb-2 text-muted"><i class="fas fa-building me-2"></i>${cert.organization}</h6>
                        <p class="card-text small">${cert.description || 'Bu sertifika, kariyer hedeflerinize ulaşmanızda size yardımcı olacak önemli bir adım olabilir.'}</p>
                        <div class="mt-3">
                            <a href="${cert.url}" target="_blank" class="btn btn-sm btn-info text-white">
                                <i class="fas fa-external-link-alt me-1"></i> Detaylı Bilgi
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Önerilen Öğrenme Yolları (ek bilgi)
    html += `
        <div class="mt-4">
            <h6><i class="fas fa-map-signs me-2"></i>Öğrenme Yolları</h6>
            <ul class="list-group">
                <li class="list-group-item d-flex align-items-center">
                    <i class="fas fa-graduation-cap me-3 text-primary"></i>
                    <div>
                        <h6 class="mb-1">Akademik Yol</h6>
                        <p class="mb-0 small">Lisansüstü eğitim ve araştırma fırsatları ile akademik kariyerinizi geliştirebilirsiniz.</p>
                    </div>
                </li>
                <li class="list-group-item d-flex align-items-center">
                    <i class="fas fa-briefcase me-3 text-success"></i>
                    <div>
                        <h6 class="mb-1">Endüstri Yolu</h6>
                        <p class="mb-0 small">Staj, bootcamp ve profesyonel sertifikalarla sektörde hızla ilerleyebilirsiniz.</p>
                    </div>
                </li>
                <li class="list-group-item d-flex align-items-center">
                    <i class="fas fa-laptop-code me-3 text-info"></i>
                    <div>
                        <h6 class="mb-1">Kişisel Projeler</h6>
                        <p class="mb-0 small">Açık kaynak projelere katkıda bulunarak ve kişisel projeler geliştirerek portfolyonuzu zenginleştirebilirsiniz.</p>
                    </div>
                </li>
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Müfredat değişikliği için yardımcı fonksiyon
 */
function switchCurriculumForRecommendations(event) {
    event.preventDefault();
    
    // Aktif müfredatın tersine geçiş yap
    const newCurriculum = currentCurriculum === '2020' ? '2024' : '2020';
    
    // Önce URL parametresini değiştir
    const url = new URL(window.location.href);
    url.searchParams.set('curriculum', newCurriculum);
    window.history.pushState({}, '', url);
    
    // Müfredatı değiştir
    currentCurriculum = newCurriculum;
    localStorage.setItem('preferredCurriculum', currentCurriculum);
    
    // Butonları güncelle
    updateCurriculumSelectionButtons();
    
    // Kaydedilmiş ilgi alanları varsa, tavsiyeleri yeniden oluştur
    const savedInterests = JSON.parse(localStorage.getItem('selectedInterests') || '[]');
    if (savedInterests.length > 0) {
        showPersonalRecommendations(savedInterests);
    }
    
    // Bildirim göster
    showToastMessage(`Müfredat ${currentCurriculum} olarak değiştirildi. Tavsiyeler güncelleniyor...`);
}

/**
 * Hata mesajı gösterir
 * @param {string} message - Hata mesajı
 */
function displayErrorMessage(message) {
    // Toast bildirim şeklinde hata mesajı göster
    const toastHTML = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-danger text-white">
                    <strong class="me-auto">Hata</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Kapat"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        </div>
    `;
    
    // Eğer toast container yoksa oluştur
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        toastContainer = document.querySelector('.toast-container');
    } else {
        // Varsa içeriğini güncelle
        const toast = toastContainer.querySelector('.toast');
        toast.querySelector('.toast-body').textContent = message;
    }
    
    // Toast'u göster
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

/**
 * Müfredat seçim düğmelerini ekle
 */
function addCurriculumSelectionButtons() {
    // Önceden eklenmiş olabilir, kontrol et
    if (document.getElementById('curriculum-selector')) {
        return;
    }
    
    // Navigasyon menüsünü bul
    const navbarNav = document.getElementById('navbarNav');
    if (!navbarNav) return;
    
    // Müfredat seçicisi oluştur
    const curriculumSelector = document.createElement('div');
    curriculumSelector.id = 'curriculum-selector';
    curriculumSelector.className = 'navbar-nav ms-3 curriculum-buttons';
    curriculumSelector.innerHTML = `
        <div class="btn-group" role="group" aria-label="Müfredat Seçimi">
            <button type="button" id="curr-2020-btn" class="btn btn-sm" data-curriculum="2020">2020 Müfredatı</button>
            <button type="button" id="curr-2024-btn" class="btn btn-sm" data-curriculum="2024">2024 Müfredatı</button>
        </div>
    `;
    
    // Navigasyon menüsüne ekle
    navbarNav.appendChild(curriculumSelector);
    
    // Butonlara tıklama olayları ekle
    document.getElementById('curr-2020-btn').addEventListener('click', switchCurriculum);
    document.getElementById('curr-2024-btn').addEventListener('click', switchCurriculum);
    
    // Mevcut müfredata göre butonları güncelle
    updateCurriculumSelectionButtons();
}

/**
 * Müfredatı değiştir
 * @param {Event} event - Tıklama olayı
 */
function switchCurriculum(event) {
    const newCurriculum = event.target.dataset.curriculum;
    if (newCurriculum === currentCurriculum) return;
    
    console.log(`Müfredat değişiyor: ${currentCurriculum} -> ${newCurriculum}`);
    
    // URL'i güncelle
    const url = new URL(window.location.href);
    url.searchParams.set('curriculum', newCurriculum);
    window.history.pushState({}, '', url);
    
    // Müfredatı değiştir
    currentCurriculum = newCurriculum;
    localStorage.setItem('preferredCurriculum', newCurriculum);
    
    // Butonları güncelle
    updateCurriculumSelectionButtons();
    
    // Tüm ders tablolarını yeniden oluştur
    populateCourseTables();
    
    // Aktif kariyer yolunu bul ve ona göre güncelle
    const careerPathSelect = document.getElementById('careerPathSelect');
    if (careerPathSelect) {
        const selectedPath = careerPathSelect.value;
        highlightCareerPathCourses(selectedPath);
        updateRoadmapVisualization(selectedPath);
        updateRequiredCoursesList(selectedPath);
    }
    
    // Seçmeli grup güncellemesi
    updateElectiveGroups();
    
    // Eğer müfredat karşılaştırma sekmesi açıksa, içeriği yenile
    const comparisonTab = document.getElementById('curr-comparison');
    if (comparisonTab && comparisonTab.classList.contains('active')) {
        renderCurriculumComparison(courseData['2020'], courseData['2024']);
    }
    
    // Aktif sekmeyi kontrol et ve içeriği güncelle
    if (document.getElementById('curr-2020-tab') && document.getElementById('curr-2024-tab')) {
        if (newCurriculum === '2020') {
            document.getElementById('curr-2020-tab').click();
        } else if (newCurriculum === '2024') {
            document.getElementById('curr-2024-tab').click();
        }
    }
    
    // Müfredat değişikliğini bildir
    console.log(`Müfredat başarıyla değiştirildi: ${currentCurriculum}`);
    
    // Toast bildirim göster
    showToastMessage(`Müfredat ${currentCurriculum} olarak değiştirildi`);
}

/**
 * Toast bildirim göster
 * @param {string} message - Gösterilecek mesaj
 */
function showToastMessage(message) {
    // Toast container kontrol et veya oluştur
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        const toastHTML = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-primary text-white">
                        <strong class="me-auto">Bildirim</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Kapat"></button>
                    </div>
                    <div class="toast-body"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        toastContainer = document.querySelector('.toast-container');
    }
    
    // Toast içeriğini güncelle
    const toastBody = document.querySelector('.toast-container .toast-body');
    if (toastBody) {
        toastBody.textContent = message;
    }
    
    // Toast'u göster
    const toastElement = document.querySelector('.toast-container .toast');
    if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
}

/**
 * Müfredat seçim düğmelerini güncelle
 */
function updateCurriculumSelectionButtons() {
    const btn2020 = document.getElementById('curr-2020-btn');
    const btn2024 = document.getElementById('curr-2024-btn');
    
    if (!btn2020 || !btn2024) return;
    
    // Tüm butonları sıfırla
    btn2020.classList.remove('btn-primary', 'active');
    btn2024.classList.remove('btn-primary', 'active');
    btn2020.classList.add('btn-outline-light');
    btn2024.classList.add('btn-outline-light');
    
    // Aktif müfredatı vurgula
    if (currentCurriculum === '2020') {
        btn2020.classList.add('btn-primary', 'active');
        btn2020.classList.remove('btn-outline-light');
    } else if (currentCurriculum === '2024') {
        btn2024.classList.add('btn-primary', 'active');
        btn2024.classList.remove('btn-outline-light');
    }
}

/**
 * MUDEK için program çıktıları genel analiz panelini oluştur
 */
function initializeMudekAnalysisPanel() {
    // Panel container'ı kontrol et
    const mudekPanelContainer = document.getElementById('mudek-analysis-panel');
    if (!mudekPanelContainer) {
        console.log('MUDEK paneli oluşturuluyor...');
        
        // Panel HTML'ini oluştur
        const panelHTML = `
            <div class="card mb-4" id="mudek-analysis-panel">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i> MUDEK Program Çıktıları Analizi</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info mb-3">
                        <p class="mb-0"><i class="fas fa-info-circle me-2"></i> Bu panel, tüm ders-öğrenim çıktısı ilişkilerini ve program çıktılarının müfredat genelinde karşılanma durumunu analiz eder.</p>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Müfredat Program Çıktıları Kapsaması</h6>
                                </div>
                                <div class="card-body">
                                    <div id="curriculum-pc-coverage-chart" style="height: 300px;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Program Çıktıları Ağırlık Dağılımı</h6>
                                </div>
                                <div class="card-body">
                                    <div id="pc-weight-distribution-chart" style="height: 300px;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Program Çıktıları İlişki Matrisi Özeti</h6>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered table-hover" id="pc-summary-table">
                                            <thead class="table-light">
                                                <tr>
                                                    <th>Program Çıktısı</th>
                                                    <th>İlişkili Ders Sayısı</th>
                                                    <th>Ortalama İlişki Düzeyi</th>
                                                    <th>Kapsama Yüzdesi</th>
                                                    <th>Durum</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td colspan="5" class="text-center">
                                                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                                                            <span class="visually-hidden">Yükleniyor...</span>
                                                        </div>
                                                        <span class="ms-2">Analiz hazırlanıyor...</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <button id="analyze-mudek-btn" class="btn btn-primary">
                            <i class="fas fa-sync-alt me-2"></i> Analizi Güncelle
                        </button>
                        <button id="export-mudek-report-btn" class="btn btn-success">
                            <i class="fas fa-file-export me-2"></i> Rapor Oluştur
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Paneli müfredat sekmesine ekle
        const curriculumTab = document.getElementById('curriculum');
        if (curriculumTab) {
            // Panel'i ilk öğeden önce ekle
            const firstChild = curriculumTab.firstChild;
            if (firstChild) {
                curriculumTab.insertAdjacentHTML('afterbegin', panelHTML);
            } else {
                curriculumTab.innerHTML = panelHTML;
            }
            
            // Analiz güncelleme butonuna olay dinleyicisi ekle
            const analyzeBtn = document.getElementById('analyze-mudek-btn');
            if (analyzeBtn) {
                analyzeBtn.addEventListener('click', performMudekAnalysis);
            }
            
            // Rapor oluşturma butonuna olay dinleyicisi ekle
            const exportBtn = document.getElementById('export-mudek-report-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportMudekReport);
            }
            
            // İlk analizi yap
            performMudekAnalysis();
        } else {
            console.error('MUDEK paneli için müfredat sekmesi bulunamadı!');
        }
    }
}

/**
 * MUDEK analizi yapar ve paneli günceller
 */
async function performMudekAnalysis() {
    console.log('MUDEK analizi yapılıyor...');
    
    try {
        // Önce tüm müfredattaki dersleri ve JSON dosyalarını yükle
        updateMudekLoadingStatus('Ders dosyaları yükleniyor, lütfen bekleyin...');
        console.log(`Aktif müfredat: ${currentCurriculum}`);
        
        // Önce tarama işleminin tamamlandığından emin ol
        if (window.CourseMapLoader && !window.CourseMapLoader.scanComplete) {
            console.log('CourseMapLoader taraması tamamlanmadı, tarama başlatılıyor...');
            await window.CourseMapLoader.scanAllJsonFiles();
        }
        
        // Tüm dersler bu aşamada yüklenir
        const allCourses = await loadAllCourseDetailsForMudek();
        
        // Yüklenen derslerin sayısını kontrol et
        if (!allCourses || allCourses.length === 0) {
            throw new Error('Hiçbir ders yüklenemedi. Lütfen ders JSON dosyalarını kontrol edin.');
        }
        
        console.log(`MUDEK analizi için toplam ${allCourses.length} ders yüklendi.`);
        
        // PÇ.11 = 5 değerine sahip dersleri ayrıca kontrol et
        const pc11Courses = allCourses.filter(course => {
            const iliskiTablosu = course.details.programVeOgrenmeIliskisi.iliskiTablosu || [];
            return iliskiTablosu.some(row => 
                row.programÇiktilariIliskileri && 
                row.programÇiktilariIliskileri["PÇ.11"] === 5
            );
        });
        
        console.log(`PÇ.11 = 5 değerine sahip ${pc11Courses.length} ders bulundu.`);
        if (pc11Courses.length > 0) {
            pc11Courses.forEach(course => {
                console.log(`- ${course.code}: ${course.name}`);
            });
        }
        
        // Analiz sonuçlarını hesapla
        updateMudekLoadingStatus('PÇ analiz sonuçları hesaplanıyor...');
        const analysisResults = calculateMudekAnalysisResults(allCourses);
        
        // Analiz sonuçlarını görselleştir
        updateMudekLoadingStatus('Sonuçlar görselleştiriliyor...');
        visualizeMudekAnalysisResults(analysisResults);
        
        console.log('MUDEK analizi tamamlandı:', analysisResults);
    } catch (error) {
        console.error('MUDEK analizi sırasında hata:', error);
        
        // Hata mesajı göster
        const summaryTable = document.getElementById('pc-summary-table');
        if (summaryTable) {
            const tbody = summaryTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Analiz yapılırken bir hata oluştu: ${error.message}
                        </td>
                    </tr>
                `;
            }
        }
        
        // Tarayıcıda hata uyarısı göster
        alert(`MUDEK analizi yapılırken hata oluştu: ${error.message}\n\nLütfen tarayıcı konsolunu kontrol edin ve yöneticiye bildirin.`);
    }
}

/**
 * MUDEK analizi için tüm dersleri ve detaylarını yükler
 * @returns {Promise<Array>} - Ders detayları dizisi
 */
async function loadAllCourseDetailsForMudek() {
    // Yükleniyor göstergesini güncelle
    updateMudekLoadingStatus('Ders detayları yükleniyor...');
    
    // Aktif müfredattaki tüm dersleri al
    const courses = courseData[currentCurriculum] || [];
    
    if (!courses || courses.length === 0) {
        throw new Error(`Müfredat (${currentCurriculum}) için ders verisi bulunamadı.`);
    }
    
    console.log(`MUDEK analizi için ${courses.length} ders detayı yüklenecek...`);
    
    // Yüklenecek ders sayısı (tüm dersleri yükle, sınırlama kaldırıldı)
    const coursesToLoad = courses;
    
    // Her bir ders için detayları yükle
    const loadedCourses = [];
    let loadedCount = 0;
    
    // Tüm kurslara paralel istek atmak yerine grup grup işleyelim (5'er 5'er)
    const batchSize = 5;
    for (let i = 0; i < coursesToLoad.length; i += batchSize) {
        const batch = coursesToLoad.slice(i, i + batchSize);
        
        // Grubu parallel işle
        const promises = batch.map(async (course) => {
            try {
                const courseCode = course['Course Code'];
                updateMudekLoadingStatus(`Ders yükleniyor (${++loadedCount}/${coursesToLoad.length}): ${courseCode}`);
                
                const details = await window.CourseMapLoader.getCourseDetails(currentCurriculum, courseCode);
                
                // Sadece programVeOgrenmeIliskisi bilgisi olan dersleri sakla
                if (details && details.programVeOgrenmeIliskisi) {
                    console.log(`${courseCode} dersi için PÇ ilişkileri yüklendi.`);
                    
                    // CSV'den dil bilgisini de ekle - eğer JSON'da bulunmazsa kullanmak için
                    return {
                        code: courseCode,
                        name: course, // Tüm CSV bilgisini taşı
                        details: details
                    };
                }
                
                console.log(`${courseCode} için ÖÇ-PÇ ilişki bilgisi bulunamadı.`);
                return null;
            } catch (error) {
                console.warn(`${course['Course Code']} detayları yüklenemedi:`, error);
                return null;
            }
        });
        
        const results = await Promise.all(promises);
        loadedCourses.push(...results.filter(Boolean));
    }
    
    console.log(`${loadedCourses.length} ders için detaylar başarıyla yüklendi.`);
    
    return loadedCourses;
}

/**
 * MUDEK yükleme durumunu günceller
 * @param {string} message - Durum mesajı
 */
function updateMudekLoadingStatus(message) {
    const summaryTable = document.getElementById('pc-summary-table');
    if (summaryTable) {
        const tbody = summaryTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Yükleniyor...</span>
                        </div>
                        <span class="ms-2">${message}</span>
                    </td>
                </tr>
            `;
        }
    }
}

/**
 * MUDEK analiz sonuçlarını hesaplar
 * @param {Array} courses - Ders detayları dizisi
 * @returns {Object} - Analiz sonuçları
 */
function calculateMudekAnalysisResults(courses) {
    // Yükleniyor göstergesini güncelle
    updateMudekLoadingStatus('Analiz sonuçları hesaplanıyor...');
    
    // Program çıktıları için analiz yapacağız
    const pcAnalysis = {};
    const courseCount = courses.length;
    
    console.log(`MUDEK analizi: Toplam ${courseCount} ders analiz ediliyor...`);
    
    // PÇ.11 beş değeri için özel kontrol
    const coursesWith_PC11_5 = [];
    
    // Dil analizi için ek değişkenler
    const languageAnalysis = {
        english: 0,
        turkish: 0,
        englishByType: {
            mandatory: 0,
            elective: 0
        },
        turkishByType: {
            mandatory: 0,
            elective: 0
        },
        englishBySemester: {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0
        },
        turkishBySemester: {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0
        },
        semesterTotal: {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0
        },
        totalByType: {
            mandatory: 0,
            elective: 0
        }
    };
    
    // Her ders için tüm program çıktılarını analiz et
    courses.forEach(course => {
        // Ders içindeki tüm ÖÇ-PÇ ilişkilerini incele
        const iliskiTablosu = course.details.programVeOgrenmeIliskisi.iliskiTablosu || [];
        
        // Dil analizi için kurs bilgilerini al
        const courseGeneral = course.details.dersGenel || {};
        const language = courseGeneral.egitimDili || '';
        const courseType = courseGeneral.dersTuru || '';
        const semester = parseInt(courseGeneral.dersinVerildigiYariyil) || 0;
        
        // Dil analizi güncelle - daha kapsamlı kontrol
        const csvLanguage = course.name && course.name.Language ? course.name.Language : '';
        const isEnglish = 
            language.toLowerCase().includes('ingilizce') || 
            language.toLowerCase().includes('english') || 
            language.toLowerCase().includes('ing') || 
            language.toLowerCase().includes('en') ||
            language.toLowerCase() === 'i' ||
            // CSV dosyalarından gelen dil bilgisi kontrolü
            csvLanguage === 'English';
        
        // Debug bilgisine CSV'den gelen dil bilgisini de ekle
        console.log(`Ders: ${course.code}, JSON Dil: "${language}", CSV Dil: "${csvLanguage}", Tip: "${courseType}", Dönem: ${semester}`);
        
        if (isEnglish) {
            languageAnalysis.english++;
            console.log(`  ✓ İNGİLİZCE DERS: ${course.code}`);
            
            // Ders tipine göre sayma
            if (courseType.toLowerCase().includes('zorunlu') || courseType.toLowerCase().includes('mandatory')) {
                languageAnalysis.englishByType.mandatory++;
                languageAnalysis.totalByType.mandatory++;
            } else {
                languageAnalysis.englishByType.elective++;
                languageAnalysis.totalByType.elective++;
            }
            
            // Döneme göre sayma (1-8)
            if (semester >= 1 && semester <= 8) {
                languageAnalysis.englishBySemester[semester]++;
                languageAnalysis.semesterTotal[semester]++;
            }
        } else {
            languageAnalysis.turkish++;
            
            // Ders tipine göre sayma
            if (courseType.toLowerCase().includes('zorunlu') || courseType.toLowerCase().includes('mandatory')) {
                languageAnalysis.turkishByType.mandatory++;
                languageAnalysis.totalByType.mandatory++;
            } else {
                languageAnalysis.turkishByType.elective++;
                languageAnalysis.totalByType.elective++;
            }
            
            // Döneme göre sayma (1-8)
            if (semester >= 1 && semester <= 8) {
                languageAnalysis.turkishBySemester[semester]++;
                languageAnalysis.semesterTotal[semester]++;
            }
        }
        
        // Bu derste PÇ.11 = 5 var mı kontrolü
        let has_PC11_5 = false;
        
        // Her ilişki satırında tüm PÇ'leri kontrol et
        iliskiTablosu.forEach(row => {
            Object.entries(row.programÇiktilariIliskileri).forEach(([pc, value]) => {
                // PC için veri yapısını oluştur
                if (!pcAnalysis[pc]) {
                    pcAnalysis[pc] = {
                        pc,
                        relatedCourses: new Set(),
                        values: [],
                        sum: 0,
                        max: 0,
                        has5Value: false, // 5 değerine sahip mi?
                        coursesWithMax5: [] // 5 değerine sahip dersler
                    };
                }
                
                // İlişki değerini kaydet
                if (value > 0) {
                    pcAnalysis[pc].relatedCourses.add(course.code);
                    pcAnalysis[pc].values.push(parseInt(value));
                    pcAnalysis[pc].sum += parseInt(value);
                    
                    // Maksimum değeri güncelle
                    const numValue = parseInt(value);
                    if (numValue > pcAnalysis[pc].max) {
                        pcAnalysis[pc].max = numValue;
                    }
                    
                    // 5 değeri varsa işaretle
                    if (numValue === 5) {
                        pcAnalysis[pc].has5Value = true;
                        pcAnalysis[pc].coursesWithMax5.push(course.code);
                        
                        // PÇ.11 için özel kontrol
                        if (pc === "PÇ.11") {
                            has_PC11_5 = true;
                            console.log(`PÇ.11 = 5 değeri ${course.code} (${course.name}) dersinde bulundu! ÖÇ: ${row.ogrenmeÇiktisiID}`);
                        }
                    }
                }
            });
        });
        
        // Bu derste PÇ.11 = 5 varsa listeye ekle
        if (has_PC11_5) {
            coursesWith_PC11_5.push(course.code);
        }
    });
    
    // PÇ.11 ile ilgili özel log
    console.log(`PÇ.11 = 5 değerine sahip ders sayısı: ${coursesWith_PC11_5.length}`);
    if (coursesWith_PC11_5.length > 0) {
        console.log(`PÇ.11 = 5 olan dersler: ${coursesWith_PC11_5.join(", ")}`);
    }
    
    // Tüm PC analizlerini kontrol et
    Object.entries(pcAnalysis).forEach(([pc, item]) => {
        console.log(`${pc}: ${item.has5Value ? item.coursesWithMax5.length + ' derste 5 değeri var' : '5 değeri yok'} (max: ${item.max})`);
    });
    
    // Dil analizinden yüzdeleri hesapla
    languageAnalysis.totalCourses = courseCount;
    languageAnalysis.englishPercentage = (languageAnalysis.english / courseCount * 100).toFixed(2);
    languageAnalysis.turkishPercentage = (languageAnalysis.turkish / courseCount * 100).toFixed(2);
    
    // Müfredat hedefi kontrolü (%30 İngilizce)
    languageAnalysis.targetPercentage = 30;
    languageAnalysis.targetStatus = languageAnalysis.englishPercentage >= languageAnalysis.targetPercentage ? 'success' : 'danger';
    languageAnalysis.targetDifference = (languageAnalysis.englishPercentage - languageAnalysis.targetPercentage).toFixed(2);
    
    // Ayrıntılı debug bilgisi
    console.log(`---------- DİL ANALİZİ SONUÇLARI ----------`);
    console.log(`Toplam Ders Sayısı: ${courseCount}`);
    console.log(`İngilizce Ders: ${languageAnalysis.english} (%${languageAnalysis.englishPercentage})`);
    console.log(`Türkçe Ders: ${languageAnalysis.turkish} (%${languageAnalysis.turkishPercentage})`);
    console.log(`Hedef: %30 İngilizce - Durum: %${languageAnalysis.englishPercentage} - ${languageAnalysis.targetStatus === 'success' ? 'BAŞARILI' : 'BAŞARISIZ'}`);
    console.log(`------------------------------------------`);
    
    console.log(`Dil Analizi: Toplam ${courseCount} ders, ${languageAnalysis.english} İngilizce (%${languageAnalysis.englishPercentage}), ${languageAnalysis.turkish} Türkçe (%${languageAnalysis.turkishPercentage})`);
    
    // Her PÇ için istatistikleri hesapla
    Object.values(pcAnalysis).forEach(item => {
        // İlişkili ders sayısı
        item.relatedCourseCount = item.relatedCourses.size;
        
        // Ortalama ilişki düzeyi
        item.avgRelationLevel = item.values.length > 0 ? 
            (item.sum / item.values.length).toFixed(2) : 0;
        
        // Kapsama yüzdesi (ilişkili ders sayısı / toplam ders sayısı)
        item.coveragePercentage = (item.relatedCourseCount / courseCount * 100).toFixed(2);
        
        // MUDEK Kriteri: En az bir derste 5 değerine ulaşılmalı
        // Durum değerlendirmesi - MUDEK kriterine göre güncellendi
        if (item.has5Value) {
            // Herhangi bir derste 5 değeri varsa "Yeterli"
            item.status = 'success';
            item.statusText = 'Yeterli';
            item.mudekNote = `${item.coursesWithMax5.length} derste 5 değerine ulaşılmış`;
        } else if (item.max >= 4) {
            // En yüksek değer 4 ise "Orta"
            item.status = 'warning';
            item.statusText = 'Orta';
            item.mudekNote = 'Hiçbir derste 5 değerine ulaşılmamış';
        } else {
            // En yüksek değer 3 veya altında ise "Yetersiz"
            item.status = 'danger';
            item.statusText = 'Yetersiz';
            item.mudekNote = `En yüksek değer ${item.max}`;
        }
    });
    
    // Sonuçları diziye dönüştür ve sırala
    const results = Object.values(pcAnalysis).sort((a, b) => a.pc.localeCompare(b.pc));
    
    return {
        pcResults: results,
        courseCount: courseCount,
        analysisDate: new Date().toLocaleString(),
        languageAnalysis: languageAnalysis
    };
}

/**
 * MUDEK analiz sonuçlarını görselleştirir
 * @param {Object} results - Analiz sonuçları
 */
function visualizeMudekAnalysisResults(results) {
    // ApexCharts kütüphanesinin yüklendiğinden emin ol
    if (typeof ApexCharts === 'undefined') {
        loadApexCharts().then(() => {
            visualizeMudekAnalysisResults(results);
        });
        return;
    }
    
    // Özet tablosunu güncelle
    updateMudekSummaryTable(results);
    
    // Müfredat program çıktıları kapsaması grafiği
    renderCurriculumPcCoverageChart(results);
    
    // Program çıktıları ağırlık dağılımı grafiği
    renderPcWeightDistributionChart(results);
    
    // İngilizce/Türkçe ders dağılımı grafiğini oluştur
    renderLanguageDistributionCharts(results.languageAnalysis);
}

/**
 * MUDEK özet tablosunu günceller
 * @param {Object} results - Analiz sonuçları
 */
function updateMudekSummaryTable(results) {
    const summaryTable = document.getElementById('pc-summary-table');
    if (!summaryTable) return;
    
    const tbody = summaryTable.querySelector('tbody');
    if (!tbody) return;
    
    let html = '';
    
    results.pcResults.forEach(item => {
        const statusClass = `table-${item.status}`;
        const statusIcon = item.status === 'success' ? 'check-circle' : 
                          (item.status === 'warning' ? 'exclamation-triangle' : 'times-circle');
        
        // İlk değeri (has5Value) ayrı bir kolonda göstererek daha belirgin hale getir
        const max5Tooltip = item.has5Value ? 
            `data-bs-toggle="tooltip" title="${item.coursesWithMax5.join(', ')} derslerinde 5 değerine ulaşılmış"` : '';
        
        const maxValueBadge = item.has5Value ? 
            `<span class="badge bg-success" ${max5Tooltip}><i class="fas fa-star"></i> 5</span>` : 
            `<span class="badge bg-secondary">${item.max}</span>`;
        
        html += `
            <tr class="${statusClass}">
                <td>${item.pc}</td>
                <td>${item.relatedCourseCount} / ${results.courseCount}</td>
                <td>
                    ${item.avgRelationLevel} / 5.0
                    <br><small class="text-muted">Max: ${maxValueBadge}</small>
                </td>
                <td>${item.coveragePercentage}%</td>
                <td>
                    <i class="fas fa-${statusIcon} me-1"></i>
                    ${item.statusText}
                    ${item.mudekNote ? `<br><small class="text-muted">${item.mudekNote}</small>` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Tooltipleri etkinleştir
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Müfredat program çıktıları kapsaması grafiğini oluşturur
 * @param {Object} results - Analiz sonuçları
 */
function renderCurriculumPcCoverageChart(results) {
    const chartContainer = document.getElementById('curriculum-pc-coverage-chart');
    if (!chartContainer) return;
    
    // Verileri hazırla
    const categories = results.pcResults.map(item => item.pc);
    const coverageData = results.pcResults.map(item => parseFloat(item.coveragePercentage));
    
    // Grafik oluştur
    const options = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '70%',
                colors: {
                    ranges: [{
                        from: 0,
                        to: 40,
                        color: '#F44336'
                    }, {
                        from: 40,
                        to: 70,
                        color: '#FFC107'
                    }, {
                        from: 70,
                        to: 100,
                        color: '#4CAF50'
                    }]
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val) {
                return val.toFixed(1) + '%';
            },
            style: {
                fontSize: '12px'
            }
        },
        series: [{
            name: 'Kapsama Yüzdesi',
            data: coverageData
        }],
        xaxis: {
            categories: categories,
            labels: {
                rotate: -45,
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            max: 100,
            labels: {
                formatter: function(val) {
                    return val.toFixed(0) + '%';
                }
            }
        },
        title: {
            text: 'Program Çıktıları Müfredat Kapsaması',
            align: 'center'
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val.toFixed(1) + '%';
                }
            }
        }
    };
    
    // Eğer chart zaten varsa temizle
    chartContainer.innerHTML = '';
    
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

/**
 * Program çıktıları ağırlık dağılımı grafiğini oluşturur
 * @param {Object} results - Analiz sonuçları
 */
function renderPcWeightDistributionChart(results) {
    const chartContainer = document.getElementById('pc-weight-distribution-chart');
    if (!chartContainer) return;
    
    // Verileri hazırla
    const categories = results.pcResults.map(item => item.pc);
    const avgData = results.pcResults.map(item => parseFloat(item.avgRelationLevel));
    
    // Grafik oluştur
    const options = {
        chart: {
            type: 'radar',
            height: 350,
            toolbar: {
                show: false
            }
        },
        series: [{
            name: 'Ortalama İlişki Düzeyi',
            data: avgData
        }],
        xaxis: {
            categories: categories
        },
        yaxis: {
            show: false,
            min: 0,
            max: 5
        },
        fill: {
            opacity: 0.6
        },
        markers: {
            size: 4
        },
        title: {
            text: 'Program Çıktıları Ağırlık Dağılımı',
            align: 'center'
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val.toFixed(2) + ' / 5.0';
                }
            }
        }
    };
    
    // Eğer chart zaten varsa temizle
    chartContainer.innerHTML = '';
    
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

/**
 * MUDEK raporu oluşturur ve indirir
 */
function exportMudekReport() {
    alert('MUDEK raporu oluşturuluyor... Bu özellik henüz geliştirme aşamasındadır.');
    
    // Rapor oluşturma işlemi burada olacak
    // PDF veya Excel formatında bir rapor oluşturulabilir
}

/**
 * Ders iş yükü tablosunu oluştur
 * @param {Object} workloadData 
 * @returns {string} HTML
 */
function generateWorkloadTable(workloadData) {
    if (!workloadData || !workloadData.etkinlikler || workloadData.etkinlikler.length === 0) {
        return '<div class="alert alert-warning">Ders iş yükü bilgisi bulunamadı.</div>';
    }

    let html = `
    <div class="table-responsive">
        <table class="table table-bordered table-striped">
            <thead class="table-primary">
                <tr>
                    <th>Etkinlik</th>
                    <th>Sayı</th>
                    <th>Süre (Saat)</th>
                    <th>Toplam İş Yükü</th>
                </tr>
            </thead>
            <tbody>`;
    
    workloadData.etkinlikler.forEach(item => {
        html += `
        <tr>
            <td>${item.etkinlik}</td>
            <td class="text-center">${item.sayi}</td>
            <td class="text-center">${item.sure}</td>
            <td class="text-center">${item.toplamIsYuku}</td>
        </tr>`;
    });
    
    html += `
            </tbody>
            <tfoot class="table-secondary">
                <tr>
                    <th colspan="3" class="text-end">Toplam İş Yükü:</th>
                    <th class="text-center">${workloadData.toplamIsYuku} saat</th>
                </tr>
                <tr>
                    <th colspan="3" class="text-end">AKTS Kredisi:</th>
                    <th class="text-center">${workloadData.dersAKTSKredisi}</th>
                </tr>
            </tfoot>
        </table>
    </div>
    <div class="alert alert-info mt-3">
        <p class="mb-0"><strong>Hesaplama:</strong> ${workloadData.hesaplama || "Toplam İş Yükü (Saat) / 25"}</p>
    </div>`;
    
    return html;
}

/**
 * Ders değerlendirme tablosunu oluştur
 * @param {Object} evaluationData 
 * @returns {string} HTML
 */
function generateEvaluationTable(evaluationData) {
    if (!evaluationData) {
        return '<div class="alert alert-warning">Ders değerlendirme bilgisi bulunamadı.</div>';
    }

    let html = `
    <div class="card mb-3">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Yarıyıl İçi Etkinlikleri</h5>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead class="table-primary">
                        <tr>
                            <th>Etkinlik</th>
                            <th>Sayı</th>
                            <th>Katkı Yüzdesi</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    if (evaluationData.yariyilIciEtkinlikleri && evaluationData.yariyilIciEtkinlikleri.length > 0) {
        evaluationData.yariyilIciEtkinlikleri.forEach(item => {
            html += `
            <tr>
                <td>${item.etkinlik}</td>
                <td class="text-center">${item.sayi}</td>
                <td class="text-center">%${item.katkiYuzdesi}</td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="3" class="text-center">Yarıyıl içi etkinlik bilgisi bulunamadı.</td></tr>`;
    }
    
    html += `
                    </tbody>
                    <tfoot class="table-secondary">
                        <tr>
                            <th colspan="2" class="text-end">Toplam:</th>
                            <th class="text-center">%${evaluationData.yariyilIciToplam || 0}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>

    <div class="card mb-3">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Yarıyıl Sonu Etkinlikleri</h5>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead class="table-primary">
                        <tr>
                            <th>Etkinlik</th>
                            <th>Sayı</th>
                            <th>Katkı Yüzdesi</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    if (evaluationData.yariyilSonuEtkinlikleri && evaluationData.yariyilSonuEtkinlikleri.length > 0) {
        evaluationData.yariyilSonuEtkinlikleri.forEach(item => {
            html += `
            <tr>
                <td>${item.etkinlik}</td>
                <td class="text-center">${item.sayi}</td>
                <td class="text-center">%${item.katkiYuzdesi}</td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="3" class="text-center">Yarıyıl sonu etkinlik bilgisi bulunamadı.</td></tr>`;
    }
    
    html += `
                    </tbody>
                    <tfoot class="table-secondary">
                        <tr>
                            <th colspan="2" class="text-end">Toplam:</th>
                            <th class="text-center">%${evaluationData.yariyilSonuToplam || 0}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Genel Değerlendirme</h5>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead class="table-primary">
                        <tr>
                            <th>Değerlendirme</th>
                            <th>Katkı Yüzdesi</th>
                        </tr>
                    </thead>
                    <tbody>`;
    
    if (evaluationData.genelDegerlendirme && evaluationData.genelDegerlendirme.length > 0) {
        evaluationData.genelDegerlendirme.forEach(item => {
            html += `
            <tr>
                <td>${item.degerlendirme}</td>
                <td class="text-center">%${item.katkiYuzdesi}</td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="2" class="text-center">Genel değerlendirme bilgisi bulunamadı.</td></tr>`;
    }
    
    html += `
                    </tbody>
                    <tfoot class="table-secondary">
                        <tr>
                            <th class="text-end">Toplam:</th>
                            <th class="text-center">%${evaluationData.genelDegerlendirmeToplam || 0}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>`;
    
    return html;
}

/**
 * Haftalık ders içerikleri tablosunu oluştur
 * @param {Array} weeklyData 
 * @returns {string} HTML
 */
function generateWeeklyContentTable(weeklyData) {
    if (!weeklyData || weeklyData.length === 0) {
        return '<div class="alert alert-warning">Haftalık ders içeriği bulunamadı.</div>';
    }

    let html = `
    <div class="table-responsive">
        <table class="table table-bordered table-striped">
            <thead class="table-primary">
                <tr>
                    <th>Hafta</th>
                    <th>İçerik</th>
                    <th>İlişkili ÖÇ</th>
                    <th>Öğretim Ortamı</th>
                    <th>Ön Hazırlık</th>
                    <th>Öğretim Yöntemleri</th>
                    <th>Araç ve Gereçler</th>
                    <th>Değerlendirme</th>
                </tr>
            </thead>
            <tbody>`;
    
    weeklyData.forEach(week => {
        html += `
        <tr>
            <td class="text-center">${week.hafta}</td>
            <td>${week.icerik}</td>
            <td class="text-center">${week.iliskiliOgrenmeÇiktisi || '-'}</td>
            <td>${week.ogretimOrtami || '-'}</td>
            <td>${week.onHazirlik || '-'}</td>
            <td>${week.ogretimYontemleri || '-'}</td>
            <td>${week.aracVeGerecler || '-'}</td>
            <td>${week.degerlendirmeYontemleri || '-'}</td>
        </tr>`;
    });
    
    html += `
            </tbody>
        </table>
    </div>`;
    
    return html;
}

/**
 * Toplumsal katkı ve sürdürülebilirlik bilgilerini oluştur
 * @param {Object} sustainabilityData 
 * @returns {string} HTML
 */
function generateSustainabilityInfo(sustainabilityData) {
    if (!sustainabilityData) {
        return '<div class="alert alert-warning">Toplumsal katkı ve sürdürülebilirlik bilgisi bulunamadı.</div>';
    }

    let html = `
    <div class="row">
        <div class="col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="fas fa-leaf me-2"></i> Sürdürülebilir Kalkınma Amaçları</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group">`;
    
    if (sustainabilityData.surdurulebilirKalkinmaAmaclari && sustainabilityData.surdurulebilirKalkinmaAmaclari.length > 0) {
        // Tüm maddeleri göster, seçili olup olmadığına bakarak ikon ve stil uygula
        sustainabilityData.surdurulebilirKalkinmaAmaclari.forEach(item => {
            if (item.secili) {
                html += `<li class="list-group-item d-flex align-items-center">
                    <span class="badge bg-success me-2"><i class="fas fa-check"></i></span>
                    ${item.amac}
                </li>`;
            } else {
                html += `<li class="list-group-item d-flex align-items-center text-muted">
                    <span class="badge bg-light text-muted me-2"><i class="fas fa-minus"></i></span>
                    ${item.amac}
                </li>`;
            }
        });
    } else {
        html += `<li class="list-group-item">Sürdürülebilir kalkınma amaçları bulunamadı.</li>`;
    }
    
    html += `
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0"><i class="fas fa-hands-helping me-2"></i> Toplumsal Katkı Alanları</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group">`;
    
    if (sustainabilityData.toplumsalKatkiAlanlari && sustainabilityData.toplumsalKatkiAlanlari.length > 0) {
        // Tüm maddeleri göster, seçili olup olmadığına bakarak ikon ve stil uygula
        sustainabilityData.toplumsalKatkiAlanlari.forEach(item => {
            if (item.secili) {
                html += `<li class="list-group-item d-flex align-items-center">
                    <span class="badge bg-info me-2"><i class="fas fa-check"></i></span>
                    ${item.alan}
                </li>`;
            } else {
                html += `<li class="list-group-item d-flex align-items-center text-muted">
                    <span class="badge bg-light text-muted me-2"><i class="fas fa-minus"></i></span>
                    ${item.alan}
                </li>`;
            }
        });
    } else {
        html += `<li class="list-group-item">Toplumsal katkı alanları bulunamadı.</li>`;
    }
    
    html += `
                    </ul>
                </div>
            </div>
        </div>
    </div>`;
    
    return html;
}

/**
 * ÖÇ-PÇ İlişki Matrisi tablosunu oluştur
 * @param {Object} relationMatrixData 
 * @param {Array} outcomes 
 * @param {Array} programs 
 * @returns {string} HTML
 */
function generateRelationMatrixTable(relationMatrixData, outcomes, programs) {
    let html = '<div class="table-responsive">';
    html += '<table class="table table-bordered table-striped">';
    html += '<thead class="table-primary">';
    html += '<tr>';
    html += '<th>Program</th>';
    outcomes.forEach(outcome => {
        html += `<th>${outcome.etkinlik}</th>`;
    });
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    programs.forEach(program => {
        html += '<tr>';
        html += `<td>${program.name}</td>`;
        outcomes.forEach(outcome => {
            html += `<td>${relationMatrixData[program.id] && relationMatrixData[program.id][outcome.id] ? relationMatrixData[program.id][outcome.id] : '-'}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    return html;
}

/**
 * Geliştirici araçlarını ekler - gözden uzak bir konumda
 */
function addDeveloperTools() {
    // Footer'a gizli bir düğme ekle
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    // Geliştirici araçları düğmesini oluştur
    const devButton = document.createElement('button');
    devButton.className = 'btn btn-sm btn-link text-muted mt-3 developer-tools-btn';
    devButton.innerHTML = '<i class="fas fa-code"></i> Geliştirici Araçları';
    devButton.style.opacity = '0.5';
    devButton.style.fontSize = '0.8rem';
    
    // Footer'a ekle
    footer.appendChild(devButton);
    
    // Tıklama olayını ekle
    devButton.addEventListener('click', showDeveloperTools);
}

/**
 * Geliştirici araçları modalını gösterir
 */
function showDeveloperTools() {
    // Modal HTML'i
    const modalHTML = `
        <div class="modal fade" id="developerToolsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Geliştirici Araçları</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="data-test-tab" data-bs-toggle="tab" 
                                        data-bs-target="#data-test" type="button" role="tab">
                                    Veri Yükleme Testi
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="course-map-test-tab" data-bs-toggle="tab" 
                                        data-bs-target="#course-map-test" type="button" role="tab">
                                    Ders Kodu Haritası Testi
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="console-tab" data-bs-toggle="tab" 
                                        data-bs-target="#console" type="button" role="tab">
                                    Konsol Çıktısı
                                </button>
                            </li>
                        </ul>
                        <div class="tab-content pt-3">
                            <!-- Veri Yükleme Testi -->
                            <div class="tab-pane fade show active" id="data-test" role="tabpanel">
                                <div class="mb-3">
                                    <h6>Veri Yükleme Durumu</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered">
                                            <tbody>
                                                <tr>
                                                    <td><strong>2020 Müfredatı:</strong></td>
                                                    <td><span id="courses-2020-count">${courseData['2020']?.length || 0}</span> ders</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>2024 Müfredatı:</strong></td>
                                                    <td><span id="courses-2024-count">${courseData['2024']?.length || 0}</span> ders</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Kariyer Yolları:</strong></td>
                                                    <td><span id="career-paths-count">${careerPathsData?.length || 0}</span> yol</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Aktif Müfredat:</strong></td>
                                                    <td id="active-curriculum">${currentCurriculum}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <button id="reload-data-btn" class="btn btn-primary btn-sm w-100">
                                            <i class="fas fa-sync-alt me-1"></i> Verileri Yeniden Yükle
                                        </button>
                                    </div>
                                    <div class="col-md-6">
                                        <button id="clear-cache-btn" class="btn btn-warning btn-sm w-100">
                                            <i class="fas fa-broom me-1"></i> Önbelleği Temizle
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="alert alert-info" id="data-test-info">
                                    Bu panel, veri yükleme durumunu test etmek ve sorun gidermek için kullanılabilir.
                                </div>
                            </div>
                            
                            <!-- Ders Kodu Haritası Testi -->
                            <div class="tab-pane fade" id="course-map-test" role="tabpanel">
                                <div class="mb-3">
                                    <h6>Ders Kodu Haritası Testi</h6>
                                    <p>Bu bölüm, ders kodlarının JSON dosyalarıyla eşleştirilmesini test etmek için kullanılır.</p>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-8">
                                            <div class="input-group">
                                                <input type="text" id="course-code-input" class="form-control" 
                                                       placeholder="Ders kodu girin (örn: CE103, CEN103, MAT181)">
                                                <select id="curriculum-selector" class="form-select" style="max-width: 110px;">
                                                    <option value="2020">2020</option>
                                                    <option value="2024">2024</option>
                                                </select>
                                                <button id="test-course-code-btn" class="btn btn-primary">
                                                    <i class="fas fa-search me-1"></i> Ara
                                                </button>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <button id="scan-all-courses-btn" class="btn btn-info w-100">
                                                <i class="fas fa-sync-alt me-1"></i> Tüm Dosyaları Tara
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="alert alert-primary mb-3">
                                        <div class="mb-1"><strong>Tarama Durumu:</strong> <span id="scan-status">Bekleniyor</span></div>
                                        <div><strong>Taranan Dosya Sayısı:</strong> <span id="scanned-files-count">0</span></div>
                                    </div>
                                </div>
                                
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h6 class="mb-0">Test Sonuçları</h6>
                                    </div>
                                    <div class="card-body">
                                        <div id="course-test-results">
                                            <div class="text-muted text-center py-3">
                                                Ders kodu girerek aramayı başlatın
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Konsol Çıktısı -->
                            <div class="tab-pane fade" id="console" role="tabpanel">
                                <div class="mb-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="enable-console-capture">
                                        <label class="form-check-label" for="enable-console-capture">
                                            Konsol Çıktısını Yakala
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0">Konsol Çıktısı</h6>
                                        <button id="clear-console-btn" class="btn btn-sm btn-outline-secondary">
                                            <i class="fas fa-eraser me-1"></i> Temizle
                                        </button>
                                    </div>
                                    <div class="card-body p-0">
                                        <pre id="console-output" class="bg-dark text-light p-3" style="max-height: 300px; overflow-y: auto; font-size: 0.8rem;"></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Modal'ı body'ye ekle (eğer zaten yoksa)
    if (!document.getElementById('developerToolsModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Modal olaylarını ayarla
        setupDeveloperToolsEvents();
    }
    
    // Modal'ı göster
    const modal = new bootstrap.Modal(document.getElementById('developerToolsModal'));
    modal.show();
}

/**
 * Geliştirici araçları için olayları ayarlar
 */
function setupDeveloperToolsEvents() {
    // Veri yeniden yükleme butonu
    const reloadDataBtn = document.getElementById('reload-data-btn');
    if (reloadDataBtn) {
        reloadDataBtn.addEventListener('click', async function() {
            const infoElement = document.getElementById('data-test-info');
            infoElement.className = 'alert alert-info';
            infoElement.innerHTML = '<div class="d-flex align-items-center"><div class="spinner-border spinner-border-sm me-2" role="status"></div> Veriler yeniden yükleniyor...</div>';
            
            try {
                await loadAllData();
                
                // Sayaçları güncelle
                document.getElementById('courses-2020-count').textContent = courseData['2020']?.length || 0;
                document.getElementById('courses-2024-count').textContent = courseData['2024']?.length || 0;
                document.getElementById('career-paths-count').textContent = careerPathsData?.length || 0;
                
                infoElement.className = 'alert alert-success';
                infoElement.innerHTML = '<i class="fas fa-check-circle me-2"></i> Veriler başarıyla yeniden yüklendi!';
            } catch (error) {
                infoElement.className = 'alert alert-danger';
                infoElement.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> Hata: ${error.message}`;
            }
        });
    }
    
    // Önbellek temizleme butonu
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', function() {
            const infoElement = document.getElementById('data-test-info');
            infoElement.className = 'alert alert-info';
            infoElement.innerHTML = '<div class="d-flex align-items-center"><div class="spinner-border spinner-border-sm me-2" role="status"></div> Önbellek temizleniyor...</div>';
            
            try {
                // LocalStorage'dan ilgili verileri temizle
                localStorage.removeItem('preferredCurriculum');
                
                // CourseMapLoader'ın verilerini sıfırla
                if (window.CourseMapLoader) {
                    window.CourseMapLoader.courseFileMap = {
                        '2020': {},
                        '2024': {}
                    };
                    window.CourseMapLoader.scanComplete = false;
                    window.CourseMapLoader.pendingRequests = [];
                }
                
                infoElement.className = 'alert alert-success';
                infoElement.innerHTML = '<i class="fas fa-check-circle me-2"></i> Önbellek başarıyla temizlendi!';
            } catch (error) {
                infoElement.className = 'alert alert-danger';
                infoElement.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> Hata: ${error.message}`;
            }
        });
    }
    
    // Ders kodu test butonu
    const testCourseCodeBtn = document.getElementById('test-course-code-btn');
    if (testCourseCodeBtn) {
        testCourseCodeBtn.addEventListener('click', async function() {
            const courseCode = document.getElementById('course-code-input').value.trim();
            const curriculum = document.getElementById('curriculum-selector').value;
            const resultsContainer = document.getElementById('course-test-results');
            
            if (!courseCode) {
                resultsContainer.innerHTML = '<div class="alert alert-warning">Lütfen bir ders kodu girin</div>';
                return;
            }
            
            resultsContainer.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                </div>
            `;
            
            try {
                // Önce CourseMapLoader ile ders detaylarını ara
                let detailData = null;
                let fileFound = false;
                let filePath = '';
                
                // Ders dosyasını bulmaya çalış
                if (window.CourseMapLoader) {
                    try {
                        // Alternatifleri kontrol et
                        const courseVariants = window.CourseMapLoader.addCECENVariants ? 
                            window.CourseMapLoader.addCECENVariants(courseCode) : [courseCode];
                            
                        for (const variant of courseVariants) {
                            try {
                                // Dosya yolunu kontrol et
                                filePath = window.CourseMapLoader.findCourseFile(curriculum, variant);
                                if (filePath) {
                                    fileFound = true;
                                    break;
                                }
                            } catch (e) {
                                console.log(`${variant} için dosya bulunamadı:`, e.message);
                            }
                        }
                        
                        // Dosyayı bulduktan sonra detayları al
                        if (fileFound) {
                            detailData = await window.CourseMapLoader.getCourseDetails(curriculum, courseCode);
                        }
                    } catch (error) {
                        console.error(`${courseCode} için detaylar alınamadı:`, error);
                    }
                }
                
                // Sonuçları göster
                let html = '';
                
                if (fileFound) {
                    html += `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i>
                            <strong>Başarılı!</strong> "${courseCode}" için JSON dosyası bulundu.
                        </div>
                        <div class="mb-3">
                            <strong>Bulunan Dosya:</strong> ${filePath}
                        </div>
                    `;
                    
                    if (detailData) {
                        html += `
                            <div class="mb-3">
                                <h6>Ders Detayları:</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered">
                                        <tbody>
                                            <tr>
                                                <td width="150"><strong>Ders Kodu:</strong></td>
                                                <td>${detailData.dersGenel?.dersKodu || 'Belirtilmemiş'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Ders Adı:</strong></td>
                                                <td>${detailData.dersGenel?.dersAdi || 'Belirtilmemiş'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>ÖÇ-PÇ İlişkisi:</strong></td>
                                                <td>
                                                    ${detailData.programVeOgrenmeIliskisi ? 
                                                      `<span class="badge bg-success">Mevcut</span> 
                                                       (${detailData.programVeOgrenmeIliskisi.iliskiTablosu?.length || 0} adet öğrenim çıktısı)` : 
                                                      '<span class="badge bg-danger">Bulunmuyor</span>'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td><strong>Toplam alan:</strong></td>
                                                <td>${Object.keys(detailData).length} alan</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <button class="btn btn-sm btn-outline-primary" onclick="showCourseDetails('${courseCode}')">
                                <i class="fas fa-eye me-1"></i> Detayları Görüntüle
                            </button>
                        `;
                    } else {
                        html += `
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Dosya bulundu fakat içeriği yüklenemedi.
                            </div>
                        `;
                    }
                } else {
                    html += `
                        <div class="alert alert-danger">
                            <i class="fas fa-times-circle me-2"></i>
                            <strong>Başarısız!</strong> "${courseCode}" için JSON dosyası bulunamadı.
                        </div>
                        <div class="mb-3">
                            <strong>Aranan dosya desenleri:</strong>
                            <ul class="small">
                                <li>${curriculum}-*-${courseCode.toLowerCase()}-*.json</li>
                                <li>${curriculum}_*_${courseCode.toLowerCase()}_*.json</li>
                                <li>${curriculum.toLowerCase()}-*-${courseCode.toLowerCase()}-*.json</li>
                            </ul>
                        </div>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>İpucu:</strong> CourseMapLoader.scanAllJsonFiles() ile tüm dosyaları tarayın.
                        </div>
                    `;
                }
                
                resultsContainer.innerHTML = html;
                
            } catch (error) {
                resultsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Hata:</strong> ${error.message}
                    </div>
                `;
            }
        });
    }
    
    // Tüm dosyaları tarama butonu
    const scanAllCoursesBtn = document.getElementById('scan-all-courses-btn');
    if (scanAllCoursesBtn) {
        scanAllCoursesBtn.addEventListener('click', async function() {
            const scanStatus = document.getElementById('scan-status');
            const scannedFilesCount = document.getElementById('scanned-files-count');
            
            // Tarama durumunu değiştir
            scanStatus.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Taranıyor...';
            
            // Tarama işlemini başlat
            try {
                if (window.CourseMapLoader && window.CourseMapLoader.scanAllJsonFiles) {
                    // Orijinal fonksiyonu yedekle
                    const originalProcessFile = window.CourseMapLoader.processJsonFile;
                    
                    // Sayaç için işlem sayısını kaydedecek değişken
                    let processedCount = 0;
                    
                    // Fonksiyonu geçici olarak değiştir, dosya işleme sırasında sayacı artır
                    window.CourseMapLoader.processJsonFile = function(filePath) {
                        processedCount++;
                        scannedFilesCount.textContent = processedCount;
                        return originalProcessFile.call(window.CourseMapLoader, filePath);
                    };
                    
                    // Tüm dosyaları tara
                    await window.CourseMapLoader.scanAllJsonFiles();
                    
                    // Orijinal fonksiyonu geri yükle
                    window.CourseMapLoader.processJsonFile = originalProcessFile;
                    
                    // Tarama durumunu güncelle
                    scanStatus.textContent = 'Tamamlandı';
                    scanStatus.className = 'text-success';
                } else {
                    scanStatus.textContent = 'Hata: CourseMapLoader mevcut değil';
                    scanStatus.className = 'text-danger';
                }
            } catch (error) {
                console.error('Dosya tarama hatası:', error);
                scanStatus.textContent = `Hata: ${error.message}`;
                scanStatus.className = 'text-danger';
            }
        });
    }
    
    // Konsol çıktısını yakalama
    const enableConsoleCapture = document.getElementById('enable-console-capture');
    const consoleOutput = document.getElementById('console-output');
    
    if (enableConsoleCapture && consoleOutput) {
        // Orijinal konsol fonksiyonlarını yedekle
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };
        
        // Konsol çıktısını temizleme
        const clearConsoleBtn = document.getElementById('clear-console-btn');
        if (clearConsoleBtn) {
            clearConsoleBtn.addEventListener('click', function() {
                consoleOutput.innerHTML = '';
            });
        }
        
        // Konsol yakalama etkinleştirildiğinde
        enableConsoleCapture.addEventListener('change', function() {
            if (this.checked) {
                // Konsol fonksiyonlarını override et
                console.log = function() {
                    const args = Array.from(arguments);
                    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
                    consoleOutput.innerHTML += `<div class="log-line"><span class="text-info">[LOG]</span> ${message}</div>`;
                    consoleOutput.scrollTop = consoleOutput.scrollHeight;
                    originalConsole.log.apply(console, arguments);
                };
                
                console.warn = function() {
                    const args = Array.from(arguments);
                    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
                    consoleOutput.innerHTML += `<div class="log-line"><span class="text-warning">[WARN]</span> ${message}</div>`;
                    consoleOutput.scrollTop = consoleOutput.scrollHeight;
                    originalConsole.warn.apply(console, arguments);
                };
                
                console.error = function() {
                    const args = Array.from(arguments);
                    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
                    consoleOutput.innerHTML += `<div class="log-line"><span class="text-danger">[ERROR]</span> ${message}</div>`;
                    consoleOutput.scrollTop = consoleOutput.scrollHeight;
                    originalConsole.error.apply(console, arguments);
                };
                
                console.info = function() {
                    const args = Array.from(arguments);
                    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
                    consoleOutput.innerHTML += `<div class="log-line"><span class="text-light">[INFO]</span> ${message}</div>`;
                    consoleOutput.scrollTop = consoleOutput.scrollHeight;
                    originalConsole.info.apply(console, arguments);
                };
                
                consoleOutput.innerHTML += '<div class="text-success">Konsol çıktısı yakalanıyor...</div>';
            } else {
                // Orijinal konsol fonksiyonlarını geri yükle
                console.log = originalConsole.log;
                console.warn = originalConsole.warn;
                console.error = originalConsole.error;
                console.info = originalConsole.info;
                
                consoleOutput.innerHTML += '<div class="text-warning">Konsol çıktısı yakalama durduruldu.</div>';
            }
        });
    }
}

/**
 * İngilizce/Türkçe ders dağılımı grafiklerini oluşturur
 * @param {Object} languageAnalysis - Dil analizi sonuçları
 */
function renderLanguageDistributionCharts(languageAnalysis) {
    // Dil dağılımı için önce HTML containerları ekle
    let languageChartsHTML = `
        <div class="row mb-4 mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="fas fa-language me-2"></i> İngilizce/Türkçe Ders Analizi</h5>
                    </div>
                    <div class="card-body">
                        <div class="alert ${languageAnalysis.targetStatus === 'success' ? 'alert-success' : 'alert-danger'}">
                            <div class="d-flex align-items-center">
                                <div class="flex-shrink-0 me-3">
                                    <i class="fas ${languageAnalysis.targetStatus === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} fa-2x"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="mb-1">%30 İngilizce Ders Hedefi</h5>
                                    <p class="mb-0">Mevcut durum: <strong>%${languageAnalysis.englishPercentage}</strong> 
                                    (Hedeften ${languageAnalysis.targetDifference >= 0 ? `<span class="text-success">%${languageAnalysis.targetDifference} fazla</span>` : 
                                    `<span class="text-danger">%${Math.abs(languageAnalysis.targetDifference)} eksik</span>`})</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h6 class="mb-0">Genel Dil Dağılımı</h6>
                                    </div>
                                    <div class="card-body">
                                        <div id="language-pie-chart" style="height: 300px;"></div>
                                    </div>
                                    <div class="card-footer bg-light">
                                        <div class="row text-center">
                                            <div class="col-6">
                                                <div class="h5 mb-0 text-primary">${languageAnalysis.english}</div>
                                                <div class="small text-muted">İngilizce Ders</div>
                                            </div>
                                            <div class="col-6">
                                                <div class="h5 mb-0 text-success">${languageAnalysis.turkish}</div>
                                                <div class="small text-muted">Türkçe Ders</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card mb-3">
                                    <div class="card-header">
                                        <h6 class="mb-0">Ders Tipine Göre Dil Dağılımı</h6>
                                    </div>
                                    <div class="card-body">
                                        <div id="language-by-type-chart" style="height: 300px;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Dönemlere Göre Dil Dağılımı</h6>
                            </div>
                            <div class="card-body">
                                <div id="language-by-semester-chart" style="height: 350px;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // HTML'i MUDEK analiz panelinin içine ekle
    const mudekPanel = document.getElementById('mudek-analysis-panel');
    if (mudekPanel) {
        const cardBody = mudekPanel.querySelector('.card-body');
        if (cardBody) {
            // Eğer önceden eklenmiş dil analizi varsa kaldır
            const existingAnalysis = cardBody.querySelector('.language-analysis-container');
            if (existingAnalysis) {
                existingAnalysis.remove();
            }
            
            // Yeni dil analizi ekle - düğmelerden önce
            const buttonContainer = cardBody.querySelector('.d-flex.justify-content-between');
            if (buttonContainer) {
                const container = document.createElement('div');
                container.className = 'language-analysis-container';
                container.innerHTML = languageChartsHTML;
                cardBody.insertBefore(container, buttonContainer);
            } else {
                // Düğmeler yoksa en sona ekle
                const container = document.createElement('div');
                container.className = 'language-analysis-container';
                container.innerHTML = languageChartsHTML;
                cardBody.appendChild(container);
            }
        }
    }
    
    // Genel dil dağılımı pasta grafiği
    renderLanguagePieChart(languageAnalysis);
    
    // Ders tipine göre dil dağılımı grafiği
    renderLanguageByTypeChart(languageAnalysis);
    
    // Dönemlere göre dil dağılımı grafiği
    renderLanguageBySemesterChart(languageAnalysis);
}

/**
 * Genel dil dağılımı pasta grafiği
 * @param {Object} languageAnalysis - Dil analizi sonuçları
 */
function renderLanguagePieChart(languageAnalysis) {
    const chartContainer = document.getElementById('language-pie-chart');
    if (!chartContainer) return;
    
    const options = {
        chart: {
            type: 'pie',
            height: 300,
            toolbar: {
                show: false
            }
        },
        series: [languageAnalysis.english, languageAnalysis.turkish],
        labels: ['İngilizce', 'Türkçe'],
        colors: ['#3498db', '#2ecc71'],
        title: {
            text: `İngilizce/Türkçe Ders Oranı (${languageAnalysis.totalCourses} ders)`,
            align: 'center'
        },
        legend: {
            position: 'bottom'
        },
        plotOptions: {
            pie: {
                // Donut yerine normal pasta grafiği kullan
                donut: {
                    size: '0%' // 0% ile normal pasta grafiği olur
                }
            }
        },
        dataLabels: {
            formatter: function(value, { seriesIndex, w }) {
                // Yüzde 0 olsa bile en az 1 piksellik görünür alan olsun
                const percentage = (value / languageAnalysis.totalCourses * 100).toFixed(1);
                if (percentage < 0.1 && value > 0) return "< 0.1%";
                return `%${percentage}`;
            }
        },
        tooltip: {
            y: {
                formatter: function(value) {
                    return `${value} ders (%${(value / languageAnalysis.totalCourses * 100).toFixed(1)})`;
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    height: 250
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };
    
    // Eğer chart zaten varsa temizle
    chartContainer.innerHTML = '';
    
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

/**
 * Ders tipine göre dil dağılımı grafiği
 * @param {Object} languageAnalysis - Dil analizi sonuçları
 */
function renderLanguageByTypeChart(languageAnalysis) {
    const chartContainer = document.getElementById('language-by-type-chart');
    if (!chartContainer) return;
    
    const options = {
        chart: {
            type: 'bar',
            height: 300,
            stacked: true,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '50%'
            }
        },
        series: [
            {
                name: 'İngilizce',
                data: [
                    languageAnalysis.englishByType.mandatory,
                    languageAnalysis.englishByType.elective
                ],
                color: '#3498db'
            },
            {
                name: 'Türkçe',
                data: [
                    languageAnalysis.turkishByType.mandatory,
                    languageAnalysis.turkishByType.elective
                ],
                color: '#2ecc71'
            }
        ],
        xaxis: {
            categories: ['Zorunlu Dersler', 'Seçmeli Dersler'],
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            title: {
                text: 'Ders Sayısı'
            }
        },
        legend: {
            position: 'top'
        },
        dataLabels: {
            enabled: true,
            formatter: function(val) {
                return val;
            }
        },
        tooltip: {
            y: {
                formatter: function(val, { seriesIndex, dataPointIndex, w }) {
                    const series = w.config.series;
                    const totalForCategory = series.reduce((acc, s) => acc + s.data[dataPointIndex], 0);
                    const percentage = (val / totalForCategory * 100).toFixed(1);
                    return `${val} ders (%${percentage})`;
                }
            }
        }
    };
    
    // Eğer chart zaten varsa temizle
    chartContainer.innerHTML = '';
    
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}

/**
 * Dönemlere göre dil dağılımı grafiği
 * @param {Object} languageAnalysis - Dil analizi sonuçları
 */
function renderLanguageBySemesterChart(languageAnalysis) {
    const chartContainer = document.getElementById('language-by-semester-chart');
    if (!chartContainer) return;
    
    // Dönem verilerini diziye dönüştür
    const semesterData = Object.keys(languageAnalysis.semesterTotal).map(semester => ({
        semester: parseInt(semester),
        english: languageAnalysis.englishBySemester[semester],
        turkish: languageAnalysis.turkishBySemester[semester],
        total: languageAnalysis.semesterTotal[semester]
    })).filter(item => item.total > 0).sort((a, b) => a.semester - b.semester);
    
    // Dönem etiketleri
    const categories = semesterData.map(item => `${item.semester}. Dönem`);
    
    // İngilizce ve Türkçe ders sayıları
    const englishData = semesterData.map(item => item.english);
    const turkishData = semesterData.map(item => item.turkish);
    
    // İngilizce yüzdeleri
    const englishPercentages = semesterData.map(item => 
        ((item.english / item.total) * 100).toFixed(1)
    );
    
    const options = {
        chart: {
            type: 'bar',
            height: 350,
            stacked: true,
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '60%'
            }
        },
        series: [
            {
                name: 'İngilizce',
                data: englishData,
                color: '#3498db'
            },
            {
                name: 'Türkçe',
                data: turkishData,
                color: '#2ecc71'
            }
        ],
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            title: {
                text: 'Ders Sayısı'
            }
        },
        legend: {
            position: 'top'
        },
        dataLabels: {
            enabled: true,
            formatter: function(val) {
                return val;
            }
        },
        tooltip: {
            y: {
                formatter: function(val, { seriesIndex, dataPointIndex, w }) {
                    const series = w.config.series;
                    const totalForCategory = series.reduce((acc, s) => acc + s.data[dataPointIndex], 0);
                    const percentage = (val / totalForCategory * 100).toFixed(1);
                    return `${val} ders (%${percentage})`;
                }
            }
        },
        annotations: {
            yaxis: [{
                y: 0,
                y2: 0,
                strokeDashArray: 0,
                borderColor: '#c2c2c2',
                fillColor: '#c2c2c2',
                opacity: 0.3,
                label: {
                    borderColor: '#c2c2c2',
                    style: {
                        fontSize: '10px',
                        color: '#fff',
                        background: '#c2c2c2',
                    },
                    text: '0',
                }
            }],
            points: semesterData.map((item, index) => ({
                x: categories[index],
                y: item.total,
                marker: {
                    size: 6,
                    fillColor: '#ff6b6b',
                    strokeColor: '#ffffff',
                    strokeWidth: 2,
                    radius: 2
                },
                label: {
                    borderColor: '#ff6b6b',
                    offsetY: 0,
                    style: {
                        color: '#fff',
                        background: '#ff6b6b',
                    },
                    text: `%${englishPercentages[index]} İng`,
                }
            }))
        }
    };
    
    // Eğer chart zaten varsa temizle
    chartContainer.innerHTML = '';
    
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
}