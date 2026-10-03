FROM node:22-alpine

# Modo produccion: Express no muestra rutas internas ni detalles de errores al publico.
ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.js ./
COPY public ./public
COPY panel ./panel

EXPOSE 8099

CMD ["node", "server.js"]
