const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

console.log('🚀 GitHub Pages için statik build başlatılıyor...');

async function buildStatic() {
    try {
        // Dist klasörünü temizle ve oluştur
        const distDir = path.join(__dirname, 'dist');
        
        // Windows için güvenli temizleme - birden fazla yöntem dene
        console.log('🗑️  Eski dist klasörü temizleniyor...');
        
        try {
            if (await fs.pathExists(distDir)) {
                // Önce içindeki dosyaları tek tek sil
                try {
                    const items = await fs.readdir(distDir);
                    for (const item of items) {
                        const itemPath = path.join(distDir, item);
                        try {
                            await fs.remove(itemPath);
                        } catch (itemError) {
                            console.warn(`⚠️  ${item} silinemedi:`, itemError.message);
                        }
                    }
                } catch (readError) {
                    console.warn('⚠️  Dist içeriği okunamadı:', readError.message);
                }
                
                // Sonra klasörü silmeye çalış
                try {
                    await fs.remove(distDir);
                    console.log('✅ Eski dist klasörü silindi');
                } catch (removeError) {
                    console.warn('⚠️  Dist klasörü silinemedi:', removeError.message);
                    // Silme başarısız olduysa içini boşalt
                    try {
                        await fs.emptyDir(distDir);
                        console.log('✅ Dist klasörü içeriği temizlendi');
                    } catch (emptyError) {
                        console.warn('⚠️  Dist klasörü temizlenemedi, yeni klasör oluşturuluyor...', emptyError.message);
                    }
                }
            }
        } catch (pathError) {
            console.warn('⚠️  Dist klasörü kontrol edilemedi:', pathError.message);
        }
        
        // Dist klasörünü kesin oluştur
        try {
            await fs.ensureDir(distDir);
            console.log('✅ Dist klasörü hazırlandı');
        } catch (ensureError) {
            console.error('❌ Dist klasörü oluşturulamadı:', ensureError);
            throw ensureError;
        }

        // Ana dosyaları kopyala
        const filesToCopy = [
            'index.html',
            'js/',
            'css/',
            'data/',
            'career_data/',
            'assets/',
            '2020_2024_course_details_json/'
        ];

        for (const file of filesToCopy) {
            const srcPath = path.join(__dirname, file);
            const destPath = path.join(distDir, file);
            
            try {
                if (await fs.pathExists(srcPath)) {
                    await fs.copy(srcPath, destPath, { overwrite: true });
                    console.log(`✅ ${file} kopyalandı`);
                } else {
                    console.log(`⚠️  ${file} bulunamadı, atlanıyor`);
                }
            } catch (copyError) {
                console.error(`❌ ${file} kopyalanırken hata:`, copyError.message);
                // Kritik dosyalar için hatayı fırlat
                if (['index.html', 'js/', 'css/'].includes(file)) {
                    throw copyError;
                }
            }
        }

        // API endpoint'lerini statik JSON dosyalarına dönüştür
        await generateStaticAPIFiles(distDir);

        // GitHub Pages için .nojekyll oluştur (Jekyll'i devre dışı bırak)
        await fs.writeFile(path.join(distDir, '.nojekyll'), '');
        console.log('✅ .nojekyll dosyası oluşturuldu');

        // JavaScript dosyalarını GitHub Pages için güncelle
        await updateJSForStatic(distDir);

        console.log('🎉 Statik build tamamlandı! Dosyalar dist/ klasöründe');
        console.log('📁 Build edilen dosyalar:');
        
        try {
            const files = glob.sync('**/*', { cwd: distDir, nodir: true });
            const fileCount = files.length;
            console.log(`   📊 Toplam ${fileCount} dosya build edildi`);
            
            // İlk 10 dosyayı göster
            files.slice(0, 10).forEach(file => console.log(`   - ${file}`));
            if (fileCount > 10) {
                console.log(`   ... ve ${fileCount - 10} dosya daha`);
            }
        } catch (listError) {
            console.warn('⚠️  Dosya listesi oluşturulamadı:', listError.message);
        }

    } catch (error) {
        console.error('❌ Build hatası:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

async function generateStaticAPIFiles(distDir) {
    console.log('🔄 API endpointleri statik dosyalara dönüştürülüyor...');
    
    try {
        const apiDir = path.join(distDir, 'api');
        await fs.ensureDir(apiDir);

        // Ders JSON dosyalarını listele
        const courseJsonFiles = glob.sync('2020_2024_course_details_json/**/*.json', { cwd: __dirname });
        const fileUrls = courseJsonFiles.map(file => '/' + file.replace(/\\/g, '/'));
        
        await fs.writeJSON(path.join(apiDir, 'list-course-json-files.json'), fileUrls, { spaces: 2 });
        console.log('✅ Course JSON files API oluşturuldu');

        // Ders kodu haritası oluştur
        const courseCodeMap = await generateCourseCodeMap();
        await fs.writeJSON(path.join(apiDir, 'course-code-map.json'), courseCodeMap, { spaces: 2 });
        console.log('✅ Course code map API oluşturuldu');
    } catch (error) {
        console.error('❌ API dosyaları oluşturulurken hata:', error);
        throw error;
    }
}

async function generateCourseCodeMap() {
    const courseCodeMap = { '2020': {}, '2024': {} };
    const jsonFiles = glob.sync('2020_2024_course_details_json/**/*.json', { cwd: __dirname });

    console.log(`📚 ${jsonFiles.length} ders dosyası işleniyor...`);
    
    for (const filePath of jsonFiles) {
        try {
            const content = await fs.readFile(path.join(__dirname, filePath), 'utf8');
            const data = JSON.parse(content);
            
            if (data.dersGenel && data.dersGenel.dersKodu) {
                const courseCode = data.dersGenel.dersKodu.toUpperCase();
                const curriculum = data.dersGenel.mufredatOlusturulmaYili || '';
                const relativePath = '/' + filePath.replace(/\\/g, '/');
                
                if (curriculum === '2020' || curriculum === '2024') {
                    courseCodeMap[curriculum][courseCode] = relativePath;
                    
                    // CE/CEN dönüşümleri
                    if (courseCode.startsWith('CE') && !courseCode.startsWith('CEN')) {
                        courseCodeMap[curriculum][courseCode.replace('CE', 'CEN')] = relativePath;
                    } else if (courseCode.startsWith('CEN')) {
                        courseCodeMap[curriculum][courseCode.replace('CEN', 'CE')] = relativePath;
                    }
                } else {
                    // Müfredat bilinmiyorsa her ikisine de ekle
                    courseCodeMap['2020'][courseCode] = relativePath;
                    courseCodeMap['2024'][courseCode] = relativePath;
                }
            }
        } catch (error) {
            console.warn(`⚠️  ${filePath} işlenirken hata:`, error.message);
        }
    }

    console.log(`✅ Ders kodu haritası oluşturuldu: 2020 (${Object.keys(courseCodeMap['2020']).length}), 2024 (${Object.keys(courseCodeMap['2024']).length})`);
    return courseCodeMap;
}

async function updateJSForStatic(distDir) {
    console.log('🔄 JavaScript dosyaları GitHub Pages için güncelleniyor...');
    
    const jsFilesToUpdate = [
        { file: 'career_data_loader.js', name: 'career_data_loader.js' },
        { file: 'course_map_loader.js', name: 'course_map_loader.js' }
    ];
    
    for (const jsFile of jsFilesToUpdate) {
        const filePath = path.join(distDir, 'js', jsFile.file);
        try {
            if (await fs.pathExists(filePath)) {
                let content = await fs.readFile(filePath, 'utf8');
                
                // API çağrılarını statik dosya çağrılarına dönüştür
                content = content.replace(
                    /\/api\/list-course-json-files/g,
                    '/api/list-course-json-files.json'
                );
                content = content.replace(
                    /\/api\/course-code-map/g,
                    '/api/course-code-map.json'
                );
                content = content.replace(
                    /\/api\/find-course-json\//g,
                    '/api/course-code-map.json#'
                );
                
                await fs.writeFile(filePath, content);
                console.log(`✅ ${jsFile.name} güncellendi`);
            } else {
                console.log(`⚠️  ${jsFile.name} bulunamadı, atlanıyor`);
            }
        } catch (error) {
            console.warn(`⚠️  ${jsFile.name} güncellenirken hata:`, error.message);
        }
    }
}

// Build'i çalıştır
if (require.main === module) {
    buildStatic();
}

module.exports = { buildStatic }; 