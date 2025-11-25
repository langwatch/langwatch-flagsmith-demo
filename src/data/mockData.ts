export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  merchant: string;
  category: string;
}

export interface Account {
  id: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  accounts: Account[];
}

export const mockCustomers: Customer[] = [
  {
    id: 'cust_123',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    accounts: [
      {
        id: 'acc_checking_1',
        type: 'checking',
        balance: 50000.00,
        currency: 'USD',
        transactions: [
          {
            id: 'tx_1',
            date: '2023-10-01',
            amount: -1500.00,
            description: 'Office Supplies',
            merchant: 'Staples',
            category: 'expenses'
          },
          {
            id: 'tx_2',
            date: '2023-10-05',
            amount: 12000.00,
            description: 'Client Payment - Project X',
            merchant: 'Client A',
            category: 'income'
          },
          {
            id: 'tx_3',
            date: '2023-10-10',
            amount: -500.00,
            description: 'Lunch Meeting',
            merchant: 'Bistro 55',
            category: 'meals'
          },
          {
             id: 'tx_4',
             date: '2023-10-12',
             amount: -200.00,
             description: 'Subscription',
             merchant: 'SaaS Tool',
             category: 'software'
          }
        ]
      },
      {
        id: 'acc_savings_1',
        type: 'savings',
        balance: 0,
        currency: 'USD',
        transactions: []
      }
    ]
  }
];

export const getCustomerById = (id: string) => mockCustomers.find(c => c.id === id);
export const getAccountById = (customerId: string, accountId: string) => {
    const customer = getCustomerById(customerId);
    if (!customer) return undefined;
    return customer.accounts.find(a => a.id === accountId);
}

