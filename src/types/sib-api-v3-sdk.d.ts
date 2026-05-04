declare module 'sib-api-v3-sdk' {
  export namespace ApiClient {
    export const instance: any;
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<any>;
  }

  export class SendSmtpEmail {
    sender: {
      name: string;
      email: string;
    };
    to: Array<{
      email: string;
    }>;
    templateId: number;
    params: Record<string, any>;
  }
}
