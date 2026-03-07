import { useState, useEffect, lazy, Suspense } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Search, LogOut, Sun, Moon, Smartphone, X } from 'lucide-react';

// Lazy load components for faster initial bundle loading
const Overview = lazy(() => import('./components/Overview'));
const Calendar = lazy(() => import('./components/Calendar'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const Login = lazy(() => import('./components/Login'));

// Simple loading placeholder
const PageLoader = () => (
    <div className="empty-state" style={{ height: '60vh' }}>
        <div className="loading-spinner"></div>
    </div>
);

export default function App() {
    const [userPin, setUserPin] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'calendar' | 'search'
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [showMobileTip, setShowMobileTip] = useState(false);

    // Theme Management
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Auth & Device Check
    useEffect(() => {
        const storedPin = localStorage.getItem('userPin');
        if (storedPin) setUserPin(storedPin);

        const isDismissed = localStorage.getItem('mobileTipDismissed');
        const checkWidth = () => {
            if (window.innerWidth > 1024 && !isDismissed) {
                setShowMobileTip(true);
            } else {
                setShowMobileTip(false);
            }
        };

        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, []);

    const handleDismissTip = () => {
        localStorage.setItem('mobileTipDismissed', 'true');
        setShowMobileTip(false);
    };

    const handleLogin = (pin) => {
        localStorage.setItem('userPin', pin);
        setUserPin(pin);
    };

    const handleLogout = () => {
        localStorage.removeItem('userPin');
        setUserPin(null);
    };

    if (!userPin) {
        return (
            <Suspense fallback={<PageLoader />}>
                <Login onLogin={handleLogin} />
            </Suspense>
        );
    }

    return (
        <div className="app-container">
            {/* Fixed Navbar */}
            <nav className="navbar">
                <div className="nav-left">
                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
                <div className="nav-tabs">
                    <div
                        className="nav-indicator"
                        style={{
                            width: 'calc(33.33% - 4px)',
                            left: `calc(${['overview', 'calendar', 'search'].indexOf(activeTab) * 33.33}% + 2px)`
                        }}
                    ></div>
                    <button
                        className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                        title="Tổng quan"
                    >
                        <LayoutDashboard size={20} />
                        <span className="tab-text">Tổng quan</span>
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calendar')}
                        title="Lịch"
                    >
                        <CalendarIcon size={20} />
                        <span className="tab-text">Lịch</span>
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveTab('search')}
                        title="Tìm kiếm"
                    >
                        <Search size={20} />
                        <span className="tab-text">Tìm kiếm</span>
                    </button>
                </div>
                <div className="nav-actions">
                    <button
                        className="logout-btn-icon"
                        onClick={handleLogout}
                        title="Thoát"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            {/* Main Content with Lazy Loading */}
            <main className="main-content">
                <Suspense fallback={<PageLoader />}>
                    {activeTab === 'overview' && <Overview />}
                    {activeTab === 'calendar' && <Calendar />}
                    {activeTab === 'search' && <SearchPage />}
                </Suspense>
            </main>

            {/* Mobile Recommendation Tip */}
            {showMobileTip && (
                <div className="mobile-tip-banner">
                    <div className="mobile-tip-content">
                        <Smartphone className="mobile-tip-icon" size={24} />
                        <div className="mobile-tip-text">
                            <h4>Trải nghiệm tốt nhất trên di động</h4>
                            <p>Ứng dụng này được thiết kế tối ưu cho điện thoại. Hãy thử quét mã hoặc đăng nhập trên mobile nhé!</p>
                        </div>
                        <button className="mobile-tip-close" onClick={handleDismissTip}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
