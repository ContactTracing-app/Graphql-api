# Graphql API for contact-tracing.app

My partner and I are frantically building this app to help people keep their loved ones safe during this COVID-19 outbreak.

Plan: store a graph of personal contact. Notify your family and friends is you fall ill.

# Steps to run the compile and run the server

- Clone the repo
- Copy `.env.example` to `.env` (same directly) and edit appropriately
- Run `yarn` or `npm install`
- Run `yarn run build && yarn start` or `npm run build && npm start`

# Development

I haven't had time to set-up auto re-load, so for now you've got to kill the process and restart.

When the app runs, launch in the browser. Make sure to add an `Authorization Bearer <YOUR_AUTH_TOKEN_HERE>` header or you'll get a "Not authorised" error.
