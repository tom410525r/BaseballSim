// ==================== 數值運算、守備與賽季模擬引擎 ====================
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
// ==================== 守位審查與評估 ====================
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

// ==================== 賽季模擬引擎 (Season Engine) ====================
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
// ==================== 業餘與成棒賽季模擬 ====================
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
