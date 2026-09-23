/* ============================================================
   ANTONIO'S SOLUTIONS — PANEL DE ADMINISTRADOR
   ------------------------------------------------------------
   - Botón discreto (engranaje) abajo a la derecha.
   - Pide contraseña antes de mostrar nada.
   - Permite agregar, editar, reordenar, marcar como no
     disponible y eliminar servicios; crear y eliminar
     categorías; y cambiar el fondo del sitio.
   - Todo se guarda en el navegador (localStorage) bajo las
     mismas claves que lee script.js.
   - Requiere que script.js se cargue ANTES que este archivo.
   ============================================================ */
(function(){
'use strict';

const CLAVE            = 'solutions_catalogo_v1';
const CLAVE_CATS       = 'solutions_categorias_v1';
const CLAVE_CAT_OCULTA = 'solutions_categorias_ocultas_v1';
const CLAVE_FONDO_ADM  = 'solutions_fondo_v1';
const CONTRASENA       = 'cris_2307';
const MAX_LADO         = 800;   // las imágenes nuevas se reducen a este tamaño máximo
const CALIDAD          = 0.82;

/* ---------- Atajos a los elementos del HTML ---------- */
const $ = id => document.getElementById(id);

const btnAdmin      = $('btnAdmin');
const modalPass     = $('modalPassFondo');
const campoPass     = $('campoPass');
const errorPass     = $('errorPass');
const btnPassEntrar = $('btnPassEntrar');
const btnPassCancel = $('btnPassCancelar');

const modalAdmin    = $('modalAdminFondo');
const btnCerrar     = $('btnCerrarAdmin');
const formAdmin     = $('formAdmin');
const tituloForm    = $('tituloFormAdmin');
const campoIdEdit   = $('campoIdEdicion');
const campoImagen   = $('campoImagen');
const previaImagen  = $('previaImagen');
const btnQuitarImg  = $('btnQuitarImagen');
const campoNombre   = $('campoNombre');
const campoPrecio   = $('campoPrecio');
const campoCaract   = $('campoCaract');
const listaCatCheck = $('listaCategoriasCheck');
const listaAdmin    = $('listaAdminServicios');
const btnCancelForm = $('btnCancelarForm');
const campoNuevaCat = $('campoNuevaCategoria');
const btnAnadirCat  = $('btnAnadirCategoria');

const campoFondoAdmin     = $('campoFondoAdmin');
const previaFondoAdmin    = $('previaFondoAdmin');
const btnGuardarFondo     = $('btnGuardarFondo');
const btnRestablecerFondo = $('btnRestablecerFondo');

let sesionAbierta = false;  // evita pedir la contraseña dos veces por visita
let imagenActual  = '';     // imagen (base64) del servicio que se está editando
let fondoNuevo    = '';     // fondo elegido, pendiente de guardar

/* ============================================================
   1. CATÁLOGO: leer, construir desde el HTML y guardar
   ============================================================ */
function leerGuardado(){
  try { return JSON.parse(localStorage.getItem(CLAVE)); }
  catch(e){ return null; }
}

/* La primera vez el catálogo se arma leyendo las tarjetas del HTML. */
function catalogoDesdeHTML(){
  return [...document.querySelectorAll('#listaServicios .servicio')].map(art => {
    const textoPrecio = (art.querySelector('.precio')?.textContent || '');
    return {
      id             : art.dataset.id || nuevoId(),
      titulo         : art.querySelector('h3').textContent.trim(),
      precio         : parseFloat(textoPrecio.replace(/[^\d.]/g, '')) || 0,
      caracteristicas: [...art.querySelectorAll('.detalles li')].map(li => li.textContent.trim()),
      categorias     : (art.dataset.categoria || '').split(' ').filter(Boolean),
      imagen         : art.querySelector('.marco-imagen img')?.getAttribute('src') || '',
      agotado        : art.classList.contains('agotado'),
      publicado      : true
    };
  });
}

function obtenerCatalogo(){
  return leerGuardado() || catalogoDesdeHTML();
}

function nuevoId(){
  return 's' + Date.now().toString(36) + Math.floor(Math.random()*1000);
}

/* Guarda en el navegador. Si no cabe, comprime las imágenes y reintenta. */
async function guardarCatalogo(catalogo){
  try {
    localStorage.setItem(CLAVE, JSON.stringify(catalogo));
    return true;
  } catch(e){
    for(const s of catalogo){
      if(s.imagen && s.imagen.startsWith('data:')) s.imagen = await comprimirImagen(s.imagen, 520, 0.7);
    }
    try {
      localStorage.setItem(CLAVE, JSON.stringify(catalogo));
      return true;
    } catch(e2){
      alert('No hay espacio en el navegador para guardar tantas imágenes.\n' +
            'Elimina algún servicio o vuelve a subir la imagen en un tamaño más pequeño.');
      return false;
    }
  }
}

/* Guarda y refresca el sitio y la lista del panel de una sola vez. */
async function aplicarCambios(catalogo){
  const ok = await guardarCatalogo(catalogo);
  if(!ok) return false;
  if(typeof window.recargarSitio === 'function') window.recargarSitio();
  dibujarListaAdmin();
  return true;
}

/* ============================================================
   2. IMÁGENES: leer el archivo subido y reducir su peso
   ============================================================ */
function archivoADataURL(archivo){
  return new Promise((res, rej) => {
    const lector = new FileReader();
    lector.onload  = () => res(lector.result);
    lector.onerror = () => rej(new Error('No se pudo leer la imagen'));
    lector.readAsDataURL(archivo);
  });
}

function comprimirImagen(src, maxLado = MAX_LADO, calidad = CALIDAD){
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      let ancho = img.naturalWidth, alto = img.naturalHeight;
      const escala = Math.min(1, maxLado / Math.max(ancho, alto));
      ancho = Math.max(1, Math.round(ancho * escala));
      alto  = Math.max(1, Math.round(alto  * escala));

      const lienzo = document.createElement('canvas');
      lienzo.width = ancho; lienzo.height = alto;
      lienzo.getContext('2d').drawImage(img, 0, 0, ancho, alto);

      let salida = '';
      try { salida = lienzo.toDataURL('image/webp', calidad); } catch(e){ salida = ''; }
      if(!salida.startsWith('data:image/webp')){
        try { salida = lienzo.toDataURL('image/jpeg', calidad); } catch(e){ salida = ''; }
      }
      res(salida && salida.length < src.length ? salida : src);
    };
    img.onerror = () => res(src);
    img.src = src;
  });
}

/* ============================================================
   3. CONTRASEÑA
   ============================================================ */
function abrirModal(modal){ modal.classList.add('visible'); }
function cerrarModal(modal){ modal.classList.remove('visible'); }

function pedirContrasena(){
  campoPass.value = '';
  errorPass.hidden = true;
  abrirModal(modalPass);
  setTimeout(() => campoPass.focus(), 50);
}

function comprobarContrasena(){
  if(campoPass.value === CONTRASENA){
    sesionAbierta = true;
    cerrarModal(modalPass);
    abrirPanel();
  } else {
    errorPass.hidden = false;
    campoPass.select();
  }
}

btnAdmin.addEventListener('click', () => {
  if(sesionAbierta) abrirPanel();
  else pedirContrasena();
});
btnPassEntrar.addEventListener('click', comprobarContrasena);
btnPassCancel.addEventListener('click', () => cerrarModal(modalPass));
campoPass.addEventListener('keydown', e => {
  if(e.key === 'Enter'){ e.preventDefault(); comprobarContrasena(); }
});
campoPass.addEventListener('input', () => { errorPass.hidden = true; });

/* ============================================================
   3.5 FONDO DEL SITIO (wallpaper)
   ============================================================ */
function aplicarFondo(dataURL){
  document.documentElement.style.setProperty('--fondo-img', 'url("' + dataURL + '")');
}

async function guardarFondo(dataURL){
  try {
    localStorage.setItem(CLAVE_FONDO_ADM, dataURL);
    return true;
  } catch(e){
    const comprimida = await comprimirImagen(dataURL, 1100, 0.68);
    try {
      localStorage.setItem(CLAVE_FONDO_ADM, comprimida);
      aplicarFondo(comprimida);
      return true;
    } catch(e2){
      alert('No hay espacio en el navegador para guardar esta imagen de fondo.\n' +
            'Intenta con una foto más liviana.');
      return false;
    }
  }
}

function cargarFondoEnPanel(){
  let guardado = '';
  try { guardado = localStorage.getItem(CLAVE_FONDO_ADM) || ''; } catch(e){ guardado = ''; }
  if(guardado){ previaFondoAdmin.src = guardado; previaFondoAdmin.hidden = false; }
  else { previaFondoAdmin.hidden = true; previaFondoAdmin.removeAttribute('src'); }
  campoFondoAdmin.value = '';
  fondoNuevo = '';
}

campoFondoAdmin.addEventListener('change', async () => {
  const archivo = campoFondoAdmin.files && campoFondoAdmin.files[0];
  if(!archivo) return;
  try {
    const original = await archivoADataURL(archivo);
    fondoNuevo = await comprimirImagen(original, 1600, 0.8);
    previaFondoAdmin.src = fondoNuevo;
    previaFondoAdmin.hidden = false;
  } catch(e){
    alert('No se pudo cargar esa imagen. Intenta con otro archivo.');
  }
});

btnGuardarFondo.addEventListener('click', async () => {
  if(!fondoNuevo){ alert('Primero elige una imagen de fondo.'); return; }
  if(await guardarFondo(fondoNuevo)){
    aplicarFondo(fondoNuevo);
    fondoNuevo = '';
    campoFondoAdmin.value = '';
  }
});

btnRestablecerFondo.addEventListener('click', () => {
  if(!confirm('¿Restablecer el fondo original del sitio?')) return;
  try { localStorage.removeItem(CLAVE_FONDO_ADM); } catch(e){}
  document.documentElement.style.removeProperty('--fondo-img');
  cargarFondoEnPanel();
});

/* ============================================================
   4. PANEL: formulario de alta / edición de servicios
   ============================================================ */

/* Las categorías se toman de la barra lateral, así nunca
   se desincronizan con los filtros del sitio. */
function categoriasDisponibles(){
  return [...document.querySelectorAll('#panelCategorias button')]
    .map(b => ({ valor: b.dataset.filtro, texto: b.textContent.trim() }))
    .filter(c => c.valor && c.valor !== 'todos');
}

function dibujarCategorias(seleccionadas = []){
  listaCatCheck.innerHTML = '';
  categoriasDisponibles().forEach(cat => {
    const fila = document.createElement('span');
    fila.className = 'fila-categoria';

    const label = document.createElement('label');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.value = cat.valor;
    chk.checked = seleccionadas.includes(cat.valor);
    label.append(chk, document.createTextNode(cat.texto));

    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'btn-quitar-cat';
    quitar.textContent = '✕';
    quitar.title = 'Eliminar la categoría "' + cat.texto + '"';
    quitar.setAttribute('aria-label', 'Eliminar la categoría ' + cat.texto);
    quitar.addEventListener('click', () => eliminarCategoria(cat.valor, cat.texto));

    fila.append(label, quitar);
    listaCatCheck.appendChild(fila);
  });
}

/* Convierte "Redes y cableado" en "redes-y-cableado". */
function generarValorCategoria(texto){
  const base = texto.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
  return base || ('cat' + Date.now());
}

function anadirCategoria(){
  const texto = campoNuevaCat.value.trim();
  if(!texto){ campoNuevaCat.focus(); return; }
  const valor = generarValorCategoria(texto);

  if(categoriasDisponibles().some(c => c.valor === valor)){
    alert('Ya existe una categoría igual o muy parecida.');
    campoNuevaCat.select();
    return;
  }

  let extra = [];
  try { extra = JSON.parse(localStorage.getItem(CLAVE_CATS)) || []; } catch(e){ extra = []; }

  // si esa categoría venía en el HTML y se había eliminado, basta con dejar de ocultarla
  let ocultas = [];
  try { ocultas = JSON.parse(localStorage.getItem(CLAVE_CAT_OCULTA)) || []; } catch(e){ ocultas = []; }
  if(ocultas.includes(valor)){
    localStorage.setItem(CLAVE_CAT_OCULTA, JSON.stringify(ocultas.filter(v => v !== valor)));
  } else if(!extra.some(c => c.valor === valor)){
    extra.push({ valor, texto });
    localStorage.setItem(CLAVE_CATS, JSON.stringify(extra));
  }

  if(typeof window.recargarCategorias === 'function') window.recargarCategorias();

  const seleccionadas = [...listaCatCheck.querySelectorAll('input[type="checkbox"]:checked')].map(c => c.value);
  dibujarCategorias([...seleccionadas, valor]);

  campoNuevaCat.value = '';
  campoNuevaCat.focus();
}

/* Quita una categoría de la barra lateral y de todos los servicios
   que la tuvieran. Los servicios NO se eliminan. */
async function eliminarCategoria(valor, texto){
  const catalogo = obtenerCatalogo();
  const afectados = catalogo.filter(s => (s.categorias || []).includes(valor));
  const huerfanos = afectados.filter(s => (s.categorias || []).length === 1);

  let aviso = '¿Eliminar la categoría "' + texto + '"?';
  if(afectados.length){
    aviso += '\n\nSe quitará de ' + afectados.length + ' servicio(s).';
    if(huerfanos.length){
      aviso += '\n' + huerfanos.length + ' quedarían sin ninguna categoría ' +
               '(seguirían viéndose en "Todos", pero no en los filtros).';
    }
  }
  aviso += '\n\nLos servicios NO se eliminan.';
  if(!confirm(aviso)) return;

  catalogo.forEach(s => { s.categorias = (s.categorias || []).filter(c => c !== valor); });

  let extra = [];
  try { extra = JSON.parse(localStorage.getItem(CLAVE_CATS)) || []; } catch(e){ extra = []; }
  if(extra.some(c => c.valor === valor)){
    localStorage.setItem(CLAVE_CATS, JSON.stringify(extra.filter(c => c.valor !== valor)));
  } else {
    let ocultas = [];
    try { ocultas = JSON.parse(localStorage.getItem(CLAVE_CAT_OCULTA)) || []; } catch(e){ ocultas = []; }
    if(!ocultas.includes(valor)) ocultas.push(valor);
    localStorage.setItem(CLAVE_CAT_OCULTA, JSON.stringify(ocultas));
  }

  if(typeof window.recargarCategorias === 'function') window.recargarCategorias();
  await aplicarCambios(catalogo);

  const seleccionadas = [...listaCatCheck.querySelectorAll('input[type="checkbox"]:checked')]
    .map(c => c.value).filter(v => v !== valor);
  dibujarCategorias(seleccionadas);
}

btnAnadirCat.addEventListener('click', anadirCategoria);
campoNuevaCat.addEventListener('keydown', e => {
  if(e.key === 'Enter'){ e.preventDefault(); anadirCategoria(); }
});

function limpiarFormulario(){
  formAdmin.reset();
  campoIdEdit.value = '';
  imagenActual = '';
  previaImagen.hidden = true;
  previaImagen.removeAttribute('src');
  btnQuitarImg.hidden = true;
  tituloForm.textContent = 'Agregar servicio';
  dibujarCategorias([]);
}

function cargarEnFormulario(s){
  campoIdEdit.value = s.id;
  campoNombre.value = s.titulo;
  campoPrecio.value = s.precio;
  campoCaract.value = (s.caracteristicas || []).join('\n');
  imagenActual = s.imagen || '';
  campoImagen.value = '';
  if(imagenActual){ previaImagen.src = imagenActual; previaImagen.hidden = false; btnQuitarImg.hidden = false; }
  else { previaImagen.hidden = true; btnQuitarImg.hidden = true; }
  dibujarCategorias(s.categorias || []);
  tituloForm.textContent = 'Editar servicio';
  modalAdmin.querySelector('.modal-caja').scrollTop = 0;
}

campoImagen.addEventListener('change', async () => {
  const archivo = campoImagen.files && campoImagen.files[0];
  if(!archivo) return;
  try {
    const original = await archivoADataURL(archivo);
    imagenActual = await comprimirImagen(original);
    previaImagen.src = imagenActual;
    previaImagen.hidden = false;
    btnQuitarImg.hidden = false;
  } catch(e){
    alert('No se pudo cargar esa imagen. Intenta con otro archivo.');
  }
});

btnQuitarImg.addEventListener('click', () => {
  imagenActual = '';
  campoImagen.value = '';
  previaImagen.hidden = true;
  previaImagen.removeAttribute('src');
  btnQuitarImg.hidden = true;
});

formAdmin.addEventListener('submit', async e => {
  e.preventDefault();

  const titulo = campoNombre.value.trim();
  const precio = parseFloat(campoPrecio.value);
  const caracteristicas = campoCaract.value.split('\n').map(t => t.trim()).filter(Boolean);
  const categorias = [...listaCatCheck.querySelectorAll('input[type="checkbox"]:checked')].map(c => c.value);

  if(!titulo)                { alert('Escribe el nombre del servicio.'); return; }
  if(isNaN(precio))          { alert('Escribe un precio válido (0 para "Precio a consultar").'); return; }
  if(!caracteristicas.length){ alert('Escribe al menos un detalle.'); return; }
  if(!categorias.length)     { alert('Elige al menos una categoría.'); return; }

  const catalogo = obtenerCatalogo();
  const id = campoIdEdit.value;

  if(id){
    const serv = catalogo.find(s => s.id === id);
    if(serv) Object.assign(serv, { titulo, precio, caracteristicas, categorias, imagen: imagenActual });
  } else {
    catalogo.unshift({ id: nuevoId(), titulo, precio, caracteristicas, categorias,
                       imagen: imagenActual, agotado: false, publicado: false });
  }

  if(await aplicarCambios(catalogo)) limpiarFormulario();
});

btnCancelForm.addEventListener('click', limpiarFormulario);

/* ============================================================
   5. PANEL: lista de servicios existentes
   ============================================================ */
function dibujarListaAdmin(){
  const catalogo = obtenerCatalogo();
  listaAdmin.innerHTML = '';

  catalogo.forEach(s => {
    const sinDisponibilidad = s.agotado || !s.imagen;
    const item = document.createElement('div');
    item.className = 'item-admin' + (sinDisponibilidad ? ' agotado-admin' : '');

    const img = document.createElement('img');
    img.alt = s.titulo;
    if(s.imagen) img.src = s.imagen;

    const info = document.createElement('div');
    info.className = 'info';
    const nombre = document.createElement('strong');
    nombre.textContent = s.titulo;
    const detalle = document.createElement('span');
    const precioTexto = Number(s.precio) > 0 ? '$' + Number(s.precio).toFixed(2) : 'A consultar';
    detalle.textContent = precioTexto +
                          ' · ' + (s.categorias || []).join(', ') +
                          (sinDisponibilidad ? ' · NO DISPONIBLE' + (!s.imagen && !s.agotado ? ' (sin imagen)' : '') : '');
    info.append(nombre, detalle);

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.append(
      crearBoton('Editar', () => cargarEnFormulario(s)),
      crearBoton(s.publicado === false ? 'Publicar' : 'Publicado ✓', async () => {
        const cat = obtenerCatalogo();
        const serv = cat.find(x => x.id === s.id);
        if(serv) serv.publicado = serv.publicado === false;
        await aplicarCambios(cat);
      }),
      crearBoton(s.agotado ? 'Disponible' : 'No disponible', async () => {
        const cat = obtenerCatalogo();
        const serv = cat.find(x => x.id === s.id);
        if(serv) serv.agotado = !serv.agotado;
        await aplicarCambios(cat);
      }),
      crearBoton('↑', async () => { await mover(s.id, -1); }),
      crearBoton('↓', async () => { await mover(s.id,  1); }),
      crearBoton('Eliminar', async () => {
        if(!confirm('¿Eliminar "' + s.titulo + '" del sitio?')) return;
        const cat = obtenerCatalogo().filter(x => x.id !== s.id);
        if(campoIdEdit.value === s.id) limpiarFormulario();
        await aplicarCambios(cat);
      })
    );

    item.append(img, info, acciones);
    listaAdmin.appendChild(item);
  });

  if(!catalogo.length){
    const vacio = document.createElement('p');
    vacio.textContent = 'Todavía no hay servicios.';
    listaAdmin.appendChild(vacio);
  }
}

function crearBoton(texto, alPulsar){
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  b.addEventListener('click', alPulsar);
  return b;
}

/* Sube o baja un servicio en el orden del catálogo. */
async function mover(id, direccion){
  const cat = obtenerCatalogo();
  const i = cat.findIndex(s => s.id === id);
  const destino = i + direccion;
  if(i < 0 || destino < 0 || destino >= cat.length) return;
  [cat[i], cat[destino]] = [cat[destino], cat[i]];
  await aplicarCambios(cat);
}

/* ============================================================
   5.5 PUBLICACIÓN: generar el index.html público
   ============================================================ */
const btnExportarSitio = $('btnExportarSitio');
const btnActualizarGitHub = $('btnActualizarGitHub');

const CLAVE_GITHUB_CONFIG = 'solutions_github_config_v1';

function escaparScriptJSON(obj){
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

function obtenerDatosPublicados(){
  const catalogo = obtenerCatalogo().filter(s => s.publicado !== false);
  let categorias = [], categoriasOcultas = [], fondo = '';
  try { categorias = JSON.parse(localStorage.getItem(CLAVE_CATS)) || []; } catch(e){}
  try { categoriasOcultas = JSON.parse(localStorage.getItem(CLAVE_CAT_OCULTA)) || []; } catch(e){}
  try { fondo = localStorage.getItem(CLAVE_FONDO_ADM) || ''; } catch(e){}
  return { catalogo, categorias, categoriasOcultas, fondo };
}

function construirIndexPublicado(){
  const datos = obtenerDatosPublicados();
  const doc = document.documentElement.cloneNode(true);
  const bloqueCatalogo = doc.querySelector('#catalogoPublicado');
  const bloqueDatos = doc.querySelector('#datosPublicados');
  if(bloqueCatalogo) bloqueCatalogo.textContent = escaparScriptJSON(datos.catalogo);
  if(bloqueDatos) bloqueDatos.textContent = escaparScriptJSON({
    categorias: datos.categorias, categoriasOcultas: datos.categoriasOcultas, fondo: datos.fondo
  });
  return '<!DOCTYPE html>\n' + doc.outerHTML;
}

function descargarIndexPublicado(){
  const html = construirIndexPublicado();
  const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'index.html';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const total = obtenerDatosPublicados().catalogo.length;
  alert(total + ' producto(s) publicado(s) en index.html.\n\nSube este archivo a GitHub/Vercel para que todos puedan verlo.');
}

if(btnExportarSitio) btnExportarSitio.addEventListener('click', descargarIndexPublicado);

/* ------------------------------------------------------------
   ACTUALIZAR GITHUB
   Publica directamente el index.html generado en un repositorio
   mediante la API oficial de GitHub.
   El token NO se guarda en localStorage.
   ------------------------------------------------------------ */
function leerConfigGitHub(){
  try { return JSON.parse(localStorage.getItem(CLAVE_GITHUB_CONFIG)) || {}; }
  catch(e){ return {}; }
}

function guardarConfigGitHub(config){
  try { localStorage.setItem(CLAVE_GITHUB_CONFIG, JSON.stringify(config)); }
  catch(e){}
}

function pedirDatoGitHub(mensaje, valorInicial = ''){
  const valor = prompt(mensaje, valorInicial);
  if(valor === null) return null;
  return valor.trim();
}

async function actualizarGitHub(){
  const config = leerConfigGitHub();
  const token = pedirDatoGitHub(
    'Pega tu token de GitHub (Fine-grained) con permiso Contents: Read and write.\n\nPor seguridad, el token no se guardará en este navegador.', ''
  );
  if(token === null) return;
  if(!token){ alert('No se proporcionó el token de GitHub.'); return; }

  const owner = pedirDatoGitHub('Usuario u organización de GitHub:', config.owner || '');
  if(owner === null) return;
  const repo = pedirDatoGitHub('Nombre del repositorio:', config.repo || '');
  if(repo === null) return;
  const branch = pedirDatoGitHub('Rama donde está el index.html:', config.branch || 'main');
  if(branch === null) return;
  if(!owner || !repo || !branch){ alert('Debes indicar usuario/organización, repositorio y rama.'); return; }

  guardarConfigGitHub({owner, repo, branch});
  const html = construirIndexPublicado();
  const apiBase = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/index.html';
  const headers = {
    'Accept':'application/vnd.github+json',
    'Authorization':'Bearer ' + token,
    'X-GitHub-Api-Version':'2022-11-28',
    'Content-Type':'application/json'
  };

  try{
    if(btnActualizarGitHub){ btnActualizarGitHub.disabled=true; btnActualizarGitHub.textContent='Actualizando GitHub...'; }
    let sha=null;
    const consulta=await fetch(apiBase+'?ref='+encodeURIComponent(branch),{method:'GET',headers});
    if(consulta.ok){ const actual=await consulta.json(); sha=actual.sha||null; }
    else if(consulta.status!==404){ throw new Error('GitHub respondió '+consulta.status+': '+await consulta.text()); }

    const bytes=new TextEncoder().encode(html);
    let binario='';
    const bloque=0x8000;
    for(let i=0;i<bytes.length;i+=bloque) binario+=String.fromCharCode(...bytes.subarray(i,i+bloque));

    const cuerpo={message:'Actualizar catálogo desde el panel de administrador',content:btoa(binario),branch};
    if(sha) cuerpo.sha=sha;
    const subida=await fetch(apiBase,{method:'PUT',headers,body:JSON.stringify(cuerpo)});
    const resultado=await subida.json().catch(()=>({}));
    if(!subida.ok) throw new Error(resultado.message||('HTTP '+subida.status));

    alert('¡GitHub actualizado correctamente!\n\nSe publicó el index.html con '+obtenerDatosPublicados().catalogo.length+' producto(s).\n\nGitHub Pages/Vercel puede tardar unos segundos en mostrar los cambios.');
  }catch(error){
    console.error('Error al actualizar GitHub:',error);
    alert('No se pudo actualizar GitHub.\n\nRevisa que el token tenga permiso Contents: Read and write, que el repositorio exista y que la rama sea correcta.\n\nDetalle: '+error.message);
  }finally{
    if(btnActualizarGitHub){ btnActualizarGitHub.disabled=false; btnActualizarGitHub.textContent='Actualizar GitHub'; }
  }
}

if(btnActualizarGitHub) btnActualizarGitHub.addEventListener('click', actualizarGitHub);

/* ============================================================
   6. Abrir y cerrar el panel
   ============================================================ */
function abrirPanel(){
  limpiarFormulario();
  dibujarListaAdmin();
  cargarFondoEnPanel();
  abrirModal(modalAdmin);
}

btnCerrar.addEventListener('click', () => cerrarModal(modalAdmin));

[modalPass, modalAdmin].forEach(m => {
  m.addEventListener('click', e => { if(e.target === m) cerrarModal(m); });
});
document.addEventListener('keydown', e => {
  if(e.key !== 'Escape') return;
  cerrarModal(modalPass);
  cerrarModal(modalAdmin);
});

})();
