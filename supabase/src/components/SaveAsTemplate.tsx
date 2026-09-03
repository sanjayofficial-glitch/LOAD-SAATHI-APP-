import { useState } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bookmark, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface SaveAsTemplateProps {
  userId: string;
  type: "trip" | "shipment";
  data: Record<string, unknown>;
  disabled?: boolean;
}

export default function SaveAsTemplate({ userId, type, data, disabled = false }: SaveAsTemplateProps) {
  const { getToken } = useClerkAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showError("Please enter a template name");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Not authenticated");
      const supabase = createClerkSupabaseClient(token);

      const { error } = await supabase.from("templates").insert({
        user_id: userId,
        name: name.trim(),
        type,
        data,
      });

      if (error) throw error;
      showSuccess(`Template "${name.trim()}" saved!`);
      setOpen(false);
      setName("");
    } catch {
      showError("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950"
      >
        <Bookmark className="h-3.5 w-3.5 mr-1.5" />
        Save as Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Template Name
            </label>
            <Input
              placeholder={`e.g. Mumbai to Delhi ${type === "trip" ? "trip" : "shipment"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
