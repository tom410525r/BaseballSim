// ==================== 事件卡、感情與合約系統 ====================
function evOdds(){ 
  let base=(S.traits.genius||S.traits.late||S.traits.clutch)?70:50; 
  if(S.traits.thief)base-=10; 
  const boldPen=S.traits.clutch?0:15; 
  return {safe:Math.min(95,base+20), norm:base, bold:base-boldPen};
}
function drawEvents(n,done){
  if(n<=0){ done(); return; }
  choose('',[{t:`抽事件卡（剩 ${n} 張）`,main:true,f:()=>{
    const pool=EVENTS.filter(e=>e.for==='*'||(e.for==='P'&&S.pos==='P')||((e.for==='A'||e.for==='B')&&S.pos!=='P')||(e.for==='PRO'&&S.stage==='PRO'));
    const ev=pick(pool); const od=evOdds(); const after=()=>{ board(1); drawEvents(n-1,done); };
    choose(`事件｜${ev.n} — 你要怎麼應對？`,[
      {t:'全力一搏',warn:true,s:`成功率 ${od.bold}%｜${S.traits.clutch?'成功 +4／失敗僅 −2':'加成／減益幅度最大（±3）'}`,f:()=>{resolveEvent(ev,'bold',after);}},
      {t:'照常執行',main:true,s:`成功率 ${od.norm}%｜標準幅度（±2）`,f:()=>{resolveEvent(ev,'norm',after);}},
      {t:'保守應對',s:`成功率 ${od.safe}%｜加成／減益幅度最小（±1）`,f:()=>{resolveEvent(ev,'safe',after);}}]);
  }}]);
}

function datePool(){ 
  if(CHEER_SAFE.length>=CHEER.length) return CHEER_SAFE.slice();      
  return CHEER_SAFE.concat(CHEER.slice(CHEER_SAFE.length));            
}
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
            if(chance(55)){ const gt=loveGainTxt('sta',2); board(1); card('bad','深夜兜風',`沒有人拍到。你把方向盤握得很緊——${gt}。（這條路不會有好結局）`); ask(); }
            else loveCaughtDating(next); }},
          {t:`「不順路。」直接載 ${L.partner} 回家`,main:true,s:'感情穩固，絕對不虧',f:()=>{
            const gt=loveGainTxt('sta',1); board(1); card('good','正確答案',`你傳訊息給 ${L.partner}：「馬上到。」——${gt}。`); ask(); }}]); return; }
      if(r<70){ const gt=loveGainTxt('sta',1); board(1); card('good','明星賽放閃',`明星賽表演賽，鏡頭掃到看台上的 <b class="hl">${L.partner}</b>，你隔著全場比了一個手勢，轉播單位立刻切出愛心特效，隔天甜上熱搜——${gt}。`); ask(); return; }
      const gt=loveGainTxt('sta',1); board(1); card('good','愛情長跑',`交往邁入第 ${y} 年。沒有大新聞，只有每個客場系列賽結束後，機場出口那杯她替你買好的熱美式——${gt}。`); ask(); return; }
    ask(); return;
  }
  const fire=(L.st==='married'&&L.kids===0)?40:(L.st==='single'||L.st==='divorced')?40:30;
  if(!chance(fire)){ next(); return; }
  
  if(L.st==='single'||L.st==='divorced'){
    const p=pick(datePool());
    card('info','場外話題',`你和啦啦隊女神 <b class="hl">${p}</b> 被拍到球場外同框，緋聞登上娛樂版頭條。${L.exes.length?'（評論區：「離過婚還這麼搶手」）':''}`);
    choose('記者把麥克風遞到你面前：「兩位是在交往嗎？」',[
      {t:'大方承認：「請大家祝福我們」',s:'還要看她那邊敢不敢承認（球團有禁愛令傳聞）',f:()=>{
        if(chance(65)){ L.st='dating'; L.partner=p; L.dyrs=0; L.datedTimes=(L.datedTimes||0)+1;
          const gt=loveGainTxt('sta',1); board(1); card('gold','戀情公開',`<b class="hl">${p}</b> 在社群發出十指緊扣的照片：「謝謝大家的祝福。」戀愛使人容光煥發——${gt}。你們正式交往了。`);
          if(L.datedTimes>=3&&L.kids===0&&!S.traits.married&&!S.traits.confidante){ S.traits.confidante=true; card('gold','隱藏稱號：閨中密友',`第三段戀情，還是走到了同樣的結局。「我愛上了你，你卻只把我當好姊妹。」——有些人註定是別人生命裡的過客。`); board(1); }
        }
        else{ card('bad','單方面承認',`她隔天透過經紀公司否認：「只是普通朋友。」據傳啦啦隊<b class="dn">禁愛令</b>壓力不小。你一個人站在風裡，超級尷尬。`); } next(); }},
      {t:'笑而不答，快步走過',main:true,s:'不承認就沒有下文',f:()=>{ card('info','未完待續','緋聞燒了三天就退燒。也許時機還沒到。'); next(); }}]); return;
  }
  
  if(L.kids<4&&chance([65,45,30,20][L.kids])){ 
    L.kids++; const kk=pick(POS_AB[S.pos]); const gt=loveGainTxt(kk,2); board(1);
    card('gold','新生命',`${L.partner} 平安生下你們的第 <b class="hl">${L.kids}</b> 個孩子。當了${L.kids>1?'幾次':''}爸爸的男人，眼神都不一樣了——${gt}。`); next(); return;
  }
  const r=R()*100;
  if(r<40){ 
    const t=pick(affairPool().filter(n=>n!==L.partner));
    const kidWord=L.kids===1?'孩子':'孩子們';
    const rejectAffairText=L.kids===0 ?'回訊息：「準備和家人視訊了，晚安」' :`回訊息：「陪${kidWord}讀完故事書了，晚安」`;
    const homeVideoText=L.kids===0 ?`${L.partner} 在鏡頭那頭笑著向你揮手。` :`${L.partner} 和${kidWord}在鏡頭那頭揮手。`;
    choose(`客場飯店酒吧，${t} 傳來訊息：「睡了嗎？」`,[
      {t:'赴約（賭一把）',warn:true,s:'沒被抓到＝體力提升｜被抓到＝能力下跌、婚姻危機',f:()=>{
        L.affairs++;
        if(chance(55)){ const gt=loveGainTxt('sta',2); board(1); card('bad','深夜行程',`你僥倖沒被拍到。不知為何，罪惡感反而讓你精神亢奮——${gt}。（你知道這不會有好下場）`); next(); }
        else loveCaught(next); }},
      {t:rejectAffairText,main:true,s:'家庭和睦，絕對不虧',f:()=>{
        const gt=loveGainTxt('sta',1); board(1); card('good','家的方向',`你把手機扣在桌上，撥了視訊回家。${homeVideoText}心定了，身體就穩了——${gt}。`); next(); }}]); return; }
  if(r<70&&L.kids>0){ 
    const gt=loveGainTxt('sta',1); board(1);
    card('good','球場邊的父親',`你被拍到賽前隔著護網教孩子怎麼戴手套，影片配文「最強棒球教室」瘋傳。網友：「這才是人生勝利組。」——${gt}。`); next(); return; }
  
  const gt=loveGainTxt('sta',1); board(1);
  card('good','結婚紀念日',`結婚紀念日，你推掉了自主訓練，陪 <b class="hl">${L.partner}</b> 回到當年辦婚禮的場地。她說：「明年也要來喔。」——${gt}。`); next();
}
function divorceRec(){ const L=S.love; L.exes.push({name:L.partner,kids:L.kids}); L.st='divorced'; L.partner=null; L.kids=0; }
function loveCaught(next){
  const L=S.love; L.caught++; const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3); let extra='';
  if(L.caught>=2){
    if(!S.traits.scum){ S.traits.scum=true; card('bad','隱藏屬性解鎖：渣男','第二次被逮個正著。從今以後你在球迷心中的形象定型了——<b class="dn">每次外遇被抓到，全能力 −5</b>。'); }
    POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); }); extra='<b class="dn">全能力 −5</b>（渣男的代價）。'; }
  board(1);
  card('bad','頭版醜聞',`狗仔的鏡頭比你想的更快，照片鋪滿版面。贊助商緊急撤圖，你在鏡頭前鞠躬 90 度。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
  choose(`${L.partner} 把離婚協議書放在餐桌上`,[
    {t:'跪著道歉，求她再給一次機會',s:'成功保住婚姻｜失敗＝再扣能力並離婚',f:()=>{
      if(chance(40)){ card('info','低谷之後',`長談了一整夜。<b class="hl">${L.partner}</b> 最後說：「為了孩子，也為了那個我認識的你——最後一次。」婚姻保住了，但有些東西回不去了。`); next(); }
      else{ const k2=pick(POS_AB[S.pos]); const g2=addAb(k2,-2); const ex=L.partner; divorceRec(); board(1); card('bad','道歉無效',`她聽完只是搖頭，隔天律師的存證信函就到了。<b class="hl">${ex}</b> 正式與你離婚，輿論二次發酵——<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } }},
    {t:'簽字離婚',f:()=>{ const ex=L.partner; divorceRec(); card('bad','離婚',`你在協議書上簽了名。<b class="hl">${ex}</b> 的聲明只有一句：「祝彼此安好。」`); next(); }}]);
}
function proposalAsk(next){
  const L=S.love; if(L.st!=='dating'){ next(); return; }
  choose(`交往第 ${L.dyrs} 年——${L.partner} 看著別人的婚禮影片看了很久`,[
    {t:'就是現在——求婚',s:'固定加成：全體力提升、本季更不容易受傷',f:()=>{ 
      L.st='married'; L.kids=0; L.dyrs=0; const gTxt=loveGainTxt('sta',2)+'、'; S.tmpInj-=5; board(1); 
      card('gold','婚禮',`你在主場本壘板後方單膝跪地，大螢幕打出「Marry Me」。<b class="hl">${L.partner}</b> 哭著點頭。休賽季完婚，紅毯用壘包排成——${gTxt}本季受傷機率 <b class="up">−5%</b>。`); next(); }},
    {t:'再存一點錢吧',main:true,s:'她沒說什麼,但交往越久分手風險越高',f:()=>{ card('info','再等等','她關掉影片，笑著說沒事。你假裝沒看到她眼裡的東西。'); next(); }}]);
}
function loveCaughtDating(next){
  const L=S.love; L.caught++; L.cheatYr=S.year; const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3); let extra='';
  if(L.caught>=2){
    if(!S.traits.scum){ S.traits.scum=true; card('bad','隱藏屬性解鎖：渣男','第二次被逮個正著。從今以後你在球迷心中的形象定型了——<b class="dn">每次劈腿/外遇被抓到，全能力 −5</b>。'); }
    POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); }); extra='<b class="dn">全能力 −5</b>（渣男的代價）。'; }
  board(1);
  card('bad','劈腿曝光',`行車紀錄器畫面流出，時間軸對得整整齊齊。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
  choose(`${L.partner} 已讀不回三天後，終於答應見面`,[
    {t:'道歉，求她再給一次機會',s:'成功保住感情｜失敗＝再扣能力並分手',f:()=>{
      if(chance(40)){ card('info','低谷之後',`她哭著罵完，最後說：「最後一次。」感情保住了，但信任的裂痕補不回來。`); next(); }
      else{ const k2=pick(POS_AB[S.pos]); const g2=addAb(k2,-2); const ex=L.partner; L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0; board(1); card('bad','道歉無效',`她把你送的東西整箱寄回。<b class="hl">${ex}</b> 封鎖了所有聯絡方式——<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } }},
    {t:'坦然分手',f:()=>{ const ex=L.partner; L.st=L.exes.length?'divorced':'single'; L.partner=null; L.dyrs=0; card('bad','分手',`<b class="hl">${ex}</b> 的限時動態只有一片黑。粉絲全都知道是誰的錯。`); next(); }}]);
}

function loveGainTxt(k,amt){ 
  const before=S.pendStat||0; const g=addAbStat(k,amt); const over=(S.pendStat||0)-before;
  if(g>0&&over>0)return `<b class="up">${ABL[k]} +${g}</b>（溢出 ${over} 點轉為本季成績加成）`;
  if(g>0)return `<b class="up">${ABL[k]} +${g}</b>`;
  if(over>0)return `<b class="up">本季成績加成 +${over}</b>（${ABL[k]} 已達潛力上限）`;
  return `${ABL[k]} 能力加點，但不足以提升一級`;
}
function addAbStat(k,amt){ 
  if(amt<=0)return addAb(k,amt);
  const pk=(S.pot&&S.pot[k])||62; const isP=S.pos==='P';
  let cur=S.ab[k], bud=amt, cr=(S.carry&&S.carry[k])||0, gained=0;
  if(cur>=pk){ S.pendStat=(S.pendStat||0)+bud; return 0; }
  while(bud>0 && cur<pk){
    let c = isP ? (cur>=66?7:cur>=58?4:cur>=50?2:1) : (cur>=72?3:cur>=64?2:1);
    bud--; cr++; if(cr>=c){ cr-=c; cur++; gained++; }
  }
  if(!S.carry) S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
  if(bud>0) S.pendStat=(S.pendStat||0)+bud;
  return gained;
}
function statBonus(pts,out){ S.pendStat=(S.pendStat||0)+pts; out.push(`<span class="up">狀態火燙（本季成績加成 ×${pts}）</span>`); }

function resolveEvent(ev,mode,done){
  done=done||function(){}; const od=evOdds(); 
  if(mode==='safe')S.cntSave++; let good,tag;
  if(mode==='safe'){ good=chance(od.safe); tag='保守應對'; }
  else if(mode==='bold'){ good=chance(od.bold); tag='全力一搏'; if(good)S.cntBoldWin++; else S.cntBoldFail++; }
  else { good=chance(od.norm); tag=''; }
  if(mode==='safe'&&good)S.cntSaveWin=(S.cntSaveWin||0)+1; 
  if((ev.n==='宵夜文化'||ev.n==='場外代言邀約')&&mode!=='safe'&&!good)S.cntSnack++;
  let mag=mode==='safe'?1:mode==='bold'?3:2;
  if(mode==='bold'&&S.traits.clutch)mag=good?4:2; 
  const fx=good?ev.g:ev.b; let out=[],touched=false;
  const applyAbil=(k,dir)=>{ const step=dir*mag;
    if(dir>0){
      const pk=(S.pot&&S.pot[k])||62; const isP=S.pos==='P';
      let cur=S.ab[k], bud=step, cr=(S.carry&&S.carry[k])||0, gained=0;
      if(cur>=pk){ statBonus(bud,out); } else {
        while(bud>0 && cur<pk){ let c = isP ? (cur>=66?7:cur>=58?4:cur>=50?2:1) : (cur>=72?3:cur>=64?2:1); bud--; cr++; if(cr>=c){ cr-=c; cur++; gained++; } }
        if(!S.carry) S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
        if(gained>0) out.push(`${ABL[k]} <span class="up">+${gained}</span>`); else if(bud<=0) out.push(`${ABL[k]}：能力加點，但不足以提升一級`); 
        if(bud>0) statBonus(bud,out); 
      } touched=true;
    } else { const g=addAb(k,step); touched=true; out.push(`${ABL[k]} <span class="dn">${g}</span>`); }
  };
  for(const k in fx){ const dir=fx[k]>0?1:-1;
    if(k==='inj'){ let v=({1:8,2:12,3:16,4:16})[mag]; if(mode==='bold'&&S.traits.clutch)v=12;  S.tmpInj+=v; out.push(`本季受傷機率 <span class="dn">+${v}%</span>`);}
    else if(k==='rand'){ applyAbil(pick(POS_AB[S.pos]),dir); }
    else if(k in S.ab){ applyAbil(k,dir); } }
  if(!touched){ applyAbil(pick(POS_AB[S.pos]),good?1:-1); }
  card(good?'good':'bad','事件卡｜'+ev.n+(tag?`（${tag}）`:''), `${good?ev.gt:ev.bt}。${mode==='bold'&&good?'<b class="hl">豪賭成功！</b>':''}${mode==='bold'&&!good?'<b class="dn">豪賭失敗……</b>':''}<br>${out.join('｜')||'（能力加點，但不足以提升一級）'}`);
  checkTraitsMid(); done();
}

function allocDone(touched,isDice){
  const keys=Object.keys(touched);
  if(isDice&&S.stage!=='HS'&&keys.length){ 
    const tot=Object.values(touched).reduce((a,b)=>a+b,0);
    let mk=keys[0]; keys.forEach(k=>{ if(touched[k]>touched[mk])mk=k; });
    const focused=(touched[mk]/tot>=0.75)?mk:null; 
    if(focused&&focused===S.samePickKey)S.samePick++;
    else if(focused){ S.samePickKey=focused; S.samePick=1; } else { S.samePickKey=null; S.samePick=0; }
    if(S.samePick>=3&&!S.traits.combo){ S.traits.combo=true; S.samePickBonus=true; S.comboKey=S.samePickKey; 
      traitCard('combo','大巧不工',`連續三年，你把所有汗水都澆在同一個工具上——<b class="hl">季初系統會自動擲 1 顆骰，永遠加在你專精的「${ABL[S.comboKey]}」上</b>。專精者的複利。`); }
  }
  const gain=Object.values(touched).reduce((a,b)=>a+b,0);
  if(!S.traits.late&&!S.traits.genius&&ovr()<47&&S.age>=25&&S.age<32&&isDice&&gain>=16){
    S.traits.late=true; const exDef=S.pos==='C'?['rng','fld','arm','cat']:[];
    const cands=POS_AB[S.pos].filter(k=>S.ab[k]<70&&!exDef.includes(k));
    for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=cands[i];cands[i]=cands[j];cands[j]=t;}
    const boost=cands.slice(0,2), bl=[];
    boost.forEach(k=>{ S.pot[k]=Math.min(80,(S.pot[k]||62)+10); S.ab[k]=clamp(S.ab[k]+5,1,80); bl.push(`${ABL[k]} <b class="up">+5</b>（潛力上限 +10 → ${S.pot[k]}）`); });
    card('gold','隱藏素質解鎖：大器晚成',`別人都以為你到頂了，你卻在這一年脫胎換骨——從今以後，每一顆訓練骰<b class="hl">永久固定 3 點以上</b>，事件卡好結果機率提升至 <b class="hl">70%</b>。`+(bl.length?`潛能重新被評估：${bl.join('、')}。`:'')+'你的故事，才正要展開。');
    board(1); }
}
function checkTraitsMid(){
  if(!S.traits.disc&&S.age<25&&(S.cntSaveWin||0)>=15&&S.love.caught===0&&S.cntSnack<5){
    traitCard('disc','自律狂','你見過凌晨四點的洛杉磯嗎？——年紀輕輕就把身體當成聖殿經營，沒有派對、沒有酒精，只有重訓室的鐵片聲：<b class="hl">整條衰退曲線延後兩年</b>，你的巔峰比同梯更長。'); }
  if(!S.traits.clutch&&S.age<25&&S.cntBoldWin>=7){
    traitCard('clutch','大心臟','每次的豪賭淬鍊出你無與無比的心性，愈刺激的狀況只會讓你更加幹勁十足。<br><b class="hl">「全力一搏」成功率提升至天才級、成功加成 +4、失敗只 −2、受傷風險降到普通級；國際賽個人成績獲得小幅加成</b>。'); }
  if(!S.traits.distract&&!S.traits.disc&&(S.love.affairs+S.love.caught+S.cntSnack)>=4&&(S.love.affairs+S.love.caught)>=1){
    traitCard('distract','外務纏身','通告、代言、社群媒體佔據了你太多心神，休賽季很久沒有完整專注在棒球上——<b class="dn">季初擲骰永久 −1 顆</b>（最低 2 顆）。','bad'); }
  if(!S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace&&(S.cntBoldFail>=10||S.traits.scum)){
    traitCard('cancer','更衣室毒瘤','教練受夠了你的不可控，隊友對你的新聞指指點點。比起成績，球團現在更想清理休息室的氣氛——<b class="dn">季末被交易機率大增、續約條件惡化</b>。','bad'); }
}

function teamNick(team){ 
  const map={'台中猛獁':'猛獁','府城雄獅':'雄獅','桃園金剛':'金剛','新北騎士':'騎士','台北恐龍':'恐龍','高雄神鵰':'神鵰','波士頓襪王':'紅襪王','風城襪王':'白襪王','東京大人':'東京大人','灣區大人':'灣區大人','競技者':'競技者','沙漠眼鏡蛇':'眼鏡蛇'};
  return map[team]||(team||'').slice(-2);
}
function teamChampRate(team){ 
  let h=0; for(let i=0;i<team.length;i++)h=(h*31+team.charCodeAt(i))&0xffff;
  const base=8+(h%22); 
  return Math.round(base);
}
function injuryMarketStatus(){
  if(S.marketInjury&&S.marketInjury!=='healthy')return S.marketInjury;
  if(S.seasonFactor===0)return 'rehab';
  if(S.seasonFactor<=0.45)return 'major';
  if(S.seasonFactor<0.95)return 'minor';
  return 'healthy';
}
function marketRating(d,targetLv,sourceLv){
  const target=targetLv||S.lv,source=sourceLv||S.lastLv||S.lv;
  const cur=ratingAtLevel(currentSalaryRating(d),source,target), status=injuryMarketStatus();
  const prior=(S.log||[]).filter(r=>r.y!==S.year&&r.st&&Number.isFinite(r.st.d)).slice(-2).reverse().map(r=>ratingAtLevel(seasonSalaryRating(r.st,r.lv||source,S.pos==='P'?r.role:r.p),r.lv||source,target));
  const weights=status==='rehab'?[0.20,0.50,0.30]:status==='major'?[0.35,0.40,0.25]:status==='minor'?[0.55,0.30,0.15]:[0.65,0.25,0.10];
  const vals=[cur].concat(prior); let sum=0,ws=0;
  vals.forEach((v,i)=>{sum+=v*weights[i];ws+=weights[i];});
  return +(sum/(ws||1)).toFixed(2);
}
function contractMarketProfile(d,targetLv,sourceLv){
  const target=targetLv||S.lv,source=sourceLv||S.lastLv||S.lv;
  const status=injuryMarketStatus(), rating=marketRating(d,target,source);
  const prior=(S.log||[]).filter(r=>r.y!==S.year&&r.st&&Number.isFinite(r.st.d)).slice(-2).map(r=>ratingAtLevel(seasonSalaryRating(r.st,r.lv||source,S.pos==='P'?r.role:r.p),r.lv||source,target));
  const reputation=prior.length?prior.reduce((a,b)=>a+b,0)/prior.length:rating;
  const star=reputation>=7;
  const map={
    healthy:{aav:1,bonus:1,drop:0,maxYears:99,label:''},
    minor:{aav:0.93,bonus:0.80,drop:0,maxYears:99,label:'小傷使市場略為觀望'},
    major:{aav:star?0.82:0.70,bonus:star?0.50:0.35,drop:star?1:2,maxYears:3,label:star?'重大傷勢：履歷保住部分身價，但只能先證明健康':'重大傷勢：報價、年限與簽約金大幅縮水'},
    rehab:{aav:star?0.72:0.55,bonus:star?0.35:0.20,drop:star?2:3,maxYears:2,label:star?'整季復健：球團只願承擔證明約風險':'整季復健：市場接近凍結'}
  }[status];
  return {...map,status,rating,reputation,star,proveIt:(status==='major'||status==='rehab')};
}
function faYears(d,cap,profile){ 
  const mp=profile||contractMarketProfile(d), value=mp.rating;
  const perf=Math.max(0,Math.min(1,(value+2)/8)); 
  const injPenalty=(S.bigInj||0)*0.12+(S.tjCount||0)*0.15;
  let yrs=Math.round(2+perf*(cap-2)-injPenalty*cap);
  let ageCap=cap;
  if(S.age>=36)ageCap=2; else if(S.age>=34)ageCap=3; else if(S.age>=32)ageCap=5; else if(S.age>=30)ageCap=8;
  yrs=Math.min(yrs,ageCap,mp.maxYears);
  return Math.max(1,Math.min(cap,yrs));
}
function demotionAudit(cont){
  if(!S.demotionRefused){ cont(); return; }
  S.demotionRefused=false;
  const need=Math.round((S.ct&&S.ct.mult?S.ct.mult:1)*2)-1; 
  if((S.lastD||0)>=need){
    if(S.traits.cancer){ removeTrait('cancer','更衣室毒瘤'); card('good','用成績說話','你用一整季的表現堵住了所有人的嘴——<b class="hl">更衣室毒瘤洗刷</b>。當初拒絕下放的決定，被證明是對的。'); board(1); }
    else card('good','守住身價','你證明了自己還配得上這份合約。');
  } else {
    if(!S.traits.thief){ S.traits.thief=true; card('bad','隱藏屬性解鎖：薪水小倫','拒絕下放後，你的成績依然沒有起色。球迷開始在社群叫你「薪水小倫」——<b class="dn">事件卡失敗率永久 +10%</b>，這個名聲跟著你到退休。'); board(1); }
    else card('bad','薪水小倫','又是虛擲的一年。看台上的噓聲更大了。');
  } cont();
}
function offseasonTradeCheck(cont){
  if(S.stage!=='PRO'||!LV[S.lv].top||S.seasonFactor<=0){ cont(); return; }
  const star = ovr()>=LV[S.lv].par+4; 
  let p=15+ (S.tradeHeat||0); 
  if(S.traits.cancer)p+=25; if(S.traits.ambience)p+=20;
  if(!chance(p)){ cont(); return; }
  if(S.traits.franchise||S.traits.mrteam){
    card('info','非賣品',`他隊捧著誘人的包裹來詢價，高層連會議都沒開就回絕了——<b class="hl">「他是這座城市的象徵，非賣品。」</b>`); board(1); cont(); return;
  }
  if(star){
    if(S.traits.cancer){ doTradeExec(); card('bad','毒瘤交易','球團受夠了休息室的氣氛，直接把你打包送走。'); board(1); cont(); return; }
    choose('球季結束：他隊送來交易報價，球團徵詢你的否決權',[
      {t:'點頭同意，換個環境',main:true,f:()=>{ doTradeExec(); card('info','轉隊','你打包行李，前往新的城市。'); board(1); cont(); }},
      {t:'行使否決權，我要留下',warn:true,s:'未來 2 年冠軍機率略降、下張合約薪水 −15%',f:()=>{ S.tradeRefuse=2; card('info','否決交易',`你按下否決鍵。忠誠是一種選擇——球團的重建計畫被你打亂了，短期戰力和你的下張合約都會付出一點代價，但這件球衣，你留下來了。`); board(1); cont(); }}]);
    return;
  }
  choose('季末交易傳言：媒體報導你可能在休賽季被交易',[
    {t:'公開抱怨表達不滿',warn:true,s:'增加本次被交易的可能性',f:()=>{
      S.complainCount=(S.complainCount||0)+1;
      if(S.complainCount>=2&&!S.traits.ambience){ S.traits.ambience=true; card('bad','隱藏屬性解鎖：氣氛大師','你又一次對媒體大吐苦水。球團高層看在眼裡——這種選手，留著也是不定時炸彈。<b class="dn">往後轉隊機率永久提高</b>。'); board(1); }
      if(chance(60)){ doTradeExec(); card('bad','弄假成真',`你的抱怨上了頭條，球團順勢把你送走。新東家，好好打吧。`); board(1); } else card('info','雷聲大雨點小','抱怨歸抱怨，這次交易最後沒有成局。你還在原隊，但氣氛有點僵。');
      cont(); }},
    {t:'保持沉默，專心打球',main:true,s:'交易機率不變',f:()=>{
      if(chance(35)){ doTradeExec(); card('info','交易成局','儘管你不動聲色，球團還是完成了這筆交易。'); board(1); } else card('info','留了下來','傳言就是傳言。下個球季，你還是穿著同一件球衣。');
      cont(); }}]);
}
function doTradeExec(){
  S.teamYears=0; S.champThisTeam=false; S.champTeam=null;
  const list=S.org==='CPBL'?CPBL_TEAMS:S.org==='NPB'?NPB_TEAMS:MLB_TEAMS;
  const nt=pick(list.filter(t=>t!==S.orgTeam)); S.orgTeam=nt; tlNote(2,'轉隊 '+nt); board(1);
}

function outOfOrg(o){
  const offers=[];
  if(S.org!=='NPB'&&o>=44)offers.push({t:'日職二軍（支配下）合約',f:()=>{buyoutRemaining(1);signTo('NPB','NPB2');}});
  if(S.org!=='CPBL'){ if(o>=41)offers.push({t:'中職一軍合約',f:()=>{buyoutRemaining(1);signTo('CPBL','CPBL1');}}); else if(o>=30)offers.push({t:'中職二軍合約',f:()=>{buyoutRemaining(1);signTo('CPBL','CPBL2');}}); }
  if(!offers.length){ buyoutRemaining(1); daibaFarewell(()=>endGame('遭球團釋出且無人問津，'+S.year+' 年黯然引退。')); return; }
  card('bad','戰力外通告',`未達 ${S.org==='NPB'?'日職':'原聯盟'}留用門檻，遭到釋出。所幸還有球隊捎來邀請——`);
  if(S.age>=33){ offers.push({t:'就此引退',warn:true,f:()=>{buyoutRemaining(1);daibaFarewell(()=>endGame('收到戰力外通告後，'+S.year+' 年選擇引退。'));}}); }
  choose('新東家的邀請',offers.map(x=>({...x,f:()=>{x.f();advance();}})));
}

function signTo(org,lv,team,yrs,mult,annual){
  const sourceLv=S.lastLv||S.lv,contractD=ratingAtLevel(currentSalaryRating(S.lastD||0),sourceLv,lv);
  S.org=org; S.lv=lv;
  const newTeam = team || pick(teamListOf(org));
  if(newTeam !== S.orgTeam){ S.teamYears=0; S.champThisTeam=false; S.champTeam=null; tlNote(2,'加盟 '+newTeam); }
  S.orgTeam = newTeam;
  if(org==='CPBL')S.lastCpblTeam=newTeam;
  S.ct=makeContract(yrs||2,mult||1,lv,contractD,annual);
  if(org!=='NPB')S.npbYears=0;
  card('info','簽約',`與 <b class="hl">${S.teamName()}</b> 簽下固定年薪 <b class="hl">${fmtMoney(S.ct.annual)}</b> × <b class="hl">${S.ct.yrs} 年</b>，合約薪資總額 <b class="hl">${fmtMoney(S.ct.annual*S.ct.yrs)}</b>。`); board(2);
}

function pickOfferUI(title,org,offers,after){
  choose(title,offers.map(of=>{ const lv=of.lv||S.lv, offerD=ratingAtLevel(currentSalaryRating(S.lastD||0),S.lastLv||S.lv,lv), annual=calcContractAnnual(lv,offerD,of.mult||1);
    return { t:of.team+(of.lv?`（${LV[of.lv].n}）`:''), s:`簽約金 ${fmtMoney(of.bonus)}｜固定年薪 ${fmtMoney(annual)} × ${of.yrs} 年｜合約薪資總額 ${fmtMoney(annual*of.yrs)}`, f:()=>{ S.salary+=of.bonus; signTo(org,lv,of.team,of.yrs,of.mult||1,annual); card('gold','簽約金',`入袋 <b class="hl">${fmtMoney(of.bonus)}</b>。`); after(); } };
  }));
}
function makeOffers(org,n,bonusBase,yrsLo,yrsHi,lv,exclude){
  const list=teamListOf(org).filter(t=>t!==exclude);
  const teams=[]; const pool=list.slice();
  for(let i=0;i<n&&pool.length;i++)teams.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  return teams.map(t=>({team:t,bonus:Math.round(bonusBase*(0.8+R()*0.5)),yrs:ri(yrsLo,yrsHi),lv,mult:1}));
}

function termParams(d,lv,profile){ 
  const mp=profile||contractMarketProfile(d);
  const cap=S.pos==='P'?pitcherContractCap():15;
  const maxY=faYears(mp.rating,cap,mp);    
  const longEligible = !mp.proveIt && maxY>2 && mp.rating>=0;
  const longY=Math.max(3,maxY);           
  const shortY=mp.proveIt?1:Math.min(2,Math.max(1,maxY));
  let baseM=mp.aav;                       
  if(S.traits.franchise)baseM*=1.04;      
  if(S.tradeRefuse>0)baseM*=0.85;
  return {longEligible,longY,shortY,longM:+(baseM*0.95).toFixed(2),shortM:+(baseM*1.05).toFixed(2),profile:mp};
}
function termEstimate(lv,d,offerMult,profile){
  const source=S.lastLv||S.lv;
  const mp=(lv===S.lv&&profile)?profile:contractMarketProfile(d,lv,source),tp=termParams(d,lv,mp),bm=offerMult||1;
  const line=(y,m)=>{ const annual=calcContractAnnual(lv,mp.rating,+(m*bm).toFixed(2)); return `${fmtMoney(annual)}×${y}年＝${fmtMoney(annual*y)}`; };
  return tp.longEligible?`長約 ${line(tp.longY,tp.longM)}／短約 ${line(tp.shortY,tp.shortM)}`:`${mp.proveIt?'證明約':'短約'} ${line(tp.shortY,tp.shortM)}`;
}
function termChoice(o,d,baseTitle,onPick,onReject,rejectLabel,rejectDesc,offerMult){
  const mp=contractMarketProfile(d), tp=termParams(d,S.lv,mp);
  const now=contractAnnual(), baseMult=offerMult||1;
  const offer=(y,m)=>{ const actualMult=+(m*baseMult).toFixed(2), annual=calcContractAnnual(S.lv,mp.rating,actualMult); return {y,m:actualMult,annual,total:annual*y}; };
  const describe=x=>`固定年薪 <b>${fmtMoney(x.annual)}</b> × ${x.y} 年｜合約總額 <b>${fmtMoney(x.total)}</b>`;
  const opts=[];
  if(tp.longEligible){ 
    const long=offer(tp.longY,tp.longM), short=offer(tp.shortY,tp.shortM);
    opts.push({t:`長約｜${fmtMoney(long.annual)} × ${long.y} 年`,main:true,s:`${describe(long)}｜年薪略低；受傷、衰退與下放仍享固定保障`, f:()=>onPick(long.y,long.m,long.annual,long.total)});
    opts.push({t:`短約｜${fmtMoney(short.annual)} × ${short.y} 年`,warn:true,s:`${describe(short)}｜年薪較高，賭下次身價`, f:()=>onPick(short.y,short.m,short.annual,short.total)});
  } else { 
    const short=offer(tp.shortY,tp.shortM);
    opts.push({t:`${mp.proveIt?'證明約':'短約'}｜${fmtMoney(short.annual)} × ${short.y} 年`,main:true,s:`${describe(short)}｜${mp.proveIt?'傷勢讓市場只願先確認你能健康回歸':'以你目前的年齡與成績，球團只願提供短約'}`, f:()=>onPick(short.y,short.m,short.annual,short.total)});
  }
  if(onReject)opts.push({t:rejectLabel||'拒絕，維持現狀',s:rejectDesc||'不接受這份合約',f:onReject});
  const health=mp.label?`｜<span class="dn">${mp.label}</span>`:'';
  choose(`${baseTitle}<div style="margin-top:8px;color:var(--dim);font-size:13px">目前年薪：<b class="hl">${fmtMoney(now)}</b>｜市場依最近三季加權估值${health}</div>`,opts);
}
function extensionOffer(o){
  const d=S.lastD||0;
  termChoice(o,d,`母隊提前延長續約 · ${S.teamName()}（原合約剩 1 年）`,(y,m,annual,total)=>{
    const effectiveYear=S.year+1, team=S.teamName();
    S.ct=makeContract(y,m,S.lv,d,annual,{extOffered:true});
    card('gold','延長續約',`為了提前留下你，<b class="hl">${team}</b>決定提前續約，開了一筆固定年薪 <b class="hl">${fmtMoney(annual)}</b> × <b class="hl">${y} 年</b>的新約（合約總額 <b class="hl">${fmtMoney(total)}</b>），並且從 <b class="hl">${effectiveYear} 年</b>生效！`); board(1);
    crossOffers(o);
  }, ()=>{ 
    card('info','婉拒延長',`你婉拒了母隊的提前延長，選擇打完現有合約再說。`); crossOffers(o);
  });
}

function faFlow(o){
  const d=S.lastD||0;
  if(S.traits.cancer){ 
    if(!S.traits.franchise&&chance(45)){ card('bad','球團冷處理',`<b class="dn">${S.orgTeam}</b>明確表示無意續約——你的新聞比你的成績更出名。其他球隊則開始評估能否用較低代價帶走你。`); faMarket(o,d,{cold:true,oldTeam:S.orgTeam}); return; } }
  const faOpts=[
    {t:`與 ${S.teamName()} 續約`,main:true,s:'接著選擇長約或短約', f:()=>termChoice(o,d,`與 ${S.teamName()} 續約 · 選擇合約類型`,(y,m,annual,total)=>{ S.ct=makeContract(y,m,S.lv,d,annual,{extOffered:false}); card('info','續約',`與 <b class="hl">${S.teamName()}</b> 完成續約：固定年薪 <b class="hl">${fmtMoney(annual)}</b> × <b class="hl">${y} 年</b>，合約總額 <b class="hl">${fmtMoney(total)}</b>。`); advance(); })},
    {t:'跳出合約，測試自由市場',warn:true,s:'成績不佳可能乏人問津，只能回原隊減薪',f:()=>faMarket(o,d)}];
  if(S.org!=='CPBL'&&o>=LV.CPBL1.min){
    faOpts.push({t:'返台加盟中職一軍',s:'落葉歸根，回到熟悉的主場', f:()=>{ signTo('CPBL','CPBL1'); card('good','返鄉',`結束海外的挑戰，你選擇回到 <b class="hl">${S.teamName()}</b>，在家鄉球迷面前繼續揮灑。`); advance(); }});
  } choose(`合約到期 · 取得自由球員（FA）資格（球隊奪冠率 ${teamChampRate(S.orgTeam)}%）`,faOpts);
}

function marketRetirementText(){
  const love=S.love||{},kidCount=Math.max(0,love.kids||0); const hasFamily=love.st==='married'&&love.partner&&kidCount>0; const family=hasFamily?`你想了想${love.partner}與${kidCount===1?'孩子':'孩子們'}，不想錯過孩子的成長。`:'';
  return `回想從小到大的棒球生涯，在紅土上拚搏，身體早已累積大大小小的傷。回過身來看看自己的家人，有多久沒有跟他們好好吃頓飯了？${family}是該多花一點時間，陪伴自己的家人了。你將沒簽字的合約書推回，決定脫下球衣、高掛球鞋，走向下一段精彩的人生。`;
}
function retireFromMarket(){ daibaFarewell(()=>endGame(marketRetirementText())); }

function homecomingAfterRejectedOffer(o){
  const homeLv=o>=LV.CPBL1.min?'CPBL1':'CPBL2';
  const homeTeam=S.lastCpblTeam||capTeam('CPBL')||pick(CPBL_TEAMS);
  const annual=calcContractAnnual(homeLv,marketRating(S.lastD||0,homeLv),1);
  choose(`落葉歸根 · 球團評估從${LV[homeLv].n}出發`,[
    {t:`返台加盟 ${homeTeam}（${LV[homeLv].n}）`,main:true, s:`綜合 ${o}｜一軍門檻 ${LV.CPBL1.min}｜固定年薪 ${fmtMoney(annual)} × 1 年`,f:()=>{ signTo('CPBL',homeLv,homeTeam,1,1,annual); card('good','落葉歸根',`你婉拒了海外合約，選擇回到 <b class="hl">${homeTeam}</b>，並從 <b class="hl">${LV[homeLv].n}</b>重新出發。`); advance(); }},
    {t:'就此引退',warn:true,s:'不再簽下新合約，結束球員生涯',f:retireFromMarket}
  ]);
}

function faMarket(o,d,settings){
  const org=S.org, lv=S.lv, offers=[];
  const cold=!!(settings&&settings.cold),oldTeam=(settings&&settings.oldTeam)||S.orgTeam;
  const mp=contractMarketProfile(d), value=mp.rating;
  const cap=S.pos==='P'?pitcherContractCap():15;
  if(cold){
    const team=pick(teamListOf(org).filter(t=>t!==oldTeam)),mult=+(0.90*mp.aav).toFixed(2);
    const annual=calcContractAnnual(lv,mp.rating,mult);
    offers.push({team,org,lv,yrs:1,mult,annual,bonus:0,cold:true});
  }else{
    let n=value>=3?ri(2,4):value>=1?ri(1,3):value>=-1?(chance(60)?ri(1,2):0):(chance(30)?1:0);
    if(mp.drop){ n=Math.max(0,n-mp.drop); if(!mp.star&&mp.proveIt&&chance(mp.status==='rehab'?60:40))n=0; }
    if(S.traits.cancer)n=Math.max(0,n-1); 
    makeOffers(org,n,({CPBL1:200,NPB1:800,MLB:2000})[lv]||100,1,cap,lv,S.orgTeam).forEach(of=>{of.yrs=faYears(value,cap,mp); of.mult=+(0.97+R()*0.08).toFixed(2); of.bonus=Math.round(of.bonus*mp.bonus); offers.push({...of,org});});
  }
  const crossHealthy=mp.status==='healthy'||mp.status==='minor'||(mp.star&&chance(mp.status==='major'?35:20));
  if(crossHealthy&&lv==='CPBL1'&&o>=53)makeOffers('NPB',cold?ri(1,2):1,1000,2,3,o>=51?'NPB1':'NPB2',null).forEach(of=>{of.bonus=Math.round(of.bonus*mp.bonus);offers.push({...of,org:'NPB',mult:+(0.97+R()*0.08).toFixed(2)});});
  if(crossHealthy&&lv==='NPB1'&&o>=60){
    const freeAgent=(S.npbYears||0)>=7;
    if(freeAgent || chance(Math.round(50*ageGateUSA(o,60)))){
      makeOffers('MiLB', freeAgent?ri(1,2):1, 3000, 3,5,'MLB',null).forEach(of=>{ const posting=!freeAgent; of.bonus=posting?0:Math.round(of.bonus*mp.bonus); offers.push({...of,org:'MiLB',mult:+(0.97+R()*0.08).toFixed(2),posting}); });
    }
  }
  if(!offers.length){
    card('bad','自由市場',`電話一直沒有響。經紀人聳聳肩——市場對你的評價比想像中冷。${mp.label?`<br><span class="dn">${mp.label}</span>`:''}`);
    const fallbackAnnual=calcContractAnnual(S.lv,mp.rating,+(0.70*mp.aav).toFixed(2));
    choose('沒有球隊開價',[
      {t:`回 ${S.teamName()} 減薪簽約`,main:true,s:`固定年薪 ${fmtMoney(fallbackAnnual)} × 1 年｜合約總額 ${fmtMoney(fallbackAnnual)}`, f:()=>{ S.ct=makeContract(1,0.7,S.lv,mp.rating,fallbackAnnual); card('bad','減薪合約',`低著頭回到 <b class="hl">${S.teamName()}</b>，簽下固定年薪 <b class="hl">${fmtMoney(S.ct.annual)}</b>的一年約。`); advance(); }},
      {t:'就此引退',warn:true,f:()=>endGame('FA 市場乏人問津，'+S.year+' 年黯然引退。')}]); return;
  }
  const estL=of=>termEstimate(of.lv,d,of.mult||1,mp);
  const cty=og=>({CPBL:'🇹🇼 台灣',NPB:'🇯🇵 日本',MiLB:'🇺🇸 美國',MLB:'🇺🇸 美國'})[og]||'';
  const ctyOrder={CPBL:0,NPB:1,MiLB:2,MLB:2};
  offers.sort((a,b)=>(ctyOrder[a.org]??9)-(ctyOrder[b.org]??9)); 
  const offerOpts=offers.map(of=>of.cold?({
    t:`${cty(of.org)}｜${of.team}（${LV[of.lv].n}）`, s:`球團冷處理報價｜固定年薪 ${fmtMoney(of.annual)} × 1 年｜原行情 ×0.90`,
    f:()=>{ signTo(of.org,of.lv,of.team,1,of.mult,of.annual); card('info','轉投新東家',`原球團不願意簽你，所以<b class="hl">${of.team}</b>趁虛而入，用較低的代價帶走了你。`); advance(); }
  }):({
    t:`${cty(of.org)}｜${of.team}（${LV[of.lv].n}）`, s:`${of.posting?'日美入札｜讓渡金依最終合約另計':`簽約金 ${fmtMoney(of.bonus)}`}｜奪冠率 ${teamChampRate(of.team)}%｜長/短：${estL(of)}`,
    f:()=>{ const savedLv=S.lv,formerTeam=S.teamName(); S.lv=of.lv;
      termChoice(o,d,`${of.team} · 選擇合約類型`,(y,m,annual,total)=>{ S.lv=savedLv;
        if(!of.posting)S.salary+=of.bonus; const release=of.posting?postingReleaseFee(total):0; signTo(of.org,of.lv,of.team,y,m,annual);
        if(of.posting)card('gold','入札成立',`<b class="hl">${of.team}</b>與你簽下固定年薪 <b class="hl">${fmtMoney(annual)}</b> × <b class="hl">${y} 年</b>、保障總額 <b class="hl">${fmtMoney(total)}</b>的合約；另支付 <b class="hl">${fmtMoney(release)}</b>讓渡金給 <b class="hl">${formerTeam}</b>。讓渡金不計入你的生涯收入。`);
        advance(); }, ()=>{ S.lv=savedLv; if(org==='CPBL')retireFromMarket(); else homecomingAfterRejectedOffer(o); },org==='CPBL'?'拒絕合約，宣布引退':'落葉歸根',org==='CPBL'?'不接受這份合約，直接結束球員生涯':'婉拒這份合約，查看返台層級或選擇引退',of.mult||1); }}));
  const finalOpt=cold ?{t:'就此引退',warn:true,s:'不接受任何報價，結束球員生涯',f:retireFromMarket}
    :{t:`回原隊（${S.teamName()}）1 年約`,s:`固定年薪 ${fmtMoney(calcContractAnnual(S.lv,mp.rating,+(0.90*mp.aav).toFixed(2)))} × 1 年｜合約總額 ${fmtMoney(calcContractAnnual(S.lv,mp.rating,+(0.90*mp.aav).toFixed(2)))}`, f:()=>{ const annual=calcContractAnnual(S.lv,mp.rating,+(0.90*mp.aav).toFixed(2)); S.ct=makeContract(1,0.9,S.lv,mp.rating,annual); card('info','回歸',`重回 <b class="hl">${S.teamName()}</b>，固定年薪 <b class="hl">${fmtMoney(S.ct.annual)}</b>。`); advance(); }};
  choose(`${cold?'球團冷處理後的':'自由市場'}報價一覽（依國家分列）<div style="margin-top:8px;color:var(--dim);font-size:13px">目前年薪：<b class="hl">${fmtMoney(contractAnnual())}</b>${mp.label?`｜<span class="dn">${mp.label}</span>`:''}</div>`,[...offerOpts,finalOpt]);
}

function ageGateUSA(o,minReq){ const age=S.age; if(age<=22)return 1.0; if(age<=24)return 0.75; if(age<=26)return 0.5; if(age<=27)return 0.3; if(age<=28)return 0.15; return o>=minReq+5 ? 0.08 : 0; }
function ageGateJP(){ const age=S.age; if(age<=26)return 1.0; if(age<=28)return 0.7; if(age<=30)return 0.45; if(age<=31)return 0.25; return 0; }

function crossOffers(o){
  const fin=()=>advance(); const mp=contractMarketProfile(S.lastD||0);
  if((mp.status==='major'||mp.status==='rehab')&&(!mp.star||!chance(mp.status==='major'?35:20))){ fin(); return; }
  const priceBid=(of,lv)=>{ const target=contractMarketProfile(S.lastD||0,lv); of.bonus=Math.round(of.bonus*target.bonus); of.annual=calcContractAnnual(lv,target.rating,+(target.aav*(0.97+R()*0.08)).toFixed(2)); return of; };
  if(S.lv==='CPBL1'&&o>=53&&(S.lastD||0)>=1&&chance(Math.round(35*ageGateJP()))){
    const jl=o>=51?'NPB1':'NPB2'; const bids=makeOffers('NPB',2,1200,2,3,jl,null).map(of=>priceBid(of,jl));
    choose('日職球團開出旅外合約',[...bids.map(of=>({ t:of.team+`（${LV[jl].n}）`,s:`簽約金 ${fmtMoney(of.bonus)}｜固定年薪 ${fmtMoney(of.annual)} × ${of.yrs} 年｜總額 ${fmtMoney(of.annual*of.yrs)}`, f:()=>{S.salary+=of.bonus;signTo('NPB',jl,of.team,of.yrs,1,of.annual);fin();}})), {t:'留在中職',main:true,f:fin}]); return; }
  if(S.lv==='CPBL1'&&o>=57&&(S.lastD||0)>=2&&chance(Math.round(30*ageGateUSA(o,57)))){
    const ml=o>=60?'MLB':'A3'; const bids=makeOffers('MiLB',2,2000,2,4,ml,null).map(of=>priceBid(of,ml));
    choose('大聯盟球探遞出合約',[...bids.map(of=>({ t:of.team+`（${LV[ml].n}）`,s:`簽約金 ${fmtMoney(of.bonus)}｜固定年薪 ${fmtMoney(of.annual)} × ${of.yrs} 年｜總額 ${fmtMoney(of.annual*of.yrs)}`, f:()=>{S.salary+=of.bonus;signTo('MiLB',ml,of.team,of.yrs,1,of.annual);fin();}})), {t:'留在中職',main:true,f:fin}]); return; }
  if(S.lv==='NPB1'&&o>=60&&(S.lastD||0)>=2&&chance(Math.round(30*ageGateUSA(o,60)))){
    const bids=makeOffers('MiLB',ri(2,3),0,3,6,'MLB',null).map(of=>({...of,mult:+(0.97+R()*0.08).toFixed(2)}));
    const formerTeam=S.teamName();
    choose('入札制度：大聯盟多隊競標你的合約',[...bids.map(of=>({ t:of.team,s:`${termEstimate('MLB',S.lastD||0,of.mult,mp)}｜讓渡金依最終保障總額另計`, f:()=>{ const savedLv=S.lv; S.lv='MLB'; termChoice(o,S.lastD||0,`${of.team} · 入札合約類型`,(y,m,annual,total)=>{ S.lv=savedLv; const release=postingReleaseFee(total); signTo('MiLB','MLB',of.team,y,m,annual); card('gold','入札成立',`<b class="hl">${of.team}</b>與你簽下固定年薪 <b class="hl">${fmtMoney(annual)}</b> × <b class="hl">${y} 年</b>、保障總額 <b class="hl">${fmtMoney(total)}</b>的合約；另支付 <b class="hl">${fmtMoney(release)}</b>讓渡金給 <b class="hl">${formerTeam}</b>。讓渡金不計入你的生涯收入。`); fin(); },()=>{ S.lv=savedLv; fin(); },'留在日職','不接受這份入札合約，留在原球隊',of.mult); }})), {t:'留在日職',main:true,f:fin}]); return; }
  fin();
}

function runDraftJP(fromSchool,cb){
  const o=ovr(); const score=o+Math.max(0,22-S.age)*2+ri(-4,4);
  const rd=score>=58?1:score>=52?2:score>=47?ri(3,4):score>=42?ri(5,7):score>=38?ri(8,10):0;
  if(rd===0){ card('bad','選秀落榜','唱名結束，未獲指名。'); if(fromSchool){ card('info','','回到球隊。'); cb(); } else cb('fail'); return; }
  const bonus=[0,10000,8000,6000,4500,3000,3000,2000,1000,1000,1000][rd]||1000; 
  const lv=(rd<=2&&o>=52)?'NPB1':'NPB2'; const team=pick(NPB_TEAMS);
  const accept=()=>{ S.stage='PRO'; S.team=''; S.salary+=bonus; S.svc=0; S.faElig=false; signTo('NPB',lv,team,ri(2,3),1); card('gold','日本職棒選秀會',`第 <b class="hl">${rd}</b> 指名加入 <b class="hl">${team}</b>！簽約金 ${fmtMoney(bonus)}。`); tlNote(4,'選秀第'+rd+'指名'); board(0); cb(); };
  if(rd>=3&&S.age<24){
    choose(`日本職棒選秀會 · 第 ${rd} 指名 (${team})`,[
      {t:'接受指名，加盟球隊',main:true,s:`簽約金 ${fmtMoney(bonus)}`,f:accept},
      {t:(S.stage==='HS'||(S.stage==='U'&&S.stageYr<4))?'重返校園，再拚一年':'重返社會人，再拚一年',warn:true,s:'放棄本次指名',f:()=>{
        const goUni=(S.stage==='HS')||(S.stage==='U'&&S.stageYr<4); const fresh=(S.stage==='HS');
        card('info',goUni?'重返校園':'重返社會人','決定繼續磨練，提升自己的評價。');
        if(fresh){ S.stage='U'; S.stageYr=0; S.team=pick(['早稻田大學','慶應義塾大學','法政大學','明治大學']); } else if(!goUni){ S.stage='AMA'; S.team=pick(['豐田汽車','JR東日本','東京瓦斯','ENEOS']); }
        if(fromSchool) cb(); else advance(); }}]); return; 
  } accept();
}

function runDraft(fromSchool,cb){
  const o=ovr(); const score=o+Math.max(0,22-S.age)*2+ri(-4,4);
  const rd=score>=56?1:score>=49?2:score>=43?ri(3,4):score>=37?ri(5,7):score>=30?ri(8,10):0;
  if(rd===0){ card('bad','選秀落榜',`唱名一輪又一輪，始終沒有你的名字。（綜合 ${o}｜年齡加權後評價 ${score}）`); if(fromSchool){ card('info','','回到校隊，明年再來。'); cb(); } else cb('fail'); return; }
  const bonus=[0,1000,600,350,350,150,150,150,50,50,50][rd]||50; const lv=(rd===1&&o>=50)?'CPBL1':'CPBL2'; const team=pick(CPBL_TEAMS);
  const accept=()=>{ S.stage='PRO'; S.team=''; S.salary+=bonus; S.svc=0; S.faElig=false; signTo('CPBL',lv,team,ri(2,3),1); card('gold','中華職棒選秀會',`第 <b class="hl">${rd}</b> 輪獲 <b class="hl">${team}</b> 指名！簽約金依順位為 <b class="hl">${fmtMoney(bonus)}</b>。${lv==='CPBL1'?'即戰力評價，直接放入一軍名單。':'先從二軍出發。'}`); tlNote(4,'選秀第'+rd+'輪'); board(0); cb(); };
  if(rd>=3&&S.age<24){
    choose(`中華職棒選秀會 · 第 ${rd} 輪獲 ${team} 指名`,[
      {t:'接受指名，加盟球隊',main:true,s:`簽約金 ${fmtMoney(bonus)}｜${lv==='CPBL1'?'一軍':'二軍'}出發`,f:accept},
      {t:(S.stage==='HS'||(S.stage==='U'&&S.stageYr<4))?'重返校園，再拚一年':'重返業餘，再拚一年',warn:true,s:'放棄本次指名，明年重新參加選秀',f:()=>{
        const goUni=(S.stage==='HS')||(S.stage==='U'&&S.stageYr<4); const fresh=(S.stage==='HS');
        card('info',goUni?'重返校園':'重返業餘',`看到被選到的輪次，雙眼發黑，原本以為會在前段輪次被選中，卻落到了後段的輪次。你握緊了拳頭，決定${goUni?(fresh?'進入大學繼續深造':'留在校隊繼續磨練'):'重返業餘'}，這一次，你一定要上台戴上所屬球隊的帽子。`);
        if(fresh){ S.stage='U'; S.stageYr=0; S.team=pick(['文化大學','輔仁大學','國立體大','台灣體大','開南大學']); } else if(!goUni){ S.stage='AMA'; S.team=pick(['合電','台庫','安妞先物','美麗珊瑚']); }
        if(fromSchool) cb(); else advance(); }}]); return; 
  } accept();
}

function pathChoiceHS(){
  const o=ovr();
  const opts=[{t:'就讀大學（延長養成）',s:'一年僅 2 場大賽加點｜大二起每年可投入選秀',f:()=>{ S.stage='U'; S.stageYr=0; S.team=pick(['文化大學','輔仁大學','國立體大','台灣體大','開南大學']); card('info','升學',`進入 <b class="hl">${S.team}</b> 棒球隊。`); advance(); }},
    {t:'投入中華職棒選秀',s:'目前綜合 '+o,f:()=>runDraft(false,r=>{ if(r==='fail')choose('落榜之後',[{t:'改就讀大學',main:true,f:()=>{S.stage='U';S.stageYr=0;S.team=pick(['文化大學','輔仁大學','國立體大','台灣體大']);advance();}},{t:'加入業餘成棒隊',f:()=>{S.stage='AMA';S.team=pick(['合電','台庫','安妞先物','美麗珊瑚']);advance();}}]); else advance(); })}];
  if(o>=44)opts.push({t:'洽談旅日合約',s:'從日職二軍（支配下）出發｜滿 8 年視同本土',f:()=>{ S.stage='PRO'; pickOfferUI('日職球團的育成報價','NPB',makeOffers('NPB',ri(2,3),800,3,3,'NPB2',null),()=>{ card('gold','旅日','目標：一軍初登場。'); advance(); }); }});
  if(o>=50)opts.push({t:'洽談旅美合約',main:true,s:`從${o>=54?' 1A ':'新人聯盟'}出發，逐級挑戰大聯盟`,f:()=>{ S.stage='PRO'; pickOfferUI('大聯盟球團的國際簽約報價','MiLB',makeOffers('MiLB',ri(2,3),1500,3,4,o>=54?'A1':'R',null),()=>{ card('gold','旅美','美國的紅土，等著你去征服。'); advance(); }); }});
  choose(`高中畢業 · 綜合能力 ${o} · 人生的第一個路口`,opts);
}

function pathChoiceU4(){
  const o=ovr();
  const opts=[{t:'投入中華職棒選秀',main:true,s:'綜合 '+o+'｜大學畢業年齡加權下降',f:()=>runDraft(false,r=>{ if(r==='fail')choose('落榜之後',[{t:'加入業餘成棒隊',f:()=>{S.stage='AMA';S.team=pick(['合電','台庫','安妞先物']);advance();}},{t:'高掛球鞋',warn:true,f:()=>endGame('大學畢業選秀落榜，決定告別球場。')}]); else advance(); })}];
  const agePenalty=Math.max(0,S.age-18); const reqNPB=44+Math.floor(agePenalty/2); const reqMiLB=50+Math.floor(agePenalty/2); const bonusNPB=Math.max(100,800-agePenalty*180); const bonusMiLB=Math.max(150,1500-agePenalty*350);
  if(o>=reqNPB)opts.push({t:'洽談旅日合約',s:'大齡新秀，簽約行情極低',f:()=>{S.stage='PRO'; pickOfferUI('日職球團報價','NPB',makeOffers('NPB',2,bonusNPB,2,3,'NPB2',null),advance);}});
  if(o>=reqMiLB)opts.push({t:'洽談旅美合約',s:'大齡底薪簽約 (Senior Sign)',f:()=>{S.stage='PRO'; pickOfferUI('大聯盟球團報價','MiLB',makeOffers('MiLB',2,bonusMiLB,3,4,o>=55?'A1':'R',null),advance);}});
  choose(`大學畢業 · 綜合能力 ${o}`,opts);
}
