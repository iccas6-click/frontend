import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getSettings } from './settings-storage';

export type AppLanguage = 'ko' | 'en' | 'fr';

export const LANGUAGE_OPTIONS: { value: AppLanguage; label: string; nativeLabel: string }[] = [
  { value: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'fr', label: 'French', nativeLabel: 'Français' },
];

type TranslationKey =
  | 'back'
  | 'home'
  | 'settings'
  | 'language'
  | 'korean'
  | 'english'
  | 'french'
  | 'mode'
  | 'standard'
  | 'lowVision'
  | 'standardBody'
  | 'lowVisionBody'
  | 'prescriptionRecognition'
  | 'prescriptionRecognitionInfo'
  | 'fontSize'
  | 'screenContrast'
  | 'diagnosticLogs'
  | 'medicationReminder'
  | 'caregiverSharing'
  | 'comingSoon'
  | 'default'
  | 'large'
  | 'high'
  | 'clearLogs'
  | 'noLogs'
  | 'close'
  | 'openSettings'
  | 'heroTitle'
  | 'prescriptionRecognitionShort'
  | 'supplementRecognitionShort'
  | 'interactionAnalysis'
  | 'oneMinuteCheck'
  | 'startRecognition'
  | 'recentRecords'
  | 'all'
  | 'noRecordsYet'
  | 'showMoreFive'
  | 'resumeRecognition'
  | 'prescriptionCount'
  | 'supplementCount'
  | 'riskDanger'
  | 'riskCaution'
  | 'riskSafe'
  | 'riskNone'
  | 'selectCaptureItem'
  | 'selectCaptureSubtitle'
  | 'capturePrescription'
  | 'captureSupplement'
  | 'capturePrescriptionSubtitle'
  | 'captureSupplementSubtitle'
  | 'addPrescription'
  | 'addSupplement'
  | 'chooseAddMethod'
  | 'captureNew'
  | 'chooseFromGallery'
  | 'chooseFromRecords'
  | 'loadSampleResults'
  | 'existingRecords'
  | 'noReusableRecords'
  | 'noReusableRecordsBody'
  | 'sampleResults'
  | 'use'
  | 'itemsCount'
  | 'moreCount'
  | 'photoPermissionTitle'
  | 'photoPermissionBody'
  | 'cameraPermissionTitle'
  | 'cameraPermissionBody'
  | 'allowPermission'
  | 'cameraError'
  | 'capturePrescriptionTitle'
  | 'captureSupplementTitle'
  | 'capturePrescriptionSubtitle'
  | 'captureSupplementSubtitle'
  | 'capturePrescriptionA11y'
  | 'captureSupplementA11y'
  | 'capturePrescriptionGuide'
  | 'captureSupplementGuide'
  | 'steadyShotHint'
  | 'labelTipTitle'
  | 'pillTipTitle'
  | 'labelTipBody'
  | 'pillTipBody'
  | 'choosePhotoAgain'
  | 'reviewAll'
  | 'recognizing'
  | 'elapsedTime'
  | 'recognitionFailed'
  | 'retry'
  | 'chooseDifferentPhoto'
  | 'pillCandidateReview'
  | 'recognizedCategory'
  | 'recognizedPhoto'
  | 'selectedPhoto'
  | 'addMissingCategory'
  | 'originalPhotoMissing'
  | 'isThisPillCorrect'
  | 'previousCandidate'
  | 'nextCandidate'
  | 'candidateTop3'
  | 'chooseClosestProduct'
  | 'edit'
  | 'ingredientInfoNeeded'
  | 'noDosageInfo'
  | 'noIngredientInfo'
  | 'supplementNeedsIngredient'
  | 'administration'
  | 'ingredients'
  | 'addItem'
  | 'editItem'
  | 'name'
  | 'dosage'
  | 'category'
  | 'save'
  | 'deleteThisItem'
  | 'saveItem'
  | 'itemName'
  | 'namePlaceholder'
  | 'dosagePlaceholder'
  | 'ingredientsPlaceholder'
  | 'reviewAllResults'
  | 'addManually'
  | 'analyzeInteractions'
  | 'analysisInProgress'
  | 'analysisSubtitle'
  | 'pleaseWait'
  | 'analysisWaitBody'
  | 'analysisDelayed'
  | 'analysisDelayedSubtitle'
  | 'tryAgainLater'
  | 'analysisFailedBody'
  | 'analysisAgain'
  | 'goHome'
  | 'analysisResult'
  | 'cannotLoadResult'
  | 'attentionPairs'
  | 'recognizedItems'
  | 'needsIngredientCheck'
  | 'noPairs'
  | 'consultProfessional'
  | 'riskDangerTitle'
  | 'riskCautionTitle'
  | 'riskSafeTitle'
  | 'dbCoverageTitle'
  | 'dbCoverageChecked'
  | 'dbCoverageNoMatch'
  | 'attentionFound'
  | 'noAttentionFound'
  | 'ingredientMatchFailed'
  | 'historyTitle'
  | 'deleteRecords'
  | 'deleteRecordsMessage'
  | 'cancel'
  | 'delete'
  | 'selectedCount'
  | 'deleteSelected'
  | 'select'
  | 'selectDeleteRecords'
  | 'deselect'
  | 'recordNotFound'
  | 'record'
  | 'noAnalysisResult'
  | 'noRecognizedItems'
  | 'unknownItem'
  | 'noUploadPhoto'
  | 'prescriptionServerUnavailable'
  | 'noPrescriptionFound'
  | 'recognizedPrescription'
  | 'recognizedSupplement'
  | 'noSupplementResult'
  | 'ingredientCount'
  | 'prescription'
  | 'prescriptionBag'
  | 'supplement'
  | 'pill';

const STRINGS: Record<TranslationKey, Record<AppLanguage, string>> = {
  back: { ko: '뒤로', en: 'Back', fr: 'Retour' },
  home: { ko: '홈', en: 'Home', fr: 'Accueil' },
  settings: { ko: '설정', en: 'Settings', fr: 'Paramètres' },
  language: { ko: '언어', en: 'Language', fr: 'Langue' },
  korean: { ko: '한국어', en: 'Korean', fr: 'Coréen' },
  english: { ko: '영어', en: 'English', fr: 'Anglais' },
  french: { ko: '프랑스어', en: 'French', fr: 'Français' },
  mode: { ko: '사용 모드', en: 'Usage mode', fr: 'Mode d’utilisation' },
  standard: { ko: '일반', en: 'Standard', fr: 'Standard' },
  lowVision: { ko: '저시력자', en: 'Low vision', fr: 'Malvoyance' },
  standardBody: { ko: '요양사 · 보호자', en: 'Caregivers · guardians', fr: 'Aidants · proches' },
  lowVisionBody: { ko: '큰 버튼 · 높은 대비', en: 'Large buttons · high contrast', fr: 'Grands boutons · contraste élevé' },
  prescriptionRecognition: { ko: '처방전·약봉투 인식', en: 'Prescription and medicine bag recognition', fr: 'Reconnaissance d’ordonnance et de sachet' },
  prescriptionRecognitionInfo: {
    ko: '약품명과 용량을 읽고 성분명을 찾아 상호작용 분석에 사용합니다.',
    en: 'Reads medicine names and dosages, then finds ingredients for interaction analysis.',
    fr: 'Lit les noms et doses des médicaments, puis identifie les ingrédients pour analyser les interactions.',
  },
  fontSize: { ko: '글자 크기', en: 'Text size', fr: 'Taille du texte' },
  screenContrast: { ko: '화면 대비', en: 'Screen contrast', fr: 'Contraste de l’écran' },
  diagnosticLogs: { ko: '진단 로그', en: 'Diagnostic logs', fr: 'Journaux de diagnostic' },
  medicationReminder: { ko: '복용 알림', en: 'Medication reminders', fr: 'Rappels de prise' },
  caregiverSharing: { ko: '보호자 공유', en: 'Caregiver sharing', fr: 'Partage avec un aidant' },
  comingSoon: { ko: '준비 중', en: 'Coming soon', fr: 'Bientôt disponible' },
  default: { ko: '기본', en: 'Default', fr: 'Par défaut' },
  large: { ko: '크게', en: 'Large', fr: 'Grand' },
  high: { ko: '높음', en: 'High', fr: 'Élevé' },
  clearLogs: { ko: '로그 지우기', en: 'Clear logs', fr: 'Effacer les journaux' },
  noLogs: { ko: '아직 로그가 없어요.', en: 'No logs yet.', fr: 'Aucun journal pour le moment.' },
  close: { ko: '닫기', en: 'Close', fr: 'Fermer' },
  openSettings: { ko: '설정 열기', en: 'Open settings', fr: 'Ouvrir les paramètres' },
  heroTitle: {
    ko: '같이 먹어도 괜찮은지\n사진으로 먼저 확인하세요.',
    en: 'Check with a photo first\nbefore taking them together.',
    fr: 'Vérifiez d’abord avec une photo\navant de les prendre ensemble.',
  },
  prescriptionRecognitionShort: { ko: '처방약 인식', en: 'Prescription scan', fr: 'Scan ordonnance' },
  supplementRecognitionShort: { ko: '건강기능식품 인식', en: 'Supplement scan', fr: 'Scan complément' },
  interactionAnalysis: { ko: '상호작용 분석', en: 'Interaction analysis', fr: 'Analyse des interactions' },
  oneMinuteCheck: { ko: '복용 전 1분 체크', en: '1-minute check before use', fr: 'Vérification en 1 minute' },
  startRecognition: { ko: '인식 시작하기', en: 'Start scanning', fr: 'Commencer le scan' },
  recentRecords: { ko: '최근 기록', en: 'Recent records', fr: 'Historique récent' },
  all: { ko: '전체', en: 'All', fr: 'Tout' },
  noRecordsYet: { ko: '아직 기록이 없어요', en: 'No records yet', fr: 'Aucun historique' },
  showMoreFive: { ko: '5개 더보기', en: 'Show 5 more', fr: 'Afficher 5 de plus' },
  resumeRecognition: { ko: '하던 인식이 있어요', en: 'You have a scan in progress', fr: 'Un scan est en cours' },
  prescriptionCount: { ko: '처방약 {count}개', en: '{count} prescriptions', fr: '{count} médicaments' },
  supplementCount: { ko: '건강기능식품 {count}개', en: '{count} supplements', fr: '{count} compléments' },
  riskDanger: { ko: '위험', en: 'Danger', fr: 'Danger' },
  riskCaution: { ko: '주의', en: 'Caution', fr: 'Attention' },
  riskSafe: { ko: '미탐지', en: 'Not found', fr: 'Non détecté' },
  riskNone: { ko: '결과 없음', en: 'No result', fr: 'Aucun résultat' },
  selectCaptureItem: { ko: '촬영할 항목 선택', en: 'Choose what to scan', fr: 'Choisir quoi scanner' },
  selectCaptureSubtitle: {
    ko: '처방전·약봉투와 건강기능식품을 순서대로 추가해 상호작용을 확인합니다.',
    en: 'Add prescriptions and supplements in order to check interactions.',
    fr: 'Ajoutez les ordonnances et compléments dans l’ordre pour vérifier les interactions.',
  },
  capturePrescription: { ko: '처방전·약봉투 촬영', en: 'Scan prescription or medicine bag', fr: 'Scanner ordonnance ou sachet' },
  captureSupplement: { ko: '건강기능식품 촬영', en: 'Scan supplement', fr: 'Scanner un complément' },
  capturePrescriptionSubtitle: { ko: '조제약 봉투, 처방전, 복약 안내문', en: 'Medicine bag, prescription, or medication guide', fr: 'Sachet, ordonnance ou notice de prise' },
  captureSupplementSubtitle: { ko: '비타민, 오메가3, 유산균 등 제품 라벨', en: 'Product labels such as vitamins, omega-3, probiotics', fr: 'Étiquettes de vitamines, oméga-3, probiotiques, etc.' },
  addPrescription: { ko: '처방전·약봉투 추가', en: 'Add prescription or medicine bag', fr: 'Ajouter ordonnance ou sachet' },
  addSupplement: { ko: '건강기능식품 추가', en: 'Add supplement', fr: 'Ajouter un complément' },
  chooseAddMethod: { ko: '{label}을 어떻게 추가할까요?', en: 'How would you like to add {label}?', fr: 'Comment ajouter {label} ?' },
  captureNew: { ko: '새 {label} 촬영하기', en: 'Take a new photo of {label}', fr: 'Prendre une nouvelle photo de {label}' },
  chooseFromGallery: { ko: '갤러리에서 가져오기', en: 'Choose from gallery', fr: 'Choisir dans la galerie' },
  chooseFromRecords: { ko: '기존 기록에서 선택하기', en: 'Choose from saved records', fr: 'Choisir dans l’historique' },
  loadSampleResults: { ko: '예시 결과 불러오기', en: 'Load sample results', fr: 'Charger des exemples' },
  existingRecords: { ko: '기존 {label} 기록', en: 'Saved {label} records', fr: 'Historique {label}' },
  noReusableRecords: { ko: '아직 재사용할 {label} 기록이 없어요', en: 'No reusable {label} records yet', fr: 'Aucun historique {label} réutilisable' },
  noReusableRecordsBody: {
    ko: '이번에는 새로 촬영하면 다음부터 여기에서 바로 선택할 수 있습니다.',
    en: 'Take a new photo this time, and it will be available here next time.',
    fr: 'Prenez une nouvelle photo cette fois-ci, elle sera disponible ici ensuite.',
  },
  sampleResults: { ko: '예시 {label} 결과', en: 'Sample {label} results', fr: 'Exemples {label}' },
  use: { ko: '사용', en: 'Use', fr: 'Utiliser' },
  itemsCount: { ko: '{count}개', en: '{count} items', fr: '{count} éléments' },
  moreCount: { ko: '외 {count}개', en: '+ {count} more', fr: '+ {count} autres' },
  photoPermissionTitle: { ko: '사진 접근 권한이 필요해요', en: 'Photo access is required', fr: 'Accès aux photos requis' },
  photoPermissionBody: {
    ko: '갤러리 사진으로 인식하려면 사진 접근을 허용해 주세요.',
    en: 'Allow photo access to scan an image from your gallery.',
    fr: 'Autorisez l’accès aux photos pour analyser une image de votre galerie.',
  },
  cameraPermissionTitle: { ko: '카메라 권한이 필요해요', en: 'Camera access is required', fr: 'Accès à la caméra requis' },
  cameraPermissionBody: {
    ko: '처방전, 약 봉투와 건강기능식품 라벨을 촬영할 수 있도록 접근을 허용해 주세요.',
    en: 'Allow access so you can photograph prescriptions, medicine bags, and supplement labels.',
    fr: 'Autorisez l’accès pour photographier ordonnances, sachets de médicaments et étiquettes de compléments.',
  },
  allowPermission: { ko: '권한 허용하기', en: 'Allow access', fr: 'Autoriser l’accès' },
  cameraError: { ko: '촬영 오류', en: 'Camera error', fr: 'Erreur de prise de vue' },
  capturePrescriptionTitle: { ko: '처방전·약봉투 촬영', en: 'Scan prescription or medicine bag', fr: 'Scanner ordonnance ou sachet' },
  captureSupplementTitle: { ko: '건강기능식품 촬영', en: 'Scan supplement', fr: 'Scanner un complément' },
  capturePrescriptionA11y: { ko: '처방전 또는 약봉투 촬영하기', en: 'Take a photo of a prescription or medicine bag', fr: 'Photographier une ordonnance ou un sachet' },
  captureSupplementA11y: { ko: '건강기능식품 촬영하기', en: 'Take a photo of a supplement', fr: 'Photographier un complément' },
  capturePrescriptionGuide: { ko: '약품명·용량이 보이게 전체를 촬영하세요.', en: 'Capture the full document so medicine names and dosages are visible.', fr: 'Cadrez tout le document pour voir noms et doses.' },
  captureSupplementGuide: { ko: '제품명과 성분표가 보이게 촬영하세요.', en: 'Make the product name and ingredient panel visible.', fr: 'Rendez visibles le nom du produit et la liste des ingrédients.' },
  steadyShotHint: { ko: '흔들리지 않게 정면에서 촬영해 주세요', en: 'Hold steady and shoot from the front', fr: 'Tenez l’appareil stable et photographiez de face' },
  labelTipTitle: { ko: '라벨 글자가 중요해요', en: 'Label text matters', fr: 'Le texte de l’étiquette compte' },
  pillTipTitle: { ko: '약품명이 보이게 촬영해요', en: 'Make the medicine name visible', fr: 'Rendez le nom du médicament lisible' },
  labelTipBody: {
    ko: '성분명과 함량 부분이 잘리지 않게 촬영하면 확인이 쉬워집니다.',
    en: 'Include ingredient names and amounts clearly for easier checking.',
    fr: 'Incluez clairement les ingrédients et quantités pour faciliter la vérification.',
  },
  pillTipBody: {
    ko: '처방전이나 약 봉투의 약 이름과 용량 부분이 선명하면 확인이 쉬워집니다.',
    en: 'Clear medicine names and dosages make verification easier.',
    fr: 'Des noms et doses lisibles facilitent la vérification.',
  },
  choosePhotoAgain: { ko: '사진 다시 선택', en: 'Choose photo again', fr: 'Choisir une autre photo' },
  reviewAll: { ko: '전체 확인', en: 'Review all', fr: 'Tout vérifier' },
  recognizing: { ko: '인식 중', en: 'Scanning', fr: 'Analyse en cours' },
  elapsedTime: { ko: '소요 시간 {time}', en: 'Elapsed {time}', fr: 'Temps écoulé {time}' },
  recognitionFailed: { ko: '인식 실패', en: 'Scan failed', fr: 'Échec du scan' },
  retry: { ko: '다시 시도', en: 'Try again', fr: 'Réessayer' },
  chooseDifferentPhoto: { ko: '다른 사진 선택', en: 'Choose another photo', fr: 'Choisir une autre photo' },
  pillCandidateReview: { ko: '약 후보 확인', en: 'Review medicine candidates', fr: 'Vérifier les candidats' },
  recognizedCategory: { ko: '인식된 {label}', en: 'Scanned {label}', fr: '{label} scanné' },
  recognizedPhoto: { ko: '인식한 사진', en: 'Scanned photo', fr: 'Photo analysée' },
  selectedPhoto: { ko: '선택한 사진', en: 'Selected photo', fr: 'Photo sélectionnée' },
  addMissingCategory: { ko: '목록에 없는 {label} 직접 추가', en: 'Add missing {label}\nmanually', fr: 'Ajouter {label}\nmanuellement' },
  originalPhotoMissing: { ko: '원본 사진 없음', en: 'Original photo unavailable', fr: 'Photo originale indisponible' },
  isThisPillCorrect: { ko: '표시된 약 후보가 맞나요?', en: 'Is the highlighted medicine correct?', fr: 'Le médicament indiqué est-il correct ?' },
  previousCandidate: { ko: '이전 약 후보', en: 'Previous candidate', fr: 'Candidat précédent' },
  nextCandidate: { ko: '다음 약 후보', en: 'Next candidate', fr: 'Candidat suivant' },
  candidateTop3: { ko: '후보 Top 3', en: 'Top 3 candidates', fr: 'Top 3 candidats' },
  chooseClosestProduct: { ko: '문서 내용과 가장 가까운 제품을 선택', en: 'Choose the product closest to the document', fr: 'Choisissez le produit le plus proche du document' },
  edit: { ko: '수정', en: 'Edit', fr: 'Modifier' },
  ingredientInfoNeeded: { ko: '성분 정보 확인 필요', en: 'Ingredient info needed', fr: 'Ingrédients à vérifier' },
  noDosageInfo: { ko: '용량 정보 없음', en: 'No dosage info', fr: 'Dose non renseignée' },
  noIngredientInfo: { ko: '성분 정보 없음', en: 'No ingredient info', fr: 'Aucun ingrédient' },
  supplementNeedsIngredient: { ko: '성분 확인 필요', en: 'Ingredient check needed', fr: 'Ingrédient à vérifier' },
  administration: { ko: '복용법', en: 'Directions', fr: 'Mode de prise' },
  ingredients: { ko: '성분', en: 'Ingredients', fr: 'Ingrédients' },
  addItem: { ko: '항목 추가', en: 'Add item', fr: 'Ajouter un élément' },
  editItem: { ko: '항목 수정', en: 'Edit item', fr: 'Modifier l’élément' },
  name: { ko: '이름', en: 'Name', fr: 'Nom' },
  dosage: { ko: '용량', en: 'Dosage', fr: 'Dose' },
  category: { ko: '분류', en: 'Category', fr: 'Catégorie' },
  save: { ko: '저장', en: 'Save', fr: 'Enregistrer' },
  deleteThisItem: { ko: '이 항목 삭제', en: 'Delete this item', fr: 'Supprimer cet élément' },
  saveItem: { ko: '항목 저장', en: 'Save item', fr: 'Enregistrer l’élément' },
  itemName: { ko: '항목 이름', en: 'Item name', fr: 'Nom de l’élément' },
  namePlaceholder: { ko: '예: 아스피린', en: 'e.g. Aspirin', fr: 'ex. aspirine' },
  dosagePlaceholder: { ko: '예: 100mg', en: 'e.g. 100 mg', fr: 'ex. 100 mg' },
  ingredientsPlaceholder: { ko: '예: 아스피린, EPA 및 DHA 함유 유지', en: 'e.g. Aspirin, EPA and DHA oil', fr: 'ex. aspirine, huile EPA et DHA' },
  reviewAllResults: { ko: '전체 인식 결과', en: 'All scan results', fr: 'Tous les résultats' },
  addManually: { ko: '직접 추가', en: 'Add manually', fr: 'Ajouter manuellement' },
  analyzeInteractions: { ko: '상호작용 분석하기', en: 'Analyze interactions', fr: 'Analyser les interactions' },
  analysisInProgress: { ko: '상호작용 분석 중', en: 'Analyzing interactions', fr: 'Analyse des interactions' },
  analysisSubtitle: {
    ko: '성분 조합을 대조하고 상담이 필요한 항목을 정리하고 있어요.',
    en: 'Checking ingredient combinations and organizing items that may need consultation.',
    fr: 'Nous comparons les ingrédients et signalons les éléments pouvant nécessiter un avis.',
  },
  pleaseWait: { ko: '잠시만 기다려 주세요', en: 'Please wait a moment', fr: 'Veuillez patienter' },
  analysisWaitBody: {
    ko: '복용 중단을 지시하지 않고, 상담이 필요한 신호만 먼저 찾아봅니다.',
    en: 'We do not tell you to stop taking anything; we first look for signs that need consultation.',
    fr: 'Nous ne demandons pas d’arrêter un traitement ; nous cherchons d’abord les signes nécessitant un avis.',
  },
  analysisDelayed: { ko: '분석 지연', en: 'Analysis delayed', fr: 'Analyse retardée' },
  analysisDelayedSubtitle: {
    ko: '네트워크나 임시 오류로 결과를 정리하지 못했어요.',
    en: 'A network or temporary error prevented us from preparing the result.',
    fr: 'Une erreur réseau ou temporaire a empêché de préparer le résultat.',
  },
  tryAgainLater: { ko: '잠시 후 다시 시도해 주세요', en: 'Please try again shortly', fr: 'Veuillez réessayer dans un instant' },
  analysisFailedBody: {
    ko: '입력한 목록은 유지됩니다. 같은 항목으로 바로 다시 분석할 수 있어요.',
    en: 'Your list is kept. You can reanalyze the same items right away.',
    fr: 'Votre liste est conservée. Vous pouvez relancer l’analyse avec les mêmes éléments.',
  },
  analysisAgain: { ko: '다시 분석하기', en: 'Analyze again', fr: 'Relancer l’analyse' },
  goHome: { ko: '처음으로 돌아가기', en: 'Back to start', fr: 'Retour au début' },
  analysisResult: { ko: '분석 결과', en: 'Analysis result', fr: 'Résultat d’analyse' },
  cannotLoadResult: { ko: '결과를 불러올 수 없어요', en: 'Unable to load the result', fr: 'Impossible de charger le résultat' },
  attentionPairs: { ko: '주의할 조합', en: 'Combinations to watch', fr: 'Combinaisons à surveiller' },
  recognizedItems: { ko: '인식한 항목', en: 'Scanned items', fr: 'Éléments scannés' },
  needsIngredientCheck: { ko: '성분 확인 필요', en: 'Ingredient check needed', fr: 'Ingrédient à vérifier' },
  noPairs: { ko: '해당 조합이 없어요', en: 'No combinations here', fr: 'Aucune combinaison' },
  consultProfessional: {
    ko: '복용 변경 전에는 의사 또는 약사와 상담하세요.',
    en: 'Consult a doctor or pharmacist before changing how you take anything.',
    fr: 'Consultez un médecin ou un pharmacien avant de modifier une prise.',
  },
  riskDangerTitle: { ko: '전문가 상담이 필요해요', en: 'Professional consultation needed', fr: 'Avis professionnel requis' },
  riskCautionTitle: { ko: '주의해서 확인해 주세요', en: 'Please check carefully', fr: 'À vérifier avec prudence' },
  riskSafeTitle: { ko: '중대한 주의사항 미탐지', en: 'No major warning found', fr: 'Aucune alerte majeure détectée' },
  dbCoverageTitle: { ko: 'DB 확인 결과', en: 'Database check', fr: 'Vérification DB' },
  dbCoverageChecked: {
    ko: 'DB에서 매칭된 {count}개 조합을 기준으로 확인했어요.',
    en: 'Checked against {count} combinations matched in the database.',
    fr: 'Vérifié sur {count} combinaisons trouvées dans la base.',
  },
  dbCoverageNoMatch: {
    ko: 'DB에서 양쪽 성분이 모두 매칭된 조합이 없었어요.',
    en: 'No combinations had both ingredients matched in the database.',
    fr: 'Aucune combinaison n’avait les deux ingrédients trouvés dans la base.',
  },
  attentionFound: { ko: '주의 발견', en: 'Warnings found', fr: 'Alertes trouvées' },
  noAttentionFound: { ko: '주의 정보 미탐지', en: 'No warning found', fr: 'Aucune alerte' },
  ingredientMatchFailed: {
    ko: '성분 매칭 실패 · 처방약 {drug} · 건강기능식품 {supplement}',
    en: 'Ingredient match failed · prescriptions {drug} · supplements {supplement}',
    fr: 'Échec de correspondance · médicaments {drug} · compléments {supplement}',
  },
  historyTitle: { ko: '분석 기록', en: 'Analysis history', fr: 'Historique d’analyse' },
  deleteRecords: { ko: '기록 삭제', en: 'Delete records', fr: 'Supprimer les historiques' },
  deleteRecordsMessage: { ko: '{count}개의 분석 기록을 삭제할까요?', en: 'Delete {count} analysis records?', fr: 'Supprimer {count} historiques d’analyse ?' },
  cancel: { ko: '취소', en: 'Cancel', fr: 'Annuler' },
  delete: { ko: '삭제', en: 'Delete', fr: 'Supprimer' },
  selectedCount: { ko: '선택 {count}개', en: '{count} selected', fr: '{count} sélectionné(s)' },
  deleteSelected: { ko: '선택 삭제', en: 'Delete selected', fr: 'Supprimer la sélection' },
  select: { ko: '선택', en: 'Select', fr: 'Sélectionner' },
  selectDeleteRecords: { ko: '삭제할 기록 선택', en: 'Select records to delete', fr: 'Sélectionnez les historiques à supprimer' },
  deselect: { ko: '해제', en: 'Clear', fr: 'Effacer' },
  recordNotFound: { ko: '기록을 찾을 수 없어요', en: 'Record not found', fr: 'Historique introuvable' },
  record: { ko: '기록', en: 'Record', fr: 'Historique' },
  noAnalysisResult: { ko: '분석 결과가 없어요', en: 'No analysis result', fr: 'Aucun résultat d’analyse' },
  noRecognizedItems: { ko: '인식 기록 없음', en: 'No scanned items', fr: 'Aucun élément scanné' },
  unknownItem: { ko: '이름 없는 항목', en: 'Unnamed item', fr: 'Élément sans nom' },
  noUploadPhoto: { ko: '업로드할 사진이 없습니다.', en: 'There is no photo to upload.', fr: 'Aucune photo à téléverser.' },
  prescriptionServerUnavailable: {
    ko: '처방전/약봉투 인식 서버에 연결하지 못했습니다.',
    en: 'Could not connect to the prescription recognition server.',
    fr: 'Impossible de se connecter au serveur de reconnaissance d’ordonnance.',
  },
  noPrescriptionFound: {
    ko: '처방전 또는 약봉투에서 약품명을 찾지 못했습니다.',
    en: 'No medicine name was found in the prescription or medicine bag.',
    fr: 'Aucun nom de médicament trouvé dans l’ordonnance ou le sachet.',
  },
  recognizedPrescription: { ko: '인식된 처방약', en: 'Scanned prescription medicine', fr: 'Médicament scanné' },
  recognizedSupplement: { ko: '인식된 건강기능식품', en: 'Scanned supplement', fr: 'Complément scanné' },
  noSupplementResult: {
    ko: '건강기능식품 인식 결과가 없습니다.',
    en: 'No supplement recognition result was found.',
    fr: 'Aucun résultat de reconnaissance du complément.',
  },
  ingredientCount: { ko: '성분 {count}개', en: '{count} ingredients', fr: '{count} ingrédients' },
  prescription: { ko: '처방약', en: 'Prescription medicine', fr: 'Médicament' },
  prescriptionBag: { ko: '처방전·약봉투', en: 'prescription or medicine bag', fr: 'ordonnance ou sachet' },
  supplement: { ko: '건강기능식품', en: 'Supplement', fr: 'Complément' },
  pill: { ko: '알약', en: 'Pill', fr: 'Comprimé' },
};

const EXACT_TEXT: Partial<Record<string, TranslationKey>> = Object.fromEntries(
  Object.entries(STRINGS).map(([key, values]) => [values.ko, key as TranslationKey]),
);

export function normalizeLanguage(value: unknown): AppLanguage {
  return value === 'en' || value === 'fr' ? value : 'ko';
}

export function translate(lang: AppLanguage, key: TranslationKey, vars: Record<string, string | number> = {}) {
  let text = STRINGS[key][lang] ?? STRINGS[key].ko;
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{${name}}`, String(value));
  });
  return text;
}

export function formatElapsedSeconds(lang: AppLanguage, seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (minutes > 0) {
    if (lang === 'ko') return `${minutes}분 ${remainingSeconds}초`;
    if (lang === 'fr') return `${minutes} min ${remainingSeconds} s`;
    return `${minutes}m ${remainingSeconds}s`;
  }

  if (lang === 'ko') return `${remainingSeconds}초`;
  if (lang === 'fr') return `${remainingSeconds} s`;
  return `${remainingSeconds}s`;
}

export function translateExact(lang: AppLanguage, text: string) {
  const key = EXACT_TEXT[text];
  return key ? translate(lang, key) : text;
}

export function useLanguage() {
  const [language, setLanguage] = useState<AppLanguage>('ko');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSettings().then((settings) => {
        if (active) setLanguage(settings.language);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return language;
}

export function useI18n() {
  const language = useLanguage();
  return {
    language,
    t: useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars), [language]),
    tx: useCallback((text: string) => translateExact(language, text), [language]),
  };
}

export function categoryLabel(category: '알약' | '건강기능식품 라벨', lang: AppLanguage, variant: 'short' | 'capture' = 'short') {
  if (category === '건강기능식품 라벨') return translate(lang, 'supplement');
  return variant === 'capture' ? translate(lang, 'prescriptionBag') : translate(lang, 'prescription');
}

export function riskLabel(level: 'danger' | 'caution' | 'safe' | undefined, lang: AppLanguage) {
  if (level === 'danger') return translate(lang, 'riskDanger');
  if (level === 'caution') return translate(lang, 'riskCaution');
  if (level === 'safe') return translate(lang, 'riskSafe');
  return translate(lang, 'riskNone');
}

export function formatDateTime(iso: string, lang: AppLanguage, options: Intl.DateTimeFormatOptions) {
  const locale = lang === 'ko' ? 'ko-KR' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.DateTimeFormat(locale, options).format(new Date(iso));
}
