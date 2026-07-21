import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // MB: theo hãng sản xuất
  const mb = await prisma.material.updateMany({
    where: { AND: [
      { group: null },
      { OR: [
        { name: { contains: 'ARIRANG' } },
        { name: { contains: 'CHÂU ÂU' } },
        { name: { contains: 'DIAMOND' } },
        { name: { contains: 'PHÁT ĐẠT' } },
        { name: { contains: 'VIỆT PHÁT' } },
        { name: { contains: 'TÂN HÙNG' } },
        { name: { contains: 'ĐẠI Á' } },
        { name: { contains: 'BỀN MÀU' } },
        { name: { contains: 'IP PLASTIC' } },
        { name: { contains: 'KOREA' } },
        { name: { contains: 'THIỀU TRINH' } },
      ]}
    ]},
    data: { group: 'MB' }
  });
  console.log('MB:', mb.count);

  // KOREA: còn lại (group vẫn null)
  const korea = await prisma.material.updateMany({
    where: { group: null },
    data: { group: 'KOREA' }
  });
  console.log('KOREA:', korea.count);

  const counts = await prisma.material.groupBy({ by: ['group'], _count: true });
  console.log('Summary:', counts);
  await prisma.$disconnect();
}
main();
