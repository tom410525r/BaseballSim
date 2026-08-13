function evOdds(){
  let base=(S.traits.genius||S.traits.late||S.traits.clutch)?70:50;
  if(S.traits.thief)base-=10; const boldPen=S.traits.clutch?0:15;
  return {safe:Math.min(95,base+20), norm:base, bold:base-boldPen};
}
function drawEvents(n,done){
  if(n<=0){ done(); return; }
  choose('',[{t:`抽事件卡（剩 ${n} 張）`,main:true,f:()=>{
    const pool=EVENTS.filter(e=>e.for==='*'||(e.for==='P'&&(S.pos==='P'||S.pos==='TW'))||((e.for==='A'||e.for==='B')&&S.pos!=='P')||(e.for==='PRO'&&S.stage==='PRO'));
    const ev=pick(pool); const od=evOdds();
    const after=()=>{ board(1); drawEvents(n-1,done); };
    choose(`事件｜${ev.n} — 你要怎麼應對？`,[
      {t:'全力一搏',warn:true,s:`成功率 ${od.bold}%｜${S.traits.clutch?'成功 +4／失敗僅 −2':'加成／減益幅度最大（±3）'}`,f:()=>{resolveEvent(ev,'bold',after);}},
      {t:'照常執行',main:true,s:`成功率 ${od.norm}%｜標準幅度（±2）`,f:()=>{resolveEvent(ev,'norm',after);}},
      {t:'保守應對',s:`成功率 ${od.safe}%｜加成／減益幅度最小（±1）`,f:()=>{resolveEvent(ev,'safe',after);}}]);
  }}]);
}
let CHEER_SAFE=['馮海莎'];
function datePool(){ if(CHEER_SAFE.length>=CHEER.length) return CHEER_SAFE.slice(); return CHEER_SAFE.concat(CHEER.slice(CHEER_SAFE.length)); }
function affairPool(){ return CHEER.slice(); }

function loveEvent(next){
  const L=S.love;
  if(S.stage!=='PRO'||S.age<20){ next(); return; }
  if(L.st==='dating'){
    L.dyrs=(L.dyrs||0)+1; const y=L.dyrs;
    const cheatPen=(L.cheatYr===S.year-1||L.cheatYr===S.year)?30:0;
    const bkP=(y>=4?20+(y-4)*15:0)+cheatPen;
    if(bkP>0&&chance(bkP)){
      const k1=pick(POS_AB[S.pos]),k2=pick(POS_AB[S.pos]);
      const g1=addAb(k1,-3),g2=addAb(k2,-3); board(1);
      const ex=L.partner; L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0;
      card('bad','分手',`${cheatPen?'那晚的事她其實都知道。':''}交往 ${y} 年，婚期一延再延。<b class="hl">${ex}</b> 最後留下一句：「我等不到了。」轉身離開。整個休賽季你魂不守舍——<b class="dn">${ABL[k1]} ${g1}、${ABL[k2]} ${g2}</b>。`);
      next(); return; }
    const ask=()=>proposalAsk(next);
    if(chance(30)){
      const r=R()*100;
      if(r<40){ const t=pick(affairPool().filter(n=>n!==L.partner));
        choose(`聚餐散場，${t} 說順路想搭你的車`,[
          {t:'讓她上車（賭一把）',warn:true,s:'沒被抓到＝體力提升｜被抓到＝能力下跌、當年分手率+30%',f:()=>{
            L.affairs++;
            if(chance(55)){ const gt=loveGainTxt('sta',2); board(1); card('bad','深夜兜風',`沒有人拍到。你把方向盤握得很緊——${gt}。`); ask(); }
            else loveCaughtDating(next); }},
          {t:`「不順路。」直接載 ${L.partner} 回家`,main:true,s:'感情穩固，絕對不虧',f:()=>{
            const gt=loveGainTxt('sta',1); board(1); card('good','正確答案',`你傳訊息給 ${L.partner}：「馬上到。」——${gt}。`); ask(); }}]); return; }
      if(r<70){ const gt=loveGainTxt('sta',1); board(1); card('good','明星賽放閃',`明星賽表演賽，鏡頭掃到看台上的 <b class="hl">${L.partner}</b>，你隔著全場比了一個手勢——${gt}。`); ask(); return; }
      const gt=loveGainTxt('sta',1); board(1); card('good','愛情長跑',`交往邁入第 ${y} 年。沒有大新聞，只有機場出口那杯她替你買好的熱美式——${gt}。`); ask(); return; }
    ask(); return;
  }
  const fire=(L.st==='married'&&L.kids===0)?40:(L.st==='single'||L.st==='divorced')?40:30;
  if(!chance(fire)){ next(); return; }
  if(L.st==='single'||L.st==='divorced'){
    const p=pick(datePool());
    card('info','場外話題',`你和啦啦隊女神 <b class="hl">${p}</b> 被拍到球場外同框，緋聞登上娛樂版頭條。${L.exes.length?'（評論區：「離過婚還這麼搶手」）':''}`);
    choose('記者把麥克風遞到你面前：「兩位是在交往嗎？」',[
      {t:'大方承認：「請大家祝福我們」',s:'還要看她那邊敢不敢承認',f:()=>{
        if(chance(65)){ L.st='dating'; L.partner=p; L.dyrs=0; L.datedTimes=(L.datedTimes||0)+1;
          const gt=loveGainTxt('sta',1); board(1);
          card('gold','戀情公開',`<b class="hl">${p}</b> 在社群發出十指近扣的照片：「謝謝大家的祝福。」——${gt}。你們正式交往了。`);
          if(L.datedTimes>=3&&L.kids===0&&!S.traits.married&&!S.traits.confidante){ S.traits.confidante=true;
            card('gold','隱藏稱號：閨中密友','第三段戀情，還是走到了同樣的結局。「我愛上了你，你卻只把我當好姊妹。」'); board(1); }
        }else{ card('bad','單方面承認',`她隔天透過經紀公司否認：「只是普通朋友。」據傳啦啦隊<b class="dn">禁愛令</b>壓力不小。`); }
        next(); }},
      {t:'笑而不答，快步走過',main:true,s:'不承認就沒有下文',f:()=>{ card('info','未完待續','緋聞燒了三天就退燒。'); next(); }}]); return;
  }
  if(L.kids<4&&chance([65,45,30,20][L.kids])){
    L.kids++; const kk=pick(POS_AB[S.pos]); const gt=loveGainTxt(kk,2); board(1);
    card('gold','新生命',`${L.partner} 平安生下你們的第 <b class="hl">${L.kids}</b> 個孩子——${gt}。`); next(); return;
  }
  const r=R()*100;
  if(r<40){
    const t=pick(affairPool().filter(n=>n!==L.partner));
    choose(`客場飯店酒吧，${t} 傳來訊息：「睡了嗎？」`,[
      {t:'赴約（賭一把）',warn:true,s:'沒被抓到＝體力提升｜被抓到＝能力下跌、婚姻危機',f:()=>{
        L.affairs++;
        if(chance(55)){ const gt=loveGainTxt('sta',2); board(1); card('bad','深夜行程','你僥倖沒被拍到。——'+gt); next(); }
        else loveCaught(next); }},
      {t:'回訊息：「陪小孩讀完故事書了，晚安」',main:true,s:'家庭和睦，絕對不虧',f:()=>{
        const gt=loveGainTxt('sta',1); board(1); card('good','家的方向','你把手機扣在桌上，撥了視訊回家。——'+gt); next(); }}]); return; }
  if(r<70&&L.kids>0){ const gt=loveGainTxt('sta',1); board(1); card('good','球場邊的父親','你被拍到賽前隔著護網教孩子怎麼戴手套——'+gt); next(); return; }
  const gt=loveGainTxt('sta',1); board(1); card('good','結婚紀念日','結婚紀念日，你陪 <b class="hl">'+L.partner+'</b> 回到當年辦婚禮的場地——'+gt); next();
}
function divorceRec(){ const L=S.love; L.exes.push({name:L.partner,kids:L.kids}); L.st='divorced'; L.partner=null; L.kids=0; }
function loveCaught(next){
  const L=S.love; L.caught++;
  const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3); let extra='';
  if(L.caught>=2){
    if(!S.traits.scum){ S.traits.scum=true; card('bad','隱藏屬性解鎖：渣男','第二次被逮個正著——<b class="dn">每次外遇被抓到，全能力 −5</b>。'); }
    POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); }); extra='<b class="dn">全能力 −5</b>。';
  }
  board(1); card('bad','頭版醜聞',`狗仔鏡頭鋪滿版面。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
  choose(`${L.partner} 把離婚協議書放在餐桌上`,[
    {t:'跪著道歉，求她再給一次機會',s:'成功保住婚姻',f:()=>{
      if(chance(40)){ card('info','低谷之後','長談了一整夜。最後說：「為了孩子——最後一次。」'); next(); }
      else{ const k2=pick(POS_AB[S.pos]); const g2=addAb(k2,-2); const ex=L.partner; divorceRec(); board(1); card('bad','道歉無效',`正式離婚——<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } }},
    {t:'簽字離婚',f:()=>{ const ex=L.partner; divorceRec(); card('bad','離婚','你在協議書上簽了名。'); next(); }}]);
}
function proposalAsk(next){
  const L=S.love; if(L.st!=='dating'){ next(); return; }
  choose(`交往第 ${L.dyrs} 年——${L.partner} 看著別人的婚禮影片看了很久`,[
    {t:'就是現在——求婚',s:'固定加成：全體力提升、本季更不容易受傷',f:()=>{
      L.st='married'; L.kids=0; L.dyrs=0;
      const gTxt=loveGainTxt('sta',2)+'、'; S.tmpInj-=5; board(1);
      card('gold','婚禮','你在主場本壘板後方單膝跪地。紅毯用壘包排成——'+gTxt+'本季受傷機率 <b class="up">−5%</b>。'); next(); }},
    {t:'再存一點錢吧',main:true,s:'她沒說什麼',f:()=>{ card('info','再等等','她關掉影片，笑著說沒事。'); next(); }}]);
}
function loveCaughtDating(next){
  const L=S.love; L.caught++; L.cheatYr=S.year;
  const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3); let extra='';
  if(L.caught>=2){
    if(!S.traits.scum){ S.traits.scum=true; card('bad','隱藏屬性解鎖：渣男','第二次被逮個正著——<b class="dn">每次劈腿被抓到，全能力 −5</b>。'); }
    POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); }); extra='<b class="dn">全能力 −5</b>。';
  }
  board(1); card('bad','劈腿曝光',`行車紀錄器畫面流出。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
  choose(`${L.partner} 已讀不回三天後，終於答應見面`,[
    {t:'道歉，求她再給一次機會',s:'成功保住感情',f:()=>{
      if(chance(40)){ card('info','低谷之後','她哭著罵完，最後說：「最後一次。」'); next(); }
      else{ const k2=pick(POS_AB[S.pos]); const g2=addAb(k2,-2); const ex=L.partner; L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0; board(1); card('bad','道歉無效',`封鎖了所有聯絡方式——<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } }},
    {t:'坦然分手',f:()=>{ const ex=L.partner; L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0; card('bad','分手',ex+' 的限時動態只有一片黑。'); next(); }}]);
}
function loveGainTxt(k,amt){
  const before=S.pendStat||0; const g=addAbStat(k,amt); const over=(S.pendStat||0)-before;
  if(g>0)return `<b class="up">${ABL[k]} +${g}</b>`; return `${ABL[k]} 能力加點，但不足以提升一級`;
}
function addAbStat(k,amt){
  if(amt<=0)return addAb(k,amt);
  const pk=(S.pot&&S.pot[k])||62, isP=(S.pos==='P'||S.pos==='TW');
  let cur=S.ab[k], bud=amt, cr=(S.carry&&S.carry[k])||0, gained=0;
  if(cur>=pk){ S.pendStat=(S.pendStat||0)+bud; return 0; }
  while(bud>0&&cur<pk){
    let c=isP?(cur>=66?7:cur>=58?4:cur>=50?2:1):(cur>=72?3:cur>=64?2:1);
    bud--; cr++; if(cr>=c){cr-=c;cur++;gained++;}
  }
  if(!S.carry)S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
  if(bud>0)S.pendStat=(S.pendStat||0)+bud; return gained;
}
function statBonus(pts,out){ S.pendStat=(S.pendStat||0)+pts; out.push(`<span class="up">狀態火燙（本季成績加成 ×${pts}）</span>`); }

function resolveEvent(ev,mode,done){
  done=done||function(){}; const od=evOdds();
  if(mode==='safe')S.cntSave; let good,tag;
  if(mode==='safe'){ good=chance(od.safe); tag='保守應對'; }
  else if(mode==='bold'){ good=chance(od.bold); tag='全力一搏'; if(good)S.cntBoldWin++; else S.cntBoldFail++; }
  else { good=chance(od.norm); tag=''; }
  if(mode==='safe'&&good)S.cntSaveWin=(S.cntSaveWin||0)+1;
  if((ev.n==='宵夜文化'||ev.n==='場外代言邀約')&&mode!=='safe'&&!good)S.cntSnack++;
  let mag=mode==='safe'?1:mode==='bold'?3:2;
  if(mode==='bold'&&S.traits.clutch)mag=good?4:2;
  const fx=good?ev.g:ev.b; let out=[],touched=false;
  const applyAbil=(k,dir)=>{
    const step=dir*mag;
    if(dir>0){
      const pk=(S.pot&&S.pot[k])||62, isP=(S.pos==='P'||S.pos==='TW');
      let cur=S.ab[k], bud=step, cr=(S.carry&&S.carry[k])||0, gained=0;
      if(cur>=pk){ statBonus(bud,out); }
      else{
        while(bud>0&&cur<pk){
          let c=isP?(cur>=66?7:cur>=58?4:cur>=50?2:1):(cur>=72?3:cur>=64?2:1);
          bud--; cr++; if(cr>=c){cr-=c;cur++;gained++;}
        }
        if(!S.carry)S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
        if(gained>0)out.push(`${ABL[k]} <span class="up">+${gained}</span>`);
        else if(bud<=0)out.push(`${ABL[k]}：能力加點，但不足以提升一級`);
        if(bud>0)statBonus(bud,out);
      }
      touched=true;
    }else{ const g=addAb(k,step); touched=true; out.push(`${ABL[k]} <span class="dn">${g}</span>`); }
  };
  for(const k in fx){
    const dir=fx[k]>0?1:-1;
    if(k==='inj'){ let v=({1:8,2:12,3:16,4:16})[mag]; if(mode==='bold'&&S.traits.clutch)v=12; S.tmpInj+=v; out.push(`本季受傷機率 <span class="dn">+${v}%</span>`); }
    else if(k==='rand'){ applyAbil(pick(POS_AB[S.pos]),dir); }
    else if(k in S.ab){ applyAbil(k,dir); }
  }
  if(!touched){ applyAbil(pick(POS_AB[S.pos]),good?1:-1); }
  card(good?'good':'bad','事件卡｜'+ev.n+(tag?`（${tag}）`:''),`${good?ev.gt:ev.bt}。<br>${out.join('｜')||'（能力加點，但不足以提升一級）'}`);
  checkTraitsMid(); done();
}
function allocDone(touched,isDice){
  const keys=Object.keys(touched);
  if(isDice&&S.stage!=='HS'&&keys.length){
    const tot=Object.values(touched).reduce((a,b)=>a+b,0);
    let mk=keys[0]; keys.forEach(k=>{ if(touched[k]>touched[mk])mk=k; });
    const focused=(touched[mk]/tot>=0.75)?mk:null;
    if(focused&&focused===S.samePickKey)S.samePick++;
    else if(focused){ S.samePickKey=focused; S.samePick=1; }
    else { S.samePickKey=null; S.samePick=0; }
    if(S.samePick>=3&&!S.traits.combo){ S.traits.combo=true; S.samePickBonus=true; S.comboKey=S.samePickKey;
      traitCard('combo','大巧不工',`連續三年，你把所有汗水都澆在同一個工具上——<b class="hl">季初系統會自動擲 1 顆骰，永遠加在你專精的「${ABL[S.comboKey]}」上</b>。`); }
  }
  const gain=Object.values(touched).reduce((a,b)=>a+b,0);
  if(!S.traits.late&&!S.traits.genius&&ovr()<47&&S.age>=25&&S.age<32&&isDice&&gain>=16){
    S.traits.late=true; const exDef=S.pos==='C'?['rng','fld','arm','cat']:[];
    const cands=POS_AB[S.pos].filter(k=>S.ab[k]<70&&!exDef.includes(k));
    for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=cands[i];cands[i]=cands[j];cands[j]=t;}
    const boost=cands.slice(0,2), bl=[];
    boost.forEach(k=>{ S.pot[k]=Math.min(80,(S.pot[k]||62)+10); S.ab[k]=clamp(S.ab[k]+5,1,80);
      bl.push(`${ABL[k]} <b class="up">+5</b>（潛力上限 +10 → ${S.pot[k]}）`); });
    card('gold','隱藏素質解鎖：大器晚成',`別人都以為你到頂了，你卻在這一年脫胎換骨——每一顆訓練骰<b class="hl">永久固定 3 點以上</b>。`+(bl.length?`潛能重新被評估：${bl.join('、')}。`:''));
    board(1);
  }
}
function checkTraitsMid(){
  if(!S.traits.disc&&S.age<25&&(S.cntSaveWin||0)>=15&&S.love.caught===0&&S.cntSnack<5){ traitCard('disc','自律狂','整條衰退曲線延後兩年，你的巔峰比同梯更長。'); }
  if(!S.traits.clutch&&S.age<25&&S.cntBoldWin>=7){ traitCard('clutch','大心臟','「全力一搏」成功率提升至天才級、成功加成 +4、失敗只 −2、受傷風險降級。'); }
  if(!S.traits.distract&&!S.traits.disc&&(S.love.affairs+S.love.caught+S.cntSnack)>=4&&(S.love.affairs+S.love.caught)>=1){ traitCard('distract','外務纏身','通告、代言、社群媒體佔據了你太多心神——<b class="dn">季初擲骰永久 −1 顆</b>。','bad'); }
  if(!S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace&&(S.cntBoldFail>=10||S.traits.scum)){ traitCard('cancer','更衣室毒瘤','教練受夠了你的不可控——<b class="dn">季中被交易機率大增、續約條件惡化</b>。','bad'); }
  if(!S.traits.leader&&S.age>=32&&S.teamYears>=5&&!S.traits.cancer&&(S.lastD||0)>=-3){ traitCard('leader','休息室領袖','提升球隊奪冠率，且母隊永遠願意為你留一個位置。'); }
}
function teamNick(team){
  const map={'台中猛瑪':'猛瑪','府城雄獅':'雄獅','桃園金剛':'金剛','新北騎士':'騎士','台北恐龍':'恐龍','高雄神鵰':'神鵰','波士頓襪王':'紅襪王','風城襪王':'白襪王','東京大人':'東京大人','灣區大人':'灣區大人','競技者':'競技者','沙漠眼鏡蛇':'眼鏡蛇'};
  return map[team]||(team||'').slice(-2);
}
function teamChampRate(team){ let h=0; for(let i=0;i<team.length;i++)h=(h*31+team.charCodeAt(i))&0xffff; return Math.round(8+(h%22)); }
function faYears(d,cap){
  const perf=Math.max(0,Math.min(1,(d+2)/8)); const injPenalty=(S.bigInj||0)*0.12+(S.tjCount||0)*0.15;
  let yrs=Math.round(2+perf*(cap-2)-injPenalty*cap);
  let ageCap=cap; if(S.age>=36)ageCap=2; else if(S.age>=34)ageCap=3; else if(S.age>=32)ageCap=5; else if(S.age>=30)ageCap=8;
  yrs=Math.min(yrs,ageCap); return Math.max(1,Math.min(cap,yrs));
}
function demotionAudit(cont){
  if(!S.demotionRefused){ cont(); return; } S.demotionRefused=false;
  const need=Math.round((S.ct&&S.ct.mult?S.ct.mult:1)*2)-1;
  if((S.lastD||0)>=need){
    if(S.traits.cancer){ removeTrait('cancer','更衣室毒瘤'); card('good','用成績說話','你用一整季的表現堵住了所有人的嘴——<b class="hl">更衣室毒瘤洗刷</b>。'); board(1); }
    else card('good','守住身價','你證明了自己還配得上這份合約。');
  }else{
    if(!S.traits.thief){ S.traits.thief=true; card('bad','隱藏屬性解鎖：薪水小倫','拒絕下放後成績依然沒有起色——<b class="dn">事件卡失敗率永久 +10%</b>。'); board(1); }
    else card('bad','薪水小倫','又是虛擲的一年。');
  } cont();
}
function tradeCheck(cont){
  if(S.stage!=='PRO'||!LV[S.lv].top||S.seasonFactor<=0){ cont(); return; }
  const star = ovr()>=LV[S.lv].par+4; let p=15+(S.tradeHeat||0);
  if(S.traits.cancer)p+=25; if(S.traits.ambience)p+=20;
  if(!chance(p)){ cont(); return; }
  if(S.traits.franchise||S.traits.mrteam){ card('info','非賣品',`他隊捧著誘人的包裹來詢價，高層連會議都沒開就回絕了——<b class="hl">「他是這座城市的象徵，非賣品。」</b>`); board(1); cont(); return; }
  if(star){
    if(S.traits.cancer){ doTradeExec(); card('bad','毒瘤交易','球團受夠了休息室氣氛，直接把你打包送走。'); board(1); cont(); return; }
    choose('交易大限：他隊送來報價，球團徵詢你的否決權',[
      {t:'點頭同意，換個環境',main:true,f:()=>{ doTradeExec(); card('info','轉隊','你打包行李，前往新的城市。'); board(1); cont(); }},
      {t:'行使否決權，我要留下',warn:true,s:'未來 2 年冠軍機率略降、下張合約薪水 −15%',f:()=>{ S.tradeRefuse=2; card('info','否決交易','你按下否決鍵。忠誠是一種選擇。'); board(1); cont(); }}]);
    return;
  }
  choose('交易傳言：媒體報導你可能被交易',[
    {t:'公開抱怨表達不滿',warn:true,s:'增加本次被交易的可能性',f:()=>{
      S.complainCount=(S.complainCount||0)+1;
      if(S.complainCount>=2&&!S.traits.ambience){ S.traits.ambience=true; card('bad','隱藏屬性解鎖：氣氛大師','你又一次對媒體大吐苦水——<b class="dn">往後轉隊機率永久提高</b>。'); board(1); }
      if(chance(60)){ doTradeExec(); card('bad','弄假成真','你的抱怨上了頭條，球團順勢把你送走。'); board(1); }
      else card('info','雷聲大雨點小','抱怨歸抱怨，這次交易最後沒有成局。'); cont(); }},
    {t:'保持沉默，專心打球',main:true,s:'交易機率不變',f:()=>{
      if(chance(35)){ doTradeExec(); card('info','交易成局','儘管你不動聲色，球團還是完成了這筆交易。'); board(1); }
      else card('info','留了下來','傳言就是傳言。'); cont(); }}]);
}
function doTradeExec(){
  S.teamYears=0; S.champThisTeam=false; S.champTeam=null;
  const list=S.org==='CPBL'?CPBL_TEAMS:S.org==='NPB'?NPB_TEAMS:MLB_TEAMS;
  const nt=pick(list.filter(t=>t!==S.orgTeam)); S.orgTeam=nt; tlNote(2,'轉隊 '+nt); board(1);
}
function termParams(d,lv){
  const cap=S.pos==='P'?7:15; const maxY=faYears(d,cap);
  const longEligible = maxY>2 && d>=0; const longY=Math.max(3,maxY); const shortY=Math.min(2,Math.max(1,maxY));
  let baseM=d>=3?1.2:d>=0?1:0.8; if(S.traits.franchise)baseM=Math.max(baseM,1.2); if(S.tradeRefuse>0)baseM*=0.85;
  return {longEligible,longY,shortY,longM:+(baseM*0.92).toFixed(2),shortM:+(baseM*1.12).toFixed(2)};
}
function termChoice(o,d,baseTitle,onPick,onReject){
  const tp=termParams(d,S.lv); const est=(y,m)=>fmtMoney(Math.round(salaryFor(S.lv,d)*m)); const opts=[];
  if(tp.longEligible){
    opts.push({t:`長約（${tp.longY} 年）`,main:true,s:`年限長、年薪係數略低 ×${tp.longM}（估 ${est(tp.longY,tp.longM)}/年）`,f:()=>onPick(tp.longY,tp.longM)});
    opts.push({t:`短約（${tp.shortY} 年）`,warn:true,s:`年限短、年薪係數高 ×${tp.shortM}（估 ${est(tp.shortY,tp.shortM)}/年）`,f:()=>onPick(tp.shortY,tp.shortM)});
  }else{ opts.push({t:`短約（${tp.shortY} 年）`,main:true,s:`年限短、年薪係數 ×${tp.shortM}（估 ${est(tp.shortY,tp.shortM)}/年）`,f:()=>onPick(tp.shortY,tp.shortM)}); }
  if(onReject)opts.push({t:'拒絕，維持現狀',s:'不接受這份合約',f:onReject});
  choose(baseTitle,opts);
}
function extensionOffer(o){
  const d=S.lastD||0;
  termChoice(o,d,`母隊提前延長續約 · ${S.teamName()}（合約剩 1 年）`,(y,m)=>{
    S.ct={yrs:S.ct.yrs+y,mult:m,extOffered:true};
    card('gold','延長續約',`與 <b class="hl">${S.teamName()}</b> 達成延長協議，追加 <b class="hl">${y} 年</b>。`); board(1); crossOffers(o);
  }, ()=>{ card('info','婉拒延長','你婉拒了母隊的提前延長。'); crossOffers(o); });
}
function outOfOrg(o){
  const offers=[];
  if(S.org!=='NPB'&&o>=44)offers.push({t:'日職二軍（支配下）合約',f:()=>{buyoutRemaining(1);signTo('NPB','NPB2');}});
  if(S.org!=='CPBL'){ if(o>=41)offers.push({t:'中職一軍合約',f:()=>{buyoutRemaining(1);signTo('CPBL','CPBL1');}}); else if(o>=30)offers.push({t:'中職二軍合約',f:()=>{buyoutRemaining(1);signTo('CPBL','CPBL2');}}); }
  if(!offers.length){ buyoutRemaining(1); daibaFarewell(()=>endGame('遭球團釋出且無人問津，'+S.year+' 年黯然引退。')); return; }
  card('bad','戰力外通告',`未達留用門檻遭到釋出。所幸還有球隊捎來邀請——`);
  if(S.age>=33){ offers.push({t:'就此引退',warn:true,f:()=>{buyoutRemaining(1);daibaFarewell(()=>endGame('收到戰力外通告後，宣告引退。'));}}); }
  choose('新東家的邀請',offers.map(x=>({...x,f:()=>{x.f();advance();}})));
}
function runDraftJP(fromSchool,cb){
  const o=ovr(); const score=o+Math.max(0,22-S.age)*2+ri(-4,4);
  const rd=score>=58?1:score>=52?2:score>=47?ri(3,4):score>=42?ri(5,7):score>=38?ri(8,10):0;
  if(rd===0){ card('bad','選秀落榜','唱名結束，未獲指名。'); if(fromSchool){ card('info','','回到球隊。'); cb(); } else cb('fail'); return; }
  const bonus=[0,10000,8000,6000,4500,3000,3000,2000,1000,1000,1000][rd]||1000;
  const lv=(rd<=2&&o>=52)?'NPB1':'NPB2'; const team=pick(NPB_TEAMS);
  const accept=()=>{ S.stage='PRO'; S.team=''; S.salary+=bonus; S.svc=0; S.faElig=false; signTo('NPB',lv,team,ri(2,3),1); card('gold','日本職棒選秀會',`第 <b class="hl">${rd}</b> 指名加入 <b class="hl">${team}</b>！簽約金 ${fmtMoney(bonus)}。`); tlNote(4,'選秀第'+rd+'指名'); board(0); cb(); };
  if(rd>=3 && S.age<24){
    choose(`日本職棒選秀會 · 第 ${rd} 指名 (${team})`,[
      {t:'接受指名，加盟球隊',main:true,s:`簽約金 ${fmtMoney(bonus)}`,f:accept},
      {t:(S.stage==='HS'||(S.stage==='U'&&S.stageYr<4))?'重返校園，再拚一年':'重返社會人，再拚一年',warn:true,s:'放棄本次指名',f:()=>{
        const goUni = (S.stage==='HS')||(S.stage==='U'&&S.stageYr<4); const fresh = (S.stage==='HS');
        card('info',goUni?'重返校園':'重返社會人','決定繼續磨練，提升自己的評價。');
        if(fresh){ S.stage='U'; S.stageYr=0; S.team=pick(['早稻田大學','慶應義塾大學','法政大學','明治大學']); }
        else if(!goUni){ S.stage='AMA'; S.team=pick(['豐田汽車','JR東日本','東京瓦斯','ENEOS']); }
        if(fromSchool)cb(); else advance();
      }}]); return;
  }
  accept();
}
function runDraft(fromSchool,cb){
  const o=ovr(); const score=o+Math.max(0,22-S.age)*2+ri(-4,4);
  const rd=score>=56?1:score>=49?2:score>=43?ri(3,4):score>=37?ri(5,7):score>=30?ri(8,10):0;
  if(rd===0){ card('bad','選秀落榜','唱名一輪又一輪，始終沒有你的名字。'); if(fromSchool){ card('info','','回到校隊。'); cb(); } else cb('fail'); return; }
  const bonus=[0,1000,600,350,350,150,150,150,50,50,50][rd]||50;
  const lv=(rd===1&&o>=50)?'CPBL1':'CPBL2'; const team=pick(CPBL_TEAMS);
  const accept=()=>{ S.stage='PRO'; S.team=''; S.salary+=bonus; S.svc=0; S.faElig=false; signTo('CPBL',lv,team,ri(2,3),1); card('gold','中華職棒選秀會',`第 <b class="hl">${rd}</b> 輪獲 <b class="hl">${team}</b> 指名！`); tlNote(4,'選秀第'+rd+'輪'); board(0); cb(); };
  if(rd>=3 && S.age<24){
    choose(`中華職棒選秀會 · 第 ${rd} 輪獲 ${team} 指名`,[
      {t:'接受指名，加盟球隊',main:true,s:`簽約金 ${fmtMoney(bonus)}`,f:accept},
      {t:(S.stage==='HS'||(S.stage==='U'&&S.stageYr<4))?'重返校園，再拚一年':'重返業餘，再拚一年',warn:true,s:'放棄本次指名',f:()=>{
        const goUni = (S.stage==='HS')||(S.stage==='U'&&S.stageYr<4); const fresh = (S.stage==='HS');
        card('info',goUni?'重返校園':'重返業餘','決定重新出發。');
        if(fresh){ S.stage='U'; S.stageYr=0; S.team=pick(['文化大學','輔仁大學','國立體大','台灣體大','開南大學']); }
        else if(!goUni){ S.stage='AMA'; S.team=pick(['合電','台庫','安妞先物','美麗珊瑚']); }
        if(fromSchool)cb(); else advance();
      }}]); return;
  }
  accept();
}
function pickOfferUI(title,org,offers,after){
  choose(title,offers.map(of=>({
    t:of.team+(of.lv?`（${LV[of.lv].n}）`:''), s:`簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約`,
    f:()=>{ S.salary+=of.bonus; signTo(org,of.lv||S.lv,of.team,of.yrs,of.mult||1); card('gold','簽約金',`入袋 <b class="hl">${fmtMoney(of.bonus)}</b>。`); after(); }
  })));
}
function makeOffers(org,n,bonusBase,yrsLo,yrsHi,lv,exclude){
  const list=teamListOf(org).filter(t=>t!==exclude);
  const teams=[]; const pool=list.slice();
  for(let i=0;i<n&&pool.length;i++)teams.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  return teams.map(t=>({team:t,bonus:Math.round(bonusBase*(0.8+R()*0.5)),yrs:ri(yrsLo,yrsHi),lv,mult:1}));
}
function faFlow(o){
  const d=S.lastD||0; const cap=S.pos==='P'?7:15;
  let stayY=faYears(d,cap); let stayM=d>=3?1.2:d>=0?1:0.8;
  const injHist=(S.bigInj||0)+(S.tjCount||0); if(injHist>=2&&stayY<=3)stayM+=0.15;
  if(S.traits.franchise)stayM=Math.max(stayM,1.2); if(S.tradeRefuse>0)stayM*=0.85;
  if(S.traits.leader&&stayY<=1){ stayY=1; stayM=Math.max(stayM,0.85); }
  if(S.traits.cancer){ stayM=Math.min(stayM,0.95); if(!S.traits.franchise&&chance(45)){ card('bad','球團冷處理','母球團明確表示無意續約。'); faMarket(o,d); return; } }
  const faOpts=[
    {t:`與 ${S.teamName()} 續約`,main:true,s:'選擇長約或短約方案',f:()=>termChoice(o,d,`與 ${S.teamName()} 續約 · 選擇合約類型`,(y,m)=>{ S.ct={yrs:y,mult:m,extOffered:false}; card('info','續約',`完成 <b class="hl">${y} 年</b>續約。`); advance(); })},
    {t:'跳出合約，測試自由市場',warn:true,s:'尋求其他球隊報價',f:()=>faMarket(o,d)}
  ];
  if(S.org!=='CPBL'&&o>=LV.CPBL1.min){ faOpts.push({t:'返台加盟中職一軍',s:'落葉歸根',f:()=>{ signTo('CPBL','CPBL1'); card('good','返鄉','選擇回到原球隊。'); advance(); }}); }
  choose(`合約到期 · 取得自由球員（FA）資格（球隊奪冠率 ${teamChampRate(S.orgTeam)}%）`,faOpts);
}
function faMarket(o,d){
  const org=S.org, lv=S.lv, offers=[];
  let n=d>=3?ri(2,4):d>=1?ri(1,3):d>=-1?(chance(60)?ri(1,2):0):(chance(30)?1:0);
  if(S.traits.cancer)n=Math.max(0,n-1); const cap=S.pos==='P'?7:15;
  makeOffers(org,n,({CPBL1:200,NPB1:800,MLB:2000})[lv]||100,1,cap,lv,S.orgTeam)
    .forEach(of=>{of.yrs=faYears(d,cap); of.mult=+(1+Math.max(0,d)*0.05+R()*0.12).toFixed(2); if(((S.bigInj||0)+(S.tjCount||0))>=2&&of.yrs<=3)of.mult+=0.15; offers.push({...of,org});});
  if(lv==='CPBL1'&&o>=53)makeOffers('NPB',1,1000,2,3,o>=51?'NPB1':'NPB2',null).forEach(of=>offers.push({...of,org:'NPB',mult:1}));
  if(lv==='NPB1'&&o>=60){
    const freeAgent=(S.npbYears||0)>=7;
    if(freeAgent || chance(Math.round(50*ageGateUSA(o,60)))){ makeOffers('MiLB',freeAgent?ri(1,2):1,3000,3,5,'MLB',null).forEach(of=>offers.push({...of,org:'MiLB',mult:1,posting:!freeAgent})); }
  }
  if(!offers.length){
    card('bad','自由市場','電話一直沒有響。市場對你的評價比想像中冷。');
    choose('沒有球隊開價',[
      {t:`回 ${S.teamName()} 減薪簽約`,main:true,s:'1 年｜年薪係數 ×0.70',f:()=>{ S.ct={yrs:1,mult:0.7}; card('bad','減薪合約','低頭回到原球隊。'); advance(); }},
      {t:'就此引退',warn:true,f:()=>endGame('FA 市場乏人問津，宣告引退。')}]);
    return;
  }
  const estL=(of)=>{ const tp=termParams(d,of.lv); return tp.longEligible?`長 ${tp.longY}年 / 短 ${tp.shortY}年`:`僅短約 ${tp.shortY}年`; };
  const cty=og=>({CPBL:'🇹🇼 台灣',NPB:'🇯🇵 日本',MiLB:'🇺🇸 美國',MLB:'🇺🇸 美國'})[og]||'';
  const ctyOrder={CPBL:0,NPB:1,MiLB:2,MLB:2};
  offers.sort((a,b)=>(ctyOrder[a.org]??9)-(ctyOrder[b.org]??9));
  choose('自由市場報價一覽',[...offers.map(of=>({
    t:`${cty(of.org)}｜${of.team}（${LV[of.lv].n}）`, s:`簽約金 ${fmtMoney(of.bonus)}｜${estL(of)}`,
    f:()=>{ S.salary+=of.bonus; const savedLv=S.lv; S.lv=of.lv;
      termChoice(o,d,`${of.team} · 選擇合約類型`,(y,m)=>{ S.lv=savedLv; signTo(of.org,of.lv,of.team,y,+(m*(of.mult||1)).toFixed(2)); advance(); }, ()=>{ S.lv=savedLv; S.salary-=of.bonus; faMarket(o,d); }); }})),
    {t:`回原隊（${S.teamName()}）1 年約`,s:'年薪係數 ×0.90',f:()=>{ S.ct={yrs:1,mult:0.9}; card('info','回歸','重回原隊。'); advance(); }}]);
}
