import ballerinax/postgresql;
import ballerina/sql;

public isolated class DatabaseClient {
    private final postgresql:Client|sql:Error dbClient;

    public isolated function init(string host, int port, string user, string password, string database) {
        self.dbClient = new postgresql:Client(
            host = host,
            port = port,
            username = user,
            password = password,
            database = database
        );
    }

    public isolated function getClient() returns postgresql:Client|sql:Error {
        return self.dbClient;
    }
}