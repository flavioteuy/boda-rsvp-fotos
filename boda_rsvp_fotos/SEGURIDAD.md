# Informe de seguridad — Boda RSVP y Fotos (versión 1.24.0)

Auditoría de todo el add-on: servidor (`server.js`), sitio público (`index.html`), panel de administración (`admin.html`),
sello (`sello.js`), `Dockerfile`, `package.json` y `config.yaml`. Se revisó el código línea por línea, se escribió una batería
de 47 pruebas automáticas contra los cambios y se comprobó el sitio en un navegador real con la política de seguridad activada.

## Resumen

| # | Gravedad | Hallazgo | Estado |
|---|----------|----------|--------|
| 1 | **Alta** | Un invitado podía subir un archivo `.html`/`.svg` disfrazado de foto y el servidor lo entregaba como página web desde tu dominio (XSS almacenado: un script en tu propio dominio podía, por ejemplo, mostrar un falso formulario de contraseña idéntico al del panel a quien abriera el enlace). | Corregido |
| 2 | **Alta** | Contraseña de admin sin límite de intentos (fuerza bruta), comparada de forma no constante, y con valor de fábrica público (`cambiame`). | Corregido (+ aviso en el panel) |
| 3 | Media | `multer` 1.x tiene fallas conocidas que permiten tumbar el servidor con una petición mal formada; la ruta pública de fotos las exponía. Node 18 ya no recibe parches. | Corregido (multer 2.x, Node 22) |
| 4 | Media | La contraseña viajaba en la URL (QR de grupos, descarga de estadísticas): queda en historial, logs y `Referer`. | Corregido (solo por cabecera) |
| 5 | Media | `trust proxy: true`: cualquiera podía falsear su IP y saltarse los límites. | Corregido |
| 6 | Media | Sin cabeceras de seguridad (CSP, `nosniff`, anti-iframe, etc.). | Corregido |
| 7 | Media | Se podía llenar el disco del NUC (subidas de hasta 500 MB × 10 sin tope global; registros de visitas y confirmaciones sin tope). Home Assistant comparte disco. | Corregido |
| 8 | Media | Archivos de datos escritos sin atomicidad: un corte de luz podía dejar `rsvps.json` a medias y la siguiente confirmación **sobrescribía todo**. | Corregido |
| 9 | Media | Enlaces de mapa y URL pública sin validar (`javascript:` se ejecutaría al tocar el enlace). | Corregido |
| 10 | Media | `/api/clima` hacía 6 consultas externas por cada visita, sin caché ni límite (te podían bloquear la IP en Open-Meteo). | Corregido (caché 30 min + límite) |
| 11 | Media | Códigos de grupo con `Math.random` y sin límite de intentos para adivinarlos. | Corregido |
| 12 | Baja | Errores mostraban rutas internas (stack trace). | Corregido |
| 13 | Baja | Panel: nombres de testigos y algunas URLs sin escapar (rompía con comillas). | Corregido |
| 14 | Baja | Calendario `.ics`: saltos de línea en el mensaje podían inyectar campos. | Corregido |
| 15 | Baja | RSVP: `asistencia` libre, acompañantes sin tope, sin límite de confirmaciones. | Corregido |

## Actualización 1.12.0: acceso al panel

Pedido: "eliminar el link de acceso al panel para evitar intentos de hackeo". Qué se hizo y qué no:

- **Se quitó el enlace** del pie del sitio y el archivo ya no se llama `admin.html`: ahora está en la carpeta `panel/`, **fuera** de la carpeta pública (`public/`), y solo se entrega en una **ruta secreta** (12 caracteres al azar o la que elijas con `ruta_admin`). Pedir `/admin.html`, `/admin`, `/panel`, `/login`, etc. da "no encontrado".
- Los buscadores no la indexan (`noindex` + `X-Robots-Tag`) y no se guarda en caché.
- **Opción `admin_solo_red_local: true`**: el panel y **todas** las rutas `/api/admin/*` y `/api/rsvps` (incluso borrar fotos de invitados) responden 404 a cualquiera que no esté en tu red local (192.168.x, 10.x, 172.16–31.x, Tailscale 100.64/10). Si tu proxy avisa (`X-Real-IP`, `CF-Connecting-IP`) que el visitante viene de Internet, también se bloquea; falsear esas cabeceras solo puede bloquearte a vos mismo, nunca abrir el acceso.
- **Importante:** una ruta secreta es "seguridad por oscuridad": dificulta que un robot la encuentre, pero si alguien ve la dirección (historial, capturas, un mensaje reenviado) ya no protege. Lo que protege de verdad es la contraseña (bloqueo tras 10 intentos) y, mucho más, `admin_solo_red_local`. Recomendación: activala y administrá desde tu casa; para entrar de afuera, usá VPN/Tailscale.
- Límite del modo red local: depende de que el proxy le pase al add-on la IP real del visitante. Si tu proxy no lo hiciera, todo el tráfico parecería venir de la red local. Probalo con datos móviles del celular (Wi‑Fi apagado): el panel tiene que dar "no encontrado".
- Nuevo tope en subidas de fotos del sobre (12) y nombres de archivo validados al leer la configuración. Las imágenes subidas ahora se sirven con caché largo (sus nombres son únicos y no se modifican).

Pruebas 1.12.0: 62 del servidor (47 anteriores + 15 nuevas), 11 del modo red local y 14 de elección de ruta; todas pasan. Igual que antes, no se probó contra el Express/multer reales ni con tu proxy.

## Actualización 1.13.0: borrar confirmaciones

Se agregaron tres endpoints de administración (`POST /api/admin/rsvps/borrar`, `GET /api/admin/rsvps/ultimo-borrado`, `POST /api/admin/rsvps/deshacer`). Todos pasan por la clave de administrador (con el bloqueo por intentos), por el modo "solo red local" si lo activaste y no se cachean.
- Borrar **todas** exige que el pedido incluya la palabra `BORRAR`; el servidor lo verifica, no solo el panel.
- Antes de borrar se guarda una copia de lo borrado en `/data/rsvps-ultimo-borrado.json` para poder deshacer. Contiene nombres y mensajes de invitados: está en la carpeta de datos (no se sirve por web) y se pisa con el siguiente borrado. Si querés eliminarla del todo, borrá ese archivo desde la carpeta del add-on.
- En el panel los nombres se escapan al dibujar la lista (probado con `<b>` en un nombre).
- Pruebas: 13 nuevas del servidor y 27 del panel; todas pasan.

## Actualización 1.14.0: panel viejo y mapa

- El servidor devuelve 404 para `/admin.html` y `/admin` aunque el archivo exista en `public/` (típico al copiar una carpeta encima de otra). Antes se habría servido un panel viejo sin ocultar y sin las mejoras. Además el Log avisa si el archivo está.
- Con el modo de mapa «botón» (por defecto) o «enlace», el sitio ya no se conecta a Google hasta que el invitado pide el mapa; en «automático» sigue como antes.
- Se endureció la lectura de la configuración (un archivo ausente o vacío se regenera en vez de fallar).

## Actualización 1.14.1: prueba de subida

- Nuevo endpoint `POST /api/admin/prueba-subida`, solo para el administrador: pasa por la clave (con el bloqueo por intentos), por el modo «solo red local» si lo activaste, y no se cachea. Solo cuenta los bytes que recibe y los descarta: **no escribe nada en disco**. Rechaza pruebas de más de 80 MB.
- Los mensajes de error de subida se traducen a español; ya no se devuelve el texto interno de la librería de subidas.
- Recordatorio relacionado: el límite de tamaño de subida del proxy (`client_max_body_size`) no es un tema de seguridad del add-on, pero conviene fijarlo en un valor razonable (600 MB alcanza) y no en «ilimitado».

## Actualización 1.15.0: controles del slideshow

Cambio solo de la página pública (botones y gestos del carrusel). No se agregaron endpoints ni permisos, y los botones se crean sin código en línea, así que la política de seguridad (CSP) sigue sin violaciones.

## Actualización 1.16.0: subida de a un archivo

- El límite de subidas de la galería pública subió de 1000 a **4000 pedidos por hora por IP**, porque ahora cada archivo es un pedido y en un evento todos los invitados comparten la IP del wifi. El resto de las protecciones de esa ruta no cambió: máximo 500 MB por archivo, solo imágenes y videos (se revisa el tipo y la extensión), control de espacio libre en disco y bloqueo cuando la subida está deshabilitada. Si preferís un tope más bajo, se cambia en `server.js` (`limitar('subida', 4000, …)`).
- El nombre del invitado se guarda solo en el navegador de esa persona (`localStorage`); el servidor no recibe nada nuevo. Los nombres de archivo y los mensajes de error se muestran como texto (probado con HTML en el nombre).
- El panel de administración solo cambió de organización (pestañas): mismas rutas, misma clave, mismo bloqueo por intentos.

## Actualización 1.17.0: barra del panel

Solo diseño del panel (la barra de secciones puede ir a la izquierda). No hay endpoints ni permisos nuevos. La preferencia se guarda en el navegador de quien administra, no en el servidor.

## Actualización 1.18.0: título y texto de «Nuestra historia»

- Un endpoint nuevo, `POST /api/admin/historia`, protegido igual que los demás de administración (contraseña por cabecera, bloqueo por intentos y, si está activa, restricción a la red local).
- Entrada limitada y normalizada en el servidor: título de hasta 100 caracteres en una sola línea y texto de hasta 1500; cualquier valor que no sea texto se convierte a texto sin romper nada.
- El sitio muestra ambos con `textContent`, nunca como HTML (probado con `<img onerror>` y `<script>` en el título y en el texto). El panel también usa `textContent` en la vista previa.

## Actualización 1.19.0: textos del sitio, paleta de colores y fondo

- Tres endpoints nuevos, `POST /api/admin/textos-sitio`, `POST /api/admin/paleta` y `POST /api/admin/fondo-estilo`, protegidos igual que los demás de administración (contraseña por cabecera, bloqueo por intentos y, si está activa, restricción a la red local). `dresscode` y `galeria` aceptan campos nuevos con la misma protección.
- Los textos fijos (sobre, portada, títulos de secciones, nombres de lugares, título y subtítulo de la galería, texto del código de vestimenta y los códigos de color que se muestran) se limitan en largo y se normalizan en el servidor, y el sitio los muestra siempre con `textContent`, nunca como HTML (probado con `<img onerror>` y `<script>` en cada uno).
- Los colores se guardan solo si son `#rrggbb` (el resto se descarta o vuelve al valor de la propuesta), así que no se puede colar CSS ni código a través de un color. El color del código de vestimenta se aplica como propiedad de estilo, no como texto de una hoja de estilos.
- La textura del fondo es una **lista cerrada** de 6 dibujos propios (`/texturas/*.svg`, sin scripts ni enlaces externos); cualquier otro nombre, ruta o texto se ignora, y la intensidad se recorta entre 5 y 100. Los SVG se cargan como máscara de imagen (nunca se abren como página) desde el propio sitio, así que la política CSP (`img-src 'self'`) no cambia.
- Una instalación nueva (sin carpeta de datos) arranca bien con los valores por defecto: hay una prueba que lo verifica.

## Actualización 1.20.0: sobre a gusto, frase entre mapas y «personas»

- Un endpoint nuevo, `POST /api/admin/sobre-estilo`, protegido como el resto de los de administración (contraseña por cabecera, bloqueo por intentos y restricción a la red local si está activa). Solo guarda un color `#rrggbb`, una textura de la **lista cerrada** de 6 dibujos propios (cualquier otro nombre o ruta, como `../../etc/passwd`, se ignora) y una intensidad recortada entre 5 y 100; mandar un solo campo no borra los otros.
- La **frase entre los mapas** vive en `textos-sitio` (hasta 400 caracteres) y su tipografía en `tipografia`: fuente solo con letras, números y espacios, tamaño recortado (10–48), color solo `#rrggbb`. El sitio la muestra con `textContent` (nunca como HTML) y `white-space: pre-line`, así que un `<img onerror>` escrito ahí aparece como texto; probado, igual que una palabra larguísima (no ensancha la página).
- Los textos con **Enter** (frase, texto visible y oculto de regalos, subtítulo de la galería, hora de la ceremonia civil) se normalizan en el servidor: `\r\n` pasa a `\n`, no más de un renglón en blanco seguido y se recortan los bordes, con tope de largo (400 / 300 / 500 / 1000 / 500).
- `/?sinsobre=1` solo oculta la pantalla del sobre en el navegador de quien lo escribe: el sobre es decorativo y todo el contenido del sitio ya es público, así que no hay nada protegido que se saltee. No cuenta como «sobre abierto» ni arranca la música.
- `POST /api/rsvp` acepta ahora `personas` (total contando al invitado): entero ≥ 1 o se rechaza con 400; se acota a 20 acompañantes y se guarda como `acompanantes` (personas − 1), por lo que el límite de cada grupo sigue contando personas reales. Sin `personas` se sigue aceptando `acompanantes` (formularios viejos). La limitación de pedidos por IP no cambia.
- No se agregaron recursos externos: las texturas siguen saliendo de `/texturas/*.svg` del propio sitio y la política de seguridad de contenido no cambia.

## Actualización 1.21.0: encuadre de las fotos del sobre, altura y tamaño en computadora

- Un endpoint nuevo, `POST /api/admin/sobre-fotos/posicion`, protegido como el resto de los de administración (contraseña por cabecera, bloqueo por intentos y restricción a la red local si está activa). Recibe el nombre de una foto **que ya esté en la lista del sobre** (cualquier otro valor, incluidos rutas como `../../etc/passwd`, listas u objetos, da 404 y no guarda nada) y dos porcentajes: se recortan a 0–100 con un decimal, un valor que no es número conserva el anterior y mandar un solo eje no toca el otro. El nombre de archivo nunca se usa para leer ni escribir en el disco en este endpoint; solo es la clave del encuadre.
- El encuadre se guarda por nombre de archivo y se limpia solo: al quitar una foto se borra el suyo, al leer la configuración se descartan los de fotos que ya no existen o con formato raro, y un encuadre en 50/50 no deja nada guardado.
- `sobreFotosAltura` (0–100) y `escalaPc` (100–150) se guardan por `/api/admin/textos`, siempre como enteros recortados al rango; un valor que no es número deja el anterior. En el sitio llegan como números a una propiedad de CSS (`--sube-n`, `--escala-pc`) y a `object-position` ya validados como números (nunca como texto del usuario), así que no hay forma de inyectar estilos o HTML por ahí. Probado con valores raros guardados a mano en el archivo de configuración.
- No se agregaron recursos externos ni cambia la política de seguridad de contenido.

## Actualización 1.22.0: encuadre vertical libre y videos en el panel

- `POST /api/admin/sobre-fotos/posicion` acepta ahora un dato más, `d` (cuánto se sube o baja la foto más allá de su borde): siempre un número recortado a ±70 con un decimal; cualquier otra cosa (texto, `null`, objetos, listas) se ignora y conserva el valor anterior. Sigue protegido igual que el resto del panel (contraseña por cabecera, bloqueo por intentos) y sigue sin tocar el disco: el nombre de la foto solo es la clave del encuadre y debe estar en la lista del sobre.
- En el sitio, `d` llega como número a una expresión de CSS (`calc`) armada con la librería del propio navegador (nunca como texto del usuario), así que no hay forma de inyectar estilos o HTML por ahí. Probado con valores raros guardados a mano en el archivo de configuración.
- **Videos de invitados en el panel:** la lista ya no incorpora el video a la página (no se carga ni se reproduce nada): muestra un enlace con un ícono. El nombre de quien lo subió y la extensión (solo letras y números, hasta 5) se escriben con `textContent`; el enlace usa el nombre de archivo codificado (`encodeURIComponent`), `target="_blank"` con `rel="noopener"`. Probado con un nombre que trae HTML.
- No se agregaron recursos externos ni cambia la política de seguridad de contenido.

## Actualización 1.23.0: descargar fotos y videos de invitados

- **Pedir la descarga** (`POST /api/admin/descargas`) exige la contraseña por cabecera, igual que el resto de `/api/admin` (bloqueo por intentos, y 404 desde Internet si está activado «solo red local»). Del pedido solo se leen nombres de archivo: **nunca se arma una ruta con lo que llega**. Cada nombre se busca en la lista guardada (`fotos.json`) y, si está, se resuelve dentro de la carpeta de fotos; un nombre con `/`, `..`, ruta absoluta, caracteres nulos o que no esté en la lista se ignora (probado con `../../etc/passwd`, `/etc/passwd`, rutas de Windows y entradas raras guardadas a mano). A lo sumo 20 000 nombres por pedido y 200 KB de cuerpo.
- **El enlace de descarga** es la única parte que no lleva la contraseña: un navegador no puede mandar cabeceras al seguir un enlace, y la contraseña **nunca va en una URL** (quedaría en historiales y registros). En su lugar el servidor entrega un código al azar de 192 bits (`crypto.randomBytes`, 32 caracteres), guardado solo en memoria, que **vence a los 5 minutos, sirve hasta 3 veces** (por si se corta la primera), **hay a lo sumo 20 vivos** y solo abre **ese ZIP** (la lista de archivos queda fijada al pedirlo: lo que se suba o borre después no lo cambia). No sirve para ningún otro endpoint (probado). Un reinicio del add-on los borra. **Compromiso aceptado:** durante esos minutos, quien tenga el enlace puede bajar ese ZIP sin contraseña; el código aparece en la URL (y por eso en el registro de acceso de un proxy, si lo hay), pero ya vence solo y no se puede adivinar. Con «solo red local» activado, el enlace tampoco funciona desde Internet.
- **Los archivos no se modifican ni se copian a ningún lado:** se leen en partes de 256 KB y se envían; el ZIP no se escribe en el disco ni se junta en memoria (5 GB armados con +3 MB de memoria). Un archivo que desaparece a mitad de camino se saltea. Las respuestas llevan `Cache-Control: no-store`.
- **Nombres dentro del ZIP:** el nombre que el invitado escribió se usa solo como nombre de carpeta, después de quitarle barras, `..`, signos prohibidos en Windows, caracteres de control y nombres reservados (`CON`, `NUL`…), y recortado a 60 caracteres; no puede salir de su carpeta al descomprimir («zip slip»). Los nombres repetidos reciben un número en vez de pisarse.
- **Una foto sola** se baja con un enlace común a `/fotos-subidas/…` (que ya era público por diseño, con nombres imposibles de adivinar y política de seguridad que impide ejecutar nada); no hay endpoint nuevo.
- **En el panel,** el nombre del invitado y los avisos del servidor se escriben con `textContent`; los nombres de archivo van codificados en los enlaces. Sin dependencias nuevas (el ZIP está escrito a mano con `zlib`/`stream` de Node) ni recursos externos; la política de seguridad de contenido no cambia.

## Actualización 1.24.0: borrar varias fotos y videos de invitados

- `POST /api/admin/fotos/borrar` exige la contraseña por cabecera y queda bajo `/api/admin` (bloqueo por intentos; 404 desde Internet con «solo red local»; sin caché). Recibe solo nombres de archivo (hasta 20 000, 200 KB de cuerpo): **solo se borran los que están en la lista guardada**, y el archivo se elimina únicamente si su nombre es un nombre simple, nunca una ruta. Probado con `../`, rutas absolutas, archivos sueltos en la carpeta que no están en la lista y una entrada manipulada de la lista: no se borra nada fuera de lo pedido ni fuera de la carpeta de fotos.
- El borrado **no se puede deshacer**. Para evitar accidentes, el panel muestra la cantidad y el peso, y desde 10 archivos exige escribir BORRAR; es una protección del panel (el servidor, como el borrado de una sola foto, confía en quien tiene la contraseña).
- Sin dependencias ni recursos externos nuevos; la política de seguridad de contenido no cambia.

## Detalle de lo corregido

**1. Subidas.** Antes la extensión salía del nombre que mandaba el navegador. Ahora sale de una lista cerrada (JPG, PNG, GIF, WEBP,
HEIC, AVIF, BMP; MP4, MOV, WEBM, M4V, 3GP, AVI, MKV, MPG, OGV; audio MP3, M4A, AAC, OGG, WAV, FLAC). Si la extensión no es válida se
usa la que corresponde al tipo, y si tampoco se rechaza. SVG y HTML nunca se aceptan. Los nombres de archivo usan 64 bits de
aleatoriedad criptográfica (imposibles de adivinar). Además, todo lo que se sirve desde `/fotos-subidas` y `/media` lleva
`Content-Security-Policy: default-src 'none'; sandbox` y `nosniff`: aunque hubiera un archivo peligroso ya guardado, el navegador no ejecuta scripts.

**2. Contraseña.** Comparación en tiempo constante (SHA-256 + `timingSafeEqual`). Tras 10 intentos fallidos desde una misma IP se bloquea
15 minutos (también contando los intentos hechos por la ruta pública de la galería). Si la contraseña es `cambiame` o tiene menos de 8
caracteres, el panel muestra un aviso rojo y el log del add-on también.

**3. Dependencias.** `multer ^2.0.2`, `express ^4.21.2`, `qrcode ^1.5.4`, imagen `node:22-alpine` (LTS) y `NODE_ENV=production`.
*No pude ejecutar `npm audit` (el registro de npm está bloqueado en mi entorno)*; conviene correrlo vos: en la terminal del add-on, `npm audit --omit=dev`.

**4–6.** Contraseña solo por cabecera `x-admin-password` (las descargas y los QR ahora se piden con `fetch` y se muestran como archivo temporal
del navegador). `trust proxy` acotado a redes locales (`loopback, linklocal, uniquelocal`). Cabeceras: CSP (`connect-src 'self'` impide que
un script inyectado mande datos a otro sitio; también `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`),
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y HSTS cuando la conexión es HTTPS.

**7–8, 10–11, 15.** Reserva de 2 GB de disco libre (las subidas devuelven "sin espacio" antes de llenarlo), tope de 100 MB para el registro
de visitas, máximo 5000 confirmaciones, acompañantes 0–20, `asistencia` solo `si`/`no`. Límites por IP: 60 confirmaciones/hora, 1000 subidas/hora,
60 consultas de clima/minuto, 30 códigos de grupo inválidos/15 min. Escritura atómica (archivo temporal + renombrado); si un archivo aparece
dañado se guarda una copia `*.corrupto-*` en `/data` antes de continuar, en vez de pisarlo.

## Lo que ya estaba bien

- Autenticación por cabecera (no por cookies): no hay riesgo de CSRF.
- Sin base de datos SQL, sin ejecución de comandos, sin lectura de rutas dadas por el usuario (los nombres de archivo salen de la lista/metadatos; la unidad de disco se valida con expresión regular).
- Todo lo que escriben los invitados (nombre, mensaje, "subido por", datos de estadísticas) se muestra en el panel **escapado** o con `textContent`.
- Enlaces externos con `rel="noopener"`; identificador de visitante con `crypto.randomUUID()`; JSON limitado a 200 KB; tamaño máximo por archivo.

## Riesgos que quedan (decisiones tuyas)

1. **Contraseña única, sin 2FA.** Es la única defensa del panel. Usá una frase larga (12+ caracteres) y única.
2. **HTTP sin cifrar.** Si entrás al panel por `http://IP-local:8099`, la contraseña viaja sin cifrar por tu red. Entrá siempre por la URL `https://…duckdns.org`.
3. **CSP con `'unsafe-inline'`.** El sitio usa scripts y estilos dentro del HTML, así que la CSP no bloquea scripts inyectados en línea (sí bloquea el envío de datos a otros sitios). Cerrarlo del todo exigiría mover el código a archivos aparte.
4. **Privacidad de las visitas.** Se guarda IP, navegador y ubicación aproximada, y la IP se consulta a servicios externos (ipwho.is y geojs.io). Mantené encendido el aviso del pie del sitio (Panel → Avisos visibles). En Uruguay rige la Ley 18.331 de protección de datos personales; esto no es asesoramiento legal.
5. **`/api/config` es público** e incluye el "mensaje oculto" de regalos (datos bancarios, si los pusiste). Está oculto en pantalla hasta que el invitado lo pide, pero no es secreto.
6. **El contenedor corre como root** y el add-on tiene `media:rw` (escritura en toda la carpeta `/media`). Es lo habitual en add-ons de Home Assistant y lo necesita para guardar en discos externos.
7. **Embeber el sitio en un iframe** desde otro dominio (por ejemplo una tarjeta "web page" de Home Assistant) ahora está bloqueado por `X-Frame-Options`/`frame-ancestors`.
8. **Fotos ya subidas** antes de esta versión usan nombres menos aleatorios. Para revisar si hay archivos raros guardados: `find /media/boda_fotos -type f ! -iregex '.*\.\(jpe?g\|png\|gif\|webp\|heic\|heif\|avif\|bmp\|mp4\|m4v\|mov\|webm\|3gp\|3g2\|avi\|mkv\|mpe?g\|ogv\)'`. Si aparece algo, borralo.
9. **Límites por IP y redes compartidas.** En el salón todos los invitados comparten la IP del WiFi; los límites están puestos con margen para eso.
10. **Backups.** Incluí el add-on en las copias de seguridad de Home Assistant (`/data` tiene confirmaciones, configuración y estadísticas).

## Cómo se verificó y qué no se pudo

- 47 pruebas automáticas sobre `server.js` (con un Express simulado, porque en mi entorno no se puede instalar el real): pasan todas. Las mismas pruebas contra la 1.10.0 fallan 31, lo que confirma que los problemas existían.
- La política CSP real se cargó en Chromium con el sitio público y el panel: 0 violaciones, 0 errores de JavaScript.
- 1.24.0 (borrar elegidas): 8 pruebas nuevas sobre `server.js` y 22 en el panel con Chromium (más las de la 1.23.0, que siguen pasando).
- 1.23.0 (descargas): 38 pruebas nuevas sobre `server.js` más una en «solo red local», y 38 en el panel con Chromium. El ZIP se verificó con `unzip -t` y con Python (byte a byte contra los originales), incluido un ZIP64 real de 5 GB. **No** se probó con Express real, con un celular físico, ni abriendo el ZIP en el Explorador de Windows o el Finder.
- **No** se probó contra el Express/multer reales instalados, **no** se ejecutó `npm audit`, **no** se hizo un escaneo de red ni de puertos, y **no** se revisó la configuración de tu router, DuckDNS, certificados ni Home Assistant. Después de reconstruir, subí una foto de prueba desde un celular y confirmá una asistencia para comprobar que todo sigue andando.
