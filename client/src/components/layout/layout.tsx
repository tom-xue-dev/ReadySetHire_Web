import type {ReactNode} from "react";
import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useI18n } from "@/contexts/I18nContext";

export default function Layout({children}: {children: ReactNode}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { t } = useI18n();

    return (
        <div className="min-h-screen flex flex-col">
            <Header  sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            <div className="display-flex flex-1">
                <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-[250px]' : 'ml-[20px]'}`}> {/* Main content */}
                    <main className="flex-1 p-[20px] mt-[20px] ml-[40px]">{children}</main>
                </div>
            </div>

            <footer className="bg-white p-[16px] text-center">{t('common.copyright')}</footer>
        </div>
    )
}
