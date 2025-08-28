import ballerina/http;
import ballerina/log;
import ballerinax/googleapis.gmail;

public function createGmailService(gmail:Client gmail, http:CorsConfig corsConfig) returns http:Service {
    return @http:ServiceConfig {cors: corsConfig} isolated service object {
        isolated resource function post send(@http:Payload json msg) returns http:BadRequest & readonly|json & readonly|error{
            json|error recipients = msg.recipients;
            json|error sender = msg.sender;
            json|error subject = msg.subject;
            json|error cc = msg.cc;
            json|error body = msg.body;
            if (recipients is error || sender is error || body is error) {
                return error("Invalid payload structure");
            }
            string[] recips = [];
            if recipients is json[]{
                foreach var recipient in recipients {
                    if recipient is string{
                        recips.push(recipient);
                    } else {
                        return http:BAD_REQUEST;
                    }
                }
            }

            string[] ccs = [];
            if cc is json[]{
                foreach var c in cc {
                    if c is string{
                        ccs.push(c);
                    }
                }
            } else {
                ccs.push("");
            }


            gmail:MessageRequest message = {
                to: recips,
                'from: sender.toString(),
                subject: subject is error ? "" : subject.toString(),
                cc: ccs,
                bodyInText: body.toString()
            };
            gmail:Message sendResult = check gmail->/users/me/messages/send.post(message);
            log:printInfo("Email sent with ID: " + sendResult.id);
            return {
                status: "success",
                message: "Email sent successfully"
            };
        }
    };
}