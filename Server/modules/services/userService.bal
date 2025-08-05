import ballerinax/postgresql;
import ballerina/sql;
import vinnova.db;
import vinnova.auth;
import ballerina/http;
import ballerina/log;
import ballerina/time;

public type User record {
    string id;  // Changed from int to string since it's a UUID from Google Auth
    string name;
    string email;
    string role;
    string about;
    string created_at;
};

public type UserCreate record {
    string id;     // Auth user ID from Google Auth
    string name;
    string email;
    string role;
    string about;
};

public http:Service userService = @http:ServiceConfig{cors : auth:CORS_CONFIG} isolated service object {

    isolated resource function post create(http:RequestContext ctx, @http:Payload UserCreate newUser) returns json|http:InternalServerError|http:BadRequest|error {
        postgresql:Client db = check db:getDbClient();

        // Validate required fields
        if newUser.id.trim() == "" || newUser.name.trim() == "" || 
           newUser.email.trim() == "" || newUser.role.trim() == "" {
            return http:BAD_REQUEST;
        }

        // Insert new user with the provided auth ID
        sql:ExecutionResult|error result = db->execute(`
            INSERT INTO users (id, name, email, role, about, created_at) 
            VALUES (${newUser.id}::uuid, ${newUser.name}, ${newUser.email}, ${newUser.role}, ${newUser.about}, NOW())
        `);

        if result is error {
            log:printError("Failed to create user", 'error = result);
            return http:INTERNAL_SERVER_ERROR;
        }

        // Fetch the newly created user using the provided ID (keeping array approach)
        sql:ParameterizedQuery selectQuery = `SELECT * FROM users WHERE id = ${newUser.id}::uuid`;
        stream<User, sql:Error?> newUserResult = db->query(selectQuery, User);
        User[]|error createdUserArr = from User u in newUserResult
                                      select u;

        if createdUserArr is error {
            log:printError("Failed to fetch created user", createdUserArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        if createdUserArr.length() == 0 {
            log:printError("Created user not found");
            return http:INTERNAL_SERVER_ERROR;
        }
        
        return {
            "user": createdUserArr[0],
            "message": "User created successfully",
            "timestamp": time:utcNow()
        }.toJson();
    }

    isolated resource function get [string id](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {
        postgresql:Client db = check db:getDbClient();

        // Fetch user by ID
        sql:ParameterizedQuery selectQuery = `SELECT * FROM users WHERE id = ${id}::uuid`;
        stream<User, sql:Error?> userResult = db->query(selectQuery, User);
        User[]|error userArr = from User u in userResult
                                select u;

        if userArr is error {
            log:printError("Failed to fetch user", 'error = userArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        if userArr.length() == 0 {
            return http:NOT_FOUND;
        }

        return {
            "user": userArr[0],
            "timestamp": time:utcNow()
        }.toJson();
    }
};