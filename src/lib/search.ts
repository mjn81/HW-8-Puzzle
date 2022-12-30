import type { Grid } from './grid';
import { copyGrid, manhattanDistance } from './grid';
import { Heap } from './heap';
import type { Pair } from './pair';
import { isValidPosition, MAX_BOUND, pairSum } from './pair';

// Key type
type Key = string;

const keyFromGrid = (grid: Grid) => {
	let key = '';
	for (const row of grid) {
		for (const n of row) key += n.toString();
	}
	return key;
};

// Step
export enum Step {
	Up = '^',
	Left = '<',
	Down = 'v',
	Right = '>',
}

// col X row
const STEPS: Array<[Step, Pair]> = [
	[Step.Up, [1, 0]],
	[Step.Left, [0, 1]],
	[Step.Down, [-1, 0]],
	[Step.Right, [0, -1]],
];


// save info of the solution path
export type PathNode = {
	step: Step;
	g?: number;
	h?: number;
	f?: number;
	threshold?: number;
	min?: number;
};

// State
type State = {
	cost: number;
	path: Array<PathNode>;
	depth: number;
	key: Key;
	zeroPosition: Pair;
	grid: Grid;
};

const isFinalState = (state: State) => state.key === '123456780';

const zeroPairFromGrid = (grid: Grid): Pair => {
	for (let i = 0; i <= MAX_BOUND; i++) {
		for (let j = 0; j <= MAX_BOUND; j++) {
			if (grid[i][j] == 0) return [i, j];
		}
	}

	throw Error('Wrong Grid');
};

export const makeSearchState = (grid: Grid): State => ({
	cost: 0,
	path: [],
	depth: 0,
	key: keyFromGrid(grid),
	zeroPosition: zeroPairFromGrid(grid),
	grid,
});

type DataStructure = {
	add(state: State): void;
	extract(): State;
	size(): number;
	isEmpty(): boolean;
	cost(state: State): number;
};

// search throw all nodes for greedy and A*
const search = (initialState: State, data: DataStructure) => {
	data.add(initialState);

	const visitedStates = new Set<Key>();

	do {
		const currentState = data.extract();
		if (isFinalState(currentState)) {
			return currentState;
		}

		if (visitedStates.has(currentState.key)) {
			continue;
		} else {
			visitedStates.add(currentState.key);
		}

		STEPS.forEach(([step, move]) => {
			const nextZeroPosition = pairSum(currentState.zeroPosition, move);

			if (isValidPosition(nextZeroPosition)) {
				const [nextX, nextY] = nextZeroPosition;
				const [oldX, oldY] = currentState.zeroPosition;

				// Swap
				const nextGrid = copyGrid(currentState.grid);
				const tmp = nextGrid[nextX][nextY];
				nextGrid[nextX][nextY] = nextGrid[oldX][oldY];
				nextGrid[oldX][oldY] = tmp;

				const nextState: State = {
					...currentState,
					key: keyFromGrid(nextGrid),
					zeroPosition: nextZeroPosition,
					path: [
						...currentState.path,
						{
							step,
						},
					],
					depth: currentState.depth + 1,
					grid: nextGrid,
				};

				data.add({ ...nextState, cost: data.cost(nextState) });
			}
		});
	} while (!data.isEmpty());
	return null;
};

const compareStates = (sa: State, sb: State) => sa.cost < sb.cost;

const makeGreedyDS = (): DataStructure => {
	const data = Heap<State>(compareStates);

	return {
		extract: data.extract,
		add: data.add,
		cost: (state: State) => manhattanDistance(state.grid),
		size: data.size,
		isEmpty: () => data.size() === 0,
	};
};

const makeAStarDS = (): DataStructure => ({
	...makeGreedyDS(),
	cost: (state: State) => manhattanDistance(state.grid) + state.depth,
});

// for greedy and A* | to stop repetition :)
const perf = (initialState: State, dataStructure: DataStructure) => {
	const answer = search(initialState, dataStructure);

	return { answer };
};

// Greedy
export const Greedy = (initialState: State) =>
	perf(initialState, makeGreedyDS());

// A Star
export const AStar = (initialState: State) => perf(initialState, makeAStarDS());

// IDA Star

type Result = State | number;

// main  Alogrithm
const ids = (
	currentState: State,
	threshold: number,
	visitedStates: Set<Key>
): Result => {
	if (isFinalState(currentState)) return currentState;
	// visited state to improve performance
	if (visitedStates.has(currentState.key)) return Number.MAX_VALUE;
	visitedStates.add(currentState.key);

	const h = manhattanDistance(currentState.grid);
	const f = currentState.depth + h;
	if (f > threshold) return f;
	let min = Number.MAX_VALUE;
	for (const [step, move] of STEPS) {
		const nextZeroPosition = pairSum(currentState.zeroPosition, move);

		if (isValidPosition(nextZeroPosition)) {
			const [nextX, nextY] = nextZeroPosition;
			const [oldX, oldY] = currentState.zeroPosition;

			// Swap
			const nextGrid = copyGrid(currentState.grid);
			const tmp = nextGrid[nextX][nextY];
			nextGrid[nextX][nextY] = nextGrid[oldX][oldY];
			nextGrid[oldX][oldY] = tmp;

			const hNext = manhattanDistance(nextGrid);

			const nextState: State = {
				...currentState,
				key: keyFromGrid(nextGrid),
				zeroPosition: nextZeroPosition,
				path: [
					...currentState.path,
					{
						step,
						g: currentState.depth,
						h: hNext,
						f: currentState.depth + hNext,
						threshold,
						min,
					},
				],
				depth: currentState.depth + 1,
				grid: nextGrid,
			};

			const result = ids(nextState, threshold, visitedStates);
			if (typeof result !== 'number') {
				return result;
			}
			if (result < min) min = result;
		}
	}
	return min;
};

// iteration part
export const IDAStar = (initialState: State) => {
	let threshold = manhattanDistance(initialState.grid);
	while (true) {
		const visitedStates = new Set<Key>();
		const node = ids(initialState, threshold, visitedStates);
		if (node === Number.MAX_VALUE) return { answer: null };
		if (typeof node !== 'number') return { answer: node };
		threshold = node;
	}
};

// RBFS

// main algorithm
const rbfs = (currentState: State, threshold: number): Result => {
	if (isFinalState(currentState)) return currentState;
	const successors = [];
	for (const [step, move] of STEPS) {
		const nextZeroPosition = pairSum(currentState.zeroPosition, move);

		if (isValidPosition(nextZeroPosition)) {
			const [nextX, nextY] = nextZeroPosition;
			const [oldX, oldY] = currentState.zeroPosition;

			// Swap
			const nextGrid = copyGrid(currentState.grid);
			const tmp = nextGrid[nextX][nextY];
			nextGrid[nextX][nextY] = nextGrid[oldX][oldY];
			nextGrid[oldX][oldY] = tmp;

			const hNext = manhattanDistance(nextGrid);
			const nextState: State = {
				...currentState,
				key: keyFromGrid(nextGrid),
				zeroPosition: nextZeroPosition,
				path: [
					...currentState.path,
					{
						step,
						g: currentState.depth,
						h: hNext,
						f: currentState.depth + hNext,
						threshold,
					},
				],
				cost: currentState.depth + hNext,
				depth: currentState.depth + 1,
				grid: nextGrid,
			};

			successors.push(nextState);
		}
	}

	// correct this part
	if (successors.length === 0) return Number.MAX_VALUE;

	while (successors.length) {
		successors.sort((a, b) => a.cost - b.cost);
		const best = successors[0];
		if (best.cost > threshold) return best.cost;
		const alternative = successors[1] ? successors[1].cost : Number.MAX_VALUE;
		const result = rbfs(best, Math.min(threshold, alternative));
		if (typeof result !== 'number') return result;
		best.cost = result;
	}
	return Number.MAX_VALUE;
};

// answer wrapper
export const RBFS = (initialState: State) => {
	const result = rbfs(initialState, Number.MAX_VALUE);
	if (typeof result !== 'number') return { answer: result };
	return { answer: null };
};
