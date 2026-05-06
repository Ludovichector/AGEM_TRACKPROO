import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dummyPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  
  await prisma.report.updateMany({
    data: { fileUrl: dummyPdf }
  });

  await prisma.clientValidation.updateMany({
    data: { documentUrl: dummyPdf }
  });
  
  console.log("Mock URLs updated to valid external PDF.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
