# ---- Base Node ----
FROM node:12.15-slim AS base
# Create Directory for the Container
WORKDIR /usr/src/app

# Copy all source code to work directory
COPY . /usr/src/app

# Install all Packages and run TypeScript
RUN npm install
RUN npm run build

FROM node:12.16.1-alpine3.10 AS runtime

WORKDIR /usr/app
COPY --from=base /usr/src/app/node_modules /usr/app/node_modules
COPY --from=base /usr/src/app/build /usr/app

# Start
# expose port and define CMD
ENV PORT=8080
EXPOSE ${PORT}

CMD node /usr/app/server.js