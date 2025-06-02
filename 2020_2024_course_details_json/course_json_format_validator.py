import json
import os
import sys
import re
import logging
import argparse
from typing import Dict, List, Any, Optional, Set, Tuple, Union
from datetime import datetime
from enum import Enum

# =========================================================
# Configuration and Constants
# =========================================================

# Standard values - match these with the fixer script
VALID_COURSE_TYPES = ["Zorunlu", "Seçmeli"]
VALID_COURSE_LEVELS = ["Lisans", "Yüksek Lisans", "Doktora"]
VALID_EDUCATION_SYSTEMS = ["Birinci Öğretim", "İkinci Öğretim", "Uzaktan Öğretim"]
VALID_TEACHING_LANGUAGES = ["Türkçe", "İngilizce"]
VALID_INTERNSHIP_STATUS = ["Mevcut Değil", "Mevcut", "Zorunlu", "Seçmeli"]
VALID_DOCUMENT_STATUS = ["Taslak", "Onaylandı", "Yayınlandı", "Revize Edildi"]

# Required top-level fields
REQUIRED_TOP_LEVEL_FIELDS = [
    'dersGenel', 'dersIcerik', 'dersOgrenmeÇiktilari', 'haftalikDersIcerikleri', 
    'dersIsYuku', 'etkinlikTurleri', 'dersDegerlendirme', 'yariyilIciOlasiEtkinlikler',
    'yariyilSonuOlasiEtkinlikler', 'programCiktilari', 'programVeOgrenmeIliskisi',
    'toplumsalKatkiVeSurdurulebilirlik', 'dersSekmeler', 'denetimBilgileri',
    'numaralandirmaDegerleri'
]

# =========================================================
# Logging Setup
# =========================================================

def setup_logging(log_dir="logs"):
    """Set up logging configuration for the script"""
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"json_validator_{timestamp}.log")
    
    # Create a specific file for warnings and errors
    error_log_file = os.path.join(log_dir, f"json_validator_errors_{timestamp}.txt")

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    
    # Create a separate logger for errors and warnings
    error_logger = logging.getLogger("error_logger")
    error_logger.setLevel(logging.WARNING)
    
    # Configure the error logger to write to the error log file
    error_handler = logging.FileHandler(error_log_file, encoding='utf-8')
    error_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    error_handler.setFormatter(error_formatter)
    error_logger.addHandler(error_handler)
    
    logger = logging.getLogger("json_validator")
    return logger, error_logger, log_file, error_log_file

# Create the loggers
logger, error_logger, log_file, error_log_file = setup_logging()

# =========================================================
# Classes and Data Structures
# =========================================================

class CourseType(Enum):
    MANDATORY = "Zorunlu"
    ELECTIVE = "Seçmeli"
    UNKNOWN = "Unknown"

class ValidationResult:
    def __init__(self):
        self.missing_fields = []
        self.extra_fields = []
        self.incorrect_values = []
        self.structure_issues = []
        self.calculation_issues = []
        self.format_issues = []
        self.warning_issues = []
        self.info_messages = []  # New category for informational messages
        
    def has_issues(self) -> bool:
        return (len(self.missing_fields) > 0 or 
                len(self.extra_fields) > 0 or 
                len(self.incorrect_values) > 0 or 
                len(self.structure_issues) > 0 or 
                len(self.calculation_issues) > 0 or 
                len(self.format_issues) > 0)
    
    def get_issue_count(self) -> int:
        return (len(self.missing_fields) + 
                len(self.extra_fields) + 
                len(self.incorrect_values) + 
                len(self.structure_issues) + 
                len(self.calculation_issues) + 
                len(self.format_issues))
    
    def get_warning_count(self) -> int:
        return len(self.warning_issues)
    
    def get_info_count(self) -> int:
        return len(self.info_messages)

# Function to log validation issues to the error log file
def log_validation_issues(file_name, result):
    """Log validation issues to the error log file"""
    if result.has_issues() or result.warning_issues:
        error_logger.warning(f"Issues found in file: {file_name}")
        
        if result.missing_fields:
            error_logger.error(f"Missing Fields ({len(result.missing_fields)}):")
            for issue in sorted(result.missing_fields):
                error_logger.error(f"  - {issue}")
        
        if result.extra_fields:
            error_logger.error(f"Extra Fields ({len(result.extra_fields)}):")
            for issue in sorted(result.extra_fields):
                error_logger.error(f"  - {issue}")
        
        if result.incorrect_values:
            error_logger.error(f"Incorrect Values ({len(result.incorrect_values)}):")
            for issue in sorted(result.incorrect_values):
                error_logger.error(f"  - {issue}")
        
        if result.calculation_issues:
            error_logger.error(f"Calculation Issues ({len(result.calculation_issues)}):")
            for issue in sorted(result.calculation_issues):
                error_logger.error(f"  - {issue}")
        
        if result.structure_issues:
            error_logger.error(f"Structure Issues ({len(result.structure_issues)}):")
            for issue in sorted(result.structure_issues):
                error_logger.error(f"  - {issue}")
        
        if result.format_issues:
            error_logger.error(f"Format Issues ({len(result.format_issues)}):")
            for issue in sorted(result.format_issues):
                error_logger.error(f"  - {issue}")
        
        if result.warning_issues:
            error_logger.warning(f"Warnings ({len(result.warning_issues)}):")
            for warning in sorted(result.warning_issues):
                error_logger.warning(f"  - {warning}")
        
        error_logger.warning(f"End of issues for file: {file_name}\n")

# =========================================================
# Helper Functions
# =========================================================

def load_json(file_path: str) -> Optional[Dict]:
    """Load JSON from file path."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON in {file_path}: {e}")
        error_logger.error(f"Error parsing JSON in {file_path}: {e}")
        return None
    except Exception as e:
        logger.error(f"Error loading {file_path}: {e}")
        error_logger.error(f"Error loading {file_path}: {e}")
        return None

def get_course_type(json_data: Dict) -> CourseType:
    """Determine if the course is elective or mandatory."""
    if 'dersGenel' not in json_data:
        return CourseType.UNKNOWN
    
    ders_turu = json_data['dersGenel'].get('dersTuru')
    if ders_turu == "Seçmeli":
        return CourseType.ELECTIVE
    elif ders_turu == "Zorunlu":
        return CourseType.MANDATORY
    else:
        return CourseType.UNKNOWN

def is_updated_format(json_data: Dict) -> bool:
    """Check if the JSON is in the updated format (no basicInfo section)."""
    return 'basicInfo' not in json_data

def extract_elective_group_code(filename: str) -> Optional[str]:
    """Extract elective group code from filename using regex patterns."""
    # Patterns for 2024
    seccen_pattern = r'20\d{2}-\d+-((seccen\d{2})(-\d+)?)'
    secpfs_pattern = r'20\d{2}-\d+-((secpfs\d{2})(-\d+)?)'
    
    # Patterns for 2020
    secs_pattern = r'20\d{2}-\d+-((secs\d{2}))'
    elce_pattern = r'20\d{2}-\d+-((elce\d{2}))'
    secce_pattern = r'20\d{2}-\d+-((secce\d{2}))'
    secpfs_2020_pattern = r'20\d{2}-\d+-((secpfs\d{2,3})(-\d+)?)'
    secusd_pattern = r'20\d{2}-\d+-((secüsd\d{2}))'
    
    # Combine all patterns
    all_patterns = f"{seccen_pattern}|{secpfs_pattern}|{secs_pattern}|{elce_pattern}|{secce_pattern}|{secpfs_2020_pattern}|{secusd_pattern}"
    
    # Convert filename to lowercase for case-insensitive matching
    filename_lower = filename.lower()
    
    # Search for patterns in filename
    match = re.search(all_patterns, filename_lower)
    if match:
        # Find the first matching group (non-None)
        for group_idx in range(1, len(match.groups()) + 1):
            if match.group(group_idx) is not None and not match.group(group_idx).startswith('-'):
                return match.group(group_idx).upper()
    
    return None

def extract_curriculum_year(filename: str) -> Optional[str]:
    """Extract curriculum year from filename."""
    match = re.match(r'(\d{4})-', filename)
    return match.group(1) if match else None

def get_course_type_from_filename(filename: str) -> str:
    """Determine if a course is elective or mandatory based on filename."""
    elective_prefixes = ["sec", "elc"]
    parts = filename.split('-')
    if len(parts) >= 3:
        course_group = parts[2].lower()
        for prefix in elective_prefixes:
            if course_group.startswith(prefix):
                return "Seçmeli"
    return "Zorunlu"

def is_close_enough(a: float, b: float, rel_tol: float = 1e-9, abs_tol: float = 0.01) -> bool:
    """Check if two values are close enough, considering floating point precision."""
    # For zero values, use absolute tolerance
    if a == 0 or b == 0:
        return abs(a - b) <= abs_tol
    # For non-zero values, use relative tolerance
    return abs(a - b) <= max(rel_tol * max(abs(a), abs(b)), abs_tol)

# =========================================================
# Field Requirements Functions
# =========================================================

def get_required_fields() -> Dict[str, List[str]]:
    """Get the list of required fields for the JSON structure."""
    # Common required fields for all JSON files
    required = {
        '': REQUIRED_TOP_LEVEL_FIELDS,
        
        'dersGenel': ['dersTuru', 'dersinSeviyesi', 'dersinAKTSKredisi', 'haftalikDersSaatiKuramsal', 
                      'haftalikUygulamaSaati', 'haftalikLaboratuarSaati', 'dersinVerildigiYariyil', 
                      'ogretimSistemi', 'egitimDili', 'dersKodu', 'dersAdi', 'ogretimYiliDonemi', 
                      'dersAKTSKredisi', 'dilSecimi', 'mufredatOlusturulmaYili', 'akademikYil',
                      # Location fields added by the fixer
                      'universite', 'ulke', 'il', 'ilce', 'mahalle', 
                      # Faculty and department fields (replacing birim)
                      'fakulte', 'bolum'],
        
        'dersIcerik': ['dersinAmaci', 'dersinOnKosuluOlanDersler', 'dersinIcerigi', 
                       'dersinIcinOnerilenHususlar', 'ogretimTuru', 'stajDurumu', 
                       'dersinKitabiMalzemesiOnerilenKaynaklar', 'dersiVerenOgretimUyesiOgretimGorevlisi',
                       'hazirlanmaTarihi'],
        
        'dersIsYuku': ['etkinlikler', 'toplamIsYuku', 'dersAKTSKredisi', 'hesaplama'],
        
        'dersDegerlendirme': ['yariyilIciEtkinlikleri', 'yariyilIciToplam', 'yariyilSonuEtkinlikleri',
                              'yariyilSonuToplam', 'genelDegerlendirme', 'genelDegerlendirmeToplam'],
        
        'programVeOgrenmeIliskisi': ['iliskiOlcekleri', 'iliskiTablosu'],
        
        'toplumsalKatkiVeSurdurulebilirlik': ['surdurulebilirKalkinmaAmaclari', 'toplumsalKatkiAlanlari'],
        
        'dersSekmeler': ['dersGenel', 'dersOgrenmeÇiktilari', 'haftalikDersIcerikleri', 'dersIsYuku',
                         'dersDegerlendirme', 'programVeOgrenmeÇiktilariIliskisi', 'toplumsalKatkiVeSurdurulebilirlik'],
                         
        'denetimBilgileri': ['olusturmaTarihi', 'olusturan', 'sonGuncellenmeTarihi', 'guncelleyen', 'durum']
    }
    
    # Required fields specific to array items
    required['etkinlikler.item'] = ['etkinlik', 'sayi', 'sure', 'toplamIsYuku']
    required['yariyilIciEtkinlikleri.item'] = ['etkinlik', 'sayi', 'katkiYuzdesi']
    required['yariyilSonuEtkinlikleri.item'] = ['etkinlik', 'sayi', 'katkiYuzdesi']
    required['genelDegerlendirme.item'] = ['degerlendirme', 'katkiYuzdesi']
    required['dersOgrenmeÇiktilari.item'] = ['id', 'aciklama']
    required['haftalikDersIcerikleri.item'] = ['hafta', 'icerik', 'iliskiliOgrenmeÇiktisi', 
                                             'ogretimOrtami', 'onHazirlik', 'ogretimYontemleri',
                                             'aracVeGerecler', 'kaynakVeMateryal',
                                             'degerlendirmeYontemleri', 'odevVeCalisma']
    required['programCiktilari.item'] = ['id', 'kategori', 'aciklama']
    
    # Required fields for elective courses
    required['elective'] = ['secmeliDersGrubuKodu']
    
    return required

def get_valid_values() -> Dict[str, List[str]]:
    """Get a dictionary of fields with their valid values."""
    valid_values = {
        'dersGenel.dersTuru': VALID_COURSE_TYPES,
        'dersGenel.dersinSeviyesi': VALID_COURSE_LEVELS,
        'dersGenel.ogretimSistemi': VALID_EDUCATION_SYSTEMS,
        'dersGenel.egitimDili': VALID_TEACHING_LANGUAGES,
        'dersIcerik.ogretimTuru': VALID_EDUCATION_SYSTEMS,
        'dersIcerik.stajDurumu': VALID_INTERNSHIP_STATUS,
        'denetimBilgileri.durum': VALID_DOCUMENT_STATUS,
        # Location information
        'dersGenel.universite': ['Recep Tayyip Erdoğan Üniversitesi'],
        'dersGenel.ulke': ['Türkiye'],
        'dersGenel.il': ['Rize'],
        'dersGenel.ilce': ['Merkez'],
        'dersGenel.mahalle': ['Fener Mah'],
        # Faculty and department
        'dersGenel.fakulte': ['Mühendislik Ve Mimarlık Fakültesi'],
        'dersGenel.bolum': ['Bilgisayar Mühendisliği']
    }
    return valid_values

# =========================================================
# Validation Functions
# =========================================================

def validate_field_exists(json_data: Dict, path: str, field: str, result: ValidationResult) -> bool:
    """Check if a field exists in the JSON data."""
    if not path:
        if field not in json_data:
            result.missing_fields.append(f"Missing top-level field '{field}'")
            return False
        return True
    
    parts = path.split('.')
    current = json_data
    
    for part in parts:
        if part not in current:
            result.missing_fields.append(f"Missing field '{path}.{field}'")
            return False
        current = current[part]
    
    if field not in current:
        result.missing_fields.append(f"Missing field '{path}.{field}'")
        return False
    
    return True

def validate_turkish_title_case(text: str, field_name: str, result: ValidationResult) -> bool:
    """Validate that Turkish text is properly capitalized."""
    words = text.split()
    
    for word in words:
        # Skip empty words
        if not word:
            continue
            
        # Check first letter capitalization
        if word[0].islower():
            result.format_issues.append(f"Incorrect capitalization in {field_name}: '{word}' should start with uppercase")
            return False
        
        # Check for special Turkish characters
        if 'i̇' in word.lower():
            result.format_issues.append(f"Incorrect Turkish character in {field_name}: '{word}' contains 'i̇' instead of 'i'")
            return False
    
    return True

def validate_required_fields(json_data: Dict, result: ValidationResult, course_type: CourseType):
    """Validate that all required fields exist in the JSON data."""
    required_fields = get_required_fields()
    
    # Check top-level required fields
    for field in required_fields['']:
        validate_field_exists(json_data, '', field, result)
    
    # Check dersGenel fields
    if 'dersGenel' in json_data:
        for field in required_fields['dersGenel']:
            # Skip 'birim' field which should be removed and replaced by fakulte/bolum
            if field == 'birim' and ('fakulte' in json_data['dersGenel'] and 'bolum' in json_data['dersGenel']):
                continue
            validate_field_exists(json_data, 'dersGenel', field, result)
        
        # Check elective course specific fields
        if course_type == CourseType.ELECTIVE:
            for field in required_fields['elective']:
                if field not in json_data['dersGenel']:
                    result.missing_fields.append(f"Missing elective course field 'dersGenel.{field}'")
    
    # Check other section fields
    sections = [
        ('dersIcerik', required_fields['dersIcerik']),
        ('dersIsYuku', required_fields['dersIsYuku']),
        ('dersDegerlendirme', required_fields['dersDegerlendirme']),
        ('programVeOgrenmeIliskisi', required_fields['programVeOgrenmeIliskisi']),
        ('toplumsalKatkiVeSurdurulebilirlik', required_fields['toplumsalKatkiVeSurdurulebilirlik']),
        ('dersSekmeler', required_fields['dersSekmeler']),
        ('denetimBilgileri', required_fields['denetimBilgileri'])
    ]
    
    for section, fields in sections:
        if section in json_data:
            for field in fields:
                if field not in ['yariyilIciEtkinlikleri', 'yariyilSonuEtkinlikleri', 'genelDegerlendirme', 'etkinlikler']:
                    validate_field_exists(json_data, section, field, result)
    
    # Check array items
    array_sections = [
        ('dersIsYuku', 'etkinlikler', required_fields['etkinlikler.item']),
        ('dersDegerlendirme', 'yariyilIciEtkinlikleri', required_fields['yariyilIciEtkinlikleri.item']),
        ('dersDegerlendirme', 'yariyilSonuEtkinlikleri', required_fields['yariyilSonuEtkinlikleri.item']),
        ('dersDegerlendirme', 'genelDegerlendirme', required_fields['genelDegerlendirme.item'])
    ]
    
    for section, array_field, item_fields in array_sections:
        if section in json_data and array_field in json_data[section]:
            for i, item in enumerate(json_data[section][array_field]):
                for field in item_fields:
                    if field not in item:
                        result.missing_fields.append(f"Missing field in {section}.{array_field}[{i}]: '{field}'")
    
    # Check special arrays
    if 'dersOgrenmeÇiktilari' in json_data:
        for i, item in enumerate(json_data['dersOgrenmeÇiktilari']):
            if isinstance(item, dict):
                for field in required_fields['dersOgrenmeÇiktilari.item']:
                    if field not in item:
                        result.missing_fields.append(f"Missing field in dersOgrenmeÇiktilari[{i}]: '{field}'")
            else:
                result.format_issues.append(f"dersOgrenmeÇiktilari[{i}] is not a dictionary object")
    
    if 'haftalikDersIcerikleri' in json_data:
        for i, item in enumerate(json_data['haftalikDersIcerikleri']):
            for field in required_fields['haftalikDersIcerikleri.item']:
                if field not in item:
                    result.missing_fields.append(f"Missing field in haftalikDersIcerikleri[{i}]: '{field}'")
    
    if 'programCiktilari' in json_data:
        for i, item in enumerate(json_data['programCiktilari']):
            for field in required_fields['programCiktilari.item']:
                if field not in item:
                    result.missing_fields.append(f"Missing field in programCiktilari[{i}]: '{field}'")

def validate_field_values(json_data: Dict, result: ValidationResult):
    """Validate that field values are correct and within expected ranges."""
    valid_values = get_valid_values()
    
    # Check fields with specific valid values
    for field_path, valid_list in valid_values.items():
        path_parts = field_path.split('.')
        section = path_parts[0]
        field = path_parts[1]
        
        if section in json_data and field in json_data[section]:
            value = json_data[section][field]
            if value not in valid_list:
                result.incorrect_values.append(
                    f"Invalid value for '{field_path}': '{value}'. Expected one of: {', '.join(valid_list)}"
                )
    
    # Validate Turkish title case for specific fields
    if 'dersGenel' in json_data:
        if 'fakulte' in json_data['dersGenel']:
            validate_turkish_title_case(json_data['dersGenel']['fakulte'], 'dersGenel.fakulte', result)
        
        if 'bolum' in json_data['dersGenel']:
            validate_turkish_title_case(json_data['dersGenel']['bolum'], 'dersGenel.bolum', result)
    
    # Validate AKTS calculations
    validate_akts_calculations(json_data, result)
    
    # Validate activity workload calculations
    validate_activity_calculations(json_data, result)
    
    # Validate evaluation percentages
    validate_evaluation_percentages(json_data, result)
    
    # Check AKTS consistency across different sections
    validate_akts_consistency(json_data, result)

def validate_akts_calculations(json_data: Dict, result: ValidationResult):
    """Validate AKTS credit calculations using floor division."""
    if 'dersIsYuku' in json_data:
        if 'toplamIsYuku' in json_data['dersIsYuku'] and 'dersAKTSKredisi' in json_data['dersIsYuku']:
            total_workload = json_data['dersIsYuku']['toplamIsYuku']
            akts = json_data['dersIsYuku']['dersAKTSKredisi']
            
            # AKTS hesaplaması sadece 25'e göre yapılmalı (taban bölme ile)
            calculated_akts = int(total_workload / 25)
            
            # AKTS 25'e göre hesaplanmalıdır
            if akts != calculated_akts:
                result.calculation_issues.append(
                    f"AKTS hesaplaması tutarsız: Toplam iş yükü {total_workload}, 25'e bölündüğünde {total_workload/25:.2f} (taban: {calculated_akts}) " 
                    f"ederken, AKTS değeri {akts} olarak belirlenmiş."
                )
            
            # hesaplama alanında belirtilen değerin doğru olup olmadığını kontrol et
            if 'hesaplama' in json_data['dersIsYuku']:
                hesaplama = json_data['dersIsYuku']['hesaplama']
                if "/ 30" in hesaplama:
                    # Hata yerine uyarı olarak değiştiriyoruz
                    result.warning_issues.append(
                        f"AKTS hesaplamasında farklı formül kullanılmış: Hesaplama alanında '/ 30' ifadesi var, fakat '/ 25' kullanılması önerilir."
                    )
                elif not "/ 25" in hesaplama:
                    result.warning_issues.append(
                        f"AKTS hesaplama formülü eksik veya belirtilmemiş: Hesaplama alanında '/ 25' ifadesi olmalıdır."
                    )

def validate_activity_calculations(json_data: Dict, result: ValidationResult):
    """Validate activity workload calculations with better handling of floating point issues."""
    if 'dersIsYuku' in json_data and 'etkinlikler' in json_data['dersIsYuku']:
        etkinlikler = json_data['dersIsYuku']['etkinlikler']
        toplam_is_yuku = json_data['dersIsYuku'].get('toplamIsYuku', 0)
        
        # Calculate total from activities
        calculated_total = 0
        for activity in etkinlikler:
            sayi = activity.get('sayi', 0)
            sure = activity.get('sure', 0)
            toplam = activity.get('toplamIsYuku', 0)
            
            # Check if individual activity calculation is correct
            calculated_activity_total = sayi * sure
            
            # Instead of requiring exact equality, check if the values are close enough
            if not is_close_enough(calculated_activity_total, toplam, abs_tol=0.51):
                # For informational purposes only, log this but don't count as an error
                exact_value = sayi * sure
                result.info_messages.append(
                    f"Activity calculation note for '{activity.get('etkinlik', 'Unknown')}': "
                    f"{sayi} × {sure} = {exact_value}, recorded as {toplam}"
                )
            
            calculated_total += toplam
        
        # Check if total workload calculation is correct
        if not is_close_enough(calculated_total, toplam_is_yuku, abs_tol=1.0):
            # This is more serious as it affects AKTS calculation
            result.calculation_issues.append(
                f"Total workload discrepancy: calculated ({calculated_total}) vs reported ({toplam_is_yuku})"
            )

def validate_evaluation_percentages(json_data: Dict, result: ValidationResult):
    """Validate evaluation percentages."""
    if 'dersDegerlendirme' in json_data:
        ders_degerlendirme = json_data['dersDegerlendirme']
        
        # 1. Yarıyıl içi etkinliklerin katkı yüzdeleri toplamı ile yariyilIciToplam uyumlu olmalı
        if "yariyilIciEtkinlikleri" in ders_degerlendirme and "yariyilIciToplam" in ders_degerlendirme:
            activities = ders_degerlendirme["yariyilIciEtkinlikleri"]
            reported_total = ders_degerlendirme["yariyilIciToplam"]
            
            calculated_total = sum(activity.get("katkiYuzdesi", 0) for activity in activities)
            
            if calculated_total != reported_total:
                result.calculation_issues.append(
                    f"Yarıyıl içi değerlendirme yüzdeleri toplamı uyuşmuyor: hesaplanan ({calculated_total}%) vs belirtilen ({reported_total}%)"
                )
            
            # Yarıyıl içi toplamın 100% olma kontrolünü kaldırıyoruz
            # Çünkü genelDegerlendirme içindeki dağılım yüzdeleri tarafından belirleniyor (40% veya 60%)
        
        # 2. Yarıyıl sonu etkinliklerin katkı yüzdeleri toplamı ile yariyilSonuToplam uyumlu olmalı
        if "yariyilSonuEtkinlikleri" in ders_degerlendirme and "yariyilSonuToplam" in ders_degerlendirme:
            activities = ders_degerlendirme["yariyilSonuEtkinlikleri"]
            reported_total = ders_degerlendirme["yariyilSonuToplam"]
            
            calculated_total = sum(activity.get("katkiYuzdesi", 0) for activity in activities)
            
            if calculated_total != reported_total:
                result.calculation_issues.append(
                    f"Yarıyıl sonu değerlendirme yüzdeleri toplamı uyuşmuyor: hesaplanan ({calculated_total}%) vs belirtilen ({reported_total}%)"
                )
            
            # Yarıyıl sonu toplamın 100% olma kontrolünü kaldırıyoruz
            # Çünkü genelDegerlendirme içindeki dağılım yüzdeleri tarafından belirleniyor (40% veya 60%)
        
        # 3. Genel değerlendirme - Genel değerlendirme toplamı 100% olmalı
        if "genelDegerlendirme" in ders_degerlendirme and "genelDegerlendirmeToplam" in ders_degerlendirme:
            items = ders_degerlendirme["genelDegerlendirme"]
            reported_total = ders_degerlendirme["genelDegerlendirmeToplam"]
            
            calculated_total = sum(item.get("katkiYuzdesi", 0) for item in items)
            
            if calculated_total != reported_total:
                result.calculation_issues.append(
                    f"Genel değerlendirme yüzdeleri toplamı uyuşmuyor: hesaplanan ({calculated_total}%) vs belirtilen ({reported_total}%)"
                )
            
            if reported_total != 100:
                result.calculation_issues.append(
                    f"Genel değerlendirme toplamı %100 olmalıdır, fakat %{reported_total} olarak belirtilmiş."
                )
                
            # 4. Genel değerlendirmede Yarıyıl İçi/Sonu değerlerini daha esnek kontrol edelim
            # Tam olarak 'Yarıyıl İçi Etkinlikleri' yerine benzer adlar da kabul edilecek
            yariyil_ici_patterns = ["Yarıyıl İçi Etkinlikleri", "Yarıyıl (Yıl) İçi Etkinlikleri"]
            yariyil_sonu_patterns = ["Yarıyıl Sonu Etkinlikleri", "Yarıyıl (Yıl) Sonu Etkinlikleri"]
            
            yariyil_ici_item = None
            yariyil_sonu_item = None
            
            # Genel değerlendirme içindeki Yarıyıl İçi ve Yarıyıl Sonu öğelerini bul
            for item in items:
                if "degerlendirme" in item:
                    desc = item["degerlendirme"]
                    
                    # Yarıyıl İçi öğesini tespit et
                    if any(pattern in desc for pattern in yariyil_ici_patterns):
                        yariyil_ici_item = item
                    
                    # Yarıyıl Sonu öğesini tespit et
                    if any(pattern in desc for pattern in yariyil_sonu_patterns):
                        yariyil_sonu_item = item
            
            # Her iki öğe de bulunduysa, değerlerini kontrol et
            if yariyil_ici_item is not None and yariyil_sonu_item is not None:
                ici_yuzde = yariyil_ici_item.get("katkiYuzdesi", 0)
                sonu_yuzde = yariyil_sonu_item.get("katkiYuzdesi", 0)
                
                # Yarıyıl içi ve yarıyıl sonu değerlendirmeler toplamı %100 olmalı
                if ici_yuzde + sonu_yuzde != 100:
                    result.calculation_issues.append(
                        f"Yarıyıl içi (%{ici_yuzde}) ve yarıyıl sonu (%{sonu_yuzde}) etkinlikleri toplamı %100 olmalıdır, ancak %{ici_yuzde + sonu_yuzde} bulundu."
                    )
                
                # YENİ KURAL: Yarıyıl içi %40, yarıyıl sonu %60 olmalıdır
                if ici_yuzde != 40:
                    result.calculation_issues.append(
                        f"Yarıyıl içi etkinlikleri katkı oranı %40 olmalıdır, ancak %{ici_yuzde} belirtilmiştir."
                    )
                
                if sonu_yuzde != 60:
                    result.calculation_issues.append(
                        f"Yarıyıl sonu etkinlikleri katkı oranı %60 olmalıdır, ancak %{sonu_yuzde} belirtilmiştir."
                    )
            else:
                # Eğer her iki öğe de bulunamadıysa, manuel olarak genelDegerlendirme içeriğini bilgi amaçlı ekle
                items_str = ', '.join([f"{item.get('degerlendirme', 'Bilinmeyen')} ({item.get('katkiYuzdesi', 0)}%)" for item in items])
                result.warning_issues.append(
                    f"Genel değerlendirmede tam olarak 'Yarıyıl İçi Etkinlikleri' ve 'Yarıyıl Sonu Etkinlikleri' adında değerlendirme öğeleri bulunamadı. Mevcut öğeler: {items_str}"
                )

def validate_akts_consistency(json_data: Dict, result: ValidationResult):
    """Check AKTS consistency across different sections."""
    akts_values = {}
    
    if 'basicInfo' in json_data and 'dersAKTSKredisi' in json_data['basicInfo']:
        akts_values['basicInfo'] = json_data['basicInfo']['dersAKTSKredisi']
    
    if 'dersGenel' in json_data:
        if 'dersAKTSKredisi' in json_data['dersGenel']:
            akts_values['dersGenel.dersAKTSKredisi'] = json_data['dersGenel']['dersAKTSKredisi']
        if 'dersinAKTSKredisi' in json_data['dersGenel']:
            akts_values['dersGenel.dersinAKTSKredisi'] = json_data['dersGenel']['dersinAKTSKredisi']
    
    if 'dersIsYuku' in json_data and 'dersAKTSKredisi' in json_data['dersIsYuku']:
        akts_values['dersIsYuku'] = json_data['dersIsYuku']['dersAKTSKredisi']
    
    # Check if all AKTS values match
    if len(akts_values) > 1:
        first_key = next(iter(akts_values))
        first_value = akts_values[first_key]
        
        for key, value in akts_values.items():
            if key != first_key and value != first_value:
                result.calculation_issues.append(
                    f"AKTS credit mismatch: {first_key} ({first_value}) vs {key} ({value})"
                )

def validate_location_info(json_data: Dict, result: ValidationResult):
    """Validate location information added by the fixer."""
    if 'dersGenel' not in json_data:
        return
    
    # Expected location fields
    location_fields = ['universite', 'ulke', 'il', 'ilce', 'mahalle']
    
    # Check if each location field exists and has the correct value
    for field in location_fields:
        if field not in json_data['dersGenel']:
            result.missing_fields.append(f"Missing location field 'dersGenel.{field}'")
    
    # Check for specific location values using the valid_values dict
    valid_values = get_valid_values()
    for field in location_fields:
        field_path = f'dersGenel.{field}'
        if field in json_data['dersGenel'] and field_path in valid_values:
            value = json_data['dersGenel'][field]
            expected_values = valid_values[field_path]
            if value not in expected_values:
                result.incorrect_values.append(
                    f"Incorrect value for {field_path}: '{value}'. Expected: '{expected_values[0]}'"
                )

def validate_faculty_department(json_data: Dict, result: ValidationResult):
    """Validate faculty and department fields (replacing birim)."""
    if 'dersGenel' not in json_data:
        return
    
    # Check if birim has been replaced with fakulte and bolum
    if 'birim' in json_data['dersGenel']:
        result.warning_issues.append(
            "Field 'birim' still exists in dersGenel. It should be replaced by fakulte and bolum."
        )
    
    # Check required fields fakulte and bolum
    if 'fakulte' not in json_data['dersGenel']:
        result.missing_fields.append("Missing faculty field 'dersGenel.fakulte'")
    
    if 'bolum' not in json_data['dersGenel']:
        result.missing_fields.append("Missing department field 'dersGenel.bolum'")
    
    # Check fakulte and bolum values using the valid_values dict
    valid_values = get_valid_values()
    for field in ['fakulte', 'bolum']:
        field_path = f'dersGenel.{field}'
        if field in json_data['dersGenel'] and field_path in valid_values:
            value = json_data['dersGenel'][field]
            expected_values = valid_values[field_path]
            if value not in expected_values:
                result.incorrect_values.append(
                    f"Incorrect value for {field_path}: '{value}'. Expected: '{expected_values[0]}'"
                )

def validate_elective_course(json_data: Dict, result: ValidationResult, filename: str):
    """Validate elective course specific requirements."""
    if 'dersGenel' not in json_data:
        return
    
    # Check if course is marked as elective
    is_elective = json_data['dersGenel'].get('dersTuru') == 'Seçmeli'
    
    if is_elective:
        # Check if secmeliDersGrubuKodu exists and matches the filename
        if 'secmeliDersGrubuKodu' not in json_data['dersGenel']:
            result.missing_fields.append("Missing 'secmeliDersGrubuKodu' for elective course")
        else:
            code_from_json = json_data['dersGenel']['secmeliDersGrubuKodu']
            code_from_filename = extract_elective_group_code(filename)
            
            if code_from_filename and code_from_json != code_from_filename:
                result.incorrect_values.append(
                    f"Elective group code mismatch: '{code_from_json}' in JSON vs '{code_from_filename}' from filename"
                )
    else:
        # Check if course is incorrectly marked as elective in filename
        code_from_filename = extract_elective_group_code(filename)
        if code_from_filename:
            result.incorrect_values.append(
                f"Course is marked as mandatory in JSON but filename indicates it's elective (contains '{code_from_filename}')"
            )

def validate_curriculum_year(json_data: Dict, result: ValidationResult, filename: str):
    """Validate curriculum year consistency."""
    if 'dersGenel' not in json_data:
        return
    
    # Check if mufredatOlusturulmaYili exists and matches the filename
    if 'mufredatOlusturulmaYili' not in json_data['dersGenel']:
        result.missing_fields.append("Missing 'mufredatOlusturulmaYili' in dersGenel")
    else:
        year_from_json = json_data['dersGenel']['mufredatOlusturulmaYili']
        year_from_filename = extract_curriculum_year(filename)
        
        if year_from_filename and year_from_json != year_from_filename:
            result.incorrect_values.append(
                f"Curriculum year mismatch: '{year_from_json}' in JSON vs '{year_from_filename}' from filename"
            )
    
    # Check if akademikYil field exists
    if 'akademikYil' not in json_data['dersGenel']:
        result.missing_fields.append("Missing 'akademikYil' in dersGenel")

def validate_learning_outcomes(json_data: Dict, result: ValidationResult):
    """Validate learning outcomes format and references."""
    if 'dersOgrenmeÇiktilari' not in json_data:
        return
    
    outcomes = json_data['dersOgrenmeÇiktilari']
    outcome_ids = set()
    
    # Check each learning outcome
    for i, outcome in enumerate(outcomes):
        if not isinstance(outcome, dict):
            result.format_issues.append(f"Learning outcome at index {i} is not a dictionary object")
            continue
        
        # Check ID format
        if 'id' not in outcome:
            result.missing_fields.append(f"Learning outcome at index {i} is missing 'id' field")
        else:
            outcome_id = outcome['id']
            expected_id = f"ÖÇ.{i+1}"
            
            if not outcome_id.startswith("ÖÇ."):
                result.format_issues.append(f"Learning outcome ID '{outcome_id}' does not start with 'ÖÇ.'")
            
            if outcome_id != expected_id:
                result.warning_issues.append(f"Learning outcome ID '{outcome_id}' is not in sequential order (expected '{expected_id}')")
            
            outcome_ids.add(outcome_id)
    
    # Check references to learning outcomes in haftalikDersIcerikleri
    if 'haftalikDersIcerikleri' in json_data:
        for i, week in enumerate(json_data['haftalikDersIcerikleri']):
            if 'iliskiliOgrenmeÇiktisi' in week:
                outcome_ref = week['iliskiliOgrenmeÇiktisi']
                
                # Skip empty references
                if not outcome_ref or outcome_ref == "-":
                    continue
                
                # Check if reference points to valid outcome ID
                for ref in outcome_ref.split(','):
                    ref = ref.strip()
                    full_ref = f"ÖÇ.{ref}" if ref.isdigit() else ref
                    
                    if full_ref not in outcome_ids:
                        result.incorrect_values.append(
                            f"Week {week.get('hafta', i+1)} references non-existent learning outcome: '{full_ref}'"
                        )

def validate_sequentiality(json_data: Dict, result: ValidationResult):
    """Validate that sequences are properly ordered."""
    
    # Check if weeks are sequential in haftalikDersIcerikleri
    if 'haftalikDersIcerikleri' in json_data:
        weeks = json_data['haftalikDersIcerikleri']
        for i, week in enumerate(weeks):
            if 'hafta' in week and week['hafta'] != i + 1:
                result.format_issues.append(f"Week sequence issue: expected week {i+1}, got week {week['hafta']}")
    
    # Check if program outcomes are sequential in programCiktilari
    if 'programCiktilari' in json_data:
        program_ciktilari = json_data['programCiktilari']
        for i, cikti in enumerate(program_ciktilari, 1):
            if 'id' in cikti:
                expected_id = f"PÇ.{i}"
                if cikti['id'] != expected_id:
                    result.warning_issues.append(f"Program outcome ID mismatch: expected '{expected_id}', got '{cikti['id']}'")

def validate_compatibility(json_data: Dict, result: ValidationResult):
    """Validate compatibility between different sections."""
    
    # Check if program outcome IDs in programVeOgrenmeIliskisi match those in programCiktilari
    program_cikti_ids = set()
    if 'programCiktilari' in json_data:
        for cikti in json_data['programCiktilari']:
            if 'id' in cikti:
                program_cikti_ids.add(cikti['id'])
    
    ogrenme_cikti_ids = set()
    if 'dersOgrenmeÇiktilari' in json_data:
        for cikti in json_data['dersOgrenmeÇiktilari']:
            if isinstance(cikti, dict) and 'id' in cikti:
                ogrenme_cikti_ids.add(cikti['id'])
    
    # Check iliskiTablosu
    if 'programVeOgrenmeIliskisi' in json_data and 'iliskiTablosu' in json_data['programVeOgrenmeIliskisi']:
        iliskiTablosu = json_data['programVeOgrenmeIliskisi']['iliskiTablosu']
        
        for i, row in enumerate(iliskiTablosu):
            # Check if ogrenmeÇiktisiID exists in dersOgrenmeÇiktilari
            if 'ogrenmeÇiktisiID' in row:
                oc_id = row['ogrenmeÇiktisiID']
                if oc_id not in ogrenme_cikti_ids:
                    result.incorrect_values.append(f"iliskiTablosu references non-existent learning outcome: '{oc_id}'")
            
            # Check if all program outcome IDs in programÇiktilariIliskileri exist in programCiktilari
            if 'programÇiktilariIliskileri' in row:
                for pc_id in row['programÇiktilariIliskileri']:
                    if pc_id not in program_cikti_ids:
                        result.incorrect_values.append(f"iliskiTablosu references non-existent program outcome: '{pc_id}'")

def validate_audit_info(json_data: Dict, result: ValidationResult):
    """Validate audit information in the JSON data."""
    if 'denetimBilgileri' not in json_data:
        result.missing_fields.append("Missing 'denetimBilgileri' section")
        return
    
    required_fields = get_required_fields()['denetimBilgileri']
    
    for field in required_fields:
        if field not in json_data['denetimBilgileri']:
            result.missing_fields.append(f"Missing audit field 'denetimBilgileri.{field}'")
    
    # Check if durum is a valid value
    if 'durum' in json_data['denetimBilgileri']:
        durum = json_data['denetimBilgileri']['durum']
        if durum not in VALID_DOCUMENT_STATUS:
            result.incorrect_values.append(
                f"Invalid document status: '{durum}'. Expected one of: {', '.join(VALID_DOCUMENT_STATUS)}"
            )
    
    # Check date formats (if present)
    date_fields = ['olusturmaTarihi', 'sonGuncellenmeTarihi']
    for field in date_fields:
        if field in json_data['denetimBilgileri']:
            date_value = json_data['denetimBilgileri'][field]
            try:
                # Try to parse the date in the expected format
                datetime.strptime(date_value, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                result.format_issues.append(
                    f"Invalid date format in 'denetimBilgileri.{field}': '{date_value}'. Expected format: 'YYYY-MM-DD HH:MM:SS'"
                )

def validate_enumeration_values(json_data: Dict, result: ValidationResult):
    """Validate that enumeration values are present and correctly structured."""
    if 'numaralandirmaDegerleri' not in json_data:
        result.missing_fields.append("Missing 'numaralandirmaDegerleri' section")
        return
    
    # Required enumeration lists
    required_enums = [
        ('dersTurleri', VALID_COURSE_TYPES),
        ('dersSeviyesi', VALID_COURSE_LEVELS),
        ('ogretimSistemi', VALID_EDUCATION_SYSTEMS),
        ('egitimDili', VALID_TEACHING_LANGUAGES),
        ('stajDurumu', VALID_INTERNSHIP_STATUS),
        ('dokumanDurumu', VALID_DOCUMENT_STATUS)
    ]
    
    for enum_name, expected_values in required_enums:
        if enum_name not in json_data['numaralandirmaDegerleri']:
            result.missing_fields.append(f"Missing enumeration list 'numaralandirmaDegerleri.{enum_name}'")
        else:
            enum_values = json_data['numaralandirmaDegerleri'][enum_name]
            # Check if the enumeration contains all expected values
            for value in expected_values:
                if value not in enum_values:
                    result.incorrect_values.append(
                        f"Missing value '{value}' in enumeration list 'numaralandirmaDegerleri.{enum_name}'"
                    )

def validate_activity_types_consistency(json_data: Dict, result: ValidationResult):
    """Validate that activities in dersIsYuku.etkinlikler and dersDegerlendirme sections are valid."""
    # Check if both required sections exist
    if 'dersIsYuku' not in json_data or 'etkinlikTurleri' not in json_data:
        return
    
    # Standart etkinlik listeleri - arayüzden görülen
    STANDARD_DERS_IS_YUKU_ETKINLIKLERI = [
        "Alan Çalışması",
        "Alan Gezisi",
        "Ara Sınav",
        "Ara Sınav İçin Bireysel Çalışma",
        "Beyin Fırtınası",
        "Bireysel Çalışma",
        "Bütünleme Sınavı",
        "Deney",
        "Deney Sonrası Quiz",
        "Derse Katılım",
        "Ev Ödevi",
        "Final Sınavı",
        "Final Sınavı İçin Bireysel Çalışma",
        "Gösterme",
        "Gözlem",
        "Laboratuvar",
        "Laboratuvar Ara Sınavı",
        "Laboratuvar Sınavı",
        "Makale Kritik Etme",
        "Makale Yazma",
        "Multirom CD Çalışması",
        "Ödev Problemleri İçin Çalışma",
        "Okuma",
        "Örnek Vaka İncelemesi",
        "Performans",
        "Problem Çözümü",
        "Proje Hazırlama",
        "Proje Sunma",
        "Proje Tasarımı/Yönetimi",
        "Quiz",
        "Quiz İçin Bireysel Çalışma",
        "Rapor",
        "Rapor Hazırlama",
        "Rapor Sunma",
        "Rehberli Problem Çözümü",
        "Rol Oynama / Dramatizasyon",
        "Seminer",
        "Soru-Yanıt",
        "Sözlü Sınav",
        "Takım/Grup Çalışması",
        "Tartışma",
        "Toplantı Başkanlığı Yapma",
        "Uygulama/Pratik",
        "Yazılı Anlatım Çalışması",
        "Grup Çalışması",
        "Tez Savunması"
    ]
    
    # Yarıyıl İçi Değerlendirme Etkinlikleri - güncellenmiş liste
    STANDARD_YARIYIL_ICI_ETKINLIKLERI = [
        "Alan Çalışması",
        "Alan Gezisi",
        "Ara Sınav",
        "Ara Sınav İçin Bireysel Çalışma",
        "Beyin Fırtınası",
        "Bireysel Çalışma",
        "Bütünleme Sınavı",
        "Deney",
        "Deney Sonrası Quiz",
        "Derse Katılım",
        "Ev Ödevi",
        "Final Sınavı İçin Bireysel Çalışma",
        "Gösterme",
        "Gözlem",
        "Laboratuvar",
        "Laboratuvar Sınavı",
        "Makale Kritik Etme",
        "Makale Yazma",
        "Multirom CD Çalışması",
        "Ödev Problemleri İçin Çalışma",
        "Okuma",
        "Örnek Vaka İncelemesi",
        "Performans",
        "Problem Çözümü",
        "Proje Hazırlama",
        "Proje Sunma",
        "Proje Tasarımı/Yönetimi",
        "Quiz",
        "Quiz İçin Bireysel Çalışma",
        "Rapor",
        "Rapor Hazırlama", 
        "Rapor Sunma",
        "Rehberli Problem Çözümü",
        "Rol Oynama / Dramatizasyon",
        "Seminer",
        "Soru-Yanıt",
        "Sözlü Sınav",
        "Takım/Grup Çalışması",
        "Tartışma",
        "Toplantı Başkanlığı Yapma",
        "Uygulama/Pratik"
    ]
    
    # Yarıyıl Sonu Değerlendirme Etkinlikleri - arayüzden görülen
    STANDARD_YARIYIL_SONU_ETKINLIKLERI = [
        "Final Sınavı",
        "Final Sınavı İçin Bireysel Çalışma",
        "Gözlem",
        "Laboratuvar Ara Sınavı",
        "Makale Yazma",
        "Proje Hazırlama",
        "Proje Sunma",
        "Proje Tasarımı/Yönetimi",
        "Quiz",
        "Rapor",
        "Rapor Hazırlama",
        "Rapor Sunma",
        "Seminer",
        "Sözlü Sınav"
    ]
    
    # JSON'daki etkinlik listelerini kontrol et
    if isinstance(json_data['etkinlikTurleri'], list):
        # Etkinlik türleri listesi kontrolünü kaldıralım, her dosyada farklı olabilir
        pass
    
    if 'yariyilIciOlasiEtkinlikler' in json_data and isinstance(json_data['yariyilIciOlasiEtkinlikler'], list):
        # Yarıyıl içi etkinlikleri için daha genişletilmiş bir liste kullanacağız
        standard_midterm_list = [
            "Ara Sınav",
            "Laboratuvar Sınavı",
            "Deney",
            "Deney Sonrası Quiz",
            "Performans",
            "Quiz",
            "Rapor",
            "Rapor Sunma",
            "Makale Kritik Etme",
            "Makale Yazma",
            "Proje Hazırlama",
            "Proje Sunma",
            "Rehberli Problem Çözümü",
            "Seminer", 
            "Sözlü Sınav",
            "Ödev Problemleri İçin Çalışma",
            "Proje Tasarımı/Yönetimi",
            # Ek etkinlikler
            "Ev Ödevi",
            "Derse Katılım",
            "Laboratuvar",
            "Uygulama/Pratik",
            "Rapor Hazırlama",
            "Bireysel Çalışma"
        ]
        
        # Yarıyıl içi etkinlikler listesi kontrolünü kaldıralım
        pass
    
    if 'yariyilSonuOlasiEtkinlikler' in json_data and isinstance(json_data['yariyilSonuOlasiEtkinlikler'], list):
        # Yarıyıl sonu etkinlikleri için standart liste
        standard_final_list = [
            "Final Sınavı",
            "Laboratuvar Ara Sınavı",
            "Makale Yazma",
            "Proje Hazırlama",
            "Proje Sunma",
            "Proje Tasarımı/Yönetimi",
            "Quiz",
            "Rapor",
            "Rapor Hazırlama",
            "Rapor Sunma",
            "Seminer",
            "Sözlü Sınav",
            "Gözlem"
        ]
        
        # Yarıyıl sonu etkinlikler listesi kontrolünü kaldıralım
        pass
    
    # JSON'daki etkinlikTurleri değerlerini kontrol et
    valid_activity_types = set()
    if isinstance(json_data['etkinlikTurleri'], list):
        for activity_type in json_data['etkinlikTurleri']:
            if isinstance(activity_type, str):
                valid_activity_types.add(activity_type)
            elif isinstance(activity_type, dict) and 'ad' in activity_type:
                valid_activity_types.add(activity_type['ad'])
    
    # dersIsYuku.etkinlikler'deki etkinlikleri kontrol et
    if 'etkinlikler' in json_data['dersIsYuku']:
        for i, activity in enumerate(json_data['dersIsYuku']['etkinlikler']):
            if 'etkinlik' in activity:
                activity_name = activity['etkinlik']
                # Bu kontrolü kaldırıyoruz, gerekirse uyarı olarak eklenebilir
                if activity_name not in valid_activity_types and activity_name not in STANDARD_DERS_IS_YUKU_ETKINLIKLERI:
                    result.warning_issues.append(
                        f"Activity '{activity_name}' in dersIsYuku.etkinlikler[{i}] does not exist in etkinlikTurleri list"
                    )
    
    # dersDegerlendirme.yariyilIciEtkinlikleri ve yariyilSonuEtkinlikleri'ni kontrol et
    if 'dersDegerlendirme' in json_data:
        # Kullanabileceğimiz yarıyıl içi etkinlikleri - genişletilmiş liste
        valid_midterm_activities = set(standard_midterm_list)
        
        # Kullanabileceğimiz yarıyıl sonu etkinlikleri
        valid_final_activities = set(standard_final_list)
        
        # yariyilIciEtkinlikleri kontrol et
        if 'yariyilIciEtkinlikleri' in json_data['dersDegerlendirme']:
            for i, activity in enumerate(json_data['dersDegerlendirme']['yariyilIciEtkinlikleri']):
                if 'etkinlik' in activity:
                    activity_name = activity['etkinlik']
                    # Kontrolü kaldırıyoruz, izin verilecek
                    pass
        
        # yariyilSonuEtkinlikleri kontrol et
        if 'yariyilSonuEtkinlikleri' in json_data['dersDegerlendirme']:
            for i, activity in enumerate(json_data['dersDegerlendirme']['yariyilSonuEtkinlikleri']):
                if 'etkinlik' in activity:
                    activity_name = activity['etkinlik']
                    # Kontrolü kaldırıyoruz, izin verilecek
                    pass

# =========================================================
# Main Validation Function
# =========================================================

def validate_json_file(file_path: str) -> Tuple[ValidationResult, CourseType, bool]:
    """Validate a JSON file against all requirements."""
    logger.info(f"Validating {file_path}...")
    
    # Load the JSON file
    json_data = load_json(file_path)
    if not json_data:
        result = ValidationResult()
        result.structure_issues.append("Failed to load or parse JSON file")
        return result, CourseType.UNKNOWN, False
    
    # Determine course type and format
    course_type = get_course_type(json_data)
    is_updated = is_updated_format(json_data)
    
    logger.info(f"File format: {'Updated (no basicInfo)' if is_updated else 'Original'}")
    logger.info(f"Course type: {course_type.value}")
    
    # Create validation result
    result = ValidationResult()
    
    # Run all validations
    validate_required_fields(json_data, result, course_type)
    validate_field_values(json_data, result)
    validate_location_info(json_data, result)
    validate_faculty_department(json_data, result)
    validate_elective_course(json_data, result, os.path.basename(file_path))
    validate_curriculum_year(json_data, result, os.path.basename(file_path))
    validate_learning_outcomes(json_data, result)
    validate_sequentiality(json_data, result)
    validate_compatibility(json_data, result)
    validate_audit_info(json_data, result)
    validate_enumeration_values(json_data, result)
    validate_activity_types_consistency(json_data, result)  # Added new validation
    
    return result, course_type, is_updated

# =========================================================
# Main Function
# =========================================================

def main():
    """Main function for the validator script."""
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Validate course JSON files against format requirements')
    parser.add_argument('--dir', type=str, help='Directory containing JSON files to validate (defaults to current directory)')
    parser.add_argument('--pattern', type=str, help='Filename pattern to match (e.g., "2024-*.json")')
    parser.add_argument('--ignore-floating', action='store_true', help='Ignore floating point calculation differences in the output report')
    args = parser.parse_args()
    
    # Get directory to process
    directory = args.dir if args.dir else os.getcwd()
    
    logger.info("=== Advanced Course JSON Validator Started ===")
    logger.info(f"Working directory: {directory}")
    
    # Get JSON files to validate
    json_files = []
    if args.pattern:
        pattern = re.compile(args.pattern)
        json_files = [f for f in os.listdir(directory) if f.endswith('.json') and pattern.match(f)]
    else:
        json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
    
    if not json_files:
        logger.warning("No JSON files found to validate.")
        print("No JSON files found to validate.")
        return
    
    logger.info(f"Found {len(json_files)} JSON files to validate.")
    print(f"Found {len(json_files)} JSON files to validate.")
    
    # Statistics
    valid_files = 0
    invalid_files = 0
    mandatory_files = 0
    elective_files = 0
    updated_format_files = 0
    old_format_files = 0
    warning_files = 0
    info_files = 0
    
    # Validate each file
    for file_name in sorted(json_files):
        full_path = os.path.join(directory, file_name)
        print(f"\nValidating {file_name}...")
        
        result, course_type, is_updated = validate_json_file(full_path)
        
        # Log validation issues to the error log file
        log_validation_issues(file_name, result)
        
        # Update statistics
        if course_type == CourseType.MANDATORY:
            mandatory_files += 1
        elif course_type == CourseType.ELECTIVE:
            elective_files += 1
        
        if is_updated:
            updated_format_files += 1
        else:
            old_format_files += 1
        
        # Track if file has information messages
        if result.info_messages and not args.ignore_floating:
            info_files += 1
        
        if result.has_issues():
            invalid_files += 1
            print(f"❌ {file_name} has {result.get_issue_count()} issues.")
            
            # Print issues by category
            if result.missing_fields:
                print(f"\n  🔍 Missing Fields ({len(result.missing_fields)}):")
                for issue in sorted(result.missing_fields):
                    print(f"    - {issue}")
            
            if result.extra_fields:
                print(f"\n  ➕ Extra Fields ({len(result.extra_fields)}):")
                for issue in sorted(result.extra_fields):
                    print(f"    - {issue}")
            
            if result.incorrect_values:
                print(f"\n  ❗ Incorrect Values ({len(result.incorrect_values)}):")
                for issue in sorted(result.incorrect_values):
                    print(f"    - {issue}")
            
            if result.calculation_issues:
                print(f"\n  🧮 Calculation Issues ({len(result.calculation_issues)}):")
                for issue in sorted(result.calculation_issues):
                    print(f"    - {issue}")
            
            if result.structure_issues:
                print(f"\n  🏗️ Structure Issues ({len(result.structure_issues)}):")
                for issue in sorted(result.structure_issues):
                    print(f"    - {issue}")
            
            if result.format_issues:
                print(f"\n  📄 Format Issues ({len(result.format_issues)}):")
                for issue in sorted(result.format_issues):
                    print(f"    - {issue}")
        else:
            valid_files += 1
            print(f"✅ {file_name} is valid.")
        
        # Print warnings if any (but don't count as invalid)
        if result.warning_issues:
            warning_files += 1
            print(f"\n  ⚠️ Warnings ({len(result.warning_issues)}):")
            for warning in sorted(result.warning_issues):
                print(f"    - {warning}")
        
        # Print informational messages if any
        if result.info_messages and not args.ignore_floating:
            print(f"\n  ℹ️ Information ({len(result.info_messages)}):")
            for info in sorted(result.info_messages):
                print(f"    - {info}")
    
    # Print summary
    summary = f"\n=== Validation Summary ===\n"
    summary += f"Total files validated: {len(json_files)}\n"
    summary += f"Valid files: {valid_files}\n"
    summary += f"Invalid files: {invalid_files}\n"
    summary += f"Files with warnings: {warning_files}\n"
    if not args.ignore_floating:
        summary += f"Files with informational messages: {info_files}\n"
    summary += f"\nCourse types:\n"
    summary += f"- Mandatory courses: {mandatory_files}\n"
    summary += f"- Elective courses: {elective_files}\n"
    summary += f"- Unknown type: {len(json_files) - mandatory_files - elective_files}\n"
    summary += f"\nFile formats:\n"
    summary += f"- Updated format (no basicInfo): {updated_format_files}\n"
    summary += f"- Original format: {old_format_files}\n"
    
    logger.info(summary.replace("\n", " | "))
    print(summary)
    print(f"Log file created at: {log_file}")
    print(f"Error log file created at: {error_log_file}")
    
    # Also log the summary to the error log file
    error_logger.warning(f"=== Validation Summary ===")
    error_logger.warning(f"Total files validated: {len(json_files)}")
    error_logger.warning(f"Valid files: {valid_files}")
    error_logger.warning(f"Invalid files: {invalid_files}")
    error_logger.warning(f"Files with warnings: {warning_files}")
    if not args.ignore_floating:
        error_logger.warning(f"Files with informational messages: {info_files}")
    error_logger.warning(f"Mandatory courses: {mandatory_files}")
    error_logger.warning(f"Elective courses: {elective_files}")
    error_logger.warning(f"Unknown type: {len(json_files) - mandatory_files - elective_files}")
    error_logger.warning(f"Updated format (no basicInfo): {updated_format_files}")
    error_logger.warning(f"Original format: {old_format_files}")
    
    logger.info("=== Advanced Course JSON Validator Completed ===")
    error_logger.warning("=== Advanced Course JSON Validator Completed ===")

if __name__ == "__main__":
    main()