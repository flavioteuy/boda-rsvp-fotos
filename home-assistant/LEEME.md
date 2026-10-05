# 💍 La boda en Home Assistant (gráficas y Alexa)

Desde la **1.25.0** el add-on publica sus números en Home Assistant **sin configurar nada**: no hace falta webhook, token ni exponer Home Assistant a internet. Esta carpeta trae lo que va del lado de Home Assistant:

| Archivo | Para qué |
|---|---|
| `boda.yaml` | Paquete: sensores con historial y gráficas, anuncios y órdenes de voz de Alexa |
| `boda-dashboard.yaml` | Dashboard listo para pegar |

## 1. Actualizar el add-on

Tienda de complementos → ⋮ → **Recargar** → «Boda - RSVP y Fotos» → **Actualizar** (1.25.0). En el **Registro** tiene que aparecer:

```
🏠 Home Assistant: publicando sensor.boda_datos y sensor.boda_actividad (N visitas registradas).
```

En **Herramientas para desarrolladores → Estados** ya vas a ver `sensor.boda_datos` (todos los números en sus atributos) y `sensor.boda_actividad` (últimas confirmaciones y subidas). Se actualizan a los pocos segundos de cada cambio y se vuelven a mandar cada minuto (si reiniciás Home Assistant, vuelven solas).

Opciones nuevas del add-on (pestaña **Configuración**, «Mostrar opciones no utilizadas»):
- `invitados_esperados`: total de invitados para calcular «pendientes» y el %. Si lo dejás vacío se usa la suma de los **grupos** del panel (su límite, o la cantidad de nombres cargados).
- `homeassistant: false`: apaga la publicación.

## 2. Instalar el paquete

1. En `configuration.yaml` (si no lo tenés):
   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```
2. Copiá `boda.yaml` a `/config/packages/boda.yaml`.
3. **Herramientas para desarrolladores → YAML → Comprobar configuración** y **Reiniciar**.

> Si habías instalado una versión anterior de `boda.yaml` (la del webhook), reemplazala por esta: ya no hacen falta el webhook ni los contadores.

## 3. Dashboard

Ajustes → Paneles → Añadir panel → **Nuevo panel desde cero** → abrirlo → ✏️ → ⋮ → **Editor de configuración en bruto** → pegá `boda-dashboard.yaml`.

Las gráficas por día usan estadísticas de largo plazo: se llenan a partir de la primera hora.

## 4. Alexa

### Que hable (salida)
En el dashboard, **Ajustes → Echo destino**:
- **Alexa Devices** (integración oficial, HA 2025.6+): `notify.echo_living_announce` (con campanita) o `notify.echo_living_speak`. Varios separados por coma.
- **Alexa Media Player** (HACS): `media_player.echo_living`.
- Vacío: el mensaje sale como notificación de Home Assistant (sirve para probar).

### Pedírselo por voz
**Opción A — Alexa Devices (sin Nabu Casa).** Home Assistant lee lo que le dijiste al Echo y contesta en ese mismo Echo.
1. App Alexa → Más → **Rutinas** → `+` → *Cuando esto ocurra* → **Voz** → `novedades de la boda`.
2. *Agregar acción* → **Alexa dice** → Personalizado → **`Ya te cuento las novedades de la boda`**.
3. Repetí con la frase `resumen de la boda` y la respuesta **`Ya te cuento el resumen de la boda`**.

**La respuesta de la rutina es la que manda.** Cuando una frase dispara una rutina, Amazon muchas veces no guarda el texto de lo que dijiste, pero sí lo que contestó Alexa. Por eso la respuesta tiene que decir **«Ya te cuento»**. Si además dice *novedad, nuevo, nueva, cambio* o *pasó* → **novedades** desde la última vez que preguntaste; si no → **resumen** completo. Podés tener varias rutinas (varias frases) con la misma respuesta. Tarda unos segundos. Si no contesta, mirá en **Herramientas para desarrolladores → Estados** el sensor `sensor.boda_alexa_ultima_orden`: sus atributos `orden` y `respuesta` muestran lo que Home Assistant recibió de Amazon.

**Opción B — Nabu Casa.** Ajustes → Asistentes de voz → **Exponer** → `script.boda_novedades` y `script.boda_resumen`. En la app Alexa aparecen como **escenas**: creá la rutina con la frase y la acción *Hogar digital → Escena*. Contesta en el Echo destino.

### Anuncios automáticos (sección Alexa del dashboard)
- **Cada confirmación:** «¡Nueva confirmación de Ana! 2 personas. Ya van 86 confirmados.»
- **Fotos y videos nuevos:** agrupados cada N minutos para que no hable a cada rato.
- **Hitos:** cada N visitas y cuando respondieron todos.
- **Horario de silencio:** frena los automáticos (lo que pedís por voz contesta siempre).

## Entidades

| Entidad | Qué es |
|---|---|
| `sensor.boda_visitas` / `sensor.boda_visitas_hoy` / `sensor.boda_visitantes_unicos` | Igual que las estadísticas del panel (sin bots) |
| `sensor.boda_personas_confirmadas` / `sensor.boda_personas_que_no_van` | Personas (con acompañantes) |
| `sensor.boda_respuestas` / `sensor.boda_respuestas_hoy` | Formularios recibidos |
| `sensor.boda_invitados_esperados` / `sensor.boda_pendientes_de_responder` / `sensor.boda_porcentaje_respondido` | Necesitan grupos o `invitados_esperados` |
| `sensor.boda_fotos` / `sensor.boda_videos` / `sensor.boda_subidas_hoy` | Galería de invitados |
| `sensor.boda_dias_para_la_boda` | Cuenta regresiva (fecha del panel) |
| `sensor.boda_datos` / `sensor.boda_actividad` | Los que publica el add-on (fuente de todo lo anterior) |
| `script.boda_resumen` / `script.boda_novedades` / `script.boda_anunciar` | Para usar en tus automatizaciones |

Si borrás confirmaciones o fotos desde el panel, o reiniciás las estadísticas, Home Assistant lo refleja solo.

## Evento `boda_evento`

El add-on lo dispara con cada confirmación y cada subida, por si querés sumar otra cosa (una notificación al celular, una luz):

| `evento` | Datos |
|---|---|
| `confirmacion` | `nombre`, `asiste` (true/false), `personas`, `mensaje`, `grupo`, `t`, `totales` |
| `subida` | `nombre`, `fotos`, `videos`, `t`, `totales` |

`totales` trae `personas_si`, `personas_no`, `respuestas`, `fotos`, `videos` y `pendientes` ya contando ese evento.
