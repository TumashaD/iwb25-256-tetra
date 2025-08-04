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

public type CompetitionUpdate record {
    string? title?;
    string? description?;
    string? start_date?;
    string? end_date?;
    string? category?;
    string? status?;
};


public http:Service competitionService = @http:ServiceConfig{cors : auth:CORS_CONFIG} isolated service object {
    // public function createInterceptors() returns http:Interceptor {
    //     return auth:AUTH_INTERCEPTOR;
    // }

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

    isolated resource function patch [int id](http:RequestContext ctx, CompetitionUpdate updateData) returns json|http:InternalServerError|http:NotFound|http:BadRequest|error {
        postgresql:Client db = check db:getDbClient();
        
        // First, check if the competition exists
        sql:ParameterizedQuery checkQuery = `SELECT id FROM competitions WHERE id = ${id}`;
        stream<record {int id;}, sql:Error?> checkResult = db->query(checkQuery);
        record {int id;}[]|error existingCompetition = from record {int id;} comp in checkResult select comp;
        
        if existingCompetition is error {
            log:printError("Error checking competition existence", existingCompetition);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if existingCompetition.length() == 0 {
            return http:NOT_FOUND;
        }

        // Build a single UPDATE query with all fields to update
        boolean hasUpdate = false;
        
        if updateData?.title is string {
            hasUpdate = true;
        }
        
        if updateData?.description is string {
            hasUpdate = true;
        }
        
        if updateData?.start_date is string {
            hasUpdate = true;
        }
        
        if updateData?.end_date is string {
            hasUpdate = true;
        }
        
        if updateData?.category is string {
            hasUpdate = true;
        }
        
        if updateData?.status is string {
            hasUpdate = true;
        }
        
        if !hasUpdate {
            return http:BAD_REQUEST;
        }
        
        // Execute the update using individual field updates to avoid SQL injection
        sql:ExecutionResult? updateResult = ();
        
        if updateData?.title is string {
            sql:ExecutionResult|error titleResult = db->execute(`UPDATE competitions SET title = ${updateData?.title}, updated_at = NOW() WHERE id = ${id}`);
            if titleResult is error {
                log:printError("Failed to update competition", titleResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            updateResult = titleResult;
        }
        
        if updateData?.description is string {
            sql:ExecutionResult|error descResult = db->execute(`UPDATE competitions SET description = ${updateData?.description}, updated_at = NOW() WHERE id = ${id}`);
            if descResult is error {
                log:printError("Failed to update competition", descResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            updateResult = descResult;
        }
        
        if updateData?.start_date is string {
            sql:ExecutionResult|error startResult = db->execute(`UPDATE competitions SET start_date = ${updateData?.start_date}, updated_at = NOW() WHERE id = ${id}`);
            if startResult is error {
                log:printError("Failed to update competition", startResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            updateResult = startResult;
        }
        
        if updateData?.end_date is string {
            sql:ExecutionResult|error endResult = db->execute(`UPDATE competitions SET end_date = ${updateData?.end_date}, updated_at = NOW() WHERE id = ${id}`);
            if endResult is error {
                log:printError("Failed to update competition", endResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            updateResult = endResult;
        }
        
        if updateData?.category is string {
            sql:ExecutionResult|error categoryResult = db->execute(`UPDATE competitions SET category = ${updateData?.category}, updated_at = NOW() WHERE id = ${id}`);
            if categoryResult is error {
                log:printError("Failed to update competition", categoryResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            updateResult = categoryResult;
        }
        
        if updateData?.status is string {
            sql:ExecutionResult|error statusResult = db->execute(`UPDATE competitions SET status = ${updateData?.status}, updated_at = NOW() WHERE id = ${id}`);
            if statusResult is error {
                log:printError("Failed to update competition", statusResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            updateResult = statusResult;
        }
        
        if updateResult is () {
            return http:BAD_REQUEST;
        }
        
        if updateResult.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }
        
        // Fetch and return the updated competition
        sql:ParameterizedQuery selectQuery = `SELECT * FROM competitions WHERE id = ${id}`;
        stream<Competition, sql:Error?> updatedCompetitionResult = db->query(selectQuery, Competition);
        Competition[]|error updatedCompetition = from Competition competition in updatedCompetitionResult
                                                   select competition;
        
        if updatedCompetition is error {
            log:printError("Failed to fetch updated competition", updatedCompetition);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if updatedCompetition.length() == 0 {
            return http:NOT_FOUND;
        }
        
        return {
            "competition": updatedCompetition[0],
            "message": "Competition updated successfully",
            "timestamp": time:utcNow()
        }.toJson();
    }
};