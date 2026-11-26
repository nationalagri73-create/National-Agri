export type HabeCategoryKey =
  | 'all'
  | 'breakfast'
  | 'lunch'
  | 'sahar_meals'
  | 'pastries'
  | 'koshary_pizza_crepe'
  | 'sandwiches'
  | 'drinks_snacks';

export interface HabeCatalogItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  priceEGP: number;
  category: Exclude<HabeCategoryKey, 'all'>;
}

export interface HabeEmployee {
  id: string;
  code: string;
  username: string;
  nameEn: string;
  nameAr: string;
  department: string;
  departmentAr: string;
  jobTitle: string;
  compNumber: string;
  sourceGroup: 'corporate_sheet' | 'plant_operations';
}

export const HABE_CATEGORY_LABELS: Record<HabeCategoryKey, string> = {
  all: 'الكل',
  breakfast: 'الإفطار (49 ج.م)',
  lunch: 'غداء اقتصادي (92 ج.م)',
  sahar_meals: 'وجبات السحر',
  pastries: 'مخبوزات (37 ج.م)',
  koshary_pizza_crepe: 'كشري وبيتزا وكريب',
  sandwiches: 'سندوتشات',
  drinks_snacks: 'مشروبات وسناكس',
};

export const HABE_PRICE_CATALOG: HabeCatalogItem[] = [
  // Breakfast (49 EGP)
  { id: 'cbk_01', code: 'CBK-01', nameAr: 'فول بالزيت والطحينة + جبنة بالخلطة + 1 بيضة مسلوقة + طرشي + 3 أرغفة خبز فاخر كبير', nameEn: 'Corporate Breakfast CBK-01', priceEGP: 49, category: 'breakfast' },
  { id: 'cbk_02', code: 'CBK-02', nameAr: 'فول بالزيت والطحينة + علبة لبنة بالزعتر والبقدونس + بورشن مربى + مخلل + 3 أرغفة خبز', nameEn: 'Corporate Breakfast CBK-02', priceEGP: 49, category: 'breakfast' },
  { id: 'cbk_03', code: 'CBK-03', nameAr: 'فول بالزيت والليمون + طاجن مسقعة + مخلل + 3 أرغفة خبز فاخر كبير', nameEn: 'Corporate Breakfast CBK-03', priceEGP: 49, category: 'breakfast' },
  { id: 'cbk_04', code: 'CBK-04', nameAr: 'فول برائحة الزبدة البلدي + طاجن بطاطس بوريه + مخلل + 3 أرغفة خبز فاخر كبير', nameEn: 'Corporate Breakfast CBK-04', priceEGP: 49, category: 'breakfast' },
  { id: 'cbk_05', code: 'CBK-05', nameAr: 'فول بالزيت والطحينة + جبنة فيتا + دومتي بلس 80 جم + بيضة مسلوقة + 3 أرغفة خبز', nameEn: 'Corporate Breakfast CBK-05', priceEGP: 49, category: 'breakfast' },

  // Economy Lunch (92 EGP)
  { id: 'fct_01', code: 'FCT-01', nameAr: 'فراخ روستو + أرز أبيض بالشعرية مفلفل + تورلي بالصلصة + خبز + مخلل + سلطة بدون طماطم', nameEn: 'Roast Chicken Meal', priceEGP: 92, category: 'lunch' },
  { id: 'fct_02', code: 'FCT-02', nameAr: 'داوود باشا بالصوص + أرز بالشعرية + بطاطس بصوص الداوود باشا + خيار + خبز + مخلل', nameEn: 'Dawood Pasha Meatballs', priceEGP: 92, category: 'lunch' },
  { id: 'fct_04', code: 'FCT-04', nameAr: '120 جم كفتة مشوية + أرز بسمتي أصفر + بطاطس بوم فريت + خيار + طحينة + خبز', nameEn: '120g Charcoal Kofta', priceEGP: 92, category: 'lunch' },
  { id: 'fct_05', code: 'FCT-05', nameAr: '120 جم شيش على الفحم + أرز بسمتي أصفر + بطاطس بوم فريت + خيار + طحينة + خبز', nameEn: '120g Charcoal Shish Tawook', priceEGP: 92, category: 'lunch' },
  { id: 'fct_06', code: 'FCT-06', nameAr: 'فراخ مشوية (ربع صدر أو ورك) + أرز بسمتي أصفر + بطاطس بوم فريت + طحينة + خبز', nameEn: 'Charcoal Quarter Chicken', priceEGP: 92, category: 'lunch' },

  // Sahar Meals
  { id: 'shr_01', code: 'SHR-01', nameAr: 'طاجن معكرونة ساخن بصوص الجبن الشيدر والكبدة البلدي والسجق', nameEn: 'Sahar Special Pasta Bake', priceEGP: 95, category: 'sahar_meals' },
  { id: 'shr_02', code: 'SHR-02', nameAr: 'مكس جريل السحر (كفتة الحاتي + شيش طاووق + محشي ورق عنب + أرز أصفر)', nameEn: 'Sahar Mixed Grill Feast', priceEGP: 125, category: 'sahar_meals' },
  { id: 'shr_03', code: 'SHR-03', nameAr: 'ستيك لحم بتلو مشوي بصوص المشروم الديمي جلاس + أرز أبيض وخضار سوتيه', nameEn: 'Sahar Executive Veal Steak', priceEGP: 145, category: 'sahar_meals' },

  // Pastries (37 EGP)
  { id: 'pst_01', code: 'PST-01', nameAr: 'باتيه كبير جبنة رومي بالخضار', nameEn: 'Large Puff Pate Roumy', priceEGP: 37, category: 'pastries' },
  { id: 'pst_02', code: 'PST-02', nameAr: 'باتيه كبير جبنة وزيتون', nameEn: 'Large Puff Pate Cheese Olives', priceEGP: 37, category: 'pastries' },
  { id: 'pst_03', code: 'PST-03', nameAr: 'كرواسون كبير سادة بالزبدة', nameEn: 'Large Plain Butter Croissant', priceEGP: 37, category: 'pastries' },
  { id: 'pst_04', code: 'PST-04', nameAr: 'كرواسون كبير جبنة رومي', nameEn: 'Large Roumy Cheese Croissant', priceEGP: 37, category: 'pastries' },
  { id: 'pst_05', code: 'PST-05', nameAr: 'رول باتيه بالجبنة والخضار', nameEn: 'Cheese & Vegetable Roll Pastry', priceEGP: 37, category: 'pastries' },

  // Koshary, Pizza, Crepe
  { id: 'ksh_01', code: 'K-01', nameAr: 'كشري مصري ممتاز (حجم وسط)', nameEn: 'Egyptian Koshary Medium', priceEGP: 40, category: 'koshary_pizza_crepe' },
  { id: 'ksh_02', code: 'K-02', nameAr: 'كشري مصري ممتاز (حجم كبير)', nameEn: 'Egyptian Koshary Large', priceEGP: 48, category: 'koshary_pizza_crepe' },
  { id: 'ksh_03', code: 'K-03', nameAr: 'كشري مصري ممتاز (حجم عائلي / جامبو)', nameEn: 'Egyptian Koshary Jumbo', priceEGP: 58, category: 'koshary_pizza_crepe' },
  { id: 'sl_01', code: 'SL-01', nameAr: '2 قطعة بيتزا (سلايز) مارجريتا', nameEn: '2 Margherita Pizza Slices', priceEGP: 58, category: 'koshary_pizza_crepe' },
  { id: 'sl_02', code: 'SL-02', nameAr: '2 قطعة بيتزا (سلايز) لحمة مفرومة', nameEn: '2 Minced Beef Pizza Slices', priceEGP: 58, category: 'koshary_pizza_crepe' },
  { id: 'sl_03', code: 'SL-03', nameAr: '2 قطعة بيتزا (سلايز) فراخ', nameEn: '2 Chicken Pizza Slices', priceEGP: 58, category: 'koshary_pizza_crepe' },
  { id: 'pz_or_full', code: 'PZ-OR', nameAr: 'بيتزا شرقي كاملة (فطير شرقي محشو كامل)', nameEn: 'Full Oriental Stuffed Pizza', priceEGP: 180, category: 'koshary_pizza_crepe' },
  { id: 'pz_it_full', code: 'PZ-IT', nameAr: 'بيتزا إيطالي كاملة (Whole Italian Pizza)', nameEn: 'Full Italian Stone-Baked Pizza', priceEGP: 170, category: 'koshary_pizza_crepe' },
  { id: 'crp_01', code: 'CRP-01', nameAr: 'كريب طازج ساخن (قطعة واحدة كاملة)', nameEn: 'Fresh Savory Crepe', priceEGP: 80, category: 'koshary_pizza_crepe' },

  // Sandwiches
  { id: 'snd_01', code: 'SND-01', nameAr: 'سندوتش فول', nameEn: 'Foul Sandwich', priceEGP: 12, category: 'sandwiches' },
  { id: 'snd_02', code: 'SND-02', nameAr: 'سندوتش طعمية', nameEn: 'Taameya Sandwich', priceEGP: 12, category: 'sandwiches' },
  { id: 'snd_03', code: 'SND-03', nameAr: 'سندوتش جبنة', nameEn: 'White Cheese Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_04', code: 'SND-04', nameAr: 'سندوتش جبنة بالخلطة', nameEn: 'Spiced Cheese Mix Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_05', code: 'SND-05', nameAr: 'سندوتش جبنة كيري (فينو)', nameEn: 'Kiri Cheese Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_06', code: 'SND-06', nameAr: 'سندوتش لانشون حلواني (فينو)', nameEn: 'Beef Luncheon Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_07', code: 'SND-07', nameAr: 'سندوتش جبنة رومي (فينو)', nameEn: 'Roumy Aged Cheese Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_08', code: 'SND-08', nameAr: 'سندوتش حلاوة بالقشطة (فينو)', nameEn: 'Halawa & Cream Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_09', code: 'SND-09', nameAr: 'سندوتش بطاطس مهروسة', nameEn: 'Mashed Potato Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_10', code: 'SND-10', nameAr: 'سندوتش بطاطس صوابع', nameEn: 'French Fries Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_11', code: 'SND-11', nameAr: 'سندوتش بطاطس جمبري', nameEn: 'Spiced Shrimp-Style Potato Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_12', code: 'SND-12', nameAr: 'سندوتش بابا غنوج', nameEn: 'Smoked Baba Ghanoush Sandwich', priceEGP: 15, category: 'sandwiches' },
  { id: 'snd_13', code: 'SND-13', nameAr: 'سندوتش تونة بالمايونيز والفلفل (سبايسي)', nameEn: 'Spicy Tuna Mayo Sandwich', priceEGP: 20, category: 'sandwiches' },
  { id: 'snd_14', code: 'SND-14', nameAr: 'سندوتش برجر', nameEn: 'Beef Burger Sandwich', priceEGP: 45, category: 'sandwiches' },
  { id: 'snd_15', code: 'SND-15', nameAr: 'كلوب ساندوتش', nameEn: 'Club Sandwich', priceEGP: 75, category: 'sandwiches' },
  { id: 'snd_16', code: 'SND-16', nameAr: 'تشيز ميكس ساندوتش', nameEn: 'Four-Cheese Mix Sandwich', priceEGP: 45, category: 'sandwiches' },
  { id: 'snd_17', code: 'SND-17', nameAr: 'سندوتش كفتة مشوية', nameEn: 'Grilled Kofta Sandwich', priceEGP: 55, category: 'sandwiches' },
  { id: 'snd_18', code: 'SND-18', nameAr: 'سندوتش شيش مشوي', nameEn: 'Grilled Shish Tawook Sandwich', priceEGP: 55, category: 'sandwiches' },
  { id: 'snd_19', code: 'SND-19', nameAr: 'سندوتش بانيه', nameEn: 'Crispy Chicken Pane Sandwich', priceEGP: 65, category: 'sandwiches' },

  // Drinks & Snacks
  { id: 'drk_01', code: 'DRK-01', nameAr: 'بيبسي (Pepsi)', nameEn: 'Pepsi Can', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'drk_02', code: 'DRK-02', nameAr: 'ميرندا برتقال (Mirinda)', nameEn: 'Mirinda Orange', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'drk_03', code: 'DRK-03', nameAr: 'سفن أب (7UP)', nameEn: '7UP Can', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'drk_04', code: 'DRK-04', nameAr: 'ماونتن ديو (Mountain Dew)', nameEn: 'Mountain Dew', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'drk_05', code: 'DRK-05', nameAr: 'بيبسي الهضبة (Pepsi El Hadaba)', nameEn: 'Pepsi El Hadaba', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'drk_06', code: 'DRK-06', nameAr: 'شويبس (Schweppes)', nameEn: 'Schweppes Can', priceEGP: 17, category: 'drinks_snacks' },
  { id: 'drk_07', code: 'DRK-07', nameAr: 'فيروز شعير وفاكهة (Fayrouz)', nameEn: 'Fayrouz Malt Beverage', priceEGP: 20, category: 'drinks_snacks' },
  { id: 'drk_08', code: 'DRK-08', nameAr: 'بريل شعير كلاسيك (Birell)', nameEn: 'Birell Classic Malt', priceEGP: 20, category: 'drinks_snacks' },
  { id: 'drk_09', code: 'DRK-09', nameAr: 'ريد بول طاقة (Red Bull)', nameEn: 'Red Bull Energy', priceEGP: 20, category: 'drinks_snacks' },
  { id: 'drk_10', code: 'DRK-10', nameAr: 'عصير جهينة تفاح', nameEn: 'Juhayna Apple Juice', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'drk_11', code: 'DRK-11', nameAr: 'عصير جهينة مانجو', nameEn: 'Juhayna Mango Juice', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'drk_12', code: 'DRK-12', nameAr: 'عصير جهينة برتقال', nameEn: 'Juhayna Orange Juice', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'drk_13', code: 'DRK-13', nameAr: 'عصير جهينة كوكتيل', nameEn: 'Juhayna Fruit Cocktail', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'chp_01', code: 'CHP-01', nameAr: 'شيبسي بالملح', nameEn: 'Chipsy Salted', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'chp_02', code: 'CHP-02', nameAr: 'شيبسي بالجبنة', nameEn: 'Chipsy Cheese', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'chp_03', code: 'CHP-03', nameAr: 'تايجر شيبس (ملح)', nameEn: 'Tiger Chips Salted', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'chp_04', code: 'CHP-04', nameAr: 'تايجر شيبس (جبنة)', nameEn: 'Tiger Chips Cheese', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'chp_05', code: 'CHP-05', nameAr: 'دوريتوس ناتشو', nameEn: 'Doritos Nacho Cheese', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'chp_06', code: 'CHP-06', nameAr: 'دوريتوس حار / سويت تشيلي', nameEn: 'Doritos Sweet Chili', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'chp_07', code: 'CHP-07', nameAr: 'شيتوس مقرمش (Cheetos)', nameEn: 'Cheetos Crunchy', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'swt_01', code: 'SWT-01', nameAr: 'شوكولاتة جالكسي (Galaxy)', nameEn: 'Galaxy Milk Chocolate', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'swt_02', code: 'SWT-02', nameAr: 'شوكولاتة كادبوري / ديلايت', nameEn: 'Cadbury Dairy Milk', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'swt_03', code: 'SWT-03', nameAr: 'فلوتس 2 صابع شوكولاتة', nameEn: 'Flutes 2-Finger Chocolate', priceEGP: 15, category: 'drinks_snacks' },
  { id: 'swt_04', code: 'SWT-04', nameAr: 'شوكولاتة مورو (Moro)', nameEn: 'Cadbury Moro Bar', priceEGP: 12, category: 'drinks_snacks' },
  { id: 'swt_05', code: 'SWT-05', nameAr: 'شوكولاتة ماندولين (Mandolin)', nameEn: 'Mandolin Chocolate', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_06', code: 'SWT-06', nameAr: 'ماندولين ويفر (Mandolin Wafer)', nameEn: 'Mandolin Mini Wafer', priceEGP: 5, category: 'drinks_snacks' },
  { id: 'swt_07', code: 'SWT-07', nameAr: 'بسكويت هالي (Hally)', nameEn: 'Hally Biscuit Pack', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_08', code: 'SWT-08', nameAr: 'دايجستف شوكولاتة', nameEn: 'Digestive Chocolate Biscuit', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_09', code: 'SWT-09', nameAr: 'بسكويت أوريو (Oreo)', nameEn: 'Oreo Sandwich Cookies', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_10', code: 'SWT-10', nameAr: 'كيك هوهوز (HoHos)', nameEn: 'HoHos Rolled Chocolate Cake', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_11', code: 'SWT-11', nameAr: 'بسكويت بيمبو (Bimbo)', nameEn: 'Bimbo Chocolate Biscuit', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_12', code: 'SWT-12', nameAr: 'دريو / توبو براوني كيك', nameEn: 'Drio / Topo Brownie Cake', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_13', code: 'SWT-13', nameAr: 'لمبادا ويفر (Lambada)', nameEn: 'Lambada Crispy Wafer', priceEGP: 10, category: 'drinks_snacks' },
  { id: 'swt_14', code: 'SWT-14', nameAr: 'جيمبو شوكو ميكس / زمزمية بسكويت', nameEn: 'Jumbo Choco Mix', priceEGP: 10, category: 'drinks_snacks' },
];

const HABE_CORPORATE_SHEET_30: HabeEmployee[] = [
  { id: 'hb_001', code: 'HB-001', username: '@adel.bichara', nameEn: 'Adel Bichara', nameAr: 'عادل بنيامين ديمتري بشارة', department: 'Higher Management', departmentAr: 'الإدارة العليا', jobTitle: 'Managing Partner', compNumber: '01103664555', sourceGroup: 'corporate_sheet' },
  { id: 'hb_002', code: 'HB-002', username: '@noha.ghanem', nameEn: 'Noha Ghanem', nameAr: 'نهى غانم', department: 'Higher Management', departmentAr: 'الإدارة العليا', jobTitle: 'General Manager', compNumber: '01287162556', sourceGroup: 'corporate_sheet' },
  { id: 'hb_003', code: 'HB-003', username: '@hatem.fattah', nameEn: 'Hatem Abou Bakr Mohamed Abdel Fattah', nameAr: 'حاتم أبو بكر محمد عبد الفتاح', department: 'Finance', departmentAr: 'الإدارة المالية', jobTitle: 'Financial Manager', compNumber: '01279081113', sourceGroup: 'corporate_sheet' },
  { id: 'hb_004', code: 'HB-004', username: '@haytham.ibrahem', nameEn: 'Haytham Hosny Abbas Ibrahem', nameAr: 'هيثم حسني عباس إبراهيم', department: 'Finance', departmentAr: 'الإدارة المالية', jobTitle: 'Accounting Manager', compNumber: '01287162565', sourceGroup: 'corporate_sheet' },
  { id: 'hb_005', code: 'HB-005', username: '@hossam.ahmed', nameEn: 'Hossam Mohamed Ahmed Mohamed', nameAr: 'حسام محمد أحمد محمد', department: 'Finance', departmentAr: 'الإدارة المالية', jobTitle: 'Accountant', compNumber: '01204168664', sourceGroup: 'corporate_sheet' },
  { id: 'hb_006', code: 'HB-006', username: '@mohamed.tohamy', nameEn: 'Mohamed Hassan Mohamed Tohamy', nameAr: 'محمد حسن محمد تهامي', department: 'Finance', departmentAr: 'الإدارة المالية', jobTitle: 'Accountant', compNumber: '01279109994', sourceGroup: 'corporate_sheet' },
  { id: 'hb_007', code: 'HB-007', username: '@abdelrahman.hatem', nameEn: 'Abdel Rahman Hatem Mohamed Mohamed', nameAr: 'عبد الرحمن حاتم محمد محمد', department: 'Finance', departmentAr: 'الإدارة المالية', jobTitle: 'Treasurer', compNumber: '01287162575', sourceGroup: 'corporate_sheet' },
  { id: 'hb_008', code: 'HB-008', username: '@mohamed.refaat', nameEn: 'Mohamed Refaat sayed ahmed', nameAr: 'محمد رفعت سيد أحمد', department: 'Finance', departmentAr: 'الإدارة المالية', jobTitle: 'Accountant', compNumber: '01273334536', sourceGroup: 'corporate_sheet' },
  { id: 'hb_009', code: 'HB-009', username: '@abdelrahman.morsy', nameEn: 'Abdel Rahman Mohamed El Morsy', nameAr: 'عبد الرحمن محمد المرسي', department: 'Finance', departmentAr: 'الإدارة المالية', jobTitle: 'Accountant', compNumber: '01149882219', sourceGroup: 'corporate_sheet' },
  { id: 'hb_010', code: 'HB-010', username: '@ahmed.zakaria', nameEn: 'Ahmed Zakaria Gamal', nameAr: 'أحمد زكريا جمال', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Area Sales Manager', compNumber: '01272775463', sourceGroup: 'corporate_sheet' },
  { id: 'hb_011', code: 'HB-011', username: '@mostafa.atef', nameEn: 'Mostafa Atef Abdel Fattah', nameAr: 'مصطفى عاطف عبد الفتاح', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Area sales manager', compNumber: '01102452225', sourceGroup: 'corporate_sheet' },
  { id: 'hb_012', code: 'HB-012', username: '@ahmed.badeaa', nameEn: 'Ahmed Saied Abdelbadeaa', nameAr: 'أحمد سعيد عبد البديع', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Area sales manager', compNumber: '01155548766', sourceGroup: 'corporate_sheet' },
  { id: 'hb_013', code: 'HB-013', username: '@nadine.mostafa', nameEn: 'Nadine Mohamed Mostafa', nameAr: 'نادين محمد مصطفى', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Sales Coordinator', compNumber: '01050130494', sourceGroup: 'corporate_sheet' },
  { id: 'hb_014', code: 'HB-014', username: '@mariam.mohamed', nameEn: 'Mariam Mohamed', nameAr: 'مريم محمد', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Marketing Specialist', compNumber: '01102382226', sourceGroup: 'corporate_sheet' },
  { id: 'hb_015', code: 'HB-015', username: '@ahmed.saeed', nameEn: 'Ahmed Saeed Ahmed', nameAr: 'أحمد سعيد أحمد', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Area sales manager', compNumber: '01288074334', sourceGroup: 'corporate_sheet' },
  { id: 'hb_016', code: 'HB-016', username: '@antoine.monier', nameEn: 'Antoine Sameh Monier', nameAr: 'أنطوان سامح منير', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Area Sales Manager', compNumber: '01228572578', sourceGroup: 'corporate_sheet' },
  { id: 'hb_017', code: 'HB-017', username: '@diana.rizkallah', nameEn: 'Diana Bassem Berty Rizkallah', nameAr: 'ديانا باسم برتي رزق الله', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Business development manager', compNumber: '01272772590', sourceGroup: 'corporate_sheet' },
  { id: 'hb_018', code: 'HB-018', username: '@mohamed.ashraf', nameEn: 'Mohamed Ashraf', nameAr: 'محمد أشرف', department: 'Sales', departmentAr: 'المبيعات', jobTitle: 'Area Sales Manager', compNumber: '01159488000', sourceGroup: 'corporate_sheet' },
  { id: 'hb_019', code: 'HB-019', username: '@monica.aziz', nameEn: 'Monica Emad Aziz', nameAr: 'مونيكا عماد عزيز', department: 'Purchases', departmentAr: 'المشتريات وسلاسل الإمداد', jobTitle: 'Senior Supply Chain Leader', compNumber: '01204168082', sourceGroup: 'corporate_sheet' },
  { id: 'hb_020', code: 'HB-020', username: '@ayman.fanous', nameEn: 'Ayman Fathy Azmy Fanous', nameAr: 'أيمن فتحي عزمي فانوس', department: 'Purchases', departmentAr: 'المشتريات وسلاسل الإمداد', jobTitle: 'Senior Procurement Leader', compNumber: '01103751744', sourceGroup: 'corporate_sheet' },
  { id: 'hb_021', code: 'HB-021', username: '@may.kamal', nameEn: 'May Kamal', nameAr: 'مي كمال', department: 'Purchases', departmentAr: 'المشتريات وسلاسل الإمداد', jobTitle: 'Supply Chain Leader', compNumber: '01019993429', sourceGroup: 'corporate_sheet' },
  { id: 'hb_022', code: 'HB-022', username: '@rayan.kamal', nameEn: 'Rayan Arafat Kamal', nameAr: 'ريان عرفات كمال', department: 'Q.C', departmentAr: 'ضبط الجودة والمعمل', jobTitle: 'Q.C&Lab Manager', compNumber: '01103042996', sourceGroup: 'corporate_sheet' },
  { id: 'hb_023', code: 'HB-023', username: '@khaled.ela', nameEn: 'khaled Mostafa Ela', nameAr: 'خالد مصطفى علاء', department: 'Q.C', departmentAr: 'ضبط الجودة والمعمل', jobTitle: 'Technical Manager', compNumber: '01287162528', sourceGroup: 'corporate_sheet' },
  { id: 'hb_024', code: 'HB-024', username: '@ahmed.adly', nameEn: 'Ahmed Adly Fouad Mohamed', nameAr: 'أحمد عدلي فؤاد محمد', department: 'Administrative Affairs', departmentAr: 'الشئون الإدارية والموارد البشرية', jobTitle: 'HR Manager', compNumber: '01274799290', sourceGroup: 'corporate_sheet' },
  { id: 'hb_025', code: 'HB-025', username: '@ahmed.wahed', nameEn: 'Ahmed Wahed Mahmoud', nameAr: 'أحمد وحيد محمود', department: 'Administrative Affairs', departmentAr: 'الشئون الإدارية والموارد البشرية', jobTitle: 'HR Specialist', compNumber: '01103611414', sourceGroup: 'corporate_sheet' },
  { id: 'hb_026', code: 'HB-026', username: '@rania.rageb', nameEn: 'Rania Rageb', nameAr: 'رانيا رجب', department: 'Administrative Affairs', departmentAr: 'الشئون الإدارية والموارد البشرية', jobTitle: 'Talent Acquisition', compNumber: '01103042995', sourceGroup: 'corporate_sheet' },
  { id: 'hb_027', code: 'HB-027', username: '@abdelhamed.shehata', nameEn: 'Abdelhamed Mohamed Shehata', nameAr: 'عبد الحميد محمد شحاتة', department: 'storehouse', departmentAr: 'المخازن', jobTitle: 'Warehouse Manager', compNumber: '01288073398', sourceGroup: 'corporate_sheet' },
  { id: 'hb_028', code: 'HB-028', username: '@amr.elsayed', nameEn: 'Amr Elsayed Sayed', nameAr: 'عمرو السيد سيد', department: 'Collections Department', departmentAr: 'إدارة التحصيل', jobTitle: 'Collector', compNumber: '01103673600', sourceGroup: 'corporate_sheet' },
  { id: 'hb_029', code: 'HB-029', username: '@salah.omar', nameEn: 'Salah Eldin Omar', nameAr: 'صلاح الدين عمر', department: 'Collections Department', departmentAr: 'إدارة التحصيل', jobTitle: 'Collector', compNumber: '01019993647', sourceGroup: 'corporate_sheet' },
  { id: 'hb_030', code: 'HB-030', username: '@gamal.abdelnasser', nameEn: 'Gamal Abdel Nasser Abdel Hamid', nameAr: 'جمال عبد الناصر عبد الحميد', department: 'Collections Department', departmentAr: 'إدارة التحصيل', jobTitle: 'Collection Manager', compNumber: '01019993576', sourceGroup: 'corporate_sheet' },
];

const PLANT_SEED_TOP_29 = [
  { code: 'GER-001', nameAr: 'م/ سامح قاسم الشناوي', departmentAr: 'إدارة العمليات والتشغيل', shift: 'وردية صباحية', jobTitle: 'مدير الموقع والموارد البشرية', phone: '01198765432' },
  { code: 'GER-002', nameAr: 'م/ تامر عبد العال مبروك', departmentAr: 'قسم الأفران الدوارة والكلنكر', shift: 'وردية صباحية', jobTitle: 'رئيس مهندسي الأفران', phone: '01011223341' },
  { code: 'GER-003', nameAr: 'أحمد صابر الدسوقي', departmentAr: 'قسم الأفران الدوارة والكلنكر', shift: 'وردية صباحية', jobTitle: 'مشرف تشغيل الفرن رقم 1', phone: '01011223342' },
  { code: 'GER-004', nameAr: 'محمود جاد الكريم علي', departmentAr: 'قسم الأفران الدوارة والكلنكر', shift: 'وردية مسائية', jobTitle: 'فني تحكم حراري', phone: '01011223343' },
  { code: 'GER-005', nameAr: 'رمضان حسني البشبيشي', departmentAr: 'قسم الأفران الدوارة والكلنكر', shift: 'وردية ليلية', jobTitle: 'مشغل رافعة الكلنكر', phone: '01011223344' },
  { code: 'GER-006', nameAr: 'علاء إسماعيل الطوخي', departmentAr: 'قسم الأفران الدوارة والكلنكر', shift: 'وردية صباحية', jobTitle: 'فني صيانة حراريات', phone: '01011223345' },
  { id: 'GER-007', nameAr: 'سيد عبد الفتاح مرسي', departmentAr: 'قسم الأفران الدوارة والكلنكر', shift: 'وردية مسائية', jobTitle: 'مساعد مشغل أفران', phone: '01011223346' },
  { id: 'GER-008', nameAr: 'إبراهيم شوقي رضوان', departmentAr: 'قسم طواحين الأسمنت', shift: 'وردية صباحية', jobTitle: 'مشرف طواحين الخام', phone: '01011223347' },
  { id: 'GER-009', nameAr: 'وليد عبد الوهاب رشاد', departmentAr: 'قسم طواحين الأسمنت', shift: 'وردية مسائية', jobTitle: 'فني طواحين أسمنت بورتلاندي', phone: '01011223348' },
  { id: 'GER-010', nameAr: 'حسن متولي الشرقاوي', departmentAr: 'قسم طواحين الأسمنت', shift: 'وردية ليلية', jobTitle: 'مشغل سيور نقل الحجر الجيري', phone: '01011223349' },
];

const FIRST_NAMES = ['محمود', 'علي', 'حسين', 'سعيد', 'مصطفى', 'شريف', 'كريم', 'ياسين', 'علاء', 'عاطف', 'ضياء', 'هيثم', 'أيمن', 'صلاح'];
const MID_NAMES = ['عبد الرحمن', 'فتحي', 'إسماعيل', 'عثمان', 'البدري', 'رمضان', 'شعبان', 'السيد', 'جلال', 'فاروق', 'ممدوح'];
const FAMILIES = ['المصري', 'الهلالي', 'الشناوي', 'السويسي', 'المنوفي', 'الصعيدي', 'الشرقاوي', 'البحيري', 'الدمياطي', 'الديب'];
const PLANT_DEPTS = [
  'خط الإنتاج الرئيسي 1',
  'قسم الأفران وتجهيز الخام',
  'قطاع المحاجر وسحق الحجر',
  'طواحين الأسمنت والسيلوهات',
  'الشحن والنقل الداخلي',
  'الخدمات المعاونة والمرافق',
];
const PLANT_SHIFTS = ['وردية صباحية', 'وردية مسائية', 'وردية ليلية'];

const PLANT_56_OPS: HabeEmployee[] = Array.from({ length: 56 }, (_, i) => {
  if (i < PLANT_SEED_TOP_29.length) {
    const g = PLANT_SEED_TOP_29[i];
    const empCode = g.code ?? g.id ?? `GER-${String(i + 1).padStart(3, '0')}`;
    return {
      id: `hb_ops_${i + 31}`,
      code: `HB-${String(i + 31).padStart(3, '0')}`,
      username: `@${empCode.toLowerCase()}`,
      nameEn: `${empCode} Staff (${g.jobTitle})`,
      nameAr: g.nameAr,
      department: 'Plant Operations & Production',
      departmentAr: g.departmentAr,
      jobTitle: `${g.jobTitle} (${g.shift})`,
      compNumber: g.phone,
      sourceGroup: 'plant_operations',
    };
  }
  const idx = i - PLANT_SEED_TOP_29.length;
  const num = idx + 30;
  const gerCode = `GER-${String(num).padStart(3, '0')}`;
  const dept = PLANT_DEPTS[idx % PLANT_DEPTS.length];
  const shift = PLANT_SHIFTS[idx % PLANT_SHIFTS.length];
  const jobTitle = `فني تشغيل ${dept.split(' ')[0]}`;
  return {
    id: `hb_ops_${i + 31}`,
    code: `HB-${String(i + 31).padStart(3, '0')}`,
    username: `@${gerCode.toLowerCase()}`,
    nameEn: `${gerCode} Staff`,
    nameAr: `${FIRST_NAMES[idx % FIRST_NAMES.length]} ${MID_NAMES[(idx * 3) % MID_NAMES.length]} ${FAMILIES[(idx * 7) % FAMILIES.length]}`,
    department: 'Plant Operations & Production',
    departmentAr: dept,
    jobTitle: `${jobTitle} (${shift})`,
    compNumber: `010112233${70 + (idx % 30)}`,
    sourceGroup: 'plant_operations',
  };
});

export const HABE_EGYPT_EMPLOYEES: HabeEmployee[] = [
  ...HABE_CORPORATE_SHEET_30,
  ...PLANT_56_OPS,
];

export const LOGISTICS_COMPLEMENTARY_SERVICES = [
  {
    key: 'weddings_occasions' as const,
    titleAr: 'الأفراح والمناسبات الكبرى',
    descAr: 'بوفيهات وتجهيزات كاملة لقاعات الأفراح والاحتفالات العائلية والرسمية.',
  },
  {
    key: 'conferences_events' as const,
    titleAr: 'المؤتمرات والفعاليات المؤسسية',
    descAr: 'تجهيز استراحات القهوة والغداء للمؤتمرات والمعارض الدولية.',
  },
  {
    key: 'open_buffets' as const,
    titleAr: 'البوفيهات المفتوحة (Open Buffets)',
    descAr: 'توريد وإدارة بوفيهات مفتوحة بمعايير سلامة الغذاء HACCP.',
  },
  {
    key: 'hospitality' as const,
    titleAr: 'خدمات الضيافة والبروتوكول',
    descAr: 'فريق ضيافة محترف لكبار الشخصيات والوفود والمجالس الإدارية.',
  },
  {
    key: 'central_kitchens_setup' as const,
    titleAr: 'تأسيس وتشغيل المطابخ المركزية',
    descAr: 'تخطيط هندسي وتوريد معدات وتشغيل مطابخ المصانع والشركات.',
  },
  {
    key: 'institutional_events_catering' as const,
    titleAr: 'إعاشة المؤسسات والورديات الصناعية',
    descAr: 'توريد وجبات يومية مجدولة للمناطق الصناعية والمستشفيات والجامعات.',
  },
  {
    key: 'supply_distribution_logistics' as const,
    titleAr: 'لوجستيات التوريد والتوزيع المبرد',
    descAr: 'أسطول نقل مبرد وجاف لربط الموردين والمطابخ بنقاط الاستهلاك.',
  },
] as const;
