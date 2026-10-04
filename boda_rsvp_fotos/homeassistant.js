// ==================== HOME ASSISTANT ====================
// Publica las estadisticas de la boda como entidades de Home Assistant y avisa de cada confirmacion y subida.
//
// - sensor.boda_datos      -> todos los numeros en atributos (visitas, confirmaciones, personas, fotos, videos, pendientes...)
// - sensor.boda_actividad  -> ultimas confirmaciones y subidas (para listas en el dashboard y las "novedades" de Alexa)
// - evento boda_evento     -> se dispara con cada confirmacion y cada subida (para anuncios al momento)
//
// Usa la API del Supervisor ("homeassistant_api: true" en config.yaml): no hace falta token ni configurar nada.
// Fuera de Home Assistant (pruebas) se puede apuntar a otro HA con las variables HA_URL y HA_TOKEN.
// Si Home Assistant no responde, el sitio sigue funcionando igual: esto nunca frena ni rompe una confirmacion o una subida.
'use strict';

const fs = require('fs');
const readline = require('readline');

const INTERVALO_MS = 60 * 1000;       // re-publica cada minuto: despues de reiniciar HA las entidades vuelven solas, y "hoy" pasa a 0 a medianoche
const ESPERA_CAMBIO_MS = 3 * 1000;    // junta varios cambios seguidos (una rafaga de visitas o de fotos) en una sola publicacion
const MAX_CONFIRMACIONES = 60, MAX_SUBIDAS = 30, MAX_GRUPOS_LISTA = 30;
const SUBIDAS_JUNTAS_MS = 10 * 60 * 1000; // fotos seguidas de la misma persona (en menos de 10 min) cuentan como una sola subida en la lista

// Texto seguro para mostrar en Home Assistant (dashboard en Markdown y lo que dice Alexa): sin etiquetas ni simbolos de formato.
function limpiar(v, max) {
  return String(v == null ? '' : v).replace(/<[^>]*>/g, '').replace(/[<>[\]{}*_#|`\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function entero(v) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; }
function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

function crear() {
  let deps = null;                 // lo que pasa server.js en iniciar()
  let base = '', token = '';
  let activo = false;
  let temporizador = null, intervalo = null;
  let publicando = false, otraVez = false;
  let ultimoDatos = '', actualizado = null;
  let fallando = false;
  let fmtFecha = null;

  // Visitas: se cuentan en memoria con el mismo criterio que las estadisticas del panel
  // (una por visitaId, sin bots; "unicos" por vid o IP) para no releer visitas.jsonl, que puede pesar hasta 100 MB.
  const visitas = { claves: new Set(), unicos: new Set(), porDia: new Map() };

  function fechaLocal(d) {
    try { return fmtFecha.format(new Date(d)); } catch (e) { return ''; }
  }

  function contarVisita(v) {
    if (!activo || !v || v.tipo !== 'visita' || v.bot) return false;
    const clave = v.visitaId || v.ts;
    if (!clave || visitas.claves.has(clave)) return false;
    visitas.claves.add(clave);
    visitas.unicos.add(v.vid || v.ip || clave);
    const dia = v.fechaLocal || fechaLocal(v.ts);
    visitas.porDia.set(dia, (visitas.porDia.get(dia) || 0) + 1);
    cambio();
    return true;
  }

  function reiniciarVisitas() {
    visitas.claves.clear(); visitas.unicos.clear(); visitas.porDia.clear();
    cambio();
  }

  // Lee visitas.jsonl de a una linea (sin cargarlo entero en memoria) al arrancar.
  function cargarVisitas(archivo) {
    return new Promise((resolve) => {
      let entrada;
      try { entrada = fs.createReadStream(archivo, { encoding: 'utf8' }); } catch (e) { return resolve(0); }
      entrada.on('error', () => resolve(visitas.claves.size));
      const rl = readline.createInterface({ input: entrada, crlfDelay: Infinity });
      rl.on('line', (l) => {
        if (!l || l.indexOf('"visita"') === -1) return;   // atajo: solo interesan las lineas de tipo visita
        try { contarVisita(JSON.parse(l)); } catch (e) {}
      });
      rl.on('close', () => resolve(visitas.claves.size));
    });
  }

  // ---------- Calculo de lo que se publica ----------
  function calcular(ahora) {
    ahora = ahora || new Date();
    const hoy = fechaLocal(ahora);
    const rsvps = (deps.leerRsvps() || []).filter(r => r && typeof r === 'object');
    const fotos = (deps.leerFotos() || []).filter(m => m && typeof m === 'object');
    const cfg = deps.leerConfig() || {};

    let respSi = 0, respNo = 0, persSi = 0, persNo = 0, respHoy = 0;
    const gruposConRespuesta = new Set();
    for (const r of rsvps) {
      const personas = 1 + Math.max(0, entero(r.acompanantes));
      if (r.asistencia === 'si') { respSi++; persSi += personas; } else { respNo++; persNo += personas; }
      if (r.fecha && fechaLocal(r.fecha) === hoy) respHoy++;
      if (r.grupoCodigo) gruposConRespuesta.add(r.grupoCodigo);
    }

    let nFotos = 0, nVideos = 0, subidasHoy = 0;
    for (const m of fotos) {
      if (m.tipo === 'video') nVideos++; else nFotos++;
      if (m.fecha && fechaLocal(m.fecha) === hoy) subidasHoy++;
    }

    // Invitados esperados: la opcion del add-on si se completo; si no, la suma de los grupos (su limite, o la cantidad de nombres cargados)
    const grupos = Array.isArray(cfg.grupos) ? cfg.grupos : [];
    const deGrupos = grupos.reduce((a, g) => a + (entero(g.limite) > 0 ? entero(g.limite) : (Array.isArray(g.invitados) ? g.invitados.length : 0)), 0);
    const esperados = entero(deps.invitadosEsperados) > 0 ? entero(deps.invitadosEsperados) : deGrupos;
    const respondieron = persSi + persNo;

    const datos = {
      visitas: visitas.claves.size,
      visitantes_unicos: visitas.unicos.size,
      visitas_hoy: visitas.porDia.get(hoy) || 0,
      respuestas: rsvps.length,
      respuestas_si: respSi,
      respuestas_no: respNo,
      respuestas_hoy: respHoy,
      personas_si: persSi,
      personas_no: persNo,
      invitados_esperados: esperados,
      origen_esperados: entero(deps.invitadosEsperados) > 0 ? 'opcion' : (deGrupos > 0 ? 'grupos' : 'sin dato'),
      pendientes: esperados > 0 ? Math.max(0, esperados - respondieron) : null,
      porcentaje_respondido: esperados > 0 ? Math.min(100, Math.round(respondieron / esperados * 100)) : null,
      fotos: nFotos,
      videos: nVideos,
      subidas_hoy: subidasHoy,
      fecha_boda: /^\d{4}-\d{2}-\d{2}$/.test(cfg.fecha || '') ? cfg.fecha : null,
      novia: limpiar(cfg.novia, 60),
      novio: limpiar(cfg.novio, 60),
      grupos: grupos.length,
      grupos_sin_respuesta: grupos.filter(g => !gruposConRespuesta.has(g.codigo)).map(g => limpiar(g.nombre, 60)).filter(Boolean).slice(0, MAX_GRUPOS_LISTA)
    };

    // Ultimas confirmaciones (la mas nueva primero)
    const confirmaciones = rsvps.slice()
      .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
      .slice(0, MAX_CONFIRMACIONES)
      .map(r => ({
        t: r.fecha || null, n: limpiar(r.nombre, 60), a: r.asistencia === 'si',
        p: 1 + Math.max(0, entero(r.acompanantes)), m: limpiar(r.mensaje, 140), g: limpiar(r.grupoNombre, 60)
      }));

    // Ultimas subidas: las fotos seguidas de la misma persona se juntan en una sola fila ("Ana subio 5 fotos y 1 video")
    const subidas = [];
    const ordenadas = fotos.slice().sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
    for (const m of ordenadas) {
      const quien = limpiar(m.subidoPor, 60);
      const vid = m.vid || '';
      const ult = subidas[subidas.length - 1];
      if (ult && ult._quien === quien && ult._vid === vid && (Date.parse(ult._desde) - Date.parse(m.fecha)) <= SUBIDAS_JUNTAS_MS) {
        if (m.tipo === 'video') ult.v++; else ult.f++;
        ult._desde = m.fecha;
        continue;
      }
      if (subidas.length >= MAX_SUBIDAS) break;
      subidas.push({ t: m.fecha || null, n: quien, f: m.tipo === 'video' ? 0 : 1, v: m.tipo === 'video' ? 1 : 0, _quien: quien, _vid: vid, _desde: m.fecha });
    }
    subidas.forEach(s => { delete s._quien; delete s._vid; delete s._desde; });

    // Estado de "actividad": lo ultimo que paso, en una frase
    const c0 = confirmaciones[0], s0 = subidas[0];
    let ultimo = 'Sin actividad todavía';
    if (c0 && (!s0 || String(c0.t) >= String(s0.t))) {
      ultimo = (c0.n || 'Alguien') + (c0.a ? ' confirmó (' + plural(c0.p, 'persona', 'personas') + ')' : ' avisó que no va');
    } else if (s0) {
      const partes = [];
      if (s0.f) partes.push(plural(s0.f, 'foto', 'fotos'));
      if (s0.v) partes.push(plural(s0.v, 'video', 'videos'));
      ultimo = (s0.n || 'Alguien') + ' subió ' + partes.join(' y ');
    }

    return { datos, actividad: { estado: ultimo.slice(0, 250), confirmaciones, subidas } };
  }

  // ---------- Envio a Home Assistant ----------
  async function enviar(ruta, cuerpo) {
    const r = await fetch(base + ruta, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status + (r.status === 401 ? ' (sin permiso: falta "homeassistant_api: true" o el token no sirve)' : ''));
  }

  function anotarError(e) {
    if (!fallando) console.warn('🏠 Home Assistant no respondió (' + (e && e.message ? e.message : e) + '). El sitio sigue funcionando; se reintenta cada minuto.');
    fallando = true;
  }
  function anotarOk() {
    if (fallando) console.log('🏠 Home Assistant respondió de nuevo: entidades actualizadas.');
    fallando = false;
  }

  async function publicar() {
    if (!activo) return;
    if (publicando) { otraVez = true; return; }
    publicando = true;
    try {
      const { datos, actividad } = calcular(new Date());
      const firma = JSON.stringify(datos);
      if (firma !== ultimoDatos || !actualizado) { actualizado = new Date().toISOString(); }
      await enviar('/states/sensor.boda_datos', {
        state: actualizado,
        attributes: Object.assign({}, datos, { friendly_name: 'Boda datos', icon: 'mdi:ring', device_class: 'timestamp' })
      });
      await enviar('/states/sensor.boda_actividad', {
        state: actividad.estado,
        attributes: { confirmaciones: actividad.confirmaciones, subidas: actividad.subidas, friendly_name: 'Boda actividad', icon: 'mdi:history' }
      });
      ultimoDatos = firma;
      anotarOk();
    } catch (e) {
      anotarError(e);
    } finally {
      publicando = false;
      if (otraVez) { otraVez = false; cambio(); }
    }
  }

  // Algo cambio (confirmacion, foto, visita, borrado): se publica en unos segundos, juntando los cambios seguidos.
  function cambio() {
    if (!activo || temporizador) return;
    temporizador = setTimeout(() => { temporizador = null; publicar(); }, ESPERA_CAMBIO_MS);
    if (temporizador.unref) temporizador.unref();
  }

  // Evento para anuncios al momento (Alexa, notificaciones). Nunca frena al que lo llama.
  function evento(datos) {
    if (!activo) return;
    const cuerpo = Object.assign({}, datos, { t: new Date().toISOString() });
    if (cuerpo.nombre !== undefined) cuerpo.nombre = limpiar(cuerpo.nombre, 60);
    if (cuerpo.mensaje !== undefined) cuerpo.mensaje = limpiar(cuerpo.mensaje, 140);
    if (cuerpo.grupo !== undefined) cuerpo.grupo = limpiar(cuerpo.grupo, 60);
    // Totales ya contando este evento: el anuncio ("ya van 86 confirmados") no depende de que sensor.boda_datos se haya actualizado antes
    try {
      const d = calcular().datos;
      cuerpo.totales = { personas_si: d.personas_si, personas_no: d.personas_no, respuestas: d.respuestas, fotos: d.fotos, videos: d.videos, pendientes: d.pendientes };
    } catch (e) {}
    enviar('/events/boda_evento', cuerpo).then(anotarOk, anotarError);
    cambio();
  }

  // deps: { leerRsvps, leerFotos, leerConfig, archivoVisitas, zonaHoraria, habilitado, invitadosEsperados }
  function iniciar(d) {
    deps = d;
    fmtFecha = new Intl.DateTimeFormat('en-CA', { timeZone: d.zonaHoraria || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
    if (d.habilitado === false) { console.log('🏠 Home Assistant: publicación de entidades apagada (opción "homeassistant").'); return false; }
    token = process.env.HA_TOKEN || process.env.SUPERVISOR_TOKEN || '';
    base = (process.env.HA_URL ? process.env.HA_URL.replace(/\/+$/, '') + '/api' : 'http://supervisor/core/api');
    if (!token) {
      console.log('🏠 Home Assistant: sin acceso a la API (falta "homeassistant_api: true" en config.yaml). No se publican entidades.');
      return false;
    }
    activo = true;
    cargarVisitas(d.archivoVisitas).then((n) => {
      console.log('🏠 Home Assistant: publicando sensor.boda_datos y sensor.boda_actividad (' + n + ' visitas registradas).');
      publicar();
    });
    intervalo = setInterval(publicar, INTERVALO_MS);
    if (intervalo.unref) intervalo.unref();
    return true;
  }

  function detener() {
    activo = false;
    if (temporizador) clearTimeout(temporizador);
    if (intervalo) clearInterval(intervalo);
    temporizador = intervalo = null;
  }

  return { iniciar, detener, cambio, evento, contarVisita, reiniciarVisitas, cargarVisitas, calcular, publicar, _visitas: visitas };
}

module.exports = crear();
module.exports.crear = crear;
module.exports.limpiar = limpiar;
