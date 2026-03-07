import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Search as SearchIcon, X } from 'lucide-react';
import { getExpenses, deleteExpense, updateExpense } from '../api';
import SwipeableExpenseItem from './SwipeableExpenseItem';
import useParallax from '../hooks/useParallax';

function HighlightText({ text, query }) {
    if (!query || !text) return <>{text}</>;
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return <>{text}</>;

    return (
        <>
            {text.slice(0, idx)}
            <mark>
                {text.slice(idx, idx + q.length)}
            </mark>
            {text.slice(idx + q.length)}
        </>
    );
}

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [allExpenses, setAllExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openItemId, setOpenItemId] = useState(null);
    const emptyParallax = useParallax(3);

    // Edit state
    const [editingExpense, setEditingExpense] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const data = await getExpenses();
            setAllExpenses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = useMemo(() => {
        if (!query.trim()) return allExpenses.slice(0, 50); // most recent when empty
        const q = query.toLowerCase();
        return allExpenses.filter(e =>
            (e.note && e.note.toLowerCase().includes(q))
        );
    }, [allExpenses, query]);

    const handleDelete = async (id) => {
        try {
            await deleteExpense(id);
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert('Không thể xóa chi tiêu');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setEditAmount(String(expense.amount));
        setEditNote(expense.note || '');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editAmount || !editingExpense) return;
        setIsSaving(true);
        try {
            await updateExpense(editingExpense.id, {
                amount: parseFloat(editAmount),
                note: editNote
            });
            setEditingExpense(null);
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert('Không thể cập nhật chi tiêu');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            {/* Search Input */}
            <div className="search-bar">
                <SearchIcon size={18} className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm theo ghi chú..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />
                {query && (
                    <button className="search-clear" onClick={() => setQuery('')}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Result count */}
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', paddingLeft: '4px' }}>
                {isLoading ? 'Đang tải...' : query.trim()
                    ? `${filtered.length} kết quả cho "${query}"`
                    : `${filtered.length} giao dịch gần nhất`
                }
            </div>

            {/* Results */}
            {!isLoading && filtered.length === 0 ? (
                <div className="empty-state card" style={{ textAlign: 'center', padding: '40px 20px' }} {...emptyParallax}>
                    <SearchIcon size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                    <p>Không tìm thấy giao dịch nào</p>
                    <p style={{ fontSize: '13px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                        Thử từ khóa khác
                    </p>
                </div>
            ) : (
                <div className="expense-list">
                    {filtered.map(expense => (
                        <SwipeableExpenseItem
                            key={expense.id}
                            expense={expense}
                            isOpen={openItemId === expense.id}
                            onOpen={() => setOpenItemId(expense.id)}
                            onClose={() => { if (openItemId === expense.id) setOpenItemId(null) }}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            showDate={true}
                            highlightQuery={query.trim()}
                        />
                    ))}
                </div>
            )}

            {/* Edit Bottom Sheet */}
            <div className={`modal-overlay ${editingExpense ? 'open' : ''}`} onClick={() => setEditingExpense(null)}>
                <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
                    <div className="sheet-handle"></div>
                    <div className="sheet-header">
                        <h3>Sửa chi tiêu</h3>
                        <button className="btn-close" onClick={() => setEditingExpense(null)}>×</button>
                    </div>
                    <form onSubmit={handleSaveEdit}>
                        <div className="form-group">
                            <label className="form-label">Số tiền</label>
                            <input type="number" step="0.01" className="form-input" placeholder="Số tiền" value={editAmount} onChange={e => setEditAmount(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ghi chú</label>
                            <input type="text" className="form-input" placeholder="Ghi chú" value={editNote} onChange={e => setEditNote(e.target.value)} />
                        </div>
                        <button type="submit" className="btn" disabled={isSaving || !editAmount}>
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
