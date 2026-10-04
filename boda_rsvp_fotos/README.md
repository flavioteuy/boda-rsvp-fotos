# Boda - RSVP y Fotos (Add-on de Home Assistant)

Sitio web con dos páginas:
- **Confirmar asistencia** (RSVP): nombre, si asiste, acompañantes, mensaje.
- **Galería de fotos**: los invitados suben fotos y las ven todas.

Los datos (confirmaciones y fotos) quedan guardados en `/data`, la carpeta
persistente del add-on: sobreviven a reinicios y actualizaciones del NUC.

## Cómo actualizar a una versión nueva (leer primero)

El add-on **copia los archivos dentro de su imagen al construirse**
(`Dockerfile`: `COPY server.js`, `COPY public` y `COPY panel`). Por eso, después de
reemplazar los archivos en la carpeta `addons/boda_rsvp_fotos`, **reiniciar
no alcanza**: el add-on seguiría mostrando la versión anterior.

1. Reemplazá los archivos en `addons/boda_rsvp_fotos` (incluidas las
   carpetas `public` **y `panel`**; esta última es nueva desde la 1.12.0).
2. **Ajustes → Complementos → Tienda de complementos → ⋮ → Recargar.**
3. Abrí "Boda - RSVP y Fotos": si el número de versión cambió aparece el
   botón **Actualizar**; si es el mismo número, **Reconstruir**. Tocá el que
   aparezca y esperá a que termine.
4. Iniciá el add-on y recargá el navegador con Ctrl+F5.

**Muy importante al copiar:** si copiás la carpeta nueva *encima* de la vieja, los
archivos que ya no existen **no se borran**. Por ejemplo, `public/admin.html` (el
panel viejo de antes de la 1.12.0) sigue ahí y mostraría un panel desactualizado, sin
las opciones nuevas. Desde la 1.14.0 el servidor **nunca** sirve ese archivo (da 404),
pero conviene borrarlo (el Log del add-on lo avisa). Lo más limpio: borrá la carpeta
`boda_rsvp_fotos` vieja y copiá la nueva completa (tus datos no se tocan, están en `/data`).
Para saber si estás en el panel nuevo: arriba dice **«Panel de la versión 1.14.0»** y
hay un menú **«Ir directo a una sección»**.

Los datos (confirmaciones, fotos, configuración) están en `/data` y no se
pierden al reconstruir. Nota: en secciones anteriores de este README se
decía "alcanza con reiniciar"; era incorrecto, siempre hay que reconstruir.

## 1. Copiar el add-on a Home Assistant

La forma más simple, sin usar GitHub:

1. Instalá el add-on **"SSH & Web Terminal"** o **"Samba share"** desde el
   Add-on Store de Home Assistant (si todavía no los tenés).
2. Con Samba, entrá a `\\<ip-de-tu-ha>\addons` desde tu compu (o `smb://` en
   Mac/Linux), o por SSH copiá la carpeta al mismo lugar.
3. Copiá toda la carpeta `boda_rsvp_fotos` (tal cual, con ese nombre) dentro
   de la carpeta `addons/` de Home Assistant.
4. En Home Assistant: **Ajustes → Complementos → Tienda de complementos**,
   tocá los tres puntos arriba a la derecha → **Recargar**.
5. Debería aparecer una sección "Add-ons locales" con **"Boda - RSVP y
   Fotos"**. Instalalo.

## 2. Configurar

Antes de arrancarlo, andá a la pestaña **Configuración** del add-on y
completá:

- `novia`, `novio`: los nombres que se muestran en la portada.
- `fecha_boda`: formato `AAAA-MM-DD`, ej. `2027-03-20`.
- `lugar_boda`: texto libre.
- `admin_password`: una clave para vos, que sirve para ver la lista de
  confirmaciones (ver punto 4).

Guardá y andá a la pestaña **Info** para iniciar el add-on ("Start").
Activá también "Iniciar al arrancar" si querés que levante solo con el NUC.

## 3. Probarlo localmente

Con el add-on iniciado, abrí en el navegador:

```
http://<ip-de-tu-home-assistant>:8099/
```

Deberías ver la página de RSVP, y en `/galeria.html` la galería.

## 4. Panel de administración

Desde la versión 1.12.0 el panel **ya no está en `/admin.html`** y el sitio
no tiene ningún link que lleve a él. Vive en una dirección secreta que sale
en el **Registro (Log)** del add-on al iniciarlo, con una línea así:

```
🔐 Panel de administración: entrá a  https://TU-DOMINIO/xxxxxxxxxxxx
```

(Ver sección 24 para elegir vos la dirección o limitarlo a tu red de casa.)
Entrás ahí con la contraseña `admin_password` que pusiste en la configuración del
add-on. Desde ahí podés, sin tocar código:

- Cambiar nombres, fecha, lugar y un mensaje de bienvenida.
- Elegir el estilo del sitio: **Clásico y romántico**, **Botánico y
  natural** o **Moderno y minimalista** (se aplica al toque en todo el sitio).
- Subir una foto de fondo/banner para la portada.
- Subir varias fotos de la pareja: se arma solo un slideshow con
  animación de transición (fundido + zoom suave) arriba del formulario
  de RSVP.
- Subir una canción de fondo (mp3): aparece un botoncito flotante con
  una nota musical para que cada visitante decida si la quiere escuchar
  (los navegadores no dejan poner música sola sin que la persona toque
  algo primero, así que ese botón es necesario).
- Ver la lista de confirmaciones recibidas, con el total de invitados
  (contando acompañantes).

Todo lo que subís (banner, fotos de la pareja, música) queda guardado en
`/data`, la misma carpeta persistente que ya usa el add-on.

## 5. Ubicaciones, cuenta regresiva y calendario

En "Ubicaciones y horarios" cargás la dirección del Registro Civil y del
salón, junto con un link de Google Maps de cada uno (se consigue con
"Compartir → Copiar link" desde la app o el sitio de Maps). En el sitio
se muestran como texto con la dirección, que al tocarlo abre el mapa.

Si configurás la fecha y la hora de inicio del evento, en la portada
aparece una cuenta regresiva en vivo (días, horas, minutos, segundos) y
dos botones: uno arma el evento en Google Calendar, el otro descarga un
archivo `.ics` que funciona con Apple Calendar, Outlook, etc.

Nota: el `.ics` y el link de Google Calendar usan la fecha y hora tal
cual las cargaste, sin conversión de huso horario — pensado para
invitados que están en la misma zona horaria que el evento.

## 6. Código de vestimenta

En "Código de vestimenta" escribís una descripción libre (por ejemplo
"Formal, evitar el blanco") y opcionalmente algunos colores sugeridos en
formato hexadecimal (`#2c3e50, #a9784f`), que se muestran como circulitos
de color debajo del texto.

## 7. Grupos de invitados y códigos QR

En "Grupos de invitados y códigos QR" creás un grupo por cada tanda de
invitaciones que vayas a imprimir (familia de la novia, amigos, trabajo,
etc). Cada grupo genera:

- Un código único.
- Un link `https://tu-sitio/?grupo=CODIGO`.
- Una imagen QR lista para descargar e imprimir en la tarjeta de
  invitación.

Para que el QR apunte a la dirección correcta desde afuera, completá
antes el campo **"URL pública del sitio"** en la sección de Textos (por
ejemplo `https://boda-anaytomas.duckdns.org`), una vez que tengas el
reverse proxy con DuckDNS andando. Si no lo completás, el QR va a usar
la dirección interna del NUC, que solo funciona dentro de tu red.

Cuando alguien confirma asistencia entrando desde uno de esos links, la
confirmación queda etiquetada con ese grupo, y en "Confirmaciones
recibidas" vas a ver de qué grupo vino cada una, además del conteo de
confirmados por grupo en la propia sección de grupos.

## 5. Publicarlo afuera con tu DuckDNS

Ya tenés DuckDNS con acceso a Internet, así que lo más prolijo es:

1. Elegí un subdominio nuevo para la boda (DuckDNS permite varios
   subdominios con la misma cuenta), por ejemplo `boda-juanyana.duckdns.org`,
   y agregalo en el panel de DuckDNS apuntando a tu misma IP pública.
2. Si ya tenés un reverse proxy corriendo (por ejemplo el add-on
   **"NGINX Proxy Manager"** o **"NGINX Home Assistant SSL proxy"**), agregá
   un host nuevo:
   - Dominio: `boda-juanyana.duckdns.org`
   - Destino: la IP interna del NUC, puerto `8099`
   - Activá SSL (Let's Encrypt) para que sea `https://`.
3. Si **no** tenés reverse proxy todavía, la alternativa rápida es abrir el
   puerto `8099` en tu router hacia la IP del NUC, aunque lo ideal es meter
   un proxy con HTTPS por delante (los formularios de invitados van mejor
   con candado verde). Si querés, te ayudo a configurar NGINX Proxy Manager
   paso a paso.

No uses el "Ingress" nativo de Home Assistant para esto: Ingress exige que
el visitante esté logueado en tu Home Assistant, y tus invitados no van a
tener usuario ahí.

## Límites a tener en cuenta

- Es una solución liviana pensada para una boda (decenas/pocos cientos de
  invitados), no para tráfico masivo.
- Las fotos y confirmaciones se guardan en archivos JSON simples, no en una
  base de datos; para este uso es más que suficiente y fácil de respaldar
  (alcanza con copiar la carpeta `/data` del add-on).
- Tamaño máximo por foto: 25 MB (se puede cambiar en `server.js`,
  buscando `fileSize`).

## 8. Lo nuevo (fondo, tipografía, secciones configurables, etc.)

Casi todo lo que sigue se controla desde el panel de administración, sección por sección:

- **Fondo de la página**: una imagen de fondo distinta al color del tema.
- **Tipografía**: fuente y tamaño de los nombres de los novios y del mensaje
  de bienvenida, a elección entre varias fuentes.
- **Banner recortable**: subís la foto y después la arrastrás dentro del
  recuadro para elegir qué parte se ve como fondo de la portada.
- **Pantalla de sobre**: al entrar al sitio, se ve un sobre con un sello de
  cera con las iniciales de los novios; se abre solo tocándolo. Está hecho
  con CSS (no hace falta subir ninguna imagen para esto).
- **Orden y visibilidad de secciones**: cuenta regresiva, slideshow,
  ubicaciones, clima, dress code, "nuestra historia", testigos, regalos y
  confirmación se pueden prender/apagar y reordenar con flechas, cada una
  con una imagen de cabezal opcional.
- **Mapas**: las direcciones del Registro Civil y del salón ahora también
  muestran un mapa embebido (usa el texto de la dirección para buscar el
  lugar en Google Maps, no hace falta clave de API).
- **Scroll suave y lento**: activado en computadoras (en celular se deja el
  scroll táctil normal, que ya es fluido).
- **Galería con "coming soon"**: la subida de fotos/videos de invitados se
  puede habilitar o deshabilitar; mientras está apagada se muestra el
  mensaje que configures. Pensado para activarlo el día de la boda.
- **Videos en la galería**: además de fotos, ahora se pueden subir videos
  (hasta 500 MB por archivo).
- **Testigos**: 4 testigos configurables con nombre, rol y foto opcional.
- **Regalos**: texto visible + un mensaje oculto (por ejemplo los datos de
  la cuenta bancaria) que se revela al tocar un botón.
- **Límite por grupo**: a cada grupo de invitados le podés poner un tope de
  personas; si se llega al límite, el formulario de confirmación rechaza
  nuevas confirmaciones de ese grupo con un mensaje explicativo.
- **Nombres invitados por grupo**: al cargar un grupo podés escribir los
  nombres de a quién va dirigida esa invitación; al entrar por ese link o
  QR, el sitio muestra "Para: [nombres]" en la pantalla del sobre.
- **Textos de confirmación**: el título y la descripción de la sección de
  RSVP también son configurables.

### Importante: tamaño máximo de subida en tu proxy

Como ahora se pueden subir videos grandes, si en algún momento configurás
un reverse proxy (NGINX Proxy Manager, NGINX, Cloudflare, etc.) vas a tener
que **aumentar el límite de tamaño de subida** ahí también, o los videos
grandes van a fallar con error 413 aunque el add-on los acepte. En NGINX
Proxy Manager, por ejemplo, esto se agrega en la configuración avanzada del
host:

```
client_max_body_size 500M;
```

## 9. Cambios de esta versión (1.1.0)

### Botón de música arreglado
Ahora es un botón flotante circular, siempre visible en la esquina inferior
derecha (con ícono de parlante), fijo en pantalla sin importar cuánto
scrolleás. Además el sitio ahora es de **una sola página** (Invitación /
Galería son pestañas, no páginas distintas), así que la música **no se
corta** al pasar de una a la otra — es el mismo reproductor todo el tiempo.

### Tipografía: negrita, cursiva, color y muestra en vivo
En el panel, "Tipografía" ahora tiene checkboxes de **negrita** y
**cursiva**, un selector de **color propio** (si lo dejás apagado, usa el
color automático del tema), y muchas más fuentes agrupadas por estilo
(serif elegantes, mayúsculas clásicas, manuscritas/cursivas, sans-serif
modernas). Debajo hay una **muestra en vivo** con los nombres y el mensaje
de bienvenida reales, que podés alternar entre fondo claro/oscuro para ver
cómo se lee en cada caso — se actualiza mientras tipeás, sin necesidad de
guardar primero.

### Sobre más grande y con textura opcional
El sobre de bienvenida ahora ocupa casi todo el ancho de pantalla (se
adapta al tamaño del celular). En "Sobre de invitación" podés subir una
imagen (papel, lino, acuarela, etc.) para usarla como textura tanto del
cuerpo como de la solapa del sobre; sin imagen queda el papel blanco liso
de antes.

### Estadísticas de accesos
Nueva sección "Estadísticas de accesos" en el panel. Por cada visita al
sitio se guarda (en `/data`, nunca se comparte con nadie): fecha y hora,
IP, ubicación aproximada (país/ciudad, por geolocalización de IP, gratis y
sin clave), proveedor de internet, navegador y versión, sistema operativo,
tipo de dispositivo y modelo cuando el navegador lo informa, si se abrió
desde Instagram/WhatsApp/Facebook, tamaño de pantalla, idioma, zona
horaria, tipo de conexión, si vino de un link con `?grupo=`, tiempo que
estuvo en el sitio, cuánto scrolleó, qué secciones miró y qué botones
tocó (RSVP enviado, mapa abierto, calendario agregado, etc). El panel
muestra resúmenes (por país, navegador, dispositivo, etc.) y una tabla de
los últimos accesos, más botones para descargar todo en CSV o JSON. Tus
propias entradas al sitio desde el navegador donde abriste el panel no se
cuentan. Esto consulta un servicio externo gratuito (ipwho.is, con
respaldo en geojs.io) para la ubicación; si el NUC no tiene salida a
internet en ese momento, la visita se guarda igual, sin ubicación.

**Importante:** avisale a tus invitados, o al menos dejalo mencionado en
alguna parte del sitio (ya hay una línea chica en el pie de página), que se
registran estadísticas de acceso — es una buena práctica aunque sea un
sitio privado para la boda.

### Fotos y videos en un disco USB externo
Nueva sección "Almacenamiento de fotos y videos" en el panel:

1. Conectá el disco USB al NUC y formateało (ext4, exFAT o NTFS andan
   bien). Para que Home Assistant OS lo monte solo necesitás el add-on
   **"Mount It!"** (o similar) desde el Add-on Store — configuralo para que
   monte el disco dentro de `/media/nombre-que-elijas`.
2. En el panel del sitio de la boda, en "Almacenamiento de fotos y videos",
   tocá "Volver a detectar discos" y elegí esa unidad en el desplegable.
   El sitio prueba que pueda escribir ahí antes de guardarlo.
3. De ahí en más, todas las fotos y videos que suban los invitados van
   directo al disco externo. Las fotos que ya estaban guardadas en el
   almacenamiento interno se siguen mostrando igual (el sitio busca en
   los dos lugares).

Esto necesitó un cambio en `config.yaml` (el add-on ahora pide acceso a
`/media`), así que para que funcione tenés que **reconstruir el add-on**
después de actualizar los archivos, no alcanza con reiniciarlo.

### Fondo de página también en la galería
Como ahora es una sola página, el fondo configurado se ve igual en la
pestaña de Galería que en la de Invitación — ya no hace falta nada
adicional de tu parte para esto.

## 10. Después de esta actualización

Como se agregó una dependencia nueva (para GPS/estadísticas no hace falta
ninguna, pero el `config.yaml` cambió para pedir acceso a `/media`), hacé
lo siguiente al actualizar:

1. Reemplazá los archivos como siempre (ver sección 7).
2. **Reconstruí** el add-on (no alcanza con solo reiniciar), para que tome
   el `config.yaml` nuevo.
3. Iniciá y revisá el log por si hay errores.
4. Entrá al panel: las secciones nuevas (Sobre, Almacenamiento,
   Estadísticas) van a mostrar los valores por defecto la primera vez.

## 11. Cambios de esta versión (1.2.0)

### Reiniciar estadísticas
En "Estadísticas de accesos" hay un botón rojo "Reiniciar estadísticas"
que borra todo el historial de accesos guardado (pide confirmación antes
de hacerlo, y no se puede deshacer).

### Tipografía de la fecha y el lugar
En "Tipografía" ahora hay un tercer bloque, "Fecha y lugar", entre
"Nombres de los novios" y "Mensaje de bienvenida" — es el texto que
muestra la fecha y el lugar debajo de los nombres en la portada. Tiene las
mismas opciones que los otros dos: fuente, tamaño, negrita, cursiva y
color propio. La muestra en vivo ahora incluye esta línea también.

### Tres formas de mostrar las secciones
En "Estilo del sitio → Aspecto de las secciones" ahora hay tres opciones:

1. **Con recuadro (fondo)**: como al principio — tarjetas blancas (o del
   color del tema) con sombra. Ahora además podés elegir un **color de
   fondo propio** para esas tarjetas.
2. **Sin recuadro**: el texto queda directamente sobre el fondo de la
   página, sin caja ni sombra (igual que antes).
3. **Solo borde fino**: nueva opción — las secciones quedan totalmente
   transparentes (se ve el fondo de la página a través) pero con un borde
   fino alrededor, del **color** y **grosor** que elijas.

Cada opción muestra únicamente los controles que le corresponden.

## 12. Cambios de esta versión (1.3.0)

Esta actualización **no cambia permisos** en `config.yaml` (el acceso a
`/media` ya se había agregado antes), así que alcanza con **reemplazar
los archivos y reconstruir** el add-on (ver "Cómo actualizar", arriba).

### Apertura del sobre arreglada
La animación de abrir el sobre tenía un defecto visual ("doble solapa"):
al girar la solapa en 3D, su cara trasera se veía reflejada por encima
del cuerpo del sobre. Se corrigió ocultando esa cara trasera
(`backface-visibility`) y haciendo que la solapa pase detrás del cuerpo
recién cuando ya giró casi del todo, en vez de en el mismo instante.

### Tipografía de título y texto de cada sección
En "Tipografía" hay dos bloques nuevos: **"Títulos de cada sección"**
(los encabezados como "Cómo llegar", "Clima esperado", etc.) y **"Texto
de cada sección"** (direcciones, horarios, descripciones). Cada uno tiene
fuente, tamaño, negrita, cursiva y color propio, con muestra en vivo. Si
dejás la fuente en "Usar la fuente general del sitio", siguen la
tipografía general.

### El "&" entre los nombres ya usa la fuente elegida
Antes el símbolo "&" entre los nombres de los novios se mostraba con la
fuente del texto general de la página en vez de con la fuente elegida
para los nombres. Ya se corrigió.

### El mapa se puede clickear directamente
En "Ubicaciones", antes solo el texto de la dirección llevaba al lugar
exacto en Google Maps; si tocabas la imagen del mapa incrustado, se abría
una búsqueda genérica. Ahora tocar el mapa también lleva directo al lugar
exacto (se agregó una capa invisible clickeable sobre el mapa).

### Privacidad de las fotos: cada invitado ve solo lo suyo
Antes la galería era pública: cualquiera veía las fotos y videos de
todos. Ahora **cada invitado ve únicamente lo que subió desde su propio
navegador/dispositivo**. Los novios/admin siguen viendo todo desde un
panel nuevo en "Fotos y videos subidos por invitados" (dentro del panel
de administración), donde también se puede **borrar** cualquier archivo.

Importante: las fotos que ya estaban subidas **antes** de esta
actualización no tienen guardado quién las subió, así que a partir de
ahora solo el panel de administración las va a poder ver (ningún
invitado las va a ver como "propias"). Podés revisarlas y, si querés,
volver a compartirlas manualmente, o simplemente dejarlas ahí — no se
pierden, solo dejan de aparecer en la galería pública de los invitados.

### Reiniciar estadísticas ya no corta el conteo
Se hizo más robusto el guardado de estadísticas (si el archivo llegara a
faltar, se recrea solo en vez de perder datos en silencio) y se subió
mucho el límite de eventos por minuto por IP: el límite anterior era
bastante bajo para una boda, donde **muchos invitados suelen compartir
la misma IP** (el WiFi del salón), lo que podía hacer que, tras una
racha de actividad de varios invitados a la vez, el conteo pareciera
"trabado". Ahora el límite es mucho más generoso.

### ¿Dónde quedan los archivos de fotos y videos?
Antes las fotos subidas por los invitados se guardaban "adentro" del
add-on, en una carpeta de datos que **no** es la misma que
`/addons/boda_rsvp_fotos` (esa es el código del sitio, no lo que suben
los invitados) — por eso costaba encontrarlas.

Desde esta versión, mientras no elijas un disco externo en "Almacenamiento
de fotos y videos", las fotos y videos se guardan por defecto en
**`/media/boda_fotos`**, una carpeta dentro de la carpeta compartida
**`media`** de Home Assistant — la misma que ya ves si entrás por Samba
o por el add-on "Archivos" (File editor / Samba backup). Ahí vas a
encontrar todo lo que suban los invitados, organizado en un solo lugar,
sin tener que tocar nada del panel. Si más adelante conectás un disco
USB externo y lo elegís desde el panel, las fotos nuevas se guardan ahí
en cambio (y las antiguas se siguen mostrando igual).

## 13. Cambios de esta versión (1.4.0)

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (ver "Cómo actualizar", arriba).

### El sitio ya no se queda con una versión vieja guardada en el navegador
Algunos cambios de la actualización anterior (como el "&" con la fuente
correcta) podían no verse porque el celular o la compu tenía guardada en
caché una copia vieja de `style.css`. A partir de esta versión el
servidor le dice al navegador que **siempre confirme con el add-on** si
hay una versión más nueva del HTML/CSS/JS antes de usar la que tiene
guardada, así que las próximas actualizaciones se ven solas. Si en tu
celular todavía ves algo viejo después de actualizar, probá recargar
manteniendo presionado el botón de recargar, o cerrar y volver a abrir
la pestaña del navegador.

### Clima dividido en dos secciones
Antes "Clima esperado" mezclaba el pronóstico real con el promedio
histórico en una sola caja confusa. Ahora son **dos secciones
independientes**, cada una con su propio título, orden y opción de
encender/apagar en "Orden y visibilidad de las secciones":

- **Clima actual**: el pronóstico de hoy y los próximos días (hasta una
  semana) en la ubicación configurada.
- **Clima histórico de la fecha**: el promedio de los últimos 5 años
  para el día del calendario de la boda (por ejemplo, "20 de marzo"),
  sin importar si la boda está cerca o lejos — es una referencia, no un
  pronóstico.

Ambas usan la misma ubicación configurada en "Ubicaciones, horarios y
clima".

## 14. Cambios de esta versión (1.4.1)

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba).

### El sobre se rompía al subir (o borrar) una textura
Encontré el motivo: al subir una textura para el sobre, el sitio agregaba
una "marca" (una clase interna) para usarla, pero al borrar la textura
nunca se sacaba esa marca ni el dato de la imagen vieja — el sobre
quedaba intentando mostrar una imagen que ya no existe, y se veía roto
(sin el degradado de fondo). Se corrigió en dos frentes:

1. Ahora, al borrar la textura, el sitio limpia correctamente esa marca.
2. Además, el sobre ahora siempre tiene el degradado de respaldo **debajo**
   de la textura, así que aunque una imagen de textura no cargue por
   cualquier motivo, el sobre nunca se queda "en blanco".

### Sobre el "&" que seguía sin la fuente correcta
El código del "&" entre los nombres está bien (usa la misma fuente que
elegiste para los nombres) — lo revisé de nuevo a fondo. Si en tu sitio
lo seguís viendo con otra letra incluso en una ventana nueva/incógnito,
lo más probable es que el **add-on todavía no tenga estos archivos
nuevos** (puede pasar si algún archivo no se terminó de copiar, o si se
reinició antes de que la copia terminara). Para confirmarlo sin dudas:

1. Abrí en el navegador `http://TU-IP-O-DUCKDNS:8099/style.css?chequeo=1`
   (o `/style.css` directo) y buscá con Ctrl+F (o el buscador del
   navegador) el texto `.and`. La línea tiene que terminar con
   `font-family: var(--fuente-nombres);` — si no aparece esa parte, el
   archivo en el add-on todavía es uno viejo.
2. Si es viejo: volvé a copiar **todos** los archivos de este zip a
   `/addons/boda_rsvp_fotos` (pisando los existentes, sin tocar la
   carpeta `/data`), y reiniciá el add-on de nuevo.
3. Si ya dice `font-family: var(--fuente-nombres);` y en el sitio se
   sigue viendo mal, avisame con una captura y lo sigo investigando
   desde ahí — en ese caso sería otra causa distinta a la que ya
   revisé.

## 15. Cambios de esta versión (1.5.0)

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba).

### Confirmaste que el CSS está bien — y aun así el "&" se ve distinto
Nos mandaste el `style.css` ya desplegado y efectivamente tiene la
regla correcta (`font-family: var(--fuente-nombres)`), así que **no es
un problema de caché ni de archivos viejos**. La explicación que queda,
y es bastante común en tipografía: muchas fuentes manuscritas/cursivas
(las de "Manuscritas / cursivas" en el selector) dibujan el símbolo "&"
con un diseño **deliberadamente distinto** al resto de las letras —
suele ser una elección de diseño de la propia fuente, no un error del
sitio. Por eso capaz ves los nombres en letra cursiva pero el "&" con
una forma más clásica/serif: es el mismo "&" que trae esa fuente.

En vez de seguir peleando con esto, agregué una solución directa:

**Nuevo campo "Símbolo entre los nombres"** en "Textos y nombres", justo
debajo de los nombres de los novios. Por defecto sigue siendo "&", pero
ahora podés cambiarlo por lo que quieras — por ejemplo **"y"** (algo muy
natural en español: "Soledad y Flavio"), o un "+". Al ser una letra
normal en vez de un símbolo especial, se va a dibujar siempre con el
mismo estilo que el resto del nombre, sin sorpresas. El cambio se ve
también en el sello de cera del sobre (las iniciales).

## 16. Cambios de esta versión (1.5.1)

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba).

### El "&" ahora se ve del tamaño que corresponde
Nos dijiste que preferís seguir usando "&" (no cambiarlo por "y"), así
que en vez de insistir con la solución anterior, ajusté el tamaño:
antes el "&" tenía un tamaño fijo chico, que quedaba desproporcionado si
elegías un tamaño de letra grande para los nombres. Ahora su tamaño se
calcula en proporción al tamaño de los nombres, así que va a verse
acompasado con el resto sea cual sea la fuente o el tamaño que elijas.
(El campo "Símbolo entre los nombres" sigue estando disponible en el
panel por si en algún momento lo querés usar, pero no hace falta
tocarlo.)

### El sobre cerrado, más "sobre" y menos tarjeta plana
Al arreglar el problema de la "doble solapa" les había sacado también
los pliegues laterales decorativos del cuerpo del sobre (esos triángulos
sutiles que simulan los dobleces de un sobre real) — pensando que podían
estar relacionados con el glitch, cuando en realidad el glitch era solo
de la solapa (la parte que gira). Eso hacía que el sobre cerrado se
viera como una tarjeta lisa en vez de un sobre. Ya los repuse: el cuerpo
del sobre nunca gira, así que no tienen relación con el problema
anterior, y le devuelven el aspecto de sobre plegado. También reforcé
un poco la sombra entre la solapa y el cuerpo para que se note mejor
dónde termina una y empieza el otro.

## 17. Cambios de esta versión (1.5.2)

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba).

### El "&" ahora respeta el color que elijas para los nombres
El agrandado del "&" de la versión anterior le había dejado, sin
querer, un color dorado fijo cuando no elegías un "color propio" para
los nombres (en vez de heredar el mismo color que usan los nombres, que
por ejemplo es blanco arriba del banner). Ya está corregido: el "&"
ahora usa exactamente el mismo color que los nombres — si le ponés un
color propio a los nombres en "Tipografía", el "&" lo sigue
automáticamente; si no le ponés ninguno, toma el color que le
correspondería a los nombres en ese lugar (blanco sobre el banner,
oscuro sin banner), en vez de quedarse siempre en dorado.

### La solapa del sobre ya no se ve "flotando" más arriba
Era un problema de cómo dibujan algunos navegadores la sombra de un
elemento recortado en forma de triángulo (`clip-path`): en vez de seguir
la forma del triángulo, la sombra se dibujaba sobre el rectángulo
invisible completo que contiene ese triángulo, y ese rectángulo es más
alto que el triángulo visible — por eso se veía como si la solapa
sobresaliera del sobre. Cambié la forma de dibujar esa sombra
(`filter: drop-shadow` en vez de `box-shadow`) para que ahora sí siga
el contorno real del triángulo.

## 18. Cambios de esta versión (1.6.0) — revisión de diseño (UX/UI)

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba). Si el navegador muestra algo viejo, recargar
con Ctrl+F5 (o abrir en una ventana privada).

Esta vez se revisó la página **renderizada de verdad** (escritorio y
celular, sobre cerrado / abriéndose / abierto, con y sin textura) antes
de tocar el código, y se corrigió lo que se vio.

### El sobre: causa real del problema
Lo que se veía "roto" no era una sombra: la solapa nacía 72 px **por
encima** del cuerpo del sobre (la solapa empezaba en el 0 % de la altura y
el cuerpo en el 15 %), y además el cuerpo dibujaba su propia "V" — es
decir, había **dos solapas**. Al abrirse, la solapa giraba mostrando la
cara de atrás, que estaba oculta, y directamente desaparecía.

Se rehízo con la geometría de un sobre real:
- Un solo rectángulo; la solapa nace exactamente en su borde superior y
  su punta coincide con el vértice de los pliegues del frente.
- Frente con pliegues laterales e inferior, con su sombra.
- La solapa tiene **dos caras** (afuera y adentro): al abrirse se ve el
  interior del sobre, y queda abierta hacia arriba.
- Asoma una **carta** con los nombres antes de pasar a la portada.
- El sobre se adapta al alto de la pantalla (también celulares chicos y
  apaisados) y la textura se aplica igual a todas sus partes.
- Se puede abrir también con el teclado (Enter / espacio).

### El "&" entre los nombres
- Ahora sigue a los nombres en **fuente, negrita, cursiva y color**
  (antes seguía la fuente pero no la negrita/cursiva, y por eso podía
  verse "distinto").
- Tiene sus propios controles en el panel: **Tipografía → Símbolo entre
  los nombres** (fuente, tamaño como % de los nombres y color propio).
  Sin tocar nada, se ve igual que los nombres.
- Se mantiene el símbolo "&" (o el que pongas en "Textos y nombres").

### Portada y consistencia visual
- Velo oscuro en degradado sobre la foto (más oscuro donde va el texto) y
  sombra suave en el texto: se lee aunque la foto sea clara.
- Espaciado parejo entre nombre, símbolo y nombre; filete que separa
  nombres de fecha/lugar; el mensaje de bienvenida ya no deja una palabra
  suelta en la última línea.
- Todos los títulos de sección quedan centrados y con el mismo adorno;
  ubicaciones, clima, vestimenta, regalos y confirmación se alinean con
  ese criterio.
- Botones y campos usan la misma tipografía del sitio; botones de
  pestañas más grandes para tocar con el dedo; textos del clima y de la
  cuenta regresiva más grandes.
- Contraste: el rosa de los botones del tema clásico es un poco más
  profundo para que el texto blanco se lea, y el pie de página más
  oscuro.

## 19. Cambios de esta versión (1.7.0)

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba). Recargar con Ctrl+F5 si el navegador muestra
algo viejo.

### Sello de lacre realista y con color configurable
- El sello del sobre ahora es un **sello de cera**: borde irregular
  como de cera derretida, aro en relieve, centro hundido, **iniciales
  grabadas en relieve** y brillo. Al abrir el sobre se desprende y
  desaparece.
- El color se elige en el panel: **Sobre de invitación → Sello de
  lacre** (hay una vista previa en vivo y un botón "Rojo lacre" para
  volver al color de fábrica). Las luces y sombras se calculan solas,
  así que funciona con cualquier color (rojo, azul, verde, dorado...).
- Las iniciales usan la misma fuente que los nombres.

### Avisos que se pueden encender y apagar
Nueva tarjeta en el panel: **Avisos visibles en el sitio**, con dos
interruptores (vienen encendidos):
- El aviso de privacidad de la galería ("Por privacidad, cada invitado
  ve solamente las fotos y videos que subió…").
- El texto del pie sobre estadísticas de acceso ("Este sitio registra
  estadísticas de acceso…").

Apagar el aviso de privacidad **no cambia** el funcionamiento: cada
invitado sigue viendo solo lo que subió; solo deja de mostrarse el
texto explicativo. Lo mismo con las estadísticas: el registro
sigue activo, solo se oculta el texto.

## 20. Cambios de esta versión (1.8.0) — sellos

Tampoco cambia permisos en `config.yaml`: alcanza con reemplazar los
archivos (hay un archivo nuevo: `public/sello.js`) y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba).
Recargar con Ctrl+F5 si el navegador muestra algo viejo.

### Dos tipos de sello, cada uno con su color
En el panel: **Sobre de invitación → Sello del sobre**.
- **Lacre de cera**: sello de cera con labio grueso en relieve, centro
  liso hundido, aro fino, iniciales realzadas, brillos y sombras. Tiene
  tres formas de borde: *Ondulado*, *Redondo y liso* e *Irregular, con
  gotas*.
- **Clásico (disco liso)**: el sello blanco perlado de antes, ahora con
  color configurable. Si elegís un color oscuro, las iniciales pasan a
  ser claras automáticamente.
- Cada tipo recuerda su propio color; hay un botón "Color de fábrica" y
  una vista previa en vivo. Se guarda con "Guardar sello".

### Lo que se corrigió del sello de lacre
- **Las letras ya no se salen del centro liso**: las iniciales se miden
  y se achican solas hasta entrar dentro del centro (también con
  fuentes anchas o con nombres largos).
- **Bordes nítidos, sin pixelado**: el sello ahora es 100 % vectorial
  (degradados, trazos y máscaras). Se sacaron los filtros de ruido
  que hacían el borde "granulado" en algunas pantallas.
- Los brillos y sombras son blancos/negros semitransparentes, así que se
  ven bien con cualquier color de cera.

## 21. Cambios de esta versión (1.9.0) — tamaño del sello configurable

Sin cambios de permisos en `config.yaml`: alcanza con reemplazar los
archivos y **reconstruir** el add-on (no alcanza con reiniciar: ver "Cómo actualizar", arriba). Recargar con Ctrl+F5 si el navegador muestra
algo viejo (el `?v=1.9.0` de `style.css` y `sello.js` fuerza la descarga).

- En el panel: **Sobre de invitación → Sello del sobre → Tamaño del
  sello**. Deslizador de **50 % a 200 %** (100 % = tamaño de siempre),
  con botón **"Tamaño normal"**.
- El tamaño aplica a los dos tipos de sello (lacre y clásico) y se guarda
  junto con el resto de la configuración del sello ("Guardar sello").
- La vista previa del panel ahora es un **mini-sobre a escala real**, así
  el sello se ve en proporción al sobre y no suelto: lo que ves ahí es lo
  que verán los invitados.
- El sello siempre queda centrado sobre la punta de la solapa, se agranda
  o achica junto con las iniciales (que se siguen ajustando dentro del
  centro liso) y desaparece igual al abrir el sobre.

## 22. Cambios de esta versión (1.10.0) — ícono y título de la pestaña

**Cómo actualizar:** ver "Cómo actualizar" al principio de este README.
Hay que **reconstruir** el add-on (Actualizar/Reconstruir), no alcanza con
reiniciar. Hay archivos nuevos en `public/`: `favicon.svg`, `favicon.ico`
y `apple-touch-icon.png`.

- **Ícono de la pestaña**: dos anillos de boda dorados entrelazados, con
  un diamante, sobre fondo bordó. Reemplaza al mundito. Se ve también al
  guardar el sitio en favoritos y, en iPhone/iPad, al agregarlo a la
  pantalla de inicio. El panel de administración usa el mismo ícono.
- **Título de la pestaña**: ahora dice **"Nuestra Boda - Sol y Flavio"**.
  Se puede cambiar en el panel: **Textos → Título de la pestaña del
  navegador** (si lo dejás vacío vuelve a ese texto). El panel de
  administración dice "Panel de administración - Nuestra Boda".
- Los navegadores guardan el ícono en caché por mucho tiempo: si después
  de actualizar sigue apareciendo el mundito, cerrá la pestaña y abrí el
  sitio de nuevo; si persiste, probá en una ventana privada o borrá la
  caché del sitio.


## 23. Cambios de esta versión (1.11.0) — auditoría de seguridad

**Cómo actualizar:** ver "Cómo actualizar" al principio. Hay que **reconstruir**
el add-on (cambió el `Dockerfile`, el `package.json` y `server.js`). El informe
completo está en `SEGURIDAD.md`.

Lo más importante:
- **Subidas seguras**: solo se aceptan extensiones de imagen, video y audio de
  una lista cerrada (nunca `.html` ni `.svg`), con nombres imposibles de
  adivinar, y los archivos se sirven "encerrados" para que no ejecuten scripts.
- **Contraseña de administrador**: comparación segura, bloqueo de 15 minutos
  tras 10 intentos fallidos y aviso rojo en el panel si es la de fábrica
  (`cambiame`) o tiene menos de 8 caracteres. **Cambiala** en Configuración.
- **La contraseña ya no viaja en la URL**: los QR y las descargas de
  estadísticas se piden con cabecera.
- Cabeceras de seguridad (CSP, anti-iframe, etc.), errores sin detalles
  internos, límites por IP, reserva de 2 GB de disco libre y guardado atómico
  de los datos (con copia `*.corrupto-*` si un archivo se daña).
- Dependencias actualizadas (`multer` 2.x, `express` 4.21+, Node 22).


## 24. Cambios de esta versión (1.12.0) — panel oculto, scroll, animaciones, fotos en el sobre y diseño moderno

**Cómo actualizar:** hay que **reconstruir** el add-on y copiar también la carpeta
nueva **`panel`** (ver "Cómo actualizar" al principio). Si te olvidás de
`panel`, el add-on arranca igual pero la dirección del panel da error.

### 1) El link al panel ya no existe (y el panel tiene dirección secreta)
- Se sacó del pie del sitio el enlace "Panel de administración" y también
  dejó de existir `/admin.html`: pedir esa dirección da "no encontrado".
- El panel ahora responde en una **dirección secreta** de 12 letras al azar,
  por ejemplo `https://tu-dominio.duckdns.org/k3Zq9_LmT0aB`. Se genera la
  primera vez, se guarda (no cambia al reiniciar) y **se muestra en el
  Registro (Log)** del add-on cada vez que arranca. Guardala en favoritos.
- Si preferís elegirla vos: en **Configuración** del add-on, opción
  `ruta_admin` (6 a 64 letras, números, `-` o `_`; nada obvio como `admin` o
  `panel`, esas se descartan). Ejemplo: `ruta_admin: "mi-boda-2027-panel"`.
- La página del panel lleva "no indexar" para que Google no la muestre.
- **Opcional, la más segura:** `admin_solo_red_local: true`. Con eso el panel
  y toda su API responden "no encontrado" a cualquiera que venga desde
  Internet: solo se administra desde dispositivos de tu casa (o conectado por
  VPN/Tailscale). El sitio de los invitados sigue funcionando normal.
  Requisito: tu proxy (Nginx Proxy Manager, Cloudflare, etc.) tiene que
  reenviar la IP real del visitante (lo hacen por defecto). Probalo desde el
  celular con datos móviles: el panel no debería abrir.
- Una dirección secreta **no reemplaza** a la contraseña: sigue haciendo falta
  la de `admin_password` (con bloqueo tras 10 intentos fallidos).

### 2) Scroll lento en Chrome: arreglado
- La causa era propia del sitio: un "scroll suave" hecho a mano que
  interceptaba la rueda del mouse, avanzaba solo el 60 % de lo pedido y
  peleaba con el scroll nativo del navegador. **Se eliminó**: ahora el scroll es
  el nativo (el que ya va en la GPU).
- Además: las estadísticas de scroll se miden 3 veces por segundo en vez de en
  cada evento; los mapas de Google (muy pesados) solo existen mientras están
  cerca de la pantalla; la galería no dibuja lo que está fuera de pantalla; las
  fotos que subís desde el panel **se achican solas antes de subirse**
  (de 5–12 MB a unos 150–500 KB, sin diferencia visible) y el navegador guarda
  las imágenes 30 días en vez de volver a pedirlas.
- Medido en Chromium con la CPU frenada 4 veces: 500 px de rueda antes
  avanzaban 300 px en 1 segundo; ahora avanzan los 500 px en 0,2 s, a 60
  cuadros por segundo. Lo que no pude medir es el mapa de Google real (sin
  Internet en mi entorno); por eso ahora se descarga solo cuando hace falta.

### 3) Animaciones al hacer scroll (se encienden y apagan desde el panel)
- Nueva tarjeta **"Animaciones al hacer scroll"**: interruptor general, estilo
  (**desde los costados** —una caja entra por la izquierda y la siguiente por
  la derecha—, **desde abajo** o **suave**) y opción "repetir cada vez que
  vuelven a pasar" (la caja se apaga al salir de pantalla y se enciende al
  volver).
- Solo se anima lo que la GPU resuelve sin trabar (movimiento y
  transparencia). Con "reducir movimiento" activado en el celular no se anima.
- La portada también entra con animación cuando se abre el sobre, hay una
  barrita de progreso arriba (en navegadores que la soportan) y el menú
  Invitación / Galería quedó fijo arriba con un indicador que se desliza.

### 4) Fotos que salen del sobre
- Nueva tarjeta **"Fotos del sobre (polaroids al abrirlo)"** (en el panel, justo debajo de "Sobre de invitación"; desde la 1.14.0 se llamaba antes "Fotos que salen del sobre"): subís hasta 12 fotos, las
  ordenás con las flechas, las quitás con la ✕ y elegís **cuántas se muestran
  (0 a 8)** con un control deslizante (se guarda solo).
- Al tocar el sobre, la carta con los nombres sube y las fotos salen de adentro
  como polaroids en abanico. Después aparece el botón **"Ver la invitación"**
  (también se puede tocar en cualquier parte de la pantalla).
- Con cantidad 0 o sin fotos, el sobre se abre como antes.

### 5) Diseño moderno
- Nuevo archivo `public/moderno.css` (solo el sitio de invitados; el panel no
  cambia): tarjetas con bordes suaves y sombras en capas, íconos vectoriales
  (se acabaron los emojis), cuenta regresiva con números grandes, formularios
  con campos y opciones "tipo tarjeta", botones con relieve, mapas con vista
  previa y botón "Abrir en Maps", portada más alta con esquinas redondeadas,
  reproductor de música con ecualizador animado.
- Respeta todo lo que ya configurabas (tema, tipografías, estilo de secciones,
  colores). Los títulos de sección se ven un 35 % más grandes que el número que
  pusiste en Tipografía, porque ahora llevan un ícono arriba.
- El pie de página ya no dice "Panel de administración" y el aviso de
  privacidad de la galería ya no menciona el panel.

### Pruebas
Servidor: 62 pruebas (las 47 de antes + 15 nuevas), 11 del modo "solo red
local" y 14 de elección de la dirección secreta. Sitio y panel: 13 pruebas de
animaciones, 13 del panel, sin violaciones de la política de seguridad (CSP).
Las tipografías de las capturas de prueba son sustitutas (mi entorno no llega a
Google Fonts): en tu sitio se ven las que elegiste.

---

## 25. Cambios de esta versión (1.13.0) — borrar confirmaciones (para limpiar pruebas)

En el panel, tarjeta **"Confirmaciones recibidas"** (botón *Ver lista de confirmaciones*):

- **Borrar una:** cada fila tiene su botón **Borrar** (en el celular queda fijo a la derecha).
- **Borrar varias:** tildá las casillas (o "Marcar todas") y tocá **Borrar seleccionadas (n)**.
- **Borrar todas:** botón **Borrar todas…**. Por seguridad hay que **escribir BORRAR** para habilitarlo, así no se borran las confirmaciones reales por un toque accidental.
- Siempre aparece un **cuadro de confirmación** que dice qué se va a borrar (nombre y cantidad). Se puede cancelar con el botón, tocando afuera o con la tecla Esc. Ya no se usa la ventana fea del navegador.
- **Deshacer:** justo después de borrar aparece el botón **Deshacer**, que devuelve lo último borrado (solo la última eliminación; el siguiente borrado pisa el respaldo). También aparece al volver a abrir la lista mientras haya algo para recuperar.
- Al borrar se actualizan la lista, el total de personas y los contadores de cada grupo (así se libera el cupo si el grupo tenía límite).
- La lista ahora muestra la **fecha** de cada respuesta, para reconocer fácil las de prueba.

**Detalles técnicos**
- Endpoints nuevos (todos exigen la clave de administrador y respetan "solo red local"): `POST /api/admin/rsvps/borrar` (`{ids:[…]}` o `{todas:true, confirmar:"BORRAR"}`), `GET /api/admin/rsvps/ultimo-borrado`, `POST /api/admin/rsvps/deshacer`.
- El servidor también exige la palabra BORRAR para "todas", no solo el panel.
- El respaldo de lo último borrado se guarda en `/data/rsvps-ultimo-borrado.json` (con los nombres y mensajes que se borraron). Se pisa con el siguiente borrado, y se elimina solo cuando usás "Deshacer". Si querés que no quede ningún dato de las pruebas, borrá ese archivo de la carpeta de datos del add-on.
- Las confirmaciones de versiones muy viejas que no tenían identificador reciben uno automáticamente al abrir la lista.

**Pruebas:** 13 nuevas del servidor (además de las 62 + 11 + 14 anteriores, todas pasan) y 27 del panel en un navegador real (cuadro de confirmación, cancelar/Esc/tocar afuera, foco, seleccionar, borrar todas con BORRAR, deshacer, error del servidor, nombres con HTML). No se probó contra el Express real ni contra tu proxy.

**Para actualizar:** copiá `server.js` y la carpeta `panel` (y `public` por el número de versión) y **Reconstruir** el add-on.


---

## 26. Cambios de esta versión (1.14.0) — botón «Mostrar mapa» y panel más fácil de recorrer

### Botón «Mostrar mapa» (configurable)
En el panel, tarjeta **«Ubicaciones, horarios y clima» → «Mapa en el sitio»**:
- **Con un botón «Mostrar mapa»** (por defecto): el mapa de Google **no se carga** hasta que el invitado lo pide, y puede volver a ocultarlo con «Ocultar mapa». El sitio abre más rápido y no se conecta a Google si nadie quiere ver el mapa.
- **Se muestra solo**, al llegar a esa parte de la página (como funcionaba antes).
- **Sin mapa incrustado**: queda la vista previa con el botón «Abrir en Maps» (abre Google Maps en otra pestaña).
- El **texto del botón** se puede cambiar (hasta 30 caracteres). Se guarda con «Guardar ubicaciones y clima».
- Cada vez que un invitado muestra un mapa queda registrado en las estadísticas (`mostrar_mapa_civil` / `mostrar_mapa_salon`).

### Panel
- Nuevo menú **«Ir directo a una sección»** arriba de todo: lista todas las tarjetas del panel (son muchas) y te lleva a la que elijas, resaltándola un momento.
- La tarjeta de las fotos del sobre ahora se llama **«Fotos del sobre (polaroids al abrirlo)»** y la tarjeta «Sobre de invitación» avisa dónde está.
- El panel muestra su versión, para saber enseguida si estás viendo uno viejo.

### Seguridad y robustez
- El servidor responde **404 a `/admin.html`** (y `/admin`) aunque en la carpeta `public` haya quedado el archivo viejo, y el Log avisa si existe. Antes, si al actualizar quedaba ese archivo, se abría el panel anterior (sin las opciones nuevas).
- Se corrigió un caso raro: si el archivo de configuración desaparecía con el servidor en marcha, el sitio fallaba en lugar de regenerarlo.

**Pruebas:** servidor 20 nuevas (además de las 62 + 11 + 14 + 13 anteriores, todas pasan); navegador real: 22 del botón de mapa (los tres modos, texto, teclado, tema oscuro, sin animaciones), 11 del panel; las 27 del borrado, 13 del panel anterior y 13 de animaciones siguen pasando; sin violaciones de la política de seguridad (CSP). El mapa de Google se simuló (mi entorno no llega a Google): no se probó el mapa real.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (y borrá `public/admin.html` si existe) y **Reconstruir**.

## 27. Cambios de esta versión (1.14.1) — mapa oculto sin cuadrícula y error 413 al subir por Internet

### Mapa oculto: solo el botón
Con el mapa oculto (modos «botón» y «enlace») ahora se ve **únicamente el botón**. Antes se veía la cuadrícula gris de fondo detrás. Al tocar «Mostrar mapa» aparece el mapa con fondo liso mientras carga, y el botón pasa a «Ocultar mapa». En modo «enlace» el botón es un enlace de verdad a Google Maps (se abre en otra pestaña).

### Error 413 al subir música, fotos del slideshow o fotos de los invitados por Internet
**Qué pasaba:** por la IP local funciona y por el dominio no. Eso indica que el límite está en el **proxy inverso** que está entre Internet y el add-on (Nginx Proxy Manager u otro), no en el add-on. Por defecto nginx acepta cuerpos de hasta **1 MB** y corta todo lo que pase con «413 Request Entity Too Large». El add-on ni se entera de esa subida.

**Qué hay que cambiar (en el proxy, no en el add-on):**
- **Nginx Proxy Manager:** Proxy Host del sitio → pestaña *Advanced* → *Custom Nginx Configuration* → `client_max_body_size 600M;` → Save.
- **Nginx a mano:** dentro del bloque `server { … }` (o `location`) del sitio: `client_max_body_size 600M;` y recargar nginx.
- **Caddy:** `request_body { max_size 600MB }`.
- **Apache:** `LimitRequestBody 0`.
- **Cloudflare (plan gratis):** el límite es de 100 MB por pedido y no se puede cambiar; sirve para música y fotos, pero los videos muy grandes de los invitados pueden fallar ahí.

**Esto también afecta a los invitados:** las fotos y videos que suben desde el celular por el dominio (hasta 500 MB por archivo) se cortan igual. Conviene arreglarlo antes de la boda y probar con datos móviles.

**Novedades en el add-on para que no sea un misterio:**
- Nueva tarjeta en el panel **«Probar subidas desde internet (error 413)»**: envía datos de prueba de 0,5 / 2 / 8 / 30 / 70 MB y te dice hasta qué tamaño deja pasar tu conexión. Abrí el panel **desde la dirección de Internet** para que la prueba tenga sentido (por la IP local pasa todo).
- El panel ahora traduce las respuestas de error del proxy (que llegan como una página HTML) a un mensaje claro, en vez de «Unexpected token <».
- Las fotos del slideshow y las del sobre se suben **de a una** (el panel ya las achica antes), así que con un proxy limitado a pocos MB pueden pasar igual. La música (varios MB) y los videos de los invitados sí necesitan que subas el límite.
- Los errores de subida ahora salen **en español** («El archivo es demasiado grande…», «Demasiados archivos…») en lugar de textos en inglés.
- En la galería, un invitado que recibe un 413 ve un mensaje entendible y se registran dos acciones nuevas en las estadísticas: `galeria_error_413` y `galeria_error_red`, para saber si le pasa a alguien durante la boda.

**Pruebas:** servidor 12 nuevas (traducción de errores y endpoint de prueba: clave, límite de 80 MB, corte de conexión, respuesta única) sumadas a 62 + 11 + 14 + 13 + 20 anteriores; navegador real: 17 nuevas contra un simulador de proxy con límite (herramienta de medición, slideshow, música, corte de conexión, sobre, invitados), 26 del mapa, 11 del panel, 27 del borrado, 13 del panel anterior y 13 de animaciones; sin violaciones de CSP. **No pude probar** contra un nginx real, ni con Express/multer reales (el registro de paquetes no está disponible en mi entorno), ni con el mapa real de Google: la solución del 413 la confirmás vos con la tarjeta de prueba.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (y borrá `public/admin.html` si existe) y **Reconstruir**.

## 28. Cambios de esta versión (1.15.0) — controles del slideshow y dónde se guardan los archivos

### Slideshow de fotos: pausa, adelantar y volver atrás
El carrusel de fotos de los novios ahora tiene:
- **Flechas** a los costados: foto anterior / foto siguiente (dan la vuelta: después de la última viene la primera).
- **Botón de pausa / reanudar** arriba a la derecha (cambia entre ‖ y ▶).
- **Deslizar el dedo** en el celular: a la izquierda avanza, a la derecha retrocede. El scroll vertical de la página sigue funcionando normal.
- **Teclado**: con el foco en el carrusel, las flechas ← → cambian de foto; Tab llega a los botones y Enter/Espacio los activan.
- Si tocás una flecha, el reloj del pase automático **se reinicia** (la foto que elegiste se queda sus 4,5 segundos completos). Si está en pausa, sigue en pausa aunque cambies de foto a mano.
- Con una sola foto no aparecen los controles.

### ¿Dónde están las fotos y videos que suben los invitados?
- **Por defecto: `/media/boda_fotos`.** Es la carpeta «media» de Home Assistant. Desde el terminal: `ls -la /media/boda_fotos`. Desde tu compu, por Samba: compartido `media` → carpeta `boda_fotos`. Los archivos se llaman como `1767000000000-a1b2c3d4e5f60789.jpg` (fecha en milisegundos + código al azar); el nombre del invitado que los subió está en el archivo interno `fotos.json`.
- **Si el add-on no tiene acceso a `/media`** (por ejemplo, si no lo reconstruiste después de agregar `media:rw` al `config.yaml`), se guardan en el almacenamiento interno del add-on: `/data/fotos`. Esa carpeta **no se ve** desde el terminal de Home Assistant ni por Samba.
- **Cómo saber cuál se está usando:** en el panel, tarjeta **«Almacenamiento de fotos y videos»** — dice la ruta exacta y el espacio libre. También podés elegir ahí un disco externo.
- **Lo demás** (fotos de los novios y del sobre, música, banner, fondo, testigos): `/data/uploads`. Los datos (confirmaciones, configuración, estadísticas): `/data/rsvps.json`, `/data/site-config.json`, `/data/fotos.json`, `/data/visitas.jsonl`. Todo eso es interno del add-on.
- **Llegar a `/data`:** el add-on «Terminal & SSH» común no lo ve. Con el add-on «Advanced SSH & Web Terminal» y el *Modo protegido* desactivado se puede entrar al contenedor: `docker exec -it addon_local_boda_rsvp_fotos sh` (y ahí `ls /data`), o copiar con `docker cp addon_local_boda_rsvp_fotos:/data/uploads ./`. En el disco del sistema queda en `/mnt/data/supervisor/addons/data/local_boda_rsvp_fotos/`. Los respaldos de Home Assistant incluyen `/data` del add-on; la carpeta `/media` puede no entrar según tu versión, así que después de la boda **copiá `boda_fotos` aparte**.
- Las fotos que ya se subieron a `/data/fotos` antes de que hubiera acceso a `/media` **no se mueven solas** cuando el almacenamiento pasa a `/media`; siguen mostrándose en la galería pero quedan en la carpeta interna.

**Pruebas:** navegador real, 25 nuevas del slideshow (botones, vuelta, pausa/reanudar, reloj, deslizar, teclado, una foto, sin fotos, estilo «plano») además de todas las anteriores (server 62 + 11 + 14 + 13 + 20 + 12; navegador 26 + 11 + 17 + 27 + 13 + 13 + CSP sin violaciones). No se probó en un celular físico: el deslizar se simuló con eventos táctiles del navegador.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (y borrá `public/admin.html` si existe) y **Reconstruir**.

## 29. Cambios de esta versión (1.16.0) — subida de a un archivo, nombre recordado, panel en pestañas

### Galería de invitados: se sube de a un archivo
- Antes la página mandaba todos los archivos elegidos (hasta 10) en **un solo pedido**, y el límite del servidor web (`client_max_body_size`) se aplica al pedido entero: dos videos de 400 MB juntos fallaban aunque cada uno estuviera dentro de los 500 MB. Ahora cada archivo va en su **propio pedido**, uno después del otro, así que alcanza con que el límite cubra el archivo más grande (600M sirve).
- Mientras sube se ve «Subiendo 2 de 5 (43%): nombre.jpg» con una barra de avance total, y el navegador avisa si intentás cerrar la página a la mitad.
- Si un archivo falla, **los demás igual se suben**. Al final se muestra cuántos se subieron y cuáles no, con el motivo («pesa demasiado para subirlo», «se cortó la conexión», etc.). Los que fallaron **quedan elegidos** en el selector: con volver a tocar «Subir» se reintentan solo esos.
- Si se corta la conexión, reintenta una vez sola antes de darlo por perdido.
- Si el servidor no tiene espacio (507), la subida está deshabilitada (403) o hubo demasiados pedidos (429), no sigue insistiendo con el resto.
- Un archivo de más de 500 MB se descarta en el propio celular (ya no bloquea a los demás).
- El servidor ahora acepta **4000 pedidos por hora por IP** (antes 1000, cuando cada pedido llevaba hasta 10 archivos). En el salón todos los invitados comparten la misma IP pública del wifi, y con un pedido por archivo 1000 se quedaba corto.

### El nombre del invitado ya no se borra
Después de subir, el campo «Tu nombre» queda como estaba, y además se **recuerda en ese celular** (solo en el navegador del invitado; no se manda a ningún lado hasta que sube algo). La próxima vez que entre, ya aparece completo. Si el navegador no deja guardar datos, funciona igual, solo que no lo recuerda.

### Panel de administración en pestañas
Las 24 tarjetas se agruparon en 5 pestañas (una barra pegada arriba que te acompaña al bajar; en el celular se desliza de costado):

| Pestaña | Qué tiene |
|---|---|
| **Contenido** | Textos y nombres · Ubicaciones, horarios y clima · Código de vestimenta · Testigos · Regalos · Orden y visibilidad de las secciones · Avisos visibles |
| **Diseño** | Estilo del sitio · Tipografía · Animaciones al hacer scroll · Fondo de la página |
| **Fotos y música** | Banner / portada · Fotos de la pareja (slideshow) · Sobre de invitación (textura y sello) · Fotos del sobre · Música de fondo |
| **Invitados** | Confirmaciones recibidas · Grupos y códigos QR · Textos de la confirmación · Habilitar subida en la galería · Fotos y videos subidos por invitados |
| **Sistema** | Estadísticas de accesos · Almacenamiento · Probar subidas desde internet (error 413) |

- Se recuerda la última pestaña abierta en ese navegador. Si bajaste mucho y cambiás de pestaña, la nueva empieza desde arriba.
- «Ir directo a una sección» sigue arriba de todo: la lista ahora está agrupada por pestaña y, al elegir una tarjeta, **cambia de pestaña**, baja hasta ella y la resalta.
- Se maneja con teclado: flechas ← →, Inicio y Fin.
- Los datos se cargan aunque la pestaña esté oculta, así que al abrirla ya está todo completo.

### Tipografía: la muestra de cada grupo, justo debajo
Cada grupo (nombres, símbolo, fecha y lugar, mensaje, títulos de sección, texto de sección) tiene **su propia muestra debajo de sus controles**, que cambia en vivo al tocar cualquier opción. Arriba de la tarjeta queda un selector «Fondo de las muestras» (claro / oscuro) que se aplica a las seis. Se eliminaron las muestras sueltas del final.

**Pruebas:** navegador real, 26 de la subida de invitados (un archivo por pedido, orden, nombre, progreso, 413, corte de conexión con reintento, 403/507, HTML en nombres, sin `localStorage`), 32 de las pestañas y las muestras (reparto, teclado, índice, barra pegada, cada muestra en su lugar y en vivo) y todas las anteriores siguen pasando (server 62 + 11 + 14 + 13 + 20 + 12; navegador 26 + 11 + 17 + 27 + 13 + 13 + 25, CSP sin violaciones). No probado en un celular físico, con Google Fonts reales (en mi entorno no cargan: las muestras se verificaron por sus estilos) ni con Express/multer reales.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (y borrá `public/admin.html` si existe) y **Reconstruir**.

## 30. Cambios de esta versión (1.17.0) — barra de secciones del panel: a la izquierda o arriba

- La barra de secciones del panel (Contenido · Diseño · Fotos y música · Invitados · Sistema) ahora puede ir **a la izquierda**, como columna fija que te acompaña mientras bajás, con el contenido al lado. **Es la opción por defecto** en pantallas anchas.
- Se cambia en la tarjeta de arriba de todo («Ir directo a una sección»), en **Barra de secciones: A la izquierda / Arriba**. Se recuerda en ese navegador (cada compu o celular guarda su propia elección; no se guarda en el servidor).
- **En el celular y en pantallas de menos de 860 px la barra va siempre arriba** (una columna a la izquierda no dejaría lugar para el contenido), y el selector no aparece. Si achicás o agrandás la ventana, se acomoda sola.
- Con la barra a la izquierda el panel se ensancha (hasta 940 px); con la barra arriba vuelve al ancho de antes.
- Teclado: con el foco en la barra, ↑ ↓ (o ← →) cambian de pestaña; Inicio y Fin saltan a la primera y a la última.

**Pruebas:** navegador real, 23 nuevas (izquierda por defecto, columna y contenido sin pisarse, barra pegada al bajar, teclado, «Ir directo», cambio a «Arriba» y a «Izquierda» con recuerdo entre recargas, límite 859/860 px, ventana que cambia de tamaño, celular, navegador sin almacenamiento) y todas las anteriores siguen pasando (server 62 + 11 + 14 + 13 + 20 + 12; navegador 26 + 11 + 17 + 27 + 13 + 13 + 25 + 26 + 32, CSP sin violaciones). No se probó en una pantalla física.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (y borrá `public/admin.html` si existe) y **Reconstruir**. Cambia solo el panel y la versión; el servidor no tiene cambios.

## 31. Cambios de esta versión (1.17.1) — «No contar las visitas de este navegador»

**Qué pasaba:** al entrar al panel de administración desde un navegador, el sitio guardaba en ese navegador una marca (`boda_no_contar`) para que tus propias visitas y pruebas no inflaran las estadísticas. Esa marca quedaba para siempre y no se veía en ningún lado: si después abrías el sitio desde ese mismo celular o compu para probar, la visita **no aparecía** (el sitio ni siquiera la mandaba al servidor).

**Qué cambia:** en la tarjeta **Estadísticas de accesos** (pestaña *Sistema*) hay un cuadro **«No contar las visitas de este navegador»**, con un texto que dice claramente si ese navegador se está contando o no.
- La primera vez que se entra al panel desde un navegador sigue quedando «sin contar» (como antes).
- Destildalo para probar que un celular aparece en las estadísticas; volvé a tildarlo cuando termines.
- Lo que elijas **se respeta**: al volver a entrar al panel no se vuelve a activar solo.
- Es una preferencia de **cada navegador** (no del servidor): el Chrome del celular, el de la compu y el modo incógnito tienen cada uno la suya. Una pestaña de incógnito siempre cuenta (arranca sin marca).

**Cómo comprobar que las estadísticas funcionan:** desde el celular, abrí el sitio en una pestaña de incógnito (o destildá el cuadro en ese navegador), entrá, tocá el sobre y actualizá las estadísticas: tiene que aparecer un acceso nuevo, con «Android» y «Chrome».

**Pruebas:** el servidor registra y muestra visitas con 4 tipos de Chrome de Android y 2 de iPhone (8 pruebas nuevas, incluido que un bot de verdad se excluya); en el navegador, 11 pruebas nuevas (sin marca / marca en 1 / marca en 0, el cuadro del panel, que no se pise al volver a entrar, navegador que no deja guardar datos). Todo lo anterior sigue pasando.

**Para actualizar:** reemplazá `panel` y `public` (y borrá `public/admin.html` si existe) y **Reconstruir**. El servidor no cambia (alcanza con reconstruir igual para tomar la versión nueva).

## 32. Cambios de esta versión (1.18.0) — título y texto de «Nuestra historia» configurables

Antes la sección «Nuestra historia» tenía el título fijo y un único texto automático («Juntos desde el … — ya son N años de historia 💛»). Ahora los dos se editan desde el panel.

**Dónde:** pestaña **Contenido** → tarjeta **Nuestra historia** (queda entre «Código de vestimenta» y «Testigos de la boda», y también aparece en «Ir directo a una sección»).
- **Título de la sección:** hasta 100 caracteres. Si lo dejás vacío vuelve a «Nuestra historia».
- **Texto:** hasta 1500 caracteres, con varias líneas y párrafos (los saltos de línea se respetan en el sitio).
- **Texto vacío = el automático de siempre.** Ese necesita la fecha en que se conocieron (se carga en «Textos y nombres»), así que quien no escribe nada ve el sitio igual que antes.
- Podés escribir **`{fecha}`** y **`{años}`** dentro del texto y se reemplazan solos: `{fecha}` por «14 de febrero de 2014» y `{años}` por «12 años» (o «1 año», o «menos de un año»). Sirven `{anios}` sin la ñ y mayúsculas. Así el contador de años sigue avanzando solo cada aniversario.
- Debajo del formulario hay una vista previa («Así se va a ver») que se actualiza mientras escribís, usando la fecha que tengas en el formulario aunque todavía no la hayas guardado. Si usás `{fecha}` o `{años}` y falta la fecha, avisa que esos lugares quedarían vacíos.

**Cuándo se muestra la sección:** si hay un texto propio o hay fecha de inicio de la relación. Antes, sin fecha no aparecía nunca; ahora un texto propio la muestra aunque no cargues la fecha. Sin texto y sin fecha sigue oculta. Encenderla, apagarla y moverla de lugar se hace igual que antes, en «Orden y visibilidad de las secciones» (ahí la lista sigue diciendo «Nuestra historia» aunque le cambies el título).

**Seguridad:** el título y el texto se muestran siempre como texto (nunca como HTML), así que no se puede meter código en ellos; el servidor los limita en largo, junta los espacios del título y exige la contraseña de administración, igual que el resto.

**Pruebas:** servidor real, 15 nuevas (guardar y leer, título vacío, largos máximos, saltos de línea, valores raros, HTML, que no pise otras secciones ni sea pisada por «Textos y nombres», config vieja sin el campo, contraseña y bloqueo); navegador, 28 nuevas (sitio: texto automático, título propio con su ícono, `{fecha}`/`{años}`, concordancia de «1 año», sin fecha, HTML, palabra gigante en celular, sección apagada; panel: ubicación, carga, vista previa, avisos, guardar, error del servidor, índice; y que la vista previa del panel diga lo mismo que el sitio). Se actualizó la prueba de pestañas (ahora 25 tarjetas: 8/4/5/5/3) y todo lo anterior sigue pasando. No se probó con tu servidor real ni en un celular físico.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (y borrá `public/admin.html` si existe) y **Reconstruir**. Tu configuración guardada se conserva: el campo nuevo se completa solo con los valores de siempre.

## 33. Cambios de esta versión (1.19.0) — textos configurables, paleta de colores y fondo liso con textura

Todo lo nuevo se carga desde el panel. **Nada cambia en el sitio hasta que lo guardes**: la paleta viene apagada y los textos vienen con los de siempre.

**1. Texto del sobre («Tocá el sobre para abrir tu invitación»).** Pestaña **Contenido** → tarjeta **Títulos y textos del sitio** → «Texto debajo del sobre cerrado» (hasta 120 caracteres). Si es largo se centra y baja de renglón.

**2. Texto sobre los nombres de la portada (por ejemplo «¡Nos casamos!»).** Misma tarjeta → «Texto sobre los nombres, encima del banner». Va arriba de los nombres, en mayúsculas y con la fuente, el tamaño y el color de «Fecha y lugar» (Diseño → Tipografía). **Vacío = no se muestra** (es el único texto que no tiene uno «de siempre»).

**3. «Falta para el gran día» y «Cómo llegar».** Misma tarjeta: título de la cuenta regresiva, título de «Cómo llegar» y los nombres de los dos lugares. Interpreté «el primer registro» como el nombre del **primer lugar** (hoy «Registro Civil»; podés poner «Ceremonia civil», «El primer registro», etc.) y el del segundo es el salón («Salón de fiesta» / «Fiesta»). También se usan como título accesible de cada mapa.

**4. Código de vestimenta con varias líneas.** Pestaña Contenido → «Código de vestimenta»: la descripción ahora es un cuadro donde **Enter** hace un renglón nuevo (hasta 500 caracteres; los saltos se ven en el sitio, y varias líneas en blanco seguidas se juntan en una).

**5. Códigos hexadecimales de color.** En el mismo código de vestimenta, cada color tiene su selector **y** su código (`#A9784F`, también se entiende sin `#`, en minúscula o de 3 letras: `abc`). Hasta 8 colores. Casilla «Mostrar el código debajo de cada color en el sitio». Los colores que tenías guardados con nombre («navy») se convierten solos a código al guardar.

**6. «Nuestros testigos».** Misma tarjeta de textos: «Testigos».

**7. «Confirmá tu asistencia» y su subtítulo.** Ya eran configurables desde antes (pestaña **Invitados** → «Textos de confirmación»); la tarjeta nueva tiene un atajo que lleva directo.

**8. Subir fotos a la galería: título y subtítulo.** Pestaña **Invitados** → tarjeta **Subida de fotos en la galería**: «Título de la página de fotos» y «Subtítulo». Se ven arriba de la parte de subir fotos. Si dejás uno vacío, no se muestra (y si dejás los dos vacíos, desaparece el encabezado). Hay un atajo desde la tarjeta de textos.

**9. Paleta de colores.** Pestaña **Diseño** → tarjeta **Paleta de colores**. Son 6 colores, cada uno con selector y código hexadecimal:
- Fondo principal (marfil cálido `#F8F4EE`) · Tarjetas y bloques (blanco crema `#FFFDF9`) · Detalles (rosa empolvado `#D8B9B3`) · Botones y pequeños acentos (champagne `#D8B98A`) · Textos secundarios (taupe `#A89586`) · Títulos y textos principales (marrón cacao `#594A42`).
- El botón **«Aplicar la paleta romántica elegante»** carga esos 6 colores y la enciende, pero **recién se aplica al sitio cuando tocás «Guardar paleta»**. Con la casilla apagada el sitio usa los colores del estilo elegido, como siempre.
- Los **botones** (Confirmar, Subir, «Mostrar mapa», la pestaña activa, el botón de música) usan el champagne; el **rosa** queda para detalles (subrayados, íconos, casilleros de la cuenta regresiva). La letra sobre los botones se elige sola (cacao o crema, la que más contraste dé) y el color de «detalle» usado como letra se oscurece solo lo necesario para leerse.
- Hay una **vista previa** en vivo y un control de **contraste**. Con la paleta propuesta el **taupe da ~2.6 a 1 sobre las tarjetas** (lo recomendable para letra chica es 4.5): el panel lo avisa y tiene el enlace «Oscurecerlo automáticamente». Si preferís respetar el color exacto, ignorá el aviso.
- Lo único «intenso» que queda en el sitio es el **lacre rojo del sello** del sobre (se cambia en Multimedia → «Sobre de invitación») y el corazón 💛 del texto automático de «Nuestra historia» (escribiendo un texto propio desaparece).

**10. Fondo: foto, color liso o textura.** Pestaña **Diseño** → tarjeta **Fondo de la página**, con tres opciones:
- **Color del estilo** (como siempre), **Color liso** (elegido con los 6 atajos de tu paleta, el selector o el código hexadecimal) o **Foto** (la subida de siempre).
- **Textura** sobre el color del estilo o sobre el color liso: Papel, Lino, Acuarela, Puntitos, Rayas finas u Hojas, con **intensidad** de 5 a 100 %. Son dibujos propios del sitio; la tinta se adapta sola al fondo (oscura sobre fondos claros, blanca sobre fondos oscuros). Con una foto de fondo no se usa textura.
- Vista previa «Así se ve detrás de las tarjetas» y aviso si el fondo deja el texto casi ilegible. Subir una foto la activa; «Quitar fondo» vuelve al color del estilo. La foto no se borra si cambiás a color liso y guardás: podés volver.

**Cambios de comportamiento a tener en cuenta:** al agregar el encabezado de la galería, la primera caja de subida queda un poco más abajo; y el panel suma tarjetas nuevas (ahora 27: 9 / 5 / 5 / 5 / 3 por pestaña).

**Pruebas:** servidor real, 50 nuevas (textos con parche/vacío/límites/HTML/config dañada, código de vestimenta, galería, paleta, fondo y texturas con valores raros, que no se pisen entre sí, contraseña y bloqueo, y que **una instalación nueva sin carpeta de datos arranque**); lógica de colores, 18 (formatos de código, contraste, 300 paletas al azar, texturas); navegador, 103 nuevas (sitio: cada texto, portada arriba de los nombres, sobre centrado, código de vestimenta con líneas y códigos, encabezado de la galería, paleta apagada = igual que antes, paleta encendida en color/botones/letra, paleta oscura, fondo liso/foto/estilo, las 6 texturas se dibujan de verdad, intensidad, tinta, XSS; panel: cada tarjeta, atajos, guardar, errores, códigos inválidos, config vieja). Corregí dos cosas que aparecieron probando: el aviso «Guardado» del fondo se borraba al instante, y la pestaña activa del sitio seguía rosa en vez de champagne. Se actualizaron las pruebas de pestañas (27 tarjetas) y de animaciones (la caja de la galería ahora queda más abajo) y todo lo anterior sigue pasando. No se probó con tu servidor real ni en un celular físico, ni con las fuentes y mapas reales de Google.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (la carpeta `public` ahora incluye `paleta.js` y `texturas/`; borrá `public/admin.html` si existe) y **Reconstruir**. Tu configuración guardada se conserva: los campos nuevos se completan solos con los valores de siempre.

## 34. Cambios de esta versión (1.20.0) — sobre a gusto, acceso directo para probar, frase entre mapas y retoques

**Nada cambia en el sitio hasta que lo guardes**: el sobre viene con su crema de siempre, la frase viene vacía (no se muestra) y los textos mantienen lo que tenías.

**1. Hora de la ceremonia civil, debajo del título.** Antes se veía a la derecha; ahora va **justo debajo del título («Registro Civil»), antes de la dirección, centrada y con el mismo estilo que el horario de la fiesta** (en la 1.21.0 quedó en ese orden: título → hora → dirección → mapa). Se escribe en el mismo lugar (pestaña **Contenido** → «Ubicaciones, horarios y clima» → «Horario de la ceremonia civil») y ahora es un cuadro donde **Enter** hace un renglón nuevo (por ejemplo «17:30 hs Ceremonia» y debajo «18:15 hs Brindis»). Vacío = no se muestra nada.

**2. Entrar al sitio sin pasar por el sobre (para probar).** Agregando **`?sinsobre=1`** a la dirección del sitio (por ejemplo `https://tu-dominio/?sinsobre=1`) se abre la invitación directo. Para entrar a la galería: `https://tu-dominio/?sinsobre=1#galeria`. En el panel (la barra del costado / el índice de arriba) hay un bloque **«Probar el sitio»** con el enlace listo: botón **Abrir el sitio sin sobre** (se abre en otra pestaña) y **Copiar enlace**. Detalles:
- El sobre es solo decorativo (no protege nada: el contenido del sitio es público), así que este enlace no abre ninguna puerta nueva.
- Entrando así **no se cuenta «sobre abierto»** en las estadísticas y **no arranca la música** (el navegador no deja sonar música sin un toque del invitado; para probar la música usá el sobre normal).
- `?sinsobre=0` (o `false`/`no`) deja el sobre de siempre. Los invitados con su enlace normal (o con `?grupo=...`) siguen viendo el sobre.

**3. Color y textura del sobre.** Pestaña **Multimedia** → tarjeta **Sobre de invitación** → «Color y textura del papel»:
- **Color**: atajos con los colores de tu paleta, selector o código hexadecimal. «Volver al crema de siempre» lo quita. El frente, el cuerpo y la solapa del sobre toman ese color (con sus sombras de siempre).
- **Textura** encima del color (Papel, Lino, Acuarela, Puntitos, Rayas finas, Hojas) con **intensidad** de 5 a 100 %; en un papel oscuro la tinta se invierte sola para que se note. Hay una vista previa en vivo.
- Si además subiste una **imagen propia** para el papel («Textura del sobre», más abajo en la misma tarjeta), esa imagen sigue tapando el color (la textura de la lista se dibuja encima de ella). Para ver el color elegido, quitá la imagen.

**4. Frase entre los dos lugares de «Cómo llegar».**
- **El texto**: pestaña **Contenido** → «Títulos y textos del sitio» → «Frase que se muestra entre los dos mapas» (hasta 400 caracteres, varios renglones con Enter). También hay atajos desde la tarjeta de ubicaciones.
- **El estilo**: pestaña **Diseño** → **Tipografía** → grupo «Frase entre los dos lugares»: fuente (la lista de siempre), tamaño (10 a 48 px), negrita, cursiva y color propio, con muestra en vivo. Arranca en 18 px y cursiva.
- Se muestra **solo si están cargados los dos lugares y hay texto**; si falta uno de los dos lugares, o la frase está vacía, no aparece y no deja huecos. En el estilo moderno la frase queda enmarcada por dos líneas finas.

**5. Regalos con saltos de línea.** El **texto visible** de «Regalos» no respetaba los Enter (el mensaje oculto sí). Ahora los dos se ven con sus renglones, igual que se escriben en el panel. Los límites siguen siendo 300 y 500 caracteres.

**6. «Cantidad de personas (incluyéndote a vos)».** En «Confirmá tu asistencia» el campo ahora cuenta **el total de personas contando al invitado** y arranca en **1**. Antes era «acompañantes (sin contarte)».
- Interpreté «siempre debe ser mayor a 1» como **«al menos 1»** (el invitado se cuenta a sí mismo: si fuera «mayor que 1» nadie podría confirmar yendo solo). No se puede enviar con 0, vacío ni negativo (lo frena el navegador, el sitio lo avisa y el servidor también lo rechaza). Máximo en el formulario: 11 personas.
- Por dentro se sigue guardando como «acompañantes» (personas − 1), así que **las confirmaciones anteriores, los límites de los grupos, las estadísticas y los totales siguen funcionando igual**. En el panel, la columna «Acomp.» pasó a **«Personas»** (1 = viene solo) y los mensajes dicen «Sí · 3 personas». El total de personas que asisten no cambia.
- Un formulario viejo que quedó en la memoria de un celular y todavía manda «acompañantes» sigue siendo aceptado.

**7. Subtítulo de la galería más largo y con Enter.** Pestaña **Invitados** → «Subida de fotos en la galería»: el subtítulo ahora es un cuadro de varias líneas de **hasta 1000 caracteres** (antes 200, una sola línea) y los Enter se ven como renglones en el sitio. El título sigue siendo de una línea (100).

**Cambios de comportamiento a tener en cuenta:** las confirmaciones nuevas se piden con «personas» (total); el panel ahora cuenta 27 tarjetas igual que antes (todo lo nuevo está dentro de tarjetas existentes).

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (borrá `public/admin.html` si existe) y **Reconstruir**. Tu configuración guardada se conserva: los campos nuevos se completan solos.

## 35. Cambios de esta versión (1.21.0) — fotos del sobre: encuadre y altura; sitio más grande en computadora

**Nada cambia en el sitio hasta que lo guardes**: las fotos siguen centradas y sin subir, y el tamaño en computadora sigue en 100 %.

**1. Elegir qué parte de cada foto se ve (deslizar la foto).** Pestaña **Multimedia** → tarjeta **Fotos del sobre**:
- Cada foto tiene un botón **«Encuadrar»**. Abre abajo un editor con la foto: **arrastrala con el dedo o el mouse** (o usá las flechas del teclado; con Shift saltan más) para elegir qué parte queda dentro del marco. También hay dos deslizadores («de arriba a abajo» y «de izquierda a derecha») y un botón **Centrar**. Al lado, un recuadro muestra la foto entera y marca la parte que se ve en el sitio.
- **Al subir fotos, el editor se abre solo en la primera foto nueva**, para que la deslices enseguida. Si subiste varias, tocá «Encuadrar» en cada una.
- Se guarda solo, un instante después de soltar. Las miniaturas de la lista usan la misma proporción que el marco del sitio (no 4:5), así que lo que ves ahí es lo que sale. El encuadre queda atado a la foto: si cambiás el orden, la acompaña; si la quitás, se borra.
- *(En la 1.21.0 una foto vertical solo se podía mover un poco de arriba a abajo y una apaisada solo de izquierda a derecha. Desde la 1.22.0 se puede subir o bajar libremente más allá del borde: ver la sección 36.)*

**2. Subir las fotos al salir del sobre.** En la misma tarjeta, el control **«Qué tanto suben las fotos al salir del sobre»** (0 a 100 %; 0 = como hasta ahora). Al subirlas, la carta tapa menos la parte de abajo de cada foto. Se guarda solo.
- Las fotos **nunca se salen por arriba de la pantalla**: el sitio calcula hasta dónde pueden subir en la pantalla de cada invitado y frena ahí (en un celular alto suben todo lo pedido; en una pantalla baja suben menos). Además, con altura alta el sobre se achica un poquito para dejar lugar.
- Interpreté «subirlas» como **subir las fotos respecto de la carta** (que se vea más de su parte de abajo). Si lo que querías era otra cosa (por ejemplo, que la carta baje), decímelo.

**3. Agrandar todo en computadora.** Pestaña **Diseño** → tarjeta **Estilo del sitio** → **«Tamaño en computadora»** (100 a 150 %, de a 5; se guarda con el botón de esa tarjeta). Agranda **el sobre, la portada con los nombres, las secciones y los textos**, en pantallas de **900 px de ancho o más**; en celulares y tablets angostas no cambia nada.
- El sobre se agranda hasta donde entra en la **altura** de la ventana (siempre se ve completo y con el botón a la vista), así que en una notebook baja puede crecer menos que en un monitor alto. La barra de secciones sigue pegada arriba al bajar.
- Para ver el efecto sin sobre: `https://tu-dominio/?sinsobre=1`.

**Pruebas:** servidor real, 21 nuevas (encuadre con valores raros, 404 para fotos inexistentes, un eje sin tocar el otro, limpieza al quitar o cambiar el orden, altura 0–100, escala 100–150, contraseña, configuración vieja o dañada); navegador, 16 en el sitio (encuadre aplicado y distinto a la izquierda y a la derecha, fotos que no se salen en 7 tamaños de pantalla con 1, 3 y 8 fotos, tope que se recalcula al cambiar el tamaño de la ventana, zoom solo desde 900 px, máximo 150, sin barra horizontal, barra de secciones pegada) y 24 en el panel (arrastre con mouse y táctil, teclado, deslizadores, guardado único, foto apaisada, cambio de foto sin perder lo pendiente, apertura automática al subir). Se actualizaron las pruebas viejas que miran la versión y lo que manda «Estilo del sitio», y todo lo anterior sigue pasando.

**Límites conocidos:** (a) si se **cambia el tamaño de la ventana con el sobre ya abierto** en una computadora, las fotos pueden quedar un poco fuera hasta recargar (pasaba igual antes); en uso normal, el invitado abre el sobre una sola vez. (b) El agrandado usa la propiedad `zoom` de CSS: funciona en Chrome, Edge, Safari y Firefox 126 o más nuevo; en un navegador más viejo se ve como siempre (tamaño 100 %). (c) No se probó con tu servidor real, en un celular físico ni en Safari/Firefox reales.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (borrá `public/admin.html` si existe) y **Reconstruir**. Tu configuración guardada se conserva: los campos nuevos se completan solos.

## 36. Cambios de esta versión (1.22.0) — encuadre vertical libre, horario de la fiesta bajo el título y videos como íconos

**Nada cambia en el sitio hasta que lo guardes.** Los encuadres que ya habías hecho con la 1.21.0 se conservan tal cual.

**1. Horario de la fiesta, debajo del título.** Igual que la hora de la ceremonia civil: ahora queda **justo debajo del título («Salón de fiesta»), antes de la dirección y del mapa**, centrado y con el mismo estilo (título → horario → dirección → mapa en los dos lugares). Se sigue escribiendo en el mismo campo (pestaña **Contenido** → «Ubicaciones, horarios y clima» → «Horarios»; ahora la etiqueta dice dónde se ve) y varias líneas con Enter se ven una debajo de otra. Vacío = no se muestra nada ni deja hueco.

**2. Encuadre vertical libre de las fotos del sobre.** Antes, una foto solo se podía mover mientras *sobrara* foto: una vertical casi no se movía y una apaisada no se podía mover de arriba a abajo. Ahora, en **Multimedia → Fotos del sobre → «Encuadrar»**:
- **Arrastrá la foto hacia arriba o hacia abajo todo lo que quieras, aunque pase su borde**: queda un **espacio vacío** (blanco, como el marco de la polaroid). Si la subís, el vacío queda **abajo, y en el sitio lo tapa la carta del sobre** (las polaroids van por debajo de la carta); si la bajás, queda arriba y ese sí se ve. El editor te avisa con un texto cuál de los dos es.
- El deslizador nuevo **«Subir o bajar la foto»** (de «Más abajo» a «Más arriba», con el valor en texto: «subida 30 %», «bajada 10 %» o «centrada») hace lo mismo sin arrastrar. El tope es **70 % del alto del marco** hacia cada lado. «Centrar» deja la foto como estaba al principio.
- **Las flechas del teclado ahora mueven la foto** (↑ la sube, ↓ la baja, ← → la mueven de lado; 2 % del marco por toque, con Shift 10 %). En la 1.21.0 movían «la parte que se ve», al revés.
- De izquierda a derecha sigue pasando como antes: se mueve mientras sobre foto (no deja espacios vacíos a los lados).
- Funciona igual en cualquier foto (vertical, apaisada o justa) y en cualquier pantalla: el espacio se mide como un porcentaje del alto del marco, así que se ve proporcional en el celular y en la computadora. Las miniaturas de la lista muestran el mismo resultado.
- Se puede combinar con **«Qué tanto suben las fotos al salir del sobre»** (que sube la polaroid entera): una sube el marco y la otra mueve la foto dentro del marco.

**3. Corrección: los videos de invitados en el panel.** En **Invitados → Fotos y videos subidos por invitados**, los videos se mostraban **a tamaño real** (la lista cargaba el video entero, que puede pesar cientos de MB) y ensanchaban la página. Ahora cada video es un **mosaico con un ícono de play y su extensión (MP4, MOV…)**, del mismo tamaño que las fotos. Tocándolo se abre el video en otra pestaña; el botón **Borrar** y el nombre de quien lo subió siguen igual. De paso, las fotos de esa lista se cargan a medida que se bajan (más rápido si hay muchas).

**Pruebas:** servidor real, 10 nuevas (el dato «d»: guardar, acotar a ±70, valores raros, patch, compatibilidad con lo guardado por la 1.21.0, borrado con la foto) y las 21 de la versión anterior ajustadas; navegador, 9 en el sitio (horario de la fiesta en su lugar y con el estilo de la civil; fotos subidas o bajadas dibujan el espacio blanco del tamaño pedido en celular y computadora; valores raros), 26 en el panel (el editor completo con el nuevo comportamiento) y 10 de los videos (comprobé primero que el error se reproduce en la 1.21.0: la página se ensanchaba de 412 a 455 px). Todo lo anterior sigue pasando. No se probó con tu servidor real, en un celular físico ni en Safari/Firefox reales (el editor usa unidades de contenedor `cqw`: Chrome 105+, Safari 16+, Firefox 110+).

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (borrá `public/admin.html` si existe) y **Reconstruir**. Tu configuración guardada se conserva.

## 37. Cambios de esta versión (1.23.0) — descargar las fotos y videos de los invitados, sin perder calidad

**Dónde:** panel → **Invitados** → tarjeta **«Fotos y videos subidos por invitados»**. Nada cambia en el sitio ni en lo que ven los invitados.

**Sin pérdida de calidad.** El sitio nunca achica ni vuelve a codificar lo que sube un invitado: el archivo viaja y se guarda **tal cual salió de su celular**. Descargarlo es copiar exactamente esos mismos bytes: no hay conversión, ni recompresión, ni versión reducida. (Si un invitado subió una foto que el propio celular ya había comprimido, eso no se puede deshacer, pero lo que descargás es siempre lo que él subió.)

**Cómo se usa**
- **Una foto o video:** el botón verde **«Descargar»** debajo de cada uno baja ese original directo, con su nombre de siempre. No arma ningún ZIP.
- **Varias:** tildá la casilla de la esquina de cada foto (o **«Elegir todas»**). Arriba se lee cuántas elegiste y **cuánto pesan en total**. **«Descargar elegidas (ZIP)»** baja un único ZIP con esas. Si elegiste solo una, baja el original directo.
- **Todas:** **«Descargar todo (ZIP · tamaño)»**, arriba, baja todo lo subido (fotos **y videos**).
- Lo elegido se mantiene si tocás «Actualizar lista» (se quita solo lo que ya no existe) y al borrar una foto se destilda.
- Cada foto muestra ahora **cuánto pesa** debajo del nombre.

**El ZIP**
- **Sin comprimir** (método «stored»): cada archivo adentro es **idéntico byte a byte** al original, y el ZIP pesa lo mismo que la suma de los archivos (más unos cientos de bytes por archivo). Además no gasta procesador en el NUC.
- **Una carpeta por invitado** (con el nombre que escribió al subir; si no puso nombre, «Invitado») y adentro sus archivos, en el orden en que los subió. Los nombres con tildes, ñ o emojis se ven bien; los caracteres que Windows no admite se cambian por espacios.
- Cada archivo conserva **la fecha y hora en que se subió**.
- Se arma **sobre la marcha y se va enviando** mientras se baja: no se junta en memoria ni se escribe en el disco del NUC, así que no ocupa lugar extra ni importa si son 50 MB o 20 GB (probado armando 5 GB con 2 MB de memoria). Para más de 4 GB o 65 535 archivos usa el formato ZIP64 automáticamente.
- Mientras baja, **no cierres la pestaña**. Si se corta, tocá de nuevo el botón.
- Si entrás al sitio por un proxy (Nginx Proxy Manager u otro), el ZIP llega sin esperas porque el servidor le pide al proxy que no lo junte antes de enviarlo; el límite de tiempo de 1 hora de las subidas también vale acá.

**Cómo es por dentro (por si te lo preguntás).** El navegador no puede mandar la contraseña en un enlace (el panel solo la acepta por cabecera), así que el panel primero pide el ZIP con la contraseña y el servidor responde con un **enlace de un solo uso al azar** (código de 32 caracteres) que sirve **5 minutos y hasta 3 veces**, y solo para ese ZIP. Hay a lo sumo 20 enlaces vivos a la vez. Todo lo demás del panel sigue pidiendo la contraseña.

**Si algo no está:** si alguna foto se borró justo antes de descargar, el ZIP sale igual con el resto y el panel avisa en ámbar cuántas no estaban. Si no queda ninguna, avisa que actualices la lista. Los errores del servidor se leen en rojo debajo de los botones.

**Pruebas (solo de lo que se modificó, como pediste):** servidor, 38 nuevas (pedir/bajar el enlace, contraseña, vencimiento y usos, nombres peligrosos, archivos faltantes, rutas con `../`, ZIP verificado con `unzip -t` y con Python, byte a byte contra los originales, ZIP64 con límites bajados y **armando de verdad 5 GB**, que también validé con `unzip -t`) más 1 en «solo red local»; navegador, 38 en el panel (celular y escritorio: casillas, descarga directa, ZIP, elegir todas, errores, doble clic, miles de fotos, teclado, diseño sin desbordes). Repetí las pruebas del servidor y del panel que podían verse afectadas, y las dejé en verde. **No probé con tu servidor real ni con un celular físico**; tampoco abrí el ZIP en el Explorador de Windows ni en el Finder de Mac (sí con `unzip` y Python; el formato es el estándar que usan los «descargar todo» de otros servicios). El sitio de los invitados no se tocó.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (borrá `public/admin.html` si existe) y **Reconstruir**. Tu configuración y tus fotos se conservan.

## 38. Cambios de esta versión (1.24.0) — borrar varias fotos y videos de invitados a la vez

**Dónde:** el mismo lugar de la 1.23.0 (**Invitados → «Fotos y videos subidos por invitados»**). En la barra de elegidas, al lado de «Descargar elegidas», hay un botón rojo **«Borrar elegidas»**. Nada cambia en el sitio.

**Cómo se usa:** tildás las casillas (o **Elegir todas**) y tocás **Borrar elegidas**.
- Antes de borrar te muestra **cuántas son y cuánto pesan**, y te recuerda que **se borran del servidor para siempre y no se pueden recuperar** (a diferencia de las confirmaciones, acá no hay «deshacer»). Si querés conservarlas, **descargalas antes** con «Descargar elegidas».
- **Hasta 9 archivos:** te pide una confirmación normal.
- **10 o más:** tenés que **escribir BORRAR** (da lo mismo mayúsculas o minúsculas) para que se borren. Cancelar o escribir otra cosa no borra nada.
- Al terminar, la lista se actualiza sola y lees «Listo: se borraron N archivos». Si algo se interrumpe a mitad (se cortó la conexión, por ejemplo), te dice **cuántas se alcanzaron a borrar**, y **lo que quedó sigue elegido** para que reintentes.
- Se manda de a 500 por vez, así que se pueden borrar miles de una sola vez. Mientras trabaja, los botones quedan apagados para que un doble clic no repita el pedido.
- El botón **Borrar** de cada foto sigue como siempre (borra solo esa).

**Por dentro:** una ruta nueva (`POST /api/admin/fotos/borrar`) que, con tu contraseña, recibe los nombres y borra del disco solo los que están en la lista de fotos subidas. Un ZIP que ya estaba pedido y todavía no se bajó sale igual, sin lo borrado.

**Pruebas (solo lo modificado):** servidor, 8 nuevas (contraseña, pedidos mal formados, borra solo lo pedido, nombres con `../` o que no están en la lista, repetir el pedido, 3 000 de una vez, ZIP pedido antes) y una más en «solo red local»; navegador, 22 nuevas en el panel (celular y escritorio: confirmación, cancelar, escribir BORRAR, tandas de 500, falla a mitad, sin conexión, doble clic). Repetí también las 38 de la 1.23.0 y la de los videos del panel; siguen pasando. No probé con tu servidor real ni en un celular físico.

**Para actualizar:** reemplazá `server.js`, `panel` y `public` (borrá `public/admin.html` si existe) y **Reconstruir**. Tu configuración y tus fotos se conservan.

## 39. Cambios de esta versión (1.25.0) — la boda en Home Assistant: gráficas y avisos por Alexa

**Qué hace:** el add-on publica sus números como entidades de Home Assistant y avisa de cada confirmación y cada subida. Nada cambia en el sitio ni en el panel.

- **`sensor.boda_datos`**: en sus atributos, visitas (totales, de hoy y personas distintas, con el mismo criterio que las estadísticas del panel: sin bots), respuestas, personas que van y que no, invitados esperados, pendientes, % respondido, fotos, videos, subidas de hoy, fecha de la boda y los grupos que todavía no respondieron. Su estado es la fecha y hora de la última novedad.
- **`sensor.boda_actividad`**: las últimas 60 confirmaciones (nombre, si va, personas, mensaje, grupo) y las últimas 30 subidas (las fotos seguidas de una misma persona se juntan en una fila).
- **Evento `boda_evento`**: con cada confirmación y cada subida, con los totales ya actualizados.

Se actualiza a los pocos segundos de cada cambio (también al **borrar** o **recuperar** confirmaciones, borrar fotos o reiniciar las estadísticas) y se vuelve a mandar cada minuto, así que si reiniciás Home Assistant las entidades vuelven solas.

**Sin configurar nada:** usa la API interna del Supervisor (`homeassistant_api: true` en `config.yaml`). No hace falta webhook, token ni abrir nada a internet. Si Home Assistant no responde, el sitio sigue igual (el Registro lo avisa **una sola vez** y reintenta cada minuto).

**Opciones nuevas** (pestaña Configuración, opcionales):
- `invitados_esperados`: total de invitados para «pendientes» y el %. Vacío = la suma de los grupos (su límite, o la cantidad de nombres cargados).
- `homeassistant: false`: apaga la publicación.

**Del lado de Home Assistant:** en la carpeta [`home-assistant/`](../home-assistant/) del repositorio hay un paquete (`boda.yaml`) que convierte esos datos en sensores con historial y gráficas por día, y agrega: «Alexa, novedades de la boda» (qué cambió desde la última vez que preguntaste), «Alexa, resumen de la boda», anuncios de cada confirmación, de fotos nuevas (agrupadas), hitos de visitas y horario de silencio. También un dashboard listo para pegar. Instrucciones en `home-assistant/LEEME.md`.

**Por dentro:** un archivo nuevo, `homeassistant.js`. Las visitas se cuentan en memoria (al arrancar se lee `visitas.jsonl` de a una línea) para no releer un archivo de hasta 100 MB cada minuto; confirmaciones y fotos se leen de sus archivos, sin crear copias `.corrupto-*`. Los nombres y mensajes llegan a Home Assistant sin etiquetas ni símbolos de formato.

**Pruebas:** el `server.js` real corriendo contra un Home Assistant falso que registra lo que recibe: 35 comprobaciones (lectura de lo que ya había, visitas idénticas a las del panel incluyendo bots y repetidas, confirmaciones y fotos con sus eventos y totales, borrar, deshacer, reiniciar estadísticas, HA caído sin afectar al sitio y HA reiniciado). Como en este entorno no se pudo instalar npm, Express y Multer se reemplazaron por versiones mínimas de prueba. El paquete de Home Assistant se probó en un simulador de sus plantillas con lo que publicó el servidor (39 comprobaciones). **No se probó en tu Home Assistant real ni con un Echo real.**

**Para actualizar:** reemplazá `server.js`, `config.yaml`, `Dockerfile`, `panel` y `public`, agregá **`homeassistant.js`** (nuevo) y **Reconstruir**/**Actualizar**. Tu configuración, confirmaciones y fotos se conservan.
