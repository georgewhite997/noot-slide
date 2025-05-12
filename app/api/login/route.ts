import { signJwt } from '@/lib/api/auth';
import { prisma } from '@/lib/api/prisma';
import { User } from '@/prisma/generated'
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { wallet } = await req.json();

    if (!wallet) return NextResponse.json({ error: 'No wallet' }, { status: 400 });

    let user = await prisma.user.findUnique({
        where: { wallet },
        include: { userUpgrades: true },
    });


    if (!user) {
        // New user: fetch all upgrades and create with level 1
        // const upgrades = await prisma.upgrade.findMany({ select: { id: true } });

        user = await prisma.user.create({
            data: {
                wallet,
                // userUpgrades: {
                //     create: upgrades.map((upgrade) => ({
                //         upgrade: { connect: { id: upgrade.id } },
                //         level: 1,
                //     })),
                // },
            },
            include: { userUpgrades: true }
        });

        if (user) {
            return NextResponse.json({ status: 500, message: 'Error when creating the user' })
        }
    } else {
        // Existing user: check for missing upgrades
        // const userUpgradeIds = new Set(user.userUpgrades.map((uu) => uu.upgradeId));
        // const allUpgrades = await prisma.upgrade.findMany({ select: { id: true } });

        // const missingUpgrades = allUpgrades.filter((upgrade) => !userUpgradeIds.has(upgrade.id));

        // if (missingUpgrades.length > 0) {
        //     await prisma.userUpgrade.createMany({
        //         data: missingUpgrades.map((upgrade) => ({
        //             userId: (user as User).id,
        //             upgradeId: upgrade.id,
        //             level: 1,
        //         })),
        //         skipDuplicates: true,
        //     });
        // }
    }

    const token = signJwt({ id: user.id });

    return NextResponse.json({ token });
}
