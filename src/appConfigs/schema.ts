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
        WITH apoc.text.join(['log', $input.uid], '_') AS fromLogId
        CREATE (p:Person {uid: $input.uid})-[:HAS_CONTACT_LOG]->(listHead:Log { id: fromLogId })
        RETURN p
        """
      )

    LogContact(input: LogContactInput!): LogEntry
      @cypher(
        statement: """
        // Globals
        WITH apoc.text.join([$input.yyyy, $input.mm, $input.dd], '-') AS dateFormat
        WITH date(dateFormat) AS logDate, dateFormat

        // Logs
        WITH apoc.text.join(['log', $input.fromUid], '_') AS fromLogId, logDate, dateFormat
        WITH apoc.text.join(['log', $input.toUid], '_') AS toLogId, fromLogId, logDate, dateFormat
        MATCH (fromLog:Log {id: fromLogId})
        MATCH (toLog:Log {id: toLogId})

        // Entries
        WITH apoc.text.join(['entry', $input.fromUid, dateFormat], '_') AS fromEntryId, fromLog, toLog, logDate, dateFormat
        WITH apoc.text.join(['entry', $input.toUid, dateFormat], '_') AS toEntryId, fromEntryId, fromLog, toLog, logDate
        MERGE (fromEntry {id: fromEntryId, date: logDate})
        MERGE (toEntry {id: toEntryId, date: logDate})

        // Lock
        WITH fromLog, toLog, fromEntry, toEntry
        CALL apoc.lock.nodes([fromLog, toLog, fromEntry, toEntry])

        // From Chain
        MATCH (fromLog)-[:PREV_ENTRY*]->(fromE1)-[oldLinkFrom:PREV_ENTRY]->(fromE2:LogEntry)
        WHERE fromE2.date < fromEntry.date
        MERGE (fromE1)-[:PREV_ENTRY]->(fromEntry)
        MERGE (fromEntry)-[:PREV_ENTRY]->(fromE2)
        DELETE oldLinkFrom

        WITH toLog, toEntry, fromEntry

        // To Chain
        MATCH (toLog)-[:PREV_ENTRY*]->(toE1)-[oldLinkTo:PREV_ENTRY]->(toE2:LogEntry)
        WHERE toE2.date < toEntry.date
        MERGE (toE1)-[:PREV_ENTRY]->(toEntry)
        MERGE (toEntry)-[:PREV_ENTRY]->(toE2)
        DELETE oldLinkTo

        // Contact
        MERGE (fromEntry)-[:HAD_CONTACT]->(c:Contact)<-[:HAD_CONTACT]-(toEntry)

        // End
        RETURN fromEntry
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
