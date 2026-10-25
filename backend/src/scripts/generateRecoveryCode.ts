import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../db/prisma";
import { normalizeEmailAddress } from "../utils/email";
import {
  RECOVERY_CODE_TTL_MS,
  createRecoveryCode,
  normalizeRecoveryCode,
} from "../utils/recoveryCode";

const main = async () => {
  const emailArg = process.argv[2];

  if (!emailArg) {
    console.error(
      "Usage: npx ts-node src/scripts/generateRecoveryCode.ts <email>",
    );
    process.exitCode = 1;
    return;
  }

  const email = normalizeEmailAddress(emailArg);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found for ${email}`);
    process.exitCode = 1;
    return;
  }

  const code = createRecoveryCode();
  const recoveryCodeHash = await bcrypt.hash(
    normalizeRecoveryCode(code),
    10,
  );
  const recoveryCodeExpiresAt = new Date(Date.now() + RECOVERY_CODE_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { recoveryCodeHash, recoveryCodeExpiresAt },
  });

  console.log(`Recovery code for ${user.email}: ${code}`);
  console.log(`Expires: ${recoveryCodeExpiresAt.toISOString()}`);
  await prisma.$disconnect();
};

void main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
