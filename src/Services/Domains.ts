import { AxiosInstance } from "axios";
import { Environment, Service,} from "..";
import { getBaseUrl } from "../utils";

interface DomainRegistration {
  domain?: string;
  registrant?: string;
  admin?: string;
  tech?: string[];
  dns?: string[];
}

interface Domain {
  status: string[];
  domain: string;
  ns: string[];
  registrant: string;
  admin: string;
  tech: string;
  authinfo: string;
  crDate: string;
  exDate: string;
  dnssec: any[];
  owner: string;
  timestamp: number;
  renewal_date: string;
}

interface ContactRequest {
  name?: string;
  org?: string;
  street?: string;
  city?: string;
  province?: string;
  postalcode?: string;
  countrycode?: string;
  voice?: string;
  email?: string;
  nationalitycode?: string;
}

interface Contact {
  status: string[];
  handle: string;
  name: string;
  org: string;
  street: string;
  street2: string;
  street3: string;
  city: string;
  province: string;
  postalcode: string;
  countrycode: string;
  voice: string;
  fax: string;
  email: string;
  authinfo: string;
  consentforpublishing: number;
  nationalitycode: string;
  entitytype: number;
  regcode: string;
  schoolcode: string;
  owner: string;
  timestamp: number;
}

export class Domains implements Service {
    client: AxiosInstance;
    readonly service = 'domains';
    readonly baseUrl = 'domains.altravia.com';
    environment: Environment

    constructor(client: AxiosInstance, environment: Environment) {
        this.client = client;
        this.environment = environment;
    }

    async checkAvailability(domain: string) {
        return await (await this.client.get(this.url + '/check/' + domain)).data;
    }

    async listDomains(): Promise<string[]> {
        return await (await this.client.get(this.url + '/domain')).data.data;
    }

    async registerDomain(data: DomainRegistration) {
        return await (await this.client.post(this.url + '/domain', JSON.stringify(data))).data;
    }

    async getDomain(domain: string): Promise<Domain> {
        return await (await this.client.get(this.url + '/domain/' + domain)).data.data;
    }

    async updateDomain(domain: string, data: DomainRegistration): Promise<Domain> {
        return await (await this.client.put(this.url + '/domain/' + domain, JSON.stringify(data))).data.data;
    }

    async deleteDomain(domain: string): Promise<Domain> {
        return await (await this.client.delete(this.url + '/domain/' + domain)).data.data;
    }

    async deleteTech(domain: string, techId: string): Promise<Domain> {
        return await (await this.client.delete(this.url + '/domain/' + domain + '/tech/' + techId)).data.data;
    }

    // Contacts
    async listContacts(): Promise<string[]> {
        return await (await this.client.get(this.url + '/contact')).data.data;
    }
    async createContact(data: ContactRequest) {
        return await (await this.client.post(this.url + '/contact', JSON.stringify(data))).data;
    }

    async getContact(id: string): Promise<Contact> {
        return await (await this.client.get(this.url + '/contact/' + id)).data.data;
    }

    async updateContact(id: string, data: ContactRequest) {
        return await (await this.client.put(this.url + '/contact/' + id, JSON.stringify(data))).data;
    }

    async deleteContact(id: string) {
        return await (await this.client.delete(this.url + '/contact/' + id)).data.data;
    }


    get url() {
        return getBaseUrl(this.environment, this.baseUrl)
    }
}
