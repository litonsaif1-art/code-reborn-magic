import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES, applyTheme, type ThemeDefinition } from "@/lib/themes";
import { motion } from "framer-motion";

interface ThemeSelectorProps {
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}

function ThemeSwatch({ theme, isActive, onClick }: { theme: ThemeDefinition; isActive: boolean; onClick: () => void }) {
  const primaryHsl = theme.vars["--primary"];
  const bgHsl = theme.vars["--background"];
  const accentHsl = theme.vars["--accent"];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all",
        "border",
        isActive
          ? "border-primary bg-primary/10 shadow-lg"
          : "border-border/40 bg-secondary/30 hover:bg-secondary/60 hover:border-border/60"
      )}
    >
      {/* Swatch circle — uses theme's background + primary overlay */}
      <div
        className="w-10 h-10 rounded-full relative overflow-hidden shadow-md"
        style={{
          background: `hsl(${bgHsl})`,
          border: `2px solid hsl(${primaryHsl} / 0.3)`,
          boxShadow: isActive
            ? `0 0 16px -2px hsl(${primaryHsl} / 0.5)`
            : `0 2px 8px -2px hsl(${primaryHsl} / 0.3)`,
        }}
      >
        {/* Primary color blob */}
        <div
          className="absolute rounded-full"
          style={{
            width: "70%",
            height: "70%",
            top: "15%",
            left: "15%",
            background: `radial-gradient(circle at 40% 40%, hsl(${primaryHsl}), hsl(${primaryHsl} / 0.8))`,
          }}
        />
        {/* Accent overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 70% 70%, hsl(${accentHsl} / 0.5), transparent 55%)`,
          }}
        />
        {/* Shine */}
        <div
          className="absolute top-0.5 left-1 w-2.5 h-2.5 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(0 0% 100% / 0.45), transparent)",
          }}
        />
        {/* Check mark */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check
              className="w-4 h-4 drop-shadow-md"
              strokeWidth={3}
              style={{
                color: `hsl(${theme.vars["--primary-foreground"]})`,
              }}
            />
          </div>
        )}
      </div>
      {/* Label */}
      <span className={cn(
        "text-[10px] font-semibold tracking-wide",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {theme.name}
      </span>
    </motion.button>
  );
}

export function ThemeSelector({ currentThemeId, onThemeChange }: ThemeSelectorProps) {
  const handleSelect = (id: string) => {
    applyTheme(id);
    onThemeChange(id);
  };

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {THEMES.map((theme) => (
        <ThemeSwatch
          key={theme.id}
          theme={theme}
          isActive={currentThemeId === theme.id}
          onClick={() => handleSelect(theme.id)}
        />
      ))}
    </div>
  );
}
