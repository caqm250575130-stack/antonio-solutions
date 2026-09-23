/* ============================================================
   ANTONIO'S SOLUTIONS — CATÁLOGO DINÁMICO DE SERVICIOS
   ------------------------------------------------------------
   Si el administrador guardó cambios en este navegador
   (localStorage), la lista de servicios se reconstruye con esos
   datos ANTES de inicializar el buscador y los filtros.
   Si nunca se usó el panel, se deja el HTML tal cual.
   ============================================================ */
const CLAVE_CATALOGO    = 'solutions_catalogo_v1';
const CLAVE_CATEGORIAS  = 'solutions_categorias_v1';
const CLAVE_CAT_OCULTAS = 'solutions_categorias_ocultas_v1';
const CLAVE_FONDO       = 'solutions_fondo_v1';
const TELEFONO_WA       = '50379011314';

const IMG_SIN_FOTO = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%230b1636%22/%3E%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%22172%22%20height%3D%22172%22%20fill%3D%22none%22%20stroke%3D%22%236b8bff%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%2210%206%22/%3E%3Ctext%20x%3D%22100%22%20y%3D%22108%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2216%22%20font-weight%3D%22bold%22%20fill%3D%22%23ffffff%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C/text%3E%3C/svg%3E";

const SVG_WHATSAPP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#04240f" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.5 14.2c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l2 .9c.2.1.4.2.4.3.1.2.1.7-.1 1.3z"/></svg>';

/* ------------------------------------------------------------
   FONDO PERSONALIZADO (se aplica cuanto antes para evitar parpadeos)
   ------------------------------------------------------------ */
function aplicarFondoGuardado(){
  try {
    const guardado = localStorage.getItem(CLAVE_FONDO);
    if(guardado) document.documentElement.style.setProperty('--fondo-img', 'url("' + guardado + '")');
  } catch(e){ /* si falla, queda el fondo de styles.css */ }
}
aplicarFondoGuardado();

/* ------------------------------------------------------------
   CATÁLOGO DE SERVICIOS
   ------------------------------------------------------------ */
function leerCatalogoGuardado(){
  try { return JSON.parse(localStorage.getItem(CLAVE_CATALOGO)); }
  catch(e){ return null; }
}

/* ------------------------------------------------------------
   RELLENO DIFUMINADO DEL RECUADRO
   Cada marco recibe como variable CSS la misma imagen que muestra.
   styles.css la usa ampliada y desenfocada detrás de la foto, para
   que no queden franjas vacías cuando la proporción no coincide.
   ------------------------------------------------------------ */
function ponerFondoDifuminado(img){
  const marco = img.closest ? img.closest('.marco-imagen') : img.parentElement;
  if(!marco || !img.src) return;
  marco.style.setProperty('--img-fondo', 'url("' + img.src.replace(/"/g, '%22') + '")');
}

/* Recorre las tarjetas que ya están en el HTML o recién creadas */
function pintarFondosDifuminados(){
  document.querySelectorAll('.marco-imagen img').forEach(ponerFondoDifuminado);
}

/* Un detalle escrito como "Requisito: texto" muestra la etiqueta en negrita. */
function crearDetalle(texto){
  const li = document.createElement('li');
  const corte = texto.indexOf(':');
  if(corte > 0 && corte <= 24 && texto.slice(corte + 1).trim()){
    const etiqueta = document.createElement('strong');
    etiqueta.textContent = texto.slice(0, corte + 1);
    li.append(etiqueta, document.createTextNode(texto.slice(corte + 1)));
  } else {
    li.textContent = texto;
  }
  return li;
}

function crearArticuloServicio(s){
  const sinDisponibilidad = s.agotado || !s.imagen; // sin imagen = se muestra como "servicio no disponible"
  const art = document.createElement('article');
  art.className = 'servicio' + (sinDisponibilidad ? ' agotado' : '');
  art.dataset.id = s.id;
  art.dataset.categoria = (s.categorias || []).join(' ');
  art.dataset.nombre = (s.titulo + ' ' + (s.caracteristicas || []).join(' ')).toLowerCase();

  const marco = document.createElement('div');
  marco.className = 'marco-imagen';
  const img = document.createElement('img');
  img.alt = s.titulo;
  img.src = s.imagen || IMG_SIN_FOTO;
  img.onerror = function(){
    this.onerror = null;
    this.src = IMG_SIN_FOTO;
    ponerFondoDifuminado(this);
  };
  marco.appendChild(img);
  ponerFondoDifuminado(img);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'cuerpo-servicio';

  const h3 = document.createElement('h3');
  h3.textContent = s.titulo;

  const etiqueta = document.createElement('p');
  etiqueta.className = 'etiqueta-detalles';
  etiqueta.textContent = 'Detalles:';

  const ul = document.createElement('ul');
  ul.className = 'detalles';
  (s.caracteristicas || []).forEach(t => ul.appendChild(crearDetalle(t)));

  const fila = document.createElement('div');
  fila.className = 'fila-precio';

  const precio = document.createElement('span');
  const valor = Number(s.precio);
  if(valor > 0){
    precio.className = 'precio';
    precio.textContent = '$' + valor.toFixed(2);
  } else {
    precio.className = 'precio consultar';
    precio.textContent = 'Precio a consultar';
  }

  const btn = document.createElement('a');
  btn.className = 'btn-consultar';
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.href = 'https://wa.me/' + TELEFONO_WA + '?text=' +
             encodeURIComponent('Hola, quiero consultar sobre ' + s.titulo);
  btn.innerHTML = SVG_WHATSAPP + '<span>Consultar por WhatsApp</span>';

  fila.append(precio, btn);
  cuerpo.append(h3, etiqueta, ul, fila);
  art.append(marco, cuerpo);
  return art;
}

function aplicarCatalogoGuardado(){
  const catalogo = leerCatalogoGuardado();
  if(!catalogo) return; // nunca se usó el panel: se deja el HTML tal cual
  const lista = document.getElementById('listaServicios');
  const aviso = document.getElementById('sinResultados');
  [...lista.querySelectorAll('.servicio')].forEach(el => el.remove());
  catalogo.forEach(s => lista.insertBefore(crearArticuloServicio(s), aviso));
}
aplicarCatalogoGuardado();
pintarFondosDifuminados(); // también para las tarjetas que vienen en el HTML

/* ------------------------------------------------------------
   CATEGORÍAS: las creadas desde el panel se agregan;
   las eliminadas se quitan de la barra lateral.
   ------------------------------------------------------------ */
function leerCategoriasGuardadas(){
  try { return JSON.parse(localStorage.getItem(CLAVE_CATEGORIAS)) || []; }
  catch(e){ return []; }
}
function leerCategoriasOcultas(){
  try { return JSON.parse(localStorage.getItem(CLAVE_CAT_OCULTAS)) || []; }
  catch(e){ return []; }
}

function aplicarCategoriasGuardadas(){
  const zona = document.getElementById('panelCategorias');

  leerCategoriasGuardadas().forEach(c => {
    if(zona.querySelector('button[data-filtro="' + c.valor + '"]')) return;
    const btn = document.createElement('button');
    btn.dataset.filtro = c.valor;
    btn.textContent = c.texto;
    zona.appendChild(btn);
  });

  leerCategoriasOcultas().forEach(valor => {
    if(valor === 'todos') return;               // "Todos" nunca se elimina
    const btn = zona.querySelector('button[data-filtro="' + valor + '"]');
    if(btn) btn.remove();
  });
}
aplicarCategoriasGuardadas();

/* ============================================================
   MENÚ DE CATEGORÍAS, FILTRO Y BUSCADOR
   ============================================================ */
const btnMenu   = document.getElementById('btnMenu');
const panel     = document.getElementById('panelCategorias');
const fondoMenu = document.getElementById('fondoMenu');
const campo     = document.getElementById('campoBusqueda');
const aviso     = document.getElementById('sinResultados');
let   servicios = [...document.querySelectorAll('.servicio')];
const botonesCat = () => [...panel.querySelectorAll('button')];

let categoriaActiva = 'todos';

function alternarMenu(abrir){
  const estado = abrir ?? !panel.classList.contains('abierta');
  panel.classList.toggle('abierta', estado);
  fondoMenu.classList.toggle('visible', estado);
  btnMenu.setAttribute('aria-expanded', estado);
}
btnMenu.addEventListener('click', () => alternarMenu());
fondoMenu.addEventListener('click', () => alternarMenu(false));
document.addEventListener('keydown', e => { if(e.key === 'Escape') alternarMenu(false); });

/* --- Normaliza texto para que la búsqueda no distinga tildes ---
   "consultoria" encuentra "consultoría", "diseno" no aplica pero
   "informatica" encuentra "informática", etc. */
function normalizarTexto(str){
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita los acentos (tildes, diéresis)
    .toLowerCase();
}

/* Filtro combinado: texto del buscador + categoría elegida */
function filtrar(){
  const texto = normalizarTexto(campo.value.trim());
  let visibles = 0;

  servicios.forEach(s => {
    const nombre = normalizarTexto(s.dataset.nombre + ' ' + s.querySelector('h3').textContent);
    const coincideTexto = nombre.includes(texto);
    const cats = s.dataset.categoria.split(' ');
    const coincideCat = categoriaActiva === 'todos' || cats.includes(categoriaActiva);
    const mostrar = coincideTexto && coincideCat;
    s.style.display = mostrar ? '' : 'none';
    if(mostrar) visibles++;
  });

  aviso.hidden = visibles > 0;
}
campo.addEventListener('input', filtrar);

/* Clic en una categoría (delegado: sirve también para las creadas después) */
panel.addEventListener('click', e => {
  const btn = e.target.closest('button[data-filtro]');
  if(!btn) return;
  categoriaActiva = btn.dataset.filtro;
  botonesCat().forEach(b => b.classList.toggle('activa', b === btn));
  filtrar();
  if(window.innerWidth <= 900) alternarMenu(false);
});

filtrar(); // estado inicial

/* ------------------------------------------------------------
   Puntos de entrada que usa admin.js después de guardar cambios
   ------------------------------------------------------------ */
function recargarSitio(){
  aplicarCatalogoGuardado();
  pintarFondosDifuminados();
  servicios = [...document.querySelectorAll('.servicio')];
  filtrar();
}
window.recargarSitio = recargarSitio;

window.recargarCategorias = function(){
  aplicarCategoriasGuardadas();
  if(!panel.querySelector('button[data-filtro="' + categoriaActiva + '"]')){
    categoriaActiva = 'todos';
    botonesCat().forEach(b => b.classList.toggle('activa', b.dataset.filtro === 'todos'));
  }
  filtrar();
};
