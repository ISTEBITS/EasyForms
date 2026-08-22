import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { QuestionTypesPanel } from "@/components/form-editor/QuestionTypesPanel";
import { SettingsContent } from "./SettingsContent";
import type { Form, QuestionType } from "@/types/form";

interface MobileActionBarProps {
  form: Form;
  isTestUser: boolean;
  onAddQuestion: (type: QuestionType) => void;
  onUpdateSettings: (updates: Partial<Form["settings"]>) => void;
  onSlugChange: (value: string) => void;
  onSlugBlur: () => void;
  onUploadThemeAsset: (
    target: "logoUrl" | "bannerUrl",
    file: File,
  ) => Promise<void>;
  isThemeAssetUploading: boolean;
}

export const MobileActionBar = ({
  form,
  isTestUser,
  onAddQuestion,
  onUpdateSettings,
  onSlugChange,
  onSlugBlur,
  onUploadThemeAsset,
  isThemeAssetUploading,
}: MobileActionBarProps) => {
  const [showMobileAdd, setShowMobileAdd] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  return (
    <div className="lg:hidden grid grid-cols-2 gap-3 mb-2 sticky top-0 z-20 pb-2">
      <Sheet open={showMobileAdd} onOpenChange={setShowMobileAdd}>
        <SheetTrigger
          render={
            <Button variant="default" className="w-full rounded-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          }
        />
        <SheetContent
          side="bottom"
          className="h-[70vh] max-h-[80vh] bg-background border-border p-0 rounded-t-sm flex flex-col"
        >
          <div className="p-3 flex flex-col h-full">
            <SheetHeader className="mb-4 text-left">
              <SheetTitle className="text-foreground">
                Select Question Type
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              <QuestionTypesPanel
                disabledTypes={isTestUser ? ["file_upload"] : []}
                disabledReason="Test users cannot use file upload fields"
                onAddQuestion={(type) => {
                  onAddQuestion(type);
                  setShowMobileAdd(false);
                }}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showMobileSettings} onOpenChange={setShowMobileSettings}>
        <SheetTrigger
          render={
            <Button variant="secondary" className="w-full rounded-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          }
        />
        <SheetContent
          side="right"
          className="w-[70%] px-5 pb-5 sm:w-[400px] bg-background border-border"
        >
          <SheetHeader>
            <SheetTitle className="text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent-7" />
              Form Settings
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-auto">
            <SettingsContent
              form={form}
              isTestUser={isTestUser}
              onUpdateSettings={onUpdateSettings}
              onSlugChange={onSlugChange}
              onSlugBlur={onSlugBlur}
              onUploadThemeAsset={onUploadThemeAsset}
              isThemeAssetUploading={isThemeAssetUploading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
