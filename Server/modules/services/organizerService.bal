import ballerinax/postgresql;
import ballerina/http;
import ballerina/log;
import ballerina/sql;
import ballerina/time;
import vinnova.supabase;
import ballerina/io;

public type LandingData record {|
    json landing_data;
|};

public type OrganizerCompetition record {|
    *Competition;
    string? landing_data?;
|};

public function createOrganizerService(postgresql:Client dbClient,supabase:StorageClient storageClient, http:CorsConfig corsConfig,http:Interceptor authInterceptor) returns http:InterceptableService {
    return @http:ServiceConfig{cors : corsConfig} isolated service object {

    public function createInterceptors() returns http:Interceptor {
        return authInterceptor;
    }

    private final postgresql:Client db = dbClient;
    private final supabase:StorageClient storage = storageClient;
    private final string bucketName = "competitions";
    private final string|io:Error initialLandingCss = io:fileReadString("../lib/landing.css");

    isolated resource function post create(http:RequestContext ctx, @http:Payload json competitionData) returns json|http:InternalServerError|http:BadRequest|error {
        
        // Extract and validate required fields from JSON
        json|error titleJson = competitionData.title;
        json|error prizePoolJson = competitionData.prize_pool;
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
        string prize_pool = prizePoolJson is error ? "" : prizePoolJson.toString();
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
            INSERT INTO competitions (title,description,prize_pool, organizer_id, start_date, end_date, category, status,
                                    created_at, updated_at) 
            VALUES (${title},${description},${prize_pool}, ${organizer_id}::uuid, 
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
        sql:ParameterizedQuery selectQuery = `SELECT id, title, description, prize_pool, organizer_id, start_date, end_date, category, status, created_at, updated_at FROM competitions WHERE id = ${competitionId}`;
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
        json|error prizePoolJson = updateData.prize_pool;
        json|error startDateJson = updateData.start_date;
        json|error endDateJson = updateData.end_date;
        json|error categoryJson = updateData.category;
        json|error statusJson = updateData.status;

        string title = titleJson !is error ? titleJson.toString() : existingCompetition.title;
        string description = descriptionJson !is error ? descriptionJson.toString() : existingCompetition.description;
        string? prize_pool = prizePoolJson !is error ? prizePoolJson.toString() : (existingCompetition.prize_pool == "" ? "" : existingCompetition.prize_pool);
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
            SET title = ${title}, description = ${description}, prize_pool = ${prize_pool}, start_date = ${start_date}::date, 
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
            } else  {
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
        sql:ParameterizedQuery query = `UPDATE competitions SET landing_data = ${landingData.toJsonString()} WHERE id = ${competitionId}`;
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

<body id="i2ak">
  <section id="idjf" class="gjs-section">
    <div id="i4ava" class="gjs-container">
      <h1 id="iuwhl">${competition.title}</h1>
      <div id="i2zgm">
        <div id="i8m42">Insert your Subtitle</div>
      </div>
    </div>
  </section>
  <section id="ialr2" class="gjs-section">
    <div id="iihkx" class="gjs-container">
      <h1 id="i21lj">Competition Details</h1>
      <div id="in1hl">
        <div id="ilydg">Everything you need to know about this exciting competition</div>
      </div>
      <div data-type-role="flex-row" id="infej" class="gjs-plg-flex-row">
        <div data-type-role="flex-column" id="i5g6d" class="gjs-plg-flex-column"><img id="ix5l8q" src="https://icxxglazqizgjnscmdqj.storage.supabase.co/storage/v1/object/public/competitions/20/assets/trophy.png"/>
          <div id="ihxun">
            <div id="i13db">Category</div>
          </div>
          <div id="i951d">
            <div id="iiupz">${competition.category}</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="i5g6d-2" class="gjs-plg-flex-column"><img id="ix5l8q-2" src="https://icxxglazqizgjnscmdqj.storage.supabase.co/storage/v1/object/public/competitions/20/assets/shuttle.png"/>
          <div id="ihxun-2">
            <div id="i13db-2">Start Date</div>
          </div>
          <div id="i951d-2">
            <div id="iiupz-2">${competition.start_date}</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="i5g6d-2-2" class="gjs-plg-flex-column"><img id="ix5l8q-2-2" src="https://icxxglazqizgjnscmdqj.storage.supabase.co/storage/v1/object/public/competitions/20/assets/flag (1).png"/>
          <div id="ihxun-2-2">
            <div id="i13db-2-2">End Date</div>
          </div>
          <div id="i951d-2-2">
            <div id="iiupz-2-2">${competition.end_date}</div>
          </div>
        </div>
      </div>
      <div id="iib15">${competition.description}</div>
    </div>
  </section>
  <section id="ialr2-2" class="gjs-section">
    <div id="iihkx-2" class="gjs-container">
      <h1 id="i21lj-2">💰 Prize Pool</h1>
      <div id="in1hl-2">
        <div id="it4e6">${competition.prize_pool ?: ""}</div>
      </div>
      <div data-type-role="flex-row" id="infej-2" class="gjs-plg-flex-row">
        <div data-type-role="flex-column" id="i5g6d-3" class="gjs-plg-flex-column">
          <div id="iumgh">
            <div id="i6t91s">🥇 1st Place</div>
          </div>
          <div id="i2mj3">
            <div id="ilk12">1st Prize</div>
          </div>
          <div id="iud3u">
            <div id="imxty">Insert your text here</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="i5g6d-3-2" class="gjs-plg-flex-column">
          <div id="i2q4g">
            <div id="ityez">🥈 2nd Place</div>
          </div>
          <div id="i8ygb">
            <div id="izcgx">2nd Prize</div>
          </div>
          <div id="iuuat">
            <div id="ixj1j">Insert your text here</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="i5g6d-3-2-2" class="gjs-plg-flex-column">
          <div id="i2egb">
            <div id="ink1l"><span id="ihfgjs">🥉 3rd Place</span></div>
          </div>
          <div id="iyk53">
            <div id="i98af">3rd Prize</div>
          </div>
          <div id="ibqyb">
            <div id="iiv5u">Insert your text here</div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section id="ialr2-2-2" class="gjs-section">
    <div id="iihkx-2-2" class="gjs-container">
      <h1 id="i21lj-2-2">Competition Timeline</h1>
      <div id="in1hl-2-2">
        <div id="i7lyv3">Important dates and milestones</div>
      </div>
      <div data-type-role="flex-row" id="icayhe" class="gjs-plg-flex-row">
        <div data-type-role="flex-column" id="i3vhz4" class="gjs-plg-flex-column">
          <div id="iq2irf">
            <div id="ijjmrb">Date</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="i5emjr" class="gjs-plg-flex-column">
          <div id="i7q3vu">
            <div id="i6221e">Milestone</div>
          </div>
          <div id="ilr5zm">
            <div id="ixn5qd">Description</div>
          </div>
        </div>
      </div>
      <div data-type-role="flex-row" id="icayhe-3" class="gjs-plg-flex-row">
        <div data-type-role="flex-column" id="i3vhz4-4" class="gjs-plg-flex-column">
          <div id="iq2irf-4">
            <div id="ijjmrb-4">Date</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="i5emjr-3" class="gjs-plg-flex-column">
          <div id="i7q3vu-3">
            <div id="ivikzj">Milestone</div>
          </div>
          <div id="ilr5zm-5">
            <div id="in1bbc">Description</div>
          </div>
        </div>
      </div>
      <div data-type-role="flex-row" id="icayhe-2" class="gjs-plg-flex-row">
        <div data-type-role="flex-column" id="i3vhz4-4-2" class="gjs-plg-flex-column">
          <div id="iq2irf-4-2">
            <div id="ijjmrb-4-2">Date</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="i5emjr-2" class="gjs-plg-flex-column">
          <div id="i7q3vu-2">
            <div id="i8snzu">Milestone</div>
          </div>
          <div id="ilr5zm-4">
            <div id="i6ghqe">Description</div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section id="ialr2-2-2-2" class="gjs-section">
    <div id="iihkx-2-2-2" class="gjs-container">
      <h1 id="i21lj-2-2-2">Contact Information</h1>
      <div id="in1hl-2-2-2">
        <div id="i52tnq">Get in touch with our organizing team</div>
      </div>
      <div data-type-role="flex-row" id="ilbavg" class="gjs-plg-flex-row">
        <div data-type-role="flex-column" id="ixzwao" class="gjs-plg-flex-column">
          <div id="ihgm7b">
            <div id="inwe25">📧</div>
          </div>
          <div id="impfeh">
            <div id="ipz9ei">Email Support</div>
          </div>
          <div id="ij1cy4">Organizer: organizer.email.com<br id="iha6t3"/>Technical: email.com</div>
        </div>
        <div data-type-role="flex-column" id="iry2ax" class="gjs-plg-flex-column">
          <div id="ia5h5v">
            <div id="iimxif">💬</div>
          </div>
          <div id="ixl21h">
            <div id="ie0qp8">Social Media</div>
          </div>
          <div id="ianlh2">Facebook: @Facebbok<br id="ifnyyc"/>LinkedIn: LinkedIn<br id="icodpo"/>Discord: Join our community
          </div>
        </div>
      </div>
      <div data-type-role="flex-row" id="iqrd2o" class="gjs-plg-flex-row">
        <div data-type-role="flex-column" id="izf9c3" class="gjs-plg-flex-column">
          <div id="icbwib">
            <div id="is0frk">📍</div>
          </div>
          <div id="iktrcv">
            <div id="iovtgh">Location</div>
          </div>
          <div id="i7s1jg">
            <div>Insert your text here</div>
          </div>
        </div>
        <div data-type-role="flex-column" id="ii3tv2" class="gjs-plg-flex-column">
          <div id="i3qzim">
            <div id="iuyxuh">📞</div>
          </div>
          <div id="ibhi5q">
            <div id="ivc2li">Mobile No</div>
          </div>
          <div id="iqlfpo">
            <div>Insert your text here</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</body>

</html>`;
        string css = string `
    * {
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
    }

    #i2ak {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }

    .gjs-container {
      width: 90%;
      margin: 0 auto;
      max-width: 1200px;
    }

    .gjs-section {
      display: flex;
      padding: 50px 0;
    }

    #idjf {
      position: relative;
      height: 56vh;
      background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('${bannerUrl}');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
    }

    #i4ava {
      max-width: 800px;
      padding: 2rem;
    }

    #iuwhl {
      font-size: 4rem;
      font-weight: 900;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      background-size: 100% 100%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: gradient 3s ease infinite;
      background-image: linear-gradient(rgba(255, 255, 255, 1) 1%, rgba(255, 255, 255, 1) 100%);
      background-position: 0px 0px;
      background-repeat: repeat;
      background-attachment: scroll;
      background-origin: padding-box;
    }

    #i2zgm {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    #ialr2 {
      background: white;
      margin: -10px 0 auto;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
      z-index: 10;
      border-bottom-right-radius: 0px;
      border-bottom-left-radius: 0px;
      border-top-width: 0px;
      border-right-width: 0px;
      border-bottom-width: 0px;
      border-left-width: 0px;
    }

    #iihkx {
      padding: 3rem;
    }

    #i21lj {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 1rem;
      text-align: center;
    }

    #in1hl {
      font-size: 1.2rem;
      color: #718096;
      text-align: center;
      margin-bottom: 3rem;
    }

    .gjs-plg-flex-column {
      flex-grow: 1;
    }

    #i5g6d {
      flex-basis: 25%;
      color: white;
      padding: 2rem;
      border-radius: 15px;
      text-align: center;
      transition: transform 0.3s ease;
      background-image: linear-gradient(0deg, rgb(30, 116, 131) 10%, rgba(255, 255, 255, 1) 79%);
      background-position: 0px 0px;
      background-size: 100% 100%;
      background-repeat: repeat;
      background-attachment: scroll;
      background-origin: padding-box;
    }

    .gjs-plg-flex-row {
      display: flex;
      align-items: stretch;
      flex-wrap: nowrap;
    }

    #infej {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    #ihxun {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    #i951d {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    #iib15 {
      text-align: center;
    }

    #i21lj-2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 2rem;
    }

    #in1hl-2 {
      font-size: 1.2rem;
      color: #718096;
      text-align: center;
      margin-bottom: 3rem;
    }

    #iumgh {
      font-size: 1.5rem;
      font-weight: 700;
      color: #4a5568;
      margin-bottom: 1rem;
    }

    #i2mj3 {
      font-size: 2rem;
      font-weight: 900;
      color: #e53e3e;
      margin-bottom: 0.5rem;
    }

    #iud3u {
      color: #718096;
      font-size: 0.9rem;
    }

    #i5g6d-3 {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    #infej-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    #iihkx-2 {
      padding: 3rem;
    }

    #ialr2-2 {
      padding: 3rem;
      text-align: center;
      background-image: linear-gradient(0deg, rgba(255, 255, 255, 1) 3%, rgba(245, 219, 126, 1) 43%, white 100%);
      background-position: 0px 0px;
      background-size: 100% 100%;
      background-repeat: repeat;
      background-attachment: scroll;
    }

    #i2q4g {
      font-size: 1.5rem;
      font-weight: 700;
      color: #4a5568;
      margin-bottom: 1rem;
    }

    #i8ygb {
      font-size: 2rem;
      font-weight: 900;
      color: #e53e3e;
      margin-bottom: 0.5rem;
    }

    #iuuat {
      color: #718096;
      font-size: 0.9rem;
    }

    #i5g6d-3-2 {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    #i2egb {
      font-size: 1.5rem;
      font-weight: 700;
      color: #4a5568;
      margin-bottom: 1rem;
    }

    #iyk53 {
      font-size: 2rem;
      font-weight: 900;
      color: #e53e3e;
      margin-bottom: 0.5rem;
    }

    #ibqyb {
      color: #718096;
      font-size: 0.9rem;
    }

    #i5g6d-3-2-2 {
      background: white;
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }

    #i21lj-2-2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 2rem;
      text-align: center;
    }

    #in1hl-2-2 {
      font-size: 1.2rem;
      color: #718096;
      text-align: center;
      margin-bottom: 3rem;
    }

    #iihkx-2-2 {
      padding: 3rem;
    }

    #ialr2-2-2 {
      padding: 3rem;
      background: #f7fafc;
      color: rgba(0, 0, 0, 1);
      background-color: rgba(255, 255, 255, 1);
    }

    #i3vhz4 {
      flex-basis: 25%;
      color: rgba(0, 0, 0, 1);
      padding: 1rem;
      border-radius: 10px;
      font-weight: 600;
      min-width: 120px;
      text-align: center;
      background-image: unset;
      background-position: unset;
      background-size: unset;
      background-repeat: unset;
      background-attachment: unset;
      background-origin: unset;
      border-top-width: 4px;
      border-right-width: 4px;
      border-bottom-width: 4px;
      border-left-width: 4px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
      border-top-style: solid;
      border-right-style: solid;
      border-bottom-style: solid;
      border-left-style: solid;
      border-top-color: rgba(98, 141, 136, 0.4);
      border-right-color: rgba(98, 141, 136, 0.4);
      border-bottom-color: rgba(98, 141, 136, 0.4);
      border-left-color: rgba(98, 141, 136, 0.4);
    }

    #i5emjr {
      flex-basis: 75%;
      margin-left: 2rem;
    }

    #icayhe {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }

    #i7q3vu {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    #ilr5zm {
      color: #718096;
    }

    #i21lj-2-2-2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: rgba(0, 0, 0, 1);
      margin-bottom: 2rem;
      text-align: center;
    }

    #i52tnq {
      color: rgba(96, 96, 96, 1);
    }

    #in1hl-2-2-2 {
      font-size: 1.2rem;
      color: rgba(225, 225, 225, 1);
      text-align: center;
      margin-bottom: 3rem;
    }

    #iihkx-2-2-2 {
      padding: 3rem;
    }

    #ialr2-2-2-2 {
      color: white;
      padding: 3rem;
      text-align: center;
      background-image: linear-gradient(0deg, rgba(31, 122, 110, 1) 10%, white 90%);
      background-position: 0px 0px;
      background-size: 100% 100%;
    }

    #ixzwao {
      flex-basis: 50%;
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    #ilbavg {
      max-width: 800px;
      margin: 2rem auto 0;
      gap: 2rem;
    }

    #ihgm7b {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    #impfeh {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    #ij1cy4 {
      opacity: 0.9;
      line-height: 1.8;
    }

    #ia5h5v {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    #ixl21h {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    #iry2ax {
      flex-basis: 50%;
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    #icbwib {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    #iktrcv {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    #i7s1jg {
      opacity: 0.9;
      line-height: 1.8;
    }

    #izf9c3 {
      flex-basis: 50%;
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    #i3qzim {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    #ibhi5q {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    #iqlfpo {
      opacity: 0.9;
      line-height: 1.8;
    }

    #ii3tv2 {
      flex-basis: 50%;
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    #iqrd2o {
      max-width: 800px;
      margin: 2rem auto 0;
      gap: 2rem;
    }

    #i13db {
      margin-top: 12px;
    }

    #ix5l8q {
      color: black;
      width: 61px;
      height: 62px;
    }

    #ix5l8q-2 {
      color: black;
      width: 61px;
      height: 62px;
    }

    #i13db-2 {
      margin-top: 12px;
    }

    #ihxun-2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    #i951d-2 {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    #i5g6d-2 {
      flex-basis: 25%;
      color: white;
      padding: 2rem;
      border-radius: 15px;
      text-align: center;
      transition: transform 0.3s ease;
      background-image: linear-gradient(0deg, rgb(30, 116, 131) 10%, rgba(255, 255, 255, 1) 79%);
      background-position: 0px 0px;
      background-size: 100% 100%;
      background-repeat: repeat;
      background-attachment: scroll;
      background-origin: padding-box;
    }

    #ix5l8q-2-2 {
      color: black;
      width: 66px;
      height: 67px;
    }

    #i13db-2-2 {
      margin-top: 12px;
    }

    #ihxun-2-2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    #i951d-2-2 {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    #i5g6d-2-2 {
      flex-basis: 25%;
      color: white;
      padding: 2rem;
      border-radius: 15px;
      text-align: center;
      transition: transform 0.3s ease;
      background-image: linear-gradient(0deg, rgb(30, 116, 131) 10%, rgba(255, 255, 255, 1) 79%);
      background-position: 0px 0px;
      background-size: 100% 100%;
      background-repeat: repeat;
      background-attachment: scroll;
      background-origin: padding-box;
    }

    #ihfgjs {
      font-size: 1.5rem;
    }

    #i7q3vu-2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    #ilr5zm-4 {
      color: #718096;
    }

    #i5emjr-2 {
      flex-basis: 75%;
      margin-left: 2rem;
    }

    #icayhe-2 {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }

    #i7q3vu-3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    #ilr5zm-5 {
      color: #718096;
    }

    #i5emjr-3 {
      flex-basis: 75%;
      margin-left: 2rem;
    }

    #icayhe-3 {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }

    #iha6t3 {
      margin: 0px;
      padding: 0px;
    }

    #ianlh2 {
      padding: 10px;
    }

    #ifnyyc {
      margin: 0px;
      padding: 0px;
    }

    #icodpo {
      margin: 0px;
      padding: 0px;
    }

    #i3vhz4-4 {
      flex-basis: 25%;
      color: rgba(0, 0, 0, 1);
      padding: 1rem;
      border-radius: 10px;
      font-weight: 600;
      min-width: 120px;
      text-align: center;
      background-image: unset;
      background-position: unset;
      background-size: unset;
      background-repeat: unset;
      background-attachment: unset;
      background-origin: unset;
      border-top-width: 4px;
      border-right-width: 4px;
      border-bottom-width: 4px;
      border-left-width: 4px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
      border-top-style: solid;
      border-right-style: solid;
      border-bottom-style: solid;
      border-left-style: solid;
      border-top-color: rgba(98, 141, 136, 0.4);
      border-right-color: rgba(98, 141, 136, 0.4);
      border-bottom-color: rgba(98, 141, 136, 0.4);
      border-left-color: rgba(98, 141, 136, 0.4);
    }

    #i3vhz4-4-2 {
      flex-basis: 25%;
      color: rgba(0, 0, 0, 1);
      padding: 1rem;
      border-radius: 10px;
      font-weight: 600;
      min-width: 120px;
      text-align: center;
      background-image: unset;
      background-position: unset;
      background-size: unset;
      background-repeat: unset;
      background-attachment: unset;
      background-origin: unset;
      border-top-width: 4px;
      border-right-width: 4px;
      border-bottom-width: 4px;
      border-left-width: 4px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
      border-top-style: solid;
      border-right-style: solid;
      border-bottom-style: solid;
      border-left-style: solid;
      border-top-color: rgba(98, 141, 136, 0.4);
      border-right-color: rgba(98, 141, 136, 0.4);
      border-bottom-color: rgba(98, 141, 136, 0.4);
      border-left-color: rgba(98, 141, 136, 0.4);
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