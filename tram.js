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
const journey=$('.journey');
const stage=$('.journey-stage');
const scenes=[...stage.children];
const durations=[2.5,3.0,4.2,3.1,3.8,6.7,4.7,4.8,5.8];
const dissolve=.62;
let timelineEnd=0;
const timings=scenes.map((scene,i)=>{
 const start=i===0?0:timelineEnd-dissolve;
 timelineEnd=start+durations[i];
 return {scene,start,end:timelineEnd};
});
journey.style.setProperty('--journey-length',((timelineEnd+1)*100)+'svh');
journey.classList.add('running');
const sceneProgress=new Map();
function progress(el){return sceneProgress.get(el)}
function advanceJourney(){
 const bounds=journey.getBoundingClientRect();
 const time=timelineEnd*clamp(-bounds.top/Math.max(1,bounds.height-stage.offsetHeight));
 timings.forEach(({scene,start,end},i)=>{
  const local=time-start;
  const pct=clamp(local/durations[i]);
  sceneProgress.set(scene,pct);
  const visible=local>=0 && (time<end || i===scenes.length-1);
  const blend=i===0?1:smooth(0,dissolve,local);
  const captionIn=i===0?1:smooth(.48,.91,local);
  const captionOut=i===scenes.length-1?1:1-smooth(end-dissolve-.24,end-dissolve+.12,time);
  scene.toggleAttribute('data-visible',visible);
  scene.inert=!visible || blend<.5 || (i<scenes.length-1 && time>end-dissolve/2);
  scene.style.setProperty('--blend',blend.toFixed(4));
  scene.style.setProperty('--caption',(captionIn*captionOut).toFixed(4));
 });
}
function write(node,value){if(node.textContent!==value)node.textContent=value}
const notes=['出了山下站，缆线沿着杉林上升。','西坡支架下，是旧码头。','过了这根支架，地图上就只剩一条线。'];
let audio,gain,hum,on=false;
$('#sound').onclick=async()=>{
 if(!audio){audio=new AudioContext();gain=audio.createGain();gain.gain.value=0;hum=audio.createOscillator();hum.type='triangle';hum.frequency.value=56;hum.connect(gain);gain.connect(audio.destination);hum.start()}
 await audio.resume();on=!on;gain.gain.setTargetAtTime(on?.035:0,audio.currentTime,.35);$('#sound').setAttribute('aria-pressed',String(on));$('#sound').textContent=on?'声音开':'声音关';
};
const seatButtons=[...document.querySelectorAll('.seat-picks button')];
const seatViews=[['skylight.png','从座位仰望观景窗，窗外是天光与树梢','顶窗'],['cabin.png','从前排座位望向缆线与前方的旅馆','前排']];
seatButtons.forEach((button,index)=>button.onclick=()=>{
 const [src,alt,caption]=seatViews[index];$('#seat-view').src=src;$('#seat-view').alt=alt;
 write($('#seat-caption'),'车内导览　／　'+caption);
 seatButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
});
const arrival=$('.arrival'),landing=$('.landing'),landingView=$('.landing-view');
const hallDescriptions={lake:'脚下的地毯被一层静水淹没，倒影里有人站在门前。',pine:'绿门上方垂下一枝杉树，影子落在墙上，地毯上散着细针。',ridge:'尽头的绿门敞开着，里面仍是这条红地毯走廊。'};
const guestroom=$('.guestroom');
const roomView=$('.room-take');
const printChoices=[...document.querySelectorAll('.print-picks button')];
const printedNames=[...document.querySelectorAll('[data-key-name]')];
let printName='湖纹';
printChoices.forEach(button=>button.addEventListener('click',()=>{
 document.body.dataset.print=button.dataset.print;
 printName=button.textContent;
 printedNames.forEach(label=>write(label,printName));
 printChoices.forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
 redraw();
}));
let lastRoom=0;
const listening=$('.listening');
let lastInterval=0;
const shore=$('.shorepass');
function smooth(from,to,p){const t=clamp((p-from)/(to-from));return t*t*(3-2*t)}
let previousFinal=0;
const paths={
 lake:{pitch:278,fall:92,voice:'sine',beats:[.33,.57,.86],station:'水面以上',notice:'车窗内侧有水。',alt:'积水漫进客房，一只巨大的眼睛贴在蓄满湖水的窗外。'},
 pine:{pitch:165,fall:43,voice:'triangle',beats:[.34,.41,.84],station:'车顶观景窗',notice:'窗扣已松开。',alt:'树影从床头退开，穿制服的人倒悬在上方，向床边俯身。'},
 ridge:{pitch:83,fall:33,voice:'sine',beats:[.29,.50,.71,.92],station:'第二站台',notice:'下一站　／　本站',alt:'床后墙面错开，一列歪斜的走廊向内延伸，每一个门框里都站着同一个人。'}
};
function tap(){
 const time=audio.currentTime,osc=audio.createOscillator(),envelope=audio.createGain();
 const signal=paths[document.body.dataset.print];
 osc.type=signal.voice;osc.frequency.setValueAtTime(signal.pitch,time);osc.frequency.exponentialRampToValueAtTime(signal.fall,time+.17);
 envelope.gain.setValueAtTime(.067,time);envelope.gain.exponentialRampToValueAtTime(.0001,time+.26);
 osc.connect(envelope);envelope.connect(audio.destination);osc.onended=()=>{osc.disconnect();envelope.disconnect()};osc.start();osc.stop(time+.28);
}
function paint(){
 advanceJourney();
 const path=paths[document.body.dataset.print];
 const m=progress(map),r=progress(ride),s=progress(cross);
 const ending=progress(finale),f=clamp(ending/.78);
 map.style.setProperty('--travel',(2+m*96)+'%');map.style.setProperty('--echo',clamp((m-.60)/.20)*.88);map.style.setProperty('--echo-x',(94-32*clamp((m-.58)/.42))+'%');write($('#map-note'),notes[Math.min(2,Math.floor(m*3))]);
 ride.style.setProperty('--rim',(1-clamp(r*2.4))*5+'vw');ride.style.setProperty('--zoom',1+r*.44);ride.style.setProperty('--light',1-r*.45);
 ride.style.setProperty('--lake',clamp((r-.45)/.42)*.52);write($('#ride-cn'),r<.38?'西坡 · 车窗朝北':r<.74?'西坡 · 湖岸亮灯':'西坡 · 即将转向');
 cross.style.setProperty('--zoom',1+s*.38);cross.style.setProperty('--ghost',clamp((s-.35)/.27)*.84);cross.style.setProperty('--boardscale',.72+s*.48);
 cross.style.setProperty('--key-glint',smooth(.31,.61,s)*(1-.69*smooth(.78,.98,s)));
 cross.style.setProperty('--sway',(8-17*smooth(.25,.73,s)+5*smooth(.75,1,s))+'deg');
 cross.style.setProperty('--card-size',.43+.40*smooth(.28,.79,s));
 write($('#station-note'),s<.4?'对向车在这里交会。':s<.78?'对面的窗亮了一下。':'对向车 · 上行');
 const sh=progress(shore);
 const pass=sh<.5?sh*2:(sh-.5)*2;
 shore.style.setProperty('--drift',(pass-.5)*5+'%');
 shore.style.setProperty('--shore-light',.84-smooth(.32,.91,sh)*.37);
 shore.style.setProperty('--shore-color',.87-smooth(.33,.88,sh)*.51);
 shore.style.setProperty('--pillar',(-125+smooth(.34,.67,sh)*680)+'%');
 write($('#shore-marker'),sh<.49?'WEST PYLON　/　西坡支架':'NORTH FACE　/　北坡');
 write($('#shore-label'),sh<.28?'右窗 · 湖岸':sh<.53?'西坡支架':sh<.79?'右窗 · 背山侧':'北坡　／　右窗');
 const pause=progress(listening);
 listening.style.setProperty('--omen',smooth(.23,.84,pause));
 listening.style.setProperty('--slip',((smooth(.26,.87,pause)-.5)*21)+'%');
 listening.style.setProperty('--waterline',(90-65*smooth(.23,.9,pause))+'%');
 listening.style.setProperty('--tilt',1+.14*pause);
 listening.style.setProperty('--ambient',.78-.46*smooth(.13,.95,pause));
 listening.style.setProperty('--tint',.82-.4*pause);
 listening.style.setProperty('--sweep',(-95+smooth(.10,.6,pause)*185)+'%');
 write($('#interval'),pause<.42?'两座支架之间':pause<.78?'已驶出林线':'林线以上　／　闭窗运行');
 if(on && pause>lastInterval && pause-lastInterval<.10 && path.beats.some(t=>lastInterval<t && pause>=t))tap();
 lastInterval=pause;
 const outside=smooth(.59,.70,f);
 finale.style.setProperty('--ceiling',smooth(.71,.79,f));
 finale.style.setProperty('--turn',(32*smooth(.79,.87,f))+'deg');
 const roof=smooth(.877,.969,f);
 finale.style.setProperty('--roof',roof);
 finale.style.setProperty('--roof-scale',1+.12*smooth(.90,1,f));
 if(on && f>previousFinal && f-previousFinal<.12 && [.40,.50,.848].some(t=>previousFinal<t && f>=t))tap();
 previousFinal=f;
 finale.style.setProperty('--passage',smooth(.31,.77,ending));
 finale.style.setProperty('--nested-scale',.65+.38*smooth(.37,.98,ending));
 finale.style.setProperty('--water-level',(80-67*smooth(.32,.89,ending))+'%');
 finale.style.setProperty('--outside',outside);
 finale.style.setProperty('--outside-scale',1+.18*clamp((f-.84)/.16));
 finale.style.setProperty('--stub',clamp((f-.85)/.1)*.52);
 const closed=smooth(.15,.32,f),opening=smooth(.42,.63,f);
 const secondClose=smooth(.77,.835,ending),secondOpen=smooth(.863,.936,ending);
 finale.style.setProperty('--inside',ending>=.84?1:0);
 finale.style.setProperty('--inside-scale',1+.13*smooth(.89,.99,ending));
 finale.style.setProperty('--edge',.58*smooth(.89,.99,ending));
 
 finale.style.setProperty('--open',1-closed+opening-secondClose+secondOpen);finale.style.setProperty('--near',f>.35?1:0);finale.style.setProperty('--lean',1+.26*clamp((f-.7)/.3));
 write($('#end-en'),ending>.84?'ARRIVAL':f<.47?'TERMINUS':'IN TRANSIT');
 write($('#end-cn'),ending>.94?'旅馆站':ending>.73?path.notice:f<.28?'旅馆站':f<.48?'请先下后上。':path.station);
 const walk=progress(arrival);
 arrival.style.setProperty('--shore-step',1.06+.40*smooth(.04,.52,walk));
 arrival.style.setProperty('--at-door',smooth(.35,.62,walk));
 arrival.style.setProperty('--porch-step',1+.32*smooth(.53,.98,walk));
 arrival.style.setProperty('--porch-light',.91-.18*smooth(.75,1,walk));
 arrival.style.setProperty('--arrival-ink',smooth(.10,.20,walk)*(1-smooth(.30,.44,walk))+.88*smooth(.62,.69,walk)*(1-smooth(.78,.92,walk)));
 write($('#arrival-caption'),walk<.50?'湖岸步道':'正门 · 晚间入口');
 const hall=progress(landing);
 landing.style.setProperty('--pace',1+.17*smooth(.08,.35,hall)+.58*smooth(.58,.94,hall));
 landing.style.setProperty('--daylight',.68-.16*smooth(.12,.43,hall));
 landing.style.setProperty('--lamps',smooth(.27,.61,hall));
 landing.style.setProperty('--shadow',.22+.48*smooth(.46,.91,hall));
 landing.style.setProperty('--hall-ink',smooth(.11,.20,hall)*(1-smooth(.32,.49,hall)));
 const hallDescription=hall<.49?'沿着红色地毯走向尽头的绿门':hallDescriptions[document.body.dataset.print];
 if(landingView.getAttribute('aria-label')!==hallDescription)landingView.setAttribute('aria-label',hallDescription);
 const room=progress(guestroom);
 const dip=smooth(.35,.54,room)*(1-smooth(.59,.81,room));
 const occupied=smooth(.47,.66,room);
 guestroom.style.setProperty('--ajar',(-5-103*smooth(.08,.49,room))+'%');
 guestroom.style.setProperty('--exposure',.15*(1-smooth(.15,.34,room))+.89*dip);
 guestroom.style.setProperty('--occupied',occupied);
 const reveal=smooth(.42,.79,room);
 guestroom.style.setProperty('--flood',(100-100*reveal)+'%');
 guestroom.style.setProperty('--canopy',(100-100*reveal)+'%');
 guestroom.style.setProperty('--rift',((1-reveal)*110)+'%');
 guestroom.style.setProperty('--cant',(2.2*smooth(.40,.70,room)-3.8*smooth(.71,.96,room))+'deg');
 guestroom.style.setProperty('--approach',1+.075*smooth(.08,.43,room)+.66*smooth(.66,.975,room));
 guestroom.style.setProperty('--credit',(1-smooth(.28,.46,room))+smooth(.86,.97,room));
 guestroom.classList.toggle('arrived',room>.95);
 $('#back').tabIndex=room>.95?0:-1;
 write($('#night-line'),room<.51?'湖景客房 · 二层':'房卡已取　／　'+printName);
 const roomAlt=occupied>.6?path.alt:'从门口望见床头的铜灯与湖景窗';
 if(roomView.getAttribute('aria-label')!==roomAlt)roomView.setAttribute('aria-label',roomAlt);
 if(on && lastRoom<.53 && room>=.53 && room-lastRoom<.1)tap();
 lastRoom=room;
 if(on)gain.gain.setTargetAtTime((.035*(1-.85*smooth(.72,.87,f))+.011*smooth(.91,.99,f))*(1-smooth(.80,.84,ending)),audio.currentTime,.3);
 if(hum)hum.frequency.setTargetAtTime(56+m*9-r*11-s*6+f*9,audio.currentTime,.3);
}
let frame=0;function redraw(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint()})}
addEventListener('scroll',redraw,{passive:true});addEventListener('resize',redraw);paint();