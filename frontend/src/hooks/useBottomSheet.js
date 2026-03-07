import { useRef, useCallback, useState } from 'react';

/**
 * Hook to handle swipe-down-to-close gesture for bottom sheets.
 * @param {Function} onClose - Callback when the sheet is swiped down beyond threshold.
 * @returns {Object} Props to spread onto the bottom sheet element.
 */
export const useBottomSheet = (onClose) => {
    const [isDragging, setIsDragging] = useState(false);
    const sheetRef = useRef(null);
    const startY = useRef(0);
    const currentOffset = useRef(0);

    const onTouchStart = useCallback((e) => {
        // Only start if we're at the top of the scroll or on the header/handle
        const target = e.target;
        const sheet = sheetRef.current;

        // Basic check to see if we should allow dragging
        // If the user is scrolling inside a scrollable area, we might want to disable swipe-down
        // but typically for bottom sheets, we allow swipe down from the top.
        if (sheet && sheet.scrollTop > 0) return;

        startY.current = e.touches[0].clientY;
        setIsDragging(true);
    }, []);

    const onTouchMove = useCallback((e) => {
        if (!isDragging) return;

        const deltaY = e.touches[0].clientY - startY.current;

        // Only allow swiping down (positive deltaY)
        if (deltaY > 0) {
            currentOffset.current = deltaY;
            if (sheetRef.current) {
                // Direct DOM manipulation for performance
                sheetRef.current.style.transform = `translateY(${deltaY}px)`;
                sheetRef.current.style.transition = 'none';
            }
        }
    }, [isDragging]);

    const onTouchEnd = useCallback(() => {
        if (!isDragging) return;

        setIsDragging(false);
        const offset = currentOffset.current;
        currentOffset.current = 0;

        if (sheetRef.current) {
            // Restore transition
            sheetRef.current.style.transition = '';

            if (offset > 120) {
                // Swipe down threshold reached
                onClose();
                // We keep it at offset for a moment so it looks like it's exiting
                // The parent component should handle removing it from DOM or the 'open' class
            } else {
                // Snap back
                sheetRef.current.style.transform = '';
            }
        }
    }, [isDragging, onClose]);

    return {
        ref: sheetRef,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        className: isDragging ? 'dragging' : ''
    };
};
