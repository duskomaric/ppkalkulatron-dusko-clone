import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AppLayout } from "~/components/layout/AppLayout";
import type { Company } from "~/types/company";

export default function ProtocolHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const url = searchParams.get("url");
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    useEffect(() => {
        if (url) {
            // Decode the protocol URL: web+kalkulatron://something
            // Extract the path after the protocol
            const path = url.replace("web+kalkulatron://", "");

            if (path) {
                // Redirect to the internal path
                navigate(`/${path}`, { replace: true });
            } else {
                // Fallback to dashboard/root
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
            onCompanyChange={setSelectedCompany}
        >
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white/60">Obrađivanje zahtjeva...</p>
            </div>
        </AppLayout>
    );
}
