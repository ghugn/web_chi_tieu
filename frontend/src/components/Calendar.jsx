import { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { getExpenses, createExpense, deleteExpense, updateExpense } from '../api';
import SwipeableExpenseItem from './SwipeableExpenseItem';
import useParallax from '../hooks/useParallax';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expenses, setExpenses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openItemId, setOpenItemId] = useState(null);
    const calendarParallax = useParallax(2);
    const summaryParallax = useParallax(4);

    // Form state (add + edit)
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // Fetch expenses for the current month view to show indicator dots
    useEffect(() => {
        fetchMonthExpenses();
    }, [currentDate]);

    const fetchMonthExpenses = async () => {
        try {
            const monthStart = startOfMonth(currentDate);
            const monthEnd = endOfMonth(currentDate);

            // Formatting to YYYY-MM-DD
            const startStr = format(monthStart, 'yyyy-MM-dd');
            const endStr = format(monthEnd, 'yyyy-MM-dd');

            const data = await getExpenses(startStr, endStr);
            setExpenses(data);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const onDateClick = (day) => {
        setSelectedDate(day);
        setOpenItemId(null);
        setIsModalOpen(true);
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!amount) return;

        setIsSubmitting(true);
        try {
            if (editingExpense) {
                await updateExpense(editingExpense.id, {
                    amount: parseFloat(amount),
                    note
                });
                setEditingExpense(null);
            } else {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                await createExpense(dateStr, parseFloat(amount), note);
            }

            setAmount('');
            setNote('');
            await fetchMonthExpenses();
        } catch (err) {
            console.error(err);
            alert(editingExpense ? 'Không thể cập nhật chi tiêu' : 'Không thể thêm chi tiêu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Xóa khoản chi này?')) return;

        try {
            await deleteExpense(id);
            await fetchMonthExpenses();
        } catch (err) {
            console.error(err);
            alert('Không thể xóa chi tiêu');
        }
    };

    // Helper to get expenses for a specific date
    const getExpensesForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return expenses.filter(e => e.date === dateStr);
    };

    const selectedDateExpenses = getExpensesForDate(selectedDate);
    const selectedDateTotal = selectedDateExpenses.reduce((sum, e) => sum + e.amount, 0);

    const renderHeader = () => {
        return (
            <div className="calendar-header">
                <button onClick={prevMonth} className="calendar-nav-btn">
                    <ChevronLeft size={24} />
                </button>
                <div className="calendar-month-year">
                    {format(currentDate, 'MM/yyyy')}
                </div>
                <button onClick={nextMonth} className="calendar-nav-btn">
                    <ChevronRight size={24} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const startDate = startOfWeek(new Date()); // use current date just to get day names

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className="calendar-day-header" key={i}>
                    {format(addDays(startDate, i), 'EEE')}
                </div>
            );
        }
        return <div className="calendar-grid">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                const dayExpenses = getExpensesForDate(cloneDay);

                days.push(
                    <div
                        className={`calendar-day 
              ${!isSameMonth(day, monthStart) ? 'muted' : ''} 
              ${isSameDay(day, new Date()) ? 'today' : ''} 
              ${isSameDay(day, selectedDate) ? 'selected' : ''}`
                        }
                        key={day}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <span>{formattedDate}</span>
                        {dayExpenses.length > 0 && <div className="expense-dot"></div>}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="calendar-grid" key={day} style={{ marginBottom: 0 }}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    return (
        <div>
            <div className="card" {...calendarParallax}>
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>

            <div className="card" {...summaryParallax}>
                <h3>Tổng quan tháng {format(currentDate, 'M')}</h3>
                <div style={{ marginTop: '8px', fontSize: '24px', fontWeight: 700 }}>
                    {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()} <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>đ</span>
                </div>
                <p className="text-secondary" style={{ fontSize: '13px' }}>
                    {expenses.length} khoản chi tiêu
                </p>
            </div>

            {/* FAB for current day just as a quick shortcut */}
            <button
                className="fab"
                onClick={() => {
                    setSelectedDate(new Date());
                    setIsModalOpen(true);
                }}
            >
                <Plus size={24} />
            </button>

            {/* Bottom Sheet Modal */}
            <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => { setIsModalOpen(false); setOpenItemId(null); }}>
                <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                    <div className="sheet-handle"></div>

                    <div className="sheet-header">
                        <h3>{format(selectedDate, 'dd/MM/yyyy')}</h3>
                        <button className="btn-close" onClick={() => { setIsModalOpen(false); setOpenItemId(null); }}>×</button>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Chi tiêu trong ngày
                        </div>

                        {selectedDateExpenses.length === 0 ? (
                            <div className="empty-state" style={{ padding: '24px 0' }}>
                                <CalendarIcon className="empty-icon" size={32} />
                                <p>Chưa có khoản chi nào</p>
                            </div>
                        ) : (
                            <div className="expense-list">
                                {selectedDateExpenses.map(expense => (
                                    <SwipeableExpenseItem
                                        key={expense.id}
                                        expense={expense}
                                        isOpen={openItemId === expense.id}
                                        onOpen={() => setOpenItemId(expense.id)}
                                        onClose={() => { if (openItemId === expense.id) setOpenItemId(null) }}
                                        onDelete={handleDeleteExpense}
                                        onEdit={(exp) => {
                                            setEditingExpense(exp);
                                            setAmount(String(exp.amount));
                                            setNote(exp.note || '');
                                        }}
                                        showDate={false}
                                    />
                                ))}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '12px 4px 0',
                                    borderTop: '1px solid var(--border-color)',
                                    marginTop: '12px',
                                    fontWeight: 600
                                }}>
                                    <span>Tổng:</span>
                                    <span style={{ color: 'var(--danger-color)' }}>
                                        {selectedDateTotal.toLocaleString()} đ
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleAddExpense}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                            Thêm chi nhánh
                        </div>

                        <div className="form-group">
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                placeholder="Số tiền (ví dụ: 50)"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ghi chú (tùy chọn)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn" disabled={isSubmitting || !amount}>
                            <Plus size={20} />
                            {isSubmitting ? 'Đang lưu...' : (editingExpense ? 'Lưu thay đổi' : 'Thêm chi tiêu')}
                        </button>
                        {editingExpense && (
                            <button type="button" className="btn" style={{ marginTop: '8px', background: 'var(--text-secondary)' }} onClick={() => { setEditingExpense(null); setAmount(''); setNote(''); }}>
                                Hủy sửa
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
