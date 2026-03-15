import { useState } from "react";
import { Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ThemeSelector } from "./ThemeSelector";
import { getStoredThemeId, getThemeById } from "@/lib/themes";

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState(getStoredThemeId());
  const theme = getThemeById(currentTheme);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.08, y: -1 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden group border border-border/50 bg-secondary/50 hover:bg-secondary/80 transition-colors"
          title={`থিম: ${theme?.name || "Neon"}`}
        >
          <Palette className="w-4 h-4 text-primary" />
          <span className="sr-only">Change theme</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[340px] p-3 glass-heavy"
      >
        <div className="mb-2.5 flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">কালার থিম</span>
          <span className="text-[9px] text-muted-foreground ml-auto">{theme?.name}</span>
        </div>
        <ThemeSelector
          currentThemeId={currentTheme}
          onThemeChange={setCurrentTheme}
        />
      </PopoverContent>
    </Popover>
  );
}
