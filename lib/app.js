"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var neo4j_graphql_js_1 = require("neo4j-graphql-js");
var body_parser_1 = __importDefault(require("body-parser"));
var apollo_server_express_1 = require("apollo-server-express");
var neo4j = __importStar(require("neo4j-driver"));
var schema_1 = require("./appConfigs/schema");
var typeDefs = process.env.TYPEDEFS || schema_1.typeDefs;
var resolvers = schema_1.resolvers;
var httpErrorHandler_middleware_1 = __importDefault(require("./common/httpErrorHandler.middleware"));
var helmet_1 = __importDefault(require("helmet"));
var App = /** @class */ (function () {
    /**
     * @constructor
     * @param controllers
     * @param port
     */
    function App(port) {
        var schema = apollo_server_express_1.makeExecutableSchema({
            typeDefs: neo4j_graphql_js_1.augmentTypeDefs(typeDefs),
            resolverValidationOptions: {
                requireResolversForResolveType: false
            },
            resolvers: resolvers
        });
        // Add auto-generated mutations
        var augmentedSchema = neo4j_graphql_js_1.augmentSchema(schema, {
            query: {
                exclude: ['LogContactPayload']
            }
        });
        var driver = neo4j.driver(process.env.NEO4J_URI || 'bolt://localhost:7687', neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'letmein'), { encrypted: true });
        this.app = express_1.default();
        this.server = new apollo_server_express_1.ApolloServer({
            schema: augmentedSchema,
            // inject the request object into the context to support middleware
            // inject the Neo4j driver instance to handle database call
            context: function (_a) {
                var req = _a.req;
                return ({
                    driver: driver,
                    req: req
                });
            }
        });
        this.port = port;
        this.initializeMiddlewares();
        this.initializeErrorhandling();
    }
    /**
     * @func listen Make the server to listen at specified port.
     */
    App.prototype.listen = function () {
        var _this = this;
        this.app.listen(this.port, function () {
            console.log("server started at http://localhost:" + _this.port + "/graphql");
        });
    };
    /**
     * @func initializeMiddlewares Initializes all the middleware
     */
    App.prototype.initializeMiddlewares = function () {
        this.app.use(body_parser_1.default.json());
        this.app.use(helmet_1.default());
        this.server.applyMiddleware({ app: this.app });
    };
    /**
     * @func initializeErrorhandling Initializes error handling middleware.
     */
    App.prototype.initializeErrorhandling = function () {
        this.app.use(httpErrorHandler_middleware_1.default);
    };
    return App;
}());
exports.default = App;
