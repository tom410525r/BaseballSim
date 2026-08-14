// ==================== 基礎設定與常數資料庫 ====================

const APP_VER = 'v1.5.0';

// 能力屬性分類與縮寫
const POS_AB = {
    P: ['vel','ctl','brk','sta'],
    C: ['con','pow','eye','spd','rng','fld','arm','cat'],
    IF: ['con','pow','eye','spd','rng','fld','arm'],
    OF: ['con','pow','eye','spd','rng','fld','arm'],
    TW: ['vel','ctl','brk','sta','con','pow','eye','spd','rng','fld','arm']
};

const POSN = { P: '投手', C: '捕手', IF: '內野手', OF: '外野手', TW: '二刀流' };
const DPN = { C:'捕手', '1B':'一壘手', '2B':'二壘手', '3B':'三壘手', SS:'游擊手', LF:'左外野', CF:'中外野', RF:'右外野', DH:'指定打擊' };
const ABL = { vel:'球速', ctl:'控球', brk:'變化', sta:'體力', con:'打擊', pow:'力量', eye:'選球', spd:'速度', rng:'範圍', fld:'守備', arm:'臂力', cat:'接捕' };

// 業餘賽事清單
const HS_CUPS = ['黑豹旗', '木棒聯賽', '玉山盃'];
const U_CUPS = ['大專棒球聯賽', '梅花旗', '春季聯賽'];

// 職業球隊與聯盟
const CPBL_TEAMS = ['台中猛瑪', '府城雄獅', '桃園金剛', '新北騎士', '台北恐龍', '高雄神鵰'];
const NPB_TEAMS = ['東京大人', '大阪猛虎', '福岡海鷗', '橫濱星辰', '廣島海灣', '名古屋鯉魚'];
const MLB_TEAMS = ['波士頓襪王', '紐約條紋', '洛杉磯光芒', '芝加哥小熊', '灣區大人', '德州競技者'];

function teamListOf(org) {
    if(org === 'CPBL') return CPBL_TEAMS;
    if(org === 'NPB') return NPB_TEAMS;
    if(org === 'MiLB' || org === 'MLB') return MLB_TEAMS;
    return CPBL_TEAMS;
}

// 球隊代表色 (用於 UI 與結算圖)
const TEAM_COLOR = {
    '台中猛瑪': '#ffc95c', '府城雄獅': '#e2695c', '桃園金剛': '#8a3a3a', 
    '新北騎士': '#2874a6', '台北恐龍': '#8a6a2a', '高雄神鵰': '#3c6a4c',
    '東京大人': '#ffc95c', '大阪猛虎': '#ffc95c', '福岡海鷗': '#ffffff', 
    '橫濱星辰': '#2874a6', '廣島海灣': '#e2695c', '名古屋鯉魚': '#8a3a3a',
    '波士頓襪王': '#e2695c', '紐約條紋': '#ffffff', '洛杉磯光芒': '#2874a6', 
    '芝加哥小熊': '#2874a6', '灣區大人': '#ffc95c', '德州競技者': '#8a3a3a'
};

function teamChip(hex) {
    return { bg: hex, bd: hex, fg: (hex === '#ffffff' || hex === '#fff') ? '#000000' : '#ffffff' };
}

// 層級(Level)與成績基準(Par)
const LV = {
    CPBL2: {n:'中職二軍', par: 40, g: 80,  org:'CPBL', min:0},
    CPBL1: {n:'中職一軍', par: 50, g: 120, org:'CPBL', top:'CPBL', min:45},
    NPB2:  {n:'日職二軍', par: 48, g: 110, org:'NPB',  min:0},
    NPB1:  {n:'日職一軍', par: 62, g: 143, org:'NPB',  top:'NPB', min:55},
    R:     {n:'新人聯盟', par: 40, g: 60,  org:'MiLB', min:0},
    A1:    {n:'1A',     par: 46, g: 132, org:'MiLB', min:0},
    A2:    {n:'2A',     par: 52, g: 138, org:'MiLB', min:0},
    A3:    {n:'3A',     par: 58, g: 150, org:'MiLB', min:0},
    MLB:   {n:'大聯盟',  par: 70, g: 162, org:'MiLB', top:'MLB', min:65}
};

const LG_N = { CPBL: '中華職棒', NPB: '日本職棒', MLB: '美國職棒', MINOR: '小聯盟' };

// ==================== 守備與評價門檻 ====================

// 守位綜合評分門檻
const DP_BAR = { CPBL1:50, NPB1:62, MLB:70, CPBL2:40, NPB2:48, R:40, A1:46, A2:52, A3:58 };

const DP_TH = {
    SS:  {CPBL1:52, NPB1:64, MLB:72, CPBL2:42, NPB2:50, R:42, A1:48, A2:54, A3:60},
    CF:  {CPBL1:51, NPB1:63, MLB:71, CPBL2:41, NPB2:49, R:41, A1:47, A2:53, A3:59},
    C:   {CPBL1:50, NPB1:62, MLB:70, CPBL2:40, NPB2:48, R:40, A1:46, A2:52, A3:58},
    '2B':{CPBL1:49, NPB1:61, MLB:69, CPBL2:39, NPB2:47, R:39, A1:45, A2:51, A3:57},
    '3B':{CPBL1:48, NPB1:60, MLB:68, CPBL2:38, NPB2:46, R:38, A1:44, A2:50, A3:56},
    RF:  {CPBL1:47, NPB1:59, MLB:67, CPBL2:37, NPB2:45, R:37, A1:43, A2:49, A3:55},
    LF:  {CPBL1:45, NPB1:57, MLB:65, CPBL2:35, NPB2:43, R:35, A1:41, A2:47, A3:53},
    '1B':{CPBL1:42, NPB1:54, MLB:62, CPBL2:32, NPB2:40, R:32, A1:38, A2:44, A3:50}
};

const DP_RANK = { SS:8, CF:7, C:6, '2B':5, '3B':4, RF:3, LF:2, '1B':1, DH:0 };
const DP_MULT = { SS:1.15, CF:1.10, C:1.15, '2B':1.05, '3B':1.05, RF:1.00, LF:0.95, '1B':0.85, DH:0.80 };

// 生涯評價分數門檻：[傳奇, 明星, 主力, 替補]
const TIER_TH = { 
    CPBL: [60, 40, 20, 5], 
    NPB:  [70, 45, 25, 5], 
    MLB:  [80, 50, 30, 5] 
};

function bucketOf(lv) { 
    return LV[lv] && LV[lv].org === 'MiLB' && lv !== 'MLB' ? 'MINOR' : (LV[lv] ? LV[lv].org : 'MINOR'); 
}

function tierOf(b) {
    const t = S.stats[b]; if(!t) return {name:'未知評價', sc:0, i:4};
    const isP = S.pos === 'P' || S.pos === 'TW';
    let sc = 0;
    if(isP) {
        const p = t.pitchStats || t;
        sc = p.WAR * 2.5 + (p.W || 0) * 0.8 + (p.SV || 0) * 0.8 + (p.HLD || 0) * 0.4 + (p.SO || 0) * 0.05;
    } else {
        sc = t.WAR * 2.5 + (t.H || 0) * 0.1 + (t.HR || 0) * 0.8 + (t.SB || 0) * 0.2 + (t.RBI || 0) * 0.2;
    }
    sc += (t.AS || 0) * 5;
    
    const th = TIER_TH[b];
    let i = 4, name = '過客';
    if(sc >= th[0]) { i = 0; name = '傳奇球星'; }
    else if(sc >= th[1]) { i = 1; name = '明星球員'; }
    else if(sc >= th[2]) { i = 2; name = '主力先發'; }
    else if(sc >= th[3]) { i = 3; name = '稱職替補'; }
    
    return {name, sc: Math.round(sc), i};
}

// 引退球迷留言池
const FAN = {
    0: ['神！', '沒有他的{n}不是{n}', '球衣絕對要退休的', '從小看他打球長大', '名人堂穩了'],
    1: ['辛苦了，{n}', '球隊的基石', '偶爾會失常，但還是很可靠', '這幾年真的靠他了', '再見了，{n}'],
    2: ['很棒的綠葉', '穩定輸出的好用球員', '少了他滿不習慣的', '祝福{n}未來順利'],
    3: ['感謝{n}的付出', '好聚好散', '打不出來也是沒辦法'],
    4: ['終於退了', '佔位置的走囉', '辛苦了，但真的不行', '再見']
};

// ==================== 隨機事件池 ====================

const CHEER = ['林襄', '峮峮', '籃籃', '李多慧', '慈妹', '孟潔', 'Yuri', '短今', '秀秀子', '瑟七', '一粒', '安芝儇', '邊荷律', '李雅英', '小迪'];

const EVENTS = [
    {n:'打擊機特訓',for:'B',gt:'手感火燙，擊球點完全咬中',bt:'越打越糊，姿勢跑掉了',g:{con:2},b:{con:-2}},
    {n:'重量訓練週期',for:'A',gt:'深蹲破 PR，全身充滿力量',bt:'操之過急，肌肉緊繃了好幾週',g:{pow:2,sta:1},b:{sta:-2}},
    {n:'牛棚加練',for:'P',gt:'新的握法找到了，尾勁明顯提升',bt:'越丟越歪，投球機制亂掉',g:{brk:2},b:{ctl:-2}},
    {n:'長傳接訓練',for:'A',gt:'雷射肩養成中',bt:'肩膀有點緊，教練喊停',g:{arm:2},b:{arm:-2}},
    {n:'影像分析課',for:'*',gt:'看穿投打習性，判斷力大增',bt:'資訊爆炸，站上場反而想太多',g:{eye:2,cat:2,ctl:1},b:{eye:-2,ctl:-1}},
    {n:'跑壘特訓',for:'A',gt:'起跑判斷進步神速',bt:'拉傷大腿後側，休了兩週',g:{spd:2},b:{spd:-1,inj:5}},
    {n:'守備千球練習',for:'A',gt:'手套像吸塵器一樣',bt:'吃了無數個彈跳球，信心受挫',g:{rng:1,fld:2},b:{fld:-2}},
    {n:'觸身球驚魂',for:'*',gt:'側身閃過，反應快得嚇人',bt:'結結實實吃了一顆速球',g:{spd:1},b:{inj:12}},
    {n:'媒體專訪',for:'*',gt:'應對得體，人氣上升，打球更有動力',bt:'失言上了新聞，壓力影響狀態',g:{sta:1},b:{con:-1,ctl:-1,sta:-1}},
    {n:'教練團關注',for:'*',gt:'獲得單獨指導的機會',bt:'被盯上缺點，一直被要求改動作',g:{rand:2},b:{rand:-2}},
    {n:'伙食與睡眠計畫',for:'*',gt:'體脂下降，恢復速度變快',bt:'水土不服，腸胃炎折騰一週',g:{sta:2},b:{sta:-1,inj:4}},
    {n:'學長／老將指點',for:'*',gt:'一句話點醒夢中人',bt:'學了不適合自己的招，繞了遠路',g:{rand:2},b:{rand:-2}},
    {n:'球速測定日',for:'P',gt:'雷達槍跳出生涯新高',bt:'出力過猛，手肘發炎',g:{vel:2},b:{inj:10}},
    {n:'配球讀書會',for:'P',gt:'進壘點的想像力打開了',bt:'想得太多，投得綁手綁腳',g:{ctl:2},b:{brk:-2}},
    {n:'宵夜文化',for:'*',gt:'控制住了，體態維持得宜',bt:'體重直線上升，第一步變慢了',g:{sta:1},b:{spd:-2,sta:-1,rng:-1}},
    {n:'場外代言邀約',for:'PRO',gt:'商演安排得宜，多賺零用錢也沒荒廢訓練',bt:'行程太滿，訓練量明顯掉了',g:{sta:1},b:{rand:-2,sta:-1}},
    {n:'季中低潮',for:'*',gt:'靠著調整心態走出來，更強了',bt:'低潮拖了一個月',g:{eye:1,ctl:1,sta:1},b:{con:-2,brk:-1,sta:-1}}
];
