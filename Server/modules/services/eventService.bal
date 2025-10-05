import ballerinax/postgresql;
import ballerina/http;
import ballerina/log;
import ballerina/sql;
import ballerina/time;
import vinnova.supabase;

public type Event record {|
    int id;
    string title;
    string? description;
    int competition_id;
    json form_schema;
    string created_at;
    string modified_at;
|};

public type Submission record {|
    int id;
    int event_id;
    int enrollment_id;
    json submission;
    string created_at;
    string modified_at;
|};

public function createEventService(postgresql:Client dbClient, supabase:StorageClient storageClient, http:CorsConfig corsConfig, http:Interceptor authInterceptor) returns http:InterceptableService {
    return @http:ServiceConfig{cors: corsConfig} isolated service object {

        public function createInterceptors() returns http:Interceptor {
            return authInterceptor;
        }

        private final postgresql:Client db = dbClient;
        private final supabase:StorageClient storage = storageClient;
        private final string bucketName = "competitions";

        // Get all events for a competition
        isolated resource function get competitions/[int competitionId]/events(http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {
            sql:ParameterizedQuery query = `SELECT * FROM events WHERE competition_id = ${competitionId}`;
            
            stream<Event, sql:Error?> resultStream = self.db->query(query, Event);
            Event[]|error events = from Event event in resultStream
                select event;
            
            if events is error {
                log:printError("Failed to fetch events", events);
                return http:INTERNAL_SERVER_ERROR;
            }
            
            // if events.length() == 0 {
            //     return http:NOT_FOUND;
            // }

            return {"events": events};
        }

        // Create a new event
        isolated resource function post competitions/[int competitionId]/events(http:RequestContext ctx, @http:Payload json eventData) returns json|http:InternalServerError|http:BadRequest|error {
            
            // Extract and validate required fields from JSON
            json|error titleJson = eventData.title;
            json|error descriptionJson = eventData.description;
            json|error formSchemaJson = eventData.form_schema;

            if titleJson is error {
                log:printError("Missing required field: title");
                return http:BAD_REQUEST;
            }

            string title = titleJson.toString().trim();
            if title.length() == 0 {
                log:printError("Title cannot be empty");
                return http:BAD_REQUEST;
            }
            
            string description = "";
            if descriptionJson is json && descriptionJson != () {
                description = descriptionJson.toString();
            }
            
            // Create default form schema if not provided or invalid
            json defaultFormSchema = {
                "title": title,
                "description": description,
                "elements": [
                    {
                        "type": "text",
                        "name": "team_name",
                        "title": "Team Name",
                        "isRequired": true
                    },
                    {
                        "type": "comment", 
                        "name": "submission_details",
                        "title": "Submission Details",
                        "isRequired": true
                    }
                ]
            };
            
            json finalFormSchema = defaultFormSchema;
            
            // If form schema is provided, try to use it, otherwise use default
            if formSchemaJson is json && formSchemaJson != () {
                // Basic validation - check if it has some structure
                if formSchemaJson.elements is json[] {
                    json|error elementsField = formSchemaJson.elements;
                    if elementsField is json[] {
                        json[] elements = elementsField;
                        if elements.length() > 0 {
                            // Use provided schema if it has elements
                            finalFormSchema = formSchemaJson;
                        }
                    }
                } else {
                    // If no elements array, wrap the provided data in a basic structure
                    finalFormSchema = {
                        "title": title,
                        "description": description,
                        "elements": [
                            {
                                "type": "text",
                                "name": "team_name", 
                                "title": "Team Name",
                                "isRequired": true
                            },
                            {
                                "type": "comment",
                                "name": "custom_data",
                                "title": "Submission",
                                "defaultValue": formSchemaJson.toString()
                            }
                        ]
                    };
                }
            }
            
            string formSchemaStr = finalFormSchema.toJsonString();

            // Insert the event
            sql:ParameterizedQuery insertQuery = `
                INSERT INTO events (title, description, competition_id, form_schema, created_at, modified_at) 
                VALUES (${title}, ${description}, ${competitionId}, ${formSchemaStr}, NOW(), NOW())
            `;
            
            sql:ExecutionResult|error result = self.db->execute(insertQuery);
            if result is error {
                log:printError("Failed to create event", result);
                return http:INTERNAL_SERVER_ERROR;
            }

            // Get the ID of the newly created event
            int|string? lastInsertId = result.lastInsertId;
            if lastInsertId is () {
                log:printError("Failed to get last insert ID");
                return http:INTERNAL_SERVER_ERROR;
            }

            int eventId;
            if lastInsertId is int {
                eventId = lastInsertId;
            } else {
                // Try to parse string to int
                int|error parsedId = int:fromString(lastInsertId.toString());
                if parsedId is error {
                    log:printError("Failed to parse last insert ID", parsedId);
                    return http:INTERNAL_SERVER_ERROR;
                }
                eventId = parsedId;
            }

            // Fetch the newly created event
            sql:ParameterizedQuery selectQuery = `SELECT id, title, description, competition_id, form_schema, created_at, modified_at FROM events WHERE id = ${eventId}`;
            stream<Event, sql:Error?> newEventResult = self.db->query(selectQuery, Event);
            Event[]|error newEvent = from Event event in newEventResult
                                                select event;

            if newEvent is error {
                log:printError("Failed to fetch created event", newEvent);
                return http:INTERNAL_SERVER_ERROR;
            }

            if newEvent.length() == 0 {
                log:printError("Created event not found");
                return http:INTERNAL_SERVER_ERROR;
            }

            return {
                "event": newEvent[0],
                "message": "Event created successfully",
                "timestamp": time:utcNow()
            }.toJson();
            
        }

        // Get a specific event
        isolated resource function get competitions/[int competitionId]/events/[int eventId](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {
            sql:ParameterizedQuery query = `SELECT * FROM events WHERE id = ${eventId} AND competition_id = ${competitionId}`;
            
            Event|error event = self.db->queryRow(query);
            if event is error {
                log:printError("Failed to fetch event", event);
                return http:INTERNAL_SERVER_ERROR;
            }
            if event.length() == 0 {
                return http:NOT_FOUND;
            }
            
            return event;
        }

        // Update an event
        isolated resource function patch competitions/[int competitionId]/events/[int eventId](http:RequestContext ctx, @http:Payload json updateData) returns json|http:InternalServerError|http:NotFound|http:BadRequest|error {
            
            // First, fetch the existing event and verify it belongs to the competition
            sql:ParameterizedQuery selectQuery = `SELECT * FROM events WHERE id = ${eventId} AND competition_id = ${competitionId}`;
            Event|error existingEvent = self.db->queryRow(selectQuery);
            
            if existingEvent is error {
                log:printError("Failed to fetch existing event", existingEvent);
                return http:INTERNAL_SERVER_ERROR;
            }
            
            if existingEvent.length() == 0 {
                return http:NOT_FOUND;
            }

            json|error titleJson = updateData.title;
            json|error descriptionJson = updateData.description;
            json|error formSchemaJson = updateData.form_schema;
            
            // Prepare updated values with validation
            string title = titleJson is json ? titleJson.toString().trim() : existingEvent.title;
            string description = descriptionJson is json ? descriptionJson.toString() : (existingEvent.description ?: "");
            json formSchema = formSchemaJson is json ? formSchemaJson : existingEvent.form_schema;
            
            string formSchemaStr = formSchema.toJsonString();


            sql:ExecutionResult|error result = self.db->execute(`
                UPDATE events
                SET title = ${title}, description = ${description}, form_schema = ${formSchemaStr}, modified_at = NOW()
                WHERE id = ${eventId}
            `);
            
            if result is error {
                log:printError("Failed to update event", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            
            sql:ParameterizedQuery updatedQuery = `SELECT * FROM events WHERE id = ${eventId}`;
            stream<Event, sql:Error?> updatedResult = self.db->query(updatedQuery, Event);
            Event[]|error updatedArr = from Event e in updatedResult select e;

            if updatedArr is error {
                log:printError("Failed to fetch updated event", updatedArr);
                return http:INTERNAL_SERVER_ERROR;
            }

            return {
                "event": updatedArr[0],
                "message": "Event updated successfully",
                "timestamp": time:utcNow()
            }.toJson();
        }

        // Delete an event
        isolated resource function delete competitions/[int competitionId]/events/[int eventId](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {
            
            // sql:ExecutionResult|error submissionsResult = self.db->execute(`DELETE FROM submissions WHERE event_id = ${eventId}`);
            // if submissionsResult is error {
            //     log:printError("Failed to delete event submissions", submissionsResult);
            //     return http:INTERNAL_SERVER_ERROR;
            // }
            
            // Verify event belongs to competition before deletion
            sql:ParameterizedQuery checkQuery = `SELECT id FROM events WHERE id = ${eventId} AND competition_id = ${competitionId}`;
            stream<record {int event_id;}, sql:Error?> checkResult = self.db->query(checkQuery);
            record {int event_id;}[]|error existingEvent = from record {int event_id;} event in checkResult select event;

            if existingEvent is error {
                log:printError("Error checking event existence", existingEvent);
                return http:INTERNAL_SERVER_ERROR;
            }
            
            if existingEvent.length() == 0 {
                return http:NOT_FOUND;
            }
            
            // Delete the event
            sql:ExecutionResult|error result = self.db->execute(`DELETE FROM events WHERE id = ${eventId}`);
            
            if result is error {
                log:printError("Failed to delete event", result);
                return http:INTERNAL_SERVER_ERROR;
            }
            
            if result.affectedRowCount == 0 {
                return http:NOT_FOUND;
            }
            
            return {
                "message": "Event deleted successfully",
                "timestamp": time:utcNow()
            }.toJson();
        }

        // Submit a form response
        isolated resource function post competitions/[int competitionId]/submissions(http:RequestContext ctx, @http:Payload json submissionData) returns json|http:InternalServerError|http:BadRequest|error {
            // Extract and validate required fields from JSON
            json|error eventIdJson = submissionData.event_id;
            json|error enrollmentIdJson = submissionData.enrollment_id;
            json|error submissionJson = submissionData.submission;

            if eventIdJson is error {
                log:printError("Missing required field: event_id");
                return http:BAD_REQUEST;
            }
            
            if enrollmentIdJson is error {
                log:printError("Missing required field: enrollment_id");
                return http:BAD_REQUEST;
            }
            
            if submissionJson is error {
                log:printError("Missing required field: submission");
                return http:BAD_REQUEST;
            }

            // Validate and cast JSON values to appropriate types
            int|error eventIdParsed = int:fromString(eventIdJson.toString());
            if eventIdParsed is error {
                log:printError("Invalid event_id: must be a valid integer");
                return http:BAD_REQUEST;
            }
            
            int|error enrollmentIdParsed = int:fromString(enrollmentIdJson.toString());
            if enrollmentIdParsed is error {
                log:printError("Invalid enrollment_id: must be a valid integer");
                return http:BAD_REQUEST;
            }
            
            int eventId = eventIdParsed;
            int enrollmentId = enrollmentIdParsed;
            
            // Validate submission data is a proper JSON object
            if submissionJson == () {
                log:printError("Submission data cannot be null");
                return http:BAD_REQUEST;
            }
            
            // Convert to JSON string for database storage
            string submissionStr = submissionJson.toJsonString();

            // Check if submission already exists (update if exists, insert if not)
            sql:ParameterizedQuery selectQuery = `
                SELECT * FROM submissions WHERE event_id = ${eventId} AND enrollment_id = ${enrollmentId}
            `;
            stream<Submission, sql:Error?> existingSubmissionStream = self.db->query(selectQuery, Submission);
            Submission[]|error existingSubmissions = from Submission submission in existingSubmissionStream
                select submission;

            if existingSubmissions is error {
                log:printError("Failed to check existing submission", existingSubmissions);
                return http:INTERNAL_SERVER_ERROR;
            }

            if existingSubmissions.length() > 0 {
                // Update existing submission
                Submission existingSubmission = existingSubmissions[0];
                sql:ParameterizedQuery updateQuery = `
                    UPDATE submissions 
                    SET submission = ${submissionStr}, modified_at = NOW()
                    WHERE event_id = ${eventId} AND enrollment_id = ${enrollmentId}
                `;
                
                sql:ExecutionResult|error result = self.db->execute(updateQuery);
                if result is error {
                    log:printError("Failed to update submission", result);
                    return http:INTERNAL_SERVER_ERROR;
                }

                return {
                    "id": existingSubmission.id,
                    "event_id": eventId,
                    "enrollment_id": enrollmentId,
                    "submission": submissionJson,
                    "created_at": existingSubmission.created_at,
                    "modified_at": time:utcNow()
                };
            } else {
                // Insert new submission
                sql:ParameterizedQuery insertQuery = `
                    INSERT INTO submissions (event_id, enrollment_id, submission, created_at, modified_at) 
                    VALUES (${eventId}, ${enrollmentId}, ${submissionStr}, NOW(), NOW())
                `;
                
                sql:ExecutionResult|error result = self.db->execute(insertQuery);
                if result is error {
                    log:printError("Failed to create submission", result);
                    return http:INTERNAL_SERVER_ERROR;
                }

                // Get the ID of the newly created submission
                int|string? lastInsertId = result.lastInsertId;
                if lastInsertId is () {
                    log:printError("Failed to get last insert ID");
                    return http:INTERNAL_SERVER_ERROR;
                }

                int submissionId;
                if lastInsertId is int {
                    submissionId = lastInsertId;
                } else {
                    int|error parsedId = int:fromString(lastInsertId.toString());
                    if parsedId is error {
                        log:printError("Failed to parse last insert ID", parsedId);
                        return http:INTERNAL_SERVER_ERROR;
                    }
                    submissionId = parsedId;
                }

                return {
                    "id": submissionId,
                    "event_id": eventId,
                    "enrollment_id": enrollmentId,
                    "submission": submissionJson,
                    "created_at": time:utcNow(),
                    "modified_at": time:utcNow()
                };
            }
        }

        // Get submissions for an event (for organizers)
        isolated resource function get events/[int eventId]/submissions(http:RequestContext ctx) returns json|http:InternalServerError|error {
            sql:ParameterizedQuery query = `
                SELECT * FROM submissions WHERE event_id = ${eventId}`;
            stream<Submission, sql:Error?> resultStream = self.db->query(query, Submission);
            Submission[]|error submissions = from Submission submission in resultStream
                select submission;
            
            if submissions is error {
                log:printError("Failed to fetch submissions", submissions);
                return http:INTERNAL_SERVER_ERROR;
            }
            
            return {"submissions": submissions}.toJson();
        }

        // Get user's submissions for a competition
        isolated resource function get competitions/[int competitionId]/submissions/user/[int enrollmentId](http:RequestContext ctx) returns json|http:InternalServerError|error {
            sql:ParameterizedQuery query = `
                SELECT s.id, s.event_id, s.enrollment_id, s.submission, s.created_at, s.modified_at,
                       ev.title as event_title, ev.description as event_description
                FROM submissions s
                LEFT JOIN events ev ON s.event_id = ev.id
                WHERE ev.competition_id = ${competitionId} AND s.enrollment_id = ${enrollmentId}
                ORDER BY s.created_at DESC
            `;
            
            stream<record {|anydata...;|}, sql:Error?> resultStream = self.db->query(query);
            record {|anydata...;|}[]|error submissions = from record {|anydata...;|} submission in resultStream
                select submission;
            
            if submissions is error {
                log:printError("Failed to fetch user submissions", submissions);
                return http:INTERNAL_SERVER_ERROR;
            }
            
            return {"submissions": submissions}.toJson();
        }

        // Update a specific submission
        isolated resource function patch competitions/[int competitionId]/submissions/[int submissionId](http:RequestContext ctx, @http:Payload json submissionData) returns json|http:InternalServerError|http:BadRequest|http:NotFound|error {

            // fetch the existing submission
            sql:ParameterizedQuery selectQuery = `SELECT * FROM submissions WHERE id = ${submissionId}`;
            stream<Submission, sql:Error?> submissionResult = self.db->query(selectQuery, Submission);
            Submission[]|error submissionArr = from Submission s in submissionResult select s;

            if submissionArr is error {
                log:printError("Failed to fetch existing submission", submissionArr);
                return http:INTERNAL_SERVER_ERROR;
            }

            if submissionArr.length() == 0 {
                return http:NOT_FOUND;
            }

            // Extract and validate required fields from JSON
            json|error submissionJson = submissionData.submission;

            if submissionJson is error {
                log:printError("Missing required field: submission");
                return http:BAD_REQUEST;
            }

            string submissionStr = submissionJson.toJsonString();

            // Update the submission
            sql:ParameterizedQuery updateQuery = `
                UPDATE submissions 
                SET submission = ${submissionStr}, modified_at = NOW()
                WHERE id = ${submissionId}
            `;
            
            sql:ExecutionResult|error updateResult = self.db->execute(updateQuery);
            
            if updateResult is error {
                log:printError("Failed to update submission", updateResult);
                return http:INTERNAL_SERVER_ERROR;
            }

            return {
                "id": submissionId,
                "message": "Submission updated successfully",
                "modified_at": time:utcNow()
            }.toJson();
        }

        // Delete a specific submission
        isolated resource function delete competitions/[int competitionId]/submissions/[int submissionId](http:RequestContext ctx) returns json|http:InternalServerError|http:NotFound|error {

            sql:ParameterizedQuery checkQuery = `SELECT id FROM submissions WHERE id = ${submissionId}`;
            stream<record {int id;}, sql:Error?> checkResult = self.db->query(checkQuery);
            record {int id;}[]|error existingSubmission = from record {int id;} sub in checkResult select sub;

            if existingSubmission is error {
                log:printError("Failed to check existing submission", existingSubmission);
                return http:INTERNAL_SERVER_ERROR;
            }

            if existingSubmission.length() == 0 {
                return http:NOT_FOUND;
            }

            // Delete the submission
            sql:ParameterizedQuery deleteQuery = `DELETE FROM submissions WHERE id = ${submissionId}`;
            sql:ExecutionResult|error deleteResult = self.db->execute(deleteQuery);
            
            if deleteResult is error {
                log:printError("Failed to delete submission", deleteResult);
                return http:INTERNAL_SERVER_ERROR;
            }

            return {
                "message": "Submission deleted successfully",
                "timestamp": time:utcNow()
            }.toJson();
        }

        // Upload files for a submission
        isolated resource function post competitions/[int competitionId]/events/[int eventId]/submissions/[int enrollmentId]/upload(http:Request req) returns json|http:InternalServerError|http:BadRequest|http:Unauthorized|error {
            // Upload files using supabase storage
            json[]|http:Unauthorized|http:BadRequest|error uploadResult = self.storage.uploadSubmissionFiles(req, self.bucketName, competitionId, eventId, enrollmentId, true);
            
            if uploadResult is http:Unauthorized {
                return http:UNAUTHORIZED;
            } else if uploadResult is http:BadRequest {
                return http:BAD_REQUEST;
            } else if uploadResult is error {
                log:printError("Failed to upload submission files", uploadResult);
                return http:INTERNAL_SERVER_ERROR;
            } else {
                json response = {
                    "message": "Files uploaded successfully",
                    "files": <json>uploadResult,
                    "timestamp": time:utcNow()
                };
                return response;
            }
        }

        // Get uploaded files for a submission - simplified version
        isolated resource function get competitions/[int competitionId]/events/[int eventId]/submissions/[int enrollmentId]/files(http:Request req) returns json|http:Unauthorized|http:InternalServerError|error {
            // Check Authorization header
            string|http:HeaderNotFoundError authHeader = req.getHeader("Authorization");
            if authHeader is http:HeaderNotFoundError || !authHeader.startsWith("Bearer ") {
                return http:UNAUTHORIZED;
            }

            // For now, return a simple response indicating the file path structure
            // This can be enhanced later to actually list files from Supabase
            string submissionPath = string `${competitionId}/events/${eventId}/${enrollmentId}/`;
            
            json response = {
                "message": "File listing endpoint",
                "submissionPath": submissionPath,
                "timestamp": time:utcNow()
            };
            
            return response;
        }
    };
}