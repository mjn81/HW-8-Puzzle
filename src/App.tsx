import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import Grid from '@components/Grid';
import { Icon } from '@components/Icon';
import IconButton from '@components/IconButton';
import Keys from '@components/Keys';
import Ribbon from '@components/Ribbon';

import { Step } from '@lib/search';

import { Status, usePuzzle } from './puzzle';
import type { InfoDS, Solver } from './puzzle';
import { Theme, ThemeOption } from './Theme';
import type { ThemeColor } from './tokens';
import { THEME_COLORS } from './tokens';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// UI part
const Content = styled.div`
	width: 400px;
	display: flex;
	flex-direction: column;
	margin-left: 50px;
	align-items: center;
`;

const Stack = styled.div`
	display: flex;
	flex-direction: column;
	& > * + * {
		margin-top: 12px;
	}
`;

const Head = styled.h2`
	text-align: center;
	color: white;
	font-family: var(--fontFamilyPrimary);
	margin: 0;
	font-weight: normal;
	font-size: 1.25rem;
`;

const Footer = styled.footer`
	margin: auto;
	padding: 64px 0;
	display: flex;
	justify-content: center;
	flex-direction: column;
	& > * {
		margin: 8px auto;
	}
	span {
		color: white;
	}
	p {
		color: hsl(359, 0%, 90%);
	}
	a {
		text-decoration: none;
		color: hsl(359, 0%, 90%);

		span {
			display: inline-block;
		}

		& > span:after {
			content: '';
			display: block;
			width: 90%;
			margin: auto;
			height: 0px;
			border: 1px dashed white;
		}

		:hover > span:after {
			border: 1px solid white;
		}
	}
	div > a {
		display: flex;
		align-items: center;
		> * + * {
			margin-left: 8px;
		}
	}
	${Icon} {
		fill: white;
	}
`;

const KeysContainer = styled.div`
	& > * + * {
		margin: 12px auto;
	}
`;

const ContentWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;

	${Ribbon} {
		margin: 24px 0 0 0;
	}

	${Stack} {
		margin-top: 140px;
	}

	p {
		margin: 12px 0;
		font-family: var(--fontFamilyPrimary);
		color: white;
		font-size: 1rem;
	}

	h3 {
		padding: 0;
		font-family: var(--fontFamilySecondary);
		font-weight: normal;
		color: white;
		transition: opacity 0.5s ease, max-height 0.5s ease, margin 0.25s ease;
		max-height: 0px;
		overflow: hidden;
		margin: 0px;
		opacity: 0;
		&[data-show] {
			opacity: 1;
			max-height: 35px;
			margin: 16px;
		}
	}

	@media (max-width: 640px) {
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;

		${Content} {
			margin-left: 0px;
			width: 100%;
		}

		${Stack} {
			margin-top: 32px;
		}

		${KeysContainer} {
			display: flex;

			& > * {
				margin: auto 8px;
			}
		}
	}
`;

const AppWrapper = styled.div`
	min-height: 100vh;
	background-color: var(--primaryLight);
	transition: background-color 1.25s ease;
	color: white;
	font-family: var(--fontFamilyPrimary);
`;

const ButtonContainer = styled.div`
	position: relative;
	display: flex;
	margin: 10px;
	div {
		margin: 0 10px;
	}
`;

const Colors = styled.div`
	display: flex;
	justify-content: center;
	background-color: white;
	border-radius: 8px;
	margin-bottom: 12px;
	padding: 4px;
	box-shadow: 0px 2px 1px 1px #aaa;
`;

const Input = styled.input`
	border: none;
	outline: none;
	padding: 10px 12px;
	border-radius: 8px;
	font-family: var(--fontFamilyPrimary);
	font-size: 1.1rem;
	min-width: 350px;
	-webkit-box-shadow: 0px 2px 1px 1px #aaa;
	box-shadow: 0px 2px 1px 1px #aaa;
`;

const InfoContainer = styled.div`
	background-color: var(--primary);
	min-width: 120px;
	border-radius: 12px;
	padding: 0 15px;
`;

const Select = styled.select`
	border-radius: 8px;
	border: none;
	padding: 2px 8px;
	font-family: var(--fontFamilyPrimary);
	font-size: 0.8rem;
	outline: none;
	-webkit-box-shadow: 0px 2px 1px 1px #aaa;
	box-shadow: 0px 2px 1px 1px #aaa;
`;

function useHandler<T>(value: T) {
	const [state, setState] = useState<T>(value);

	const handler = useCallback(
		(value: T) => () => {
			setState(value);
		},
		[]
	);

	return [state, handler] as const;
}

// Main App file for show & solving puzzle
// All Algorithms inside lib folder
//

export default () => {
	const [infoState, setInfoState] = useState<InfoDS>({
		f: undefined,
		g: undefined,
		h: undefined,
		threshold: undefined,
		min: undefined,
		steps: 0,
	});
	const userInput = useRef<HTMLInputElement>(null);
	// for part2 screenshots
	// const containerRef = useRef<HTMLDivElement>(null);
	const [state, dispatch] = usePuzzle(setInfoState);
	const [theme, handleTheme] = useHandler<ThemeColor>('purple');
	const [stepCounter, setStepCounter] = useState<number>(0);
	const [solver, setSolver] = useState<Solver>('ida');
	useEffect(() => {
		const keyListener = (event: KeyboardEvent) => {
			switch (event.code) {
				case 'Down':
				case 'KeyS':
				case 'ArrowDown':
					setStepCounter((pre) => pre + 1);
					dispatch({ type: 'MOVE', payload: Step.Down });
					break;
				case 'Up':
				case 'KeyW':
				case 'ArrowUp':
					setStepCounter((pre) => pre + 1);
					dispatch({ type: 'MOVE', payload: Step.Up });
					break;
				case 'Left':
				case 'KeyA':
				case 'ArrowLeft':
					setStepCounter((pre) => pre + 1);
					dispatch({ type: 'MOVE', payload: Step.Left });
					break;
				case 'Right':
				case 'KeyD':
				case 'ArrowRight':
					setStepCounter((pre) => pre + 1);
					dispatch({ type: 'MOVE', payload: Step.Right });
					break;
				default:
					break;
			}
		};

		document.addEventListener('keydown', keyListener);

		return () => {
			document.removeEventListener('keydown', keyListener);
		};
	}, [dispatch]);

	const start = () => {
		setStepCounter(0);
		dispatch({ type: 'START', payload: solver });
	};

	const reset = () => {
		setStepCounter(0);
		dispatch({ type: 'RESET' });
	};

	const random = () => {
		setStepCounter(0);
		dispatch({ type: 'RANDOM' });
	};
	// set puzzle grid from user input
	const setGrid = () => {
		const listStr = userInput.current?.value;
		if (listStr?.length !== 9) return;
		const list = listStr.split('').map((item) => parseInt(item));
		dispatch({
			type: 'USER_INPUT',
			payload: list,
		});
	};
	// for compettion mode
	const compare = () => {
		if (state.isFinalState && state.status !== Status.Running) {
			dispatch({ type: 'RESET' });
			dispatch({ type: 'START', payload: solver });

			if (stepCounter > infoState.steps) {
				toast.error('You lose!');
				return;
			}
			if (stepCounter < infoState.steps) {
				toast.success('You win!');
				return;
			}
			toast.info('Draw!');
		}
	};

	const changeSolver = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSolver(event.currentTarget.value as Solver);
	};

	return (
		<Theme data-theme={theme}>
			<ToastContainer />
			<AppWrapper>
				<ContentWrapper>
					<Stack>
						<Head>Info</Head>
						<InfoContainer>
							<p>all steps: {infoState.steps}</p>
							<p>f: {infoState.f}</p>
							<p>g: {infoState.g}</p>
							<p>h: {infoState.h}</p>
							<p>threshold: {infoState.threshold}</p>
							<p>min: {infoState.min}</p>
							<p>Manual step: {stepCounter}</p>
						</InfoContainer>
					</Stack>
					<Content>
						<Ribbon>8-Puzzle</Ribbon>
						<Grid data={state.gridData} squareShift={90} />
						{<h3 data-show={state.isFinalState ? '' : undefined}>Complete!</h3>}
						<Colors>
							{THEME_COLORS.map((color) => (
								<ThemeOption
									key={color}
									data-color={color}
									data-selected={theme === color ? '' : undefined}
									onClick={handleTheme(color)}
								/>
							))}
						</Colors>
						<ButtonContainer>
							<Input
								type="text"
								placeholder="user tile input"
								ref={userInput}
							/>
							<IconButton type="input" onClick={setGrid} />
						</ButtonContainer>
						<ButtonContainer>
							<IconButton type="play" onClick={start} />
							<IconButton type="reset" onClick={reset} />
							<IconButton type="random" onClick={random} />
							<IconButton type="compare" onClick={compare} />
						</ButtonContainer>
					</Content>
					<Stack>
						<Head>Controls</Head>
						<KeysContainer>
							<Keys up="W" left="A" right="D" down="S" />
							<Keys up="▲" left="◄" right="►" down="▼" />
						</KeysContainer>
						<Head>Algorithms</Head>
						<Select value={solver} onChange={changeSolver}>
							<option value="ida">IDAStar</option>
							<option value="rbfs">RBFS</option>
							<option value="greedy">Greedy</option>
							<option value="astar">AStar</option>
						</Select>
					</Stack>
				</ContentWrapper>
				<Footer></Footer>
			</AppWrapper>
		</Theme>
	);
};
