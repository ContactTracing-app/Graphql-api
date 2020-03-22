import e = require("express");
import { Integer } from "neo4j-driver";

const gql = String.raw;

export const typeDefs = gql`
  input CreatePersonInput {
    uid: ID!
  }

  input PersonVisibilityInput {
    uid: ID!
  }

  input CreateKnowsInput {
    fromUid: ID!
    toUid: ID!
  }

  type ContactWith {
    uid: ID!
    met_on: String!
    risk: String!
  }

  type ContactWithList {
    metfriendon: String!
    friend: ID!
    friendsfriend: ID!
    date: DateTime!
    risk: String!
  }

  input LogContactInput {
    fromUid: ID!
    toUid: ID!
    yyyy: String!
    mm: String!
    dd: String!
  }

  type Person {
    _id: ID!
    uid: ID!
    isInfected: Boolean!
    isInQuarantine: Boolean!
    knows: [Person]
      @cypher(
        statement: """
        MATCH (this)-[:KNOWS]-(p:Person)
        RETURN p
        """
      )
    logEntries: [LogEntry]!
      @cypher(
        statement: """
        WITH apoc.text.join(['log', this.uid], '_') AS logId
        MATCH (log:Log {id: logId})-[r]-(e:LogEntry)
        WHERE TYPE(r) STARTS WITH 'HAS_ENTRY_ON'
        RETURN e
        """
      )
    recentContactWith: [ContactWithList]
      @cypher(
        statement: """
        WITH apoc.text.join(['log', this.uid], '_') AS logId
        WITH date() - duration('P14D') AS since, logId
        MATCH (log:Log {id: logId})-[r1]->(entry:LogEntry)-[:MADE_CONTACT_WITH]-(otherEntry:LogEntry)<-[r2]-(otherLog:Log)<-[:HAS_CONTACT_LOG]-(p:Person)
        WHERE entry.date > since
          AND TYPE(r1) STARTS WITH 'HAS_ENTRY_ON'
          AND TYPE(r2) STARTS WITH 'HAS_ENTRY_ON'
          WITH collect([p,otherEntry]) AS affectedPeople, log As user
            UNWIND affectedPeople as aP
              WITH apoc.text.join(['log', aP[0].uid], '_') AS flogId, aP, user, aP[1].date AS newdate
                  MATCH (flog:Log {id: flogId})-[r1]->(entry:LogEntry)-[ufm:MADE_CONTACT_WITH]-(otherEntry:LogEntry)<-[r2]-(otherLog:Log)<-[:HAS_CONTACT_LOG]-(p:Person)
                  WHERE entry.date > newdate
                  AND TYPE(r1) STARTS WITH 'HAS_ENTRY_ON'
                  AND TYPE(r2) STARTS WITH 'HAS_ENTRY_ON'
                  RETURN {
                    metfriendon: newdate,
                    friend: aP[0].uid,
                    friendsfriend: p.uid,
                    date: otherEntry.date, 
                    risk: \"low\"
                  }
          ORDER BY otherEntry.date DESC
        """
      )
    recentDirectContacts: [ContactWith]
      @cypher(
          statement: """
          WITH apoc.text.join(['log', this.uid], '_') AS logId
          WITH date() - duration('P14D') AS since, logId
          MATCH (log:Log {id: logId})-[r1]->(entry:LogEntry)-[:MADE_CONTACT_WITH]-(otherEntry:LogEntry)<-[r2]-(otherLog:Log)<-[:HAS_CONTACT_LOG]-(p:Person)
          WHERE entry.date > since
            AND TYPE(r1) STARTS WITH 'HAS_ENTRY_ON'
            AND TYPE(r2) STARTS WITH 'HAS_ENTRY_ON'
                RETURN {
                  uid: p.uid,
                  met_on: entry.date,
                  risk: \"high\"
                }
            ORDER BY otherEntry.date DESC
          """
        )
      recentIndirectContacts: [ContactWith]
        @cypher(
          statement: """
            WITH apoc.text.join(['log', this.uid], '_') AS logId
            WITH date() - duration('P14D') AS since, logId
            MATCH (log:Log {id: logId})-[r1]->(entry:LogEntry)-[:MADE_CONTACT_WITH]-(otherEntry:LogEntry)<-[r2]-(otherLog:Log)<-[:HAS_CONTACT_LOG]-(p:Person)
            WHERE entry.date > since
              AND TYPE(r1) STARTS WITH 'HAS_ENTRY_ON'
              AND TYPE(r2) STARTS WITH 'HAS_ENTRY_ON'
              WITH collect([p,otherEntry]) AS affectedPeople, log As user
                UNWIND affectedPeople as aP
                  WITH apoc.text.join(['log', aP[0].uid], '_') AS flogId, aP, user, aP[1].date AS newdate
                      MATCH (flog:Log {id: flogId})-[r1]->(entry:LogEntry)-[ufm:MADE_CONTACT_WITH]-(otherEntry:LogEntry)<-[r2]-(otherLog:Log)<-[:HAS_CONTACT_LOG]-(p:Person)
                      WHERE entry.date > newdate
                      AND TYPE(r1) STARTS WITH 'HAS_ENTRY_ON'
                      AND TYPE(r2) STARTS WITH 'HAS_ENTRY_ON'
                  RETURN {
                    uid: p.uid,
                    met_on: otherEntry.date,
                    risk: \"low\"
                  }
              ORDER BY otherEntry.date DESC
            """
          )
  }

  type LogEntry {
    id: ID!
    date: DateTime!
    contactWith: [Person]!
      @cypher(
        statement: """
        MATCH (this)-[:MADE_CONTACT_WITH]-(e:LogEntry)<-[r]-(:Log)<-[:HAS_CONTACT_LOG]-(p:Person)
        WHERE TYPE(r) STARTS WITH 'HAS_ENTRY_ON'
        RETURN p
        """
      )
  }

  type Mutation {
    CreateKnows(input: CreateKnowsInput!): Person
      @cypher(
        statement: """
        WITH [$input.fromUid, $input.toUid] AS ids
        UNWIND ids AS personId
        WITH personId ORDER BY personId
        WITH COLLECT(personId) AS sorted_ids
        MATCH (a:Person { uid: sorted_ids[0] })
        MATCH (b:Person { uid: sorted_ids[1] })
        MERGE (a)-[:KNOWS]->(b)
        RETURN a
        """
      )

    HidePerson(input: PersonVisibilityInput!): Person
      @cypher(
        statement: """
        MATCH (n:Person { uid: $input.uid })
        CALL apoc.create.addLabels(r, ['PersonHidden']) YIELD node
        CALL apoc.create.removeLabels(n, ['Person']) YIELD node AS r
        RETURN node
        """
      )

    ShowPerson(input: PersonVisibilityInput!): Person
      @cypher(
        statement: """
        MATCH (n:Person { uid: $input.uid })
        CALL apoc.create.addLabels(r, ['Person']) YIELD node
        CALL apoc.create.removeLabels(n, ['PersonHidden']) YIELD node AS r
        RETURN node
        """
      )

    CreatePerson(input: CreatePersonInput!): Person
      @cypher(
        statement: """
        WITH date() AS now
        WITH apoc.temporal.format(now, 'YYYY-MM-dd') AS dateFormat, now
        WITH apoc.text.join(['log', $input.uid], '_') AS logId, dateFormat, now
        CREATE (p:Person { uid: $input.uid })-[:HAS_CONTACT_LOG]->(log:Log { id: logId })
        SET p.isInfected = false, p.isInQuarantine = false, log.createdAt = now, log.updatedAt = now
        RETURN p
        """
      )

    UnlogContact(input: LogContactInput!): LogEntry
      @cypher(
        statement: """
        WITH apoc.text.join([$input.yyyy, $input.mm, $input.dd], '-') AS dateFormat
        WITH date(dateFormat) AS logDate, dateFormat

        WITH apoc.text.join(['entry', $input.fromUid, dateFormat], '_') AS fromEntryId, logDate, dateFormat
        WITH apoc.text.join(['entry', $input.toUid, dateFormat], '_') AS toEntryId, fromEntryId, logDate, dateFormat

        MATCH (fromEntry:LogEntry {id: fromEntryId})-[c:MADE_CONTACT_WITH]-(toEntry:LogEntry {id: toEntryId})
        DELETE c

        RETURN fromEntry
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
        MERGE (p1)-[:KNOWS]->(p2)

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

        MERGE (fromEntry)-[:MADE_CONTACT_WITH]->(toEntry)

        // End
        RETURN fromEntry
        """
      )
  }
`;

export const resolvers = {
  // root entry point to GraphQL service
  Person: {
    recentDirectContacts(obj, params, ctx, resolveInfo) {
        let rcw = obj.recentDirectContacts;
        let returnList: {[id: string]: string}[] = [];
        var meetingDates: { [id: string] : string; } = {};
        var meetingCount: { [id: string] : number; } = {};
        let countedFriends: String[] = [];
        if (rcw) {
          rcw.forEach(element => {
            let friend: String = element.uid.toString();
            try {
              let eDate = element.met_on["year"]+"-" + element.met_on["month"]+"-"+element.met_on["day"];
              if (countedFriends.includes(friend) == false) {
                meetingCount[friend.toString()] = parseInt("1");
                meetingDates[friend.toString()] = eDate;
                (countedFriends).push(friend);
              } else {
                meetingCount[friend.toString()] += 1;
                meetingDates[friend.toString()] += "," + eDate;
              }
            } catch (error) {
              let eDate = "";
              if (countedFriends.includes(friend) == false) {
                meetingCount[friend.toString()] = parseInt("1");
                (countedFriends).push(friend);
              } else {
                meetingCount[friend.toString()] += 1;
              }
            } finally {

            }
          });
        }
        countedFriends.forEach(element => {
          if (meetingCount[element.toString()] > 1) {
            (returnList).push({
              uid: element.toString(),
              risk: "very high",
              met_on: meetingDates[element.toString()]
            });
          } else {
            (returnList).push({
              uid: element.toString(),
              risk: "high",
              met_on: meetingDates[element.toString()]
            });
          }
        });
        return returnList;
    },
    recentIndirectContacts(obj, params, ctx, resolveInfo) {
      let rcw = obj.recentDirectContacts;
      let returnList: {[id: string]: string}[] = [];
      var meetingDates: { [id: string] : string; } = {};
      var meetingCount: { [id: string] : number; } = {};
      let countedFriends: String[] = [];
      if (rcw) {
        rcw.forEach(element => {
          let friend: String = element.uid.toString();
          try {
            let eDate = element.met_on["year"]+"-" + element.met_on["month"]+"-"+element.met_on["day"];
            if (countedFriends.includes(friend) == false) {
              meetingCount[friend.toString()] = parseInt("1");
              meetingDates[friend.toString()] = eDate;
              (countedFriends).push(friend);
            } else {
              meetingCount[friend.toString()] += 1;
              meetingDates[friend.toString()] += "," + eDate;
            }
          } catch (error) {
            let eDate = "";
            if (countedFriends.includes(friend) == false) {
              meetingCount[friend.toString()] = parseInt("1");
              (countedFriends).push(friend);
            } else {
              meetingCount[friend.toString()] += 1;
            }
          } finally {

          }
        });
      }
      countedFriends.forEach(element => {
        if (meetingCount[element.toString()] > 1) {
          (returnList).push({
            uid: element.toString(),
            risk: "high",
            met_on: meetingDates[element.toString()]
          });
        } else {
          (returnList).push({
            uid: element.toString(),
            risk: "low",
            met_on: meetingDates[element.toString()]
          });
        }
      });
      return returnList;
    },
    recentContactWith(obj, params, ctx, resolveInfo) {
      let rcw = obj.recentContactWith;
      let returnList = [];
      var compObj: { [id: string] : number; } = {};
      let directcontact = {
        uid: "none",
        risk: "high"
      };
      let indirectContact = {
        uid: "none",
        risk: "low"
      }
      let directfriends_highrisk: String[] = [];
      let directfriends_lowrisk: String[] = [];
      let directfriends: String[] = [];
      let indirectfriends: String[] = [];
      let first: string = "1"
      if (rcw) {
        rcw.forEach(element => {
          let friend: String = element.friend + "-" + element.metfriendon;
          if (directfriends.includes(friend) == false) {
            compObj[friend.toString()] = parseInt(first);
            (directfriends as any).push(friend);
          } else {
            compObj[friend.toString()] = parseInt(first) + 1;
          }
        });
      }
      // console.log(directfriends);
      // console.log(compObj);
      return rcw;
    }
  }
};

