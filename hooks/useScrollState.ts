"use client";

import { useEffect, useState, type RefObject } from "react";

export function useScrollState(scrollRef?: RefObject<HTMLElement | null>, threshold = 80) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const container = scrollRef?.current;
        if (!container) return;
        const onScroll = () => {
            setScrolled(container.scrollTop >= threshold);
        };
        container.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            container.removeEventListener("scroll", onScroll);
        };
    }, [scrollRef, threshold]);

    return scrolled;
}
