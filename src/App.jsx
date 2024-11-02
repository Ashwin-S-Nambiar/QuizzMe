import { useEffect, useState } from "react";
import "./App.css";
import QuestionList from "./components/QuestionList/QuestionList";
import useLocalStorage from "use-local-storage";

const SunIcon = () => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  viewBox="0 0 24 24"
	  fill="none"
	  stroke="currentColor"
	  strokeWidth="2"
	  strokeLinecap="round"
	  strokeLinejoin="round"
	  className="feather feather-sun"
	  width="24"
	  height="24"
	>
	  <circle cx="12" cy="12" r="5"></circle>
	  <line x1="12" y1="1" x2="12" y2="3"></line>
	  <line x1="12" y1="21" x2="12" y2="23"></line>
	  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
	  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
	  <line x1="1" y1="12" x2="3" y2="12"></line>
	  <line x1="21" y1="12" x2="23" y2="12"></line>
	  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
	  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
	</svg>
  );
  
const MoonIcon = () => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  viewBox="0 0 24 24"
	  fill="none"
	  stroke="currentColor"
	  strokeWidth="2"
	  strokeLinecap="round"
	  strokeLinejoin="round"
	  className="feather feather-moon"
	  width="24"
	  height="24"
	>
	  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
	</svg>
);  

const App = () => {
	const [gameStarted, setGameStarted] = useState(false);
	const [showNoQuestionsError, setShowNoQuestionsError] = useState(false);
	const [gameOptions, setGameOptions] = useState(
		{
			category: "",
			difficulty: "",
			type: "",
			questionno: 1
		}
	);
	const [showFooter, setShowFooter] = useState(true);
	const [darkTheme, setDarkTheme] = useLocalStorage("isDark",false);

	useEffect(()=> {
		if(darkTheme) {
			document.body.classList.add("dark")
		}
	},[darkTheme])

	const toggleFooter = () => {
	  setShowFooter(!showFooter);
	};

	const handleGameStart = () => {
		toggleFooter();
		setTimeout(() => {
		  setGameStarted(prevState => !prevState);
		}, 120);
	  };

	const handleNoQuestionsError = boolean => setShowNoQuestionsError(boolean);
	
	const handleChange = event => {
		const { name, value } = event.target;

		setGameOptions(prevGameOptions => {
			return {
				...prevGameOptions,
				[name]: value
			}
		});
	};

	const toggleTheme = () => {
		document.body.classList.toggle("dark");
		setDarkTheme(!darkTheme);
	  };

	return (
		<>
			<button aria-label="Theme Toggler" className="theme-toggle" onClick={toggleTheme}>
        		{darkTheme ? <SunIcon /> : <MoonIcon />}
      		</button>
		<main>
			
			{
				gameStarted
				?
					<section className="game-container">
						<QuestionList
							gameOptions={gameOptions}
							handleGameStart={handleGameStart}
							handleNoQuestionsError={handleNoQuestionsError}
						/>
					</section>
				:
					<section className="game-intro">
						<h1 className="game-title">QuizzMe!</h1>
						<p className="game-text">Answer the questions and test your knowledge!</p>

						{showNoQuestionsError &&
							<h2 className="noQuestions-text">
								Oops! couldn't find any questions with these options!
							</h2>
						}

						<div className="gameOptions-container">
							<div className="select-container">
								<label className="custom-label" htmlFor="category">Category:</label>

								<select
									name="category"
									id="category"
									className="custom-select"
									value={gameOptions.category}
									onChange={handleChange}
								>
									<option value="">Any Category</option>
									<option value="9">General Knowledge</option>
									<option value="10">Entertainment: Books</option>
									<option value="11">Entertainment: Film</option>
									<option value="12">Entertainment: Music</option>
									<option value="13">Entertainment: Musicals &amp; Theatres</option>
									<option value="14">Entertainment: Television</option>
									<option value="15">Entertainment: Video Games</option>
									<option value="16">Entertainment: Board Games</option>
									<option value="17">Science &amp; Nature</option>
									<option value="18">Science: Computers</option>
									<option value="19">Science: Mathematics</option>
									<option value="20">Mythology</option>
									<option value="21">Sports</option>
									<option value="22">Geography</option>
									<option value="23">History</option>
									<option value="24">Politics</option>
									<option value="25">Art</option>
									<option value="26">Celebrities</option>
									<option value="27">Animals</option>
									<option value="28">Vehicles</option>
									<option value="29">Entertainment: Comics</option>
									<option value="30">Science: Gadgets</option>
									<option value="31">Entertainment: Japanese Anime &amp; Manga</option>
									<option value="32">Entertainment: Cartoon &amp; Animations</option>
								</select>
							</div>
							
							<div className="select-container">
								<label className="custom-label" htmlFor="difficulty">Difficulty:</label>

								<select
									name="difficulty"
									id="difficulty"
									className="custom-select"
									value={gameOptions.difficulty}
									onChange={handleChange}
								>
									<option value="">Any Difficulty</option>
									<option value="easy">Easy</option>
									<option value="medium">Medium</option>
									<option value="hard">Hard</option>
								</select>
							</div>
							
							<div className="select-container">
								<label className="custom-label" htmlFor="type">Type of questions:</label>

								<select
									name="type"
									id="type"
									className="custom-select"
									value={gameOptions.type}
									onChange={handleChange}
								>
									<option value="">Any Type</option>
									<option value="multiple">Multiple Choice</option>
									<option value="boolean">True / False</option>
								</select>
							</div>
							<div className="select-container">
								<label className="custom-label" htmlFor="questionno">No. of questions:</label>

								<select
									name="questionno"
									id="questionno"
									className="custom-select"
									value={gameOptions.questionno}
									onChange={handleChange}
								>
									<option value="1">1</option>
									<option value="5">5</option>
									<option value="10">10</option>
									<option value="15">15</option>
									<option value="20">20</option>
									<option value="25">25</option>
								</select>
							</div>
						</div>

						<button className="btn-primary" onClick={handleGameStart}>Start Quiz</button>
					</section>
			}
			{showFooter && (
				<footer>Developed by&nbsp;
					<a href="https://ashwin-s-nambiar.is-a.dev/" target="_blank">
						Ashwin
					</a>
				</footer>
			)}	
		</main>
		</>
	);
}

export default App;
