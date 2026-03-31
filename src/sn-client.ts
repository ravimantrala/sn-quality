interface SnClientConfig {
  instance: string;
  username: string;
  password: string;
}

interface QueryParams {
  table: string;
  query?: string;
  fields?: string[];
  limit?: number;
}

interface SnRecord {
  sys_id: string;
  [key: string]: string;
}

class SnClient {
  private config: SnClientConfig;

  constructor(config: SnClientConfig) {
    this.config = config;
  }

  private get authHeader(): string {
    const creds = Buffer.from(
      `${this.config.username}:${this.config.password}`
    ).toString("base64");
    return `Basic ${creds}`;
  }

  private get baseUrl(): string {
    return `${this.config.instance}/api/now/table`;
  }

  async query(params: QueryParams): Promise<SnRecord[]> {
    const url = new URL(`${this.baseUrl}/${params.table}`);
    if (params.query) url.searchParams.set("sysparm_query", params.query);
    if (params.fields)
      url.searchParams.set("sysparm_fields", params.fields.join(","));
    if (params.limit)
      url.searchParams.set("sysparm_limit", String(params.limit));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `SN query failed: ${res.status} ${res.statusText} — ${body}`
      );
    }

    const data = (await res.json()) as { result: SnRecord[] };
    return data.result;
  }

  async getRecord(table: string, sysId: string): Promise<SnRecord> {
    const res = await fetch(`${this.baseUrl}/${table}/${sysId}`, {
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`SN get failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { result: SnRecord };
    return data.result;
  }

  async insert(
    table: string,
    record: Record<string, string>
  ): Promise<SnRecord> {
    const res = await fetch(`${this.baseUrl}/${table}`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SN insert failed: ${res.status} — ${body}`);
    }

    const data = (await res.json()) as { result: SnRecord };
    return data.result;
  }

  async update(
    table: string,
    sysId: string,
    fields: Record<string, string>
  ): Promise<SnRecord> {
    const res = await fetch(`${this.baseUrl}/${table}/${sysId}`, {
      method: "PATCH",
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      throw new Error(`SN update failed: ${res.status}`);
    }

    const data = (await res.json()) as { result: SnRecord };
    return data.result;
  }

  async deleteRecord(table: string, sysId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/${table}/${sysId}`, {
      method: "DELETE",
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`SN delete failed: ${res.status}`);
    }
  }
}

function createSnClient(): SnClient {
  const instance = process.env.SN_INSTANCE;
  const username = process.env.SN_USER;
  const password = process.env.SN_PASSWORD;

  if (!instance || !username || !password) {
    throw new Error(
      "Missing SN_INSTANCE, SN_USER, or SN_PASSWORD environment variables"
    );
  }

  return new SnClient({ instance, username, password });
}

export { SnClient, SnRecord, QueryParams, createSnClient };
