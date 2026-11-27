export type Phase1PageId =
  | 'home'
  | 'marketplace'
  | 'business'
  | 'card'
  | 'healthy'
  | 'factory'
  | 'finance';

export const BASIT_LOGO_URL =
  '/assets/aistudio/Gemini_Generated_Image_o3dq2co3dq2co3dq_5e34cdd2.jpg';

export const PHASE1_PHOTOS = {
  logisticsHub: '/src/assets/images/basit_hero_logistics_1795799959855.jpg',
  centralKitchen: '/src/assets/images/basit_central_kitchen_1795799959402.jpg',
  businessCatering: '/src/assets/images/basit_business_catering_1795799959420.jpg',
  healthyMeals: '/src/assets/images/basit_healthy_meals_1795799959606.jpg',
  factoryCanteen: '/src/assets/images/basit_factory_catering_1795799959770.jpg',
} as const;

export interface SectorMeta {
  id: Exclude<Phase1PageId, 'home'>;
  code: string;
  titleAr: string;
  titleEn: string;
  shortAr: string;
  shortEn: string;
  taglineAr: string;
  taglineEn: string;
  image: string;
}

export const BASIT_SECTORS: SectorMeta[] = [
  {
    id: 'marketplace',
    code: 'BASIT MARKETPLACE',
    titleAr: 'سوق باسط',
    titleEn: 'BASIT Marketplace',
    shortAr: 'المطابخ والموردون',
    shortEn: 'Kitchens & Suppliers',
    taglineAr: 'ربط المطابخ المركزية والموردين المعتمدين بالعملاء مع الطاقات ومناطق الخدمة',
    taglineEn: 'Connecting central kitchens and verified suppliers with daily capacities & service zones',
    image: PHASE1_PHOTOS.centralKitchen,
  },
  {
    id: 'business',
    code: 'BASIT BUSINESS',
    titleAr: 'باسط أعمال',
    titleEn: 'BASIT Business',
    shortAr: 'التغذية المؤسسية',
    shortEn: 'Enterprise Catering',
    taglineAr: 'حلول الإعاشة والتوريد للمصانع والشركات والمستشفيات والمدارس والنوادي والمؤتمرات',
    taglineEn: 'Institutional supply & catering for factories, corporates, hospitals, schools & events',
    image: PHASE1_PHOTOS.businessCatering,
  },
  {
    id: 'card',
    code: 'BASIT CARD',
    titleAr: 'كارت باسط',
    titleEn: 'BASIT Card',
    shortAr: 'مزايا الموظفين',
    shortEn: 'Employee Benefits',
    taglineAr: 'كروت المزايا الشهرية، القسائم الذكية، والخصومات والعروض الترفيهية المعتمدة',
    taglineEn: 'Monthly employee benefit cards, smart vouchers & partner entertainment perks',
    image: PHASE1_PHOTOS.logisticsHub,
  },
  {
    id: 'healthy',
    code: 'BASIT HEALTHY',
    titleAr: 'باسط هيلثي',
    titleEn: 'BASIT Healthy',
    shortAr: 'الوجبات الصحية',
    shortEn: 'Healthy Plans',
    taglineAr: 'برامج اشتراكات الوجبات الصحية موزونة السعرات للأفراد والجيمات والمراكز الرياضية',
    taglineEn: 'Macro-balanced daily meal subscriptions for individuals, gyms & sports centers',
    image: PHASE1_PHOTOS.healthyMeals,
  },
  {
    id: 'factory',
    code: 'FACTORY SYSTEM',
    titleAr: 'نظام المصانع',
    titleEn: 'Factory System',
    shortAr: 'بوابة كل مصنع',
    shortEn: 'Factory Portals',
    taglineAr: 'واجهة تشغيلية مستقلة لكل مصنع بهويته وشعاره لإدارة الوجبات والموظفين والتنبيهات',
    taglineEn: 'Dedicated branded factory portal for shift meals, staff cards, offers & alerts',
    image: PHASE1_PHOTOS.factoryCanteen,
  },
  {
    id: 'finance',
    code: 'OWNER FINANCIAL MANAGEMENT',
    titleAr: 'الإدارة المالية',
    titleEn: 'Owner Finance',
    shortAr: 'المركز المالي للمالك',
    shortEn: 'Central Financial Hub',
    taglineAr: 'هيكلية الإدارة المالية المركزية للخزينة والبنوك والمحافظ والفواتير والأرباح',
    taglineEn: 'Central owner finance architecture across treasury, bank accounts, wallets & profit ledger',
    image: PHASE1_PHOTOS.logisticsHub,
  },
];

export interface MarketplacePartnerPreview {
  id: string;
  category: 'kitchen' | 'supplier';
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  capacityAr: string;
  capacityEn: string;
  zonesAr: string;
  zonesEn: string;
  specialtyAr: string;
  specialtyEn: string;
  rating: string;
  image: string;
}

export const PHASE1_PARTNERS: MarketplacePartnerPreview[] = [
  {
    id: 'kitchen_alain',
    category: 'kitchen',
    nameAr: 'مطبخ ومركز العين — مدينة بدر',
    nameEn: 'Al-Ain Central Kitchen — Badr City',
    cityAr: 'مدينة بدر',
    cityEn: 'Badr City',
    capacityAr: '8,500 وجبة / يوم',
    capacityEn: '8,500 meals / day',
    zonesAr: 'بدر · العاشر · الشروق · القاهرة الجديدة',
    zonesEn: 'Badr · 10th of Ramadan · Shorouk · New Cairo',
    specialtyAr: 'إعاشة الورديات الصناعية والوجبات الساخنة وبروتوكولات المستشفيات',
    specialtyEn: 'Industrial shift catering, hot meal trays & clinical nutrition service',
    rating: '4.9',
    image: PHASE1_PHOTOS.centralKitchen,
  },
  {
    id: 'kitchen_hanger',
    category: 'kitchen',
    nameAr: 'المطبخ الوطني المركزي — العاشر',
    nameEn: 'Al-Wataniya Central Kitchen — 10th Ramadan',
    cityAr: 'العاشر من رمضان',
    cityEn: '10th of Ramadan',
    capacityAr: '6,200 وجبة / يوم',
    capacityEn: '6,200 meals / day',
    zonesAr: 'العاشر · العبور · السلام · بلبيس',
    zonesEn: '10th Ramadan · Obour · El-Salam · Belbeis',
    specialtyAr: 'تجهيز وجبات المدارس والنوادي وضيافة المؤتمرات الكبرى',
    specialtyEn: 'School nutrition packs, sports club catering & conference hospitality',
    rating: '4.8',
    image: PHASE1_PHOTOS.businessCatering,
  },
  {
    id: 'supplier_zadi',
    category: 'supplier',
    nameAr: 'الوطنية لتوريدات الأغذية الطازجة',
    nameEn: 'Wataniya Fresh Food Supply',
    cityAr: 'العبور اللوجستية',
    cityEn: 'Obour Logistics Hub',
    capacityAr: '45 طن / أسبوع',
    capacityEn: '45 tons / week',
    zonesAr: 'القاهرة الكبرى · السويس · الدلتا',
    zonesEn: 'Greater Cairo · Suez · Delta',
    specialtyAr: 'توريد البروتينات والخضروات المبردة والتعبئة المعيارية للمطابخ',
    specialtyEn: 'Chilled proteins, fresh produce & standardized kitchen packaging',
    rating: '4.9',
    image: PHASE1_PHOTOS.logisticsHub,
  },
];

export interface BusinessVerticalPreview {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  shiftModelAr: string;
  shiftModelEn: string;
  minDailyMeals: number;
}

export const PHASE1_BUSINESS_VERTICALS: BusinessVerticalPreview[] = [
  {
    id: 'factories',
    titleAr: 'المصانع والمناطق الصناعية',
    titleEn: 'Factories & Industrial Zones',
    summaryAr: 'تغذية الورديات الثلاث بمواعيد تسليم دقيقة ومعايير سلامة غذائية معتمدة.',
    summaryEn: 'Three-shift factory meal dispatch with strict arrival windows & food safety.',
    shiftModelAr: 'فطار · غداء ساخن · وجبة ليلية',
    shiftModelEn: 'Breakfast · Hot Lunch · Night Shift',
    minDailyMeals: 150,
  },
  {
    id: 'companies',
    titleAr: 'الشركات والمقرات الإدارية',
    titleEn: 'Corporates & Offices',
    summaryAr: 'وجبات يومية وبوفيهات اجتماعات باشتراكات شهرية مرنة للموظفين.',
    summaryEn: 'Daily team lunches & executive meeting catering with monthly corporate plans.',
    shiftModelAr: 'غداء مكتبي · ضيافة اجتماعات',
    shiftModelEn: 'Office Lunch · Meeting Hospitality',
    minDailyMeals: 40,
  },
  {
    id: 'hospitals',
    titleAr: 'المستشفيات والمراكز الطبية',
    titleEn: 'Hospitals & Clinics',
    summaryAr: 'وجبات علاجية مخصصة للمرضى ووجبات متوازنة للأطقم الطبية المناوبة.',
    summaryEn: 'Therapeutic patient trays & balanced meals for 24/7 clinical staff.',
    shiftModelAr: 'وجبات علاجية · أطقم طبية',
    shiftModelEn: 'Clinical Diets · Medical Staff',
    minDailyMeals: 100,
  },
  {
    id: 'schools',
    titleAr: 'المدارس والجامعات',
    titleEn: 'Schools & Universities',
    summaryAr: 'وجبات طلابية صحية مغلفة يومياً بدون مواد حافظة وبإشراف تغذوي.',
    summaryEn: 'Nutritious daily sealed student meal packs supervised by dietitians.',
    shiftModelAr: 'سناكس مدرسي · غداء جامعي',
    shiftModelEn: 'School Packs · Campus Meals',
    minDailyMeals: 200,
  },
  {
    id: 'clubs',
    titleAr: 'النوادي والأكاديميات الرياضية',
    titleEn: 'Sports Clubs & Academies',
    summaryAr: 'وجبات استشفاء وبروتين للفرق الرياضية والمعسكرات التدريبية.',
    summaryEn: 'High-protein recovery meals for athletic teams & training camps.',
    shiftModelAr: 'تغذية رياضيين · معسكرات',
    shiftModelEn: 'Athlete Fuel · Training Camps',
    minDailyMeals: 60,
  },
  {
    id: 'events',
    titleAr: 'الحفلات والمؤتمرات الكبرى',
    titleEn: 'Events & Conferences',
    summaryAr: 'تجهيز وإدارة الضيافة الميدانية للفعاليات والمعارض والمؤتمرات.',
    summaryEn: 'End-to-end hospitality & buffet logistics for summits and exhibitions.',
    shiftModelAr: 'كوفي بريك · مأدبة رئيسية',
    shiftModelEn: 'Coffee Breaks · Gala Banquet',
    minDailyMeals: 80,
  },
];

export interface HealthyPlanPreview {
  id: string;
  segment: 'individual' | 'gym' | 'sports_center';
  titleAr: string;
  titleEn: string;
  calories: number;
  proteinGrams: number;
  mealsPerDay: number;
  priceEGP: number;
  durationDays: number;
  sampleMenuAr: string;
  sampleMenuEn: string;
}

export const PHASE1_HEALTHY_PLANS: HealthyPlanPreview[] = [
  {
    id: 'hp_lean_ind',
    segment: 'individual',
    titleAr: 'باقة التوازن اليومي للأفراد',
    titleEn: 'Individual Daily Balance',
    calories: 1650,
    proteinGrams: 125,
    mealsPerDay: 3,
    priceEGP: 3200,
    durationDays: 26,
    sampleMenuAr: 'شوفان بالتوت · صدور مشوية مع أرز بسمتي · سلمون وخضار سوتيه',
    sampleMenuEn: 'Berry Oats · Grilled Chicken & Basmati · Seared Salmon & Vegetables',
    },
  {
    id: 'hp_gym_pro',
    segment: 'gym',
    titleAr: 'باقة البناء العضلي للجيمات',
    titleEn: 'Gym Athlete Pro Bulk',
    calories: 2550,
    proteinGrams: 195,
    mealsPerDay: 4,
    priceEGP: 4400,
    durationDays: 26,
    sampleMenuAr: 'بياض بيض وأفوكادو · ستيك مشوي مع بطاطا حلوة · فيليه دجاج · شيك بروتين طبيعي',
    sampleMenuEn: 'Egg Whites & Avocado · Lean Steak & Sweet Potato · Chicken Fillet · Recovery Bowl',
  },
  {
    id: 'hp_academy',
    segment: 'sports_center',
    titleAr: 'برنامج المراكز والأكاديميات الرياضية',
    titleEn: 'Sports Academy Squad Program',
    calories: 2150,
    proteinGrams: 160,
    mealsPerDay: 3,
    priceEGP: 3850,
    durationDays: 26,
    sampleMenuAr: 'وجبة طاقة صباحية · بروتين مشوي وكينوا · عشاء استشفاء خفيف',
    sampleMenuEn: 'Morning Carb-Load · Grilled Protein & Quinoa · Light Recovery Dinner',
  },
];

export interface FactoryWorkspacePreview {
  id: string;
  nameAr: string;
  nameEn: string;
  zoneAr: string;
  zoneEn: string;
  accentHex: string;
  activeWorkers: number;
  dailyMeals: number;
  activeCards: number;
  shiftWindowAr: string;
  shiftWindowEn: string;
  todayMeals: Array<{
    titleAr: string;
    titleEn: string;
    shiftAr: string;
    shiftEn: string;
    kcal: number;
  }>;
  alerts: Array<{
    titleAr: string;
    titleEn: string;
    timeAr: string;
    timeEn: string;
  }>;
}

export const PHASE1_FACTORIES: FactoryWorkspacePreview[] = [
  {
    id: 'tenant_factory_habe',
    nameAr: 'مصنع ها-بي للكيماويات (Ha-Be)',
    nameEn: 'Ha-Be Construction Chemicals Egypt',
    zoneAr: 'المنطقة الصناعية — مدينة بدر',
    zoneEn: 'Industrial Zone — Badr City',
    accentHex: '#3B123F',
    activeWorkers: 184,
    dailyMeals: 310,
    activeCards: 184,
    shiftWindowAr: '12:30 م – 02:00 م',
    shiftWindowEn: '12:30 PM – 02:00 PM',
    todayMeals: [
      {
        titleAr: 'وجبة الوردية الصباحية — مشويات وأرز مبهر',
        titleEn: 'Day Shift Tray — Grilled Chicken & Spiced Rice',
        shiftAr: 'الوردية الأولى',
        shiftEn: 'Shift 1',
        kcal: 790,
      },
      {
        titleAr: 'وجبة الوردية المسائية — كفتة مشوية وسلطة خضراء',
        titleEn: 'Evening Shift Tray — Grilled Kofta & Garden Salad',
        shiftAr: 'الوردية الثانية',
        shiftEn: 'Shift 2',
        kcal: 820,
      },
    ],
    alerts: [
      {
        titleAr: 'تم تأكيد وصول سيارة الإعاشة الحرارية لبوابة 2',
        titleEn: 'Insulated catering van confirmed at Gate 2',
        timeAr: 'منذ 15 دقيقة',
        timeEn: '15m ago',
      },
      {
        titleAr: 'تفعيل خصم 15% لحاملي كارت باسط بالمصنع نهاية الأسبوع',
        titleEn: '15% weekend BASIT Card offer activated for plant staff',
        timeAr: 'اليوم',
        timeEn: 'Today',
      },
    ],
  },
  {
    id: 'tenant_factory_alain',
    nameAr: 'مصنع العين للتعبئة والتجهيز',
    nameEn: 'Al-Ain Food Processing Plant',
    zoneAr: 'مدينة العاشر من رمضان',
    zoneEn: '10th of Ramadan City',
    accentHex: '#501C5A',
    activeWorkers: 240,
    dailyMeals: 460,
    activeCards: 235,
    shiftWindowAr: '01:00 م – 02:30 م',
    shiftWindowEn: '01:00 PM – 02:30 PM',
    todayMeals: [
      {
        titleAr: 'صينية تشغيل متكاملة — بروتين مشوي وخضار موسمي',
        titleEn: 'Operations Meal — Roast Protein & Seasonal Veg',
        shiftAr: 'الوردية الصباحية',
        shiftEn: 'Morning Shift',
        kcal: 760,
      },
      {
        titleAr: 'باقة الإعاشة الليلية — سندوتشات طازجة وعصير طبيعي',
        titleEn: 'Night Shift Pack — Fresh Wraps & Natural Juice',
        shiftAr: 'الوردية الليلية',
        shiftEn: 'Night Shift',
        kcal: 640,
      },
    ],
    alerts: [
      {
        titleAr: 'تحديث قائمة الأسبوع الجديد للمصنع متاح للمراجعة',
        titleEn: 'Next week canteen cycle menu ready for review',
        timeAr: 'اليوم',
        timeEn: 'Today',
      },
    ],
  },
];
