<div align=center>

<!-- labels -->

![][ci] ![][views] ![][stars] ![][forks] ![][issues] ![][license] ![][repo-size]

<!-- logo/title -->

<picture>
  <source media="(prefers-color-scheme: dark, (max-width:300px))" srcset="./public/images/logo1920.png">
  <source media="(prefers-color-scheme: light,(max-width:300px))" srcset="./public/images/logo1500.png">
  <img src="./public/images/logo1920.png" width="300px" alt="infinitunes">
</picture>

### [WIP] 🎵 A Simple Music Player Web App made with ▲ Next.js 13 + Tailwind.

![](https://graph.org/file/9f7cb6de815f1eb73a576.png)

**[<kbd> <br> &nbsp;**Live Demo**&nbsp; <br> </kbd>][site]**

## Building from Source

</div>

- Fetch latest source code from master branch.

```
git clone https://github.com/rajput-hemant/infinitunes
cd infinitunes
```

- Rename **.env.example** => **.env.local**, add your own [**JioSaavn API**][api] Endpoint.

```js
JIOSAAVN_API_URL=https://jiosaavn-api-ts.vercel.app # <- change this to your own API URL
NEXT_PUBLIC_JIOSAAVN_API_URL=https://jiosaavn-api-ts.vercel.app # <- change this to your own API URL
```

- Run the app with VS Code or the command line:

```
bun i
bun dev
```

<div align = center>

### Deploy Your Own

You can deploy your own hosted version of `infinitunes`. Just click the link below to deploy a ready-to-go version to Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rajput-hemant/infinitunes&env=VITE_JIOSAAVN_ENDPOINT&project-name=infinitunes&repo-name=infinitunes)

#### [JioSaavn API (Unofficial)][api] by [me][cc], [API Docs][api-docs]

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

<!------------------------------------{ api }----------------------------------->

[api]: https://github.com/rajput-hemant/jiosaavn-api-ts
[api-docs]: https://docs-jiosaavn.netlify.app/
[cc]: https://github.com/rajput-hemant
