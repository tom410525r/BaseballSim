function tierOf(bucket){
  const st=S.stats[bucket]; if(!st)return null;
  const hs=honorScore(bucket); const sc=careerScore(st)+hs.sc,th=TIER_TH[bucket];
  let i=sc>=th[0]?0:sc>=th[1]?1:sc>=th[2]?2:sc>=th[3]?3:4;
  if(hs.mvp||hs.aceN)i=Math.min(i,1); else if(hs.king)i=Math.min(i,2);
  return {i,sc:Math.round(sc),name:LG_N[bucket]+['名人堂','明星球員','每日球員','邊緣球員','一頁過客'][i]};
}
function careerScore(st){
  if(S.pos==='P'||S.pos==='TW')return st.W*13+st.SV*6+st.SO*0.9+st.IP*0.35;
  return st.H+st.HR*3+st.SB*0.8+st.RBI*0.5+st.BB*0.3+Math.max(0,st.DEF||0)*6;
}
function roleName3(r){ return {SP:'先發投手',MR:'中繼投手',CL:'終結者'}[r]||'投手'; }
function primaryPos(){
  if(S.pos==='P'||S.pos==='TW'){ const ry=S.roleYears||{}; const tot=Object.values(ry).reduce((a,b)=>a+b,0); if(!tot)return roleName3(S.role); const es=Object.entries(ry).sort((a,b)=>b[1]-a[1]); if(es[0][1]>=tot/2)return roleName3(es[0][0]); const list=es.map(e=>({SP:'先發',MR:'中繼',CL:'終結者'}[e[0]]||'')).filter(Boolean); return '搖擺人('+list.slice(0,2).join('、')+')'; }
  const dy=S.dposYears||{}; const total=Object.values(dy).reduce((a,b)=>a+b,0); if(!total)return S.dpos?DPN[S.dpos]:POSN[S.pos];
  const entries=Object.entries(dy).sort((a,b)=>b[1]-a[1]); if(entries[0][1]>=total/2)return DPN[entries[0][0]]||entries[0][0];
  const noDH=entries.filter(e=>e[0]!=='DH'&&e[0]!=='—').map(e=>DPN[e[0]]||e[0]); if(!noDH.length)return DPN['DH']; return '工具人('+noDH.join('、')+')';
}
function capTeam(bucket){ const tb=(S.teamTally&&S.teamTally[bucket])||{}; let best=null,bn=-1; for(const k in tb)if(tb[k]>bn){bn=tb[k];best=k;} return best; }
function defShare(bucket){ const st=S.stats[bucket]; if(!st||S.pos==='P'||S.pos==='TW')return 0; const off=st.H+st.HR*3+st.SB*0.8+st.RBI*0.5+st.BB*0.3; const def=Math.max(0,st.DEF||0)*6; return (off+def)>0?def/(off+def):0; }
function posLegendPhrase(bucket){
  const share=defShare(bucket), st=S.stats[bucket]; const dp=S.dpos||(S.pos==='C'?'C':null); const hasGlove=S.honors.some(h=>h.includes('金手套')||h.includes('守備王'));
  if(S.pos==='P'||S.pos==='TW'||!dp||dp==='DH')return ''; const posN=DPN[dp]||'';
  if(share>=0.34||(hasGlove&&share>=0.22))return `，以${{SS:'史上最偉大的游擊手之一',CF:'守備範圍撼動聯盟的中外野手',C:'蹲捕藝術的化身',_:'守備傳奇'}[dp]||('頂尖'+posN)}之姿`;
  if(hasGlove&&share>=0.12)return `，一位攻守俱佳的${posN}`; return '';
}
function honorScore(bucket){
  const lg={CPBL:'中職',NPB:'日職',MLB:'大聯盟'}[bucket]; const champ={CPBL:'中職總冠軍',NPB:'日本一',MLB:'世界大賽冠軍'}[bucket]; const ace='年度最佳投手';
  let sc=0,mvp=0,aceN=0,king=0;
  S.honors.forEach(h=>{
    if(h.includes(champ)){sc+=90;return;} if(h.includes(ace)){sc+=460;aceN++;return;} if(!h.includes(lg))return;
    if(h.includes('年度MVP')){sc+=420;mvp++;} else if(h.includes('新人王'))sc+=140; else if(h.includes('金手套')){sc+=300;king++;} else if(h.includes('守備王')){sc+=220;king++;} else if(h.includes('王')){sc+=160;king++;} else if(h.includes('明星賽'))sc+=((S.pos==='P'||S.pos==='TW')?70:40); });
  if(S.traits.franchise)sc+=200; return {sc,mvp,aceN,king};
}

function shareImage(evals,out){
  const isPit=S.pos==='P'||S.pos==='TW';
  const tiers=evals.map(t=>t.replace(/<[^>]+>/g,''));
  const keepTr=[...TRAIT_KEYS.pos,...TRAIT_KEYS.neg].filter(k=>S.traits[k]).map(k=>({label:traitName(k),key:k,neg:TRAIT_KEYS.neg.includes(k)}));
  const remTr=(S.removed||[]).map(l=>({label:l,key:'',neg:false,rem:true}));
  const leagues=['MLB','NPB','CPBL'].filter(b=>S.stats[b]);
  const milestones = [];
  if(S.hofInfo&&S.hofInfo.length){ S.hofInfo.forEach(h=>{ milestones.push(`${h.lg}名人堂 · 第${h.yr}年入選 ${h.pct}%`); }); }
  { let tH=0,tHR=0,tSB=0,tW=0,tSV=0,tHLD=0,tSO=0;
    ['CPBL','NPB','MLB'].forEach(b=>{ const st=S.stats[b]; if(!st)return;
      tH+=st.H||0;tHR+=st.HR||0;tSB+=st.SB||0;
      tW+=st.W||0;tSV+=st.SV||0;tHLD+=st.HLD||0;tSO+=st.SO||0; });
    if(isPit){ if(tW>0||tSO>0)milestones.push(`跨聯盟生涯 ${tW}勝 ${tSO}K ${tSV}救援 ${tHLD}中繼`); }
    else{ if(tH>0)milestones.push(`跨聯盟生涯 ${tHR}轟 ${tH}安 ${tSB}盜`); }
  }
  const honors = milestones.slice(); const aMap = {};
  S.honors.forEach(h => {
     const parts = h.split(' ');
     if(parts.length >= 2) { const yr = parts[0]; const awd = parts.slice(1).join(' '); if(!aMap[awd]) aMap[awd] = []; aMap[awd].push(yr); } else { if(!aMap[h]) aMap[h] = []; aMap[h].push(''); }
  });
  for(const awd in aMap) {
     const yrs = aMap[awd];
     if(yrs[0] !== '') {
       let nums = yrs.map(Number).sort((a,b)=>a-b);
       let res=[], st=nums[0], ed=nums[0];
       for(let i=1; i<=nums.length; i++){
         if(i<nums.length && nums[i]===ed+1){ ed=nums[i]; }
         else {
           if(ed-st>=2) res.push(`${st}~${ed}`); else if(ed-st===1) res.push(`${st}、${ed}`); else res.push(`${st}`);
           if(i<nums.length){ st=nums[i]; ed=nums[i]; }
         }
       }
       if(yrs.length > 1) honors.push(`${awd} *${yrs.length} (${res.join('、')})`); else honors.push(`${awd} (${res[0]})`);
     } else { honors.push(`${awd}`); }
  }
  const hist=S.log.slice(); const W=920, PAD=34, scale=2;
  const cv=document.createElement('canvas'); const c=cv.getContext('2d'); c.font='13px sans-serif';
  const _css=getComputedStyle(document.body), _tk=(n,fb)=>((_css.getPropertyValue(n)||'').trim()||fb);
  const C_BG=_tk('--bg','#0b1a12'), C_EDGE=_tk('--edge','#2b4a38'), C_DIM=_tk('--dim','#8fae9c'),
        C_ACC=_tk('--accent','#ffc95c'), C_TX=_tk('--text','#e8efe9'), C_GOOD=_tk('--good','#9fd8a8'),
        C_BAD=_tk('--bad','#ff8b7a'), C_P2=_tk('--panel2','#173524');
  const colW=(W-PAD*2)/2, maxTextW=colW-20;
  const honorBlocks = honors.map(h => {
    let text = '· ' + h; let lines = []; let curr = '';
    for(let i=0; i<text.length; i++) {
      let test = curr + text[i];
      if(c.measureText(test).width > maxTextW && curr.length > 0) { lines.push(curr); curr = '  ' + text[i]; } else { curr = test; }
    }
    if(curr) lines.push(curr); return lines;
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
  const amaLogs = hist.filter(r => !r.st); const proLogs = hist.filter(r => r.st);
  if(amaLogs.length > 0) H += 34 + amaLogs.length * 20 + 24;
  if(proLogs.length > 0) H += 34 + proLogs.length * 20 + 24;
  H+=70;
  cv.width=W*scale; cv.height=H*scale; c.scale(scale,scale);
  c.fillStyle=C_BG; c.fillRect(0,0,W,H); c.strokeStyle=C_EDGE; c.lineWidth=3; c.strokeRect(10,10,W-20,H-20); c.textBaseline='top';
  c.fillStyle=C_DIM; c.font='13px sans-serif'; c.fillText('S i m B a s e b a l l ・ 引 退 紀 念',PAD,30);
  c.fillStyle=C_ACC; c.font='bold 36px sans-serif'; c.fillText(S.name,PAD,52);
  c.fillStyle=C_TX; c.font='15px sans-serif';
  c.fillText(`${primaryPos()}｜${playerType()}｜${hist.length?hist[0].y:'?'}–${S.year}｜引退時 ${S.age} 歲${isPit&&S.tjCount?`｜TJ×${S.tjCount}`:''}`,PAD,98);
  let y=126;
  function tagColor(o){
    if(o.rem)return {bg:'#242424',bd:'#4a4a4a',fg:'#8a8a8a'};
    if(o.key==='legend'||o.key==='taiwan')return {bg:'#3a2c05',bd:'#ffc95c',fg:'#ffe08a'};
    if(o.key==='goldcloth')return {bg:'#3a3505',bd:'#e8d43a',fg:'#fff35a'};
    if(o.key==='mrteam')return teamChip(TEAM_COLOR[S.mrTeamName]||'#ffc95c');
    if(o.key==='genius')return {bg:'#232733',bd:'#c8d0e0',fg:'#e8eef7'};
    if(o.neg)return {bg:'#2a0f0f',bd:'#c0392b',fg:'#ff8b7a'};
    return {bg:C_P2,bd:C_EDGE,fg:C_GOOD};
  }
  function drawTags(items){ items.forEach(function(o){ const t=o.label, col=tagColor(o); c.font='12px sans-serif'; const w=c.measureText(t).width+16; c.fillStyle=col.bg; c.strokeStyle=col.bd; c.lineWidth=1; c.fillRect(tagx,y,w,20); c.strokeRect(tagx,y,w,20); c.fillStyle=col.fg; c.fillText(t,tagx+8,y+3); if(o.rem){ c.strokeStyle='#8a8a8a'; c.beginPath(); c.moveTo(tagx+4,y+10); c.lineTo(tagx+w-4,y+10); c.stroke(); } tagx+=w+8; if(tagx>W-160){tagx=PAD;y+=26;} }); }
  var tagx=PAD; if(keepTr.length||remTr.length){ drawTags(keepTr.concat(remTr)); y+=30; }
  function hr(){ c.strokeStyle=C_EDGE; c.lineWidth=1; c.beginPath(); c.moveTo(PAD,y); c.lineTo(W-PAD,y); c.stroke(); y+=12; }
  function sectionTitle(t){ c.fillStyle=C_DIM; c.font='bold 13px sans-serif'; c.fillText(t,PAD,y); y+=22; }
  hr(); sectionTitle('生涯評價');
  c.font='bold 16px sans-serif'; c.fillStyle=C_ACC;
  tiers.forEach(function(t){ c.fillText('★ '+t,PAD,y); y+=24; }); y+=6;
  hr(); sectionTitle('生涯累積數據');
  const cols=isPit?[['League',90],['Yrs',36],['G',48],['IP',54],['W',36],['L',36],['SV',48],['HLD',48],['SO',52],['BB',48],['ERA',52],['WHIP',54]]:[['League',80],['Yrs',34],['G',40],['PA',46],['AVG',48],['OBP',48],['SLG',48],['OPS',48],['H',44],['HR',38],['RBI',44],['SB',40],['DEF',40]];
  function row(cells,head){ let x=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?C_DIM:C_TX; cells.forEach(function(cell,i){ c.fillText(String(cell),x,y); x+=cols[i][1]; }); y+=head?24:26; }
  row(cols.map(cc=>cc[0]),true);
  leagues.forEach(function(b){ const st=S.stats[b];
    if(isPit){ const era=st.IP>0?(st.ER*9/st.IP).toFixed(2):'-'; const whip=st.IP>0?((st.H+st.BB)/st.IP).toFixed(2):'-'; row([LG_N[b],st.yr,st.G,fmtIP(st.IP),st.W,st.L,st.SV||0,st.HLD||0,st.SO,st.BB||0,era,whip]); }
    else{ const obpN = st.PA>0 ? (st.H+st.BB)/st.PA : 0; const slgN = slgOf(st); const avg = st.AB>0 ? (st.H/st.AB).toFixed(3).replace(/^0/,'') : '-'; const obp = st.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-'; const slg = st.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-'; const ops = st.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-'; row([LG_N[b],st.yr,st.G,st.PA,avg,obp,slg,ops,st.H,st.HR,st.RBI,st.SB,(st.DEF>0?'+':'')+(st.DEF||0)]); } });
  y+=6;
  if(S.intlCount>0){ const IS=S.intlStat; hr(); sectionTitle('國際賽生涯（中華隊 '+S.intlCount+' 屆）');
    const rowIntl=(cells,head)=>{ let x=PAD; c.font=(head?'bold ':'')+'13px monospace'; c.fillStyle=head?C_DIM:C_TX; cells.forEach(function(cell,i){ c.fillText(String(cell),x,y); x+=ic[i][1]; }); y+=head?24:28; };
    var ic;
    if(isPit){ const era=IS.IP>0?(IS.ER*9/IS.IP).toFixed(2):'-'; ic=[['',110],['G',80],['IP',86],['W',60],['SV',72],['SO',80],['ERA',80]]; rowIntl(['', 'G', 'IP', 'W', 'SV', 'SO', 'ERA'], true); rowIntl(['',IS.G,fmtIP(IS.IP),IS.W,IS.SV,IS.SO,era],false); }
    else { const avg=IS.AB>0?(IS.H/IS.AB).toFixed(3).replace(/^0/,''):'-'; ic=[['',110],['G',76],['PA',76],['AVG',76],['H',72],['HR',60],['RBI',72]]; rowIntl(['', 'G', 'PA', 'AVG', 'H', 'HR', 'RBI'], true); rowIntl(['',IS.G,IS.PA,avg,IS.H,IS.HR,IS.RBI],false); }
    y+=6; }
  hr(); sectionTitle('生涯榮譽（'+honors.length+' 項）'); c.font='13px sans-serif'; c.fillStyle=C_GOOD;
  let startY = y; let currY = startY;
  honorBlocks.forEach(function(b, i){ const isRightCol = i >= rows2; if(i === rows2) currY = startY; const hx = PAD + (isRightCol ? colW : 0); b.forEach(line => { c.fillText(line, hx, currY); currY += 23; }); });
  y += honorsTotalHeight + 8;
  if(amaLogs.length > 0){ hr(); sectionTitle('生涯年表（業餘成績）'); const hc=[['年',48],['齡',40],['球隊',150],['成績',W-PAD*2-238]]; let x=PAD; c.font='bold 12px monospace'; c.fillStyle=C_DIM; hc.forEach(function(h){ c.fillText(h[0],x,y); x+=h[1]; }); y+=20; c.font='11px monospace'; amaLogs.forEach(function(r){ x=PAD; c.fillStyle=r.inj?C_BAD:C_TX; const cells=[String(r.y),String(r.age),r.tm,r.line]; cells.forEach(function(cell,i){ let t=String(cell); const maxw=hc[i][1]-8; while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1); c.fillText(t,x,y); x+=hc[i][1]; }); y+=20; }); y+=4; }
  if(proLogs.length > 0){ hr(); sectionTitle('生涯年表（職業成績）'); const hc = isPit ? [['年',46],['齡',36],['球隊',124],['G',45],['IP',55],['W',36],['L',36],['SV',42],['HLD',42],['SO',46],['BB',46],['ERA',52],['WHIP',54]] : [['年',46],['齡',34],['球隊',120],['G',36],['PA',42],['AVG',46],['OBP',46],['SLG',46],['OPS',46],['H',40],['HR',36],['RBI',40],['SB',36],['DEF',40]]; let x=PAD; c.font='bold 12px monospace'; c.fillStyle=C_DIM; hc.forEach(function(h){ c.fillText(h[0],x,y); x+=h[1]; }); y+=20; c.font='12px monospace'; proLogs.forEach(function(r){ x=PAD; c.fillStyle=r.inj?C_BAD:C_TX; const tmS=r.tm; const s = r.st || {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0}; let cells = [];
    if(isPit){ const era = s.IP>0 ? (s.ER*9/s.IP).toFixed(2) : '-'; const whip = s.IP>0 ? ((s.H+s.BB)/s.IP).toFixed(2) : '-'; cells=[String(r.y), String(r.age), tmS, String(s.G), fmtIP(s.IP), String(s.W), String(s.L), String(s.SV||0), String(s.HLD||0), String(s.SO), String(s.BB||0), era, whip]; }
    else { const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0; const slgN = slgOf(s); const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-'; const obp = s.PA>0 ? obpN.toFixed(3).replace(/^0/,'') : '-'; const slg = s.AB>0 ? slgN.toFixed(3).replace(/^0/,'') : '-'; const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-'; cells=[String(r.y), String(r.age), tmS+(r.p?'·'+r.p:''), String(s.G), String(s.PA), avg, obp, slg, ops, String(s.H), String(s.HR), String(s.RBI), String(s.SB), String(s.DEF>0?'+'+s.DEF:s.DEF||0)]; }
    cells.forEach(function(cell,i){ let t=String(cell); const maxw=hc[i][1]-8; while(c.measureText(t).width>maxw&&t.length>1)t=t.slice(0,-1); c.fillText(t,x,y); x+=hc[i][1]; }); y+=20; }); y+=4; }
  c.fillStyle=C_ACC; c.font='bold 16px sans-serif'; c.fillText('生涯總薪資 '+fmtMoney(Math.round(S.salary))+' 台幣',PAD,y); y+=26;
  c.fillStyle=C_DIM; c.font='11px monospace'; c.fillText('seed: '+SEED,PAD,H-40); c.textAlign='right'; c.fillText(APP_VER,W-PAD,H-40); c.textAlign='left';
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

function retireScene(tiers){
  let lg=bucketOf(S.lv), bestI=4;
  const order=['MLB','NPB','CPBL']; order.forEach(b=>{ if(tiers[b]&&tiers[b].i<bestI){ bestI=tiers[b].i; } });
  let repYr=-1; order.forEach(b=>{ if(tiers[b]&&tiers[b].i===bestI){ const yy=S.stats[b]?S.stats[b].yr:0; if(yy>repYr){repYr=yy;lg=b;} } });
  const t=tiers[lg], i=t?t.i:4, yr=S.year; let txt='';
  if(lg==='CPBL'){
    if(i===0)txt=`引退戰選在<b class="hl">臺北大巨蛋</b>。四萬人把巨蛋塞得水洩不通，外野看板掛滿你生涯每一年的照片。九局下最後一個打席結束，全場燈光暗下，只剩一道追光打在你身上。`;
    else if(i===1)txt=`球團為你舉辦了引退儀式。主場滿場，大螢幕播放生涯回顧影片，老隊友從各地回來替你獻花，總教練哽咽致詞。`;
    else txt=`球季最後一個主場日，球團安排你先發，賽後全場觀眾起立鼓掌。`;
  }else if(lg==='NPB'){
    if(i<=1)txt=`球團為你安排了<b class="hl">引退試合</b>。兩軍球員沿線列隊，隊友把你高高拋起——三次、四次、五次的胴上げ。`;
    else txt=`最終戰賽後，球團舉行了簡短的引退セレモニー，客場球迷也起立鼓掌。`;
  }else{
    txt=`主場最終戰，全場觀眾起立鼓掌長達三分鐘，Curtain Call。`;
  }
  card('gold','引退之日',txt);
  const hofs=[]; let firstBallot=false; const hofLeagues=[];
  const HOF_CFG={CPBL:{n:'中華職棒名人堂',wait:5,total:132,lg:'中職'},NPB:{n:'日本野球殿堂',wait:5,total:326,lg:'日職'},MLB:{n:'美國棒球名人堂',wait:5,total:389,lg:'大聯盟'}};
  ['CPBL','NPB','MLB'].forEach(b=>{ const t=tiers[b]; if(!t)return;
    const cfg=HOF_CFG[b];
    if(t.i===0){
      const th=TIER_TH[b][0]; const fbMult={CPBL:1.12,NPB:1.12,MLB:1.2}[b]||1.2;
      const firstNow = t.sc>=th*fbMult; const ballotYr = firstNow?1:ri(2,6);
      if(firstNow){ firstBallot=true; } hofLeagues.push(cfg.lg);
      const pct=Math.min(99.1,75+ (t.sc-th)/th*40 + R()*6 - (ballotYr-1)*4); const votes=Math.round(cfg.total*Math.max(75,pct)/100);
      if(!S.hofInfo)S.hofInfo=[]; S.hofInfo.push({lg:cfg.lg,yr:ballotYr,pct:Math.max(75,pct).toFixed(1)});
      const cap=capTeam(b), phr=posLegendPhrase(b);
      hofs.push(`引退 <b class="hl">${cfg.wait}</b> 年後進入候選，於<b class="hl">第 ${ballotYr} 年投票</b>以 <b class="hl">${votes}</b> 票（得票率 ${Math.max(75,pct).toFixed(1)}%）榮登<b class="hl">${cfg.n}</b>。`);
    } });
  if(firstBallot&&!S.traits.legend){ S.traits.legend=true; S.legendLeague=hofLeagues[0]||''; }
  if(hofs.length)card('gold','名人堂票選',hofs.join('<br><br>'));
  if(S.traits.legend){ card('gold','隱藏屬性解鎖：歷史級球星','第一年投票就披上名人堂金袍——你定義了一個時代。'); }
}
function endGame(reason){
  S.done=true; actClear();
  divider('生涯終幕'); card('info','引退',reason);
  let tables='',evals=[],best=99; const tiersByLg={};
  ['MLB','NPB','CPBL','MINOR'].forEach(b=>{ if(S.stats[b]){ tables+=statTable(b);
    if(b!=='MINOR'){ const t=tierOf(b); tiersByLg[b]=t; evals.push(`<span class="tag">${t.name}</span>（評價分 ${t.sc}）`); best=Math.min(best,t.i); } } });
  if(best===99)best=4;
  const tc = S.orgTeam ? (TEAM_COLOR[S.orgTeam] || '#1e3c28') : '#1e3c28'; let topStats = []; const a = S.ab;
  if(S.pos==='P'||S.pos==='TW') topStats = [{n:'球速',v:a.vel},{n:'控球',v:a.ctl},{n:'變化',v:a.brk}].sort((x,y)=>y.v-x.v);
  else topStats = [{n:'力量',v:a.pow},{n:'打擊',v:a.con},{n:'速度',v:a.spd},{n:'守備',v:a.fld}].sort((x,y)=>y.v-x.v);
  const tierL = ['S','A','B','C','D'][Math.min(4, Math.max(0, best))] || 'C';
  const cardHTML = `
    <div class="player-card" style="background: linear-gradient(135deg, ${tc}, #0b1a12)">
      <div class="pc-tier">${tierL}</div>
      <div class="pc-pos">${S.pos}</div>
      <div class="pc-name">${S.name}</div>
      <div class="pc-ovr">${ovr()}<small> OVR</small></div>
      <div class="pc-stats">
        <div class="pc-st"><span>${topStats[0].n}</span><b>${topStats[0].v}</b></div>
        <div class="pc-st"><span>${topStats[1].n}</span><b>${topStats[1].v}</b></div>
        <div class="pc-st"><span>${topStats[2].n}</span><b>${topStats[2].v}</b></div>
      </div>
      <div class="pc-logo">${S.teamName()||'自由球員'}</div>
    </div>
  `;
  card('', '生涯成就紀念卡', cardHTML);
  retireScene(tiersByLg);
  if(S.age<25){
    const nm=S.name;
    const second=[`你加入了乙組業餘棒球隊。去年在協會盃敲出再見安打的影片被瘋傳。`,`你考到了不動產營業員執照。帶看時爬六樓透天面不改色。`,`你跟著舅舅去做板模。核心力量和不服輸讓老師傅都點頭。`];
    card('gold','第二人生',second[Math.floor(R()*second.length)].replace(/{n}/g,nm)+`<br><br><span class="sub">離開球場的人生，也是人生。${nm}，辛苦了。</span>`);
  }
  if(S.log.length){
    const amaLogs = S.log.filter(r => !r.st); const proLogs = S.log.filter(r => r.st);
    if(amaLogs.length > 0){
      const amaRows = amaLogs.map(r=>`<tr><td style="white-space:nowrap">${r.y}</td><td style="white-space:nowrap">${r.age}</td><td style="text-align:left;white-space:nowrap">${r.tm}</td><td style="text-align:left;font-size:11px;${r.inj?'color:var(--bad);font-weight:700;':''}">${r.line}</td></tr>`).join('');
      card('','生涯年表（業餘成績）',`<table class="fin"><tr><th>年度</th><th>齡</th><th style="text-align:left">球隊</th><th style="text-align:left">成績</th></tr>${amaRows}</table>`);
    }
    if(proLogs.length > 0){
      const headP = `<tr><th>年</th><th>齡</th><th style="text-align:left">球隊</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr>`;
      const headB = `<tr><th>年</th><th>齡</th><th style="text-align:left">球隊</th><th>G</th><th>PA</th><th>AVG</th><th>OPS</th><th>OPS+</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th><th>WAR</th></tr>`;
      let rows = '';
      proLogs.forEach(r => {
        const cS = r.inj ? 'color:var(--bad);font-weight:700;' : '';
        const s = r.st || {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0,WAR:0};
        const tmS = r.tm;
        if(S.pos === 'TW') {
          const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0; const slgN = slgOf(s); const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-'; const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
          rows += `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td style="text-align:left;white-space:nowrap">${tmS} (打)</td><td>${s.G}</td><td>${s.PA}</td><td>${avg}</td><td>${ops}</td><td>${s.opsPlus||'-'}</td><td>${s.HR}</td><td>${s.RBI}</td><td>${s.SB}</td><td>${s.DEF>0?'+':''}${s.DEF||0}</td><td>${(s.WAR||0).toFixed(1)}</td></tr>`;
          if(s.pitch) {
            const pst = s.pitch; const era = pst.IP>0 ? (pst.ER*9/pst.IP).toFixed(2) : '-';
            rows += `<tr style="${cS}; opacity:0.8"><td></td><td></td><td style="text-align:left;white-space:nowrap">${tmS} (投)</td><td>${pst.G}</td><td>${fmtIP(pst.IP)}</td><td>${pst.W}</td><td>${pst.L}</td><td>${pst.SV||0}</td><td>${pst.SO}</td><td>${era}</td><td>${pst.eraPlus||'-'}</td><td>${(pst.WAR||0).toFixed(1)}</td></tr>`;
          }
        } else if(S.pos === 'P') {
          const era = s.IP>0 ? (s.ER*9/s.IP).toFixed(2) : '-';
          rows += `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td style="text-align:left;white-space:nowrap">${tmS}</td><td>${s.G}</td><td>${fmtIP(s.IP)}</td><td>${s.W}</td><td>${s.L}</td><td>${s.SV||0}</td><td>${s.SO}</td><td>${era}</td><td>${s.eraPlus||'-'}</td><td>${(s.WAR||0).toFixed(1)}</td></tr>`;
        } else {
          const obpN = s.PA>0 ? (s.H+s.BB)/s.PA : 0; const slgN = slgOf(s); const avg = s.AB>0 ? (s.H/s.AB).toFixed(3).replace(/^0/,'') : '-'; const ops = s.AB>0 ? (obpN+slgN).toFixed(3).replace(/^0/,'') : '-';
          rows += `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td style="text-align:left;white-space:nowrap">${tmS}${r.p?"·"+r.p:""}</td><td>${s.G}</td><td>${s.PA}</td><td>${avg}</td><td>${ops}</td><td>${s.opsPlus||'-'}</td><td>${s.HR}</td><td>${s.RBI}</td><td>${s.SB}</td><td>${s.DEF>0?'+':''}${s.DEF||0}</td><td>${(s.WAR||0).toFixed(1)}</td></tr>`;
        }
      });
      const tableHead = S.pos === 'TW' ? headB : (S.pos === 'P' ? headP : headB);
      card('','生涯年表（職業成績）',`<table class="fin">${tableHead}${rows}</table>`);
    }
  }
  let intlTable='';
  if(S.intlCount>0){ const IS=S.intlStat;
    if(S.pos==='P'||S.pos==='TW'){ const era=IS.IP>0?(IS.ER*9/IS.IP).toFixed(2):'-'; intlTable=`<h4 style="margin:12px 0 4px">國際賽生涯（中華隊 ${S.intlCount} 屆）</h4><table class="st"><tr><th>出賽</th><th>局數</th><th>勝</th><th>救援</th><th>三振</th><th>ERA</th></tr><tr><td>${IS.G}</td><td>${fmtIP(IS.IP)}</td><td>${IS.W}</td><td>${IS.SV}</td><td>${IS.SO}</td><td>${era}</td></tr></table>`; }
    else { const avg=IS.AB>0?(IS.H/IS.AB).toFixed(3).replace(/^0/,''):'-'; intlTable=`<h4 style="margin:12px 0 4px">國際賽生涯（中華隊 ${S.intlCount} 屆）</h4><table class="st"><tr><th>出賽</th><th>打席</th><th>打擊率</th><th>安打</th><th>全壘打</th><th>打點</th></tr><tr><td>${IS.G}</td><td>${IS.PA}</td><td>${avg}</td><td>${IS.H}</td><td>${IS.HR}</td><td>${IS.RBI}</td></tr></table>`; }
  }
  card('','生涯累積數據',(tables||'<p>（無職業層級出賽紀錄）</p>')+intlTable);
  if(evals.length)card('gold','生涯評價',evals.join('<br>'));
  let honorsHTML = '（生涯未獲得任何獎項）';
  if(S.honors.length) {
    const awardMap = {};
    S.honors.forEach(h => {
       const parts = h.split(' ');
       if(parts.length >= 2) { const yr = parts[0]; const awd = parts.slice(1).join(' '); if(!awardMap[awd]) awardMap[awd] = []; awardMap[awd].push(yr); } else { if(!awardMap[h]) awardMap[h] = []; awardMap[h].push(''); }
    });
    const honorsList = [];
    for(const awd in awardMap) {
       const yrs = awardMap[awd];
       if(yrs[0] !== '') {
         let nums = yrs.map(Number).sort((a,b)=>a-b); let res=[], st=nums[0], ed=nums[0];
         for(let i=1; i<=nums.length; i++){
           if(i<nums.length && nums[i]===ed+1){ ed=nums[i]; }
           else {
             if(ed-st>=2) res.push(`${st}~${ed}`); else if(ed-st===1) res.push(`${st}、${ed}`); else res.push(`${st}`);
             if(i<nums.length){ st=nums[i]; ed=nums[i]; }
           }
         }
         if(yrs.length > 1) honorsList.push(`· ${awd} *${yrs.length} (${res.join('、')})`); else honorsList.push(`· ${awd} (${res[0]})`);
       } else { honorsList.push(`· ${awd}`); }
    }
    honorsHTML = honorsList.join('<br>');
  }
  card(S.honors.length?'gold':'','獎項與大賽成績', honorsHTML);
  const tr=[];
  [...TRAIT_KEYS.pos,...TRAIT_KEYS.neg].forEach(k=>{ if(S.traits[k])tr.push(`<span class="tag" style="${traitTagStyle(k)}">${traitName(k)}</span>`); });
  (S.removed||[]).forEach(lbl=>tr.push(`<span class="tag" style="text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a">${lbl}</span>`));
  const lv=S.love;
  const cur=lv.st==='married'?`老婆 ${lv.partner}（${lv.kids}）`:lv.st==='dating'?`交往中 ${lv.partner}（${lv.dyrs||0} 年）`:lv.st==='divorced'?'離婚':'未婚';
  const exStr=lv.exes.length?`｜前妻 ${lv.exes.map(e=>`${e.name}（${e.kids}）`).join('、')}`:'';
  const totKids=lv.kids+lv.exes.reduce((t,e)=>t+e.kids,0);
  card('','生涯檔案',`隱藏素質：${tr.join(' ')||'（無）'}<br>家庭：${cur}${exStr}｜子女共 ${totKids} 人<br>國際賽出賽：${S.intlCount} 次｜生涯大傷：${S.bigInj} 次${(S.pos==='P'||S.pos==='TW')?`｜TJ 手術：${S.tjCount} 次`:''}<br>生涯總薪資：<b class="hl" style="font-size:18px">${fmtMoney(Math.round(S.salary))}</b> 台幣`);
  
  const pool=FAN[best].slice(); const picks=[];
  while(picks.length<3&&pool.length)picks.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  { const LGR={CPBL:0,NPB:1,MLB:2}, CTY={CPBL:'台灣',NPB:'日本',MLB:'美國'};
    ['CPBL','NPB','MLB'].forEach(low=>{ ['CPBL','NPB','MLB'].forEach(high=>{
      if(LGR[high]>LGR[low] && tiersByLg[low] && tiersByLg[high] && tiersByLg[low].i<=1 && tiersByLg[high].i>=3){
        picks.push(`在${CTY[low]}是${LG_N[low]}的招牌，到了${CTY[high]}的${LG_N[high]}卻完全打不出來——球團真是盤子`);
      }
    }); });
  }
  if(S.traits.glass)picks.push('如果沒有那些傷，他的生涯會是什麼樣子……');
  if(S.traits.iron)picks.push('鐵人謝幕。那個連續出賽紀錄，大概很久都不會被打破了');
  if(S.traits.legend)picks.push('這輩子能看到你打球，是我們這代球迷的福氣。');
  card('info','球迷看板・引退串',picks.map(p=>'“'+p+'”').join('<br>'));
  
  const sh=document.createElement('div'); sh.className='card';
  sh.innerHTML=`<div class="title">分享這段生涯</div>
    <div class="row2" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn main" id="sh-img" style="flex:1">📸 產生結算圖</button>
      <button class="btn" id="sh-url" style="flex:1">🔗 複製重播連結</button>
    </div><div id="sh-out" style="margin-top:8px"></div>`;
  $('log').appendChild(sh);
  sh.querySelector('#sh-img').onclick=()=>shareImage(evals,sh.querySelector('#sh-out'));
  sh.querySelector('#sh-url').onclick=e=>{
    const url=location.origin.startsWith('http')?location.origin+location.pathname+'?seed='+SEED:location.href.split('?')[0]+'?seed='+SEED;
    const okmsg=()=>{e.target.textContent='✅ 已複製';setTimeout(()=>e.target.textContent='🔗 複製重播連結',1600);};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(okmsg,()=>prompt('手動複製連結：',url)); else prompt('手動複製連結：',url);
  };
  choose('',[
    {t:'⚾ 開啟新的人生（新種子）',main:true,f:()=>{location.href=location.pathname;}},
    {t:'用同一個種子重來',s:'seed: '+SEED,f:()=>{location.href=location.pathname+'?seed='+SEED;}}]);
  setTimeout(()=>{ try{
    const heads=document.querySelectorAll('.yr-head');
    for(const h of heads){ if(h.textContent==='生涯終幕'){ h.scrollIntoView({behavior:'auto',block:'start'}); break; } }
  }catch(e){} }, 250);
}

function initGame(region) {
  const defName=(selPos==='P'||selPos==='TW')?'有有子':(selPos==='IF')?'抹茶多':(['黃鎖頭','藥帝士'][Math.floor(Math.random()*2)]);
  const nm=$('in-name').value.trim()||defName;
  const sv=$('seed-show').value.trim(); if(sv)SEED=sv;
  history.replaceState(null,'','?seed='+encodeURIComponent(SEED));
  seedInit(SEED); S=newState(nm,selPos,null);
  S.hsRegion = region;
  if(region === 'JP') { S.team = pick(['大阪桐蔭', '智辯和歌山', '仙台育英', '橫濱高校', '東海大相模']); }
  S.teamName=function(){
    if(!this.orgTeam)return ''; if(this.lv==='MLB')return this.orgTeam;
    if(LV[this.lv].org==='MiLB')return this.orgTeam+({R:'新人聯盟',A1:'1A',A2:'2A',A3:'3A'}[this.lv]);
    if(this.lv==='CPBL1'||this.lv==='NPB1')return this.orgTeam;
    return this.orgTeam+'二軍';
  };
  $('start').style.display='none'; $('board').style.display=''; $('act').style.display='';
  TL=[]; renderTimeline(); const ts=$('tl-seed'); if(ts)ts.textContent=SEED;
  const loc = region === 'JP' ? '日本' : '台灣';
  card('info','球員誕生',`${S.year} 年春天，${POSN[S.pos]} <b class="hl">${S.name}</b> 加入了 <b class="hl">${S.team}</b> 棒球隊，開始了在${loc}的訓練。三年後的路，要自己選。<br><span style="color:var(--dim);font-size:12px">提示：22 歲前累積擲出 5 次「6」可覺醒隱藏素質。</span>`);
  startYear();
}

$('btn-start').onclick=() => initGame('TW');
$('btn-start-jp').onclick=() => initGame('JP');
