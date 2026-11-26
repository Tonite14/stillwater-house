const $=s=>document.querySelector(s);
const cards=[...document.querySelectorAll('.times button')];
const turn=$('#turn'),postback=$('#postback');
turn.onclick=()=>{postback.hidden=!postback.hidden;turn.setAttribute('aria-expanded',String(!postback.hidden));turn.textContent=postback.hidden?'翻到明信片背面':'收起背面题字'};
const forecasts=['晨雾贴着水面。坐右边，能看见码头。','午后的光落在西坡。经过支架时，留意湖面的影子。','末班车会经过亮灯的旅馆。日落后，请把车窗留一条缝。'];
cards.forEach((card,i)=>card.onclick=()=>{
 for(const b of cards)b.setAttribute('aria-pressed',String(b===card));
 $('#weather').textContent=forecasts[i];$('#other-time').textContent=card.textContent;$('#stub-time').textContent=card.textContent;
});
const clamp=v=>Math.max(0,Math.min(1,v));
const map=$('.map'),ride=$('.ride'),cross=$('.crossing'),finale=$('.finale');
function progress(el){const r=el.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight))}
function write(node,value){if(node.textContent!==value)node.textContent=value}
const notes=['出了山下站，缆线沿着杉林上升。','西坡支架下，是旧码头。','过了这根支架，地图上就只剩一条线。'];
let audio,gain,hum,on=false;
$('#sound').onclick=async()=>{
 if(!audio){audio=new AudioContext();gain=audio.createGain();gain.gain.value=0;hum=audio.createOscillator();hum.type='triangle';hum.frequency.value=56;hum.connect(gain);gain.connect(audio.destination);hum.start()}
 await audio.resume();on=!on;gain.gain.setTargetAtTime(on?.035:0,audio.currentTime,.35);$('#sound').setAttribute('aria-pressed',String(on));$('#sound').textContent=on?'声音开':'声音关';
};
const shore=$('.shorepass');
function smooth(from,to,p){const t=clamp((p-from)/(to-from));return t*t*(3-2*t)}
let previousFinal=0;
function tap(){
 const time=audio.currentTime,osc=audio.createOscillator(),envelope=audio.createGain();
 osc.type='sine';osc.frequency.setValueAtTime(160,time);osc.frequency.exponentialRampToValueAtTime(47,time+.17);
 envelope.gain.setValueAtTime(.067,time);envelope.gain.exponentialRampToValueAtTime(.0001,time+.26);
 osc.connect(envelope);envelope.connect(audio.destination);osc.onended=()=>{osc.disconnect();envelope.disconnect()};osc.start();osc.stop(time+.28);
}
function paint(){
 const m=progress(map),r=progress(ride),s=progress(cross),f=progress(finale);
 map.style.setProperty('--travel',(2+m*96)+'%');map.style.setProperty('--echo',clamp((m-.60)/.20)*.88);map.style.setProperty('--echo-x',(94-32*clamp((m-.58)/.42))+'%');write($('#map-note'),notes[Math.min(2,Math.floor(m*3))]);
 ride.style.setProperty('--rim',(1-clamp(r*2.4))*5+'vw');ride.style.setProperty('--zoom',1+r*.44);ride.style.setProperty('--light',1-r*.45);
 ride.style.setProperty('--lake',clamp((r-.45)/.42)*.52);write($('#ride-cn'),r<.38?'西坡 · 车窗朝北':r<.74?'西坡 · 湖岸亮灯':'西坡 · 即将转向');
 cross.style.setProperty('--zoom',1+s*.38);cross.style.setProperty('--ghost',clamp((s-.35)/.27)*.84);cross.style.setProperty('--boardscale',.72+s*.48);
 write($('#station-note'),s<.4?'对向车在这里交会。':s<.78?'对面的窗亮了一下。':'对向车 · 上行');
 const sh=progress(shore);
 const pass=sh<.5?sh*2:(sh-.5)*2;
 shore.style.setProperty('--drift',(pass-.5)*5+'%');
 shore.style.setProperty('--shore-light',.84-smooth(.32,.91,sh)*.37);
 shore.style.setProperty('--shore-color',.87-smooth(.33,.88,sh)*.51);
 shore.style.setProperty('--pillar',(-125+smooth(.34,.67,sh)*680)+'%');
 write($('#shore-marker'),sh<.49?'WEST PYLON　/　西坡支架':'NORTH FACE　/　北坡');
 write($('#shore-label'),sh<.28?'右窗 · 湖岸':sh<.53?'西坡支架':sh<.79?'右窗 · 背山侧':'红屋顶。右边的木桩上，还是那条白船。');
 const outside=smooth(.67,.80,f);
 const roof=smooth(.855,.947,f);
 finale.style.setProperty('--roof',roof);
 finale.style.setProperty('--roof-scale',1+.12*smooth(.90,1,f));
 if(on && f>previousFinal && f-previousFinal<.12 && [.40,.50,.848].some(t=>previousFinal<t && f>=t))tap();
 previousFinal=f;
 finale.style.setProperty('--outside',outside);
 finale.style.setProperty('--outside-scale',1+.18*clamp((f-.84)/.16));
 finale.style.setProperty('--stub',clamp((f-.85)/.1)*.52);
 const closed=smooth(.15,.32,f),opening=smooth(.42,.63,f);
 finale.style.setProperty('--open',1-closed+opening);finale.style.setProperty('--near',f>.35?1:0);finale.style.setProperty('--lean',1+.26*clamp((f-.7)/.3));
 write($('#end-en'),f<.47?'TERMINUS':f<.78?'RETURN SERVICE':'LOWER STATION');
 write($('#end-cn'),f<.28?'旅馆站':f<.48?'请先下后上。':f<.67?'车门已关闭':f<.85?'车内无人按铃。':f<.95?'声响来自车顶。':'到站后，请从另一侧下车。');
 if(hum)hum.frequency.setTargetAtTime(56+m*9-r*11-s*6+f*9,audio.currentTime,.3);
}
let frame=0;function redraw(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint()})}
addEventListener('scroll',redraw,{passive:true});addEventListener('resize',redraw);paint();