FROM node:alpine

RUN npm i -g pnpm

WORKDIR /app

COPY package*.json ./

RUN pnpm i

COPY . .

RUN pnpm build

EXPOSE 4173

ENV VITE_JIOSAAVN_ENDPOINT=https://saavn.me

CMD ["pnpm", "preview"]
