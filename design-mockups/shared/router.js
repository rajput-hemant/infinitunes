// Hash router shared by every variant. Works over file:// and http.
// Routes: home, search, search/<query>, browse, chart, albums, playlists, artists, radio, shows,
// album/<id>, playlist/<id>, artist/<id>, song/<id>, show/<id>, episode/<id>,
// me, me/<tab>, me/playlist/<id>, settings, settings/appearance, settings/preferences, login, signup.
const Router = {
  depth: 0,
  current() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    return { name: parts[0] || "home", params: parts.slice(1), path: parts.join("/") || "home" };
  },
  go(path) {
    Router.depth++;
    location.hash = "#/" + path;
  },
  back() {
    if (Router.depth > 0) {
      Router.depth--;
      history.back();
    } else {
      location.hash = "#/home";
    }
  },
  start(render) {
    const run = () => {
      render(Router.current());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", run);
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-go]");
      if (a) {
        e.preventDefault();
        Router.go(a.dataset.go);
        return;
      }
      if (e.target.closest("[data-back]")) {
        e.preventDefault();
        Router.back();
      }
    });
    run();
  },
};
