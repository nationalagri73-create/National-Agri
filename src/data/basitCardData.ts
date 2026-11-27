export const BASIT_CARD_OFFICIAL_IMG =
  '/assets/aistudio/image_d7d28844.png';

export const BASIT_CARD_THEME = {
  // Purples & Mauves:
  neonPurple: '#A855F7',
  brightViolet: '#852BEB',
  royalPurple: '#5A189A',
  darkRoyalPurple: '#4B148C',
  deepDarkPurple: '#240046',
  edgeMidnightPurple: '#1A052E',
  // Golds:
  luminousGold: '#FFE875',
  yellowGold: '#FACC15',
  primaryGold: '#EAB308',
  classicGold: '#D4AF37',
  bronzeGold: '#9A6B16',
  darkGold: '#78520E',
  // Whites:
  pureWhite: '#FFFFFF',
  creamWhite: '#FFFDF7',
} as const;

export interface EntertainmentPerk {
  id: string;
  category: 'parks' | 'cinema' | 'ice' | 'circus' | 'chalets' | 'hotels' | 'honeymoon' | 'malaysia' | 'umrah' | 'tactical' | 'wadi' | 'siwa';
  titleAr: string;
  titleEn: string;
  partnerNameAr: string;
  partnerNameEn: string;
  discountPct: number;
  originalPriceEGP: number;
  discountedPriceEGP: number;
  cashbackPct: number;
  validityAr: string;
  validityEn: string;
  bookingMethodAr: string;
  bookingMethodEn: string;
  termsAr: string[];
  termsEn: string[];
  image: string;
  badgeAr: string;
  badgeEn: string;
}

export interface SeasonalProduct {
  id: string;
  seasonKey: 'ramadan' | 'eid_adha' | 'dates' | 'eid_fitr' | 'mawlid';
  seasonTitleAr: string;
  seasonTitleEn: string;
  titleAr: string;
  titleEn: string;
  providerAr: string;
  providerEn: string;
  discountPct: 10;
  originalPriceEGP: number;
  discountedPriceEGP: number;
  cashbackPct: number;
  descriptionAr: string;
  descriptionEn: string;
  validityAr: string;
  validityEn: string;
  bookingMethodAr: string;
  bookingMethodEn: string;
  termsAr: string[];
  termsEn: string[];
  image: string;
  badgeAr: string;
  badgeEn: string;
}

export const ENTERTAINMENT_PERKS: EntertainmentPerk[] = [
  {
    id: 'ent_ice_skating',
    category: 'ice',
    titleAr: 'التزحلق على الجليد في حلبة سيتي ستارز',
    titleEn: 'City Stars Indoor Ice Skating Arena',
    partnerNameAr: 'حلبة التزلج المغلقة — سيتي ستارز مول',
    partnerNameEn: 'City Stars Indoor Ice Arena, Cairo',
    discountPct: 20,
    originalPriceEGP: 350,
    discountedPriceEGP: 280,
    cashbackPct: 5,
    validityAr: 'طوال العام حتى 31 ديسمبر 2026',
    validityEn: 'Year-round through Dec 31, 2026',
    bookingMethodAr: 'إبراز QR كارت باسط عند شباك تذاكر الحلبة بالدور الخامس',
    bookingMethodEn: 'Present your BASIT Card QR at the 5th floor arena ticket desk',
    termsAr: [
      'يشمل استئجار الزلاجات وخوذة الأمان لمدة 60 دقيقة',
      'ساري لحامل الكارت ومرافق واحد من الدرجة الأولى',
      'يتطلب الحجز المسبق في عطلات نهاية الأسبوع والأعياد',
    ],
    termsEn: [
      'Includes skate rental & safety helmet for 60 minutes',
      'Valid for cardholder + 1 first-degree companion',
      'Advance reservation recommended on weekends & holidays',
    ],
    image: '/assets/cards/citystars_ice_rink_1795807509578.jpg',
    badgeAr: 'خصم 20% حصري',
    badgeEn: 'Exclusive 20% Off',
  },
  {
    id: 'ent_tactical_arena',
    category: 'tactical',
    titleAr: 'معارك الليزر تاج وبينتبول والواقع الافتراضي',
    titleEn: 'Tactical Laser Tag, Paintball & VR Arena',
    partnerNameAr: 'أرينا المعارك التكتيكية — القاهرة والتجمع',
    partnerNameEn: 'Tactical Combat Arenas, Cairo & New Cairo',
    discountPct: 20,
    originalPriceEGP: 400,
    discountedPriceEGP: 320,
    cashbackPct: 5,
    validityAr: 'ساري يومياً طوال عام 2026',
    validityEn: 'Valid daily throughout 2026',
    bookingMethodAr: 'حجز الموعد عبر المنصة وإبراز كارت باسط عند الوصول للميدان',
    bookingMethodEn: 'Book match slot via portal & present card at venue entrance',
    termsAr: [
      'يشمل البدلات الواقية والسترات التكتيكية والنظارات والذخيرة',
      'متاح للفرق الجماعية وبطولات الموظفين للشركات',
      'الحد الأدنى للمباراة 4 لاعبين والحد الأقصى 20 لاعباً',
    ],
    termsEn: [
      'Includes tactical vests, protective gear, goggles & ammo',
      'Available for team matches & corporate league tournaments',
      'Minimum 4 players, maximum 20 players per match',
    ],
    image: '/assets/cards/paintball_tactical_arena_1795807510388.jpg',
    badgeAr: 'خصم 20% للفرق',
    badgeEn: '20% Team Discount',
  },
  {
    id: 'ent_siwa_lakes',
    category: 'siwa',
    titleAr: 'رحلات بحيرات الملح وعيون كليوباترا بواحة سيوة',
    titleEn: 'Siwa Oasis & Salt Lakes Eco-Expedition',
    partnerNameAr: 'سيوة إيكو تورز — بالتنسيق مع الوطنية اللوجستية',
    partnerNameEn: 'Siwa Eco Tours & Al-Wataniya Logistics',
    discountPct: 20,
    originalPriceEGP: 4500,
    discountedPriceEGP: 3600,
    cashbackPct: 5,
    validityAr: 'أفواج أسبوعية من الخميس إلى الأحد',
    validityEn: 'Weekly tours Thursday through Sunday',
    bookingMethodAr: 'حجز برنامج الرحلة عبر مكتب باسط سياحة مع إرفاق رقم الكارت',
    bookingMethodEn: 'Book tour package via BASIT Travel Desk quoting card number',
    termsAr: [
      'يشمل الانتقالات بسيارات مكيفة والإقامة الكاملة بفندق بيئي',
      'يشمل سفاري بحر الرمال العظيم والسباحة ببحيرة الملح',
      'خصم إضافي للأسر والمجموعات من موظفي المصانع والشركات',
    ],
    termsEn: [
      'Includes AC transport & full-board eco-lodge stay',
      'Includes Great Sand Sea 4x4 safari & Salt Lake float session',
      'Additional group perk for factory & corporate employees',
    ],
    image: '/assets/cards/siwa_salt_lakes_1795807510157.jpg',
    badgeAr: 'خصم 20% للمجموعات',
    badgeEn: '20% Eco Trip Perk',
  },
  {
    id: 'ent_malaysia_trip',
    category: 'malaysia',
    titleAr: 'رحلة ماليزيا المتكاملة 15 يوماً (كوالالمبور ولنكاوي وبينانج)',
    titleEn: '15-Day Malaysia Tour (KL, Langkawi & Penang)',
    partnerNameAr: 'الشركة الوطنية للسياحة والرحلات الدولية',
    partnerNameEn: 'Al-Wataniya International Travel',
    discountPct: 15,
    originalPriceEGP: 48000,
    discountedPriceEGP: 40800,
    cashbackPct: 5,
    validityAr: 'مواسم إجازات الصيف ومنتصف العام 2026',
    validityEn: 'Summer & Mid-Year Holiday Seasons 2026',
    bookingMethodAr: 'تقديم طلب الحجز مع تأكيد صلاحية كارت باسط للعضو وعائلته',
    bookingMethodEn: 'Submit booking request with verified BASIT Card for family',
    termsAr: [
      'يشمل الطيران الدولي الداخلي وفنادق 5 نجوم مع الإفطار',
      'يشمل الجولات السياحية للجزر والحدائق الاستوائية وتلفريك لنكاوي',
      'إمكانية تقسيط البرنامج للشركات والمصانع المتعاقدة',
    ],
    termsEn: [
      'Includes international/domestic flights & 5-star hotels with breakfast',
      'Includes island hopping, tropical reserves & Langkawi cable car',
      'Installment options available for contracted corporate staff',
    ],
    image: '/assets/cards/malaysia_luxury_tour_1795807525182.jpg',
    badgeAr: 'خصم 15% VIP',
    badgeEn: '15% VIP Tour',
  },
  {
    id: 'ent_umrah_spiritual',
    category: 'umrah',
    titleAr: 'رحلات العمرة المتميزة — فنادق الحرم المباشرة',
    titleEn: 'Premium Umrah Spiritual Journeys — Haram View',
    partnerNameAr: 'قطاع السياحة الدينية — الوطنية للخدمات',
    partnerNameEn: 'Religious Pilgrimage Services, Al-Wataniya',
    discountPct: 15,
    originalPriceEGP: 38000,
    discountedPriceEGP: 32300,
    cashbackPct: 5,
    validityAr: 'رحلات أسبوعية طوال رجب وشعبان ورمضان 1448 هـ',
    validityEn: 'Weekly departures Rajab, Shaban & Ramadan',
    bookingMethodAr: 'التسجيل في الفوج المفضل عبر الكارت مع تيسيرات السداد المؤسسي',
    bookingMethodEn: 'Register via card portal with corporate payroll deductions',
    termsAr: [
      'تأشيرة رسمية وتذاكر طيران مباشر إلى جدة أو المدينة',
      'فنادق 5 نجوم مطلة على ساحة الحرم مع بوفيه إفطار',
      'إشراف ديني وطبي متكامل طوال مدة الرحلة',
    ],
    termsEn: [
      'Official visa & direct flights to Jeddah or Medina',
      '5-star hotels facing the Holy Haram with breakfast buffet',
      'Full spiritual & medical guidance throughout the journey',
    ],
    image: '/assets/cards/umrah_journey_makkah_1795807593000.jpg',
    badgeAr: 'خصم 15% إيماني',
    badgeEn: '15% Umrah Perk',
  },
  {
    id: 'ent_amusement_parks',
    category: 'parks',
    titleAr: 'تذاكر مدن الملاهي والألعاب الترفيهية في مصر',
    titleEn: 'Egyptian Theme Parks & Family Coasters',
    partnerNameAr: 'تحالف مدن الألعاب الكبرى (دريم بارك · زد بارك · جروفي)',
    partnerNameEn: 'Grand Egyptian Theme Parks Alliance',
    discountPct: 20,
    originalPriceEGP: 300,
    discountedPriceEGP: 240,
    cashbackPct: 5,
    validityAr: 'ساري طوال أيام الأسبوع والإجازات',
    validityEn: 'Valid daily including public holidays',
    bookingMethodAr: 'إصدار تذكرة QR الرقمية عبر تطبيق باسط واستلام الإسورة عند البوابة',
    bookingMethodEn: 'Generate digital QR pass in BASIT app & redeem wristband at gate',
    termsAr: [
      'يشمل الدخول وتجربة جميع الألعاب المجانية والألعاب الكبرى',
      'تخفيض إضافي على وجبات الكانتين التابعة لباسط داخل المنتزه',
      'صالح للاستخدام الفردي أو العائلي حتى 5 تذاكر شهرياً',
    ],
    termsEn: [
      'Includes general admission & all major amusement rides',
      'Extra discount at BASIT-managed food kiosks inside parks',
      'Valid for employee and family up to 5 passes per month',
    ],
    image: '/assets/cards/egypt_amusement_park_1795807558666.jpg',
    badgeAr: 'خصم 20% عائلي',
    badgeEn: '20% Family Pass',
  },
  {
    id: 'ent_vip_cinema',
    category: 'cinema',
    titleAr: 'تذاكر السينمات الفاخرة VIP وقاعات العرض الكبرى',
    titleEn: 'Luxury VIP Cinema Theaters & Recliner Suites',
    partnerNameAr: 'شبكة سينمات فوكس ورينيسانس وجلاكسي في مصر',
    partnerNameEn: 'VOX, Renaissance & Galaxy Theaters Network',
    discountPct: 20,
    originalPriceEGP: 220,
    discountedPriceEGP: 176,
    cashbackPct: 5,
    validityAr: 'ساري لجميع حفلات الأفلام الجديدة طوال 2026',
    validityEn: 'Valid for all new movie screenings throughout 2026',
    bookingMethodAr: 'اختيار القاعة والمقعد وإدخال كود الكارت عند إتمام الحجز',
    bookingMethodEn: 'Select showtime & enter BASIT Card voucher code at checkout',
    termsAr: [
      'يشمل قاعات VIP المزودة بمقاعد مريحة متحركة وخدمة ضيافة',
      'ساري لجميع الأفلام العربية والأجنبية في صالات العرض',
      'يشمل خصم 15% إضافي على كومبو الفشار والمشروبات',
    ],
    termsEn: [
      'Includes VIP theaters with plush recliners & in-theater service',
      'Valid across all latest blockbusters & Arabic releases',
      'Includes 15% discount on concession popcorn & drinks',
    ],
    image: '/assets/cards/vip_cinema_theater_1795807558970.jpg',
    badgeAr: 'خصم 20% سينما',
    badgeEn: '20% VIP Cinema',
  },
  {
    id: 'ent_circus_show',
    category: 'circus',
    titleAr: 'السيرك القومي وعروض الأكروبات العالمية',
    titleEn: 'National Circus & International Acrobatic Shows',
    partnerNameAr: 'مسارح السيرك القومي المصري بالعجوزة والإسكندرية',
    partnerNameEn: 'Egyptian National Circus, Cairo & Alexandria',
    discountPct: 20,
    originalPriceEGP: 180,
    discountedPriceEGP: 144,
    cashbackPct: 5,
    validityAr: 'العروض المسائية طوال موسم 2026',
    validityEn: 'Evening performances through season 2026',
    bookingMethodAr: 'إبراز بطاقة باسط عند شباك الحجوزات أو الحجز المسبق عبر التطبيق',
    bookingMethodEn: 'Show BASIT Card at box office or pre-book via app',
    termsAr: [
      'مقاعد الدرجة الممتازة المواجهة للحلبة الرئيسية',
      'عروض عالمية من روسيا وإيطاليا ومصر وفقرات الحيوانات الأليفة',
      'تذاكر مجانية للأطفال دون سن 4 سنوات بصحبة الوالدين',
    ],
    termsEn: [
      'Prime premium seating facing the main performance ring',
      'International acrobatic troupes & festive stage spectacles',
      'Free admission for kids under 4 accompanied by parents',
    ],
    image: '/assets/cards/national_circus_show_1795807558595.jpg',
    badgeAr: 'خصم 20% مسرحي',
    badgeEn: '20% Circus Pass',
  },
  {
    id: 'ent_chalets_resorts',
    category: 'chalets',
    titleAr: 'شاليهات ومصايف الساحل الشمالي والعين السخنة ورأس سدر',
    titleEn: 'Coastal Chalets & Beach Resorts (Sahel & Sokhna)',
    partnerNameAr: 'منتجعات الوطنية الفندقية والشاليهات الشاطئية المعتمدة',
    partnerNameEn: 'Wataniya Certified Beach Chalets & Resorts',
    discountPct: 20,
    originalPriceEGP: 2500,
    discountedPriceEGP: 2000,
    cashbackPct: 5,
    validityAr: 'مواسم الصيف والعطلات الأسبوعية طوال عام 2026',
    validityEn: 'Summer peak and weekend getaways all year 2026',
    bookingMethodAr: 'اختيار القرية وموعد الإقامة عبر مكتب حجوزات باسط كارت',
    bookingMethodEn: 'Select village & dates via BASIT Card hospitality desk',
    termsAr: [
      'شاليهات مكيفة صف أول وثانٍ على البحر مجهزة بالكامل',
      'دخول مجاني لحمامات السباحة الخاصة وشواطئ القرية',
      'إمكانية إضافة باقة وجبات إعاشة باسط اليومية بأسعار مخفضة',
    ],
    termsEn: [
      'Fully equipped beachfront & sea-view air-conditioned chalets',
      'Free access to private compound beaches & infinity pools',
      'Option to bundle discounted BASIT daily shift catering meals',
    ],
    image: '/assets/cards/egypt_chalets_resort_1795807572631.jpg',
    badgeAr: 'خصم 20% مصايف',
    badgeEn: '20% Summer Stay',
  },
  {
    id: 'ent_honeymoon_packages',
    category: 'honeymoon',
    titleAr: 'باقات شهر العسل ورحلات العرسان الفاخرة',
    titleEn: 'Luxury Honeymoon Suites & Romance Escapes',
    partnerNameAr: 'فنادق ومنتجعات الجونة والغردقة وشرم الشيخ 5 نجوم',
    partnerNameEn: 'El Gouna, Hurghada & Sharm 5-Star Suites',
    discountPct: 20,
    originalPriceEGP: 12000,
    discountedPriceEGP: 9600,
    cashbackPct: 5,
    validityAr: 'ساري طوال العام للمتزوجين حديثاً من حاملي الكارت',
    validityEn: 'Year-round for verified newlywed cardholders',
    bookingMethodAr: 'حجز الجناح مع إرفاق بطاقة باسط لتفعيل ترقية الغرفة المجانية',
    bookingMethodEn: 'Book honeymoon suite with BASIT Card for complimentary upgrade',
    termsAr: [
      'يشمل الإقامة في جناح فاخر مع عشاء رومانسي على ضوء الشموع',
      'ترقية مجانية لإطلالة البحر مع كيكة زفاف وجلسة سبا للعروسين',
      'انتقالات خاصة من وإلى المطار بسيارة متميزة',
    ],
    termsEn: [
      'Includes luxury suite stay & romantic candlelit beach dinner',
      'Complimentary sea-view upgrade, wedding cake & couple spa',
      'Private VIP airport transfers to and from the resort',
    ],
    image: '/assets/cards/honeymoon_luxury_suite_1795807592967.jpg',
    badgeAr: 'خصم 20% عرسان',
    badgeEn: '20% Honeymoon',
  },
  {
    id: 'ent_new_valley_farms',
    category: 'wadi',
    titleAr: 'رحلات مزارع النخيل والطبيعة بالوادي الجديد والواحات',
    titleEn: 'New Valley Palm Groves & Nature Farm Retreats',
    partnerNameAr: 'مزارع نمر الوادي وجمعيات التنمية بالوادي الجديد',
    partnerNameEn: 'Nemr El-Wadi Agri-Estates & New Valley Reserves',
    discountPct: 20,
    originalPriceEGP: 3200,
    discountedPriceEGP: 2560,
    cashbackPct: 5,
    validityAr: 'رحلات شتوية وربيعية من أكتوبر حتى مايو',
    validityEn: 'Autumn, winter & spring tours October through May',
    bookingMethodAr: 'تأكيد الحجز عبر التطبيق واستلام تذاكر الفوج السياحي',
    bookingMethodEn: 'Confirm via app & receive group tour vouchers',
    termsAr: [
      'يشمل زيارة أضخم مزارع التمور المجدول وعيون المياه الكبريتية الدافئة',
      'إقامة ريفية متميزة ووجبات طازجة من خيرات مزارع الوادي',
      'شراء منتجات التمور والأعشاب الطبيعية بأسعار المزرعة المباشرة',
    ],
    termsEn: [
      'Visit mega Medjool date estates & natural thermal springs',
      'Eco-lodge stay with farm-to-table organic harvest meals',
      'Direct farm-gate wholesale prices for premium dates & herbs',
    ],
    image: '/assets/cards/new_valley_oasis_farm_1795807572429.jpg',
    badgeAr: 'خصم 20% مزارع',
    badgeEn: '20% Farm Tour',
  },
  {
    id: 'ent_resorts_hotels',
    category: 'hotels',
    titleAr: 'فنادق وقرى الغردقة وشرم ودهب ومارس علم',
    titleEn: 'Red Sea Luxury Hotels & Beach Villages',
    partnerNameAr: 'سلسلة فنادق البحر الأحمر الشريكة لباسط والوطنية',
    partnerNameEn: 'Red Sea Certified Hospitality Network',
    discountPct: 20,
    originalPriceEGP: 2800,
    discountedPriceEGP: 2240,
    cashbackPct: 5,
    validityAr: 'ساري طوال أيام السنة بدون رسوم إضافية',
    validityEn: 'Year-round access without peak surcharges',
    bookingMethodAr: 'إبراز الكارت الفعلي أو الإلكتروني عند تسجيل الوصول الفندقي',
    bookingMethodEn: 'Present digital/physical BASIT Card upon hotel check-in',
    termsAr: [
      'إقامة فندقية شاملة كلياً (وجبات وبوفيه ومشروبات وأكوا بارك)',
      'خصومات إضافية على رحلات الغطس والأنشطة البحرية',
      'أولوية الدخول المبكر وتسجيل المغادرة المتأخر لأعضاء باسط',
    ],
    termsEn: [
      'All-inclusive stay (meals, buffets, soft drinks & aqua park)',
      'Discount on scuba diving, boat trips & marine activities',
      'Priority early check-in & late check-out for BASIT members',
    ],
    image: '/assets/cards/egypt_chalets_resort_1795807572631.jpg',
    badgeAr: 'خصم 20% فندقي',
    badgeEn: '20% Hotel Stay',
  },
];

export const SEASONAL_FOOD_PRODUCTS: SeasonalProduct[] = [
  {
    id: 'seas_ramadan_box',
    seasonKey: 'ramadan',
    seasonTitleAr: 'شهر رمضان المبارك',
    seasonTitleEn: 'Holy Month of Ramadan',
    titleAr: 'كرتونة رمضان الغذائية الكبرى (الخير والبركة)',
    titleEn: 'Grand Ramadan Family & Charity Food Box',
    providerAr: 'الشركة الوطنية اللوجستية لتوريدات الغذاء',
    providerEn: 'Al-Wataniya Food Logistics',
    discountPct: 10,
    originalPriceEGP: 650,
    discountedPriceEGP: 585,
    cashbackPct: 3,
    descriptionAr:
      'كرتونة معيارية متكاملة تحتوي على 5 كجم أرز فاخر، 3 كجم سكر، 4 عبوات مكرونة، 1 لتر زيت ذرة نقي، 1 كجم سمن نباتي، صلصة طماطم، شاي، ولوبيا جافة.',
    descriptionEn:
      'Standardized essential grocery box with 5kg rice, 3kg sugar, 4 pasta packs, 1L pure oil, ghee, tomato puree, premium tea and dried legumes.',
    validityAr: 'ساري طوال شهري شعبان ورمضان المبارك',
    validityEn: 'Valid through Shaban and Ramadan',
    bookingMethodAr: 'طلب فوري عبر كارت باسط مع إمكانية التوصيل لمقر العمل أو المنزل',
    bookingMethodEn: 'Instant order via card with factory or home delivery',
    termsAr: [
      'خصم 10% حصري لحاملي كارت باسط المفعل',
      'حد أقصى 10 كراتين بالسعر المخفض لكل موظف شهرياً',
      'تغليف كرتوني مقوى نظيف ومناسب للتوزيع والخير',
    ],
    termsEn: [
      'Strict 10% discount for active BASIT Card members',
      'Maximum 10 boxes per employee per month at discounted rate',
      'Heavy-duty sealed packaging suitable for family & charity',
    ],
    image: '/assets/cards/ramadan_food_box_1795807525922.jpg',
    badgeAr: 'خصم 10% رمضاني',
    badgeEn: '10% Ramadan Perk',
  },
  {
    id: 'seas_eid_adha_meat',
    seasonKey: 'eid_adha',
    seasonTitleAr: 'عيد الأضحى المبارك',
    seasonTitleEn: 'Eid Al-Adha Season',
    titleAr: 'لحوم الأضاحي الطازجة من أفضل مزارع مصر',
    titleEn: 'Fresh Pasture Eid Al-Adha Meat Packs',
    providerAr: 'مزارع الإنتاج الحيواني بالوطنية اللوجستية',
    providerEn: 'Al-Wataniya Livestock Pasture Farms',
    discountPct: 10,
    originalPriceEGP: 3400,
    discountedPriceEGP: 3060,
    cashbackPct: 3,
    descriptionAr:
      'باقة لحوم طازجة 8 كجم (كندوز عجالي وبتلو بلدي) مقطعة ومغلفة بتفريغ الهواء حسب الشريعة وتحت إشراف بيطري كامل من مزارع التسمين الوطنية.',
    descriptionEn:
      'Fresh 8kg cuts of prime pasture beef & lamb, vacuum sealed under full veterinary supervision and halal standards.',
    validityAr: 'الحجز المسبق والتسليم طوال أيام ذي الحجة وعيد الأضحى',
    validityEn: 'Pre-order and delivery through Dhul-Hijjah & Eid days',
    bookingMethodAr: 'الحجز بكارت باسط وتحديد يوم ومكان الاستلام المبرد',
    bookingMethodEn: 'Book via BASIT Card & select refrigerated pickup slot',
    termsAr: [
      'لحوم بلدية 100% خالية من أي إضافات ومغلفة طبقاً للمواصفات القياسية',
      'خصم 10% معتمد لحاملي الكارت على سعر الكيلو المعلن',
      'إمكانية التوصيل بسيارات باسط المبردة لجميع المناطق الصناعية والمحافظات',
    ],
    termsEn: [
      '100% pasture-raised meat with zero additives & certified hygiene',
      'Verified 10% discount off standard retail rate for cardholders',
      'Insulated cold-chain delivery available across factory hubs',
    ],
    image: '/assets/cards/eid_meat_pasture_1795807542898.jpg',
    badgeAr: 'خصم 10% أضاحي',
    badgeEn: '10% Meat Perk',
  },
  {
    id: 'seas_medjool_dates',
    seasonKey: 'dates',
    seasonTitleAr: 'التمور والمنتجات المميزة',
    seasonTitleEn: 'Medjool Dates & Valley Harvest',
    titleAr: 'تمور المجدول الفاخرة ومنتجات نمر الوادي',
    titleEn: 'Luxury Medjool Dates & Nemr El-Wadi Harvest',
    providerAr: 'مزارع نمر الوادي للتنمية الزراعية والتعبئة',
    providerEn: 'Nemr El-Wadi Premium Date Estates',
    discountPct: 10,
    originalPriceEGP: 480,
    discountedPriceEGP: 432,
    cashbackPct: 3,
    descriptionAr:
      'علبة هدايا خشبية وتغليف فاخر يحتوي على 2 كجم تمور مجدول جامبو فاخرة طبيعية 100% من مزارع واحات الوادي الجديد الغنية بالمعادن.',
    descriptionEn:
      'Opulent wooden gift case with 2kg jumbo Grade-A Medjool dates harvested organically from the mineral-rich New Valley oases.',
    validityAr: 'متاح على مدار العام مع عروض خاصة لمواسم رمضان',
    validityEn: 'Available year-round with special Ramadan editions',
    bookingMethodAr: 'طلب الصندوق عبر التطبيق مع خصم مباشر على فاتورة الشراء',
    bookingMethodEn: 'Order via app with immediate 10% card discount applied',
    termsAr: [
      'تمور مجدول ملكية خالية من المبيدات ومفروزة آلياً بأعلى درجات الجودة',
      'خصم 10% لحاملي الكارت مع إمكانية التغليف الإهدائي للشركات',
      'خصومات خاصة لطلبات التوريد بالجملة للمطابخ المركزية والمصانع',
    ],
    termsEn: [
      'Organic royal Medjool dates electronically sorted for grade perfection',
      '10% discount with corporate custom luxury gift packaging option',
      'Bulk wholesale terms available for central kitchens & factories',
    ],
    image: '/assets/cards/medjool_dates_box_1795807542184.jpg',
    badgeAr: 'خصم 10% تمور',
    badgeEn: '10% Dates Perk',
  },
  {
    id: 'seas_eid_kahk_box',
    seasonKey: 'eid_fitr',
    seasonTitleAr: 'عيد الفطر المبارك',
    seasonTitleEn: 'Eid Al-Fitr Celebration',
    titleAr: 'علبة كحك العيد الفاخرة بالسمن البلدي الصافي',
    titleEn: 'Gourmet Eid Kahk & Fine Butter Pastries Box',
    providerAr: 'حلواني الوطنية المركزية ومطابخ باسط للحلويات',
    providerEn: 'Al-Wataniya Central Pastry Works',
    discountPct: 10,
    originalPriceEGP: 550,
    discountedPriceEGP: 495,
    cashbackPct: 3,
    descriptionAr:
      'علبة هدايا راقية 2 كجم تشكيلة مشكلة: كحك سادة، كحك عين جمل، غريبة بالسمن البلدي والمكسرات، بسكويت نشادر برتقال، وبيتي فور فاخر.',
    descriptionEn:
      'Luxury 2kg festive tin containing pure butter Kahk, walnut-filled Kahk, pistachio Ghorayeba, butter biscuits & French petit fours.',
    validityAr: 'طوال النصف الثاني من رمضان وحتى نهاية أيام عيد الفطر',
    validityEn: 'Second half of Ramadan through Eid Al-Fitr holidays',
    bookingMethodAr: 'الحجز بالرقم التأكيدي للكارت واستلام العلب من الفروع أو العمل',
    bookingMethodEn: 'Reserve via membership code and pick up at branch/factory',
    termsAr: [
      'مصنوع بسمن بلدي بقري طبيعي 100% ومغلف في علب معدنية محكمة',
      'خصم 10% صريح ومباشر على سعر البيع الرسمي للمستهلك',
      'تجهيز وتوزيع جماعي لموظفي المصانع والشركات المتعاقدة',
    ],
    termsEn: [
      'Baked with 100% natural butter in sealed protective gift tins',
      'Direct 10% discount off standard market retail pricing',
      'Bulk workplace employee distribution available on request',
    ],
    image: '/assets/cards/kahk_eid_box_1795807526631.jpg',
    badgeAr: 'خصم 10% كحك العيد',
    badgeEn: '10% Kahk Perk',
  },
  {
    id: 'seas_mawlid_box',
    seasonKey: 'mawlid',
    seasonTitleAr: 'المولد النبوي الشريف',
    seasonTitleEn: 'Mawlid Al-Nabawi Season',
    titleAr: 'كرتونة حلاوة المولد الفاخرة بالمكسرات الطبيعية',
    titleEn: 'Celebratory Mawlid Sweets & Nut Assortment Box',
    providerAr: 'الوطنية لحلويات المناسبات والمواسم',
    providerEn: 'Wataniya Seasonal Heritage Sweets',
    discountPct: 10,
    originalPriceEGP: 620,
    discountedPriceEGP: 558,
    cashbackPct: 3,
    descriptionAr:
      'علبة إهداء فاخرة 3 كجم تضم سمسمية، فولية، حمصية، فستقية، ملبن عين جمل وحبل مكسرات، نوجا باللوز، ودومية بالفول السوداني بجودة فائقة.',
    descriptionEn:
      'Traditional 3kg gift box with sesame brittle, peanut crunch, pistachio malban, honeyed walnut bars and almond nougat.',
    validityAr: 'ساري طوال شهر ربيع الأول وموسم المولد الشريف',
    validityEn: 'Valid through Rabi Al-Awwal & Mawlid season',
    bookingMethodAr: 'شراء فوري أو حجز مسبق مع الاستفادة من رصيد الكارت',
    bookingMethodEn: 'Instant purchase or pre-order with card benefit quota',
    termsAr: [
      'مكسرات محمصة طازجة وعسل طبيعي بدون مواد حافظة صناعية',
      'خصم 10% مضمون لحاملي كارت باسط المعتمدين',
      'إمكانية الاستفادة من رصيد الكاش باك التراكمي في الدفع',
    ],
    termsEn: [
      'Fresh roasted nuts and pure honey with zero artificial preservatives',
      'Guaranteed 10% discount for active BASIT Card members',
      'Accrued cashback balance can be applied toward checkout',
    ],
    image: '/assets/cards/mawlid_sweets_box_1795807543650.jpg',
    badgeAr: 'خصم 10% المولد',
    badgeEn: '10% Mawlid Perk',
  },
];

export const CARD_MEMBERSHIP_CONDITIONS_AR = [
  'كارت باسط هو كارت مزايا شخصي مخصص للعاملين لدى المصانع والشركات والجهات المتعاقدة مع منصة باسط والشركة الوطنية اللوجستية.',
  'يمنح الكارت المفعل خصومات تصل إلى 20% على خدمات الترفيه والسياحة والرحلات المعتمدة.',
  'يمنح الكارت خصماً محدداً بنسبة 10% على المنتجات الغذائية والمواسم (كراتين رمضان، لحوم الأضاحي، التمور، كحك العيد، وحلاوة المولد).',
  'يتم احتساب وتسجيل الكاش باك فورياً في محفظة العضو عند إتمام أي عملية حجز أو شراء عبر المنظومة.',
  'يلتزم العضو بإبراز رمز QR الرقمي أو تقديم رقم العضوية المعتمد عند الاستفادة من العروض لدى الشركاء.',
  'الحد الأقصى لعدد مرات الاستفادة يخضع لضوابط جهة العمل وشروط كل مزود خدمة معتمد.',
];

export const CARD_MEMBERSHIP_CONDITIONS_EN = [
  'BASIT CARD is an exclusive employee benefit card for staff of factories and organizations contracted with BASIT and Al-Wataniya Logistics.',
  'Active cards entitle holders to up to 20% discount on approved entertainment, travel, and tourism services.',
  'Active cards entitle holders to a verified 10% discount on seasonal harvest and food supply products (Ramadan boxes, Eid meat, dates, Kahk, Mawlid sweets).',
  'Cashback is calculated and recorded in the member wallet upon successful redemption with verified partners.',
  'Members must present their digital QR code or verified membership ID at partner outlets.',
  'Usage frequency and allowances are governed by corporate policy and individual service provider terms.',
];
