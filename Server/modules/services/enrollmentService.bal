import ballerinax/postgresql;
import ballerina/sql;
import ballerina/http;
import ballerina/log;
import vinnova.auth;

public type Enrollment record {
    int enrollment_id;
    int competition_id;
    int team_id;
    string status;
    string? created_at?;
};

public type EnrollmentWithDetails record {
    *Enrollment;
    string team_name?;
    string competition_title?;
    string competition_status?;
    string competition_start_date?;
    string competition_end_date?;
};

public function createEnrollmentService(postgresql:Client dbClient, http:CorsConfig corsConfig, auth:AuthInterceptor authInterceptor) returns http:InterceptableService {
    return @http:ServiceConfig{cors : corsConfig} isolated service object {

    public function createInterceptors() returns http:Interceptor {
        return authInterceptor;
    }

    private final postgresql:Client db = dbClient;

    isolated resource function post create/[string userId](@http:Payload json enrollmentData) returns Enrollment|http:InternalServerError|http:BadRequest|http:Forbidden|http:Unauthorized|error {
        // Extract and validate required fields from JSON
        json|error competitionIdJson = enrollmentData.competition_id;
        json|error teamIdJson = enrollmentData.team_id;
        json|error statusJson = enrollmentData.status;

        if competitionIdJson is error || teamIdJson is error || statusJson is error {
            log:printError("Missing required fields in request payload");
            return http:BAD_REQUEST;
        }

        // Cast JSON values to appropriate types
        int|error competitionid = int:fromString(competitionIdJson.toString());
        int|error teamid = int:fromString(teamIdJson.toString());
        string status = statusJson.toString();

        if competitionid is error || teamid is error {
            log:printError("Invalid competition_id or team_id value - must be a number");
            return http:BAD_REQUEST;
        }

        if status.trim() == "" {
            return http:BAD_REQUEST;
        }

        // Check if current user is a team leader (either creator or has leader role in team_members)
        sql:ParameterizedQuery leadershipQuery = `
            SELECT COUNT(*) as count FROM (
                SELECT 1 FROM teams WHERE id = ${teamid} AND created_by = ${userId}::uuid
                UNION
                SELECT 1 FROM team_members WHERE team_id = ${teamid} AND member_id = ${userId}::uuid AND role = 'leader'
            ) AS leadership_check
        `;
        stream<record{int count;}, sql:Error?> leadershipResult = self.db->query(leadershipQuery);
        record {int count;}[]|error leadershipArr = from record{int count;} c in leadershipResult select c;

        if leadershipArr is error {
            log:printError("Failed to check team leadership", leadershipArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        if leadershipArr.length() == 0 || leadershipArr[0].count == 0 {
            log:printError("User is not a team leader", currentUser = userId, teamId = teamid);
            return http:FORBIDDEN;
        }

        // Check if team is already enrolled in this competition
        sql:ParameterizedQuery checkQuery = `
            SELECT COUNT(*) as count FROM enrollments 
            WHERE competition_id = ${competitionid} AND team_id = ${teamid}
        `;
        stream<record{int count;}, sql:Error?> checkResult = self.db->query(checkQuery);
        record {int count;}[]|error existingArr = from record{int count;} c in checkResult select c;

        if existingArr is error {
            log:printError("Failed to check existing enrollment", existingArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        if existingArr.length() > 0 && existingArr[0].count > 0 {
            log:printError("Team already enrolled in this competition");
            return http:BAD_REQUEST;
        }

        // Insert new Enrollment
        sql:ExecutionResult|error result = self.db->execute(`
            INSERT INTO enrollments (competition_id, team_id, status, created_at) 
            VALUES (${competitionid}, ${teamid}, ${status}, NOW())
        `);

        if result is error {
            log:printError("Failed to create enrollment", 'error = result);
            return http:INTERNAL_SERVER_ERROR;
        }

        // Get the generated ID from the insert result
        int|string? generatedId = result.lastInsertId;
        if generatedId is () {
            log:printError("Failed to get generated enrollment ID");
            return http:INTERNAL_SERVER_ERROR;
        }

        // Fetch the newly created enrollment using the generated ID
        sql:ParameterizedQuery selectQuery = `SELECT * FROM enrollments WHERE enrollment_id = ${generatedId}`;
        stream<Enrollment, sql:Error?> newEnrollmentResult = self.db->query(selectQuery, Enrollment);
        Enrollment[]|error createdEnrollmentArr = from Enrollment e in newEnrollmentResult
                                      select e;

        if createdEnrollmentArr is error {
            log:printError("Failed to fetch created enrollment", createdEnrollmentArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        if createdEnrollmentArr.length() == 0 {
            log:printError("Created enrollment not found");
            return http:INTERNAL_SERVER_ERROR;
        }

        return createdEnrollmentArr[0];
    }

    // Get enrollments by user (all teams where user is a member or leader)
    isolated resource function get user/[string userId]() returns EnrollmentWithDetails[]|http:InternalServerError|error {
        sql:ParameterizedQuery query = `
            SELECT 
                e.enrollment_id,
                e.competition_id,
                e.team_id,
                e.status,
                e.created_at,
                t.name as team_name,
                c.title as competition_title,
                c.status as competition_status,
                c.start_date as competition_start_date,
                c.end_date as competition_end_date
            FROM enrollments e
            INNER JOIN teams t ON e.team_id = t.id
            INNER JOIN competitions c ON e.competition_id = c.id
            WHERE t.id IN (
                SELECT t2.id FROM teams t2 
                WHERE t2.created_by = ${userId}::uuid
                UNION
                SELECT tm.team_id FROM team_members tm 
                WHERE tm.member_id = ${userId}::uuid
            )
            ORDER BY e.created_at DESC
        `;

        stream<EnrollmentWithDetails, sql:Error?> enrollmentResult = self.db->query(query, EnrollmentWithDetails);
        EnrollmentWithDetails[]|error enrollments = from EnrollmentWithDetails e in enrollmentResult
                                                   select e;

        if enrollments is error {
            log:printError("Failed to fetch user enrollments", enrollments);
            return http:INTERNAL_SERVER_ERROR;
        }

        return enrollments;
    }

    // Get enrollments by competition (for organizers)
    isolated resource function get competition/[int competitionId]() returns EnrollmentWithDetails[]|http:InternalServerError|error {
        sql:ParameterizedQuery query = `
            SELECT 
                e.enrollment_id,
                e.competition_id,
                e.team_id,
                e.status,
                e.created_at,
                t.name as team_name
            FROM enrollments e
            INNER JOIN teams t ON e.team_id = t.id
            WHERE e.competition_id = ${competitionId}
            ORDER BY e.created_at DESC
        `;

        stream<EnrollmentWithDetails, sql:Error?> enrollmentResult = self.db->query(query, EnrollmentWithDetails);
        EnrollmentWithDetails[]|error enrollments = from EnrollmentWithDetails e in enrollmentResult
                                                   select e;

        if enrollments is error {
            log:printError("Failed to fetch competition enrollments", enrollments);
            return http:INTERNAL_SERVER_ERROR;
        }

        return enrollments;
    }

    // Get enrollment by team and competition
    isolated resource function get team/[int teamId]/competition/[int competitionId]() returns Enrollment|http:NotFound|http:InternalServerError|error {
        sql:ParameterizedQuery query = `
            SELECT * FROM enrollments 
            WHERE team_id = ${teamId} AND competition_id = ${competitionId}
        `;

        stream<Enrollment, sql:Error?> enrollmentResult = self.db->query(query, Enrollment);
        Enrollment[]|error enrollments = from Enrollment e in enrollmentResult select e;

        if enrollments is error {
            log:printError("Failed to fetch enrollment", enrollments);
            return http:INTERNAL_SERVER_ERROR;
        }

        if enrollments.length() == 0 {
            return http:NOT_FOUND;
        }

        return enrollments[0];
    }

    // Update enrollment status
    isolated resource function put [int enrollmentId](@http:Payload json updateData) returns Enrollment|http:InternalServerError|http:BadRequest|http:NotFound|error {
        json|error statusJson = updateData.status;

        if statusJson is error {
            log:printError("Missing status field in request payload");
            return http:BAD_REQUEST;
        }

        string status = statusJson.toString();
        if status.trim() == "" {
            return http:BAD_REQUEST;
        }

        // Update enrollment status
        sql:ExecutionResult|error result = self.db->execute(`
            UPDATE enrollments 
            SET status = ${status}
            WHERE enrollment_id = ${enrollmentId}
        `);

        if result is error {
            log:printError("Failed to update enrollment", 'error = result);
            return http:INTERNAL_SERVER_ERROR;
        }

        if result.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }

        // Fetch updated enrollment
        sql:ParameterizedQuery selectQuery = `SELECT * FROM enrollments WHERE enrollment_id = ${enrollmentId}`;
        stream<Enrollment, sql:Error?> updatedEnrollmentResult = self.db->query(selectQuery, Enrollment);
        Enrollment[]|error updatedEnrollmentArr = from Enrollment e in updatedEnrollmentResult select e;

        if updatedEnrollmentArr is error {
            log:printError("Failed to fetch updated enrollment", updatedEnrollmentArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        if updatedEnrollmentArr.length() == 0 {
            log:printError("Updated enrollment not found");
            return http:INTERNAL_SERVER_ERROR;
        }

        return updatedEnrollmentArr[0];
    }

    // Delete enrollment
    isolated resource function delete [int enrollmentId]() returns http:Ok|http:NotFound|http:InternalServerError|error {
        sql:ExecutionResult|error result = self.db->execute(`
            DELETE FROM enrollments WHERE enrollment_id = ${enrollmentId}
        `);

        if result is error {
            log:printError("Failed to delete enrollment", 'error = result);
            return http:INTERNAL_SERVER_ERROR;
        }

        if result.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }

        return http:OK;
    }
    };
}