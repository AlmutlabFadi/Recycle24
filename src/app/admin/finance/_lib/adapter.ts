import { 
  mockSummary, mockRequestsRows, mockRequestDetail, 
  mockHolds, mockDebts, mockRestrictions, mockAuditLogs 
} from "./mock-data";
import { 
  FinanceDashboardSummary, FinanceRequestRow, FinanceRequestDetail, 
  FinanceQueueFilters, FinanceHoldRow, FinanceDebtRow, FinanceRestrictionRow, FinanceAuditRow 
} from "./types";

export class FinanceAdminAdapter {
  private useMocks = true;

  async getSummaryMetrics(): Promise<FinanceDashboardSummary> {
    if (this.useMocks) return Promise.resolve(mockSummary);
    // TODO: wire up actual backend fetch
    return mockSummary;
  }

  async getRequestsQueue(filters: Partial<FinanceQueueFilters>): Promise<FinanceRequestRow[]> {
    if (this.useMocks) {
      let results = [...mockRequestsRows];
      if (filters.status && filters.status !== "ALL") {
        results = results.filter(r => r.status === filters.status);
      }
      if (filters.approvalStage && filters.approvalStage !== "ALL") {
        results = results.filter(r => r.approvalStage === filters.approvalStage);
      }
      if (filters.requestType && filters.requestType !== "ALL") {
        results = results.filter(r => r.type === filters.requestType);
      }
      return Promise.resolve(results);
    }
    // TODO: wire backend
    return mockRequestsRows;
  }

  async getRequestDetail(id: string): Promise<FinanceRequestDetail | null> {
    if (this.useMocks) {
      // Simulate finding the matching mock detail. If not found, just return the boilerplate mockRequestDetail for demo purposes
      return Promise.resolve(mockRequestDetail);
    }
    // TODO: wire backend
    return mockRequestDetail;
  }

  async getActiveHolds(): Promise<FinanceHoldRow[]> {
    if (this.useMocks) return Promise.resolve(mockHolds);
    // TODO: wire backend
    return mockHolds;
  }

  async getOutstandingDebts(): Promise<FinanceDebtRow[]> {
    if (this.useMocks) return Promise.resolve(mockDebts);
    // TODO: wire backend
    return mockDebts;
  }

  async getRestrictedAccounts(): Promise<FinanceRestrictionRow[]> {
    if (this.useMocks) return Promise.resolve(mockRestrictions);
    // TODO: wire backend
    return mockRestrictions;
  }

  async getAuditTrail(): Promise<FinanceAuditRow[]> {
    if (this.useMocks) return Promise.resolve(mockAuditLogs);
    // TODO: wire backend
    return mockAuditLogs;
  }

  async executeCommand(command: any): Promise<{ success: boolean; message?: string }> {
    console.log("Finance action dispatched:", command);
    // TODO: wire backend
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
  }
}

export const financeAdapter = new FinanceAdminAdapter();
