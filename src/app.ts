import express from 'express';
import { augmentTypeDefs, augmentSchema } from 'neo4j-graphql-js';
import bodyParser from 'body-parser';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-express';
import * as neo4j from 'neo4j-driver';
import {
  typeDefs as defaultTypedefs,
  resolvers as defaultResolvers
} from './appConfigs/schema';

const typeDefs = process.env.TYPEDEFS || defaultTypedefs;
const resolvers = defaultResolvers;

export interface Context {
  driver: neo4j.Driver;
  req: Express.Request;
}

import errorMiddleware from './common/httpErrorHandler.middleware';
import helmet from 'helmet';

export default class App {
  public app: express.Application;
  public server: ApolloServer;
  public port: number;

  /**
   * @constructor
   * @param controllers
   * @param port
   */
  constructor(port: number) {
    const schema = makeExecutableSchema({
      typeDefs: augmentTypeDefs(typeDefs),

      resolverValidationOptions: {
        requireResolversForResolveType: false
      },
      resolvers
    });

    // Add auto-generated mutations
    const augmentedSchema = augmentSchema(schema, {
      query: {
        exclude: ['LogContactPayload']
      }
    });

    const driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'letmein'
      ),
      { encrypted: true }
    );

    this.app = express();
    this.server = new ApolloServer({
      schema: augmentedSchema,
      // inject the request object into the context to support middleware
      // inject the Neo4j driver instance to handle database call
      context: ({ req }: { req: Express.Request }): Context => ({
        driver,
        req
      })
    });
    this.port = port;

    this.initializeMiddlewares();
    this.initializeErrorhandling();
  }

  /**
   * @func listen Make the server to listen at specified port.
   */
  public listen() {
    this.app.listen(this.port, () => {
      console.log(`server started at http://localhost:${this.port}/graphql`);
    });
  }

  /**
   * @func initializeMiddlewares Initializes all the middleware
   */
  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
    this.app.use(helmet());
    this.server.applyMiddleware({ app: this.app });
  }

  /**
   * @func initializeErrorhandling Initializes error handling middleware.
   */
  private initializeErrorhandling() {
    this.app.use(errorMiddleware);
  }
}
