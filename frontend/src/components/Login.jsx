import { useState } from 'react';
import { ShieldCheck, KeyRound, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { login, addPin, deletePin } from '../api';

export default function Login({ onLogin }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);

    // States for adding/deleting PIN
    const [adminCode, setAdminCode] = useState('');
    const [newCode, setNewCode] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            if (isAdminMode) {
                if (!adminCode || !newCode) {
                    setError('Vui lòng nhập đầy đủ thông tin');
                    setLoading(false);
                    return;
                }
                const data = await addPin(adminCode, newCode);
                if (data.success) {
                    setSuccessMessage('Thêm mã PIN thành công!');
                    setAdminCode('');
                    setNewCode('');
                }
            } else {
                if (!code) {
                    setLoading(false);
                    return;
                }
                const data = await login(code);
                if (data.success) {
                    onLogin(code);
                }
            }
        } catch (err) {
            setError(err.message || (isAdminMode ? 'Thêm mã PIN thất bại' : 'Mã đăng nhập không đúng'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePin = async (e) => {
        if (e) e.preventDefault(); // Just in case it's triggered by Enter

        if (!adminCode || !newCode) {
            setError('Vui lòng nhập Mã Admin và Mã PIN cần xóa');
            return;
        }

        const targetToDelete = newCode; // Store locally as state might change

        if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn mã PIN '${targetToDelete}' và toàn bộ chi tiêu của nó không? Hành động này không thể hoàn tác.`)) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const data = await deletePin(adminCode, targetToDelete);
            if (data.success) {
                setSuccessMessage(`Đã xóa thành công mã PIN ${targetToDelete}`);
                setAdminCode('');
                setNewCode('');
            }
        } catch (err) {
            setError(err.message || 'Xóa mã PIN thất bại');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsAdminMode(!isAdminMode);
        setError('');
        setSuccessMessage('');
        setCode('');
        setAdminCode('');
        setNewCode('');
    };

    return (
        <div className="login-screen">
            <div className={`login-card card ${isAdminMode ? 'admin-card' : ''}`}>
                <div className="login-header">
                    {isAdminMode && (
                        <div className="admin-badge">
                            <ShieldCheck size={20} />
                            <span>Quản trị viên</span>
                        </div>
                    )}
                    <h2>{isAdminMode ? 'Quản lý mã PIN' : 'Đăng nhập'}</h2>
                    {!isAdminMode && <div style={{ marginBottom: '8px' }} />}
                    {isAdminMode && (
                        <p className="text-secondary">
                            Thêm hoặc xóa quyền truy cập
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isAdminMode ? (
                        <div className="admin-fields">
                            <div className="input-group-modern">
                                <ShieldCheck className="input-icon" size={18} />
                                <input
                                    type="password"
                                    className="modern-input"
                                    placeholder="Nhập mã Admin"
                                    value={adminCode}
                                    onChange={(e) => setAdminCode(e.target.value)}
                                />
                            </div>
                            <div className="input-group-modern">
                                <KeyRound className="input-icon" size={18} />
                                <input
                                    type="password"
                                    className="modern-input"
                                    placeholder="Mã PIN (4-6 số)"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="input-group-modern">
                            <KeyRound className="input-icon" size={18} />
                            <input
                                type="password"
                                className="modern-input"
                                placeholder="Nhập mã PIN"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="auth-success">
                            {successMessage}
                        </div>
                    )}

                    <div className="login-actions">
                        {isAdminMode ? (
                            <div className="admin-actions-row">
                                <button
                                    type="submit"
                                    className="btn btn-add-pin"
                                    disabled={loading || !adminCode || !newCode}
                                >
                                    <Plus size={18} />
                                    <span>Thêm</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-delete-pin"
                                    onClick={handleDeletePin}
                                    disabled={loading || !adminCode || !newCode}
                                >
                                    <Trash2 size={18} />
                                    <span>Xóa</span>
                                </button>
                            </div>
                        ) : (
                            <button type="submit" className="btn btn-primary" disabled={loading || !code}>
                                {loading ? 'Đang xác thực...' : 'Vào ứng dụng'}
                            </button>
                        )}
                    </div>

                    <div className="login-footer">
                        <button
                            type="button"
                            className="toggle-mode-btn"
                            onClick={toggleMode}
                        >
                            {isAdminMode ? (
                                <><ArrowLeft size={14} /> Quay lại đăng nhập</>
                            ) : (
                                'Thiết lập mã PIN mới?'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
