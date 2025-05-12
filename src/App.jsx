// Traska - Space Race (React + full feature set)
import React, { useState, useEffect } from 'react';

const Button = ({ onClick, onDoubleClick, children }) => (
  <button
    onClick={onClick}
    onDoubleClick={onDoubleClick}
    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    {children}
  </button>
);

const GRID_SIZE = 10;
const INITIAL_ENERGY = 5;
const FUEL_MIN = 2;
const FUEL_MAX = 10;

const generateMap = () => {
  const map = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
  const path = [[0, 0]];
  let x = 0, y = 0;

  while (x < GRID_SIZE - 1 || y < GRID_SIZE - 1) {
    const options = [];
    if (x < GRID_SIZE - 1) options.push([x + 1, y]);
    if (y < GRID_SIZE - 1) options.push([x, y + 1]);
    const [nx, ny] = options[Math.floor(Math.random() * options.length)];
    path.push([nx, ny]);
    x = nx;
    y = ny;
  }

  path.forEach(([x, y]) => (map[y][x] = 'path'));
  for (let i = 1; i < path.length - 1; i += 2) {
    const [x, y] = path[i];
    map[y][x] = `fuel-${Math.floor(Math.random() * (FUEL_MAX - FUEL_MIN + 1)) + FUEL_MIN}`;
  }

  map[0][0] = 'start';
  map[y][x] = 'finish';
  return { map, path };
};

const getVector = ([x1, y1], [x2, y2]) => [x2 - x1, y2 - y1];
const vectorCost = (v1, v2) => !v1 ? Math.abs(v2[0]) + Math.abs(v2[1]) : Math.abs(v2[0] - v1[0]) + Math.abs(v2[1] - v1[1]);

export default function TraskaGame() {
  const [gridData, setGridData] = useState([]);
  const [shipPos, setShipPos] = useState([0, 0]);
  const [energy, setEnergy] = useState(INITIAL_ENERGY);
  const [prevVector, setPrevVector] = useState(null);
  const [moves, setMoves] = useState(0);
  const [validMoves, setValidMoves] = useState([]);
  const [finishPos, setFinishPos] = useState([GRID_SIZE - 1, GRID_SIZE - 1]);
  const [scoreboard, setScoreboard] = useState([]);

  const updateValidMoves = (position, energyLeft, vector) => {
    const [x, y] = position;
    const moves = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < GRID_SIZE && ny < GRID_SIZE) {
          const cell = gridData[ny]?.[nx];
          if (!cell || cell === '') continue;
          const cost = vectorCost(vector, [dx, dy]);
          if (cost <= energyLeft) moves.push([nx, ny]);
        }
      }
    }
    setValidMoves(moves);
  };

  const handleGenerate = () => {
    const { map, path } = generateMap();
    setGridData(map);
    setShipPos([0, 0]);
    setEnergy(INITIAL_ENERGY);
    setPrevVector(null);
    setMoves(0);
    setFinishPos(path[path.length - 1]);
    updateValidMoves([0, 0], INITIAL_ENERGY, null);
  };

  const handleMove = (x, y) => {
    const [sx, sy] = shipPos;
    const vector = getVector([sx, sy], [x, y]);
    const cost = vectorCost(prevVector, vector);
    if (cost > energy) return alert('Not enough energy to move!');

    let cell = gridData[y][x];
    let fuel = 0;
    if (cell.startsWith('fuel-')) {
      fuel = parseInt(cell.split('-')[1]);
      const newGrid = [...gridData];
      newGrid[y][x] = 'path';
      setGridData(newGrid);
    }

    setShipPos([x, y]);
    setEnergy(energy - cost + fuel);
    setPrevVector(vector);
    setMoves(moves + 1);
    updateValidMoves([x, y], energy - cost + fuel, vector);

    if (cell === 'finish') {
      const name = prompt('Victory! Enter your name:');
      const newEntry = { name, moves: moves + 1 };
      setScoreboard(prev => [...prev, newEntry].sort((a, b) => a.moves - b.moves).slice(0, 10));
    }
  };

  const handleInertia = () => {
    if (!prevVector) return;
    const [x, y] = shipPos;
    const [dx, dy] = prevVector;
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
    handleMove(nx, ny);
  };

  const handleRestart = () => {
    setShipPos([0, 0]);
    setEnergy(INITIAL_ENERGY);
    setPrevVector(null);
    setMoves(0);
    updateValidMoves([0, 0], INITIAL_ENERGY, null);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Traska - Space Race</h1>
      <div className="flex gap-2 mb-4">
        <Button onClick={handleGenerate}>Generate Map</Button>
        <Button onClick={handleRestart}>Restart</Button>
        <Button onDoubleClick={handleInertia}>Inertia Move (double click)</Button>
      </div>
      <div className="mb-2">Energy: {energy} | Moves: {moves}</div>
      <div className="grid grid-cols-10 gap-1">
        {gridData.map((row, y) =>
          row.map((cell, x) => {
            const isValid = validMoves.some(([vx, vy]) => vx === x && vy === y);
            return (
              <div
                key={`${x}-${y}`}
                className={`w-8 h-8 flex items-center justify-center text-xs rounded cursor-pointer border ${
                  shipPos[0] === x && shipPos[1] === y ? 'bg-blue-500 text-white' :
                  cell === 'start' ? 'bg-green-500 text-white' :
                  cell === 'finish' ? 'bg-red-500 text-white' :
                  cell.startsWith('fuel') ? 'bg-yellow-300' :
                  cell === 'path' ? 'bg-gray-200' : 'bg-black'
                } ${isValid ? 'ring-2 ring-blue-300' : ''}`}
                onClick={() => handleMove(x, y)}
                onDoubleClick={() => shipPos[0] === x && shipPos[1] === y && handleInertia()}
              >
                {cell.startsWith('fuel') ? cell.split('-')[1] : ''}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Top Scorers</h2>
        <ul className="list-decimal pl-5">
          {scoreboard.map((entry, idx) => (
            <li key={idx}>{entry.name}: {entry.moves} moves</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
