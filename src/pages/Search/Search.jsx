import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import api from "../../api/JioSaavnApi";
import SongTile from "../../components/Card/SongTile";
import { SearchTilesContainer } from "./Search.style";
import { NavBtn, SearchContainer, SearchNav } from "./Search.style";

const Search = () => {
	const navigate = useNavigate();
	const [searchRes, setSearchRes] = useState([]);
	const [toSearch, setToSearch] = useState("songs");
	const [isActive, setIsActive] = useState({
		all: false,
		songs: true,
		albums: false,
	});
	const query = useSelector((state) => state.search.searchInput) || "";

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
			}

			if (toSearch === "songs") {
				const response = await api.searchSongs(query);
				setSearchRes(response);
			}

			if (toSearch === "albums") {
				const response = await api.searchAlbums(query);
				setSearchRes(response);
			}
		};

		// const setTimer = setTimeout(() => {
		if (query.length !== 0) fetchSearch();
		// }, 500);

		// return () => clearTimeout(setTimer);
	}, [query, toSearch]);

	const onClickHandler = (item) => {
		const id = item.id,
			type = item.type !== undefined ? item.type : `${toSearch.slice(0, -1)}`,
			title = (item.title || item.name)
				.toLowerCase()
				.replace(/[^\w\s]/gi, "")
				.replaceAll(" ", "+");

		if (type === "song") console.log(item.title || item.name);

		if (type === "album" || type === "show")
			navigate(`/album/${id}/${title}`, { state: { id, type } });

		if (type === "playlist" || type === "featured")
			navigate(`/playlist/${id}/${title}`, { state: { id, type } });
	};

	return (
		<SearchContainer>
			{query.length !== 0 && (
				<h2>
					Search results for <em>"{query}"</em>
				</h2>
			)}
			<SearchNav>
				<NavBtn
					isActive={isActive.all}
					onClick={() => {
						setIsActive({
							all: true,
							songs: false,
							albums: false,
						});
						setToSearch("all");
					}}
				>
					Top Results
				</NavBtn>
				<NavBtn
					isActive={isActive.songs}
					onClick={() => {
						setIsActive({
							all: false,
							songs: true,
							albums: false,
						});

						setToSearch("songs");
					}}
				>
					Songs
				</NavBtn>
				<NavBtn
					isActive={isActive.albums}
					onClick={() => {
						setIsActive({
							all: false,
							songs: false,
							albums: true,
						});
						setToSearch("albums");
					}}
				>
					Albums
				</NavBtn>
			</SearchNav>
			<SearchTilesContainer>
				{query.length === 0 && (
					<h2>🔍 Search songs, albums, playlist, you love!. . .</h2>
				)}
				{query.length !== 0 &&
					searchRes.length !== 0 &&
					searchRes.map((item, index) => (
						<SongTile
							key={index}
							name={item.name || item.title}
							artists={
								item.primaryArtist ||
								item.primaryArtists ||
								item.music ||
								item.description
							}
							image={
								typeof item.image === "string" ? item.image : item.image[1].link
							}
							onClick={() => onClickHandler(item)}
						/>
					))}
			</SearchTilesContainer>
		</SearchContainer>
	);
};

export default Search;
