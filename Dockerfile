FROM mhart/alpine-node:6
RUN apk update && apk add jq
WORKDIR /src
ADD index.js .
ADD package.json .
RUN npm install
EXPOSE 8080
CMD ["node", "index.js"]
