import { LoggingWinston } from '@google-cloud/logging-winston'
import { ApolloServer } from 'apollo-server-express'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { v1 as neo4j } from 'neo4j-driver'
import { makeAugmentedSchema } from 'neo4j-graphql-js'
import winston from 'winston'
import { typeDefs } from './graphql-schema'

dotenv.config()

// GraphQL port, should default to 8080 for GCP
const port = Number(process.env.GRAPHQL_LISTEN_PORT) || 8080

/**
 * Setup Winston logger, TypeScript doesn't like console.log
 */
const logger = winston.createLogger({
	transports: [new winston.transports.Console()],
})

// Add Stackdriver logger if in production
if (process.env.isProduction) {
	logger.add(new LoggingWinston())
}

/*
 * Setup GraphQL schema
 */
const schema = makeAugmentedSchema({
	typeDefs,
})

/*
 * Setup services and place them in the context
 */
const driver = neo4j.driver(
	process.env.NEO4J_URI || 'bolt://localhost:7687',
	neo4j.auth.basic(
		process.env.NEO4J_USER || 'neo4j',
		process.env.NEO4J_PASSWORD || 'letmein'
	)
)

/*
 * Setup Apollo server
 */
const server = new ApolloServer({
	context: (req: Express.Request) => ({
		driver,
		...req,
	}),
	introspection: true,
	playground: true,
	schema,
})

/*
 * Setup express
 */
const app = express()

app.use(cors())

app.get('/', (_req, res) => {
	res.status(200).send({ status: 'OK' })
})

app.get('/healthz', (req, res) => {
	res.status(200).send({ status: 'OK' })
})

server.applyMiddleware({ app })

app.listen(port, '0.0.0.0', () => {
	logger.info(`GraphQL API ready at http://0.0.0.0:${port}/graphql`)
})
