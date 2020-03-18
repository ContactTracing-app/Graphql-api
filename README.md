# Steps to run the compile and run the server

- Run `yarn` or `npm install`
- Run `yarn build` or `npm run build`
- Run `yarn start` or `npm run start`

## To run using docker

- Run `docker-compose -f docker-compose.yml up`

## To run mongo as a container

- Run `docker-compose -f docker-compose-resources.yml up`
  
## Generate documentation for code. (uses tsconfig.json file present in your project for generating/serving docs)

- Run `yarn generate-docs` or `npm run generate-docs`
- Run `yarn serve-docs` or `npm run serve-docs` to host the generated documentation

## Things to Remeber / Things to Do

- While coding, please follow proper code-commenting practices.
- **[Can refer and follow standards defined by Microsoft for the same](https://github.com/microsoft/tsdoc)**
