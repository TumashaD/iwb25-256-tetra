import ballerinax/postgresql;
import ballerina/sql;
import ballerina/http;
import ballerina/log;
import ballerina/time;
import vinnova.supbase;

public type Competition record {
    int id;
    string title;
    string description;
    string organizer_id;
    string start_date;
    string end_date;
    string category;
    string status;
    string created_at;
    string updated_at;
};

public function createCompetitionService(postgresql:Client dbClient,supbase:StorageClient storageClient, http:CorsConfig corsConfig) returns http:Service {
    return @http:ServiceConfig{cors : corsConfig} isolated service object {
        private final postgresql:Client db = dbClient;
        private final supbase:StorageClient storage = storageClient;
        private final string bucketName = "competitions";

    isolated resource function get .(http:RequestContext ctx) returns json|http:InternalServerError|error {
            sql:ParameterizedQuery query = `SELECT * FROM competitions`;
            stream<Competition, sql:Error?> competitionsResult = self.db->query(query, Competition);
        Competition[]|error competitions = from Competition competition in competitionsResult
                                              select competition;
        if competitions is error {
            log:printError("Failed to process competitions", competitions);
            return http:INTERNAL_SERVER_ERROR;
        }
        return {
            "competitions": competitions,
            "timestamp": time:utcNow()
        }.toJson();
    }

    isolated resource function get [int id](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {
        sql:ParameterizedQuery query = `SELECT * FROM competitions WHERE id = ${id}`;
        stream<Competition, sql:Error?> competitionResult = self.db->query(query, Competition);
        Competition[]|error competitionArr = from Competition competition in competitionResult
                                             select competition;
        
        if competitionArr is error {
            log:printError("Failed to fetch competition", competitionArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if competitionArr.length() == 0 {
            return http:NOT_FOUND;
        }
        
        return {
            "competition": competitionArr[0],
            "timestamp": time:utcNow()
        }.toJson();
    }
    };
}