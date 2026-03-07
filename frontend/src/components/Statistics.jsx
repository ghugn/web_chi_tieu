import { useState, useEffect, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    eachMonthOfInterval,
    parseISO
} from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { getExpenses } from '../api';
import useParallax from '../hooks/useParallax';

const RANGE_OPTIONS = [
    { key: 'month', label: 'Tháng này' },
    { key: 'year', label: 'Năm nay' },
    { key: 'custom', label: 'Tùy chỉnh' }
];

const PIE_COLORS = [
    '#007aff', '#ff3b30', '#34c759', '#ff9500', '#af52de',
    '#5856d6', '#ff2d55', '#00c7be', '#a2845e', '#64d2ff',
    '#ffd60a', '#30d158', '#bf5af2', '#ff6482', '#5ac8fa'
];

export default function Statistics() {
    const [vizMode, setVizMode] = useState('bar');   // 'bar' | 'pie'
    const [range, setRange] = useState('month');
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const mainChartParallax = useParallax(3);
    const summaryParallax = useParallax(5);

    // Custom range
    const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchData();
    }, [range]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            let s, e;
            switch (range) {
                case 'month':
                    s = format(startOfMonth(now), 'yyyy-MM-dd');
                    e = format(endOfMonth(now), 'yyyy-MM-dd');
                    break;
                case 'year':
                    s = format(startOfYear(now), 'yyyy-MM-dd');
                    e = format(endOfYear(now), 'yyyy-MM-dd');
                    break;
                case 'custom':
                    s = customStart;
                    e = customEnd;
                    break;
                default:
                    s = format(startOfMonth(now), 'yyyy-MM-dd');
                    e = format(endOfMonth(now), 'yyyy-MM-dd');
            }
            const data = await getExpenses(s, e);
            setExpenses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Daily totals map ──
    const dailyTotals = useMemo(() => {
        const map = {};
        expenses.forEach(ex => {
            map[ex.date] = (map[ex.date] || 0) + ex.amount;
        });
        return map;
    }, [expenses]);

    // ── Bar chart data ──
    const barData = useMemo(() => {
        const now = new Date();

        if (range === 'year') {
            const months = eachMonthOfInterval({
                start: startOfYear(now),
                end: endOfYear(now)
            });
            return months.map(m => {
                const key = format(m, 'yyyy-MM');
                let total = 0;
                expenses.forEach(ex => {
                    if (ex.date.startsWith(key)) total += ex.amount;
                });
                return { name: format(m, "'T.'M"), total };
            });
        }

        let start, end;
        if (range === 'month') {
            start = startOfMonth(now);
            end = endOfMonth(now);
        } else {
            start = parseISO(customStart);
            end = parseISO(customEnd);
        }

        const days = eachDayOfInterval({ start, end });
        return days.map(d => {
            const key = format(d, 'yyyy-MM-dd');
            return { name: format(d, 'dd'), total: dailyTotals[key] || 0 };
        });
    }, [expenses, range, customStart, customEnd]);

    // ── Pie chart data (by month or day-of-week) ──
    const pieData = useMemo(() => {
        if (expenses.length === 0) return [];

        if (range === 'year') {
            // Group by month
            const grouped = {};
            expenses.forEach(ex => {
                const m = parseISO(ex.date).getMonth(); // 0-11
                const label = `T.${m + 1}`;
                grouped[label] = (grouped[label] || 0) + ex.amount;
            });
            // Sort by month order
            return Object.entries(grouped)
                .map(([name, value]) => ({ name, value, sortKey: parseInt(name.replace('T.', '')) }))
                .sort((a, b) => a.sortKey - b.sortKey);
        }

        // Group by day of week for month / custom
        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const grouped = {};
        dayNames.forEach(d => { grouped[d] = 0; });
        expenses.forEach(ex => {
            const dow = parseISO(ex.date).getDay(); // 0=Sun
            grouped[dayNames[dow]] += ex.amount;
        });
        return dayNames
            .map(name => ({ name, value: grouped[name] }))
            .filter(d => d.value > 0);
    }, [expenses, range]);

    const CustomBarTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="chart-tooltip">
                    <span style={{ fontWeight: 600 }}>{payload[0].value.toLocaleString()} đ</span>
                </div>
            );
        }
        return null;
    };

    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { name, value } = payload[0];
            const total = expenses.reduce((s, e) => s + e.amount, 0);
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return (
                <div className="chart-tooltip">
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{name}</div>
                    <div>{value.toLocaleString()} đ ({percent}%)</div>
                </div>
            );
        }
        return null;
    };

    const renderCustomLegend = (props) => {
        const { payload } = props;
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                {payload.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            {/* Range chips */}
            <div className="filters-scroll">
                {RANGE_OPTIONS.map(opt => (
                    <div
                        key={opt.key}
                        className={`filter-chip ${range === opt.key ? 'active' : ''}`}
                        onClick={() => setRange(opt.key)}
                    >
                        {opt.label}
                    </div>
                ))}
            </div>

            {range === 'custom' && (
                <form
                    onSubmit={e => { e.preventDefault(); fetchData(); }}
                    className="date-range-form card"
                    style={{ padding: '12px' }}
                >
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px', paddingLeft: '8px' }}>Từ</label>
                        <input type="date" className="form-input" style={{ padding: '8px', fontSize: '14px' }}
                            value={customStart} onChange={e => setCustomStart(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px', paddingLeft: '8px' }}>Đến</label>
                        <input type="date" className="form-input" style={{ padding: '8px', fontSize: '14px' }}
                            value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                    </div>
                    <button type="submit" className="btn" style={{ width: 'auto', padding: '0 16px', marginTop: '19px' }}>
                        Lọc
                    </button>
                </form>
            )}

            {/* Viz switch */}
            <div style={{ marginBottom: '16px' }}>
                <div className="nav-tabs" style={{ maxWidth: '100%' }}>
                    <button
                        className={`nav-tab ${vizMode === 'bar' ? 'active' : ''}`}
                        onClick={() => setVizMode('bar')}
                    >
                        Biểu đồ cột
                    </button>
                    <button
                        className={`nav-tab ${vizMode === 'pie' ? 'active' : ''}`}
                        onClick={() => setVizMode('pie')}
                    >
                        Biểu đồ tròn
                    </button>
                </div>
            </div>

            <div style={{ position: 'relative', minHeight: '300px' }}>
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                    }}>
                        Đang tải...
                    </div>
                )}

                <div style={{ opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.3s ease', height: '100%' }}>
                    {vizMode === 'bar' ? (
                        /* ── BAR CHART ── */
                        <div className="card" style={{ padding: '16px 8px 8px' }} {...mainChartParallax}>
                            <h3 style={{ marginLeft: '8px', marginBottom: '16px' }}>
                                {range === 'year' ? 'Chi tiêu theo tháng' : 'Chi tiêu theo ngày'}
                            </h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={barData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: 'var(--chart-text)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval={range === 'year' ? 0 : 'preserveStartEnd'}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'var(--chart-text)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }} />
                                    <Bar
                                        dataKey="total"
                                        fill="var(--accent-color)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={28}
                                        animationDuration={1000}
                                        animationBegin={0}
                                        animationEasing="ease-out"
                                        isAnimationActive={!isLoading}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        /* ── PIE CHART ── */
                        <div className="card" style={{ padding: '16px' }} {...mainChartParallax}>
                            <h3 style={{ marginBottom: '8px' }}>{range === 'year' ? 'Chi tiêu theo tháng' : 'Chi tiêu theo thứ'}</h3>
                            {pieData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                                    Không có dữ liệu
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                            animationDuration={1000}
                                            animationBegin={0}
                                            animationEasing="ease-out"
                                            isAnimationActive={!isLoading}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend content={renderCustomLegend} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            {!isLoading && expenses.length > 0 && (
                <div className="card summary-card" style={{ marginTop: '16px' }} {...summaryParallax}>
                    <div className="summary-label">Tổng chi tiêu</div>
                    <div className="summary-amount" style={{ color: 'var(--text-primary)' }}>
                        {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()} <span style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-secondary)' }}>đ</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {expenses.length} giao dịch
                    </div>
                </div>
            )}
        </div>
    );
}
