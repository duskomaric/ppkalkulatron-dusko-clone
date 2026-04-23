import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppLayout } from "~/components/layout/AppLayout";
import { useAuth } from "~/hooks/useAuth";
import { getMe } from "~/api/config";
import { updateCompanySettings } from "~/api/settings";
import type { CompanySettings } from "~/types/config";
import { Toast } from "~/components/ui/Toast";
import { CheckCircleIcon, MailIcon, InfoIcon } from "~/components/ui/icons";
import { useNavigate, Link } from "react-router";
import { FormInput } from "~/components/ui/FormInput";
import { FormSelect } from "~/components/ui/FormSelect";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { LoadingState } from "~/components/ui/LoadingState";
import { useToast } from "~/hooks/useToast";

type MailSettings = Pick<
    CompanySettings,
    | "mail_from_address"
    | "mail_from_name"
    | "mail_host"
    | "mail_port"
    | "mail_username"
    | "mail_password"
    | "mail_encryption"
>;

const emptyMailSettings: MailSettings = {
    mail_from_address: null,
    mail_from_name: null,
    mail_host: null,
    mail_port: null,
    mail_username: null,
    mail_password: null,
    mail_encryption: null,
};

export default function MailSettingsPage() {
    const { selectedCompany, updateSelectedCompany, token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<MailSettings>(emptyMailSettings);
    const [saving, setSaving] = useState(false);

    const { toast, showToast, hideToast } = useToast();

    useEffect(() => {
        if (!token || !selectedCompany) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const meRes = await getMe(token, selectedCompany.slug);
                const s = meRes.data.company_settings;
                if (s) {
                    setFormData({
                        mail_from_address: s.mail_from_address ?? null,
                        mail_from_name: s.mail_from_name ?? null,
                        mail_host: s.mail_host ?? null,
                        mail_port: s.mail_port ?? null,
                        mail_username: s.mail_username ?? null,
                        mail_password: s.mail_password ?? null,
                        mail_encryption: s.mail_encryption ?? null,
                    });
                }
            } catch {
                showToast("Greška pri učitavanju podešavanja", "error");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token, selectedCompany]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token) return;

        setSaving(true);
        try {
            await updateCompanySettings(selectedCompany.slug, token, formData);
            showToast("Podešavanja maila sačuvana", "success");
        } catch {
            showToast("Greška pri čuvanju", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!selectedCompany) return null;

    return (
        <AppLayout
            title="Mail"
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
        >
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />

            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-dim)] hover:text-primary transition-colors mb-4 cursor-pointer"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Nazad
                </button>
            </div>

            {loading && (
                <LoadingState />
            )}

            {!loading && (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionBlock variant="card">
                        <SectionHeader
                            icon={MailIcon}
                            title="Slanje maila"
                            rightElement={
                                <Link
                                    to="/help#mail-setup"
                                    className="h-8 w-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-dim)] hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                                    title="Pomoć: Mail podešavanja"
                                >
                                    <InfoIcon className="h-4 w-4" />
                                </Link>
                            }
                        />
                        <p className="text-sm text-[var(--color-text-dim)] mb-4">
                            Podešavanja za slanje faktura i fiskalnih računa. Možete koristiti vlastiti SMTP server (Gmail, Outlook, itd.) da šaljete kao iz svog inboxa. Ako SMTP nije podešen, koristi se sistemska konfiguracija.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <FormInput
                                label="Email adresa (from)"
                                type="email"
                                value={formData.mail_from_address || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_from_address: val || null })}
                                placeholder="npr. fakture@firma.ba"
                            />
                            <FormInput
                                label="Ime pošiljaoca"
                                type="text"
                                value={formData.mail_from_name || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_from_name: val || null })}
                                placeholder="npr. Firma d.o.o."
                            />
                        </div>
                        <h4 className="text-sm font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-3">SMTP server (opciono)</h4>
                        <p className="text-xs text-[var(--color-text-dim)] mb-4">
                            Za Gmail: host smtp.gmail.com, port 587, encryption TLS. Za Outlook: smtp.office365.com. Uključite „manje sigurne aplikacije“ ili koristite App Password.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                                label="SMTP host"
                                type="text"
                                value={formData.mail_host || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_host: val || null })}
                                placeholder="npr. smtp.gmail.com"
                            />
                            <FormInput
                                label="SMTP port"
                                type="number"
                                value={formData.mail_port ?? ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_port: val ? parseInt(val, 10) : null })}
                                placeholder="587"
                            />
                            <FormSelect
                                label="Enkripcija"
                                value={formData.mail_encryption || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_encryption: val || null })}
                                options={[
                                    { value: "", label: "—" },
                                    { value: "tls", label: "TLS" },
                                    { value: "ssl", label: "SSL" },
                                ]}
                            />
                            <FormInput
                                label="SMTP korisničko ime"
                                type="text"
                                value={formData.mail_username || ""}
                                onChange={(val: string) => setFormData({ ...formData, mail_username: val || null })}
                                placeholder="npr. vas@email.com"
                            />
                            <div className="md:col-span-2">
                                <FormInput
                                    label="SMTP lozinka"
                                    type="password"
                                    value={formData.mail_password || ""}
                                    onChange={(val: string) => setFormData({ ...formData, mail_password: val || null })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </SectionBlock>

                    <div className="flex justify-end pt-4">
                        <button
                            disabled={saving}
                            type="submit"
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-glow-primary transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {saving ? "Čuvanje..." : "Sačuvaj Promjene"}
                            {!saving && <CheckCircleIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </form>
            )}
        </AppLayout>
    );
}
