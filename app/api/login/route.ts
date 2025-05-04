import { signJwt } from '@/lib/api/auth';
import { prisma } from '@/lib/api/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { wallet } = await req.json();

    if (!wallet) return NextResponse.json({ error: 'No wallet' }, { status: 400 });

    let user = await prisma.user.findUnique({ where: { wallet } });

    if (!user) {
        user = await prisma.user.create({ data: { wallet } });
    }

    const token = signJwt({ id: user.id });

    return NextResponse.json({ token });
}
