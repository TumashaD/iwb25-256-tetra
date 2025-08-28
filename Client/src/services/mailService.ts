import { apiCall } from "@/lib/api";
import { Http2ServerResponse } from "http2";

export type Mail = {
    sender : string,
    recipients : string[],
    subject? : string,
    body : string,
    cc? : string[],
}

export const MailService = {
    async sendMail(mail: Mail): Promise<void> {
        const response = await apiCall("/gmail/send", {
            method: "POST",
            body: JSON.stringify(mail),
        });
    },
};