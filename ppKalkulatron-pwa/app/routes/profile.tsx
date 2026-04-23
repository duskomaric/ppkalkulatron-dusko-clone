import { useState, useEffect } from "react";
import type { SyntheticEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/hooks/useAuth";
import { AppLayout } from "~/components/layout/AppLayout";
import { useTheme } from "~/hooks/useTheme";
import {
    UserIcon,
    CogIcon as SettingsIcon,
    MoonIcon,
    SunIcon,
    MonitorIcon,
    LogOutIcon,
    ChevronRightIcon,
    MailIcon, Building2Icon, GlobeIcon
} from "~/components/ui/icons";
import { FormDrawer } from "~/components/ui/FormDrawer";
import { FormInput } from "~/components/ui/FormInput";
import { Toast } from "~/components/ui/Toast";
import { updateUser } from "~/api/users";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { useToast } from "~/hooks/useToast";
import {APP_CONFIG} from "~/config/app";

type LanguageCode = "en" | "bs" | "hr" | "sr_Latn" | "sr_Cyrl" | "fr" | "de" | "it" | "ru";

const profileTranslations: Record<LanguageCode, Record<string, string>> = {
    en: { profile: "Profile", themeSettings: "Theme Settings", account: "Account", editData: "Edit details", logout: "Log out", editTitle: "Edit details", saveChanges: "Save changes", firstName: "First name", lastName: "Last name", email: "Email", language: "Language", updateSuccess: "Profile updated successfully", updateError: "Error updating profile", light: "Light", dark: "Dark", system: "System" },
    bs: { profile: "Profil", themeSettings: "Postavke teme", account: "Račun", editData: "Uredi podatke", logout: "Odjavi se", editTitle: "Uredi podatke", saveChanges: "Sačuvaj izmjene", firstName: "Ime", lastName: "Prezime", email: "Email", language: "Jezik", updateSuccess: "Profil uspješno ažuriran", updateError: "Greška pri ažuriranju profila", light: "Svijetla", dark: "Tamna", system: "Sistemska" },
    hr: { profile: "Profil", themeSettings: "Postavke teme", account: "Račun", editData: "Uredi podatke", logout: "Odjavi se", editTitle: "Uredi podatke", saveChanges: "Spremi promjene", firstName: "Ime", lastName: "Prezime", email: "E-mail", language: "Jezik", updateSuccess: "Profil je uspješno ažuriran", updateError: "Greška pri ažuriranju profila", light: "Svijetla", dark: "Tamna", system: "Sistemska" },
    "sr_Latn": { profile: "Profil", themeSettings: "Postavke teme", account: "Račun", editData: "Uredi podatke", logout: "Odjavi se", editTitle: "Uredi podatke", saveChanges: "Sačuvaj izmjene", firstName: "Ime", lastName: "Prezime", email: "Email", language: "Jezik", updateSuccess: "Profil uspešno ažuriran", updateError: "Greška pri ažuriranju profila", light: "Svetla", dark: "Tamna", system: "Sistemska" },
    "sr_Cyrl": { profile: "Профил", themeSettings: "Подешавања теме", account: "Налог", editData: "Уреди податке", logout: "Одјави се", editTitle: "Уреди податке", saveChanges: "Сачувај измене", firstName: "Име", lastName: "Презиме", email: "Имејл", language: "Језик", updateSuccess: "Профил је успешно ажуриран", updateError: "Грешка при ажурирању профила", light: "Светла", dark: "Тамна", system: "Системска" },
    fr: { profile: "Profil", themeSettings: "Paramètres du thème", account: "Compte", editData: "Modifier les informations", logout: "Se déconnecter", editTitle: "Modifier les informations", saveChanges: "Enregistrer les modifications", firstName: "Prénom", lastName: "Nom", email: "E-mail", language: "Langue", updateSuccess: "Profil mis à jour avec succès", updateError: "Erreur lors de la mise à jour du profil", light: "Clair", dark: "Sombre", system: "Système" },
    de: { profile: "Profil", themeSettings: "Design-Einstellungen", account: "Konto", editData: "Daten bearbeiten", logout: "Abmelden", editTitle: "Daten bearbeiten", saveChanges: "Änderungen speichern", firstName: "Vorname", lastName: "Nachname", email: "E-Mail", language: "Sprache", updateSuccess: "Profil erfolgreich aktualisiert", updateError: "Fehler beim Aktualisieren des Profils", light: "Hell", dark: "Dunkel", system: "System" },
    it: { profile: "Profilo", themeSettings: "Impostazioni tema", account: "Account", editData: "Modifica dati", logout: "Disconnettiti", editTitle: "Modifica dati", saveChanges: "Salva modifiche", firstName: "Nome", lastName: "Cognome", email: "Email", language: "Lingua", updateSuccess: "Profilo aggiornato con successo", updateError: "Errore durante l'aggiornamento del profilo", light: "Chiaro", dark: "Scuro", system: "Sistema" },
    ru: { profile: "Профиль", themeSettings: "Настройки темы", account: "Аккаунт", editData: "Редактировать данные", logout: "Выйти", editTitle: "Редактировать данные", saveChanges: "Сохранить изменения", firstName: "Имя", lastName: "Фамилия", email: "Email", language: "Язык", updateSuccess: "Профиль успешно обновлен", updateError: "Ошибка при обновлении профиля", light: "Светлая", dark: "Темная", system: "Системная" },
};

export default function ProfilePage() {
    const { user, token, selectedCompany, updateSelectedCompany, logoutAction, updateUserAction } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    
    const { toast, showToast, hideToast } = useToast();

    // User Edit State
    const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [userForm, setUserForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        language: "sr_Latn",
    });
    const languageOptions = [
        { value: "en", label: "English" },
        { value: "bs", label: "Bosanski" },
        { value: "hr", label: "Hrvatski" },
        { value: "sr_Latn", label: "Srpski (Latinica)" },
        { value: "sr_Cyrl", label: "Srpski (Ćirilica)" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
        { value: "it", label: "Italian" },
        { value: "ru", label: "Russian" },
    ] as const;

    // Init company handled by useAuth

    useEffect(() => {
        if (user) {
            setUserForm({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                language: user.language || "sr_Latn",
            });
        }
    }, [user]);

    const handleUserUpdate = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!user || !token) return;

        setUserLoading(true);
        try {
            const response = await updateUser(user.id, token, userForm);
            updateUserAction(response.data);
            showToast(t.updateSuccess, "success");
            setIsUserDrawerOpen(false);
        } catch (error) {
            showToast(t.updateError, "error");
        } finally {
            setUserLoading(false);
        }
    };

    const currentLanguage = ((user?.language || userForm.language || "sr_Latn") as LanguageCode);
    const t = profileTranslations[currentLanguage] || profileTranslations["sr_Latn"];

    const themes = [
        { id: "light", label: t.light, icon: SunIcon },
        { id: "dark", label: t.dark, icon: MoonIcon },
        { id: "system", label: t.system, icon: MonitorIcon },
    ] as const;

    const handleLogout = () => {
        logoutAction();
        navigate("/");
    };

    return (
        <AppLayout
            title={t.profile}
            selectedCompany={selectedCompany}
            onCompanyChange={updateSelectedCompany}
        >
            <div className="space-y-6 pb-20">
                {/* User Info Card */}
                <div className="p-5 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <UserIcon className="h-16 w-16 text-[var(--color-text-dim)]" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-glow-primary">
                            {user?.first_name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black text-[var(--color-text-main)] tracking-tighter italic truncate">{user?.first_name} {user?.last_name}</h2>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-dim)] mt-0.5">
                                <MailIcon className="h-3 w-3" />
                                <p className="text-[11px] font-bold tracking-tight truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Theme Settings */}
                <div className="space-y-3">
                    <SectionHeader icon={SettingsIcon} title={t.themeSettings} className="px-1" />

                    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] p-1 flex items-center gap-1">
                        {themes.map((t) => {
                            const Icon = t.icon;
                            const isActive = theme === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all cursor-pointer ${isActive
                                        ? "bg-primary text-white shadow-glow-primary"
                                        : "text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-hover)]"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-3">
                    <SectionHeader icon={Building2Icon} title={t.account} className="px-1" />

                    <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
                        <button 
                            onClick={() => setIsUserDrawerOpen(true)}
                            className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-all text-left cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-[var(--color-border)] rounded-lg flex items-center justify-center text-[var(--color-text-dim)]">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <span className="text-[13px] font-bold text-[var(--color-text-muted)]">{t.editData}</span>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />
                        </button>
                        
                        <div className="h-[1px] w-full bg-[var(--color-border)] mx-4" />
                        
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-all text-left group cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                                    <LogOutIcon className="h-4 w-4" />
                                </div>
                                <span className="text-[13px] font-bold text-red-500">{t.logout}</span>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-[var(--color-text-dim)]" />
                        </button>
                    </div>
                </div>

                {/* App Version Info */}
                <div className="text-center pt-4">
                    <p className="text-[8px] font-black text-[var(--color-text-dim)] uppercase tracking-[0.3em]">
                        {APP_CONFIG.name} {APP_CONFIG.version}
                    </p>
                </div>
            </div>

            {/* User Edit Drawer */}
            <FormDrawer
                isOpen={isUserDrawerOpen}
                onClose={() => setIsUserDrawerOpen(false)}
                title={t.editTitle}
                onSubmit={handleUserUpdate}
                loading={userLoading}
                submitLabel={t.saveChanges}
            >
                <div className="space-y-4">
                    <FormInput
                        label={t.firstName}
                        value={userForm.first_name}
                        onChange={(val: string) => setUserForm({ ...userForm, first_name: val })}
                        placeholder={t.firstName}
                        required
                        icon={UserIcon}
                    />
                    <FormInput
                        label={t.lastName}
                        value={userForm.last_name}
                        onChange={(val: string) => setUserForm({ ...userForm, last_name: val })}
                        placeholder={t.lastName}
                        required
                        icon={UserIcon}
                    />
                    <FormInput
                        label={t.email}
                        value={userForm.email}
                        onChange={(val: string) => setUserForm({ ...userForm, email: val })}
                        placeholder={t.email}
                        type="email"
                        required
                        icon={MailIcon}
                    />
                    <div className="space-y-1.5 w-full group">
                        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--color-text-muted)] ml-1 block">
                            {t.language}
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] group-focus-within:text-primary transition-colors">
                                <GlobeIcon className="h-4 w-4" />
                            </div>
                            <select
                                value={userForm.language}
                                onChange={(e) => setUserForm({ ...userForm, language: e.target.value })}
                                className="w-full h-12 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-bold text-sm pl-11 pr-4"
                            >
                                {languageOptions.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </FormDrawer>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </AppLayout>
    );
}
