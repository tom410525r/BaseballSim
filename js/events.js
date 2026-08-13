function evOdds(){
  let base=(S.traits.genius||S.traits.late||S.traits.clutch)?70:50;
  if(S.traits.thief)base-=10;
  const boldPen=S.traits.clutch?0:15;
  return {safe:Math.min(95,base+20), norm:base, bold:base-boldPen};
}
function drawEvents(n,done){
  if(n<=0){ done(); return; }
  choose('',[{t:`抽事件卡（剩 ${n} 張）`,main:true,f:()=>{
    const pool=EVENTS.filter(e=>e.for==='*'||(e.for==='P'&&(S.pos==='P'||S.pos==='TW'))||((e.for==='A'||e.for==='B')&&S.pos!=='P')||(e.for==='PRO'&&S.stage==='PRO'));
    const ev=pick(pool);
    const od=evOdds();
    const after=()=>{ board(1); drawEvents(n-1,done); };
    choose(`事件｜${ev.n} — 你要怎麼應對？`,[
      {t:'全力一搏',warn:true,s:`成功率 ${od.bold}%｜${S.traits.clutch?'成功 +4／失敗僅 −2':'加成／減益幅度最大（±3）'}`,f:()=>{resolveEvent(ev,'bold',after);}},
      {t:'照常執行',main:true,s:`成功率 ${od.norm}%｜標準幅度（±2）`,f:()=>{resolveEvent(ev,'norm',after);}},
      {t:'保守應對',s:`成功率 ${od.safe}%｜加成／減益幅度最小（±1）`,f:()=>{resolveEvent(ev,'safe',after);}}]);
  }}]);
}
function loveEvent(next){
  const L=S.love;
  if(S.stage!=='PRO'||S.age<20){ next(); return; }
  if(L.st==='dating'){
    L.dyrs=(L.dyrs||0)+1;
    const y=L.dyrs;
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
      if(r<40){ const t=pick(CHEER.filter(n=>n!==L.partner));
        choose(`聚餐散場，${t} 說順路想搭你的車`,[
          {t:'讓她上車（賭一把）',warn:true,s:'沒被抓到＝體力提升｜被抓到＝能力下跌、當年分手率+30%',f:()=>{
            L.affairs++;
            if(chance(55)){ const gt=loveGainTxt('sta',2); board(1);
              card('bad','深夜兜風',`沒有人拍到。你把方向盤握得很緊——${gt}。（這條路不會有好結局）`); ask(); }
            else loveCaughtDating(next); }},
          {t:`「不順路。」直接載 ${L.partner} 回家`,main:true,s:'感情穩固，絕對不虧',f:()=>{
            const gt=loveGainTxt('sta',1); board(1);
            card('good','正確答案',`你傳訊息給 ${L.partner}：「馬上到。」——${gt}。`); ask(); }}]); return; }
      if(r<70){ const gt=loveGainTxt('sta',1); board(1);
        card('good','明星賽放閃',`明星賽表演賽，鏡頭掃到看台上的 <b class="hl">${L.partner}</b>，你隔著全場比了一個手勢，轉播單位立刻切出愛心特效，隔天甜上熱搜——${gt}。`); ask(); return; }
      const gt=loveGainTxt('sta',1); board(1);
      card('good','愛情長跑',`交往邁入第 ${y} 年。沒有大新聞，只有每個客場系列賽結束後，機場出口那杯她替你買好的熱美式——${gt}。`); ask(); return; }
    ask(); return;
  }
  const fire=(L.st==='married'&&L.kids===0)?40:(L.st==='single'||L.st==='divorced')?40:30;
  if(!chance(fire)){ next(); return; }
  if(L.st==='single'||L.st==='divorced'){
    const p=pick(CHEER);
    card('info','場外話題',`你和啦啦隊女神 <b class="hl">${p}</b> 被拍到球場外同框，緋聞登上娛樂版頭條。${L.exes.length?'（評論區：「離過婚還這麼搶手」）':''}`);
    choose('記者把麥克風遞到你面前：「兩位是在交往嗎？」',[
      {t:'大方承認：「請大家祝福我們」',s:'還要看她那邊敢不敢承認（球團有禁愛令傳聞）',f:()=>{
        if(chance(65)){ L.st='dating'; L.partner=p; L.dyrs=0; L.datedTimes=(L.datedTimes||0)+1;
          const gt=loveGainTxt('sta',1); board(1);
          card('gold','戀情公開',`<b class="hl">${p}</b> 在社群發出十指緊扣的照片：「謝謝大家的祝福。」戀愛使人容光煥發——${gt}。你們正式交往了。`);
          if(L.datedTimes>=3&&L.kids===0&&!S.traits.married&&!S.traits.confidante){ S.traits.confidante=true;
            card('gold','隱藏稱號：閨中密友',`第三段戀情，還是走到了同樣的結局。「我愛上了你，你卻只把我當好姊妹。」——有些人註定是別人生命裡的過客。`); board(1); }
        }
        else{ card('bad','單方面承認',`她隔天透過經紀公司否認：「只是普通朋友。」據傳啦啦隊<b class="dn">禁愛令</b>壓力不小。你一個人站在風裡，超級尷尬。`); }
        next(); }},
      {t:'笑而不答，快步走過',main:true,s:'不承認就沒有下文',f:()=>{
        card('info','未完待續','緋聞燒了三天就退燒。也許時機還沒到。'); next(); }}]); return;
  }
  if(L.kids<4&&chance([65,45,30,20][L.kids])){
    L.kids++; const kk=pick(POS_AB[S.pos]); const gt=loveGainTxt(kk,2); board(1);
    card('gold','新生命',`${L.partner} 平安生下你們的第 <b class="hl">${L.kids}</b> 個孩子。當了${L.kids>1?'幾次':''}爸爸的男人，眼神都不一樣了——${gt}。`);
    next(); return;
  }
  const r=R()*100;
  if(r<40){
    const t=pick(CHEER.filter(n=>n!==L.partner));
    choose(`客場飯店酒吧，${t} 傳來訊息：「睡了嗎？」`,[
      {t:'赴約（賭一把）',warn:true,s:'沒被抓到＝體力提升｜被抓到＝能力下跌、婚姻危機',f:()=>{
        L.affairs++;
        if(chance(55)){ const gt=loveGainTxt('sta',2); board(1);
          card('bad','深夜行程',`你僥倖沒被拍到。不知為何，罪惡感反而讓你精神亢奮——${gt}。（你知道這不會有好下場）`);
          next(); }
        else loveCaught(next); }},
      {t:'回訊息：「陪小孩讀完故事書了，晚安」',main:true,s:'家庭和睦，絕對不虧',f:()=>{
        const gt=loveGainTxt('sta',1); board(1);
        card('good','家的方向',`你把手機扣在桌上，撥了視訊回家。${L.partner} 和孩子在鏡頭那頭揮手。心定了，身體就穩了——${gt}。`); next(); }}]); return; }
  if(r<70&&L.kids>0){
    const gt=loveGainTxt('sta',1); board(1);
    card('good','球場邊的父親',`你被拍到賽前隔著護網教孩子怎麼戴手套，影片配文「最強棒球教室」瘋傳。網友：「這才是人生勝利組。」——${gt}。`); next(); return; }
  const gt=loveGainTxt('sta',1); board(1);
  card('good','結婚紀念日',`結婚紀念日，你推掉了自主訓練，陪 <b class="hl">${L.partner}</b> 回到當年辦婚禮的場地。她說：「明年也要來喔。」——${gt}。`); next();
}
function divorceRec(){ const L=S.love; L.exes.push({name:L.partner,kids:L.kids}); L.st='divorced'; L.partner=null; L.kids=0; }
function loveCaught(next){
  const L=S.love; L.caught++;
  const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3);
  let extra='';
  if(L.caught>=2){
    if(!S.traits.scum){ S.traits.scum=true;
      card('bad','隱藏屬性解鎖：渣男','第二次被逮個正著。從今以後你在球迷心中的形象定型了——<b class="dn">每次外遇被抓到，全能力 −5</b>。'); }
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
    {t:'就是現在——求婚',s:'固定加成：全體力提升、本季更不容易受傷',f:()=>{ L.st='married'; L.kids=0; L.dyrs=0; const gTxt=loveGainTxt('sta',2)+'、'; S.tmpInj-=5; board(1); card('gold','婚禮',`你在主場本壘板後方單膝跪地，大螢幕打出「Marry Me」。<b class="hl">${L.partner}</b> 哭著點頭。休賽季完婚，紅毯用壘包排成——${gTxt}本季受傷機率 <b class="up">−5%</b>。`); next(); }},
    {t:'再存一點錢吧',main:true,s:'她沒說什麼,但交往越久分手風險越高',f:()=>{ card('info','再等等','她關掉影片，笑著說沒事。你假裝沒看到她眼裡的東西。'); next(); }}]);
}
function loveCaughtDating(next){
  const L=S.love; L.caught++; L.cheatYr=S.year;
  const kk=pick(POS_AB[S.pos]); const g=addAb(kk,-3); let extra='';
  if(L.caught>=2){ if(!S.traits.scum){ S.traits.scum=true; card('bad','隱藏屬性解鎖：渣男','第二次被逮個正著。從今以後你在球迷心中的形象定型了——<b class="dn">每次劈腿/外遇被抓到，全能力 −5</b>。'); }
    POS_AB[S.pos].forEach(k=>{ S.ab[k]=clamp(S.ab[k]-5,1,80); }); extra='<b class="dn">全能力 −5</b>（渣男的代價）。'; }
  board(1);
  card('bad','劈腿曝光',`行車紀錄器畫面流出，時間軸對得整整齊齊。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
  choose(`${L.partner} 已讀不回三天後，終於答應見面`,[
    {t:'道歉，求她再給一次機會',s:'成功保保住感情｜失敗＝再扣能力並分手',f:()=>{
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
  const pk=(S.pot&&S.pot[k])||62, isP=S.pos==='P'||S.pos==='TW';
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
      const pk=(S.pot&&S.pot[k])||62, isP=S.pos==='P'||S.pos==='TW';
      let cur=S.ab[k], bud=step, cr=(S.carry&&S.carry[k])||0, gained=0;
      if(cur>=pk){ statBonus(bud,out); } else {
        while(bud>0 && cur<pk){
          let c = isP ? (cur>=66?7:cur>=58?4:cur>=50?2:1) : (cur>=72?3:cur>=64?2:1);
          bud--; cr++; if(cr>=c){ cr-=c; cur++; gained++; }
        }
        if(!S.carry) S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
        if(gained>0) out.push(`${ABL[k]} <span class="up">+${gained}</span>`);
        else if(bud<=0) out.push(`${ABL[k]}：能力加點，但不足以提升一級`);
        if(bud>0) statBonus(bud,out);
      }
      touched=true;
    } else { const g=addAb(k,step); touched=true; out.push(`${ABL[k]} <span class="dn">${g}</span>`); }
  };
  for(const k in fx){ const dir=fx[k]>0?1:-1;
    if(k==='inj'){ let v=({1:8,2:12,3:16,4:16})[mag]; if(mode==='bold'&&S.traits.clutch)v=12; S.tmpInj+=v; out.push(`本季受傷機率 <span class="dn">+${v}%</span>`);}
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
    if(focused&&focused===S.samePickKey)S.samePick++; else if(focused){ S.samePickKey=focused; S.samePick=1; } else { S.samePickKey=null; S.samePick=0; }
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
  if(!S.traits.disc&&S.age<25&&(S.cntSaveWin||0)>=15&&S.love.caught===0&&S.cntSnack<5){ traitCard('disc','自律狂','你見過凌晨四點的洛杉磯嗎？——年紀輕輕就把身體當成聖殿經營，沒有派對、沒有酒精，只有重訓室的鐵片聲：<b class="hl">整條衰退曲線延後兩年</b>，你的巔峰比同梯更長。'); }
  if(!S.traits.clutch&&S.age<25&&S.cntBoldWin>=7){ traitCard('clutch','大心臟','經歷了無數次的豪賭，你的心態堅毅無比，無論甚麼事情都不可能讓你心驚膽跳，從此以後，賭得更多，得到更多，輸得更少。——<b class="hl">「全力一搏」成功率提升至天才級、成功加成 +4、失敗只 −2、受傷風險降到普通級</b>，總冠軍與國際賽 MVP 機率提升。'); }
  if(!S.traits.distract&&!S.traits.disc&&(S.love.affairs+S.love.caught+S.cntSnack)>=4&&(S.love.affairs+S.love.caught)>=1){ traitCard('distract','外務纏身','通告、代言、社群媒體佔據了你太多心神，休賽季很久沒有完整專注在棒球上——<b class="dn">季初擲骰永久 −1 顆</b>（最低 2 顆）。','bad'); }
  if(!S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace&&(S.cntBoldFail>=10||S.traits.scum)){ traitCard('cancer','更衣室毒瘤','教練受夠了你的不可控，隊友對你的新聞指指點點。比起成績，球團現在更想清理休息室的氣氛——<b class="dn">季中被交易機率大增、續約條件惡化</b>。','bad'); }
  if(!S.traits.leader && S.age >= 32 && S.teamYears >= 5 && !S.traits.cancer && (S.lastD||0) >= -3) { traitCard('leader','休息室領袖','歲月帶走了你的爆發力，但帶不走你的智慧。只要你在休息室，年輕球員就不會迷失方向——<b class="hl">提升球隊奪冠率，且母隊永遠願意為你留一個位置</b>。'); }
}
function teamNick(team){ const map={'中信兄弟':'兄弟','統一獅':'獅子','樂天桃猿':'桃猿','富邦悍將':'悍將','味全龍':'龍','台鋼雄鷹':'雄鷹'}; return map[team]||(team||'').slice(-2); }
function teamChampRate(team){ let h=0; for(let i=0;i<team.length;i++)h=(h*31+team.charCodeAt(i))&0xffff; const base=8+(h%22); return Math.round(base); }
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
    if(S.traits.cancer){ removeTrait('cancer','更衣室毒瘤'); card('good','用成績說話','你用一整季的表現堵住了所有人的嘴——<b class="hl">更衣室毒瘤洗刷</b>。當初拒絕下放的決定，被證明是對的。'); board(1); }
    else card('good','守住身價','你證明了自己還配得上這份合約。');
  } else {
    if(!S.traits.thief){ S.traits.thief=true; card('bad','隱藏屬性解鎖：薪水小倫','拒絕下放後，你的成績依然沒有起色。球迷開始在社群叫你「薪水小倫」——<b class="dn">事件卡失敗率永久 +10%</b>，這個名聲跟著你到退休。'); board(1); }
    else card('bad','薪水小倫','又是虛擲的一年。看台上的噓聲更大了。');
  } cont();
}
function tradeCheck(cont){
  if(S.stage!=='PRO'||!LV[S.lv].top||S.seasonFactor<=0){ cont(); return; }
  const star = ovr()>=LV[S.lv].par+4; let p=15+ (S.tradeHeat||0);
  if(S.traits.cancer)p+=25; if(S.traits.ambience)p+=20;
  if(!chance(p)){ cont(); return; }
  if(S.traits.franchise||S.traits.mrteam){ card('info','非賣品',`他隊捧著誘人的包裹來詢價，高層連會議都沒開就回絕了——<b class="hl">「他是這座城市的象徵，非賣品。」</b>`); board(1); cont(); return; }
  if(star){
    if(S.traits.cancer){ doTradeExec(); card('bad','毒瘤交易','球團受夠了休息室的氣氛，直接把你打包送走。'); board(1); cont(); return; }
    choose('交易大限：他隊送來報價，球團徵詢你的否決權',[
      {t:'點頭同意，換個環境',main:true,f:()=>{ doTradeExec(); card('info','轉隊','你打包行李，前往新的城市。'); board(1); cont(); }},
      {t:'行使否決權，我要留下',warn:true,s:'未來 2 年冠軍機率略降、下張合約薪水 −15%',f:()=>{ S.tradeRefuse=2; card('info','否決交易',`你按下否決鍵。忠誠是一種選擇——球團的重建計畫被你打亂了，短期戰力和你的下張合約都會付出一點代價，但這件球衣，你留下來了。`); board(1); cont(); }}]);
    return; }
  choose('交易傳言：媒體報導你可能被交易',[
    {t:'公開抱怨表達不滿',warn:true,s:'增加本次被交易的可能性',f:()=>{ S.complainCount=(S.complainCount||0)+1;
      if(S.complainCount>=2&&!S.traits.ambience){ S.traits.ambience=true; card('bad','隱藏屬性解鎖：氣氛大師','你又一次對媒體大吐苦水。球團高層看在眼裡——這種選手，留著也是不定時炸彈。<b class="dn">往後轉隊機率永久提高</b>。'); board(1); }
      if(chance(60)){ doTradeExec(); card('bad','弄假成真',`你的抱怨上了頭條，球團順勢把你送走。新東家，好好打吧。`); board(1); } else card('info','雷聲大雨點小','抱怨歸抱怨，這次交易最後沒有成局。你還在原隊，但氣氛有點僵。'); cont(); }},
    {t:'保持沉默，專心打球',main:true,s:'交易機率不變',f:()=>{ if(chance(35)){ doTradeExec(); card('info','交易成局',`儘管你不動聲色，球團還是完成了這筆交易。'`); board(1); } else card('info','留了下來','傳言就是傳言。新球季，你還是穿著同一件球衣。'); cont(); }}]);
}
function doTradeExec(){ S.teamYears=0; S.champThisTeam=false; S.champTeam=null; const list=S.org==='CPBL'?CPBL_TEAMS:S.org==='NPB'?NPB_TEAMS:MLB_TEAMS; const nt=pick(list.filter(t=>t!==S.orgTeam)); S.orgTeam=nt; board(1); }

/* 加入判斷日本高校的賽事 */
function amateurSeason(){
  if(S.seasonFactor===0){ card('bad','','整季只能在場邊看著隊友比賽。'); S.log.push({y:S.year,age:S.age,tm:S.team||stageLabel(),line:'傷缺全季', inj:true}); nextStep(); return; }
  const cups = S.stage === 'HS' ? (S.hsRegion==='JP' ? ['春季甲子園','夏季甲子園','秋季大會'] : HS_CUPS) 
               : S.stage === 'U' ? (S.hsRegion==='JP' ? ['全日本大學野球錦標賽','明治神宮大會'] : U_CUPS) 
               : ['成棒甲組春季聯賽','成棒甲組秋季聯賽'];
  const thr=S.stage==='HS'?[52,46,40,34,28]:[60,54,48,42,36];
  let gain=0,lines=[],plain=[]; const tB=S.stage==='HS'?({1:6,2:0,3:-6})[S.hsTier||2]:0;
  cups.forEach(c=>{ const pw=ovr()+tB+ri(-8,8);
    const i=pw>=thr[0]?0:pw>=thr[1]?1:pw>=thr[2]?2:pw>=thr[3]?3:pw>=thr[4]?4:5;
    const rk=['冠軍','亞軍','四強','八強','十六強','預賽出局'][i];
    const pts=[7,5,4,3,2,1][i]+Math.floor(ovr()/22); gain+=pts; lines.push(`${c}：<b class="hl">${rk}</b>（+${pts} 點）`); plain.push(`${c}${rk}`);
    if(S.stage==='U'&&rk==='冠軍'&&!S.traits.academy){ S.traits.academy=true; card('gold','隱藏屬性解鎖：學院派','大學殿堂的科學化訓練與防護打下扎實基礎——<b class="hl">25 歲前受傷率 −5%、季初擲骰期望值提升</b>。'); }
    if(i===0)S.honors.push(`${S.year} ${c}冠軍`); });
  S.pool+=gain; S.log.push({y:S.year,age:S.age,tm:S.team||stageLabel(),line:plain.join('、'), inj:false});
  card('','年度大賽',lines.join('<br>')+`<div class="statline">獲得能力點 ${gain} 點，季末統一分配。能力越高，大賽收穫越多。</div>`); maybeIntl(()=>nextStep());
}

function proSeason(){
 const st=simSeason(S.lv); S.lastSt=st; S.lastD=st.d;
  const maxG = S.org === 'CPBL' ? 120 : S.org === 'NPB' ? 143 : 162; st.G = Math.min(st.G, maxG);
  if(S.pos==='P'){ st.G = Math.max(st.G, Math.ceil(st.IP/9)); st.SV = Math.min(st.SV || 0, st.G); st.HLD = Math.min(st.HLD || 0, st.G - (st.SV || 0));
    if ((st.W + st.L) > st.G) { const ratio = st.G / (st.W + st.L); st.W = Math.floor(st.W * ratio); st.L = Math.floor(st.L * ratio); }
  } else { st.PA = Math.max(st.PA, st.G); }
  if(S.pendStat>0&&S.seasonFactor>0){ const p=S.pendStat;
    if(S.pos==='P'){ if(!isSP()){ const addG=Math.min(Math.max(0,68-st.G),Math.round(p*1.2)); st.G+=addG; st.IP=+(st.IP+addG*1.05).toFixed(1); }
      st.SO+=p*8; st.IP=+(st.IP+p*4).toFixed(1); if(isSP())st.W+=Math.round(p*0.4); else st.SV+=Math.round(p*0.6);
      st.era=st.IP>0?clamp(st.era-p*0.05,1.40,9.90):st.era; st.ER=Math.round(st.era*st.IP/9);
      if(!isSP()){ st.SV=Math.min(st.SV||0,Math.floor(st.G*0.85)); st.HLD=Math.min(st.HLD||0,Math.max(0,st.G-st.SV)); const decCap=Math.max(0,st.G-st.SV-st.HLD); if((st.W+st.L)>decCap){ st.W=Math.min(st.W,decCap); st.L=Math.max(0,decCap-st.W); } } }
    else { const Lg=LV[S.lv]; const addG=Math.min(Math.max(0,(Lg.g||120)-st.G), Math.round(p*1.5)); const addPA=Math.round(addG*4.25), addAB=Math.round(addPA*0.9);
      st.G+=addG; st.PA+=addPA; st.AB+=addAB; let addH=Math.round(addAB*0.55)+Math.round(p*1.5); addH=Math.max(0,Math.min(addH, st.AB-st.H)); const addHR=Math.min(addH, Math.round(p*1.2));
      st.H+=addH; st.HR+=addHR; st.RBI+=Math.round(addHR*2.1+(addH-addHR)*0.3); st.avg=st.AB?st.H/st.AB:0; } }
  S.pendStat=0;
  if(S.pos==='P'&&S.seasonFactor>0){ const em={'全力投':1,'普通投':0,'養生球':-1}[S.effort]||0;
    if(em!==0){ st.d+=em; st.era=clamp(st.era-em*0.25,1.40,9.90); st.ER=Math.round(st.era*st.IP/9); st.SO=Math.round(st.SO*(1+em*0.06)); } }
  if(S.traits.onetool&&S.seasonFactor>0){ const boost=1.25; ['G','PA','AB'].forEach(k=>{ if(typeof st[k]==='number')st[k]=Math.round(st[k]*boost); }); ['H','HR','RBI','SB','BB'].forEach(k=>{ if(typeof st[k]==='number')st[k]=Math.round(st[k]*boost); }); st.avg=st.AB>0?st.H/st.AB:0; }
  const bucket=bucketOf(S.lv); accStat(bucket,st);
  if(S.seasonFactor===0){ card('bad','球季數據','（傷缺，本季無出賽紀錄）'); }
  else if(S.tradeFrom){ const r=0.35+R()*0.3, p1=portionOf(st,r), p2=portionOf(st,1-r); card('','球季數據（季中轉隊）', `<span class="tag">${S.tradeFrom}</span><div class="statline">${statLine(p1)}</div><span class="tag">${S.teamName()}</span><div class="statline">${statLine(p2)}</div><span class="tag">合計</span><div class="statline">${statLine(st)}</div>`); }
  else card('','球季數據',`<span class="tag">${S.teamName()}${S.dpos?'｜'+S.dpos:''}</span><div class="statline">${statLine(st)}</div>`);
  if(st.form===-1){ card('bad','巨大的低潮',`身體狀況很好，但是成績一直打不出來，遇到了巨大的低潮。孤獨、無助，就像是溺水一樣，只能隨意抓取孤木。`); }
  else if(st.form===1){ if(S.pos==='P'||S.pos==='TW') card('gold','生涯年','縫線掠過指尖的感覺無與倫比，而你投出去的球像是有了生命，用一個無人能想像得到的角度，閃過了打者的球棒，並穩穩投進捕手的手套。');
    else card('gold','生涯年','投來的每顆球看起來都像籃球一樣大，你看得到縫線、球的轉動，就和駭客任務的子彈一樣慢了下來，而你每一顆擊中甜蜜點的球，都往全壘打牆奔去。'); }
  const isInj = S.seasonFactor <= 0.45;
  S.log.push({y:S.year,age:S.age,tm:S.tradeFrom?`${S.tradeFrom}→${S.teamName()}`:S.teamName(),p:S.dpos||'',line:S.seasonFactor===0?'傷缺全季':statLine(st), inj: isInj, st: st});
  S.tradeFrom=null;
  const healthy=S.seasonFactor>=0.95&&((S.pos==='P'||S.pos==='TW')?(isSP()?st.IP>=120:st.G>=42):st.G>=LV[S.lv].g*0.8);
  if(healthy){ S.ironStreak++; if(S.ironStreak>=5&&!S.traits.iron){ S.traits.iron=true; card('gold','隱藏素質解鎖：鐵人','連續五年全勤級出賽！鋼鐵般的身體，未來每季受傷機率<b class="hl">不高於 10%</b>。'); } }
  else if(S.seasonFactor<0.95)S.ironStreak=0;
  if(S.pos!=='P'&&S.pos!=='TW'){ const tg=toolGap(); const isRegular = S.seasonFactor>0 && st.G >= LV[S.lv].g*0.60;
    if(!S.traits.onetool && !isRegular && tg.gap>=22 && tg.val>=58 && careerAllStars()<4){ S.traits.onetool=true; const wasBefore=S.removed.includes('只會這個'); S.removed=S.removed.filter(x=>x!=='只會這個'); S.toolRole=tg.role;
      if(wasBefore||S.age>=33) traitCard('onetool','只會這個',`歲月帶走了你的其他工具，只剩<b class="hl">${tg.role}</b>那一項本領還在。教練把你當成板凳上的秘密武器——關鍵時刻，你仍然可靠。`,'bad');
      else traitCard('onetool','只會這個',`你只有一項武器強得誇張，其餘全是破洞。教練不敢讓你先發，只在關鍵時刻派你上去做一件事——你成了球隊的<b class="hl">${tg.role}</b>。出賽數銳減，但那一項本領無人能及。`,'bad'); }
    else if(S.traits.onetool && (tg.gap<18 || (S.seasonFactor>0 && st.G>=LV[S.lv].g*0.60))){ removeTrait('onetool','只會這個'); S.toolRole=null; card('good','不再是工具人','教練終於敢把你放進先發打線——你證明了自己不只是板凳上的一招鮮。<b class="hl">「只會這個」解除</b>，你是個完整的球員了。'); board(1); } }
  awards(bucket,st);
  if((S.pos==='P'||S.pos==='TW')&&S.seasonFactor>0)tjAccrue();
  tjGamble(()=>demotionAudit(()=>tradeCheck(()=>maybeIntl(()=>nextStep()))));
}
function awards(bucket,st){
  if(!LV[S.lv].top||S.seasonFactor===0)return;
  const y=S.year,h=S.honors,lgN={CPBL:'中職',NPB:'日職',MLB:'大聯盟'}[bucket];
  const TH = { CPBL: { g: 120, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [130, 180], avg: [0.300, 0.360], hr: [20, 32], rbi: [75, 105], obp: [0.370, 0.430] },
    NPB:  { g: 143, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [155, 215], avg: [0.300, 0.360], hr: [24, 38], rbi: [90, 125], obp: [0.370, 0.430] },
    MLB:  { g: 162, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [175, 240], avg: [0.300, 0.360], hr: [27, 43], rbi: [100, 140], obp: [0.370, 0.430] } };
  const th = TH[bucket] || TH.CPBL;
  { const d=st.d; let asP=clamp(28+d*7,3,92); if(bucket==='CPBL'&&S.orgTeam==='中信兄弟')asP=clamp(asP+30,3,97);
    if(chance(asP)){ S.stats[bucket].AS++; h.push(`${y} ${lgN}明星賽`+((bucket==='CPBL'&&S.orgTeam==='中信兄弟'&&d<2)?'（人氣入選）':'')); } }
  const rookieOK=bucket!=='CPBL'||!(S.stats.NPB||S.stats.MLB||S.stats.MINOR);
  if(S.stats[bucket].yr===1&&rookieOK&&st.d>=4){ const rkP = clamp(30 + (st.d - 4) * 15, 30, 95); if(chance(rkP)) h.push(`${y} ${lgN}新人王`); }
  const checkP = (pst) => { const aw='年度最佳投手';
    if(isSP() && pst.era <= th.era[0] && pst.IP >= th.g){ const god = pst.era <= th.era[1] && pst.IP >= 150; const p = god ? 100 : clamp(30 + Math.round((th.era[0] - pst.era) * 35 + (pst.IP - th.g) * 0.4), 30, 95); if(chance(p)) h.push(`${y} ${aw}`); }
    if(S.role==='CL' && pst.SV >= th.sv[0]){ const god = pst.SV >= th.sv[1]; const p = god ? 100 : clamp(28 + (pst.SV - th.sv[0]) * 5, 28, 95); if(chance(p)) h.push(`${y} ${lgN}救援王`); }
    if(S.role==='MR' && (pst.HLD||0) >= th.hld[0]){ const god = (pst.HLD||0) >= th.hld[1]; const p = god ? 100 : clamp(28 + ((pst.HLD||0) - th.hld[0]) * 4, 28, 95); if(chance(p)) h.push(`${y} ${lgN}中繼王`); }
    if(pst.SO >= th.so[0]){ const god = pst.SO >= th.so[1]; const p = god ? 100 : clamp(25 + Math.round((pst.SO - th.so[0]) * 1.2), 25, 95); if(chance(p)) h.push(`${y} ${lgN}三振王`); } };
  const checkB = (bst) => {
    if(bst.PA >= 350 && bst.avg >= th.avg[0]){ const god = bst.avg >= th.avg[1]; const p = god ? 100 : clamp(25 + Math.floor((bst.avg - th.avg[0]) / 0.005) * 6, 25, 95); if(chance(p)) h.push(`${y} ${lgN}打擊王`); }
    if(bst.PA >= 300 && bst.HR >= th.hr[0]){ const god = bst.HR >= th.hr[1]; const p = god ? 100 : clamp(25 + (bst.HR - th.hr[0]) * 5, 25, 95); if(chance(p)) h.push(`${y} ${lgN}全壘打王`); }
    if(bst.PA >= 300 && bst.SB >= 25){ const god = bst.SB >= 45; const p = god ? 100 : clamp(25 + (bst.SB - 25) * 4, 25, 95); if(chance(p)) h.push(`${y} ${lgN}盜壘王`); }
    if(bst.PA >= 300 && bst.RBI >= th.rbi[0]){ const god = bst.RBI >= th.rbi[1]; const p = god ? 100 : clamp(25 + (bst.RBI - th.rbi[0]) * 2, 25, 95); if(chance(p)) h.push(`${y} ${lgN}打點王`); }
    const obp = bst.PA > 0 ? (bst.H + bst.BB) / bst.PA : 0;
    if(bst.PA >= 350 && obp >= th.obp[0]){ const god = obp >= th.obp[1]; const p = god ? 100 : clamp(25 + Math.floor((obp - th.obp[0]) / 0.005) * 5, 25, 95); if(chance(p)) h.push(`${y} ${lgN}上壘王`); }
    const def1 = bst.DEF || 0;
    if(S.dpos !== 'DH' && S.seasonFactor >= 0.7){
      if(def1 >= 6){ const pGlove = clamp(38 + (def1 - 6) * 5, 38, 95); if(chance(pGlove)) h.push(`${y} ${lgN}金手套`); }
      if(def1 >= 11){ const pDef = clamp(30 + (def1 - 11) * 6, 30, 95); if(chance(pDef)) h.push(`${y} ${lgN}守備王`); } } };
  if (st.isTW) { checkP(st.pitch); checkB(st); } else if (S.pos === 'P') { checkP(st); } else { checkB(st); }
  const mvpQual = (S.pos==='P' || S.pos==='TW') ? (isSP() ? (st.IP || (st.pitch && st.pitch.IP)) >= 120 : (st.G || (st.pitch && st.pitch.G)) >= 45) : st.PA >= LV[S.lv].g * 3.4;
  if(st.d >= 6 && mvpQual && S.seasonFactor >= 0.9){ const god = st.d >= 15; const baseMult = (S.pos === 'P' && S.role !== 'SP') ? 5 : 12;  const pMVP = god ? 100 : clamp(baseMult + (st.d - 6) * 11, baseMult, 95); if(chance(pMVP)) h.push(`${y} ${lgN}年度MVP`); }
  const added=h.filter(x=>x.startsWith(String(y)));
  if(added.length){ card('gold','年度獎項',added.map(x=>x.slice(5)).join('｜'));
    if(S.traits.yips){ removeTrait('yips','失憶症'); card('good','走出陰影','站上大舞台拿下獎項的那一刻，腦海裡的雜音消失了——<b class="hl">失憶症痊癒</b>。'); }
    if(S.traits.glass&&!S.traits.phoenix){ const big=added.some(x=>/MVP|最佳投手|打擊王|全壘打王|新人王/.test(x));
      if(big){ S.traits.phoenix=true; removeTrait('glass','玻璃人'); S.pool+=8; card('gold','隱藏屬性解鎖：浴火重生','那些殺不死你的，真的讓你更強大了。撕裂的韌帶長成更堅韌的形狀——<b class="hl">玻璃人懲罰解除，受傷率恢復正常，並獲得一大筆能力點</b>。'); } } }
}
function maybeIntl(done){
  const wbc=(S.year-2026)%4===0; let p12=(S.year-2028)%4===0;
  if(S.lv==='MLB')p12=false;
  if(S.stage!=='PRO'||(!wbc&&!p12)||ovr()<52||S.seasonFactor<0.5||S.rehab>0||S.skipMid){ done(); return; }
  const name=wbc?'世界棒球經典賽':'世界12強賽';
  let forced=false,first=false;
  if(S.intlLock===null){ S.intlLock=S.year; forced=true; first=true; } else if(S.year-S.intlLock<5) forced=true;
  if(forced){ card('info','體育署公文',first ?`「查 台端符合國家代表隊遴選資格，依規定<b class="hl">強制徵召</b>，並自即日起<b class="hl">列管五年</b>，列管期間各國際賽事皆須配合徵召，不得以任何理由推辭。」——你甚至還沒拆完信封，行李箱已經被球團打包好了。` :`列管期間（剩 ${5-(S.year-S.intlLock)} 年），依規定<b class="hl">強制徵召</b>。你沒有選擇。`); }
  const opts=[ {t:forced?'⋯⋯只能報到（強制徵召）':'披上國家隊戰袍',main:true,s:'依成績獲得能力點｜下季受傷機率 +10%',f:()=>{
      const b=clamp(Math.round((ovr()-52)*0.35),0,8), r=R()*100+b;
      const i=r>=96?0:r>=88?1:r>=79?2:r>=46?3:4;
      const rk=['冠軍','亞軍','季軍','複賽止步','預賽出局'][i], pts=[6,5,4,2,1][i];
      let gpts=pts; if(S.traits.intlace)gpts=Math.max(pts,2);
      S.pool+=gpts; S.injNext=S.traits.intlace?0:10; S.intlCount++;
      if(!S.traits.taiwan&&S.intlCount>5){ S.traits.taiwan=true; card('gold','隱藏稱號：Team Taiwan',`永遠把國家榮耀放在比職涯更高的位子，台灣球迷的心中永遠有一幅畫：你在球場上向全場比劃著胸口，那是你心中最榮耀的地方。`); board(1); }
      { const a=S.ab, par=52; const IS=S.intlStat;
        if(S.pos==='P'||S.pos==='TW'){ const dd=(a.vel+a.ctl+a.brk)/3-par; const ip=+(ri(4,9)+R()*3).toFixed(1); IS.IP=+(IS.IP+ip).toFixed(1); const k9=clamp(7.5+dd*0.12,4,14); IS.SO+=Math.round(ip/9*k9); const era=clamp(3.6-dd*0.16,0.8,8); IS.ER+=Math.round(era*ip/9); if(i<=2&&chance(45))IS.W++; if(!isSP()&&chance(30))IS.SV++; IS.G+=ri(1,3); }
        else { const dd=(a.con*0.5+a.pow*0.2+a.eye*0.18+a.spd*0.12)-par-0.5; const g=ri(5,8), pa=g*ri(3,4); IS.G+=g; IS.PA+=pa; const ab=Math.round(pa*0.86); IS.AB+=ab; const avg=clamp(0.270+dd*0.006,0.15,0.5); const h=Math.round(ab*avg); IS.H+=h; const hr=Math.round(h*clamp(0.06+Math.max(0,a.pow-par)*0.006,0.03,0.28)); IS.HR+=hr; IS.RBI+=Math.round(hr*2.1+h*0.35); } }
      if(i<=1)S.intlTop4=(S.intlTop4||0)+1;
      if(!S.traits.intlace&&S.intlCount>=3&&(S.intlTop4||0)>=2){ S.traits.intlace=true; card('gold','隱藏屬性解鎖：國際賽之鬼','只要穿上 CT 球衣，你的痛覺就會消失——你是為大場面而生的男人。<b class="hl">國際賽不再增加受傷風險，且每次徵召能力點保底 +2</b>。'); }
      if(i<=2)S.honors.push(`${S.year} ${name}${rk}`);
      let ex=''; const mp=S.traits.clutch?2:1; if((i===0&&chance(30*mp))||(i===1&&chance(8*mp))){S.honors.push(`${S.year} ${name}MVP`);ex='你被選為<b class="hl">賽會MVP</b>！';}
      card(i<=1?'gold':'info',name,`中華隊最終成績：<b class="hl">${rk}</b>。${ex}獲得能力點 <b class="hl">${gpts}</b> 點。${S.traits.intlace?'國家英雄不知何謂疲憊。':'國際賽的高強度消耗，讓下季受傷風險上升。'}`);
      done(); }}, ];
  if(!forced)opts.push({t:'以調整為由婉拒',s:'列管期已過，終於能說不',f:done});
  choose(`中華隊徵召 · ${name}`,opts);
}
function faFlow(o){
  const d=S.lastD||0; const cap=S.pos==='P'?7:15;
  let stayY=faYears(d,cap); let stayM=d>=3?1.2:d>=0?1:0.8;
  const injHist=(S.bigInj||0)+(S.tjCount||0); if(injHist>=2&&stayY<=3)stayM+=0.15;
  if(S.traits.franchise)stayM=Math.max(stayM,1.2); if(S.tradeRefuse>0)stayM*=0.85;
  if(S.traits.leader && stayY <= 1) { stayY = 1; stayM = Math.max(stayM, 0.85); }
  if(S.traits.cancer){ stayM=Math.min(stayM,0.95); if(!S.traits.franchise&&chance(45)){ card('bad','球團冷處理','母球團明確表示無意續約——你的新聞比你的成績更出名。'); faMarket(o,d); return; } }
  const faOpts=[
    {t:`與 ${S.teamName()} 續約`,main:true,s:'接著選擇長約或短約', f:()=>termChoice(o,d,`與 ${S.teamName()} 續約 · 選擇合約類型`,(y,m)=>{ S.ct={yrs:y,mult:m,extOffered:false}; card('info','續約',`與 <b class="hl">${S.teamName()}</b> 完成 <b class="hl">${y} 年</b>續約（年薪係數 ×${m.toFixed(2)}）。`); advance(); })},
    {t:'跳出合約，測試自由市場',warn:true,s:'成績不佳可能乏人問津，只能回原隊減薪',f:()=>faMarket(o,d)}];
  if(S.org!=='CPBL'&&o>=LV.CPBL1.min){ faOpts.push({t:'返台加盟中職一軍',s:'落葉歸根，回到熟悉的主場', f:()=>{ signTo('CPBL','CPBL1'); card('good','返鄉',`結束海外的挑戰，你選擇回到 <b class="hl">${S.teamName()}</b>，在家鄉球迷面前繼續揮灑。`); advance(); }}); }
  choose(`合約到期 · 取得自由球員（FA）資格（球隊奪冠率 ${teamChampRate(S.orgTeam)}%）`,faOpts);
}
function faMarket(o,d){
  const org=S.org, lv=S.lv, offers=[];
  let n=d>=3?ri(2,4):d>=1?ri(1,3):d>=-1?(chance(60)?ri(1,2):0):(chance(30)?1:0);
  if(S.traits.cancer)n=Math.max(0,n-1);
  const cap=S.pos==='P'?7:15;
  makeOffers(org,n,({CPBL1:200,NPB1:800,MLB:2000})[lv]||100,1,cap,lv,S.orgTeam)
    .forEach(of=>{of.yrs=faYears(d,cap); of.mult=+(1+Math.max(0,d)*0.05+R()*0.12).toFixed(2);
      if(((S.bigInj||0)+(S.tjCount||0))>=2&&of.yrs<=3)of.mult+=0.15; offers.push({...of,org});});
  if(lv==='CPBL1'&&o>=53)makeOffers('NPB',1,1000,2,3,o>=51?'NPB1':'NPB2',null)
    .forEach(of=>offers.push({...of,org:'NPB',mult:1}));
  if(lv==='NPB1'&&o>=60){
    const freeAgent=(S.npbYears||0)>=7;
    if(freeAgent || chance(Math.round(50*ageGateUSA(o,60)))){ makeOffers('MiLB', freeAgent?ri(1,2):1, 3000, 3,5,'MLB',null).forEach(of=>offers.push({...of,org:'MiLB',mult:1,posting:!freeAgent})); }
  }
  if(!offers.length){
    card('bad','自由市場',`電話一直沒有響。經紀人聳聳肩——市場對你的評價比想像中冷。`);
    choose('沒有球隊開價',[
      {t:`回 ${S.teamName()} 減薪簽約`,main:true,s:'1 年｜年薪係數 ×0.70', f:()=>{ S.ct={yrs:1,mult:0.7}; card('bad','減薪合約',`低著頭回到 <b class="hl">${S.teamName()}</b>，年薪打七折。`); advance(); }},
      {t:'就此引退',warn:true,f:()=>endGame('FA 市場乏人問津，'+S.year+' 年黯然引退。')}]);
    return;
  }
  const est=of=>fmtMoney(Math.round(salaryFor(of.lv,d)*(of.mult||1)));
  const estL=(of)=>{ const tp=termParams(d,of.lv); return tp.longEligible?`長 ${tp.longY}年×${(tp.longM*(of.mult||1)).toFixed(2)} / 短 ${tp.shortY}年×${(tp.shortM*(of.mult||1)).toFixed(2)}`:`僅短約 ${tp.shortY}年×${(tp.shortM*(of.mult||1)).toFixed(2)}`; };
  const cty=og=>({CPBL:'🇹🇼 台灣',NPB:'🇯🇵 日本',MiLB:'🇺🇸 美國',MLB:'🇺🇸 美國'})[og]||'';
  const ctyOrder={CPBL:0,NPB:1,MiLB:2,MLB:2};
  offers.sort((a,b)=>(ctyOrder[a.org]??9)-(ctyOrder[b.org]??9));
  choose('自由市場報價一覽（依國家分列 · 每隊列出 長約 / 短約 方案）',[...offers.map(of=>({
    t:`${cty(of.org)}｜${of.team}（${LV[of.lv].n}）`,
    s:`簽約金 ${fmtMoney(of.bonus)}｜奪冠率 ${teamChampRate(of.team)}%｜長/短：${estL(of)}${of.posting?'｜入札':''}`,
    f:()=>{ S.salary+=of.bonus; const savedLv=S.lv; S.lv=of.lv;
      termChoice(o,d,`${of.team} · 選擇合約類型`,(y,m)=>{ S.lv=savedLv; signTo(of.org,of.lv,of.team,y,+(m*(of.mult||1)).toFixed(2)); advance(); }, ()=>{ S.lv=savedLv; S.salary-=of.bonus; faMarket(o,d); }); }})),
    {t:`回原隊（${S.teamName()}）1 年約`,s:'年薪係數 ×0.90', f:()=>{ S.ct={yrs:1,mult:0.9}; card('info','回歸',`重回 <b class="hl">${S.teamName()}</b>。`); advance(); }}]);
}
function ageGateUSA(o,minReq){ const age=S.age; if(age<=22)return 1.0; if(age<=24)return 0.75; if(age<=26)return 0.5; if(age<=27)return 0.3; if(age<=28)return 0.15; return o>=minReq+5 ? 0.08 : 0; }
function ageGateJP(){ const age=S.age; if(age<=26)return 1.0; if(age<=28)return 0.7; if(age<=30)return 0.45; if(age<=31)return 0.25; return 0; }
function crossOffers(o){
  const fin=()=>advance();
  if(S.lv==='CPBL1'&&o>=53&&(S.lastD||0)>=1&&chance(Math.round(35*ageGateJP()))){
    const jl=o>=51?'NPB1':'NPB2'; const bids=makeOffers('NPB',2,1200,2,3,jl,null);
    choose('日職球團開出旅外合約',[...bids.map(of=>({ t:of.team+`（${LV[jl].n}）`,s:`簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約`, f:()=>{S.salary+=of.bonus;signTo('NPB',jl,of.team,of.yrs,1);fin();}})), {t:'留在中職',main:true,f:fin}]); return; }
  if(S.lv==='CPBL1'&&o>=57&&(S.lastD||0)>=2&&chance(Math.round(30*ageGateUSA(o,57)))){
    const ml=o>=60?'MLB':'A3'; const bids=makeOffers('MiLB',2,2000,2,4,ml,null);
    choose('大聯盟球探遞出合約',[...bids.map(of=>({ t:of.team+`（${LV[ml].n}）`,s:`簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約`, f:()=>{S.salary+=of.bonus;signTo('MiLB',ml,of.team,of.yrs,1);fin();}})), {t:'留在中職',main:true,f:fin}]); return; }
  if(S.lv==='NPB1'&&o>=60&&(S.lastD||0)>=2&&chance(Math.round(30*ageGateUSA(o,60)))){
    const bids=makeOffers('MiLB',ri(2,3),Math.round(3000+(S.lastD||0)*800),3,6,'MLB',null);
    choose('入札制度：大聯盟多隊競標你的合約',[...bids.map(of=>({ t:of.team,s:`入札總額 ${fmtMoney(of.bonus*4)}｜簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約`, f:()=>{ S.salary+=of.bonus; signTo('MiLB','MLB',of.team,of.yrs,1); fin(); }})), {t:'留在日職',main:true,f:fin}]); return; }
  fin();
}

/* 日本職棒選秀專屬流程 */
function runDraftJP(fromSchool,cb){
  const o=ovr(); const score=o+Math.max(0,22-S.age)*2+ri(-4,4);
  const rd=score>=58?1:score>=52?2:score>=47?ri(3,4):score>=42?ri(5,7):score>=38?ri(8,10):0;
  if(rd===0){ card('bad','選秀落榜',`唱名結束，未獲指名。（綜合 ${o}）`); if(fromSchool){ card('info','','回到球隊，明年再來。'); cb(); } else cb('fail'); return; }
  
  const bonus=[0,10000,8000,6000,4500,3000,3000,2000,1000,1000,1000][rd]||1000; 
  const lv=(rd<=2&&o>=52)?'NPB1':'NPB2'; 
  const team=pick(NPB_TEAMS);
  
  const accept=()=>{ S.stage='PRO'; S.team=''; S.salary+=bonus; S.svc=0; S.faElig=false; signTo('NPB',lv,team,ri(2,3),1); card('gold','日本職棒選秀會',`第 <b class="hl">${rd}</b> 指名加入 <b class="hl">${team}</b>！簽約金為 <b class="hl">${fmtMoney(bonus)}</b>（視同本土球員）。${lv==='NPB1'?'即戰力評價，直接放入一軍。':'先從二軍出發。'}`); board(0); cb(); };
  
  if(rd>=3 && S.age<24){
    choose(`日本職棒選秀會 · 第 ${rd} 指名 (${team})`,[
      {t:'接受指名，加盟球隊',main:true,s:`簽約金 ${fmtMoney(bonus)}｜${lv==='NPB1'?'一軍':'二軍'}出發`,f:accept},
      {t: (S.stage==='HS'||(S.stage==='U'&&S.stageYr<4))?'重返校園，再拚一年':'重返業餘，再拚一年',warn:true,s:'放棄本次指名',f:()=>{
        const goUni = (S.stage==='HS')||(S.stage==='U'&&S.stageYr<4); const fresh = (S.stage==='HS');
        card('info', goUni?'重返校園':'重返社會人', `對於落到後段順位感到不甘心。你決定${goUni?(fresh?'升學進入日本大學':'留在校隊'):'加入日本社會人球隊'}，提升自己的評價。`);
        if(fresh){ S.stage='U'; S.stageYr=0; S.team=pick(['早稻田大學','慶應義塾大學','法政大學','明治大學']); } else if(!goUni){ S.stage='AMA'; S.team=pick(['豐田汽車','JR東日本','東京瓦斯','ENEOS']); } advance();
      }}]); return; }
  accept();
}

function runDraft(fromSchool,cb){
  const o=ovr(); const score=o+Math.max(0,22-S.age)*2+ri(-4,4);
  const rd=score>=56?1:score>=49?2:score>=43?ri(3,4):score>=37?ri(5,7):score>=30?ri(8,10):0;
  if(rd===0){ card('bad','選秀落榜',`唱名一輪又一輪，始終沒有你的名字。（綜合 ${o}｜年齡加權後評價 ${score}）`); if(fromSchool){ card('info','','回到校隊，明年再來。'); cb(); } else cb('fail'); return; }
  const bonus=[0,1000,600,350,350,150,150,150,50,50,50][rd]||50; const lv=(rd===1&&o>=50)?'CPBL1':'CPBL2'; const team=pick(CPBL_TEAMS);
  const accept=()=>{ S.stage='PRO'; S.team=''; S.salary+=bonus; S.svc=0; S.faElig=false; signTo('CPBL',lv,team,ri(2,3),1); card('gold','中華職棒選秀會',`第 <b class="hl">${rd}</b> 輪獲 <b class="hl">${team}</b> 指名！簽約金依順位為 <b class="hl">${fmtMoney(bonus)}</b>。${lv==='CPBL1'?'即戰力評價，直接放入一軍名單。':'先從二軍出發。'}`); board(0); cb(); };
  if(rd>=3 && S.age<24){
    choose(`中華職棒選秀會 · 第 ${rd} 輪獲 ${team} 指名`,[
      {t:'接受指名，加盟球隊',main:true,s:`簽約金 ${fmtMoney(bonus)}｜${lv==='CPBL1'?'一軍':'二軍'}出發`,f:accept},
      {t: (S.stage==='HS'||(S.stage==='U'&&S.stageYr<4))?'重返校園，再拚一年':'重返業餘，再拚一年',warn:true,s:'放棄本次指名，明年重新參加選秀',f:()=>{
        const goUni = (S.stage==='HS')||(S.stage==='U'&&S.stageYr<4); const fresh = (S.stage==='HS');
        card('info', goUni?'重返校園':'重返業餘', `看到被選到的輪次，雙眼發黑，原本以為會在前段輪次被選中，卻落到了後段的輪次。你握緊了拳頭，決定${goUni?(fresh?'進入大學繼續深造':'留在校隊繼續磨練'):'重返業餘'}，這一次，你一定要上台戴上所屬球隊的帽子。`);
        if(fresh){ S.stage='U'; S.stageYr=0; S.team=pick(['文化大學','輔仁大學','國立體大','台灣體大','開南大學']); } else if(!goUni){ S.stage='AMA'; S.team=pick(['台灣電力','合作金庫','全越運動','綺麗珊瑚']); } advance();
      }}]); return; }
  accept();
}

function pickOfferUI(title,org,offers,after){
  choose(title,offers.map(of=>({
    t:of.team+(of.lv?`（${LV[of.lv].n}）`:''),
    s:`簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約${of.mult&&of.mult!==1?`｜年薪係數 ×${of.mult.toFixed(2)}`:''}`,
    f:()=>{ S.salary+=of.bonus;
      signTo(org,of.lv||S.lv,of.team,of.yrs,of.mult||1);
      card('gold','簽約金',`入袋 <b class="hl">${fmtMoney(of.bonus)}</b>。`); after(); }
  })));
}
function makeOffers(org,n,bonusBase,yrsLo,yrsHi,lv,exclude){
  const list=teamListOf(org).filter(t=>t!==exclude);
  const teams=[]; const pool=list.slice();
  for(let i=0;i<n&&pool.length;i++)teams.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  return teams.map(t=>({team:t,bonus:Math.round(bonusBase*(0.8+R()*0.5)),yrs:ri(yrsLo,yrsHi),lv,mult:1}));
}
