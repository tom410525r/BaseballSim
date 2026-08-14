// ==================== 主迴圈、賽季推進與生涯結算 ====================

function nextStep() { 
    if(S.done) { stepQ = []; return; } 
    const f = stepQ.shift(); 
    if(f) f(); 
}

function stageLabel() {
    if(S.stage === 'HS') return '高' + ['一','二','三'][S.stageYr-1];
    if(S.stage === 'U') return '大' + ['一','二','三','四'][S.stageYr-1];
    if(S.stage === 'AMA') return '業餘成棒';
    return LV[S.lv] ? LV[S.lv].n : '職業';
}

function advance() { S.age++; S.year++; S.stageYr++; startYear(); }

function startYear() { 
    stepQ = [phasePre, phaseMid, phaseEnd]; 
    divider(`${S.year} 年 · ${S.age} 歲 · ${stageLabel()}`); 
    tlPush(); 
    nextStep(); 
}

function signTo(org, lv, team, yrs, mult) {
    if(S.org && S.org !== org) { S.svc = 0; S.faElig = false; }
    if(S.orgTeam !== team) { S.teamYears = 0; S.champThisTeam = false; S.champTeam = null; S.tradeRefuse = 0; S.tradeHeat = 0; }
    S.org = org; S.lv = lv; S.orgTeam = team || S.orgTeam;
    S.ct = {yrs, mult: mult || 1, extOffered: false};
}

function buyoutRemaining(partial) {
    if(S.ct && S.ct.yrs > 0) { 
        const sal = Math.round(salaryFor(S.lv, S.lastD||0) * S.ct.mult);
        S.salary += sal * S.ct.yrs * (partial ? 0.3 : 1);
        S.ct = null;
    }
}

function daibaFarewell(cont) { cont(); }

function movement() {
    if(S.stage !== 'PRO') { advance(); return; }
    const o = ovr(), d = S.lastD || 0;
    
    if(!S.orgTeam) { outOfOrg(o); return; }
    
    S.teamYears++; S.svc++;
    if(!S.faElig) {
        const req = S.org === 'CPBL' ? 9 : S.org === 'NPB' ? 8 : 6;
        if(S.svc >= req) { S.faElig = true; card('gold', '取得自由球員資格', `在一軍打滾了 ${req} 年，終於取得了 FA 資格。`); }
    }
    
    if(S.ct && S.ct.yrs > 0) {
        S.ct.yrs--;
        if(S.ct.yrs > 0) {
            if(S.ct.yrs === 1 && !S.ct.extOffered && chance(30) && d >= 1 && typeof extensionOffer === 'function') {
                extensionOffer(o); return; 
            }
            if(typeof crossOffers === 'function') { crossOffers(o); return; }
            advance(); return;
        }
        S.ct = null; 
    }
    
    const minT = LV[S.lv] ? LV[S.lv].min : 0;
    if(o < minT - 3 && d < -2) {
        let down = null;
        if(S.lv === 'CPBL1') down = 'CPBL2';
        else if(S.lv === 'NPB1') down = 'NPB2';
        else if(S.lv === 'MLB') down = 'A3';
        else if(S.lv === 'A3') down = 'A2';
        else if(S.lv === 'A2') down = 'A1';
        else if(S.lv === 'A1') down = 'R';
        
        if(down) {
            S.lv = down;
            card('bad', '下放', `因表現不佳，被降至 ${LV[down].n} 重新出發。`);
        } else {
            outOfOrg(o); return;
        }
    }
    
    if(!S.traits.goldcloth && S.teamYears >= 10) { S.traits.goldcloth = true; card('gold', '隱藏屬性解鎖：黃金聖衣', '效力同球隊十年，你是這座城市的主場信仰。'); board(1); }
    if(!S.traits.mrteam && S.teamYears >= 15) { S.traits.mrteam = true; S.mrTeamName = S.orgTeam; card('gold', '隱藏屬性解鎖：球隊先生', `你就是這座城市的代名詞。你是<b class="hl">${teamNick(S.orgTeam)}先生</b>。`); board(1); }
    
    if(S.faElig && typeof faFlow === 'function') faFlow(o);
    else if(S.traits.cancer && chance(40)) outOfOrg(o);
    else if(typeof termChoice === 'function') {
        termChoice(o, d, `與 ${S.teamName()} 談約`, (y, m)=>{ S.ct = {yrs:y, mult:m, extOffered:false}; card('info', '續約', `完成 <b class="hl">${y} 年</b>續約。`); if(typeof crossOffers === 'function') crossOffers(o); else advance(); }, ()=>outOfOrg(o));
    } else advance();
}

function phasePre() {
    board(0); S.tmpInj = 0; S.seasonFactor = 1; S.skipMid = false; S.prevD = S.lastD || 0; S.lastD = 0;
    if(S.age >= 48) { buyoutRemaining(1); endGame('身體已到極限，'+S.year+' 年春訓後宣布引退。'); return; }
    
    const declAge = S.age - (S.traits.disc ? 2 : 0);
    if(declAge >= 32) { 
        const dec = declAge >= 35 ? 5 + (declAge - 35) : 2;
        POS_AB[S.pos].forEach(k => S.ab[k] = clamp(S.ab[k] - dec, 1, 80));
        card('bad', '歲月不饒人', `${declAge >= 35 ? '第二階段（逐年加劇）' : '第一階段'}衰退：所有能力 <b class="dn">−${dec}</b>。`); 
        board(0); 
    }
    
    if(S.rehab > 0) { 
        S.rehab--; S.skipMid = true; S.seasonFactor = 0;
        card('bad', '復健年', '大傷尚未痊癒，本季確定<b class="dn">全年報銷</b>，只能在復健室度過。');
        const dummySt = {G:0, PA:0, AB:0, H:0, HR:0, RBI:0, SB:0, BB:0, W:0, L:0, SV:0, HLD:0, IP:0, SO:0, ER:0, avg:0, era:0, WHIP:0, DEF:0, WAR:0};
        S.log.push({y:S.year, age:S.age, tm:S.stage === 'PRO' ? S.teamName() : (S.team || stageLabel()), line:'復健年・全年報銷', inj: true, st: S.stage === 'PRO' ? dummySt : null}); 
    }
    
    let afterAsk = () => {
        let n = S.skipMid ? 2 : (() => { const r = R(); return r < 0.35 ? 3 : r < 0.75 ? 4 : r < 0.95 ? 5 : 6; })();
        if(S.traits.distract && !S.skipMid) n = Math.max(2, n - 1);
        if(S.traits.academy && !S.skipMid && chance(35)) n++;
        
        const dice = []; let newSix = 0;
        for(let i=0; i<n; i++) { 
            const v = S.traits.genius ? ri(4,6) : S.traits.late ? ri(3,6) : ri(1,6); 
            dice.push(v);
            if(v === 6 && S.age < 22 && !S.traits.genius) { S.six++; newSix++; } 
        }
        
        let msg = `自主訓練擲出 <b class="hl">${n}</b> 顆骰。`;
        if(newSix && !S.traits.genius) msg += ` 高標值「6」累計 <b class="hl">${S.six}/5</b> 次。`;
        
        if(S.traits.combo && !S.skipMid && (S.comboKey || S.samePickKey)) {
            const ck = S.comboKey || S.samePickKey;
            const cv = S.traits.genius ? ri(4,6) : S.traits.late ? ri(3,6) : ri(1,6);
            const gained = addAb(ck, cv);
            const overflow = S.lastOverflow || 0;
            if(overflow > 0) S.pendStat = (S.pendStat || 0) + overflow;
            let cmsg = `<br>大巧不工發動：系統自動擲出 <b class="hl">${cv}</b> 點，挹注於 <b class="hl">${ABL[ck]}</b>`;
            if(gained > 0) cmsg += `（能力 <b class="up">+${gained}</b>）`;
            if(overflow > 0) cmsg += `（頂峰造極：溢出的 ${overflow} 點轉為<b class="up">本季成績加成</b>）`;
            msg += cmsg + `。`;
        }
        
        card('', '季初特訓', msg);
        if(S.six >= 5 && !S.traits.genius && S.age < 22) { 
            S.traits.genius = true;
            const exDef = S.pos === 'C' ? ['rng','fld','arm','cat'] : [];
            const cands = POS_AB[S.pos].filter(k => S.ab[k] < 70 && !exDef.includes(k));
            for(let i = cands.length - 1; i > 0; i--) { const j = Math.floor(R()*(i+1)); const t = cands[i]; cands[i] = cands[j]; cands[j] = t; }
            const boost = cands.slice(0,2), bl = [];
            boost.forEach(k => { 
                S.pot[k] = Math.min(80, (S.pot[k] || 62) + 10); 
                S.ab[k] = clamp(S.ab[k] + 5, 1, 80); 
                bl.push(`${ABL[k]} <b class="up">+5</b>（潛力上限 +10 → ${S.pot[k]}）`); 
            });
            card('gold', '隱藏素質解鎖：天才', '22 歲前五度擲出高標值！從此每一顆訓練骰<b class="hl">永久固定 4 點以上</b>。' + (bl.length ? `天賦覺醒：${bl.join('、')}。` : ''));
            board(1);
        }
        choose('', [{t:`▸ 分配訓練成果（${dice.length} 顆骰）`, main:true, f:()=>typeof dposReview === 'function' ? dposReview(()=>allocUI({dice}, '分配訓練成果', ()=>nextStep())) : allocUI({dice}, '分配訓練成果', ()=>nextStep())}]);
    };
    
    const preAsk = afterAsk;
    if((S.pos === 'P' || S.pos === 'TW') && S.stage === 'PRO' && !S.skipMid) {
        afterAsk = () => {
            choose(`開季投球規劃（手臂狀況：${(function(){const r=S.tj/tjCap(); return S.rehab>0?'復健中':r>=0.85?'手肘隱隱作痛':r>=0.6?'手臂略感疲勞':r>=0.35?'狀況尚可':'手感輕盈';})()}）`, [
                {t:'全力投', warn:true, s:'成績最佳｜手臂負荷最大', f:()=>{S.effort='全力投'; preAsk();}},
                {t:'普通投', main:true, s:'標準強度', f:()=>{S.effort='普通投'; preAsk();}},
                {t:'養生球', s:'成績保守｜省手臂', f:()=>{S.effort='養生球'; preAsk();}}
            ]);
        };
    }
    
    if(S.stage === 'HS' && S.stageYr >= 4) {
        const o = ovr(); const opts = [];
        if (S.hsRegion === 'JP') {
            opts.push({t:'投入日本職棒選秀', main:true, s:`目前綜合 ${o}`, f:()=>runDraftJP(true, afterAsk)});
            opts.push({t:'升學大學', f:()=>{S.stage='U'; S.stageYr=1; S.team=pick(['早稻田大學','慶應義塾大學','法政大學']); afterAsk();}});
        } else {
            opts.push({t:'投入中華職棒選秀', s:`目前綜合 ${o}`, f:()=>runDraft(true, afterAsk)});
            opts.push({t:'升學大學', main:true, f:()=>{S.stage='U'; S.stageYr=1; S.team=pick(['文化大學','輔仁大學','國立體大','台灣體大']); afterAsk();}});
        }
        choose(`高中畢業 · 升學與選秀的十字路口`, opts);
        return;
    }
    
    if(S.stage === 'U' && S.stageYr >= 4) {
        const o = ovr(); const opts = [];
        if (S.hsRegion === 'JP') {
            opts.push({t:'投入日本職棒選秀', main:true, s:`目前綜合 ${o}`, f:()=>runDraftJP(false, afterAsk)});
            opts.push({t:'加入社會人球隊', f:()=>{S.stage='AMA'; S.stageYr=1; S.team=pick(['豐田汽車','JR東日本','東京瓦斯']); afterAsk();}});
        } else {
            opts.push({t:'投入中華職棒選秀', s:`目前綜合 ${o}`, f:()=>runDraft(false, afterAsk)});
            opts.push({t:'加入業餘成棒', main:true, f:()=>{S.stage='AMA'; S.stageYr=1; S.team=pick(['合電','台庫','安妞先物']); afterAsk();}});
        }
        
        const agePenalty = Math.max(0, S.age - 18);
        const reqNPB = 44 + Math.floor(agePenalty / 2);  
        const reqMiLB = 50 + Math.floor(agePenalty / 2);  
        const bonusNPB = Math.max(100, 800 - agePenalty * 180);   
        const bonusMiLB = Math.max(150, 1500 - agePenalty * 350); 
        
        if(S.hsRegion !== 'JP' && o >= reqNPB) opts.push({t:'洽談旅日合約', s:'挑戰日職', f:()=>{ S.stage='PRO'; S.team=''; S.svc=0; S.faElig=false; pickOfferUI('日職球團報價', 'NPB', makeOffers('NPB', 2, bonusNPB, 2, 3, 'NPB2', null), afterAsk);}});
        if(o >= reqMiLB) opts.push({t:'洽談旅美合約', s:'挑戰小聯盟', f:()=>{ S.stage='PRO'; S.team=''; S.svc=0; S.faElig=false; pickOfferUI('大聯盟球團報價', 'MiLB', makeOffers('MiLB', 2, bonusMiLB, 3, 4, o>=55?'A1':'R', null), afterAsk);}});
        choose(`大學畢業 · 未來的去向`, opts);
        return;
    }
    
    if(S.stage === 'PRO' && S.age >= 36 && S.rehab === 0) {
        const oldOpts = [{t:'再戰一年', main:true, f:afterAsk}];
        if(S.org !== 'CPBL' && ovr() >= 45) {
            oldOpts.push({t:'放棄合約，落葉歸根', s:'狀態不再，仍想把最後的球打給家鄉看', f:()=>{ card('good', '落葉歸根', '你決定放棄合約，回家，把最後的球打給臺灣球迷看。'); signTo('CPBL','CPBL1'); afterAsk(); }});
        }
        oldOpts.push({t:'召開引退記者會', warn:true, s:'結束選手生涯', f:()=>{buyoutRemaining(); daibaFarewell(()=>endGame('功成身退，於 '+S.year+' 年宣布引退。'));}});
        choose('又是一年春訓，身體大不如前了', oldOpts);
        return;
    }
    afterAsk();
}

function phaseMid() {
    board(1);
    if(S.skipMid) { S.ironStreak = 0; nextStep(); return; }
    const nEv = S.stage === 'PRO' ? 3 : 2;
    if(typeof loveEvent === 'function') {
        loveEvent(() => drawEvents(nEv, () => {
            choose('', [{t:'▸ 季中健康檢查', main:true, f:()=>{ rollInjury(); choose('', [{t:'▸ 查看球季表現', main:true, f:()=>{ if(S.stage === 'PRO') proSeason(); else amateurSeason(); }}]); }}]);
        }));
    } else {
        drawEvents(nEv, () => {
            choose('', [{t:'▸ 季中健康檢查', main:true, f:()=>{ rollInjury(); choose('', [{t:'▸ 查看球季表現', main:true, f:()=>{ if(S.stage === 'PRO') proSeason(); else amateurSeason(); }}]); }}]);
        });
    }
}

function phaseEnd() {
    board(2);
    if(S.stage === 'PRO') {
        let sal = Math.round(salaryFor(S.lv, S.lastD || 0) * (S.ct ? S.ct.mult : 1) * dpMult()); 
        if(S.seasonFactor === 0) sal = Math.round(sal * 0.5);
        S.salary += sal; let extra = '';
        
        if(LV[S.lv] && LV[S.lv].top && S.seasonFactor > 0) {
            const tp = LV[S.lv].top;
            const pc = clamp(({CPBL:15, NPB:8, MLB:3.5})[tp] + (S.lastD || 0) * 0.5, 2, ({CPBL:26, NPB:15, MLB:9})[tp]);
            let pcc = pc; if(S.traits.clutch) pcc *= 1.25; if(S.traits.leader) pcc += 5; if(S.tradeRefuse > 0) pcc *= 0.75;
            if(chance(pcc)) { 
                const cN = {CPBL:'中職總冠軍', NPB:'日本一', MLB:'世界大賽冠軍'}[tp]; 
                S.honors.push(`${S.year} ${cN}`); S.wonChamp = true; S.champThisTeam = true; S.champTeam = S.orgTeam; 
                tlNote(1, cN);
                extra = `<br>球隊奪下 <b class="hl">${cN}</b>，全城陷入瘋狂！`; 
            } 
        }
        if(S.tradeRefuse > 0) S.tradeRefuse--; 
        if(S.tradeHeat > 0) S.tradeHeat = Math.max(0, S.tradeHeat - 5);
        card('', '季末結算', `本年度薪資：<b class="hl">${fmtMoney(sal)}</b>（生涯累計 ${fmtMoney(Math.round(S.salary))}）${S.ct ? `｜合約剩 ${Math.max(0, S.ct.yrs - 1)} 年` : ''}${extra}`);
        board(2);
    }
    const go = () => movement();
    if(S.pool > 0) { 
        const p = S.pool; S.pool = 0; 
        choose('', [{t:`▸ 分配能力點（${p} 點·大賽／國際賽成果）`, main:true, f:()=>allocUI({pool:p}, '季末能力點分配', go)}]); 
    } else go();
}

function statTable(bucket) {
    const st = S.stats[bucket]; if(!st) return '';
    let out = `<p style="margin-top:8px"><b>${LG_N[bucket]}</b>${st.AS ? ` · 明星賽 ${st.AS} 度入選` : ''}</p>`;
    
    const pTable = (pst) => {
        const era = pst.IP > 0 ? (pst.ER * 9 / pst.IP).toFixed(2) : '-';
        return `<table class="fin"><tr><th>Yrs</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>HLD</th><th>SO</th><th>BB</th><th>ERA</th><th>WHIP</th></tr><tr><td>${st.yr}</td><td>${pst.G}</td><td>${fmtIP(pst.IP)}</td><td>${pst.W}</td><td>${pst.L}</td><td>${pst.SV||0}</td><td>${pst.HLD||0}</td><td>${pst.SO}</td><td>${pst.BB||0}</td><td>${era}</td><td>${pst.WHIP||0}</td></tr></table>`;
    };
    
    const hTable = (hst) => {
        const obpN = hst.PA > 0 ? (hst.H + hst.BB) / hst.PA : 0; const slgN = slgOf(hst);
        const avg = hst.AB > 0 ? (hst.H / hst.AB).toFixed(3).replace(/^0/, '') : '-';
        const obp = hst.PA > 0 ? obpN.toFixed(3).replace(/^0/, '') : '-';
        const slg = hst.AB > 0 ? slgN.toFixed(3).replace(/^0/, '') : '-';
        const ops = hst.AB > 0 ? (obpN + slgN).toFixed(3).replace(/^0/, '') : '-';
        return `<table class="fin"><tr><th>Yrs</th><th>G</th><th>PA</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th><th>H</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th></tr><tr><td>${st.yr}</td><td>${hst.G}</td><td>${hst.PA}</td><td>${avg}</td><td>${obp}</td><td>${slg}</td><td>${ops}</td><td>${hst.H}</td><td>${hst.HR}</td><td>${hst.RBI}</td><td>${hst.SB}</td><td>${hst.DEF > 0 ? '+' : ''}${hst.DEF || 0}</td></tr></table>`;
    };

    if (S.pos === 'TW') { 
        out += `<div style="color:var(--amber);font-size:11px;margin-top:4px">【打擊】</div>` + hTable(st) + `<div style="color:var(--amber);font-size:11px;margin-top:4px">【投球】</div>` + pTable(st.pitchStats); 
    } else if (S.pos === 'P') { 
        out += pTable(st); 
    } else { 
        out += hTable(st); 
    } 
    return out;
}

function retireScene(tiers) {
    let lg = 'CPBL', bestI = 4;
    const order = ['MLB','NPB','CPBL']; 
    order.forEach(b => { if(tiers[b] && tiers[b].i < bestI) bestI = tiers[b].i; });
    
    let repYr = -1; 
    order.forEach(b => { if(tiers[b] && tiers[b].i === bestI) { const yy = S.stats[b] ? S.stats[b].yr : 0; if(yy > repYr) { repYr = yy; lg = b; } } });
    
    const t = tiers[lg], i = t ? t.i : 4, yr = S.year; 
    let txt = '';
    
    if(lg === 'CPBL') {
        if(i === 0) txt = `引退戰選在<b class="hl">臺北大巨蛋</b>。四萬人把巨蛋塞得水洩不通，外野看板掛滿你生涯每一年的照片。九局下最後一個打席結束，全場燈光暗下，只剩一道追光打在你身上。`;
        else if(i === 1) txt = `球團為你舉辦了引退儀式。主場滿場，大螢幕播放生涯回顧影片，老隊友從各地回來替你獻花，總教練哽咽致詞。`;
        else txt = `球季最後一個主場日，球團安排你先發，賽後全場觀眾起立鼓掌。`;
    } else if(lg === 'NPB') {
        if(i <= 1) txt = `球團為你安排了<b class="hl">引退試合</b>。兩軍球員沿線列隊，隊友把你高高拋起——三次、四次、五次的胴上げ。`;
        else txt = `最終戰賽後，球團舉行了簡短的引退セレモニー，客場球迷也起立鼓掌。`;
    } else {
        txt = `主場最終戰，全場觀眾起立鼓掌長達三分鐘，Curtain Call。`;
    }
    card('gold', '引退之日', txt);
    
    const hofs = []; let firstBallot = false; const hofLeagues = [];
    const HOF_CFG = {CPBL:{n:'中華職棒名人堂',wait:5,total:132,lg:'中職'}, NPB:{n:'日本野球殿堂',wait:5,total:326,lg:'日職'}, MLB:{n:'美國棒球名人堂',wait:5,total:389,lg:'大聯盟'}};
    
    ['CPBL','NPB','MLB'].forEach(b => { 
        const t = tiers[b]; if(!t) return;
        const cfg = HOF_CFG[b];
        if(t.i === 0) {
            const th = TIER_TH[b] ? TIER_TH[b][0] : 60; const fbMult = {CPBL:1.12, NPB:1.12, MLB:1.2}[b] || 1.2;
            const firstNow = t.sc >= th * fbMult; const ballotYr = firstNow ? 1 : ri(2,6);
            if(firstNow) firstBallot = true; hofLeagues.push(cfg.lg);
            const pct = Math.min(99.1, 75 + (t.sc - th)/th * 40 + R()*6 - (ballotYr-1)*4); 
            const votes = Math.round(cfg.total * Math.max(75, pct)/100);
            if(!S.hofInfo) S.hofInfo = []; S.hofInfo.push({lg: cfg.lg, yr: ballotYr, pct: Math.max(75, pct).toFixed(1)});
            hofs.push(`引退 <b class="hl">${cfg.wait}</b> 年後進入候選，於<b class="hl">第 ${ballotYr} 年投票</b>以 <b class="hl">${votes}</b> 票（得票率 ${Math.max(75, pct).toFixed(1)}%）榮登<b class="hl">${cfg.n}</b>。`);
        } 
    });
    
    if(firstBallot && !S.traits.legend) { S.traits.legend = true; S.legendLeague = hofLeagues[0] || ''; }
    if(hofs.length) card('gold', '名人堂票選', hofs.join('<br><br>'));
    if(S.traits.legend) { card('gold', '隱藏屬性解鎖：歷史級球星', '第一年投票就披上名人堂金袍——你定義了一個時代。'); }
}

function endGame(reason) {
    S.done = true; actClear();
    divider('生涯終幕');
    card('info', '引退', reason);
    
    let tables = '', evals = [], best = 99; const tiersByLg = {};
    ['MLB','NPB','CPBL','MINOR'].forEach(b => { 
        if(S.stats[b]) { 
            tables += statTable(b);
            if(b !== 'MINOR') { const t = typeof tierOf === 'function' ? tierOf(b) : {name:'未知評價', sc:0, i:4}; tiersByLg[b] = t; evals.push(`<span class="tag">${t.name}</span>（評價分 ${t.sc}）`); best = Math.min(best, t.i); } 
        } 
    });
    if(best === 99) best = 4;

    const tc = S.orgTeam ? (TEAM_COLOR[S.orgTeam] || '#1e3c28') : '#1e3c28'; 
    let topStats = []; const a = S.ab;
    if(S.pos === 'P' || S.pos === 'TW') topStats = [{n:'球速',v:a.vel},{n:'控球',v:a.ctl},{n:'變化',v:a.brk}].sort((x,y)=>y.v-x.v);
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
          <div class="pc-logo">${S.teamName ? S.teamName() : '自由球員'}</div>
        </div>
    `;
    card('', '生涯成就紀念卡', cardHTML);

    retireScene(tiersByLg);
    
    if(S.age < 25) {
        const nm = S.name;
        const second = [
            `你加入了乙組業餘棒球隊。平日上班、週末穿上球衣，去年在協會盃敲出再見安打的影片被瘋傳。`,
            `你考到了不動產營業員執照。帶看時爬六樓透天面不改色，客戶都說你氣場不一樣。`,
            `你跟著舅舅去做板模。工地的日子曬得比春訓還黑，但你的核心力量和不服輸讓老師傅都點頭。`
        ];
        card('gold', '第二人生', second[Math.floor(R()*second.length)].replace(/{n}/g, nm) + `<br><br><span class="sub">離開球場的人生，也是人生。${nm}，辛苦了。</span>`);
    }
    
    if(S.log.length) {
        const amaLogs = S.log.filter(r => !r.st);
        const proLogs = S.log.filter(r => r.st);
        if(amaLogs.length > 0) {
            const amaRows = amaLogs.map(r => `<tr><td style="white-space:nowrap">${r.y}</td><td style="white-space:nowrap">${r.age}</td><td style="text-align:left;white-space:nowrap">${r.tm}</td><td style="text-align:left;font-size:11px;${r.inj?'color:var(--bad);font-weight:700;':''}">${r.line}</td></tr>`).join('');
            card('', '生涯年表（業餘成績）', `<table class="fin"><tr><th>年度</th><th>齡</th><th style="text-align:left">球隊</th><th style="text-align:left">成績</th></tr>${amaRows}</table>`);
        }
        if(proLogs.length > 0) {
            const headP = `<tr><th>年</th><th>齡</th><th style="text-align:left">球隊</th><th>G</th><th>IP</th><th>W</th><th>L</th><th>SV</th><th>SO</th><th>ERA</th><th>ERA+</th><th>WAR</th></tr>`;
            const headB = `<tr><th>年</th><th>齡</th><th style="text-align:left">球隊</th><th>G</th><th>PA</th><th>AVG</th><th>OPS</th><th>OPS+</th><th>HR</th><th>RBI</th><th>SB</th><th>DEF</th><th>WAR</th></tr>`;
            
            let rows = '';
            proLogs.forEach(r => {
                const cS = r.inj ? 'color:var(--bad);font-weight:700;' : '';
                const s = r.st || {G:0, PA:0, AB:0, H:0, HR:0, RBI:0, SB:0, BB:0, W:0, L:0, SV:0, HLD:0, IP:0, SO:0, ER:0, avg:0, era:0, WHIP:0, DEF:0, WAR:0};
                const tmS = r.tm;
                
                if(S.pos === 'TW') {
                    const obpN = s.PA > 0 ? (s.H + s.BB) / s.PA : 0; const slgN = typeof slgOf === 'function' ? slgOf(s) : 0; const avg = s.AB > 0 ? (s.H / s.AB).toFixed(3).replace(/^0/, '') : '-'; const ops = s.AB > 0 ? (obpN + slgN).toFixed(3).replace(/^0/, '') : '-';
                    rows += `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td style="text-align:left;white-space:nowrap">${tmS} (打)</td><td>${s.G}</td><td>${s.PA}</td><td>${avg}</td><td>${ops}</td><td>${s.opsPlus || '-'}</td><td>${s.HR}</td><td>${s.RBI}</td><td>${s.SB}</td><td>${s.DEF > 0 ? '+' : ''}${s.DEF || 0}</td><td>${(s.WAR || 0).toFixed(1)}</td></tr>`;
                    if(s.pitch) {
                        const pst = s.pitch; const era = pst.IP > 0 ? (pst.ER * 9 / pst.IP).toFixed(2) : '-';
                        rows += `<tr style="${cS}; opacity:0.8"><td></td><td></td><td style="text-align:left;white-space:nowrap">${tmS} (投)</td><td>${pst.G}</td><td>${fmtIP(pst.IP)}</td><td>${pst.W}</td><td>${pst.L}</td><td>${pst.SV || 0}</td><td>${pst.SO}</td><td>${era}</td><td>${pst.eraPlus || '-'}</td><td>${(pst.WAR || 0).toFixed(1)}</td></tr>`;
                    }
                } else if(S.pos === 'P') {
                    const era = s.IP > 0 ? (s.ER * 9 / s.IP).toFixed(2) : '-';
                    rows += `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td style="text-align:left;white-space:nowrap">${tmS}</td><td>${s.G}</td><td>${fmtIP(s.IP)}</td><td>${s.W}</td><td>${s.L}</td><td>${s.SV || 0}</td><td>${s.SO}</td><td>${era}</td><td>${s.eraPlus || '-'}</td><td>${(s.WAR || 0).toFixed(1)}</td></tr>`;
                } else {
                    const obpN = s.PA > 0 ? (s.H + s.BB) / s.PA : 0; const slgN = typeof slgOf === 'function' ? slgOf(s) : 0; const avg = s.AB > 0 ? (s.H / s.AB).toFixed(3).replace(/^0/, '') : '-'; const ops = s.AB > 0 ? (obpN + slgN).toFixed(3).replace(/^0/, '') : '-';
                    rows += `<tr style="${cS}"><td>${r.y}</td><td>${r.age}</td><td style="text-align:left;white-space:nowrap">${tmS}${r.p ? '·' + r.p : ''}</td><td>${s.G}</td><td>${s.PA}</td><td>${avg}</td><td>${ops}</td><td>${s.opsPlus || '-'}</td><td>${s.HR}</td><td>${s.RBI}</td><td>${s.SB}</td><td>${s.DEF > 0 ? '+' : ''}${s.DEF || 0}</td><td>${(s.WAR || 0).toFixed(1)}</td></tr>`;
                }
            });
            const tableHead = S.pos === 'TW' ? headB : (S.pos === 'P' ? headP : headB);
            card('', '生涯年表（職業成績）', `<table class="fin">${tableHead}${rows}</table>`);
        }
    }
    
    let intlTable = '';
    if(S.intlCount > 0) { 
        const IS = S.intlStat;
        if(S.pos === 'P' || S.pos === 'TW') { 
            const era = IS.IP > 0 ? (IS.ER * 9 / IS.IP).toFixed(2) : '-';
            intlTable = `<h4 style="margin:12px 0 4px">國際賽生涯（中華隊 ${S.intlCount} 屆）</h4><table class="st"><tr><th>出賽</th><th>局數</th><th>勝</th><th>救援</th><th>三振</th><th>ERA</th></tr><tr><td>${IS.G}</td><td>${fmtIP(IS.IP)}</td><td>${IS.W}</td><td>${IS.SV}</td><td>${IS.SO}</td><td>${era}</td></tr></table>`;
        } else { 
            const avg = IS.AB > 0 ? (IS.H / IS.AB).toFixed(3).replace(/^0/, '') : '-';
            intlTable = `<h4 style="margin:12px 0 4px">國際賽生涯（中華隊 ${S.intlCount} 屆）</h4><table class="st"><tr><th>出賽</th><th>打席</th><th>打擊率</th><th>安打</th><th>全壘打</th><th>打點</th></tr><tr><td>${IS.G}</td><td>${IS.PA}</td><td>${avg}</td><td>${IS.H}</td><td>${IS.HR}</td><td>${IS.RBI}</td></tr></table>`;
        }
    }
    
    card('', '生涯累積數據', (tables || '<p>（無職業層級出賽紀錄）</p>') + intlTable);
    if(evals.length) card('gold', '生涯評價', evals.join('<br>'));
    
    let honorsHTML = '（生涯未獲得任何獎項）';
    if(S.honors.length) {
        const awardMap = {};
        S.honors.forEach(h => {
           const parts = h.split(' ');
           if(parts.length >= 2) { 
               const yr = parts[0]; const awd = parts.slice(1).join(' '); 
               if(!awardMap[awd]) awardMap[awd] = []; awardMap[awd].push(yr); 
           } else { 
               if(!awardMap[h]) awardMap[h] = []; awardMap[h].push(''); 
           }
        });
        const honorsList = [];
        for(const awd in awardMap) { 
            const yrs = awardMap[awd]; 
            if(yrs[0] !== '') {
               let nums = yrs.map(Number).sort((a,b)=>a-b);
               let res = [], st = nums[0], ed = nums[0];
               for(let i=1; i<=nums.length; i++){
                   if(i < nums.length && nums[i] === ed+1) { ed = nums[i]; }
                   else {
                       if(ed - st >= 2) res.push(`${st}~${ed}`);
                       else if(ed - st === 1) res.push(`${st}、${ed}`);
                       else res.push(`${st}`);
                       if(i < nums.length) { st = nums[i]; ed = nums[i]; }
                   }
               }
               if(yrs.length > 1) honorsList.push(`· ${awd} *${yrs.length} (${res.join('、')})`);
               else honorsList.push(`· ${awd} (${res[0]})`);
            } else { 
                honorsList.push(`· ${awd}`); 
            } 
        }
        honorsHTML = honorsList.join('<br>');
    }
    card(S.honors.length ? 'gold' : '', '獎項與大賽成績', honorsHTML);
    
    const tr = [];
    [...TRAIT_KEYS.pos, ...TRAIT_KEYS.neg].forEach(k => { if(S.traits[k]) tr.push(`<span class="tag" style="${traitTagStyle(k)}">${traitName(k)}</span>`); });
    (S.removed || []).forEach(lbl => tr.push(`<span class="tag" style="text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a">${lbl}</span>`));
    
    const lv = S.love;
    const cur = lv.st === 'married' ? `老婆 ${lv.partner}（${lv.kids}）` : lv.st === 'dating' ? `交往中 ${lv.partner}（${lv.dyrs || 0} 年）` : lv.st === 'divorced' ? '離婚' : '未婚';
    const exStr = lv.exes.length ? `｜前妻 ${lv.exes.map(e => `${e.name}（${e.kids}）`).join('、')}` : '';
    const totKids = lv.kids + lv.exes.reduce((t,e) => t + e.kids, 0);
    
    card('', '生涯檔案', `隱藏素質：${tr.join(' ') || '（無）'}<br>家庭：${cur}${exStr}｜子女共 ${totKids} 人<br>國際賽出賽：${S.intlCount} 次｜生涯大傷：${S.bigInj} 次${(S.pos==='P'||S.pos==='TW')?`｜TJ 手術：${S.tjCount} 次`:''}<br>生涯總薪資：<b class="hl" style="font-size:18px">${fmtMoney(Math.round(S.salary))}</b> 台幣`);
    
    const pool = (typeof FAN !== 'undefined' && FAN[best]) ? FAN[best].slice() : ["感謝你的貢獻。"]; 
    const picks = [];
    while(picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    
    card('info', '球迷看板・引退串', picks.map(p => '「' + p.replace(/{n}/g, S.name) + '」').join('<br>'));
    
    const sh = document.createElement('div'); sh.className = 'card';
    sh.innerHTML = `<div class="title">分享這段生涯</div>
      <div class="row2" style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn main" id="sh-img" style="flex:1">📸 產生結算圖</button>
        <button class="btn" id="sh-url" style="flex:1">🔗 複製重播連結</button>
      </div><div id="sh-out" style="margin-top:8px"></div>`;
    $('log').appendChild(sh);
    sh.querySelector('#sh-img').onclick = () => shareImage(evals, sh.querySelector('#sh-out'));
    sh.querySelector('#sh-url').onclick = e => {
      const url = location.origin.startsWith('http') ? location.origin + location.pathname + '?seed=' + SEED : location.href.split('?')[0] + '?seed=' + SEED;
      const okmsg = () => { e.target.textContent = '✅ 已複製'; setTimeout(() => e.target.textContent = '🔗 複製重播連結', 1600); };
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(okmsg, () => prompt('手動複製連結：', url)); 
      else prompt('手動複製連結：', url);
    };
    
    choose('', [
      {t:'⚾ 開啟新的人生（新種子）', main:true, f:()=>{location.href = location.pathname;}},
      {t:'用同一個種子重來', s:'seed: ' + SEED, f:()=>{location.href = location.pathname + '?seed=' + SEED;}}
    ]);
    
    setTimeout(() => { 
        try {
            const heads = document.querySelectorAll('.yr-head');
            for(const h of heads) { if(h.textContent === '生涯終幕') { h.scrollIntoView({behavior:'auto', block:'start'}); break; } }
        } catch(e) {} 
    }, 250);
}

function shareImage(evals, out) {
    const isPit = S.pos === 'P' || S.pos === 'TW';
    const tiers = evals.map(t => t.replace(/<[^>]+>/g, ''));
    const keepTr = [...TRAIT_KEYS.pos, ...TRAIT_KEYS.neg].filter(k => S.traits[k]).map(k => ({label: traitName(k), key: k, neg: TRAIT_KEYS.neg.includes(k)}));
    const remTr = (S.removed || []).map(l => ({label: l, key: '', neg: false, rem: true}));
    const leagues = ['MLB','NPB','CPBL'].filter(b => S.stats[b]);
    
    const milestones = [];
    if(S.hofInfo && S.hofInfo.length) { S.hofInfo.forEach(h => { milestones.push(`${h.lg}名人堂 · 第${h.yr}年入選 ${h.pct}%`); }); }
    { let tH = 0, tHR = 0, tSB = 0, tW = 0, tSV = 0, tHLD = 0, tSO = 0;
      ['CPBL','NPB','MLB'].forEach(b => { const st = S.stats[b]; if(!st) return;
        tH += st.H || 0; tHR += st.HR || 0; tSB += st.SB || 0;
        tW += st.W || 0; tSV += st.SV || 0; tHLD += st.HLD || 0; tSO += st.SO || 0; });
      if(isPit) { if(tW > 0 || tSO > 0) milestones.push(`跨聯盟生涯 ${tW}勝 ${tSO}K ${tSV}救援 ${tHLD}中繼`); }
      else { if(tH > 0) milestones.push(`跨聯盟生涯 ${tHR}轟 ${tH}安 ${tSB}盜`); }
    }
    
    const honors = milestones.slice(); const aMap = {};
    S.honors.forEach(h => {
       const parts = h.split(' ');
       if(parts.length >= 2) { const yr = parts[0]; const awd = parts.slice(1).join(' '); if(!aMap[awd]) aMap[awd] = []; aMap[awd].push(yr); } else { if(!aMap[h]) aMap[h] = []; aMap[h].push(''); }
    });
    for(const awd in aMap) {
       const yrs = aMap[awd];
       if(yrs[0] !== '') {
         let nums = yrs.map(Number).sort((a,b)=>a-b); let res = [], st = nums[0], ed = nums[0];
         for(let i=1; i<=nums.length; i++){
           if(i < nums.length && nums[i] === ed+1) { ed = nums[i]; }
           else {
             if(ed - st >= 2) res.push(`${st}~${ed}`); else if(ed - st === 1) res.push(`${st}、${ed}`); else res.push(`${st}`);
             if(i < nums.length) { st = nums[i]; ed = nums[i]; }
           }
         }
         if(yrs.length > 1) honors.push(`${awd} *${yrs.length} (${res.join('、')})`); else honors.push(`${awd} (${res[0]})`);
       } else { honors.push(`${awd}`); }
    }
    
    const hist = S.log.slice(); const W = 920, PAD = 34, scale = 2;
    const cv = document.createElement('canvas'); const c = cv.getContext('2d'); c.font = '13px sans-serif';
    const _css = getComputedStyle(document.body), _tk = (n,fb) => ((_css.getPropertyValue(n) || '').trim() || fb);
    const C_BG = _tk('--bg','#0b1a12'), C_EDGE = _tk('--edge','#2b4a38'), C_DIM = _tk('--dim','#8fae9c'),
          C_ACC = _tk('--accent','#ffc95c'), C_TX = _tk('--text','#e8efe9'), C_GOOD = _tk('--good','#9fd8a8'),
          C_BAD = _tk('--bad','#ff8b7a'), C_P2 = _tk('--panel2','#173524');
          
    const colW = (W - PAD * 2) / 2, maxTextW = colW - 20;
    const honorBlocks = honors.map(h => {
      let text = '· ' + h; let lines = []; let curr = '';
      for(let i=0; i<text.length; i++) {
        let test = curr + text[i];
        if(c.measureText(test).width > maxTextW && curr.length > 0) { lines.push(curr); curr = '  ' + text[i]; } else { curr = test; }
      }
      if(curr) lines.push(curr); return lines;
    });
    
    const rows2 = Math.ceil(honorBlocks.length / 2);
    let leftH = 0, rightH = 0;
    honorBlocks.slice(0, rows2).forEach(b => leftH += b.length * 23);
    honorBlocks.slice(rows2).forEach(b => rightH += b.length * 23);
    const honorsTotalHeight = Math.max(leftH, rightH);
    
    let H = 150; H += 30 + tiers.length * 24 + 14;
    if(keepTr.length || remTr.length) H += 54;
    H += 34 + (leagues.length + 1) * 26 + 16;
    if(S.intlCount > 0) H += 30 + 24 + 28 + 12;
    H += 30 + honorsTotalHeight + 16;
    
    const amaLogs = hist.filter(r => !r.st); const proLogs = hist.filter(r => r.st);
    if(amaLogs.length > 0) H += 34 + amaLogs.length * 20 + 24;
    if(proLogs.length > 0) H += 34 + proLogs.length * 20 + 24;
    
    H += 70;
    cv.width = W * scale; cv.height = H * scale; c.scale(scale, scale);
    c.fillStyle = C_BG; c.fillRect(0, 0, W, H); c.strokeStyle = C_EDGE; c.lineWidth = 3; c.strokeRect(10, 10, W - 20, H - 20); c.textBaseline = 'top';
    
    c.fillStyle = C_DIM; c.font = '13px sans-serif'; c.fillText('S i m B a s e b a l l ・ 引 退 紀 念', PAD, 30);
    c.fillStyle = C_ACC; c.font = 'bold 36px sans-serif'; c.fillText(S.name, PAD, 52);
    c.fillStyle = C_TX; c.font = '15px sans-serif';
    c.fillText(`${typeof primaryPos === 'function' ? primaryPos() : S.pos}｜${playerType()}｜${hist.length ? hist[0].y : '?'}–${S.year}｜引退時 ${S.age} 歲${isPit && S.tjCount ? `｜TJ×${S.tjCount}` : ''}`, PAD, 98);
    
    let y = 126;
    function tagColor(o) {
      if(o.rem) return {bg:'#242424', bd:'#4a4a4a', fg:'#8a8a8a'};
      if(o.key === 'legend' || o.key === 'taiwan') return {bg:'#3a2c05', bd:'#ffc95c', fg:'#ffe08a'};
      if(o.key === 'goldcloth') return {bg:'#3a3505', bd:'#e8d43a', fg:'#fff35a'};
      if(o.key === 'mrteam') return typeof teamChip === 'function' ? teamChip(TEAM_COLOR[S.mrTeamName] || '#ffc95c') : {bg:'#333',bd:'#999',fg:'#fff'};
      if(o.key === 'genius') return {bg:'#232733', bd:'#c8d0e0', fg:'#e8eef7'};
      if(o.neg) return {bg:'#2a0f0f', bd:'#c0392b', fg:'#ff8b7a'};
      return {bg: C_P2, bd: C_EDGE, fg: C_GOOD};
    }
    function drawTags(items) { 
      items.forEach(function(o) { 
        const t = o.label, col = tagColor(o); 
        c.font = '12px sans-serif'; const w = c.measureText(t).width + 16; 
        c.fillStyle = col.bg; c.strokeStyle = col.bd; c.lineWidth = 1; 
        c.fillRect(tagx, y, w, 20); c.strokeRect(tagx, y, w, 20); 
        c.fillStyle = col.fg; c.fillText(t, tagx + 8, y + 3); 
        if(o.rem) { c.strokeStyle = '#8a8a8a'; c.beginPath(); c.moveTo(tagx + 4, y + 10); c.lineTo(tagx + w - 4, y + 10); c.stroke(); } 
        tagx += w + 8; if(tagx > W - 160) { tagx = PAD; y += 26; } 
      }); 
    }
    var tagx = PAD; if(keepTr.length || remTr.length) { drawTags(keepTr.concat(remTr)); y += 30; }
    
    function hr() { c.strokeStyle = C_EDGE; c.lineWidth = 1; c.beginPath(); c.moveTo(PAD, y); c.lineTo(W - PAD, y); c.stroke(); y += 12; }
    function sectionTitle(t) { c.fillStyle = C_DIM; c.font = 'bold 13px sans-serif'; c.fillText(t, PAD, y); y += 22; }
    
    hr(); sectionTitle('生涯評價');
    c.font = 'bold 16px sans-serif'; c.fillStyle = C_ACC;
    tiers.forEach(function(t) { c.fillText('★ ' + t, PAD, y); y += 24; }); y += 6;
    
    hr(); sectionTitle('生涯累積數據');
    const cols = isPit ? [['League',90],['Yrs',36],['G',48],['IP',54],['W',36],['L',36],['SV',48],['HLD',48],['SO',52],['BB',48],['ERA',52],['WHIP',54]] : [['League',80],['Yrs',34],['G',40],['PA',46],['AVG',48],['OBP',48],['SLG',48],['OPS',48],['H',44],['HR',38],['RBI',44],['SB',40],['DEF',40]];
    function row(cells, head) { 
      let x = PAD; c.font = (head ? 'bold ' : '') + '13px monospace'; c.fillStyle = head ? C_DIM : C_TX; 
      cells.forEach(function(cell, i) { c.fillText(String(cell), x, y); x += cols[i][1]; }); y += head ? 24 : 26; 
    }
    row(cols.map(cc => cc[0]), true);
    leagues.forEach(function(b) { 
      const st = S.stats[b];
      if(isPit) { 
        const era = st.IP > 0 ? (st.ER * 9 / st.IP).toFixed(2) : '-'; 
        const whip = st.IP > 0 ? ((st.H + st.BB) / st.IP).toFixed(2) : '-'; 
        row([LG_N[b], st.yr, st.G, fmtIP(st.IP), st.W, st.L, st.SV || 0, st.HLD || 0, st.SO, st.BB || 0, era, whip]); 
      } else { 
        const obpN = st.PA > 0 ? (st.H + st.BB) / st.PA : 0; const slgN = typeof slgOf === 'function' ? slgOf(st) : 0; 
        const avg = st.AB > 0 ? (st.H / st.AB).toFixed(3).replace(/^0/, '') : '-'; 
        const obp = st.PA > 0 ? obpN.toFixed(3).replace(/^0/, '') : '-'; 
        const slg = st.AB > 0 ? slgN.toFixed(3).replace(/^0/, '') : '-'; 
        const ops = st.AB > 0 ? (obpN + slgN).toFixed(3).replace(/^0/, '') : '-'; 
        row([LG_N[b], st.yr, st.G, st.PA, avg, obp, slg, ops, st.H, st.HR, st.RBI, st.SB, (st.DEF > 0 ? '+' : '') + (st.DEF || 0)]); 
      } 
    });
    y += 6;
    
    if(S.intlCount > 0) { 
      const IS = S.intlStat; hr(); sectionTitle('國際賽生涯（中華隊 ' + S.intlCount + ' 屆）');
      const rowIntl = (cells, head) => { 
        let x = PAD; c.font = (head ? 'bold ' : '') + '13px monospace'; c.fillStyle = head ? C_DIM : C_TX; 
        cells.forEach(function(cell, i) { c.fillText(String(cell), x, y); x += ic[i][1]; }); y += head ? 24 : 28; 
      };
      var ic;
      if(isPit) { 
        const era = IS.IP > 0 ? (IS.ER * 9 / IS.IP).toFixed(2) : '-'; 
        ic = [['',110],['G',80],['IP',86],['W',60],['SV',72],['SO',80],['ERA',80]]; 
        rowIntl(['', 'G', 'IP', 'W', 'SV', 'SO', 'ERA'], true); 
        rowIntl(['', IS.G, fmtIP(IS.IP), IS.W, IS.SV, IS.SO, era], false); 
      } else { 
        const avg = IS.AB > 0 ? (IS.H / IS.AB).toFixed(3).replace(/^0/, '') : '-'; 
        ic = [['',110],['G',76],['PA',76],['AVG',76],['H',72],['HR',60],['RBI',72]]; 
        rowIntl(['', 'G', 'PA', 'AVG', 'H', 'HR', 'RBI'], true); 
        rowIntl(['', IS.G, IS.PA, avg, IS.H, IS.HR, IS.RBI], false); 
      }
      y += 6; 
    }
    
    hr(); sectionTitle('生涯榮譽（' + honors.length + ' 項）'); c.font = '13px sans-serif'; c.fillStyle = C_GOOD;
    let startY = y; let currY = startY;
    honorBlocks.forEach(function(b, i) { 
      const isRightCol = i >= rows2; if(i === rows2) currY = startY; 
      const hx = PAD + (isRightCol ? colW : 0); 
      b.forEach(line => { c.fillText(line, hx, currY); currY += 23; }); 
    });
    y += honorsTotalHeight + 8;
    
    if(amaLogs.length > 0) { 
      hr(); sectionTitle('生涯年表（業餘成績）'); 
      const hc = [['年',48],['齡',40],['球隊',150],['成績',W - PAD * 2 - 238]]; 
      let x = PAD; c.font = 'bold 12px monospace'; c.fillStyle = C_DIM; 
      hc.forEach(function(h) { c.fillText(h[0], x, y); x += h[1]; }); y += 20; 
      c.font = '11px monospace'; 
      amaLogs.forEach(function(r) { 
        x = PAD; c.fillStyle = r.inj ? C_BAD : C_TX; 
        const cells = [String(r.y), String(r.age), r.tm, r.line]; 
        cells.forEach(function(cell, i) { 
          let t = String(cell); const maxw = hc[i][1] - 8; 
          while(c.measureText(t).width > maxw && t.length > 1) t = t.slice(0, -1); 
          c.fillText(t, x, y); x += hc[i][1]; 
        }); 
        y += 20; 
      }); 
      y += 4; 
    }
    
    if(proLogs.length > 0) { 
      hr(); sectionTitle('生涯年表（職業成績）'); 
      const hc = isPit ? [['年',46],['齡',36],['球隊',124],['G',45],['IP',55],['W',36],['L',36],['SV',42],['HLD',42],['SO',46],['BB',46],['ERA',52],['WHIP',54]] : [['年',46],['齡',34],['球隊',120],['G',36],['PA',42],['AVG',46],['OBP',46],['SLG',46],['OPS',46],['H',40],['HR',36],['RBI',40],['SB',36],['DEF',40]]; 
      let x = PAD; c.font = 'bold 12px monospace'; c.fillStyle = C_DIM; 
      hc.forEach(function(h) { c.fillText(h[0], x, y); x += h[1]; }); y += 20; 
      c.font = '12px monospace'; 
      proLogs.forEach(function(r) { 
        x = PAD; c.fillStyle = r.inj ? C_BAD : C_TX; const tmS = r.tm; 
        const s = r.st || {G:0, PA:0, AB:0, H:0, HR:0, RBI:0, SB:0, BB:0, W:0, L:0, SV:0, HLD:0, IP:0, SO:0, ER:0, avg:0, era:0, WHIP:0, DEF:0}; 
        let cells = [];
        if(isPit) { 
          const era = s.IP > 0 ? (s.ER * 9 / s.IP).toFixed(2) : '-'; 
          const whip = s.IP > 0 ? ((s.H + s.BB) / s.IP).toFixed(2) : '-'; 
          cells = [String(r.y), String(r.age), tmS, String(s.G), fmtIP(s.IP), String(s.W), String(s.L), String(s.SV || 0), String(s.HLD || 0), String(s.SO), String(s.BB || 0), era, whip]; 
        } else { 
          const obpN = s.PA > 0 ? (s.H + s.BB) / s.PA : 0; const slgN = typeof slgOf === 'function' ? slgOf(s) : 0; 
          const avg = s.AB > 0 ? (s.H / s.AB).toFixed(3).replace(/^0/, '') : '-'; 
          const obp = s.PA > 0 ? obpN.toFixed(3).replace(/^0/, '') : '-'; 
          const slg = s.AB > 0 ? slgN.toFixed(3).replace(/^0/, '') : '-'; 
          const ops = s.AB > 0 ? (obpN + slgN).toFixed(3).replace(/^0/, '') : '-'; 
          cells = [String(r.y), String(r.age), tmS + (r.p ? '·' + r.p : ''), String(s.G), String(s.PA), avg, obp, slg, ops, String(s.H), String(s.HR), String(s.RBI), String(s.SB), String(s.DEF > 0 ? '+' + s.DEF : s.DEF || 0)]; 
        }
        cells.forEach(function(cell, i) { 
          let t = String(cell); const maxw = hc[i][1] - 8; 
          while(c.measureText(t).width > maxw && t.length > 1) t = t.slice(0, -1); 
          c.fillText(t, x, y); x += hc[i][1]; 
        }); 
        y += 20; 
      }); 
      y += 4; 
    }
    
    c.fillStyle = C_ACC; c.font = 'bold 16px sans-serif'; c.fillText('生涯總薪資 ' + fmtMoney(Math.round(S.salary)) + ' 台幣', PAD, y); y += 26;
    c.fillStyle = C_DIM; c.font = '11px monospace'; c.fillText('seed: ' + SEED, PAD, H - 40); c.textAlign = 'right'; c.fillText(typeof APP_VER !== 'undefined' ? APP_VER : 'v1.5.0', W - PAD, H - 40); c.textAlign = 'left';
    
    const url = cv.toDataURL('image/png'); const fileName = '棒球生涯結算_' + S.name + '.png';
    out.innerHTML = `<img src="${url}" style="width:100%;border-radius:8px" alt="結算圖"><div style="display:flex;gap:8px;margin-top:8px"><button class="btn main" id="sh-save" style="flex:1">💾 儲存 / 分享圖片</button><button class="btn" id="sh-dl" style="flex:1">下載到裝置</button></div><div class="statline" style="margin-top:6px">若按鈕無效，長按上方圖片也可儲存</div>`;
    out.querySelector('#sh-dl').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); };
    out.querySelector('#sh-save').onclick = async () => {
      try { const blob = await (await fetch(url)).blob(); const file = new File([blob], fileName, {type:'image/png'});
        if(navigator.canShare && navigator.canShare({files:[file]})) { await navigator.share({files:[file], title:'棒球生涯結算', text:S.name+' 的棒球人生'}); return; }
      } catch(e) { if(e && e.name === 'AbortError') return; }
      const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    };
}

// ==================== 初始化 UI 綁定 ====================

let selPos = 'P';
if(document.getElementById('seed-show')) {
    document.getElementById('seed-show').value = SEED;
    document.getElementById('seed-re').onclick = e => { e.preventDefault(); SEED = Math.random().toString(36).slice(2,10); document.getElementById('seed-show').value = SEED; };
}

document.querySelectorAll('#seg-pos button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#seg-pos button').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); selPos = b.dataset.v;
});

function initGame(region) {
    const defName = (selPos === 'P' || selPos === 'TW') ? '有有子' : (selPos === 'IF') ? '抹茶多' : ['黃鎖頭','藥帝士'][Math.floor(Math.random()*2)];
    const inName = document.getElementById('in-name');
    const nm = (inName && inName.value.trim()) || defName;
    const svInput = document.getElementById('seed-show');
    const sv = svInput ? svInput.value.trim() : ''; 
    if(sv) SEED = sv;
    history.replaceState(null, '', '?seed=' + encodeURIComponent(SEED));
    
    seedInit(SEED); 
    S = newState(nm, selPos, null);
    
    S.hsRegion = region;
    if(region === 'JP') { S.team = pick(['大阪桐蔭', '智辯和歌山', '仙台育英', '橫濱高校', '東海大相模']); }
    
    S.teamName = function() {
        if(!this.orgTeam) return ''; if(this.lv === 'MLB') return this.orgTeam;
        if(LV[this.lv] && LV[this.lv].org === 'MiLB') return this.orgTeam + ({R:'新人聯盟', A1:'1A', A2:'2A', A3:'3A'}[this.lv]);
        if(this.lv === 'CPBL1' || this.lv === 'NPB1') return this.orgTeam;
        return this.orgTeam + '二軍';
    };
    
    const startDiv = document.getElementById('start'); if(startDiv) startDiv.style.display = 'none';
    const boardDiv = document.getElementById('board'); if(boardDiv) boardDiv.style.display = ''; 
    const actDiv = document.getElementById('act'); if(actDiv) actDiv.style.display = '';
    
    TL = []; renderTimeline(); const ts = $('tl-seed'); if(ts) ts.textContent = SEED;
    
    const loc = region === 'JP' ? '日本' : '台灣';
    card('info', '球員誕生', `${S.year} 年春天，${POSN[S.pos]} <b class="hl">${S.name}</b> 加入了 <b class="hl">${S.team}</b> 棒球隊，開始了在${loc}的訓練。三年後的路，要自己選。<br><span style="color:var(--dim);font-size:12px">提示：22 歲前累積擲出 5 次「6」可覺醒隱藏素質。</span>`);
    startYear();
}

const btnStart = document.getElementById('btn-start'); if(btnStart) btnStart.onclick = () => initGame('TW');
const btnStartJp = document.getElementById('btn-start-jp'); if(btnStartJp) btnStartJp.onclick = () => initGame('JP');
