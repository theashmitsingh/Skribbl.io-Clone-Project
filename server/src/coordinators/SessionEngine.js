const GameSession = require('../domain/GameSession');
const { nanoid } = require('nanoid'); 

class SessionEngine {
    constructor() {
        this.activeSessions = new Map();
    }

    initializeSession(adminId, config, io) {
        const sessionId = nanoid(6); 
        const newSession = new GameSession(sessionId, adminId, config, io);
        this.activeSessions.set(sessionId, newSession);
        return newSession;
    }

    fetchSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }

    terminateSession(sessionId) {
        this.activeSessions.delete(sessionId);
    }
}

module.exports = new SessionEngine();