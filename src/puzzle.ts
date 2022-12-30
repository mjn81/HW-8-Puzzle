import { Grid, gridFromList } from '@lib/grid';
import type { Pair } from '@lib/pair';
import { isValidPosition, pairEq, pairSum } from '@lib/pair';
import { AStar, IDAStar, makeSearchState, Step, RBFS, Greedy } from '@lib/search';
import type { PathNode } from '@lib/search';
import { RefObject, useEffect, useReducer } from 'react';
import puzzleData from './puzzles.json';
import { toast } from 'react-toastify';
// @ts-ignore
// for screen shots :)
// import {useScreenshot, createFileName} from 'use-react-screenshot';


// DS for puzzle and etc ...

type PuzzleState = {
	status: Status;
	gridData: GridData;
	solutionQueue: Array<PathNode>;
	initialList: Array<number>;
	currentList: Array<number>;
};

export type Solver = 'astar' | 'rbfs' | 'ida' | 'greedy';
type Action =
	| { type: 'START'; payload: Solver }
	| { type: 'RESET' }
	| { type: 'RANDOM' }
	| { type: 'STOP' }
	| { type: 'MOVE'; payload: Step }
	| { type: 'USER_INPUT'; payload: Array<number> }
	| { type: 'RUN_SOLUTION' };

export enum Status {
	Running,
	Stopped,
}

type SquareData = {
	digit: number;
	position: Pair;
	delta: Pair;
};

export type GridData = {
	zeroIndex: number;
	data: Array<SquareData>;
};

export type InfoDS = {
		f: undefined | number,
		g: undefined | number,
		h: undefined | number,
		threshold: undefined | number,
		min: undefined | number | string,
		steps: number,
}

// utils for treaming data and changing data shapes

const zeroIndexFromList = (list: Array<number>): number => {
	const index = list.findIndex((elem) => elem === 0);

	if (index >= 0) return index;
	throw Error(`Invalid list. The "zero" element is required. ${list}`);
};

const positionFromIndex = (index: number): Pair => [
	Math.trunc(index % 3),
	Math.trunc(index / 3),
];

const makeGridDataFromList = (list: Array<number>): GridData => ({
	zeroIndex: zeroIndexFromList(list),
	data: list.map((digit, index) => ({
		digit,
		position: positionFromIndex(index),
		delta: [0, 0],
	})),
});

const gridToList = (grid: GridData) => {
	const list = Array(grid.data.length).fill(0);
	grid.data.forEach(({ position: [x, y], digit }) => (list[y * 3 + x] = digit));

	return list;
};

const makeStateFromList = (list: Array<number>): PuzzleState => ({
	status: Status.Stopped,
	solutionQueue: [],
	gridData: makeGridDataFromList(list),
	initialList: list,
	currentList: list,
});

const nextGridDataFromList = (
	grid: GridData,
	list: Array<number>
): GridData => {
	const len = grid.data.length;

	const nextRandomGrid: Pair[] = Array(len);

	let digit;
	for (let index = 0; index < len; index++) {
		digit = list[index];
		nextRandomGrid[digit] = positionFromIndex(index);
	}

	const nextData = grid.data.map(({ digit }, index) => {
		const initialPosition = positionFromIndex(index);
		const nextPosition = nextRandomGrid[digit];
		const delta = deltaFromPairs(nextPosition, initialPosition);

		return {
			delta,
			digit,
			position: nextPosition,
		};
	});

	return {
		...grid,
		data: nextData,
	};
};

const randomPuzzle = () => {
	const len = puzzleData.length;
	const random = Math.floor(Math.random() * len);

	return puzzleData[random];
};

// Relative to zero position
// row x col
const MOVES: Record<Step, Pair> = {
	[Step.Down]: [0, -1],
	[Step.Up]: [0, 1],
	[Step.Left]: [1, 0],
	[Step.Right]: [-1, 0],
};

const pairToIndex = ([x, y]: Pair): number => y * 3 + x;
const deltaFromPairs = ([a, b]: Pair, [c, d]: Pair): Pair => [a - c, b - d];
const updateGridData = ({ step }: PathNode, grid: GridData): GridData => {
	const zeroSquare = grid.data[grid.zeroIndex];
	const nextZeroPosition = pairSum(zeroSquare.position, MOVES[step]);

	if (isValidPosition(nextZeroPosition)) {
		const nextIndex = grid.data.findIndex((el) =>
			pairEq(el.position, nextZeroPosition)
		);
		const zeroIndex = grid.zeroIndex;

		const nextSquare = grid.data[nextIndex];

		const nextData = [...grid.data];
		// Swapping
		nextData[zeroIndex] = {
			...zeroSquare,
			delta: pairSum(
				zeroSquare.delta,
				deltaFromPairs(nextZeroPosition, zeroSquare.position)
			),
			position: nextZeroPosition,
		};
		nextData[nextIndex] = {
			...nextSquare,
			delta: pairSum(
				nextSquare.delta,
				deltaFromPairs(zeroSquare.position, nextSquare.position)
			),
			position: zeroSquare.position,
		};

		return {
			...grid,
			data: nextData,
		};
	}

	return grid;
};

// number of inversions to check solvability
const getInvCount = (arr: number[]) => {
	let inv_count = 0;

	for (let i = 0; i < 8; i++)
		for (let j = i + 1; j < 9; j++)
			// Value 0 is used for empty space
			if (arr[j] && arr[i] && arr[i] > arr[j]) inv_count++;
	return inv_count;
};
// This function returns true
// if given 8 puzzle is solvable.
const isSolvable = (list: number[]) => {
	// Count inversions in given 8 puzzle
	const invCount = getInvCount(list);
	// return true if inversion count is even.
	return invCount % 2 == 0;
};

// solve puzzle based on chosen algorithm
const solvePuzzle = (state: PuzzleState, solver: Solver) => {
	if (!isSolvable(state.currentList)) {
		toast.error('Puzzle is not solvable');
		return { answer: null };
	}
	const list = Array(9);
	for (const item of state.gridData.data) {
		list[pairToIndex(item.position)] = item.digit;
	}
	if (solver === 'ida') {
		return IDAStar(makeSearchState(gridFromList(list)));
	}
	if (solver === 'astar') {
		return AStar(makeSearchState(gridFromList(list)));
	}
	if (solver === 'greedy') {
		return Greedy(makeSearchState(gridFromList(list)));
	}
	return RBFS(makeSearchState(gridFromList(list)));
};

// initial and constant values
const INITIAL_LIST = randomPuzzle();
const INITIAL_STATE = makeStateFromList(INITIAL_LIST);
const EMPTY_QUEUE: Array<PathNode> = [];

// reducer for each action control
const reducer = (state: PuzzleState, action: Action): PuzzleState => {
	// create Random puzzle runtime
	let randomList;
	switch (action.type) {
		case 'START':
			if (state.status === Status.Running) return state;
			return {
				...state,
				solutionQueue:
					solvePuzzle(state, action.payload).answer?.path ?? EMPTY_QUEUE,
				status: Status.Running,
			};
		case 'STOP':
			return {
				...state,
				solutionQueue: EMPTY_QUEUE,
				status: Status.Stopped,
			};
		// reset to initial state
		case 'RESET':
			return {
				...state,
				solutionQueue: EMPTY_QUEUE,
				gridData: nextGridDataFromList(
					makeGridDataFromList(state.initialList),
					state.currentList
				),
				status: Status.Stopped,
			};
		case 'RANDOM':
			randomList = randomPuzzle();

			return {
				...state,
				currentList: randomList,
				solutionQueue: EMPTY_QUEUE,
				gridData: nextGridDataFromList(state.gridData, randomList),
				status: Status.Stopped,
			};
		// create puzzle from user input
		case 'USER_INPUT':
			return makeStateFromList(action.payload);
		case 'MOVE':
			if (state.status === Status.Running) return state;
			return {
				...state,
				gridData: updateGridData(
					{
						step: action.payload,
					},
					state.gridData
				),
			};
		// runs solution step by step | for animation
		case 'RUN_SOLUTION':
			return state.solutionQueue.length
				? {
						...state,
						solutionQueue: state.solutionQueue.slice(1),
						gridData: updateGridData(state.solutionQueue[0], state.gridData),
				  }
				: {
						...state,
						status: Status.Stopped,
				  };
		default:
			return state;
	}
};

export const usePuzzle = (setInfo: (obj: InfoDS) => void) => {
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	const isFinalState = gridToList(state.gridData).join('') === '123456780';

	// to take screen shot for part2 of the project

	// const [_, takeScreenshot] = useScreenshot({
	// 	type: 'image/jpeg',
	// 	quality: 1.0,
	// });

	// const download = (image: any, { name = 'img', extension = 'jpg' } = {}) => {
	// 	const a = document.createElement('a');
	// 	a.href = image;
	// 	a.download = createFileName(extension, name);
	// 	a.click();
	// };

	useEffect(() => {
		if (state.status !== Status.Running) return;
		let timer: number | null;
		let count = 0;
		const len = state.solutionQueue.length;

		const tick = () => {
			dispatch({ type: 'RUN_SOLUTION' });
			const curState = state.solutionQueue[count];
			// to take output for part2 of the project
			// console.log(curState)
			// to take screen shot for part2 of the project
			// if (count < 6) {
			// 	takeScreenshot(containerRef.current).then(download);
			// }
			if (count < len) {
				setInfo({
					f: curState?.f,
					g: curState?.g,
					h: curState?.h,
					min: curState?.min === Number.MAX_VALUE ? '∞' : curState?.min,
					threshold: curState?.threshold,
					steps: len,
				});
			}
			count++;
			timer = setTimeout(tick, 250);
		};

		tick();

		return () => {
			if (timer) clearTimeout(timer);
		};
	}, [state.status]);

	return [{ ...state, isFinalState }, dispatch] as const;
};
