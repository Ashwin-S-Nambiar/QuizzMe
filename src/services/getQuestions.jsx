const getQuestions = async gameOptions => {
	const { category, difficulty, type, questionno } = gameOptions;

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

	const res = await fetch(apiUrl);
	const data = await res.json();
	return data.results;
}

export default getQuestions;