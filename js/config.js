const APP_VER = 'v1.5.0';
const ABL = {sta:'體力',vel:'球速',ctl:'控球',brk:'變化球',con:'Contact',pow:'力量',spd:'速度',eye:'選球',rng:'守備範圍',fld:'接球',arm:'臂力',cat:'配球'};
const POS_AB = {P:['sta','vel','ctl','brk'],C:['sta','con','pow','spd','eye','rng','fld','arm','cat'],IF:['sta','con','pow','spd','eye','rng','fld','arm'],OF:['sta','con','pow','spd','eye','rng','fld','arm'],TW:['sta','vel','ctl','brk','con','pow','spd','eye','rng','fld','arm']};
const POSN = {P:'投手',C:'捕手',IF:'內野手',OF:'外野手',TW:'二刀流'};
const DPN = {SS:'游擊手','2B':'二壘手','3B':'三壘手','1B':'一壘手', CF:'中外野手',RF:'右外野手',LF:'左外野手',DH:'指定打擊',C:'捕手'};

const CPBL_TEAMS = ['中信兄弟','統一獅','樂天桃猿','富邦悍將','味全龍','台鋼雄鷹'];
const NPB_TEAMS = ['讀賣巨人','阪神虎','橫濱DeNA','廣島鯉魚','養樂多燕子','中日龍','軟銀鷹','日本火腿','羅德海洋','樂天金鷲','歐力士猛牛','西武獅'];
const MLB_TEAMS = ['洛杉磯道奇','聖地牙哥教士','舊金山巨人','紐約洋基','波士頓紅襪','紐約大都會','費城費城人','亞特蘭大勇士','芝加哥小熊','聖路易紅雀','休士頓太空人','德州遊騎兵','西雅圖水手','洛杉磯天使','多倫多藍鳥','巴爾的摩金鶯','坦帕灣光芒','明尼蘇達雙城','底特律老虎','克里夫蘭守護者','芝加哥白襪','堪薩斯市皇家','奧克蘭運動家','密爾瓦基釀酒人','匹茲堡海盜','邁阿密馬林魚','華盛頓國民','亞利桑那響尾蛇','科羅拉多落磯','辛辛那提紅人'];

const LV = {
 CPBL2:{n:'中職二軍',par:34,min:30,g:80, org:'CPBL'}, CPBL1:{n:'中職一軍',par:44,min:41,g:120,org:'CPBL',top:'CPBL'},
 NPB2:{n:'日職二軍',par:47,min:44,g:100,org:'NPB'}, NPB1:{n:'日職一軍',par:53,min:50,g:143,org:'NPB',top:'NPB'},
 R:{n:'新人聯盟',par:41,min:39,g:55, org:'MiLB'}, A1:{n:'1A',par:45,min:43,g:110,org:'MiLB'},
 A2:{n:'2A',par:49,min:47,g:120,org:'MiLB'}, A3:{n:'3A',par:54,min:52,g:130,org:'MiLB'},
 MLB:{n:'大聯盟',par:59,min:56,g:162,org:'MiLB',top:'MLB'}
};
const PATHS = {CPBL:['CPBL2','CPBL1'], NPB:['NPB2','NPB1'], MiLB:['R','A1','A2','A3','MLB']};
