const gql = String.raw;

export const typeDefs = gql`
  type Person {
    _id: ID!
    uid: ID!
    isInfected: Boolean!
      @cypher(
        statement: """
        RETURN apoc.label.exists(this, 'InfectedPerson')
        """
      )
    isInQuarantine: Boolean!
      @cypher(
        statement: """
        RETURN apoc.label.exists(this, 'QuarantinedPerson')
        """
      )
    connectsTo: [Person] @relation(name: "CONNECTS_TO", direction: "OUT")
    # test(input: LogContactInput): String!
    #   @cypher(
    #     statement: """
    #     WITH $input.yyyy + '-' + $input.mm + '-' + $input.dd AS dateFormat
    #     WITH date(dateFormat) AS logDate, dateFormat
    #     RETURN dateFormat
    #     """
    #   )
  }

  type Contact {
    id: ID!
    date: Date!
  }

  input LogContactInput {
    fromUid: ID!
    toUid: ID!
    yyyy: String!
    mm: String!
    dd: String!
  }

  input UpdatePersonInput {
    uid: ID!
    isInfected: Boolean!
  }

  type Mutation {
    logContact(input: LogContactInput): Contact
      @cypher(
        statement: """
        WITH apoc.text.join([$input.yyyy, $input.mm, $input.dd], '-') AS dateFormat
        WITH date(dateFormat) AS logDate, dateFormat
        WITH apoc.text.join([$input.fromUid, dateFormat], '-') AS fromDayId, dateFormat, logDate
        WITH apoc.text.join([$input.toUid, dateFormat], '-') AS toDayId, fromDayId, logDate, dateFormat
        MERGE (fromDay:PersonDay { id: fromDayId, date: logDate })
        MERGE (from:Person {uid: $input.fromUid})
        MERGE (fromDay)<-[:ON_DAY]-(from)
        WITH fromDay, toDayId, logDate, dateFormat
        MERGE (toDay:PersonDay { id: toDayId, date: logDate })
        MERGE (to:Person {uid: $input.toUid})
        MERGE (toDay)<-[:ON_DAY]-(to)
        WITH apoc.text.join([dateFormat, $input.fromUid, $input.toUid], '_') AS contactId, fromDay, toDay, logDate
        MERGE (fromDay)-[:HAD_CONTACT]->(c:Contact {id: contactId, date: logDate })<-[:HAD_CONTACT]-(toDay)
        RETURN c
        """
      )
  }
`;

export const resolvers = {
  // root entry point to GraphQL service
};
