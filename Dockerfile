# ---- Base Node ----
FROM node:12.15-slim AS base
# set working directory
WORKDIR /app
# copy project file
COPY package.json .

#
# ---- Dependencies ----
FROM base AS dependencies
# install node packages
RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production 
# copy production node_modules aside
RUN cp -R node_modules prod_node_modules
# install ALL node_modules, including 'devDependencies'
RUN npm install

COPY . .

# expose port and define CMD
ENV PORT=8080
EXPOSE ${PORT}

CMD npm run start