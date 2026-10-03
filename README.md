# Boda — RSVP y fotos (add-on de Home Assistant)

Sitio de la boda con confirmación de asistencia, galería de fotos y videos de los invitados, y panel de administración.
Corre como add-on de Home Assistant (Node.js + Express). Repositorio **privado**.

## Estructura

```
repository.yaml          <- le dice a Home Assistant que esto es un repositorio de add-ons
boda_rsvp_fotos/         <- el add-on (config.yaml, Dockerfile, server.js, public/, panel/)
```

## Instalarlo en Home Assistant

1. Creá un token de GitHub **de solo lectura** para este repositorio (Settings → Developer settings → Personal access tokens → Fine-grained tokens → solo este repo → Permissions: *Contents: Read-only*).
2. En Home Assistant: Ajustes → Complementos → Tienda de complementos → ⋮ (arriba a la derecha) → **Repositorios** → pegá:
   `https://flavioteuy:TU_TOKEN@github.com/flavioteuy/boda-rsvp-fotos` → Añadir.
3. Buscá «Boda - RSVP y Fotos» en la tienda, instalalo y activá **Actualización automática**.

## Publicar una versión nueva

1. Reemplazá los archivos dentro de `boda_rsvp_fotos/` (sin tocar `data/`, que no se sube).
2. Subí el número de `version` en `boda_rsvp_fotos/config.yaml` (si no cambia el número, Home Assistant no ofrece la actualización).
3. `git add -A && git commit -m "Versión X.Y.Z" && git push`.

Más detalles del sitio y del panel: `boda_rsvp_fotos/README.md`. Seguridad: `boda_rsvp_fotos/SEGURIDAD.md`.
