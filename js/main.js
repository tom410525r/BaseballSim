function bucketOf(lv){ const l=lv&&LV[lv]; return l&&l.top?l.top:'MINOR'; }

function nextStep(){ if(S.done){ stepQ=[]; return; } const f=stepQ.shift(); if(f)f(); }
function stageLabel(){
  if(S.stage==='HS')return '高'+['一','二','三'][S.stageYr-1];
  if(S.stage==='U')return '大'+['一','二','三','四'][S.stageYr-1];
  if(S.stage==='AMA')return '業餘成棒';
  return LV[S.lv].n;
}

function startYear(){ stepQ=[phasePre,phaseMid,phaseEnd]; divider(`${S.year} 年 · ${S.age} 歲 · ${stageLabel()}`); nextStep(); }
function phasePre(){
  board(0); S.tmpInj=0; S.seasonFactor=1; S.skipMid=false; S.prevD=S.lastD||0; S.lastD=0;
  if(S.age>=48){ buyoutRemaining(1); endGame('身體已到極限，'+S.year+' 年春訓後宣布引退。'); return; }
  const declAge=S.age-(S.traits.disc?2:0);
  if(declAge>=32){ const dec=declAge>=35?5+(declAge-35):2;
    POS_AB[S.pos].forEach(k=>S.ab[k]=clamp(S.ab[k]-dec,1,80));
    card('bad','歲月不饒人',`${declAge>=35?'第二階段（逐年加劇）':'第一階段'}衰退：所有能力 <b class="dn">−${dec}</b>${S.traits.disc?'（自律狂：生涯延後兩年）':''}。訓練加點照常，但身體回不去了。`); board(0); }
  if(S.rehab>0){ S.rehab--; S.skipMid=true; S.seasonFactor=0;
    card('bad','復健年',`大傷尚未痊癒，本季確定<b class="dn">全年報銷</b>，只能在復健室度過。（擲骰減為 2 顆）`);
    const dummySt = {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0};
    S.log.push({y:S.year,age:S.age,tm:S.stage==='PRO'?S.teamName():(S.team||stageLabel()),line:'復健年・全年報銷', inj: true, st: S.stage==='PRO'?dummySt:null}); }
  let afterAsk=()=>{
    let n=S.skipMid?2:(()=>{const r=R();return r<0.35?3:r<0.75?4:r<0.95?5:6;})();
    if(S.traits.distract&&!S.skipMid)n=Math.max(2,n-1);
    if(S.traits.academy&&!S.skipMid&&chance(35))n++;
    
    const dice=[]; let newSix=0;
    for(let i=0;i<n;i++){ const v=S.traits.genius?ri(4,6):S.traits.late?ri(3,6):ri(1,6); dice.push(v);
      if(v===6&&S.age<22&&!S.traits.genius){S.six++;newSix++;} }
      
    let msg=`自主訓練擲出 <b class="hl">${n}</b> 顆骰。`;
    if(newSix&&!S.traits.genius)msg+=` 高標值「6」累計 <b class="hl">${S.six}/5</b> 次。`;
    
    if(S.traits.combo && !S.skipMid && (S.comboKey||S.samePickKey)) {
      const ck = S.comboKey||S.samePickKey;
      const cv = S.traits.genius?ri(4,6):S.traits.late?ri(3,6):ri(1,6);
      const gained = addAb(ck, cv);
      const overflow = S.lastOverflow || 0;
      if(overflow > 0) S.pendStat = (S.pendStat || 0) + overflow;
      let cmsg = `<br>大巧不工發動：系統自動擲出 <b class="hl">${cv}</b> 點，挹注於 <b class="hl">${ABL[ck]}</b>`;
      if(gained > 0) cmsg += `（能力 <b class="up">+${gained}</b>）`;
      if(overflow > 0) cmsg += `（頂峰造極：溢出的 ${overflow} 點轉為<b class="up">本季成績加成</b>）`;
      if(gained===0 && overflow===0) cmsg += `（能力加點，但不足以提升一級）`;
      msg += cmsg + `。`;
    }
    
    card('','季初特訓',msg);
    if(S.six>=5&&!S.traits.genius&&S.age<22){ S.traits.genius=true;
      {
      const exDef=S.pos==='C'?['rng','fld','arm','cat']:[];
      const cands=POS_AB[S.pos].filter(k=>S.ab[k]<70&&!exDef.includes(k));
      for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=cands[i];cands[i]=cands[j];cands[j]=t;}
      const boost=cands.slice(0,2), bl=[];
      boost.forEach(k=>{ S.pot[k]=Math.min(80,(S.pot[k]||62)+10);
        S.ab[k]=clamp(S.ab[k]+5,1,80); bl.push(`${ABL[k]} <b class="up">+5</b>（潛力上限 +10 → ${S.pot[k]}）`); });
      card('gold','隱藏素質解鎖：天才','22 歲前五度擲出高標值！從今以後，每一顆訓練骰<b class="hl">永久固定 4 點以上</b>，事件卡好結果機率提升至 <b class="hl">70%</b>。'+(bl.length?`天賦覺醒，潛能重新被評估：${bl.join('、')}。`:'')+'天賦，是藏不住的。');
      board(1);
    } }
    choose('',[{t:`▸ 分配訓練成果（${dice.length} 顆骰）`,main:true,f:()=>dposReview(()=>allocUI({dice},'分配訓練成果（點骰套用｜球探量表：'+((S.pos==='P'||S.pos==='TW')?'60/70/75':'70/75')+' 以上成長遞減）',()=>nextStep()))}]);
  };
  const preAsk=afterAsk;
  if((S.pos==='P'||S.pos==='TW')&&S.stage==='PRO'&&!S.skipMid){
    afterAsk=()=>{
      choose(`開季投球規劃（手臂狀況：${(function(){const r=S.tj/tjCap();return S.rehab>0?'復健中':r>=0.85?'手肘隱隱作痛':r>=0.6?'手臂略感疲勞':r>=0.35?'狀況尚可':'手感輕盈';})()}）`,[
        {t:'全力投',warn:true,s:'成績最佳｜手臂負荷最大（TJ 累積 ×1.25）',f:()=>{S.effort='全力投';preAsk();}},
        {t:'普通投',main:true,s:'標準強度｜TJ 累積正常',f:()=>{S.effort='普通投';preAsk();}},
        {t:'養生球',s:'成績保守｜省手臂（TJ 累積 ×0.65）',f:()=>{S.effort='養生球';preAsk();}}]);
    };
  }
  if(S.stage==='U'&&S.stageYr>=2){
    const o=ovr();
    const opts=[
      {t:'投入中華職棒選秀',s:`目前綜合 ${o}｜年齡加權：越年輕評價越高`,f:()=>runDraft(true,afterAsk)},
      {t:'留在大學繼續磨練',main:true,f:afterAsk}
    ];
    const agePenalty = Math.max(0, S.age - 18);
    const reqNPB = 44 + Math.floor(agePenalty / 2);  
    const reqMiLB = 50 + Math.floor(agePenalty / 2);  
    const bonusNPB = Math.max(100, 800 - agePenalty * 180);   
    const bonusMiLB = Math.max(150, 1500 - agePenalty * 350); 
    if(o>=reqNPB)opts.push({t:'洽談旅日合約',s:`休學挑戰日職｜大齡影響簽約金`,f:()=>{
      S.stage='PRO'; S.team=''; S.svc=0; S.faElig=false;
      pickOfferUI('日職球團報價','NPB',makeOffers('NPB',2,bonusNPB,2,3,'NPB2',null),afterAsk);}});
    if(o>=reqMiLB)opts.push({t:'洽談旅美合約',s:`休學挑戰小聯盟｜大齡影響簽約金`,f:()=>{
      S.stage='PRO'; S.team=''; S.svc=0; S.faElig=false;
      pickOfferUI('大聯盟球團報價','MiLB',makeOffers('MiLB',2,bonusMiLB,3,4,o>=55?'A1':'R',null),afterAsk);}});
    choose(`大${['一','二','三','四'][S.stageYr-1]}季前 · 升學與職棒的十字路口`,opts);
    return;
  }
  if(S.stage==='PRO'&&S.age>=36&&S.rehab===0){
    const oldOpts=[{t:'再戰一年',main:true,f:afterAsk}];
    if(S.org!=='CPBL'&&ovr()>=LV.CPBL2.min){
      oldOpts.push({t:'放棄合約，落葉歸根',s:'狀態不再，仍想把最後的球打給家鄉看',f:()=>{
        card('good','落葉歸根',`狀態早已不在巔峰。但家鄉球隊仍然向你招手——他們要的不是現在的數據，是你這個名字陪著大家走過的那些年。你決定放棄合約，回家，把最後的球打給臺灣的球迷看。`);
        signTo('CPBL','CPBL1'); advance();
      }});
    }
    oldOpts.push({t:'召開引退記者會',warn:true,s:'結束選手生涯',f:()=>{buyoutRemaining();daibaFarewell(()=>endGame('功成身退，於 '+S.year+' 年宣布引退。'));}});
    choose('又是一年春訓，身體大不如前了',oldOpts);
    return;
  }
  afterAsk();
}

function phaseMid(){
  board(1);
  if(S.skipMid){ S.ironStreak=0; nextStep(); return; }
  const nEv=S.stage==='PRO'?3:2;
  loveEvent(()=>drawEvents(nEv,()=>{
    choose('',[{t:'▸ 季中健康檢查',main:true,f:()=>{ rollInjury();
      choose('',[{t:'▸ 查看球季表現',main:true,f:()=>{
        if(S.stage==='PRO')proSeason();
        else amateurSeason(); }}]); }}]);
  }));
}

function phaseEnd(){
  board(2);
  if(S.stage==='PRO'){
    let sal=Math.round(salaryFor(S.lv,S.lastD||0)*(S.ct?S.ct.mult:1)*dpMult()); if(S.seasonFactor===0)sal=Math.round(sal*0.5);
    S.salary+=sal;
    let extra='';
    if(LV[S.lv].top&&S.seasonFactor>0){
      const tp=LV[S.lv].top;
      const pc=clamp(({CPBL:15,NPB:8,MLB:3.5})[tp]+(S.lastD||0)*0.5,2,({CPBL:26,NPB:15,MLB:9})[tp]);
      let pcc=pc; if(S.traits.clutch)pcc*=1.25;
      if(S.traits.leader)pcc+=5; 
      if(S.tradeRefuse>0){ pcc*=0.75; }
      if(chance(pcc)){ const cN={CPBL:'中職總冠軍',NPB:'日本一',MLB:'世界大賽冠軍'}[LV[S.lv].top];
        S.honors.push(`${S.year} ${cN}`); S.wonChamp=true; S.champThisTeam=true; S.champTeam=S.orgTeam; extra=`<br>球隊奪下 <b class="hl">${cN}</b>，全城陷入瘋狂！`; } }
    if(S.tradeRefuse>0)S.tradeRefuse--;
    if(S.tradeHeat>0)S.tradeHeat=Math.max(0,S.tradeHeat-5);
    card('','季末結算',`本年度薪資：<b class="hl">${fmtMoney(sal)}</b>（生涯累計 ${fmtMoney(Math.round(S.salary))}）${S.ct?`｜合約剩 ${Math.max(0,S.ct.yrs-1)} 年`:''}${extra}`);
    board(2);
  }
  const go=()=>movement();
  if(S.pool>0){ const p=S.pool; S.pool=0;
    choose('',[{t:`▸ 分配能力點（${p} 點·大賽／國際賽成果）`,main:true,f:()=>allocUI({pool:p},'季末能力點分配（大賽／國際賽成果）',go)}]); }
  else go();
}

function movement(){
  const o=ovr();
  if(S.stage==='HS'){ if(S.stageYr<3)advance(); else pathChoiceHS(); return; }
  if(S.stage==='U'){ if(S.stageYr<4)advance(); else pathChoiceU4(); return; }
  if(S.stage==='AMA'){
    if(S.age>=26){ endGame('選秀多年落榜，'+S.year+' 年結束球員身分，轉任基層教練。'); return; }
    choose('業餘年度結束',[
      {t:'再次投入中職選秀',main:true,f:()=>runDraft(false,()=>advance())},
      {t:'高掛球鞋',warn:true,f:()=>endGame('在業餘球隊劃下句點。')}]);
    return;
  }
  if(S.skipMid){ advance(); return; }
  if(o<30){ buyoutRemaining(1); endGame('能力已跌破中職二軍最低水準，'+S.year+' 年球季後遭釋出，被迫引退。'); return; }
  if(S.org==='NPB')S.npbYears++;
  if(LV[S.lv].top){
    if(S.svcOrg && S.svcOrg!==S.org){ S.faElig=true; }
    S.svcOrg=S.org;
    S.svc=(S.svc||0)+1; if(S.svc>=5)S.faElig=true;
  }
  if(S.stage==='PRO'&&LV[S.lv].top){ S.teamYears=(S.teamYears||0)+1;
    if(!S.traits.goldcloth&&S.orgTeam==='中信兄弟'&&(S.teamTally.CPBL&&S.teamTally.CPBL['中信兄弟']>=10)){ S.traits.goldcloth=true;
      card('gold','隱藏屬性解鎖：黃金聖衣','效力 中信兄弟 滿十年，你已是這支球隊的象徵。披上那件黃金戰袍，你就是主場的信仰。'); board(1); }
    if(!S.traits.franchise&&S.teamYears>=7&&S.champThisTeam&&S.champTeam===S.orgTeam){ S.traits.franchise=true;
      card('gold','隱藏屬性解鎖：神主牌','這座城市的球迷看著你長大。球團高層很清楚，放你走球迷會把主場拆了——<b class="hl">母隊續約年薪係數固定 ≥×1.2，引退評價加成</b>。'); }
    if(!S.traits.mrteam&&S.teamYears>=15&&(S.lastD||0)>=0){ S.traits.mrteam=true; S.mrTeamName=S.orgTeam;
      const nick=teamNick(S.orgTeam);
      card('gold','隱藏稱號：'+nick+'先生',`十五個年頭，同一件球衣。球迷不再喊你的名字，他們喊你「<b class="hl">${nick}先生</b>」——你就是這支球隊的代名詞。`); board(1); }
    if(!S.traits.rainbow){
      const RB={CPBL:['中職',3],NPB:['日職',5],MLB:['大聯盟',5]};
      for(const lg in RB){
        const n=Object.keys((S.teamTally&&S.teamTally[lg])||{}).length;
        if(n>RB[lg][1]){ S.traits.rainbow=true; S.rainbowLg=RB[lg][0];
          card('info','隱藏稱號：'+RB[lg][0]+'七彩球衣',`打開衣櫃，${n} 件不同的球衣掛在眼前——${RB[lg][0]}的球隊你快穿過一輪了。球迷笑稱你是「<b class="hl">七彩球衣</b>」：去到哪裡都能活下來，這也是一種本事。`); board(1); break; }
      }
    } }
  const path=PATHS[S.org], idx=path.indexOf(S.lv);
  let minReq=LV[S.lv].min;
  if(S.org==='NPB'&&S.npbYears>=8){ minReq-=4; }
  const perf=(S.seasonFactor>=0.5)?(S.lastD||0):null;
  const wonAward = S.honors.some(x=>x.startsWith(String(S.year))&&/王|MVP|賽揚|澤村|最佳投手|金手套/.test(x)&&!/明星賽/.test(x));
  let goodReal=false;
  { const st=S.lastSt;
    if(st&&S.seasonFactor>=0.5){
      if(S.pos==='P'){
        const era=st.IP>0?st.ER*9/st.IP:99, whip=st.IP>0?(st.H+st.BB)/st.IP:99;
        if(era<=4.20||whip<=1.35||(st.SV||0)>=15||(st.HLD||0)>=15)goodReal=true;
      }else{
        const obp=st.PA>0?(st.H+st.BB)/st.PA:0, slg=slgOf(st), ops=obp+slg;
        if(ops>=0.720||st.HR>=12||st.SB>=15||st.RBI>=(LV[S.lv].g>=150?70:55))goodReal=true;
      }
    }
  }
  if(wonAward||goodReal){  }
  else if(o<minReq){
    if(perf!==null&&perf>=0){
      card('info','球團評估',`體能檢測數字亮紅燈，但你用<b class="hl">實際成績</b>說話——本季表現達聯盟水準，球團決定續留一線觀察。`);
    }else{ handleDemotion(o,path,idx); return; }
  }else if(perf!==null&&perf<=-6&&chance(55)){
    card('bad','球團評估','帳面數據遠低於聯盟水準，教練團失去耐心。');
    handleDemotion(o,path,idx); return;
  }
  if(idx<path.length-1){ const nx=path[idx+1];
    if(o>=LV[nx].min&&((S.lastD||0)>=0||chance(50))){
      let to=nx;
      if(idx<path.length-2){ const nx2=path[idx+2];
        if(o>=LV[nx2].min+2&&(S.lastD||0)>=4)to=nx2; }
      S.lv=to; card('good','升級通知',`表現獲得肯定，${to!==nx?'<b class="hl">連跳兩級</b>':'晉升'} <b class="hl">${LV[to].n}</b>！`); board(2);
      if(S.traits.yips){ removeTrait('yips','失憶症'); card('good','走出陰影','重回上一層舞台，你終於找回了節奏——<b class="hl">失憶症痊癒</b>。'); } } }
  if(!S.ct)S.ct={yrs:2,mult:1};
  S.ct.yrs--;
  if(S.ct.yrs===1&&LV[S.lv].top&&!S.ct.extOffered&&S.faElig&&(S.lastD||0)>=1&&chance(45)){
    S.ct.extOffered=true; extensionOffer(o); return;
  }
  if(S.ct.yrs<=0){
    if(LV[S.lv].top){
      if(S.faElig){ faFlow(o); return; }
      S.ct={yrs:ri(1,2),mult:1,extOffered:false};
      card('info','球團續約',`你仍在選秀球隊掌控期（服務 ${S.svc}/5 年），球團行使續約權——續 <b class="hl">${S.ct.yrs} 年</b>，薪資照層級基數。`); board(1);
    } else { S.ct={yrs:ri(1,2),mult:1}; }
  }
  crossOffers(o);
}

function shareImage(evals,out){
  const isP=S.pos==='P'||S.pos==='TW';
  const tiers=evals.map(t=>t.replace(/<[^>]+>/g,''));
  const TN2={legend:(S.legendLeague||'')+'歷史級球星',taiwan:'Team Taiwan',goldcloth:'黃金聖衣',genius:'天才',iron:'鐵人',glass:'玻璃人',scum:'渣男',late:'大器晚成',disc:'自律狂',academy:'學院派',intlace:'國際賽之鬼',franchise:'神主牌',clutch:'大心臟',phoenix:'浴火重生',onetool:'只會這個',rubber:'橡膠手臂',mrteam:(teamNick(S.mrTeamName||'')||'')+'先生',confidante:'閨中密友',smallschool:'小學校之光',grinder:'努力仔',yips:'失憶症',distract:'外務纏身',cancer:'更衣室毒瘤',ambience:'氣氛大師',thief:'薪水小倫',combo:'大巧不工',rainbow:(S.rainbowLg||'')+'七彩球衣',leader:'休息室領袖'};
  const negK=['glass','scum','yips','distract','cancer','ambience','thief'];
  const keepTr=Object.keys(TN2).filter(k=>S.traits[k]).map(k=>({label:TN2[k],key:k,neg:negK.includes(k)}));
  const remTr=(S.removed||[]).map(l=>({label:l,key:'',neg:false,rem:true}));
  const leagues=['MLB','NPB','CPBL'].filter(b=>S.stats[b]);
  
  const milestones = [];
  const isPit = S.pos==='P'||S.pos==='TW';
  if(S.hofInfo&&S.hofInfo.length){ S.hofInfo.forEach(h=>{ milestones.push(`${h.lg}名人堂 · 第${h.yr}年入選 ${h.pct}%`); }); }
  { let tG=0,tH=0,tHR=0,tRBI=0,tSB=0,tW=0,tSV=0,tHLD=0,tSO=0,tIP=0;
    ['CPBL','NPB','MLB'].forEach(b=>{ const st=S.stats[b]; if(!st)return;
      tH+=st.H||0;tHR+=st.HR||0;tRBI+=st.RBI||0;tSB+=st.SB||0;
      tW+=st.W||0;tSV+=st.SV||0;tHLD+=st.HLD||0;tSO+=st.SO||0;tIP+=st.IP||0; });
    if(isPit){ if(tW>0||tSO>0)milestones.push(`跨聯盟生涯 ${tW}勝 ${tSO}K ${tSV}救援 ${tHLD}中繼`); }
    else{ if(tH>0)milestones.push(`跨聯盟生涯 ${tHR}轟 ${tH}安 ${tSB}盜`); }
  }
  
  const honors = milestones.slice();
  const aMap = {};
  S.honors.forEach(h => {
     const parts = h.split(' ');
     if(parts.length >= 2) { const yr = parts[0]; const awd = parts.slice(1).join(' ');
       if(!aMap[awd]) aMap[awd] = []; aMap[awd].push(yr);
     } else { if(!aMap[h]) aMap[h] = []; aMap[h].push(''); }
  });
  for(const awd in aMap) {
     const yrs = aMap[awd];
     if(yrs.length > 1 && yrs[0] !== '') honors.push(`${awd} *${yrs.length} (${yrs.join(',')})`);
     else honors.push(`${awd} ${yrs[0]?`(${yrs[0]})`:''}`);
  }
  
  const hist=S.log.slice();
  const W=920, PAD=34, scale=2;
  const cv=document.createElement('canvas');
  const c=cv.getContext('2d');
  c.font='13px sans-serif';
  
  const colW=(W-PAD*2)/2, maxTextW=colW-20;
  const honorBlocks = honors.map(h => {
    let text = '· ' + h;
    let lines = []; let curr = '';
    for(let i=0; i<text.length; i++) {
      let test = curr + text[i];
      if(c.measureText(test).width > maxTextW && curr.length > 0) { lines.push(curr); curr = '  ' + text[i]; }
      else { curr = test; }
    }
    if(curr) lines.push(curr);
    return lines;
  });
  
  const rows2=Math.ceil(honorBlocks.length/2);
  let leftH=0, rightH=0;
  honorBlocks.slice(0, rows2).forEach(b => leftH += b.length * 23);
  honorBlocks.slice(rows2).forEach(b => rightH += b.length * 23);
  const honorsTotalHeight = Math.max(leftH, rightH);
  
  let H=150; H+=30+tiers.length*24+14;
  if(keepTr.length||remTr.length)H+=54;
  H+=34+(leagues.length+1)*26+16;
  if(S.intlCount>0)H+=30+24+28+12;
  H+=30+honorsTotalHeight+16;
  
  const amaLogs = hist.filter(r => !r.st);
  const proLogs = hist.filter(r => r.st);
  if(amaLogs.length > 0) H += 34 + amaLogs.length * 20 + 24;
  if(proLogs.length > 0) H += 34 + proLogs.length * 20 + 24;
  
  H+=70;
  cv.width=W*scale; cv.height=H*scale;
  c.scale(scale,scale);
  c.fillStyle='#0b1a12'; c.fillRect(0,0,W,H);
  c.strokeStyle='#2b4a38'; c.lineWidth=3; c.strokeRect(10,10,W-20,H-20);
  c.textBaseline='top';
  
  c.fillStyle='#8fae9c'; c.font='13px sans-serif'; c.fillText('S i m B a s e b a l l ・ 引 退 紀 念',PAD,30);
  c.fillStyle='#ffc95c'; c.font='bold 36px sans-serif'; c.fillText(S.name,PAD,52);
  c.fillStyle='#e8efe9'; c.font='15px sans-serif';
  c.fillText(`${primaryPos()}｜${playerType()}｜${hist.length?hist[0].y:'?'}–${S.year}｜引退時 ${S.age} 歲${isPit&&S.tjCount?`｜TJ×${S.tjCount}`:''}`,PAD,98);
  
  let y=126;
  function tagColor(o){
    if(o.rem)return {bg:'#242424',bd:'#4a4a4a',fg:'#8a8a8a'};
    if(o.key==='legend'||o.key==='taiwan')return {bg:'#3a2c05',bd:'#ffc95c',fg:'#ffe08a'};
    if(o.key==='goldcloth')return {bg:'#3a3505',bd:'#e8d43a',fg:'#fff35a'};
    if(o.key==='mrteam'){ const tc=TEAM_COLOR[S.mrTeamName]||'#ffc95c'; return {bg:'#1a1a1a',bd:tc,fg:tc}; }
    if(o.key==='genius')return {bg:'#232733',bd:'#c8d0e0',fg:'#e8eef7'};
    if(o.neg)return {bg:'#2a0f0f',bd:'#c0392b',fg:'#ff8b7a'};
    return {bg:'#173524',bd:'#2b4a38',fg:'#9fd8a8'};
  }
  function drawTags(items){ items.forEach(function(o){ const t=o.label, col=tagColor(o); c.font='12px sans-serif'; const w=c.measureText(t).width+16; c.fillStyle=col.bg; c.strokeStyle=col.bd; c.lineWidth=1; c.fillRect(tagx,y,w,20); c.strokeRect(tagx,y,w,20); c.fillStyle=col.fg; c.fillText(t,tagx+8,y+3); if(o.rem){ c.strokeStyle='#8a8a8a'; c.beginPath(); c.moveTo(tagx+4,y+10); c.lineTo(tagx+w-4,y+10); c.stroke(); } tagx+=w+8; if(tagx>W-160){tagx=PAD;y+=26;} }); }
  var tagx=PAD;
  if(keepTr.length||remTr.length){ drawTags(keepTr.concat(remTr)); y+=30; }
  function hr(){ c.strokeStyle='#2b4a38'; c.lineWidth=1; c.beginPath(); c.moveTo(PAD,y); c.lineTo(W-PAD,y); c.stroke(); y+=12; }
  function sectionTitle(t){ c.fillStyle='#8fae9c'; c.font='bold 13px sans-serif'; c.fillText(t,PAD,y); y+=22; }
  
  hr(); sectionTitle('生涯評價');
  c.font='bold 16px sans-serif'; c.fillStyle='#ffc95c';
  tiers.forEach(function(t){ c.fillText('★ '+t,PAD,y); y+=24; }); y+=6;
  
  hr(); sectionTitle('生涯累積數據');
  const cols=isPit?[['League',90],['Yrs',36],['G',48],['IP',54],['W',36],['L',36],['SV',48],['HLD',48],['SO',52],['BB',48],['ERA',52],['WHIP',54]]
                  :[['League',80],['Yrs',34],['G',40],['PA',46],['AVG',48],['OBP',48],['SLG',48],['OPS',48],['H',44],['HR',38],['RBI',44],['SB',40],['DEF',40]];
  function row(cells,head){ let rx=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?'#8fae9c':'#e8efe9'; cells.forEach(function(cell,i){ c.fillText(String(cell),rx,y); rx+=cols[i][1]; }); y+=head?24:26; }
  row(cols.map(cc=>cc[0]),true);
  leagues.forEach(function(b){ const st=S.stats[b];
    if(isPit){ const era=st.IP>0?(st.ER*9/st.IP).toFixed(2):'-'; const whip=st.IP>0?((st.H+st.BB)/st.IP).toFixed(2):'-'; row([LG_N[b],st.yr,st.G,fmtIP(st.IP),st.W,st.L,st.SV||0,st.HLD||0,st.SO,st.BB||0,era,whip]); }
    else{ const obpN = st.PA>0 ? (st.H+st.BB)/st.PA : 0; const slgN = slgOf(st); const avg = st.AB>0 ? (st.H/st.AB).toFixed(3).replace(/^0/,'') : '-'; const obp = st.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-'; const slg = st.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-'; const ops = st.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-'; row([LG_N[b],st.yr,st.G,st.PA,avg,obp,slg,ops,st.H,st.HR,st.RBI,st.SB,(st.DEF>0?'+':'')+(st.DEF||0)]); } });
  y+=6;
  
  if(S.intlCount>0){ const IS=S.intlStat; hr(); sectionTitle('國際賽生涯（中華隊 '+S.intlCount+' 屆）');
    const rowIntl=(cells,head)=>{ let rx=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?'#8fae9c':'#e8efe9'; cells.forEach(function(cell,i){ c.fillText(String(cell),rx,y); rx+=ic[i][1]; }); y+=head?24:28; };
    var ic;
    if(isPit){ const era=IS.IP>0?(IS.ER*9/IS.IP).toFixed(2):'-'; ic=[['',110],['G',80],['IP',86],['W',60],['SV',72],['SO',80],['ERA',80]]; rowIntl(['', 'G', 'IP', 'W', 'SV', 'SO', 'ERA'], true); rowIntl(['',IS.G,fmtIP(IS.IP),IS.W,IS.SV,IS.SO,era],false); }
    else { const avg=IS.AB>0?(IS.H/IS.AB).toFixed(3).replace(/^0/,''):'-'; ic=[['',110],['G',76],['PA',76],['AVG',76],['H',72],['HR',60],['RBI',72]]; rowIntl(['', 'G', 'PA', 'AVG', 'H', 'HR', 'RBI'], true); rowIntl(['',IS.G,IS.PA,avg,IS.H,IS.HR,IS.RBI],false); }
    y+=6; }
  
  hr(); sectionTitle('生涯榮譽（'+honors.length+' 項）'); c.font='13px sans-serif'; c.fillStyle='#9fd8a8';
  let startY = y; let currY = startY;
  honorBlocks.forEach(function(b, i){ const isRightCol = i >= rows2; if(i === rows2) currY = startY; const hx = PAD + (isRightCol ? colW : 0); b.forEach(line => { c.fillText(line, hx, currY); currY += 23; }); });
  y += honorsTotalHeight + 8;
  
  if(amaLogs.length > 0){ hr(); sectionTitle('生涯年表（業餘成績）'); const hc=[['年',48],['齡',40],['球隊',150],['成績',W-PAD*2-238]]; let lx=PAD; c.font='bold 12px monospace'; c.fillStyle='#8fae9c'; hc.forEach(function(h){ c.fillText(h[0],lx,y); lx+=h[1]; }); y+=20; c.font='11px monospace'; amaLogs.forEach(function(r){ lx=PAD; c.fillStyle=r.inj?'#ff8b7a':'#cfe0d4'; const cells=[String(r.y),String(r.age),r.tm,r.line]; cells.forEach(function(cell,i){ let t=String(cell); const maxw=hc[i][1]-8; while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1); c.fillText(t,lx,y); lx+=hc[i][1]; }); y+=20; }); y+=4; }
  if(proLogs.length > 0){ hr(); sectionTitle('生涯年表（職業成績）'); const hc = isPit ? [['年',46],['齡',36],['球隊',124],['G',45],['IP',55],['W',36],['L',36],['SV',42],['HLD',42],['SO',46],['BB',46],['ERA',52],['WHIP',54]] : [['年',46],['齡',34],['球隊',120],['G',36],['PA',42],['AVG',46],['OBP',46],['SLG',46],['OPS',46],['H',40],['HR',36],['RBI',40],['SB',36],['DEF',40]]; let lx=PAD; c.font='bold 12px monospace'; c.fillStyle='#8fae9c'; hc.forEach(function(h){ c.fillText(h[0],lx,y); lx+=h[1]; }); y+=20; c.font='12px monospace'; proLogs.forEach(function(r){ lx=PAD; c.fillStyle=r.inj?'#ff8b7a':'#cfe0d4'; const tmS=r.tm; const s = r.st || {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0}; let cells = [];
    if(isPit){ const era = s.IP>0 ? (s.ER*9/s.IP).toFixed(2) : '-'; const whip = s.IP>0 ? ((s.H+s.BB)/s.IP).toFixed(2) : '-'; cells=[String(r.y), String(r.age), tmS, String(s.G), fmtIP(s.IP), String(s.W), String(s.L), String(s.SV||0), String(s.HLD||0), String(s.SO), String(s.BB||0), era, whip]; }
    else { const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0; const slgN = slgOf(s); const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-'; const obp = s.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-'; const slg = s.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-'; const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-'; cells=[String(r.y), String(r.age), tmS+(r.p?'·'+r.p:''), String(s.G), String(s.PA), avg, obp, slg, ops, String(s.H), String(s.HR), String(s.RBI), String(s.SB), String(s.DEF>0?'+'+s.DEF:s.DEF||0)]; }
    cells.forEach(function(cell,i){ let t=String(cell); const maxw=hc[i][1]-8; while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1); c.fillText(t,lx,y); lx+=hc[i][1]; }); y+=20; }); y+=4; }
  
  c.fillStyle='#ffc95c'; c.font='bold 16px sans-serif'; c.fillText('生涯總薪資 '+fmtMoney(Math.round(S.salary))+' 台幣',PAD,y); y+=26;
  c.fillStyle='#8fae9c'; c.font='11px monospace'; c.fillText('seed: '+SEED,PAD,H-40); c.textAlign='right'; c.fillText(APP_VER,W-PAD,H-40); c.textAlign='left';
  
  const url=cv.toDataURL('image/png'); const fileName='棒球生涯結算_'+S.name+'.png';
  out.innerHTML=`<img src="${url}" style="width:100%;border-radius:8px" alt="結算圖"><div style="display:flex;gap:8px;margin-top:8px"><button class="btn main" id="sh-save" style="flex:1">💾 儲存 / 分享圖片</button><button class="btn" id="sh-dl" style="flex:1">下載到裝置</button></div><div class="statline" style="margin-top:6px">若按鈕無效，長按上方圖片也可儲存</div>`;
  out.querySelector('#sh-dl').onclick=()=>{ const a=document.createElement('a'); a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove(); };
  out.querySelector('#sh-save').onclick=async ()=>{
    try{ const blob=await (await fetch(url)).blob(); const file=new File([blob],fileName,{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:'棒球生涯結算',text:S.name+' 的棒球人生'}); return; }
    }catch(e){ if(e&&e.name==='AbortError')return; }
    const a=document.createElement('a'); a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove();
  };
}

// ========== 遊戲初始化綁定 ==========
if(typeof document!=='undefined'&&document.getElementById('btn-restart')){
  document.getElementById('btn-restart').onclick=function(){
    if(confirm('確定要放棄這段人生，從頭開始嗎？'))location.href=location.pathname;
  };
}
function advance(){
  S.age++; S.year++; S.stageYr++; startYear();
}
(function(){ const t=document.getElementById('act-toggle');
  if(t)t.onclick=()=>{ document.getElementById('act').classList.toggle('collapsed');
    t.textContent=document.getElementById('act').classList.contains('collapsed')?'⌃ 展開選項':'⌄ 收合選項'; };
})();

let selPos='P';
document.getElementById('seed-show').value=SEED;
document.getElementById('seed-re').onclick=e=>{e.preventDefault();SEED=Math.random().toString(36).slice(2,10);document.getElementById('seed-show').value=SEED;};
document.querySelectorAll('#seg-pos button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#seg-pos button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); selPos=b.dataset.v;
});

document.getElementById('btn-start').onclick=()=>{
  const defName=(selPos==='P')?'有有子':(selPos==='IF')?'抹茶多':(['黃鎖頭','藥帝士'][Math.floor(Math.random()*2)]);
  const nm=document.getElementById('in-name').value.trim()||defName;
  const sv=document.getElementById('seed-show').value.trim(); if(sv)SEED=sv;
  history.replaceState(null,'','?seed='+encodeURIComponent(SEED));
  seedInit(SEED);
  S=newState(nm,selPos,null);
  S.teamName=function(){
    if(!this.orgTeam)return '';
    if(this.lv==='MLB')return this.orgTeam;
    if(LV[this.lv].org==='MiLB')return this.orgTeam+({R:'新人聯盟',A1:'1A',A2:'2A',A3:'3A'}[this.lv]);
    if(this.lv==='CPBL1'||this.lv==='NPB1')return this.orgTeam;
    return this.orgTeam+'二軍';
  };
  document.getElementById('start').style.display='none';
  document.getElementById('board').style.display=''; document.getElementById('act').style.display='';
  card('info','球員誕生',`${S.year} 年春天，${POSN[S.pos]} <b class="hl">${S.name}</b> 加入 <b class="hl">${S.team}</b> 棒球隊。三年後的路，要自己選。<br><span style="color:var(--dim);font-size:12px">提示：22 歲前累積擲出 5 次「6」可覺醒隱藏素質。</span>`);
  startYear();
};