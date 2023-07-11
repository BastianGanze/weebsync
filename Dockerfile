# --- Build Stage ---
FROM node:18

COPY . .

RUN yarn install
RUN yarn run build

ENV WEEB_SYNC_SERVER_HTTP_PORT 42380

RUN mkdir build/config

# Define the command that Docker should run when your image is executed
CMD [ "node", "build/index.mjs" ]
