import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";

export default function ProtocolHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { selectedCompany, updateSelectedCompany } = useAuth();
    const url = searchParams.get("url");

    useEffect(() => {
        if (url) {
            const path = url.replace("web+kalkulatron://", "");
            if (path) {
                navigate(`/${path}`, { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        } else {
            navigate("/", { replace: true });
        }
    }, [url, navigate]);

    return (
        <AppLayout
            title="Protokol"
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
        >
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white/60">Obrađivanje zahtjeva...</p>
            </div>
        </AppLayout>
    );
}
