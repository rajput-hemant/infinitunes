<div align=center>

<!-- labels -->

![][ci] ![][views] ![][stars] ![][forks] ![][issues] ![][license] ![][repo-size]

<!-- logo/title -->

<picture>
  <source media="(prefers-color-scheme: dark, (max-width:300px))" srcset="./public/images/logo1920.png">
  <source media="(prefers-color-scheme: light,(max-width:300px))" srcset="./public/images/logo1500.png">
  <img src="./public/images/logo1920.png" width="300px" alt="infinitunes">
</picture>

### [WIP] A Simple Music Player Web App made with Next.js + Tailwind.

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://graph.org/file/12ea4beff2367f40f13ce.png">
  <source media="(prefers-color-scheme: dark)" srcset="https://graph.org/file/16937ebb693470d804f31.png">
  <img src="https://graph.org/file/12ea4beff2367f40f13ce.png" alt="infinitunes">
</picture>

**[<kbd> <br> &nbsp;**Live Demo**&nbsp; <br> </kbd>][site]**

## Building from Source

</div>

This is a Bun monorepo. The web app lives in `apps/web`.

- Fetch latest source code from master branch.

```
git clone https://github.com/rajput-hemant/infinitunes
cd infinitunes
```

- Rename **.env.example** => **.env.local**, add your own environment variables.

- Install dependencies and start the dev server:

```
bun install
bun dev
```

- Other useful commands (run from the repo root):

```
bun run build        # Production build
bun run lint         # Lint with Oxlint
bun run fmt:check    # Check formatting with oxfmt
bun run type-check   # Type check with TypeScript
bun test             # Run tests
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

- Other Makefile targets:

```
make install         # Install dependencies
make dev             # Start dev server
make lint            # Run linting and format checks
make typecheck       # Run type checking
make test            # Run tests
make build-app       # Production build
```

<div align=center>

### Deploy Your Own

You can deploy your own hosted version of `infinitunes` to Vercel.

#### Vercel Setup

When importing the repository into Vercel, configure the following:

| Setting              | Value           |
| -------------------- | --------------- |
| **Framework Preset** | Next.js         |
| **Root Directory**   | `apps/web`      |
| **Install Command**  | `bun install`   |
| **Build Command**    | `bun run build` |
| **Output Directory** | `.next`         |

#### Required Environment Variables

Set these in your Vercel project settings:

| Variable                   | Description                                   |
| -------------------------- | --------------------------------------------- |
| `AUTH_SECRET`              | Secret for Auth.js sessions                   |
| `AUTH_URL`                 | Your deployed app URL (for Auth.js)           |
| `JIOSAAVN_API_URL`         | JioSaavn API base URL                         |
| `GOOGLE_CLIENT_ID`         | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth client secret                    |
| `GITHUB_CLIENT_ID`         | GitHub OAuth client ID                        |
| `GITHUB_CLIENT_SECRET`     | GitHub OAuth client secret                    |
| `DATABASE_URL`             | PostgreSQL connection string                  |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis URL (optional, rate limiting)   |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional, rate limiting) |
| `UMAMI_WEBSITE_ID`         | Umami analytics website ID (optional)         |

[![Deploy with Vercel][deploy]][deploy-link]

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
[deploy]: https://vercel.com/button
[deploy-link]: https://vercel.com/new/clone?repository-url=https://github.com/rajput-hemant/infinitunes&root-directory=apps%2Fweb&install-command=bun%20install&build-command=bun%20run%20build&env=AUTH_SECRET,AUTH_URL,JIOSAAVN_API_URL,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,DATABASE_URL&project-name=infinitunes&repo-name=infinitunes

<!------------------------------------{ api }----------------------------------->

[api]: https://github.com/rajput-hemant/jiosaavn-api-ts
[api-docs]: https://docs-jiosaavn.netlify.app/
[cc]: https://github.com/rajput-hemant
