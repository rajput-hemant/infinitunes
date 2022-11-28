import { useSelector } from "react-redux";

import api from "../../api/JioSaavnApi";
import { SearchTilesContainer } from "./Search.style";
import SongTile from "../../components/Card/SongTile";
import { NavBtn, SearchContainer, SearchNav } from "./Search.style";
import { useEffect, useState } from "react";

const Search = () => {
	const [searchRes, setSearchRes] = useState([]);
	const query = useSelector((state) => state.search.searchInput) || "";

	const [toSearch, setToSearch] = useState("songs");

	useEffect(() => {
		const fetchSearch = async () => {
			if (toSearch === "all") {
				const response = await api.searchAll(query);
				setSearchRes([
					...response.topquery.data,
					...response.songs.data,
					...response.albums.data,
					...response.playlists.data,
					...response.shows.data,
				]);
				console.log(response);
			}
			if (toSearch === "songs") {
				const response = await api.searchSongs(query);
				console.log(response);
				setSearchRes(response);
			}
			if (toSearch === "albums") {
				const response = await api.searchAlbums(query);
				setSearchRes(response);
				console.log(response);
			}
		};
		const setTimer = setTimeout(() => {
			if (query.length !== 0) fetchSearch();
		}, 500);

		return () => clearTimeout(setTimer);
	}, [query, toSearch]);

	return (
		<SearchContainer>
			{query.length !== 0 && <h2>Search results for "{query}"</h2>}
			<SearchNav>
				<NavBtn onClick={() => setToSearch("all")}>Top Results</NavBtn>
				<NavBtn onClick={() => setToSearch("songs")}>Songs</NavBtn>
				<NavBtn onClick={() => setToSearch("albums")}>Albums</NavBtn>
			</SearchNav>
			<SearchTilesContainer>
				{searchRes.map((item, index) => (
					<SongTile
						key={index}
						name={item.name || item.title}
						artists={item.primaryArtists || item.music || item.description}
						image={
							typeof item.image === "string" ? item.image : item.image[0].link
						}
					/>
				))}
			</SearchTilesContainer>
		</SearchContainer>
	);
};

export default Search;
