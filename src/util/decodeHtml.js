export const decode = (str) => {
	const txt = new DOMParser().parseFromString(str, "text/html");
	return txt.documentElement.textContent;
};
