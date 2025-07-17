import ballerina/http;
import ballerina/jwt;
import ballerina/log;

// Authentication interceptor
public isolated service class AuthInterceptor {
    *http:RequestInterceptor;

    private final string supabaseUrl;
    private final string supabaseJwtSecret;

    public isolated function init(string supabaseUrl, string supabaseJwtSecret) {
        self.supabaseUrl = supabaseUrl;
        self.supabaseJwtSecret = supabaseJwtSecret;
    }

    isolated resource function 'default [string... path](http:RequestContext ctx, http:Request req) 
            returns http:NextService|http:Unauthorized|http:InternalServerError|error? {
        log:printInfo("AuthInterceptor: Request Intercepted",
        method = req.method.toString(),
        path = path);
        // Skip authentication for health endpoint
        if path.length() > 0 && path[0] == "health" {
            return ctx.next();
        }

        // Skip authentication for CORS preflight OPTIONS requests
        if req.method == "OPTIONS" {
            return ctx.next();
        }

        string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
        
        if authHeader is http:HeaderNotFoundError {
            log:printError("Authorization header not found");
            return http:UNAUTHORIZED;
        }

        if !authHeader.startsWith("Bearer ") {
            log:printError("Invalid authorization header format");
            return http:UNAUTHORIZED;
        }

        string token = authHeader.substring(7);

        jwt:ValidatorConfig validatorConfig = {
            issuer: self.supabaseUrl,
            audience: "authenticated",
            clockSkew: 60,
            signatureConfig: {
                secret: self.supabaseJwtSecret
            }
        };

        jwt:Payload|jwt:Error jwtPayload = jwt:validate(token, validatorConfig);

        if jwtPayload is jwt:Error {
            log:printError("JWT validation failed", jwtPayload);
            return http:UNAUTHORIZED;
        }

        // Store user info in context for use in endpoints
        ctx.set("user", jwtPayload);
        return ctx.next();
    }
}