import ballerina/http;
import ballerina/log;
import ballerina/mime;
import ballerina/sql;
import ballerinax/postgresql;

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
    private final string supabaseStorageUrl;

    public isolated function init(string url, string anonKey, string supabaseStorageUrl) returns error? {
        self.storageClient = check new http:Client(url);
        self.supabaseAnonKey = anonKey;
        self.supabaseStorageUrl = supabaseStorageUrl;
    }

    public isolated function getClient() returns http:Client {
        return self.storageClient;
    }

    public isolated function uploadFile(http:Request req, string bucketName, string fileName, boolean overwrite = false) returns http:InternalServerError & readonly|http:Unauthorized & readonly|http:BadRequest & readonly|json|error {
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
        if overwrite {
            uploadReq.setHeader("x-upsert", "true");
        }

        log:printInfo("Uploading file to Supabase Storage", 'fileName = fileName, 'bucketName = bucketName, 'fileContentLength = fileContent.length(), 'uploadUrl = uploadUrl);

        http:Response uploadRes = check self.storageClient->post(uploadUrl, uploadReq);
        string fileUrl = self.supabaseStorageUrl + "/object/public/" + bucketName + "/" + fileName;

        json|error responseJson = {
            "url": fileUrl,
            "response": check uploadRes.getJsonPayload()
        };
        if responseJson is json {
            return responseJson;
        } else {
            log:printError("Failed to upload file", 'error = responseJson);
            return http:INTERNAL_SERVER_ERROR;
        }
    }

    public isolated function uploadAssets(http:Request req, string bucketName, string competitionId, boolean overwrite = false)
        returns json[]|http:Unauthorized & readonly|http:BadRequest & readonly|error {
        mime:Entity entity = check req.getEntity();
        string contentType = entity.getContentType();

        if (!contentType.startsWith(mime:MULTIPART_FORM_DATA)) {
            return http:BAD_REQUEST;
        }

        mime:Entity[] parts = check entity.getBodyParts();

        // Get authorization header
        string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
        if authHeader is http:HeaderNotFoundError {
            return http:UNAUTHORIZED;
        }
        if !authHeader.startsWith("Bearer ") {
            return http:UNAUTHORIZED;
        }
        string token = authHeader.substring(7);

        json[] results = [];

        foreach var part in parts {
            mime:ContentDisposition cd = part.getContentDisposition();
            if (cd.name == "files") {
                string fileName = cd.fileName != "" ? competitionId + "/assets/" + cd.fileName : competitionId + "/assets/file_" + part.getContentId();
                byte[] fileContent = check part.getByteArray();
                string fileContentType = part.getContentType();

                if (fileContent.length() == 0 || fileName == "" || bucketName == "") {
                    results.push({"src": fileName});
                    continue;
                }

                string uploadUrl = string `/object/${bucketName}/${fileName}`;
                http:Request uploadReq = new;
                uploadReq.setPayload(fileContent);
                uploadReq.setHeader("Content-Type", fileContentType);
                uploadReq.setHeader("apikey", self.supabaseAnonKey);
                uploadReq.setHeader("Authorization", "Bearer " + token);
                if overwrite {
                    uploadReq.setHeader("x-upsert", "true");
                }

                log:printInfo("Uploading file to Supabase Storage", 'fileName = fileName, 'bucketName = bucketName, 'fileContentLength = fileContent.length(), 'uploadUrl = uploadUrl);

                http:Response _ = check self.storageClient->post(uploadUrl, uploadReq);
                string fileUrl = self.supabaseStorageUrl + "/object/public/" + bucketName + "/" + fileName;
                results.push({
                    "src": fileUrl
                });

            }
        }

        return results;
    }

    public isolated function deleteAssets(http:Request req, string bucketName, string[] fileNames)
        returns http:Unauthorized|error|http:Response {

        log:printInfo("Delete request received", 'bucketName = bucketName, 'fileNames = fileNames);

        string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
        if authHeader is http:HeaderNotFoundError || !authHeader.startsWith("Bearer ") {
            return http:UNAUTHORIZED;
        }

        string token = authHeader.substring(7);

        // Loop through each file and delete
        foreach string fileName in fileNames {
            // If fileName is a URL, extract the relative path
            string relativePath = fileName.startsWith(self.supabaseStorageUrl + "/object/public/" + bucketName + "/")
                ? fileName.substring((self.supabaseStorageUrl + "/object/public/" + bucketName + "/").length())
                : fileName;

            string deleteUrl = string `/object/${bucketName}/${relativePath}`;
            log:printInfo("Deleting file from Supabase Storage", 'fileName = relativePath, 'deleteUrl = deleteUrl);
            http:Request deleteReq = new;
            deleteReq.setHeader("apikey", self.supabaseAnonKey);
            deleteReq.setHeader("Authorization", "Bearer " + token);

            http:Response|error deleteRes = self.storageClient->delete(deleteUrl, deleteReq);
            if deleteRes is http:Response {
                log:printInfo("File deleted successfully", 'fileName = relativePath, 'deleteRes = check deleteRes.getTextPayload());
            } else {
                log:printError("Failed to delete file", 'fileName = relativePath, 'error = deleteRes);
            }
        }

        // Return a success response
        http:Response res = new;
        res.setPayload({"message": "Files deleted successfully"});
        return res;
    }

    public isolated function getAssets(http:Request req, string bucketName, string competitionId)
        returns json[]|http:Unauthorized & readonly|error|http:Response {

        json[] results = [];

        // Supabase list objects endpoint
        string listUrl = string `/object/list/${bucketName}`;

        // Check Authorization header
        string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
        if authHeader is http:HeaderNotFoundError || !authHeader.startsWith("Bearer ") {
            return http:UNAUTHORIZED;
        }

        string token = authHeader.substring(7);

        // Create request with prefix in body
        http:Request listReq = new;
        listReq.setPayload({
            "prefix": string `${competitionId}/assets/`
        });
        listReq.setHeader("Authorization", "Bearer " + token);
        listReq.setHeader("apikey", self.supabaseAnonKey);

        // Call Supabase
        http:Response listRes = check self.storageClient->post(listUrl, listReq);

        // Parse response
        json|http:ClientError listJson = listRes.getJsonPayload();
        if listJson is http:ClientError {
            log:printError("Failed to parse Supabase response", listJson);
            return listRes;
        }

        json[] files = <json[]>listJson;

        foreach json file in files {
            string fileName = check file.name;
            if fileName == ".emptyFolderPlaceholder" {
                continue;
            }
            string fileUrl = string `${self.supabaseStorageUrl}/object/public/${bucketName}/${competitionId}/assets/${fileName}`;
            results.push({
                "src": fileUrl
            });
        }
        return results;
    }

    public isolated function downloadFile(string bucketName, string fileName) returns http:BadRequest & readonly|error|http:Response {
        log:printInfo("Download request received", 'bucketName = bucketName, 'fileName = fileName);
        string downloadUrl = string `/object/public/${bucketName}/${fileName}`;
        http:Response downloadRes = check self.storageClient->get(downloadUrl);
        return downloadRes;
    }

    public isolated function getPublicFileUrl(string bucketName, string fileName) returns string|error {
        log:printInfo("Get public file URL request received", 'bucketName = bucketName, 'fileName = fileName);
        string publicUrl = string `${self.supabaseStorageUrl}/object/public/${bucketName}/${fileName}`;
        return publicUrl;
    }

    public isolated function uploadSubmissionFiles(http:Request req, string bucketName, int competitionId, int eventId, int enrollmentId, boolean overwrite = false)
        returns json[]|http:Unauthorized & readonly|http:BadRequest & readonly|error {
        mime:Entity entity = check req.getEntity();
        string contentType = entity.getContentType();

        if (!contentType.startsWith(mime:MULTIPART_FORM_DATA)) {
            return http:BAD_REQUEST;
        }

        mime:Entity[] parts = check entity.getBodyParts();

        // Get authorization header
        string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
        if authHeader is http:HeaderNotFoundError {
            return http:UNAUTHORIZED;
        }
        if !authHeader.startsWith("Bearer ") {
            return http:UNAUTHORIZED;
        }
        string token = authHeader.substring(7);

        json[] results = [];

        foreach var part in parts {
            mime:ContentDisposition cd = part.getContentDisposition();
            if (cd.name == "files") {
                string fileName = cd.fileName != "" ? cd.fileName : "file_" + part.getContentId();
                string submissionPath = string `${competitionId}/events/${eventId}/${enrollmentId}/${fileName}`;
                byte[] fileContent = check part.getByteArray();
                string fileContentType = part.getContentType();

                if (fileContent.length() == 0 || fileName == "" || bucketName == "") {
                    results.push({"error": "Invalid file data", "fileName": fileName});
                    continue;
                }

                string uploadUrl = string `/object/${bucketName}/${submissionPath}`;
                http:Request uploadReq = new;
                uploadReq.setPayload(fileContent);
                uploadReq.setHeader("Content-Type", fileContentType);
                uploadReq.setHeader("apikey", self.supabaseAnonKey);
                uploadReq.setHeader("Authorization", "Bearer " + token);
                if overwrite {
                    uploadReq.setHeader("x-upsert", "true");
                }

                log:printInfo("Uploading submission file to Supabase Storage", 
                    'fileName = fileName, 
                    'bucketName = bucketName, 
                    'submissionPath = submissionPath,
                    'fileContentLength = fileContent.length(), 
                    'uploadUrl = uploadUrl);

                http:Response uploadResponse = check self.storageClient->post(uploadUrl, uploadReq);
                string fileUrl = self.supabaseStorageUrl + "/object/public/" + bucketName + "/" + submissionPath;
                
                json|error responsePayload = uploadResponse.getJsonPayload();
                if responsePayload is error {
                    log:printError("Failed to parse upload response", responsePayload);
                    results.push({
                        "fileName": fileName,
                        "url": fileUrl,
                        "status": "uploaded",
                        "error": "Response parse error"
                    });
                } else {
                    results.push({
                        "fileName": fileName,
                        "url": fileUrl,
                        "status": "uploaded",
                        "response": responsePayload
                    });
                }
            }
        }

        return results;
    }
}
