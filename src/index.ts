import axios, { AxiosInstance } from "axios";
import { Comuni } from "./Services/Comuni";
import { Imprese } from "./Services/Imprese";
import { isServiceInScopes } from "./utils";

export type Environment = 'test'| 'production';

type ValidHttpMethod = 'GET' |'POST' | 'UPDATE' | 'PATCH' | 'DELETE';
export interface ScopeObject {
    domain: string;
    method: string;
    mode: ValidHttpMethod;
}

export type ServiceName = 'comuni' | 'imprese';
export interface Service {
    client: AxiosInstance;
    service: ServiceName;
    baseUrl: string;
    environment: Environment;
}

class OpenApi {
    client?: AxiosInstance;
    environment: Environment;
    token?: string;
    username: string;
    apiKey: string;
    autoRenew: boolean;
    scopes: Array<ScopeObject> = [];

    comuni?: Comuni;
    imprese?: Imprese;

    constructor(environment: Environment, username: string, apiKey: string, autoRenew = true) {
        this.username = username;
        this.apiKey = apiKey;
        this.environment = environment;
        this.autoRenew = autoRenew;
    }
    
    /**
     * Crea il client di connessione con OpenApi
     * Se l'autoRenew è attivo, controllerá lo stato del token
     * prima di istanziare il client, ed in caso lo rinnoverà
     */
    async createClient(token: string) {
        this.token = token;
        
        try {
            const tokenData = await axios.get(this.getOauthUrl() + '/token/' + token, { 
                auth: { username: this.username, password: this.apiKey }
            });

            
            if (tokenData.status === 200 ) {
                if (!this.scopes.length) {
                    const scopes: Array<any> = tokenData.data.data[0].scopes;
                    scopes.forEach(scope => {
                        const url = scope.split(':', 2)[1].split('/', 2);
                        //@ts-ignore
                        this.scopes.push({ mode: scope.split(':', 1), domain: url[0], method: url[1] });
                    })
                }

                if (this.autoRenew && tokenData.data.data[0].expire < ((Math.floor(Date.now() / 1000) + (86400 * 15)))) {
                    await this.renewToken(this.token);
                }
            }
            

            else if (tokenData.status === 204) {
                throw 'The provided token does not exists or it was deleted'
            }
        } catch (err) {
            throw err;
        }

        this.client = axios.create({
            headers: { 'Authorization': 'Bearer ' + this.token }
        });

        [Comuni, Imprese].forEach(service => {
            //@ts-ignore
            const s = new service(this.scopes, this.client, this.environment);
            if (isServiceInScopes(this.scopes, s.baseUrl)) {
                //@ts-ignore
                this[s.service] = s;
            }
        });
        
        return this;
    }
    
    async renewToken(token: string) {
        return await axios.patch(this.getOauthUrl() + '/token/' + token, { expire: 86400 + 365 }, {
            auth: { username: this.username, password: this.apiKey }
        });
    }

    /**
     * Genera un token 
     * @param expire il timestap di scadenza del token, default: un anno
     */
    async generateToken(scopes: Array<string>, expire: number = 86400 * 365): Promise<string> {
        if (!this.username || !this.apiKey) throw 'username and apiKey needed';
        const prefix = this.environment === 'test'? 'test.' : '';
        let requestScopes: Array<string> = [];

        scopes.forEach(scope => {
            const url = scope.split(':', 2)[1].split('/', 2);
            //@ts-ignore
            this.scopes.push({ mode: scope.split(':', 1), domain: url[0], method: url[1] });
            requestScopes.push(`${scope.split(':', 1)}:${prefix}${url[0]}/${url[1]}`)
        });

        try {
            const res: any = await axios.post(this.getOauthUrl() + '/token', JSON.stringify({ scopes: requestScopes, expire }), {
                auth: { username: this.username, password: this.apiKey }
            });
            

            if (!res?.data?.success) throw 'Server responded with a status error';
            return res.data.token;

        } catch(err) {
            throw err;
        }
    }

    getOauthUrl() {
        return 'https://'+( this.environment === 'test' ? 'test.': '') +'oauth.altravia.com';
    }
}

export default OpenApi;