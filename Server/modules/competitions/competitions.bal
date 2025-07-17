import ballerinax/postgresql;
import ballerina/sql;
import competition_service.db;

public isolated function getCompetitions() returns stream<Competition, sql:Error?>|error {
    postgresql:Client db = check db:getDbClient();
    sql:ParameterizedQuery query = `SELECT * FROM competitions`;
    stream<Competition, sql:Error?> result = db->query(query, Competition);
    return result;
}