import React, { useState, useEffect } from "react";
import { Printer, Loader2 } from "lucide-react";
import cvsuHeaderAsset from "@/assets/cvsu-header-HD.png";

interface PrintPeriodSummaryProps {
    scheduleId: string;
    period: "midterms" | "finals";
    isPreparing: boolean;
    setIsPreparing: (state: boolean) => void;
}

interface IloRow { co_name: string; ilo_name: string; attainment_score: number; attainment_target: number; remarks: string; }
interface CoRow { co_name: string; attainment_score: number; attainment_target: number; remarks: string; }
interface ActionRow { ilo_name: string; action_plan_summary: string; proposed_timeline: string; comment: string; }

const PrintPeriodSummary: React.FC<PrintPeriodSummaryProps> = ({ scheduleId, period, isPreparing, setIsPreparing }) => {
    const [headerBase64, setHeaderBase64] = useState<string>("");
    useEffect(() => {
        const convertAssetToBase64 = async () => {
            try {
                const response = await fetch(cvsuHeaderAsset);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setHeaderBase64(reader.result as string);
                };
                reader.readAsDataURL(blob);
            } catch (err) {
                console.error("Failed to parse local print header image asset asset configuration mapping:", err);
            }
        };
        convertAssetToBase64();
    }, []);

    const triggerPrintLayout = async () => {
        try {
            setIsPreparing(true);
            const [resIlo, resCo, resAction] = await Promise.all([
                fetch(`/cqi/api/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=co_summary`),
                fetch(`/cqi/api/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=ilo_summary`),
                fetch(`/cqi/api/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=action_summary`)
            ]);

            const [dataIlo, dataCo, dataAction] = await Promise.all([resIlo.json(), resCo.json(), resAction.json()]);

            const iloData: IloRow[] = dataIlo.summary_data || [];
            const coData: CoRow[] = dataCo.summary_data || [];
            const actionData: ActionRow[] = dataAction.summary_data || [];

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                alert("Popup blocker prevented compiling the print document template layout.");
                return;
            }

            printWindow.document.write(`
                <html>
                <head>
                    <title>${period.toUpperCase()} OVERALL SUMMARY</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; font-size: 11px; padding: 25px; }
                        
                        /* HEADER BRAND IMAGE BLOCK DESIGN MODEL */
                        .header-banner-container { width: 100%; text-align: center; margin-bottom: 40px; }
                        .header-banner-container img { width: 50%; height: auto; max-width: 100%; display: block; margin: 0 auto; }
                        
                        .section { margin-bottom: 30px; page-break-inside: avoid; }
                        .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; color: #0f172a; border-left: 3px solid #0284c7; padding-left: 6px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                        th { background-color: #f8fafc; border: 1px solid #cbd5e1; font-weight: 700; text-transform: uppercase; font-size: 9px; padding: 7px 6px; text-align: left; color: #334155; }
                        td { border: 1px solid #cbd5e1; padding: 7px 6px; font-size: 10px; color: #334155; }
                        .text-center { text-align: center; }
                        .font-bold { font-weight: 700; }
                        .bg-yellow { background-color: rgba(254, 240, 138, 0.25); }
                    </style>
                </head>
                <body>
                    <div class="header-banner-container">
                        ${headerBase64 ? `<img src="${headerBase64}" alt="CvSU Academic Header Branding" />` : ``}
                        <p style="font-size: 9px; font-weight: normal; color: #64748b; text-align: center; margin-top: 6px;">Class Schedule ID: ${scheduleId} | Compiled on: ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div class="section">
                        <div class="section-title">Learning Outcome Summary</div>
                        <table>
                            <thead style="background-color: #f1f5f9;">
                                <tr>
                                    <th style="width: 25%;">Course Outcome</th>
                                    <th style="width: 35%;">Intended Learning Outcome</th>
                                    <th style="text-align: center; width: 15%;">Attainment Score</th>
                                    <th style="text-align: center; width: 15%;">Target Threshold</th>
                                    <th style="text-align: center; width: 10%;">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${iloData.length === 0 ? '<tr><td colspan="5" class="text-center">No active mapped rows found.</td></tr>' : 
                                  iloData.map(row => `
                                    <tr>
                                        <td class="bg-yellow font-bold">CO ${row.co_name || '—'}</td>
                                        <td class="font-bold">ILO ${row.ilo_name}</td>
                                        <td class="text-center font-bold">${Math.round(row.attainment_score)}%</td>
                                        <td class="text-center" style="color: #94a3b8;">${Math.round(row.attainment_target)}%</td>
                                        <td class="text-center font-bold" style="color: ${row.remarks === 'ATTAINED' ? '#16a34a' : '#dc2626'}">${row.remarks}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">Course Outcome Summary</div>
                        <table>
                            <thead style="background-color: #f1f5f9;">
                                <tr>
                                    <th style="width: 40%;">Course Outcome #</th>
                                    <th style="text-align: center; width: 20%;">Average Attainment Score</th>
                                    <th style="text-align: center; width: 20%;">Target Percentage</th>
                                    <th style="text-align: center; width: 20%;">Status Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${coData.length === 0 ? '<tr><td colspan="4" class="text-center">No active course summaries aggregated.</td></tr>' : 
                                  coData.map(row => `
                                    <tr>
                                        <td class="bg-yellow font-bold">CO ${row.co_name}</td>
                                        <td class="text-center font-bold">${Math.round(row.attainment_score)}%</td>
                                        <td class="text-center" style="color: #94a3b8;">${Math.round(row.attainment_target)}%</td>
                                        <td class="text-center font-bold" style="color: ${row.remarks === 'ATTAINED' ? '#16a34a' : '#dc2626'}">${row.remarks}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">Action Plan Summary</div>
                        <table>
                            <thead style="background-color: #f1f5f9;">
                                <tr>
                                    <th style="width: 20%; text-align: center;">Intended LO #</th>
                                    <th style="width: 40%;">Action Plan Summary</th>
                                    <th style="width: 20%; text-align: center;">Proposed Timeline</th>
                                    <th style="width: 20%;">Comment Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${actionData.length === 0 ? '<tr><td colspan="4" class="text-center">No action entries compiled.</td></tr>' : 
                                  actionData.map(row => `
                                    <tr>
                                        <td class="text-center font-bold">ILO ${row.ilo_name}</td>
                                        <td style="color: #475569; font-weight: 500;">${row.action_plan_summary || '—'}</td>
                                        <td class="bg-yellow font-bold text-center">${row.proposed_timeline || '—'}</td>
                                        <td style="color: #475569;">${row.comment || '—'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);

        } catch (err) {
            console.error(err);
            alert("Failed compiling print parameters report card data.");
        } finally {
            setIsPreparing(false);
        }
    };

    return (
        <button
            type="button"
            onClick={triggerPrintLayout}
            disabled={isPreparing}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold font-montserrat uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
            {isPreparing ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling Report...
                </>
            ) : (
                <>
                    <Printer className="w-3.5 h-3.5" /> Print Summary Report
                </>
            )}
        </button>
    );
};

export default PrintPeriodSummary;
