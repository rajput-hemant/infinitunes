export const itemCount = (winWidth) => {
	if (winWidth <= 500) {
		return [3];
	}
	if (winWidth > 500 && winWidth <= 800) {
		return [4];
	}
	if (winWidth > 800 && winWidth <= 1440) {
		return [5];
	}
	if (winWidth > 1440 && winWidth <= 1790) {
		return [6];
	}
	if (winWidth > 1790) {
		return 6;
	}
};

export const spaceBetween = (winWidth) => {
	if (winWidth <= 500) {
		return [10];
	}
	if (winWidth > 500 && winWidth <= 800) {
		return [10];
	}
	if (winWidth > 800 && winWidth <= 1100) {
		return [15];
	}
	if (winWidth > 1100 && winWidth <= 1440) {
		return [0];
	}
	if (winWidth > 1440) {
		return [0];
	}
};

export const cartSubtitle = (item) => {
	if (item.type === "album" && item.more_info.artistMap !== undefined) {
		let artists = "";
		item.more_info.artistMap.artists.map(
			(artist) => (artists += `${artist.name}, `)
		);
		return <h5>{artists.slice(0, -2)}</h5>;
	}
	if (item.type === "playlist" && item.more_info.firstname !== undefined)
		return <h5>{item.more_info.firstname}</h5>;
	if (item.type === "playlist" && item.more_info.subtitle !== undefined)
		return <h5>{item.more_info.subtitle}</h5>;
	if (item.type === "album" && item.more_info.subtitle !== undefined)
		return <h5>{item.more_info.release_year}</h5>;
	if (item.data_type === "featured" && item.follower_count !== undefined)
		return <h5>{item.follower_count}</h5>;
};
