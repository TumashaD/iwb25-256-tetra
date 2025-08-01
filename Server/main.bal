import vinnova.services;
import ballerina/http;
import ballerina/log;
import vinnova.auth;

configurable string supabaseUrl = ?;
configurable string supabaseJwtSecret = ?;
configurable int serverPort = ?;

listener http:Listener ln = new (serverPort);

public function main() returns error? {
    auth:AUTH_INTERCEPTOR.configure(supabaseUrl, supabaseJwtSecret);
    check ln.attach(services:competitionService, "/competitions");
    check ln.'start();
    log:printInfo("Competition service started on port " + serverPort.toString());
    return;
}