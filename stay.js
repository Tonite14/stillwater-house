const hall=document.querySelector('.end'),scene=document.querySelector('.scene'),words=document.querySelector('.words'),sound=document.querySelector('.sound');
let audio,volume,drone,last=-1;
const lines=[['走廊尽头，有人。','它手里拿着你的房间钥匙。'],['它抬起了头。','猫眼另一边，也有一只眼睛。'],['声音在你身后。','门一直锁着。可镜子里，多了一位房客。']];
function update(){
  const progress=Math.min(1,Math.max(0,-hall.getBoundingClientRect().top/(hall.offsetHeight-innerHeight)));
  scene.style.setProperty('--zoom',1+progress*1.85);
  scene.style.setProperty('--light',.65+progress*.34);
  const stage=progress>.78?2:progress>.38?1:0;
  if(stage!==last){words.querySelector('h2').textContent=lines[stage][0];words.querySelector('p').textContent=lines[stage][1];words.querySelector('small').textContent='走廊监控　03:17:0'+stage;last=stage}
  if(drone)drone.frequency.setTargetAtTime(74-progress*30,audio.currentTime,.25);
}
document.querySelector('#enter').onclick=()=>hall.scrollIntoView();
sound.onclick=async()=>{
  if(!audio){audio=new AudioContext();volume=audio.createGain();volume.gain.value=0;volume.connect(audio.destination);drone=audio.createOscillator();drone.type='triangle';drone.frequency.value=74;drone.connect(volume);drone.start();}
  await audio.resume();const on=sound.getAttribute('aria-pressed')!=='true';sound.setAttribute('aria-pressed',String(on));sound.lastChild.textContent=on?'　环境音开':'　环境音关';volume.gain.setTargetAtTime(on?.056:0,audio.currentTime,.35);update();
};
addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();