import { verifyJwt } from '@/lib/api/auth';
import { prisma } from '@/lib/api/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.split(' ')[1];

    const payload = verifyJwt(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { upgradeId } = await req.json();
    if (typeof upgradeId !== 'number') {
        return NextResponse.json({ error: 'Invalid upgradeId' }, { status: 400 });
    }

    let [user, upgrade] = await Promise.all([
        prisma.user.findUnique({
            where: { id: payload.id },
            include: { userUpgrades: true }
        }),
        prisma.upgrade.findUnique({
            where: { id: upgradeId },
        }),
    ]);

    if (!user || !upgrade) {
        return NextResponse.json({ error: 'User or upgrade not found' }, { status: 404 });
    }


    const upgradeLevels = upgrade.levels as { level: number; value: number; upgradePrice?: number }[];
    let userUpgrade = user.userUpgrades.find(userUpgrade => userUpgrade.upgradeId === upgradeId)
    //todo if user doesnt have this upgrade create it with default level of one

    if (!userUpgrade) {
        userUpgrade = await prisma.userUpgrade.create({
            data: {
                userId: user.id,
                upgradeId: upgrade.id,
                level: 1
            }
        })
    }

    if (userUpgrade.level + 1 > upgradeLevels.length) {
        return NextResponse.json({ message: 'Level already maxed out' }, { status: 400 });
    }

    const currentLevel = upgradeLevels.find((level) => level.level === userUpgrade.level)

    if (currentLevel?.upgradePrice as number > user.fishes) {
        return NextResponse.json({ message: 'Not enough fish' }, { status: 400 });
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                fishes: {
                    decrement: currentLevel?.upgradePrice,
                },
            },
        }),
        prisma.userUpgrade.update({
            where: { id: userUpgrade.id },
            data: { level: userUpgrade.level + 1 },
        }),
    ]);

    user = await prisma.user.findUnique({
        where: { id: payload.id },
        include: { userUpgrades: true }
    });

    const leaderboardPosition = await prisma.user.count({
        where: {
            highestScore: {
                gt: user?.highestScore
            }
        }
    }) + 1;

    return NextResponse.json({
        ...user,
        leaderboardPosition
    });
}