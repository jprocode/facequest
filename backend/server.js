// backend/server.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { registerSignaling } from './signaling.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.get('/health', (_,res)=>res.json({ ok:true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN || '*' } });

registerSignaling(io);

const port = process.env.PORT || 4000;
server.listen(port, ()=>console.log(`[facequest] signaling server on :${port}`));