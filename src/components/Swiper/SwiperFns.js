
 export const itemCount = (winWidth) => {
	if (winWidth <= 590) {
		return 2;
	}
	if (winWidth > 590 && winWidth <= 800) {
		return 3;
	}
	if (winWidth > 800 && winWidth <= 1100) {
		return 4;
	}
	if (winWidth > 1100 && winWidth <= 1300) {
		return 4;
	}
	if (winWidth > 1300 && winWidth <= 1600) {
		return 4;
	}
	if (winWidth > 1600) {
		return 5;
	}
};

export const spaceBetween = (winWidth) => {
	if (winWidth <= 590) {
		return 130;
	}
	if (winWidth > 590 && winWidth <= 800) {
		return 190;
	}
	if (winWidth > 800 && winWidth <= 1100) {
		return 170;
	}
	if (winWidth > 1100 && winWidth <= 1300) {
		return 170;
	}
	if (winWidth > 1300 && winWidth <= 1600) {
		return 150;
	}
	if (winWidth > 1600) {
		return 140;
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
