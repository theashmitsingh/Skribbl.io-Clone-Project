'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { socket } from '@/lib/socket';

export default function GameRoomScreen() {
  const params = useParams();
  const roomId = (params.id as string).trim().toUpperCase();
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || 'Player';

  // Game state
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<{name: string, text: string, type: 'chat'|'system'}[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [timer, setTimer] = useState(0);
  const [wordToDraw, setWordToDraw] = useState('');
  const [phase, setPhase] = useState('Lobby'); // 'Lobby', 'WordSelection', 'ActiveDrawing', 'RoundReveal', 'GameOver'
  const [currentDrawerId, setCurrentDrawerId] = useState(''); 
  
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [gameOverData, setGameOverData] = useState<any>(null);

  // Canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasHistory = useRef<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000'); 
  const [brushSize, setBrushSize] = useState(5);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const triggerJoin = () => {
        if (!roomId || !playerName) return;
        socket.emit('join_room', { roomId, playerName }, (response: any) => {
            if (response && !response.success) alert("⚠️ Error: " + response.message);
        });
    };

    triggerJoin();
    socket.on('connect', triggerJoin);
    socket.on('update_players', (playersList) => setPlayers(playersList));

    // Canvas events
    socket.on('draw_data', (stroke) => {
        drawLineOnCanvas(stroke.x0, stroke.y0, stroke.x1, stroke.y1, stroke.color, stroke.size);
    });

    socket.on('canvas_clear', () => clearLocalCanvas());

    socket.on('undo_canvas', (canvasState) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas && canvasState) {
            const img = new Image();
            img.src = canvasState;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
        }
    });

    // Game events
    socket.on('round_start', (data) => {
        setPhase(data.phase);
        setCurrentDrawerId(data.drawerId);
        clearLocalCanvas();
        setWordChoices([]);
        
        if (socket.id !== data.drawerId) {
             setWordToDraw('Waiting for drawer...');
             setMessages(prev => [...prev, { name: 'System', text: 'Drawer is picking a word...', type: 'system' }]);
        }
    });

    socket.on('word_choices', (data) => setWordChoices(data.words));

    socket.on('word_chosen', (data) => {
        setPhase('ActiveDrawing');
        setTimer(data.drawTime);
        if (socket.id !== data.drawerId) {
             setWordToDraw('_ '.repeat(data.wordLength));
             setMessages(prev => [...prev, { name: 'System', text: 'Round Started! Guess the word.', type: 'system' }]);
        }
    });

    socket.on('your_word', (data) => {
        setWordToDraw(data.word);
        setMessages(prev => [...prev, { name: 'System', text: `You are drawing: ${data.word}`, type: 'system' }]);
    });

    socket.on('timer_tick', (data) => setTimer(data.timeLeft));

    socket.on('round_end', (data) => {
        setPhase('RoundReveal');
        setWordToDraw(`The word was: ${data.word}`);
        setPlayers(prevPlayers => data.scores.map((s: any) => {
             const player = prevPlayers.find((p: any) => p.connectionId === s.id);
             return { ...player, totalPoints: s.score, displayName: player?.displayName || 'Player' };
        }));
    });

    socket.on('game_over', (data) => {
        setPhase('GameOver');
        setGameOverData(data);
    });

    socket.on('chat_message', (data) => {
        setMessages(prev => [...prev, { name: data.playerName, text: data.text, type: data.type || 'chat' }]);
    });

    socket.on('guess_result', (data) => {
        if (data.correct) {
            setMessages(prev => [...prev, { name: 'System', text: `${data.playerName} guessed the word! (+${data.points} pts)`, type: 'system' }]);
        }
    });

    return () => {
        socket.off('connect');
        socket.off('update_players');
        socket.off('draw_data');
        socket.off('canvas_clear');
        socket.off('undo_canvas');
        socket.off('round_start');
        socket.off('word_choices');
        socket.off('word_chosen');
        socket.off('your_word');
        socket.off('timer_tick');
        socket.off('round_end');
        socket.off('game_over');
        socket.off('chat_message');
        socket.off('guess_result');
    };
  }, [roomId, playerName]);

  // Drawing logic
  const clearLocalCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          canvasHistory.current = [];
      }
  };

  const drawLineOnCanvas = (x0: number, y0: number, x1: number, y1: number, color: string, size: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.closePath();
  };

  // 🛠️ Updated for Canvas Scaling & Mobile Touch
  const getCoordinates = (e: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX = e.clientX;
      let clientY = e.clientY;

      if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      }

      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
      };
  };

  const startDrawing = (e: any) => {
      if (socket.id !== currentDrawerId || phase !== 'ActiveDrawing') return; 
      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      lastPos.current = coords;
  };

  const draw = (e: any) => {
      if (!isDrawing || !lastPos.current || socket.id !== currentDrawerId) return;
      const coords = getCoordinates(e);
      if (!coords) return;

      drawLineOnCanvas(lastPos.current.x, lastPos.current.y, coords.x, coords.y, color, brushSize);

      socket.emit('draw_data', {
          roomId,
          stroke: { x0: lastPos.current.x, y0: lastPos.current.y, x1: coords.x, y1: coords.y, color, size: brushSize }
      });

      lastPos.current = coords;
  };

  const stopDrawing = () => {
      if (isDrawing) {
          setIsDrawing(false);
          lastPos.current = null;
          
          const canvas = canvasRef.current;
          if (canvas) {
              canvasHistory.current.push(canvas.toDataURL());
          }
      }
  };

  const handleUndoClick = () => {
      if (canvasHistory.current.length > 0) {
          canvasHistory.current.pop(); 
          
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!ctx || !canvas) return;

          if (canvasHistory.current.length > 0) {
              const previousState = canvasHistory.current[canvasHistory.current.length - 1];
              const img = new Image();
              img.src = previousState;
              img.onload = () => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
              };
              socket.emit('undo_canvas', { roomId, canvasState: previousState });
          } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              socket.emit('canvas_clear', { roomId });
          }
      }
  };

  const handleClearCanvasClick = () => {
      clearLocalCanvas();
      socket.emit('canvas_clear', { roomId });
  };

  const handleStartGame = () => {
      socket.emit('start_game', { roomId });
  };

  const submitGuess = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentGuess.trim()) return;
      socket.emit('guess', { roomId, text: currentGuess });
      setCurrentGuess('');
  };

  const isMyTurn = socket.id === currentDrawerId;

  
  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 p-3 md:p-5">
      <header className="grid grid-cols-3 items-center gap-2 bg-white border border-gray-300 rounded-md p-3 mb-4">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Room Code</p>
          <p className="font-bold truncate">{roomId}</p>
        </div>

        <div className="text-center min-w-0">
          <p className="text-xs text-gray-500">Word</p>
          <p className="font-bold text-blue-600 truncate">
            {wordToDraw || 'WAITING...'}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Time Left</p>
          <p className={`font-bold text-xl ${timer <= 10 && timer > 0 ? 'text-red-600' : ''}`}>
            {timer}s
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px] gap-4">
        <section className="order-3 lg:order-1 bg-white border border-gray-300 rounded-md p-4">
          <h2 className="font-bold border-b border-gray-200 pb-2 mb-3">
            Players
          </h2>

          <div className="space-y-2">
            {players.length === 0 && (
              <p className="text-sm text-gray-500">Waiting for players...</p>
            )}

            {players.map((p, i) => (
              <div
                key={i}
                className={`flex justify-between gap-2 p-2 rounded border ${
                  p.connectionId === currentDrawerId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="truncate">
                  {p.displayName}
                  {p.connectionId === currentDrawerId && ' (Drawing)'}
                </span>
                <span className="font-semibold whitespace-nowrap">
                  {p.totalPoints} pts
                </span>
              </div>
            ))}
          </div>

          {phase === 'Lobby' && (
            <button
              onClick={handleStartGame}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Start Game
            </button>
          )}
        </section>

        <section className="order-1 lg:order-2 min-w-0">
          <div className="relative w-full aspect-4/3 bg-white border border-gray-300 rounded-md overflow-hidden">
            {phase === 'WordSelection' && (
              <div className="absolute inset-0 z-20 bg-white/95 flex flex-col items-center justify-center p-4">
                {isMyTurn ? (
                  <div className="text-center">
                    <h2 className="text-xl font-bold mb-4">Choose a Word</h2>
                    <div className="flex flex-wrap justify-center gap-2">
                      {wordChoices.map((w) => (
                        <button
                          key={w}
                          onClick={() =>
                            socket.emit('choose_word', { roomId, word: w })
                          }
                          className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                      Auto-selecting in {timer}s
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-lg font-bold">
                      Waiting for drawer...
                    </h2>
                  </div>
                )}
              </div>
            )}

            {phase === 'GameOver' && gameOverData && (
              <div className="absolute inset-0 z-30 bg-white flex flex-col items-center p-4 overflow-y-auto">
                <h1 className="text-3xl font-bold mb-3">Game Over!</h1>
                <h2 className="text-lg mb-4 text-center">
                  Winner: {gameOverData.winner?.name}
                </h2>

                <div className="w-full max-w-md">
                  <h3 className="font-bold border-b border-gray-300 pb-2">
                    Final Standings
                  </h3>

                  {gameOverData.leaderboard.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between border-b border-gray-200 py-3"
                    >
                      <span>
                        #{i + 1} {p.name}
                      </span>
                      <span className="font-semibold">{p.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-full bg-white touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
            />

            {phase === 'ActiveDrawing' && isMyTurn && (
              <div className="absolute inset-0 pointer-events-none border-2 border-blue-500" />
            )}
          </div>

          <div
            className={`mt-3 flex flex-wrap items-center justify-center gap-3 bg-white border border-gray-300 rounded-md p-3 ${
              isMyTurn && phase === 'ActiveDrawing'
                ? ''
                : 'hidden'
            }`}
          >
            <div className="flex gap-2">
              {['#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#eab308'].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    aria-label={`Select ${c} brush color`}
                    className={`w-7 h-7 rounded-full border border-gray-400 ${
                      color === c ? 'ring-2 ring-blue-600' : ''
                    }`}
                  />
                )
              )}
            </div>

            <button
              onClick={handleUndoClick}
              className="border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
            >
              Undo
            </button>

            <button
              onClick={handleClearCanvasClick}
              className="border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="order-2 lg:order-3 flex flex-col h-87.5 lg:h-150 min-w-0 bg-white border border-gray-300 rounded-md overflow-hidden">
          <h2 className="font-bold p-3 border-b border-gray-200">Chat</h2>

          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm wrap-break-word ${
                  msg.type === 'system'
                    ? 'text-blue-700'
                    : 'text-gray-800'
                }`}
              >
                {msg.type === 'chat' && (
                  <span className="font-bold">{msg.name}: </span>
                )}
                {msg.text}
              </div>
            ))}
          </div>

          <form
            onSubmit={submitGuess}
            className="p-3 border-t border-gray-200"
          >
            <input
              type="text"
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              disabled={isMyTurn && phase === 'ActiveDrawing'}
              placeholder={
                isMyTurn && phase === 'ActiveDrawing'
                  ? 'You are drawing'
                  : 'Type your guess...'
              }
              className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-blue-500 disabled:bg-gray-100"
            />
          </form>
        </section>
      </div>
    </main>
  );
}