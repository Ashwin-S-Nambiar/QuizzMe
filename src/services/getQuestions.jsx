// Cache to store previously fetched questions
const questionsCache = new Map();

// Generate a cache key from game options
const generateCacheKey = (options) => {
	const { category, difficulty, type, questionno } = options;
	return `${category}-${difficulty}-${type}-${questionno}`;
};

const getQuestions = async (gameOptions) => {
	const { category, difficulty, type, questionno } = gameOptions;
	const cacheKey = generateCacheKey(gameOptions);

	// Check if we have cached results for these options
	if (questionsCache.has(cacheKey)) {
		console.log('Using cached questions data');
		return questionsCache.get(cacheKey);
	}

	// Create AbortController for timeout handling
	const controller = new AbortController();
	const signal = controller.signal;

	// Set timeout for fetch (5 seconds)
	const timeoutId = setTimeout(() => controller.abort(), 5000);

	try {
		let categoryQueryParam = "";
		let difficultyQueryParam = "";
		let typeQueryParam = "";
		let questionnoParam = 1;

		if (category !== "")
			categoryQueryParam = `&category=${category}`;

		if (difficulty !== "")
			difficultyQueryParam = `&difficulty=${difficulty}`;

		if (type !== "")
			typeQueryParam = `&type=${type}`;

		if (questionno !== "")
			questionnoParam = questionno;

		let apiUrl = `https://opentdb.com/api.php?amount=${questionnoParam}${categoryQueryParam}${difficultyQueryParam}${typeQueryParam}`;

		// Use signal to allow for abort
		const res = await fetch(apiUrl, { signal });
		clearTimeout(timeoutId);

		if (!res.ok) {
			throw new Error(`HTTP error! Status: ${res.status}`);
		}

		const data = await res.json();
		
		// Check API response code
		if (data.response_code !== 0) {
			// Handle different response codes
			if (data.response_code === 1) {
				console.error("No results found for these parameters");
				return [];
			} else {
				console.error(`API Error: Response code ${data.response_code}`);
				return [];
			}
		}
		
		// Cache the results for future use
		questionsCache.set(cacheKey, data.results);
		
		return data.results;
	} catch (error) {
		clearTimeout(timeoutId);
		
		if (error.name === 'AbortError') {
			console.error('Fetch timed out');
		} else {
			console.error('Error fetching questions:', error);
		}
		
		// Return empty array on error
		return [];
	}
};

export default getQuestions;

// Optional: Function to clear the cache when needed
export const clearQuestionsCache = () => {
	questionsCache.clear();
};