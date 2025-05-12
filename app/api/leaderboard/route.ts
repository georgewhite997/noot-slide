import { signJwt, verifyJwt } from '@/lib/api/auth';
import { prisma } from '@/lib/api/prisma';
import { convertBigIntsToStrings } from '@/utils/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const token = req.headers.get('authorization')?.split(' ')[1];

    const payload = verifyJwt(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const leaderboard = await prisma.user.findMany({
        orderBy: { highestScore: 'desc' },
        take: 15,
        select: {
            wallet: true,
            highestScore: true,
        },
    });

    const leaderboardWithPosition = leaderboard.map((user, index) => ({
        ...user,
        position: (index + 1).toString()
    }));


    return NextResponse.json(leaderboardWithPosition)
}