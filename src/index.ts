import { augmentTypeDefs, augmentSchema } from "neo4j-graphql-js";
import { ApolloServer, gql, makeExecutableSchema } from "apollo-server";
import { v1 as neo4j } from "neo4j-driver";
import {
  typeDefs as defaultTypedefs,
  resolvers as defaultResolvers
} from "./schema";

require("dotenv").config();

const typeDefs = process.env.TYPEDEFS || defaultTypedefs;
const resolvers = defaultResolvers;

const schema = makeExecutableSchema({
  typeDefs: augmentTypeDefs(typeDefs),
  // config: {
  //   query: {
  //     exclude: ["LogContactPayload"]
  //   }
  // },
  resolverValidationOptions: {
    requireResolversForResolveType: false
  },
  resolvers
});

// Add auto-generated mutations
const augmentedSchema = augmentSchema(schema);

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "letmein"
  )
);

const server = new ApolloServer({
  schema: augmentedSchema,
  // inject the request object into the context to support middleware
  // inject the Neo4j driver instance to handle database call
  context: ({ req }) => {
    return {
      driver,
      req
    };
  }
});

server
  .listen(
    process.env.PORT || process.env.GRAPHQL_LISTEN_PORT || 3000,
    "0.0.0.0"
  )
  .then(({ url }) => {
    console.log(`GraphQL API ready at ${url}`);
  });
