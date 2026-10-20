// 词根闯关：关卡 / 打卡 / 错词本 / 小测。所有数据存 localStorage。
(function(){
const PER=5, PASS=0.8, KEY='wrq.v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// 1. 数据清洗：去掉原数据集中的占位条目（root231… / 例词300a）和重复词根
const seen=new Set();
const roots=WordRoots.filter(r=>!/^(root|suffix)\d+$/.test(r.root)&&!r.examples.some(e=>/^例词|^example\d/.test(e.meaning+e.word))&&!seen.has(r.root)&&seen.add(r.root));
const kind=r=>/-$/.test(r.root.split('/')[0])?'prefix':/^-/.test(r.root)?'suffix':'root';
const STAGES=[
 {k:'prefix',name:'第一站 · 前缀岛',tip:'前缀改变方向和态度：un- 不、re- 再、pre- 前。先拿下最容易「一眼看穿」的部分。'},
 {k:'root',name:'第二站 · 词根森林',tip:'词根是单词的核心意思：spect 看、port 带、dict 说。认识一个，就认识一串。'},
 {k:'suffix',name:'第三站 · 后缀城堡',tip:'后缀决定词性：-ful 形容词、-ness 名词、-ly 副词。学会它，阅读题里认词更快。'}];
const levels=[];
STAGES.forEach(s=>{const rs=roots.filter(r=>kind(r)===s.k);for(let i=0;i<rs.length;i+=PER)levels.push({stage:s.k,idx:levels.length,roots:rs.slice(i,i+PER)})});
const allEx=roots.flatMap(r=>r.examples.map(e=>({...e,root:r.root,rootMean:r.meaning})));

// 2. 存档
const def={stars:{},days:[],wrong:{}};
let S;try{S=Object.assign({},def,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S={...def}}
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const dkey=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function checkin(){const t=dkey();if(!S.days.includes(t)){S.days.push(t);save();toast('今日打卡成功 🔥')}}
function streak(){let n=0,d=new Date();if(!S.days.includes(dkey(d)))d.setDate(d.getDate()-1);while(S.days.includes(dkey(d))){n++;d.setDate(d.getDate()-1)}return n}
const unlocked=i=>i===0||(S.stars[i-1]||0)>0;
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}

// 3. 视图
function show(v){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('hidden',x.id!=='v-'+v));document.querySelectorAll('nav a[data-go]').forEach(a=>a.classList.toggle('on',a.dataset.go===v));scrollTo(0,0);if(v==='map')renderMap();if(v==='wrong')renderWrong()}
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){e.preventDefault();show(g.dataset.go)}});

function renderMap(){
 $('#streak').textContent=streak();
 $('#stars').textContent=Object.values(S.stars).reduce((a,b)=>a+b,0);
 $('#cleared').textContent=Object.values(S.stars).filter(x=>x>0).length+'/'+levels.length;
 $('#wrongN').textContent=Object.keys(S.wrong).length;
 const wk=['日','一','二','三','四','五','六'];let h='';
 for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);h+=`<div>${wk[d.getDay()]}<b class="${S.days.includes(dkey(d))?'on':''} ${i===0?'today':''}"></b></div>`}
 $('#week').innerHTML=h;
 const cur=levels.findIndex((l,i)=>unlocked(i)&&!S.stars[i]);
 $('#stages').innerHTML=STAGES.map(s=>{const ls=levels.filter(l=>l.stage===s.k);return `<div class="stage"><h2>${s.name}<small>${ls.length} 关 · ${ls.reduce((a,l)=>a+l.roots.length,0)} 个词根</small></h2><p>${s.tip}</p><div class="levels">${ls.map(l=>{const st=S.stars[l.idx]||0;return `<button class="lv ${l.idx===cur?'cur':''}" data-lv="${l.idx}" ${unlocked(l.idx)?'':'disabled'}><span class="n">第 ${l.idx+1} 关</span><span class="t">${l.roots.map(r=>esc(r.root.split('/')[0])).join(' · ')}</span><span class="st">${[1,2,3].map(n=>`<span class="${n<=st?'y':''}">★</span>`).join('')}</span></button>`}).join('')}</div></div>`}).join('');
}
$('#stages').addEventListener('click',e=>{const b=e.target.closest('[data-lv]');if(b&&!b.disabled)learn(+b.dataset.lv)});

// 学习
let L,li;
function learn(i){L=levels[i];li=0;show('learn');drawCard()}
function drawCard(){const r=L.roots[li];
 $('#lp').style.width=((li+1)/L.roots.length*100)+'%';$('#lcount').textContent=`${li+1}/${L.roots.length}`;
 $('#card').innerHTML=`<p class="root">${esc(r.root)}</p><p class="mean">${esc(r.meaning)}</p><p class="desc">${esc(r.description)}</p><div class="ex">${r.examples.map(e=>`<div><b>${hl({...e,root:r.root})}</b><small>${esc(e.meaning)} · ${esc(e.explanation)}</small></div>`).join('')}</div>`;
 $('#prev').disabled=li===0;$('#next').textContent=li===L.roots.length-1?'开始小测 →':'下一个';}
function hl(e){const w=esc(e.word),p=[e.breakdown.prefix,e.breakdown.root,e.breakdown.suffix].filter(Boolean),keys=String(e.root||'').toLowerCase().split('/').map(k=>k.replace(/-/g,''));if(!p.length)return w;let m=p.findIndex(x=>keys.some(k=>k&&(x.toLowerCase()===k||x.toLowerCase().startsWith(k)||k.startsWith(x.toLowerCase()))));if(m<0)m=p.indexOf(e.breakdown.root);return p.map((x,i)=>i===m?`<em>${esc(x)}</em>`:esc(x)).join('·')}
$('#prev').onclick=()=>{if(li>0){li--;drawCard()}};
$('#next').onclick=()=>{if(li<L.roots.length-1){li++;drawCard()}else quiz(L.roots.flatMap(r=>r.examples.slice(0,2).map(e=>({...e,root:r.root,rootMean:r.meaning}))),'level')};

// 小测：看拆分选中文意思（干扰项来自其它词根的例词）
let Q,qi,score,mode;
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
function quiz(items,m){mode=m;Q=shuffle(items).slice(0,m==='level'?8:10).map(it=>{const d=shuffle(allEx.filter(x=>x.meaning!==it.meaning&&x.root!==it.root)).slice(0,3).map(x=>x.meaning);return{it,opts:shuffle([it.meaning,...d])}});qi=0;score=0;show('quiz');drawQ()}
function drawQ(){const {it,opts}=Q[qi];
 $('#qp').style.width=(qi/Q.length*100)+'%';$('#qcount').textContent=`${qi+1}/${Q.length}`;
 $('#q').innerHTML=`<h3>${mode==='wrong'?'错词复习':'本关小测'} · 这个词是什么意思？</h3><p class="word">${esc(it.word)}</p><p class="hint">提示：拆开看 ${hl(it)} —— ${esc(it.root)} = ${esc(it.rootMean)}</p><div class="opts">${opts.map(o=>`<button class="opt">${esc(o)}</button>`).join('')}</div><div id="fb"></div>`;
 document.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(b,it))}
function answer(b,it){const ok=b.textContent===it.meaning;document.querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(x.textContent===it.meaning)x.classList.add('ok')});if(!ok)b.classList.add('no');
 const w=it.word;
 if(ok){score++;if(S.wrong[w]){S.wrong[w].right=(S.wrong[w].right||0)+1;if(S.wrong[w].right>=2)delete S.wrong[w]}}
 else S.wrong[w]={word:w,meaning:it.meaning,root:it.root,rootMean:it.rootMean,breakdown:it.breakdown,explanation:it.explanation,right:0,at:dkey()};
 save();
 $('#fb').innerHTML=`<div class="fb ${ok?'ok':'no'}"><span>${ok?'答对了！':'记住它：'}<b>${esc(it.word)}</b> = ${esc(it.meaning)}（${esc(it.explanation)}）${ok?'':' · 已加入错词本'}</span><button class="primary" id="go">${qi===Q.length-1?'看结果':'继续'}</button></div>`;
 $('#go').onclick=()=>{qi++;qi<Q.length?drawQ():finish()}}
function finish(){const r=score/Q.length;let st=0,h;
 checkin();
 if(mode==='level'){st=r>=1?3:r>=.9?2:r>=PASS?1:0;if(st>(S.stars[L.idx]||0))S.stars[L.idx]=st;save()}
 const pass=mode!=='level'||st>0;
 h=`<p class="big">${pass?'🎉':'💪'}</p><h2>${mode==='level'?(pass?`第 ${L.idx+1} 关通过！`:'差一点点'):'复习完成'}</h2>${mode==='level'?`<div class="stars">${'★'.repeat(st)}${'☆'.repeat(3-st)}</div>`:''}<p class="sub">答对 ${score}/${Q.length}${mode==='level'&&!pass?`，需要 ${Math.ceil(Q.length*PASS)} 题才能解锁下一关`:''} · 错词本里还有 ${Object.keys(S.wrong).length} 个词</p><div class="actions" style="justify-content:center;gap:12px">${mode==='level'&&!pass?`<button class="ghost" id="retry">再学一遍</button>`:''}<button class="primary" data-go="map">回到地图</button></div>`;
 $('#result').innerHTML=h;show('result');const rt=$('#retry');if(rt)rt.onclick=()=>learn(L.idx)}

// 错词本
function renderWrong(){const ws=Object.values(S.wrong);$('#wrongN').textContent=ws.length;
 $('#wlist').innerHTML=ws.length?ws.map(w=>`<div class="wi"><span><b>${esc(w.word)}</b> ${esc(w.meaning)}<br><small>词根 ${esc(w.root)}（${esc(w.rootMean)}） · 已连续答对 ${w.right||0}/2</small></span><small>${esc(w.at)}</small></div>`).join(''):'<div class="empty">还没有错词，继续闯关吧 ✨</div>';
 $('#wreview').disabled=!ws.length}
$('#wreview').onclick=()=>{const ws=Object.values(S.wrong);if(ws.length)quiz(ws,'wrong')};

show('map');
})();
