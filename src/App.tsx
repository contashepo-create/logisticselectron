import React, { useState, useEffect } from "react";
import type { Company, LicenseInfo } from "./types";
import type { ActiveTab } from "./components/Sidebar";
import {
  getCompany,
  getLicenseInfo,
} from "./lib/storage";

import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { NotificationBanner } from "./components/NotificationBanner";
import { LicenseModal } from "./components/LicenseModal";

import { DashboardView } from "./views/DashboardView";
import { InvoicesView } from "./views/InvoicesView";
import { ReceiptsView } from "./views/ReceiptsView";
import { PaymentsView } from "./views/PaymentsView";
import { CustomersView } from "./views/CustomersView";
import { SuppliersView } from "./views/SuppliersView";
import { VehiclesView } from "./views/VehiclesView";
import { EmployeesView } from "./views/EmployeesView";
import { TreasuryView } from "./views/TreasuryView";
import { ReportsView } from "./views/ReportsView";
import { TelegramBotView } from "./views/TelegramBotView";
import { SupportChatView } from "./views/SupportChatView";
import { AboutAppView } from "./views/AboutAppView";
import { SettingsView } from "./views/SettingsView";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [company, setCompany] = useState<Company>(() => getCompany());
  const [license, setLicense] = useState<LicenseInfo>(() => getLicenseInfo());
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("logistics_theme");
    return (saved as "light" | "dark") || "dark";
  });

  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("logistics_theme", theme);
  }, [theme]);

  // Periodic license check
  useEffect(() => {
    const lic = getLicenseInfo();
    setLicense(lic);
    const interval = setInterval(() => {
      setLicense(getLicenseInfo());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshAllData = () => {
    setCompany(getCompany());
    setLicense(getLicenseInfo());
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header
          company={company}
          license={license}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
          onRefreshData={refreshAllData}
        />

        {/* Gentle 5-Day & Expiry Warning Banner */}
        <NotificationBanner
          license={license}
          onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
        />

        {/* View Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/70 dark:bg-[#0b1329]">
          {activeTab === "dashboard" && (
            <DashboardView
              company={company}
              license={license}
              onNavigate={setActiveTab}
              onNewInvoice={() => setActiveTab("invoices")}
              onNewReceipt={() => setActiveTab("receipts")}
              onNewPayment={() => setActiveTab("payments")}
            />
          )}

          {activeTab === "invoices" && (
            <InvoicesView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "receipts" && (
            <ReceiptsView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "payments" && (
            <PaymentsView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "customers" && (
            <CustomersView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "suppliers" && (
            <SuppliersView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "vehicles" && (
            <VehiclesView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "employees" && (
            <EmployeesView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "treasury" && (
            <TreasuryView company={company} onRefreshData={refreshAllData} />
          )}

          {activeTab === "reports" && (
            <ReportsView company={company} />
          )}

          {activeTab === "telegram" && (
            <TelegramBotView
              company={company}
              license={license}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === "support" && (
            <SupportChatView
              company={company}
              onRefreshData={refreshAllData}
            />
          )}

          {activeTab === "about" && (
            <AboutAppView company={company} />
          )}

          {activeTab === "settings" && (
            <SettingsView
              company={company}
              onRefreshData={refreshAllData}
            />
          )}
        </main>
      </div>

      {/* License Modal */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        company={company}
        license={license}
        onActivated={refreshAllData}
      />
    </div>
  );
};
export default App;
