// Real infinitunes content captured from the running app on 2026-10-10.
const CDN = "https://c.saavncdn.com/";
const img = (path, size = 150) => CDN + path.replace("{s}", `${size}x${size}`);

const MOCK = {
  user: { name: "Hemant", email: "hemant@example.test" },

  albums: [
    { id: "michael", title: "Michael: Songs From The Motion Picture", subtitle: "Michael Jackson", year: 2026, img: "496/Michael-Songs-From-The-Motion-Picture-English-2026-20260421104427-{s}.jpg" },
    { id: "dhurandhar", title: "Dhurandhar The Revenge", subtitle: "Shashwat Sachdev", year: 2026, img: "581/Dhurandhar-The-Revenge-Hindi-2026-20260409161002-{s}.jpg" },
    { id: "dai-dai", title: "Dai Dai", subtitle: "Shakira, Burna Boy", year: 2026, img: "526/Dai-Dai-Spanish-2026-20260612005619-{s}.jpg" },
    { id: "awarapan-2", title: "Awarapan 2", subtitle: "Various Artists", year: 2026, img: "820/Awarapan-2-Hindi-2026-20260929184517-{s}.jpg" },
    { id: "afro-house", title: "Afro House 2026", subtitle: "Various Artists", year: 2026, img: "897/Afro-House-2026-English-2026-20260509000619-{s}.jpg" },
    { id: "vvaan", title: "The Vvaan (Original Motion Picture Soundtrack)", subtitle: "Various Artists", year: 2026, img: "554/The-Vvaan-Original-Motion-Picture-Soundtrack-Hindi-2026-20261001182647-{s}.jpg" },
    { id: "cocktail-2", title: "Cocktail 2", subtitle: "Various Artists", year: 2026, img: "689/Cocktail-2-Hindi-2026-20260629161048-{s}.jpg" },
    { id: "hanuman-ansh", title: "Hanuman Ansh (Original Motion Picture Soundtrack)", subtitle: "Various Artists", year: 2026, img: "058/Hanuman-Ansh-Original-Motion-Picture-Soundtrack-Hindi-2026-20260710211303-{s}.jpg" },
    { id: "musafir-cafe", title: "Musafir Cafe (Songs from the Netflix Series)", subtitle: "Various Artists", year: 2026, img: "978/Musafir-Cafe-Songs-from-the-Netflix-Series-Hindi-2026-20260727151003-{s}.jpg" },
    { id: "mirzapur", title: "Mirzapur The Movie", subtitle: "Various Artists", year: 2026, img: "738/Mirzapur-The-Movie-Hindi-2026-20260830233548-{s}.jpg" },
    { id: "wild", title: "WILD", subtitle: "Various Artists", year: 2026, img: "706/WILD-English-2026-20260814063732-{s}.jpg" },
    { id: "drishyam", title: "Drishyam: The Conclusion", subtitle: "Various Artists", year: 2026, img: "380/Drishyam-The-Conclusion-Hindi-2026-20260928174306-{s}.jpg" },
  ],

  playlists: [
    { id: "now-trending", title: "Now Trending", subtitle: "66.3K Fans", img: "editorial/NowTrending_20260423085344.jpg" },
    { id: "chartbusters-intl", title: "Chartbusters 2026 - International", subtitle: "1.9K Followers", img: "editorial/Chartbusters2026International_20260707100417.jpg" },
    { id: "arijit", title: "Let's Play - Arijit Singh - Hindi", subtitle: "776K Followers", img: "editorial/Let_sPlayArijitSinghHindi_20240812070403.jpg" },
    { id: "viral-nation", title: "Viral Nation", subtitle: "Just Updated", img: "editorial/ViralNation_20260930120445.jpg" },
    { id: "latin", title: "Fresh Latin Hits", subtitle: "Just Updated", img: "editorial/FreshLatinHits_20261009143801.jpg" },
    { id: "romantic", title: "Romantic Hits 2026 - Hindi", subtitle: "Just Updated", img: "editorial/RomanticHits2026Hindi_20260707083404.jpg" },
    { id: "lofi", title: "Chill Maaro: Lo-Fi Mix", subtitle: "Playlist", img: "editorial/ChillMaaro-LoFiMix_20260403095103.jpg" },
    { id: "kpop", title: "Best of K-Pop", subtitle: "Playlist", img: "editorial/BestofKPop_20260831100227.jpg" },
    { id: "gym-phonk", title: "Gym Phonk", subtitle: "Playlist", img: "editorial/GymPhonk_20251125105718.jpg" },
    { id: "90s", title: "Best Of 90s - Hindi", subtitle: "Playlist", img: "editorial/BestOf90sHindi_20251125041813.jpg" },
  ],

  charts: [
    { id: "india-top-50", title: "India Superhits Top 50", subtitle: "Weekly chart", img: "editorial/IndiaSuperhitsTop50_20261009061631.jpg" },
    { id: "hindi-top-50", title: "Hindi: India Superhits Top 50", subtitle: "Weekly chart", img: "editorial/Hindi-IndiaSuperhitsTop50_20261002022633.jpg" },
    { id: "intl-top-50", title: "International : India Superhits Top 50", subtitle: "Weekly chart", img: "editorial/International-IndiaSuperhitsTop50_20261002070726.jpg" },
    { id: "most-searched", title: "Most Searched Songs - Hindi", subtitle: "Weekly chart", img: "editorial/MostSearchedSongsHindi_20260824093050.jpg" },
    { id: "chartbusters-hindi", title: "Chartbusters 2026 - Hindi", subtitle: "Weekly chart", img: "editorial/Chartbusters2026Hindi_20260706103842.jpg" },
    { id: "dance", title: "Fresh Dance Hits", subtitle: "Weekly chart", img: "editorial/FreshDanceHits_20261009144032.jpg" },
  ],

  newReleases: [
    { id: "patient-zero", title: "Patient Zero", subtitle: "Taylor Swift", img: "895/The-Life-of-a-Showgirl-The-Encore-English-2026-20260925103620-{s}.jpg", duration: "03:31" },
    { id: "tujh-mein", title: "Tujh Mein Basi Meri Jaan (From \"Prahaar\")", subtitle: "Various Artists", img: "202/Tujh-Mein-Basi-Meri-Jaan-From-Prahaar-The-Untold-Story-Of-Ujjwal-Nikam-Hindi-2026-20261008171013-{s}.jpg", duration: "04:12" },
    { id: "choozay", title: "Choozay (From \"Udta Teer\")", subtitle: "Various Artists", img: "442/Choozay-From-Udta-Teer-Hindi-2026-20261003145827-{s}.jpg", duration: "03:05" },
    { id: "sawadika", title: "SaWaDiKa", subtitle: "Lisa", img: "572/SaWaDiKa-English-2026-20260904062942-{s}.jpg", duration: "02:48" },
    { id: "afsaana", title: "Afsaana Banaaya Aapne (From \"Gunmaaster G9\")", subtitle: "Various Artists", img: "950/Afsaana-Banaaya-Aapne-From-Gunmaaster-G9-Hindi-2026-20260921193544-{s}.jpg", duration: "04:40" },
    { id: "click", title: "CLICK", subtitle: "Various Artists", img: "855/CLICK-Korean-2026-20260904223242-{s}.jpg", duration: "02:56" },
    { id: "phata-patakha", title: "Phata Patakha (From \"Nayyi Navelli\")", subtitle: "Various Artists", img: "578/Phata-Patakha-From-Nayyi-Navelli-Hindi-2026-20261006130850-{s}.jpg", duration: "03:22" },
    { id: "jai-jai-ram", title: "Jai Jai Ram (From \"Ramayana\")", subtitle: "Various Artists", img: "816/Jai-Jai-Ram-From-Ramayana-Hindi-2026-20260914170135-{s}.jpg", duration: "05:01" },
    { id: "agua", title: "AGUA", subtitle: "Various Artists", img: "495/AGUA-Spanish-2026-20260917101858-{s}.jpg", duration: "03:14" },
    { id: "one-name", title: "One Name (From \"Rajini The Jailer 2\")", subtitle: "Various Artists", img: "815/One-Name-From-Rajini-The-Jailer-2-Hindi-2026-20261008135320-{s}.jpg", duration: "03:48" },
  ],

  artists: [
    { id: "shashwat-sachdev", name: "Shashwat Sachdev", img: "artists/Shashwat_Sachdev_000_20221011114409_{s}.jpg", listeners: "3.5M" },
    { id: "udit-narayan", name: "Udit Narayan", img: "artists/Udit_Narayan_004_20241029065120_{s}.jpg", listeners: "18M" },
    { id: "dhanda-nyoliwala", name: "Dhanda Nyoliwala", img: "artists/Dhanda_Nyoliwala_000_20240820133551_{s}.jpg", listeners: "4.1M" },
    { id: "kishore-kumar", name: "Kishore Kumar", img: "artists/Kishore_Kumar_{s}.jpg", listeners: "22M" },
    { id: "jaani", name: "Jaani", img: "artists/Jaani_003_20251229114736_{s}.jpg", listeners: "6.7M" },
    { id: "sidhu-moose-wala", name: "Sidhu Moose Wala", img: "artists/Sidhu_Moose_Wala_004_20250617183705_{s}.jpg", listeners: "12M" },
    { id: "lata-mangeshkar", name: "Lata Mangeshkar", img: "artists/Lata_Mangeshkar_004_20230623105323_{s}.jpg", listeners: "20M" },
    { id: "masoom-sharma", name: "Masoom Sharma", img: "artists/Masoom_Sharma_003_20250619064935_{s}.jpg", listeners: "5.2M" },
  ],

  // Album detail: Michael: Songs From The Motion Picture (13 songs, 57:30).
  albumTracks: [
    ["I'll Be There", "The Jackson 5", "03:56"],
    ["Never Can Say Goodbye (Single Version)", "The Jackson 5", "03:00"],
    ["Who's Lovin' You", "The Jackson 5", "04:01"],
    ["Medley: I Want You Back / ABC / The Love You Save (Live from the 1981 U.S. Tour)", "The Jacksons", "02:59"],
    ["Ben (Live from the 1981 U.S. Tour)", "The Jacksons", "03:06"],
    ["Don't Stop 'Til You Get Enough", "Michael Jackson", "05:52"],
    ["Beat It", "Michael Jackson", "04:18"],
    ["Thriller", "Michael Jackson", "05:58"],
    ["Billie Jean", "Michael Jackson", "04:53"],
    ["Wanna Be Startin' Somethin'", "Michael Jackson", "06:03"],
    ["Human Nature", "Michael Jackson", "04:05"],
    ["Workin' Day and Night", "Michael Jackson", "05:12"],
    ["Bad (2012 Remaster)", "Michael Jackson", "04:07"],
  ],

  // Artist detail: Shashwat Sachdev, top songs.
  artistSongs: [
    ["Gehra Hua (From \"Dhurandhar\")", "Shashwat Sachdev, Arijit Singh", "06:02", "581/Dhurandhar-The-Revenge-Hindi-2026-20260409161002-{s}.jpg"],
    ["Lutt Le Gaya (From \"Dhurandhar\")", "Simran Choudhary, Shashwat Sachdev", "04:13", "581/Dhurandhar-The-Revenge-Hindi-2026-20260409161002-{s}.jpg"],
    ["Lutt Le Gaya Eclipsa Audio", "Shashwat Sachdev, Simran Choudhary", "04:13", "581/Dhurandhar-The-Revenge-Hindi-2026-20260409161002-{s}.jpg"],
    ["Dhurandhar The Revenge - Aari Aari", "Shashwat Sachdev", "03:44", "581/Dhurandhar-The-Revenge-Hindi-2026-20260409161002-{s}.jpg"],
    ["Vaari Jaavan (From \"Dhurandhar The Revenge\")", "Shashwat Sachdev", "04:26", "581/Dhurandhar-The-Revenge-Hindi-2026-20260409161002-{s}.jpg"],
  ],

  // Song detail: Billie Jean, from the Michael album.
  song: { title: "Billie Jean", artist: "Michael Jackson", album: "Michael: Songs From The Motion Picture", albumId: "michael", year: 2026, duration: "04:53", language: "English", plays: "1.2M", img: "496/Michael-Songs-From-The-Motion-Picture-English-2026-20260421104427-{s}.jpg" },

  shows: [
    { id: "krishna-amritvani", title: "Shri Krishna Amritvani", subtitle: "Devotional", img: "editorial/BestOf90sHindi_20251125041813.jpg" },
  ],
  episodes: [
    ["Shri Krishna Amritvani - Part 1", "Season 1", "12:40"],
    ["Shri Krishna Amritvani - Part 2", "Season 1", "11:58"],
    ["Shri Krishna Amritvani - Part 3", "Season 1", "13:05"],
    ["Shri Krishna Amritvani - Part 4", "Season 1", "12:22"],
    ["Shri Krishna Amritvani - Part 5", "Season 1", "14:10"],
  ],

  radio: ["English Featured Station", "Hindi Featured Station", "Punjabi Featured Station", "Tamil Featured Station", "Telugu Featured Station", "Lo-Fi Station"],

  languages: ["Hindi", "English", "Punjabi", "Tamil", "Telugu", "Marathi", "Gujarati", "Bengali", "Kannada", "Bhojpuri", "Malayalam", "Urdu", "Haryanvi", "Rajasthani", "Odia", "Assamese"],
  themes: [["zinc", "#18181b"], ["slate", "#0f172a"], ["stone", "#1c1917"], ["gray", "#111827"], ["neutral", "#171717"], ["red", "#dc2626"], ["rose", "#e11d48"], ["orange", "#f97316"], ["green", "#16a34a"], ["blue", "#2563eb"], ["yellow", "#facc15"], ["violet", "#7c3aed"]],
  radii: ["0", "0.3", "0.5", "0.75", "1.0"],
  qualities: { stream: ["12kbps", "48kbps", "96kbps", "160kbps", "320kbps"], image: ["low", "medium", "high"] },
  recentSearches: ["arijit", "dhurandhar", "taylor swift"],
};

MOCK.img = img;
