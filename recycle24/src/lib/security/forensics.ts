import crypto from 'crypto';
import { db } from "@/lib/db";
import { SecurityLog, Prisma } from '@prisma/client';

type SecurityLogWhereInput = Prisma.SecurityLogWhereInput;

export const Forensics = {
  generateLogHash(logData: Partial<SecurityLog>, previousHash?: string): string {
    const dataString = JSON.stringify({
      level: logData.level,
      event: logData.event,
      userId: logData.userId,
      ip: logData.ip,
      userAgent: logData.userAgent,
      details: logData.details,
      createdAt: logData.createdAt?.toISOString(),
      previousHash: previousHash || 'genesis'
    });

    const secret = process.env.FORENSICS_SECRET || 'fallback-secret-key-donotuse-in-prod';
    
    return crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
  },

  async exportIncidentLogs(startDate: Date, endDate: Date, userId?: string) {
    const whereClause: SecurityLogWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    };

    if (userId) {
      whereClause.userId = userId;
    }

    const logs = await db.securityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    let previousHash = 'genesis';
    const signedLogs = logs.map((log) => {
      const currentHash = this.generateLogHash(log, previousHash);
      previousHash = currentHash;
      
      return {
        ...log,
        signature: currentHash
      };
    });

    const reportList = {
      metadata: {
        generatedAt: new Date().toISOString(),
        recordCount: signedLogs.length,
        timeRange: { start: startDate, end: endDate },
        targetUser: userId || 'ALL',
        finalSignature: previousHash
      },
      records: signedLogs
    };

    return reportList;
  }
};
