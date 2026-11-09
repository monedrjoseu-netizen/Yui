# BOSQUE 99 — multijugador global con salas

Juego web 3D de supervivencia retro estilo PSX. Incluye movimiento en primera persona, bosque low-poly, fogata, ciclo día/noche, recolección compartida y multijugador mediante WebSocket.

## Novedades: salas globales
- Crear salas públicas o privadas.
- Unirse a salas privadas mediante un código de 5 caracteres.
- Explorar y entrar a salas públicas desde el lobby.
- Hasta 12 jugadores por sala (configurable con `MAX_PLAYERS` en `server.js`).
- Cada sala tiene sus propios jugadores y recursos; las acciones de recolección se sincronizan dentro de esa sala.
- El código de sala se muestra en el HUD al entrar.

## Requisitos
- Node.js 18 o superior.
- Conexión a internet para cargar Three.js desde CDN.

## Ejecutar localmente
1. Descomprime el proyecto.
2. Abre una terminal dentro de `bosque_99`.
3. Ejecuta `npm install`.
4. Ejecuta `npm start`.
5. Abre `http://localhost:3000`.

Para probar en varios dispositivos de la misma red, abre la dirección IP local del PC que ejecuta el servidor.

## Publicar para jugar desde cualquier país
Despliega la carpeta `bosque_99` en un hosting que ejecute procesos Node.js y permita conexiones WebSocket (por ejemplo, Render, Railway o un VPS).
- Comando de instalación: `npm install`
- Comando de inicio: `npm start`
- Configura el hosting para usar el puerto de la variable de entorno `PORT`.
- Comparte la URL pública del servidor con tus jugadores.

Un hosting exclusivamente estático no funciona: el servidor Node.js debe permanecer activo para mantener las salas y retransmitir los eventos. Para una partida realmente global, elige una región de servidor razonablemente cercana a la mayoría de jugadores.

## Controles
- WASD o flechas: moverse.
- Mouse: mirar.
- E: recoger madera.
- F: alimentar la fogata.
- En móvil: botones táctiles en pantalla.

## Limitaciones de esta versión
Las salas viven en memoria del proceso: si el servidor se reinicia, las salas se cierran. No hay todavía cuentas, persistencia, chat visible dentro del juego, moderación, protección anti-trampas ni escalado entre múltiples instancias. La lista de salas públicas y el emparejamiento funcionan en una sola instancia Node.js.
