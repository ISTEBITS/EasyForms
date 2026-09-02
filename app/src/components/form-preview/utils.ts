import type { Question } from "@/types/form";
import type { FormPage, PreviewDevice } from "./types";

export const buildPages = (questions: Question[]): FormPage[] => {
  const pages: FormPage[] = [];
  let currentPage: FormPage = {
    id: "page-1",
    questions: [],
  };
  let index = 1;

  for (const question of questions) {
    if (question.type === "section_break") {
      if (currentPage.questions.length > 0 || pages.length === 0) {
        pages.push(currentPage);
      }
      index += 1;
      currentPage = {
        id: `page-${index}`,
        title: question.title,
        description: question.description,
        questions: [],
      };
      continue;
    }
    currentPage.questions.push(question);
  }

  if (currentPage.questions.length > 0 || pages.length === 0) {
    pages.push(currentPage);
  }

  return pages.filter(
    (page) => page.questions.length > 0 || page.title || page.description,
  );
};

export const getPreviewClasses = (previewDevice: PreviewDevice) => {
  const isForcedMobile = previewDevice === "mobile";

  return {
    previewShellClass:
      previewDevice === "auto"
        ? "relative border-none bg-transparent overflow-hidden p-0"
        : "relative bg-background overflow-hidden",
    bannerHeightClass:
      previewDevice === "auto"
        ? "relative h-40 w-full sm:h-56"
        : isForcedMobile
          ? "relative h-36 w-full"
          : "relative h-56 w-full",
    headerPaddingClass:
      previewDevice === "auto"
        ? "p-5 sm:p-6"
        : isForcedMobile
          ? "p-4"
          : "p-6",
    questionGridClass: "space-y-4",
  };
};
