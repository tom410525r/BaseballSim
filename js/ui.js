const $=id=>document.getElementById(id);
let _curYearBody=null;
let MAX_YEARS=8;

function scrollBottom(){
  try{ requestAnimationFrame(function(){ window.scrollTo(0, document.body.scrollHeight); }); }
  catch(e){ try{ window.scrollTo(0, document.body.scrollHeight); }catch(_){} }
}

function logTarget(){ return _curYearBody || $('log'); }

function card(cls,title,html){ 
  const d=document.createElement('div'); d.className='card '+cls;
  d.innerHTML=(title?`<h4>${title}</h4>`:'')+html; logTarget().appendChild(d);
  scrollBottom(); 
}

function divider(t){ 
  const log=$('log'); const blocks=log.querySelectorAll('.yr-block'); 
  const prev = blocks[blocks.length - 1]; 
  if(prev){ const h = prev.querySelector('.yr-head'); if(h && prev.querySelector('.yr-body').children.length) h.classList.add('has-body'); } 
  const prevPrev = blocks[blocks.length - 2]; 
  if(prevPrev){ prevPrev.classList.add('collapsed'); } 
  const block=document.createElement('div'); block.className='yr-block'; 
  const head=document.createElement('div'); head.className='yr-head'; head.textContent=t; 
  const body=document.createElement('div'); body.className='yr-body'; 
  head.onclick=()=>block.classList.toggle('collapsed'); 
  block.appendChild(head); block.appendChild(body); log.appendChild(block); 
  _curYearBody=body; 
  const newBlocks=log.querySelectorAll('.yr-block'); 
  if(newBlocks.length>MAX_YEARS){ for(let i=0;i<newBlocks.length-MAX_YEARS;i++)newBlocks[i].remove(); } 
}

function board(phase){
  $('bd-name').innerHTML=`${S.name}<small>${S.dpos?DPN[S.dpos]:POSN[S.pos]}${S.role?'·'+roleN(S.role):''}·${playerType()}${S.traits.genius?' ★':''}</small>`;
  let t;
  if(S.stage==='HS')t=S.team+'（高'+['一','二','三'][S.stageYr-1]+'）';
  else if(S.stage==='U')t=S.team+'（大'+['一','二','三','四'][S.stageYr-1]+'）';
  else if(S.stage==='AMA')t=S.team+'（業餘）';
  else t=S.teamName();
  { const tc = (S.orgTeam && TEAM_COLOR[S.orgTeam]) || 'var(--amber)';
    const isWhite = (tc.toLowerCase() === '#ffffff' || tc.toLowerCase() === '#fff');
    const isProColored = (S.stage === 'PRO' && TEAM_COLOR[S.orgTeam]);
    const txtColor = isProColored ? (isWhite ? '#000000' : tc) : 'var(--amber)';
    const bgStyle = isProColored ? 'background:#ffffff; padding:2px 8px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.4);' : '';
    const dot = isProColored ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isWhite ? '#cccccc' : tc};margin-right:6px;vertical-align:middle;box-shadow:0 0 2px rgba(0,0,0,0.2);"></span>` : '';
    $('bd-team').innerHTML = dot + `<span style="color:${txtColor}; ${bgStyle} font-weight:900;">${t}</span>`; }
  $('bd-age').textContent=S.age; $('bd-year').textContent=S.year;
  $('bd-ovr').textContent=ovr(); if(S.pos==='P'||S.pos==='TW'){const el=$('bd-tj'); if(el)el.textContent='';} $('bd-sal').textContent=Math.round(S.salary).toLocaleString();
  [0,1,2].forEach(i=>$('lp'+i).classList.toggle('on',i===phase));
}

function actClear(){ 
  const a=$('act'); a.innerHTML=''; a.classList.remove('collapsed');
  const t=$('act-toggle'); if(t)t.style.display='none'; 
}

function actToggleSync(){
  const a=$('act'), t=$('act-toggle'); if(!t)return;
  const has=a.innerHTML.trim()!=='' && a.style.display!=='none';
  t.style.display=has?'block':'none';
  t.textContent=a.classList.contains('collapsed')?'⌃ 展開選項':'⌄ 收合選項';
}

function choose(title,opts){
  actClear(); const a=$('act');
  a.classList.remove('collapsed');
  if(title)a.innerHTML=`<div class="title">${title}</div>`;
  opts.forEach(o=>{ const b=document.createElement('button');
    b.className='btn'+(o.main?' main':'')+(o.warn?' warn':'');
    b.innerHTML=o.t+(o.s?`<small>${o.s}</small>`:'');
    b.onclick=()=>{ actClear(); o.f(); }; a.appendChild(b); });
  actToggleSync(); scrollBottom();
}

function allocUI(mode,label,done){
  actClear(); const a=$('act'); const keys=POS_AB[S.pos];
  let dice=mode.dice?mode.dice.slice():null, pool=mode.pool||0, idx=0, hist=[];
  a.innerHTML=`<div class="title">${label}</div><div id="al-top"></div><div id="al-rows"></div><div class="row2" id="al-btm"></div>`;
  const touchedKeys={};
  const top=$('al-top'),rows=$('al-rows'),btm=$('al-btm');
  
  function remaining(){ return dice?dice.length-idx:pool; }
  
  function render(){
    if(dice){ top.innerHTML='<div id="dice">'+dice.map((v,i)=>`<div class="die ${i<idx?'used':''} ${i===idx?'active':''} ${v===6?'six':''}">${v}</div>`).join('')+'</div>'; }
    else top.innerHTML=`<div class="pool">剩餘可分配點數：${pool} 點（點一下能力 +1）</div>`;
    
    rows.innerHTML='';
    keys.forEach(k=>{ const v=S.ab[k],cap=v>=80;
      const r=document.createElement('div'); r.className='abrow'+(cap?' capped':'');
      const pk=(S.pot&&S.pot[k])||62, cst=abCost(k), cr=(S.carry&&S.carry[k])||0;
      
      let c1, c2;
      if(v < 45) { c1 = '#8a3a3a'; c2 = '#e2695c'; }
      else if(v < 65) { c1 = '#8a6a2a'; c2 = '#ffc95c'; }
      else if(v < 80) { c1 = '#3c6a4c'; c2 = '#8fd08f'; }
      else { c1 = '#2874a6'; c2 = '#7fb3d5'; }
      
      r.innerHTML=`<span class="nm">${ABL[k]}</span><span class="bar"><i style="width:${v/80*100}%; background:linear-gradient(90deg,${c1},${c2})"></i><em style="left:${pk/80*100}%"></em></span><span class="val" style="line-height:1.1">${v}<small style="opacity:.5">/${pk}</small>${cst>1?`<span style="display:block;opacity:.5;font-size:10.5px;letter-spacing:1px;margin-top:-2px">${cr}/${cst}</span>`:''}</span>`;
      
      if(!cap&&remaining()>0)r.onclick=()=>{ const amt=dice?dice[idx]:1;
        const pc=(S.carry&&S.carry[k])||0;
        const got=addAb(k,amt); touchedKeys[k]=(touchedKeys[k]||0)+amt; hist.push([k,got,pc]); if(dice)idx++; else pool--;
        r.querySelector('.val').innerHTML=`${S.ab[k]} <b style="display:block;font-size:10.5px">${got>0?'+'+got:'蓄力中'}</b>`; render(); board(0); };
      rows.appendChild(r); });
      
    btm.innerHTML='';
    const u=document.createElement('button'); u.className='btn'; u.style.textAlign='center';
    u.textContent='↩ 復原'; u.disabled=!hist.length;
    u.style.opacity=hist.length?'1':'0.35'; u.style.cursor=hist.length?'pointer':'default';
    if(hist.length)u.onclick=()=>{ const [k,got,pc]=hist.pop(); S.ab[k]-=got; if(S.carry)S.carry[k]=pc; if(dice)idx--; else pool++; render(); board(0); };
    btm.appendChild(u);
    
    const allCap=keys.every(k=>S.ab[k]>=80);
    if(remaining()===0||allCap){ const c=document.createElement('button'); c.className='btn main';
      c.textContent=(remaining()>0&&allCap)?'能力已達上限，捨棄剩餘骰子 ▸':'確認 ▸';
      c.onclick=()=>{ actClear(); allocDone(touchedKeys,dice?true:false); done(); }; btm.appendChild(c); }
    actToggleSync();
  }
  render();
}