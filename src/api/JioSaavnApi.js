class JioSaavnApi {
	EndPoint = process.env.REACT_APP_JIO_SAAVN_API_KEY;

	Other = {
		devotional: 32,
		topGenreAndMood: 76,
		trendingPodcasts: 107,
		newReleaseHindi: 113,
		topAlbumsHindi: 116,
		bestComedyPodcasts: 135,
	};

	async #jioSaavnApiGetCall(path = "") {
		const url = `${this.EndPoint}${path.startsWith("/") ? path : `/${path}`}`;
		const response = await (await fetch(url)).json();
		// console.log(response);
		return response.results;
	}

	async getTrending() {
		return await this.#jioSaavnApiGetCall("/trending");
	}

	async getCharts() {
		return await this.#jioSaavnApiGetCall("/charts");
	}

	async getPlaylists() {
		return await this.#jioSaavnApiGetCall("/playlists");
	}

	async getNewReleases() {
		const response = await this.#jioSaavnApiGetCall("/home");
		return response.new_albums;
	}

	async getEditorialPicks() {
		const response = await this.#jioSaavnApiGetCall("/home");
		return response.top_playlists;
	}

	async getOthers(id = 32) {
		const response = await this.#jioSaavnApiGetCall("/home");
		return response[`promo:vx:data:${id}`];
	}

	async getAlbumDetails(query = "") {
		if (query.includes("http"))
			return await this.#jioSaavnApiGetCall(`/albums?link=${query}`);
		else return await this.#jioSaavnApiGetCall(`/albums?id=${query}`);
	}

	async getPlaylistDetails(query = "") {
		return await this.#jioSaavnApiGetCall(`/playlists?id=${query}`);
	}

	async getSongDetails(query = "") {
		if (query.includes("http"))
			return await this.#jioSaavnApiGetCall(`/songs?link=${query}`);
		else return await this.#jioSaavnApiGetCall(`/songs?id=${query}`);
	}
}

const api = new JioSaavnApi();
export default api;
