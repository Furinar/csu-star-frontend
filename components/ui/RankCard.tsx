"use client";

import { motion } from "motion/react";

interface RankItem {
  id: string;
  name: string;
  score: number;
  avatar?: string;
}

interface RankCardProps {
  title: string;
  data: RankItem[];
  onItemClick?: (item: RankItem) => void;
  onViewAll?: () => void;
}

export default function RankCard({ title, data, onItemClick, onViewAll }: RankCardProps) {
  return (
    <div className="flex min-w-[280px] flex-1 flex-col rounded-3xl border border-white/40 bg-white/40 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="bg-clip-text text-xl font-bold text-transparent"
          style={{ backgroundImage: "var(--page-accent-gradient)" }}
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className={`text-sm transition-colors ${onViewAll ? "cursor-pointer text-gray-500 hover:text-[var(--page-accent-text)]" : "cursor-default text-gray-400"}`}
        >
          查看全部
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {data.slice(0, 10).map((item, index) => {
          const isTop3 = index < 3;
          let medalIcon = null;

          if (index === 0)
            medalIcon = (
              <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600">
                1
              </span>
            );
          else if (index === 1)
            medalIcon = (
              <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-300 to-slate-500">
                2
              </span>
            );
          else if (index === 2)
            medalIcon = (
              <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-red-600">
                3
              </span>
            );
          else
            medalIcon = (
              <span className="text-base text-gray-400 font-medium w-5 text-center">
                {index + 1}
              </span>
            );

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, x: 5 }}
              onClick={() => onItemClick?.(item)}
              className={`flex items-center gap-4 p-3 rounded-2xl transition-colors ${
                isTop3
                  ? "bg-white/50 hover:bg-white/80"
                  : "hover:bg-white/40"
              } ${onItemClick ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg border ${
                  index === 0
                    ? "bg-gradient-to-br from-yellow-100 to-amber-50 border-yellow-300/50"
                    : index === 1
                      ? "bg-gradient-to-br from-slate-100 to-gray-50 border-slate-300/50"
                      : index === 2
                        ? "bg-gradient-to-br from-orange-100 to-red-50 border-orange-300/50"
                        : "bg-white/50 border-white/20"
                }`}
              >
                {medalIcon}
              </div>

              <div className="flex-1">
                <p
                  className={`${
                    index === 0
                      ? "hero-gradient-text font-bold text-lg"
                      : isTop3
                        ? "font-bold text-gray-900"
                        : "font-medium text-gray-800"
                  }`}
                >
                  {item.name}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <span className="w-10 text-center font-bold text-[var(--page-accent-text)]">
                  {item.score.toFixed(2)}
                </span>
                {/*<span className="text-xs text-gray-500">*/}
                {/*  分*/}
                {/*</span>*/}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
