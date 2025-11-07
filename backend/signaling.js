// backend/signaling.js
export function registerSignaling(io){
  io.on('connection', (socket)=>{
    socket.on('room:join', ({ roomId })=>{
      console.log('[SIGNAL] join', roomId, 'socket', socket.id);
      socket.join(roomId);

      const peers = io.sockets.adapter.rooms.get(roomId) || new Set();
      const size = peers.size;
      console.log('[SIGNAL] room size', roomId, size);

      if (size === 1) {
        io.to(socket.id).emit('rtc:role', { initiator: false });
        console.log('[SIGNAL] role -> responder', socket.id);
      } else if (size === 2) {
        io.to(socket.id).emit('rtc:role', { initiator: true });
        socket.to(roomId).emit('rtc:peer-joined', { id: socket.id });
        console.log('[SIGNAL] role -> initiator', socket.id);
      } else {
        io.to(socket.id).emit('rtc:room-full');
        console.warn('[SIGNAL] room full', roomId);
      }
    });

    socket.on('signal', ({ roomId, data })=>{
      socket.to(roomId).emit('signal', { data });
    });

    socket.on('disconnecting', ()=>{
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('rtc:peer-left', { id: socket.id });
          console.log('[SIGNAL] peer-left', roomId, socket.id);
        }
      }
    });
  });
}