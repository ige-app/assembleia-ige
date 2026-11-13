// One audio instance survives magazine page changes and DOM re-renders.
const magazineNarrationTrack={src:'assets/m-on-the-cover-completo.mp3',duration:253};
const magazineNarrationAudio=new Audio();
magazineNarrationAudio.preload='none';
const magazineNarrationTeaserKey='ige-cover-audio-teaser-v1';
let magazineNarrationOpen=false,magazineNarrationTeaser=false,magazineNarrationExpanded=false;
let magazineNarrationLoading=false,magazineNarrationError='';

function magazineNarrationPlayer(){
  const available=magazineSelectedEdition().available,playing=!magazineNarrationAudio.paused;
  return `<div class="magazine-narration-integrated" role="group" aria-label="Áudio de pós-edição da revista"><button class="magazine-narration-toggle" aria-label="${playing?'Pausar':'Ouvir'} comentários da revista" ${available&&!magazineNarrationTeaser?'':'disabled'} onclick="magazineNarrationToggle()"><span id="magazine-narration-glyph" aria-hidden="true">${radioPlaybackIcon(playing)}</span></button><time id="magazine-narration-current">${radioTime(magazineNarrationAudio.currentTime)}</time><time id="magazine-narration-duration">${available?radioTime(magazineNarrationTrack.duration):'--:--'}</time></div>`;
}

function magazineNarrationPanel(){
  return '<section id="magazine-audio-panel" class="magazine-audio-panel" aria-label="Clube dos Influenciadores · áudio de pós-edição"'+(magazineNarrationOpen?'':' hidden')+'>'+magazineNarrationPanelContent()+'</section>';
}

function magazineNarrationPanelContent(){
  if(!magazineNarrationOpen)return '';
  const close='<button class="magazine-audio-close" type="button" aria-label="Fechar player de pós-edição" onclick="magazineNarrationClose()">×</button>';
  if(magazineNarrationTeaser)return `<div class="magazine-audio-heading"><span>CLUBE DOS INFLUENCIADORES</span>${close}</div><div class="magazine-audio-teaser" role="status"><h3>A edição saiu. O burburinho, não. 👀</h3><p>Cristal Tuffier conta tudo. Estreia hoje, às <strong>20h (Brasília)</strong>. Fique de olho.</p></div><button class="magazine-audio-coming" disabled>▶ Em breve</button>`;
  const audio=magazineNarrationAudio,duration=Number.isFinite(audio.duration)?audio.duration:magazineNarrationTrack.duration;
  return `<div class="magazine-audio-heading"><span>CLUBE DOS INFLUENCIADORES · PÓS-EDIÇÃO</span>${close}</div><h3>M on the cover</h3><p class="magazine-audio-byline">O que aconteceu depois da edição · Cristal Tuffier</p><div class="magazine-audio-controls"><button type="button" aria-label="Voltar 15 segundos" data-magazine-seek ${audio.readyState?'':'disabled'} onclick="magazineNarrationSkip(-15)">↶ <small>15</small></button><button type="button" class="magazine-audio-play" aria-label="${audio.paused?'Reproduzir':'Pausar'} pós-edição" onclick="magazineNarrationToggle()">${radioPlaybackIcon(!audio.paused)}</button><button type="button" aria-label="Avançar 15 segundos" data-magazine-seek ${audio.readyState?'':'disabled'} onclick="magazineNarrationSkip(15)">↷ <small>15</small></button><span class="magazine-audio-timing"><time data-magazine-current>${radioTime(audio.currentTime)}</time> / <time data-magazine-duration>${radioTime(Math.ceil(duration))}</time></span><button type="button" class="magazine-audio-more" aria-label="Mais controles de áudio" aria-expanded="${magazineNarrationExpanded}" aria-controls="magazine-audio-extra" onclick="magazineNarrationMore()">···</button></div><label class="magazine-audio-progress"><span class="magazine-audio-sr">Posição do áudio</span><input type="range" min="0" max="${duration}" step="0.1" value="${audio.currentTime||0}" data-magazine-seek ${audio.readyState?'':'disabled'} aria-label="Posição do áudio" aria-valuetext="${radioTime(audio.currentTime)} de ${radioTime(Math.ceil(duration))}" oninput="magazineNarrationSeek(this.value)"></label><div id="magazine-audio-extra" class="magazine-audio-extra" ${magazineNarrationExpanded?'':'hidden'}><button type="button" data-magazine-mute aria-label="${audio.muted?'Ativar':'Silenciar'} áudio" aria-pressed="${audio.muted}" onclick="magazineNarrationAudio.muted=!magazineNarrationAudio.muted">${audio.muted?'Ativar som':'Silenciar'}</button><label>Volume <input type="range" min="0" max="1" step="0.05" value="${audio.volume}" aria-label="Volume do áudio" oninput="magazineNarrationVolume(this.value)"></label><a class="magazine-audio-download" href="${magazineNarrationTrack.src}" download="M-on-the-cover-completo.mp3" aria-label="Baixar áudio unificado em MP3"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg><span>Baixar áudio</span></a></div><p class="magazine-audio-status" role="status" aria-live="polite">${esc(magazineNarrationError||(magazineNarrationLoading?'Carregando áudio…':''))}</p>`;
}

function refreshMagazineNarrationPanel(){
  const panel=document.getElementById('magazine-audio-panel');
  if(panel){panel.hidden=!magazineNarrationOpen;panel.innerHTML=magazineNarrationPanelContent()}
  updateMagazineNarration();
}

function magazineNarrationToggle(){
  if(!magazineSelectedEdition().available)return;
  if(!magazineNarrationOpen){
    magazineNarrationOpen=true;
    if(!safeStore.getItem(magazineNarrationTeaserKey)){
      safeStore.setItem(magazineNarrationTeaserKey,'seen');
      magazineNarrationTeaser=true;
      refreshMagazineNarrationPanel();
      document.querySelector('.magazine-audio-close')?.focus({preventScroll:true});
      document.getElementById('magazine-audio-panel')?.scrollIntoView({block:'nearest',behavior:'smooth'});
      return;
    }
    refreshMagazineNarrationPanel();
    document.getElementById('magazine-audio-panel')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  if(magazineNarrationTeaser)return;
  const audio=magazineNarrationAudio;
  if(!audio.paused){audio.pause();return}
  magazineNarrationError='';
  if(!audio.getAttribute('src'))audio.src=magazineNarrationTrack.src;
  else if(audio.error)audio.load();
  if(audio.ended)audio.currentTime=0;
  magazineNarrationLoading=true;
  updateMagazineNarration();
  audio.play().catch(error=>{
    if(error.name==='AbortError')return;
    magazineNarrationLoading=false;
    magazineNarrationError='Não foi possível reproduzir. Toque no play para tentar de novo.';
    updateMagazineNarration();
  });
}

function magazineNarrationClose(){
  magazineNarrationAudio.pause();
  magazineNarrationOpen=false;magazineNarrationTeaser=false;
  refreshMagazineNarrationPanel();
  document.querySelector('.magazine-narration-toggle')?.focus({preventScroll:true});
}

function magazineNarrationStop(){
  magazineNarrationAudio.pause();
  if(magazineNarrationAudio.readyState)magazineNarrationAudio.currentTime=0;
  magazineNarrationOpen=false;magazineNarrationTeaser=false;magazineNarrationLoading=false;
}

function magazineNarrationSeek(value){
  const audio=magazineNarrationAudio;
  if(!audio.readyState||!Number.isFinite(Number(value)))return;
  audio.currentTime=Math.max(0,Math.min(audio.duration||magazineNarrationTrack.duration,Number(value)));
  updateMagazineNarration();
}
function magazineNarrationSkip(seconds){magazineNarrationSeek(magazineNarrationAudio.currentTime+seconds)}
function magazineNarrationVolume(value){magazineNarrationAudio.volume=Number(value);magazineNarrationAudio.muted=Number(value)===0}
function magazineNarrationMore(){
  magazineNarrationExpanded=!magazineNarrationExpanded;
  const extra=document.getElementById('magazine-audio-extra'),button=document.querySelector('.magazine-audio-more');
  if(extra)extra.hidden=!magazineNarrationExpanded;
  button?.setAttribute('aria-expanded',String(magazineNarrationExpanded));
}

function updateMagazineNarration(){
  if(state.page!=='revista')return;
  const audio=magazineNarrationAudio,duration=Number.isFinite(audio.duration)?audio.duration:magazineNarrationTrack.duration;
  for(const element of document.querySelectorAll('#magazine-narration-current,[data-magazine-current]'))element.textContent=radioTime(audio.currentTime);
  for(const element of document.querySelectorAll('#magazine-narration-duration,[data-magazine-duration]'))element.textContent=magazineSelectedEdition().available?radioTime(Math.ceil(duration)):'--:--';
  const glyph=document.getElementById('magazine-narration-glyph'),integrated=document.querySelector('.magazine-narration-toggle'),play=document.querySelector('.magazine-audio-play');
  if(glyph)glyph.innerHTML=radioPlaybackIcon(!audio.paused);
  if(integrated){integrated.disabled=!magazineSelectedEdition().available||magazineNarrationTeaser;integrated.setAttribute('aria-label',(audio.paused?'Ouvir':'Pausar')+' comentários da revista')}
  if(play){play.innerHTML=radioPlaybackIcon(!audio.paused);play.setAttribute('aria-label',(audio.paused?'Reproduzir':'Pausar')+' pós-edição')}
  for(const control of document.querySelectorAll('[data-magazine-seek]'))control.disabled=!audio.readyState;
  const progress=document.querySelector('.magazine-audio-progress input');
  if(progress){progress.max=duration;progress.value=audio.currentTime||0;progress.setAttribute('aria-valuetext',radioTime(audio.currentTime)+' de '+radioTime(Math.ceil(duration)))}
  const mute=document.querySelector('[data-magazine-mute]');
  if(mute){mute.textContent=audio.muted?'Ativar som':'Silenciar';mute.setAttribute('aria-label',(audio.muted?'Ativar':'Silenciar')+' áudio');mute.setAttribute('aria-pressed',String(audio.muted))}
  const status=document.querySelector('.magazine-audio-status'),message=magazineNarrationError||(magazineNarrationLoading?'Carregando áudio…':'');
  if(status&&status.textContent!==message)status.textContent=message;
}

for(const event of ['timeupdate','durationchange','loadedmetadata','play','pause','ended','volumechange'])magazineNarrationAudio.addEventListener(event,updateMagazineNarration);
for(const event of ['playing','pause','ended'])magazineNarrationAudio.addEventListener(event,()=>{magazineNarrationLoading=false;updateMagazineNarration()});
magazineNarrationAudio.addEventListener('waiting',()=>{magazineNarrationLoading=true;updateMagazineNarration()});
magazineNarrationAudio.addEventListener('error',()=>{magazineNarrationLoading=false;magazineNarrationError='Não foi possível carregar o áudio. Verifique a conexão e tente de novo.';updateMagazineNarration()});
// Keep the radio and the magazine commentary from speaking over each other.
magazineNarrationAudio.addEventListener('play',()=>{if(radioPlayback.playing)radioTogglePlayback()});
