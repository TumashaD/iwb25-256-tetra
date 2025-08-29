import vinnova.services;
import ballerina/http;
import ballerina/log;
import vinnova.auth;
import vinnova.supabase;
import ballerinax/postgresql;
import ballerinax/googleapis.gmail;

configurable string supabaseUrl = ?;
configurable string supabaseJwtSecret = ?;
configurable int serverPort = ?;

configurable string dbHost = ?;
configurable int dbPort = ?;
configurable string dbUser = ?;
configurable string dbPassword = ?;
configurable string dbName = ?;

configurable string supabaseStorageUrl = ?;
configurable string supabaseAnonKey = ?;

configurable string geminiApiKey = ?;

configurable string refreshToken = ?;
configurable string clientId = ?;
configurable string clientSecret = ?;

listener http:Listener ln = new (serverPort);

public final http:CorsConfig CORS_CONFIG = {
    allowCredentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
    allowOrigins: ["http://localhost:3000"]
};


public function main() returns error? {
    auth:AuthInterceptor authInterceptor = new(supabaseUrl, supabaseJwtSecret);

    supabase:DatabaseClient dbClient = new (dbHost, dbPort, dbUser, dbPassword, dbName);
    postgresql:Client db = check dbClient.getClient();

    supabase:StorageClient storageClient = check new (supabaseStorageUrl, supabaseAnonKey,supabaseStorageUrl);

    gmail:Client gmail = check new gmail:Client(config = {auth: {refreshToken,clientId,clientSecret}});

    http:Service competitionService = services:createCompetitionService(db, storageClient, CORS_CONFIG);
    http:Service organizerService = services:createOrganizerService(db, storageClient, CORS_CONFIG,authInterceptor);
    http:Service userService = services:createUserService(db, CORS_CONFIG, authInterceptor);
    http:Service teamService = services:createTeamService(db, CORS_CONFIG, authInterceptor);
    http:Service enrollmentService = services:createEnrollmentService(db, CORS_CONFIG, authInterceptor);
    http:Service aiService = services:createAIService(db, geminiApiKey, CORS_CONFIG);
    http:Service gmailService = services:createGmailService(gmail, CORS_CONFIG, authInterceptor);

    check ln.attach(competitionService, "/competitions");
    check ln.attach(organizerService, "/organizer");
    check ln.attach(userService, "/users");
    check ln.attach(teamService, "/teams");
    check ln.attach(enrollmentService, "/enrollments");
    check ln.attach(aiService, "/ai");
    check ln.attach(gmailService, "/gmail");

    check ln.'start();
    log:printInfo("Competition service started on port " + serverPort.toString());
    return;
}

