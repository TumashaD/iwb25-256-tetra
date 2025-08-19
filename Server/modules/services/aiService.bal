import ballerina/http;
import ballerina/log;
import ballerina/time;
import ballerinax/postgresql;
import ballerina/sql;

public type AIRequest record {
    int? competitionId;
    string question;
};

public type AIResponse record {
    string answer;
    string timestamp;
};

public function createAIService(postgresql:Client dbClient, string geminiApiKey, http:CorsConfig corsConfig) returns http:Service {
    return @http:ServiceConfig{cors: corsConfig} isolated service object {
        private final postgresql:Client db = dbClient;
        private final string apiKey = geminiApiKey;

        isolated resource function post ask(@http:Payload json requestBody) returns json|http:InternalServerError|http:BadRequest|error {
            // Extract question from request body
            json|error questionResult = requestBody.question;
            if questionResult is error {
                return http:BAD_REQUEST;
            }
            string question = questionResult.toString();
            
            // Validate input
            if question.trim() == "" {
                return http:BAD_REQUEST;
            }

            string context = "";
            
            // If competitionId is provided, fetch competition details for context
            json|error competitionIdResult = requestBody.competitionId;
            if competitionIdResult is json && competitionIdResult is int {
                int competitionId = <int>competitionIdResult;
                sql:ParameterizedQuery query = `SELECT title, description, category, start_date, end_date, status FROM competitions WHERE id = ${competitionId}`;
                stream<record {}, sql:Error?> competitionResult = self.db->query(query);
                record {}[]|error competitionArr = from record {} competition in competitionResult
                                                   select competition;
                
                if competitionArr is record {}[] && competitionArr.length() > 0 {
                    record {} comp = competitionArr[0];
                    context = string `Competition Details:
                                        Title: ${comp["title"].toString()}
                                        Description: ${comp["description"].toString()}
                                        Category: ${comp["category"].toString()}
                                        Start Date: ${comp["start_date"].toString()}
                                        End Date: ${comp["end_date"].toString()}
                                        Status: ${comp["status"].toString()}

                                        `;
                }
            }
            
            // Prepare the prompt for Gemini
            string prompt = context + "User Question: " + question + 
                           "\n\nPlease provide a helpful and informative answer based on the competition context provided above.";
            
            // Call Gemini API
            string|error aiResponse = self.callGeminiAPI(prompt);
            if aiResponse is error {
                log:printError("Failed to get AI response", aiResponse);
                return http:INTERNAL_SERVER_ERROR;
            }

            return {
                answer: aiResponse,
                timestamp: time:utcNow()[0].toString()
            };
        }

        isolated function callGeminiAPI(string prompt) returns string|error {
            http:Client geminiClient = check new ("https://generativelanguage.googleapis.com");
            
            json geminiRequest = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ]
            };

            http:Response|error response = geminiClient->post(
                string `/v1beta/models/gemini-1.5-flash:generateContent?key=${self.apiKey}`,
                geminiRequest,
                {
                    "Content-Type": "application/json"
                }
            );
            
            if response is error {
                return response;
            }

            if response.statusCode != 200 {
                string errorMsg = string `Gemini API error: ${response.statusCode}`;
                log:printError(errorMsg);
                return error(errorMsg);
            }

            json|error responseBody = response.getJsonPayload();
            if responseBody is error {
                return responseBody;
            }

            // Extract the generated text from Gemini response
            json candidates = check responseBody.candidates;
            if candidates is json[] && candidates.length() > 0 {
                json firstCandidate = candidates[0];
                json content = check firstCandidate.content;
                json parts = check content.parts;
                if parts is json[] && parts.length() > 0 {
                    json firstPart = parts[0];
                    string generatedText = check firstPart.text;
                    return generatedText;
                }
            }
            
            return "I'm sorry, I couldn't generate a response at this time.";
        }
    };
}
