(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.RecipeLibrary = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const cuisineZh = {
    Cantonese: '廣東菜',
    'Asian fusion': '亞洲融合',
    'Global fusion': '世界融合',
    'Western fusion': '西式融合',
    'Italian-inspired': '意大利靈感',
    'Asian curry fusion': '亞洲咖喱融合',
    'Global wrap fusion': '世界卷餅融合',
    'Global sandwich fusion': '世界三文治融合',
    'Breakfast fusion': '早餐融合',
    'Asian vegetarian fusion': '亞洲素食融合',
    'Vegetarian side': '素菜配菜',
    Breakfast: '早餐',
    Dessert: '甜品',
    'Savory snack fusion': '鹹香小食融合'
  };
  const stepIcons = ['🔪', '🥣', '🔥', '🥘', '✓'];
  const inputSeparators = /[,，、;；\n]+/;
  const amountPattern = /(?:^|\s)\d+(?:\.\d+)?\s*(?:g|gram(?:s)?|kg|ml|millilitre(?:s)?|milliliter(?:s)?|克|公斤|毫升)(?:\s|$)/gi;
  const leadingCountPattern = /^\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+)?\s*(?:個|隻|只|條|塊|片|粒|瓣|棵|tsp|tbsp|teaspoons?|tablespoons?|cups?|pcs?|pieces?|cloves?|slices?)?\s*(?=\S)/i;
  const cuisineNames = {
    cantonese: 'cantonese',
    sichuan: 'sichuan',
    taiwanese: 'taiwanese',
    japanese: 'japanese',
    korean: 'korean',
    thai: 'thai',
    vietnamese: 'vietnamese',
    filipino: 'filipino',
    indonesian: 'indonesian',
    malaysian: 'malaysian',
    indian: 'indian',
    'sri-lankan': 'sri lankan',
    persian: 'persian',
    lebanese: 'lebanese',
    turkish: 'turkish',
    greek: 'greek',
    mediterranean: 'mediterranean',
    italian: 'italian',
    french: 'french',
    spanish: 'spanish',
    portuguese: 'portuguese',
    mexican: 'mexican',
    peruvian: 'peruvian',
    brazilian: 'brazilian',
    caribbean: 'caribbean',
    jamaican: 'jamaican',
    'west-african': 'west african',
    ethiopian: 'ethiopian',
    moroccan: 'moroccan',
    'south-african': 'south african',
    'southern-us': 'southern us',
    cajun: 'cajun',
    nordic: 'nordic',
    'eastern-european': 'eastern european',
    british: 'british',
    australian: 'australian'
  };
  const methodTools = {
    roast: ['oven'],
    bake: ['oven'],
    steam: ['steamer'],
    simmer: ['pot', 'rice-cooker', 'wok'],
    braise: ['pot', 'rice-cooker', 'wok'],
    boil: ['pot', 'rice-cooker', 'wok'],
    'stir-fry': ['wok'],
    'pan-fry': ['wok'],
    'deep-fry': ['wok']
  };
  const toolNames = {
    wok: ['鑊', 'wok'],
    'rice-cooker': ['電飯煲', 'rice cooker'],
    steamer: ['蒸鍋', 'steamer'],
    pot: ['煮食鍋', 'pot'],
    oven: ['焗爐', 'oven'],
    'air-fryer': ['氣炸鍋', 'air fryer']
  };

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Food concepts --------------------------------------------------------------------------------
  // What the user types and what a recipe asks for are both reduced to "concepts" (food families), so
  // 雞腿肉 satisfies a recipe that asks for 嫩雞肉, 豉油 satisfies 生抽, and plain oil never satisfies
  // oyster sauce. Row: id, parent (a more general concept this one is a kind of), Cantonese names,
  // English names, separated by "|". Name prefixes: "=" matches only when it is the whole text (single
  // characters such as 雞); "~" is used only when reading what the user typed (too ambiguous to trust
  // inside a recipe). Longer names always win over shorter ones, so 蠔油 is never read as 蠔 or 油.
  function c(id, parent, zh, en) {
    return { id, parent, zh: zh.split('|'), en: en.split('|') };
  }

  const conceptRows = [
    // Poultry
    c('chicken', '', '雞肉|嫩雞肉|走地雞肉|清遠走地雞|雞丁|雞肉丁|雞粒|=雞', 'chicken|chicken meat|chicken pieces|tender chicken pieces|diced chicken|chicken chopped'),
    c('chicken-thigh', 'chicken', '雞腿肉|無骨雞腿肉|雞腿|雞髀', 'chicken thigh|boneless chicken thigh|chicken thigh meat'),
    c('chicken-breast', 'chicken', '雞胸肉|去骨雞胸肉|雞胸', 'chicken breast|boneless chicken breast'),
    c('chicken-wing', 'chicken', '雞中翼|雞翼|雞翅', 'chicken wing|chicken mid-wing'),
    c('chicken-whole', 'chicken', '全雞|全三黃雞|三黃雞|光雞', 'whole chicken'),
    c('chicken-feet', '', '雞爪|鳳爪|鮮雞爪', 'chicken feet|chicken foot'),
    c('duck', '', '鴨肉|=鴨', 'duck|duck meat'),
    c('duck-whole', 'duck', '光鴨|嫩光鴨|明爐光鴨', 'whole duck'),
    c('goose', '', '黑棕鵝|清遠黑棕鵝|鵝肉|=鵝', 'goose|whole goose'),
    c('squab', '', '乳鴿|淨乳鴿', 'squab|pigeon|dressed squab'),
    // Pork and cured meats
    c('pork', '', '豬肉|=豬', 'pork'),
    c('pork-lean', 'pork', '豬瘦肉|瘦肉|梅頭豬肉|梅頭肉|夾心豬肉丁|夾心肉', 'lean pork|pork shoulder butt|pork shoulder|pork collar'),
    c('pork-belly', 'pork', '五花腩|五花腩片|五花肉|腩肉', 'pork belly'),
    c('pork-ribs', 'pork', '排骨|小排骨|一字排骨|精排骨|金沙骨|豬排骨', 'pork spare ribs|spare ribs|pork ribs|ribs'),
    c('pork-chop', 'pork', '豬扒|帶骨豬扒|豬排', 'pork chop|bone-in pork chop'),
    c('pork-mince', 'pork', '豬肉碎|豬肉末|肥瘦豬肉碎|半肥瘦豬肉碎|免治豬肉|豬肉蓉|豬絞肉|豬肉茸', 'minced pork|ground pork|pork mince|minced pork filling'),
    c('pork-trotter', '', '豬手|豬手斬件|新鮮豬手|豬腳', 'pork trotter|pig trotter'),
    c('pork-fat', '', '肥豬肉|肥豬肉丁|肥豬肉粒|豬肥肉', 'pork fat|pork fat trimmings'),
    c('char-siu', '', '叉燒|叉燒肉絲|熟叉燒丁|熟蜜汁叉燒粒|蜜汁叉燒', 'char siu|char siu pork|char siu strips|bbq pork'),
    c('cured-sausage', '', '臘腸|廣東臘腸|廣東臘腸粒', 'chinese sausage|cured sausage|cantonese cured sausage|lap cheong'),
    c('cured-pork', '', '臘肉|廣東臘肉', 'cured pork belly|chinese cured pork|cured pork'),
    c('salted-fish', '', '鹹魚|梅香鹹魚', 'salted fish'),
    c('lard', '', '豬油|熟豬油', 'lard'),
    // Beef and lamb
    c('beef', '', '牛肉', 'beef'),
    c('beef-lean', 'beef', '牛肉片|鮮牛肉片|牛里脊肉|牛柳肉片|牛柳|牛里脊|牛扒', 'beef slices|sliced beef|fresh beef slices|beef tenderloin|steak'),
    c('beef-brisket', 'beef', '牛坑腩|牛腩', 'beef brisket'),
    c('beef-ribs', 'beef', '牛仔骨|帶骨牛仔骨', 'beef short ribs|short ribs'),
    c('beef-mince', 'beef', '牛絞肉|碎牛肉|牛肉碎|免治牛肉|牛肉末', 'ground beef|minced beef|beef mince'),
    c('lamb', '', '羊肉|羊腩|帶皮羊腩|=羊', 'lamb|lamb brisket'),
    // Seafood
    c('shrimp', '', '蝦仁|鮮蝦|鮮蝦仁|鮮海蝦|去殼鮮蝦|鮮大蝦仁|蝦肉|鮮蝦肉|海蝦|大蝦|蝦仁粒|鮮蝦仁粒|鮮蝦肉粒|鮮蝦膠|蝦粒|=蝦', 'shrimp|prawn|raw shrimp|peeled shrimp|shrimp meat|fresh shrimp|diced shrimp'),
    c('shrimp-paste', '', '蝦醬|大澳蝦醬', 'shrimp paste|fermented shrimp paste|tai o shrimp paste'),
    c('dried-shrimp', '', '蝦米|蝦米碎', 'dried shrimp'),
    c('wonton', '', '雲吞|鮮蝦雲吞', 'wonton|shrimp wonton'),
    c('crab', '', '肉蟹|鮮肉蟹|鮮花蟹|花蟹|螃蟹|=蟹', 'crab|mud crab|fresh mud crab|blue swimmer crab'),
    c('crab-roe', '', '蟹黃', 'crab roe'),
    c('fish', '', '魚肉|魚片|魚柳|=魚', 'fish|fish fillet'),
    c('fish-grouper', 'fish', '石斑魚', 'grouper|whole grouper'),
    c('fish-seabass', 'fish', '海鱸魚|新鮮海鱸魚|鱸魚', 'sea bass'),
    c('fish-sole', 'fish', '龍利魚|龍利魚柳', 'sole|sole fish fillet'),
    c('fish-bombay', 'fish', '九吐魚', 'bombay duck|bombay duck fish'),
    c('fish-dace', 'fish', '鯪魚|鮮鯪魚|調味鯪魚滑|鯪魚滑', 'dace|whole dace fish|dace fish paste'),
    c('fish-carp', 'fish', '鯇魚|草魚|鮮草魚|鮮鯇魚|生魚|鯇魚片|生魚片', 'grass carp|carp|carp fillet'),
    c('eel', 'fish', '白鱔|新鮮白鱔|鱔', 'white eel|eel'),
    c('salmon', 'fish', '三文魚', 'salmon'),
    c('tuna', 'fish', '吞拿魚', 'tuna'),
    c('cod', 'fish', '鱈魚', 'cod'),
    c('fish-sauce', '', '魚露', 'fish sauce'),
    c('squid', '', '魷魚|鮮魷魚|熟魷魚絲|魷魚絲|墨魚', 'squid|fresh squid|calamari'),
    c('clam', '', '花蜆|鮮花蜆|=蜆', 'clam|fresh clams'),
    c('scallop', '', '扇貝|帶殼鮮扇貝|帶子', 'scallop|fresh scallops on half shell'),
    c('dried-scallop', '', '乾瑤柱|瑤柱|江瑤柱', 'dried scallop'),
    c('oyster', '', '生蠔|鮮生蠔肉|=蠔', 'oyster|fresh oyster meat'),
    c('jellyfish', '', '海蜇皮絲|海蜇', 'jellyfish|jellyfish strips'),
    // Eggs, tofu, mushrooms
    c('egg', '', '雞蛋|鮮生雞蛋|雞春|雞蛋皮絲|=蛋', 'egg|fresh egg|fresh whole egg|egg beaten|sliced egg omelet'),
    c('egg-white', 'egg', '純蛋白|蛋白', 'egg white'),
    c('century-egg', '', '皮蛋|無鉛皮蛋|熟皮蛋粒', 'century egg|preserved egg'),
    c('salted-egg', '', '鹹蛋|鹹鴨蛋|熟鹹鴨蛋|鹹蛋黃|鹹蛋黃粒|熟鹹鴨蛋黃', 'salted egg|salted duck egg|salted egg yolk|cooked salted egg yolks'),
    c('tofu', '', '豆腐', 'tofu|bean curd'),
    c('tofu-firm', 'tofu', '板豆腐|老豆腐', 'firm tofu'),
    c('tofu-soft', 'tofu', '嫩豆腐|滑豆腐', 'soft tofu'),
    c('tofu-skin', '', '鮮腐皮|腐皮', 'bean curd skin|fresh bean curd skin sheets'),
    c('fermented-tofu', '', '腐乳|豆腐乳', 'fermented bean curd'),
    c('red-fermented-tofu', 'fermented-tofu', '南乳|紅腐乳', 'red fermented bean curd'),
    c('white-fermented-tofu', 'fermented-tofu', '白腐乳|廣東白腐乳', 'white fermented bean curd'),
    c('mushroom', '', '蘑菇|鮮菇|菇類|=菇', 'mushroom|fresh mushrooms|mushrooms sliced'),
    c('shiitake', 'mushroom', '冬菇|香菇|花菇|乾花菇|冬菇粒|香菇絲|香菇碎|鮮香菇|鮮香菇片', 'shiitake|shiitake mushroom|dried shiitake mushrooms|braised shiitake mushrooms|shredded shiitake mushrooms|minced shiitake|fresh shiitake sliced'),
    c('straw-mushroom', 'mushroom', '草菇|鮮草菇', 'straw mushroom'),
    c('button-mushroom', 'mushroom', '白蘑菇|口蘑|洋菇', 'button mushroom|white mushroom'),
    // Vegetables, fruit and plant foods
    c('choy-sum', '', '菜心|廣東菜心|鮮菜心', 'choy sum|choi sum|cantonese choy sum|choy sum greens|chinese flowering cabbage'),
    c('pea-shoots', '', '豆苗', 'pea shoots'),
    c('gai-lan', '', '芥蘭|鮮芥蘭|芥蘭菜粒', 'gai lan|chinese broccoli|kai lan|gai lan stems'),
    c('water-spinach', '', '通菜|鮮通菜|空心菜', 'water spinach|ong choy'),
    c('broccoli', '', '西蘭花|鮮西蘭花', 'broccoli|fresh broccoli florets'),
    c('amaranth', '', '莧菜|鮮紅莧菜|青莧菜', 'chinese spinach|amaranth'),
    c('asparagus', '', '蘆筍', 'asparagus|fresh asparagus'),
    c('snow-peas', '', '荷蘭豆', 'snow peas'),
    c('green-peas', '', '青豆|豌豆', 'green peas|peas'),
    c('bitter-melon', '', '苦瓜|涼瓜', 'bitter melon'),
    c('pumpkin', '', '南瓜|老南瓜', 'pumpkin|kabocha|sugar pumpkin'),
    c('bean-sprouts', '', '芽菜|銀芽|豆芽', 'bean sprouts'),
    c('yellow-chives', '', '韭黃|韭黃段|韭黃碎', 'yellow chives|yellow chives cut|yellow chives minced'),
    c('onion', '', '洋蔥|洋蔥絲', 'onion|onion slices|sliced onion'),
    c('bell-pepper', '', '青椒|青紅椒|鮮綠青椒|燈籠椒|甜椒|青紅椒絲|~=紅椒', 'bell pepper|green bell pepper|red bell pepper|peppers and onions sliced'),
    c('carrot', '', '胡蘿蔔|甘筍|紅蘿蔔|胡蘿蔔絲|胡蘿蔔碎', 'carrot|shredded carrots|carrot mince'),
    c('daikon', '', '白蘿蔔', 'daikon|daikon radish|white radish'),
    c('taro', '', '芋頭|檳榔芋頭|檳榔芋頭丁', 'taro'),
    c('lotus-root', '', '蓮藕', 'lotus root'),
    c('winter-bamboo', '', '冬筍', 'winter bamboo shoots|bamboo shoots'),
    c('water-chestnut', '', '馬蹄|鮮馬蹄|馬蹄粒', 'water chestnut|fresh water chestnuts|diced water chestnuts'),
    c('chestnut', '', '栗子|熟去皮栗子', 'chestnut|peeled chestnuts'),
    c('red-dates', '', '紅棗', 'red dates|jujube'),
    c('goji', '', '枸杞', 'goji|goji berries'),
    c('lily-bulb', '', '乾百合|百合', 'lily bulbs|dried lily bulbs'),
    c('tangerine-peel', '', '陳皮|新會老陳皮|陳皮碎', 'tangerine peel|aged tangerine peel|xinhui aged tangerine peel'),
    c('lotus-leaf', '', '乾荷葉', 'dried lotus leaf'),
    c('preserved-mustard', '', '甜梅菜|梅菜', 'sweet preserved mustard greens|preserved mustard greens'),
    c('pineapple', '', '菠蘿|新鮮菠蘿|鳳梨', 'pineapple|fresh pineapple'),
    c('lemon', '', '檸檬|鮮檸檬片|鮮檸檬汁', 'lemon|lemon slices|fresh lemon juice'),
    c('avocado', '', '牛油果', 'avocado'),
    c('mango', '', '芒果|熟芒果肉', 'mango|ripe mango puree and cubes'),
    c('grapefruit', '', '沙田柚|西柚|西柚肉', 'pomelo|grapefruit|pomelo or grapefruit sacs'),
    c('corn', '', '粟米|玉米', 'corn|sweet corn'),
    c('creamed-corn', '', '粟米蓉罐頭|粟米蓉', 'creamed corn'),
    c('chili', '', '辣椒|紅辣椒|紅椒粒|紅椒絲|紅椒碎|辣椒絲|椒絲|~=紅椒', 'chili|chilli|chili pepper|red chili|red chili pepper|diced red chili|julienned red chili|red chili slivers|sliced red chili'),
    c('dried-chili', '', '乾辣椒', 'dried chili|dried chilies|dried chillies'),
    // Rice, noodles, flour and starch
    c('cooked-rice', '', '白飯|熟白飯|熟冷白飯|熟凍飯|冷飯|米飯|隔夜飯|=飯', 'cooked rice|steamed rice|cold cooked rice|chilled cooked rice|leftover rice|~rice|~white rice'),
    c('raw-rice', '', '絲苗米|白米|大米|生米|=米', 'long grain rice|long grain fragrant rice|raw rice|uncooked rice|white rice|~rice'),
    c('glutinous-rice', '', '糯米', 'glutinous rice|sticky rice'),
    c('congee-base', '', '白米粥底|粥底', 'prepared plain congee base|congee base'),
    c('noodles', '', '麵條|=麵', 'noodle|noodles'),
    c('egg-noodles', 'noodles', '全蛋幼生麵|全蛋炒麵生麵|雲吞麵|蛋麵|生麵', 'egg noodles|thin egg noodles|cantonese thin egg noodles'),
    c('flat-rice-noodles', 'noodles', '沙河粉|河粉|粿條', 'flat rice noodles|fresh flat rice noodles|ho fun'),
    c('rice-vermicelli', 'noodles', '乾米粉|米粉', 'rice vermicelli|dry rice vermicelli soaked|rice noodles'),
    c('glass-noodles', 'noodles', '龍口粉絲|粉絲', 'glass noodles|cellophane noodles'),
    c('plain-flour', '', '麵粉|低筋麵粉|中筋麵粉|高筋麵粉', 'flour|plain flour|all-purpose flour|low-gluten flour|wheat flour'),
    c('rice-flour', '', '粘米粉|在來米粉', 'rice flour'),
    c('wheat-starch', '', '澄麵|澄麵粉|澄粉', 'wheat starch'),
    c('tapioca-starch', '', '木薯粉', 'tapioca starch'),
    c('cornstarch', '', '生粉|粟粉|澱粉|太白粉|玉米粉', 'cornstarch|corn starch|cornflour|potato starch|starch'),
    c('batter-mix', '', '脆炸粉', 'crispy fry batter mix|tempura batter'),
    c('breadcrumbs', '', '麵包糠', 'breadcrumbs'),
    c('sago', '', '西米', 'tapioca sago pearls|sago'),
    c('adzuki', '', '紅豆|優質紅豆', 'red adzuki beans|adzuki beans|red beans'),
    c('cruller', '', '炸油條段|油條', 'crispy fried cruller pieces|cruller'),
    c('spring-roll-wrappers', '', '春卷皮', 'spring roll wrappers'),
    c('siu-mai-wrappers', '', '燒賣黃皮', 'yellow siu mai wrappers'),
    c('peanuts', '', '花生|花生米', 'peanut'),
    c('raw-peanuts', 'peanuts', '生花生米', 'raw peanuts'),
    c('fried-peanuts', 'peanuts', '炸熟花生米', 'fried peanuts'),
    c('olives-preserved', '', '廣東黑欖角|欖角', 'chinese preserved black olives'),
    // Dairy
    c('milk', '', '牛奶|純牛奶', 'milk|whole milk'),
    c('evaporated-milk', '', '淡奶', 'evaporated milk'),
    c('coconut-milk', '', '椰漿|椰奶', 'coconut milk'),
    c('butter', '', '牛油|奶油', 'butter'),
    // Seasonings, sauces and oils
    c('soy-sauce', '', '豉油|醬油|=豉', 'soy sauce|soya sauce|soy'),
    c('soy-light', 'soy-sauce', '生抽', 'light soy sauce'),
    c('soy-dark', 'soy-sauce', '老抽', 'dark soy sauce'),
    c('soy-seafood', 'soy-sauce', '蒸魚豉油', 'seasoned soy sauce|seasoned seafood soy sauce|seasoned soy sauce for seafood'),
    c('soy-sweet', 'soy-sauce', '甜豉油|熟甜豉油|煲仔飯豉油', 'sweet seasoned soy sauce|claypot sweet seasoned soy'),
    c('oyster-sauce', '', '蠔油|李錦記蠔油', 'oyster sauce|premium oyster sauce'),
    c('hoisin', '', '海鮮醬', 'hoisin sauce|hoisin'),
    c('chu-hou', '', '柱侯醬', 'chu hou paste|chu hou sauce'),
    c('satay-sauce', '', '潮州沙嗲醬|沙嗲醬', 'teochew satay sauce|satay sauce'),
    c('char-siu-sauce', '', '叉燒醬', 'char siu sauce'),
    c('char-siu-glaze', '', '蠔油叉燒芡汁', 'oyster bbq sauce glaze'),
    c('fermented-black-bean', '', '豆豉|陽江豆豉', 'fermented black beans'),
    c('black-bean-garlic', '', '豆豉蒜蓉', 'black bean garlic paste'),
    c('soybean-paste', '', '廣東麵豉醬|麵豉醬', 'cantonese fermented soybean paste'),
    c('abalone-sauce', '', '優質鮑汁|鮑汁', 'abalone sauce'),
    c('master-stock', '', '滷水料汁|潮州滷水汁|滷水汁', 'master braising liquid|teochew master braising liquid'),
    c('ketchup', '', '茄汁|茄醬|番茄醬', 'ketchup|tomato ketchup'),
    c('hawthorn-ketchup', 'ketchup', '山楂茄汁', 'hawthorn ketchup sauce'),
    c('worcestershire', '', 'OK汁|喼汁', 'worcestershire sauce'),
    c('vinegar', '', '醋', 'vinegar'),
    c('white-vinegar', 'vinegar', '白醋', 'white vinegar'),
    c('red-vinegar', 'vinegar', '大紅浙醋|浙醋', 'zhejiang red vinegar'),
    c('rice-vinegar', 'vinegar', '米醋', 'rice vinegar'),
    c('garlic-vinegar-dip', '', '蒜蓉白醋蘸汁', 'garlic white vinegar dip'),
    c('salt', '', '鹽|幼鹽|粗海鹽|食鹽|海鹽', 'salt|fine salt|sea salt|coarse sea salt|table salt'),
    c('salt-pepper-mix', '', '椒鹽|椒鹽粉', 'salt and pepper seasoning|salt and pepper spice mix|salt and pepper'),
    c('salt-baked-chicken-powder', '', '鹽焗雞粉', 'salt baked chicken powder'),
    c('sugar', '', '糖|白糖|細砂糖|砂糖|白砂糖', 'sugar|white sugar|granulated sugar|caster sugar'),
    c('rock-sugar', 'sugar', '冰糖', 'rock sugar'),
    c('brown-sugar', 'sugar', '黃糖|黃片糖', 'brown sugar|brown slab sugar'),
    c('maltose', '', '麥芽糖', 'maltose'),
    c('honey', '', '蜜糖|蜂蜜|純蜂蜜', 'honey|pure honey'),
    c('syrup', '', '糖漿', 'sugar syrup|syrup'),
    c('neutral-oil', '', '花生油|菜籽油|熟花生油|粟米油|沙律油|食用油|植物油|烹調油|=油', 'oil|cooking oil|vegetable oil|peanut oil|canola oil|rapeseed oil|heated peanut oil|corn oil|salad oil'),
    c('olive-oil', 'neutral-oil', '橄欖油', 'olive oil'),
    c('sesame-oil', '', '麻油|芝麻油|香油', 'sesame oil'),
    c('chili-oil', '', '辣椒油|紅油', 'chili oil|chilli oil'),
    c('cornstarch-water', '', '=生粉水', 'cornstarch slurry'),
    c('water', '', '清水|溫水|凍水|滾水|=水', 'water|warm water'),
    c('broth', '', '高湯|上湯|清雞湯|雞湯|大地魚高湯|湯底', 'broth|stock|chicken broth|superior chicken broth|dried flounder broth|chicken stock'),
    c('shaoxing-wine', '', '紹興酒|米酒|料酒|花雕酒|黃酒', 'shaoxing wine|rice wine|cooking wine|huadiao wine'),
    c('rose-wine', '', '玫瑰露酒|玫瑰露', 'rose wine'),
    c('ginger', '', '薑|生薑|老薑|薑片|薑絲|薑末|薑蓉|生薑片|生薑絲|薑汁', 'ginger|fresh ginger|old ginger|ginger slices|sliced ginger|shredded ginger|ginger shreds|fine ginger shreds|minced ginger'),
    c('galangal', '', '南薑|沙薑|沙薑粉', 'galangal|sand ginger powder'),
    c('turmeric', '', '薑黃|薑黃粉', 'turmeric'),
    c('garlic', '', '蒜|蒜頭|蒜蓉|蒜茸|蒜末|蒜片|蒜瓣|蒜頭粒|生蒜汁|蒜粒', 'garlic|garlic cloves|minced garlic|sliced garlic|whole peeled garlic|fresh garlic juice|fresh garlic juice and pulp|crushed garlic'),
    c('garlic-powder', '', '蒜粉', 'garlic powder'),
    c('scallion', '', '蔥|葱|青蔥|蔥花|蔥段|蔥白|蔥白粒|青蔥段|青蔥粒|大蔥|京蔥|小蔥|蔥絲', 'scallion|green onion|spring onion|scallion whites|chopped scallions|scallion stalks|diced scallion whites'),
    c('shallot', '', '紅蔥頭|乾蔥頭', 'shallot'),
    c('coriander', '', '芫茜|芫荽|香菜', 'coriander|cilantro|fresh coriander'),
    c('five-spice', '', '五香粉', 'five-spice powder|five spice powder|five spice'),
    c('star-anise', '', '八角', 'star anise'),
    c('cinnamon', '', '桂皮|肉桂', 'cinnamon|cinnamon stick'),
    c('curry-powder', '', '咖喱粉|油咖喱粉|咖喱', 'curry powder|mild curry powder|curry'),
    c('pepper', '', '胡椒|胡椒粉', 'ground pepper|pepper powder'),
    c('white-pepper', 'pepper', '白胡椒|白胡椒粉', 'white pepper'),
    c('black-pepper', 'pepper', '黑椒|黑胡椒|現磨黑胡椒碎', 'black pepper|coarsely ground black pepper|ground black pepper'),
    c('sesame-seeds', '', '熟白芝麻|芝麻|白芝麻', 'toasted white sesame|sesame seeds|sesame'),
    c('baking-powder', '', '泡打粉', 'baking powder'),
    c('yeast', '', '酵母粉|酵母', 'yeast|yeast powder')
  ];

  const conceptParent = {};
  const nameMaps = {
    cjk: { requirement: new Map(), pantry: new Map() },
    cjkExact: { requirement: new Map(), pantry: new Map() },
    latin: { requirement: new Map(), pantry: new Map() }
  };
  let longestCjk = 1;
  let longestLatin = 1;

  // English words are compared in a singular form so "eggs" and "egg" are the same word.
  function stem(word) {
    if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
    if (word.length > 4 && /(oes|ches|shes|xes)$/.test(word)) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
    return word;
  }

  function latinWords(text) {
    return normalize(text).split(/[^a-z0-9]+/).filter(Boolean).map(stem);
  }

  function cjkKey(text) {
    return normalize(text).replace(/\s+/g, '');
  }

  function remember(map, key, id) {
    if (!map.has(key)) map.set(key, []);
    const ids = map.get(key);
    if (!ids.includes(id)) ids.push(id);
  }

  conceptRows.forEach((row) => {
    conceptParent[row.id] = row.parent || '';
    const register = (rawName, latin) => {
      let name = rawName;
      let exact = false;
      let pantryOnly = false;
      while (name[0] === '=' || name[0] === '~') {
        if (name[0] === '=') exact = true;
        else pantryOnly = true;
        name = name.slice(1);
      }
      const key = latin ? latinWords(name).join(' ') : cjkKey(name);
      if (!key) return;
      (pantryOnly ? ['pantry'] : ['pantry', 'requirement']).forEach((side) => {
        if (latin) {
          remember(nameMaps.latin[side], key, row.id);
          longestLatin = Math.max(longestLatin, key.split(' ').length);
        } else if (exact) {
          remember(nameMaps.cjkExact[side], key, row.id);
        } else {
          remember(nameMaps.cjk[side], key, row.id);
          longestCjk = Math.max(longestCjk, key.length);
        }
      });
    };
    row.zh.forEach((name) => register(name, false));
    row.en.forEach((name) => register(name, true));
  });

  // Which concepts does this piece of text mention? Longest names are read first at every position.
  function conceptsOf(text, side) {
    const sideKey = side === 'pantry' ? 'pantry' : 'requirement';
    const found = new Set();
    const compact = cjkKey(text);
    const exact = nameMaps.cjkExact[sideKey].get(compact);
    if (exact) exact.forEach((id) => found.add(id));
    for (let index = 0; index < compact.length;) {
      let hit = null;
      for (let length = Math.min(longestCjk, compact.length - index); length > 0; length -= 1) {
        const ids = nameMaps.cjk[sideKey].get(compact.slice(index, index + length));
        if (ids) {
          hit = { ids, length };
          break;
        }
      }
      if (hit) {
        hit.ids.forEach((id) => found.add(id));
        index += hit.length;
      } else index += 1;
    }
    const words = latinWords(text);
    for (let index = 0; index < words.length;) {
      let hit = null;
      for (let length = Math.min(longestLatin, words.length - index); length > 0; length -= 1) {
        const ids = nameMaps.latin[sideKey].get(words.slice(index, index + length).join(' '));
        if (ids) {
          hit = { ids, length };
          break;
        }
      }
      if (hit) {
        hit.ids.forEach((id) => found.add(id));
        index += hit.length;
      } else index += 1;
    }
    return found;
  }

  function isKindOf(specific, general) {
    for (let parent = conceptParent[specific]; parent; parent = conceptParent[parent]) {
      if (parent === general) return true;
    }
    return false;
  }

  // The same food, a specific kind of the food asked for (雞腿肉 for 雞肉), or the plain food when a
  // specific kind is asked for (雞 for 雞腿肉). Two different specific kinds (雞胸 for 雞腿) do not match.
  function conceptsSatisfy(pantryConcepts, requirementConcepts) {
    for (const pantry of pantryConcepts) {
      for (const required of requirementConcepts) {
        if (pantry === required || isKindOf(pantry, required) || isKindOf(required, pantry)) return true;
      }
    }
    return false;
  }

  // Typed input and recipe items ------------------------------------------------------------------

  function scopeOf(record) {
    return record && record._codex_import ? record._codex_import.scope : 'synthetic_demo';
  }

  function isVisibleByDefault(record) {
    return Boolean(record && record._codex_import && record._codex_import.production_visible);
  }

  function statusFor(record) {
    const scope = scopeOf(record);
    if (scope === 'cantonese_editorial') {
      return {
        short: ['編輯食譜・未經試煮', 'Editorial recipe · not cook-tested'],
        long: [
          '編輯整理・未經實際試煮。材料、份量及時間來自所提供資料，煮食前請自行檢查。',
          'Editorially prepared — not independently cook-tested. Ingredients, amounts and timing come from the supplied data; review them before cooking.'
        ]
      };
    }
    if (scope === 'legacy_demo') {
      return {
        short: ['舊版示範・預設隱藏', 'Legacy demo · hidden by default'],
        long: [
          '未核實舊版示範資料・預設隱藏。呢份記錄唔係來源參考食譜，亦未經實際試煮。',
          'Unverified legacy demo — hidden by default. This is not a source-reference recipe and has not been independently cook-tested.'
        ]
      };
    }
    return {
      short: ['合成示範・預設隱藏', 'Synthetic demo · hidden by default'],
      long: [
        '合成示範資料・預設隱藏。只供探索口味組合，未經實際試煮，唔應當成已驗證食譜。',
        'Synthetic demo data — hidden by default. It is for exploring flavor combinations, is not independently cook-tested and must not be treated as a verified recipe.'
      ]
    };
  }

  function recordSearchText(record) {
    const ingredientText = (record.ingredients || []).flatMap((item) => [item.name, item.name_zh_hant, item.name_en]);
    return normalize([
      record.id,
      record.title_zh_hant,
      record.title_en,
      record.cuisine,
      record.method,
      record.flavor_name_zh_hant,
      record.flavor_name_en,
      ...(record.main_ingredients || []),
      ...(record.seasonings || []),
      ...ingredientText
    ].join(' '));
  }

  function search(records, options) {
    const settings = options || {};
    const query = normalize(settings.query);
    const cuisine = settings.cuisine || 'all';
    const includeDemos = Boolean(settings.includeDemos);
    return (records || [])
      .filter((record) => includeDemos || isVisibleByDefault(record))
      .filter((record) => cuisine === 'all' || record.cuisine === cuisine)
      .filter((record) => !query || recordSearchText(record).includes(query))
      .slice()
      .sort((left, right) => {
        const rank = { cantonese_editorial: 0, legacy_demo: 1, synthetic_demo: 2 };
        return (rank[scopeOf(left)] || 0) - (rank[scopeOf(right)] || 0) || left.id.localeCompare(right.id);
      });
  }

  function cuisineOptions(records) {
    return [...new Set((records || []).map((record) => record.cuisine).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
  }

  function cleanInputName(value) {
    return String(value || '')
      .replace(/[（(][^）)]*[）)]/g, ' ')
      .replace(amountPattern, ' ')
      .replace(leadingCountPattern, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function splitInput(value) {
    return String(value || '')
      .split(inputSeparators)
      .map(cleanInputName)
      .filter(Boolean);
  }

  // "鮮菜心/豆苗" and "lard or butter" offer a choice: any one of them satisfies the item.
  function splitAlternatives(value) {
    return String(value || '')
      .split(/\s*[/／]\s*|\s+or\s+|或/i)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function nameForms(value) {
    const base = normalize(cleanInputName(value)).replace(/[_/()-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!base) return [];
    return [...new Set([base, base.replace(/\s+/g, '')])];
  }

  function hasCjk(value) {
    return /[㐀-鿿]/.test(value);
  }

  // Plain wording match, used only for foods the concept table does not know.
  function phraseMatch(left, right) {
    if (!left || !right) return false;
    if (left === right) return true;
    if (hasCjk(left) && hasCjk(right)) {
      const shorter = left.length <= right.length ? left : right;
      const longer = left.length <= right.length ? right : left;
      return shorter.length >= 2 && longer.includes(shorter);
    }
    if (hasCjk(left) || hasCjk(right)) return false;
    const shorter = left.length <= right.length ? left : right;
    const longer = left.length <= right.length ? right : left;
    if (!shorter.includes(' ') || shorter.length < 5) return false;
    return (` ${longer} `).includes(` ${shorter} `);
  }

  function buildProfile(texts, side) {
    const seen = new Set();
    const alternatives = [];
    texts.forEach((text) => {
      splitAlternatives(text).forEach((part) => {
        const key = normalize(part);
        if (!key || seen.has(key)) return;
        seen.add(key);
        alternatives.push({ forms: nameForms(part), concepts: conceptsOf(part, side) });
      });
    });
    const concepts = new Set(alternatives.flatMap((alternative) => [...alternative.concepts]));
    return { alternatives, concepts };
  }

  const pantryProfiles = new Map();
  const requirementProfiles = new WeakMap();

  function pantryProfile(inputName) {
    const key = String(inputName);
    if (!pantryProfiles.has(key)) pantryProfiles.set(key, buildProfile([cleanInputName(key)], 'pantry'));
    return pantryProfiles.get(key);
  }

  function requirementProfile(requirement) {
    if (!requirementProfiles.has(requirement)) {
      requirementProfiles.set(requirement, buildProfile([requirement.name_zh_hant, requirement.name, requirement.name_en], 'requirement'));
    }
    return requirementProfiles.get(requirement);
  }

  function pantryItemMatches(inputName, requirement) {
    const input = pantryProfile(inputName);
    const required = requirementProfile(requirement);
    if (!input.alternatives.length || !required.alternatives.length) return false;
    if (input.concepts.size && required.concepts.size && conceptsSatisfy(input.concepts, required.concepts)) return true;
    return input.alternatives.some((left) => required.alternatives.some((right) => (
      (!left.concepts.size || !right.concepts.size)
      && left.forms.some((a) => right.forms.some((b) => phraseMatch(a, b)))
    )));
  }

  function ingredientLabel(item) {
    return {
      nameZh: item.name_zh_hant || item.name || item.name_en || '',
      nameEn: item.name_en || item.name || item.name_zh_hant || '',
      role: item.role || 'ingredient'
    };
  }

  function cuisineMatches(record, cuisineId) {
    if (!cuisineId || cuisineId === 'world-fusion') return true;
    const expected = cuisineNames[cuisineId] || normalize(cuisineId).replace(/-/g, ' ');
    return normalize(record.cuisine) === expected;
  }

  function toolsMatch(record, selectedTools) {
    const tools = Array.isArray(selectedTools) ? selectedTools : [];
    if (!tools.length) return false;
    const allowed = methodTools[normalize(record.method)];
    if (!allowed) return true;
    return allowed.some((tool) => tools.includes(tool));
  }

  function dietaryConflict(record, dietaryNeeds) {
    const request = normalize(dietaryNeeds);
    if (!request) return false;
    const text = normalize([
      record.title_zh_hant,
      record.title_en,
      ...(record.ingredients || []).flatMap((item) => [item.name, item.name_zh_hant, item.name_en])
    ].join(' '));
    const flags = new Set((record.allergen_flags_unverified || []).map(normalize));
    const contains = (pattern) => pattern.test(text);
    const hasRequest = (...terms) => terms.some((term) => request.includes(normalize(term)));

    if (hasRequest('vegan', '純素') && contains(/雞|鴨|鵝|豬|牛|羊|魚|蝦|蟹|蛋|奶|肉|pork|beef|chicken|duck|goose|lamb|fish|shrimp|prawn|crab|egg|milk|cream|cheese/)) return true;
    if (hasRequest('vegetarian', '素食') && contains(/雞|鴨|鵝|豬|牛|羊|魚|蝦|蟹|肉|pork|beef|chicken|duck|goose|lamb|fish|shrimp|prawn|crab/)) return true;
    if (hasRequest('gluten-free', 'gluten free', '無麩質') && flags.has('wheat_gluten')) return true;
    if (hasRequest('soy allergy', 'soy-free', '大豆過敏', '黃豆過敏') && flags.has('soy')) return true;
    if (hasRequest('sesame allergy', 'sesame-free', '芝麻過敏') && flags.has('sesame')) return true;
    if (hasRequest('peanut allergy', 'peanut-free', '花生過敏') && flags.has('peanut')) return true;
    if (hasRequest('shellfish allergy', 'shellfish-free', '甲殼類過敏', '海鮮過敏') && (flags.has('shellfish') || contains(/蝦|蟹|shrimp|prawn|crab/))) return true;
    if (hasRequest('egg allergy', 'egg-free', '蛋過敏') && (flags.has('egg') || contains(/雞蛋|蛋黃|蛋白|\begg/))) return true;
    if (hasRequest('dairy-free', 'milk allergy', '奶類過敏') && (flags.has('dairy') || contains(/牛奶|忌廉|芝士|milk|cream|cheese/))) return true;
    if (hasRequest('no pork', '不吃豬', '唔食豬') && contains(/豬|叉燒|臘腸|pork|char siu|sausage/)) return true;
    if (hasRequest('no beef', '不吃牛', '唔食牛') && contains(/牛|beef/)) return true;
    return false;
  }

  // The interface uses soy-savory and curry-spiced; the older names are kept so nothing breaks.
  function flavorScore(record, flavorId) {
    const text = normalize([record.flavor_name_zh_hant, record.flavor_name_en, record.title_zh_hant, record.title_en].join(' '));
    const scores = record.flavor_scores || {};
    const keywordScore = (keywords) => keywords.reduce((total, keyword) => total + (text.includes(normalize(keyword)) ? 4 : 0), 0);
    switch (flavorId) {
      case 'ginger-scallion': return keywordScore(['薑', '蔥', 'ginger', 'scallion']);
      case 'soy-savory':
      case 'savory-soy': return keywordScore(['豉油', '生抽', 'soy', 'savory']) + Number(scores.umami || 0) * 2;
      case 'hot-spicy': return keywordScore(['辣', 'chili', 'spicy']) + Number(scores.spicy || 0) * 3;
      case 'sweet-sour': return keywordScore(['酸甜', 'sweet and sour']) + Number(scores.sweet || 0) * 2 + Number(scores.sour || 0) * 2;
      case 'garlic-herb': return keywordScore(['蒜', '香草', 'garlic', 'herb']);
      case 'smoky': return keywordScore(['煙燻', '烤香', 'smoky', 'roasted', 'barbecue']);
      case 'creamy': return keywordScore(['香滑', '濃郁', 'cream', 'silky', 'rich']);
      case 'tangy': return keywordScore(['酸', '醋', 'tangy', 'vinegar']) + Number(scores.sour || 0) * 2;
      case 'umami': return keywordScore(['鮮味', '菇', 'umami', 'mushroom', 'savory']) + Number(scores.umami || 0) * 3;
      case 'curry-spiced':
      case 'curry': return keywordScore(['咖喱', 'curry']);
      case 'citrus': return keywordScore(['檸檬', '青檸', 'citrus', 'lemon', 'lime']) + Number(scores.sour || 0);
      case 'peppery': return keywordScore(['胡椒', '椒鹽', 'pepper']);
      default: return 0;
    }
  }

  // Matching ------------------------------------------------------------------------------------

  // Every compatible recipe, best first. A recipe is compatible when its cuisine, cooking method and
  // obvious dietary needs fit, and the typed items cover at least half of its main ingredients. Recipes
  // that use more of what was typed rank higher; strictPantry keeps only recipes with nothing missing.
  function rankRecipes(records, config) {
    const settings = config || {};
    const mainInputs = splitInput(settings.ingredients);
    const seasoningInputs = splitInput(settings.seasonings);
    const pantry = [...mainInputs, ...seasoningInputs];
    if (!pantry.length) return [];
    const timeLimit = Number(settings.timeLimit) || 0;

    return (records || [])
      .filter(isVisibleByDefault)
      .filter((record) => cuisineMatches(record, settings.cuisine))
      .filter((record) => toolsMatch(record, settings.tools))
      .filter((record) => !dietaryConflict(record, settings.dietaryNeeds))
      .map((record) => {
        const items = record.ingredients || [];
        const requirements = items.map((item) => ({
          item,
          matchedBy: pantry.find((input) => pantryItemMatches(input, item)) || ''
        }));
        const main = requirements.filter(({ item }) => item.role !== 'seasoning');
        const seasonings = requirements.filter(({ item }) => item.role === 'seasoning');
        const matchedMain = main.filter((entry) => entry.matchedBy);
        const matchedSeasonings = seasonings.filter((entry) => entry.matchedBy);
        const missingMain = main.filter((entry) => !entry.matchedBy).map(({ item }) => ingredientLabel(item));
        const missingSeasonings = seasonings.filter((entry) => !entry.matchedBy).map(({ item }) => ingredientLabel(item));
        const mainCoverage = main.length ? matchedMain.length / main.length : 0;
        const seasoningCoverage = seasonings.length ? matchedSeasonings.length / seasonings.length : 1;
        const isUsed = (input) => items.some((item) => pantryItemMatches(input, item));
        const unusedMain = mainInputs.filter((input) => !isUsed(input));
        const unusedSeasonings = seasoningInputs.filter((input) => !isUsed(input));
        const inputUse = mainInputs.length ? (mainInputs.length - unusedMain.length) / mainInputs.length : 1;
        const totalMinutes = Number(record.total_minutes) || Number(record.prep_minutes || 0) + Number(record.cook_minutes || 0);
        const timeDifference = timeLimit ? totalMinutes - timeLimit : 0;
        const score = mainCoverage * 100
          + inputUse * 50
          + seasoningCoverage * 25
          + matchedMain.length * 4
          + matchedSeasonings.length * 2
          + flavorScore(record, settings.flavor)
          + (timeDifference <= 0 ? 10 : -Math.min(40, timeDifference));
        return {
          record,
          score,
          mainCoverage,
          seasoningCoverage,
          inputUse,
          matched: requirements.filter((entry) => entry.matchedBy).map(({ item }) => ingredientLabel(item)),
          missingMain,
          missingSeasonings,
          missing: [...missingMain, ...missingSeasonings],
          unusedInputs: [...unusedMain, ...unusedSeasonings],
          unusedMain,
          unusedSeasonings,
          totalMinutes
        };
      })
      .filter((candidate) => candidate.matched.length && candidate.mainCoverage >= 0.5)
      .filter((candidate) => !settings.strictPantry || candidate.missing.length === 0)
      .sort((left, right) => (
        right.score - left.score
        || right.mainCoverage - left.mainCoverage
        || left.missing.length - right.missing.length
        || left.totalMinutes - right.totalMinutes
        || left.record.id.localeCompare(right.record.id)
      ));
  }

  function matchRecipe(records, config) {
    return rankRecipes(records, config)[0] || null;
  }

  // When nothing matches: would a different choice have found a recipe? Returns up to two
  // [Cantonese, English] hints the page can show next to the generic recipe.
  function explainNoMatch(records, config) {
    const settings = config || {};
    const hints = [];
    const allTools = Object.keys(toolNames);

    const withAnyTool = rankRecipes(records, { ...settings, tools: allTools });
    if (withAnyTool.length) {
      const best = withAnyTool[0];
      const chosen = Array.isArray(settings.tools) ? settings.tools : [];
      const needed = (methodTools[normalize(best.record.method)] || [])
        .filter((tool) => !chosen.includes(tool));
      if (needed.length && !toolsMatch(best.record, chosen)) {
        const tool = toolNames[needed[0]];
        hints.push([
          `如果加返「${tool[0]}」，就有配對：${best.record.title_zh_hant}。`,
          `A match exists if you also pick the ${tool[1]}: ${best.record.title_en}.`
        ]);
      }
    }

    const cuisine = settings.cuisine;
    if (cuisine && cuisine !== 'world-fusion' && cuisine !== 'cantonese' && !hints.length) {
      if (rankRecipes(records, { ...settings, cuisine: 'world-fusion' }).length) {
        hints.push([
          '食譜庫而家得廣東菜；揀「廣東菜」或「世界融合」就可以配對。',
          'The library currently has Cantonese recipes only; choose Cantonese or World Fusion to match.'
        ]);
      }
    }

    if (settings.dietaryNeeds && !hints.length && rankRecipes(records, { ...settings, dietaryNeeds: '' }).length) {
      hints.push([
        '你嘅飲食要求排除咗相近嘅食譜。',
        'Your dietary needs rule out the closest recipes.'
      ]);
    }

    if (settings.strictPantry) {
      const near = rankRecipes(records, { ...settings, strictPantry: false });
      if (near.length) {
        hints.push([
          `冇食譜係材料齊全；最接近係「${near[0].record.title_zh_hant}」，仲欠 ${near[0].missing.length} 樣。熄咗「材料要齊全」就可以睇到。`,
          `No recipe has everything you listed; the closest is "${near[0].record.title_en}" with ${near[0].missing.length} item(s) missing. Turn off "everything listed" to see it.`
        ]);
      }
    }

    if (!hints.length) {
      hints.push([
        '食譜庫入面冇食譜用到足夠你輸入嘅主要食材。',
        'No library recipe uses enough of the main ingredients you entered.'
      ]);
    }
    return hints.slice(0, 2);
  }

  // Showing a recipe ----------------------------------------------------------------------------

  function scaleQuantity(quantity, originalServings, targetServings) {
    if (quantity == null) return null;
    const base = Math.max(1, Number(originalServings) || 1);
    const target = Math.max(1, Number(targetServings) || base);
    const scaled = Number(quantity) * target / base;
    return Math.round(scaled * 10) / 10;
  }

  function mappedIngredient(item, record, servings) {
    return {
      name: item.name_zh_hant || item.name || item.name_en,
      nameZh: item.name_zh_hant || item.name || '',
      nameEn: item.name_en || '',
      quantity: scaleQuantity(item.quantity, record.servings, servings),
      unit: item.unit || '',
      sourceAmountExact: item.source_amount_exact || '',
      role: item.role || 'ingredient',
      inferred: false,
      suggested: false
    };
  }

  function flavorIcon(scores) {
    const values = scores || {};
    if (Number(values.spicy) >= 3) return '🌶️';
    if (Number(values.sweet) >= 3) return '🍯';
    if (Number(values.sour) >= 3) return '🍋';
    return '🥢';
  }

  function toAppRecipe(record, targetServings, options) {
    if (!record || !record.id) throw new Error('A library record is required.');
    const settings = options || {};
    const config = settings.config || null;
    const inputMatch = settings.match || null;
    const servings = Math.max(1, Math.min(30, Math.round(Number(targetServings) || Number(record.servings) || 1)));
    const status = statusFor(record);
    const ingredients = (record.ingredients || []).map((item) => mappedIngredient(item, record, servings));
    const main = ingredients.filter((item) => item.role !== 'seasoning');
    const seasonings = ingredients.filter((item) => item.role === 'seasoning');
    const zhSteps = Array.isArray(record.steps_zh_hant) ? record.steps_zh_hant : [];
    const enSteps = Array.isArray(record.steps_en) ? record.steps_en : [];
    const stepCount = Math.max(zhSteps.length, enSteps.length);
    // Step wording is the source's, untouched. Only the heading is named, and only for the source's own
    // food-safety step, which is the one step that is not a cooking action.
    const steps = Array.from({ length: stepCount }, (_unused, index) => {
      const text = zhSteps[index] || '';
      const isSafety = /^食用前安全檢查/.test(text);
      return {
        number: index + 1,
        icon: isSafety ? '✓' : stepIcons[index % stepIcons.length],
        title: isSafety ? '安全檢查' : `步驟 ${index + 1}`,
        titleEn: isSafety ? 'Safety check' : `Step ${index + 1}`,
        text,
        textEn: enSteps[index] || '',
        minutes: null
      };
    });
    const equipment = Array.isArray(record.equipment) && record.equipment.length ? record.equipment.join('、') : record.method;
    const totalMinutes = Number(record.total_minutes) || Number(record.prep_minutes || 0) + Number(record.cook_minutes || 0);
    const createdAt = settings.createdAt || new Date().toISOString();
    const cuisineEn = String(record.cuisine || 'Recipe');
    const requestedTime = config ? Number(config.timeLimit) || 0 : 0;
    const timeWarning = requestedTime && totalMinutes > requestedTime
      ? [`來源食譜需約 ${totalMinutes} 分鐘，超過你揀嘅 ${requestedTime} 分鐘。`, `The source recipe takes about ${totalMinutes} minutes, longer than your ${requestedTime}-minute limit.`]
      : ['', ''];
    const defaultSourceInput = {
      ingredients: main.map((item) => item.nameZh || item.name).join('、'),
      seasonings: seasonings.map((item) => item.nameZh || item.name).join('、'),
      cuisine: cuisineEn === 'Cantonese' ? 'cantonese' : 'world-fusion',
      flavor: 'ginger-scallion',
      tools: ['pot']
    };
    const sourceInput = config
      ? {
        ingredients: String(config.ingredients || ''),
        seasonings: String(config.seasonings || ''),
        cuisine: config.cuisine,
        flavor: config.flavor,
        tools: Array.isArray(config.tools) ? config.tools.slice() : [],
        servings,
        timeLimit: Number(config.timeLimit) || totalMinutes,
        dietaryNeeds: String(config.dietaryNeeds || ''),
        strictPantry: Boolean(config.strictPantry),
        budgetEnabled: Boolean(config.budgetEnabled),
        visualEnabled: config.visualEnabled !== false,
        currency: config.currency,
        budgetLimit: Number(config.budgetLimit) || 0
      }
      : defaultSourceInput;
    let matchNotice = null;
    if (inputMatch) {
      const missingZh = inputMatch.missing.map((item) => item.nameZh).filter(Boolean);
      const missingEn = inputMatch.missing.map((item) => item.nameEn).filter(Boolean);
      const unused = inputMatch.unusedInputs || [];
      const unusedZh = unused.length ? `你輸入但呢份食譜冇用到：${unused.join('、')}。` : '';
      const unusedEn = unused.length ? `Not used by this recipe: ${unused.join(', ')}.` : '';
      matchNotice = inputMatch.missing.length
        ? [
          `已按你輸入嘅材料、菜式、口味、時間同廚具配對最接近嘅食譜。你未有列出：${missingZh.join('、')}。煮之前請確認已有。${unusedZh ? ` ${unusedZh}` : ''}`,
          `Matched the closest recipe using your ingredients, cuisine, flavor, time and tools. You did not list: ${missingEn.join(', ')}. Confirm you have them before cooking.${unusedEn ? ` ${unusedEn}` : ''}`
        ]
        : [
          `已按你輸入嘅材料、菜式、口味、時間同廚具配對食譜庫，所需材料全部有列出。${unusedZh ? ` ${unusedZh}` : ''}`,
          `Matched the recipe library using your ingredients, cuisine, flavor, time and tools; every required item was listed.${unusedEn ? ` ${unusedEn}` : ''}`
        ];
    }

    return {
      id: `library-${record.id}-${servings}`,
      createdAt,
      title: record.title_zh_hant,
      titleEn: record.title_en,
      description: status.long[0],
      descriptionEn: status.long[1],
      cuisine: { id: normalize(cuisineEn).replace(/[^a-z0-9]+/g, '-'), label: cuisineZh[cuisineEn] || cuisineEn, labelEn: cuisineEn },
      flavor: {
        id: normalize(record.flavor_name_en).replace(/[^a-z0-9]+/g, '-'),
        label: record.flavor_name_zh_hant || '',
        labelEn: record.flavor_name_en || '',
        icon: flavorIcon(record.flavor_scores)
      },
      tool: { id: 'source-method', icon: '🍳', short: equipment || '做法', shortEn: record.method || 'Method' },
      selectedTools: config && Array.isArray(config.tools) ? config.tools.slice() : [],
      servings,
      timeLimit: requestedTime || totalMinutes,
      estimatedMinutes: totalMinutes,
      timeWarning: timeWarning[0],
      timeWarningEn: timeWarning[1],
      dietaryNeeds: config ? String(config.dietaryNeeds || '') : '',
      ingredients: main,
      seasonings,
      steps,
      safety: {
        temperatures: record.food_safety ? [record.food_safety] : [],
        temperaturesEn: record.food_safety_en ? [record.food_safety_en] : [],
        warnings: [status.long[0], '致敏原標示只係按材料名稱推測；請檢查產品標籤同交叉污染風險。'],
        warningsEn: [status.long[1], record.allergen_disclaimer || 'Allergen flags are heuristic; check product labels and cross-contact risks.']
      },
      budget: null,
      budgetEnabled: false,
      visualEnabled: !config || config.visualEnabled !== false,
      image: 'assets/recipe-placeholder.svg',
      imageAlt: '未有授權成品相片；顯示食譜圖片預留位置',
      imageAltEn: 'No licensed finished-dish photo; recipe image placeholder shown',
      favorite: false,
      rating: 0,
      notes: '',
      sourceInput,
      importedMeta: {
        sourceId: record.id,
        scope: scopeOf(record),
        status: status.short,
        notice: status.long,
        sourceFile: record._codex_import && record._codex_import.source_file,
        sourceSha256: record._codex_import && record._codex_import.source_sha256,
        testKitchenValidated: false,
        readyToCook: false,
        incompleteEnglishMethod: enSteps.length < zhSteps.length,
        imagePromptEn: record.image_prompt_en || '',
        allergenFlags: record.allergen_flags_unverified || [],
        inputMatch: inputMatch ? {
          score: Math.round(inputMatch.score * 10) / 10,
          matched: inputMatch.matched,
          missing: inputMatch.missing,
          missingMain: inputMatch.missingMain,
          missingSeasonings: inputMatch.missingSeasonings,
          unusedInputs: inputMatch.unusedInputs || []
        } : null,
        matchNotice
      }
    };
  }

  return {
    normalize,
    scopeOf,
    isVisibleByDefault,
    statusFor,
    search,
    cuisineOptions,
    splitInput,
    foodConcepts: conceptRows,
    conceptsOf,
    pantryItemMatches,
    dietaryConflict,
    flavorScore,
    rankRecipes,
    matchRecipe,
    explainNoMatch,
    scaleQuantity,
    toAppRecipe
  };
});
