import React, { useState } from "react";
import {
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  List,
  Star,
  Calendar,
  Mail,
  Hash,
  Upload,
  SeparatorHorizontal,
  Search,
  Grid3X3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/types/form";

const iconMap: Record<QuestionType, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: CircleDot,
  checkbox: CheckSquare,
  dropdown: List,
  rating: Star,
  date: Calendar,
  email: Mail,
  number: Hash,
  file_upload: Upload,
  section_break: SeparatorHorizontal,
  multiple_choice_grid: Grid3X3,
};

const allTypes: { type: QuestionType; customLabel?: string }[] = [
  { type: "section_break", customLabel: "Heading" },
  { type: "long_text", customLabel: "Paragraph" },
  { type: "short_text", customLabel: "Text Field" },
  { type: "number", customLabel: "Number Field" },
  { type: "date", customLabel: "Date Field" },
  { type: "email", customLabel: "Email Field" },
  { type: "checkbox", customLabel: "Checkboxes" },
  { type: "multiple_choice", customLabel: "Radio Buttons" },
  { type: "dropdown", customLabel: "Select List" },
  { type: "file_upload", customLabel: "File Upload" },
  { type: "rating", customLabel: "Rating" },
  { type: "multiple_choice_grid", customLabel: "Multiple Choice Grid" },
];

interface QuestionTypesPanelProps {
  onAddQuestion: (type: QuestionType) => void;
  disabledTypes?: QuestionType[];
  disabledReason?: string;
}

export function QuestionTypesPanel({
  onAddQuestion,
  disabledTypes = [],
  disabledReason = "Unavailable for your account",
}: QuestionTypesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFields = allTypes.filter(({ type, customLabel }) => {
    const label = customLabel || QUESTION_TYPE_LABELS[type] || "";
    return (
      label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex h-full p-2  w-full flex-col space-y-4 text-xs">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent-4" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search input fields"
          className="h-8 rounded-xs border-border bg-background pl-8 text-xs placeholder:text-accent-4 focus:border-accent-8"
        />
      </div>

      {/* 2-Column Field Buttons Grid (Matching Reference Screenshot) */}
      <div className="grid grid-cols-2 gap-2">
        {filteredFields.map(({ type, customLabel }) => {
          const Icon = iconMap[type];
          const isDisabled = disabledTypes.includes(type);
          const displayLabel = customLabel || QUESTION_TYPE_LABELS[type];

          return (
            <button
              key={type}
              type="button"
              disabled={isDisabled}
              title={isDisabled ? disabledReason : undefined}
              onClick={() => onAddQuestion(type)}
              className="group flex h-11 items-center justify-center gap-2 rounded-sm border border-border bg-background px-2.5 py-2 text-center transition-geist duration-150 hover:border-accent-8 hover:bg-accent-1/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon className="h-4 w-4 text-accent-6 flex-shrink-0 group-hover:text-foreground" />
              <span className="truncate font-medium text-xs text-foreground">
                {displayLabel}
              </span>
            </button>
          );
        })}
      </div>

      {filteredFields.length === 0 && (
        <p className="text-center py-6 text-xs text-accent-4">
          No matching fields found
        </p>
      )}
    </div>
  );
}
