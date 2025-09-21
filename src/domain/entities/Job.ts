export interface Job {
  id: number;
  salePoint: number;
  status: 'pending' | 'completed' | 'failed' | 'error';
  userId: number;
  valueToBill: string;
  createdAt: string;
  cronExpression: string;
}

export interface CreateFacturaRequest {
  userId: number;
  minBill: number;
  maxBill: number;
  billNumber: number;
  startDate: string;
  endDate: string;
}
