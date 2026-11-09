const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 12;
let seed=99199;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const RESOURCE_SEED=Array.from({length:260},(_,i)=>({id:"wood-"+i,type:"wood",x:(rand()-.5)*1800,z:(rand()-.5)*1800}));
const rooms = new Map();
const clients = new Map();

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do { code = Array.from({length:5},()=>chars[Math.floor(Math.random()*chars.length)]).join(""); }
  while (rooms.has(code));
  return code;
}
function publicRooms() {
  return [...rooms.values()].filter(r=>r.isPublic).map(r=>({
    code:r.code,name:r.name,players:r.players.size,maxPlayers:MAX_PLAYERS
  }));
}
function send(ws,obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}
function broadcast(room,obj) {
  const msg=JSON.stringify(obj);
  for (const ws of room.clients) if(ws.readyState===WebSocket.OPEN) ws.send(msg);
}
function lobbyUpdate() {
  const msg=JSON.stringify({type:"roomList",rooms:publicRooms()});
  for(const ws of clients.keys()) if(!ws.room && ws.readyState===WebSocket.OPEN) ws.send(msg);
}
function createRoom(name,isPublic) {
  const code=makeCode();
  const room={code,name:(name||"Bosque desconocido").slice(0,24),isPublic,players:new Map(),
    clients:new Set(),resources:RESOURCE_SEED.map(r=>({...r}))};
  rooms.set(code,room);
  return room;
}
function leaveRoom(ws) {
  const room=ws.room;
  if(!room) return;
  room.clients.delete(ws);
  if(ws.playerId) room.players.delete(ws.playerId);
  broadcast(room,{type:"left",id:ws.playerId,players:[...room.players.values()]});
  ws.room=null; ws.playerId=null;
  if(room.players.size===0) rooms.delete(room.code);
  lobbyUpdate();
}
const server=http.createServer((req,res)=>{
  let pathname=decodeURIComponent((req.url||"/").split("?")[0]);
  if(pathname==="/") pathname="/index.html";
  const file=path.resolve(ROOT,"."+pathname);
  if(!file.startsWith(ROOT+path.sep) && file!==path.join(ROOT,"index.html")) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end("Not found");}
    const ext=path.extname(file);
    const types={".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".json":"application/json"};
    res.writeHead(200,{"Content-Type":types[ext]||"application/octet-stream"});
    res.end(data);
  });
});
const wss=new WebSocket.Server({server});
wss.on("connection",ws=>{
  clients.set(ws,{room:null,playerId:null});
  send(ws,{type:"lobby",rooms:publicRooms()});
  ws.on("message",raw=>{
    let m; try{m=JSON.parse(raw);}catch{return;}
    if(!m||typeof m.type!=="string") return;

    if(m.type==="listRooms"){send(ws,{type:"roomList",rooms:publicRooms()});return;}
    if(m.type==="createRoom" || m.type==="joinRoom"){
      if(ws.room) leaveRoom(ws);
      let room;
      if(m.type==="createRoom"){
        room=createRoom(m.roomName,m.isPublic!==false);
      } else {
        const code=String(m.code||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);
        room=rooms.get(code);
        if(!room){send(ws,{type:"roomError",message:"No existe una sala con ese código."});return;}
      }
      if(room.players.size>=MAX_PLAYERS){send(ws,{type:"roomError",message:"La sala está llena."});return;}
      const id=Math.random().toString(36).slice(2,10);
      const player={id,name:String(m.name||"Explorador").slice(0,16),x:0,z:5,rot:0,color:Math.floor(Math.random()*0xffffff)};
      room.players.set(id,player);room.clients.add(ws);
      ws.room=room;ws.playerId=id;
      send(ws,{type:"welcome",id,room:{code:room.code,name:room.name,isPublic:room.isPublic},players:[...room.players.values()],resources:room.resources});
      broadcast(room,{type:"players",players:[...room.players.values()]});
      lobbyUpdate();return;
    }
    const room=ws.room;
    if(!room)return;
    const p=room.players.get(ws.playerId);
    if(!p)return;
    if(m.type==="move"&&Number.isFinite(m.x)&&Number.isFinite(m.z)){
      p.x=Math.max(-980,Math.min(980,m.x));p.z=Math.max(-980,Math.min(980,m.z));
      p.rot=Number.isFinite(m.rot)?m.rot:0;
      if(typeof m.name==="string")p.name=m.name.slice(0,16);
      broadcast(room,{type:"playerMoved",player:p});
    }
    if(m.type==="collect"&&typeof m.id==="string"){
      const i=room.resources.findIndex(r=>r.id===m.id);
      if(i>=0){room.resources.splice(i,1);broadcast(room,{type:"resourceRemoved",id:m.id});}
    }
    if(m.type==="chat"&&typeof m.message==="string"){
      const message=m.message.trim().slice(0,180);
      if(message)broadcast(room,{type:"chat",player:p.name,message});
    }
  });
  ws.on("close",()=>{leaveRoom(ws);clients.delete(ws);});
  ws.on("error",()=>{leaveRoom(ws);clients.delete(ws);});
});
server.listen(PORT,()=>console.log(`BOSQUE 99 global listo en puerto ${PORT}`));
