import http, { RequestOptions } from 'https';
import { IncomingMessage } from 'http';
import { Service } from 'typedi';
import { URL } from 'url';

interface Response<T> {
    response: IncomingMessage;
    body: T;
}

@Service()
export class Request {
    get<T>(url: URL | string, options?: RequestOptions): Promise<Response<T>> {
        return this.doRequest<T>(url, options);
    }

    post<T>(url: URL | string, body?: any, options: RequestOptions = {}): Promise<Response<T>> {
        return this.doRequest<T>(url, { method: 'POST', ...options }, body);
    }

    private doRequest<T>(url: URL | string, options: RequestOptions, body?: any): Promise<Response<T>> {
        return new Promise((resolve, reject) => {
            try {
                const request = http.request(url, options, async (res: IncomingMessage) => {
                    const responseBody = await this.parseResponse<T>(res);

                    if (res.statusCode >= 400) {
                        reject({ response: res, body: responseBody });
                    } else {
                        resolve({ response: res, body: responseBody as T });
                    }
                });

                if (body) {
                    request.write(JSON.stringify(body));
                }

                request.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    private parseResponse<T>(res: IncomingMessage): Promise<T | string> {
        return new Promise((resolve, reject) => {
            let responseString = '';

            res.setEncoding('utf-8');

            res.on('data', (chunk: string) => {
                responseString += chunk;
            });

            res.on('error', err => {
                console.error(err);
            });

            res.on('end', () => {
                try {
                    const responseData = JSON.parse(responseString);
                    resolve(responseData as T);
                } catch (e) {
                    resolve(responseString);
                }
            });
        });
    }
}