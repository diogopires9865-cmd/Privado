// ========================================================================
// SW Service Desk v1.0 - Utilitários de Segurança, Criptografia e 2FA
// Empresa: SW Cloud Solutions
// ========================================================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { ENV } from '../config/env.js';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  sessionId?: number;
}

export const security = {
  // 1. Password Hashing
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  // 2. JWT Tokens
  generateToken(payload: TokenPayload, expiresIn: string = ENV.JWT_EXPIRES_IN): string {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn } as any);
  },

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
  },

  // 3. Hash de Sessão para Armazenamento Seguro
  hashSessionToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  // 4. 2FA TOTP
  generate2FASecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `SW Service Desk (${email})`,
      issuer: 'SW Cloud Solutions',
      length: 20,
    });
    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
    };
  },

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  },

  verify2FAToken(token: string, secretBase32: string): boolean {
    return speakeasy.totp.verify({
      secret: secretBase32,
      encoding: 'base32',
      token,
      window: 1, // Permite 1 step de tolerância temporal (30s)
    });
  },

  generateRecoveryCodes(count: number = 8): { plainCodes: string[]; hashedCodes: string[] } {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      plainCodes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
      hashedCodes.push(crypto.createHash('sha256').update(code).digest('hex'));
    }

    return { plainCodes, hashedCodes };
  },
};
