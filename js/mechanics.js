// ==================== 數值運算、守備、傷病與賽季模擬引擎 ====================

function careerAllStars() { 
    let n = 0; 
    ['CPBL','NPB','MLB'].forEach(b => { if(S.stats[b]) n += (S.stats[b].AS || 0); }); 
    return n; 
}

function toolGap() { 
    const a = S.ab;
    const hit = Math.max(a.pow, a.con); 
    const run = a.spd; 
    const def = S.pos === 'C' ? (a.rng + a.fld + a.arm + a.cat) / 4 : (a.rng + a.fld + a.arm) / 3;
    const dims = [['hit', hit, '代打'], ['run', run, '代跑'], ['def', def, '代守']]; 
    dims.sort((x,y) => y[1] - x[1]);
    const topDim = dims[0], secDim = dims[1]; 
    const gap = topDim[1] - secDim[1]; 
    const role = topDim[2];
    return {gap, role, val: topDim[1], dim: topDim[0]}; 
}

function abCost(k) {
    const cur = S.ab[k], pk = (S.pot && S.pot[k]) || 62, isP = (S.pos === 'P' || S.pos === 'TW');
    let c = isP ? (cur >= 66 ? 7 : cur >= 58 ? 4 : cur >= 50 ? 2 : 1) : (cur >= 72 ? 3 : cur >= 64 ? 2 : 1);
    if(cur >= pk) c *= isP ? 4 : 3; 
    return c;
}

function addAb(k, v) { 
    if(!(k in S.ab)) return 0; 
    const o = S.ab[k];
    S.lastOverflow = 0;
    if(v < 0) { S.ab[k] = clamp(o + v, 1, 80); return S.ab[k] - o; }
    
    if(!S.carry) S.carry = {};
    let cur = o, bud = v + (S.carry[k] || 0);
    const pk = (S && S.pot && S.pot[k]) || 62;
    const isP = S && (S.pos === 'P' || S.pos === 'TW');
    
    while(bud > 0 && cur < 80) {
        let cost = isP ? (cur >= 66 ? 7 : cur >= 58 ? 4 : cur >= 50 ? 2 : 1) : (cur >= 72 ? 3 : cur >= 64 ? 2 : 1);
        if(cur >= pk) cost *= isP ? 4 : 3;
        if(bud >= cost) { bud -= cost; cur++; } 
        else break; 
    }
    
    if(cur >= 80) S.lastOverflow = bud;
    S.carry[k] = cur >= 80 ? 0 : bud;
    S.ab[k] = cur; 
    return cur - o; 
}

function ovr() {
    const a = S.ab;
    if(S.pos === 'P' || S.pos === 'TW') { 
        const arr = [a.vel, a.ctl, a.brk].sort((x,y) => y - x); 
        return Math.round(arr[0]*0.42 + arr[1]*0.30 + arr[2]*0.18 + a.sta*0.10); 
    }
    const off = [a.con, a.pow, a.eye, a.spd].sort((x,y) => y - x); 
    const offv = off[0]*0.38 + off[1]*0.27 + off[2]*0.20 + off[3]*0.15;
    const dpForOvr = S.dpos || (S.pos === 'C' ? 'C' : (S.pos === 'OF' ? 'CF' : 'SS'));
    const def = S.dpos === 'DH' ? (dpScore('1B') - 12) : dpScore(dpForOvr);
    const dw = S.dpos ? ({SS:0.30, CF:0.30, C:0.30, '2B':0.22, '3B':0.22, RF:0.20, '1B':0.12, LF:0.14, DH:0.12})[S.dpos] ?? 0.22 : 0.24;
    let v = Math.round(offv * (1 - dw) + def * dw); 
    if(S.traits.yips) v -= 3; 
    return v;
}

function playerType() {
    const a = S.ab;
    if(S.traits.onetool && S.toolRole) return S.toolRole + '工具人';
    if(S.pos === 'P' || S.pos === 'TW') {
        const m = Math.max(a.vel, a.ctl, a.brk);
        if(m < 52) return '潛力股';
        if(a.sta >= m && a.sta >= 62) return '工作馬';
        if(m === a.vel) return '火球男'; 
        if(m === a.brk) return '變化球藝師'; 
        return '控球大師';
    }
    if(S.pos === 'C') { 
        const rest = Math.max(a.con, a.pow, a.spd, a.eye, a.rng, a.fld, a.arm); 
        if(a.cat >= 58 && rest <= a.cat - 8) return '配球皇帝'; 
    }
    const dv = S.pos === 'C' ? (a.rng + a.fld + a.cat) / 3 : (a.rng + a.fld + a.arm) / 3;
    const cand = [['巨炮型', a.pow], ['安打製造機', a.con], ['選球大師', a.eye], ['飛毛腿', a.spd], ['守備至上', dv]];
    cand.sort((x,y) => y[1] - x[1]);
    if(cand[0][1] < 52) return '潛力股';
    if(cand[0][1] - cand[1][1] <= 3 && cand[0][1] >= 60) return '全能型';
    return cand[0][0];
}

// ==================== 守備光譜系統 ====================
function dpScore(p) { 
    const a = S.ab;
    switch(p) {
        case 'SS': return a.rng*0.5 + a.fld*0.3 + a.arm*0.2;
        case '2B': return a.rng*0.45+ a.fld*0.4 + a.arm*0.15;
        case '3B': return a.arm*0.45+ a.fld*0.35+ a.rng*0.2;
        case 'CF': return a.rng*0.55+ a.fld*0.3 + a.arm*0.15;
        case 'RF': return a.arm*0.45+ a.rng*0.35+ a.fld*0.2;
        case 'LF': return a.rng*0.4 + a.fld*0.35+ a.arm*0.25;
        case 'C':  return a.fld*0.4 + a.cat*0.4 + a.arm*0.2;
        case '1B': return a.fld*0.6 + a.rng*0.2 + a.arm*0.2;
        default: return 99;
    }
}

function dpBar() { 
    const base = DP_BAR[S.lv] || 0; 
    const disc = S.age <= 21 ? 7 : S.age <= 24 ? 5 : S.age <= 26 ? 2 : 0; 
    return base - disc; 
}

function dpQual(p) { 
    if(p === 'DH') return true; 
    if(!DP_TH[p] || !DP_TH[p][S.lv]) return true; 
    const youthAdj = S.age < 24 ? -3 : S.age < 26 ? -1.5 : 0; 
    return dpScore(p) >= DP_TH[p][S.lv] + youthAdj; 
}

function dpList() { 
    const order = S.pos === 'IF' ? ['SS','2B','3B','1B'] : ['CF','RF','LF','1B']; 
    const q = order.filter(dpQual); 
    q.push('DH'); 
    return q; 
}

function dpMult() { 
    return (S.pos !== 'P' && S.pos !== 'TW' && S.dpos) ? (DP_MULT[S.dpos] || 1) : 1; 
}

function dposReview(cont) {
    if(S.stage !== 'PRO' || !(S.lv === 'CPBL1' || S.lv === 'NPB1' || S.lv === 'MLB')) { cont(); return; }
    if(S.pos === 'C') {
        if(!S.dpos) S.dpos = 'C';
        const cOk = () => { const bar = dpBar(), a = S.ab; return a.fld >= bar - 6 && a.cat >= bar - 4 && a.arm >= bar - 2; };
        if(S.dpos === 'C') {
            if(cOk()) { cont(); return; }
            const opts = [];
            if(dpQual('1B')) opts.push({t:'移防 一壘手', main:true, s:'薪資係數 ×1.00', f:()=>{S.dpos = '1B'; card('info','守位調整','捕手裝備收進置物櫃——新球季改守<b class="hl">一壘</b>。'); cont();}});
            opts.push({t:'轉任 指定打擊', main:!opts.length, s:'薪資係數 ×0.92', f:()=>{S.dpos = 'DH'; card('info','守位調整','阻殺率成了聯盟笑話，球團決定讓你專心打擊——<b class="hl">DH</b>。'); cont();}});
            choose(`守位會議：教練團已經不敢讓你蹲捕（${LV[S.lv].n}標準）`, opts); return;
        }
        if(cOk()) {
            choose('守位會議：牛棚捕手回報你的接捕又行了', [
                {t:'重披捕手裝備', main:true, s:'薪資係數 ×1.12', f:()=>{S.dpos = 'C'; card('good','守位調整','面罩戴回來——新球季重新登錄為<b class="hl">捕手</b>。'); cont();}},
                {t:'維持現狀', f:()=>cont()}
            ]); return; 
        }
        if(S.dpos === '1B' && !dpQual('1B')) { S.dpos = 'DH'; card('info','守位調整','連一壘都站不住了，新球季登錄為<b class="hl">指定打擊</b>。'); }
        cont(); return; 
    }
    if(S.pos === 'P' || S.pos === 'TW') {
        const nr = pitcherRole(), old = S.role;
        if((old === 'MR' || old === 'CL') && nr === 'SP') {
            choose('球團徵詢：你的體力已達先發水準，要轉任先發嗎？', [
                {t:'轉任先發，扛起輪值', main:true, f:()=>{ S.role = 'SP'; card('info','定位調整',`你點頭接下先發任務。新球季起，你是輪值的一員——<b class="hl">先發</b>。`); cont(); }},
                {t:'留在牛棚，守住我的位置', s:'維持'+roleN(old)+'定位', f:()=>{ S.role = old; card('info','留守牛棚',`你婉拒了教練團的提議。`); cont(); }}
            ]);
            return;
        }
        S.role = nr;
        if(old && old !== nr) { card('info','定位調整',`球團季末評估你的體力狀況，新球季將你的角色調整為 <b class="hl">${roleN(nr)}</b>。`); }
        else if(!old) { card('info','投手定位',`教練團評估你的體力，將你登錄為 <b class="hl">${roleN(nr)}</b>。`); }
        cont(); return;
    }
    const q = dpList();
    if(!S.dpos) { S.dpos = q[0]; card('info','守位登錄',`教練團評估守備工具後，將你登錄為 <b class="hl">${DPN[S.dpos]}</b>。`); cont(); return; }
    if(dpQual(S.dpos)) {
        const best = q[0];
        if(DP_RANK[best] < DP_RANK[S.dpos]) {
            choose(`守位會議：教練團想把你推上更吃重的位置`, [
                {t:`升防 ${DPN[best]}`, main:true, s:`薪資係數 ×${(DP_MULT[best]||1).toFixed(2)}`, f:()=>{S.dpos = best; card('good','守位調整',`守備數據說服了所有人——新球季改守 <b class="hl">${DPN[best]}</b>。`); cont();}},
                {t:`留守 ${DPN[S.dpos]}`, f:()=>cont()}
            ]); return; 
        }
        cont(); return; 
    }
    const opts = q.slice(0,2).map((p,i)=>({t:`移防 ${DPN[p]}`, main:i===0, s:p==='DH'?'守備已無處可站｜薪資係數 ×0.92':`薪資係數 ×${(DP_MULT[p]||1).toFixed(2)}`, f:()=>{ S.dpos = p; card('info','守位調整',`球團季末評估後，新球季改守 <b class="hl">${DPN[p]}</b>。`); cont(); }}));
    choose(`守位會議：教練團認為你的守備已撐不住 ${DPN[S.dpos]}（${LV[S.lv].n}標準）`, opts);
}

// ==================== 傷病與 TJ 手術 ====================
function injuryProb() {
    let p = 15 + S.injNext;
    if(S.age >= 35) p += 12; else if(S.age >= 32) p += 6;
    if(S.traits.academy && S.age < 25) p -= 5;
    if(S.traits.iron && S.traits.glass) p = 25; 
    else if(S.traits.iron) p = Math.min(p, 10); 
    else if(S.traits.glass) p = Math.max(p, 40);
    p += (S.tmpInj || 0); 
    return clamp(p, 3, 95);
}

function rollInjury() {
    const p = injuryProb();
    if(!chance(p)) { card('info', '健康回報', `本季平安出賽。（受傷機率 ${p}%）`); S.injNext = 0; return; }
    
    S.injNext = 0;
    if(chance(64)) {
        const cut = ri(20,45); S.seasonFactor = 1 - cut/100; S.ironStreak = 0;
        card('bad', '小傷', `肌肉拉傷進了傷兵名單，本季出賽量預估減少 <b class="dn">${cut}%</b>。${injStatLoss(false)}`);
    } else {
        const played = ri(5, 45); 
        S.seasonFactor = played / 100; 
        S.bigInj++; S.ironStreak = 0;
        let txt = `重大傷勢——進手術室了。<b class="dn">賽季提前報銷</b>（本季留下 ${played}% 的出賽紀錄）。`;
        if(chance(20)) { S.rehab = 1; txt += `醫生搖搖頭：<b class="dn">明年也很難趕上開季</b>（明年整季報廢）。`; }
        card('bad', '大傷', txt + injStatLoss(true));
        
        if(S.bigInj >= 2 && !S.traits.glass && S.age < 32) { 
            S.traits.glass = true; 
            card('bad', '隱藏素質解鎖：玻璃人', '生涯第二次大傷。從此傷病如影隨形，未來每季受傷機率<b class="dn">不低於 40%</b>。'); 
        }
        else if(S.bigInj >= 2 && !S.traits.glass && S.age >= 32) { 
            card('info', '醫療團隊評估', '「這是歲月的損耗，不是體質問題。」——老將的傷,球團看得比誰都開。'); 
        }
    }
}

function injStatLoss(big) {
    if(big) { 
        POS_AB[S.pos].forEach(k => { S.ab[k] = clamp(S.ab[k]-5, 1, 80); }); board(1); 
        return `重大傷勢重創身體素質：<b class="dn">全能力 −5</b>。`; 
    }
    if(!chance(40)) return '';
    const keys = POS_AB[S.pos]; 
    let k = pick(keys); 
    if(!(k in S.ab)) k = pick(keys); 
    const amt = ri(1,2); 
    S.ab[k] = clamp(S.ab[k]-amt, 1, 80); board(1); 
    return `傷勢留下後遺症：<b class="dn">${ABL[k]} −${amt}</b>。`;
}

function tjAccrue() {
    if((S.pos !== 'P' && S.pos !== 'TW') || S.seasonFactor <= 0) return;
    const mult = {'全力投':1.25, '普通投':1.0, '養生球':0.65}[S.effort] || 1.0;
    const base = (S.ab.vel + S.ab.brk) / 19 * mult * (S.tjCount >= 1 ? 1.15 : 1); 
    S.tj += base;
}

function tjCap() { return S.traits.rubber ? 100 : 50; }

function tjTwoStrike() { 
    S.ab.vel = clamp(Math.round(S.ab.vel/2), 1, 80); 
    S.ab.brk = clamp(Math.round(S.ab.brk/2), 1, 80); 
    card('bad', '兩度動刀的代價', '第二次進手術室——韌帶再也不是原廠的了。球速與變化球<b class="dn">直接砍半</b>。'); 
}

function tjBigInjury(cont) {
    S.tjCount++; S.rehab = 1; S.tj = 0;
    if(chance(5)) { 
        S.ab.vel = 10; S.ab.brk = 10; S.pot.vel = 20; S.pot.brk = 20;
        card('bad', '最壞的結果', `針扎下去的瞬間，肩膀傳來從未有過的撕裂感。醫生的臉色說明了一切——<b class="dn">肩膀報廢，球速與變化球歸零剩 10，潛力上限砍到 20</b>。你的投手生涯，大概到這裡了。`);
        board(1); afterGamble('fail', cont); return; 
    }
    const gv = ri(3,10), gb = ri(3,10);
    const netV = gv - 5; const netB = gb - 5;
    S.ab.vel = clamp(S.ab.vel + netV, 1, 80);
    S.ab.brk = clamp(S.ab.brk + netB, 1, 80);

    if(S.tjCount >= 2) tjTwoStrike();
    board(1);

    const vStr = netV > 0 ? `<b class="up">+${netV}</b>` : netV < 0 ? `<b class="dn">${netV}</b>` : `<b>0</b>`;
    const bStr = netB > 0 ? `<b class="up">+${netB}</b>` : netB < 0 ? `<b class="dn">${netB}</b>` : `<b>0</b>`;
    card('bad', 'TJ 大傷', `硬撐的代價來了——韌帶當場斷裂。隔年<b class="dn">全年報銷</b>。經歷了漫長的手術與復健（斷裂 −5 加上手術回春），最終你的球速 ${vStr}、變化球 ${bStr}。就算滿血回歸，也真的只是勉強打平。`);
    afterGamble('fail', cont);
}

function tjGamble(cont) {
    if((S.pos !== 'P' && S.pos !== 'TW') || S.tj < tjCap()) { cont(); return; }
    addAb('vel', -5); addAb('brk', -5); board(1);
    card('bad', '手肘拉起警報', `累積的負荷讓韌帶發出哀鳴——球速、變化球各 <b class="dn">−5</b>。醫療團隊把兩個選項攤在你面前。`);
    const succP = S.traits.rubber ? 85 : 55;
    choose('TJ 抉擇：你的手肘撐到極限了', [
        {t:'動 Tommy John 手術', main:true, s:'報銷一整年，回來球速/變化球回春（各 +3~+10）', f:()=>{
            S.tj = 0; S.tjCount++; S.rehab = 1;
            const gv = ri(3,10), gb = ri(3,10); addAb('vel', gv); addAb('brk', gb);
            if(S.tjCount >= 2) { tjTwoStrike(); }
            board(1);
            card('gold', '手術成功', `手術很順利。漫長復健後，你的球威煥然一新——球速 <b class="up">+${gv}</b>、變化球 <b class="up">+${gb}</b>。（本季報銷）`);
            afterGamble('surgery', cont); 
        }},
        {t:'打針硬撐這一季', warn:true, s:`成功率 ${succP}%｜失敗＝TJ 大傷（隔年報銷、能力再崩）`, f:()=>{
            if(chance(succP)) { 
                S.tj = Math.max(0, S.tj - 20); addAb('vel', 5); addAb('brk', 5); board(1);
                card('good', '險過一關', `封閉針撐住了，你咬牙投完球季——量表 <b class="hl">−20</b>，球速、變化球各 <b class="up">+5</b>。但這是在跟時間借命。`);
                afterGamble('inject', cont); 
            } else { tjBigInjury(cont); } 
        }}
    ]);
}

function afterGamble(kind, cont) {
    if(kind === 'inject') { 
        S.tjSuccess++;
        if(S.tjSuccess >= 2 && !S.traits.rubber) { 
            S.traits.rubber = true;
            card('gold', '隱藏屬性解鎖：橡膠手臂', '連續兩次靠打針硬撐挺過手肘危機、完全不進手術室——你的韌帶像橡膠一樣柔韌。<b class="hl">TJ 量表上限翻倍、打針成功率翻倍</b>。'); board(1); 
        } 
    } else if(kind === 'surgery') { 
        S.tjSuccess = 0; 
        if(S.traits.rubber) { 
            removeTrait('rubber', '橡膠手臂');
            card('bad', '橡膠不再', '終究還是進了手術室——那雙被稱為橡膠的手臂，也有極限。<b class="dn">橡膠手臂失效</b>。'); board(1); 
        } 
    } else { S.tjSuccess = 0; }
    cont();
}

function pitcherRole() {
    if(S.ab.sta >= 52) return 'SP'; 
    const pd = (S.prevD !== undefined ? S.prevD : (S.lastD || 0));
    const d = (S.role && S.role !== 'SP') ? pd : -99; 
    if(S.role === 'CL') return d >= 1 ? 'CL' : 'MR'; 
    return d >= 3 ? 'CL' : 'MR';
}

function fmtIP(ip) { 
    if(ip == null) return '0.0'; 
    const whole = Math.floor(ip); 
    const frac = ip - whole; 
    const outs = Math.round(frac * 3); 
    if(outs >= 3) return (whole + 1) + '.0'; 
    return whole + '.' + outs; 
}

function roleN(r) { return {SP:'先發', MR:'中繼', CL:'終結者'}[r] || '—'; }
function isSP() { return S.role === 'SP'; }

// ==================== 賽季模擬引擎 ====================
function simSeason(lv) {
    if (S.pos === 'TW') {
        S.pos = 'P'; S.role = 'SP'; 
        const stP = simSeason(lv);
        S.pos = 'OF'; S.dpos = 'DH'; 
        const stB = simSeason(lv);
        S.pos = 'TW'; S.dpos = null;
        stB.pitch = stP; stB.isTW = true; stB.d = (stP.d + stB.d) / 2; 
        return stB;
    }

    if(S.pos === 'P' && !S.role) S.role = pitcherRole();
    
    const L = LV[lv], par = L.par, a = S.ab, f = S.seasonFactor;
    const st = {G:0, PA:0, AB:0, H:0, HR:0, RBI:0, SB:0, BB:0, W:0, L:0, SV:0, IP:0, SO:0, ER:0, avg:0, era:0, d:0, WAR:0};
    
    if(f <= 0) return st;
    
    if(S.pos === 'P'){
        const q = (a.vel + a.ctl + a.brk) / 3, d = q - par; 
        st.d = d;
        const perfF = clamp(0.80 + d * 0.028, 0.42, 1.12);
        
        if(isSP()){
            const gs = Math.round(clamp(20 + (a.sta - 40) * 0.18, 10, 30) * f * perfF * (0.94 + R() * 0.08)); 
            st.G = Math.max(1, gs);
            const ipg = clamp(5.0 + d * 0.05 + (a.sta - 50) * 0.012 + (a.ctl - par) * 0.006 + N0(0.12), 4.8, 6.5); 
            st.IP = +(st.G * ipg).toFixed(1);
        } else {
            st.G = Math.max(1, Math.round(clamp(45 + (Math.min(a.sta, 60) - 40) * 0.3, 25, 68) * f * perfF * (0.94 + R() * 0.08))); 
            st.IP = +(st.G * 1.05).toFixed(1);
        }
        
        st.era = clamp(4.32 - d * 0.17 + N0(0.35), 1.40, 9.90);
        st.ER = Math.round(st.era * st.IP / 9);
        
        const lgERA = 4.32;
        st.eraPlus = st.era > 0 ? Math.round((lgERA / st.era) * 100) : 0;
        let pWar = ((lgERA - st.era) / 9) * st.IP / 10 + (st.IP / (isSP() ? 150 : 60) * (isSP() ? 1.2 : 0.8));
        st.WAR = +(pWar).toFixed(1);

        const k9 = clamp(6.2 + (a.vel - par) * 0.11 + (a.brk - par) * 0.06 + N0(0.5), 3.5, 13.5); 
        st.SO = Math.round(st.IP / 9 * k9);
        const bb9 = clamp(4.6 - (a.ctl - par) * 0.13 + N0(0.4), 1.2, 7.5); 
        st.BB = Math.round(st.IP / 9 * bb9);
        const h9 = clamp(9.2 - d * 0.16 + N0(0.5), 5.0, 13.5); 
        st.H = Math.round(st.IP / 9 * h9);
        st.WHIP = st.IP > 0 ? +((st.H + st.BB) / st.IP).toFixed(2) : 0;
        
        if(isSP()){ 
            const dec = Math.round(st.G * 0.72), wp = clamp(0.50 + d * 0.014 + N0(0.05), 0.15, 0.85); 
            st.W = Math.round(dec * wp); 
            st.L = dec - st.W; 
        } else if(S.role === 'CL'){ 
            const svRate = clamp(0.55 + d * 0.02, 0.35, 0.82); 
            st.SV = Math.min(st.G, Math.round(st.G * svRate)); 
            st.HLD = Math.min(Math.max(0, st.G - st.SV), Math.round(st.G * 0.12)); 
            const dec = Math.max(1, Math.round(st.G * 0.14)); 
            st.W = Math.round(dec * clamp(0.45 + d * 0.02, 0.3, 0.7)); 
            st.L = Math.max(0, dec - st.W); 
        } else { 
            const hldRate = clamp(0.45 + d * 0.02, 0.25, 0.72); 
            st.HLD = Math.min(st.G, Math.round(st.G * hldRate)); 
            st.SV = Math.min(Math.max(0, st.G - st.HLD), chance(25) ? ri(1, 5) : 0); 
            const dec = Math.max(1, Math.round(st.G * 0.14)); 
            st.W = Math.round(dec * clamp(0.5 + d * 0.015, 0.35, 0.7)); 
            st.L = Math.max(0, dec - st.W); 
        }
        
        if(!isSP()){ 
            st.SV = Math.min(st.SV || 0, Math.floor(st.G * 0.85)); 
            st.HLD = Math.min(st.HLD || 0, Math.max(0, st.G - st.SV)); 
            const decCap = Math.max(0, st.G - st.SV - st.HLD); 
            if((st.W + st.L) > decCap){ st.W = Math.min(st.W, decCap); st.L = Math.max(0, decCap - st.W); } 
        }
    } else {
        const q = a.con * 0.5 + a.pow * 0.2 + a.eye * 0.18 + a.spd * 0.12, d = q - par - 0.5; 
        st.d = d;
        let staF;
        if(a.sta >= 55) staF = 1.0; 
        else if(a.sta >= 50) staF = 0.90 + (a.sta - 50) * 0.02; 
        else if(a.sta >= 45) staF = 0.72 + (a.sta - 45) * 0.036; 
        else if(a.sta >= 40) staF = 0.52 + (a.sta - 40) * 0.04; 
        else if(a.sta >= 35) staF = 0.35 + (a.sta - 35) * 0.034; 
        else staF = Math.max(0.15, 0.35 - (35 - a.sta) * 0.03);
        
        let dhThisYear = false; 
        if(d >= 10 && staF < 0.75 && S.dpos !== 'DH' && S.dpos !== 'C'){ 
            staF = Math.max(staF, 0.9); dhThisYear = true; 
        }
        
        const perfF = clamp(0.82 + d * 0.03, 0.45, 1.12); 
        st.G = Math.min(L.g, Math.round(L.g * clamp(staF * perfF, 0.10, 1.0) * f * (0.95 + R() * 0.06)));
        st.PA = Math.round(st.G * 4.25); 
        st._dh = dhThisYear; 
        st.BB = Math.round(st.PA * clamp(0.062 + (a.eye - par) * 0.0034, 0.045, 0.17)); 
        st.AB = st.PA - st.BB;
        
        st.avg = clamp(0.252 + d * 0.0058 + (a.sta - 50) * 0.0003 + (a.spd - par) * 0.0006 + N0(0.014), 0.140, 0.380); 
        st.H = Math.round(st.AB * st.avg); 
        st.avg = st.AB ? st.H / st.AB : 0;
        
        st.HR = Math.round(st.AB * clamp(0.010 + (a.pow - par) * 0.0022, 0.001, 0.075) * (0.85 + R() * 0.3)); 
        st.SB = Math.round(clamp((a.spd - 45) * 0.5 + (a.spd - par) * 1.3 + N0(4), 0, 70) * f); 
        st.RBI = Math.round(st.HR * 2.1 + (st.H - st.HR) * 0.30); 
        st.DEF = defRuns(lv);
        
        const obpN = st.PA > 0 ? (st.H + st.BB) / st.PA : 0;
        const slgN = slgOf(st);
        st.ops = +(obpN + slgN).toFixed(3);
        const lgOPS = 0.720;
        st.opsPlus = st.ops > 0 ? Math.round((st.ops / lgOPS) * 100) : 0;
        let bWar = ((st.ops - lgOPS) / 0.1) * (st.PA / 600) * 1.5 + (st.DEF / 10) + (st.PA / 600 * 1.5);
        if(st._dh) bWar -= (st.PA / 600 * 1.0);
        st.WAR = +(bWar).toFixed(1);
    }
    
    applySeasonForm(st, lv);
    return st;
}

function applySeasonForm(st, lv) {
    if(S.seasonFactor <= 0) return;
    st.form = 0; 
    const roll = R(); 
    const canCareer = S.seasonFactor >= 0.9; 
    let m = 1;
    
    if(roll < 0.10) { st.form = -1; m = 0.65; } 
    else if(canCareer && roll < 0.20) { st.form = 1; m = 1.20; }
    
    if(m === 1) return;
    
    if(S.pos === 'P') {
        st.SO = Math.round(st.SO * m); 
        st.W = Math.round(st.W * m); 
        if(st.L != null) st.L = Math.max(0, Math.round(st.L / (m || 1)));
        st.H = Math.max(0, Math.round(st.H / m)); 
        st.ER = Math.max(0, Math.round(st.ER / m)); 
        st.era = st.IP > 0 ? +(st.ER * 9 / st.IP).toFixed(2) : st.era; 
        st.WHIP = st.IP > 0 ? +((st.H + st.BB) / st.IP).toFixed(2) : st.WHIP;
        if(st.SV) st.SV = Math.min(st.G, Math.round(st.SV * m)); 
        if(st.HLD) st.HLD = Math.min(Math.max(0, st.G - (st.SV || 0)), Math.round(st.HLD * m));
        
        if(!isSP()) { 
            st.SV = Math.min(st.SV || 0, Math.floor(st.G * 0.85)); 
            st.HLD = Math.min(st.HLD || 0, Math.max(0, st.G - st.SV)); 
            const decCap = Math.max(0, st.G - st.SV - st.HLD); 
            if((st.W + st.L) > decCap) { st.W = Math.min(st.W, decCap); st.L = Math.max(0, decCap - st.W); } 
        }
    } else {
        st.H = Math.round(st.H * m); 
        st.HR = Math.round(st.HR * m); 
        st.SB = Math.round(st.SB * m); 
        if(st.H > st.AB) st.H = st.AB; 
        st.avg = st.AB ? st.H / st.AB : 0; 
        st.RBI = Math.round(st.HR * 2.1 + (st.H - st.HR) * 0.30);
    }
    st.d += st.form === 1 ? 4 : st.form === -1 ? -4 : 0;
}

function defRuns(lv) {
    if(S.pos === 'P') return 0; 
    const a = S.ab, par = LV[lv].par; 
    const dp = S.dpos || (S.pos === 'C' ? 'C' : '2B'); 
    if(dp === 'DH') return 0;
    const posW = {SS:1.25, CF:1.20, C:1.15, '2B':1.05, '3B':1.00, RF:0.95, '1B':0.75, LF:0.80}[dp] || 1;
    const skill = dp === 'C' ? (a.fld * 0.4 + a.arm * 0.3 + a.cat * 0.3) : (a.rng * 0.45 + a.fld * 0.40 + a.arm * 0.15);
    return Math.round((skill - par) * posW * 0.55 * (S.seasonFactor || 1));
}

function portionOf(st, r) {
    const p = {...st}; 
    ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','SO','ER'].forEach(k => p[k] = Math.round(st[k] * r));
    p.IP = +(st.IP * r).toFixed(1); 
    p.avg = p.AB > 0 ? p.H / p.AB : 0; 
    p.era = p.IP > 0 ? p.ER * 9 / p.IP : 0; 
    return p;
}

function accStat(bucket, st) {
    if(!S.stats[bucket]) S.stats[bucket] = blankStat();
    const t = S.stats[bucket];
    t.WAR = +( (t.WAR || 0) + (st.WAR || 0) ).toFixed(1);
    
    if (st.isTW) {
        t.yr++;
        if(bucket !== 'MINOR' && S.orgTeam) { 
            const tb = S.teamTally[bucket] || (S.teamTally[bucket] = {}); 
            tb[S.orgTeam] = (tb[S.orgTeam] || 0) + 1; 
        }
        ['PA','AB','H','HR','RBI','SB','BB'].forEach(k => t[k] += (st[k] || 0)); 
        t.DEF += (st.DEF || 0);
        
        if(!t.pitchStats) t.pitchStats = blankStat();
        ['G','W','L','SV','HLD','SO','ER','H','BB'].forEach(k => t.pitchStats[k] += (st.pitch[k] || 0));
        t.pitchStats.IP = +(t.pitchStats.IP + st.pitch.IP).toFixed(1);
        t.pitchStats.WAR = +( (t.pitchStats.WAR || 0) + (st.pitch.WAR || 0) ).toFixed(1);
        t.G += Math.max(st.G || 0, st.pitch.G || 0);
        return;
    }
    
    t.yr++;
    if(bucket !== 'MINOR' && S.orgTeam) { 
        const tb = S.teamTally[bucket] || (S.teamTally[bucket] = {}); 
        tb[S.orgTeam] = (tb[S.orgTeam] || 0) + 1; 
    }
    if(S.pos !== 'P'){ 
        const dp = (st && st._dh) ? 'DH' : (S.dpos || '—'); 
        S.dposYears[dp] = (S.dposYears[dp] || 0) + 1; 
    } else if(S.role) { 
        S.roleYears[S.role] = (S.roleYears[S.role] || 0) + 1; 
    }
    
    ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','HLD','SO','ER'].forEach(k => t[k] += (st[k] || 0));
    t.DEF += (st.DEF || 0); 
    t.IP = +(t.IP + st.IP).toFixed(1);
}

function slgOf(st) {
    if(!st.AB) return 0; 
    const hr = st.HR, nonHR = Math.max(0, st.H - hr);
    const doubles = Math.round(nonHR * 0.22), triples = Math.round(nonHR * 0.03); 
    const singles = Math.max(0, nonHR - doubles - triples);
    const tb = singles + doubles * 2 + triples * 3 + hr * 4; 
    return tb / st.AB;
}

function statLine(st) {
    if (st.isTW) { 
        return `<div style="color:var(--amber);font-size:11px">【打擊】</div>${statLine({...st, isTW:false, _type:'B'})}<div style="color:var(--amber);font-size:11px;margin-top:4px">【投球】</div>${statLine({...st.pitch, _type:'P'})}`; 
    }
    
    if(S.pos === 'P' || st._type === 'P') { 
        const role = roleN(S.role); 
        const relief = (S.role === 'CL' && st.SV) ? `｜${st.SV}救援` : (S.role === 'MR' && st.HLD) ? `｜${st.HLD}中繼` : ''; 
        return `出賽 ${st.G}｜局數 ${fmtIP(st.IP)}｜${st.W}勝${st.L}敗${relief}｜三振 ${st.SO}｜ERA ${st.era.toFixed(2)}｜ERA+ ${st.eraPlus || 0}｜WAR ${(st.WAR || 0).toFixed(1)}`; 
    }
    
    const obpN = st.PA > 0 ? (st.H + st.BB) / st.PA : 0; 
    const slgN = slgOf(st);
    const ops = st.AB > 0 ? (obpN + slgN).toFixed(3).replace(/^0/, '') : '-';
    
    return `出賽 ${st.G}｜打席 ${st.PA}｜打擊率 ${st.avg.toFixed(3).replace(/^0/, '')}｜OPS ${ops}｜OPS+ ${st.opsPlus || 0}｜安打 ${st.H}｜全壘打 ${st.HR}｜盜壘 ${st.SB}${st.DEF !== undefined ? `｜守備 ${st.DEF > 0 ? '+' : ''}${st.DEF}` : ''}｜WAR ${(st.WAR || 0).toFixed(1)}`;
}

function salaryFor(lv, d) {
    switch(lv) {
        case 'CPBL2': return 84; 
        case 'NPB2': return 240; 
        case 'R': return 60; 
        case 'A1': return 95; 
        case 'A2': return 135; 
        case 'A3': return 270;
        case 'CPBL1': return Math.round(300 + clamp(d, 0, 25) * 120); 
        case 'NPB1': return Math.round(1600 + clamp(d, 0, 26) * 560); 
        case 'MLB': return Math.round(2400 + clamp(d, 0, 26) * 4300);
    } 
    return 0;
}

// ==================== 賽季推進 (包含獎項與國際賽) ====================

function amateurSeason() {
    if(S.seasonFactor === 0) { 
        card('bad', '', '整季只能在場邊看著隊友比賽。');
        S.log.push({y: S.year, age: S.age, tm: S.team || stageLabel(), line: '傷缺全季', inj: true}); 
        nextStep(); return; 
    }
    const cups = S.stage === 'HS' ? HS_CUPS : S.stage === 'U' ? U_CUPS : ['成棒甲組春季聯賽', '成棒甲組秋季聯賽'];
    const thr = S.stage === 'HS' ? [52, 46, 40, 34, 28] : [60, 54, 48, 42, 36];
    let gain = 0, lines = [], plain = [];
    const tB = S.stage === 'HS' ? ({1:6, 2:0, 3:-6})[S.hsTier || 2] : 0; 
    
    cups.forEach(c => { 
        const pw = ovr() + tB + ri(-8, 8);
        const i = pw >= thr[0] ? 0 : pw >= thr[1] ? 1 : pw >= thr[2] ? 2 : pw >= thr[3] ? 3 : pw >= thr[4] ? 4 : 5;
        const rk = ['冠軍','亞軍','四強','八強','十六強','預賽出局'][i];
        const pts = [7, 5, 4, 3, 2, 1][i] + Math.floor(ovr() / 22);
        gain += pts; lines.push(`${c}：<b class="hl">${rk}</b>（+${pts} 點）`); plain.push(`${c}${rk}`);
        
        if(S.stage === 'U' && rk === '冠軍' && !S.traits.academy) { 
            S.traits.academy = true;
            card('gold', '隱藏屬性解鎖：學院派', '大學殿堂的科學化訓練與防護打下扎實基礎——<b class="hl">25 歲前受傷率 −5%、季初擲骰期望值提升</b>。'); 
        }
        if(i === 0) S.honors.push(`${S.year} ${c}冠軍`); 
    });
    
    S.pool += gain;
    S.log.push({y: S.year, age: S.age, tm: S.team || stageLabel(), line: plain.join('、'), inj: false});
    card('', '年度大賽', lines.join('<br>') + `<div class="statline">獲得能力點 ${gain} 點，季末統一分配。能力越高，大賽收穫越多。</div>`);
    maybeIntl(() => nextStep());
}

function proSeason() {
    const st = simSeason(S.lv); 
    S.lastSt = st; S.lastD = st.d;
    
    const maxG = S.org === 'CPBL' ? 120 : S.org === 'NPB' ? 143 : 162;
    st.G = Math.min(st.G, maxG);

    if(S.pos === 'P') { 
        st.G = Math.max(st.G, Math.ceil(st.IP/9)); 
        st.SV = Math.min(st.SV || 0, st.G); 
        st.HLD = Math.min(st.HLD || 0, st.G - (st.SV || 0)); 
        if ((st.W + st.L) > st.G) {
            const ratio = st.G / (st.W + st.L);
            st.W = Math.floor(st.W * ratio);
            st.L = Math.floor(st.L * ratio);
        }
    } else {
        st.PA = Math.max(st.PA, st.G); 
    }
    
    if(S.pendStat > 0 && S.seasonFactor > 0) {
        const p = S.pendStat * S.seasonFactor;
        if(S.pos === 'P') {
            if(!isSP()) { const addG = Math.min(Math.max(0, 68 - st.G), Math.round(p * 1.2)); st.G += addG; st.IP = +(st.IP + addG * 1.05).toFixed(1); }
            st.SO += Math.round(p * 8); st.IP = +(st.IP + p * 4).toFixed(1);
            if(isSP()) st.W += Math.round(p * 0.4); else st.SV += Math.round(p * 0.6);
            st.era = st.IP > 0 ? clamp(st.era - p * 0.05, 1.40, 9.90) : st.era; st.ER = Math.round(st.era * st.IP / 9);
            if(!isSP()) { 
                st.SV = Math.min(st.SV || 0, Math.floor(st.G * 0.85));
                st.HLD = Math.min(st.HLD || 0, Math.max(0, st.G - st.SV));
                const decCap = Math.max(0, st.G - st.SV - st.HLD);
                if((st.W + st.L) > decCap) { st.W = Math.min(st.W, decCap); st.L = Math.max(0, decCap - st.W); }
            } 
        } else { 
            const Lg = LV[S.lv];
            const addG = Math.min(Math.max(0, (Lg.g || 120) - st.G), Math.round(p * 1.5));
            const addPA = Math.round(addG * 4.25), addAB = Math.round(addPA * 0.9);
            st.G += addG; st.PA += addPA; st.AB += addAB;
            let addH = Math.round(addAB * 0.55) + Math.round(p * 1.5); 
            addH = Math.max(0, Math.min(addH, st.AB - st.H));        
            const addHR = Math.min(addH, Math.round(p * 1.2));
            st.H += addH; st.HR += addHR; st.RBI += Math.round(addHR * 2.1 + (addH - addHR) * 0.3);
            st.avg = st.AB ? st.H / st.AB : 0; 
        }
    }
    S.pendStat = 0;
    
    if(S.pos === 'P' && S.seasonFactor > 0) { 
        const em = {'全力投':1, '普通投':0, '養生球':-1}[S.effort] || 0;
        if(em !== 0) { 
            st.d += em; st.era = clamp(st.era - em * 0.25, 1.40, 9.90); st.ER = Math.round(st.era * st.IP / 9);
            st.SO = Math.round(st.SO * (1 + em * 0.06)); 
        } 
    }
    
    if(S.traits.onetool && S.seasonFactor > 0) { 
        const boost = 1.25; 
        ['G','PA','AB'].forEach(k => { if(typeof st[k] === 'number') st[k] = Math.round(st[k] * boost); });
        ['H','HR','RBI','SB','BB'].forEach(k => { if(typeof st[k] === 'number') st[k] = Math.round(st[k] * boost); });
        st.avg = st.AB > 0 ? st.H / st.AB : 0; 
    }
    
    const bucket = bucketOf(S.lv); 
    accStat(bucket, st);
    
    if(S.seasonFactor === 0) { card('bad', '球季數據', '（傷缺，本季無出賽紀錄）'); }
    else if(S.tradeFrom) { 
        const r = 0.35 + R() * 0.3, p1 = portionOf(st, r), p2 = portionOf(st, 1 - r);
        card('', '球季數據（季中轉隊）', `<span class="tag">${S.tradeFrom}</span><div class="statline">${statLine(p1)}</div>` + `<span class="tag">${S.teamName()}</span><div class="statline">${statLine(p2)}</div>` + `<span class="tag">合計</span><div class="statline">${statLine(st)}</div>`);
    } else card('', '球季數據', `<span class="tag">${S.teamName()}${S.dpos ? '｜'+S.dpos : ''}</span><div class="statline">${statLine(st)}</div>`);
    
    if(st.form === -1) {
        card('bad', '巨大的低潮', `身體狀況很好，但是成績一直打不出來，遇到了巨大的低潮。`);
    } else if(st.form === 1) {
        if(S.pos === 'P') card('gold', '生涯年', '縫線掠過指尖的感覺無與倫比，而你投出去的球像是有了生命。');
        else card('gold', '生涯年', '投來的每顆球看起來都像籃球一樣大，你看得到縫線、球的轉動，每一顆擊中甜蜜點的球，都往全壘打牆奔去。');
    }
    
    const isInj = S.seasonFactor <= 0.45; 
    S.log.push({y: S.year, age: S.age, tm: S.tradeFrom ? `${S.tradeFrom}→${S.teamName()}` : S.teamName(), p: S.dpos || '', line: S.seasonFactor === 0 ? '傷缺全季' : statLine(st), inj: isInj, st: st});
    S.tradeFrom = null;
    
    const healthy = S.seasonFactor >= 0.95 && (S.pos === 'P' ? (isSP() ? st.IP >= 120 : st.G >= 42) : st.G >= LV[S.lv].g * 0.8);
    if(healthy) { 
        S.ironStreak++;
        if(S.ironStreak >= 5 && !S.traits.iron) { 
            S.traits.iron = true;
            card('gold', '隱藏素質解鎖：鐵人', '連續五年全勤級出賽！鋼鐵般的身體，未來每季受傷機率<b class="hl">不高於 10%</b>。'); 
        } 
    } else if(S.seasonFactor < 0.95) S.ironStreak = 0;
    
    if(S.pos !== 'P') { 
        const tg = toolGap();
        const projG = S.seasonFactor > 0 ? (st.G / S.seasonFactor) : 0;
        const isRegular = projG >= LV[S.lv].g * 0.60;
        if(!S.traits.onetool && !isRegular && tg.gap >= 22 && tg.val >= 58 && careerAllStars() < 4) { 
            S.traits.onetool = true;
            const wasBefore = S.removed.includes('只會這個');
            S.removed = S.removed.filter(x => x !== '只會這個'); 
            const role = tg.role;
            S.toolRole = role;
            if(wasBefore || S.age >= 33) traitCard('onetool', '只會這個', `歲月帶走了你的其他工具，只剩<b class="hl">${role}</b>那一項本領還在。教練把你當成板凳上的秘密武器。`, 'bad');
            else traitCard('onetool', '只會這個', `你只有一項武器強得誇張，其餘全是破洞。你成了球隊的<b class="hl">${role}</b>。出賽數銳減，但那一項本領無人能及。`, 'bad'); 
        } else if(S.traits.onetool && (tg.gap < 18 || isRegular)) { 
            removeTrait('onetool', '只會這個'); S.toolRole = null;
            card('good', '不再是工具人', '教練終於敢把你放進先發打線——你證明了自己不只是板凳上的一招鮮。<b class="hl">「只會這個」解除</b>。'); board(1); 
        } 
    }
    
    awards(bucket, st);
    if(S.pos === 'P' && S.seasonFactor > 0) tjAccrue();
    tjGamble(() => demotionAudit(() => tradeCheck(() => maybeIntl(() => nextStep()))));
}

function awards(bucket, st) {
    if(!LV[S.lv].top || S.seasonFactor === 0) return;
    const y = S.year, h = S.honors, lgN = {CPBL:'中職', NPB:'日職', MLB:'大聯盟'}[bucket];

    const TH = {
        CPBL: { g: 120, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [130, 180], avg: [0.300, 0.360], hr: [20, 32], rbi: [75, 105], obp: [0.370, 0.430] },
        NPB:  { g: 143, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [155, 215], avg: [0.300, 0.360], hr: [24, 38], rbi: [90, 125], obp: [0.370, 0.430] },
        MLB:  { g: 162, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [175, 240], avg: [0.300, 0.360], hr: [27, 43], rbi: [100, 140], obp: [0.370, 0.430] }
    };
    const th = TH[bucket] || TH.CPBL;

    { 
        const d = st.d;
        let asP = clamp(28 + d * 7, 3, 92);
        if(bucket === 'CPBL' && S.orgTeam === '台中猛瑪') asP = clamp(asP + 30, 3, 97); 
        if(chance(asP)) { 
            S.stats[bucket].AS++;
            h.push(`${y} ${lgN}明星賽` + ((bucket === 'CPBL' && S.orgTeam === '台中猛瑪' && d < 2) ? '（人氣入選）' : '')); 
        } 
    }

    const rookieOK = bucket !== 'CPBL' || !(S.stats.NPB || S.stats.MLB || S.stats.MINOR);
    if(S.stats[bucket].yr === 1 && rookieOK && st.d >= 4) {
        const rkP = clamp(30 + (st.d - 4) * 15, 30, 95);
        if(chance(rkP)) h.push(`${y} ${lgN}新人王`);
    }

    if(S.pos === 'P') {
        const aw = '年度最佳投手';
        if(isSP() && st.era <= th.era[0] && st.IP >= th.g) { 
            const god = st.era <= th.era[1] && st.IP >= 150;
            const p = god ? 100 : clamp(30 + Math.round((th.era[0] - st.era) * 35 + (st.IP - th.g) * 0.4), 30, 95);
            if(chance(p)) h.push(`${y} ${aw}`);
        }
        if(S.role === 'CL' && st.SV >= th.sv[0]) {
            const god = st.SV >= th.sv[1];
            const p = god ? 100 : clamp(28 + (st.SV - th.sv[0]) * 5, 28, 95);
            if(chance(p)) h.push(`${y} ${lgN}救援王`);
        }
        if(S.role === 'MR' && (st.HLD||0) >= th.hld[0]) {
            const god = (st.HLD||0) >= th.hld[1];
            const p = god ? 100 : clamp(28 + ((st.HLD||0) - th.hld[0]) * 4, 28, 95);
            if(chance(p)) h.push(`${y} ${lgN}中繼王`);
        }
        if(st.SO >= th.so[0]) {
            const god = st.SO >= th.so[1];
            const p = god ? 100 : clamp(25 + Math.round((st.SO - th.so[0]) * 1.2), 25, 95);
            if(chance(p)) h.push(`${y} ${lgN}三振王`);
        }
    } else {
        if(st.PA >= 350 && st.avg >= th.avg[0]) {
            const god = st.avg >= th.avg[1];
            const p = god ? 100 : clamp(25 + Math.floor((st.avg - th.avg[0]) / 0.005) * 6, 25, 95);
            if(chance(p)) h.push(`${y} ${lgN}打擊王`);
        }
        if(st.PA >= 300 && st.HR >= th.hr[0]) {
            const god = st.HR >= th.hr[1];
            const p = god ? 100 : clamp(25 + (st.HR - th.hr[0]) * 5, 25, 95);
            if(chance(p)) h.push(`${y} ${lgN}全壘打王`);
        }
        if(st.PA >= 300 && st.SB >= 25) { 
            const god = st.SB >= 45;
            const p = god ? 100 : clamp(25 + (st.SB - 25) * 4, 25, 95);
            if(chance(p)) h.push(`${y} ${lgN}盜壘王`);
        }
        if(st.PA >= 300 && st.RBI >= th.rbi[0]) {
            const god = st.RBI >= th.rbi[1];
            const p = god ? 100 : clamp(25 + (st.RBI - th.rbi[0]) * 2, 25, 95);
            if(chance(p)) h.push(`${y} ${lgN}打點王`);
        }
        const obp = st.PA > 0 ? (st.H + st.BB) / st.PA : 0;
        if(st.PA >= 350 && obp >= th.obp[0]) {
            const god = obp >= th.obp[1];
            const p = god ? 100 : clamp(25 + Math.floor((obp - th.obp[0]) / 0.005) * 5, 25, 95);
            if(chance(p)) h.push(`${y} ${lgN}上壘王`);
        }
        const def1 = st.DEF || 0;
        if(S.dpos !== 'DH' && S.seasonFactor >= 0.7) {
            if(def1 >= 6) {
                const pGlove = clamp(38 + (def1 - 6) * 5, 38, 95);
                if(chance(pGlove)) h.push(`${y} ${lgN}金手套`);
            }
            if(def1 >= 11) {
                const pDef = clamp(30 + (def1 - 11) * 6, 30, 95);
                if(chance(pDef)) h.push(`${y} ${lgN}守備王`);
            }
        }
    }

    const mvpQual = S.pos === 'P' ? (isSP() ? st.IP >= 120 : st.G >= 45) : st.PA >= LV[S.lv].g * 3.4;

    if(st.d >= 6 && mvpQual && S.seasonFactor >= 0.9) {
        const god = st.d >= 15;
        const baseMult = (S.pos === 'P' && S.role !== 'SP') ? 5 : 12; 
        const pMVP = god ? 100 : clamp(baseMult + (st.d - 6) * 11, baseMult, 95);
        if(chance(pMVP)) h.push(`${y} ${lgN}年度MVP`);
    }

    const added = h.filter(x => x.startsWith(String(y)));
    if(added.length) { 
        card('gold', '年度獎項', added.map(x => x.slice(5)).join('｜'));
        const topAw = added.find(x => /年度MVP/.test(x)) || added.find(x => /最佳投手|王/.test(x)) || added.find(x => /新人王/.test(x)) || added[0];
        tlNote(3, topAw.slice(5));
        if(S.traits.yips) { removeTrait('yips', '失憶症'); card('good', '走出陰影', '站上大舞台拿下獎項的那一刻，腦海裡的雜音消失了——<b class="hl">失憶症痊癒</b>。'); }
        if(S.traits.glass && !S.traits.phoenix) { 
            const big = added.some(x => /MVP|最佳投手|打擊王|全壘打王|新人王/.test(x));
            if(big) { 
                S.traits.phoenix = true; removeTrait('glass', '玻璃人');
                S.pool += 8;
                card('gold', '隱藏屬性解鎖：浴火重生', '那些殺不死你的，真的讓你更強大了。撕裂的韌帶長成更堅韌的形狀——<b class="hl">玻璃人懲罰解除，受傷率恢復正常，並獲得一大筆能力點</b>。'); 
            } 
        }
    }
}

function maybeIntl(done) {
    const wbc = (S.year - 2026) % 4 === 0; let p12 = (S.year - 2028) % 4 === 0;
    if(S.lv === 'MLB') p12 = false; 
    if(S.stage !== 'PRO' || (!wbc && !p12) || ovr() < 52 || S.seasonFactor < 0.5 || S.rehab > 0 || S.skipMid) { done(); return; }
    
    const name = wbc ? '世界棒球經典賽' : '世界12強賽';
    let forced = false, first = false;
    if(S.intlLock === null) { S.intlLock = S.year; forced = true; first = true; }
    else if(S.year - S.intlLock < 5) forced = true;
    
    if(forced) {
        card('info', '體育署公文', first ? `「查 台端符合國家代表隊遴選資格，依規定<b class="hl">強制徵召</b>，並自即日起<b class="hl">列管五年</b>。」` : `列管期間（剩 ${5 - (S.year - S.intlLock)} 年），依規定<b class="hl">強制徵召</b>。你沒有選擇。`);
    }
    
    const opts = [
        {t: forced ? '⋯⋯只能報到（強制徵召）' : '披上國家隊戰袍', main:true, s:'依成績獲得能力點｜下季受傷機率 +10%', f:()=>{
            const b = clamp(Math.round((ovr() - 52) * 0.35), 0, 8), r = R() * 100 + b;
            const i = r >= 96 ? 0 : r >= 88 ? 1 : r >= 79 ? 2 : r >= 46 ? 3 : 4;
            const rk = ['冠軍','亞軍','季軍','複賽止步','預賽出局'][i], pts = [6, 5, 4, 2, 1][i];
            let gpts = pts; if(S.traits.intlace) gpts = Math.max(pts, 2);
            S.pool += gpts; S.injNext = S.traits.intlace ? 0 : 10; S.intlCount++;
            
            if(!S.traits.taiwan && S.intlCount > 5) { 
                S.traits.taiwan = true;
                card('gold', '隱藏稱號：Team Taiwan', `永遠把國家榮耀放在比職涯更高的位子，你是球迷心中的驕傲。`); board(1); 
            }
            
            { 
                const a = S.ab, par = 52; const IS = S.intlStat;
                if(S.pos === 'P') { 
                    const dd = (a.vel + a.ctl + a.brk) / 3 - par;
                    let g, ip;
                    if(isSP()) { g = ri(1, 2); ip = +(g * (4.5 + R() * 2.5)).toFixed(1); } 
                    else { g = ri(3, 6); ip = +(g * (0.8 + R() * 0.8)).toFixed(1); }
                    
                    IS.IP = +(IS.IP + ip).toFixed(1); IS.G += g;
                    const k9 = clamp(7.5 + dd * 0.12, 4, 14); IS.SO += Math.round(ip / 9 * k9);
                    const era = clamp(3.6 - dd * 0.16, 0.8, 8); IS.ER += Math.round(era * ip / 9);
                    if(i <= 2 && chance(45)) IS.W++; if(!isSP() && chance(30)) IS.SV++;
                } else { 
                    const dd = (a.con * 0.5 + a.pow * 0.2 + a.eye * 0.18 + a.spd * 0.12) - par - 0.5; 
                    const g = ri(5, 8), pa = g * ri(3, 4); IS.G += g; IS.PA += pa;
                    const ab = Math.round(pa * 0.86); IS.AB += ab;
                    const avg = clamp(0.270 + dd * 0.006, 0.15, 0.5); const h = Math.round(ab * avg); IS.H += h;
                    const hr = Math.round(h * clamp(0.06 + Math.max(0, a.pow - par) * 0.006, 0.03, 0.28)); IS.HR += hr;
                    IS.RBI += Math.round(hr * 2.1 + h * 0.35);
                }
            }
            
            if(i <= 1) S.intlTop4 = (S.intlTop4 || 0) + 1; 
            if(!S.traits.intlace && S.intlCount >= 3 && (S.intlTop4 || 0) >= 2) { 
                S.traits.intlace = true;
                card('gold', '隱藏屬性解鎖：國際賽之鬼', '只要穿上 CT 球衣，你是為大場面而生的男人。<b class="hl">國際賽不再增加受傷風險，且每次徵召能力點保底 +2</b>。'); 
            }
            if(i <= 2) S.honors.push(`${S.year} ${name}${rk}`);
            if(i === 0) tlNote(3, (wbc ? '經典賽' : '12強') + '冠軍');
            
            let ex = ''; const mp = S.traits.clutch ? 2 : 1; 
            if((i === 0 && chance(30 * mp)) || (i === 1 && chance(8 * mp))) { S.honors.push(`${S.year} ${name}MVP`); ex = '你被選為<b class="hl">賽會MVP</b>！'; }
            
            card(i <= 1 ? 'gold' : 'info', name, `中華隊最終成績：<b class="hl">${rk}</b>。${ex}獲得能力點 <b class="hl">${gpts}</b> 點。${S.traits.intlace ? '國家英雄不知何謂疲憊。' : '國際賽的高強度消耗，讓下季受傷風險上升。'}`);
            done(); 
        }}
    ];
    
    if(!forced) opts.push({t:'以調整為由婉拒', s:'列管期已過，終於能說不', f:done});
    choose(`中華隊徵召 · ${name}`, opts);
}
