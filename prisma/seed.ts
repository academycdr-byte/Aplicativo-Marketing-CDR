import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Insert default CPM values
  await prisma.configuracaoCPM.upsert({
    where: { categoria: 'viral' },
    update: {},
    create: { categoria: 'viral', valor_por_cpm: 2.0 },
  });

  await prisma.configuracaoCPM.upsert({
    where: { categoria: 'tecnico' },
    update: {},
    create: { categoria: 'tecnico', valor_por_cpm: 5.0 },
  });

  console.log('Seed completed: default CPM values created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
