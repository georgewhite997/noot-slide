import { signJwt, verifyJwt } from '@/lib/api/auth';
import { prisma } from '@/lib/api/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.split(' ')[1];

    const payload = verifyJwt(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fishes, score } = await req.json();

    if (typeof fishes !== 'number' || typeof score !== 'number') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
        where: { id: Number(payload.id) },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newFishes = user.fishes + fishes;
    const newHighScore = score > user.highestScore ? score : user.highestScore;

    user = await prisma.user.update({
        where: { id: user.id },
        data: {
            fishes: newFishes,
            highestScore: newHighScore,
        },
        include: { userUpgrades: true }
    });

    return NextResponse.json(user);
}
