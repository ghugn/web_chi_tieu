import { useState, useRef, useEffect } from 'react';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';


export default function SwipeableExpenseItem({
    expense,
    onDelete,
    onEdit,
    isOpen,
    onOpen,
    onClose,
    showDate = true,
    highlightQuery = ''
}) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const currentX = useRef(0);
    const isHorizontalScroll = useRef(false);
    const menuRef = useRef(null);


    const ACTION_WIDTH = 120;
    const THRESHOLD = 40;

    useEffect(() => {
        if (!isDragging) {
            if (isOpen) {
                setOffset(-ACTION_WIDTH);
            } else {
                setOffset(0);
            }
        }
    }, [isOpen, isDragging]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        currentX.current = offset;
        setIsDragging(true);
        isHorizontalScroll.current = false;
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const deltaX = x - startX.current;
        const deltaY = y - startY.current;

        if (!isHorizontalScroll.current) {
            if (Math.abs(deltaY) > Math.abs(deltaX) + 5) {
                setIsDragging(false);
                return;
            }
            if (Math.abs(deltaX) > 5) {
                isHorizontalScroll.current = true;
            }
        }

        if (isHorizontalScroll.current) {
            let newOffset = currentX.current + deltaX;
            if (newOffset > 0) newOffset = newOffset * 0.2;
            else if (newOffset < -ACTION_WIDTH) {
                newOffset = -ACTION_WIDTH + ((newOffset + ACTION_WIDTH) * 0.3);
            }
            setOffset(newOffset);
            if (e.cancelable) e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (offset < -THRESHOLD) {
            onOpen();
            setOffset(-ACTION_WIDTH);
        } else {
            onClose();
            setOffset(0);
        }
    };

    const handleMouseDown = (e) => {
        startX.current = e.clientX;
        startY.current = e.clientY;
        currentX.current = offset;
        setIsDragging(true);
        isHorizontalScroll.current = false;
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const x = e.clientX;
        const y = e.clientY;
        const deltaX = x - startX.current;
        const deltaY = y - startY.current;

        if (!isHorizontalScroll.current) {
            if (Math.abs(deltaY) > Math.abs(deltaX) + 5) {
                setIsDragging(false);
                return;
            }
            if (Math.abs(deltaX) > 5) isHorizontalScroll.current = true;
        }

        if (isHorizontalScroll.current) {
            let newOffset = currentX.current + deltaX;
            if (newOffset > 0) newOffset = newOffset * 0.2;
            else if (newOffset < -ACTION_WIDTH) {
                newOffset = -ACTION_WIDTH + ((newOffset + ACTION_WIDTH) * 0.3);
            }
            setOffset(newOffset);
        }
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (offset < -THRESHOLD) {
            onOpen();
            setOffset(-ACTION_WIDTH);
        } else {
            onClose();
            setOffset(0);
        }
    };

    const handleMouseLeave = () => {
        if (isDragging) handleMouseUp();
    };

    const handleEdit = () => {
        onClose();
        setOffset(0);
        if (onEdit) onEdit(expense);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(expense.id);
        } catch {
            setIsDeleting(false);
        }
    };

    const renderNote = () => {
        const text = expense.note || 'Không có ghi chú';
        if (!highlightQuery) return text;
        const lower = text.toLowerCase();
        const idx = lower.indexOf(highlightQuery.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark>
                    {text.slice(idx, idx + highlightQuery.length)}
                </mark>
                {text.slice(idx + highlightQuery.length)}
            </>
        );
    };

    return (
        <div
            className={`swipeable-wrapper ${isDeleting ? 'deleting' : ''}`}
            ref={menuRef}
        >
            <div
                className="swipeable-actions"
                style={{
                    width: `${ACTION_WIDTH}px`,
                    visibility: offset === 0 ? 'hidden' : 'visible',
                    opacity: Math.min(1, Math.abs(offset) / THRESHOLD),
                    transition: isDragging ? 'none' : 'opacity 0.3s ease',
                    zIndex: 0
                }}
            >
                <button
                    className="swipeable-action-btn swipeable-action-more"
                    onClick={handleEdit}
                    aria-label="Sửa chi tiêu"
                >
                    <MoreHorizontal size={20} color="white" />
                </button>
                <button
                    className="swipeable-action-btn swipeable-action-delete"
                    onClick={handleDelete}
                    aria-label="Xóa chi tiêu"
                >
                    <Trash2 size={20} color="white" />
                </button>
            </div>

            <div
                className="swipeable-content expense-item"
                style={{
                    transform: `translateX(${offset}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    touchAction: 'pan-y',
                    zIndex: 1
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <div className="expense-info" style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
                    <div className="expense-note">{renderNote()}</div>
                    {showDate && (
                        <div className="expense-date">
                            {format(new Date(expense.date), 'dd/MM/yyyy')}
                        </div>
                    )}
                </div>
                <div className="expense-amount" style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
                    {expense.amount.toLocaleString()} đ
                </div>
            </div>
        </div>
    );
}
