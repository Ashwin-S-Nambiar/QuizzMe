import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { nanoid } from "nanoid";
import "./QuestionList.css";
import Question from "../Question/Question";
import getQuestions, { clearQuestionsCache } from "../../services/getQuestions";
import Confetti from "react-confetti";
import useWindowSize from 'react-use/lib/useWindowSize';

// Create an optimized empty component for Confetti when not shown
const NoConfetti = memo(() => null);

const QuestionList = memo(({ gameOptions, handleGameStart, handleNoQuestionsError }) => {
	const [questionsArray, setQuestionsArray] = useState([]);
	const [checkAnswerBtn, setCheckAnswerBtn] = useState(false);
	const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
	const [isGameOver, setIsGameOver] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [pageHeight, setPageHeight] = useState(document.documentElement.scrollHeight);
	const [fetchError, setFetchError] = useState(false);

	const questionTotal = Number(gameOptions.questionno);
	
	// Memoize this calculation instead of repeating it on every render
	const allQuestionsAnswered = useMemo(() => 
		questionsArray.length > 0 && 
		questionsArray.every(question => question.selectedAnswer !== ""),
	[questionsArray]);

	// Optimize resize listener with throttle/debounce pattern
	useEffect(() => {
		const handleResize = () => {
			// Use requestAnimationFrame to throttle updates
			requestAnimationFrame(() => {
				setPageHeight(document.documentElement.scrollHeight);
			});
		};

		// Initial setting
		handleResize();
		
		// Passive true improves scroll performance
		window.addEventListener('resize', handleResize, { passive: true });
		window.addEventListener('scroll', handleResize, { passive: true });

		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('scroll', handleResize);
		};
	}, []);

	// Fetch questions only once and handle loading states properly
	useEffect(() => {
		let isMounted = true;
		setIsLoading(true);
		
		const fetchQuestions = async () => {
			try {
				const questions = await getQuestions(gameOptions);
				
				if (!isMounted) return;
				
				if (questions.length === 0) {
					handleGameStart();
					handleNoQuestionsError(true);
					return;
				} else {
					handleNoQuestionsError(false);
				}

				// Process questions in batches for better performance with large sets
				const processedQuestions = questions.map(question => ({
					...question,
					id: nanoid(),
					selectedAnswer: "",
					showAnswer: false
				}));

				setQuestionsArray(processedQuestions);
				setIsLoading(false);
			} catch (error) {
				if (!isMounted) return;
				console.error("Error fetching questions:", error);
				setFetchError(true);
				setIsLoading(false);
			}
		};

		fetchQuestions();

		// Clean up function
		return () => {
			isMounted = false;
		};
	}, [gameOptions, handleGameStart, handleNoQuestionsError]);

	// Check if all questions are answered and calculate score
	useEffect(() => {
		if (questionsArray.length !== 0 && allQuestionsAnswered) {
			// Use reduce for better performance with larger arrays
			const correctAnswers = questionsArray.reduce((count, question) => {
				return question.correct_answer === question.selectedAnswer 
					? count + 1 
					: count;
			}, 0);

			setCorrectAnswersCount(correctAnswers);
			setCheckAnswerBtn(true);
		}
	}, [questionsArray, allQuestionsAnswered]);

	// Handle confetti timeout
	useEffect(() => {
		if (showConfetti) {
			const timer = setTimeout(() => {
				setShowConfetti(false);
			}, 8000);
	
			return () => clearTimeout(timer);
		}
	}, [showConfetti]);

	// Memoize style generation to avoid recalculating on every render
	const questionStyles = useMemo(() => {
		let styles = '';
		for (let i = 1; i <= questionTotal; i++) {
		  styles += `.Question:nth-child(${i}) { animation-delay: ${i * 0.1}s; }\n`;
		}
		return styles;
	}, [questionTotal]);

	// Memoize the handleSelectAnswer function to prevent unnecessary re-renders
	const handleSelectAnswer = useCallback((questionId, answer) => {
		if (!isGameOver) {
			setQuestionsArray(prevQuestionsArray => (
				prevQuestionsArray.map(question => (
					question.id === questionId
						? {...question, selectedAnswer: answer }
						: question
				))
			));
		}
	}, [isGameOver]);

	// Memoize the checkAnswers function
	const checkAnswers = useCallback(() => {
		if (allQuestionsAnswered) {
			setIsGameOver(true);

			if (correctAnswersCount === questionTotal) {
                setShowConfetti(true);
            }

			setQuestionsArray(prevQuestionsArray => (
				prevQuestionsArray.map(question => ({...question, showAnswer: true }))
			));
		}
	}, [allQuestionsAnswered, correctAnswersCount, questionTotal]);

	// Memoize the resetGame function
	const resetGame = useCallback(() => {
		setCheckAnswerBtn(false);
		setIsGameOver(false);
		setShowConfetti(false);
		handleGameStart();
		// No setFullScore function in the original code, removed this line
	}, [handleGameStart]);

	// Memoize question elements to avoid unnecessary re-renders
	const questionElements = useMemo(() => {
		let i = 0;
		return questionsArray.map(question => (
			<Question
				key={question.id}
				id={question.id}
				num={++i}
				question={question.question}
				correctAnswer={question.correct_answer}
				incorrectAnswers={question.incorrect_answers}
				difficulty={question.difficulty}
				category={question.category}
				selectedAnswer={question.selectedAnswer}
				showAnswer={question.showAnswer}
				handleSelectAnswer={handleSelectAnswer}
			/>
		));
	}, [questionsArray, handleSelectAnswer]);

	const { width } = useWindowSize();

	// Show loading state or error message
	if (isLoading) {
		return (
			<div className="question-loading">
				<div className="loading-spinner-large"></div>
				<p>Loading your quiz questions...</p>
			</div>
		);
	}

	if (fetchError) {
		return (
			<div className="question-error">
				<h2>Oops! Something went wrong</h2>
				<p>We couldn't load your quiz questions right now.</p>
				<button className="btn-primary" onClick={handleGameStart}>
					Try Again
				</button>
			</div>
		);
	}

	// Only render Confetti when needed
	const ConfettiComponent = showConfetti ? Confetti : NoConfetti;

	return (
		<>	
			<ConfettiComponent width={width} height={pageHeight}/>
			
			<section className="questionList-container">
				<style>{questionStyles}</style>
				{questionElements}

				<div className="bottom-container">
					{isGameOver &&
						<h3 className="correct-answers-text">
							You got <span>{correctAnswersCount}</span>/{questionTotal} correct answers!
						</h3>
					}

					<button
						className={`btn-primary ${checkAnswerBtn
													? "btn-check-answers"
													: "btn-check-answers-disabled"}`}
						onClick={isGameOver ? resetGame : checkAnswers}
						disabled={!checkAnswerBtn && !isGameOver}
					>
						{isGameOver ? "Play again" : "Check answers"}
					</button>
				</div>
			</section>
		</>	
	);
});

// Display name helps with debugging
QuestionList.displayName = "QuestionList";

export default QuestionList;