import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function check() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:", users);

  // Check if we can verify the password manually
  if (users.length > 0) {
      const user = users[0];
      const bcrypt = require("bcryptjs");
      const isValid = await bcrypt.compare("password", user.password);
      console.log(`Password "password" matches:`, isValid);
  } else {
      console.log("No users found! Seed must have failed.");
  }
}
check().finally(() => process.exit(0));
