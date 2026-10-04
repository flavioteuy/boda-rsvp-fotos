const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { Readable, pipeline } = require('stream');
const QRCode = require('qrcode');
const homeAssistant = require('./homeassistant'); // estadisticas y avisos para Home Assistant (opcional)

const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data');
const PHOTOS_DIR = path.join(DATA_DIR, 'fotos');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PAREJA_DIR = path.join(UPLOADS_DIR, 'pareja');
const CABEZALES_DIR = path.join(UPLOADS_DIR, 'cabezales');
const TESTIGOS_DIR = path.join(UPLOADS_DIR, 'testigos');
const SOBRE_FOTOS_DIR = path.join(UPLOADS_DIR, 'sobre');
const RSVP_FILE = path.join(DATA_DIR, 'rsvps.json');
const PHOTOS_META_FILE = path.join(DATA_DIR, 'fotos.json');
const SITE_CONFIG_FILE = path.join(DATA_DIR, 'site-config.json');
const VISITAS_FILE = path.join(DATA_DIR, 'visitas.jsonl');

let opciones = {};
try { opciones = JSON.parse(fs.readFileSync('/data/options.json', 'utf8')); } catch (e) { opciones = {}; }

const PORT = process.env.PORT || 8099;
const ADMIN_PASSWORD = opciones.admin_password || 'cambiame';
const MAX_SOBRE_FOTOS = 12;
const MAPA_MODOS = ['boton', 'auto', 'enlace'];
const SECCIONES_DISPONIBLES = ['cuenta', 'slideshow', 'ubicaciones', 'clima', 'climaHistorico', 'dresscode', 'historia', 'testigos', 'regalos', 'rsvp'];

for (const dir of [DATA_DIR, PHOTOS_DIR, UPLOADS_DIR, PAREJA_DIR, CABEZALES_DIR, TESTIGOS_DIR, SOBRE_FOTOS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
if (!fs.existsSync(RSVP_FILE)) fs.writeFileSync(RSVP_FILE, '[]');
if (!fs.existsSync(PHOTOS_META_FILE)) fs.writeFileSync(PHOTOS_META_FILE, '[]');
if (!fs.existsSync(VISITAS_FILE)) fs.writeFileSync(VISITAS_FILE, '');

function TIPOGRAFIA_POR_DEFECTO() {
  return {
    nombresFuente: 'Playfair Display', nombresTamano: 34, nombresNegrita: false, nombresCursiva: false, nombresColor: '',
    simboloFuente: '', simboloTamano: 60, simboloColor: '',
    detalleFuente: 'Georgia', detalleTamano: 15, detalleNegrita: false, detalleCursiva: false, detalleColor: '',
    mensajeFuente: 'Georgia', mensajeTamano: 16, mensajeNegrita: false, mensajeCursiva: false, mensajeColor: '',
    seccionesTituloFuente: '', seccionesTituloTamano: 17, seccionesTituloNegrita: true, seccionesTituloCursiva: false, seccionesTituloColor: '',
    seccionesTextoFuente: '', seccionesTextoTamano: 15, seccionesTextoNegrita: false, seccionesTextoCursiva: false, seccionesTextoColor: '',
    // Frase que se puede poner entre los dos lugares de "Como llegar"
    fraseFuente: '', fraseTamano: 18, fraseNegrita: false, fraseCursiva: true, fraseColor: ''
  };
}

function seccionesPorDefecto() {
  const cfg = {};
  SECCIONES_DISPONIBLES.forEach((id, i) => { cfg[id] = { habilitado: true, orden: i + 1, cabezal: null }; });
  return cfg;
}

function writeSiteConfigInicial() {
  const inicial = {
    tema: 'clasico',
    novia: opciones.novia || 'Novia',
    novio: opciones.novio || 'Novio',
    simboloNombres: '&',
    fecha: opciones.fecha_boda || '',
    horaInicio: '20:00',
    horaFin: '',
    lugar: opciones.lugar_boda || '',
    mensaje: '',
    banner: null,
    bannerPosicion: { x: 50, y: 50 },
    fondo: null,
    sobreTextura: null,
    sobreFotos: [],
    sobreFotosCantidad: 3,
    sobreFotosPos: {},
    sobreFotosAltura: 0,
    escalaPc: 100,
    animacionesScroll: true,
    animacionEstilo: 'costados',
    animacionRepetir: false,
    mapaModo: 'boton',
    mapaBotonTexto: 'Mostrar mapa',
    estiloSecciones: 'tarjeta',
    tarjetaColor: '',
    bordeColor: '#b58a4a',
    bordeGrosor: 2,
    musica: null,
    fotosPareja: [],
    urlPublica: '',
    fechaInicioRelacion: '',
    registroCivil: { direccion: '', mapsUrl: '', hora: '' },
    salon: { direccion: '', mapsUrl: '', horario: '' },
    dresscode: { texto: '', colores: [], mostrarCodigos: false },
    clima: { nombre: 'Lomas de Solymar, Canelones', lat: -34.807, lon: -55.961 },
    tipografia: TIPOGRAFIA_POR_DEFECTO(),
    almacenamiento: { ruta: '' },
    testigos: [
      { nombre: '', rol: '', foto: null }, { nombre: '', rol: '', foto: null },
      { nombre: '', rol: '', foto: null }, { nombre: '', rol: '', foto: null }
    ],
    regalos: { textoIntro: '', mensajeOculto: '' },
    historia: { titulo: 'Nuestra historia', texto: '' },
    textosSitio: limpiarTextosSitio({}),
    paleta: limpiarPaleta({}),
    fondoEstilo: limpiarFondoEstilo({}, false),
    sobreEstilo: limpiarSobreEstilo({}),
    rsvpTextos: { titulo: 'Confirmá tu asistencia', descripcion: 'Contanos si vas a poder acompañarnos' },
    galeria: limpiarGaleria({}),
    secciones: seccionesPorDefecto(),
    grupos: []
  };
  escribirAtomico(SITE_CONFIG_FILE, JSON.stringify(inicial, null, 2));
}

// Escritura atomica: se escribe a un archivo temporal y despues se renombra. Asi un corte de luz o un
// reinicio en mitad de una escritura no deja el archivo a medias (y las confirmaciones no se pierden).
function escribirAtomico(file, texto) {
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, texto);
  fs.renameSync(tmp, file);
}
// Si un archivo de datos esta danado, se guarda una copia (.corrupto-...) antes de seguir, para poder recuperarlo.
function respaldarCorrupto(file, texto) {
  try { fs.writeFileSync(file + '.corrupto-' + Date.now(), texto); } catch (e) {}
  console.error('El archivo ' + path.basename(file) + ' estaba danado. Se guardo una copia .corrupto-* para recuperarlo.');
}
function readJSON(file) {
  let txt;
  try { txt = fs.readFileSync(file, 'utf8'); } catch (e) { return []; }
  try { return JSON.parse(txt); } catch (e) { respaldarCorrupto(file, txt); return []; }
}
function writeJSON(file, data) {
  escribirAtomico(file, JSON.stringify(data, null, 2));
  // Cualquier cambio en confirmaciones o fotos (nuevas, borradas, recuperadas) se refleja en Home Assistant
  if (file === RSVP_FILE || file === PHOTOS_META_FILE) homeAssistant.cambio();
}

// "Nuestra historia": titulo editable (vacio = "Nuestra historia") y texto propio (vacio = el automatico con la
// fecha en que se conocieron). El titulo va en una sola linea; el texto conserva los saltos de linea.
const HISTORIA_TITULO_DEFECTO = 'Nuestra historia';
function limpiarHistoria(h) {
  h = (h && typeof h === 'object') ? h : {};
  const titulo = String(h.titulo == null ? '' : h.titulo).replace(/\s+/g, ' ').trim().slice(0, 100);
  const texto = String(h.texto == null ? '' : h.texto).replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1500);
  return { titulo: titulo || HISTORIA_TITULO_DEFECTO, texto };
}

// ---- Textos fijos del sitio: se pueden cambiar desde el panel; vacio = el de siempre (salvo portadaTexto, que vacio = no se muestra) ----
const TEXTOS_SITIO_DEF = {
  sobreInstruccion: { def: 'Tocá el sobre para abrir tu invitación', max: 120 },
  portadaTexto: { def: '', max: 60 },                 // texto extra sobre los nombres de la portada, por ejemplo "¡Nos casamos!"
  cuentaTitulo: { def: 'Falta para el gran día', max: 80 },
  comoLlegarTitulo: { def: 'Cómo llegar', max: 80 },
  civilNombre: { def: 'Registro Civil', max: 60 },
  salonNombre: { def: 'Salón de fiesta', max: 60 },
  testigosTitulo: { def: 'Nuestros testigos', max: 80 },
  // Frase entre los dos lugares de "Como llegar" (vacia = no se muestra). Acepta Enter.
  fraseUbicaciones: { def: '', max: 400, multi: true }
};
// Texto de varias lineas (Enter): \r\n pasa a \n, no mas de un renglon en blanco seguido, sin espacios en los bordes
function textoMultilinea(v, max) { return String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max); }
function textoLinea(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }
function limpiarTextosSitio(t) {
  t = (t && typeof t === 'object' && !Array.isArray(t)) ? t : {};
  const out = {};
  for (const k of Object.keys(TEXTOS_SITIO_DEF)) { const d = TEXTOS_SITIO_DEF[k]; out[k] = (d.multi ? textoMultilinea(t[k], d.max) : textoLinea(t[k], d.max)) || d.def; }
  return out;
}
// Galeria: titulo y subtitulo de la pagina de fotos (si alguien los deja vacios, no se muestran)
const GALERIA_TITULO_DEF = 'Subí tus fotos y videos';
const GALERIA_SUBTITULO_MAX = 1000;   // acepta Enter (varios renglones)
const GALERIA_SUBTITULO_DEF = 'Compartí con nosotros los mejores momentos de la boda';
function limpiarGaleria(g) {
  g = (g && typeof g === 'object' && !Array.isArray(g)) ? g : {};
  return {
    subidaHabilitada: !!g.subidaHabilitada,
    mensajeDeshabilitado: (typeof g.mensajeDeshabilitado === 'string' && g.mensajeDeshabilitado.trim()) ? g.mensajeDeshabilitado.slice(0, 200) : 'Muy pronto vas a poder subir tus fotos y videos ✨',
    titulo: typeof g.titulo === 'string' ? textoLinea(g.titulo, 100) : GALERIA_TITULO_DEF,
    subtitulo: typeof g.subtitulo === 'string' ? textoMultilinea(g.subtitulo, GALERIA_SUBTITULO_MAX) : GALERIA_SUBTITULO_DEF
  };
}
// Paleta de colores del sitio. "usar" apagado = se ven los colores del estilo elegido (como siempre).
// Valores iniciales = la paleta "romantica elegante" propuesta (marfil, crema, rosa empolvado, champagne, taupe y cacao).
const HEX6 = /^#[0-9a-fA-F]{6}$/;
const PALETA_PROPUESTA = { fondo: '#f8f4ee', tarjeta: '#fffdf9', detalle: '#d8b9b3', acento: '#d8b98a', textoSuave: '#a89586', texto: '#594a42' };
function limpiarPaleta(p) {
  p = (p && typeof p === 'object' && !Array.isArray(p)) ? p : {};
  const out = { usar: p.usar === true };
  for (const k of Object.keys(PALETA_PROPUESTA)) out[k] = HEX6.test(String(p[k] == null ? '' : p[k])) ? String(p[k]).toLowerCase() : PALETA_PROPUESTA[k];
  return out;
}
// Fondo de la pagina: "tema" (el color del estilo), "foto" (la imagen subida) o "color" (liso, con textura opcional)
const FONDO_MODOS = ['tema', 'foto', 'color'];
const FONDO_TEXTURAS = ['papel', 'lino', 'acuarela', 'puntos', 'rayas', 'hojas'];
function limpiarFondoEstilo(f, tieneFoto) {
  f = (f && typeof f === 'object' && !Array.isArray(f)) ? f : {};
  let modo = FONDO_MODOS.includes(f.modo) ? f.modo : (tieneFoto ? 'foto' : 'tema');
  if (modo === 'foto' && !tieneFoto) modo = 'tema';
  const n = parseInt(f.intensidad, 10);
  return {
    modo,
    color: HEX6.test(String(f.color == null ? '' : f.color)) ? String(f.color).toLowerCase() : '#f8f4ee',
    textura: FONDO_TEXTURAS.includes(f.textura) ? f.textura : '',
    intensidad: Number.isFinite(n) ? Math.max(5, Math.min(100, n)) : 35
  };
}

// Entero dentro de un rango; si no es un numero, el valor por defecto
function limpiarEntero(v, min, max, def) { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def; }
// Un porcentaje 0-100 con un decimal; si no es un numero, 50 (centrado)
function limpiarPorcentaje(v, def) { const n = parseFloat(v); return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n)) * 10) / 10 : (def === undefined ? 50 : def); }
// Cuanto se sube o baja una foto dentro de su marco mas alla de su borde, en % del alto del marco (negativo = sube y queda un hueco abajo, que tapa la
// carta del sobre; positivo = baja y queda un hueco arriba). Con un decimal; si no es un numero, el valor por defecto (0)
const SOBRE_FOTO_DESP_MAX = 70;
function limpiarDesplazamiento(v, def) { const n = parseFloat(v); return Number.isFinite(n) ? Math.round(Math.max(-SOBRE_FOTO_DESP_MAX, Math.min(SOBRE_FOTO_DESP_MAX, n)) * 10) / 10 : (def === undefined ? 0 : def); }
// Encuadre por foto: solo de las fotos que existen, y solo si se movio del centro (x e y: que parte se ve, 0-100; d: cuanto se corre mas alla del borde)
function limpiarSobreFotosPos(pos, archivos) {
  pos = (pos && typeof pos === 'object' && !Array.isArray(pos)) ? pos : {};
  const out = {};
  for (const f of (archivos || [])) {
    const p = pos[f]; if (!p || typeof p !== 'object') continue;
    const x = limpiarPorcentaje(p.x), y = limpiarPorcentaje(p.y), d = limpiarDesplazamiento(p.d);
    if (x !== 50 || y !== 50 || d !== 0) out[f] = { x, y, d };
  }
  return out;
}
// Sobre de invitacion: color del papel (vacio = el de siempre, crema) y una textura propia encima (la misma lista cerrada que el fondo)
function limpiarSobreEstilo(s) {
  s = (s && typeof s === 'object' && !Array.isArray(s)) ? s : {};
  const n = parseInt(s.intensidad, 10);
  return {
    color: HEX6.test(String(s.color == null ? '' : s.color)) ? String(s.color).toLowerCase() : '',
    textura: FONDO_TEXTURAS.includes(s.textura) ? s.textura : '',
    intensidad: Number.isFinite(n) ? Math.max(5, Math.min(100, n)) : 35
  };
}

// (Va despues de definir los ayudantes de arriba: en una instalacion nueva usa sus valores por defecto.)
if (!fs.existsSync(SITE_CONFIG_FILE)) writeSiteConfigInicial();

function readSiteConfig() {
  let cfg;
  let txtCfg = null;
  try { txtCfg = fs.readFileSync(SITE_CONFIG_FILE, 'utf8'); } catch (e) {}
  try { cfg = JSON.parse(txtCfg); if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('config vacia o invalida'); } catch (e) {
    if (txtCfg !== null) respaldarCorrupto(SITE_CONFIG_FILE, txtCfg);
    writeSiteConfigInicial(); cfg = readJSON(SITE_CONFIG_FILE);
  }
  // Completar campos que puedan faltar si el sitio viene de una version anterior
  cfg.simboloNombres = (cfg.simboloNombres || '&').toString().slice(0, 6) || '&';
  cfg.bannerPosicion = cfg.bannerPosicion || { x: 50, y: 50 };
  cfg.fondo = cfg.fondo || null;
  cfg.fondoEstilo = limpiarFondoEstilo(cfg.fondoEstilo, !!cfg.fondo);
  cfg.sobreEstilo = limpiarSobreEstilo(cfg.sobreEstilo);
  cfg.sobreTextura = cfg.sobreTextura || null;
  // Sello del sobre: tipo ("lacre" de cera o "clasico" disco liso), forma del borde del lacre y un color para cada tipo.
  cfg.selloTipo = ['lacre', 'clasico'].includes(cfg.selloTipo) ? cfg.selloTipo : 'lacre';
  cfg.selloForma = ['ondulado', 'redondo', 'irregular'].includes(cfg.selloForma) ? cfg.selloForma : 'ondulado';
  cfg.selloTamano = Math.max(50, Math.min(200, parseInt(cfg.selloTamano, 10) || 100));                        // % del tamano normal
  cfg.selloColor = /^#[0-9a-fA-F]{6}$/.test(cfg.selloColor || '') ? cfg.selloColor : '#9e2a2b';                // color del lacre
  cfg.selloColorClasico = /^#[0-9a-fA-F]{6}$/.test(cfg.selloColorClasico || '') ? cfg.selloColorClasico : '#f4efe6'; // color del clasico
  cfg.tituloPestana = (typeof cfg.tituloPestana === 'string' && cfg.tituloPestana.trim()) ? cfg.tituloPestana.trim().slice(0, 100) : 'Nuestra Boda - Sol y Flavio';
  // Fotos que salen del sobre al abrirlo (hasta 12 guardadas; se muestran las primeras N) y animaciones al hacer scroll
  cfg.sobreFotos = Array.isArray(cfg.sobreFotos) ? cfg.sobreFotos.filter(f => typeof f === 'string' && /^[\w.\-]{1,120}$/.test(f)).slice(0, MAX_SOBRE_FOTOS) : [];
  const cantFotos = parseInt(cfg.sobreFotosCantidad, 10);
  cfg.sobreFotosCantidad = Number.isFinite(cantFotos) ? Math.max(0, Math.min(8, cantFotos)) : 3;
  // Encuadre de cada foto del sobre (que parte de la foto se ve): 0-100 % en cada eje, 50/50 = centrada (como siempre)
  cfg.sobreFotosPos = limpiarSobreFotosPos(cfg.sobreFotosPos, cfg.sobreFotos);
  // Cuanto "suben" las fotos para salir del sobre (0 = como siempre, 100 = salen lo maximo) y tamano del sitio en pantallas grandes (100-150 %)
  cfg.sobreFotosAltura = limpiarEntero(cfg.sobreFotosAltura, 0, 100, 0);
  cfg.escalaPc = limpiarEntero(cfg.escalaPc, 100, 150, 100);
  cfg.animacionesScroll = cfg.animacionesScroll !== false;
  cfg.animacionEstilo = ['costados', 'abajo', 'suave'].includes(cfg.animacionEstilo) ? cfg.animacionEstilo : 'costados';
  cfg.animacionRepetir = cfg.animacionRepetir === true;
  cfg.mapaModo = MAPA_MODOS.includes(cfg.mapaModo) ? cfg.mapaModo : 'boton';   // boton | auto | enlace
  cfg.mapaBotonTexto = (typeof cfg.mapaBotonTexto === 'string' && cfg.mapaBotonTexto.trim()) ? cfg.mapaBotonTexto.trim().slice(0, 30) : 'Mostrar mapa';
  cfg.mostrarAvisoFotos = cfg.mostrarAvisoFotos !== false;              // aviso "cada invitado ve solo sus fotos" (galeria)
  cfg.mostrarAvisoEstadisticas = cfg.mostrarAvisoEstadisticas !== false; // texto del pie sobre las estadisticas de acceso
  cfg.estiloSecciones = cfg.estiloSecciones || 'tarjeta';
  cfg.tarjetaColor = cfg.tarjetaColor || '';
  cfg.bordeColor = cfg.bordeColor || '#b58a4a';
  cfg.bordeGrosor = cfg.bordeGrosor || 2;
  cfg.registroCivil = cfg.registroCivil || { direccion: '', mapsUrl: '', hora: '' };
  cfg.salon = cfg.salon || { direccion: '', mapsUrl: '', horario: '' };
  cfg.dresscode = cfg.dresscode || { texto: '', colores: [] };
  cfg.dresscode.mostrarCodigos = cfg.dresscode.mostrarCodigos === true;
  cfg.clima = cfg.clima || { nombre: 'Lomas de Solymar, Canelones', lat: -34.807, lon: -55.961 };
  cfg.tipografia = Object.assign(TIPOGRAFIA_POR_DEFECTO(), cfg.tipografia || {});
  cfg.almacenamiento = cfg.almacenamiento || { ruta: '' };
  cfg.testigos = cfg.testigos && cfg.testigos.length === 4 ? cfg.testigos : [
    { nombre: '', rol: '', foto: null }, { nombre: '', rol: '', foto: null },
    { nombre: '', rol: '', foto: null }, { nombre: '', rol: '', foto: null }
  ];
  cfg.regalos = cfg.regalos || { textoIntro: '', mensajeOculto: '' };
  cfg.historia = limpiarHistoria(cfg.historia);
  cfg.rsvpTextos = cfg.rsvpTextos || { titulo: 'Confirmá tu asistencia', descripcion: 'Contanos si vas a poder acompañarnos' };
  cfg.galeria = limpiarGaleria(cfg.galeria);
  cfg.textosSitio = limpiarTextosSitio(cfg.textosSitio);
  cfg.paleta = limpiarPaleta(cfg.paleta);
  cfg.secciones = cfg.secciones || seccionesPorDefecto();
  SECCIONES_DISPONIBLES.forEach((id, i) => {
    if (!cfg.secciones[id]) cfg.secciones[id] = { habilitado: true, orden: i + 1, cabezal: null };
  });
  cfg.fechaInicioRelacion = cfg.fechaInicioRelacion || '';
  cfg.grupos = cfg.grupos || [];
  cfg.grupos.forEach(g => { g.invitados = g.invitados || []; g.limite = g.limite || 0; });
  return cfg;
}
function writeSiteConfig(cfg) { escribirAtomico(SITE_CONFIG_FILE, JSON.stringify(cfg, null, 2)); }

function generarCodigoGrupo(existentes) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo;
  do { codigo = Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join(''); }
  while (existentes.some(g => g.codigo === codigo));
  return codigo;
}

const app = express();
app.disable('x-powered-by');
// Solo se confia en cabeceras X-Forwarded-For que vengan de un proxy de la red local (Nginx Proxy Manager, Cloudflared, etc.).
// Con "true" cualquiera podia falsear su IP y saltarse los limites de intentos.
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// ---------- Acceso al panel de administracion ----------
// El panel YA NO esta en /admin.html ni tiene un link en el sitio: vive en una ruta secreta. Se elige en la configuracion del add-on
// (opcion "ruta_admin"); si no se elige ninguna, se genera una al azar la primera vez, se guarda en /data y se muestra en el registro (Log).
const RUTA_ADMIN_OK = /^[A-Za-z0-9_-]{6,64}$/;
const RUTA_ADMIN_ADIVINABLE = /^(admin|administrador|administracion|administrator|panel|panel-admin|login|wp-admin|wp-login|dashboard|backend|novios|boda|manager|gestion)$/i;
function obtenerRutaAdmin() {
  const elegida = String(opciones.ruta_admin || '').trim().replace(/^\/+|\/+$/g, '');
  if (elegida) {
    if (RUTA_ADMIN_OK.test(elegida) && !RUTA_ADMIN_ADIVINABLE.test(elegida)) return elegida;
    console.warn('⚠️  La opcion "ruta_admin" no sirve (usa 6 a 64 letras, numeros, guion o guion bajo, sin espacios ni puntos, y nada facil de adivinar como "admin" o "panel"). Se usa una ruta automatica.');
  }
  const archivo = path.join(DATA_DIR, 'ruta-admin.txt');
  try { const t = fs.readFileSync(archivo, 'utf8').trim(); if (RUTA_ADMIN_OK.test(t)) return t; } catch (e) {}
  const nueva = crypto.randomBytes(9).toString('base64url');
  try { escribirAtomico(archivo, nueva + '\n'); } catch (e) {}
  return nueva;
}
const RUTA_ADMIN = obtenerRutaAdmin();
const ARCHIVO_PANEL = path.join(__dirname, 'panel', 'admin.html'); // fuera de "public": nadie lo puede pedir por su nombre de archivo
const ADMIN_SOLO_RED_LOCAL = opciones.admin_solo_red_local === true;
if (fs.existsSync(path.join(__dirname, 'public', 'admin.html'))) console.warn('⚠️  Hay un public/admin.html de una version vieja. Ya no se usa ni se sirve (el panel esta en la ruta secreta); podes borrarlo de la carpeta del add-on.');
if (!fs.existsSync(ARCHIVO_PANEL)) console.warn('⚠️  No se encontro panel/admin.html: al actualizar hay que copiar tambien la carpeta "panel" y reconstruir el add-on (ver README).');
console.log('🔐 Panel de administración: entrá a  https://TU-DOMINIO/' + RUTA_ADMIN + '  (guardá este enlace; no figura en ninguna página del sitio)');
if (ADMIN_SOLO_RED_LOCAL) console.log('🔒 El panel solo responde a dispositivos de la red local (admin_solo_red_local activado).');
// Con "admin_solo_red_local" el panel y su API responden 404 a cualquier IP de Internet: solo se administra desde tu casa (o por VPN).
// "Local" = la IP que ve el servidor es privada Y ninguna cabecera de proxy (Cloudflare, X-Real-IP) dice que el visitante viene de Internet.
// Esas cabeceras solo se usan para NEGAR: quien las falsee, a lo sumo se bloquea a si mismo.
function origenLocal(req) {
  if (!ipPrivada(ipCliente(req))) return false;
  for (const h of ['cf-connecting-ip', 'x-real-ip', 'true-client-ip']) {
    const v = String((req.headers && req.headers[h]) || '').split(',')[0].trim().replace(/^::ffff:/, '');
    if (v && !ipPrivada(v)) return false;
  }
  return true;
}
function soloRedLocal(req, res, next) {
  if (!ADMIN_SOLO_RED_LOCAL || origenLocal(req)) return next();
  return res.status(404).type('text/plain').send('Not found');
}

// ---------- Cabeceras de seguridad ----------
const CSP_PAGINA = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'"
].join('; ');
// Los archivos subidos (fotos, videos, musica) se sirven "encerrados": aunque alguien lograra subir un HTML/SVG, no puede ejecutar scripts.
const CSP_ARCHIVOS = "default-src 'none'; sandbox";
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  res.setHeader('Content-Security-Policy', /^\/(fotos-subidas|media)\//.test(req.path) ? CSP_ARCHIVOS : CSP_PAGINA);
  if (/^\/api\/(admin|rsvps|photos)/.test(req.path)) res.setHeader('Cache-Control', 'no-store');
  next();
});

// ---------- Limites de intentos (en memoria, por IP) ----------
const contadores = new Map();
function contar(clave, ventanaMs) {
  const t = Date.now();
  let e = contadores.get(clave);
  if (!e || t > e.hasta) { e = { n: 0, hasta: t + ventanaMs }; contadores.set(clave, e); }
  e.n++;
  return e.n;
}
function cuenta(clave) { const e = contadores.get(clave); return (e && Date.now() <= e.hasta) ? e.n : 0; }
setInterval(() => { const t = Date.now(); for (const [k, e] of contadores) if (t > e.hasta) contadores.delete(k); }, 5 * 60 * 1000).unref();
function limitar(nombre, max, ventanaMs) {
  return (req, res, next) => {
    if (contar(nombre + ':' + ipCliente(req), ventanaMs) > max) {
      res.setHeader('Retry-After', String(Math.ceil(ventanaMs / 1000)));
      return res.status(429).json({ error: 'Demasiados intentos. Esperá un rato y probá de nuevo.' });
    }
    next();
  };
}

app.use(express.json({ limit: '200kb' }));
app.get('/' + RUTA_ADMIN, soloRedLocal, (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(ARCHIVO_PANEL);
});
app.use(['/api/admin', '/api/rsvps'], soloRedLocal);
// Aunque en la carpeta "public" haya quedado un admin.html de una version vieja (pasa al copiar una carpeta encima de otra sin borrar
// lo anterior), nunca se sirve: el panel actual solo vive en la ruta secreta. Sin esto se abriria un panel viejo, sin las opciones nuevas.
app.use((req, res, next) => (/^\/admin(\.html)?\/?$/i.test(req.path || '') ? res.status(404).type('text/plain').send('Not found') : next()));
// no-cache (no "sin cachear del todo", sino "revalidar siempre con el servidor") para que al actualizar
// el add-on los navegadores (sobre todo en celulares) no sigan mostrando un HTML/CSS/JS viejo guardado.
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, rutaArchivo) => {
    if (/\.(html|css|js)$/i.test(rutaArchivo)) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// ==================== ALMACENAMIENTO DE FOTOS/VIDEOS (interno o disco externo) ====================
// Los discos externos aparecen dentro de /media (por ejemplo con el add-on "Mount It" o una regla udev).
// Solo se usa el disco externo si /media/<unidad> es realmente un montaje distinto al disco interno;
// si no, se guarda en el almacenamiento interno para no escribir en una carpeta vacia por error.
const MEDIA_ROOT = '/media';
function unidadEsExterna(nombre) {
  try {
    const raiz = fs.statSync(MEDIA_ROOT);
    const unidad = fs.statSync(path.join(MEDIA_ROOT, nombre));
    return unidad.isDirectory() && unidad.dev !== raiz.dev;
  } catch (e) { return false; }
}
function unidadDeRuta(ruta) {
  const rel = path.relative(MEDIA_ROOT, ruta);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep)[0];
}
// Carpeta "visible" por defecto: dentro de /media (la carpeta compartida de Home Assistant,
// la misma que ya se ve por Samba/Archivos en el sistema operativo). Se usa mientras no se elija
// un disco externo, para que las fotos/videos NO queden escondidas en el almacenamiento interno
// del complemento (que no es facil de encontrar desde afuera).
const CARPETA_VISIBLE = 'boda_fotos';
function carpetaVisibleEscribible() {
  try {
    if (!fs.existsSync(MEDIA_ROOT)) return false;
    const destino = path.join(MEDIA_ROOT, CARPETA_VISIBLE);
    fs.mkdirSync(destino, { recursive: true });
    const prueba = path.join(destino, '.prueba-escritura');
    fs.writeFileSync(prueba, 'ok');
    fs.unlinkSync(prueba);
    return true;
  } catch (e) { return false; }
}
function infoAlmacenamiento() {
  const cfg = readSiteConfig();
  const configurada = (cfg.almacenamiento && cfg.almacenamiento.ruta) || '';
  const porDefectoVisible = carpetaVisibleEscribible();
  const rutaPorDefecto = porDefectoVisible ? path.join(MEDIA_ROOT, CARPETA_VISIBLE) : PHOTOS_DIR;
  if (!configurada) return { configurada: '', enUso: rutaPorDefecto, externo: false, montado: true, visible: porDefectoVisible };
  const unidad = unidadDeRuta(configurada);
  const montado = !!unidad && unidadEsExterna(unidad);
  return { configurada, enUso: montado ? configurada : rutaPorDefecto, externo: montado, montado, visible: montado || porDefectoVisible };
}
function dirFotosActual() {
  const info = infoAlmacenamiento();
  try {
    if (!fs.existsSync(info.enUso)) fs.mkdirSync(info.enUso, { recursive: true });
    return info.enUso;
  } catch (e) { return PHOTOS_DIR; }
}
const estaticosFotos = {};
// Cada archivo subido tiene un nombre unico (fecha + azar) y nunca se modifica, asi que el navegador puede guardarlo sin volver a preguntar: menos pedidos, sitio mas rapido
function estaticoPara(dir) { return estaticosFotos[dir] || (estaticosFotos[dir] = express.static(dir, { maxAge: '7d', immutable: true })); }
app.use('/fotos-subidas', (req, res, next) => {
  const dir = dirFotosActual();
  estaticoPara(dir)(req, res, (err) => {
    if (err || dir === PHOTOS_DIR) return next(err);
    estaticoPara(PHOTOS_DIR)(req, res, next); // archivos subidos antes de conectar el disco
  });
});
app.use('/media', express.static(UPLOADS_DIR, { maxAge: '30d', immutable: true }));

// La contraseña SOLO se acepta por cabecera (x-admin-password), nunca por la URL: en la URL queda en el historial,
// en los logs del servidor/proxy y en la cabecera Referer. Se compara en tiempo constante y, tras 10 intentos fallidos
// desde la misma IP, se bloquean los intentos por 15 minutos (evita adivinar la contraseña por fuerza bruta).
const CLAVE_HASH = crypto.createHash('sha256').update(String(ADMIN_PASSWORD)).digest();
const PASSWORD_DEBIL = ADMIN_PASSWORD === 'cambiame' || String(ADMIN_PASSWORD).length < 8;
if (PASSWORD_DEBIL) console.warn('⚠️  ATENCION: la contraseña de administrador es la de fabrica o tiene menos de 8 caracteres. Cambiala en la configuracion del add-on.');
const MAX_FALLOS_ADMIN = 10, VENTANA_FALLOS_ADMIN = 15 * 60 * 1000;
function claveCorrecta(p) {
  return typeof p === 'string' && p.length > 0 && p.length < 300 &&
    crypto.timingSafeEqual(crypto.createHash('sha256').update(p).digest(), CLAVE_HASH);
}
function checkAdmin(req, res, next) {
  const clave = 'a:' + ipCliente(req);
  if (cuenta(clave) >= MAX_FALLOS_ADMIN) {
    res.setHeader('Retry-After', String(VENTANA_FALLOS_ADMIN / 1000));
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Esperá 15 minutos.' });
  }
  if (!claveCorrecta(req.headers['x-admin-password'])) {
    contar(clave, VENTANA_FALLOS_ADMIN);
    return res.status(401).json({ error: 'No autorizado' });
  }
  contadores.delete(clave);
  next();
}
// Igual que checkAdmin pero sin cortar la request: solo dice si quien pregunta es el admin/los novios,
// para endpoints publicos que muestran mas o menos segun quien mira (ej. la galeria de fotos).
function esAdmin(req) {
  const p = req.headers['x-admin-password'];
  if (!p) return false;
  if (ADMIN_SOLO_RED_LOCAL && !origenLocal(req)) return false;
  const clave = 'a:' + ipCliente(req);
  if (cuenta(clave) >= MAX_FALLOS_ADMIN) return false;
  if (!claveCorrecta(p)) { contar(clave, VENTANA_FALLOS_ADMIN); return false; }
  return true;
}

// ---------- Subidas: tipos y extensiones permitidos ----------
// El tipo (mimetype) y el nombre los manda el navegador y se pueden falsear. Antes se guardaba la extension que pusiera quien subia
// el archivo (por ejemplo ".html" o ".svg" con tipo "image/png"), y el servidor lo entregaba como pagina web desde el mismo dominio
// del sitio: eso permitia ejecutar scripts (XSS almacenado). Ahora la extension sale de una lista cerrada; si no esta, se usa la
// que corresponde al tipo, y si tampoco, se rechaza el archivo. SVG y HTML nunca se aceptan.
const TIPOS_SUBIDA = {
  image: {
    ok: new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.avif', '.bmp']),
    mime: { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/pjpeg': '.jpg', 'image/png': '.png', 'image/x-png': '.png', 'image/gif': '.gif',
      'image/webp': '.webp', 'image/heic': '.heic', 'image/heic-sequence': '.heic', 'image/heif': '.heif', 'image/heif-sequence': '.heif',
      'image/avif': '.avif', 'image/bmp': '.bmp' }
  },
  video: {
    ok: new Set(['.mp4', '.m4v', '.mov', '.webm', '.3gp', '.3g2', '.avi', '.mkv', '.mpg', '.mpeg', '.ogv']),
    mime: { 'video/mp4': '.mp4', 'video/x-m4v': '.m4v', 'video/quicktime': '.mov', 'video/webm': '.webm', 'video/3gpp': '.3gp', 'video/3gpp2': '.3g2',
      'video/x-msvideo': '.avi', 'video/x-matroska': '.mkv', 'video/mpeg': '.mpg', 'video/ogg': '.ogv' }
  },
  audio: {
    ok: new Set(['.mp3', '.m4a', '.aac', '.ogg', '.oga', '.wav', '.flac', '.weba', '.opus']),
    mime: { 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/aac': '.aac', 'audio/ogg': '.ogg',
      'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav', 'audio/flac': '.flac', 'audio/webm': '.weba', 'audio/opus': '.opus' }
  }
};
// Los errores de multer vienen en ingles ("File too large"): se traducen para que el panel y los invitados los entiendan.
function mensajeErrorSubida(err) {
  const M = {
    LIMIT_FILE_SIZE: 'El archivo es demasiado grande para este tipo de subida.',
    LIMIT_FILE_COUNT: 'Elegiste demasiados archivos a la vez.',
    LIMIT_UNEXPECTED_FILE: 'El formulario envió un archivo que no corresponde.',
    LIMIT_PART_COUNT: 'El formulario tiene demasiadas partes.',
    LIMIT_FIELD_KEY: 'El formulario tiene datos inválidos.', LIMIT_FIELD_VALUE: 'El formulario tiene datos demasiado largos.', LIMIT_FIELD_COUNT: 'El formulario tiene demasiados datos.'
  };
  return (err && M[err.code]) || (err && err.message) || 'No se pudo subir el archivo.';
}
function extensionSegura(file, familias) {
  const mime = String(file.mimetype || '').toLowerCase();
  const ext = path.extname(String(file.originalname || '')).toLowerCase();
  for (const f of familias) if (mime.startsWith(f + '/') && TIPOS_SUBIDA[f].ok.has(ext)) return ext;
  for (const f of familias) if (TIPOS_SUBIDA[f].mime[mime]) return TIPOS_SUBIDA[f].mime[mime];
  return null;
}
function sufijoAleatorio() { return crypto.randomBytes(8).toString('hex'); } // 64 bits: nombres imposibles de adivinar

function crearUploaderImagen(destino, prefijo, limiteMB) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, destino),
      filename: (req, file, cb) => cb(null, prefijo + '-' + Date.now() + '-' + sufijoAleatorio() + (extensionSegura(file, ['image']) || '.jpg'))
    }),
    limits: { fileSize: (limiteMB || 15) * 1024 * 1024, files: 30, fields: 10, fieldSize: 10 * 1024 },
    fileFilter: (req, file, cb) => extensionSegura(file, ['image']) ? cb(null, true) : cb(new Error('Solo se permiten imágenes JPG, PNG, GIF, WEBP, HEIC o AVIF'))
  });
}

function urlMedia(carpetaRelativa, archivo) {
  return archivo ? ('/media/' + carpetaRelativa + archivo) : null;
}

// ==================== CONFIG PUBLICA ====================
app.get('/api/config', (req, res) => {
  const cfg = readSiteConfig();
  const seccionesOrdenadas = Object.keys(cfg.secciones)
    .map(id => ({ id, ...cfg.secciones[id] }))
    .sort((a, b) => a.orden - b.orden)
    .map(s => ({ id: s.id, habilitado: s.habilitado, cabezalUrl: s.cabezal ? urlMedia('cabezales/', s.cabezal) : null }));

  res.json({
    tema: cfg.tema, novia: cfg.novia, novio: cfg.novio, simboloNombres: cfg.simboloNombres,
    fecha: cfg.fecha, horaInicio: cfg.horaInicio, horaFin: cfg.horaFin,
    lugar: cfg.lugar, mensaje: cfg.mensaje, tituloPestana: cfg.tituloPestana,
    animacionesScroll: cfg.animacionesScroll, animacionEstilo: cfg.animacionEstilo, animacionRepetir: cfg.animacionRepetir,
    mapaModo: cfg.mapaModo, mapaBotonTexto: cfg.mapaBotonTexto,
    sobreFotos: cfg.sobreFotos.slice(0, cfg.sobreFotosCantidad).map(f => '/media/sobre/' + f),
    sobreFotosPos: cfg.sobreFotos.slice(0, cfg.sobreFotosCantidad).map(f => cfg.sobreFotosPos[f] || { x: 50, y: 50, d: 0 }),   // en el mismo orden que sobreFotos
    sobreFotosAltura: cfg.sobreFotosAltura,
    escalaPc: cfg.escalaPc,
    bannerUrl: cfg.banner ? ('/media/' + cfg.banner) : null,
    bannerPosicion: cfg.bannerPosicion,
    fondoUrl: cfg.fondo ? ('/media/' + cfg.fondo) : null,
    sobreTexturaUrl: cfg.sobreTextura ? ('/media/' + cfg.sobreTextura) : null,
    selloTipo: cfg.selloTipo, selloForma: cfg.selloForma, selloTamano: cfg.selloTamano, selloColor: cfg.selloColor, selloColorClasico: cfg.selloColorClasico,
    mostrarAvisoFotos: cfg.mostrarAvisoFotos, mostrarAvisoEstadisticas: cfg.mostrarAvisoEstadisticas,
    estiloSecciones: cfg.estiloSecciones, tarjetaColor: cfg.tarjetaColor, bordeColor: cfg.bordeColor, bordeGrosor: cfg.bordeGrosor,
    musicaUrl: cfg.musica ? ('/media/' + cfg.musica) : null,
    fotosPareja: (cfg.fotosPareja || []).map(f => '/media/pareja/' + f),
    registroCivil: { ...cfg.registroCivil, mapsUrl: urlHttp(cfg.registroCivil.mapsUrl, 500) }, salon: { ...cfg.salon, mapsUrl: urlHttp(cfg.salon.mapsUrl, 500) },
    dresscode: { ...cfg.dresscode, colores: (cfg.dresscode.colores || []).filter(c => COLOR_DRESS_OK.test(String(c))) },
    clima: cfg.clima,
    fechaInicioRelacion: cfg.fechaInicioRelacion,
    tipografia: cfg.tipografia,
    testigos: cfg.testigos.map(t => ({ nombre: t.nombre, rol: t.rol, fotoUrl: t.foto ? urlMedia('testigos/', t.foto) : null })),
    regalos: cfg.regalos,
    historia: cfg.historia,
    textosSitio: cfg.textosSitio,
    paleta: cfg.paleta,
    fondoEstilo: cfg.fondoEstilo,
    sobreEstilo: cfg.sobreEstilo,
    rsvpTextos: cfg.rsvpTextos,
    galeria: cfg.galeria,
    secciones: seccionesOrdenadas
  });
});

app.get('/api/grupo/:codigo', (req, res) => {
  const claveGrupo = 'g:' + ipCliente(req);
  if (cuenta(claveGrupo) >= 30) return res.status(429).json({ error: 'Demasiados intentos. Probá más tarde.' });
  const cfg = readSiteConfig();
  const g = (cfg.grupos || []).find(gr => gr.codigo === req.params.codigo);
  if (!g) { contar(claveGrupo, 15 * 60 * 1000); return res.status(404).json({ error: 'Grupo no encontrado' }); }
  res.json({ nombre: g.nombre, invitados: g.invitados || [] });
});

app.get('/api/admin/verificar', checkAdmin, (req, res) => res.json({ ok: true, passwordDebil: PASSWORD_DEBIL }));

// ==================== TEXTOS GENERALES ====================
const COLOR_OK_TEXTOS = /^#[0-9a-fA-F]{6}$/;
// Solo enlaces http(s): un "javascript:..." en un enlace de mapa se ejecutaria al tocarlo.
function urlHttp(v, max) {
  const t = String(v || '').trim().slice(0, max || 500);
  if (!t) return '';
  try { const u = new URL(t); return (u.protocol === 'http:' || u.protocol === 'https:') ? t : ''; } catch (e) { return ''; }
}
const COLOR_DRESS_OK = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{3,20})$/;
app.post('/api/admin/textos', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const { novia, novio, simboloNombres, tituloPestana, fecha, horaInicio, horaFin, lugar, mensaje, tema, urlPublica, fechaInicioRelacion, estiloSecciones, tarjetaColor, bordeColor, bordeGrosor, selloColor, selloColorClasico, selloTipo, selloForma, selloTamano, mostrarAvisoFotos, mostrarAvisoEstadisticas, animacionesScroll, animacionEstilo, animacionRepetir, sobreFotosCantidad, sobreFotosAltura, escalaPc } = req.body || {};
  if (novia !== undefined) cfg.novia = String(novia).slice(0, 100);
  if (novio !== undefined) cfg.novio = String(novio).slice(0, 100);
  if (simboloNombres !== undefined) cfg.simboloNombres = String(simboloNombres).trim().slice(0, 6) || '&';
  if (tituloPestana !== undefined) cfg.tituloPestana = String(tituloPestana).trim().slice(0, 100) || 'Nuestra Boda - Sol y Flavio';
  if (fecha !== undefined) cfg.fecha = String(fecha).slice(0, 20);
  if (horaInicio !== undefined) cfg.horaInicio = String(horaInicio).slice(0, 5);
  if (horaFin !== undefined) cfg.horaFin = String(horaFin).slice(0, 5);
  if (lugar !== undefined) cfg.lugar = String(lugar).slice(0, 200);
  if (mensaje !== undefined) cfg.mensaje = String(mensaje).slice(0, 500);
  if (urlPublica !== undefined) cfg.urlPublica = urlHttp(urlPublica, 200).replace(/\/$/, '');
  if (fechaInicioRelacion !== undefined) cfg.fechaInicioRelacion = String(fechaInicioRelacion).slice(0, 20);
  if (estiloSecciones && ['tarjeta', 'plano', 'borde'].includes(estiloSecciones)) cfg.estiloSecciones = estiloSecciones;
  if (tarjetaColor !== undefined) cfg.tarjetaColor = COLOR_OK_TEXTOS.test(String(tarjetaColor || '')) ? String(tarjetaColor) : '';
  if (bordeColor !== undefined && COLOR_OK_TEXTOS.test(String(bordeColor || ''))) cfg.bordeColor = String(bordeColor);
  if (bordeGrosor !== undefined) cfg.bordeGrosor = Math.max(1, Math.min(10, parseInt(bordeGrosor, 10) || cfg.bordeGrosor));
  if (selloColor !== undefined && COLOR_OK_TEXTOS.test(String(selloColor || ''))) cfg.selloColor = String(selloColor);
  if (selloColorClasico !== undefined && COLOR_OK_TEXTOS.test(String(selloColorClasico || ''))) cfg.selloColorClasico = String(selloColorClasico);
  if (selloTipo && ['lacre', 'clasico'].includes(selloTipo)) cfg.selloTipo = selloTipo;
  if (selloTamano !== undefined) cfg.selloTamano = Math.max(50, Math.min(200, parseInt(selloTamano, 10) || cfg.selloTamano));
  if (selloForma && ['ondulado', 'redondo', 'irregular'].includes(selloForma)) cfg.selloForma = selloForma;
  if (mostrarAvisoFotos !== undefined) cfg.mostrarAvisoFotos = !!mostrarAvisoFotos;
  if (mostrarAvisoEstadisticas !== undefined) cfg.mostrarAvisoEstadisticas = !!mostrarAvisoEstadisticas;
  if (animacionesScroll !== undefined) cfg.animacionesScroll = !!animacionesScroll;
  if (animacionEstilo && ['costados', 'abajo', 'suave'].includes(animacionEstilo)) cfg.animacionEstilo = animacionEstilo;
  if (animacionRepetir !== undefined) cfg.animacionRepetir = !!animacionRepetir;
  if (sobreFotosCantidad !== undefined) { const n = parseInt(sobreFotosCantidad, 10); if (Number.isFinite(n)) cfg.sobreFotosCantidad = Math.max(0, Math.min(8, n)); }
  if (sobreFotosAltura !== undefined) cfg.sobreFotosAltura = limpiarEntero(sobreFotosAltura, 0, 100, cfg.sobreFotosAltura);
  if (escalaPc !== undefined) cfg.escalaPc = limpiarEntero(escalaPc, 100, 150, cfg.escalaPc);
  if (tema && ['clasico', 'botanico', 'moderno'].includes(tema)) cfg.tema = tema;
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

const FUENTE_OK = /^[A-Za-z0-9 ]{1,40}$/;
const COLOR_OK = /^#[0-9a-fA-F]{6}$/;
app.post('/api/admin/tipografia', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const b = req.body || {}, t = cfg.tipografia;
  const fuente = (v, actual) => FUENTE_OK.test(String(v || '')) ? String(v) : actual;
  const color = (v) => COLOR_OK.test(String(v || '')) ? String(v) : '';
  const num = (v, min, max, actual) => Math.max(min, Math.min(max, parseInt(v, 10) || actual));
  cfg.tipografia = {
    nombresFuente: fuente(b.nombresFuente, t.nombresFuente),
    nombresTamano: num(b.nombresTamano, 16, 90, t.nombresTamano),
    nombresNegrita: !!b.nombresNegrita, nombresCursiva: !!b.nombresCursiva, nombresColor: color(b.nombresColor),
    // Simbolo entre los nombres: '' = igual que los nombres. El tamano es un porcentaje del tamano de los nombres.
    simboloFuente: b.simboloFuente === '' ? '' : fuente(b.simboloFuente, t.simboloFuente),
    simboloTamano: num(b.simboloTamano, 30, 150, t.simboloTamano),
    simboloColor: color(b.simboloColor),
    detalleFuente: fuente(b.detalleFuente, t.detalleFuente),
    detalleTamano: num(b.detalleTamano, 10, 40, t.detalleTamano),
    detalleNegrita: !!b.detalleNegrita, detalleCursiva: !!b.detalleCursiva, detalleColor: color(b.detalleColor),
    mensajeFuente: fuente(b.mensajeFuente, t.mensajeFuente),
    mensajeTamano: num(b.mensajeTamano, 12, 40, t.mensajeTamano),
    mensajeNegrita: !!b.mensajeNegrita, mensajeCursiva: !!b.mensajeCursiva, mensajeColor: color(b.mensajeColor),
    seccionesTituloFuente: b.seccionesTituloFuente === '' ? '' : fuente(b.seccionesTituloFuente, t.seccionesTituloFuente),
    seccionesTituloTamano: num(b.seccionesTituloTamano, 12, 40, t.seccionesTituloTamano),
    seccionesTituloNegrita: b.seccionesTituloNegrita === undefined ? t.seccionesTituloNegrita : !!b.seccionesTituloNegrita,
    seccionesTituloCursiva: !!b.seccionesTituloCursiva, seccionesTituloColor: color(b.seccionesTituloColor),
    seccionesTextoFuente: b.seccionesTextoFuente === '' ? '' : fuente(b.seccionesTextoFuente, t.seccionesTextoFuente),
    seccionesTextoTamano: num(b.seccionesTextoTamano, 10, 30, t.seccionesTextoTamano),
    seccionesTextoNegrita: !!b.seccionesTextoNegrita, seccionesTextoCursiva: !!b.seccionesTextoCursiva, seccionesTextoColor: color(b.seccionesTextoColor),
    // Frase entre ubicaciones: si un panel viejo no manda estos campos, se conservan los guardados
    fraseFuente: b.fraseFuente === undefined ? t.fraseFuente : (b.fraseFuente === '' ? '' : fuente(b.fraseFuente, t.fraseFuente)),
    fraseTamano: b.fraseTamano === undefined ? t.fraseTamano : num(b.fraseTamano, 10, 48, t.fraseTamano),
    fraseNegrita: b.fraseNegrita === undefined ? t.fraseNegrita : !!b.fraseNegrita,
    fraseCursiva: b.fraseCursiva === undefined ? t.fraseCursiva : !!b.fraseCursiva,
    fraseColor: b.fraseColor === undefined ? t.fraseColor : color(b.fraseColor)
  };
  writeSiteConfig(cfg);
  res.json({ ok: true, tipografia: cfg.tipografia });
});

// ==================== UBICACIONES / CLIMA ====================
app.post('/api/admin/lugares', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const { registroCivil, salon, clima, mapaModo, mapaBotonTexto } = req.body || {};
  if (mapaModo !== undefined && MAPA_MODOS.includes(mapaModo)) cfg.mapaModo = mapaModo;
  if (mapaBotonTexto !== undefined) cfg.mapaBotonTexto = String(mapaBotonTexto).trim().slice(0, 30) || 'Mostrar mapa';
  if (registroCivil) cfg.registroCivil = {
    direccion: String(registroCivil.direccion || '').slice(0, 200),
    mapsUrl: urlHttp(registroCivil.mapsUrl, 500),
    hora: textoMultilinea(registroCivil.hora, 500)
  };
  if (salon) cfg.salon = {
    direccion: String(salon.direccion || '').slice(0, 200),
    mapsUrl: urlHttp(salon.mapsUrl, 500),
    horario: String(salon.horario || '').slice(0, 500)
  };
  if (clima) {
    const lat = parseFloat(clima.lat), lon = parseFloat(clima.lon);
    cfg.clima = {
      nombre: String(clima.nombre || '').slice(0, 150),
      lat: isNaN(lat) ? cfg.clima.lat : lat,
      lon: isNaN(lon) ? cfg.clima.lon : lon
    };
  }
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== DRESS CODE ====================
app.post('/api/admin/dresscode', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const { texto, colores, mostrarCodigos } = req.body || {};
  cfg.dresscode = {
    // varias lineas con Enter: se conservan los saltos, pero no mas de un renglon en blanco seguido
    texto: String(texto || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 500),
    colores: Array.isArray(colores) ? colores.slice(0, 8).map(c => String(c).trim().slice(0, 20)).filter(c => COLOR_DRESS_OK.test(c)) : [],
    mostrarCodigos: !!mostrarCodigos
  };
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== NUESTRA HISTORIA (titulo y texto) ====================
app.post('/api/admin/historia', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const { titulo, texto } = req.body || {};
  cfg.historia = limpiarHistoria({
    titulo: titulo !== undefined ? titulo : cfg.historia.titulo,
    texto: texto !== undefined ? texto : cfg.historia.texto
  });
  writeSiteConfig(cfg);
  res.json({ ok: true, historia: cfg.historia });
});

// ==================== TEXTOS FIJOS DEL SITIO ====================
// Acepta solo las claves que lleguen: las demas quedan como estaban. Un texto vacio vuelve al de siempre.
app.post('/api/admin/textos-sitio', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  const nuevo = Object.assign({}, cfg.textosSitio);
  for (const k of Object.keys(TEXTOS_SITIO_DEF)) if (b[k] !== undefined) nuevo[k] = b[k];
  cfg.textosSitio = limpiarTextosSitio(nuevo);
  writeSiteConfig(cfg);
  res.json({ ok: true, textosSitio: cfg.textosSitio });
});

// ==================== PALETA DE COLORES ====================
app.post('/api/admin/paleta', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  cfg.paleta = limpiarPaleta(Object.assign({}, cfg.paleta, b));
  writeSiteConfig(cfg);
  res.json({ ok: true, paleta: cfg.paleta });
});

// ==================== REGALOS ====================
app.post('/api/admin/regalos', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const { textoIntro, mensajeOculto } = req.body || {};
  cfg.regalos = { textoIntro: textoMultilinea(textoIntro, 300), mensajeOculto: textoMultilinea(mensajeOculto, 500) };   // con Enter: se ven como renglones en el sitio
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== TEXTOS DE RSVP ====================
app.post('/api/admin/rsvp-textos', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const { titulo, descripcion } = req.body || {};
  cfg.rsvpTextos = { titulo: String(titulo || '').slice(0, 150), descripcion: String(descripcion || '').slice(0, 300) };
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== GALERIA (habilitar subida) ====================
app.post('/api/admin/galeria', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const { subidaHabilitada, mensajeDeshabilitado, titulo, subtitulo } = req.body || {};
  cfg.galeria = limpiarGaleria({
    subidaHabilitada: !!subidaHabilitada,
    mensajeDeshabilitado: String(mensajeDeshabilitado || cfg.galeria.mensajeDeshabilitado),
    titulo: titulo !== undefined ? titulo : cfg.galeria.titulo,
    subtitulo: subtitulo !== undefined ? subtitulo : cfg.galeria.subtitulo
  });
  writeSiteConfig(cfg);
  res.json({ ok: true, galeria: cfg.galeria });
});

// ==================== SECCIONES (orden, encendido, cabezales) ====================
app.post('/api/admin/secciones', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const lista = (req.body && req.body.secciones) || [];
  lista.forEach((s, i) => {
    if (SECCIONES_DISPONIBLES.includes(s.id)) {
      cfg.secciones[s.id].habilitado = !!s.habilitado;
      cfg.secciones[s.id].orden = i + 1;
    }
  });
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

const uploaderCabezal = crearUploaderImagen(CABEZALES_DIR, 'cabezal', 8);
app.post('/api/admin/cabezal/:seccion', checkAdmin, (req, res) => {
  if (!SECCIONES_DISPONIBLES.includes(req.params.seccion)) return res.status(400).json({ error: 'Sección inválida' });
  uploaderCabezal.single('imagen')(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });
    const cfg = readSiteConfig();
    const anterior = cfg.secciones[req.params.seccion].cabezal;
    if (anterior) { try { fs.unlinkSync(path.join(CABEZALES_DIR, anterior)); } catch (e) {} }
    cfg.secciones[req.params.seccion].cabezal = req.file.filename;
    writeSiteConfig(cfg);
    res.json({ ok: true, url: urlMedia('cabezales/', req.file.filename) });
  });
});
app.delete('/api/admin/cabezal/:seccion', checkAdmin, (req, res) => {
  if (!SECCIONES_DISPONIBLES.includes(req.params.seccion)) return res.status(400).json({ error: 'Sección inválida' });
  const cfg = readSiteConfig();
  const anterior = cfg.secciones[req.params.seccion].cabezal;
  if (anterior) { try { fs.unlinkSync(path.join(CABEZALES_DIR, anterior)); } catch (e) {} }
  cfg.secciones[req.params.seccion].cabezal = null;
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== TESTIGOS ====================
app.post('/api/admin/testigos', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const lista = (req.body && req.body.testigos) || [];
  for (let i = 0; i < 4; i++) {
    if (lista[i]) {
      cfg.testigos[i].nombre = String(lista[i].nombre || '').slice(0, 100);
      cfg.testigos[i].rol = String(lista[i].rol || '').slice(0, 80);
    }
  }
  writeSiteConfig(cfg);
  res.json({ ok: true });
});
const uploaderTestigo = crearUploaderImagen(TESTIGOS_DIR, 'testigo', 8);
app.post('/api/admin/testigos/:indice/foto', checkAdmin, (req, res) => {
  const i = parseInt(req.params.indice, 10);
  if (isNaN(i) || i < 0 || i > 3) return res.status(400).json({ error: 'Índice inválido' });
  uploaderTestigo.single('foto')(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });
    const cfg = readSiteConfig();
    if (cfg.testigos[i].foto) { try { fs.unlinkSync(path.join(TESTIGOS_DIR, cfg.testigos[i].foto)); } catch (e) {} }
    cfg.testigos[i].foto = req.file.filename;
    writeSiteConfig(cfg);
    res.json({ ok: true, url: urlMedia('testigos/', req.file.filename) });
  });
});
app.delete('/api/admin/testigos/:indice/foto', checkAdmin, (req, res) => {
  const i = parseInt(req.params.indice, 10);
  if (isNaN(i) || i < 0 || i > 3) return res.status(400).json({ error: 'Índice inválido' });
  const cfg = readSiteConfig();
  if (cfg.testigos[i].foto) { try { fs.unlinkSync(path.join(TESTIGOS_DIR, cfg.testigos[i].foto)); } catch (e) {} }
  cfg.testigos[i].foto = null;
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== GRUPOS + QR ====================
app.get('/api/admin/grupos', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const rsvps = readJSON(RSVP_FILE);
  const grupos = (cfg.grupos || []).map(g => {
    const confirmados = rsvps.filter(r => r.grupoCodigo === g.codigo && r.asistencia === 'si')
      .reduce((acc, r) => acc + 1 + (r.acompanantes || 0), 0);
    return { ...g, confirmados, respuestas: rsvps.filter(r => r.grupoCodigo === g.codigo).length };
  });
  res.json(grupos);
});
app.post('/api/admin/grupos', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  cfg.grupos = cfg.grupos || [];
  const nombre = String((req.body && req.body.nombre) || '').slice(0, 100);
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre del grupo' });
  const invitados = Array.isArray(req.body.invitados) ? req.body.invitados : [];
  const grupo = {
    codigo: generarCodigoGrupo(cfg.grupos), nombre, creado: new Date().toISOString(),
    limite: Math.max(0, parseInt(req.body.limite, 10) || 0),
    invitados: invitados.map(n => String(n).slice(0, 100)).slice(0, 50)
  };
  cfg.grupos.push(grupo);
  writeSiteConfig(cfg);
  res.json({ ok: true, grupo });
});
app.put('/api/admin/grupos/:codigo', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const g = (cfg.grupos || []).find(gr => gr.codigo === req.params.codigo);
  if (!g) return res.status(404).json({ error: 'No encontrado' });
  if (req.body.nombre !== undefined) g.nombre = String(req.body.nombre).slice(0, 100);
  if (req.body.limite !== undefined) g.limite = Math.max(0, parseInt(req.body.limite, 10) || 0);
  if (Array.isArray(req.body.invitados)) g.invitados = req.body.invitados.map(n => String(n).slice(0, 100)).slice(0, 50);
  writeSiteConfig(cfg);
  res.json({ ok: true, grupo: g });
});
app.delete('/api/admin/grupos/:codigo', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  cfg.grupos = (cfg.grupos || []).filter(g => g.codigo !== req.params.codigo);
  writeSiteConfig(cfg);
  res.json({ ok: true });
});
app.get('/api/admin/grupos/:codigo/qr.png', checkAdmin, async (req, res) => {
  const cfg = readSiteConfig();
  const grupo = (cfg.grupos || []).find(g => g.codigo === req.params.codigo);
  if (!grupo) return res.status(404).send('No encontrado');
  const base = cfg.urlPublica || (req.protocol + '://' + req.get('host'));
  const url = base + '/?grupo=' + grupo.codigo;
  try {
    const buffer = await QRCode.toBuffer(url, { width: 500, margin: 2 });
    res.type('png').send(buffer);
  } catch (e) { res.status(500).send('No se pudo generar el QR'); }
});

// ==================== FOTOS QUE SALEN DEL SOBRE ====================
// Se guardan hasta 12; en el sitio se muestran las primeras N (N = "sobreFotosCantidad", de 0 a 8) en el orden elegido.
const uploaderSobreFotos = crearUploaderImagen(SOBRE_FOTOS_DIR, 'sobrefoto', 10);
app.get('/api/admin/sobre-fotos', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  res.json({
    cantidad: cfg.sobreFotosCantidad, maximo: MAX_SOBRE_FOTOS, altura: cfg.sobreFotosAltura,
    fotos: cfg.sobreFotos.map(f => { const p = cfg.sobreFotosPos[f] || { x: 50, y: 50, d: 0 }; return { archivo: f, url: '/media/sobre/' + f, x: p.x, y: p.y, d: p.d }; })
  });
});
app.post('/api/admin/sobre-fotos', checkAdmin, (req, res) => {
  uploaderSobreFotos.array('fotos', MAX_SOBRE_FOTOS)(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    const cfg = readSiteConfig();
    let agregadas = 0, descartadas = 0;
    (req.files || []).forEach(f => {
      if (cfg.sobreFotos.length < MAX_SOBRE_FOTOS) { cfg.sobreFotos.push(f.filename); agregadas++; }
      else { descartadas++; try { fs.unlinkSync(path.join(SOBRE_FOTOS_DIR, f.filename)); } catch (e) {} }
    });
    writeSiteConfig(cfg);
    res.json({ ok: true, agregadas, descartadas, total: cfg.sobreFotos.length });
  });
});
app.post('/api/admin/sobre-fotos/orden', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const pedido = Array.isArray(req.body && req.body.orden) ? req.body.orden.map(String) : [];
  const nuevo = pedido.filter((f, i) => cfg.sobreFotos.includes(f) && pedido.indexOf(f) === i);
  cfg.sobreFotos.forEach(f => { if (!nuevo.includes(f)) nuevo.push(f); });
  cfg.sobreFotos = nuevo;
  writeSiteConfig(cfg);
  res.json({ ok: true });
});
// Encuadre de una foto: que parte se ve dentro del marco (x e y de 0 a 100; 50/50 = centrada) y, aparte, "d": cuanto se sube (negativo) o baja (positivo) la foto
// mas alla de su borde, en % del alto del marco (de -70 a 70; 0 = sin correr). Mandar solo un dato no toca los otros.
app.post('/api/admin/sobre-fotos/posicion', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  const archivo = typeof b.archivo === 'string' ? b.archivo : '';
  if (!cfg.sobreFotos.includes(archivo)) return res.status(404).json({ error: 'No encontrada' });
  const actual = cfg.sobreFotosPos[archivo] || { x: 50, y: 50, d: 0 };
  cfg.sobreFotosPos[archivo] = {
    x: b.x === undefined ? actual.x : limpiarPorcentaje(b.x, actual.x),
    y: b.y === undefined ? actual.y : limpiarPorcentaje(b.y, actual.y),
    d: b.d === undefined ? actual.d : limpiarDesplazamiento(b.d, actual.d)
  };
  cfg.sobreFotosPos = limpiarSobreFotosPos(cfg.sobreFotosPos, cfg.sobreFotos);
  writeSiteConfig(cfg);
  const p = cfg.sobreFotosPos[archivo] || { x: 50, y: 50, d: 0 };
  res.json({ ok: true, archivo, x: p.x, y: p.y, d: p.d });
});
app.delete('/api/admin/sobre-fotos/:archivo', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const idx = cfg.sobreFotos.indexOf(req.params.archivo);
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  cfg.sobreFotos.splice(idx, 1);
  delete cfg.sobreFotosPos[req.params.archivo];
  writeSiteConfig(cfg);
  try { fs.unlinkSync(path.join(SOBRE_FOTOS_DIR, req.params.archivo)); } catch (e) {}
  res.json({ ok: true });
});

// ==================== FONDO DE LA PAGINA ====================
const uploaderFondo = crearUploaderImagen(UPLOADS_DIR, 'fondo', 15);
// Modo del fondo (tema / foto / color liso), color, textura e intensidad
app.post('/api/admin/fondo-estilo', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  cfg.fondoEstilo = limpiarFondoEstilo(Object.assign({}, cfg.fondoEstilo, b), !!cfg.fondo);
  writeSiteConfig(cfg);
  res.json({ ok: true, fondoEstilo: cfg.fondoEstilo });
});
// Color y textura del sobre (parche: lo que no llega queda como estaba; color vacio = el crema de siempre)
app.post('/api/admin/sobre-estilo', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  cfg.sobreEstilo = limpiarSobreEstilo(Object.assign({}, cfg.sobreEstilo, b));
  writeSiteConfig(cfg);
  res.json({ ok: true, sobreEstilo: cfg.sobreEstilo });
});
app.post('/api/admin/fondo', checkAdmin, (req, res) => {
  uploaderFondo.single('fondo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });
    const cfg = readSiteConfig();
    if (cfg.fondo) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.fondo)); } catch (e) {} }
    cfg.fondo = req.file.filename;
    cfg.fondoEstilo = limpiarFondoEstilo(Object.assign({}, cfg.fondoEstilo, { modo: 'foto' }), true);   // al subir una foto se usa esa foto
    writeSiteConfig(cfg);
    res.json({ ok: true, fondoUrl: '/media/' + cfg.fondo });
  });
});
app.delete('/api/admin/fondo', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  if (cfg.fondo) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.fondo)); } catch (e) {} }
  cfg.fondo = null;
  cfg.fondoEstilo = limpiarFondoEstilo(cfg.fondoEstilo, false);                                          // sin foto, vuelve al color del estilo
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== TEXTURA DEL SOBRE ====================
const uploaderSobre = crearUploaderImagen(UPLOADS_DIR, 'sobre', 10);
app.post('/api/admin/sobre-textura', checkAdmin, (req, res) => {
  uploaderSobre.single('imagen')(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });
    const cfg = readSiteConfig();
    if (cfg.sobreTextura) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.sobreTextura)); } catch (e) {} }
    cfg.sobreTextura = req.file.filename;
    writeSiteConfig(cfg);
    res.json({ ok: true, url: '/media/' + cfg.sobreTextura });
  });
});
app.delete('/api/admin/sobre-textura', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  if (cfg.sobreTextura) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.sobreTextura)); } catch (e) {} }
  cfg.sobreTextura = null;
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== BANNER ====================
const uploaderBanner = crearUploaderImagen(UPLOADS_DIR, 'banner', 15);
app.post('/api/admin/banner', checkAdmin, (req, res) => {
  uploaderBanner.single('banner')(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });
    const cfg = readSiteConfig();
    if (cfg.banner) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.banner)); } catch (e) {} }
    cfg.banner = req.file.filename;
    cfg.bannerPosicion = { x: 50, y: 50 };
    writeSiteConfig(cfg);
    res.json({ ok: true, bannerUrl: '/media/' + cfg.banner });
  });
});
app.delete('/api/admin/banner', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  if (cfg.banner) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.banner)); } catch (e) {} }
  cfg.banner = null;
  writeSiteConfig(cfg);
  res.json({ ok: true });
});
app.post('/api/admin/banner-posicion', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const x = parseFloat(req.body.x), y = parseFloat(req.body.y);
  cfg.bannerPosicion = { x: isNaN(x) ? 50 : Math.max(0, Math.min(100, x)), y: isNaN(y) ? 50 : Math.max(0, Math.min(100, y)) };
  writeSiteConfig(cfg);
  res.json({ ok: true, bannerPosicion: cfg.bannerPosicion });
});

// ==================== MUSICA ====================
const uploadMusica = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, 'musica-' + Date.now() + '-' + sufijoAleatorio() + (extensionSegura(file, ['audio']) || '.mp3'))
  }),
  limits: { fileSize: 20 * 1024 * 1024, files: 1, fields: 10, fieldSize: 10 * 1024 },
  fileFilter: (req, file, cb) => extensionSegura(file, ['audio']) ? cb(null, true) : cb(new Error('Solo se permiten archivos de audio (MP3, M4A, AAC, OGG, WAV, FLAC)'))
});
app.post('/api/admin/musica', checkAdmin, (req, res) => {
  uploadMusica.single('musica')(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' });
    const cfg = readSiteConfig();
    if (cfg.musica) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.musica)); } catch (e) {} }
    cfg.musica = req.file.filename;
    writeSiteConfig(cfg);
    res.json({ ok: true, musicaUrl: '/media/' + cfg.musica });
  });
});
app.delete('/api/admin/musica', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  if (cfg.musica) { try { fs.unlinkSync(path.join(UPLOADS_DIR, cfg.musica)); } catch (e) {} }
  cfg.musica = null;
  writeSiteConfig(cfg);
  res.json({ ok: true });
});

// ==================== PRUEBA DE SUBIDA (diagnostico del error 413) ====================
// Recibe (y descarta) un cuerpo de hasta 80 MB y dice cuantos bytes llegaron. El panel lo usa para medir cuantos MB deja pasar la
// conexion actual (internet -> proxy -> add-on): si por internet falla y por la red local no, el limite lo pone el proxy, no el add-on.
app.post('/api/admin/prueba-subida', checkAdmin, (req, res) => {
  const MAX = 80 * 1024 * 1024;
  let bytes = 0, respondido = false;
  const responder = (codigo, obj) => { if (!respondido) { respondido = true; res.status(codigo).json(obj); } };
  req.on('data', (c) => { bytes += c.length; });
  req.on('end', () => (bytes > MAX ? responder(413, { error: 'La prueba es más grande de lo permitido' }) : responder(200, { ok: true, bytes })));
  req.on('error', () => responder(400, { error: 'La subida se interrumpió' }));
  req.on('aborted', () => { respondido = true; });
});

// ==================== FOTOS DE LA PAREJA (slideshow) ====================
const uploadFotosPareja = crearUploaderImagen(PAREJA_DIR, 'pareja', 15);
app.post('/api/admin/fotos-pareja', checkAdmin, (req, res) => {
  uploadFotosPareja.array('fotos', 30)(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    const cfg = readSiteConfig();
    (req.files || []).forEach(f => cfg.fotosPareja.push(f.filename));
    writeSiteConfig(cfg);
    res.json({ ok: true, cantidad: (req.files || []).length });
  });
});
app.delete('/api/admin/fotos-pareja/:archivo', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const idx = cfg.fotosPareja.indexOf(req.params.archivo);
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  cfg.fotosPareja.splice(idx, 1);
  writeSiteConfig(cfg);
  try { fs.unlinkSync(path.join(PAREJA_DIR, req.params.archivo)); } catch (e) {}
  res.json({ ok: true });
});

// ==================== RSVP ====================
const MAX_RSVPS = 5000, MAX_ACOMPANANTES = 20;
app.post('/api/rsvp', limitar('rsvp', 60, 60 * 60 * 1000), (req, res) => {
  const { nombre, asistencia, acompanantes, personas, mensaje, grupo } = req.body || {};
  const nombreLimpio = String(nombre || '').trim().slice(0, 100);
  const asistenciaLimpia = String(asistencia || '').trim().toLowerCase();
  if (!nombreLimpio || !asistenciaLimpia) return res.status(400).json({ error: 'Faltan datos (nombre y asistencia son obligatorios)' });
  if (!['si', 'no'].includes(asistenciaLimpia)) return res.status(400).json({ error: 'La asistencia debe ser "sí" o "no"' });
  const cfg = readSiteConfig();
  // El formulario manda "personas" = cantidad total contando al invitado (minimo 1). Internamente se guarda como
  // "acompanantes" (personas - 1) para no romper las confirmaciones viejas, los grupos, las estadisticas ni las exportaciones.
  let acompLimpios;
  if (personas !== undefined && personas !== null && personas !== '') {
    const n = parseInt(personas, 10);
    if (!Number.isFinite(n) || n < 1) return res.status(400).json({ error: 'La cantidad de personas debe ser al menos 1 (contándote a vos)' });
    acompLimpios = Math.min(MAX_ACOMPANANTES, n - 1);
  } else {
    acompLimpios = Math.min(MAX_ACOMPANANTES, Math.max(0, parseInt(acompanantes, 10) || 0));
  }
  const cantidadNueva = 1 + acompLimpios;
  const grupoEncontrado = (grupo && typeof grupo === 'string') ? (cfg.grupos || []).find(g => g.codigo === grupo) : null;
  const rsvps = readJSON(RSVP_FILE);
  if (rsvps.length >= MAX_RSVPS) return res.status(429).json({ error: 'Se alcanzó el máximo de confirmaciones. Contactá directamente a los novios.' });

  if (grupoEncontrado && grupoEncontrado.limite > 0 && asistenciaLimpia === 'si') {
    const yaConfirmados = rsvps.filter(r => r.grupoCodigo === grupoEncontrado.codigo && r.asistencia === 'si')
      .reduce((acc, r) => acc + 1 + (r.acompanantes || 0), 0);
    if (yaConfirmados + cantidadNueva > grupoEncontrado.limite) {
      return res.status(400).json({ error: 'Se alcanzó el límite de invitados asignado a este grupo. Por favor contactate directamente con los novios.' });
    }
  }

  rsvps.push({
    id: Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex'),
    nombre: nombreLimpio,
    asistencia: asistenciaLimpia,
    acompanantes: acompLimpios,
    mensaje: String(mensaje || '').slice(0, 500),
    grupoCodigo: grupoEncontrado ? grupoEncontrado.codigo : null,
    grupoNombre: grupoEncontrado ? grupoEncontrado.nombre : null,
    fecha: new Date().toISOString()
  });
  writeJSON(RSVP_FILE, rsvps);
  res.json({ ok: true });
  homeAssistant.evento({
    evento: 'confirmacion', nombre: nombreLimpio, asiste: asistenciaLimpia === 'si', personas: cantidadNueva,
    mensaje: String(mensaje || ''), grupo: grupoEncontrado ? grupoEncontrado.nombre : ''
  });
});
// Las confirmaciones viejas (versiones anteriores) pueden no tener id: se les asigna una para poder borrarlas una por una.
function leerRsvpsConId() {
  const lista = readJSON(RSVP_FILE);
  if (Array.isArray(lista) && lista.some(r => r && !r.id)) {
    lista.forEach((r, i) => { if (r && !r.id) r.id = 'v' + Date.now().toString(36) + i + '-' + crypto.randomBytes(2).toString('hex'); });
    writeJSON(RSVP_FILE, lista);
  }
  return Array.isArray(lista) ? lista : [];
}
app.get('/api/rsvps', checkAdmin, (req, res) => res.json(leerRsvpsConId()));

// --- Borrar confirmaciones (para limpiar pruebas) ---
// Se guarda una copia de lo ultimo que se borro para poder deshacerlo (una sola vez, se pisa con el siguiente borrado).
const RSVP_ULTIMO_BORRADO_FILE = path.join(DATA_DIR, 'rsvps-ultimo-borrado.json');
const CONFIRMAR_BORRAR_TODAS = 'BORRAR';
app.post('/api/admin/rsvps/borrar', checkAdmin, (req, res) => {
  const body = req.body || {};
  const rsvps = leerRsvpsConId();
  let aBorrar;
  if (body.todas === true) {
    if (String(body.confirmar || '').trim().toUpperCase() !== CONFIRMAR_BORRAR_TODAS) {
      return res.status(400).json({ error: 'Para borrar todas hay que escribir ' + CONFIRMAR_BORRAR_TODAS + ' como confirmación.' });
    }
    aBorrar = rsvps.slice();
  } else if (Array.isArray(body.ids)) {
    const ids = new Set(body.ids.filter(i => typeof i === 'string' && i.length <= 64).slice(0, MAX_RSVPS));
    if (!ids.size) return res.status(400).json({ error: 'No se indicó qué confirmaciones borrar.' });
    aBorrar = rsvps.filter(r => ids.has(r.id));
  } else {
    return res.status(400).json({ error: 'Pedido inválido.' });
  }
  if (!aBorrar.length) return res.json({ ok: true, borradas: 0, quedan: rsvps.length });
  const borrar = new Set(aBorrar.map(r => r.id));
  const restantes = rsvps.filter(r => !borrar.has(r.id));
  // Primero el respaldo y despues el borrado: si algo falla no se pierde nada.
  writeJSON(RSVP_ULTIMO_BORRADO_FILE, { fecha: new Date().toISOString(), rsvps: aBorrar });
  writeJSON(RSVP_FILE, restantes);
  res.json({ ok: true, borradas: aBorrar.length, quedan: restantes.length, puedeDeshacer: true });
});
app.get('/api/admin/rsvps/ultimo-borrado', checkAdmin, (req, res) => {
  const b = readJSON(RSVP_ULTIMO_BORRADO_FILE);
  const lista = b && Array.isArray(b.rsvps) ? b.rsvps : [];
  res.json({ cantidad: lista.length, fecha: lista.length ? b.fecha : null });
});
app.post('/api/admin/rsvps/deshacer', checkAdmin, (req, res) => {
  const b = readJSON(RSVP_ULTIMO_BORRADO_FILE);
  const lista = b && Array.isArray(b.rsvps) ? b.rsvps : [];
  if (!lista.length) return res.status(404).json({ error: 'No hay nada para recuperar.' });
  const rsvps = readJSON(RSVP_FILE);
  const existentes = new Set(rsvps.map(r => r.id));
  const recuperar = lista.filter(r => r && r.id && !existentes.has(r.id));
  const todas = rsvps.concat(recuperar).sort((x, y) => String(x.fecha || '').localeCompare(String(y.fecha || '')));
  writeJSON(RSVP_FILE, todas);
  try { fs.unlinkSync(RSVP_ULTIMO_BORRADO_FILE); } catch (e) {}
  res.json({ ok: true, recuperadas: recuperar.length, total: todas.length });
});

// ==================== FOTOS Y VIDEOS DE INVITADOS (galeria compartida) ====================
const uploadFotosInvitados = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, dirFotosActual()),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + sufijoAleatorio() + (extensionSegura(file, ['image', 'video']) || '.jpg'))
  }),
  limits: { fileSize: 500 * 1024 * 1024, files: 10, fields: 10, fieldSize: 10 * 1024 },
  fileFilter: (req, file, cb) => extensionSegura(file, ['image', 'video']) ? cb(null, true) : cb(new Error('Solo se permiten imágenes o videos (JPG, PNG, HEIC, MP4, MOV…)'))
});
// Reserva de espacio: nunca se llena el disco del NUC (Home Assistant comparte disco con /media y se rompe si se queda sin lugar).
const ESPACIO_MINIMO_LIBRE = 2 * 1024 * 1024 * 1024;
function hayEspacioParaSubir(req) {
  const { libre } = espacioDe(dirFotosActual());
  if (libre === null) return true;
  return libre - (parseInt(req.headers['content-length'], 10) || 0) > ESPACIO_MINIMO_LIBRE;
}
// Un pedido por archivo (la galeria sube de a uno). El limite es por IP y en un salon todos comparten la misma IP publica del wifi.
app.post('/api/photos', limitar('subida', 4000, 60 * 60 * 1000), (req, res) => {
  const cfg = readSiteConfig();
  if (!cfg.galeria.subidaHabilitada) return res.status(403).json({ error: 'La subida de fotos todavía no está habilitada' });
  if (!hayEspacioParaSubir(req)) return res.status(507).json({ error: 'El servidor se quedó sin espacio para más fotos y videos. Avisales a los novios.' });
  uploadFotosInvitados.array('fotos', 10)(req, res, (err) => {
    if (err) return res.status(400).json({ error: mensajeErrorSubida(err) });
    const subidoPor = String((req.body && req.body.subido_por) || 'Invitado').slice(0, 100);
    const vid = soloId((req.body && req.body.vid) || '');
    const meta = readJSON(PHOTOS_META_FILE);
    (req.files || []).forEach(f => meta.push({
      archivo: f.filename, subidoPor, vid, fecha: new Date().toISOString(),
      tipo: /^video\//.test(f.mimetype) ? 'video' : 'imagen'
    }));
    writeJSON(PHOTOS_META_FILE, meta);
    res.json({ ok: true, cantidad: (req.files || []).length });
    const videos = (req.files || []).filter(f => /^video\//.test(f.mimetype)).length;
    const fotos = (req.files || []).length - videos;
    if (fotos + videos > 0) homeAssistant.evento({ evento: 'subida', nombre: subidoPor, fotos, videos });
  });
});
// Cada invitado ve solo lo que el mismo subio desde su navegador/dispositivo (identificado por "vid").
// Los novios/admin (con la contraseña) ven la galeria completa. Las fotos subidas antes de esta funcion
// (sin "vid" guardado) solo las ve el admin, para no exponerlas a un invitado al azar.
app.get('/api/photos', (req, res) => {
  const todas = readJSON(PHOTOS_META_FILE).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (esAdmin(req)) return res.json(todas.map(m => Object.assign({}, m, { bytes: tamanoFotoGuardada(m.archivo) })));   // el panel muestra cuanto pesa cada una
  const vid = soloId(req.query.vid || '');
  res.json(vid ? todas.filter(m => m.vid && m.vid === vid) : []);
});
app.delete('/api/photos/:archivo', soloRedLocal, checkAdmin, (req, res) => {
  const meta = readJSON(PHOTOS_META_FILE);
  const idx = meta.findIndex(m => m.archivo === req.params.archivo);
  if (idx === -1) return res.status(404).json({ error: 'No encontrada' });
  const [removida] = meta.splice(idx, 1);
  writeJSON(PHOTOS_META_FILE, meta);
  [dirFotosActual(), PHOTOS_DIR].forEach(d => { try { fs.unlinkSync(path.join(d, removida.archivo)); } catch (e) {} });
  res.json({ ok: true });
});

// Borrar varias a la vez (las que se tildaron en el panel). Mismo criterio que borrar una: sale de la lista y se borra el archivo; no se puede deshacer.
// Solo cuentan los nombres que estan en la lista guardada, y el archivo se borra unicamente si su nombre es un nombre simple (nunca una ruta).
app.post('/api/admin/fotos/borrar', checkAdmin, (req, res) => {
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  const pedidos = new Set((Array.isArray(b.archivos) ? b.archivos : []).filter(a => typeof a === 'string' && a).slice(0, 20000));
  if (!pedidos.size) return res.status(400).json({ error: 'Elegí al menos un archivo para borrar.' });
  const meta = readJSON(PHOTOS_META_FILE);
  const quedan = [], borrar = [];
  for (const m of meta) { if (m && typeof m.archivo === 'string' && pedidos.has(m.archivo)) borrar.push(m); else quedan.push(m); }
  if (borrar.length) {
    writeJSON(PHOTOS_META_FILE, quedan);
    const dirs = [dirFotosActual(), PHOTOS_DIR];
    for (const m of borrar) {
      if (m.archivo !== path.basename(m.archivo)) continue;
      dirs.forEach(d => { try { fs.unlinkSync(path.join(d, m.archivo)); } catch (e) {} });
    }
  }
  res.json({ ok: true, borradas: borrar.length, noEncontradas: pedidos.size - borrar.length });
});

// ==================== ADMIN: DESCARGAR LO QUE SUBIERON LOS INVITADOS (originales, sin perder calidad) ====================
// El sitio sube cada foto o video tal cual lo eligio el invitado (no se achica ni se vuelve a codificar) y el servidor lo guarda sin tocarlo:
// descargarlo es copiar exactamente los mismos bytes. Una sola foto se baja directo desde el panel; varias, o todas, en un ZIP SIN comprimir
// (metodo "stored": no cambia ni un byte y no gasta procesador), armado al vuelo y enviado en partes, sin pasar por la memoria ni por el disco.
// El navegador no puede mandar la contrasena en un enlace (solo se acepta por cabecera), asi que el panel pide primero un "pase" de descarga:
// un codigo al azar de un solo archivo, que sirve unos minutos y unas pocas veces, y no abre nada mas.
function rutaFotoGuardada(archivo) {
  if (typeof archivo !== 'string' || !archivo || archivo !== path.basename(archivo)) return null;
  for (const d of [dirFotosActual(), PHOTOS_DIR]) {                       // tambien las subidas antes de conectar un disco
    const r = path.join(d, archivo);
    try { if (fs.statSync(r).isFile()) return r; } catch (e) {}
  }
  return null;
}
function tamanoFotoGuardada(archivo) { const r = rutaFotoGuardada(archivo); try { return r ? fs.statSync(r).size : null; } catch (e) { return null; } }
// Nombre apto para cualquier sistema (Windows incluido): sin barras ni signos prohibidos, sin puntos o espacios en las puntas, y sin nombres reservados
function nombreSeguroArchivo(s, def, largo) {
  s = String(s == null ? '' : s).normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').replace(/^[\s.]+|[\s.]+$/g, '').slice(0, largo || 60).trim();
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(s)) s = '_' + s;
  return s || def;
}
const CRC_TABLA = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf, previo) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf, previo || 0);
  let c = ((previo || 0) ^ 0xFFFFFFFF) >>> 0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLA[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
// ZIP "stored" en flujo. entradas: [{ ruta, nombre, fecha }]. Cada archivo lleva su CRC al final (descriptor de datos), asi no hay que leerlo dos veces.
// Pasa a ZIP64 solo cuando hace falta (mas de 65535 archivos o un ZIP de mas de 4 GB); los umbrales se pueden bajar para probarlo.
async function* generarZip(entradas, opc) {
  const U32 = (opc && opc.umbral32) || 0xFFFFFFFF, UENT = (opc && opc.umbralEntradas) || 0xFFFF;
  let pos = 0;
  const emitir = (b) => { pos += b.length; return b; };
  const central = [];
  for (const e of entradas) {
    let fh;
    try { fh = await fs.promises.open(e.ruta, 'r'); } catch (err) { continue; }       // si el archivo ya no esta, se saltea
    let st; try { st = await fh.stat(); } catch (err) { await fh.close().catch(() => {}); continue; }
    if (!st.isFile() || st.size >= 0xFFFFFFFF) { await fh.close().catch(() => {}); continue; }
    const f = new Date(e.fecha); const fecha = isNaN(f) ? new Date(st.mtimeMs) : f;
    const y = Math.min(2107, Math.max(1980, fecha.getUTCFullYear()));
    const dosHora = (fecha.getUTCHours() << 11) | (fecha.getUTCMinutes() << 5) | (fecha.getUTCSeconds() >> 1);
    const dosFecha = ((y - 1980) << 9) | ((fecha.getUTCMonth() + 1) << 5) | fecha.getUTCDate();
    const nombre = Buffer.from(e.nombre, 'utf8');
    const ut = Buffer.alloc(9); ut.writeUInt16LE(0x5455, 0); ut.writeUInt16LE(5, 2); ut[4] = 1; ut.writeUInt32LE(Math.floor(fecha.getTime() / 1000) >>> 0, 5);   // hora exacta (UTC) para quien la lea
    const lh = Buffer.alloc(30 + nombre.length + ut.length);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0808, 6); lh.writeUInt16LE(0, 8);       // 0x0800 = nombres en UTF-8, 0x0008 = CRC y tamanos al final
    lh.writeUInt16LE(dosHora, 10); lh.writeUInt16LE(dosFecha, 12); lh.writeUInt16LE(nombre.length, 26); lh.writeUInt16LE(ut.length, 28);
    nombre.copy(lh, 30); ut.copy(lh, 30 + nombre.length);
    const offset = pos;
    yield emitir(lh);
    let crc = 0, tam = 0;
    try {
      for await (const trozo of fh.createReadStream({ highWaterMark: 256 * 1024 })) { crc = crc32(trozo, crc); tam += trozo.length; yield emitir(trozo); }
    } finally { await fh.close().catch(() => {}); }
    const dd = Buffer.alloc(16); dd.writeUInt32LE(0x08074b50, 0); dd.writeUInt32LE(crc >>> 0, 4); dd.writeUInt32LE(tam, 8); dd.writeUInt32LE(tam, 12);
    yield emitir(dd);
    central.push({ nombre, ut, offset, crc: crc >>> 0, tam, dosHora, dosFecha });
  }
  const cdInicio = pos;
  for (const c of central) {
    const z64 = c.offset >= U32;
    const extra64 = Buffer.alloc(z64 ? 12 : 0);
    if (z64) { extra64.writeUInt16LE(0x0001, 0); extra64.writeUInt16LE(8, 2); extra64.writeBigUInt64LE(BigInt(c.offset), 4); }
    const b = Buffer.alloc(46 + c.nombre.length + c.ut.length + extra64.length);
    b.writeUInt32LE(0x02014b50, 0); b.writeUInt16LE((3 << 8) | 45, 4); b.writeUInt16LE(z64 ? 45 : 20, 6); b.writeUInt16LE(0x0808, 8); b.writeUInt16LE(0, 10);
    b.writeUInt16LE(c.dosHora, 12); b.writeUInt16LE(c.dosFecha, 14); b.writeUInt32LE(c.crc, 16); b.writeUInt32LE(c.tam, 20); b.writeUInt32LE(c.tam, 24);
    b.writeUInt16LE(c.nombre.length, 28); b.writeUInt16LE(c.ut.length + extra64.length, 30);
    b.writeUInt32LE(((0o100644 << 16) >>> 0), 38); b.writeUInt32LE(z64 ? 0xFFFFFFFF : c.offset, 42);
    c.nombre.copy(b, 46); c.ut.copy(b, 46 + c.nombre.length); extra64.copy(b, 46 + c.nombre.length + c.ut.length);
    yield emitir(b);
  }
  const cdTam = pos - cdInicio;
  const z64fin = central.length >= UENT || cdInicio >= U32 || cdTam >= U32;
  if (z64fin) {
    const r = Buffer.alloc(56 + 20);
    r.writeUInt32LE(0x06064b50, 0); r.writeBigUInt64LE(44n, 4); r.writeUInt16LE((3 << 8) | 45, 12); r.writeUInt16LE(45, 14);
    r.writeBigUInt64LE(BigInt(central.length), 24); r.writeBigUInt64LE(BigInt(central.length), 32); r.writeBigUInt64LE(BigInt(cdTam), 40); r.writeBigUInt64LE(BigInt(cdInicio), 48);
    r.writeUInt32LE(0x07064b50, 56); r.writeBigUInt64LE(BigInt(pos), 64); r.writeUInt32LE(1, 72);     // localizador: donde empieza el registro ZIP64 de arriba
    yield emitir(r);
  }
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(z64fin ? 0xFFFF : central.length, 8); fin.writeUInt16LE(z64fin ? 0xFFFF : central.length, 10);
  fin.writeUInt32LE(z64fin ? 0xFFFFFFFF : cdTam, 12); fin.writeUInt32LE(z64fin ? 0xFFFFFFFF : cdInicio, 16);
  yield emitir(fin);
}

const pasesDescarga = new Map();                    // codigo -> { lista, nombre, vence, usos }
const PASE_VIDA_MS = 5 * 60 * 1000, PASE_USOS_MAX = 3, PASES_MAX = 20;
function limpiarPases() { const t = Date.now(); for (const [k, v] of pasesDescarga) if (t > v.vence) pasesDescarga.delete(k); }
setInterval(limpiarPases, 60 * 1000).unref();

// Paso 1 (con contrasena): se eligen los archivos (o "todo") y se recibe el enlace de descarga
app.post('/api/admin/descargas', checkAdmin, (req, res) => {
  const b = (req.body && typeof req.body === 'object') ? req.body : {};
  const meta = readJSON(PHOTOS_META_FILE).filter(m => m && typeof m === 'object' && typeof m.archivo === 'string');
  let elegidas;
  if (b.todo === true) elegidas = meta;
  else {
    const pedidos = new Set((Array.isArray(b.archivos) ? b.archivos : []).filter(a => typeof a === 'string').slice(0, 20000));
    if (!pedidos.size) return res.status(400).json({ error: 'Elegí al menos un archivo para descargar.' });
    elegidas = meta.filter(m => pedidos.has(m.archivo));                 // solo cuentan los que existen en la lista: lo que llegue de afuera nunca arma una ruta
  }
  const lista = [], usados = new Set(); let bytes = 0;
  for (const m of elegidas) {
    const ruta = rutaFotoGuardada(m.archivo); if (!ruta) continue;
    let tam; try { tam = fs.statSync(ruta).size; } catch (e) { continue; }
    // Una carpeta por invitado (con el nombre que puso al subir); adentro, el nombre unico de cada archivo, que empieza con la fecha y por eso queda en orden
    const carpeta = nombreSeguroArchivo(m.subidoPor, 'Invitado');
    const base = nombreSeguroArchivo(m.archivo, 'archivo', 120);
    let nombre = carpeta + '/' + base;
    for (let i = 2; usados.has(nombre.toLowerCase()); i++) nombre = carpeta + '/' + i + '-' + base;
    usados.add(nombre.toLowerCase());
    lista.push({ ruta, nombre, fecha: m.fecha }); bytes += tam;
  }
  if (!lista.length) return res.status(404).json({ error: 'No se encontraron esos archivos (puede que ya se hayan borrado). Actualizá la lista.' });
  limpiarPases();
  if (pasesDescarga.size >= PASES_MAX) return res.status(429).json({ error: 'Hay demasiadas descargas en curso. Esperá unos minutos.' });
  const codigo = crypto.randomBytes(24).toString('base64url');
  const nombre = 'fotos-invitados-' + new Date().toISOString().slice(0, 10) + '.zip';
  pasesDescarga.set(codigo, { lista, nombre, vence: Date.now() + PASE_VIDA_MS, usos: 0 });
  res.json({ ok: true, url: '/api/admin/descargas/' + codigo, nombre, cantidad: lista.length, bytes, faltan: elegidas.length - lista.length });
});
// Paso 2 (el navegador, sin cabeceras): el codigo hace de contrasena, vale unos minutos y no sirve para nada mas que para este ZIP
app.get('/api/admin/descargas/:codigo', (req, res) => {
  limpiarPases();
  const pase = pasesDescarga.get(String(req.params.codigo));
  if (!pase || Date.now() > pase.vence || pase.usos >= PASE_USOS_MAX) return res.status(404).json({ error: 'Este enlace de descarga venció. Pedí la descarga de nuevo desde el panel.' });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="' + pase.nombre + '"');
  res.setHeader('X-Accel-Buffering', 'no');                               // que un proxy no junte todo el ZIP antes de empezar a enviarlo
  if (req.method === 'HEAD') return res.end();
  pase.usos++;
  pipeline(Readable.from(generarZip(pase.lista)), res, () => {});         // si el navegador cancela, se deja de leer; si un archivo se borro justo, se saltea
});

// ==================== ADMIN: DISCO EXTERNO ====================
function espacioDe(ruta) {
  try { const st = fs.statfsSync(ruta); return { libre: st.bavail * st.bsize, total: st.blocks * st.bsize }; }
  catch (e) { return { libre: null, total: null }; }
}
app.get('/api/admin/almacenamiento', checkAdmin, (req, res) => {
  const info = infoAlmacenamiento();
  const unidades = [];
  try {
    fs.readdirSync(MEDIA_ROOT, { withFileTypes: true }).forEach(d => {
      if (!d.isDirectory() && !d.isSymbolicLink()) return;
      if (d.name === CARPETA_VISIBLE) return; // es nuestra propia carpeta por defecto, no un disco para elegir
      const ruta = path.join(MEDIA_ROOT, d.name);
      unidades.push({ nombre: d.name, ruta, externo: unidadEsExterna(d.name), ...espacioDe(ruta) });
    });
  } catch (e) {}
  res.json({ ...info, ...espacioDe(info.enUso), unidades, mediaDisponible: fs.existsSync(MEDIA_ROOT) });
});
app.post('/api/admin/almacenamiento', checkAdmin, (req, res) => {
  const cfg = readSiteConfig();
  const unidad = String((req.body && req.body.unidad) || '');
  if (!unidad) { cfg.almacenamiento = { ruta: '' }; writeSiteConfig(cfg); return res.json({ ok: true }); }
  if (!/^[\w.\- ]{1,64}$/.test(unidad) || unidad === '.' || unidad === '..') return res.status(400).json({ error: 'Nombre de unidad inválido' });
  if (!unidadEsExterna(unidad)) {
    return res.status(400).json({ error: 'Esa carpeta de /media no es un disco externo montado (es parte del almacenamiento interno). Verificá que el disco esté conectado y montado.' });
  }
  const ruta = path.join(MEDIA_ROOT, unidad, 'boda_fotos');
  try {
    fs.mkdirSync(ruta, { recursive: true });
    const prueba = path.join(ruta, '.prueba-escritura');
    fs.writeFileSync(prueba, 'ok'); fs.unlinkSync(prueba);
  } catch (e) { return res.status(400).json({ error: 'No se pudo escribir en el disco: ' + e.message }); }
  cfg.almacenamiento = { ruta };
  writeSiteConfig(cfg);
  res.json({ ok: true, ruta });
});

// ==================== ESTADISTICAS DE ACCESOS ====================
const TZ_LOCAL = 'America/Montevideo';
function partesLocal(d) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ_LOCAL, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(new Date(d)).reduce((a, x) => { a[x.type] = x.value; return a; }, {});
  const hh = p.hour === '24' ? '00' : p.hour;
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${hh}:${p.minute}:${p.second}` };
}
function cortar(v, n) { return (v === undefined || v === null) ? '' : String(v).slice(0, n); }
function soloId(v) { return cortar(v, 40).replace(/[^\w-]/g, ''); }
function entero(v, min, max) { const n = parseInt(v, 10); return isNaN(n) ? 0 : Math.max(min, Math.min(max, n)); }

function ipCliente(req) {
  let ip = req.ip || (req.socket && req.socket.remoteAddress) || '';
  return String(ip).replace(/^::ffff:/, '');
}
function ipPrivada(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip.startsWith('fe80') || /^f[cd]/i.test(ip)) return true;
  const m = ip.match(/^(\d+)\.(\d+)\./);
  if (!m) return false;
  const a = +m[1], b = +m[2];
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
}

function parsearUA(ua) {
  ua = ua || '';
  const m = (re) => { const r = ua.match(re); return r ? r[1] : ''; };
  let navegador = 'Otro', version = '';
  if (/Edg(e|A|iOS)?\//.test(ua)) { navegador = 'Edge'; version = m(/Edg(?:e|A|iOS)?\/([\d.]+)/); }
  else if (/OPR\/|Opera/.test(ua)) { navegador = 'Opera'; version = m(/OPR\/([\d.]+)/); }
  else if (/SamsungBrowser\//.test(ua)) { navegador = 'Samsung Internet'; version = m(/SamsungBrowser\/([\d.]+)/); }
  else if (/Firefox\/|FxiOS\//.test(ua)) { navegador = 'Firefox'; version = m(/(?:Firefox|FxiOS)\/([\d.]+)/); }
  else if (/CriOS\//.test(ua)) { navegador = 'Chrome'; version = m(/CriOS\/([\d.]+)/); }
  else if (/Chrome\//.test(ua)) { navegador = 'Chrome'; version = m(/Chrome\/([\d.]+)/); }
  else if (/Safari\//.test(ua)) { navegador = 'Safari'; version = m(/Version\/([\d.]+)/); }
  let enApp = '';
  if (/Instagram/.test(ua)) enApp = 'Instagram';
  else if (/FBAN|FBAV|FB_IAB/.test(ua)) enApp = 'Facebook';
  else if (/WhatsApp/i.test(ua)) enApp = 'WhatsApp';
  else if (/Telegram/i.test(ua)) enApp = 'Telegram';
  else if (/; wv\)/.test(ua)) enApp = 'WebView';

  let so = 'Otro';
  if (/Windows NT 10/.test(ua)) so = 'Windows 10/11';
  else if (/Windows/.test(ua)) so = 'Windows';
  else if (/Android/.test(ua)) so = 'Android ' + m(/Android ([\d.]+)/);
  else if (/iPhone|iPad|iPod/.test(ua)) so = 'iOS ' + m(/OS ([\d_]+)/).replace(/_/g, '.');
  else if (/Mac OS X/.test(ua)) so = 'macOS';
  else if (/CrOS/.test(ua)) so = 'ChromeOS';
  else if (/Linux/.test(ua)) so = 'Linux';

  let dispositivo = 'Escritorio';
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) dispositivo = 'Tablet';
  else if (/Mobi|iPhone|Android/.test(ua)) dispositivo = 'Móvil';

  let modelo = '';
  if (/iPhone/.test(ua)) modelo = 'iPhone';
  else if (/iPad/.test(ua)) modelo = 'iPad';
  else modelo = m(/Android [\d.]+;\s*([^;)]+?)(?:\s+Build|\))/);

  const bot = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget/i.test(ua);
  return { navegador, version, so: so.trim(), dispositivo, modelo: cortar(modelo, 60), enApp, bot };
}

// Ubicacion aproximada a partir de la IP (ciudad/pais/proveedor). Se consulta un servicio externo gratuito
// y se guarda en cache por IP. Si falla, la visita se registra igual, sin ubicacion.
const geoCache = new Map();
async function geoLookup(ip) {
  if (ipPrivada(ip)) return null;
  if (geoCache.has(ip)) return geoCache.get(ip);
  let geo = null;
  try {
    const r = await fetch('https://ipwho.is/' + encodeURIComponent(ip) + '?lang=es', { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    if (d && d.success) {
      geo = {
        pais: cortar(d.country, 60), codigoPais: cortar(d.country_code, 4), region: cortar(d.region, 80), ciudad: cortar(d.city, 80),
        lat: d.latitude, lon: d.longitude, zonaHorariaIP: cortar(d.timezone && d.timezone.id, 60),
        proveedor: cortar(d.connection && (d.connection.isp || d.connection.org), 100), asn: d.connection && d.connection.asn
      };
    }
  } catch (e) {}
  if (!geo) {
    try {
      const r = await fetch('https://get.geojs.io/v1/ip/geo/' + encodeURIComponent(ip) + '.json', { signal: AbortSignal.timeout(4000) });
      const d = await r.json();
      if (d && (d.country || d.city)) {
        geo = {
          pais: cortar(d.country, 60), codigoPais: cortar(d.country_code, 4), region: cortar(d.region, 80), ciudad: cortar(d.city, 80),
          lat: parseFloat(d.latitude) || null, lon: parseFloat(d.longitude) || null, zonaHorariaIP: cortar(d.timezone, 60),
          proveedor: cortar(d.organization_name, 100), asn: d.asn
        };
      }
    } catch (e) {}
  }
  if (geo) { if (geoCache.size > 5000) geoCache.clear(); geoCache.set(ip, geo); }
  return geo;
}

function agregarLinea(obj) {
  fs.appendFile(VISITAS_FILE, JSON.stringify(obj) + '\n', (err) => {
    if (!err) return;
    // El archivo pudo haber desaparecido (ej. tras un reinicio de estadisticas en un momento raro,
    // o si /data no estaba listo todavia). Lo recreamos y reintentamos una vez, en vez de perder el dato en silencio.
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (!fs.existsSync(VISITAS_FILE)) fs.writeFileSync(VISITAS_FILE, '');
      fs.appendFile(VISITAS_FILE, JSON.stringify(obj) + '\n', (err2) => {
        if (err2) console.error('No se pudo guardar una visita (reintento fallido):', err2.message);
      });
    } catch (e) { console.error('No se pudo guardar una visita:', e.message); }
  });
}

// Limite simple por IP para que nadie llene el disco enviando eventos en masa.
// Es generoso a proposito: en una boda es normal que muchos invitados compartan
// la misma IP (el WiFi del salon), asi que un limite bajo cortaba las estadisticas de todos ellos.
const limiteVisitas = new Map();
function excedeLimite(ip) {
  const ahora = Date.now();
  const e = limiteVisitas.get(ip) || { desde: ahora, n: 0 };
  if (ahora - e.desde > 60000) { e.desde = ahora; e.n = 0; }
  e.n++;
  limiteVisitas.set(ip, e);
  if (limiteVisitas.size > 5000) limiteVisitas.clear();
  return e.n > 1500;
}

// Tope de seguridad: si el archivo de registros pasa de 100 MB deja de crecer (evita llenar el disco).
let visitasLlenoHasta = 0, visitasLleno = false;
function archivoVisitasLleno() {
  const t = Date.now();
  if (t > visitasLlenoHasta) {
    visitasLlenoHasta = t + 60000;
    try { visitasLleno = fs.statSync(VISITAS_FILE).size > 100 * 1024 * 1024; } catch (e) { visitasLleno = false; }
  }
  return visitasLleno;
}
async function registrarEvento(req) {
  const b = req.body || {};
  const ip = ipCliente(req);
  if (excedeLimite(ip) || archivoVisitasLleno()) return;
  const tipo = ['visita', 'vista', 'accion', 'fin'].includes(b.tipo) ? b.tipo : 'visita';
  const ahora = new Date();
  const loc = partesLocal(ahora);
  const base = { tipo, ts: ahora.toISOString(), fechaLocal: loc.fecha, horaLocal: loc.hora, visitaId: soloId(b.visitaId), vid: soloId(b.vid) };

  if (tipo === 'accion') return agregarLinea({ ...base, accion: cortar(b.accion, 40), vista: cortar(b.vista, 20) });
  if (tipo === 'vista') return agregarLinea({ ...base, vista: cortar(b.vista, 20) });
  if (tipo === 'fin') {
    return agregarLinea({
      ...base, segundos: entero(b.segundos, 0, 86400), scrollMax: entero(b.scrollMax, 0, 100),
      vistas: Array.isArray(b.vistas) ? b.vistas.slice(0, 10).map(v => cortar(v, 20)) : []
    });
  }

  const ua = req.headers['user-agent'] || '';
  const p = parsearUA(ua);
  const cfg = readSiteConfig();
  const codigoGrupo = cortar(b.grupo, 12);
  const g = codigoGrupo ? (cfg.grupos || []).find(x => x.codigo === codigoGrupo) : null;
  const h = req.headers;
  const rec = {
    ...base,
    nuevo: !!b.nuevo, vista: cortar(b.vista, 20),
    grupoCodigo: g ? g.codigo : '', grupoNombre: g ? g.nombre : '',
    ip, ipReenviada: cortar(h['x-forwarded-for'], 200), host: cortar(h.host, 100),
    ua: cortar(ua, 400), navegador: p.navegador, navegadorVersion: p.version, so: p.so, dispositivo: p.dispositivo,
    modelo: cortar(b.modelo, 60) || p.modelo, enApp: p.enApp, bot: p.bot,
    chUa: cortar(h['sec-ch-ua'], 200), chPlataforma: cortar(h['sec-ch-ua-platform'], 40), chMovil: cortar(h['sec-ch-ua-mobile'], 10),
    idiomaHeader: cortar(h['accept-language'], 100), referrerHeader: cortar(h['referer'], 300),
    referrer: cortar(b.referrer, 300), url: cortar(b.url, 300),
    idiomas: cortar(b.idiomas, 100), zonaHoraria: cortar(b.zonaHoraria, 60), offsetMin: entero(b.offsetMin, -1000, 1000),
    pantalla: cortar(b.pantalla, 20), ventana: cortar(b.ventana, 20), dpr: cortar(b.dpr, 10), colorDepth: entero(b.colorDepth, 0, 64),
    plataforma: cortar(b.plataforma, 40), nucleos: entero(b.nucleos, 0, 256), memoriaGB: cortar(b.memoriaGB, 6), tactil: entero(b.tactil, 0, 50),
    conexion: cortar(b.conexion, 12), downlink: cortar(b.downlink, 8), rtt: entero(b.rtt, 0, 100000), ahorroDatos: !!b.ahorroDatos,
    modoOscuro: !!b.modoOscuro, menosMovimiento: !!b.menosMovimiento, cookies: !!b.cookies, cargaMs: entero(b.cargaMs, 0, 600000)
  };
  const geo = await geoLookup(ip);
  if (geo) Object.assign(rec, geo);
  agregarLinea(rec);
  homeAssistant.contarVisita(rec);
}

app.post('/api/visita', (req, res) => {
  res.json({ ok: true });
  registrarEvento(req).catch(e => console.error('Error registrando visita:', e.message));
});

function leerVisitas() {
  let txt = '';
  try { txt = fs.readFileSync(VISITAS_FILE, 'utf8'); } catch (e) { return []; }
  const out = [];
  for (const l of txt.split('\n')) { if (!l) continue; try { out.push(JSON.parse(l)); } catch (e) {} }
  return out;
}
// Une cada visita con sus eventos posteriores (duracion, scroll, vistas y acciones)
function unirVisitas(lineas) {
  const mapa = new Map();
  lineas.filter(l => l.tipo === 'visita').forEach(v => { mapa.set(v.visitaId || v.ts, { ...v, segundos: 0, scrollMax: 0, vistasVisitadas: [v.vista], acciones: [] }); });
  lineas.forEach(l => {
    const v = mapa.get(l.visitaId);
    if (!v) return;
    if (l.tipo === 'fin') { v.segundos = Math.max(v.segundos, l.segundos || 0); v.scrollMax = Math.max(v.scrollMax, l.scrollMax || 0); }
    else if (l.tipo === 'vista' && !v.vistasVisitadas.includes(l.vista)) v.vistasVisitadas.push(l.vista);
    else if (l.tipo === 'accion') v.acciones.push(l.accion);
  });
  return Array.from(mapa.values()).sort((a, b) => a.ts < b.ts ? 1 : -1);
}
function topN(arr, fn, n) {
  const c = {};
  arr.forEach(x => { const k = fn(x); if (k) c[k] = (c[k] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n || 8).map(([k, v]) => ({ k, n: v }));
}

app.delete('/api/admin/visitas', checkAdmin, (req, res) => {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(VISITAS_FILE, '', { flag: 'w' });
    geoCache.clear();
    limiteVisitas.clear();
    homeAssistant.reiniciarVisitas();
  } catch (e) { return res.status(500).json({ error: 'No se pudo reiniciar' }); }
  res.json({ ok: true });
});
app.get('/api/admin/visitas/resumen', checkAdmin, (req, res) => {
  const todas = unirVisitas(leerVisitas());
  const visitas = todas.filter(v => !v.bot);
  const hoy = partesLocal(new Date()).fecha;
  const hace7 = partesLocal(new Date(Date.now() - 6 * 86400000)).fecha;
  const conTiempo = visitas.filter(v => v.segundos > 0);
  const porDiaMapa = {};
  visitas.forEach(v => { porDiaMapa[v.fechaLocal] = (porDiaMapa[v.fechaLocal] || 0) + 1; });
  const porDia = [];
  for (let i = 13; i >= 0; i--) {
    const f = partesLocal(new Date(Date.now() - i * 86400000)).fecha;
    porDia.push({ fecha: f, n: porDiaMapa[f] || 0 });
  }
  let tamanoKB = 0; try { tamanoKB = Math.round(fs.statSync(VISITAS_FILE).size / 1024); } catch (e) {}
  res.json({
    total: visitas.length,
    unicos: new Set(visitas.map(v => v.vid || v.ip)).size,
    nuevos: visitas.filter(v => v.nuevo).length,
    hoy: visitas.filter(v => v.fechaLocal === hoy).length,
    ultimos7: visitas.filter(v => v.fechaLocal >= hace7).length,
    bots: todas.length - visitas.length,
    promedioSegundos: conTiempo.length ? Math.round(conTiempo.reduce((a, v) => a + v.segundos, 0) / conTiempo.length) : 0,
    porDia,
    paises: topN(visitas, v => v.pais),
    ciudades: topN(visitas, v => v.ciudad ? (v.ciudad + (v.pais ? ', ' + v.pais : '')) : ''),
    navegadores: topN(visitas, v => v.navegador),
    sistemas: topN(visitas, v => v.so),
    dispositivos: topN(visitas, v => v.dispositivo),
    grupos: topN(visitas, v => v.grupoNombre || 'Sin grupo'),
    vistas: topN(visitas, v => v.vista),
    idiomas: topN(visitas, v => (v.idiomas || v.idiomaHeader || '').split(',')[0]),
    origenes: topN(visitas, v => { try { return v.referrer ? new URL(v.referrer).hostname : 'Directo'; } catch (e) { return 'Directo'; } }),
    acciones: topN(visitas.flatMap(v => v.acciones.map(a => ({ a }))), x => x.a, 10),
    enApp: topN(visitas, v => v.enApp),
    ultimas: visitas.slice(0, 40).map(v => ({
      fecha: v.fechaLocal + ' ' + v.horaLocal, ip: v.ip, lugar: [v.ciudad, v.pais].filter(Boolean).join(', '),
      proveedor: v.proveedor || '', navegador: (v.navegador || '') + (v.navegadorVersion ? ' ' + v.navegadorVersion.split('.')[0] : ''),
      so: v.so, dispositivo: v.dispositivo + (v.modelo ? ' (' + v.modelo + ')' : ''), pantalla: v.pantalla, idioma: (v.idiomas || v.idiomaHeader || '').split(',')[0],
      grupo: v.grupoNombre || '', segundos: v.segundos, nuevo: v.nuevo, enApp: v.enApp
    })),
    tamanoKB
  });
});

const COLUMNAS_CSV = ['fechaLocal', 'horaLocal', 'ts', 'visitaId', 'vid', 'nuevo', 'vista', 'vistasVisitadas', 'acciones', 'segundos', 'scrollMax',
  'grupoCodigo', 'grupoNombre', 'ip', 'ipReenviada', 'pais', 'codigoPais', 'region', 'ciudad', 'lat', 'lon', 'zonaHorariaIP', 'proveedor', 'asn',
  'navegador', 'navegadorVersion', 'so', 'dispositivo', 'modelo', 'enApp', 'bot', 'ua', 'chUa', 'chPlataforma', 'chMovil',
  'idiomas', 'idiomaHeader', 'zonaHoraria', 'offsetMin', 'pantalla', 'ventana', 'dpr', 'colorDepth', 'plataforma', 'nucleos', 'memoriaGB', 'tactil',
  'conexion', 'downlink', 'rtt', 'ahorroDatos', 'modoOscuro', 'menosMovimiento', 'cookies', 'cargaMs', 'referrer', 'referrerHeader', 'url', 'host'];
app.get('/api/admin/visitas/export.csv', checkAdmin, (req, res) => {
  const filas = unirVisitas(leerVisitas());
  const esc = (v) => {
    if (Array.isArray(v)) v = v.join('|');
    if (v === undefined || v === null) return '';
    v = String(v);
    return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  const csv = '\ufeff' + COLUMNAS_CSV.join(',') + '\n' + filas.map(f => COLUMNAS_CSV.map(c => esc(f[c])).join(',')).join('\n');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="accesos-boda.csv"');
  res.send(csv);
});
app.get('/api/admin/visitas/export.json', checkAdmin, (req, res) => {
  res.set('Content-Disposition', 'attachment; filename="accesos-boda.json"');
  res.json(unirVisitas(leerVisitas()));
});

// ==================== CLIMA ====================
function descripcionClima(codigo) {
  const mapa = {
    0: ['Despejado', '☀️'], 1: ['Mayormente despejado', '🌤️'], 2: ['Parcialmente nublado', '⛅'], 3: ['Nublado', '☁️'],
    45: ['Niebla', '🌫️'], 48: ['Niebla', '🌫️'],
    51: ['Llovizna', '🌦️'], 53: ['Llovizna', '🌦️'], 55: ['Llovizna', '🌦️'],
    61: ['Lluvia', '🌧️'], 63: ['Lluvia', '🌧️'], 65: ['Lluvia fuerte', '🌧️'],
    71: ['Nieve', '🌨️'], 73: ['Nieve', '🌨️'], 75: ['Nieve fuerte', '🌨️'],
    80: ['Chubascos', '🌦️'], 81: ['Chubascos', '🌦️'], 82: ['Chubascos fuertes', '🌧️'],
    95: ['Tormenta', '⛈️'], 96: ['Tormenta con granizo', '⛈️'], 99: ['Tormenta con granizo', '⛈️']
  };
  const [texto, emoji] = mapa[codigo] || ['Variable', '🌡️'];
  return { texto, emoji };
}
// El clima se divide en dos cosas independientes entre si:
// - "proximosDias": el pronostico real de hoy y los proximos dias (siempre que el API de pronostico responda).
// - "historico": el promedio de los ultimos 5 años para el DIA DEL CALENDARIO de la boda (siempre que haya
//   fecha configurada), sin importar si la boda esta cerca o lejos. Son dos secciones separadas en el sitio.
let climaCache = { clave: '', hasta: 0, datos: null };
app.get('/api/clima', limitar('clima', 60, 60 * 1000), async (req, res) => {
  const cfg = readSiteConfig();
  if (!cfg.clima || cfg.clima.lat === undefined || cfg.clima.lon === undefined) {
    return res.status(404).json({ error: 'Falta configurar la ubicación del clima' });
  }
  const { lat, lon, nombre } = cfg.clima;
  const claveClima = [lat, lon, nombre, cfg.fecha].join('|');
  if (climaCache.datos && climaCache.clave === claveClima && Date.now() < climaCache.hasta) return res.json(climaCache.datos);
  const resultado = { lugar: nombre || '', proximosDias: [], historico: null };

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=16`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    if (data.daily && data.daily.time && data.daily.time.length) {
      const dias = data.daily.time.map((fecha, i) => {
        const d = descripcionClima(data.daily.weathercode[i]);
        return {
          fecha,
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          probLluvia: data.daily.precipitation_probability_max[i],
          descripcionTexto: d.texto, descripcionEmoji: d.emoji
        };
      });
      resultado.proximosDias = dias.slice(0, 7);
    }
  } catch (e) { /* si falla el pronostico, igual seguimos e intentamos el historico */ }

  if (cfg.fecha) {
    try {
      const fechaEvento = new Date(cfg.fecha + 'T00:00:00');
      const mm = String(fechaEvento.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaEvento.getDate()).padStart(2, '0');
      const anioBase = fechaEvento.getFullYear() - 1;
      const maxTemps = [], minTemps = [], lluvias = [];
      for (let i = 0; i < 5; i++) {
        const fechaHist = `${anioBase - i}-${mm}-${dd}`;
        try {
          const urlHist = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${fechaHist}&end_date=${fechaHist}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
          const rh = await fetch(urlHist, { signal: AbortSignal.timeout(8000) });
          const dh = await rh.json();
          if (dh.daily && dh.daily.temperature_2m_max && dh.daily.temperature_2m_max.length && dh.daily.temperature_2m_max[0] !== null) {
            maxTemps.push(dh.daily.temperature_2m_max[0]);
            minTemps.push(dh.daily.temperature_2m_min[0]);
            lluvias.push(dh.daily.precipitation_sum[0] > 1 ? 1 : 0);
          }
        } catch (e) {}
      }
      if (maxTemps.length) {
        const promedio = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        resultado.historico = {
          tempMax: Math.round(promedio(maxTemps)), tempMin: Math.round(promedio(minTemps)),
          probLluvia: Math.round(promedio(lluvias) * 100), aniosConsiderados: maxTemps.length
        };
      }
    } catch (e) {}
  }

  if (!resultado.proximosDias.length && !resultado.historico) {
    return res.status(503).json({ error: 'No se pudo obtener el clima en este momento' });
  }
  climaCache = { clave: claveClima, hasta: Date.now() + 30 * 60 * 1000, datos: resultado }; // 30 min
  res.json(resultado);
});

// ==================== CALENDARIO (.ics) ====================
function pad(n) { return String(n).padStart(2, '0'); }
function escaparICS(t) { return String(t || '').replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n'); }
app.get('/calendario.ics', (req, res) => {
  const cfg = readSiteConfig();
  if (!cfg.fecha || !cfg.horaInicio) return res.status(404).send('Todavia no se configuro la fecha del evento');
  const [anio, mes, dia] = cfg.fecha.split('-').map(Number);
  const [hIni, mIni] = cfg.horaInicio.split(':').map(Number);
  let hFin = hIni + 4, mFin = mIni;
  if (cfg.horaFin) { const p = cfg.horaFin.split(':').map(Number); hFin = p[0]; mFin = p[1]; }
  const dtStart = `${anio}${pad(mes)}${pad(dia)}T${pad(hIni)}${pad(mIni)}00`;
  const dtEnd = `${anio}${pad(mes)}${pad(dia)}T${pad(hFin)}${pad(mFin)}00`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lugar = (cfg.salon && cfg.salon.direccion) || cfg.lugar || '';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Boda//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    'UID:' + dtStamp + '-boda@sitio-local', 'DTSTAMP:' + dtStamp, 'DTSTART:' + dtStart, 'DTEND:' + dtEnd,
    'SUMMARY:' + escaparICS('Boda de ' + cfg.novia + ' y ' + cfg.novio), 'LOCATION:' + escaparICS(lugar),
    'DESCRIPTION:' + escaparICS(cfg.mensaje || '¡Los esperamos para celebrar!'), 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  res.set('Content-Type', 'text/calendar; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="boda.ics"');
  res.send(ics);
});

// Errores (JSON mal formado, cuerpo demasiado grande, fallos inesperados): respuesta generica, sin rutas ni detalles internos.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = (err && (err.status || err.statusCode)) || 500;
  if (status >= 500) console.error('Error en ' + req.method + ' ' + req.path + ':', err && err.stack ? err.stack : err);
  const codigo = (status >= 400 && status < 600) ? status : 500;
  res.status(codigo).json({ error: codigo === 413 ? 'El contenido enviado es demasiado grande' : (codigo < 500 ? 'Solicitud inválida' : 'Error interno del servidor') });
});
process.on('unhandledRejection', (e) => console.error('Promesa sin manejar:', e && e.stack ? e.stack : e));
process.on('uncaughtException', (e) => console.error('Excepcion sin manejar:', e && e.stack ? e.stack : e));

const servidor = app.listen(PORT, '0.0.0.0', () => console.log('Sitio de la boda escuchando en el puerto ' + PORT));

// Videos grandes desde el celular pueden tardar mas de los 5 minutos que Node permite por defecto
servidor.requestTimeout = 60 * 60 * 1000;
servidor.headersTimeout = 65 * 1000;

// Home Assistant: entidades sensor.boda_datos / sensor.boda_actividad y evento boda_evento (ver README, version 1.25.0)
// Se lee sin crear respaldos .corrupto-* (eso ya lo hace la lectura normal del sitio): esto corre cada minuto.
function leerJSONSinRespaldo(file) { try { const d = JSON.parse(fs.readFileSync(file, 'utf8')); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
homeAssistant.iniciar({
  leerRsvps: () => leerJSONSinRespaldo(RSVP_FILE),
  leerFotos: () => leerJSONSinRespaldo(PHOTOS_META_FILE),
  leerConfig: readSiteConfig,
  archivoVisitas: VISITAS_FILE,
  zonaHoraria: TZ_LOCAL,
  habilitado: opciones.homeassistant !== false,
  invitadosEsperados: opciones.invitados_esperados
});

// Para las pruebas automaticas
module.exports = { generarZip, nombreSeguroArchivo, pasesDescarga };
