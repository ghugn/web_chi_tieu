import { useState, useCallback } from 'react';

export default function useParallax(maxTilt = 5) {
    const [style, setStyle] = useState({});

    const onMouseMove = useCallback((e) => {
        const { currentTarget: el, clientX, clientY } = e;
        const { left, top, width, height } = el.getBoundingClientRect();

        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const mouseX = clientX - centerX;
        const mouseY = clientY - centerY;

        const rotateX = (mouseY / (height / 2)) * -maxTilt;
        const rotateY = (mouseX / (width / 2)) * maxTilt;

        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
            transition: 'transform 0.1s ease-out',
            zIndex: 10
        });
    }, [maxTilt]);

    const onMouseLeave = useCallback(() => {
        setStyle({
            transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)`,
            transition: 'transform 0.5s ease-out'
        });
    }, []);

    return { style, onMouseMove, onMouseLeave };
}
