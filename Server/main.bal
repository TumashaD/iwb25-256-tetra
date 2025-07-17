import ballerina/http;
import ballerina/jwt;
import ballerina/log;
import ballerina/time;

// Configuration for Supabase JWT
configurable string supabaseJwtSecret = ?;
configurable string supabaseUrl = ?;
configurable int serverPort = 8080;

// CORS configuration
@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000", "https://your-domain.com"],
        allowCredentials: true,
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
}
service /api on new http:Listener(serverPort) {

    // Health check endpoint
    resource function get health() returns json {
        return {
            "status": "healthy",
            "service": "competition_service",
            "timestamp": time:utcNow()
        };
    }

    // Protected endpoint - requires authentication
    resource function get user(http:Request req) returns json|http:Unauthorized|http:InternalServerError {
        (jwt:Payload & readonly)|(http:Unauthorized & readonly)|(http:InternalServerError & readonly) authResult = authenticateUser(req);
        if authResult is http:Unauthorized || authResult is http:InternalServerError {
            return authResult;
        }
        
        json userPayload = <json>authResult;
        return {
            "message": "User authenticated successfully",
            "user": userPayload,
            "timestamp": time:utcNow()
        };
    }

    // get competitions endpoint with dummy data
    resource function get competitions(http:Request req) returns json|http:Unauthorized|http:InternalServerError {
        (jwt:Payload & readonly)|(http:Unauthorized & readonly)|(http:InternalServerError & readonly) authResult = authenticateUser(req);
        if authResult is http:Unauthorized || authResult is http:InternalServerError {
            return authResult;
        }

        // Dummy data for competitions
        json competitionsData = [
            {
                "id": 1,
                "name": "Competition A",
                "description": "Description for Competition A",
                "startDate": "2023-10-01",
                "endDate": "2023-10-31"
            },
            {
                "id": 2,
                "name": "Competition B",
                "description": "Description for Competition B",
                "startDate": "2023-11-01",
                "endDate": "2023-11-30"
            }
        ];

        return {
            "message": "Competitions retrieved successfully",
            "competitions": competitionsData,
            "timestamp": time:utcNow()
        };
    }

}

// Authentication function
function authenticateUser(http:Request req) returns jwt:Payload & readonly|http:Unauthorized & readonly|http:InternalServerError & readonly {
    string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
    
    if authHeader is http:HeaderNotFoundError {
        log:printError("Authorization header not found");
        return http:UNAUTHORIZED;
    }

    // Extract Bearer token
    if !authHeader.startsWith("Bearer ") {
        log:printError("Invalid authorization header format");
        return http:UNAUTHORIZED;
    }

    string token = authHeader.substring(7);

    // Verify JWT token with Supabase secret (HMAC-based)
    jwt:ValidatorConfig validatorConfig = {
        issuer: supabaseUrl,
        audience: "authenticated",
        clockSkew: 60,
        signatureConfig: {
            secret: supabaseJwtSecret
        }
    };

    jwt:Payload|jwt:Error jwtPayload = jwt:validate(token, validatorConfig);

    if jwtPayload is jwt:Error {
        log:printError("JWT validation failed", jwtPayload);
        return http:UNAUTHORIZED;
    }

    return jwtPayload.cloneReadOnly();
}

