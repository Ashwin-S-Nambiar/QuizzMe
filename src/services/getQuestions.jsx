// Cache to store previously fetched questions
const questionsCache = new Map();

// Session token management for Open Trivia DB
let sessionToken = null;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests (API requirement)

// Generate a cache key from game options
const generateCacheKey = (options) => {
	const { category, difficulty, type, questionno } = options;
	return `${category}-${difficulty}-${type}-${questionno}`;
};

// Get or create session token
const getSessionToken = async () => {
	if (sessionToken) {
		return sessionToken;
	}

	try {
		const response = await fetch('https://opentdb.com/api_token.php?command=request');
		const data = await response.json();
		
		if (data.response_code === 0 && data.token) {
			sessionToken = data.token;
			return sessionToken;
		}
	} catch (error) {
		console.warn('Could not obtain session token:', error);
	}
	
	return null;
};

// Reset session token (call when getting duplicate questions)
export const resetSessionToken = async () => {
	if (sessionToken) {
		try {
			await fetch(`https://opentdb.com/api_token.php?command=reset&token=${sessionToken}`);
		} catch (error) {
			console.warn('Could not reset session token:', error);
		}
	}
	sessionToken = null;
};

// Rate limiting helper
const waitForRateLimit = async () => {
	const now = Date.now();
	const timeSinceLastRequest = now - lastRequestTime;
	
	if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
		const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
		console.log(`Rate limit protection: waiting ${waitTime}ms before next request`);
		await new Promise(resolve => setTimeout(resolve, waitTime));
	}
	
	lastRequestTime = Date.now();
};

const getQuestions = async (gameOptions, retryCount = 0) => {
	const { category, difficulty, type, questionno } = gameOptions;
	const cacheKey = generateCacheKey(gameOptions);

	// Check if we have cached results for these options
	if (questionsCache.has(cacheKey)) {
		console.log('Using cached questions data');
		return questionsCache.get(cacheKey);
	}

	// Rate limiting protection
	await waitForRateLimit();

	// Get session token for better API experience
	const token = await getSessionToken();

	// Create AbortController for timeout handling
	const controller = new AbortController();
	const signal = controller.signal;

	// Set timeout for fetch (10 seconds)
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	try {
		let categoryQueryParam = "";
		let difficultyQueryParam = "";
		let typeQueryParam = "";
		let questionnoParam = 1;
		let tokenParam = "";

		if (category !== "")
			categoryQueryParam = `&category=${category}`;

		if (difficulty !== "")
			difficultyQueryParam = `&difficulty=${difficulty}`;

		if (type !== "")
			typeQueryParam = `&type=${type}`;

		if (questionno !== "")
			questionnoParam = questionno;

		if (token)
			tokenParam = `&token=${token}`;

		let apiUrl = `https://opentdb.com/api.php?amount=${questionnoParam}${categoryQueryParam}${difficultyQueryParam}${typeQueryParam}${tokenParam}`;

		// Use signal to allow for abort
		const res = await fetch(apiUrl, { signal });
		clearTimeout(timeoutId);

		// Handle rate limiting with exponential backoff
		if (res.status === 429) {
			const maxRetries = 3;
			if (retryCount < maxRetries) {
				const backoffTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
				console.warn(`Rate limited (429). Retrying in ${backoffTime}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
				await new Promise(resolve => setTimeout(resolve, backoffTime));
				return getQuestions(gameOptions, retryCount + 1);
			} else {
				throw new Error('Rate limit exceeded. Please wait a few minutes and try again.');
			}
		}

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
			} else if (data.response_code === 2) {
				console.error("Invalid parameter");
				return [];
			} else if (data.response_code === 3) {
				// Token not found, reset it
				console.warn("Session token not found, resetting...");
				sessionToken = null;
				return [];
			} else if (data.response_code === 4) {
				// All questions exhausted for this token, reset it
				console.warn("All questions exhausted, resetting token...");
				await resetSessionToken();
				// Retry once with new token
				if (retryCount === 0) {
					return getQuestions(gameOptions, 1);
				}
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
	// Also reset session token when clearing cache
	sessionToken = null;
};