import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hashedPassword = await bcrypt.hash("password", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      password: hashedPassword,
    },
  });

  console.log("Seeded test user:", testUser.email);

  const words = [
    { english: "Resilient", uzbek: "Chidamli", phonetic: "/rɪˈzɪl.jənt/", example: "She is a resilient girl." },
    { english: "Ephemeral", uzbek: "Qisqa muddatli, o'tkinchi", phonetic: "/ɪˈfem.ər.əl/", example: "Fame in the world of rock and pop is largely ephemeral." },
    { english: "Pragmatic", uzbek: "Amaliy", phonetic: "/præɡˈmæt.ɪk/", example: "In business, the pragmatic approach to problems is often more successful." },
    { english: "Inevitable", muqarrar: "Muqarrar", phonetic: "/ɪˈnev.ɪ.tə.bəl/", example: "The accident was the inevitable consequence of carelessness." },
    { english: "Ubiquitous", uzbek: "Hamma joyda bor", phonetic: "/juːˈbɪk.wɪ.təs/", example: "Leather is very much in fashion this season, as is the ubiquitous denim." },
  ];

  for (const w of words) {
    await prisma.word.create({
      data: {
        english_word: w.english,
        uzbek_translation: w.uzbek || (w as any).muqarrar,
        phonetic: w.phonetic,
        example: w.example,
      }
    });
  }

  console.log("Seeded basic words");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
