import express from 'express';
import { augmentTypeDefs, augmentSchema } from 'neo4j-graphql-js';
import bodyParser from 'body-parser';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-express';
import { applyMiddleware } from 'graphql-middleware';
import * as neo4j from 'neo4j-driver';
import { tradeTokenForUser } from './auth';
import {
  typeDefs as defaultTypedefs,
  resolvers as defaultResolvers
} from './appConfigs/schema';

const typeDefs = process.env.TYPEDEFS || defaultTypedefs;
const resolvers = defaultResolvers;

export interface Context {
  user: User | null;
  driver: neo4j.Driver;
  req: Express.Request;
}

import errorMiddleware from './common/httpErrorHandler.middleware';
import helmet from 'helmet';
import { User } from './auth';
import permissions from './permissions';

const checkErrorHeaderMiddleware = async (req, res, next) => {
  req.error = req.headers['x-error'];
  next();
};

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
      },
      mutation: {
        exclude: ['CreatePersonDay', 'DeletePersonDay', 'UpdatePersonDay']
      }
    });

    const schemaWithMiddleware = applyMiddleware(augmentedSchema, permissions);

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
      schema: schemaWithMiddleware,
      // inject the request object into the context to support middleware
      // inject the Neo4j driver instance to handle database call
      context: ({ req }): Context => {
        const { authorization } = req.headers;
        const token =
          authorization && authorization.startsWith('Bearer ')
            ? authorization.slice(7, authorization.length)
            : '';

        const user = tradeTokenForUser(token);
        return {
          user,
          driver,
          req
        };
      }
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
    this.app.use('*', checkErrorHeaderMiddleware);
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
