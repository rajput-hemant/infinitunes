import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

import Loading from "./components/loading";
import RootLayout from "./components/root-layout";
import Center from "./components/ui/center";
import Home from "./pages/home/home";

const Song = lazy(() => import("./pages/song/song"));

const Album = lazy(() => import("./pages/album/album"));
const AlbumGrid = lazy(() => import("./pages/album/album-grid"));

const Chart = lazy(() => import("./pages/chart/chart"));
const ChartGrid = lazy(() => import("./pages/chart/chart-grid"));

const Playlist = lazy(() => import("./pages/playlist/playlist"));
const PlaylistGrid = lazy(() => import("./pages/playlist/playlist-grid"));

const NotFound = lazy(() => import("./pages/not-found"));

const App = () => {
  return (
    <RootLayout>
      <Suspense
        fallback={
          <Center absolutely>
            <Loading iconSize={50} />
          </Center>
        }
      >
        <Routes>
          <Route index path="/" element={<Home />} />

          <Route path="/song/:title/:id" element={<Song />} />

          <Route path="/album" element={<AlbumGrid />} />
          <Route path="/album/:title/:id" element={<Album />} />

          <Route path="/chart" element={<ChartGrid />} />
          <Route path="/chart/:title/:id" element={<Chart />} />

          <Route path="/playlist" element={<PlaylistGrid />} />
          <Route path="/playlist/:title/:id" element={<Playlist />} />

          <Route path="/*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RootLayout>
  );
};

export default App;
