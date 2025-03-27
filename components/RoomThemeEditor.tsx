import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Palette, Check, Image, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type ThemeColor = {
  name: string;
  background: string;
  accent: string;
};

const predefinedThemes: ThemeColor[] = [
  { name: "Midnight", background: "#121212", accent: "#6366f1" }, // Default indigo
  { name: "Ocean", background: "#0f172a", accent: "#38bdf8" },    // Blue
  { name: "Emerald", background: "#064e3b", accent: "#34d399" },  // Green
  { name: "Sunset", background: "#27272a", accent: "#f97316" },   // Orange
  { name: "Rose", background: "#300724", accent: "#f472b6" },     // Pink
  { name: "Cosmic", background: "#0e0e36", accent: "#a78bfa" },   // Purple
];

export function RoomThemeEditor({ roomId, onThemeChange }: { 
  roomId: string;
  onThemeChange?: (theme: any) => void;
}) {
  const [theme, setTheme] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customBackground, setCustomBackground] = useState("");
  const [customColor, setCustomColor] = useState("#6366f1");
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const fetchTheme = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("theme")
          .eq("id", roomId)
          .single();
        
        if (error) throw error;
        
        if (data?.theme) {
          setTheme(data.theme);
          
          // If custom background exists, set it
          if (data.theme.background && data.theme.background.startsWith('http')) {
            setCustomBackground(data.theme.background);
          }
          
          // If custom color exists, set it
          if (data.theme.color) {
            setCustomColor(data.theme.color);
          }
          
          // Check if the current theme matches any preset
          const presetIndex = predefinedThemes.findIndex(preset => 
            preset.background === data.theme.background && 
            preset.accent === data.theme.color
          );
          
          if (presetIndex !== -1) {
            setSelectedPreset(presetIndex);
          } else {
            setSelectedPreset(null);
          }
        }
      } catch (err) {
        console.error("Error fetching room theme:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [roomId]);

  const saveTheme = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      let newTheme;
      
      if (selectedPreset !== null) {
        // Use a predefined theme
        const selectedTheme = predefinedThemes[selectedPreset];
        newTheme = {
          background: selectedTheme.background,
          color: selectedTheme.accent,
          preset: selectedPreset
        };
      } else {
        // Use custom theme
        newTheme = {
          background: customBackground,
          color: customColor,
          preset: null
        };
      }
      
      const { error } = await supabase
        .from("rooms")
        .update({ theme: newTheme })
        .eq("id", roomId);
        
      if (error) throw error;
      
      setTheme(newTheme);
      if (onThemeChange) onThemeChange(newTheme);
      
      setMessage({
        text: "Theme updated successfully",
        type: "success"
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error saving theme:", err);
      setMessage({
        text: "Failed to save theme",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const selectPreset = (index: number) => {
    setSelectedPreset(index);
    setCustomBackground("");
  };

  const useCustom = () => {
    setSelectedPreset(null);
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          Room Theme
        </h3>
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Palette className="w-5 h-5 text-indigo-400" />
        Room Theme
      </h3>
      
      {/* Status message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`px-3 py-2 rounded-md mb-4 text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-200' 
              : 'bg-red-500/20 border border-red-500/30 text-red-200'
          }`}
        >
          {message.text}
        </motion.div>
      )}
      
      {/* Predefined themes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Theme Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          {predefinedThemes.map((preset, index) => (
            <button
              key={index}
              onClick={() => selectPreset(index)}
              className={`rounded-md p-2 h-16 relative ${
                selectedPreset === index
                  ? "ring-2 ring-indigo-500"
                  : "border border-zinc-700 hover:border-zinc-500"
              }`}
              style={{ backgroundColor: preset.background }}
            >
              <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full" style={{ backgroundColor: preset.accent }}></div>
              {selectedPreset === index && (
                <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-xs text-white absolute bottom-2 left-2 opacity-80">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom theme */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-300">
            Custom Theme
          </label>
          <button
            onClick={useCustom}
            className={`text-xs px-2 py-1 rounded ${
              selectedPreset === null
                ? "bg-indigo-600 text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            Use Custom
          </button>
        </div>
        
        <div className="space-y-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <div>
            <label htmlFor="background" className="block text-sm text-zinc-400 mb-1 flex items-center gap-1">
              <Image className="w-3.5 h-3.5" />
              Background URL
            </label>
            <input
              id="background"
              type="text"
              value={customBackground}
              onChange={(e) => {
                setCustomBackground(e.target.value);
                if (selectedPreset !== null) setSelectedPreset(null);
              }}
              placeholder="https://example.com/image.jpg"
              disabled={selectedPreset !== null}
              className={`w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                selectedPreset !== null ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
            <p className="text-xs text-zinc-500 mt-1">
              Leave empty for solid color background
            </p>
          </div>
          
          <div>
            <label htmlFor="color" className="block text-sm text-zinc-400 mb-1 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5" />
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              <input
                id="color"
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  if (selectedPreset !== null) setSelectedPreset(null);
                }}
                disabled={selectedPreset !== null}
                className={`h-10 w-10 cursor-pointer rounded border border-zinc-700 ${
                  selectedPreset !== null ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  if (selectedPreset !== null) setSelectedPreset(null);
                }}
                disabled={selectedPreset !== null}
                className={`flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  selectedPreset !== null ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Save button */}
      <button
        onClick={saveTheme}
        disabled={saving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Theme"
        )}
      </button>
    </div>
  );
}
