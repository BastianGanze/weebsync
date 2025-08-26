# --- Build Stage ---
FROM node:22-alpine as build

COPY . .

RUN yarn install
RUN yarn run build

FROM node:22-alpine as run

COPY --from=build /build ./

ENV WEEB_SYNC_SERVER_HTTP_PORT 42380

# Define the command that Docker should run when your image is executed
CMD [ "node", "index.js" ]
