import client from './client'

export interface Account {
  id: string
  accountNumber: string
  currency: string
  balance: number
}

export interface Transaction {
  id: string
  fromAccount: string
  toAccount: string
  amount: number
  currency: string
  status: string
  fraudFlagged: boolean
  createdAt: string
}

export const getAccounts = () =>
  client.get<Account[]>('/api/Accounts')

export const getTransactions = (accountId: string) =>
  client.get<Transaction[]>(`/api/Accounts/${accountId}/transactions`)

export const transfer = (fromAccountId: string, toAccountId: string, amount: number, description: string) =>
  client.post('/api/Accounts/transfer', { fromAccountId, toAccountId, amount, description })

export const createAccount = (currency: string = 'ISK') =>
  client.post<Account>('/api/Accounts', { currency })

export const lookupAccount = (accountNumber: string) =>
  client.get<Account>(`/api/Accounts/lookup/${accountNumber}`)