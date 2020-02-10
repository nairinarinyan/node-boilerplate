FROM node:current-alpine

RUN apk --no-cache add --virtual builds-deps build-base python

WORKDIR /opt/backend
COPY package.json ./
RUN npm i

ENV NODE_ENV production
ENV PORT 8000

COPY . ./
RUN npm run build

EXPOSE 8000

ENTRYPOINT ["npm", "start"]
