// ==================== 事件卡與人生事件系統 ====================
function evOdds() {
    let base = (S.traits.genius || S.traits.late || S.traits.clutch) ? 70 : 50;
    if(S.traits.thief) base -= 10;
    const boldPen = S.traits.clutch ? 0 : 15;
    return {safe: Math.min(95, base + 20), norm: base, bold: base - boldPen};
}

function drawEvents(n, done) {
    if(n <= 0) { done(); return; }
    choose('', [{t:`抽事件卡（剩 ${n} 張）`, main:true, f:() => {
        const pool = EVENTS.filter(e => e.for === '*' || (e.for === 'P' && (S.pos === 'P' || S.pos === 'TW')) || ((e.for === 'A' || e.for === 'B') && S.pos !== 'P') || (e.for === 'PRO' && S.stage === 'PRO'));
        const ev = pick(pool);
        const od = evOdds();
        const after = () => { board(1); drawEvents(n - 1, done); };
        choose(`事件｜${ev.n} — 你要怎麼應對？`, [
            {t:'全力一搏', warn:true, s:`成功率 ${od.bold}%｜${S.traits.clutch ? '成功 +4／失敗僅 −2' : '加成／減益幅度最大（±3）'}`, f:()=>{resolveEvent(ev, 'bold', after);}},
            {t:'照常執行', main:true, s:`成功率 ${od.norm}%｜標準幅度（±2）`, f:()=>{resolveEvent(ev, 'norm', after);}},
            {t:'保守應對', s:`成功率 ${od.safe}%｜加成／減益幅度最小（±1）`, f:()=>{resolveEvent(ev, 'safe', after);}}
        ]);
    }}]);
}

let CHEER = ['林曉晴','陳若彤','張沛慈','王詠恩','許昀熙','蘇采蓁','周依潔','郭芷萱'];
const CHEER_DEFAULT = CHEER.slice();
let CHEER_SAFE = ['馮海莎']; 

function datePool() { 
    if(CHEER_SAFE.length >= CHEER.length) return CHEER_SAFE.slice(); 
    return CHEER_SAFE.concat(CHEER.slice(CHEER_SAFE.length)); 
}
function affairPool() { return CHEER.slice(); }

function loveEvent(next) {
    const L = S.love;
    if(S.stage !== 'PRO' || S.age < 20) { next(); return; }
    
    if(L.st === 'dating') {
        L.dyrs = (L.dyrs || 0) + 1;
        const y = L.dyrs;
        const cheatPen = (L.cheatYr === S.year - 1 || L.cheatYr === S.year) ? 30 : 0;
        const bkP = (y >= 4 ? 20 + (y - 4) * 15 : 0) + cheatPen;
        
        if(bkP > 0 && chance(bkP)) {
            const k1 = pick(POS_AB[S.pos]), k2 = pick(POS_AB[S.pos]);
            const g1 = addAb(k1, -3), g2 = addAb(k2, -3); board(1);
            const ex = L.partner; L.st = L.exes.length ? 'divorced' : 'single'; L.partner = null; L.dyrs = 0;
            card('bad', '分手', `${cheatPen ? '那晚的事她其實都知道。' : ''}交往 ${y} 年，婚期一延再延。<b class="hl">${ex}</b> 最後留下一句：「我等不到了。」轉身離開。整個休賽季你魂不守舍——<b class="dn">${ABL[k1]} ${g1}、${ABL[k2]} ${g2}</b>。`);
            next(); return; 
        }
        
        const ask = () => proposalAsk(next);
        if(chance(30)) {
            const r = R() * 100;
            if(r < 40) { 
                const t = pick(affairPool().filter(n => n !== L.partner));
                choose(`聚餐散場，${t} 說順路想搭你的車`, [
                    {t:'讓她上車（賭一把）', warn:true, s:'沒被抓到＝體力提升｜被抓到＝能力下跌、當年分手率+30%', f:()=>{
                        L.affairs++;
                        if(chance(55)) { const gt = loveGainTxt('sta', 2); board(1); card('bad', '深夜兜風', `沒有人拍到。你把方向盤握得很緊——${gt}。`); ask(); }
                        else loveCaughtDating(next); 
                    }},
                    {t:`「不順路。」直接載 ${L.partner} 回家`, main:true, s:'感情穩固，絕對不虧', f:()=>{
                        const gt = loveGainTxt('sta', 1); board(1);
                        card('good', '正確答案', `你傳訊息給 ${L.partner}：「馬上到。」——${gt}。`); ask(); 
                    }}
                ]); 
                return; 
            }
            if(r < 70) { 
                const gt = loveGainTxt('sta', 1); board(1);
                card('good', '明星賽放閃', `明星賽表演賽，鏡頭掃到看台上的 <b class="hl">${L.partner}</b>，你隔著全場比了一個手勢，轉播單位立刻切出愛心特效——${gt}。`); 
                ask(); return; 
            }
            const gt = loveGainTxt('sta', 1); board(1);
            card('good', '愛情長跑', `交往邁入第 ${y} 年。沒有大新聞，只有機場出口那杯她替你買好的熱美式——${gt}。`); 
            ask(); return; 
        }
        ask(); return;
    }
    
    const fire = (L.st === 'married' && L.kids === 0) ? 40 : (L.st === 'single' || L.st === 'divorced') ? 40 : 30;
    if(!chance(fire)) { next(); return; }
    
    if(L.st === 'single' || L.st === 'divorced') {
        const p = pick(datePool());
        card('info', '場外話題', `你和啦啦隊女神 <b class="hl">${p}</b> 被拍到球場外同框，緋聞登上娛樂版頭條。${L.exes.length ? '（評論區：「離過婚還這麼搶手」）' : ''}`);
        choose('記者把麥克風遞到你面前：「兩位是在交往嗎？」', [
            {t:'大方承認：「請大家祝福我們」', s:'還要看她那邊敢不敢承認', f:()=>{
                if(chance(65)) { 
                    L.st = 'dating'; L.partner = p; L.dyrs = 0; L.datedTimes = (L.datedTimes || 0) + 1;
                    const gt = loveGainTxt('sta', 1); board(1);
                    card('gold', '戀情公開', `<b class="hl">${p}</b> 在社群發出十指緊扣的照片：「謝謝大家的祝福。」——${gt}。你們正式交往了。`);
                    if(L.datedTimes >= 3 && L.kids === 0 && !S.traits.married && !S.traits.confidante) { 
                        S.traits.confidante = true; 
                        card('gold', '隱藏稱號：閨中密友', '第三段戀情，還是走到了同樣的結局。「我愛上了你，你卻只把我當好姊妹。」'); board(1); 
                    }
                } else { 
                    card('bad', '單方面承認', `她隔天透過經紀公司否認：「只是普通朋友。」據傳啦啦隊<b class="dn">禁愛令</b>壓力不小。你一個人站在風裡，超級尷尬。`); 
                }
                next(); 
            }},
            {t:'笑而不答，快步走過', main:true, s:'不承認就沒有下文', f:()=>{
                card('info', '未完待續', '緋聞燒了三天就退燒。也許時機還沒到。'); next(); 
            }}
        ]); 
        return;
    }
    
    if(L.kids < 4 && chance([65, 45, 30, 20][L.kids])) {
        L.kids++; const kk = pick(POS_AB[S.pos]); const gt = loveGainTxt(kk, 2); board(1);
        card('gold', '新生命', `${L.partner} 平安生下你們的第 <b class="hl">${L.kids}</b> 個孩子——${gt}。`);
        next(); return;
    }
    
    const r = R() * 100;
    if(r < 40) {
        const t = pick(affairPool().filter(n => n !== L.partner));
        choose(`客場飯店酒吧，${t} 傳來訊息：「睡了嗎？」`, [
            {t:'赴約（賭一把）', warn:true, s:'沒被抓到＝體力提升｜被抓到＝能力下跌、婚姻危機', f:()=>{
                L.affairs++;
                if(chance(55)) { 
                    const gt = loveGainTxt('sta', 2); board(1);
                    card('bad', '深夜行程', `你僥倖沒被拍到。罪惡感反而讓你精神亢奮——${gt}。`);
                    next(); 
                } else loveCaught(next); 
            }},
            {t:'回訊息：「陪小孩讀完故事書了，晚安」', main:true, s:'家庭和睦，絕對不虧', f:()=>{
                const gt = loveGainTxt('sta', 1); board(1);
                card('good', '家的方向', `你把手機扣在桌上，撥了視訊回家。心定了，身體就穩了——${gt}。`); next(); 
            }}
        ]); 
        return; 
    }
    
    if(r < 70 && L.kids > 0) {
        const gt = loveGainTxt('sta', 1); board(1);
        card('good', '球場邊的父親', `你被拍到賽前隔著護網教孩子怎麼戴手套，影片配文「最強棒球教室」瘋傳——${gt}。`); next(); return; 
    }
    
    const gt = loveGainTxt('sta', 1); board(1);
    card('good', '結婚紀念日', `結婚紀念日，你推掉了紀念訓練，陪 <b class="hl">${L.partner}</b> 回到當年辦婚禮的場地——${gt}。`); next();
}

function divorceRec() { 
    const L = S.love; 
    L.exes.push({name: L.partner, kids: L.kids}); 
    L.st = 'divorced'; L.partner = null; L.kids = 0; 
}

function loveCaught(next) {
    const L = S.love; L.caught++;
    const kk = pick(POS_AB[S.pos]); const g = addAb(kk, -3);
    let extra = '';
    if(L.caught >= 2) {
        if(!S.traits.scum) { 
            S.traits.scum = true; 
            card('bad', '隱藏屬性解鎖：渣男', '第二次被逮個正著。從今以後你在球迷心中的形象定型了——<b class="dn">每次外遇被抓到，全能力 −5</b>。'); 
        }
        POS_AB[S.pos].forEach(k => { S.ab[k] = clamp(S.ab[k]-5, 1, 80); }); 
        extra = '<b class="dn">全能力 −5</b>（渣男的代價）。'; 
    }
    board(1);
    card('bad', '頭版醜聞', `狗仔的鏡頭比你想的更快，照片鋪滿版面。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
    choose(`${L.partner} 把離婚協議書放在餐桌上`, [
        {t:'跪著道歉，求她再給一次機會', s:'成功保住婚姻｜失敗＝再扣能力並離婚', f:()=>{
            if(chance(40)) { card('info', '低谷之後', `長談了一整夜。<b class="hl">${L.partner}</b> 最後說：「為了孩子——最後一次。」婚姻保住了。`); next(); }
            else { const k2 = pick(POS_AB[S.pos]); const g2 = addAb(k2, -2); const ex = L.partner; divorceRec(); board(1); card('bad', '道歉無效', `她聽完只是搖頭。<b class="hl">${ex}</b> 正式與你離婚——<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } 
        }},
        {t:'簽字離婚', f:()=>{ const ex = L.partner; divorceRec(); card('bad', '離婚', `你在協議書上簽了名。<b class="hl">${ex}</b> 的聲明只有一句：「祝彼此安好。」`); next(); }}
    ]);
}

function proposalAsk(next) {
    const L = S.love; if(L.st !== 'dating') { next(); return; }
    choose(`交往第 ${L.dyrs} 年——${L.partner} 看著別人的婚禮影片看了很久`, [
        {t:'就是現在——求婚', s:'固定加成：全體力提升、本季更不容易受傷', f:()=>{ 
            L.st = 'married'; L.kids = 0; L.dyrs = 0; 
            const gTxt = loveGainTxt('sta', 2) + '、'; S.tmpInj -= 5; board(1); 
            card('gold', '婚禮', `你在主場本壘板後方單膝跪地。<b class="hl">${L.partner}</b> 哭著點頭。紅毯用壘包排成——${gTxt}本季受傷機率 <b class="up">−5%</b>。`); next(); 
        }},
        {t:'再存一點錢吧', main:true, s:'她沒說什麼,但交往越久分手風險越高', f:()=>{ card('info', '再等等', '她關掉影片，笑著說沒事。'); next(); }}
    ]);
}

function loveCaughtDating(next) {
    const L = S.love; L.caught++; L.cheatYr = S.year;
    const kk = pick(POS_AB[S.pos]); const g = addAb(kk, -3); let extra = '';
    if(L.caught >= 2) { 
        if(!S.traits.scum) { S.traits.scum = true; card('bad', '隱藏屬性解鎖：渣男', '第二次被逮個正著——<b class="dn">每次劈腿被抓到，全能力 −5</b>。'); }
        POS_AB[S.pos].forEach(k => { S.ab[k] = clamp(S.ab[k]-5, 1, 80); }); extra = '<b class="dn">全能力 −5</b>。'; 
    }
    board(1);
    card('bad', '劈腿曝光', `行車紀錄器畫面流出，時間軸對得整整齊齊。<b class="dn">${ABL[kk]} ${g}</b>。${extra}`);
    choose(`${L.partner} 已讀不回三天後，終於答應見面`, [
        {t:'道歉，求她再給一次機會', s:'成功保住感情', f:()=>{
            if(chance(40)) { card('info', '低谷之後', '她哭著罵完，最後說：「最後一次。」'); next(); }
            else { const k2 = pick(POS_AB[S.pos]); const g2 = addAb(k2, -2); const ex = L.partner; L.st = L.exes.length ? 'divorced' : 'single'; L.partner = null; L.dyrs = 0; board(1); card('bad', '道歉無效', `她把你送的東西整箱寄回。<b class="hl">${ex}</b> 封鎖了聯絡方式——<b class="dn">${ABL[k2]} ${g2}</b>。`); next(); } 
        }},
        {t:'坦然分手', f:()=>{ const ex = L.partner; L.st = L.exes.length ? 'divorced' : 'single'; L.partner = null; L.dyrs = 0; card('bad', '分手', `<b class="hl">${ex}</b> 的限時動態只有一片黑。`); next(); }}
    ]);
}

function loveGainTxt(k, amt) {
    const before = S.pendStat || 0; const g = addAbStat(k, amt); const over = (S.pendStat || 0) - before;
    if(g > 0 && over > 0) return `<b class="up">${ABL[k]} +${g}</b>（溢出 ${over} 點轉為本季成績加成）`;
    if(g > 0) return `<b class="up">${ABL[k]} +${g}</b>`;
    if(over > 0) return `<b class="up">本季成績加成 +${over}</b>（${ABL[k]} 已達潛力上限）`;
    return `${ABL[k]} 能力加點，但不足以提升一級`;
}

function addAbStat(k, amt) { 
    if(amt <= 0) return addAb(k, amt);
    const pk = (S.pot && S.pot[k]) || 62, isP = (S.pos === 'P' || S.pos === 'TW');
    let cur = S.ab[k], bud = amt, cr = (S.carry && S.carry[k]) || 0, gained = 0;
    if(cur >= pk) { S.pendStat = (S.pendStat || 0) + bud; return 0; }
    while(bud > 0 && cur < pk) {
        let c = isP ? (cur >= 66 ? 7 : cur >= 58 ? 4 : cur >= 50 ? 2 : 1) : (cur >= 72 ? 3 : cur >= 64 ? 2 : 1);
        bud--; cr++; if(cr >= c) { cr -= c; cur++; gained++; }
    }
    if(!S.carry) S.carry = {}; S.carry[k] = cr; S.ab[k] = cur;
    if(bud > 0) S.pendStat = (S.pendStat || 0) + bud;
    return gained;
}

function statBonus(pts, out) { S.pendStat = (S.pendStat || 0) + pts; out.push(`<span class="up">狀態火燙（本季成績加成 ×${pts}）</span>`); }

function resolveEvent(ev, mode, done) {
    done = done || function(){}; const od = evOdds();
    if(mode === 'safe') S.cntSave++; let good, tag;
    if(mode === 'safe') { good = chance(od.safe); tag = '保守應對'; }
    else if(mode === 'bold') { good = chance(od.bold); tag = '全力一搏'; if(good) S.cntBoldWin++; else S.cntBoldFail++; }
    else { good = chance(od.norm); tag = ''; }
    if(mode === 'safe' && good) S.cntSaveWin = (S.cntSaveWin || 0) + 1;
    if((ev.n === '宵夜文化' || ev.n === '場外代言邀約') && mode !== 'safe' && !good) S.cntSnack++;
    
    let mag = mode === 'safe' ? 1 : mode === 'bold' ? 3 : 2;
    if(mode === 'bold' && S.traits.clutch) mag = good ? 4 : 2;
    const fx = good ? ev.g : ev.b; let out = [], touched = false;
    
    const applyAbil = (k, dir) => {
        const step = dir * mag;
        if(dir > 0) {
            const pk = (S.pot && S.pot[k]) || 62, isP = (S.pos === 'P' || S.pos === 'TW');
            let cur = S.ab[k], bud = step, cr = (S.carry && S.carry[k]) || 0, gained = 0;
            if(cur >= pk) { statBonus(bud, out); } 
            else {
                while(bud > 0 && cur < pk) {
                    let c = isP ? (cur >= 66 ? 7 : cur >= 58 ? 4 : cur >= 50 ? 2 : 1) : (cur >= 72 ? 3 : cur >= 64 ? 2 : 1);
                    bud--; cr++; if(cr >= c) { cr -= c; cur++; gained++; }
                }
                if(!S.carry) S.carry = {}; S.carry[k] = cr; S.ab[k] = cur;
                if(gained > 0) out.push(`${ABL[k]} <span class="up">+${gained}</span>`);
                else if(bud <= 0) out.push(`${ABL[k]}：能力加點，但不足以提升一級`);
                if(bud > 0) statBonus(bud, out);
            }
            touched = true;
        } else { 
            const g = addAb(k, step); touched = true; out.push(`${ABL[k]} <span class="dn">${g}</span>`); 
        }
    };
    
    for(const k in fx) { 
        const dir = fx[k] > 0 ? 1 : -1;
        if(k === 'inj') { let v = ({1:8, 2:12, 3:16, 4:16})[mag]; if(mode === 'bold' && S.traits.clutch) v = 12; S.tmpInj += v; out.push(`本季受傷機率 <span class="dn">+${v}%</span>`); }
        else if(k === 'rand') { applyAbil(pick(POS_AB[S.pos]), dir); }
        else if(k in S.ab) { applyAbil(k, dir); } 
    }
    if(!touched) { applyAbil(pick(POS_AB[S.pos]), good ? 1 : -1); }
    
    card(good ? 'good' : 'bad', '事件卡｜' + ev.n + (tag ? `（${tag}）` : ''), `${good ? ev.gt : ev.bt}。${mode === 'bold' && good ? '<b class="hl">豪賭成功！</b>' : ''}${mode === 'bold' && !good ? '<b class="dn">豪賭失敗……</b>' : ''}<br>${out.join('｜') || '（能力加點，但不足以提升一級）'}`);
    checkTraitsMid(); done();
}

function allocDone(touched, isDice) {
    const keys = Object.keys(touched);
    if(isDice && S.stage !== 'HS' && keys.length) {
        const tot = Object.values(touched).reduce((a,b) => a+b, 0);
        let mk = keys[0]; keys.forEach(k => { if(touched[k] > touched[mk]) mk = k; });
        const focused = (touched[mk] / tot >= 0.75) ? mk : null;
        if(focused && focused === S.samePickKey) S.samePick++; 
        else if(focused) { S.samePickKey = focused; S.samePick = 1; } 
        else { S.samePickKey = null; S.samePick = 0; }
        
        if(S.samePick >= 3 && !S.traits.combo) { 
            S.traits.combo = true; S.samePickBonus = true; S.comboKey = S.samePickKey;
            traitCard('combo', '大巧不工', `連續三年，你把所有汗水都澆在同一個工具上——<b class="hl">季初系統會自動擲 1 顆骰，永遠加在你專精的「${ABL[S.comboKey]}」上</b>。`); 
        }
    }
    
    const gain = Object.values(touched).reduce((a,b) => a+b, 0);
    if(!S.traits.late && !S.traits.genius && ovr() < 47 && S.age >= 25 && S.age < 32 && isDice && gain >= 16) {
        S.traits.late = true; 
        const exDef = S.pos === 'C' ? ['rng','fld','arm','cat'] : [];
        const cands = POS_AB[S.pos].filter(k => S.ab[k] < 70 && !exDef.includes(k));
        for(let i = cands.length - 1; i > 0; i--) { const j = Math.floor(R()*(i+1)); const t = cands[i]; cands[i] = cands[j]; cands[j] = t; }
        const boost = cands.slice(0,2), bl = [];
        boost.forEach(k => { 
            S.pot[k] = Math.min(80, (S.pot[k] || 62) + 10); 
            S.ab[k] = clamp(S.ab[k] + 5, 1, 80); 
            bl.push(`${ABL[k]} <b class="up">+5</b>（潛力上限 +10 → ${S.pot[k]}）`); 
        });
        card('gold', '隱藏素質解鎖：大器晚成', `別人都以為你到頂了，你卻在這一年脫胎換骨——從今以後，每一顆訓練骰<b class="hl">永久固定 3 點以上</b>。` + (bl.length ? `潛能重新被評估：${bl.join('、')}。` : ''));
        board(1); 
    }
}

function checkTraitsMid() {
    if(!S.traits.disc && S.age < 25 && (S.cntSaveWin || 0) >= 15 && S.love.caught === 0 && S.cntSnack < 5) { 
        traitCard('disc', '自律狂', '你見過凌晨四點的洛杉磯嗎？——整條衰退曲線延後兩年，你的巔峰比同梯更長。'); 
    }
    if(!S.traits.clutch && S.age < 25 && S.cntBoldWin >= 7) { 
        traitCard('clutch', '大心臟', '經歷了無數次的豪賭，你的心態堅毅無比——<b class="hl">「全力一搏」成功率提升至天才級、成功加成 +4、失敗只 −2、受傷風險降級</b>。'); 
    }
    if(!S.traits.distract && !S.traits.disc && (S.love.affairs + S.love.caught + S.cntSnack) >= 4 && (S.love.affairs + S.love.caught) >= 1) { 
        traitCard('distract', '外務纏身', '通告、代言、社群媒體佔據了你太多心神——<b class="dn">季初擲骰永久 −1 顆</b>。', 'bad'); 
    }
    if(!S.traits.cancer && !S.traits.franchise && !S.traits.intlace && (S.cntBoldFail >= 10 || S.traits.scum)) { 
        traitCard('cancer', '更衣室毒瘤', '教練受夠了你的不可控，隊友對你的新聞指指點點——<b class="dn">季中被交易機率大增、續約條件惡化</b>。', 'bad'); 
    }
    if(!S.traits.leader && S.age >= 32 && S.teamYears >= 5 && !S.traits.cancer && (S.lastD || 0) >= -3) { 
        traitCard('leader', '休息室領袖', '歲月帶走了你的爆發力，但帶不走你的智慧——<b class="hl">提升球隊奪冠率，且母隊永遠願意為你留一個位置</b>。'); 
    }
}

function teamNick(team) { 
    const map = {
        '台中猛瑪':'猛瑪', '府城雄獅':'雄獅', '桃園金剛':'金剛', '新北騎士':'騎士', '台北恐龍':'恐龍', '高雄神鵰':'神鵰',
        '波士頓襪王':'紅襪王', '風城襪王':'白襪王', '東京大人':'東京大人', '灣區大人':'灣區大人',
        '競技者':'競技者', '沙漠眼鏡蛇':'眼鏡蛇'
    }; 
    return map[team] || (team || '').slice(-2); 
}

function teamChampRate(team) { 
    let h = 0; for(let i=0; i<team.length; i++) h = (h*31 + team.charCodeAt(i)) & 0xffff; 
    return Math.round(8 + (h % 22)); 
}

function faYears(d, cap) {
    const perf = Math.max(0, Math.min(1, (d + 2) / 8)); 
    const injPenalty = (S.bigInj || 0) * 0.12 + (S.tjCount || 0) * 0.15;
    let yrs = Math.round(2 + perf * (cap - 2) - injPenalty * cap);
    let ageCap = cap; 
    if(S.age >= 36) ageCap = 2; else if(S.age >= 34) ageCap = 3; else if(S.age >= 32) ageCap = 5; else if(S.age >= 30) ageCap = 8;
    yrs = Math.min(yrs, ageCap); 
    return Math.max(1, Math.min(cap, yrs));
}

function demotionAudit(cont) {
    if(!S.demotionRefused) { cont(); return; } 
    S.demotionRefused = false;
    const need = Math.round((S.ct && S.ct.mult ? S.ct.mult : 1) * 2) - 1;
    if((S.lastD || 0) >= need) {
        if(S.traits.cancer) { removeTrait('cancer', '更衣室毒瘤'); card('good', '用成績說話', '你用一整季的表現堵住了所有人的嘴——<b class="hl">更衣室毒瘤洗刷</b>。'); board(1); }
        else card('good', '守住身價', '你證明了自己還配得上這份合約。');
    } else {
        if(!S.traits.thief) { S.traits.thief = true; card('bad', '隱藏屬性解鎖：薪水小倫', '拒絕下放後成績依然沒有起色——<b class="dn">事件卡失敗率永久 +10%</b>。'); board(1); }
        else card('bad', '薪水小倫', '又是虛擲的一年。看台上的噓聲更大了。');
    } 
    cont();
}

function tradeCheck(cont) {
    if(S.stage !== 'PRO' || !LV[S.lv].top || S.seasonFactor <= 0) { cont(); return; }
    const star = ovr() >= LV[S.lv].par + 4; 
    let p = 15 + (S.tradeHeat || 0);
    if(S.traits.cancer) p += 25; 
    if(S.traits.ambience) p += 20;
    
    if(!chance(p)) { cont(); return; }
    if(S.traits.franchise || S.traits.mrteam) { 
        card('info', '非賣品', `他隊捧著誘人的包裹來詢價，高層連會議都沒開就回絕了——<b class="hl">「他是這座城市的象徵，非賣品。」</b>`); 
        board(1); cont(); return; 
    }
    
    if(star) {
        if(S.traits.cancer) { doTradeExec(); card('bad', '毒瘤交易', '球團受夠了休息室氣氛，直接把你打包送走。'); board(1); cont(); return; }
        choose('交易大限：他隊送來報價，球團徵詢你的否決權', [
            {t:'點頭同意，換個環境', main:true, f:()=>{ doTradeExec(); card('info', '轉隊', '你打包行李，前往新的城市。'); board(1); cont(); }},
            {t:'行使否決權，我要留下', warn:true, s:'未來 2 年冠軍機率略降、下張合約薪水 −15%', f:()=>{ S.tradeRefuse = 2; card('info', '否決交易', '你按下否決鍵。忠誠是一種選擇。'); board(1); cont(); }}
        ]);
        return;
    }
    
    choose('交易傳言：媒體報導你可能被交易', [
        {t:'公開抱怨表達不滿', warn:true, s:'增加本次被交易的可能性', f:()=>{ 
            S.complainCount = (S.complainCount || 0) + 1;
            if(S.complainCount >= 2 && !S.traits.ambience) { 
                S.traits.ambience = true; 
                card('bad', '隱藏屬性解鎖：氣氛大師', '你又一次對媒體大吐苦水——<b class="dn">往後轉隊機率永久提高</b>。'); board(1); 
            }
            if(chance(60)) { doTradeExec(); card('bad', '弄假成真', '你的抱怨上了頭條，球團順勢把你送走。'); board(1); } 
            else card('info', '雷聲大雨點小', '抱怨歸抱怨，這次交易最後沒有成局。'); 
            cont(); 
        }},
        {t:'保持沉默，專心打球', main:true, s:'交易機率不變', f:()=>{ 
            if(chance(35)) { doTradeExec(); card('info', '交易成局', '儘管你不動聲色，球團還是完成了這筆交易。'); board(1); } 
            else card('info', '留了下來', '傳言就是傳言。新球季你還是穿著同一件球衣。'); 
            cont(); 
        }}
    ]);
}

function doTradeExec() { 
    S.teamYears = 0; S.champThisTeam = false; S.champTeam = null; 
    const list = S.org === 'CPBL' ? CPBL_TEAMS : S.org === 'NPB' ? NPB_TEAMS : MLB_TEAMS; 
    const nt = pick(list.filter(t => t !== S.orgTeam)); 
    S.orgTeam = nt; tlNote(2, '轉隊 ' + nt); board(1); 
}

function portionOf(st, r) {
    const p = {...st}; 
    ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','SO','ER'].forEach(k => p[k] = Math.round(st[k] * r));
    p.IP = +(st.IP * r).toFixed(1); 
    p.avg = p.AB > 0 ? p.H / p.AB : 0; 
    p.era = p.IP > 0 ? p.ER * 9 / p.IP : 0; 
    return p;
}

// ==================== 業餘與國際賽 ====================
function amateurSeason() {
    if(S.seasonFactor === 0) { 
        card('bad', '', '整季只能在場邊看著隊友比賽。'); 
        S.log.push({y:S.year, age:S.age, tm:S.team || stageLabel(), line:'傷缺全季', inj:true}); 
        nextStep(); return; 
    }
    const cups = S.stage === 'HS' ? (S.hsRegion === 'JP' ? ['春季甲子園','夏季甲子園','秋季大會'] : HS_CUPS) 
               : S.stage === 'U' ? (S.hsRegion === 'JP' ? ['全日本大學野球錦標賽','明治神宮大會'] : U_CUPS) 
               : ['成棒甲組春季聯賽','成棒甲組秋季聯賽'];
    const thr = S.stage === 'HS' ? [52,46,40,34,28] : [60,54,48,42,36];
    let gain = 0, lines = [], plain = []; 
    const tB = S.stage === 'HS' ? ({1:6, 2:0, 3:-6})[S.hsTier || 2] : 0;
    
    cups.forEach(c => { 
        const pw = ovr() + tB + ri(-8,8);
        const i = pw >= thr[0] ? 0 : pw >= thr[1] ? 1 : pw >= thr[2] ? 2 : pw >= thr[3] ? 3 : pw >= thr[4] ? 4 : 5;
        const rk = ['冠軍','亞軍','四強','八強','十六強','預賽出局'][i];
        const pts = [7,5,4,3,2,1][i] + Math.floor(ovr()/22); 
        gain += pts; 
        lines.push(`${c}：<b class="hl">${rk}</b>（+${pts} 點）`); 
        plain.push(`${c}${rk}`);
        if(S.stage === 'U' && rk === '冠軍' && !S.traits.academy) { 
            S.traits.academy = true; 
            card('gold', '隱藏屬性解鎖：學院派', '大學殿堂的科學化訓練與防護打下扎實基礎——<b class="hl">25 歲前受傷率 −5%、季初擲骰期望值提升</b>。'); 
        }
        if(i === 0) S.honors.push(`${S.year} ${c}冠軍`); 
    });
    
    S.pool += gain; 
    S.log.push({y:S.year, age:S.age, tm:S.team || stageLabel(), line: plain.join('、'), inj: false});
    card('', '年度大賽', lines.join('<br>') + `<div class="statline">獲得能力點 ${gain} 點，季末統一分配。</div>`); 
    maybeIntl(() => nextStep());
}

function proSeason() {
    const st = simSeason(S.lv); S.lastSt = st; S.lastD = st.d;
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
        if(em !== 0) { st.d += em; st.era = clamp(st.era - em * 0.25, 1.40, 9.90); st.ER = Math.round(st.era * st.IP / 9); st.SO = Math.round(st.SO * (1 + em * 0.06)); } 
    }
    
    if(S.traits.onetool && S.seasonFactor > 0) { 
        const boost = 1.25; 
        ['G','PA','AB'].forEach(k => { if(typeof st[k] === 'number') st[k] = Math.round(st[k] * boost); });
        ['H','HR','RBI','SB','BB'].forEach(k => { if(typeof st[k] === 'number') st[k] = Math.round(st[k] * boost); });
        st.avg = st.AB > 0 ? st.H / st.AB : 0; 
    }
    
    const bucket = bucketOf(S.lv); accStat(bucket, st);
    
    if(S.seasonFactor === 0) { card('bad', '球季數據', '（傷缺，本季無出賽紀錄）'); }
    else if(S.tradeFrom) { 
        const r = 0.35 + R() * 0.3, p1 = portionOf(st, r), p2 = portionOf(st, 1 - r);
        card('', '球季數據（季中轉隊）', `<span class="tag">${S.tradeFrom}</span><div class="statline">${statLine(p1)}</div><span class="tag">${S.teamName()}</span><div class="statline">${statLine(p2)}</div><span class="tag">合計</span><div class="statline">${statLine(st)}</div>`); 
    }
    else { card('', '球季數據', `<span class="tag">${S.teamName()}${S.dpos ? '｜' + S.dpos : ''}</span><div class="statline">${statLine(st)}</div>`); }
    
    if(st.form === -1) { card('bad', '巨大的低潮', '身體狀況很好，但是成績一直打不出來，遇到了巨大的低潮。'); }
    else if(st.form === 1) { 
        if(S.pos === 'P') card('gold', '生涯年', '縫線掠過指尖的感覺無與倫比，而你投出去的球像是有了生命。');
        else card('gold', '生涯年', '投來的每顆球看起來都像籃球一樣大，球的轉動像駭客任務的子彈一樣慢了下來。'); 
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
    }
    else if(S.seasonFactor < 0.95) S.ironStreak = 0;
    
    if(S.pos !== 'P') { 
        const tg = toolGap(); 
        const projG = S.seasonFactor > 0 ? (st.G / S.seasonFactor) : 0;
        const isRegular = projG >= LV[S.lv].g * 0.60;
        
        if(!S.traits.onetool && !isRegular && tg.gap >= 22 && tg.val >= 58 && careerAllStars() < 4) { 
            S.traits.onetool = true; 
            const wasBefore = S.removed.includes('只會這個');
            S.removed = S.removed.filter(x => x !== '只會這個');
            const role = tg.role; S.toolRole = role;
            if(wasBefore || S.age >= 33) card('gold', '只會這個', `歲月帶走了你的其他工具，只剩<b class="hl">${role}</b>那一項本領還在。`, 'bad');
            else card('gold', '只會這個', `你只有一項武器強得誇張，其餘全是破洞。教練派你上去做一件事——你成了球隊的<b class="hl">${role}</b>。`, 'bad'); 
        }
        else if(S.traits.onetool && (tg.gap < 18 || isRegular)) { 
            removeTrait('onetool', '只會這個'); S.toolRole = null; 
            card('good', '不再是工具人', '教練終於敢把你放進先發打線——你是個完整的球員了。'); board(1); 
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
        if(chance(asP)) { S.stats[bucket].AS++; h.push(`${y} ${lgN}明星賽` + ((bucket === 'CPBL' && S.orgTeam === '台中猛瑪' && d < 2) ? '（人氣入選）' : '')); } 
    }
    
    const rookieOK = bucket !== 'CPBL' || !(S.stats.NPB || S.stats.MLB || S.stats.MINOR);
    if(S.stats[bucket].yr === 1 && rookieOK && st.d >= 4) { 
        const rkP = clamp(30 + (st.d - 4) * 15, 30, 95); 
        if(chance(rkP)) h.push(`${y} ${lgN}新人王`); 
    }
    
    const checkP = (pst) => {
        const aw = '年度最佳投手';
        if(isSP() && pst.era <= th.era[0] && pst.IP >= th.g) { 
            const god = pst.era <= th.era[1] && pst.IP >= 150; 
            const p = god ? 100 : clamp(30 + Math.round((th.era[0] - pst.era) * 35 + (pst.IP - th.g) * 0.4), 30, 95); 
            if(chance(p)) h.push(`${y} ${aw}`); 
        }
        if(S.role === 'CL' && pst.SV >= th.sv[0]) { 
            const god = pst.SV >= th.sv[1]; 
            const p = god ? 100 : clamp(28 + (pst.SV - th.sv[0]) * 5, 28, 95); 
            if(chance(p)) h.push(`${y} ${lgN}救援王`); 
        }
        if(S.role === 'MR' && (pst.HLD || 0) >= th.hld[0]) { 
            const god = (pst.HLD || 0) >= th.hld[1]; 
            const p = god ? 100 : clamp(28 + ((pst.HLD || 0) - th.hld[0]) * 4, 28, 95); 
            if(chance(p)) h.push(`${y} ${lgN}中繼王`); 
        }
        if(pst.SO >= th.so[0]) { 
            const god = pst.SO >= th.so[1]; 
            const p = god ? 100 : clamp(25 + Math.round((pst.SO - th.so[0]) * 1.2), 25, 95); 
            if(chance(p)) h.push(`${y} ${lgN}三振王`); 
        }
    };
    
    const checkB = (bst) => {
        if(bst.PA >= 350 && bst.avg >= th.avg[0]) { 
            const god = bst.avg >= th.avg[1]; 
            const p = god ? 100 : clamp(25 + Math.floor((bst.avg - th.avg[0]) / 0.005) * 6, 25, 95); 
            if(chance(p)) h.push(`${y} ${lgN}打擊王`); 
        }
        if(bst.PA >= 300 && bst.HR >= th.hr[0]) { 
            const god = bst.HR >= th.hr[1]; 
            const p = god ? 100 : clamp(25 + (bst.HR - th.hr[0]) * 5, 25, 95); 
            if(chance(p)) h.push(`${y} ${lgN}全壘打王`); 
        }
        if(bst.PA >= 300 && bst.SB >= 25) { 
            const god = bst.SB >= 45; 
            const p = god ? 100 : clamp(25 + (bst.SB - 25) * 4, 25, 95); 
            if(chance(p)) h.push(`${y} ${lgN}盜壘王`); 
        }
        if(bst.PA >= 300 && bst.RBI >= th.rbi[0]) { 
            const god = bst.RBI >= th.rbi[1]; 
            const p = god ? 100 : clamp(25 + (bst.RBI - th.rbi[0]) * 2, 25, 95); 
            if(chance(p)) h.push(`${y} ${lgN}打點王`); 
        }
        const obp = bst.PA > 0 ? (bst.H + bst.BB) / bst.PA : 0;
        if(bst.PA >= 350 && obp >= th.obp[0]) { 
            const god = obp >= th.obp[1]; 
            const p = god ? 100 : clamp(25 + Math.floor((obp - th.obp[0]) / 0.005) * 5, 25, 95); 
            if(chance(p)) h.push(`${y} ${lgN}上壘王`); 
        }
        const def1 = bst.DEF || 0;
        if(S.dpos !== 'DH' && S.seasonFactor >= 0.7) {
            if(def1 >= 6) { const pGlove = clamp(38 + (def1 - 6) * 5, 38, 95); if(chance(pGlove)) h.push(`${y} ${lgN}金手套`); }
            if(def1 >= 11) { const pDef = clamp(30 + (def1 - 11) * 6, 30, 95); if(chance(pDef)) h.push(`${y} ${lgN}守備王`); } 
        }
    };
    
    if (st.isTW) { checkP(st.pitch); checkB(st); } 
    else if (S.pos === 'P') { checkP(st); } 
    else { checkB(st); }
    
    const mvpQual = (S.pos === 'P' || S.pos === 'TW') ? (isSP() ? (st.IP || (st.pitch && st.pitch.IP)) >= 120 : (st.G || (st.pitch && st.pitch.G)) >= 45) : st.PA >= LV[S.lv].g * 3.4;
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
                S.traits.phoenix = true; removeTrait('glass', '玻璃人'); S.pool += 8; 
                card('gold', '隱藏屬性解鎖：浴火重生', '那些殺不死你的，真的讓你更強大了——<b class="hl">玻璃人懲罰解除</b>。'); 
            } 
        } 
    }
}

function maybeIntl(done) {
    const wbc = (S.year - 2026) % 4 === 0; 
    let p12 = (S.year - 2028) % 4 === 0;
    if(S.lv === 'MLB') p12 = false;
    if(S.stage !== 'PRO' || (!wbc && !p12) || ovr() < 52 || S.seasonFactor < 0.5 || S.rehab > 0 || S.skipMid) { done(); return; }
    
    const name = wbc ? '世界棒球經典賽' : '世界12強賽';
    let forced = false, first = false;
    if(S.intlLock === null) { S.intlLock = S.year; forced = true; first = true; } 
    else if(S.year - S.intlLock < 5) forced = true;
    
    if(forced) {
        card('info', '體育署公文', first ? `「查 台端符合國家代表隊遴選資格，依規定<b class="hl">強制徵召</b>，並自即日起<b class="hl">列管五年</b>。」` : `列管期間（剩 ${5-(S.year-S.intlLock)} 年），依規定<b class="hl">強制徵召</b>。`);
    }
    
    const opts = [
        {t: forced ? '⋯⋯只能報到（強制徵召）' : '披上國家隊戰袍', main:true, s:'依成績獲得能力點｜下季受傷機率 +10%', f:()=>{
            const b = clamp(Math.round((ovr()-52)*0.35), 0, 8), r = R()*100 + b;
            const i = r>=96 ? 0 : r>=88 ? 1 : r>=79 ? 2 : r>=46 ? 3 : 4;
            const rk = ['冠軍','亞軍','季軍','複賽止步','預賽出局'][i], pts = [6,5,4,2,1][i];
            let gpts = pts; if(S.traits.intlace) gpts = Math.max(pts, 2);
            S.pool += gpts; S.injNext = S.traits.intlace ? 0 : 10; S.intlCount++;
            
            if(!S.traits.taiwan && S.intlCount > 5) { 
                S.traits.taiwan = true; 
                card('gold', '隱藏稱號：Team Taiwan', '永遠把國家榮耀放在比職涯更高的位子，台灣球迷的心中永遠有一幅畫。'); 
                board(1); 
            }
            
            { 
                const a = S.ab, par = 52; const IS = S.intlStat;
                if(S.pos === 'P' || S.pos === 'TW') { 
                    const dd = (a.vel + a.ctl + a.brk)/3 - par;
                    let g, ip;
                    if(isSP()) { g = ri(1, 2); ip = +(g * (4.5 + R() * 2.5)).toFixed(1); } 
                    else { g = ri(3, 6); ip = +(g * (0.8 + R() * 0.8)).toFixed(1); }
                    IS.IP = +(IS.IP + ip).toFixed(1); IS.G += g;
                    const k9 = clamp(7.5 + dd * 0.12, 4, 14); IS.SO += Math.round(ip / 9 * k9);
                    const era = clamp(3.6 - dd * 0.16, 0.8, 8); IS.ER += Math.round(era * ip / 9);
                    if(i <= 2 && chance(45)) IS.W++; if(!isSP() && chance(30)) IS.SV++;
                } else { 
                    const dd = (a.con*0.5 + a.pow*0.2 + a.eye*0.18 + a.spd*0.12) - par - 0.5;
                    const g = ri(5,8), pa = g * ri(3,4); IS.G += g; IS.PA += pa;
                    const ab = Math.round(pa * 0.86); IS.AB += ab;
                    const avg = clamp(0.270 + dd * 0.006, 0.15, 0.5); const h = Math.round(ab * avg); IS.H += h;
                    const hr = Math.round(h * clamp(0.06 + Math.max(0, a.pow - par) * 0.006, 0.03, 0.28)); IS.HR += hr;
                    IS.RBI += Math.round(hr * 2.1 + h * 0.35);
                }
            }
            if(i <= 1) S.intlTop4 = (S.intlTop4 || 0) + 1;
            if(!S.traits.intlace && S.intlCount >= 3 && (S.intlTop4 || 0) >= 2) { 
                S.traits.intlace = true; 
                card('gold', '隱藏屬性解鎖：國際賽之鬼', '只要穿上 CT 球衣，你的痛覺就會消失——<b class="hl">國際賽不增受傷風險，每次徵召保底 +2 點</b>。'); 
            }
            if(i <= 2) S.honors.push(`${S.year} ${name}${rk}`);
            if(i === 0) tlNote(3, (wbc ? '經典賽' : '12強') + '冠軍');
            let ex = ''; const mp = S.traits.clutch ? 2 : 1; 
            if((i === 0 && chance(30 * mp)) || (i === 1 && chance(8 * mp))) { S.honors.push(`${S.year} ${name}MVP`); ex = '你被選為<b class="hl">賽會MVP</b>！'; }
            card(i <= 1 ? 'gold' : 'info', name, `中華隊最終成績：<b class="hl">${rk}</b>。${ex}獲得能力點 <b class="hl">${gpts}</b> 點。`);
            done(); 
        }}
    ];
    if(!forced) opts.push({t:'以調整為由婉拒', s:'列管期已過，終於能說不', f:done});
    choose(`中華隊徵召 · ${name}`, opts);
}

// ==================== 季末與自由市場 ====================
function phaseEnd() {
    board(2);
    if(S.stage === 'PRO') {
        let sal = Math.round(salaryFor(S.lv, S.lastD || 0) * (S.ct ? S.ct.mult : 1) * dpMult()); 
        if(S.seasonFactor === 0) sal = Math.round(sal * 0.5);
        S.salary += sal; 
        let extra = '';
        
        if(LV[S.lv].top && S.seasonFactor > 0) {
            const tp = LV[S.lv].top;
            const pc = clamp(({CPBL:15, NPB:8, MLB:3.5})[tp] + (S.lastD || 0) * 0.5, 2, ({CPBL:26, NPB:15, MLB:9})[tp]);
            let pcc = pc; if(S.traits.clutch) pcc *= 1.25; if(S.traits.leader) pcc += 5; if(S.tradeRefuse > 0) pcc *= 0.75;
            if(chance(pcc)) { 
                const cN = {CPBL:'中職總冠軍', NPB:'日本一', MLB:'世界大賽冠軍'}[LV[S.lv].top]; 
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
        choose('', [{t:`▸ 分配能力點（${p} 點·大賽／國際賽成果）`, main:true, f:()=>allocUI({pool:p}, '季末能力點分配（大賽／國際賽成果）', go)}]); 
    } else go();
}

function movement() {
    const o = ovr();
    if(S.stage === 'HS') { if(S.stageYr < 3) advance(); else pathChoiceHS(); return; }
    if(S.stage === 'U') { if(S.stageYr < 4) advance(); else pathChoiceU4(); return; }
    if(S.stage === 'AMA') {
        if(S.age >= 26) { endGame('選秀多年落榜，' + S.year + ' 年結束球員身分，轉任基層教練。'); return; }
        choose('業餘年度結束', [{t:'再次投入中職選秀', main:true, f:()=>runDraft(false,()=>advance())}, {t:'高掛球鞋', warn:true, f:()=>endGame('在業餘球隊劃下句點。')}]); 
        return;
    }
    
    if(S.skipMid) { advance(); return; }
    if(o < 30) { buyoutRemaining(1); endGame('能力已跌破中職二軍最低水準，'+S.year+' 年球季後遭釋出，被迫引退。'); return; }
    if(S.org === 'NPB') S.npbYears++;
    
    if(LV[S.lv].top) { 
        if(S.svcOrg && S.svcOrg !== S.org) S.faElig = true; 
        S.svcOrg = S.org; S.svc = (S.svc || 0) + 1; 
        if(S.svc >= 5) S.faElig = true; 
    }
    
    if(S.stage === 'PRO' && LV[S.lv].top) { 
        S.teamYears = (S.teamYears || 0) + 1;
        if(!S.traits.goldcloth && S.orgTeam === '中信兄弟' && (S.teamTally.CPBL && S.teamTally.CPBL['中信兄弟'] >= 10)) { 
            S.traits.goldcloth = true; card('gold', '隱藏屬性解鎖：黃金聖衣', '效力中信兄弟滿十年，你已是這支球隊的象徵。'); board(1); 
        }
        if(!S.traits.franchise && S.teamYears >= 7 && S.champThisTeam && S.champTeam === S.orgTeam) { 
            S.traits.franchise = true; card('gold', '隱藏屬性解鎖：神主牌', '這座城市的球迷看著你長大——<b class="hl">母隊續約年薪係數固定 ≥×1.2</b>。'); 
        }
        if(!S.traits.mrteam && S.teamYears >= 15 && (S.lastD || 0) >= 0) { 
            S.traits.mrteam = true; S.mrTeamName = S.orgTeam; const nick = teamNick(S.orgTeam); 
            card('gold', '隱藏稱號：'+nick+'先生', `十五個年頭，同一件球衣。球迷叫你「<b class="hl">${nick}先生</b>」。`); board(1); 
        }
        if(!S.traits.rainbow) { 
            const RB = {CPBL:['中職',3], NPB:['日職',5], MLB:['大聯盟',5]}; 
            for(const lg in RB) { 
                const n = Object.keys((S.teamTally && S.teamTally[lg]) || {}).length; 
                if(n > RB[lg][1]) { S.traits.rainbow = true; S.rainbowLg = RB[lg][0]; card('info', '隱藏稱號：七彩球衣', `打開衣櫃，${n} 件不同的球衣掛在眼前。`); board(1); break; } 
            } 
        } 
    }
    
    const path = PATHS[S.org], idx = path.indexOf(S.lv); 
    let minReq = LV[S.lv].min; 
    if(S.org === 'NPB' && S.npbYears >= 8) minReq -= 4;
    
    const perf = (S.seasonFactor >= 0.5) ? (S.lastD || 0) : null;
    const wonAward = S.honors.some(x => x.startsWith(String(S.year)) && /王|MVP|賽揚|澤村|最佳投手|金手套/.test(x) && !/明星賽/.test(x));
    let goodReal = false;
    
    { 
        const st = S.lastSt;
        if(st && S.seasonFactor >= 0.5) {
            if(S.pos === 'P') { const era = st.IP > 0 ? st.ER * 9 / st.IP : 99, whip = st.IP > 0 ? (st.H + st.BB) / st.IP : 99; if(era <= 4.20 || whip <= 1.35 || (st.SV || 0) >= 15 || (st.HLD || 0) >= 15) goodReal = true; }
            else { const obp = st.PA > 0 ? (st.H + st.BB) / st.PA : 0, slg = slgOf(st), ops = obp + slg; if(ops >= 0.720 || st.HR >= 12 || st.SB >= 15 || st.RBI >= (LV[S.lv].g >= 150 ? 70 : 55)) goodReal = true; }
        } 
    }
    
    if(wonAward || goodReal) {}
    else if(o < minReq) { 
        if(perf !== null && perf >= 0) { card('info', '球團評估', '體能檢測數字亮紅燈，但你用實際成績說話，球團決定續留一線觀察。'); }
        else { handleDemotion(o, path, idx); return; } 
    }
    else if(perf !== null && perf <= -6 && chance(55)) { card('bad', '球團評估', '帳面數據遠低於聯盟水準，教練團失去耐心。'); handleDemotion(o, path, idx); return; }
    
    if(idx < path.length - 1) { 
        const nx = path[idx + 1];
        if(o >= LV[nx].min && ((S.lastD || 0) >= 0 || chance(50))) { 
            let to = nx; 
            if(idx < path.length - 2) { const nx2 = path[idx + 2]; if(o >= LV[nx2].min + 2 && (S.lastD || 0) >= 4) to = nx2; }
            S.lv = to; card('good', '升級通知', `表現獲得肯定，${to !== nx ? '<b>連跳兩級</b>' : '晉升'} <b class="hl">${LV[to].n}</b>！`); board(2);
            if(LV[to].top) tlNote(2, '升上' + LV[to].n);
            if(S.traits.yips) { removeTrait('yips', '失憶症'); card('good', '走出陰影', '重回上一層舞台，失憶症痊癒。'); } 
        } 
    }
    
    if(!S.ct) S.ct = {yrs: 2, mult: 1}; 
    S.ct.yrs--;
    
    if(S.ct.yrs === 1 && LV[S.lv].top && !S.ct.extOffered && S.faElig && (S.lastD || 0) >= 1 && chance(45)) { 
        S.ct.extOffered = true; extensionOffer(o); return; 
    }
    
    if(S.ct.yrs <= 0) {
        if(LV[S.lv].top) { 
            if(S.faElig) { faFlow(o); return; } 
            S.ct = {yrs: ri(1,2), mult: 1, extOffered: false}; 
            card('info', '球團續約', `你仍在選秀球隊掌控期（服務 ${S.svc}/5 年），球團行使續約權——續 <b class="hl">${S.ct.yrs} 年</b>。`); board(1); 
        } else { 
            S.ct = {yrs: ri(1,2), mult: 1}; 
        }
    }
    crossOffers(o);
}

function buyoutRemaining(rate) {
    rate = rate || 0.7;
    if(!S.ct || !(S.ct.yrs > 1) || (!LV[S.lv].top && rate < 1)) return 0;
    const remain = S.ct.yrs - 1; if(remain <= 0) return 0;
    const yearly = Math.round(salaryFor(S.lv, S.lastD || 0) * (S.ct.mult || 1)); 
    const full = yearly * remain; const total = Math.round(full * rate);
    if(total > 0) { 
        S.salary += total;
        if(rate >= 1) card('gold', '合約全額給付', `球團主動終止合約，依約剩餘薪資<b class="hl">十成全額</b>給付，<b class="hl">${fmtMoney(total)}</b> 一次入帳。`);
        else card('gold', '合約買斷', `球團依約買斷剩餘 <b class="hl">${remain} 年</b>合約——雙方談定以 <b class="hl">七成</b> 價碼結清，<b class="hl">${fmtMoney(total)}</b> 一次入帳。`); 
    }
    S.ct = {yrs: 1, mult: S.ct.mult}; return total;
}

function daibaFarewell(cont) {
    if(S.stage === 'PRO' && S.org !== 'CPBL' && !S._daiba) { 
        S._daiba = true; 
        card('gold', '最後一球', '回到臺北大巨蛋當一日中職球員，在四萬人的注視下，投出了生涯最後一球。'); 
    } 
    cont();
}

function handleDemotion(o, path, idx) {
    if((S.lv === 'CPBL1' || S.lv === 'NPB1' || S.lv === 'MLB') && (S.lastD || 0) <= -6 && !S.traits.yips && S.seasonFactor >= 0.5) {
        traitCard('yips', '失憶症', '站上場的瞬間，腦海全是上賽季被痛宰的畫面——<b class="dn">系統評價暫時 −3</b>。', 'bad'); 
    }
    const doDemote = () => {
        let t = -1; for(let i = idx - 1; i >= 0; i--) { if(o >= LV[path[i]].min) { t = i; break; } }
        if(t >= 0) {
            const alts = [];
            if(S.org === 'MiLB') {
                if(o >= LV.NPB1.min && chance(Math.round(60 * ageGateJP()))) alts.push({t:'跳槽日職一軍', f:()=>{buyoutRemaining(); signTo('NPB','NPB1'); advance();}});
                else if(o >= LV.NPB2.min && chance(50)) alts.push({t:'轉戰日職二軍（支配下）', f:()=>{buyoutRemaining(); signTo('NPB','NPB2'); advance();}});
                if(o >= LV.CPBL1.min) alts.push({t:'返台加盟中職一軍', f:()=>{buyoutRemaining(); signTo('CPBL','CPBL1'); advance();}});
            } else if(S.org === 'NPB' && o >= LV.CPBL1.min && chance(70)) {
                alts.push({t:'返台加盟中職一軍', f:()=>{buyoutRemaining(); signTo('CPBL','CPBL1'); advance();}});
            }
            if(alts.length) {
                card('bad', '降級通知', `成績未達標，球團打算將你下放 <b class="dn">${LV[path[t]].n}</b>——但其他聯盟的邀請也到了。`);
                choose('接受下放，還是換個舞台？', [{t:'接受下放 ' + LV[path[t]].n, main:true, f:()=>{S.lv = path[t]; board(2); advance();}}, ...alts]);
            } else { S.lv = path[t]; card('bad', '降級通知', `成績未達標，被下放至 <b class="dn">${LV[path[t]].n}</b>。`); board(2); advance(); }
        } else outOfOrg(o);
    };
    
    const longContract = S.ct && S.ct.yrs > 1 && LV[S.lv].top;
    if(longContract) {
        choose('球團約談：成績未達當前層級要求，打算將你下放', [
            {t:'接受下放，繼續奮鬥', main:true, f: doDemote},
            {t:'行使長約條款，拒絕下放', warn:true, s:'觸發更衣室毒瘤；隔年成績須打回身價', f:()=>{
                S.demotionRefused = true;
                if(!S.traits.cancer && !S.traits.franchise && !S.traits.intlace) { S.traits.cancer = true; card('bad', '隱藏屬性解鎖：更衣室毒瘤', '你搬出合約條款拒絕下放。'); }
                else card('info', '拒絕下放', '你搬出合約條款留在一軍。'); 
                board(1); advance(); 
            }},
            {t:'就此引退', warn:true, s:'以現役身分光榮退場', f:()=>{buyoutRemaining(); daibaFarewell(()=>endGame('不願下放，'+S.year+' 年宣布引退。'));}}
        ]);
    } else if(S.age >= 33) {
        choose('球團約談：成績未達當前層級的最低要求', [{t:'接受下放，繼續奮鬥', f: doDemote}, {t:'選擇引退', warn:true, f:()=>{buyoutRemaining(); daibaFarewell(()=>endGame('不願下放低階聯盟，'+S.year+' 年宣布引退。'));}}]);
    } else doDemote();
}

// ==================== 自由市場與選秀流程 ====================
function pickOfferUI(title, org, offers, after) {
    choose(title, offers.map(of => ({
        t: of.team + (of.lv ? `（${LV[of.lv].n}）` : ''),
        s: `簽約金 ${fmtMoney(of.bonus)}｜${of.yrs} 年約`,
        f: () => { S.salary += of.bonus; signTo(org, of.lv || S.lv, of.team, of.yrs, of.mult || 1); card('gold', '簽約金', `入袋 <b class="hl">${fmtMoney(of.bonus)}</b>。`); after(); }
    })));
}

function makeOffers(org, n, bonusBase, yrsLo, yrsHi, lv, exclude) {
    const list = teamListOf(org).filter(t => t !== exclude);
    const teams = []; const pool = list.slice();
    for(let i=0; i<n && pool.length; i++) teams.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    return teams.map(t => ({team: t, bonus: Math.round(bonusBase * (0.8 + R() * 0.5)), yrs: ri(yrsLo, yrsHi), lv, mult: 1}));
}

function termParams(d, lv) {
    const cap = S.pos === 'P' ? 7 : 15;
    const maxY = faYears(d, cap);              
    const longEligible = maxY > 2 && d >= 0;    
    const longY = Math.max(3, maxY);           
    const shortY = Math.min(2, Math.max(1, maxY)); 
    let baseM = d >= 3 ? 1.2 : d >= 0 ? 1 : 0.8;
    if(S.traits.franchise) baseM = Math.max(baseM, 1.2);
    if(S.tradeRefuse > 0) baseM *= 0.85;
    return { longEligible, longY, shortY, longM: +(baseM * 0.92).toFixed(2), shortM: +(baseM * 1.12).toFixed(2) };
}

function termChoice(o, d, baseTitle, onPick, onReject) {
    const tp = termParams(d, S.lv);
    const est = (y, m) => fmtMoney(Math.round(salaryFor(S.lv, d) * m));
    const opts = [];
    if(tp.longEligible) {
        opts.push({t:`長約（${tp.longY} 年）`, main:true, s:`年限長、年薪係數略低 ×${tp.longM}（估 ${est(tp.longY, tp.longM)}/年）`, f:()=>onPick(tp.longY, tp.longM)});
        opts.push({t:`短約（${tp.shortY} 年）`, warn:true, s:`年限短、年薪係數高 ×${tp.shortM}（估 ${est(tp.shortY, tp.shortM)}/年）`, f:()=>onPick(tp.shortY, tp.shortM)});
    } else { 
        opts.push({t:`短約（${tp.shortY} 年）`, main:true, s:`年限短、年薪係數 ×${tp.shortM}（估 ${est(tp.shortY, tp.shortM)}/年）`, f:()=>onPick(tp.shortY, tp.shortM)}); 
    }
    if(onReject) opts.push({t:'拒絕，維持現狀', s:'不接受這份合約', f: onReject});
    choose(baseTitle, opts);
}

function extensionOffer(o) {
    const d = S.lastD || 0;
    termChoice(o, d, `母隊提前延長續約 · ${S.teamName()}（合約剩 1 年）`, (y, m)=>{
        S.ct = {yrs: S.ct.yrs + y, mult: m, extOffered: true};
        card('gold', '延長續約', `與 <b class="hl">${S.teamName()}</b> 達成延長協議，追加 <b class="hl">${y} 年</b>（年薪係數 ×${m.toFixed(2)}）。`); 
        board(1); crossOffers(o);
    }, ()=>{ card('info', '婉拒延長', '你婉拒了母隊的提前延長。'); crossOffers(o); });
}

function faFlow(o) {
    const d = S.lastD || 0; const cap = S.pos === 'P' ? 7 : 15;
    let stayY = faYears(d, cap); let stayM = d >= 3 ? 1.2 : d >= 0 ? 1 : 0.8;
    const injHist = (S.bigInj || 0) + (S.tjCount || 0); if(injHist >= 2 && stayY <= 3) stayM += 0.15;
    if(S.traits.franchise) stayM = Math.max(stayM, 1.2); if(S.tradeRefuse > 0) stayM *= 0.85;
    if(S.traits.leader && stayY <= 1) { stayY = 1; stayM = Math.max(stayM, 0.85); }
    if(S.traits.cancer) { 
        stayM = Math.min(stayM, 0.95); 
        if(!S.traits.franchise && chance(45)) { card('bad', '球團冷處理', '母球團明確表示無意續約。'); faMarket(o, d); return; } 
    }
    
    const faOpts = [
        {t:`與 ${S.teamName()} 續約`, main:true, s:'選擇長約或短約方案', f:()=>termChoice(o, d, `與 ${S.teamName()} 續約 · 選擇合約類型`, (y, m)=>{ S.ct = {yrs: y, mult: m, extOffered: false}; card('info', '續約', `完成 <b class="hl">${y} 年</b>續約。`); advance(); })},
        {t:'跳出合約，測試自由市場', warn:true, s:'尋求其他球隊報價', f:()=>faMarket(o, d)}
    ];
    if(S.org !== 'CPBL' && o >= LV.CPBL1.min) { 
        faOpts.push({t:'返台加盟中職一軍', s:'落葉歸根，回到熟悉的主場', f:()=>{ signTo('CPBL','CPBL1'); card('good', '返鄉', `選擇回到 <b class="hl">${S.teamName()}</b>。`); advance(); }}); 
    }
    choose(`合約到期 · 取得自由球員（FA）資格（球隊奪冠率 ${teamChampRate(S.orgTeam)}%）`, faOpts);
}

function faMarket(o, d) {
    const org = S.org, lv = S.lv, offers = [];
    let n = d >= 3 ? ri(2,4) : d >= 1 ? ri(1,3) : d >= -1 ? (chance(60) ? ri(1,2) : 0) : (chance(30) ? 1 : 0);
    if(S.traits.cancer) n = Math.max(0, n - 1);
    const cap = S.pos === 'P' ? 7 : 15;
    
    makeOffers(org, n, ({CPBL1:200, NPB1:800, MLB:2000})[lv] || 100, 1, cap, lv, S.orgTeam)
        .forEach(of => { of.yrs = faYears(d, cap); of.mult = +(1 + Math.max(0, d) * 0.05 + R() * 0.12).toFixed(2); if(((S.bigInj || 0) + (S.tjCount || 0)) >= 2 && of.yrs <= 3) of.mult += 0.15; offers.push({...of, org}); });
    
    if(lv === 'CPBL1' && o >= 53) makeOffers('NPB', 1, 1000, 2, 3, o >= 51 ? 'NPB1' : 'NPB2', null).forEach(of => offers.push({...of, org:'NPB', mult:1}));
    if(lv === 'NPB1' && o >= 60) {
        const freeAgent = (S.npbYears || 0) >= 7;
        if(freeAgent || chance(Math.round(50 * ageGateUSA(o, 60)))) { 
            makeOffers('MiLB', freeAgent ? ri(1,2) : 1, 3000, 3, 5, 'MLB', null).forEach(of => offers.push({...of, org:'MiLB', mult:1, posting: !freeAgent})); 
        }
    }
    
    if(!offers.length) {
        card('bad', '自由市場', '電話一直沒有響。市場對你的評價比想像中冷。');
        choose('沒有球隊開價', [
            {t:`回 ${S.teamName()} 減薪簽約`, main:true, s:'1 年｜年薪係數 ×0.70', f:()=>{ S.ct = {yrs: 1, mult: 0.7}; card('bad', '減薪合約', '低頭回到原球隊。'); advance(); }},
            {t:'就此引退', warn:true, f:()=>endGame('FA 市場乏人問津，宣告引退。')}
        ]);
        return;
    }
    
    const est = of => fmtMoney(Math.round(salaryFor(of.lv, d) * (of.mult || 1)));
    const estL = (of) => { const tp = termParams(d, of.lv); return tp.longEligible ? `長 ${tp.longY}年 / 短 ${tp.shortY}年` : `僅短約 ${tp.shortY}年`; };
    const cty = og => ({CPBL:'🇹🇼 台灣', NPB:'🇯🇵 日本', MiLB:'🇺🇸 美國', MLB:'🇺🇸 美國'})[og] || '';
    const ctyOrder = {CPBL:0, NPB:1, MiLB:2, MLB:2};
    offers.sort((a,b) => (ctyOrder[a.org] ?? 9) - (ctyOrder[b.org] ?? 9));
    
    choose('自由市場報價一覽', [...offers.map(of => ({
        t: `${cty(of.org)}｜${of.team}（${LV[of.lv].n}）`,
        s: `簽約金 ${fmtMoney(of.bonus)}｜奪冠率 ${teamChampRate(of.team)}%｜${estL(of)}`,
        f: () => { S.salary += of.bonus; const savedLv = S.lv; S.lv = of.lv;
            termChoice(o, d, `${of.team} · 選擇合約類型`, (y, m)=>{ S.lv = savedLv; signTo(of.org, of.lv, of.team, y, +(m * (of.mult || 1)).toFixed(2)); advance(); }, ()=>{ S.lv = savedLv; S.salary -= of.bonus; faMarket(o, d); }); }
    })), {t:`回原隊（${S.teamName()}）1 年約`, s:'年薪係數 ×0.90', f:()=>{ S.ct = {yrs: 1, mult: 0.9}; card('info', '回歸', '重回原隊。'); advance(); }}]);
}

function ageGateUSA(o, minReq) { const age = S.age; if(age <= 22) return 1.0; if(age <= 24) return 0.75; if(age <= 26) return 0.5; if(age <= 27) return 0.3; if(age <= 28) return 0.15; return o >= minReq + 5 ? 0.08 : 0; }
function ageGateJP() { const age = S.age; if(age <= 26) return 1.0; if(age <= 28) return 0.7; if(age <= 30) return 0.45; if(age <= 31) return 0.25; return 0; }

function crossOffers(o) {
    const fin = () => advance();
    if(S.lv === 'CPBL1' && o >= 53 && (S.lastD || 0) >= 1 && chance(Math.round(35 * ageGateJP()))) {
        const jl = o >= 51 ? 'NPB1' : 'NPB2'; const bids = makeOffers('NPB', 2, 1200, 2, 3, jl, null);
        choose('日職球團開出旅外合約', [...bids.map(of => ({ t: of.team + `（${LV[jl].n}）`, s: `簽約金 ${fmtMoney(of.bonus)}`, f:()=>{S.salary += of.bonus; signTo('NPB', jl, of.team, of.yrs, 1); fin();}})), {t:'留在中職', main:true, f:fin}]); return; 
    }
    if(S.lv === 'CPBL1' && o >= 57 && (S.lastD || 0) >= 2 && chance(Math.round(30 * ageGateUSA(o, 57)))) {
        const ml = o >= 60 ? 'MLB' : 'A3'; const bids = makeOffers('MiLB', 2, 2000, 2, 4, ml, null);
        choose('大聯盟球探遞出合約', [...bids.map(of => ({ t: of.team + `（${LV[ml].n}）`, s: `簽約金 ${fmtMoney(of.bonus)}`, f:()=>{S.salary += of.bonus; signTo('MiLB', ml, of.team, of.yrs, 1); fin();}})), {t:'留在中職', main:true, f:fin}]); return; 
    }
    if(S.lv === 'NPB1' && o >= 60 && (S.lastD || 0) >= 2 && chance(Math.round(30 * ageGateUSA(o, 60)))) {
        const bids = makeOffers('MiLB', ri(2,3), Math.round(3000 + (S.lastD || 0) * 800), 3, 6, 'MLB', null);
        choose('入札制度：大聯盟多隊競標', [...bids.map(of => ({ t: of.team, s: `簽約金 ${fmtMoney(of.bonus)}`, f:()=>{ S.salary += of.bonus; signTo('MiLB', 'MLB', of.team, of.yrs, 1); fin(); }})), {t:'留在日職', main:true, f:fin}]); return; 
    }
    fin();
}

function runDraftJP(fromSchool, cb) {
    const o = ovr(); const score = o + Math.max(0, 22 - S.age) * 2 + ri(-4,4);
    const rd = score >= 58 ? 1 : score >= 52 ? 2 : score >= 47 ? ri(3,4) : score >= 42 ? ri(5,7) : score >= 38 ? ri(8,10) : 0;
    if(rd === 0) { card('bad', '選秀落榜', '唱名結束，未獲指名。'); if(fromSchool) { card('info','','回到球隊。'); cb(); } else cb('fail'); return; }
    
    const bonus = [0, 10000, 8000, 6000, 4500, 3000, 3000, 2000, 1000, 1000, 1000][rd] || 1000; 
    const lv = (rd <= 2 && o >= 52) ? 'NPB1' : 'NPB2'; 
    const team = pick(NPB_TEAMS);
    
    const accept = () => { S.stage = 'PRO'; S.team = ''; S.salary += bonus; S.svc = 0; S.faElig = false; signTo('NPB', lv, team, ri(2,3), 1); card('gold', '日本職棒選秀會', `第 <b class="hl">${rd}</b> 指名加入 <b class="hl">${team}</b>！簽約金 ${fmtMoney(bonus)}。`); tlNote(4, '選秀第'+rd+'指名'); board(0); cb(); };
    
    if(rd >= 3 && S.age < 24) {
        choose(`日本職棒選秀會 · 第 ${rd} 指名 (${team})`, [
            {t:'接受指名，加盟球隊', main:true, s:`簽約金 ${fmtMoney(bonus)}`, f: accept},
            {t: (S.stage === 'HS' || (S.stage === 'U' && S.stageYr < 4)) ? '重返校園，再拚一年' : '重返社會人，再拚一年', warn:true, s:'放棄本次指名', f:()=>{
                const goUni = (S.stage === 'HS') || (S.stage === 'U' && S.stageYr < 4); const fresh = (S.stage === 'HS');
                card('info', goUni ? '重返校園' : '重返社會人', '決定繼續磨練，提升自己的評價。');
                if(fresh) { S.stage = 'U'; S.stageYr = 0; S.team = pick(['早稻田大學','慶應義塾大學','法政大學','明治大學']); } 
                else if(!goUni) { S.stage = 'AMA'; S.team = pick(['豐田汽車','JR東日本','東京瓦斯','ENEOS']); }
                if(fromSchool) cb(); else advance();
            }}
        ]); 
        return; 
    }
    accept();
}

function runDraft(fromSchool, cb) {
    const o = ovr(); const score = o + Math.max(0, 22 - S.age) * 2 + ri(-4,4);
    const rd = score >= 56 ? 1 : score >= 49 ? 2 : score >= 43 ? ri(3,4) : score >= 37 ? ri(5,7) : score >= 30 ? ri(8,10) : 0;
    if(rd === 0) { card('bad', '選秀落榜', '唱名一輪又一輪，始終沒有你的名字。'); if(fromSchool) { card('info','','回到校隊。'); cb(); } else cb('fail'); return; }
    
    const bonus = [0, 1000, 600, 350, 350, 150, 150, 150, 50, 50, 50][rd] || 50; 
    const lv = (rd === 1 && o >= 50) ? 'CPBL1' : 'CPBL2'; 
    const team = pick(CPBL_TEAMS);
    
    const accept = () => { S.stage = 'PRO'; S.team = ''; S.salary += bonus; S.svc = 0; S.faElig = false; signTo('CPBL', lv, team, ri(2,3), 1); card('gold', '中華職棒選秀會', `第 <b class="hl">${rd}</b> 輪獲 <b class="hl">${team}</b> 指名！`); tlNote(4, '選秀第'+rd+'輪'); board(0); cb(); };
    
    if(rd >= 3 && S.age < 24) {
        choose(`中華職棒選秀會 · 第 ${rd} 輪獲 ${team} 指名`, [
            {t:'接受指名，加盟球隊', main:true, s:`簽約金 ${fmtMoney(bonus)}`, f: accept},
            {t: (S.stage === 'HS' || (S.stage === 'U' && S.stageYr < 4)) ? '重返校園，再拚一年' : '重返業餘，再拚一年', warn:true, s:'放棄本次指名', f:()=>{
                const goUni = (S.stage === 'HS') || (S.stage === 'U' && S.stageYr < 4); const fresh = (S.stage === 'HS');
                card('info', goUni ? '重返校園' : '重返業餘', '決定重新出發。');
                if(fresh) { S.stage = 'U'; S.stageYr = 0; S.team = pick(['文化大學','輔仁大學','國立體大','台灣體大','開南大學']); } 
                else if(!goUni) { S.stage = 'AMA'; S.team = pick(['合電','台庫','安妞先物','美麗珊瑚']); }
                if(fromSchool) cb(); else advance();
            }}
        ]); 
        return; 
    }
    accept();
}

function pathChoiceHS() {
    const o = ovr(); const opts = [];
    if(S.hsRegion === 'JP') {
        opts.push({t:'投入日本職棒選秀', main:true, s:'以本土球員身分參加', f:()=>runDraftJP(false, r=>{
            if(r === 'fail') choose('落榜之後', [{t:'就讀日本大學', main:true, f:()=>{S.stage='U'; S.stageYr=0; S.hsRegion='JP'; S.team=pick(['早稻田大學','慶應義塾大學','法政大學','明治大學']); advance();}}, {t:'回台加入中職', f:()=>runDraft(false, ()=>advance())}]);
            else advance();
        })});
        opts.push({t:'就讀日本大學（延長養成）', s:'大四畢業可再挑戰日職', f:()=>{ S.stage = 'U'; S.stageYr = 0; S.hsRegion = 'JP'; S.team = pick(['早稻田大學','慶應義塾大學','法政大學','明治大學']); card('info', '升學', `進入 <b class="hl">${S.team}</b>。`); advance(); }});
    } else {
        opts.push({t:'就讀大學（延長養成）', s:'一年僅 2 場大賽加點', f:()=>{ S.stage = 'U'; S.stageYr = 0; S.team = pick(['文化大學','輔仁大學','國立體大','台灣體大','開南大學']); card('info', '升學', `進入 <b class="hl">${S.team}</b>。`); advance(); }});
        opts.push({t:'投入中華職棒選秀', s:'目前綜合 ' + o, f:()=>runDraft(false, r=>{
            if(r === 'fail') choose('落榜之後', [{t:'改就讀大學', main:true, f:()=>{S.stage='U'; S.stageYr=0; S.team=pick(['文化大學','輔仁大學','國立體大','台灣體大']); advance();}}, {t:'加入業餘成棒隊', f:()=>{S.stage='AMA'; S.team=pick(['合電','台庫','安妞先物','美麗珊瑚']); advance();}}]);
            else advance();
        })});
        if(o >= 44) opts.push({t:'洽談旅日合約', s:'從日職二軍出發', f:()=>{ S.stage = 'PRO'; pickOfferUI('日職球團的育成報價', 'NPB', makeOffers('NPB', ri(2,3), 800, 3, 3, 'NPB2', null), ()=>{ card('gold', '旅日', '目標：一軍初登場。'); advance(); }); }});
    }
    if(o >= 50) opts.push({t:'洽談旅美合約', main: (S.hsRegion !== 'JP'), s:`挑戰大聯盟`, f:()=>{ S.stage = 'PRO'; pickOfferUI('大聯盟球團的國際簽約報價', 'MiLB', makeOffers('MiLB', ri(2,3), 1500, 3, 4, o>=54?'A1':'R', null), ()=>{ card('gold', '旅美', '美國的紅土，等著你去征服。'); advance(); }); }});
    choose(`高中畢業 · 綜合能力 ${o} · 人生的第一個路口`, opts);
}

function pathChoiceU4() {
    const o = ovr(); const opts = []; const agePenalty = Math.max(0, S.age - 18);
    const reqNPB = 44 + Math.floor(agePenalty / 2); const reqMiLB = 50 + Math.floor(agePenalty / 2);
    const bonusNPB = Math.max(100, 800 - agePenalty * 180); const bonusMiLB = Math.max(150, 1500 - agePenalty * 350);

    if (S.hsRegion === 'JP') {
        opts.push({t:'投入日本職棒選秀', main:true, s:'大學畢業即戰力', f:()=>runDraftJP(false, r=>{
            if(r === 'fail') choose('落榜之後', [{t:'加入社會人球隊', f:()=>{S.stage='AMA'; S.team=pick(['豐田汽車','JR東日本','東京瓦斯','ENEOS']); advance();}}, {t:'高掛球鞋', warn:true, f:()=>endGame('大學畢業選秀落榜，決定告別球場。')}]);
            else advance();
        })});
    } else {
        opts.push({t:'投入中華職棒選秀', main:true, s:'綜合 ' + o, f:()=>runDraft(false, r=>{
            if(r === 'fail') choose('落榜之後', [{t:'加入業餘成棒隊', f:()=>{S.stage='AMA'; S.team=pick(['合電','台庫','安妞先物']); advance();}}, {t:'高掛球鞋', warn:true, f:()=>endGame('大學畢業選秀落榜，決定告別球場。')}]);
            else advance();
        })});
        if(o >= reqNPB) opts.push({t:'洽談旅日合約', s:'大齡新秀', f:()=>{S.stage='PRO'; pickOfferUI('日職球團報價', 'NPB', makeOffers('NPB', 2, bonusNPB, 2, 3, 'NPB2', null), advance);}});
    }
    if(o >= reqMiLB) opts.push({t:'洽談旅美合約', s:'大齡底薪簽約 (Senior Sign)', f:()=>{S.stage='PRO'; pickOfferUI('大聯盟球團報價', 'MiLB', makeOffers('MiLB', 2, bonusMiLB, 3, 4, o>=55?'A1':'R', null), advance);}});
    choose(`大學畢業 · 綜合能力 ${o}`, opts);
}
