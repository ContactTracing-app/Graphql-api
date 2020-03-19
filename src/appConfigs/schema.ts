const gql = String.raw;

export const typeDefs = gql`
  input ContactWithInput {
    when: String!
    tMinus: Int!
  }

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
    contactWith(input: ContactWithInput!): [Contact]!
      @cypher(
        statement: """
        WITH date($input.when) - duration({days: $input.tMinus}) AS tMinus7d
        MATCH p=(this)-[:ON_DAY]->(d:PersonDay)-[:HAD_CONTACT]->(c:Contact)
        WHERE d.date > tMinus7d
        RETURN c
        """
      )
  }

  type Contact {
    _id: ID!
    date: Date!
  }

  input UpdatePersonInput {
    uid: ID!
    isInfected: Boolean!
  }

  input LogContactInput {
    fromUid: ID!
    toUid: ID!
    yyyy: String!
    mm: String!
    dd: String!
  }

  type LogEntry {
    id: ID!
    date: DateTime!
    contact: [Contact]! @relation(name: "HAD_CONTACT", direction: "OUT")
  }

  input CreatePersonInput {
    uid: ID!
  }

  type Mutation {
    CreatePerson(input: CreatePersonInput!): Person
      @cypher(
        statement: """
        CREATE (p:Person {uid: $input.uid})-[:HAS_CONTACT_LOG]->(listHead:Log { id: $input.uid })
        RETURN p
        """
      )

    logContact(input: LogContactInput!): LogEntry!
      @cypher(
        statement: """
        WITH apoc.text.join([$input.yyyy, $input.mm, $input.dd], '-') AS dateFormat
        WITH date(dateFormat) AS logDate, dateFormat
        WITH apoc.text.join([$input.fromUid, dateFormat], '_') AS fromDayId, logDate, dateFormat
        WITH apoc.text.join([$input.toUid, dateFormat], '_') AS toDayId, fromDayId, logDate, dateFormat
        MERGE (fromLe:LogEntry { id: fromDayId })
        MERGE (toLe:LogEntry { id: toDayId })
        MERGE (fromLe)-[:HAD_CONTACT]->(c:Contact { date: logDate })<-[:HAD_CONTACT]-(toLe)

        MATCH ()
        return fromLe
        """
      )
  }
`;

export const resolvers = {
  // root entry point to GraphQL service
};

/*
// Update the Chain

        // MATCH p = (lh:ContactLog {id: $input.fromUid})-[:PREV_LOG_ENTRY*]->(prevFromLogEntries)
        WHERE NONE (le IN nodes(p) WHERE COALESCE(tx.date, datetime()) <= logDate)




        # WITH fromDay, toDayId, logDate, dateFormat
        # MERGE (toDay:PersonDay { id: toDayId, date: logDate })
        # MERGE (to:Person {uid: $input.toUid})
        # MERGE (toDay)<-[:ON_DAY]-(to)
        # WITH apoc.text.join([dateFormat, $input.fromUid, $input.toUid], '_') AS contactId, fromDay, toDay, logDate
        # MERGE (fromDay)-[:HAD_CONTACT]->(c:Contact {id: contactId, date: logDate })<-[:HAD_CONTACT]-(toDay)
        # RETURN c

        */
