import {icon} from './art.js';
import {meta} from './catalog.js';
import {mapLayout} from './map-layout.js';
import {guidance} from './guidance.js';
import {paidResources} from './paid.js';

const $ = selector => document.querySelector(selector);
const main = $('#conteudo'), search = $('#search'), detail = $('#detail');
const maps = new Map();
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s=>s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const ref = (id,node)=>'#/'+id+(node?'/'+node:'');
const rel = {sequence:'Sequência sugerida',prerequisite:'Pré-requisito',related:'Relação conceitual'};
const states = {new:'Não iniciado', learning:'Estudando', done:'Concluído', skip:'Pulado'};
const statusIcons = {
  new:'<circle cx="10" cy="10" r="6.5"/>',
  learning:'<circle cx="10" cy="10" r="7"/><path d="M10 5.7v4.6l3 1.8"/>',
  done:'<path d="m3.5 10.1 4.3 4.3 8.7-9"/>',
  skip:'<path d="m4.5 4.3 7.2 5.7-7.2 5.7zM15.5 4.3v11.4"/>'
};
const key = 'trilhas-psicologia:progresso:v1';
let progress={}, storageAvailable=true, page='', topicOpener=null, openedFromMap=false, listView=false, zoom=1;

function readProgress() {
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}
try { progress=readProgress(); } catch { storageAvailable=false; }
const compactMap = matchMedia('(max-width: 700px)');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const themeChoice = $('#theme-choice');
try {
  const stored = localStorage.getItem('trilhas-psicologia:tema');
  if (stored === 'light' || stored === 'dark') themeChoice.value = stored;
} catch {}
function applyTheme(){
  const dark = themeChoice.value === 'dark' || (themeChoice.value === 'auto' && systemTheme.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]').content = dark ? '#191d22' : '#f7f7f2';
  $('#theme-icon').innerHTML = icon(dark ? 'moon' : 'sun', 16);
}
themeChoice.addEventListener('change', () => {
  try { localStorage.setItem('trilhas-psicologia:tema', themeChoice.value); } catch {}
  applyTheme();
});
systemTheme.addEventListener('change', applyTheme);
applyTheme();
function state(map,id) {
  const value = progress[map+'/'+id];
  if(value==='reviewed') return 'done';
  return typeof value==='string' && Object.hasOwn(states,value) ? value : 'new';
}

function mapStats(map) {
  const count = map.nodes.filter(n=>state(map.id,n.id)==='done').length;
  return count+' de '+map.nodes.length+' tópicos concluídos';
}

function statusIcon(status) {
  return '<svg class="state-icon" viewBox="0 0 20 20" aria-hidden="true">'+statusIcons[status]+'</svg>';
}

function statusBadge(status) {
  return '<span class="pill list-state" data-state="'+status+'">'+statusIcon(status)+states[status]+'</span>';
}

function progressMark(status) {
  if(status==='new') return '';
  return '<span class="progress-mark" title="'+states[status]+'">'+statusIcon(status)+'<span class="sr-only">'+states[status]+'</span></span>';
}

function writeProgress(mapId, nodeId, value) {
  // Read the latest snapshot before writing, so changes from another open tab are retained.
  if(storageAvailable) {
    try { progress=readProgress(); } catch { storageAvailable=false; }
  }
  const id = mapId+'/'+nodeId;
  if(value==='new') delete progress[id];
  else progress[id]=value;
  if(storageAvailable){
    try { localStorage.setItem(key,JSON.stringify(progress)); } catch { storageAvailable=false; }
  }
}
const empty = (title,body)=>'<div class="empty"><h3>'+escape(title)+'</h3><p>'+escape(body)+'</p></div>';
function card(map) {
  const m=meta[map.id];
  return `<a class="roadmap-card" href="${ref(map.id)}">${miniature(map)}<div class="card-copy"><h3>${m.name}${m.short?' ('+m.short+')':''}</h3><p>${m.desc}</p><small>${map.nodes.length} tópicos · ${map.resources.length} materiais</small></div><span class="card-end">${icon('arrow',16)}</span></a>`;
}

function home() {
  const section=(title, group)=>`<section class="map-group" aria-label="${title}"><h2>${title}</h2><div class="map-grid">${[...maps.values()].filter(map=>meta[map.id].group===group).map(card).join('')}</div></section>`;
  return `<div class="shell catalog" id="catalog">
    <header class="catalog-head"><h1>Mapas de Psicologia</h1><p>Escolha o que quer estudar. Cada mapa organiza os tópicos e indica por onde começar.</p>
    <button class="catalog-search" data-search>${icon('search',18)}<span>Buscar abordagem ou tópico</span><kbd>/</kbd></button></header>
    ${section('Fundamentos','Base comum')}${section('Abordagens','Abordagens')}
  </div>`;
}

function progressPage(){
  const tracked=[...maps.values()].flatMap(map=>map.nodes.filter(n=>state(map.id,n.id)!=='new').map(n=>({map,n})));
  return '<section class="shell interior"><div class="eyebrow"><i></i> Caderno de estudo</div><h1>Meu progresso</h1><p class="intro">As marcações ficam neste navegador e podem ser alteradas em cada tópico.</p>'+(!storageAvailable?'<p role="alert">Armazenamento indisponível. As marcações desta sessão são temporárias.</p>':'')+(tracked.length?'<div class="progress-list">'+tracked.map(({map,n})=>'<a href="'+ref(map.id,n.id)+'"><span><small>'+meta[map.id].name+'</small>'+escape(n.title)+'</span>'+statusBadge(state(map.id,n.id))+'</a>').join('')+'</div>':empty('Seu caderno ainda está em branco','Marque um tópico como estudando, concluído ou pulado para encontrá-lo aqui.'))+'<a class="text-link" href="#/catalogo">Explorar os mapas →</a></section>';
}
function about(){
  return '<article class="shell interior prose"><div class="eyebrow"><i></i> Sobre o projeto</div><h1>Sobre a curadoria</h1><p class="intro">O Trilhas da Psicologia reúne percursos de leitura para estudantes e psicólogos, com acesso gratuito e sem cadastro.</p><h2>Como ler um mapa</h2><p>A sequência é uma proposta de estudo. Os ramos aproximam conceitos e leituras que podem ser explorados por interesse. Cada tópico indica um objetivo e as fontes para estudá-lo.</p><h2>Como escolhemos as fontes</h2><p>Procuramos textos completos, capítulos, aulas e sínteses públicas de universidades, periódicos e instituições especializadas. Cada referência informa idioma, acesso e data de checagem. A ficha de curadoria distingue o material consultado, seus limites e os direitos de reutilização.</p><p>A revisão por especialistas está pendente. Textos históricos e formulações teóricas aparecem com seu contexto. Estudos de resultados são apresentados segundo a população e a intervenção avaliadas.</p><h2>Estudo e formação profissional</h2><p>Use estes mapas como apoio à graduação, à formação específica e à discussão em supervisão. O progresso registra suas leituras. Dados de pacientes não são solicitados.</p><p>As fontes externas mantêm seus próprios direitos e condições de uso.</p></article>';
}
function paidPage(filter) {
  const groups = [...new Set(paidResources.map(r => r.map))];
  const selected = groups.includes(filter) ? filter : '';
  const options = groups.map(id => `<option value="${id}"${selected===id?' selected':''}>${escape(meta[id].name)}</option>`).join('');
  const sections = groups.filter(id => !selected || id === selected).map(id => {
    const map = maps.get(id);
    const items = paidResources.filter(r => r.map === id).map(r => {
      const topic = map.nodes.find(n => n.id === r.topic);
      return `<li><h3><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.title)} ↗</a></h3>
        <p class="book-byline">${escape(r.authors)} · ${escape(r.publisher)} · ${escape(r.format)}</p>
        <p>${escape(r.why)}</p>${topic ? `<a class="text-link" href="${ref(id,topic.id)}">Tópico no mapa · ${escape(topic.title)}</a>` : ''}</li>`;
    }).join('');
    return `<section class="book-group"><h2>${escape(meta[id].name)}</h2><ul>${items}</ul></section>`;
  }).join('');
  return `<article class="shell interior paid-page"><h1>Recursos pagos</h1>
    <p class="intro">Seleção editorial sem patrocínio. A compra é opcional. Cada tópico dos mapas oferece materiais gratuitos para estudar o assunto.</p>
    <label class="paid-filter">Filtrar por mapa <select id="paid-filter"><option value="">Todos os mapas</option>${options}</select></label>${sections}</article>`;
}
const guideLabels = {
  recommended:'Recomendação da curadoria',
  alternative:'Opção alternativa',
  anytime:'Ordem livre'
};

function guidanceMark(mapId, nodeId){
  const entry = guidance[mapId]?.[nodeId];
  if (!entry) return '';
  const label = guideLabels[entry.role];
  return `<span class="guide-mark ${entry.role}" title="${label}" role="img" aria-label="${label}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 8 2.5 2.5L12 5"/></svg></span>`;
}

function guidanceNote(map, node){
  const entries = guidance[map.id];
  const entry = entries?.[node.id];
  if (!entry) return '';
  const peers = entry.group ? map.nodes.filter(other => other.id !== node.id && entries[other.id]?.group === entry.group) : [];
  const links = peers.map(other => `<a class="related" href="${ref(map.id,other.id)}">${escape(other.title)} →</a>`).join('');
  return `<section class="guide-note"><h3>${guidanceMark(map.id,node.id)}${guideLabels[entry.role]}</h3><p>${escape(entry.note)}</p>${links}</section>`;
}

function diagramKey(){
  return `<aside class="diagram-key" aria-label="Legenda do mapa">
    <ul>
      <li><i class="guide-mark recommended" aria-hidden="true">✓</i><span>Recomendação da curadoria</span></li>
      <li><i class="guide-mark alternative" aria-hidden="true">✓</i><span>Alternativa à opção roxa</span></li>
      <li><i class="guide-mark anytime" aria-hidden="true">✓</i><span>Ordem livre · estude quando quiser</span></li>
    </ul></aside>`;
}

function miniature(map){
  const {nodes,edges,width,height} = mapLayout(map,false);
  const paths = edges.map(e=>`<path d="${e.d}"/>`).join('');
  const boxes = map.nodes.map(n=>{
    const {x,y,w,h} = nodes.get(n.id);
    return `<rect class="${n.lane}" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="5"/>`;
  }).join('');
  return `<span class="map-thumb" aria-hidden="true"><svg viewBox="0 0 ${width} ${Math.min(height,1060)}" focusable="false">${paths}${boxes}</svg></span>`;
}

function diagram(map){
  const compact = compactMap.matches;
  const {nodes,edges,width,height} = mapLayout(map,compact);
  const first = nodes.get(map.nodes[0].id);
  const paths = edges.map(e=>`<path class="connection ${e.kind}" data-from="${e.from}" data-to="${e.to}" d="${e.d}"/>`).join('');
  const boxes = map.nodes.map(node=>{
    const {x,y,w,h} = nodes.get(node.id);
    const status = state(map.id,node.id);
    return `<a class="node ${node.lane}" data-mark-side="${x < width/2 ? 'left' : 'right'}" data-state="${status}" data-node="${node.id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" href="${ref(map.id,node.id)}"><span class="node-label">${escape(node.title)}</span>${guidanceMark(map.id,node.id)}${progressMark(status)}</a>`;
  }).join('');
  // The title sits over the centre of the sheet, even when the compact map begins to one side.
  const entrance = first.y-first.h/2;
  const lead = first.x === width/2
    ? `M ${first.x} 0 V ${first.y}`
    : `M ${width/2} 0 C ${width/2} 18, ${first.x} 4, ${first.x} 21 V ${entrance}`;
  return `<div class="board-viewport" tabindex="0" aria-label="Diagrama de ${escape(map.title)}"><div class="scaled"><div class="board ${compact?'compact':''}" style="height:${height}px;width:${width}px"><svg aria-hidden="true" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><path class="map-lead" d="${lead}"/>${paths}</svg>${boxes}</div></div></div>`;
}
function list(map){
  return '<ol class="topic-list">'+map.nodes.map(n=>{
    const parent=map.nodes.find(node=>node.id===n.parent), status=state(map.id,n.id);
    return '<li><a data-node="'+n.id+'" data-state="'+status+'" href="'+ref(map.id,n.id)+'"><span><small>'+escape(parent?rel[n.relation]+' · '+parent.title:'Início do percurso')+'</small>'+guidanceMark(map.id,n.id)+escape(n.title)+'</span>'+statusBadge(status)+'</a></li>';
  }).join('')+'</ol>';
}
function mapPage(map) {
  const m=meta[map.id];
  return `<section class="shell interior map-page">
    <div class="sheet-toolbar"><a class="back" href="#/catalogo">← Todos os mapas</a>
    <div class="map-tools"><div class="switch"><button data-view="map" aria-pressed="${!listView}">${icon('route')}Mapa</button><button data-view="list" aria-pressed="${listView}">${icon('list')}Lista</button></div>
    ${listView?'':'<div class="zoom"><button data-zoom="out" aria-label="Diminuir zoom">−</button><output id="scale"></output><button data-zoom="in" aria-label="Aumentar zoom">+</button><button data-zoom="fit" aria-label="Ajustar à largura">'+icon('resize')+'</button></div>'}
    <a class="map-download" href="pdf/${map.id}.pdf" download="trilhas-${map.id}.pdf" aria-label="Baixar PDF de ${escape(m.name)}">${icon('download',16)}Baixar PDF</a></div></div>
    <div class="sheet-head">${diagramKey()}
      <aside class="map-summary"><strong>Meu progresso</strong><span class="stats" aria-live="polite">${mapStats(map)}</span><a href="#/progresso">Ver caderno →</a></aside>
      <header class="map-origin"><h1>${escape(m.name)}</h1><p class="sr-only">${escape(m.desc)}</p></header>
    </div>
    ${listView?list(map):diagram(map)}</section>`;
}
function applyZoom(){
  const board=$('.board'),vp=$('.board-viewport');if(!board)return;
  const scale=zoom==='fit'?Math.min(1,(vp.clientWidth-4)/$('.board').offsetWidth):zoom;
  board.style.transform='scale('+scale+')';
  $('.scaled').style.width=(board.offsetWidth*scale)+'px';$('.scaled').style.height=(board.offsetHeight*scale)+'px';$('#scale').textContent=Math.round(scale*100)+'%';
}
const languages = {'pt-BR':'Português (Brasil)', 'pt-PT':'Português (Portugal)', pt:'Português', en:'Inglês', es:'Espanhol'};
function resource(r,guide,first=false){
  const url = new URL(r.url);
  if(url.protocol!=='https:')return '';
  let type = r.format.split(/[ ·,]/)[0];
  if (/\bPDF\b/i.test(r.format) || /\.pdf(?:\/|$)/i.test(url.pathname) || url.searchParams.get('format')==='pdf') type = 'PDF';
  else if (/playlist/i.test(r.format)) type = 'Playlist';
  else if (/^videoaula/i.test(r.format)) type = 'Videoaula';
  else if (/^série.*vídeos/i.test(r.format)) type = 'Vídeos';
  else if (['www.youtube.com','youtube.com','youtu.be','vimeo.com'].includes(url.hostname)) type = 'Vídeo';
  else if (/^seção de livro/i.test(r.format)) type = 'Capítulo';
  else if (/^introdução/i.test(r.format)) type = 'Texto';
  type = type.charAt(0).toLocaleUpperCase('pt-BR') + type.slice(1);
  const readingGuide = guide || r.relevance || r.why;
  const source = r.institution || r.publisher;
  const fields = [
    ['Autoria',r.authors], ['Instituição',r.institution], ['Editora',r.publisher], ['Ano',r.year],
    ['Formato',r.format], ['Idioma',languages[r.language] || r.language], ['Acesso',r.access],
    ['Verificação',r.checkedAt && [r.checkedAt,r.verification].filter(Boolean).join(' · ')],
    ['Limites',r.caveat], ['Direitos',r.rights]
  ].filter(([,value])=>value);
  const origin = r.sourcePage && r.sourcePage!==r.url && new URL(r.sourcePage).protocol==='https:'
    ? `<a href="${escape(r.sourcePage)}" target="_blank" rel="noopener noreferrer">Página de origem ↗</a>` : '';
  const language = r.language && !r.language.startsWith('pt') ? ` <small>${escape(languages[r.language] || r.language)}</small>` : '';
  return `<li class="resource"><div class="resource-line"><span class="resource-type">${escape(type)}</span>
    <span><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.title)} <span aria-hidden="true">↗</span></a>${language}</span></div>
    ${source ? `<p class="resource-source">${escape(source)}</p>` : ''}
    ${first ? `<p class="resource-start"><strong>Comece por aqui</strong> ${escape(readingGuide)}</p>` : ''}
    <details><summary>${first?'Sobre a fonte':'Guia de estudo e fonte'}</summary>
    ${first?'':`<p>${escape(readingGuide)}</p>`}<dl>${fields.map(([label,value])=>`<dt>${label}</dt><dd>${escape(value)}</dd>`).join('')}</dl>${origin}</details></li>`;
}
function studyOptions(mapId,nodeId){
  const current = state(mapId,nodeId);
  const controls = Object.entries(states).map(([value,label]) =>
    '<label data-state="'+value+'"><input type="radio" name="study-state" value="'+value+'"'+(value===current?' checked':'')+'><span>'+statusIcon(value)+(value==='skip'?'Pular':label)+'</span></label>'
  ).join('');
  return '<fieldset class="study-options"><legend>Meu progresso</legend><div>'+controls+'</div></fieldset><small class="storage" role="status">'+(storageAvailable?'O progresso fica salvo neste navegador.':'Armazenamento indisponível. As marcações são temporárias.')+'</small>';
}

function openDetail(map,n){
  const parent=map.nodes.find(x=>x.id===n.parent);
  const related = item => '<a class="related" href="'+ref(map.id,item.id)+'">'+escape(item.title)+' →</a>';
  const branches=map.nodes.filter(item=>item.parent===n.id && item.lane!=='center');
  let stage=n;
  while(stage.lane!=='center') stage=map.nodes.find(item=>item.id===stage.parent);
  const nextStage=map.nodes.find(item=>item.parent===stage.id && item.lane==='center');
  const readings=n.resources.map((id,i)=>resource(map.resources.find(r=>r.id===id),n.resourceGuides?.[id],i===0)).join('');
  const paid=paidResources.filter(r=>r.map===map.id && (r.topic===n.id || r.relatedTopics?.includes(n.id)));
  detail.innerHTML=`<div class="dialoghead"><div class="eyebrow">${escape(meta[map.id].name)}</div><button class="close" aria-label="Fechar tópico">×</button></div>
    <h2 id="detail-title">${escape(n.title)}</h2>${studyOptions(map.id,n.id)}
    <p class="bodycopy">${escape(n.body)}</p>${guidanceNote(map,n)}
    <div class="objective"><small>Objetivo de estudo</small><p>${escape(n.objective)}</p></div>
    ${parent?`<p class="parent-topic">${rel[n.relation]} · <a class="related" href="${ref(map.id,parent.id)}">${escape(parent.title)}</a></p>`:''}
    <section class="resource-group free-resources"><h3>${icon('book',18)}Materiais gratuitos</h3><ul>${readings}</ul></section>
    ${paid.length?`<section class="resource-group paid-resources"><h3>${icon('star',18)}Materiais pagos</h3><ul>${paid.map(r=>resource(r)).join('')}</ul></section>`:''}
    ${branches.length?`<section class="subtopics"><h3>Subtópicos</h3>${branches.map(related).join('')}</section>`:''}
    ${nextStage?`<section class="next-stage"><h3>Próxima etapa</h3>${related(nextStage)}</section>`:''}`;
  if(!detail.open)detail.showModal();detail.scrollTop=0;detail.querySelector('.close').focus({preventScroll:true});
  detail.querySelector('.study-options').onchange = e=>{
    const value = e.target.value;
    writeProgress(map.id,n.id,value);
    const feedback=value==='new'?'Marcação removida.':states[value]+'.';
    detail.querySelector('.storage').textContent=feedback+(storageAvailable?' Salvo neste navegador.':' A mudança vale apenas nesta sessão.');
    const nodeLink=main.querySelector('[data-node="'+n.id+'"]');
    nodeLink.dataset.state=value;
    if(listView) nodeLink.querySelector('.list-state').outerHTML=statusBadge(value);
    else {
      nodeLink.querySelector('.progress-mark')?.remove();
      nodeLink.insertAdjacentHTML('beforeend',progressMark(value));
    }
    main.querySelector('.stats').innerHTML=mapStats(map);
  };
}
function closeTopic(){
  if(detail.open)detail.close();
  // Removing the topic from the address keeps a pasted deep link in its own map.
  if(openedFromMap){openedFromMap=false;history.back();}else history.replaceState(null,'',ref(page));
  const origin=main.querySelector('[data-node="'+topicOpener+'"]');
  (origin||main).focus({preventScroll:true});topicOpener=null;
}
function route(force=false){
  const [,section='',nodeId='']=location.hash.split('/');
  const map=maps.get(section), oldPage=page, target=section||'home';
  if(search.open && target!==oldPage)search.close();
  if(detail.open&&(!map||!nodeId))detail.close();
  if(target!==oldPage||force===true||target==='recursos-pagos'){
    page=target;
    document.body.classList.toggle('studying-map', Boolean(map));
    if(map&&oldPage!==target)zoom='fit';
    if(map)main.innerHTML=mapPage(map);
    else if(section==='progresso')main.innerHTML=progressPage();
    else if(section==='recursos-pagos'){
      main.innerHTML=paidPage(nodeId);
      $('#paid-filter').onchange=e=>{location.hash=ref('recursos-pagos',e.target.value);};
    }
    else if(section==='sobre')main.innerHTML=about();
    else if(!section||section==='catalogo')main.innerHTML=home();
    else main.innerHTML='<section class="shell interior"><h1>Mapa não encontrado</h1><a href="#/">Voltar ao catálogo</a></section>';
    applyZoom();
    document.title=(map?meta[map.id].name+' · ':section==='progresso'?'Meu progresso · ':section==='recursos-pagos'?'Recursos pagos · ':'')+'Trilhas da Psicologia';
    if(section==='recursos-pagos' && oldPage===target) $('#paid-filter').focus({preventScroll:true});
    else if(force!==true){window.scrollTo(0,0);if(oldPage)main.focus({preventScroll:true});}
  }
  const node=map?.nodes.find(n=>n.id===nodeId);
  if(node){topicOpener=node.id;openDetail(map,node);}else if(nodeId&&map){if(detail.open)detail.close();history.replaceState(null,'',ref(map.id));}
  const currentNav = map || !section || section==='catalogo' ? 'catalogo' : section;
  for(const id of ['catalogo','progresso']){const a=$('#nav-'+id);const active=id===currentNav;a.toggleAttribute('data-current',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
}
function results(){
  const q=norm($('#query').value.trim());let found=[];
  for(const map of maps.values()){
    const m=meta[map.id];
    if(!q||norm(m.name+' '+map.id).includes(q))found.push([ref(map.id),m.name,'Mapa · '+map.nodes.length+' tópicos']);
    if(q)for(const n of map.nodes)if(norm(n.title+' '+n.id.replaceAll('-',' ')).includes(q))found.push([ref(map.id,n.id),n.title,m.name]);
  }
  if(q.length>=3)for(const map of maps.values())for(const n of map.nodes)if(!norm(n.title+' '+n.id.replaceAll('-',' ')).includes(q) && norm(n.body+' '+n.objective).includes(q))found.push([ref(map.id,n.id),n.title,meta[map.id].name]);
  $('#results').innerHTML=found.length?found.map(([href,title,sub])=>'<a href="'+href+'"><span><small>'+escape(sub)+'</small>'+escape(title)+'</span>→</a>').join(''):empty('Nenhum resultado','Tente outro conceito ou nome de abordagem.');
}
function openSearch(){if(detail.open)closeTopic();$('#query').value='';results();search.showModal();$('#query').focus();}
document.addEventListener('click',e=>{
  const target=e.target.closest('button,a');if(!target)return;
  if(target.matches('a[data-node]'))openedFromMap=true;
  if(target.closest('#detail')&&target.classList.contains('related')&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();history.replaceState(null,'',target.hash);route();return;}
  if(target.closest('#results')){openedFromMap=location.hash===ref(target.hash.split('/')[1]);search.close();}
  if(target.matches('.search-trigger,[data-search]'))openSearch();
  if(target.matches('.close')){if(target.closest('#detail'))closeTopic();else search.close();}

  if(target.dataset.view){listView=target.dataset.view==='list';route(true);$('.switch [aria-pressed="true"]').focus();}
  if(target.dataset.zoom){const vp=$('.board-viewport');const current=zoom==='fit'?Math.min(1,(vp.clientWidth-4)/$('.board').offsetWidth):zoom;zoom=target.dataset.zoom==='fit'?'fit':Math.min(1.7,Math.max(.35,current+(target.dataset.zoom==='in'?.15:-.15)));applyZoom();}
  if(target.closest('#results')&&target.hash===location.hash){search.close();route();}

  if(target.classList.contains('skip')){e.preventDefault();main.focus();}
});
detail.addEventListener('cancel',e=>{e.preventDefault();closeTopic();});
for(const dialog of [detail,search]) dialog.addEventListener('click',e=>{const b=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)){if(dialog===detail)closeTopic();else search.close();}});
$('#query').oninput=results;
document.addEventListener('keydown',e=>{if((e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&!search.open&&!detail.open&&!e.target.matches('input,textarea,select')){e.preventDefault();openSearch();}});
window.addEventListener('resize',applyZoom);
compactMap.addEventListener('change',()=>{if(maps.has(page))route(true);});
try {
  const loaded=await Promise.all(Object.keys(meta).map(async id=>{const res=await fetch('data/'+id+'.json');if(!res.ok)throw Error(id);return res.json();}));
  loaded.forEach(map=>maps.set(map.id,map));window.addEventListener('hashchange',()=>route());route();
}catch{ main.innerHTML='<section class="shell interior"><h1>Não foi possível carregar os mapas</h1><p>Recarregue a página para tentar novamente.</p><button class="primary" id="retry">Tentar novamente</button></section>';$('#retry').onclick=()=>location.reload();}

