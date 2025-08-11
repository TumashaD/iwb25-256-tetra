import ballerinax/postgresql;
import ballerina/sql;
import ballerina/http;
import ballerina/mime;
import ballerina/log;

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

public isolated class StorageClient {
    private final http:Client storageClient;
    private final string supabaseAnonKey;

    public isolated function init(string url, string anonKey) returns error? {
        self.storageClient = check new http:Client(url);
        self.supabaseAnonKey = anonKey;
    }

    public isolated function getClient() returns http:Client {
        return self.storageClient;
    }

    public isolated function uploadFile(http:Request req,string bucketName,string fileName) returns http:InternalServerError & readonly|http:Unauthorized & readonly|http:BadRequest & readonly|json|error{
        mime:Entity entity = check req.getEntity();

        string contentType = entity.getContentType();

         if (!contentType.startsWith(mime:MULTIPART_FORM_DATA)) {
            return http:BAD_REQUEST;
        }

        mime:Entity[] parts = check entity.getBodyParts();

        byte[] fileContent = [];

        foreach var part in parts {
            mime:ContentDisposition cd = part.getContentDisposition();
            if (cd.name == "file") {
                fileContent = check part.getByteArray();
                contentType = part.getContentType();
            }
        }

        if (fileContent.length() == 0 || fileName == "" || bucketName == "") {
            return http:BAD_REQUEST;
        }

        // Get authorization header
        string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
        if authHeader is http:HeaderNotFoundError {
            return http:UNAUTHORIZED;
        }
        if !authHeader.startsWith("Bearer ") {
            return http:UNAUTHORIZED;
        }
        string token = authHeader.substring(7);

        // Upload file using http client
        string uploadUrl = string `/object/${bucketName}/${fileName}`;

        http:Request uploadReq = new;
        uploadReq.setPayload(fileContent);
        uploadReq.setHeader("Content-Type", contentType);
        uploadReq.setHeader("apikey", self.supabaseAnonKey);
        uploadReq.setHeader("Authorization", "Bearer " + token);

        log:printInfo("Uploading file to Supabase Storage", 'fileName = fileName, 'bucketName = bucketName, 'fileContentLength = fileContent.length(), 'uploadUrl = uploadUrl);

        http:Response uploadRes = check self.storageClient->post(uploadUrl, uploadReq);

        json|error responseJson = uploadRes.getJsonPayload();
        if responseJson is json {
            return responseJson;
        } else {
            return http:INTERNAL_SERVER_ERROR;
        }
    }

    public isolated function downloadFile(string bucketName, string fileName) returns http:BadRequest & readonly|error|http:Response {
        log:printInfo("Download request received", 'bucketName = bucketName, 'fileName = fileName);
        string downloadUrl = string `/object/public/${bucketName}/${fileName}`;
        http:Response downloadRes = check self.storageClient->get(downloadUrl);
        return downloadRes;
}

}