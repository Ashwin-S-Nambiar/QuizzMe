import { useEffect, useState, useCallback, lazy, Suspense, memo } from "react";
import "./App.css";
import useLocalStorage from "use-local-storage";

// Lazy load the QuestionList component
const QuestionList = lazy(() => import("./components/QuestionList/QuestionList"));

// Memoize static components
const SunIcon = memo(() => (
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
));
SunIcon.displayName = 'SunIcon';

const MoonIcon = memo(() => (
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
));
MoonIcon.displayName = 'MoonIcon';

// Loading spinner component
const LoadingSpinner = memo(() => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading quiz...</p>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// Footer component
const Footer = memo(() => (
  <footer>
    Developed by&nbsp;
    <a href="https://ashwin.co.in" target="_blank" rel="noopener noreferrer">
      Ashwin
    </a>
  </footer>
));
Footer.displayName = 'Footer';

// API Status indicator component
const ApiStatusIndicator = memo(({ status, message }) => {
  return (
    <div className={`api-status ${status}`}>
      <div className={`status-light ${status}`}></div>
      <span className="status-message">{message}</span>
    </div>
  );
});

ApiStatusIndicator.displayName = 'ApiStatusIndicator';

// API Error Message component with close button
const ApiErrorMessage = memo(({ onClose }) => (
  <div className="api-error-message">
    <p>Unable to fetch questions. The Open Trivia DB API appears to be down. Please try again later.</p>
    <button 
      className="toast-close-btn" 
      onClick={onClose}
      aria-label="Close message"
    >
      ×
    </button>
  </div>
));

ApiErrorMessage.displayName = 'ApiErrorMessage';

// Category options for select menu
const CATEGORY_OPTIONS = [
  { value: "", label: "Any Category" },
  { value: "9", label: "General Knowledge" },
  { value: "10", label: "Entertainment: Books" },
  { value: "11", label: "Entertainment: Film" },
  { value: "12", label: "Entertainment: Music" },
  { value: "13", label: "Entertainment: Musicals & Theatres" },
  { value: "14", label: "Entertainment: Television" },
  { value: "15", label: "Entertainment: Video Games" },
  { value: "16", label: "Entertainment: Board Games" },
  { value: "17", label: "Science & Nature" },
  { value: "18", label: "Science: Computers" },
  { value: "19", label: "Science: Mathematics" },
  { value: "20", label: "Mythology" },
  { value: "21", label: "Sports" },
  { value: "22", label: "Geography" },
  { value: "23", label: "History" },
  { value: "24", label: "Politics" },
  { value: "25", label: "Art" },
  { value: "26", label: "Celebrities" },
  { value: "27", label: "Animals" },
  { value: "28", label: "Vehicles" },
  { value: "29", label: "Entertainment: Comics" },
  { value: "30", label: "Science: Gadgets" },
  { value: "31", label: "Entertainment: Japanese Anime & Manga" },
  { value: "32", label: "Entertainment: Cartoon & Animations" }
];

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
	const [darkTheme, setDarkTheme] = useLocalStorage("isDark", false);
	const [apiStatus, setApiStatus] = useState({ status: "checking", message: "Checking Open Trivia DB..." });
	const [showApiError, setShowApiError] = useState(true);

	// Check API status on load - with rate limiting protection
	useEffect(() => {
		let lastCheckTime = 0;
		const MIN_CHECK_INTERVAL = 30000; // Minimum 30 seconds between checks
		
		const checkApiStatus = async () => {
			const now = Date.now();
			// Prevent checks within 30 seconds of last check
			if (now - lastCheckTime < MIN_CHECK_INTERVAL) {
				console.log('Skipping API status check (rate limit protection)');
				return;
			}
			
			lastCheckTime = now;
			
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000);
				
				// Use a lightweight endpoint call - just check connectivity
				const response = await fetch('https://opentdb.com/api_category.php', { 
					signal: controller.signal 
				});
				clearTimeout(timeoutId);
				
				if (response.ok) {
					setApiStatus({ 
						status: "online", 
						message: "Open Trivia DB is Up" 
					});
				} else if (response.status === 429) {
					setApiStatus({ 
						status: "rate-limited", 
						message: "Open Trivia DB - Rate Limited. Please wait..." 
					});
				} else {
					setApiStatus({ 
						status: "offline", 
						message: "Open Trivia DB is Down" 
					});
				}
			} catch (error) {
				if (error.name === 'AbortError') {
					setApiStatus({ 
						status: "timeout", 
						message: "Connection timeout" 
					});
				} else {
					setApiStatus({ 
						status: "offline", 
						message: "Open Trivia DB is Down" 
					});
				}
			}
		};

		if (!gameStarted) {
			// Only check once when landing on home screen
			checkApiStatus();
			// Reduced frequency: check every 5 minutes instead of 1 minute
			const intervalId = setInterval(checkApiStatus, 300000);
			return () => clearInterval(intervalId);
		}
	}, [gameStarted]);

	// Auto-dismiss error toast after 10 seconds & reset when API is back online
	useEffect(() => {
		if (apiStatus.status === "offline" && showApiError) {
			const timer = setTimeout(() => {
				setShowApiError(false);
			}, 10000);
			return () => clearTimeout(timer);
		} else if (apiStatus.status === "online") {
			// Reset the error visibility when API comes back online
			setShowApiError(true);
		}
	}, [apiStatus.status, showApiError]);

	// Apply theme on initial render and when theme changes
	useEffect(() => {
		// Preload the question list component
		const preload = () => {
			import("./components/QuestionList/QuestionList");
		};
		
		// Only run if the user is in light mode on initial load
		if(!darkTheme) {
			document.body.classList.remove("dark");
		} else {
			document.body.classList.add("dark");
		}
		
		// Preload the component after initial render
		const timer = setTimeout(preload, 1000);
		
		return () => clearTimeout(timer);
	}, [darkTheme]);

	// Memoize callbacks to prevent unnecessary renders
	const toggleFooter = useCallback(() => {
	  setShowFooter(prev => !prev);
	}, []);

	const handleGameStart = useCallback(() => {
		toggleFooter();
		// Removing setTimeout improves performance as it's an unnecessary delay
		setGameStarted(prevState => !prevState);
	}, [toggleFooter]);

	const handleNoQuestionsError = useCallback(boolean => {
		setShowNoQuestionsError(boolean);
	}, []);
	
	const handleChange = useCallback(event => {
		const { name, value } = event.target;
		setGameOptions(prevGameOptions => ({
			...prevGameOptions,
			[name]: value
		}));
	}, []);

	const toggleTheme = useCallback(() => {
		document.body.classList.toggle("dark");
		setDarkTheme(prev => !prev);
	}, [setDarkTheme]);

	const closeApiError = useCallback(() => {
		setShowApiError(false);
	}, []);

	// Memoize select options rendering for performance
	const renderSelectOptions = useCallback((options) => {
		return options.map(option => (
			<option key={option.value} value={option.value}>
				{option.label}
			</option>
		));
	}, []);

	return (
		<>
			<button 
				aria-label="Theme Toggler" 
				className="theme-toggle" 
				onClick={toggleTheme}
			>
        		{darkTheme ? <SunIcon /> : <MoonIcon />}
      		</button>
			
			{/* API Error Toast - Fixed positioned at top */}
			{apiStatus.status === "offline" && showApiError && (
				<ApiErrorMessage onClose={closeApiError} />
			)}
			
			<main>
				{gameStarted ? (
					<section className="game-container">
						<Suspense fallback={<LoadingSpinner />}>
							<QuestionList
								gameOptions={gameOptions}
								handleGameStart={handleGameStart}
								handleNoQuestionsError={handleNoQuestionsError}
							/>
						</Suspense>
					</section>
				) : (
					<section className="game-intro">
						<h1 className="game-title">QuizzMe!</h1>
						<p className="game-text">Answer the questions and test your knowledge!</p>

						{/* API Status Indicator */}
						<ApiStatusIndicator status={apiStatus.status} message={apiStatus.message} />

						{showNoQuestionsError && (
							<h2 className="noQuestions-text">
								Oops! couldn&apos;t find any questions with these options!
							</h2>
						)}

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
									{renderSelectOptions(CATEGORY_OPTIONS)}
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
								<label className="custom-label" htmlFor="type">Question Type:</label>
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
				)}
				{showFooter && <Footer />}	
			</main>
		</>
	);
};

export default App;
