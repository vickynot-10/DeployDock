import { MongoClient, Db } from "mongodb";
import { configDotenv } from "dotenv";
import { APP_CONSTANTS } from "../app.constants";
configDotenv();
const uri = process.env.MONGODB_URI as string;

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

let client: MongoClient;
let db: Db;

export async function connectMongoDB(dbName?: string): Promise<Db> {
  const name = dbName || "deployer";

  if (clients.has(name)) {
    return clients.get(name)!;
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(name);
  clients.set(name, db);

  await db.collection("users").createIndex(
    {
      email: 1,
    },
    { unique: true },
  );



  console.log(`MongoDB connected: ${name}`);
  return db;
}

export async function getDb(dbName?: string): Promise<Db> {
  const name = dbName || "deployer";
  if (clients.has(name)) return clients.get(name)!;
  return await connectMongoDB(name);
}

const clients: Map<string, Db> = new Map();
const initializedCollections: Set<string> = new Set();

export async function createTenantDeployLogs(tenant_id: string) {
  const cacheKey = `tenant_${tenant_id}:deploy_logs`;

  if (initializedCollections.has(cacheKey)) {
    return await connectMongoDB(`tenant_${tenant_id}`);
  }

  const tenantDb = await connectMongoDB(`tenant_${tenant_id}`);
  const collections = await tenantDb
    .listCollections({ name: "deploy_logs" })
    .toArray();

  if (collections.length === 0) {
    await tenantDb.createCollection("deploy_logs", {
      timeseries: {
        timeField: "deployed_at",
        metaField: "meta",
        granularity: "seconds",
      },
    });
  }

   await tenantDb.collection("deployments").createIndex(
    { fk_project_id: 1 },
    {
      unique: true,
      partialFilterExpression: {
        status: APP_CONSTANTS.DEPLOYMENT_STATUS.RUNNING,
      },
      name: "unique_running_deployment_per_project",
    },
  );

  initializedCollections.add(cacheKey);
  return tenantDb;
}

export async function createRunTimeDeployLogs(tenant_id: string) {
  const cacheKey = `tenant_${tenant_id}:runtime_logs`;

  if (initializedCollections.has(cacheKey)) {
    return await connectMongoDB(`tenant_${tenant_id}`);
  }

  const tenantDb = await connectMongoDB(`tenant_${tenant_id}`);
  const collections = await tenantDb
    .listCollections({ name: "runtime_logs" })
    .toArray();

  if (collections.length === 0) {
    await tenantDb.createCollection("runtime_logs", {
      timeseries: {
        timeField: "timestamp",
        metaField: "meta",
        granularity: "seconds",
      },
    });
  }

  initializedCollections.add(cacheKey);
  return tenantDb;
}

export async function createWebhookLogs(tenant_id: string) {
  const cacheKey = `tenant_${tenant_id}:webhook_logs`;

  if (initializedCollections.has(cacheKey)) {
    return await connectMongoDB(`tenant_${tenant_id}`);
  }

  const tenantDb = await connectMongoDB(`tenant_${tenant_id}`);
  const collections = await tenantDb
    .listCollections({ name: "webhook_logs" })
    .toArray();

  if (collections.length === 0) {
    await tenantDb.createCollection("webhook_logs", {
      timeseries: {
        timeField: "timestamp",
        metaField: "meta",
        granularity: "seconds",
      },
    });
  }

  initializedCollections.add(cacheKey);
  return tenantDb;
}
