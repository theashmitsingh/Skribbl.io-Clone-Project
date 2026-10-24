const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sessionEngine = require('./coordinators/SessionEngine');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // --- ROOM MANAGEMENT EVENTS ---

    socket.on('create_room', (payload, callback) => {
        try {
            const { hostName, settings } = payload;
            
            const session = sessionEngine.initializeSession(socket.id, settings, io);
            console.log(`Session created: ${session.sessionId} by ${hostName}`);
            
            callback({ success: true, roomId: session.sessionId });
        } catch (error) {
            callback({ success: false, message: error.message });
        }
    });

    socket.on('join_room', (payload, callback) => {
    try {
        const { roomId, playerName } = payload;

        const normalizedRoomId = roomId.trim().toUpperCase();

        console.log('Room ID received:', roomId);
        console.log('Normalized Room ID:', normalizedRoomId);

        const session = sessionEngine.fetchSession(normalizedRoomId);

        if (!session) {
            throw new Error('Session unavailable or expired');
        }

        session.joinSession(socket.id, playerName);

        // Use the actual stored session ID
        socket.join(session.sessionId);

        io.to(session.sessionId).emit(
            'update_players',
            session.getParticipantRoster()
        );

        socket.to(session.sessionId).emit('chat_message', {
            playerName: 'System',
            text: `${playerName} joined the game!`,
            type: 'system'
        });

        callback({ success: true });
    } catch (error) {
        callback({
            success: false,
            message: error.message
        });
    }
});

    // Phase 2: Gameplay and Drawing Events

    // The host clicks "Start Game"
    socket.on('start_game', (payload, callback) => {
        try {
            const { roomId } = payload;
            const session = sessionEngine.fetchSession(roomId);
            if (!session) throw new Error("Session not found");
            
            if (session.adminId === socket.id) {
                session.startGame();
                if (callback) callback({ success: true });
            } else {
                throw new Error("Only the host can start the game");
            }
        } catch (error) {
            if (callback) {
                callback({ success: false, message: error.message });
            } else {
                socket.emit('game_error', { message: error.message });
            }
        }
    });

    // Drawing sync
    socket.on('draw_data', (payload) => {
        const { roomId, stroke } = payload;
        const session = sessionEngine.fetchSession(roomId);
        
        if (session && session.matchState.activeDrawerId === socket.id) {
            session.saveCanvasStroke(stroke);
            // Broadcast to everyone else in the room
            socket.to(roomId).emit('draw_data', stroke);
        }
    });

    socket.on('canvas_clear', (payload) => {
        const { roomId } = payload;
        const session = sessionEngine.fetchSession(roomId);
        
        if (session && session.matchState.activeDrawerId === socket.id) {
            session.clearCanvas();
            socket.to(roomId).emit('canvas_clear');
        }
    });

    socket.on('undo_canvas', (payload) => {
        const { roomId, canvasState } = payload;
        const session = sessionEngine.fetchSession(roomId);
        
        // Only the active drawer can undo
        if (session && session.matchState.activeDrawerId === socket.id) {
            socket.to(roomId).emit('undo_canvas', canvasState);
        }
    });


    // Drawer selects a word
    socket.on('choose_word', (payload) => {
        const { roomId, word } = payload;
        const session = sessionEngine.fetchSession(roomId);
        
        if (session) {
            session.selectWord(socket.id, word);
        }
    });

    // Chat and guessing logic
    socket.on('guess', (payload) => {
        const { roomId, text } = payload;
        const session = sessionEngine.fetchSession(roomId);
        
        if (session) {
            const isCorrect = session.processGuess(socket.id, text);
            
            // If the guess is wrong, send it as a normal chat message
            if (!isCorrect) {
                const participant = session.activeParticipants.get(socket.id);
                io.to(roomId).emit('chat_message', {
                    playerId: socket.id,
                    playerName: participant ? participant.displayName : "Unknown",
                    text: text
                });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`Connection disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Websocket is running on port ${PORT}`);
});