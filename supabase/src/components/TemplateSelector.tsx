import { useState, useEffect, useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface Template {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface TemplateSelectorProps {
  userId: string;
  type: "trip" | "shipment";
  onSelect: (data: Record<string, unknown>) => void;
}

export default function TemplateSelector({ userId, type, onSelect }: TemplateSelectorProps) {
  const { getToken } = useClerkAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    try {
      const token = await getToken({ template: "supabase" });
      if (!token) return;
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", userId)
        .eq("type", type)
        .order("created_at", { ascending: false });
      setTemplates((data as Template[]) || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, userId, type]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      onSelect(template.data);
      showSuccess(`Loaded template: ${template.name}`);
    }
  };

  if (loading || templates.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <Bookmark className="h-4 w-4 text-orange-500" />
      <Select onValueChange={handleSelect}>
        <SelectTrigger className="w-[200px] h-9 text-sm">
          <SelectValue placeholder="Load template..." />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id} className="flex items-center justify-between">
              <span>{t.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
