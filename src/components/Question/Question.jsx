import { memo, useMemo } from "react";
import "./Question.css";
import { nanoid } from "nanoid";
import { decode } from 'html-entities';
import tickIcon from "../../assets/images/tick.svg";
import crossIcon from "../../assets/images/cross.svg";

// Memoized Question component to avoid unnecessary re-renders
const Question = memo(props => {
	// Memoize the decoded question text
	const decodedQuestion = useMemo(() => decode(props.question), [props.question]);
	
	// Memoize the answer button elements to avoid rebuilding them on every render
	const answerElements = useMemo(() => {
		// Process incorrect answers
		const incorrectAnswersElements = props.incorrectAnswers.map(answer => {
			const incorrectAnswerClassName = `
				${props.selectedAnswer === answer ? "question-btn-selected" : "question-btn"}
				${(props.showAnswer && props.selectedAnswer === answer) && "question-btn-incorrect"}
			`;
			
			const decodedAnswer = decode(answer);

			return (
				<button
					key={nanoid()}
					className={incorrectAnswerClassName}
					onClick={() => props.handleSelectAnswer(props.id, answer)}
				>
					{decodedAnswer}
				</button>
			);
		});

		// Process correct answer 
		const correctAnswerClassName = `
			${props.selectedAnswer === props.correctAnswer ? "question-btn-selected" : "question-btn"}
			${props.showAnswer && "question-btn-correct"}
		`;

		const decodedCorrectAnswer = decode(props.correctAnswer);

		const correctAnswerElement = (
			<button
				key={nanoid()}
				className={correctAnswerClassName}
				onClick={() => props.handleSelectAnswer(props.id, props.correctAnswer)}
			>
				{decodedCorrectAnswer}
			</button>
		);
		
		incorrectAnswersElements.push(correctAnswerElement);

		// Sort answers alphabetically for consistency
		return incorrectAnswersElements.sort((a, b) => (
			a.props.children.localeCompare(b.props.children))
		);
	}, [
		props.incorrectAnswers, 
		props.correctAnswer, 
		props.selectedAnswer, 
		props.showAnswer, 
		props.id, 
		props.handleSelectAnswer
	]);

	// Memoize result icon to avoid recreating on every render
	const resultIcon = useMemo(() => {
		if (!props.showAnswer) return null;
		
		return props.selectedAnswer === props.correctAnswer
			? <img src={tickIcon} width={35} alt="Tick, correct answer" />
			: <img src={crossIcon} width={30} alt="Cross, wrong answer" />;
	}, [props.showAnswer, props.selectedAnswer, props.correctAnswer]);

	return (
		<article className="question-container Question">
			<div>
				<h3 className="question-text">
					<span>Q{props.num}.</span> {decodedQuestion}
				</h3>
				<div className="answer-container">
					{answerElements}
				</div>
			</div>
			
			{resultIcon}
		</article>
	);
});

// Add display name for better debugging
Question.displayName = 'Question';

export default Question;