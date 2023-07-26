class Grid2D {
  private values: number[][];

  constructor(values: number[][]) {
    this.values = values;
  }

  get width(): number {
    return this.values[0].length;
  }

  get height(): number {
    return this.values.length;
  }

  get grid(): number[][] {
    return this.values;
  }

  checkOutOfBounds(x: number, y: number): boolean {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  get(x: number, y: number): number {
    if (this.checkOutOfBounds(x, y)) {
      console.log(`Out of bounds: ${x}, ${y}`);
    }
    return this.values[y][x];
  }

  set(x: number, y: number, value: number) {
    if (this.checkOutOfBounds(x, y)) {
      console.log(`Out of bounds: ${x}, ${y}`);
    }
    this.values[y][x] = value;
  }

  setGrid(grid: number[][]): void {
    this.values = grid;
  }

  toString(): string {
    let result = "";
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        result += this.values[y][x];
      }
      if (y != this.height - 1) {
        result += "\n";
      }
    }
    return result;
  }
}

class Game {
  private gameGrid: Grid2D;

  constructor(grid: Grid2D) {
    this.gameGrid = grid;
  }

  get grid(): Grid2D {
    return this.gameGrid;
  }

  toString(): string {
    return this.gameGrid.toString();
  }

  isSolved(): boolean {
    for (let y = 0; y < this.gameGrid.height; y++) {
      for (let x = 0; x < this.gameGrid.width; x++) {
        if (this.gameGrid.get(x, y) != 0) {
          return false;
        }
      }
    }
    return true;
  }

  moveInDirection(direction: string, x: number, y: number): [number, number] {
    switch (direction) {
      case "left":
        return [x - 1, y];
      case "right":
        return [x + 1, y];
      case "up":
        return [x, y - 1];
      case "down":
        return [x, y + 1];
      default:
        throw new Error("Invalid direction");
    }
  }

  findNeighbors(
    x: number,
    y: number,
  ): { x: number; y: number; rank: number; distance: number }[][] {
    const neighbors: {
      x: number;
      y: number;
      rank: number;
      distance: number;
    }[] = [];
    for (const direction of ["left", "right", "up", "down"]) {
      let [nx, ny] = this.moveInDirection(direction, x, y);
      if (this.grid.checkOutOfBounds(nx, ny)) {
        continue;
      }
      while (this.gameGrid.get(nx, ny) == 0) {
        [nx, ny] = this.moveInDirection(direction, nx, ny);
        if (this.grid.checkOutOfBounds(nx, ny)) {
          break;
        }
      }
      if (!this.grid.checkOutOfBounds(nx, ny)) {
        neighbors.push({
          x: nx,
          y: ny,
          rank: this.gameGrid.get(nx, ny),
          distance: Math.abs(nx - x) + Math.abs(ny - y),
        });
      }
    }
    const fourNeighbors: {
      x: number;
      y: number;
      rank: number;
      distance: number;
    }[] = [];
    const nonFourNeighbors: {
      x: number;
      y: number;
      rank: number;
      distance: number;
    }[] = [];
    for (const neighbor of neighbors) {
      if (neighbor.rank == 4) {
        fourNeighbors.push(neighbor);
      } else {
        nonFourNeighbors.push(neighbor);
      }
    }
    nonFourNeighbors.sort((a, b) => a.distance - b.distance);
    fourNeighbors.sort((a, b) => a.distance - b.distance);
    return [nonFourNeighbors, fourNeighbors];
  }
  move(x: number, y: number): void {
    let rank = this.gameGrid.get(x, y);
    if (rank == 0) {
      return;
    }

    if (rank < 4) {
      rank += 1;
      this.gameGrid.set(x, y, rank);
    } else {
      this.gameGrid.set(x, y, 0);
      const neighbors = this.findNeighbors(x, y);
      for (const neighbor of neighbors[0]) {
        this.move(neighbor.x, neighbor.y);
      }
      for (const neighbor of neighbors[1]) {
        this.move(neighbor.x, neighbor.y);
      }
    }
  }

  howManyNonZero(): number {
    let count = 0;
    for (let y = 0; y < this.gameGrid.height; y++) {
      for (let x = 0; x < this.gameGrid.width; x++) {
        if (this.gameGrid.get(x, y) != 0) {
          count++;
        }
      }
    }
    return count;
  }
}

type Move = {
  x: number;
  y: number;
};

type GamePath = {
  path: Move[];
};

function getCells(game: Game): { x: number; y: number; rank: number }[] {
  const cells: { x: number; y: number; rank: number }[] = [];
  for (let y = 0; y < game.grid.height; y++) {
    for (let x = 0; x < game.grid.width; x++) {
      cells.push({ x: x, y: y, rank: game.grid.get(x, y) });
    }
  }
  return cells;
}

function getGamePaths(game: Game, maxMoves?: number): GamePath[] {
  const paths: GamePath[] = [];

  function dfs(game: Game, currentPath: Move[], movesSoFar: number) {
    if (game.isSolved() || (maxMoves !== undefined && movesSoFar >= maxMoves)) {
      paths.push({ path: currentPath.slice() });
      return;
    }

    for (const cell of getCells(game)) {
      if (cell.rank != 0) {
        const newGame = new Game(
          new Grid2D(JSON.parse(JSON.stringify(game.grid.grid))),
        );

        newGame.move(cell.x, cell.y);
        currentPath.push({ x: cell.x, y: cell.y });
        dfs(newGame, currentPath, movesSoFar + 1);
        currentPath.pop();
      }
    }
  }

  dfs(game, [], 0);

  return paths;
}

function getShortestPath(game: Game): Move[] | null {
  const paths = getGamePaths(game, 4);
  if (paths.length == 0) {
    return null;
  }
  let shortestPath = paths[0];
  for (const path of paths) {
    if (path.path.length < shortestPath.path.length) {
      shortestPath = path;
    }
  }
  return shortestPath.path;
}

const grid = new Grid2D([
  [3],
  [4],
  [3],
  [3],
  [3],
]);
const game: Game = new Game(grid);
const paths = getShortestPath(game);
Deno.writeTextFileSync("paths.json", JSON.stringify(paths));
