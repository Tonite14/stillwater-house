const hall=document.querySelector('.end'),scene=document.querySelector('.scene'),words=document.querySelector('.words'),sound=document.querySelector('.sound');
let audio,volume,drone,last=-1;
const shots=[
  ['二楼走廊　03:17:00','门外站着夜班服务生。','他的右手垂在膝盖下面。铜钥匙在手指间轻轻地转。'],
  ['二楼走廊　03:17:01','他一直站在原地。','走廊却少了一扇门。又少了一扇。'],
  ['猫眼　03:17:02','你刚贴近玻璃，它就眨了一下。','那只眼睛里倒映着你的房门。从里面看。'],
  ['207 客房　03:17:03','画面切到了你的床头。','枕头凹了下去。有什么东西正把脸贴过来。'],
  ['207 客房　03:17:04','「您的叫醒服务。」','铜钥匙落在你耳边。他还在等你睁眼。']
];
const disturbances=[
  {section:document.querySelector('.lakewatch')},
  {section:document.querySelector('.laundry'),fields:[['.folio dl>div:last-child dd','一位','两位 · 同一姓名']]},
  {section:document.querySelector('.lineboard'),fields:[['.panel div:last-child span:first-of-type','前台 → 207','207 → 207'],['.panel div:last-child span:last-child','呼叫中','床边已接听']]}
];
const clamp=x=>Math.max(0,Math.min(1,x));
function knock(){
  if(!audio||sound.getAttribute('aria-pressed')!=='true')return;
  const now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(115,now);osc.frequency.exponentialRampToValueAtTime(40,now+.18);
  gain.gain.setValueAtTime(.07,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);
  osc.connect(gain);gain.connect(audio.destination);osc.onended=()=>{osc.disconnect();gain.disconnect()};osc.start();osc.stop(now+.25);
}
const lake=document.querySelector('.lakewatch');

const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const cover=document.querySelector('.hero');
const clock=document.querySelector('.stay-clock');
const clockTime=clock.querySelector('time');
const stops=[...document.querySelectorAll('.chapter,.night,.end')].map(section=>({
 section,time:section.querySelector('.stamp')?.textContent.trim().slice(0,5)||(section===hall?'03:17':'03:16')
}));
const observer=new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries){
    if(isIntersecting){target.classList.add('played');observer.unobserve(target)}
  }
},{threshold:.23});
document.querySelectorAll('.journal,.room,.night').forEach(section=>observer.observe(section));
function moveCoverAndClock(){
  let time='18:40';
  for(const stop of stops){if(stop.section.getBoundingClientRect().top>innerHeight*.5)break;time=stop.time}
  if(clockTime.textContent!==time)clockTime.textContent=time;
  clock.style.setProperty('--read',clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
  if(!motionPreference.matches && scrollY<cover.offsetHeight+innerHeight){
    const offset=Math.min(scrollY,cover.offsetHeight);
    cover.style.setProperty('--landscape',offset*.09+'px');
    cover.style.setProperty('--headline',offset*.17+'px');
  }
}

function update(){
  moveCoverAndClock();
  const lakeProgress=clamp((innerHeight-lake.getBoundingClientRect().top)/(innerHeight+lake.offsetHeight));
  lake.style.setProperty('--window-zoom',1+lakeProgress*.45);
  for(const item of disturbances){
    const shifted=item.section.getBoundingClientRect().top<innerHeight*.18;
    if(shifted!==item.shifted){
      item.shifted=shifted;item.section.classList.toggle('disturbed',shifted);
      for(const [selector,before,after] of item.fields||[])item.section.querySelector(selector).textContent=shifted?after:before;
    }
  }
  const progress=clamp(-hall.getBoundingClientRect().top/Math.max(1,hall.offsetHeight-innerHeight));
  scene.style.setProperty('--zoom',1+Math.min(progress,.6)*2.4);
  scene.style.setProperty('--light',.78-.58*clamp((progress-.45)/.15));
  scene.style.setProperty('--eye',progress>=.38&&progress<.68?1:0);
  scene.style.setProperty('--eye-zoom',1+.68*clamp((progress-.38)/.30));
  scene.style.setProperty('--bed',progress>=.68?1:0);
  scene.style.setProperty('--lean',1+.40*clamp((progress-.68)/.32));
  scene.style.setProperty('--matte',(Math.sin(Math.PI*clamp(progress/.68))*9).toFixed(2)+'%');
  const stage=progress>=.85?4:progress>=.68?3:progress>=.38?2:progress>=.19?1:0;
  if(stage!==last){
    if(last>=0&&stage>last)knock();
    scene.dataset.shot=stage;
    const [camera,title,caption]=shots[stage];words.querySelector('small').textContent=camera;words.querySelector('h2').textContent=title;words.querySelector('p').textContent=caption;last=stage;
  }
  if(drone)drone.frequency.setTargetAtTime(74-progress*36,audio.currentTime,.25);
}
document.querySelector('#enter').onclick=()=>hall.scrollIntoView();
sound.onclick=async()=>{
  if(!audio){audio=new AudioContext();volume=audio.createGain();volume.gain.value=0;volume.connect(audio.destination);drone=audio.createOscillator();drone.type='triangle';drone.frequency.value=74;drone.connect(volume);drone.start();}
  await audio.resume();const on=sound.getAttribute('aria-pressed')!=='true';sound.setAttribute('aria-pressed',String(on));sound.lastChild.textContent=on?'　环境音开':'　环境音关';volume.gain.setTargetAtTime(on?.056:0,audio.currentTime,.35);update();
};
let frame=0;
function scheduleUpdate(){
  if(frame)return;
  frame=requestAnimationFrame(()=>{frame=0;update()});
}
addEventListener('scroll',scheduleUpdate,{passive:true});
addEventListener('resize',scheduleUpdate);
update();