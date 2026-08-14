// ==================== UI 基礎操作與渲染 ====================
const $ = id => document.getElementById(id);
let _curYearBody = null;
let MAX_YEARS = 8;
const THEME_KEY = 'yakyu-theme';
const BIG_KEY = 'yakyu-big-text';
const THEME_NAMES = {a: '深綠記分板', b: '電子看板', c: '報紙版面', d: '現代儀表板'};

function scrollBottom() {
  try { requestAnimationFrame(function() { window.scrollTo(0, document.body.scrollHeight); }); }
  catch(e) { try { window.scrollTo(0, document.body.scrollHeight); } catch(_) {} }
}

function logTarget() { return _curYearBody || $('log'); }

function card(cls, title, html) { 
  const d = document.createElement('div'); d.className = 'card ' + (cls || '');
  d.innerHTML = (title ? `<h4>${title}</h4>` : '') + html; 
  logTarget().appendChild(d);
  renderTraits();
  scrollBottom(); 
}

function traitCard(key, name, desc, tone) { 
  S.traits[key] = true;
  card(tone || 'gold', '隱藏屬性解鎖：' + name, desc); board(0); 
}

function removeTrait(key, label) { 
  if (S.traits[key]) { 
    S.traits[key] = false;
    if (!S.removed.includes(label)) S.removed.push(label); 
  } 
}

function traitName(k) {
  if(k === 'mrteam') return (teamNick(S.mrTeamName || '') || '') + '先生';
  if(k === 'legend') return (S.legendLeague || '') + '歷史級球星';
  if(k === 'rainbow') return (S.rainbowLg || '') + '七彩球衣';
  return TRAIT_N[k] || k; 
}

function traitTagStyle(k) {
  if(TRAIT_KEYS.neg.includes(k)) return 'background:#2a0f0f;border-color:#c0392b;color:#ff8b7a'; 
  if(k === 'legend' || k === 'taiwan') return 'background:#3a2c05;border-color:#ffc95c;color:#ffe08a'; 
  if(k === 'goldcloth') return 'background:#3a3505;border-color:#e8d43a;color:#fff35a'; 
  if(k === 'mrteam'){ const c = teamChip(TEAM_COLOR[S.mrTeamName] || '#ffc95c'); return 'background:'+c.bg+';border-color:'+c.bd+';color:'+c.fg; }
  if(k === 'genius') return 'background:#232733;border-color:#c8d0e0;color:#e8eef7'; 
  return ''; 
}

function renderTraits() { 
  const el = $('trait-tags'), box = $('trait-side'); 
  if(!el || !box) return;
  let h = '';
  if(S && S.traits) {
    const row = (style, name, fx) => `<div class="trow" title="${fx}"><span class="tag" style="${style}" title="${fx}">${name}</span><span class="td">${fx}</span></div>`;
    [...TRAIT_KEYS.pos, ...TRAIT_KEYS.neg].forEach(k => { 
      if(S.traits[k]) h += row(traitTagStyle(k), traitName(k), TRAIT_FX[k] || ''); 
    });
    (S.removed || []).forEach(l => h += `<div class="trow"><span class="tag" style="text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a">${l}</span><span class="td" style="opacity:.4">已解除</span></div>`);
  }
  el.innerHTML = h; box.classList.toggle('empty', !h); 
}

function divider(t) { 
  const log = $('log'); const blocks = log.querySelectorAll('.yr-block'); 
  const prev = blocks[blocks.length - 1]; 
  if(prev){ const h = prev.querySelector('.yr-head'); if(h && prev.querySelector('.yr-body').children.length) h.classList.add('has-body'); } 
  const prevPrev = blocks[blocks.length - 2]; if(prevPrev){ prevPrev.classList.add('collapsed'); } 
  const block = document.createElement('div'); block.className = 'yr-block'; 
  const head = document.createElement('div'); head.className = 'yr-head'; head.textContent = t; 
  const body = document.createElement('div'); body.className = 'yr-body'; 
  head.onclick = () => block.classList.toggle('collapsed'); 
  block.appendChild(head); block.appendChild(body); log.appendChild(block); _curYearBody = body; 
  const newBlocks = log.querySelectorAll('.yr-block'); 
  if(newBlocks.length > MAX_YEARS) { for(let i=0; i < newBlocks.length - MAX_YEARS; i++) newBlocks[i].remove(); } 
}

const salParts = w => w < 10000 ? {v: Math.round(w).toLocaleString(), u: '萬'} : {v: (Math.round(w/1000)/10).toFixed(1), u: '億'};

function board(phase) {
  renderTraits();
  $('bd-name').innerHTML = `${S.name}<small>#${S.jersey}</small>`;
  $('bd-role').textContent = `${S.dpos ? DPN[S.dpos] : POSN[S.pos]}${S.role ? '・' + (typeof roleN === 'function' ? roleN(S.role) : '') : ''}・${typeof playerType === 'function' ? playerType() : ''}${S.traits.genius ? ' ★' : ''}`;
  let t;
  if(S.stage === 'HS') t = S.team + '（高' + ['一','二','三'][S.stageYr-1] + '）';
  else if(S.stage === 'U') t = S.team + '（大' + ['一','二','三','四'][S.stageYr-1] + '）';
  else if(S.stage === 'AMA') t = S.team + '（業餘）';
  else t = typeof S.teamName === 'function' ? S.teamName() : S.team;

  const tc = (S.orgTeam && TEAM_COLOR[S.orgTeam]) || 'var(--amber)';
  const isWhite = (tc.toLowerCase() === '#ffffff' || tc.toLowerCase() === '#fff');
  const isProColored = (S.stage === 'PRO' && TEAM_COLOR[S.orgTeam]);
  const txtColor = isProColored ? (isWhite ? '#000000' : tc) : 'var(--amber)';
  const bgStyle = isProColored ? 'background:#ffffff; padding:2px 8px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.4);' : '';
  const dot = isProColored ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isWhite ? '#cccccc' : tc};margin-right:6px;vertical-align:middle;box-shadow:0 0 2px rgba(0,0,0,0.2);"></span>` : '';
  
  $('bd-team').innerHTML = dot + `<span style="color:${txtColor}; ${bgStyle} font-weight:900;">${t}</span>`;
  $('bd-age').textContent = S.age; $('bd-year').textContent = S.year;
  $('bd-ovr').textContent = typeof ovr === 'function' ? ovr() : 30; 
  if(S.pos === 'P'){ const el = $('bd-tj'); if(el) el.textContent = ''; }
  
  const sal = Math.round(S.salary), sp = salParts(sal), salEl = $('bd-sal'); 
  salEl.textContent = sp.v; salEl.style.fontSize = '';
  const lb = $('bd-sal-lbl'); if(lb) lb.textContent = `生涯薪(${sp.u})`;
  const tip = $('bd-sal-tip'); if(tip) tip.textContent = fmtMoney(sal) + ' 台幣'; 
  [0,1,2].forEach(i => $('lp'+i).classList.toggle('on', i === phase));
}

function actClear() { 
  const a = $('act'); a.innerHTML = ''; a.classList.remove('collapsed');
  const t = $('act-toggle'); if(t) t.style.display = 'none'; 
  ALLOC = null; allocFullClose(); const fb = $('af-body'); if(fb) fb.innerHTML = '';
  const s = $('act-side'); if(s) s.classList.remove('alloc'); 
}

function actToggleSync() {
  const a = $('act'), t = $('act-toggle'); if(!t) return;
  const has = a.innerHTML.trim() !== '' && a.style.display !== 'none';
  t.style.display = has ? 'block' : 'none';
  t.textContent = a.classList.contains('collapsed') ? '⌃ 展開選項' : '⌄ 收合選項';
}

function choose(title, opts) {
  actClear(); const a = $('act'); a.classList.remove('collapsed'); 
  if (title) a.innerHTML = `<div class="title">${title}</div>`;
  opts.forEach(o => { 
    const b = document.createElement('button');
    b.className = 'btn' + (o.main ? ' main' : '') + (o.warn ? ' warn' : '');
    b.innerHTML = o.t + (o.s ? `<small>${o.s}</small>` : '');
    b.onclick = () => { actClear(); o.f(); }; a.appendChild(b); 
  });
  actToggleSync(); scrollBottom();
}

let ALLOC = null;
function allocPlace() {
  if (!ALLOC) return;
  const a = $('act'), full = document.body.classList.contains('big-text') && isMobileLayout();
  const s = $('act-side'); if (s) s.classList.toggle('alloc', !full);
  if (full) {
    const fb = $('af-body'); fb.appendChild(ALLOC.top); fb.appendChild(ALLOC.rows); fb.appendChild(ALLOC.btm);
    const ft = $('af-title'); if (ft) ft.textContent = ALLOC.label;
    a.innerHTML = `<div class="title">${ALLOC.label}</div><div class="pool" id="al-cue"></div>`;
    const ob = document.createElement('button'); ob.className = 'btn main'; ob.id = 'al-open';
    ob.style.textAlign = 'center'; ob.textContent = '繼續分配 ▸'; ob.onclick = allocFullOpen; a.appendChild(ob); 
    allocFullOpen();
  } else {
    const frag = document.createDocumentFragment(); frag.appendChild(ALLOC.top); frag.appendChild(ALLOC.rows); frag.appendChild(ALLOC.btm);
    a.innerHTML = `<div class="title">${ALLOC.label}</div>`; a.appendChild(frag); allocFullClose();
  }
  ALLOC.render();
}

function allocUI(mode, label, done) {
  actClear(); const a = $('act'); const keys = POS_AB[S.pos];
  let dice = mode.dice ? mode.dice.slice() : null, pool = mode.pool || 0, idx = 0, hist = [];
  a.innerHTML = `<div class="title">${label}</div><div id="al-top"></div><div id="al-rows"></div><div class="row2" id="al-btm"></div>`;
  const touchedKeys = {}; const top = $('al-top'), rows = $('al-rows'), btm = $('al-btm');
  ALLOC = { top, rows, btm, label, render };
  function remaining() { return dice ? dice.length - idx : pool; }
  
  function render() {
    if (dice) { top.innerHTML = '<div id="dice">' + dice.map((v,i) => `<div class="die ${i < idx ? 'used' : ''} ${i === idx ? 'active' : ''} ${v === 6 ? 'six' : ''}">${v}</div>`).join('') + '</div>'; } 
    else { top.innerHTML = `<div class="pool">剩餘可分配點數：${pool} 點（點一下能力 +1）</div>`; }
    const cue = $('al-cue'); if (cue) cue.textContent = dice ? `剩餘 ${remaining()} 顆骰子未分配` : `剩餘 ${remaining()} 點未分配`;
    
    rows.innerHTML = '';
    keys.forEach(k => { 
      const v = S.ab[k], cap = v >= 80;
      const r = document.createElement('div'); r.className = 'abrow' + (cap ? ' capped' : '');
      const pk = (S.pot && S.pot[k]) || 62, cst = typeof abCost === 'function' ? abCost(k) : 1, cr = (S.carry && S.carry[k]) || 0;
      r.innerHTML = `<span class="nm">${ABL[k]}</span><span class="bar"><i style="width:${v/80*100}%"></i><em style="left:${pk/80*100}%"></em></span><span class="val" style="line-height:1.1">${v}<small style="opacity:.5">/${pk}</small>${cst > 1 ? `<span style="display:block;opacity:.5;font-size:10.5px;letter-spacing:1px;margin-top:-2px">${cr}/${cst}</span>` : ''}</span>`;
      
      if (!cap && remaining() > 0) {
        r.onclick = () => { 
          const amt = dice ? dice[idx] : 1; const pc = (S.carry && S.carry[k]) || 0;
          const got = typeof addAb === 'function' ? addAb(k, amt) : 0; touchedKeys[k] = (touchedKeys[k] || 0) + amt; hist.push([k, got, pc]); 
          if (dice) idx++; else pool--;
          r.querySelector('.val').innerHTML = `${S.ab[k]} <b style="display:block;font-size:10.5px">${got > 0 ? '+' + got : '蓄力中'}</b>`; 
          render(); board(0); 
        };
      }
      rows.appendChild(r); 
    });
    
    btm.innerHTML = '';
    const u = document.createElement('button'); u.className = 'btn'; u.style.textAlign = 'center';
    u.textContent = '↩ 復原'; u.disabled = !hist.length; u.style.opacity = hist.length ? '1' : '0.35'; u.style.cursor = hist.length ? 'pointer' : 'default';
    if (hist.length) {
      u.onclick = () => { const [k, got, pc] = hist.pop(); S.ab[k] -= got; if (S.carry) S.carry[k] = pc; if (dice) idx--; else pool++; render(); board(0); };
    }
    btm.appendChild(u);
    const allCap = keys.every(k => S.ab[k] >= 80);
    if (remaining() === 0 || allCap) { 
      const c = document.createElement('button'); c.className = 'btn main'; c.textContent = (remaining() > 0 && allCap) ? '能力已達上限，捨棄剩餘骰子 ▸' : '確認 ▸';
      c.onclick = () => { actClear(); if(typeof allocDone === 'function') allocDone(touchedKeys, dice ? true : false); done(); }; btm.appendChild(c); 
    }
    actToggleSync();
  }
  allocPlace();
  if (dice && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    top.querySelectorAll('#dice .die').forEach((el, i) => { 
      el.classList.add('rolling'); const iv = setInterval(() => { el.textContent = 1 + Math.floor(Math.random() * 6); }, 70); 
      setTimeout(() => { clearInterval(iv); el.classList.remove('rolling'); el.textContent = dice[i]; if (dice[i] === 6) el.classList.add('flash6'); }, 260 + i * 90); 
    });
  }
}

function applyTheme(t) {
  if(t !== 'a' && t !== 'b' && t !== 'c' && t !== 'd') t = 'a'; 
  document.body.dataset.theme = t;
  try { localStorage.setItem(THEME_KEY, t); } catch(e) {}
  document.querySelectorAll('#seg-theme button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); 
  updDispSum();
  const m = document.querySelector('meta[name="theme-color"]'); 
  if(m) m.setAttribute('content', (getComputedStyle(document.body).getPropertyValue('--bg') || '#081510').trim());
}

function modalOpen(html) { const m = $('modal'); if(!m) return; $('modal-box').innerHTML = html; m.classList.add('show'); }
function modalClose() { const m = $('modal'); if(m) m.classList.remove('show'); }

function applyMobileUI(on) {
  document.body.classList.toggle('mobile-ui', !!on); 
  try { localStorage.setItem('yakyu-mobile-ui', on ? '1' : '0'); } catch(e) {}
  document.querySelectorAll('#seg-ui button').forEach(b => b.classList.toggle('on', (b.dataset.u === '1') === !!on)); 
  updDispSum(); allocPlace(); 
}

const isMobileLayout = () => !(matchMedia('(min-width:921px)').matches && !document.body.classList.contains('mobile-ui'));

function applyBigText(on) {
  document.body.classList.toggle('big-text', !!on); 
  try { localStorage.setItem(BIG_KEY, on ? '1' : '0'); } catch(e) {}
  document.querySelectorAll('#seg-big button').forEach(b => b.classList.toggle('on', (b.dataset.b === '1') === !!on)); 
  updDispSum(); allocPlace();
}

function allocFullOpen() { const f = $('alloc-full'); if(f) f.classList.add('show'); }
function allocFullClose() { const f = $('alloc-full'); if(f) f.classList.remove('show'); }

function updDispSum() { 
  const el = document.getElementById('disp-sum'); if(!el) return;
  const parts = [THEME_NAMES[document.body.dataset.theme || 'a'], document.body.classList.contains('big-text') ? '大字' : '標準'];
  const ui = document.getElementById('fld-ui'); 
  if(ui && getComputedStyle(ui).display !== 'none') parts.push(document.body.classList.contains('mobile-ui') ? '手機版' : '電腦版');
  el.textContent = '\u3000' + parts.join(' · '); 
}

function menuModal() {
  const wide = matchMedia('(min-width:921px)').matches; const mob = document.body.classList.contains('mobile-ui'); const big = document.body.classList.contains('big-text');
  modalOpen(`<h3>選單</h3><button class="btn" id="md-theme" style="text-align:center">切換佈景主題</button><button class="btn" id="md-big" style="text-align:center">${big ? '切回標準字級' : '改用大字級'}</button>${wide ? `<button class="btn" id="md-ui" style="text-align:center">${mob ? '切回電腦版介面' : '改用手機版介面'}</button>` : ''}<button class="btn warn" id="md-restart0" style="text-align:center">重新開始</button><button class="btn" id="md-close" style="text-align:center;margin-top:14px">關閉</button>`);
  $('md-theme').onclick = themeModal; $('md-big').onclick = () => { applyBigText(!big); menuModal(); };
  const mu = $('md-ui'); if(mu) mu.onclick = () => { applyMobileUI(!mob); menuModal(); };
  $('md-restart0').onclick = restartModal; $('md-close').onclick = modalClose;
}

let _allowLeave = false;
function restartModal() {
  modalOpen(`<h3>重新開始</h3><p>確定要放棄這段人生，從頭開始嗎？</p><button class="btn warn" id="md-restart" style="text-align:center">放棄這段人生，重新開始</button><button class="btn" id="md-cancel" style="text-align:center">繼續目前的生涯</button>`);
  $('md-restart').onclick = () => { _allowLeave = true; location.href = location.pathname; }; $('md-cancel').onclick = menuModal;
}

window.addEventListener('beforeunload', function(ev) { 
  if(!S || S.done || _allowLeave) return; ev.preventDefault(); ev.returnValue = ''; 
});

function themeModal() {
  const cur = document.body.dataset.theme || 'a';
  modalOpen('<h3>佈景主題</h3>' + ['a','b','c','d'].map(t => `<button class="btn${t === cur ? ' main' : ''}" data-mt="${t}" style="text-align:center">${THEME_NAMES[t]}${t === cur ? ' ✓' : ''}</button>`).join('') + `<button class="btn" id="md-back" style="text-align:center;margin-top:14px">返回選單</button>`);
  $('modal-box').querySelectorAll('[data-mt]').forEach(b => b.onclick = () => { applyTheme(b.dataset.mt); themeModal(); });
  $('md-back').onclick = menuModal;
}
