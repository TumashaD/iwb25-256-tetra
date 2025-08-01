import ballerinax/postgresql;
import ballerina/sql;
import vinnova.db;
import vinnova.auth;
import ballerina/http;
import ballerina/log;
import ballerina/time;

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


public http:InterceptableService competitionService = @http:ServiceConfig{cors : auth:CORS_CONFIG} isolated service object {
    public function createInterceptors() returns http:Interceptor {
        return auth:AUTH_INTERCEPTOR;
    }

    isolated resource function get .(http:RequestContext ctx) returns json|http:InternalServerError|error {
        postgresql:Client db = check db:getDbClient();
        sql:ParameterizedQuery query = `SELECT * FROM competitions`;
        stream<Competition, sql:Error?> competitionsResult = db->query(query, Competition);
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
};