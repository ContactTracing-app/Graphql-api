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
    connections: [Person]
      @cypher(
        statement: """
        MATCH (this)-[:KNOWS]-(p:Person)
        RETURN p
        """
      )
    logEntries: [LogEntry]!
      @cypher(
        statement: """
        WITH apoc.text.join(['log', 'michele'], '_') AS logId
        MATCH (log:Log {id: logId})-[r]-(e:LogEntry)
        WHERE TYPE(r) STARTS WITH 'HAS_ENTRY_ON'
        RETURN e
        """
      )
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
  }

  input CreatePersonInput {
    uid: ID!
  }

  type Mutation {
    CreatePerson(input: CreatePersonInput!): Person
      @cypher(
        statement: """
        WITH date() AS now
        WITH apoc.temporal.format(now, 'YYYY-MM-dd') AS dateFormat, now
        WITH apoc.text.join(['log', $input.uid], '_') AS logId, dateFormat, now
        CREATE (p:Person {uid: $input.uid})-[:HAS_CONTACT_LOG]->(log:Log { id: logId })
        SET log.createdAt = now, log.updatedAt = now
        RETURN p
        """
      )

    LogContact(input: LogContactInput!): LogEntry
      @cypher(
        statement: """
        // Globals
        WITH apoc.text.join([$input.yyyy, $input.mm, $input.dd], '-') AS dateFormat
        WITH date(dateFormat) AS logDate, dateFormat

        // Higher
        MATCH (p1:Person {uid: $input.fromUid})
        MATCH (p2:Person {uid: $input.toUid})
        MERGE (p1)-[:KNOWS]-(p2)

        // Logs
        WITH apoc.text.join(['log', $input.fromUid], '_') AS fromLogId, logDate, dateFormat
        WITH apoc.text.join(['log', $input.toUid], '_') AS toLogId, fromLogId, logDate, dateFormat

        MATCH (fromLog:Log {id: fromLogId})
        SET fromLog.updatedAt = logDate
        WITH toLogId, fromLog, logDate, dateFormat

        MATCH (toLog:Log {id: toLogId})
        SET toLog.updatedAt = logDate
        WITH fromLog, toLog, logDate, dateFormat


        // Entries
        WITH apoc.text.join(['entry', $input.fromUid, dateFormat], '_') AS fromEntryId, fromLog, toLog, logDate, dateFormat
        WITH apoc.text.join(['entry', $input.toUid, dateFormat], '_') AS toEntryId, fromEntryId, fromLog, toLog, logDate, dateFormat

        MERGE (fromEntry:LogEntry {id: fromEntryId})
        ON CREATE SET fromEntry.date = logDate
        WITH fromEntry, toEntryId, fromLog, toLog, logDate, dateFormat

        MERGE (toEntry:LogEntry {id: toEntryId})
        ON CREATE SET toEntry.date = logDate
        WITH toEntry, fromEntry, fromLog, toLog, logDate, dateFormat

        // Lock
        WITH fromLog, toLog, fromEntry, toEntry, dateFormat
        CALL apoc.lock.nodes([fromLog, toLog, fromEntry, toEntry])
        WITH apoc.text.join(['HAS_ENTRY_ON', dateFormat], '_') AS relEntry, fromLog, toLog, fromEntry, toEntry, dateFormat

        CALL apoc.merge.relationship(fromLog, relEntry, NULL, NULL, fromEntry) YIELD rel AS relFrom
        CALL apoc.merge.relationship(toLog, relEntry, NULL, NULL, toEntry) YIELD rel AS relTo

        MERGE (fromEntry)-[:MADE_CONTACT_WITH]-(toEntry)

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
        MERGE (fromEntry:LogEntry {id: fromEntryId, date: logDate})
        MERGE (toEntry:LogEntry {id: toEntryId, date: logDate})

        // Lock
        WITH fromLog, toLog, fromEntry, toEntry
        CALL apoc.lock.nodes([fromLog, toLog, fromEntry, toEntry])

        // From Chain
        MATCH (fromLog)-[:PREV_ENTRY*0..]->(e:LogEntry)
        WHERE e.date > fromEntry.date
        WITH apoc.agg.last(e) AS cutStart, fromEntry, toLog, toEntry
        OPTIONAL MATCH (cutStart:LogEntry)-[link:PREV_ENTRY]->(cutEnd:LogEntry)
        WHERE cutEnd.id <> fromEntry.id
        FOREACH(ignoreMe IN CASE WHEN cutEnd IS NOT NULL THEN [1] ELSE [] END |
            MERGE (fromEntry)-[:PREV_ENTRY]->(cutEnd)
        )
        WITH link, fromEntry, toLog, toEntry
        CALL apoc.refactor.to(link, fromEntry) YIELD input

        // To Chain
        MATCH (toLog)-[:PREV_ENTRY*0..]->(e:LogEntry)
        WHERE e.date > toEntry.date
        WITH apoc.agg.last(e) AS cutStart, toEntry, fromEntry
        OPTIONAL MATCH (cutStart:LogEntry)-[link:PREV_ENTRY]->(cutEnd:LogEntry)
        WHERE cutEnd.id <> toEntry.id
        FOREACH(ignoreMe IN CASE WHEN cutEnd IS NOT NULL THEN [1] ELSE [] END |
            MERGE (toEntry)-[:PREV_ENTRY]->(cutEnd)
        )
        WITH link, toEntry, fromEntry
        CALL apoc.refactor.to(link, toEntry) YIELD input AS toInput

        // Contact
        MERGE (fromEntry)-[:HAD_CONTACT]->(c:Contact)<-[:HAD_CONTACT]-(toEntry)

        // End
        RETURN fromEntry        */
