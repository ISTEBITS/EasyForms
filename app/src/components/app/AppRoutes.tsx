import { useLocation, useNavigate, Route, Routes, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { PublicForm } from "@/pages/PublicForm";
import { Dashboard } from "@/pages/Dashboard";
import { LandingPage } from "@/pages/LandingPage";
import { TestUserSignupPage } from "@/pages/TestUserSignupPage";
import ProtectedRoute from "./ProtectedRoute";
import { FormResponses } from "@/pages/FormResponses";
import EditorWrapper from "./EditorWrapper";
import ProtectedAppShell from "./ProtectedAppShell";
import { EditorFormsPage, ResponsesFormsPage } from "@/pages/FormCollections";
import { ApiKeysPage } from "@/pages/ApiKeysPage";
import { ActivityPage } from "@/pages/ActivityPage";
import { MailTemplatesPage } from "@/pages/MailTemplatesPage";

export default function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Routes location={location} key={location.pathname}>
      {/* === PUBLIC ROUTES === */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/test-signup" element={<TestUserSignupPage />} />
      <Route path="/form/:formId" element={<PublicForm />} />
      <Route path="/form" element={<PublicForm />} />

      {/* === PROTECTED ROUTES === */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedAppShell />}>
          <Route
            path="/dashboard"
            element={
              <Dashboard
                onEditForm={(form) =>
                  navigate(`/editor/${form.id || form._id}${location.search || ""}`, {
                    state: { form },
                  })
                }
              />
            }
          />

          <Route path="/editor" element={<EditorFormsPage />} />

          <Route
            path="/editor/:formId"
            element={
              <EditorWrapper
                onBack={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate(`/dashboard${location.search || ""}`);
                  }
                }}
              />
            }
          />

          <Route path="/responses" element={<ResponsesFormsPage />} />

          <Route path="/form/:id/responses" element={<FormResponses />} />

          <Route path="/api-keys" element={<ApiKeysPage />} />

          <Route path="/mail" element={<MailTemplatesPage />} />

          <Route path="/activity" element={<ActivityPage />} />
        </Route>

        {/* Fallback: Send to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
