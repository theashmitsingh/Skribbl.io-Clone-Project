'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { socket } from '@/lib/socket';
import { Settings, Play, Users, Gamepad2, Shuffle } from 'lucide-react';

export default function LobbyScreen() {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [showSettings, setShowSettings] = useState(false);

  const randomNames = [
  'PixelPanda',
  'LazyPenguin',
  'CrazyDoodle',
  'MysticBrush',
  'ChocoArtist',
  'WittyWalrus',
  'PaintWizard',
  'SleepyArtist',
  'ColorNinja',
  'DoodleDuck',
  'SketchMonkey',
  'RainbowFox',
  'PencilPirate',
  'HappyBlob',
  'DrawingDino',
];

  const pickRandomName = () =>
    setName(randomNames[Math.floor(Math.random() * randomNames.length)]);

  useEffect(() => {
    socket.disconnect();
  }, []);

  const handleCreateRoom = () => {
    if (!name.trim()) return alert('Please enter your name');

    socket.connect();

    const settings = { rounds, drawTime, maxPlayers };

    socket.emit(
      'create_room',
      { hostName: name, settings },
      (response: any) => {
        if (response.success) {
          router.push(
            `/room/${response.roomId}?name=${encodeURIComponent(name)}`
          );
        } else {
          alert(response.message);
        }
      }
    );
  };

  const handleJoinRoom = () => {
    if (!name.trim()) return alert('Enter your name!');
    if (!roomId.trim()) return alert('Room ID required!');

    const cleanRoomId = roomId.trim().toUpperCase();
    const cleanName = name.trim();

    router.push(
      `/room/${cleanRoomId}?name=${encodeURIComponent(cleanName)}`
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center p-4">
      <header className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gamepad2 className="w-8 h-8" />
          <h1 className="text-3xl font-bold">SKRIBBL Clone</h1>
        </div>
        <p className="text-sm text-gray-600">
          Multiplayer Drawing & Guessing
        </p>
      </header>

      <section className="w-full max-w-md bg-white border border-gray-300 rounded-lg p-5 space-y-5">
        <div>
          <label
            htmlFor="playerName"
            className="block text-sm font-medium mb-2"
          >
            Your Name
          </label>

          <div className="flex gap-2">
            <input
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500"
            />

            <button
              onClick={pickRandomName}
              title="Generate Random Name"
              className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-3 hover:bg-gray-50"
          >
            <span className="flex items-center gap-2 font-medium">
              <Settings className="w-5 h-5" />
              Room Settings
            </span>
            <span className="text-sm text-gray-600">
              {showSettings ? 'Hide' : 'Show'}
            </span>
          </button>

          {showSettings && (
            <div className="mt-3 border border-gray-300 rounded-md p-4 space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label htmlFor="rounds">Total Rounds</label>
                  <span>{rounds}</span>
                </div>
                <input
                  id="rounds"
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label htmlFor="drawTime">Draw Duration</label>
                  <span>{drawTime}s</span>
                </div>
                <input
                  id="drawTime"
                  type="range"
                  min="15"
                  max="240"
                  step="5"
                  value={drawTime}
                  onChange={(e) => setDrawTime(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label htmlFor="maxPlayers">Maximum Players</label>
                  <span>{maxPlayers} Players</span>
                </div>
                <input
                  id="maxPlayers"
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCreateRoom}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-medium rounded-md px-4 py-3 hover:bg-blue-700"
        >
          <Play className="w-5 h-5" />
          Create Room
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        <div>
          <label
            htmlFor="roomId"
            className="block text-sm font-medium mb-2"
          >
            Join Existing Room
          </label>

          <div className="flex gap-2">
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-blue-500"
            />

            <button
              onClick={handleJoinRoom}
              className="flex items-center justify-center gap-2 bg-gray-800 text-white font-medium rounded-md px-4 py-2 hover:bg-gray-700"
            >
              <Users className="w-4 h-4" />
              Join
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
