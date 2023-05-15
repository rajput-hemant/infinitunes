<div align=center>

<!-- labels -->

![][views] ![][stars] ![][forks] ![][issues] ![][license] ![][repo-size]

<!-- logo/title -->

<picture>
  <source media="(prefers-color-scheme: dark, (max-width:300px))" srcset="./public/images/logo1920.png">
  <source media="(prefers-color-scheme: light,(max-width:300px))" srcset="./public/images/logo1500.png">
  <img src="./public/images/logo1920.png" width="300px" alt="infinitunes">
</picture>

### [WIP] 🎵 A Simple Music Player Web App made with ⚛️ React + Vite + Tailwind and Redux Toolkit.

### **[<kbd> <br> Live Demo <br> </kbd>][site]**

## Building from Source

</div>

- Fetch latest source code from master branch.

```console
git clone https://github.com/rajput-hemant/infinitunes
cd infinitunes
```

- Rename **.env.example** => **.env.local**, add your own [**JioSaavn API**][api] Endpoint.

```js
VITE_JIOSAAVN_ENDPOINT = "https://saavn.me"; <- change this
```

- Run the app with VS Code or the command line:

```console
pnpm i
pnpm dev
```

<div align = center>

#### [JioSaavn API (Unofficial)][api] by [Sumit Kolhe][cc], [API Docs][api-docs]

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

<!-----------------------------------{ Links }---------------------------------->

[site]: https://infinitunes.vercel.app

<!------------------------------------{ api }----------------------------------->

[api]: https://github.com/sumitkolhe/jiosaavn-api
[api-docs]: https://docs.saavn.me
[cc]: https://github.com/sumitkolhe
