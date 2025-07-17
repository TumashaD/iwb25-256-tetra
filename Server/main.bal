import ballerina/http;
import ballerina/jwt;
import ballerina/log;
import ballerina/time;
import ballerina/sql;
import competition_service.competitions;

// Configuration for Supabase JWT
configurable string supabaseJwtSecret = ?;
configurable string supabaseUrl = ?;
configurable int serverPort = ?;

// CORS configuration with interceptor
@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000", "https://your-domain.com"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
}
service http:InterceptableService /api on new http:Listener(serverPort) {

    public function createInterceptors() returns http:Interceptor[] {
        return [new AuthInterceptor(supabaseUrl, supabaseJwtSecret)];
    }

    // Health check endpoint (no auth required)
    resource function get health() returns json {
        return {
            "status": "healthy",
            "service": "competition_service",
            "timestamp": time:utcNow()
        };
    }

    // Protected endpoint - authentication handled by interceptor
    resource function get user(http:RequestContext ctx) returns json {
        jwt:Payload userPayload = <jwt:Payload>ctx.get("user");
        return {
            "message": "User authenticated successfully",
            "user": userPayload.toJson(),
            "timestamp": time:utcNow()
        };
    }

    // Get competitions endpoint - authentication handled by interceptor
    isolated resource function get competitions(http:RequestContext ctx) returns json|http:InternalServerError {
        // User is already authenticated by interceptor
        stream<competitions:Competition, sql:Error?>|error competitionsResult = competitions:getCompetitions();
        if competitionsResult is error {
            log:printError("Failed to get competitions", competitionsResult);
            return http:INTERNAL_SERVER_ERROR;
        }

        competitions:Competition[]|error competitions = from competitions:Competition competition in competitionsResult
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
}