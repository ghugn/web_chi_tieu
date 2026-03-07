import { useState, useEffect } from 'react';
import {
    format,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subDays
} from 'date-fns';
import { Trash2, TrendingDown, Calendar as CalendarIcon } from 'lucide-react';
import { getExpenses, deleteExpense, updateExpense } from '../api';
import SwipeableExpenseItem from './SwipeableExpenseItem';
import useParallax from '../hooks/useParallax';

export default function Overview() {
    const [filter, setFilter] = useState('month');
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openItemId, setOpenItemId] = useState(null);
    const summaryParallax = useParallax(5);
    const emptyParallax = useParallax(3);

    // Edit modal state
    const [editingExpense, setEditingExpense] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Custom date range state
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchExpensesData();
    }, [filter]);

    const fetchExpensesData = async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            let startStr = '';
            let endStr = '';

            switch (filter) {
                case 'day':
                    startStr = format(now, 'yyyy-MM-dd');
                    endStr = format(now, 'yyyy-MM-dd');
                    break;
                case 'week':
                    startStr = format(subDays(now, 7), 'yyyy-MM-dd');
                    endStr = format(now, 'yyyy-MM-dd');
                    break;
                case 'month':
                    startStr = format(startOfMonth(now), 'yyyy-MM-dd');
                    endStr = format(endOfMonth(now), 'yyyy-MM-dd');
                    break;
                case 'year':
                    startStr = format(startOfYear(now), 'yyyy-MM-dd');
                    endStr = format(endOfYear(now), 'yyyy-MM-dd');
                    break;
                case 'custom':
                    startStr = startDate;
                    endStr = endDate;
                    break;
                default:
                    break;
            }

            const data = await getExpenses(startStr, endStr);
            setExpenses(data);
            setOpenItemId(null);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomFilterSubmit = (e) => {
        e.preventDefault();
        if (filter === 'custom') {
            fetchExpensesData();
        } else {
            setFilter('custom');
        }
    };

    const handleDeleteExpense = async (id) => {
        try {
            await deleteExpense(id);
            await fetchExpensesData();
        } catch (err) {
            console.error(err);
            alert('Không thể xóa chi tiêu');
        }
    };

    const handleEditExpense = (expense) => {
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
            await fetchExpensesData();
        } catch (err) {
            console.error(err);
            alert('Không thể cập nhật chi tiêu');
        } finally {
            setIsSaving(false);
        }
    };

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div>
            {/* Filters */}
            <div className="filters-scroll">
                <div className={`filter-chip ${filter === 'day' ? 'active' : ''}`} onClick={() => setFilter('day')}>Hôm nay</div>
                <div className={`filter-chip ${filter === 'week' ? 'active' : ''}`} onClick={() => setFilter('week')}>7 ngày qua</div>
                <div className={`filter-chip ${filter === 'month' ? 'active' : ''}`} onClick={() => setFilter('month')}>Tháng này</div>
                <div className={`filter-chip ${filter === 'year' ? 'active' : ''}`} onClick={() => setFilter('year')}>Năm nay</div>
                <div className={`filter-chip ${filter === 'custom' ? 'active' : ''}`} onClick={() => setFilter('custom')}>Tùy chỉnh</div>
            </div>

            {filter === 'custom' && (
                <form onSubmit={handleCustomFilterSubmit} className="date-range-form card" style={{ padding: '12px' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px', paddingLeft: '8px' }}>Từ ngày</label>
                        <input type="date" className="form-input" style={{ padding: '8px', fontSize: '14px' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px', paddingLeft: '8px' }}>Đến ngày</label>
                        <input type="date" className="form-input" style={{ padding: '8px', fontSize: '14px' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <button type="submit" className="btn" style={{ width: 'auto', padding: '0 16px', marginTop: '19px' }}>
                        Lọc
                    </button>
                </form>
            )}

            {/* Summary Card */}
            <div className="card summary-card" {...summaryParallax}>
                <div className="summary-label">Tổng chi tiêu</div>
                <div className="summary-amount text-danger">
                    {isLoading ? '...' : totalAmount.toLocaleString()} <span style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-secondary)' }}>đ</span>
                </div>
            </div>

            {/* Expense List */}
            <div className="expense-list-container">
                <h3 style={{ marginBottom: '16px', marginLeft: '4px' }}>Giao dịch gần đây</h3>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Đang tải dữ liệu...</div>
                ) : expenses.length === 0 ? (
                    <div className="empty-state card" {...emptyParallax}>
                        <CalendarIcon className="empty-icon" size={32} />
                        <p>Không có giao dịch nào</p>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>Hãy sang tab Lịch để thêm chi tiêu</p>
                    </div>
                ) : (
                    <div className="expense-list">
                        {expenses.map(expense => (
                            <SwipeableExpenseItem
                                key={expense.id}
                                expense={expense}
                                isOpen={openItemId === expense.id}
                                onOpen={() => setOpenItemId(expense.id)}
                                onClose={() => { if (openItemId === expense.id) setOpenItemId(null) }}
                                onDelete={handleDeleteExpense}
                                onEdit={handleEditExpense}
                                showDate={true}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Bottom Sheet */}
            <div className={`modal-overlay ${editingExpense ? 'open' : ''}`} onClick={() => setEditingExpense(null)}>
                <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                    <div className="sheet-handle"></div>
                    <div className="sheet-header">
                        <h3>Sửa chi tiêu</h3>
                        <button className="btn-close" onClick={() => setEditingExpense(null)}>×</button>
                    </div>
                    <form onSubmit={handleSaveEdit}>
                        <div className="form-group">
                            <label className="form-label">Số tiền</label>
                            <input type="number" step="0.01" className="form-input" placeholder="Số tiền" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ghi chú</label>
                            <input type="text" className="form-input" placeholder="Ghi chú" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
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
