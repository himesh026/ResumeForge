import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-this",
);

export interface SessionPayload {
  userId: string;
  email: string;
  exp: number;
}

export async function createSession(
  userId: string,
  email: string,
): Promise<string> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  // Try nodemailer if SMTP configured
  if (process.env.SMTP_HOST) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SMTP_PASS}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "ResumeForge <onboarding@resend.dev>",
          to: email,
          subject: "Your login code - ResumeForge",
          html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
            <h1 style="font-size:24px;margin-bottom:8px">ResumeForge</h1>
            <p style="color:#666;margin-bottom:32px">Your verification code:</p>
            <div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;font-family:monospace">${code}</span>
            </div>
            <p style="color:#999;font-size:13px">This code expires in 10 minutes.</p>
          </div>
        `,
        }),
      });
      if (res.ok) return;
      console.error("Resend error:", await res.text());
    } catch (err) {
      console.error("Email send failed:", err);
    }
  }
  // Console fallback for development
  console.log('\n========================================')
  console.log(`VERIFICATION CODE for ${email}: ${code}`)
  console.log('========================================\n')
}

