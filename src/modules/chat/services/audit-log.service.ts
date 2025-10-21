import { Injectable, Logger } from '@nestjs/common';

export interface AuditLogEntry {
  timestamp: Date;
  userKey: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  /**
   * Log user action for audit trail
   */
  logAction(entry: AuditLogEntry): void {
    const logMessage = {
      timestamp: entry.timestamp.toISOString(),
      userKey: entry.userKey,
      userName: entry.userName,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    };

    // Log to console (in production, this should go to a proper audit log system)
    this.logger.log(`AUDIT: ${JSON.stringify(logMessage)}`);
  }

  /**
   * Log message sending action
   */
  logMessageSent(userKey: string, userName: string, recipientKey: string, messageId: string): void {
    this.logAction({
      timestamp: new Date(),
      userKey,
      userName,
      action: 'MESSAGE_SENT',
      resource: 'MESSAGE',
      resourceId: messageId,
      details: {
        recipientKey,
        messageId,
      },
    });
  }

  /**
   * Log message status update
   */
  logMessageStatusUpdate(userKey: string, userName: string, messageId: string, status: string): void {
    this.logAction({
      timestamp: new Date(),
      userKey,
      userName,
      action: 'MESSAGE_STATUS_UPDATE',
      resource: 'MESSAGE',
      resourceId: messageId,
      details: {
        status,
        messageId,
      },
    });
  }

  /**
   * Log user connection
   */
  logUserConnection(userKey: string, userName: string, action: 'CONNECT' | 'DISCONNECT'): void {
    this.logAction({
      timestamp: new Date(),
      userKey,
      userName,
      action: `USER_${action}`,
      resource: 'CONNECTION',
      details: {
        action: action.toLowerCase(),
      },
    });
  }

  /**
   * Log typing action
   */
  logTypingAction(userKey: string, userName: string, recipientKey: string, action: 'START' | 'STOP'): void {
    this.logAction({
      timestamp: new Date(),
      userKey,
      userName,
      action: `TYPING_${action}`,
      resource: 'TYPING',
      details: {
        recipientKey,
        action: action.toLowerCase(),
      },
    });
  }

  /**
   * Log message history access
   */
  logMessageHistoryAccess(userKey: string, userName: string, page: number, limit: number): void {
    this.logAction({
      timestamp: new Date(),
      userKey,
      userName,
      action: 'MESSAGE_HISTORY_ACCESS',
      resource: 'MESSAGE_HISTORY',
      details: {
        page,
        limit,
      },
    });
  }
}
