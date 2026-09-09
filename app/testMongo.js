const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  "mongodb+srv://YOUR_USERNAME:YOUR_NEW_PASSWORD@cluster0.jzcboq6.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("✅ MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Error:", error);
  } finally {
    await client.close();
  }
}

run();