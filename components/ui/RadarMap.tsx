'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TooltipComponent, RadarComponent } from 'echarts/components';
import { RadarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([TooltipComponent, RadarComponent, RadarChart, CanvasRenderer]);

// 指标项类型
interface IndicatorItem {
    name: string;
    max: number;
}

interface RadarChartProps {
    values: number[];
    indicator?: IndicatorItem[];
    width?: string;
    height?: string;
}

const defaultIndicator: IndicatorItem[] = [
    { name: '教学质量', max: 100 },
    { name: '考勤宽松', max: 100 },
    { name: '给分宽松', max: 100 },
    { name: '课程有趣度', max: 100 },
];
export default function RadarMap({
                                       values,
                                       indicator = defaultIndicator,
                                       width = '100%',
                                       height = '400px',
                                   }: RadarChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const toRgba = (hex: string, alpha: number) => {
            const normalized = hex.replace('#', '').trim();
            if (!/^[\da-fA-F]{3,8}$/.test(normalized)) {
                return `rgba(139, 92, 246, ${alpha})`;
            }

            const six =
                normalized.length === 3
                    ? normalized
                          .split('')
                          .map((item) => `${item}${item}`)
                          .join('')
                    : normalized.slice(0, 6);
            const r = Number.parseInt(six.slice(0, 2), 16);
            const g = Number.parseInt(six.slice(2, 4), 16);
            const b = Number.parseInt(six.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const getThemeColor = () => {
            const styles = getComputedStyle(document.documentElement);
            const accent = styles.getPropertyValue('--first-color').trim() || '#8b5cf6';
            const axisText = styles.getPropertyValue('--muted-foreground').trim() || '#4a4a4a';
            const axisLine = styles.getPropertyValue('--border').trim() || 'rgba(9, 69, 110, 0.12)';

            return {
                accent,
                axisText,
                axisLine,
                splitLine: toRgba(accent, 0.24),
                splitAreaA: toRgba(accent, 0.14),
                splitAreaB: toRgba(accent, 0.06),
                areaFill: toRgba(accent, 0.26),
                pointFill: toRgba(accent, 0.82),
                glow: toRgba(accent, 0.22),
            };
        };

        if (values.length !== indicator.length) {
            return;
        }
        if (!chartRef.current) {
            return;
        }

        const myChart = echarts.init(chartRef.current);

        const renderChart = () => {
            const color = getThemeColor();
            const labelColor = '#9ca3af';

            myChart.setOption({
                tooltip: {
                    trigger: 'item',
                },
                radar: {
                    indicator,
                    radius: '50%',
                    center: ['50%', '54%'],
                    splitNumber: 4,
                    axisName: {
                        color: labelColor,
                        fontSize: 9,
                        fontWeight: 500,
                    },
                    axisLine: {
                        lineStyle: {
                            color: color.axisLine,
                            width: 1,
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: color.splitLine,
                            width: 1,
                        },
                    },
                    splitArea: {
                        areaStyle: {
                            color: [color.splitAreaA, color.splitAreaB],
                        },
                    },
                },
                series: [
                    {
                        type: 'radar',
                        data: [
                            {
                                value: values,
                            },
                        ],
                        symbol: 'circle',
                        symbolSize: 5,
                        lineStyle: {
                            color: color.accent,
                            width: 2,
                        },
                        itemStyle: {
                            color: color.pointFill,
                            borderColor: '#fff',
                            borderWidth: 1,
                        },
                        areaStyle: {
                            color: color.areaFill,
                            shadowColor: color.glow,
                            shadowBlur: 8,
                        },
                    },
                ],
            });
        };

        renderChart();

        const resizeHandler = () => myChart.resize();
        const themeObserver = new MutationObserver(() => {
            renderChart();
        });

        window.addEventListener('resize', resizeHandler);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            window.removeEventListener('resize', resizeHandler);
            themeObserver.disconnect();
            myChart.dispose();
        };
    }, [values, indicator]);

    return (
        <div
        ref={chartRef}
        style={{
            width,
            height,
            display: 'block',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08))',
        }}
        />
    );
}