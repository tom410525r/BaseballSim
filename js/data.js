let SEED = new URLSearchParams(location.search).get('seed') || Math.random().toString(36).slice(2,10);
let _s = 0;
function seedInit(str){ _s = 1779033703; for(let i=0;i<str.length;i++){ _s = Math.imul(_s ^ str.charCodeAt(i), 3432918353); _s = _s<<13 | _s>>>19; } }
function R(){ _s|=0; _s = _s + 0x6D2B79F5 |0; let t = Math.imul(_s ^ _s>>>15, 1|_s); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; }
const ri=(a,b)=>a+Math.floor(R()*(b-a+1));
const pick=a=>a[Math.floor(R()*a.length)];
const chance=p=>R()*100<p;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const N0=(sd)=> (R()+R()+R()+R()-2)/2*sd*2;

const APP_VER='v1.5.0';
const ABL={sta:'體力',vel:'球速',ctl:'控球',brk:'變化球',con:'Contact',pow:'力量',spd:'速度',eye:'選球',rng:'守備範圍',fld:'接球',arm:'臂力',cat:'配球'};
const POS_AB={P:['sta','vel','ctl','brk'],C:['sta','con','pow','spd','eye','rng','fld','arm','cat'],IF:['sta','con','pow','spd','eye','rng','fld','arm'],OF:['sta','con','pow','spd','eye','rng','fld','arm'],TW:['sta','vel','ctl','brk','con','pow','spd','eye','rng','fld','arm']};
const POSN={P:'投手',C:'捕手',IF:'內野手',OF:'外野手',TW:'二刀流'};
const DPN={SS:'游擊手','2B':'二壘手','3B':'三壘手','1B':'一壘手', CF:'中外野手',RF:'右外野手',LF:'左外野手',DH:'指定打擊',C:'捕手'};

const DP_TH={ C:{CPBL1:46,NPB1:54,MLB:60}, SS:{CPBL1:50,NPB1:58,MLB:64}, CF:{CPBL1:49,NPB1:57,MLB:63}, '2B':{CPBL1:46,NPB1:53,MLB:59}, '3B':{CPBL1:44,NPB1:51,MLB:57}, RF:{CPBL1:43,NPB1:50,MLB:56}, LF:{CPBL1:41,NPB1:47,MLB:53}, '1B':{CPBL1:36,NPB1:42,MLB:48} };
const DP_BAR={CPBL1:45,NPB1:54,MLB:60};
const DP_MULT={SS:1.15,CF:1.15,C:1.12,'2B':1.05,'3B':1.05,RF:1.05,'1B':1.0,LF:1.0,DH:0.92};
const DP_RANK={SS:0,CF:0,'2B':1,'3B':2,RF:2,'1B':3,LF:3,DH:4,C:0};

const TEAM_COLOR={
  '中信兄弟':'#ffd800','統一獅':'#ff7f00','樂天桃猿':'#8b1a1a','富邦悍將':'#003f87','味全龍':'#c8102e','台鋼雄鷹':'#1a7a3a',
  '讀賣巨人':'#f97709','阪神虎':'#ffe201','橫濱DeNA':'#0a3ce0','廣島鯉魚':'#e60012','養樂多燕子':'#0a7bc2','中日龍':'#003a70',
  '軟銀鷹':'#f5c400','日本火腿':'#0a2d5c','羅德海洋':'#111111','樂天金鷲':'#8b0000','歐力士猛牛':'#0033a0','西武獅':'#1268b3',
  '洛杉磯道奇':'#005A9C','聖地牙哥教士':'#2F241D','舊金山巨人':'#FD5A1E','紐約洋基':'#0C2340','波士頓紅襪':'#BD3039',
  '紐約大都會':'#FF5910','費城費城人':'#E81828','亞特蘭大勇士':'#13274F','芝加哥小熊':'#0E3386','聖路易紅雀':'#C41E3A',
  '休士頓太空人':'#EB6E1F','德州遊騎兵':'#003278','西雅圖水手':'#005C5C','洛杉磯天使':'#BA0021','多倫多藍鳥':'#134A8E',
  '巴爾的摩金鶯':'#DF4601','坦帕灣光芒':'#092C5C','明尼蘇達雙城':'#002B5C','底特律老虎':'#0C2340','克里夫蘭守護者':'#E31937',
  '芝加哥白襪':'#27251F','堪薩斯市皇家':'#174885','奧克蘭運動家':'#003831','密爾瓦基釀酒人':'#FFC52F','匹茲堡海盜':'#FDB827',
  '邁阿密馬林魚':'#00A3E0','華盛頓國民':'#AB0003','亞利桑那響尾蛇':'#A71930','科羅拉多落磯':'#33006F','辛辛那提紅人':'#C6011F'
};
function teamChip(hex){
  const h=hex.replace('#','');
  const v=[0,2,4].map(i=>{ const c=parseInt(h.slice(i,i+2),16)/255; return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4); });
  const L=.2126*v[0]+.7152*v[1]+.0722*v[2];
  const dark=(L+.05)/.05 > 1.05/(L+.05);
  return {bg:hex,fg:dark?'#000000':'#ffffff',bd:dark?'rgba(0,0,0,.4)':'rgba(255,255,255,.45)'};
}
const CPBL_TEAMS=['中信兄弟','統一獅','樂天桃猿','富邦悍將','味全龍','台鋼雄鷹'];
const NPB_TEAMS=['讀賣巨人','阪神虎','橫濱DeNA','廣島鯉魚','養樂多燕子','中日龍','軟銀鷹','日本火腿','羅德海洋','樂天金鷲','歐力士猛牛','西武獅'];
const MLB_TEAMS=['洛杉磯道奇','聖地牙哥教士','舊金山巨人','紐約洋基','波士頓紅襪','紐約大都會','費城費城人','亞特蘭大勇士','芝加哥小熊','聖路易紅雀','休士頓太空人','德州遊騎兵','西雅圖水手','洛杉磯天使','多倫多藍鳥','巴爾的摩金鶯','坦帕灣光芒','明尼蘇達雙城','底特律老虎','克里夫蘭守護者','芝加哥白襪','堪薩斯市皇家','奧克蘭運動家','密爾瓦基釀酒人','匹茲堡海盜','邁阿密馬林魚','華盛頓國民','亞利桑那響尾蛇','科羅拉多落磯','辛辛那提紅人'];

const LV={
 CPBL2:{n:'中職二軍',par:34,min:30,g:80, org:'CPBL'}, CPBL1:{n:'中職一軍',par:44,min:41,g:120,org:'CPBL',top:'CPBL'},
 NPB2:{n:'日職二軍',par:47,min:44,g:100,org:'NPB'}, NPB1:{n:'日職一軍',par:53,min:50,g:143,org:'NPB',top:'NPB'},
 R:{n:'新人聯盟',par:41,min:39,g:55, org:'MiLB'}, A1:{n:'1A',par:45,min:43,g:110,org:'MiLB'},
 A2:{n:'2A',par:49,min:47,g:120,org:'MiLB'}, A3:{n:'3A',par:54,min:52,g:130,org:'MiLB'},
 MLB:{n:'大聯盟',par:59,min:56,g:162,org:'MiLB',top:'MLB'}
};
const PATHS={CPBL:['CPBL2','CPBL1'],NPB:['NPB2','NPB1'],MiLB:['R','A1','A2','A3','MLB']};
const HS_CUPS=['木棒聯賽','黑豹旗','玉山盃'];
const U_CUPS=['大學春季聯賽','大專盃'];

const EVENTS=[
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
 {n:'季中低潮',for:'*',gt:'靠著調整心態走出來，更強了',bt:'低潮拖了一個月',g:{eye:1,ctl:1,sta:1},b:{con:-2,brk:-1,sta:-1}},
];

const TIER_TH={CPBL:[12000,7000,4300,2100],NPB:[8500,6200,3000,1900],MLB:[7500,6200,3500,1900]};
const LG_N={CPBL:'中職',NPB:'日職',MLB:'大聯盟',MINOR:'小聯盟／二軍'};
let CHEER=['林曉晴','陳若彤','張沛慈','王詠恩','許昀熙','蘇采蓁','周依潔','郭芷萱'];
const CHEER_DEFAULT=CHEER.slice();

const FAN={
 0:['{n}退休了……我的青春也跟著結束了 QQ','以後帶小孩進場，我會指著引退背號說：爸爸看過{n}打球。','外電已經在算名人堂得票率了，根本沒有懸念','謝謝你把台灣棒球帶到世界的舞台上','這種等級的選手，一個世代只會出現一個','引退試合門票秒殺，黃牛價已經翻五倍了'],
 1:['{n}確定引退，推文區已經滿滿的 QQ','明星賽常客就這樣說再見了，唉','生涯數據攤開來還是很漂亮，值得一面背號布幕','謝謝你每一次的全力奔跑，辛苦了','小時候牆上貼的海報就是他，時代的眼淚'],
 2:['稱不上超級巨星，但每天打開轉播都看得到他，這樣就夠了','默默扛了這麼多年，辛苦了','這種工兵型選手才是一支球隊真正的骨幹','數據不會說謊，穩定就是他最大的天賦'],
 3:['板凳暖了這麼多年，也是一種浪漫啦','至少他真的站上過職棒舞台，比鍵盤上的我們都強','代打人生，謝謝那幾支關鍵安打','二軍發電機引退，只有鐵粉會記得，但我們記得'],
 4:['欸這誰？……查了一下，原來真的打過職業喔','棒球真的好難，祝福第二人生順利','又一個被現實打敗的追夢人，唏噓','看板留言只有三則，其中一則還是他本人回的'],
};

let S = null;
let stepQ = [];

function newState(name,pos,role){
  const ab={}; POS_AB[pos].forEach(k=>ab[k]=ri(20,32));
  if(pos==='P'){ab.vel+=ri(0,6);ab.brk+=ri(0,4);}
  else if(pos==='TW'){ab.vel+=ri(0,6);ab.pow+=ri(0,6);}
  else {ab.con+=ri(0,6);ab.pow+=ri(0,4);}
  const pot={}, sh=POS_AB[pos].slice();
  for(let i=sh.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=sh[i];sh[i]=sh[j];sh[j]=t;}
  if(pos==='TW'){
    pot.vel = ri(70,80); pot.brk = ri(50,65); pot.ctl = ri(50,65);
    pot.pow = ri(70,80); pot.con = ri(50,65); pot.eye = ri(50,65);
    pot.sta = ri(65,80); pot.spd = ri(50,70); pot.rng = ri(40,60); pot.fld = ri(45,65); pot.arm = ri(70,80);
  } else if(pos==='P'){
    sh.forEach((k,i)=>{ pot[k]= i===0?ri(70,80) : i===1?ri(58,68) : i===2?ri(50,60) : ri(44,54); });
  } else {
    sh.forEach((k,i)=>{ pot[k]= i===0?ri(72,80) : i===1?ri(64,74) : i===2?ri(56,68) : ri(46,62); });
  }
  const hsMap={'平鎮高中':1,'穀保家商':1,'高苑工商':2,'北科附工':2,'普門高中':3,'東大體中':3};
  const schools=Object.keys(hsMap);
  const myTeam=schools[Math.floor(R()*schools.length)];
  return {name,pos,role:pos==='P'?null:null,age:16,year:2026,stage:'HS',stageYr:1,pot,
    hsMap,hsTier:hsMap[myTeam],team:myTeam,potSum0:Object.values(pot).reduce((a,b)=>a+b,0),
    league:null,org:null,orgTeam:null,teamTally:{CPBL:{},NPB:{},MLB:{}},
    ab,traits:{genius:false,glass:false,iron:false,scum:false,
      late:false,disc:false,academy:false,intlace:false,franchise:false,clutch:false,phoenix:false,combo:false,onetool:false,rubber:false,legend:false,
      yips:false,distract:false,cancer:false,ambience:false,goldcloth:false,thief:false,mrteam:false,confidante:false,smallschool:false,grinder:false,rainbow:false,taiwan:false,leader:false},
    removed:[],
    cntSave:0,cntSaveWin:0,cntSnack:0,cntBoldWin:0,cntBoldFail:0,samePick:0,samePickKey:null,teamYears:0,
    six:0,bigInj:0,ironStreak:0,npbYears:0,
    injNext:0,tmpInj:0,rehab:0,salary:0,pool:0,seasonFactor:1,
    stats:{CPBL:null,NPB:null,MLB:null,MINOR:null},honors:[],intlCount:0,intlLock:null,intlStat:{G:0,PA:0,AB:0,H:0,HR:0,RBI:0,IP:0,SO:0,ER:0,W:0,SV:0},intlBest:null,dpos:null,dposYears:{},roleYears:{},tradeRefuse:0,champThisTeam:false,svc:0,svcOrg:null,faElig:false,tradeHeat:0,complainCount:0,demotionRefused:false,tj:0,tjCount:0,effort:'普通',tjSuccess:0,love:{st:'single',partner:null,kids:0,caught:0,affairs:0,exes:[],dyrs:0,datedTimes:0},traits2:{},log:[],ct:null,done:false};
}

function blankStat(){return {yr:0,G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,AS:0,DEF:0,WAR:0};}

const fmtMoney=w=>{ const y=Math.floor(w/10000),m=Math.round(w%10000); return (y?y+'億':'')+(m?m.toLocaleString()+'萬':(y?'':'0萬')); };
