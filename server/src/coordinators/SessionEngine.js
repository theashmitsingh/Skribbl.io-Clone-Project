const GameSession = require('../domain/GameSession');
const { nanoid } = require('nanoid'); 

class SessionEngine {
    constructor() {
        this.activeSessions = new Map();
    }

    initializeSession(adminId, config, io) {
        const sessionId = nanoid(6).toUpperCase();
        const newSession = new GameSession(sessionId, adminId, config, io);
        this.activeSessions.set(sessionId, newSession);
        return newSession;
    }

    fetchSession(sessionId) {
        if (typeof sessionId !== 'string') return undefined;
        const normalizedId = sessionId.trim().toUpperCase();
        return this.activeSessions.get(normalizedId);
    }

    terminateSession(sessionId) {
        this.activeSessions.delete(sessionId);
    }
}

module.exports = new SessionEngine();