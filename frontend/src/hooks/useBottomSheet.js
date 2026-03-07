import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Hook to handle swipe-down-to-close gesture for bottom sheets.
 * @param {Function} onClose - Callback when the sheet is swiped down beyond threshold.
 * @returns {Object} Props to spread onto the bottom sheet element.
 */
export const useBottomSheet = (onClose) => {
    const [isDragging, setIsDragging] = useState(false);
    const sheetRef = useRef(null);
    const startY = useRef(0);
    const startTime = useRef(0);
    const currentOffset = useRef(0);
    const isActuallySwiping = useRef(false);

    const onTouchStart = useCallback((e) => {
        const sheet = sheetRef.current;
        if (!sheet) return;

        const target = e.target;
        const isHeader = target.closest('.sheet-handle') || target.closest('.sheet-header');

        // Only allow swipe if at top of content, OR if touching the header area
        if (!isHeader && sheet.scrollTop > 0) return;

        startY.current = e.touches[0].clientY;
        startTime.current = Date.now();
        setIsDragging(true);
        isActuallySwiping.current = false;
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!isDragging) return;

        const touchY = e.touches[0].clientY;
        const deltaY = touchY - startY.current;

        // Threshold to distinguish from accidental taps or micro-scrolls
        if (!isActuallySwiping.current && deltaY > 10) {
            isActuallySwiping.current = true;
        }

        if (isActuallySwiping.current && deltaY > 0) {
            // CRITICAL: Block background scrolling
            if (e.cancelable) e.preventDefault();

            currentOffset.current = deltaY;
            if (sheetRef.current) {
                sheetRef.current.style.transform = `translateY(${deltaY}px)`;
                sheetRef.current.style.transition = 'none';
            }
        }
    }, [isDragging]);

    const onTouchEnd = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);
        const offset = currentOffset.current;
        const duration = Date.now() - startTime.current;
        const velocity = offset / duration;

        currentOffset.current = 0;
        isActuallySwiping.current = false;

        if (sheetRef.current) {
            sheetRef.current.style.transition = '';

            if (offset > 200 || (velocity > 0.5 && offset > 20)) {
                onClose();
            } else {
                sheetRef.current.style.transform = '';
            }
        }
    }, [isDragging, onClose]);

    // Attach listeners manually to support { passive: false } which is required for preventDefault() on iOS
    useEffect(() => {
        const sheet = sheetRef.current;
        if (!sheet) return;

        sheet.addEventListener('touchstart', onTouchStart, { passive: true });
        sheet.addEventListener('touchmove', onTouchMove, { passive: false });
        sheet.addEventListener('touchend', onTouchEnd, { passive: true });

        return () => {
            sheet.removeEventListener('touchstart', onTouchStart);
            sheet.removeEventListener('touchmove', onTouchMove);
            sheet.removeEventListener('touchend', onTouchEnd);
        };
    }, [onTouchStart, onTouchMove, onTouchEnd]);

    return {
        ref: sheetRef,
        className: isDragging ? 'dragging' : ''
    };
};
