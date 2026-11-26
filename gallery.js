const pick=s=>document.querySelector(s);
const plates=[
 {file:'lodge.jpg',caption:'湖岸，傍晚'},
 {file:'west-landing.png',caption:'二楼西廊，午后'},
 {file:'desk.png',caption:'前台，闭馆前'}];
let index=0,examined=null;
const albumImage=pick('#album-img'),viewer=pick('#viewer');
function showPlate(step){
 index=(index+step+plates.length)%plates.length;
 const plate=plates[index];albumImage.src=plate.file;albumImage.alt=plate.caption;
 pick('#caption').textContent=plate.caption;pick('#count').textContent='0'+(index+1)+' / 03';
}
pick('#prev').onclick=()=>showPlate(-1);pick('#next').onclick=()=>showPlate(1);
function enlarge(){examined=index;pick('#original').src=plates[index].file;pick('#original').alt=plates[index].caption;pick('#orig-label').textContent=plates[index].caption;viewer.showModal();update()}
pick('#open').onclick=pick('#enlarge').onclick=enlarge;pick('#close').onclick=()=>viewer.close();
const proof=pick('.proof'),reverse=pick('.reverse'),last=pick('.last'),mirror=pick('.reflection');
const clamp=x=>Math.min(1,Math.max(0,x));
function depth(section){const r=section.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight))}
let ctx,volume,hum,enabled=false;
pick('#sound').onclick=async()=>{
 if(!ctx){ctx=new AudioContext();volume=ctx.createGain();volume.gain.value=0;volume.connect(ctx.destination);hum=ctx.createOscillator();hum.frequency.value=78;hum.connect(volume);hum.start()}
 await ctx.resume();enabled=!enabled;volume.gain.setTargetAtTime(enabled?.045:0,ctx.currentTime,.35);
 pick('#sound').setAttribute('aria-pressed',String(enabled));pick('#sound').textContent=enabled?'环境音开':'环境音关';
};
const proofLabel=pick('#proof-label'),credit=pick('#credit'),side=pick('#side'),endLine=pick('#end-line');
function update(){
 const a=depth(proof),b=depth(reverse),c=depth(last);
 proof.style.setProperty('--border',(6*(1-clamp(a*1.9)))+'vw');proof.style.setProperty('--z',1+a*1.55);
 proof.style.setProperty('--dim',1-a*.64);proof.style.setProperty('--sat',1-a*.72);
 proofLabel.textContent=a<.38?'西廊 · 原幅':a<.76?'西廊 · 局部':'相机所在位置：门内';
 reverse.style.setProperty('--z',1+b*.52);
 credit.textContent=b<.42?'拍摄位置：西廊尽头':b<.76?'照片里没有镜子。':'玻璃上还有一层反光。';
 last.style.setProperty('--z',1+Math.min(c,.42)*3.1);last.style.setProperty('--eye',clamp((c-.31)/.065));last.style.setProperty('--face',clamp((c-.77)/.045));last.style.setProperty('--reflection',clamp((c-.40)/.12)*(1-clamp((c-.725)/.045))*.88);
 if(examined!==null){mirror.style.backgroundImage='linear-gradient(#12211748,#0b141a76),url('+plates[examined].file+')';mirror.querySelector('i').textContent='原图　0'+(examined+1)}
 side.textContent=c<.35?'原图':c<.77?'反光':'背面';
 endLine.textContent=c<.35?'玻璃的另一面':c<.77?(examined===null?'窗里亮着旅馆的首页。':'你刚才放大的那一张。'):'焦点落在玻璃外面。';
 if(hum)hum.frequency.setTargetAtTime(78-22*a-12*c,ctx.currentTime,.4);
}
function focusMark(x,y){reverse.style.setProperty('--x',Math.round(x*100)+'%');reverse.style.setProperty('--y',Math.round(y*100)+'%')}
reverse.addEventListener('pointermove',e=>focusMark(clamp(e.clientX/innerWidth),clamp(e.clientY/innerHeight)),{passive:true});
reverse.addEventListener('pointerleave',()=>focusMark(.5,.5));
let frame=0;function redraw(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;update()})}
addEventListener('scroll',redraw,{passive:true});addEventListener('resize',redraw);update();