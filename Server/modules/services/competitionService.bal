import ballerinax/postgresql;
import ballerina/sql;
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

public type CompetitionCreate record {
    string title;
    string description;
    string organizer_id;
    string start_date;
    string end_date;
    string category;
    string status;
};

public function createCompetitionService(postgresql:Client dbClient, http:CorsConfig corsConfig) returns http:Service {
    return @http:ServiceConfig{cors : corsConfig} isolated service object {

        private final postgresql:Client db = dbClient;

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

    isolated resource function patch [int id](http:RequestContext ctx, @http:Payload CompetitionUpdate updateData) returns json|http:InternalServerError|http:NotFound|http:BadRequest|error {
        // First, check if the competition exists
        sql:ParameterizedQuery checkQuery = `SELECT id FROM competitions WHERE id = ${id}`;
        stream<record {int id;}, sql:Error?> checkResult = self.db->query(checkQuery);
        record {int id;}[]|error existingCompetition = from record {int id;} comp in checkResult select comp;
        
        if existingCompetition is error {
            log:printError("Error checking competition existence", existingCompetition);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if existingCompetition.length() == 0 {
            return http:NOT_FOUND;
        }

        // Check if at least one field is provided for update
        if updateData?.title is () && updateData?.description is () && 
           updateData?.start_date is () && updateData?.end_date is () && 
           updateData?.category is () && updateData?.status is () {
            return http:BAD_REQUEST;
        }
        
        // Execute update using parameterized queries for each field
        sql:ExecutionResult? execResult = ();
        
        if updateData?.title is string {
            sql:ExecutionResult|error result = self.db->execute(`UPDATE competitions SET title = ${updateData?.title}, updated_at = NOW() WHERE id = ${id}`);
            if result is error {
                log:printError("Failed to update competition", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            execResult = result;
        }
        
        if updateData?.description is string {
            sql:ExecutionResult|error result = self.db->execute(`UPDATE competitions SET description = ${updateData?.description}, updated_at = NOW() WHERE id = ${id}`);
            if result is error {
                log:printError("Failed to update competition", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            execResult = result;
        }
        
        if updateData?.start_date is string {
            sql:ExecutionResult|error result = self.db->execute(`UPDATE competitions SET start_date = ${updateData?.start_date}::date, updated_at = NOW() WHERE id = ${id}`);
            if result is error {
                log:printError("Failed to update competition", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            execResult = result;
        }
        
        if updateData?.end_date is string {
            sql:ExecutionResult|error result = self.db->execute(`UPDATE competitions SET end_date = ${updateData?.end_date}::date, updated_at = NOW() WHERE id = ${id}`);
            if result is error {
                log:printError("Failed to update competition", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            execResult = result;
        }
        
        if updateData?.category is string {
            sql:ExecutionResult|error result = self.db->execute(`UPDATE competitions SET category = ${updateData?.category}, updated_at = NOW() WHERE id = ${id}`);
            if result is error {
                log:printError("Failed to update competition", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            execResult = result;
        }
        
        if updateData?.status is string {
            sql:ExecutionResult|error result = self.db->execute(`UPDATE competitions SET status = ${updateData?.status}, updated_at = NOW() WHERE id = ${id}`);
            if result is error {
                log:printError("Failed to update competition", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            execResult = result;
        }
        
        if execResult is () {
            return http:BAD_REQUEST;
        }
        
        if execResult.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }
        
        // Fetch the updated competition
        sql:ParameterizedQuery selectQuery = `SELECT * FROM competitions WHERE id = ${id}`;
        stream<Competition, sql:Error?> updatedCompetitionResult = self.db->query(selectQuery, Competition);
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

    isolated resource function post create(http:RequestContext ctx, @http:Payload CompetitionCreate competitionData) returns json|http:InternalServerError|http:BadRequest|error {
        // Validate required fields
        if competitionData.title.trim() == "" || competitionData.description.trim() == "" || 
           competitionData.organizer_id.trim() == "" || competitionData.start_date.trim() == "" || 
           competitionData.end_date.trim() == "" || competitionData.category.trim() == "" {
            return http:BAD_REQUEST;
        }
        
        // Insert new competition
        sql:ExecutionResult|error result = self.db->execute(`
            INSERT INTO competitions (title, description, organizer_id, start_date, end_date, category, status, created_at, updated_at) 
            VALUES (${competitionData.title}, ${competitionData.description}, ${competitionData.organizer_id}::uuid, 
                    ${competitionData.start_date}::date, ${competitionData.end_date}::date, ${competitionData.category}, 
                    ${competitionData.status}, NOW(), NOW())
        `);
        
        if result is error {
            log:printError("Failed to create competition", result);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        // Get the ID of the newly created competition
        int|string? lastInsertId = result.lastInsertId;
        if lastInsertId is () {
            log:printError("Failed to get last insert ID");
            return http:INTERNAL_SERVER_ERROR;
        }
        
        int competitionId;
        if lastInsertId is int {
            competitionId = lastInsertId;
        } else {
            // Try to parse string to int
            int|error parsedId = int:fromString(lastInsertId.toString());
            if parsedId is error {
                log:printError("Failed to parse last insert ID", parsedId);
                return http:INTERNAL_SERVER_ERROR;
            }
            competitionId = parsedId;
        }
        
        // Fetch the newly created competition
        sql:ParameterizedQuery selectQuery = `SELECT * FROM competitions WHERE id = ${competitionId}`;
        stream<Competition, sql:Error?> newCompetitionResult = self.db->query(selectQuery, Competition);
        Competition[]|error newCompetition = from Competition competition in newCompetitionResult
                                               select competition;
        
        if newCompetition is error {
            log:printError("Failed to fetch created competition", newCompetition);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if newCompetition.length() == 0 {
            log:printError("Created competition not found");
            return http:INTERNAL_SERVER_ERROR;
        }
        
        return {
            "competition": newCompetition[0],
            "message": "Competition created successfully",
            "timestamp": time:utcNow()
        }.toJson();
    }

    isolated resource function delete [int id](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {
        // Check if the competition exists
        sql:ParameterizedQuery checkQuery = `SELECT id FROM competitions WHERE id = ${id}`;
        stream<record {int id;}, sql:Error?> checkResult = self.db->query(checkQuery);
        record {int id;}[]|error existingCompetition = from record {int id;} comp in checkResult select comp;
        
        if existingCompetition is error {
            log:printError("Error checking competition existence", existingCompetition);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if existingCompetition.length() == 0 {
            return http:NOT_FOUND;
        }
        
        // Delete the competition
        sql:ExecutionResult|error result = self.db->execute(`DELETE FROM competitions WHERE id = ${id}`);
        
        if result is error {
            log:printError("Failed to delete competition", result);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if result.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }
        
        return {
            "message": "Competition deleted successfully",
            "timestamp": time:utcNow()
        }.toJson();
    }

};
}