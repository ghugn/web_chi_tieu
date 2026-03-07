import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Search, LogOut, Sun, Moon, Smartphone, X } from 'lucide-react';
import { Overview, Calendar, Login, SearchPage } from './components';

export default function App() {
    const [userPin, setUserPin] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'calendar' | 'search'
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [bgStyle, setBgStyle] = useState({});
    const [showMobileTip, setShowMobileTip] = useState(false);

    const handleMouseMove = (e) => {
        const moveX = (e.clientX / window.innerWidth - 0.5) * 20;
        const moveY = (e.clientY / window.innerHeight - 0.5) * 20;
        setBgStyle({
            backgroundPosition: `${50 + moveX}% ${50 + moveY}%`
        });
    };

    // Theme Management
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Make sure we have the token stored or just state for now since it's simple
    useEffect(() => {
        const storedPin = localStorage.getItem('userPin');
        if (storedPin) setUserPin(storedPin);

        // Check for mobile recommendation
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
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="app-container" onMouseMove={handleMouseMove} style={bgStyle}>
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

            {/* Main Content */}
            <main className="main-content">
                {activeTab === 'overview' && <Overview />}
                {activeTab === 'calendar' && <Calendar />}
                {activeTab === 'search' && <SearchPage />}
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
