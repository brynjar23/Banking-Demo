import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAccounts, getTransactions, transfer, createAccount, lookupAccount } from '../api/accounts'
import type { Account, Transaction } from '../api/accounts'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  // Transfer form state
  const [accountNumberInput, setAccountNumberInput] = useState('')
  const [lookedUpAccount, setLookedUpAccount] = useState<Account | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [transferMsg, setTransferMsg] = useState('')
  const [transferError, setTransferError] = useState('')
  const [loading, setLoading] = useState(false)

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    getAccounts().then(res => {
      setAccounts(res.data)
      if (res.data.length > 0) {
        setSelectedAccount(res.data[0])
        loadTransactions(res.data[0].id)
      }
    })
  }, [])

  const loadTransactions = async (accountId: string) => {
    const res = await getTransactions(accountId)
    setTransactions(res.data)
  }

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account)
    loadTransactions(account.id)
    setLookedUpAccount(null)
    setAccountNumberInput('')
    setTransferMsg('')
    setTransferError('')
  }

  const handleLookup = async () => {
    setLookupError('')
    setLookedUpAccount(null)
    if (!accountNumberInput.trim()) return
    try {
      const res = await lookupAccount(accountNumberInput.trim())
      if (res.data.id === selectedAccount?.id) {
        setLookupError('Cannot transfer to the same account')
        return
      }
      setLookedUpAccount(res.data)
    } catch {
      setLookupError('Account not found')
    }
  }

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookedUpAccount) {
      setLookupError('Please look up a destination account first')
      return
    }
    setShowConfirm(true)
  }

  const handleConfirmedTransfer = async () => {
    if (!selectedAccount || !lookedUpAccount) return
    setShowConfirm(false)
    setLoading(true)
    setTransferMsg('')
    setTransferError('')
    try {
      const res = await transfer(selectedAccount.id, lookedUpAccount.id, parseFloat(amount), description)
      setTransferMsg(res.data.message)
      setAmount('')
      setDescription('')
      setAccountNumberInput('')
      setLookedUpAccount(null)
      const updated = await getAccounts()
      setAccounts(updated.data)
      const updatedSelected = updated.data.find(a => a.id === selectedAccount.id)
      if (updatedSelected) setSelectedAccount(updatedSelected)
      loadTransactions(selectedAccount.id)
    } catch (err: any) {
      setTransferError(err.response?.data?.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    await createAccount()
    const res = await getAccounts()
    setAccounts(res.data)
  }

  return (
    <div style={styles.page}>
      {/* Confirmation dialog */}
      {showConfirm && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Confirm transfer</h3>
            <p style={styles.dialogText}>You are about to send:</p>
            <p style={styles.dialogAmount}>{parseFloat(amount).toLocaleString('is-IS')} ISK</p>
            <p style={styles.dialogText}>
              From <strong>{selectedAccount?.accountNumber}</strong><br />
              To <strong>{lookedUpAccount?.accountNumber}</strong>
            </p>
            {description && <p style={styles.dialogDesc}>"{description}"</p>}
            <div style={styles.dialogButtons}>
              <button style={styles.cancelBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button style={styles.confirmBtn} onClick={handleConfirmedTransfer}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Banking Demo</h1>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.fullName}</span>
          <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Accounts */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Your accounts</h2>
          <div style={styles.accountGrid}>
            {accounts.map(acc => (
              <div
                key={acc.id}
                style={{ ...styles.accountCard, ...(selectedAccount?.id === acc.id ? styles.accountCardActive : {}) }}
                onClick={() => handleAccountClick(acc)}
              >
                <p style={styles.accountNumber}>{acc.accountNumber}</p>
                <p style={styles.accountBalance}>
                  {acc.balance.toLocaleString('is-IS')} {acc.currency}
                </p>
              </div>
            ))}
          </div>
          <button style={styles.addAccountBtn} onClick={handleCreateAccount}>
            + New account
          </button>
        </section>

        <div style={styles.columns}>
          {/* Transfer */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Transfer funds</h2>
            <form onSubmit={handleTransferSubmit} style={styles.form}>
              <div style={styles.lookupRow}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="Destination account number"
                  value={accountNumberInput}
                  onChange={e => {
                    setAccountNumberInput(e.target.value)
                    setLookedUpAccount(null)
                  }}
                />
                <button type="button" style={styles.lookupBtn} onClick={handleLookup}>
                  Look up
                </button>
              </div>
              {lookupError && <p style={styles.error}>{lookupError}</p>}
              {lookedUpAccount && (
                <div style={styles.lookedUpBox}>
                  <p style={styles.lookedUpLabel}>Sending to</p>
                  <p style={styles.lookedUpNumber}>{lookedUpAccount.accountNumber}</p>
                </div>
              )}
              <input
                style={styles.input}
                type="number"
                placeholder="Amount (ISK)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min="1"
              />
              <input
                style={styles.input}
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {transferMsg && <p style={styles.success}>{transferMsg}</p>}
              {transferError && <p style={styles.error}>{transferError}</p>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send transfer'}
              </button>
            </form>
          </section>

          {/* Transactions */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Recent transactions</h2>
            {transactions.length === 0
              ? <p style={{ color: '#888' }}>No transactions yet</p>
              : transactions.map(tx => (
                <div key={tx.id} style={styles.txRow}>
                  <div>
                    <p style={styles.txAccounts}>{tx.fromAccount} → {tx.toAccount}</p>
                    <p style={styles.txDate}>{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={styles.txRight}>
                    <p style={styles.txAmount}>{tx.amount.toLocaleString('is-IS')} {tx.currency}</p>
                    <span style={{ ...styles.badge, ...(tx.fraudFlagged ? styles.badgeFraud : tx.status === 'Completed' ? styles.badgeOk : styles.badgePending) }}>
                      {tx.fraudFlagged ? 'Flagged' : tx.status}
                    </span>
                  </div>
                </div>
              ))
            }
          </section>
        </div>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' },
  overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  dialog: { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '380px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
  dialogTitle: { margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' },
  dialogText: { margin: '0 0 0.5rem', color: '#555', fontSize: '0.95rem' },
  dialogAmount: { fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: '0.5rem 0' },
  dialogDesc: { color: '#888', fontStyle: 'italic', margin: '0.5rem 0' },
  dialogButtons: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  cancelBtn: { flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' },
  confirmBtn: { flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' },
  header: { background: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  headerTitle: { margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userName: { color: '#444', fontSize: '0.95rem' },
  logoutBtn: { padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b' },
  main: { maxWidth: '960px', margin: '2rem auto', padding: '0 1rem' },
  section: { background: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' },
  accountGrid: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  accountCard: { padding: '1rem 1.5rem', borderRadius: '10px', border: '2px solid #e5e7eb', cursor: 'pointer', minWidth: '200px' },
  accountCardActive: { borderColor: '#2563eb', background: '#eff6ff' },
  accountNumber: { margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#666' },
  accountBalance: { margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' },
  addAccountBtn: { marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px dashed #2563eb', background: '#fff', color: '#2563eb', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  columns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  lookupRow: { display: 'flex', gap: '0.5rem' },
  lookupBtn: { padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #2563eb', background: '#fff', color: '#2563eb', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' as const },
  lookedUpBox: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem 1rem' },
  lookedUpLabel: { margin: '0 0 0.2rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' as const },
  lookedUpNumber: { margin: 0, fontWeight: 700, color: '#15803d', fontSize: '1rem' },
  input: { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem' },
  button: { padding: '0.7rem', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  success: { color: '#16a34a', margin: 0 },
  error: { color: '#dc2626', margin: 0 },
  txRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' },
  txAccounts: { margin: '0 0 0.2rem', fontSize: '0.85rem', fontWeight: 500, color: '#1e293b' },
  txDate: { margin: 0, fontSize: '0.75rem', color: '#999' },
  txRight: { textAlign: 'right' as const },
  txAmount: { margin: '0 0 0.2rem', fontWeight: 600, color: '#1e293b' },
  badge: { fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '999px', fontWeight: 600 },
  badgeOk: { background: '#dcfce7', color: '#16a34a' },
  badgeFraud: { background: '#fee2e2', color: '#dc2626' },
  badgePending: { background: '#fef9c3', color: '#ca8a04' },
}