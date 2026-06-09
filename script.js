const assets = 'assets/';
const SYMBOLS = [
  { id:'bonus', name:'GRANDE LEPRUS', img:'605EFED2-99DF-4419-898F-DBC059862823.jpeg', type:'scatter', weight:2, pays:{3:5,4:25,5:120}},
  { id:'gustatore', name:'IL GUSTATORE', img:'3905414B-0992-4DAB-874C-DDD19F80E871.jpeg', weight:6, pays:{3:4,4:18,5:100}},
  { id:'belloccio', name:'IL BELLOCCIO', img:'31207653-68D7-4611-B4711-B471-0FF34C10289A.jpeg'.replace('B4711-B471','B471'), weight:7, pays:{3:3,4:14,5:75}},
  { id:'professore', name:'IL PROFESSORE', img:'7EFE5E1E-805D-4FEA-8C5D-FE7F2895F972.jpeg', weight:7, pays:{3:3,4:12,5:60}},
  { id:'boss', name:'IL BOSS', img:'D636A471-C97D-4B08-8ABF-405E8FA9436B.png', weight:8, pays:{3:2,4:10,5:50}},
  { id:'riccio', name:'IL RICCIO', img:'026DA782-EAE7-42F2-B6C4-88F00B932488.jpeg', weight:9, pays:{3:2,4:8,5:40}},
  { id:'matto', name:'IL MATTO', img:'DA176717-7D6F-4593-8435-6DBD9D99FBF2.jpeg', weight:10, pays:{3:2,4:7,5:30}},
  { id:'fumatore', name:'IL FUMATORE', img:'BC9FDA5C-98C6-48C4-8E1E-0ABFD475E360.jpeg', weight:11, pays:{3:1,4:6,5:25}},
  { id:'mangiatore', name:'IL MANGIATORE', img:'C8969B81-A529-4A68-9542-39B533EFF078.jpeg', weight:12, pays:{3:1,4:5,5:20}},
  { id:'wild', name:'SUPER LEPRUS', img:'6802C663-9FC5-4979-A501-640C9EE9EE07.jpeg', type:'wild', weight:5, pays:{3:5,4:20,5:110}}
];
const LINES = [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]];
let credits=Number(localStorage.leprusCredits||1000), bet=10, win=0, grid=[], spinning=false, auto=false, freeSpins=0, expandingSymbol=null, sound=true;
const $=id=>document.getElementById(id);
function weightedRandom(){let total=SYMBOLS.reduce((a,s)=>a+s.weight,0), r=Math.random()*total; for(const s of SYMBOLS){r-=s.weight;if(r<=0)return s} return SYMBOLS[0]}
function makeGrid(){return Array.from({length:5},()=>Array.from({length:3},weightedRandom));}
function render(){ $('credits').textContent=Math.floor(credits); $('bet').textContent=bet; $('win').textContent=Math.floor(win); localStorage.leprusCredits=credits; const reels=$('reels'); reels.innerHTML=''; grid.forEach((col,c)=>{const reel=document.createElement('div'); reel.className='reel'; col.forEach((sym,r)=>{const cell=document.createElement('div'); cell.className='cell'; cell.dataset.c=c; cell.dataset.r=r; cell.innerHTML=`<div class="symbol ${sym.type||''}" data-id="${sym.id}"><img src="${assets+sym.img}"/><div class="label">${sym.name}</div></div>`; reel.appendChild(cell)}); reels.appendChild(reel)}); }
function init(){grid=makeGrid(); render(); bind(); showToast('Book of Leprus pronto');}
function bind(){ $('spinBtn').onclick=spin; $('betUp').onclick=()=>{if(!spinning) {bet=Math.min(100,bet+5); render();}}; $('betDown').onclick=()=>{if(!spinning){bet=Math.max(5,bet-5); render();}}; $('maxBtn').onclick=()=>{if(!spinning){bet=100; render();}}; $('autoBtn').onclick=()=>{auto=!auto; $('autoBtn').textContent=auto?'STOP':'AUTO'; if(auto&&!spinning) spin();}; $('soundBtn').onclick=()=>{sound=!sound; $('soundBtn').textContent=sound?'🔊':'🔇'}; $('infoBtn').onclick=()=> $('infoOverlay').classList.remove('hidden'); $('closeInfo').onclick=()=> $('infoOverlay').classList.add('hidden'); $('startBonus').onclick=()=>{$('bonusOverlay').classList.add('hidden'); startFreeSpins();}; $('closeTemple').onclick=()=> $('templeOverlay').classList.add('hidden'); }
function beep(freq=440,dur=.08){ if(!sound) return; try{const ac=new (window.AudioContext||window.webkitAudioContext)(); const o=ac.createOscillator(); const g=ac.createGain(); o.frequency.value=freq; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.04,ac.currentTime); g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+dur); o.start(); o.stop(ac.currentTime+dur);}catch(e){}}
async function spin(){ if(spinning) return; if(freeSpins<=0){ if(credits<bet){credits=1000; showToast('Crediti ricaricati demo');} credits-=bet; } else { freeSpins--; showToast(`FREE SPIN ${freeSpins} rimasti`); }
 spinning=true; win=0; clearWins(); render(); [...document.querySelectorAll('.reel')].forEach(x=>x.classList.add('spinning')); beep(180,.12);
 await sleep(450); const newGrid=makeGrid(); if(freeSpins>=0 && expandingSymbol){ applyExpansion(newGrid); }
 for(let c=0;c<5;c++){ await sleep(220); grid[c]=newGrid[c]; renderPartial(c); beep(260+c*40,.05); }
 [...document.querySelectorAll('.reel')].forEach(x=>x.classList.remove('spinning')); const result=evaluate(); win=result.total; credits+=win; render(); highlight(result.cells); if(win>0){showToast(win>bet*20?'LEPRUS MEGA WIN!':`VINTI ${Math.floor(win)} CREDITI`); beep(700,.18);} spinning=false;
 const scatters=countSymbols('bonus'); if(scatters>=5 && freeSpins<=0){ setTimeout(openTemple,600); }
 else if(scatters>=3 && freeSpins<=0){ setTimeout(openBonus,600); }
 else if(auto || freeSpins>0){ setTimeout(spin,900); } }
function renderPartial(c){ const reels=$('reels').children; if(!reels[c]) return; reels[c].innerHTML=''; grid[c].forEach((sym,r)=>{const cell=document.createElement('div'); cell.className='cell'; cell.dataset.c=c; cell.dataset.r=r; cell.innerHTML=`<div class="symbol ${sym.type||''}" data-id="${sym.id}"><img src="${assets+sym.img}"/><div class="label">${sym.name}</div></div>`; reels[c].appendChild(cell);}); }
function applyExpansion(g){ for(let c=0;c<5;c++){ if(g[c].some(s=>s.id===expandingSymbol.id)){ g[c]=[expandingSymbol,expandingSymbol,expandingSymbol]; } } }
function evaluate(){let total=0,cells=[]; for(const line of LINES){ let first=null,count=0,lineCells=[]; for(let c=0;c<5;c++){ const sym=grid[c][line[c]]; if(sym.type==='scatter') break; if(!first && sym.type!=='wild') first=sym; if(sym.type==='wild' || (first && sym.id===first.id) || (!first && sym.type==='wild')){ count++; lineCells.push([c,line[c]]); } else break; } const paySym=first || SYMBOLS.find(s=>s.id==='wild'); if(count>=3 && paySym.pays[count]){ total += paySym.pays[count]*bet/10; cells.push(...lineCells); } } const sc=countSymbols('bonus'); if(sc>=3) total += (SYMBOLS[0].pays[Math.min(sc,5)]||0)*bet/10; return {total,cells};}
function countSymbols(id){return grid.flat().filter(s=>s.id===id).length}
function highlight(cells){ clearWins(); cells.forEach(([c,r])=>{const el=document.querySelector(`.cell[data-c="${c}"][data-r="${r}"] .symbol`); if(el) el.classList.add('winning');}); }
function clearWins(){document.querySelectorAll('.winning').forEach(e=>e.classList.remove('winning'))}
function openBonus(){ $('bonusText').textContent='3 o più Grandi Leprus: si apre il Manuale e partono i Free Spins.'; $('bonusOverlay').classList.remove('hidden'); beep(900,.25);}
function startFreeSpins(){ const pick=SYMBOLS.filter(s=>!s.type)[Math.floor(Math.random()*8)]; expandingSymbol=pick; freeSpins=10; showToast(`SIMBOLO ESPANDIBILE: ${pick.name}`); setTimeout(spin,700);}
function openTemple(){ const mults=[20,50,100,250,500].sort(()=>Math.random()-.5); const doors=$('doors'); doors.innerHTML=''; $('closeTemple').classList.add('hidden'); $('templeOverlay').classList.remove('hidden'); mults.forEach((m,i)=>{const d=document.createElement('button'); d.className='door'; d.textContent=i+1; d.onclick=()=>{ if(d.classList.contains('open'))return; d.classList.add('open'); d.textContent=m+'x'; const prize=m*bet/10; credits+=prize; win+=prize; render(); showToast(`TEMPIO: +${Math.floor(prize)}`); $('closeTemple').classList.remove('hidden'); [...doors.children].forEach(x=>x.disabled=true);}; doors.appendChild(d);}); }
function showToast(t){ const el=$('toast'); el.textContent=t; el.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>el.classList.remove('show'),1600);}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
init();
