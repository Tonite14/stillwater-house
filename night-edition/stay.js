const hall = document.querySelector('.end');
const scene = document.querySelector('.scene');
const clock = scene.querySelector('.clock');
const cue = scene.querySelector('.cue');
const heading = scene.querySelector('h2');
const caption = scene.querySelector('p');
const sound = document.querySelector('.sound');
const soundLabel = sound.querySelector('.sound-label');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const beats = [
  { at: 0, cue: '门缝', title: '走廊尽头还有灯。', line: '灯下面，站着一个人。', time: '03:17:00' },
  { at: .21, cue: '北翼', title: '她停了下来。', line: '积水里的倒影还在朝这边走。', time: '03:17:08' },
  { at: .47, cue: '北翼', title: '她抬起了头。', line: '她身后，整面墙随着她一起吸气。', time: '03:17:13' },
  { at: .69, cue: '湖面以下', title: '墙后全是湖水。', line: '湖里那一排眼睛，正顺着她回头的方向转动。', time: '03:17:16' },
  { at: .89, cue: '门的另一边', title: '它贴上了猫眼。', line: '它的眼睛里映着你的房间。有人已经站在门内。', time: '03:17:17' }
];

let activeBeat = -1;
let frame = 0;
let audio;
let changingSound = false;
let effectProgress = 0;
let soundGap = 0;

function easeBetween(value, start, end) {
  const ratio = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return ratio * ratio * (3 - 2 * ratio);
}

function render() {
  frame = 0;
  const scrollDistance = Math.max(1, hall.offsetHeight - scene.offsetHeight);
  const passed = -hall.getBoundingClientRect().top;
  const progress = Math.max(0, Math.min(1, passed / scrollDistance));
  const beat = beats.findLastIndex(item => progress >= item.at);
  if (beat !== activeBeat) {
    const current = beats[beat];
    scene.dataset.stage = beat;
    clock.textContent = current.time;
    cue.textContent = current.cue;
    heading.textContent = current.title;
    caption.textContent = current.line;
    activeBeat = beat;
  }
  const still = reducedMotion.matches;
  const arrival = easeBetween(progress, .12, .45);
  const reveal = easeBetween(progress, .52, .74);
  const closeup = easeBetween(progress, .855, .925);
  scene.style.setProperty('--woman', still ? Number(beat >= 2) : arrival.toFixed(3));
  scene.style.setProperty('--breach', still ? Number(beat >= 3) : reveal.toFixed(3));
  scene.style.setProperty('--eye', still ? Number(beat === 4) : closeup.toFixed(3));
  scene.style.setProperty('--eye-zoom', (1 + closeup * .115).toFixed(3));
  scene.style.setProperty('--zoom', (1.015 + progress * .145 + reveal * .055).toFixed(3));
  scene.style.setProperty('--grain', (.12 + progress * .33).toFixed(3));
  const visible = easeBetween(passed, -scene.offsetHeight, 0) *
    (1 - easeBetween(passed, scrollDistance, scrollDistance + scene.offsetHeight));
  effectProgress = progress * visible;
  soundGap = easeBetween(progress, .80, .845) * (1 - easeBetween(progress, .885, .93));
  if (audio) updateSound();
}

function queueRender() {
  if (!frame) frame = requestAnimationFrame(render);
}

function makeSound(Context) {
  const context = new Context();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  const drone = context.createOscillator();
  const pulse = context.createOscillator();
  const undertone = context.createGain();
  drone.type = 'sine';
  drone.frequency.value = 61;
  pulse.frequency.value = 1.2;
  undertone.gain.value = .18;
  const modulation = context.createGain();
  modulation.gain.value = .07;
  pulse.connect(modulation).connect(undertone.gain);
  drone.connect(undertone).connect(master);
  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < samples.length; index++) {
    previous = previous * .87 + (Math.random() * 2 - 1) * .13;
    samples[index] = previous;
  }
  const water = context.createBufferSource();
  water.buffer = buffer;
  water.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 260;
  water.connect(filter).connect(master);
  water.start();
  drone.start();
  pulse.start();
  return { context, master, drone, pulse, filter, enabled: false };
}

function updateSound() {
  const { context, master, drone, pulse, filter, enabled } = audio;
  const volume = enabled && !document.hidden ? (.13 + effectProgress * .19) * (1 - soundGap * .97) : 0;
  master.gain.setTargetAtTime(volume, context.currentTime, .24);
  drone.frequency.setTargetAtTime(61 - 17 * effectProgress, context.currentTime, .18);
  pulse.frequency.setTargetAtTime(1.2 + 4.3 * effectProgress, context.currentTime, .2);
  filter.frequency.setTargetAtTime(260 + 1450 * easeBetween(effectProgress, .62, .95), context.currentTime, .3);
}

const AudioEngine = window.AudioContext || window.webkitAudioContext;
sound.hidden = !AudioEngine;
sound.addEventListener('click', async () => {
  if (changingSound || !AudioEngine) return;
  changingSound = true;
  try {
    audio ??= makeSound(AudioEngine);
    if (audio.context.state !== 'running') await audio.context.resume();
    audio.enabled = !audio.enabled;
    sound.setAttribute('aria-pressed', String(audio.enabled));
    soundLabel.textContent = audio.enabled ? '关闭环境声' : '开启环境声';
    updateSound();
  } catch {
    soundLabel.textContent = '环境声不可用';
  } finally {
    changingSound = false;
  }
});

addEventListener('scroll', queueRender, { passive: true });
addEventListener('resize', queueRender);
addEventListener('pageshow', queueRender);
reducedMotion.addEventListener('change', queueRender);
document.addEventListener('visibilitychange', () => { if (audio) updateSound(); });
render();
