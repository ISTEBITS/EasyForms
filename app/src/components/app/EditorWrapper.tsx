import { useEffect, useState } from "react";
import { Navigate,useLocation, useParams, useSearchParams } from "react-router-dom";
import { Loader } from "lucide-react";
import { FormEditor } from "../form-editor/FormEditor";
import type { Form } from "@/types/form";
import { formsApi } from "@/api";
import { useAuth } from "@/context/auth";
import {
  DASHBOARD_SCOPE_PARAM,
  isFormInDashboardScope,
  normalizeDashboardScope,
} from "@/lib/dashboard-scope";

export default function EditorWrapper({ onBack }: { onBack: () => void }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { formId } = useParams<{ formId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const selectedScope = normalizeDashboardScope(
    searchParams.get(DASHBOARD_SCOPE_PARAM),
  );
  const stateForm = location.state?.form as Form | undefined;
  const [form, setForm] = useState<Form | null>(stateForm ?? null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);

    const fetchForm = async () => {
      if (stateForm && isFormInDashboardScope(stateForm, isAdmin, selectedScope)) {
        setForm(stateForm);
        setLoading(false);
        return;
      }

      if (!formId) {
        setLoading(false);
        setNotFound(true);
        return;
      }

      try {
        setLoading(true);
        const data = await formsApi.getByIdAdmin(formId);
        if (isFormInDashboardScope(data, isAdmin, selectedScope)) {
          setForm(data);
          return;
        }
        setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchForm();
  }, [formId, isAdmin, selectedScope, stateForm]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-accent-5">
          <Loader className="h-4 w-4 animate-spin" />
          Loading editor
        </div>
      </div>
    );
  }

  if (notFound || !form) {
    return <Navigate to={`/editor${location.search || ""}`} replace />;
  }

  return <FormEditor form={form} onBack={onBack} />;
}
