# --------------> The build image__
FROM node:16.20.1 AS development
RUN apt-get update && apt-get install -y --no-install-recommends

WORKDIR /usr/src/app

COPY package*.json ./

# RUN npm install
RUN npm install --only=development

COPY . .

# ENV NODE_ENV=${NODE_ENV}
# ARG NODE_ENV=production

RUN npm run build

# --------------> The production image__
FROM node:16.20.1-bullseye-slim as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production
# COPY . .
COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/client ./dist/client
EXPOSE 3030
USER node

CMD ["node", "dist/src/main"]
# CMD ["npm", "run", "start:prod"]