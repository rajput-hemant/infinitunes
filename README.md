<div align=center>

<!-- labels -->

![][ci] ![][views] ![][stars] ![][forks] ![][issues] ![][license] ![][repo-size]

<!-- logo/title -->

<picture>
  <source media="(prefers-color-scheme: dark, (max-width:300px))" srcset="./public/images/logo1920.png">
  <source media="(prefers-color-scheme: light,(max-width:300px))" srcset="./public/images/logo1500.png">
  <img src="./public/images/logo1920.png" width="300px" alt="infinitunes">
</picture>

### [WIP] 🎵 A Simple Music Player Web App made with ▲ Next.js + Tailwind.

![](https://graph.org/file/9f7cb6de815f1eb73a576.png)

**[<kbd> <br> &nbsp;**Live Demo**&nbsp; <br> </kbd>][site]**

## Building from Source

</div>

- Fetch latest source code from master branch.

```
git clone https://github.com/rajput-hemant/infinitunes
cd infinitunes
```

- Rename **.env.example** => **.env.local**, add your own environment variables.

- Run the app with VS Code or the command line:

```
bun i
bun dev
```

<div align=center>

## TODO

</div>

- [ ] Add Metadata to the pages.
- [ ] Replace loading spinners with Page Skeletons.
- [ ] Play rate for shows and podcasts.
- [ ] Implement the feature to save Favorites, Recently Played Songs in both the `db` and `localStorage`.
- [ ] Add support for User's Playlists.
- [ ] Add support for Radio Stations.
- [ ] Create Library, Settings, and Profile pages.
  - Library page
    - [ ] Recently Played
    - [ ] Favorites (Songs, Albums, Playlists)
  - Settings page (Intercepting routes `/settings`)
    - [ ] Theme Mode (Light, Dark, System)
    - [ ] Theme Color (Zinc, Slate, Stone, Gray, Neutral, Red, Rose, Orange, Green, Blue, Yellow, Violet)
    - [ ] Language (Hindi, English, Punjabi, Tamil, Telugu, Marathi, Gujarati, Bengali, Kannada, Bhojpuri, Malayalam, Urdu, Haryanvi, Rajasthani, Odia, Assamese)
    - [ ] Image Quality (Low, Medium, High)
    - [ ] Audio Quality (12kbps, 48kbps, 96kbps, 160kbps, 320kbps)
    - [ ] Download Quality (12kbps, 48kbps, 96kbps, 160kbps, 320kbps)
    - [ ] Download Location
    - [ ] Clear Cache
    - [ ] Delete Account
- [ ] Improve website responsiveness and accessibility.
  - [ ] Improve Card Responsiveness, impelement auto-resizing cards like `https://jiosaavn.com`
  - [ ] Add accessibility features & aria labels.
- [ ] Enhance the Player UI, add a player screen for small devices, and a Queue sheet for larger devices.
- [x] Add support for Keyboard shortcuts for Player.
- [ ] Add support to download songs.
- [ ] Optimize initial page load size.

and many more...

<div align=center>

### Deploy Your Own

You can deploy your own hosted version of `infinitunes`. Just click the link below to deploy a ready-to-go version to Vercel.

[![Deploy with Vercel](https://vercel.com/button)][deploy]

#### [JioSaavn API (Unofficial)][api] by [me][cc], [API Docs][api-docs]

## Disclaimer

This project is independent of any affiliation with JioSaavn or its associated partners. It is created solely for educational purposes. Usage is at your own discretion, and the developer disclaims responsibility for any misuse or potential damage resulting from the use of this program. Please refrain from duplicating this project for commercial purposes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributors:

[![][contributors]][contributors-graph]

_Note: It may take up to 24h for the [contrib.rocks][contrib-rocks] plugin to update because it's refreshed once a day._

</div>

<!----------------------------------{ Labels }--------------------------------->

[views]: https://komarev.com/ghpvc/?username=infinitunes&label=view%20counter&color=red&style=flat
[repo-size]: https://img.shields.io/github/repo-size/rajput-hemant/infinitunes
[issues]: https://img.shields.io/github/issues-raw/rajput-hemant/infinitunes
[license]: https://img.shields.io/github/license/rajput-hemant/infinitunes
[forks]: https://img.shields.io/github/forks/rajput-hemant/infinitunes?style=flat
[stars]: https://img.shields.io/github/stars/rajput-hemant/infinitunes
[contributors]: https://contrib.rocks/image?repo=rajput-hemant/infinitunes&max=500
[contributors-graph]: https://github.com/rajput-hemant/infinitunes/graphs/contributors
[contrib-rocks]: https://contrib.rocks/preview?repo=rajput-hemant%2Finfinitunes
[ci]: https://github.com/rajput-hemant/infinitunes/actions/workflows/ci.yml/badge.svg

<!-----------------------------------{ Links }---------------------------------->

[site]: https://infinitunes.vercel.app
[deploy]: https://vercel.com/new/clone?repository-url=https://github.com/rajput-hemant/infinitunes&env=NEXT_PUBLIC_APP_URL,NEXTAUTH_URL,NEXTAUTH_SECRET,JIOSAAVN_API_URL,NEXT_PUBLIC_JIOSAAVN_API_URL,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,DATABASE_URL&project-name=infinitunes&repo-name=infinitunes

<!------------------------------------{ api }----------------------------------->

[api]: https://github.com/rajput-hemant/jiosaavn-api-ts
[api-docs]: https://docs-jiosaavn.netlify.app/
[cc]: https://github.com/rajput-hemant
