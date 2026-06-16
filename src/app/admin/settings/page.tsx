"use client";

import { useEffect, useState } from "react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

type StaffUser = {
  _id: string;
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
};

type SiteSettings = {
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  contactEmail: string;
};

type SettingsSection = "staff" | "password" | "support" | "contactEmail";

const defaultSiteSettings: SiteSettings = {
  supportEmail: "support@bijnoor.com",
  supportPhone: "+919876543210",
  supportWhatsapp: "919999999999",
  contactEmail: "info@bijnoor.com",
};

export default function AdminSettingsPage() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [staffForm, setStaffForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
  });
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  const [otpRequestId, setOtpRequestId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [supportForm, setSupportForm] = useState({
    supportEmail: defaultSiteSettings.supportEmail,
    supportPhone: defaultSiteSettings.supportPhone,
    supportWhatsapp: defaultSiteSettings.supportWhatsapp,
  });
  const [contactEmail, setContactEmail] = useState(defaultSiteSettings.contactEmail);
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  const [isSavingContactEmail, setIsSavingContactEmail] = useState(false);

  const [openSection, setOpenSection] = useState<SettingsSection | null>(null);

  const toggleSection = (section: SettingsSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const authHeader = (): Record<string, string> => {
    const token = localStorage.getItem("authToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  const loadStaff = async () => {
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/staff", { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load staff accounts");
      }
      setStaffUsers(data.staff || []);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load staff accounts");
    }
  };

  const loadSiteSettings = async () => {
    setErrorMessage("");
    try {
      const res = await fetch("/api/admin/site-settings", { headers: authHeader() });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load site settings");
      }

      const settings: SiteSettings = {
        supportEmail: String(data.settings?.supportEmail || defaultSiteSettings.supportEmail),
        supportPhone: String(data.settings?.supportPhone || defaultSiteSettings.supportPhone),
        supportWhatsapp: String(data.settings?.supportWhatsapp || defaultSiteSettings.supportWhatsapp),
        contactEmail: String(data.settings?.contactEmail || defaultSiteSettings.contactEmail),
      };

      setSupportForm({
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        supportWhatsapp: settings.supportWhatsapp,
      });
      setContactEmail(settings.contactEmail);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load site settings");
    }
  };

  useEffect(() => {
    loadStaff();
    loadSiteSettings();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity === 'staff') {
        loadStaff();
      }
      if (event.entity === 'site-settings') {
        loadSiteSettings();
      }
    },
  });

  const handleCreateStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");
    setIsCreatingStaff(true);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff account");
      }

      setStaffForm({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        password: "",
      });
      setStatusMessage("Staff admin account created successfully.");
      setStaffUsers((prev) => [data.staff, ...prev]);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create staff account");
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleSendOtp = async () => {
    setStatusMessage("");
    setErrorMessage("");
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/admin/password-otp/send", {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpRequestId(data.requestId || "");
      const devNote = data.devOtp ? ` (Dev OTP: ${data.devOtp})` : "";
      setStatusMessage(`OTP sent to ${data.email}.${devNote}`);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");

    if (!otpRequestId) {
      setErrorMessage("Send OTP first.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/admin/password-otp/change", {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: otpRequestId,
          otpCode,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      setOtpCode("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpRequestId("");
      setStatusMessage("Password updated successfully.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveSupportDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");
    setIsSavingSupport(true);

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supportEmail: supportForm.supportEmail,
          supportPhone: supportForm.supportPhone,
          supportWhatsapp: supportForm.supportWhatsapp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update support details");
      }

      setStatusMessage("Contact support details updated successfully.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update support details");
    } finally {
      setIsSavingSupport(false);
    }
  };

  const handleSaveContactEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");
    setIsSavingContactEmail(true);

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update contact email");
      }

      setStatusMessage("Contact email updated successfully.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update contact email");
    } finally {
      setIsSavingContactEmail(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading text-dark-text">Settings</h1>
        <p className="mt-2 text-light-text">Manage staff admin IDs and secure password change with email OTP verification.</p>
      </div>

      {statusMessage ? <p className="text-sm text-brand-green">{statusMessage}</p> : null}
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="space-y-4">
        <article className="rounded-2xl border border-beige bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection("staff")}
            className="flex w-full items-center justify-between rounded-2xl px-6 py-5 text-left"
            aria-expanded={openSection === "staff"}
          >
            <div>
              <h2 className="text-xl font-heading text-dark-text">Create Staff Admin ID <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-light-text">Access</span></h2>
              <p className="mt-1 text-sm text-light-text">Create multiple admin panel IDs with username for staff.</p>
            </div>
            <span className="text-2xl text-gold">{openSection === "staff" ? "-" : "+"}</span>
          </button>

          {openSection === "staff" ? (
            <div className="border-t border-beige px-6 pb-6 pt-4">
              <form onSubmit={handleCreateStaff} className="space-y-3">
                <input
                  value={staffForm.username}
                  onChange={(event) => setStaffForm((prev) => ({ ...prev, username: event.target.value.toLowerCase() }))}
                  placeholder="Username (e.g. support_team)"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(event) => setStaffForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Staff email"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={staffForm.firstName}
                    onChange={(event) => setStaffForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    placeholder="First name"
                    className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                    required
                  />
                  <input
                    value={staffForm.lastName}
                    onChange={(event) => setStaffForm((prev) => ({ ...prev, lastName: event.target.value }))}
                    placeholder="Last name"
                    className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                    required
                  />
                </div>
                <input
                  value={staffForm.phone}
                  onChange={(event) => setStaffForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone (optional)"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                />
                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(event) => setStaffForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Temporary password"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />

                <button
                  type="submit"
                  disabled={isCreatingStaff}
                  className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-white hover:brightness-95 disabled:opacity-60"
                >
                  {isCreatingStaff ? "Creating..." : "Create Staff Admin"}
                </button>
              </form>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-dark-text">Existing Admin IDs</h3>
                <div className="mt-2 space-y-2 max-h-60 overflow-auto pr-1">
                  {staffUsers.map((staff) => (
                    <div key={staff._id} className="rounded-lg border border-beige bg-cream px-3 py-2 text-sm">
                      <p className="font-semibold text-dark-text">{staff.firstName} {staff.lastName}</p>
                      <p className="text-light-text">@{staff.username || "no-username"} • {staff.email}</p>
                      <p className="text-xs text-light-text mt-1">
                        Created: {new Date(staff.createdAt).toLocaleDateString("en-IN")}
                        {staff.lastLogin ? ` • Last login: ${new Date(staff.lastLogin).toLocaleDateString("en-IN")}` : ""}
                      </p>
                    </div>
                  ))}
                  {staffUsers.length === 0 ? <p className="text-sm text-light-text">No admin IDs found.</p> : null}
                </div>
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-beige bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection("password")}
            className="flex w-full items-center justify-between rounded-2xl px-6 py-5 text-left"
            aria-expanded={openSection === "password"}
          >
            <div>
              <h2 className="text-xl font-heading text-dark-text">Change Password (Email OTP Required) <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-light-text">Security</span></h2>
              <p className="mt-1 text-sm text-light-text">An OTP is sent to your admin email. Password update is allowed only after OTP verification.</p>
            </div>
            <span className="text-2xl text-gold">{openSection === "password" ? "-" : "+"}</span>
          </button>

          {openSection === "password" ? (
            <div className="border-t border-beige px-6 pb-6 pt-4">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="rounded-lg border border-gold px-4 py-2 font-semibold text-gold hover:bg-gold hover:text-white disabled:opacity-60"
              >
                {isSendingOtp ? "Sending OTP..." : "Send OTP to Email"}
              </button>

              <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                <input
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-white hover:brightness-95 disabled:opacity-60"
                >
                  {isChangingPassword ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-beige bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection("support")}
            className="flex w-full items-center justify-between rounded-2xl px-6 py-5 text-left"
            aria-expanded={openSection === "support"}
          >
            <div>
              <h2 className="text-xl font-heading text-dark-text">Contact Support Details <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-light-text">Support</span></h2>
              <p className="mt-1 text-sm text-light-text">Update support email, phone and WhatsApp details shown across support touchpoints.</p>
            </div>
            <span className="text-2xl text-gold">{openSection === "support" ? "-" : "+"}</span>
          </button>

          {openSection === "support" ? (
            <div className="border-t border-beige px-6 pb-6 pt-4">
              <form onSubmit={handleSaveSupportDetails} className="space-y-3">
                <label className="block text-xs font-semibold text-light-text">Email</label>
                <input
                  type="email"
                  value={supportForm.supportEmail}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, supportEmail: event.target.value }))}
                  placeholder="Support email"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />
                <label className="block text-xs font-semibold text-light-text">Call</label>
                <input
                  value={supportForm.supportPhone}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, supportPhone: event.target.value }))}
                  placeholder="Support phone"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />
                <label className="block text-xs font-semibold text-light-text">Chat</label>
                <input
                  value={supportForm.supportWhatsapp}
                  onChange={(event) => setSupportForm((prev) => ({ ...prev, supportWhatsapp: event.target.value.replace(/\s+/g, "") }))}
                  placeholder="WhatsApp number (e.g. 919999999999)"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />

                <button
                  type="submit"
                  disabled={isSavingSupport}
                  className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-white hover:brightness-95 disabled:opacity-60"
                >
                  {isSavingSupport ? "Saving..." : "Save Support Details"}
                </button>
              </form>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-beige bg-white shadow-sm">
          <button
            type="button"
            onClick={() => toggleSection("contactEmail")}
            className="flex w-full items-center justify-between rounded-2xl px-6 py-5 text-left"
            aria-expanded={openSection === "contactEmail"}
          >
            <div>
              <h2 className="text-xl font-heading text-dark-text">Change Contact Email <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-light-text">Inbox</span></h2>
              <p className="mt-1 text-sm text-light-text">Set the public contact email used for customer communication.</p>
            </div>
            <span className="text-2xl text-gold">{openSection === "contactEmail" ? "-" : "+"}</span>
          </button>

          {openSection === "contactEmail" ? (
            <div className="border-t border-beige px-6 pb-6 pt-4">
              <form onSubmit={handleSaveContactEmail} className="space-y-3">
                <label className="block text-xs font-semibold text-light-text">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="Contact email"
                  className="w-full rounded-lg border border-beige bg-cream px-3 py-2 text-dark-text outline-none focus:border-gold"
                  required
                />

                <button
                  type="submit"
                  disabled={isSavingContactEmail}
                  className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-white hover:brightness-95 disabled:opacity-60"
                >
                  {isSavingContactEmail ? "Saving..." : "Save Contact Email"}
                </button>
              </form>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
