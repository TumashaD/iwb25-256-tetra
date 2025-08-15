import ballerinax/postgresql;
import ballerina/sql;
import ballerina/http;
import ballerina/log;
import ballerina/jwt;

public type Team record {
    int id;
    string name;
    string created_by;
    int no_participants;
    string? created_at?;
    string? last_modified?;
};

public type TeamMember record {
    int team_id;
    string member_id;
    string role;
    string? created_at?;
    string? last_modified?;
};

public type TeamWithMembers record {
    *Team;
    TeamMember[] members?;
};

public type UserSearchResult record {
    string id;
    string name;
    string email;
    string role;
};


public function createTeamService(postgresql:Client dbClient, http:CorsConfig corsConfig, http:Interceptor authInterceptor) returns http:InterceptableService {
    return @http:ServiceConfig{cors : corsConfig} isolated service object {

    public function createInterceptors() returns http:Interceptor {
        return authInterceptor;
    }

    private final postgresql:Client db = dbClient;

    isolated resource function post create(http:RequestContext ctx, @http:Payload json teamData) returns Team|http:InternalServerError|http:BadRequest|error {
        // Extract and validate required fields from JSON
        json|error nameJson = teamData.name;
        json|error createdByJson = teamData.created_by;
        json|error noParticipantsJson = teamData.no_participants;

        if nameJson is error || createdByJson is error || noParticipantsJson is error {
            log:printError("Missing required fields in request payload");
            return http:BAD_REQUEST;
        }

        // Cast JSON values to appropriate types
        string name = nameJson.toString();
        string created_by = createdByJson.toString();
        int|error no_participants = int:fromString(noParticipantsJson.toString());

        if no_participants is error {
            log:printError("Invalid no_participants value - must be a number");
            return http:BAD_REQUEST;
        }

        if name.trim() == "" || created_by.trim() == "" {
            return http:BAD_REQUEST;
        }

        // Insert new Team with the provided auth ID
        sql:ExecutionResult|error result = self.db->execute(`
            INSERT INTO teams (name, created_by, no_participants, created_at, last_modified) 
            VALUES (${name}, ${created_by}::uuid, ${no_participants}, NOW(), NOW())
        `);

        if result is error {
            log:printError("Failed to create team", 'error = result);
            return http:INTERNAL_SERVER_ERROR;
        }

        // Get the generated ID from the insert result
        int|string? generatedId = result.lastInsertId;
        if generatedId is () {
            log:printError("Failed to get generated team ID");
            return http:INTERNAL_SERVER_ERROR;
        }

        // Fetch the newly created team using the generated ID
        sql:ParameterizedQuery selectQuery = `SELECT * FROM teams WHERE id = ${generatedId}`;
        stream<Team, sql:Error?> newTeamResult = self.db->query(selectQuery, Team);
        Team[]|error createdTeamArr = from Team t in newTeamResult
                                      select t;

        if createdTeamArr is error {
            log:printError("Failed to fetch created team", createdTeamArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        if createdTeamArr.length() == 0 {
            log:printError("Created team not found");
            return http:INTERNAL_SERVER_ERROR;
        }

        Team createdTeam = createdTeamArr[0];

        // Automatically add the team creator as the team leader
        sql:ExecutionResult|error memberResult = self.db->execute(`
            INSERT INTO team_members (team_id, member_id, role, created_at, last_modified) 
            VALUES (${createdTeam.id}, ${created_by}::uuid, 'leader', NOW(), NOW())
        `);

        if memberResult is error {
            log:printError("Failed to add team creator as leader", 'error = memberResult);
            return http:INTERNAL_SERVER_ERROR;
        }

        return createdTeam;
    }

    isolated resource function get [int id](http:RequestContext ctx) returns TeamWithMembers|http:InternalServerError|http:NotFound|error {
        // Fetch team by ID
        sql:ParameterizedQuery teamQuery = `SELECT * FROM teams WHERE id = ${id}`;
        stream<Team, sql:Error?> teamResult = self.db->query(teamQuery, Team);
        Team[]|error teamArr = from Team t in teamResult select t;

        if teamArr is error {
            log:printError("Failed to fetch team", 'error = teamArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        if teamArr.length() == 0 {
            return http:NOT_FOUND;
        }

        Team team = teamArr[0];

        // Fetch team members
        sql:ParameterizedQuery membersQuery = `SELECT * FROM team_members WHERE team_id = ${id}`;
        stream<TeamMember, sql:Error?> membersResult = self.db->query(membersQuery, TeamMember);
        TeamMember[]|error membersArr = from TeamMember tm in membersResult select tm;

        if membersArr is error {
            log:printError("Failed to fetch team members", 'error = membersArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        TeamWithMembers teamWithMembers = {
            id: team.id,
            name: team.name,
            created_by: team.created_by,
            no_participants: team.no_participants,
            created_at: team?.created_at,
            last_modified: team?.last_modified,
            members: membersArr
        };

        return teamWithMembers;
    }

    isolated resource function get user/[string userId](http:RequestContext ctx) returns Team[]|http:InternalServerError|error {
        // Fetch teams created by a specific user
        sql:ParameterizedQuery teamsQuery = `SELECT * FROM teams WHERE created_by = ${userId}::uuid ORDER BY created_at DESC`;
        stream<Team, sql:Error?> teamsResult = self.db->query(teamsQuery, Team);
        Team[]|error teamsArr = from Team t in teamsResult select t;

        if teamsArr is error {
            log:printError("Failed to fetch user teams", 'error = teamsArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        return teamsArr;
    }

    isolated resource function get user/[string userId]/all(http:RequestContext ctx) returns Team[]|http:InternalServerError|error {
        // Fetch all teams where the user is either the creator or a member
        sql:ParameterizedQuery teamsQuery = `
            SELECT DISTINCT t.id, t.name, t.created_by, t.no_participants, t.created_at, t.last_modified 
            FROM teams t 
            LEFT JOIN team_members tm ON t.id = tm.team_id 
            WHERE t.created_by = ${userId}::uuid OR tm.member_id = ${userId}::uuid 
            ORDER BY t.created_at DESC
        `;
        stream<Team, sql:Error?> teamsResult = self.db->query(teamsQuery, Team);
        Team[]|error teamsArr = from Team t in teamsResult select t;

        if teamsArr is error {
            log:printError("Failed to fetch all user teams", 'error = teamsArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        return teamsArr;
    }

    isolated resource function post [int teamId]/members(http:RequestContext ctx, @http:Payload json memberData) returns TeamMember|http:InternalServerError|http:BadRequest|http:NotFound|http:Forbidden|http:Unauthorized|error {
        // Get current user from context
        any|error userPayload = ctx.get("user");
        if userPayload is error {
            log:printError("Failed to get user from context", 'error = userPayload);
            return http:UNAUTHORIZED;
        }

        jwt:Payload jwtPayload = <jwt:Payload>userPayload;
        json|error subClaim = jwtPayload.sub;
        if subClaim is error {
            log:printError("Failed to get user ID from JWT payload");
            return http:UNAUTHORIZED;
        }
        string currentUserId = subClaim.toString();

        // Check if team exists
        sql:ParameterizedQuery teamQuery = `SELECT id FROM teams WHERE id = ${teamId}`;
        stream<record{int id;}, sql:Error?> teamResult = self.db->query(teamQuery);
        record{int id;}[]|error teamArr = from var t in teamResult select t;

        if teamArr is error {
            log:printError("Failed to fetch team", 'error = teamArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        if teamArr.length() == 0 {
            return http:NOT_FOUND;
        }

        // Check if current user is a team leader
        sql:ParameterizedQuery leaderQuery = `SELECT COUNT(*) as count FROM team_members WHERE team_id = ${teamId} AND member_id = ${currentUserId}::uuid AND role = 'leader'`;
        stream<record{int count;}, sql:Error?> leaderResult = self.db->query(leaderQuery);
        record{int count;}[]|error leaderArr = from var l in leaderResult select l;

        if leaderArr is error {
            log:printError("Failed to check team leadership", 'error = leaderArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        if leaderArr[0].count == 0 {
            log:printError("User is not a team leader", userId = currentUserId, teamId = teamId);
            return http:FORBIDDEN;
        }

        // Extract member data
        json|error memberIdJson = memberData.member_id;
        json|error roleJson = memberData.role;

        if memberIdJson is error || roleJson is error {
            log:printError("Missing required fields in request payload");
            return http:BAD_REQUEST;
        }

        string member_id = memberIdJson.toString();
        string role = roleJson.toString();

        if member_id.trim() == "" || role.trim() == "" {
            return http:BAD_REQUEST;
        }

        // Validate role - only "leader" and "member" are allowed
        if role != "leader" && role != "member" {
            log:printError("Invalid role provided: " + role);
            return http:BAD_REQUEST;
        }

        // Check if member already exists in team
        sql:ParameterizedQuery existsQuery = `SELECT COUNT(*) as count FROM team_members WHERE team_id = ${teamId} AND member_id = ${member_id}::uuid`;
        stream<record{int count;}, sql:Error?> existsResult = self.db->query(existsQuery);
        record{int count;}[]|error existsArr = from var e in existsResult select e;

        if existsArr is error {
            log:printError("Failed to check member existence", 'error = existsArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        if existsArr[0].count > 0 {
            return http:BAD_REQUEST; // Member already in team
        }

        // Insert new team member
        sql:ExecutionResult|error result = self.db->execute(`
            INSERT INTO team_members (team_id, member_id, role, created_at, last_modified) 
            VALUES (${teamId}, ${member_id}::uuid, ${role}, NOW(), NOW())
        `);

        if result is error {
            log:printError("Failed to add team member", 'error = result);
            return http:INTERNAL_SERVER_ERROR;
        }

        // Return the created team member
        TeamMember newMember = {
            team_id: teamId,
            member_id: member_id,
            role: role,
            created_at: (),
            last_modified: ()
        };

        return newMember;
    }

    isolated resource function delete [int teamId]/members/[string memberId](http:RequestContext ctx) returns http:Ok|http:InternalServerError|http:NotFound|http:Forbidden|http:Unauthorized|error {
        // Get current user from context
        any|error userPayload = ctx.get("user");
        if userPayload is error {
            log:printError("Failed to get user from context", 'error = userPayload);
            return http:UNAUTHORIZED;
        }

        jwt:Payload jwtPayload = <jwt:Payload>userPayload;
        json|error subClaim = jwtPayload.sub;
        if subClaim is error {
            log:printError("Failed to get user ID from JWT payload");
            return http:UNAUTHORIZED;
        }
        string currentUserId = subClaim.toString();

        // Check if current user is a team leader
        sql:ParameterizedQuery leaderQuery = `SELECT COUNT(*) as count FROM team_members WHERE team_id = ${teamId} AND member_id = ${currentUserId}::uuid AND role = 'leader'`;
        stream<record{int count;}, sql:Error?> leaderResult = self.db->query(leaderQuery);
        record{int count;}[]|error leaderArr = from var l in leaderResult select l;

        if leaderArr is error {
            log:printError("Failed to check team leadership", 'error = leaderArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        if leaderArr[0].count == 0 {
            log:printError("User is not a team leader", userId = currentUserId, teamId = teamId);
            return http:FORBIDDEN;
        }

        // Delete team member
        sql:ExecutionResult|error result = self.db->execute(`
            DELETE FROM team_members WHERE team_id = ${teamId} AND member_id = ${memberId}::uuid
        `);

        if result is error {
            log:printError("Failed to remove team member", 'error = result);
            return http:INTERNAL_SERVER_ERROR;
        }

        if result.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }

        return http:OK;
    }

    isolated resource function delete [int teamId](http:RequestContext ctx) returns http:Ok|http:InternalServerError|http:NotFound|http:Forbidden|http:Unauthorized|error {
        // Get current user from context
        any|error userPayload = ctx.get("user");
        if userPayload is error {
            log:printError("Failed to get user from context", 'error = userPayload);
            return http:UNAUTHORIZED;
        }

        jwt:Payload jwtPayload = <jwt:Payload>userPayload;
        json|error subClaim = jwtPayload.sub;
        if subClaim is error {
            log:printError("Failed to get user ID from JWT payload");
            return http:UNAUTHORIZED;
        }
        string currentUserId = subClaim.toString();

        // Check if team exists and get team details
        sql:ParameterizedQuery teamQuery = `SELECT id, created_by FROM teams WHERE id = ${teamId}`;
        stream<record{int id; string created_by;}, sql:Error?> teamResult = self.db->query(teamQuery);
        record{int id; string created_by;}[]|error teamArr = from var t in teamResult select t;

        if teamArr is error {
            log:printError("Failed to fetch team", 'error = teamArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        if teamArr.length() == 0 {
            return http:NOT_FOUND;
        }

        record{int id; string created_by;} team = teamArr[0];

        // Check if current user is the team creator
        boolean isCreator = team.created_by == currentUserId;

        // Check if current user is a team leader (member with 'leader' role)
        boolean isLeader = false;
        if !isCreator {
            sql:ParameterizedQuery leaderQuery = `
                SELECT member_id FROM team_members 
                WHERE team_id = ${teamId} AND member_id = ${currentUserId}::uuid AND role = 'leader'
            `;
            stream<record{string member_id;}, sql:Error?> leaderResult = self.db->query(leaderQuery);
            record{string member_id;}[]|error leaderArr = from var l in leaderResult select l;

            if leaderArr is error {
                log:printError("Failed to check team leadership", 'error = leaderArr);
                return http:INTERNAL_SERVER_ERROR;
            }
            isLeader = leaderArr.length() > 0;
        }

        // Only team creators or team leaders can delete the team
        if !isCreator && !isLeader {
            return http:FORBIDDEN;
        }

        // First delete all team members (due to foreign key constraints)
        sql:ExecutionResult|error deleteMembersResult = self.db->execute(`
            DELETE FROM team_members WHERE team_id = ${teamId}
        `);

        if deleteMembersResult is error {
            log:printError("Failed to delete team members", 'error = deleteMembersResult);
            return http:INTERNAL_SERVER_ERROR;
        }

        // Then delete the team itself
        sql:ExecutionResult|error deleteTeamResult = self.db->execute(`
            DELETE FROM teams WHERE id = ${teamId}
        `);

        if deleteTeamResult is error {
            log:printError("Failed to delete team", 'error = deleteTeamResult);
            return http:INTERNAL_SERVER_ERROR;
        }

        if deleteTeamResult.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }

        return http:OK;
    }

    isolated resource function get users/search(http:RequestContext ctx, string? email) returns UserSearchResult[]|http:InternalServerError|error {
        if email is () || email.trim() == "" {
            return [];
        }

        // Search users by email (partial match)
        string searchPattern = "%" + email + "%";
        sql:ParameterizedQuery searchQuery = `
            SELECT id, name, email, role 
            FROM users 
            WHERE email ILIKE ${searchPattern}
            LIMIT 10
        `;
        
        stream<UserSearchResult, sql:Error?> searchResult = self.db->query(searchQuery, UserSearchResult);
        UserSearchResult[]|error usersArr = from UserSearchResult u in searchResult select u;

        if usersArr is error {
            log:printError("Failed to search users", 'error = usersArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        return usersArr;
    }
    };
}