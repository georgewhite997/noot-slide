import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signJwt(payload: { id: number }) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function verifyJwt(token: string): { id: number } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { id: number };
    } catch {
        return null;
    }
}