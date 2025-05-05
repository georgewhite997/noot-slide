import { signJwt, verifyJwt } from '@/lib/api/auth';
import { prisma } from '@/lib/api/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const token = req.headers.get('authorization')?.split(' ')[1];

    const payload = verifyJwt(token || '');
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const upgrades = await prisma.upgrade.findMany();

    return NextResponse.json(upgrades);
}
