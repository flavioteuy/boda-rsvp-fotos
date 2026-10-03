/* Sello del sobre (compartido por index.html y admin.html).
   Dos tipos:  "lacre"   -> sello de cera con labio en relieve, centro liso, brillos y sombras
               "clasico" -> disco liso tipo perla
   Todo es vectorial (degradados, mascaras y trazos): sin filtros de ruido ni de trama, asi que los bordes salen
   nitidos en cualquier pantalla. Las luces y sombras son blancas/negras semitransparentes, por eso sirve cualquier color.
   Las iniciales se miden y se achican solas hasta entrar dentro del centro liso.  */
(function () {
  var FORMAS = {"ondulado": "M95.37 50.00C95.38 50.79 95.28 51.59 95.10 52.36C94.93 53.14 94.63 53.91 94.30 54.66C93.97 55.40 93.54 56.13 93.12 56.83C92.69 57.53 92.20 58.21 91.76 58.88C91.31 59.54 90.84 60.18 90.43 60.83C90.03 61.48 89.65 62.12 89.33 62.78C89.01 63.44 88.75 64.10 88.53 64.79C88.32 65.49 88.17 66.20 88.05 66.94C87.92 67.68 87.85 68.45 87.76 69.24C87.68 70.03 87.63 70.85 87.52 71.66C87.41 72.47 87.31 73.31 87.12 74.11C86.94 74.90 86.71 75.71 86.40 76.44C86.08 77.18 85.70 77.90 85.24 78.54C84.78 79.17 84.23 79.76 83.62 80.27C83.02 80.79 82.32 81.23 81.61 81.61C80.89 81.99 80.11 82.30 79.33 82.58C78.56 82.86 77.74 83.06 76.95 83.28C76.17 83.50 75.37 83.67 74.62 83.89C73.87 84.10 73.14 84.30 72.45 84.57C71.76 84.83 71.10 85.12 70.48 85.46C69.85 85.81 69.26 86.21 68.68 86.66C68.10 87.10 67.55 87.61 66.98 88.13C66.41 88.66 65.86 89.23 65.27 89.78C64.68 90.33 64.09 90.91 63.46 91.42C62.83 91.93 62.17 92.44 61.48 92.84C60.79 93.25 60.07 93.61 59.32 93.86C58.58 94.10 57.80 94.27 57.02 94.33C56.24 94.39 55.44 94.35 54.65 94.23C53.86 94.12 53.06 93.89 52.29 93.64C51.51 93.39 50.75 93.05 50.00 92.73C49.25 92.40 48.53 92.02 47.81 91.69C47.10 91.37 46.41 91.03 45.72 90.76C45.02 90.50 44.34 90.26 43.65 90.10C42.95 89.93 42.26 89.83 41.55 89.78C40.83 89.72 40.10 89.74 39.34 89.77C38.59 89.79 37.81 89.89 37.02 89.95C36.23 90.01 35.41 90.10 34.60 90.12C33.79 90.15 32.95 90.17 32.15 90.09C31.35 90.02 30.54 89.90 29.78 89.68C29.03 89.46 28.29 89.16 27.61 88.78C26.94 88.39 26.30 87.91 25.73 87.37C25.16 86.83 24.64 86.20 24.17 85.55C23.70 84.90 23.29 84.17 22.90 83.46C22.51 82.75 22.18 82.00 21.83 81.29C21.47 80.58 21.16 79.87 20.80 79.20C20.44 78.54 20.08 77.90 19.67 77.31C19.25 76.72 18.81 76.18 18.32 75.66C17.82 75.14 17.27 74.67 16.69 74.20C16.10 73.74 15.46 73.31 14.81 72.85C14.16 72.40 13.47 71.96 12.81 71.47C12.15 70.99 11.46 70.50 10.85 69.95C10.24 69.40 9.64 68.82 9.15 68.19C8.65 67.56 8.20 66.88 7.87 66.17C7.53 65.46 7.28 64.71 7.12 63.93C6.96 63.16 6.90 62.35 6.91 61.55C6.91 60.74 7.02 59.92 7.15 59.11C7.27 58.30 7.48 57.49 7.66 56.71C7.85 55.92 8.07 55.15 8.24 54.39C8.41 53.63 8.58 52.90 8.68 52.17C8.78 51.43 8.83 50.72 8.83 50.00C8.82 49.28 8.74 48.57 8.63 47.83C8.52 47.10 8.34 46.36 8.15 45.60C7.97 44.84 7.73 44.06 7.53 43.27C7.33 42.48 7.11 41.67 6.97 40.85C6.83 40.04 6.71 39.21 6.70 38.40C6.68 37.59 6.72 36.77 6.87 35.99C7.02 35.21 7.26 34.44 7.59 33.72C7.92 33.00 8.36 32.32 8.85 31.68C9.34 31.04 9.93 30.45 10.54 29.89C11.14 29.34 11.82 28.83 12.48 28.34C13.14 27.84 13.83 27.39 14.48 26.93C15.12 26.47 15.77 26.03 16.35 25.55C16.94 25.08 17.49 24.60 17.98 24.07C18.48 23.55 18.93 23.00 19.35 22.40C19.76 21.80 20.13 21.16 20.49 20.49C20.86 19.82 21.18 19.10 21.54 18.39C21.89 17.67 22.24 16.92 22.63 16.21C23.03 15.49 23.45 14.77 23.93 14.11C24.41 13.46 24.93 12.83 25.51 12.29C26.10 11.76 26.74 11.28 27.42 10.90C28.11 10.52 28.86 10.22 29.62 10.01C30.39 9.79 31.21 9.68 32.02 9.61C32.83 9.54 33.67 9.57 34.49 9.60C35.31 9.64 36.14 9.74 36.94 9.81C37.74 9.88 38.53 9.98 39.29 10.02C40.05 10.06 40.79 10.09 41.51 10.05C42.23 10.01 42.93 9.92 43.63 9.77C44.33 9.62 45.01 9.40 45.71 9.15C46.40 8.90 47.10 8.57 47.81 8.26C48.53 7.95 49.25 7.58 50.00 7.27C50.75 6.96 51.51 6.64 52.28 6.40C53.06 6.17 53.85 5.96 54.64 5.86C55.43 5.76 56.23 5.73 57.00 5.80C57.77 5.88 58.55 6.06 59.28 6.32C60.02 6.58 60.74 6.95 61.42 7.37C62.11 7.78 62.76 8.30 63.38 8.82C64.00 9.34 64.59 9.93 65.17 10.49C65.74 11.05 66.29 11.63 66.85 12.16C67.41 12.69 67.95 13.20 68.52 13.65C69.09 14.10 69.67 14.51 70.29 14.86C70.91 15.21 71.55 15.50 72.23 15.77C72.91 16.03 73.64 16.23 74.38 16.45C75.12 16.66 75.91 16.83 76.68 17.05C77.46 17.26 78.27 17.47 79.04 17.74C79.81 18.02 80.59 18.32 81.30 18.70C82.01 19.08 82.70 19.51 83.30 20.02C83.90 20.52 84.45 21.10 84.91 21.73C85.37 22.36 85.75 23.07 86.06 23.80C86.38 24.53 86.60 25.32 86.79 26.11C86.98 26.90 87.08 27.72 87.19 28.53C87.30 29.33 87.36 30.14 87.45 30.92C87.54 31.70 87.62 32.46 87.75 33.19C87.89 33.92 88.04 34.63 88.26 35.31C88.48 36.00 88.76 36.65 89.09 37.30C89.41 37.95 89.81 38.58 90.22 39.22C90.64 39.87 91.12 40.50 91.58 41.16C92.04 41.82 92.55 42.49 92.99 43.19C93.42 43.89 93.87 44.61 94.21 45.35C94.56 46.09 94.87 46.86 95.06 47.64C95.25 48.41 95.37 49.21 95.37 50.00Z", "redondo": "M94.69 50.00C94.74 50.97 94.75 51.95 94.71 52.93C94.68 53.91 94.61 54.89 94.50 55.86C94.38 56.83 94.23 57.80 94.04 58.76C93.85 59.72 93.62 60.68 93.36 61.62C93.09 62.56 92.79 63.49 92.45 64.41C92.11 65.33 91.74 66.23 91.34 67.12C90.93 68.01 90.50 68.89 90.03 69.74C89.57 70.60 89.07 71.44 88.55 72.26C88.04 73.08 87.49 73.88 86.92 74.67C86.35 75.45 85.76 76.22 85.14 76.96C84.53 77.71 83.89 78.44 83.23 79.15C82.58 79.85 81.90 80.54 81.21 81.21C80.51 81.87 79.80 82.52 79.07 83.14C78.33 83.77 77.58 84.37 76.82 84.95C76.05 85.53 75.27 86.08 74.47 86.62C73.67 87.15 72.85 87.65 72.02 88.13C71.18 88.61 70.34 89.07 69.47 89.49C68.61 89.91 67.74 90.31 66.85 90.67C65.96 91.04 65.06 91.37 64.15 91.68C63.24 91.98 62.31 92.25 61.39 92.49C60.46 92.73 59.52 92.93 58.57 93.11C57.63 93.28 56.68 93.42 55.73 93.53C54.78 93.64 53.82 93.72 52.87 93.76C51.91 93.81 50.96 93.82 50.00 93.80C49.04 93.79 48.09 93.74 47.14 93.66C46.19 93.59 45.24 93.49 44.29 93.36C43.35 93.23 42.41 93.07 41.47 92.89C40.53 92.70 39.60 92.49 38.68 92.26C37.75 92.03 36.83 91.77 35.92 91.49C35.00 91.20 34.10 90.89 33.20 90.56C32.30 90.23 31.41 89.87 30.53 89.49C29.64 89.11 28.77 88.70 27.91 88.26C27.05 87.83 26.20 87.36 25.36 86.87C24.53 86.38 23.70 85.87 22.90 85.32C22.09 84.77 21.30 84.20 20.54 83.60C19.77 82.99 19.02 82.36 18.30 81.70C17.58 81.04 16.88 80.35 16.21 79.63C15.54 78.92 14.90 78.17 14.29 77.40C13.68 76.63 13.10 75.84 12.56 75.02C12.01 74.20 11.50 73.36 11.03 72.50C10.55 71.64 10.11 70.76 9.71 69.87C9.31 68.97 8.94 68.06 8.62 67.14C8.29 66.22 8.00 65.29 7.74 64.35C7.48 63.41 7.26 62.45 7.07 61.50C6.89 60.55 6.73 59.59 6.61 58.63C6.49 57.67 6.40 56.71 6.34 55.75C6.27 54.79 6.24 53.83 6.23 52.87C6.23 51.91 6.25 50.95 6.29 50.00C6.34 49.05 6.41 48.10 6.50 47.15C6.59 46.20 6.71 45.26 6.85 44.32C6.99 43.38 7.15 42.44 7.34 41.51C7.53 40.58 7.74 39.66 7.97 38.74C8.20 37.82 8.46 36.90 8.74 36.00C9.03 35.09 9.33 34.19 9.67 33.29C10.00 32.40 10.36 31.52 10.75 30.64C11.14 29.77 11.55 28.91 12.00 28.06C12.44 27.21 12.92 26.37 13.42 25.56C13.92 24.74 14.45 23.93 15.01 23.15C15.57 22.37 16.16 21.60 16.77 20.86C17.39 20.12 18.03 19.39 18.70 18.70C19.37 18.00 20.06 17.33 20.78 16.68C21.50 16.03 22.24 15.41 23.00 14.82C23.76 14.22 24.55 13.65 25.35 13.11C26.16 12.57 26.98 12.06 27.82 11.58C28.65 11.09 29.51 10.63 30.38 10.21C31.24 9.78 32.13 9.38 33.02 9.00C33.91 8.63 34.82 8.28 35.73 7.97C36.65 7.65 37.57 7.36 38.51 7.10C39.44 6.84 40.38 6.61 41.33 6.41C42.28 6.20 43.23 6.03 44.19 5.89C45.15 5.74 46.12 5.63 47.09 5.55C48.05 5.47 49.03 5.42 50.00 5.40C50.97 5.39 51.95 5.40 52.92 5.45C53.89 5.51 54.86 5.59 55.83 5.71C56.80 5.83 57.76 5.99 58.72 6.18C59.67 6.38 60.62 6.61 61.56 6.87C62.49 7.14 63.42 7.44 64.33 7.78C65.24 8.11 66.15 8.49 67.03 8.89C67.91 9.30 68.78 9.74 69.62 10.21C70.47 10.67 71.30 11.18 72.11 11.70C72.92 12.23 73.71 12.79 74.47 13.37C75.24 13.95 75.99 14.56 76.71 15.19C77.44 15.82 78.14 16.47 78.82 17.13C79.51 17.80 80.17 18.49 80.81 19.19C81.45 19.89 82.07 20.61 82.67 21.35C83.27 22.08 83.86 22.83 84.42 23.59C84.99 24.35 85.53 25.12 86.06 25.91C86.58 26.69 87.09 27.49 87.58 28.30C88.07 29.11 88.54 29.93 88.99 30.77C89.45 31.60 89.88 32.45 90.29 33.31C90.70 34.17 91.09 35.05 91.45 35.93C91.81 36.82 92.15 37.71 92.46 38.62C92.77 39.53 93.06 40.45 93.31 41.38C93.57 42.32 93.79 43.26 93.98 44.21C94.17 45.16 94.33 46.12 94.45 47.09C94.56 48.05 94.65 49.03 94.69 50.00Z", "irregular": "M95.50 50.00C95.63 50.99 95.67 52.00 95.64 52.99C95.62 53.99 95.51 54.99 95.36 55.97C95.22 56.96 94.99 57.94 94.75 58.90C94.51 59.87 94.21 60.82 93.90 61.76C93.60 62.71 93.26 63.64 92.91 64.57C92.57 65.49 92.21 66.41 91.83 67.33C91.46 68.24 91.07 69.15 90.65 70.05C90.24 70.95 89.81 71.84 89.33 72.71C88.85 73.57 88.34 74.43 87.77 75.24C87.20 76.05 86.59 76.83 85.92 77.56C85.25 78.29 84.52 78.97 83.75 79.60C82.98 80.22 82.15 80.79 81.31 81.31C80.46 81.83 79.57 82.28 78.68 82.70C77.78 83.12 76.86 83.48 75.96 83.83C75.05 84.17 74.13 84.47 73.24 84.78C72.34 85.09 71.46 85.36 70.59 85.66C69.72 85.95 68.87 86.24 68.02 86.55C67.18 86.85 66.35 87.16 65.53 87.49C64.71 87.82 63.89 88.17 63.07 88.52C62.25 88.86 61.44 89.23 60.61 89.59C59.78 89.94 58.94 90.31 58.08 90.65C57.23 90.98 56.36 91.32 55.48 91.60C54.59 91.88 53.69 92.14 52.77 92.33C51.86 92.52 50.93 92.68 50.00 92.75C49.07 92.82 48.13 92.83 47.20 92.76C46.27 92.70 45.33 92.55 44.43 92.34C43.52 92.13 42.62 91.84 41.75 91.49C40.88 91.15 40.03 90.73 39.21 90.28C38.39 89.83 37.60 89.32 36.83 88.81C36.06 88.29 35.32 87.73 34.60 87.19C33.87 86.65 33.17 86.09 32.47 85.55C31.77 85.01 31.09 84.48 30.39 83.96C29.69 83.45 29.00 82.96 28.30 82.48C27.59 82.00 26.87 81.55 26.14 81.09C25.41 80.63 24.67 80.20 23.92 79.74C23.17 79.28 22.41 78.83 21.66 78.34C20.91 77.86 20.15 77.36 19.42 76.82C18.70 76.27 17.98 75.70 17.31 75.08C16.65 74.46 16.01 73.80 15.43 73.10C14.86 72.39 14.33 71.64 13.88 70.86C13.42 70.07 13.02 69.24 12.69 68.40C12.36 67.55 12.11 66.67 11.90 65.78C11.69 64.90 11.55 63.99 11.44 63.09C11.33 62.19 11.28 61.28 11.24 60.39C11.19 59.49 11.19 58.60 11.18 57.72C11.17 56.84 11.17 55.98 11.16 55.11C11.14 54.25 11.12 53.40 11.07 52.55C11.02 51.70 10.96 50.86 10.87 50.00C10.78 49.14 10.66 48.29 10.53 47.41C10.39 46.54 10.23 45.65 10.07 44.74C9.91 43.83 9.73 42.91 9.56 41.96C9.39 41.00 9.21 40.03 9.07 39.03C8.92 38.04 8.78 37.01 8.70 35.98C8.63 34.95 8.57 33.89 8.60 32.85C8.63 31.81 8.71 30.75 8.88 29.72C9.06 28.70 9.31 27.68 9.65 26.70C9.99 25.73 10.43 24.79 10.93 23.89C11.43 23.00 12.02 22.15 12.65 21.34C13.28 20.53 13.99 19.78 14.71 19.05C15.43 18.32 16.20 17.64 16.97 16.97C17.75 16.31 18.55 15.68 19.36 15.06C20.17 14.45 20.99 13.85 21.83 13.29C22.67 12.72 23.52 12.17 24.39 11.67C25.26 11.17 26.15 10.69 27.06 10.27C27.98 9.86 28.91 9.48 29.87 9.18C30.82 8.87 31.80 8.62 32.79 8.45C33.77 8.27 34.78 8.16 35.78 8.12C36.79 8.08 37.80 8.11 38.80 8.19C39.79 8.27 40.79 8.43 41.77 8.61C42.74 8.79 43.70 9.03 44.64 9.28C45.57 9.52 46.49 9.81 47.38 10.08C48.28 10.35 49.15 10.64 50.00 10.91C50.85 11.17 51.69 11.43 52.51 11.66C53.34 11.89 54.15 12.10 54.97 12.28C55.78 12.47 56.59 12.62 57.41 12.77C58.22 12.92 59.04 13.04 59.87 13.17C60.69 13.31 61.53 13.42 62.36 13.58C63.20 13.73 64.04 13.88 64.88 14.08C65.71 14.29 66.55 14.51 67.36 14.80C68.17 15.08 68.98 15.41 69.75 15.80C70.52 16.18 71.27 16.62 71.98 17.11C72.68 17.60 73.36 18.15 73.99 18.73C74.63 19.31 75.22 19.95 75.79 20.59C76.35 21.24 76.87 21.93 77.38 22.62C77.89 23.31 78.36 24.02 78.83 24.71C79.31 25.41 79.76 26.12 80.23 26.80C80.70 27.49 81.17 28.17 81.67 28.84C82.17 29.51 82.68 30.16 83.22 30.82C83.77 31.47 84.34 32.12 84.93 32.77C85.52 33.43 86.15 34.08 86.78 34.76C87.41 35.45 88.07 36.13 88.71 36.86C89.35 37.58 90.01 38.33 90.62 39.12C91.23 39.90 91.83 40.72 92.37 41.57C92.90 42.42 93.41 43.32 93.83 44.23C94.25 45.14 94.62 46.10 94.89 47.06C95.17 48.02 95.38 49.01 95.50 50.00ZM58 86L68.5 86C70.5 92 68.8 97.5 63.6 98.6C58.6 97.6 56 92.5 58 86ZM85.80 82.00A2.70 2.70 0 1 1 91.20 82.00A2.70 2.70 0 1 1 85.80 82.00ZM92.20 76.50A1.30 1.30 0 1 1 94.80 76.50A1.30 1.30 0 1 1 92.20 76.50ZM9.60 18.50A1.90 1.90 0 1 1 13.40 18.50A1.90 1.90 0 1 1 9.60 18.50Z"};
  var NS = 'http://www.w3.org/2000/svg';

  function rgb(h) { h = String(h || '').replace('#', ''); if (h.length !== 6) return [158, 42, 43]; return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mezcla(a, b, t) { var A = rgb(a), B = rgb(b); return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]); }
  function luminancia(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }

  var contador = 0;
  function unico(s) { contador++; return s.replace(/(id="|#)sello-/g, '$1sello' + contador + '-'); }

  function svgLacre(forma) {
    var P = FORMAS[forma] || FORMAS.ondulado, m = '', luz = '', sombra = '', i, d;
    for (i = 1; i <= 16; i++) {
      d = (i * 0.32).toFixed(2);
      m += '<mask id="sello-mL' + i + '" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140"><use href="#sello-forma" fill="#fff"/><use href="#sello-forma" x="' + d + '" y="' + d + '" fill="#000"/></mask>';
      m += '<mask id="sello-mS' + i + '" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140"><use href="#sello-forma" fill="#fff"/><use href="#sello-forma" x="-' + d + '" y="-' + d + '" fill="#000"/></mask>';
      luz += '<rect x="-20" y="-20" width="140" height="140" fill="#fff" fill-opacity="0.05" mask="url(#sello-mL' + i + ')"/>';
      sombra += '<rect x="-20" y="-20" width="140" height="140" fill="#000" fill-opacity="0.033" mask="url(#sello-mS' + i + ')"/>';
    }
    return unico('<svg class="sello-svg" viewBox="0 0 100 100" xmlns="' + NS + '" aria-hidden="true" focusable="false">' +
      '<defs><path id="sello-forma" d="' + P + '"/>' + m +
      '<radialGradient id="sello-suelo" gradientUnits="userSpaceOnUse" cx="54" cy="59" r="49"><stop offset="0.55" stop-color="#1a0a06" stop-opacity="0.45"/><stop offset="1" stop-color="#1a0a06" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sello-cupula" gradientUnits="userSpaceOnUse" cx="34" cy="28" r="74"><stop offset="0" stop-color="#fff" stop-opacity="0.26"/><stop offset="0.42" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></radialGradient>' +
      '<linearGradient id="sello-hueco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.42"/></linearGradient>' +
      '<linearGradient id="sello-brillo" gradientUnits="userSpaceOnUse" x1="15.9" y1="35.5" x2="46.8" y2="13.1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sello-rebote" gradientUnits="userSpaceOnUse" x1="84.8" y1="62.7" x2="59.6" y2="85.7"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="sello-plano" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.13"/><stop offset="1" stop-color="#000" stop-opacity="0.13"/></linearGradient>' +
      '<linearGradient id="sello-letra" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.24"/><stop offset="1" stop-color="#000" stop-opacity="0.10"/></linearGradient>' +
      '<radialGradient id="sello-gloss" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="54" cy="59" rx="49" ry="46" fill="url(#sello-suelo)"/>' +
      '<use href="#sello-forma" style="fill:var(--sello-color,#9e2a2b)"/>' +
      '<use href="#sello-forma" fill="url(#sello-cupula)"/>' + luz + sombra +
      '<path d="M15.9 35.5A37 37 0 0 1 46.8 13.1" fill="none" stroke="url(#sello-brillo)" stroke-width="1.7" stroke-linecap="round"/>' +
      '<path d="M84.8 62.7A37 37 0 0 1 59.6 85.7" fill="none" stroke="url(#sello-rebote)" stroke-width="1.2" stroke-linecap="round"/>' +
      '<ellipse cx="34" cy="25" rx="15" ry="7.5" transform="rotate(-35 34 25)" fill="url(#sello-gloss)"/>' +
      '<circle cx="50" cy="50" r="31.6" fill="none" stroke="#000" stroke-opacity="0.30" stroke-width="0.55"/>' +
      '<circle cx="50" cy="50" r="30.6" style="fill:var(--sello-color,#9e2a2b)"/>' +
      '<circle cx="50" cy="50" r="30.6" fill="url(#sello-plano)"/>' +
      '<circle cx="50" cy="50" r="30.7" fill="none" stroke="url(#sello-hueco)" stroke-width="1.7"/>' +
      '<circle cx="50" cy="50" r="26.7" fill="none" stroke="#000" stroke-opacity="0.20" stroke-width="0.45"/>' +
      '<circle cx="50" cy="50" r="27.2" fill="none" stroke="#fff" stroke-opacity="0.26" stroke-width="0.4"/>' +
      '<g class="sello-texto" text-anchor="middle" style="font-family:var(--fuente-nombres,serif);font-weight:700">' +
      '<text class="st-sombra" fill="#000" fill-opacity="0.7" x="50.5" y="58"></text>' +
      '<text class="st-luz" fill="#fff" fill-opacity="0.62" x="49.5" y="57"></text>' +
      '<text class="st-cera" style="fill:var(--sello-color,#9e2a2b)" x="50" y="57.5"></text>' +
      '<text class="st-brillo" fill="url(#sello-letra)" x="50" y="57.5"></text></g></svg>');
  }

  function svgClasico(color) {
    var lum = luminancia(color), brillo = (0.3 + 0.65 * Math.min(1, lum / 0.6)).toFixed(2);
    return unico('<svg class="sello-svg" viewBox="0 0 100 100" xmlns="' + NS + '" aria-hidden="true" focusable="false">' +
      '<defs><radialGradient id="sello-suelo" gradientUnits="userSpaceOnUse" cx="50" cy="56" r="56"><stop offset="0.7" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sello-perla" gradientUnits="userSpaceOnUse" cx="36" cy="30" r="66"><stop offset="0" stop-color="#fff" stop-opacity="' + brillo + '"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sello-canto" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="48"><stop offset="0.72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.10"/></radialGradient></defs>' +
      '<circle cx="50" cy="53" r="49" fill="url(#sello-suelo)"/>' +
      '<circle cx="50" cy="50" r="47" style="fill:var(--sello-color,#f4efe6)"/>' +
      '<circle cx="50" cy="50" r="47" fill="url(#sello-perla)"/><circle cx="50" cy="50" r="47" fill="url(#sello-canto)"/>' +
      '<circle cx="50" cy="50" r="46.6" fill="none" stroke="#000" stroke-opacity="0.09" stroke-width="0.8"/>' +
      '<g class="sello-texto" text-anchor="middle" style="font-family:var(--fuente-nombres,serif)">' +
      '<text class="st-luz" fill="#fff" fill-opacity="0.75" x="50.5" y="58.3"></text>' +
      '<text class="st-cera" x="50" y="57.7"></text></g></svg>');
  }

  // Ajusta tamano y posicion de las iniciales para que queden dentro del centro liso.
  function ajustar(cont) {
    var o = cont._sello; if (!o) return;
    var textos = cont.querySelectorAll('.sello-texto text'); if (!textos.length) return;
    var lacre = o.tipo === 'lacre', maxAncho = lacre ? 35 : 60, tope = lacre ? 23 : 21, i;
    for (i = 0; i < textos.length; i++) { textos[i].textContent = o.iniciales; textos[i].style.fontSize = '20px'; }
    var ref = cont.querySelector('.st-cera'), ancho = 0;
    try { ancho = ref.getComputedTextLength(); } catch (e) {}
    if (!ancho) ancho = o.iniciales.length * 20 * 0.56;            // sin medir (pagina oculta): estimacion
    var fs = Math.max(8, Math.min(tope, 20 * maxAncho / ancho));
    var y = 50 + fs * 0.34;                                        // centro optico de mayusculas
    for (i = 0; i < textos.length; i++) {
      textos[i].style.fontSize = fs.toFixed(2) + 'px';
      var dx = textos[i].classList.contains('st-sombra') ? 0.55 : textos[i].classList.contains('st-luz') ? (lacre ? -0.5 : 0.5) : 0;
      var dy = textos[i].classList.contains('st-sombra') ? 0.55 : textos[i].classList.contains('st-luz') ? (lacre ? -0.5 : 0.6) : 0;
      textos[i].setAttribute('x', (50 + dx).toFixed(2)); textos[i].setAttribute('y', (y + dy).toFixed(2));
    }
  }

  window.renderSello = function (cont, o) {
    if (!cont) return;
    o = o || {};
    var tipo = o.tipo === 'clasico' ? 'clasico' : 'lacre';
    var color = /^#[0-9a-fA-F]{6}$/.test(o.color || '') ? o.color : (tipo === 'lacre' ? '#9e2a2b' : '#f4efe6');
    cont._sello = { tipo: tipo, iniciales: String(o.iniciales || '').slice(0, 8), forma: o.forma };
    cont.classList.remove('tipo-clasico', 'tipo-lacre'); cont.classList.add('tipo-' + tipo);
    cont.style.setProperty('--sello-color', color);
    var esc = Math.max(0.5, Math.min(2, (parseFloat(o.tamano) || 100) / 100));
    cont.style.setProperty('--sello-escala', String(esc));
    cont.innerHTML = tipo === 'lacre' ? svgLacre(o.forma) : svgClasico(color);
    if (tipo === 'clasico') {                                       // texto oscuro sobre color claro y claro sobre oscuro
      var t = cont.querySelector('.st-cera');
      t.setAttribute('fill', luminancia(color) > 0.42 ? mezcla(color, '#3b3226', 0.62) : mezcla(color, '#ffffff', 0.9));
      cont.querySelector('.st-luz').setAttribute('fill-opacity', luminancia(color) > 0.42 ? '0.8' : '0');
    }
    ajustar(cont);
    if (document.fonts) {
      if (cont._selloFuentes) document.fonts.removeEventListener('loadingdone', cont._selloFuentes);
      cont._selloFuentes = function () { ajustar(cont); };
      document.fonts.addEventListener('loadingdone', cont._selloFuentes);
      if (document.fonts.ready) document.fonts.ready.then(cont._selloFuentes);
    }
    setTimeout(function () { ajustar(cont); }, 1500);
  };
  window.reajustarSello = function (cont) { if (cont) ajustar(cont); };
})();
