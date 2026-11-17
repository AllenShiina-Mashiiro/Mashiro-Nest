import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL?.trim() || "admin@mashiro.dev").toLowerCase();
  const username = (process.env.ADMIN_USERNAME?.trim() || "admin").toLowerCase();
  const displayName = process.env.ADMIN_NAME?.trim() || "Site Admin";
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email.includes("@") || !email.split("@")[1]?.includes(".")) {
    throw new Error("ADMIN_EMAIL_INVALID: set a valid ADMIN_EMAIL");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD_REQUIRED: set ADMIN_PASSWORD to at least 12 characters");
  }
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    throw new Error("ADMIN_USERNAME_INVALID: use 3-20 letters, numbers, underscores or hyphens");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "ADMIN") {
      console.log("Administrator already exists: " + email + ". No account or password was changed.");
      return;
    }
    throw new Error("ADMIN_EMAIL_ALREADY_REGISTERED: " + email + " belongs to a normal user. Review it manually before granting administrator privileges.");
  }

  const usernameOwner = await prisma.user.findUnique({ where: { username } });
  if (usernameOwner) {
    throw new Error("ADMIN_USERNAME_TAKEN: " + username + " is already in use. Set ADMIN_USERNAME to another value.");
  }

  await prisma.user.create({
    data: { email, username, displayName, passwordHash: await hash(password, 12), role: "ADMIN" },
  });

  console.log("Administrator created successfully.");
  console.log("Email: " + email);
  console.log("Password: read from ADMIN_PASSWORD; it is not printed for safety.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
