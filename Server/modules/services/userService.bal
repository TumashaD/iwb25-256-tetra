import ballerina/http;
import ballerina/log;
import ballerina/sql;
import ballerinax/postgresql;

public type User record {
    string id;
    string name;
    string email;
    string role;
    string? readme?;
    string? created_at?;
};

public function createUserService(postgresql:Client dbClient, http:CorsConfig corsConfig, http:Interceptor authInterceptor) returns http:InterceptableService {
    return @http:ServiceConfig {cors: corsConfig} isolated service object {

        public function createInterceptors() returns http:Interceptor {
            return authInterceptor;
        }

        private final postgresql:Client db = dbClient;

        isolated resource function post create(http:Request req, @http:Payload User newUser) returns User|http:InternalServerError|http:BadRequest|error {
            // Validate required fields
            if newUser.id.trim() == "" || newUser.name.trim() == "" ||
            newUser.email.trim() == "" || newUser.role.trim() == "" {
                return http:BAD_REQUEST;
            }

            // Insert new user with the provided auth ID
            sql:ExecutionResult|error result = self.db->execute(`
            INSERT INTO users (id, name, email, role, readme, created_at) 
            VALUES (${newUser.id}::uuid, ${newUser.name}, ${newUser.email}, ${newUser.role}, ${newUser?.readme}, NOW())
        `);

            if result is error {
                log:printError("Failed to create user", 'error = result);
                return http:INTERNAL_SERVER_ERROR;
            }

            // Fetch the newly created user using the provided ID (keeping array approach)
            sql:ParameterizedQuery selectQuery = `SELECT * FROM users WHERE id = ${newUser.id}::uuid`;
            stream<User, sql:Error?> newUserResult = self.db->query(selectQuery, User);
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

            return createdUserArr[0];
        }

        isolated resource function get [string id](http:Request req) returns User|http:InternalServerError|http:NotFound|error {
            // Fetch user by ID
            sql:ParameterizedQuery selectQuery = `SELECT * FROM users WHERE id = ${id}::uuid`;
            stream<User, sql:Error?> userResult = self.db->query(selectQuery, User);
            User[]|error userArr = from User u in userResult
                select u;

            if userArr is error {
                log:printError("Failed to fetch user", 'error = userArr);
                return http:INTERNAL_SERVER_ERROR;
            }
            if userArr.length() == 0 {
                return http:NOT_FOUND;
            }

            return userArr[0];
        }

        isolated resource function patch update/[string id](http:Request req, @http:Payload json updateData) returns User|http:InternalServerError|http:NotFound|http:BadRequest|error {
            // Get existing user
            sql:ParameterizedQuery selectQuery = `SELECT * FROM users WHERE id = ${id}::uuid`;
            stream<User, sql:Error?> userResult = self.db->query(selectQuery, User);
            User[]|error userArr = from User u in userResult
                select u;

            if userArr is error {
                log:printError("Failed to fetch existing user", 'error = userArr);
                return http:INTERNAL_SERVER_ERROR;
            }
            if userArr.length() == 0 {
                return http:NOT_FOUND;
            }

            User existingUser = userArr[0];

            json|error nameField = updateData.name;
            json|error emailField = updateData.email;
            json|error roleField = updateData.role;
            json|error readmeField = updateData.readme;

            string name = nameField is string ? nameField : existingUser.name;
            string email = emailField is string ? emailField : existingUser.email;
            string role = roleField is string ? roleField : existingUser.role;
            string? readme = readmeField is string ? readmeField : existingUser?.readme;

            // Update user
            sql:ExecutionResult|error result = self.db->execute(`
            UPDATE users 
            SET name = ${name}, email = ${email}, role = ${role}, readme = ${readme}
            WHERE id = ${id}::uuid
        `);

            log:printInfo("Updating user with ID: " + id,
                    name = name,
                    email = email,
                    role = role,
                    readme = readme);

            if result is error {
                log:printError("Failed to update user", 'error = result);
                return http:INTERNAL_SERVER_ERROR;
            }

            // Fetch and return updated user
            sql:ParameterizedQuery updatedQuery = `SELECT * FROM users WHERE id = ${id}::uuid`;
            stream<User, sql:Error?> updatedResult = self.db->query(updatedQuery, User);
            User[]|error updatedArr = from User u in updatedResult
                select u;

            if updatedArr is error {
                return http:INTERNAL_SERVER_ERROR;
            }

            return updatedArr[0];
        }

        isolated resource function get search(http:Request req, string? query) returns User[]|http:InternalServerError|error {
            if query is () || query.trim() == "" {
                return [];
            }

            // Search users by name or email (partial match)
            string searchPattern = "%" + query + "%";
            sql:ParameterizedQuery searchQuery = `
                SELECT id, name, email, role, readme, created_at, avatar_url
                FROM users 
                WHERE name ILIKE ${searchPattern} OR email ILIKE ${searchPattern}
                ORDER BY name
                LIMIT 20
            `;

            stream<User, sql:Error?> searchResult = self.db->query(searchQuery, User);
            User[]|error usersArr = from User u in searchResult
                select u;

            if usersArr is error {
                log:printError("Failed to search users", 'error = usersArr);
                return http:INTERNAL_SERVER_ERROR;
            }

            return usersArr;
        }
    };
}
