const { PrismaClient } = require('../prisma-client')

const prisma = new PrismaClient();

async function main() {
    await prisma.upgrade.createMany({
        data: [
            {
                id: 1,
                name: 'Fishing Rod',
                description: 'Attracts nearby Fish like a magnet.',
                unit: 's',
                upgradeLabel: 'Duration Increase',
                iconPath: '/fishing-rod-upgrade.png',
                levels: [
                    { level: 1, value: 15, upgradePrice: 15 },
                    { level: 2, value: 17, upgradePrice: 20 },
                    { level: 3, value: 20, upgradePrice: 30 },
                    { level: 4, value: 25, upgradePrice: 40 },
                    { level: 5, value: 30 },
                ],
            },
            {
                id: 2,
                name: 'Multiplier',
                description: 'Get 2x the Fish you collect.',
                unit: 's',
                upgradeLabel: 'Duration Increase',
                iconPath: '/multiplier-upgrade.png',
                levels: [
                    { level: 1, value: 15, upgradePrice: 15 },
                    { level: 2, value: 17, upgradePrice: 20 },
                    { level: 3, value: 20, upgradePrice: 30 },
                    { level: 4, value: 25, upgradePrice: 40 },
                    { level: 5, value: 30 },
                ],
            },
            {
                id: 3,
                name: 'Meters',
                description: 'Instantly add meters to your score.',
                unit: '%',
                upgradeLabel: 'Effect increase',
                iconPath: '/meters-upgrade.png',
                levels: [
                    { level: 1, value: 12, upgradePrice: 15 },
                    { level: 2, value: 14, upgradePrice: 20 },
                    { level: 3, value: 16, upgradePrice: 30 },
                    { level: 4, value: 18, upgradePrice: 40 },
                    { level: 5, value: 20 },
                ],
            },
        ],
        skipDuplicates: true, // in case you're re-running the seed
    });

    console.log('✅ Upgrades seeded.');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });