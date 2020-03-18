# ---- Base Node ----
FROM node:12.15-slim AS base
# Create Directory for the Container
WORKDIR /usr/src/app
# Only copy the package.json file to work directory
COPY package.json .
# Install all Packages
RUN npm install
# Copy all other source code to work directory
ADD . /usr/src/app
# TypeScript
RUN npm run build
# Start
# expose port and define CMD
ENV PORT=8080
EXPOSE ${PORT}

CMD npm run start