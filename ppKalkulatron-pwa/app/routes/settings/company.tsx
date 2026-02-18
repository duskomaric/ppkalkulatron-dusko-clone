import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { AppLayout } from "~/components/layout/AppLayout";
import {
    CheckCircleIcon,
    Building2Icon
} from "~/components/ui/icons";
import { Toast } from "~/components/ui/Toast";
import { updateCompany } from "~/api/companies";
import { FormInput } from "~/components/ui/Input";
import { SectionBlock } from "~/components/ui/SectionBlock";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { useToast } from "~/hooks/useToast";

export default function CompanyProfilePage() {
    const { user, token, selectedCompany, updateSelectedCompany, updateUserAction } = useAuth();
    const navigate = useNavigate();
    
    const { toast, showToast, hideToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postal_code: "",
        country: "",
        website: "",
        identification_number: "",
        vat_number: "",
    });

    // Init company handled by useAuth

    useEffect(() => {
        if (selectedCompany) {
            setFormData({
                name: selectedCompany.name || "",
                email: selectedCompany.email || "",
                phone: selectedCompany.phone || "",
                address: selectedCompany.address || "",
                city: selectedCompany.city || "",
                postal_code: selectedCompany.postal_code || "",
                country: selectedCompany.country || "",
                website: selectedCompany.website || "",
                identification_number: selectedCompany.identification_number || "",
                vat_number: selectedCompany.vat_number || "",
            });
        }
    }, [selectedCompany]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedCompany || !token) return;

        setLoading(true);
        try {
            const response = await updateCompany(selectedCompany.id, token, formData);
            updateSelectedCompany(response.data);
            
            if (user) {
                const updatedCompanies = user.companies.map(c => 
                    c.id === response.data.id ? response.data : c
                );
                updateUserAction({ ...user, companies: updatedCompanies });
            }
            
            showToast("Podaci o kompaniji uspješno ažurirani", "success");
        } catch (error) {
            showToast("Greška pri ažuriranju podataka kompanije", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!selectedCompany) return null;

    return (
        <AppLayout
            title="Profil kompanije"
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

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionBlock variant="card" className="sm:p-8 space-y-6">
                    <SectionHeader icon={Building2Icon} title="Osnovni podaci" />
                    <FormInput
                        label="Naziv kompanije"
                        value={formData.name}
                        onChange={(val: string) => setFormData({ ...formData, name: val })}
                        placeholder="Naziv kompanije"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormInput
                            label="Email"
                            value={formData.email}
                            onChange={(val: string) => setFormData({ ...formData, email: val })}
                            placeholder="Email"
                            type="email"
                        />
                        <FormInput
                            label="Telefon"
                            value={formData.phone}
                            onChange={(val: string) => setFormData({ ...formData, phone: val })}
                            placeholder="Telefon"
                        />
                    </div>
                    <FormInput
                        label="Adresa"
                        value={formData.address}
                        onChange={(val: string) => setFormData({ ...formData, address: val })}
                        placeholder="Adresa"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormInput
                            label="Grad"
                            value={formData.city}
                            onChange={(val: string) => setFormData({ ...formData, city: val })}
                            placeholder="Grad"
                        />
                        <FormInput
                            label="Poštanski broj"
                            value={formData.postal_code}
                            onChange={(val: string) => setFormData({ ...formData, postal_code: val })}
                            placeholder="Poštanski broj"
                        />
                    </div>
                    <FormInput
                        label="Država"
                        value={formData.country}
                        onChange={(val: string) => setFormData({ ...formData, country: val })}
                        placeholder="Država"
                    />
                    <FormInput
                        label="Web stranica"
                        value={formData.website}
                        onChange={(val: string) => setFormData({ ...formData, website: val })}
                        placeholder="Web stranica"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FormInput
                            label="JIB"
                            value={formData.identification_number}
                            onChange={(val: string) => setFormData({ ...formData, identification_number: val })}
                            placeholder="JIB"
                        />
                        <FormInput
                            label="PIB"
                            value={formData.vat_number}
                            onChange={(val: string) => setFormData({ ...formData, vat_number: val })}
                            placeholder="PIB"
                        />
                    </div>
                </SectionBlock>

                <div className="flex justify-end pt-4">
                    <button
                        disabled={loading}
                        type="submit"
                        className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-glow-primary transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                        {loading ? "Čuvanje..." : "Sačuvaj Promjene"}
                        {!loading && <CheckCircleIcon className="h-5 w-5" />}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
