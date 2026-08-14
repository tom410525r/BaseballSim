// ==================== 玩家狀態初始化與 RNG 亂數核心 ====================
let SEED = new URLSearchParams(location.search).get('seed') || Math.random().toString(36).slice(2,10);
let _s = 0;
let S = null, stepQ = [];

function seedInit(str){ _s = 1779033703; for(let i=0;i<str.length;i++){ _s = Math.imul(_s ^ str.charCodeAt(i), 3432918353); _s = _s<<13 | _s>>>19; } }
function R(){ _s|=0; _s = _s + 0x6D2B79F5 |0; let t = Math.imul(_s ^ _s>>>15, 1|_s); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; }
const ri = (a,b) => a + Math.floor(R()*(b-a+1));
const pick = a => a[Math.floor(R()*a.length)];
const chance = p => R()*100 < p;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const N0 = (sd) => (R()+R()+R()+R()-2)/2*sd*2;

const fmtMoney = w => { const y=Math.floor(w/10000),m=Math.round(w%10000); return (y?y+'億':'')+(m?m.toLocaleString()+'萬':(y?'':'0萬')); };

function newState(name,jersey,pos,role){
 const ab={}; POS_AB[pos].forEach(k=>ab[k]=ri(20,32));
 if(pos==='P'){ab.vel+=ri(0,6);ab.brk+=ri(0,4);} else {ab.con+=ri(0,6);ab.pow+=ri(0,4);}
 
 const pot={}, sh=(pos==='C'?POS_AB[pos].filter(k=>k!=='rng'):POS_AB[pos].slice());
 for(let i=sh.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=sh[i];sh[i]=sh[j];sh[j]=t;}
 if(pos==='P'){
   sh.forEach((k,i)=>{ pot[k]= i===0?ri(70,80) : i===1?ri(58,68) : i===2?ri(50,60) : ri(44,54); });
 } else {
   sh.forEach((k,i)=>{ pot[k]= i===0?ri(72,80) : i===1?ri(64,74) : i===2?ri(56,68) : ri(46,62); });
   if(pos==='C')pot.rng=ri(32,40); 
 }
 
 const hsMap={'平鎮高中':1,'穀保家商':1,'高苑工商':2,'北科附工':2,'普門高中':3,'東大體中':3};
 const schools=Object.keys(hsMap);
 const myTeam=schools[Math.floor(R()*schools.length)];
 return {name,jersey,pos,role:pos==='P'?null:null,age:16,year:2026,stage:'HS',stageYr:1,pot,
   hsMap,hsTier:hsMap[myTeam],team:myTeam,potSum0:Object.values(pot).reduce((a,b)=>a+b,0),
   league:null,org:null,orgTeam:null,lastCpblTeam:null,teamTally:{CPBL:{},NPB:{},MLB:{}},
   ab,traits:{genius:false,glass:false,iron:false,scum:false,
     late:false,disc:false,academy:false,intlace:false,franchise:false,clutch:false,phoenix:false,combo:false,onetool:false,rubber:false,legend:false,
     yips:false,distract:false,cancer:false,ambience:false,goldcloth:false,thief:false,mrteam:false,confidante:false,smallschool:false,grinder:false,rainbow:false,taiwan:false},
   removed:[], 
   cntSave:0,cntSaveWin:0,cntSnack:0,cntBoldWin:0,cntBoldFail:0,samePick:0,samePickKey:null,teamYears:0,
   six:0,bigInj:0,ironStreak:0,npbYears:0,
   injNext:0,tmpInj:0,rehab:0,marketInjury:'healthy',salary:0,pool:0,seasonFactor:1,
   stats:{CPBL:null,NPB:null,MLB:null,MINOR:null},honors:[],intlCount:0,intlLock:null,intlStat:{G:0,PA:0,AB:0,H:0,HR:0,RBI:0,IP:0,SO:0,ER:0,W:0,SV:0},intlLog:[],intlBest:null,dpos:null,dposYears:{},roleYears:{},tradeRefuse:0,champThisTeam:false,svc:0,svcOrg:null,faElig:false,tradeHeat:0,complainCount:0,demotionRefused:false,tj:0,tjCount:0,tjCrises:0,tjSecondYear:null,effort:'普通',tjSuccess:0,lastLv:null,love:{st:'single',partner:null,kids:0,caught:0,affairs:0,exes:[],dyrs:0,datedTimes:0},traits2:{},log:[],ct:null,done:false};
}

function playerName(){ return `${S.name} #${S.jersey}`; }
function blankStat(){return {yr:0,G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,AS:0,DEF:0,DPG:{}};}
function bucketOf(lv){ const l=lv&&LV[lv]; return l&&l.top?l.top:'MINOR'; }
