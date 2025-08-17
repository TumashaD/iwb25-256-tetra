import ballerinax/postgresql;
import ballerina/http;
import ballerina/log;
import ballerina/sql;
import ballerina/time;
import vinnova.supbase;
import ballerina/io;

public type LandingData record {|
    json landing_data;
|};

public type OrganizerCompetition record {|
    *Competition;
    string? landing_data?;
    string? landing_html?;
    string? landing_css?;
|};

public function createOrganizerService(postgresql:Client dbClient,supbase:StorageClient storageClient, http:CorsConfig corsConfig,http:Interceptor authInterceptor) returns http:InterceptableService {
    return @http:ServiceConfig{cors : corsConfig} isolated service object {

    public function createInterceptors() returns http:Interceptor {
        return authInterceptor;
    }

    private final postgresql:Client db = dbClient;
    private final supbase:StorageClient storage = storageClient;
    private final string bucketName = "competitions";
    private final string|io:Error initialLandingCss = io:fileReadString("../lib/landing.css");

    isolated resource function post create(http:RequestContext ctx, @http:Payload json competitionData) returns json|http:InternalServerError|http:BadRequest|error {
        
        // Extract and validate required fields from JSON
        json|error titleJson = competitionData.title;
        json|error descriptionJson = competitionData.description;
        json|error organizerIdJson = competitionData.organizer_id;
        json|error startDateJson = competitionData.start_date;
        json|error endDateJson = competitionData.end_date;
        json|error categoryJson = competitionData.category;
        json|error statusJson = competitionData.status;

        if titleJson is error || organizerIdJson is error ||  startDateJson is error || endDateJson is error || categoryJson is error || statusJson is error {
            log:printError("Missing required fields in request payload");
            return http:BAD_REQUEST;
        }

        // Cast JSON values to appropriate types
        string title = titleJson.toString();
        string description = descriptionJson is error ? "" : descriptionJson.toString();
        string organizer_id = organizerIdJson.toString();
        string start_date = startDateJson.toString();
        string end_date = endDateJson.toString();
        string category = categoryJson.toString();
        string status = statusJson.toString();

        // Validate required fields
        if title.trim() == "" || organizer_id.trim() == "" || start_date.trim() == "" || 
           end_date.trim() == "" || category.trim() == "" {
            return http:BAD_REQUEST;
        }
        
        // Insert new competition with all fields
        sql:ExecutionResult|error result = self.db->execute(`
            INSERT INTO competitions (title, description, organizer_id, start_date, end_date, category, status,
                                    created_at, updated_at) 
            VALUES (${title}, ${description}, ${organizer_id}::uuid, 
                    ${start_date}::date, ${end_date}::date, ${category}, ${status},
                    NOW(), NOW())
        `);
        
        if result is error {
            log:printError("Failed to create competition", result);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        // Get the ID of the newly created competition
        int|string? lastInsertId = result.lastInsertId;
        if lastInsertId is () {
            log:printError("Failed to get last insert ID");
            return http:INTERNAL_SERVER_ERROR;
        }
        
        int competitionId;
        if lastInsertId is int {
            competitionId = lastInsertId;
        } else {
            // Try to parse string to int
            int|error parsedId = int:fromString(lastInsertId.toString());
            if parsedId is error {
                log:printError("Failed to parse last insert ID", parsedId);
                return http:INTERNAL_SERVER_ERROR;
            }
            competitionId = parsedId;
        }
        
        // Fetch the newly created competition
        sql:ParameterizedQuery selectQuery = `SELECT id, title, description, organizer_id, start_date, end_date, category, status, created_at, updated_at FROM competitions WHERE id = ${competitionId}`;
        stream<Competition, sql:Error?> newCompetitionResult = self.db->query(selectQuery, Competition);
        Competition[]|error newCompetition = from Competition competition in newCompetitionResult
                                               select competition;
        
        if newCompetition is error {
            log:printError("Failed to fetch created competition", newCompetition);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if newCompetition.length() == 0 {
            log:printError("Created competition not found");
            return http:INTERNAL_SERVER_ERROR;
        }

        _ = start self.setInitialHtmlCss(newCompetition[0].clone());
        
        return {
            "competition": newCompetition[0],
            "message": "Competition created successfully",
            "timestamp": time:utcNow()
        }.toJson();
    }

    isolated resource function get [int competitionId](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {

        sql:ParameterizedQuery query = `SELECT * FROM competitions WHERE id = ${competitionId}`;
        stream<OrganizerCompetition, sql:Error?> competitionResult = self.db->query(query, OrganizerCompetition);
        OrganizerCompetition[]|error competitionArr = from OrganizerCompetition c in competitionResult select c;

        if competitionArr is error {
            log:printError("Failed to fetch competition", competitionArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        if competitionArr.length() == 0 {
            return http:NOT_FOUND;
        }

        competitionArr[0].banner_url = check self.storage.getPublicFileUrl(self.bucketName, string `${competitionId}/banner`);

        return {
            "competition": competitionArr[0],
            "timestamp": time:utcNow()
        }.toJson();
    }

    isolated resource function patch [int id](http:RequestContext ctx, @http:Payload json updateData) returns json|http:InternalServerError|http:NotFound|http:BadRequest|error {

        // fetch the existing competition
        sql:ParameterizedQuery selectQuery = `SELECT * FROM competitions WHERE id = ${id}`;
        stream<Competition, sql:Error?> competitionResult = self.db->query(selectQuery, Competition);
        Competition[]|error competitionArr = from Competition c in competitionResult select c;
        
        if competitionArr is error {
            log:printError("Failed to fetch existing competition", competitionArr);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if competitionArr.length() == 0 {
            return http:NOT_FOUND;
        }
        
        Competition existingCompetition = competitionArr[0];

        // Extract fields from JSON, using existing values as defaults
        json|error titleJson = updateData.title;
        json|error descriptionJson = updateData.description;
        json|error startDateJson = updateData.start_date;
        json|error endDateJson = updateData.end_date;
        json|error categoryJson = updateData.category;
        json|error statusJson = updateData.status;

        string title = titleJson !is error ? titleJson.toString() : existingCompetition.title;
        string description = descriptionJson !is error ? descriptionJson.toString() : existingCompetition.description;
        string start_date = startDateJson !is error ? startDateJson.toString() : existingCompetition.start_date;
        string end_date = endDateJson !is error ? endDateJson.toString() : existingCompetition.end_date;
        string category = categoryJson !is error ? categoryJson.toString() : existingCompetition.category;
        string status = statusJson !is error ? statusJson.toString() : existingCompetition.status;

        // Check if at least one field is provided for update (optional)
        if titleJson is error && descriptionJson is error && 
           startDateJson is error && endDateJson is error && 
           categoryJson is error && statusJson is error {
            log:printError("No valid fields provided for update");
            return http:BAD_REQUEST;
        }

        // Update competition with single query 
        sql:ExecutionResult|error result = self.db->execute(`
            UPDATE competitions 
            SET title = ${title}, description = ${description}, start_date = ${start_date}::date, 
                end_date = ${end_date}::date, category = ${category}, status = ${status}, updated_at = NOW()
            WHERE id = ${id}
        `);

        log:printInfo("Updating competition with ID: " + id.toString(), 
            title = title, 
            description = description, 
            start_date = start_date,
            end_date = end_date,
            category = category,
            status = status);

        if result is error {
            log:printError("Failed to update competition", result);
            return http:INTERNAL_SERVER_ERROR;
        }

        if result.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }

        // Fetch and return the updated competition
        sql:ParameterizedQuery updatedQuery = `SELECT * FROM competitions WHERE id = ${id}`;
        stream<Competition, sql:Error?> updatedResult = self.db->query(updatedQuery, Competition);
        Competition[]|error updatedArr = from Competition c in updatedResult select c;

        if updatedArr is error {
            log:printError("Failed to fetch updated competition", updatedArr);
            return http:INTERNAL_SERVER_ERROR;
        }

        return {
            "competition": updatedArr[0],
            "message": "Competition updated successfully",
            "timestamp": time:utcNow()
        }.toJson();
    }    
    
    isolated resource function delete [int id](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {
        // Check if the competition exists
        sql:ParameterizedQuery checkQuery = `SELECT id FROM competitions WHERE id = ${id}`;
        stream<record {int id;}, sql:Error?> checkResult = self.db->query(checkQuery);
        record {int id;}[]|error existingCompetition = from record {int id;} comp in checkResult select comp;
        
        if existingCompetition is error {
            log:printError("Error checking competition existence", existingCompetition);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if existingCompetition.length() == 0 {
            return http:NOT_FOUND;
        }
        
        // Delete the competition
        sql:ExecutionResult|error result = self.db->execute(`DELETE FROM competitions WHERE id = ${id}`);
        
        if result is error {
            log:printError("Failed to delete competition", result);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        if result.affectedRowCount == 0 {
            return http:NOT_FOUND;
        }
        
        return {
            "message": "Competition deleted successfully",
            "timestamp": time:utcNow()
        }.toJson();
    }

    isolated resource function post uploadBanner/[int competitionId](http:Request req) returns http:Unauthorized & readonly|http:InternalServerError|http:BadRequest & readonly|error |json {
        string fileName = competitionId.toString() + "/banner";
        http:InternalServerError|http:Unauthorized|http:BadRequest|json|error uploadResult = self.storage.uploadFile(req, self.bucketName, fileName,true);
        if uploadResult is http:InternalServerError {
            log:printError("Failed to upload banner");
            return uploadResult;
        } else if uploadResult is http:Unauthorized {
            return http:UNAUTHORIZED;
        } else if uploadResult is http:BadRequest {
            return http:BAD_REQUEST;
        } else if uploadResult is error {
            log:printError("Unexpected error during banner upload", uploadResult);
            return uploadResult;
        } else if uploadResult is json {
            log:printInfo("Banner uploaded successfully", fileName = fileName , uploadResult = uploadResult);
            sql:ExecutionResult|error executionResult = check self.db->execute(`
                UPDATE competitions 
                SET updated_at = NOW() 
                WHERE id = ${competitionId}
            `);
            if executionResult is error {
                log:printError("Failed to update competition banner URL", executionResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            return {
                "upload": uploadResult,
                "database": executionResult,
                "message": "Banner uploaded successfully",
                "timestamp": time:utcNow()
            }.toJson();
        }
    }

    isolated resource function post uploadAssets/[int competitionId](http:Request req) returns http:InternalServerError|http:Unauthorized|http:BadRequest|json|error|error {
        http:InternalServerError|http:Unauthorized|http:BadRequest|json|error uploadResult = check self.storage.uploadAssets(req, self.bucketName,competitionId.toString());
        if uploadResult is http:InternalServerError {
            log:printError("Failed to upload assets");
            return uploadResult;
        } else if uploadResult is http:Unauthorized {
            return http:UNAUTHORIZED;
        } else if uploadResult is http:BadRequest {
            return http:BAD_REQUEST;
        } else if uploadResult is error {
            log:printError("Unexpected error during banner upload", uploadResult);
            return uploadResult;
        } else if uploadResult is json {
            sql:ExecutionResult|error executionResult = check self.db->execute(`
                UPDATE competitions 
                SET updated_at = NOW() 
                WHERE id = ${competitionId}
            `);
            if executionResult is error {
                log:printError("Failed to update competition banner URL", executionResult);
                return http:INTERNAL_SERVER_ERROR;
            }
            return uploadResult;
        }
    }

    isolated resource function delete deleteAssets/[int competitionId](http:Request req, @http:Payload json assetUrls) returns http:InternalServerError & readonly|http:BadRequest & readonly|http:Ok & readonly|error {
        string[] assets = [];
    if assetUrls is json[] {
        foreach var item in assetUrls {
            if item is string {
                assets.push(item);
            } else {
                return http:BAD_REQUEST;
            }
        }
    } else {
        return http:BAD_REQUEST;
    }
    if assets.length() == 0 {
        return http:BAD_REQUEST;
    }

        // Delete each asset
        foreach string assetUrl in assets {
            string[] fileNames = [assetUrl];
            http:Unauthorized|http:Response|error deleteResult = check self.storage.deleteAssets(req,self.bucketName, fileNames);
            
            if deleteResult is http:Unauthorized {
                log:printError("Unauthorized to delete asset", 'assetUrl = assetUrl);
                return http:INTERNAL_SERVER_ERROR; // or http:BAD_REQUEST if more appropriate
            } else if deleteResult is error {
                log:printError("Unexpected error during asset deletion", deleteResult);
                return deleteResult;
            } else if deleteResult is http:Response {
                log:printInfo("Asset deleted successfully", 'assetUrl = assetUrl);
            }
        }

        sql:ExecutionResult|error executionResult = check self.db->execute(`
            UPDATE competitions 
            SET updated_at = NOW() 
            WHERE id = ${competitionId}
        `);
        
        if executionResult is error {
            log:printError("Failed to update competition after deleting assets", executionResult);
            return http:INTERNAL_SERVER_ERROR;
        }
        return http:OK;
    }

    isolated resource function get getAssets/[int competitionId](http:Request req) returns json[]|http:Ok & readonly|error|http:Response {
        json[]|(http:Unauthorized & readonly)|error|http:Response assets = self.storage.getAssets(req,self.bucketName, competitionId.toString());
        if assets is http:Response {
            log:printError("Failed to fetch assets", 'assets = check assets.getTextPayload());
            return assets;
        } else if assets is json[] {
            log:printInfo("Assets fetched successfully", 'assets = assets);
            return assets;
        } else if assets is error {
            log:printError("Unexpected error fetching assets", 'error = assets);
            return assets;
        }
        return http:OK;
    }

    isolated resource function post saveLandingPage/[int competitionId](http:Request req,@http:Payload json landingData) returns http:InternalServerError & readonly|map<json>|error {
        sql:ParameterizedQuery query = `UPDATE competitions SET landing_data = ${landingData.toString()} WHERE id = ${competitionId}`;
        // Execute the query and handle the result
        sql:ExecutionResult|error executionResult = check self.db->execute(query);
        if executionResult is error {
            log:printError("Failed to save landing page data", executionResult);
            return http:INTERNAL_SERVER_ERROR;
        }
        return { "success": true };
    }

    isolated resource function post publishLandingPage/[int competitionId](http:Request req,@http:Payload json landingData) returns http:InternalServerError & readonly|map<json>|error {
        string html = (check landingData.html).toString();
        string css = (check landingData.css).toString();
        sql:ParameterizedQuery query = `UPDATE competitions SET landing_html = ${html}, landing_css = ${css} WHERE id = ${competitionId}`;
        // Execute the query and handle the result
        sql:ExecutionResult|error executionResult = check self.db->execute(query);
        if executionResult is error {
            log:printError("Failed to save landing page data", executionResult);
            return http:INTERNAL_SERVER_ERROR;
        }
        return { "success": true };
    }
    isolated function setInitialHtmlCss(Competition competition) returns http:InternalServerError|error {
        string bannerUrl = check self.storage.getPublicFileUrl(self.bucketName, string `${competition.id}/banner`);
        string html = string `<!DOCTYPE html>
<html lang="en">

<head>
  <title>Competition Landing Page</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="index,follow">
  <meta name="generator" content="GrapesJS Studio">
</head>

<body>
  <div class="container"><img src="${bannerUrl}" alt="Competition Banner" class="banner"/>
    <div class="content">
      <div class="title">
        ${competition.title}
      </div>
      <div class="description">
        ${competition.description}
      </div>
      <div class="details">
        <div class="detail"><strong>Category:</strong> ${competition.category}
        </div>
        <div class="detail"><strong>Status:</strong> ${competition.status}
        </div>
        <div class="detail"><strong>Start Date:</strong> ${competition.start_date}
        </div>
        <div class="detail"><strong>End Date:</strong> ${competition.end_date}
        </div>
      </div>
      <div class="cta"><a href="/register" class="cta-btn">Register Now</a></div>
    </div>
  </div>
</body>

</html>`;
        string css = string `* {
	box-sizing: border-box;
}

body {
	margin: 0;
}

body {
	font-family: 'Segoe UI', Arial, sans-serif;
	background: #f8fafc;
	margin: 0;
	padding: 0;
	color: #222;
}

.container {
	max-width: 800px;
	margin: 40px auto;
	background: #fff;
	border-radius: 16px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
	overflow: hidden;
}

.banner {
	width: 100%;
	height: 280px;
	object-fit: cover;
	background: #e2e8f0;
	display: block;
}

.content {
	padding: 32px;
}

.title {
	font-size: 2.5rem;
	font-weight: 700;
	margin-bottom: 12px;
	color: #2563eb;
}

.description {
	font-size: 1.2rem;
	margin-bottom: 24px;
	color: #374151;
}

.details {
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	margin-bottom: 24px;
}

.detail {
	flex: 1 1 200px;
	background: #f1f5f9;
	border-radius: 8px;
	padding: 16px;
	font-size: 1rem;
	color: #334155;
}

.cta {
	display: block;
	width: 100%;
	text-align: center;
	margin-top: 32px;
}

.cta-btn {
	background: #2563eb;
	color: #fff;
	padding: 16px 32px;
	border: none;
	border-radius: 8px;
	font-size: 1.2rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;
	text-decoration: none;
}

.cta-btn:hover {
	background: #1e40af;
}`;        
        sql:ParameterizedQuery query = `UPDATE competitions SET landing_html = ${html}, landing_css = ${css} WHERE id = ${competition.id}`;
        sql:ExecutionResult|error result = check self.db->execute(query);

        if result is error {
            log:printError("Failed to update landing page HTML/CSS", result);
            return http:INTERNAL_SERVER_ERROR;
        }
        
        return {};
    }

};
}