const $=s=>document.querySelector(s);
const cards=[...document.querySelectorAll('.times button')];
const turn=$('#turn'),postback=$('#postback');
turn.onclick=()=>{postback.hidden=!postback.hidden;turn.setAttribute('aria-expanded',String(!postback.hidden));turn.textContent=postback.hidden?'翻到明信片背面':'收起背面题字'};
const services=[
 {id:'morning',name:'晨班',eta:'09:22',alt:'晨雾中的湖岸、栈桥和白船',forecast:'晨雾贴着水面。最先露出来的是码头，随后才看得见白船。',stages:['西坡 · 入雾','右窗 · 雾散','西坡 · 再次入雾']},
 {id:'afternoon',name:'午班',eta:'14:52',alt:'午后草坡上的缆车投影与钢架支柱',forecast:'午后的日光斜照西坡。支架旁的草地上，可以看见自己车厢的投影。',stages:['西坡 · 向阳面','支架 · 下方投影','西坡 · 越过支架']},
 {id:'evening',name:'末班',eta:'17:32',alt:'暮色中三盏站灯沿湖岸亮起',forecast:'末班经过旧站台时，请留意窗边的停靠灯。亮满三盏，就快到站了。',stages:['西坡 · 暮色','旧站 · 停靠信号','旧站 · 再次呼叫']}
];
let service=services[0];
const runWindow=$('.run-view');
cards.forEach((card,i)=>card.onclick=()=>{
 service=services[i];
 document.body.dataset.run=service.id;
 for(const b of cards)b.setAttribute('aria-pressed',String(b===card));
 const preview=$('#run-preview');
 preview.src='west-'+service.id+'.png';preview.alt=service.alt;
 write($('#run-caption'),'西坡右窗 · '+service.name);
 write($('#run-eta'),'预计抵达 '+service.eta);
 write($('#weather'),service.forecast);
 write($('#other-time'),card.textContent);write($('#stub-time'),card.textContent);redraw();
});
const clamp=v=>Math.max(0,Math.min(1,v));
const map=$('.map'),ride=$('.ride'),cross=$('.crossing'),finale=$('.finale');
const journey=$('.journey');
const stage=$('.journey-stage');
const scenes=[...stage.children];
const durations=[2.5,4.0,4.2,3.1,3.8,6.7,4.7,4.8,7.4];
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
const closeup=$('.impact-shot img');
const lastShots={
 lake:['impact-lake.png','玻璃碎在身后，水面冲到眼前，那张脸已经在房间里面。'],
 pine:['impact-pine.png','从枕头仰看，倒悬的脸垂到眼前，两只手压住枕头两侧。'],
 ridge:['impact-ridge.png','门后的人伸手扣住门框内侧，一束光照亮近处的眼睛。']
};
let loadedShot='';
function prepareCloseup(key){
 if(closeup.dataset.key===key)return;
 const [src]=lastShots[key];
 closeup.dataset.key=key;
 loadedShot='';
 closeup.onload=()=>{if(closeup.currentSrc.endsWith('/'+src)){loadedShot=key;redraw()}};
 closeup.src=src;
}
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
 ride.style.setProperty('--lake',clamp((r-.45)/.42)*.52);write($('#ride-cn'),service.stages[r<.41?0:r<.76?1:2]);
 const look=smooth(.12,.38,r);
 ride.style.setProperty('--look',look);
 ride.style.setProperty('--side-pan',(-2+4*smooth(.2,.93,r))+'%');
 ride.style.setProperty('--fogbank',.40-.34*smooth(.32,.58,r)+.60*smooth(.70,.95,r));
 ride.style.setProperty('--stray',smooth(.41,.57,r)*(1-.22*smooth(.85,1,r)));
 ride.style.setProperty('--shadow-cross',(-130+210*smooth(.42,.90,r))+'%');
 const signals=smooth(.54,.68,r)*(1-smooth(.70,.78,r));
 ride.style.setProperty('--lamp-a',Math.max(smooth(.29,.38,r)*(1-smooth(.7,.78,r)),smooth(.85,.91,r)));
 ride.style.setProperty('--lamp-b',smooth(.41,.49,r)*(1-smooth(.7,.78,r)));
 ride.style.setProperty('--lamp-c',signals);
 if(runWindow.getAttribute('aria-label')!==service.alt)runWindow.setAttribute('aria-label',service.alt);
 cross.style.setProperty('--zoom',1+s*.38);cross.style.setProperty('--ghost',clamp((s-.35)/.27)*.84);cross.style.setProperty('--boardscale',.72+s*.48);
 cross.style.setProperty('--key-glint',smooth(.31,.61,s)*(1-.69*smooth(.78,.98,s)));
 cross.style.setProperty('--sway',(8-17*smooth(.25,.73,s)+5*smooth(.75,1,s))+'deg');
 cross.style.setProperty('--card-size',.43+.40*smooth(.28,.79,s));
 write($('#station-note'),s<.4?'对向车在这里交会。':s<.78?'对面的窗亮了一下。':'对向车 · 上行');
 const sh=progress(shore);
 const pass=sh<.5?sh*2:(sh-.5)*2;
 shore.style.setProperty('--drift',(pass-.5)*5+'%');
 const shoreLight={morning:.86,afternoon:.97,evening:.44}[service.id];
 shore.style.setProperty('--shore-light',shoreLight*(1-.40*smooth(.32,.91,sh)));
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
 updateFrontDesk(m,r,pause,s,walk,hall,room);
 const key=document.body.dataset.print;
 if(hall>0 || room>0)prepareCloseup(key);
 const dip=smooth(.27,.41,room)*(1-smooth(.45,.63,room));
 const strike=room>=.82 && loadedShot===key;
 const shutter=.87*smooth(.735,.815,room)*(1-smooth(.82,.86,room));
 guestroom.classList.toggle('strike',strike);
 const occupied=smooth(.38,.56,room);
 guestroom.style.setProperty('--ajar',(-5-103*smooth(.08,.49,room))+'%');
 guestroom.style.setProperty('--exposure',.15*(1-smooth(.15,.34,room))+.89*dip+shutter);
 guestroom.style.setProperty('--occupied',occupied);
 const reveal=smooth(.34,.64,room);
 guestroom.style.setProperty('--flood',(100-100*reveal)+'%');
 guestroom.style.setProperty('--canopy',(100-100*reveal)+'%');
 guestroom.style.setProperty('--rift',((1-reveal)*110)+'%');
 guestroom.style.setProperty('--cant',(2.2*smooth(.40,.70,room)-3.8*smooth(.71,.96,room))+'deg');
 guestroom.style.setProperty('--approach',1+.075*smooth(.08,.43,room)+.42*smooth(.58,.74,room));
 guestroom.style.setProperty('--credit',(1-smooth(.28,.46,room))+smooth(.934,.982,room));
 guestroom.classList.toggle('arrived',room>.95);
 $('#back').tabIndex=room>.95?0:-1;
 write($('#night-line'),room<.51?'湖景客房 · 二层':'房卡已取　／　'+printName);
 const roomAlt=strike?lastShots[key][1]:occupied>.6?path.alt:'从门口望见床头的铜灯与湖景窗';
 if(roomView.getAttribute('aria-label')!==roomAlt)roomView.setAttribute('aria-label',roomAlt);
 if(on && lastRoom<.53 && room>=.53 && room-lastRoom<.1)tap();
 lastRoom=room;
 if(on)gain.gain.setTargetAtTime((.035*(1-.85*smooth(.72,.87,f))+.011*smooth(.91,.99,f))*(1-smooth(.80,.84,ending)),audio.currentTime,.3);
 if(hum)hum.frequency.setTargetAtTime(56+m*9-r*11-s*6+f*9,audio.currentTime,.3);
}

const desk=$('#desk'), deskButton=$('.desk-open'), note=$('.desk-note');
const deskLines=['选好班次和房卡，可以在这里核对。','上行班次已抄送湖翼前台。','回程联和去程联上的时间相同。','门口灯亮着。钥匙已经交付。','回执副本留在房内。'];
const memories=[
 [$('#postmark'),2,'静泊旅馆明信片　·　湖岸西侧','静泊旅馆明信片　·　从房内寄出'],
 [$('#arrival-directions'),3,$('#arrival-directions').textContent,'下缆车后，沿石阶到花箱下的双扇门。湖景客房在二楼。你进来的那扇绿门，原本在走廊尽头。']
];
let furthest=0, noticeTimer;
function dismissNote(){clearTimeout(noticeTimer);note.classList.remove('show')}
function updateFrontDesk(mapPos,ridePos,woods,passing,arrivalPos,hallPos,roomPos){
 const tone=arrivalPos>.2?'carbon':woods>.12?'night':ridePos>.1?'mist':'paper';
 if(document.body.dataset.tone!==tone)document.body.dataset.tone=tone;
 const point=roomPos>.7?4:arrivalPos>.46?3:passing>.55?2:mapPos>.62?1:0;
 if(point>furthest){
  furthest=point;
  write(note.querySelector('span'),deskLines[point]);
  dismissNote();
  if(point<4 && !desk.open){
   note.classList.add('show');noticeTimer=setTimeout(dismissNote,3600);
  }
 }
 document.body.classList.toggle('has-mail',furthest>0);
 document.body.style.setProperty('--read',clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)).toFixed(4));
 for(const [el,threshold,normal,changed] of memories){
  if(furthest<threshold || el.textContent===changed)continue;
  const box=el.getBoundingClientRect();
  if(box.bottom<0 || box.top>innerHeight)write(el,changed);
 }
 write($('#receipt-time'),$('.times [aria-pressed="true"]').textContent);
 write($('#receipt-print'),printName);
 write($('#receipt-where'),furthest>=3?'206 · 房内':furthest===2?'湖翼前台　／　副本':'湖翼前台');
 write($('#receipt-message'),deskLines[furthest]);
 desk.toggleAttribute('data-signed',furthest>=3);
 landing.style.setProperty('--beam',(.82*smooth(.22,.86,hallPos)).toFixed(3));
}
deskButton.addEventListener('click',()=>{dismissNote();desk.showModal()});
$('#desk-close').addEventListener('click',()=>desk.close());
$('#desk-edit').addEventListener('click',()=>desk.close());
desk.addEventListener('click',event=>{if(event.target===desk)desk.close()});
const motionOK=matchMedia('(prefers-reduced-motion: no-preference)');
stage.addEventListener('pointermove',event=>{
 if(event.pointerType==='touch'||!motionOK.matches||!landing.hasAttribute('data-visible'))return;
 const box=stage.getBoundingClientRect();
 landing.style.setProperty('--beam-x',(100*clamp((event.clientX-box.left)/box.width))+'%');
 landing.style.setProperty('--beam-y',(100*clamp((event.clientY-box.top)/box.height))+'%');
},{passive:true});
function startFresh(event){
 event.preventDefault();dismissNote();furthest=0;
 for(const [el,threshold,normal] of memories)write(el,normal);
 const anchor=event.currentTarget.hash;
 history.replaceState(null,'',anchor);
 const target=anchor==='#top'?$('.logo'):$('.print-picks [aria-pressed="true"]');
 const section=document.querySelector(anchor);
 window.scrollTo({top:anchor==='#top'?0:section.getBoundingClientRect().top+scrollY-68,behavior:'instant'});
 target.focus({preventScroll:true});redraw();
}
$('#back').addEventListener('click',startFresh);
$('.replay-key').addEventListener('click',startFresh);

let frame=0;function redraw(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;paint()})}
addEventListener('scroll',redraw,{passive:true});addEventListener('resize',redraw);paint();