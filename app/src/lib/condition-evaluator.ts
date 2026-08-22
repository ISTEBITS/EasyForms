import type { Question, QuestionCondition } from "@/types/form";

/**
 * Evaluates a single condition rule against active form answers.
 */
export function evaluateCondition(
  condition: QuestionCondition,
  answers: Record<string, unknown>
): boolean {
  const rawAnswer = answers[condition.fieldId];
  const valueStr = String(condition.value ?? "").toLowerCase().trim();

  let answerStr = "";
  if (Array.isArray(rawAnswer)) {
    answerStr = rawAnswer.join(", ").toLowerCase();
  } else if (rawAnswer !== undefined && rawAnswer !== null) {
    answerStr = String(rawAnswer).toLowerCase().trim();
  }

  const isFilled =
    rawAnswer !== undefined &&
    rawAnswer !== null &&
    String(rawAnswer).trim() !== "";

  switch (condition.operator) {
    case "equals":
      return answerStr === valueStr;
    case "not_equals":
      return answerStr !== valueStr;
    case "contains":
      return answerStr.includes(valueStr);
    case "greater_than": {
      const numAnswer = Number(rawAnswer);
      const numVal = Number(condition.value);
      return !isNaN(numAnswer) && !isNaN(numVal) && numAnswer > numVal;
    }
    case "less_than": {
      const numAnswer = Number(rawAnswer);
      const numVal = Number(condition.value);
      return !isNaN(numAnswer) && !isNaN(numVal) && numAnswer < numVal;
    }
    case "is_filled":
      return isFilled;
    case "is_empty":
      return !isFilled;
    default:
      return true;
  }
}

/**
 * Determines whether a question is visible based on its conditions and current form answers.
 */
export function isQuestionVisible(
  question: Question,
  answers: Record<string, unknown>
): boolean {
  if (!question.conditions || question.conditions.length === 0) {
    return true;
  }

  const operator = question.logicOperator || "AND";

  if (operator === "OR") {
    return question.conditions.some((cond) => {
      const isMet = evaluateCondition(cond, answers);
      return cond.action === "hide" ? !isMet : isMet;
    });
  }

  // AND operator
  return question.conditions.every((cond) => {
    const isMet = evaluateCondition(cond, answers);
    return cond.action === "hide" ? !isMet : isMet;
  });
}
