import ballerinax/postgresql;
import ballerina/sql;

configurable string dbHost = ?;
configurable int dbPort = ?;
configurable string dbUser = ?;
configurable string dbPassword = ?;
configurable string dbName = ?;

public final postgresql:Client | sql:Error dbClient = new (
    host = dbHost,
    port = dbPort,
    username = dbUser,
    password = dbPassword,
    database = dbName
);

public isolated function getDbClient() returns postgresql:Client|sql:Error {
    if dbClient is postgresql:Client {
        return dbClient;
    } else {
        return error("Database client not initialized");
    }
}