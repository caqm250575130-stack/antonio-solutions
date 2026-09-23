/* ============================================================
   ANTONIO'S SOLUTIONS — BIENVENIDA CON FUEGOS ARTIFICIALES
   ------------------------------------------------------------
   Al hacer clic en el logo del encabezado aparece una capa
   con el mensaje "¡Bienvenido a Antonio's Solutions!" y
   fuegos artificiales dibujados en un canvas.
   Se cierra sola a los ~5 segundos, o antes con un clic o Escape.
   ============================================================ */
(function(){
'use strict';

const logo   = document.getElementById('logoSolutions');
const capa   = document.getElementById('capaBienvenida');
const lienzo = document.getElementById('lienzoFuegos');
if(!logo || !capa || !lienzo) return;

const ctx = lienzo.getContext('2d');
const menosAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Paleta acorde a la estética azul del sitio */
const COLORES  = ['#6b8bff','#25f4ee','#ffffff','#a8c0ff','#3ee07f','#ffd166','#7c5cff'];
const DURACION = 5000;

let particulas = [];
let animando   = false;
let idCuadro   = 0;
let idLanzador = 0;
let idCierre   = 0;

function ajustarLienzo(){
  const escala = window.devicePixelRatio || 1;
  lienzo.width  = Math.floor(window.innerWidth  * escala);
  lienzo.height = Math.floor(window.innerHeight * escala);
  ctx.setTransform(escala, 0, 0, escala, 0, 0);
}

/* Una explosión: muchas chispas saliendo de un mismo punto */
function explotar(x, y){
  const color = COLORES[Math.floor(Math.random() * COLORES.length)];
  const total = 46 + Math.floor(Math.random() * 30);
  for(let i = 0; i < total; i++){
    const angulo  = (Math.PI * 2 * i) / total + Math.random() * 0.25;
    const rapidez = 2 + Math.random() * 4.5;
    particulas.push({
      x, y,
      vx: Math.cos(angulo) * rapidez,
      vy: Math.sin(angulo) * rapidez,
      vida: 1,
      desgaste: 0.008 + Math.random() * 0.012,
      radio: 1.5 + Math.random() * 2,
      color: Math.random() < 0.18 ? '#ffffff' : color
    });
  }
}

function explosionAlAzar(){
  const x = window.innerWidth  * (0.12 + Math.random() * 0.76);
  const y = window.innerHeight * (0.12 + Math.random() * 0.45);
  explotar(x, y);
}

function cuadro(){
  const an = window.innerWidth, al = window.innerHeight;

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(3,10,30,.22)';   // velo que deja estela
  ctx.fillRect(0, 0, an, al);

  ctx.globalCompositeOperation = 'lighter';
  for(const p of particulas){
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.045;     // gravedad
    p.vx *= 0.99;
    p.vy *= 0.99;      // rozamiento
    p.vida -= p.desgaste;
    if(p.vida <= 0) continue;

    ctx.globalAlpha = Math.max(0, p.vida);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radio * p.vida + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  particulas = particulas.filter(p => p.vida > 0);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  if(animando) idCuadro = requestAnimationFrame(cuadro);
}

function abrirBienvenida(){
  if(capa.classList.contains('visible')) return;

  capa.hidden = false;
  void capa.offsetWidth;          // fuerza el reflow para que se note el desvanecido
  capa.classList.add('visible');

  if(!menosAnimacion){
    ajustarLienzo();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particulas = [];
    animando = true;
    idCuadro = requestAnimationFrame(cuadro);

    explosionAlAzar();
    setTimeout(explosionAlAzar, 220);
    setTimeout(explosionAlAzar, 460);
    idLanzador = setInterval(explosionAlAzar, 520);
  }

  idCierre = setTimeout(cerrarBienvenida, DURACION);
}

function cerrarBienvenida(){
  if(!capa.classList.contains('visible')) return;

  clearTimeout(idCierre);
  clearInterval(idLanzador);
  capa.classList.remove('visible');

  setTimeout(() => {
    animando = false;
    cancelAnimationFrame(idCuadro);
    particulas = [];
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    capa.hidden = true;
  }, 460);
}

logo.addEventListener('click', abrirBienvenida);
logo.addEventListener('keydown', e => {
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); abrirBienvenida(); }
});
capa.addEventListener('click', cerrarBienvenida);
document.addEventListener('keydown', e => { if(e.key === 'Escape') cerrarBienvenida(); });
window.addEventListener('resize', () => { if(animando) ajustarLienzo(); });

})();
