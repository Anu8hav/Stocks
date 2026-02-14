/**
 * Database Connection Test
 * Run this file to test your MongoDB connection
 * 
 * Usage: npx ts-node lib/test-db.ts
 * or: node -r ts-node/register lib/test-db.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function testDatabaseConnection() {
  console.log("🔍 Starting database connection test...\n");

  // Step 1: Check environment variable
  console.log("Step 1: Checking MONGO_URI environment variable...");
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in .env file");
    console.log("\n📝 Fix: Add MONGO_URI to your .env.local file:");
    console.log("   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname");
    process.exit(1);
  }
  console.log("✅ MONGO_URI found");
  console.log(`   URI: ${MONGO_URI.replace(/\/\/.*@/, "//***:***@")}\n`); // Mask credentials

  // Step 2: Check if mongoose is available
  console.log("Step 2: Checking mongoose package...");
  console.log(`✅ Mongoose version: ${mongoose.version}\n`);

  // Step 3: Attempt connection
  console.log("Step 3: Attempting to connect to MongoDB...");
  try {
    await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
    });
    console.log("✅ Successfully connected to MongoDB!\n");

    // Step 4: Get connection details
    console.log("Step 4: Connection Details:");
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   State: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}\n`);

    // Step 5: Test a simple operation
    console.log("Step 5: Testing database operations...");
    const admin = mongoose.connection.db?.admin();
    if (admin) {
      const status = await admin.ping();
      console.log("✅ Database ping successful:", status, "\n");
    }

    // Step 6: List databases (optional)
    console.log("Step 6: Available databases:");
    if (admin) {
      const databases = await admin.listDatabases();
      databases.databases.slice(0, 5).forEach((db) => {
        const size = db.sizeOnDisk ? (db.sizeOnDisk / 1024 / 1024).toFixed(2) : "0";
        console.log(`   - ${db.name} (${size} MB)`);
      });
      if (databases.databases.length > 5) {
        console.log(`   ... and ${databases.databases.length - 5} more`);
      }
    }

    console.log("\n✅ All tests passed! Your database connection is working correctly.");
  } catch (error) {
    console.error("❌ Connection failed!\n");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      console.error("\nPossible fixes:");

      if (error.message.includes("ENOTFOUND")) {
        console.log("  - Check your MONGO_URI hostname");
        console.log("  - Verify your internet connection");
      } else if (error.message.includes("authentication failed")) {
        console.log("  - Check your MongoDB username and password");
        console.log("  - Verify you're using the correct connection string");
      } else if (error.message.includes("IP whitelist")) {
        console.log("  - Add your IP address to MongoDB Atlas IP whitelist");
        console.log("  - Go to: https://cloud.mongodb.com > Security > Network Access");
      }
    }
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log("\n🔌 Connection closed.");
  }
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
