import { signJwt, verifyJwt } from '@/lib/api/auth';
import { prisma } from '@/lib/api/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.split(' ')[1];

    const payload = verifyJwt(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { fish, score } = await req.json();

    if (typeof fish !== 'number' || typeof score !== 'number') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: Number(payload.id) },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newFish = user.fish + fish;
    const newHighScore = score > user.highestScore ? score : user.highestScore;

    await prisma.user.update({
        where: { id: user.id },
        data: {
            fish: newFish,
            highestScore: newHighScore,
        },
    });

    return NextResponse.json({
        message: 'success',
        userId: user.id,
        newFish,
        newHighScore,
    });
}
