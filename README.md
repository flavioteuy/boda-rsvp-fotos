# Boda — RSVP y fotos (add-on de Home Assistant)

Sitio de la boda con confirmación de asistencia, galería de fotos y videos de los invitados, y panel de administración.
Corre como add-on de Home Assistant (Node.js + Express). Repositorio público: no contiene contraseñas ni datos de invitados (esos viven solo en tu Home Assistant).

## Estructura

```
repository.yaml          <- le dice a Home Assistant que esto es un repositorio de add-ons
boda_rsvp_fotos/         <- el add-on (config.yaml, Dockerfile, server.js, homeassistant.js, public/, panel/)
home-assistant/          <- paquete y dashboard para Home Assistant: gráficas, anuncios y órdenes de voz de Alexa (ver su LEEME.md)
```

## Instalarlo en Home Assistant

1. Ajustes → Complementos → Tienda de complementos → ⋮ (arriba a la derecha) → **Repositorios**.
2. Pegá `https://github.com/flavioteuy/boda-rsvp-fotos` → Añadir → cerrar.
3. Buscá «Boda - RSVP y Fotos» en la tienda (si no aparece: ⋮ → *Buscar actualizaciones* o recargá la página), instalalo y completá la pestaña **Configuración** (contraseña de administración, nombres, fecha, lugar).
4. En la página del complemento activá **Actualización automática** si querés que se instale solo cada versión nueva.

## Publicar una versión nueva

1. Reemplazá los archivos dentro de `boda_rsvp_fotos/` (sin tocar `data/`, que no se sube).
2. Subí el número de `version` en `boda_rsvp_fotos/config.yaml` (si no cambia el número, Home Assistant no ofrece la actualización).
3. `git add -A && git commit -m "Versión X.Y.Z" && git push`.

Más detalles del sitio y del panel: `boda_rsvp_fotos/README.md`. Seguridad: `boda_rsvp_fotos/SEGURIDAD.md`.
