FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

ENV VITE_JIOSAAVN_ENDPOINT=https://saavn.me

CMD ["npm", "run", "dev"]
