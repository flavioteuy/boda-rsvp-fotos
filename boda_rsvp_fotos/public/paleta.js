/* Paleta de colores y fondo del sitio. Lo usan el sitio y el panel (la vista previa), asi calculan exactamente lo mismo.
   - calcular(p): de los 6 colores elegidos saca las variables CSS del sitio, incluyendo el color de letra que se lee bien
     sobre los botones y una version mas oscura del color de "detalles" para usarlo en textos e iconos.
   - fondoVars(f, p, colorTema): variables para el fondo de color liso y su textura.
   No usa nada externo. */
(function (g) {
  var PROPUESTA = { fondo: '#f8f4ee', tarjeta: '#fffdf9', detalle: '#d8b9b3', acento: '#d8b98a', textoSuave: '#a89586', texto: '#594a42' };
  var HEX6 = /^#[0-9a-f]{6}$/i;
  // Cada textura es un dibujo SVG (public/texturas/<id>.svg) que se usa como mascara: el color de la tinta se calcula solo
  var TEXTURAS = {
    papel: { nombre: 'Papel', tam: 240 }, lino: { nombre: 'Lino', tam: 160 }, acuarela: { nombre: 'Acuarela', tam: 640 },
    puntos: { nombre: 'Puntitos', tam: 120 }, rayas: { nombre: 'Rayas finas', tam: 96 }, hojas: { nombre: 'Hojas', tam: 240 }
  };
  var VARIABLES = ['--fondo', '--tarjeta', '--texto', '--texto-suave', '--acento', '--acento2', '--sobre-acento', '--sobre-acento2', '--acento2-texto', '--acento-suave', '--boton2', '--sobre-boton2'];
  var VARIABLES_FONDO = ['--textura-fondo', '--textura-tam', '--intensidad-textura', '--tinta-textura'];
  var PAPEL_SOBRE = '#f6efe3';   // color de siempre del papel del sobre
  var VARIABLES_SOBRE = ['--papel', '--sobre-tex-img', '--sobre-tex-tam', '--sobre-tex-int', '--sobre-tex-filtro'];

  function valido(h) { return typeof h === 'string' && HEX6.test(h); }
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function aHex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function lum(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contraste(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mezclar(a, b, t) { var x = rgb(a), y = rgb(b); return aHex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function mejorTexto(bg, a, b) { return contraste(bg, a) >= contraste(bg, b) ? a : b; }
  // Version del color que se lee (contraste minimo "min") sobre todos los fondos: oscurece si los fondos son claros, aclara si son oscuros
  function legible(color, fondos, min) {
    var claro = fondos.every(function (f) { return lum(f) > 0.4; });
    var meta = claro ? '#000000' : '#ffffff', c = color, t = 0;
    while (t < 1 && !fondos.every(function (f) { return contraste(c, f) >= min; })) { t += 0.04; c = mezclar(color, meta, t); }
    return c;
  }
  function completa(p) {
    var o = {};
    Object.keys(PROPUESTA).forEach(function (k) { o[k] = (p && valido(p[k])) ? p[k].toLowerCase() : PROPUESTA[k]; });
    return o;
  }
  function calcular(p) {
    p = completa(p);
    var s = hexASuave(p.detalle);
    return {
      '--fondo': p.fondo, '--tarjeta': p.tarjeta, '--texto': p.texto, '--texto-suave': p.textoSuave,
      '--acento': p.acento, '--acento2': p.detalle,
      '--sobre-acento': mejorTexto(p.acento, p.tarjeta, p.texto),                 // letra de los botones
      '--sobre-acento2': mejorTexto(p.detalle, p.tarjeta, p.texto),               // letra sobre los detalles de color
      '--acento2-texto': legible(p.detalle, [p.tarjeta, p.fondo], 3),             // detalle usado como letra o icono
      '--acento-suave': s,
      '--boton2': p.acento,                                                       // botones y pestana activa: champagne
      '--sobre-boton2': mejorTexto(p.acento, p.tarjeta, p.texto)
    };
  }
  function hexASuave(h) { var c = rgb(h); return 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', .30)'; }
  // Pone (o saca) las variables de la paleta en un elemento. Devuelve las variables puestas ({} si no se usa la paleta).
  function aplicar(el, p) {
    var usar = !!(p && p.usar), v = usar ? calcular(p) : {};
    VARIABLES.forEach(function (k) { if (v[k]) el.style.setProperty(k, v[k]); else el.style.removeProperty(k); });
    return v;
  }
  function fondoVars(f, p, colorTema) {
    var out = {};
    if (!f) return out;
    if (f.modo === 'color' && valido(f.color)) out['--fondo'] = f.color.toLowerCase();
    if (f.modo !== 'foto' && f.textura && TEXTURAS[f.textura]) {
      var base = out['--fondo'] || ((p && p.usar && valido(p.fondo)) ? p.fondo : (valido(colorTema) ? colorTema : '#ffffff'));
      var oscuro = lum(base) < 0.35;
      var n = parseInt(f.intensidad, 10); if (!isFinite(n)) n = 35;
      out['--textura-fondo'] = "url('/texturas/" + f.textura + ".svg')";
      out['--textura-tam'] = TEXTURAS[f.textura].tam + 'px';
      out['--intensidad-textura'] = String(Math.max(5, Math.min(100, n)) / 100);
      out['--tinta-textura'] = oscuro ? '#ffffff' : ((p && p.usar && valido(p.texto)) ? p.texto : '#4a3b32');
    }
    return out;
  }
  // Variables del sobre: color del papel y textura (dibujo negro semitransparente; en papeles oscuros se invierte a blanco). {} = todo de siempre.
  function sobreVars(s) {
    var out = {};
    if (!s) return out;
    if (valido(s.color)) out['--papel'] = s.color.toLowerCase();
    if (s.textura && TEXTURAS[s.textura]) {
      var base = out['--papel'] || PAPEL_SOBRE, n = parseInt(s.intensidad, 10); if (!isFinite(n)) n = 35;
      out['--sobre-tex-img'] = "url('/texturas/" + s.textura + ".svg')";
      out['--sobre-tex-tam'] = TEXTURAS[s.textura].tam + 'px';
      out['--sobre-tex-int'] = String(Math.max(5, Math.min(100, n)) / 100);
      out['--sobre-tex-filtro'] = lum(base) < 0.35 ? 'invert(1)' : 'none';
    }
    return out;
  }
  // Normaliza lo que escribe una persona: acepta "abc", "#abc", "ABCDEF" o "#ABCDEF" y devuelve "#rrggbb" (o '' si no es un color)
  function normalizar(t) {
    t = String(t == null ? '' : t).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(t)) t = t.split('').map(function (c) { return c + c; }).join('');
    return /^[0-9a-f]{6}$/i.test(t) ? ('#' + t.toLowerCase()) : '';
  }
  g.Paleta = { PROPUESTA: PROPUESTA, TEXTURAS: TEXTURAS, VARIABLES: VARIABLES, VARIABLES_FONDO: VARIABLES_FONDO, PAPEL_SOBRE: PAPEL_SOBRE, VARIABLES_SOBRE: VARIABLES_SOBRE, sobreVars: sobreVars, valido: valido, normalizar: normalizar,
    contraste: contraste, lum: lum, mezclar: mezclar, legible: legible, calcular: calcular, aplicar: aplicar, fondoVars: fondoVars };
})(window);
