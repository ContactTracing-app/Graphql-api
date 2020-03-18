// Type definitions for neo4j-graphql-js 2.0
// Project: https://github.com/neo4j-graphql/neo4j-graphql-js#readme
// Definitions by: Gavin Williams <https://github.com/gavinwilliams>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module 'neo4j-graphql-js' {
  export function augmentSchema(schema: any, config: any): any;

  export function augmentTypeDefs(typeDefs: any): any;

  export function cypherMutation(
    _ref7: any,
    context: any,
    resolveInfo: any,
    ...args: any[]
  ): any;

  export function cypherQuery(
    _ref2: any,
    context: any,
    resolveInfo: any,
    ...args: any[]
  ): any;

  export function makeAugmentedSchema(_ref8: any): any;

  export function neo4jgraphql(
    _x2: any,
    _x3: any,
    _x4: any,
    _x5: any,
    ...args: any[]
  ): any;

  export namespace augmentSchema {
    const prototype: {};
  }

  export namespace augmentTypeDefs {
    const prototype: {};
  }

  export namespace cypherMutation {
    const prototype: {};
  }

  export namespace cypherQuery {
    const prototype: {};
  }

  export namespace makeAugmentedSchema {
    const prototype: {};
  }

  export namespace neo4jgraphql {
    const prototype: {};
  }
}
