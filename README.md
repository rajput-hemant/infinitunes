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

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://graph.org/file/12ea4beff2367f40f13ce.png">
  <source media="(prefers-color-scheme: dark)" srcset="https://graph.org/file/16937ebb693470d804f31.png">
  <img src="https://graph.org/file/12ea4beff2367f40f13ce.png" alt="infinitunes">
</picture>

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
bun i || pnpm i || npm i || yarn
bun dev || pnpm dev || npm run dev || yarn dev
```

<div align=center>

### Docker and Makefile

</div>

- Build the Docker Image and start the container:

```
make build
make start
```

- Stop the Docker container:

```
make stop
```

<div align=center>

### Deploy Your Own

You can deploy your own hosted version of `infinitunes`. Just click the link below to deploy a ready-to-go version to Vercel.

[![Deploy with Vercel](https://vercel.com/button)][deploy]

#### [JioSaavn API (Unofficial)][api] by [me][cc], [API Docs][api-docs]

## Star History

<a href="https://star-history.com/#rajput-hemant/infinitunes">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=rajput-hemant/infinitunes&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=rajput-hemant/infinitunes" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=rajput-hemant/infinitunes" />
 </picture>
</a>

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
