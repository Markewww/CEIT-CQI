import React, { useState, useEffect } from "react";
import { Printer, Loader2 } from "lucide-react";
import cvsuHeaderAsset from "@/assets/cvsu-header-bagong-pilipinas-HD.png";
import { APIconfig } from "@/config/apiConfig";

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

    // Convert local asset to Base64 to bypass print window access restrictions [INDEX: 0.1.7]
    useEffect(() => {
        const convertAssetToBase64 = async () => {
            try {
                const response = await fetch(cvsuHeaderAsset);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => { setHeaderBase64(reader.result as string); };
                reader.readAsDataURL(blob);
            } catch (err) {
                console.error("Failed to parse local print header image asset configuration:", err);
            }
        };
        convertAssetToBase64();
    }, []);

    const triggerPrintLayout = async () => {
        try {
            setIsPreparing(true);
            
            // 1. Fetch current active professor out of local storage [INDEX: 0.1.7]
            const sessionUserStr = localStorage.getItem("user");
            let currentUserName = "Assigned Faculty Member";
            if (sessionUserStr) {
                const parsedUser = JSON.parse(sessionUserStr);
                if (parsedUser.first_name && parsedUser.last_name) {
                    currentUserName = `${parsedUser.first_name} ${parsedUser.last_name}`;
                }
            }

            // 2. Fetch records sequentially to avoid parallel query race condition lockouts [INDEX: 0.1.8]
            const resIlo = await fetch(`${APIconfig}/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=ilo_summary`);
            const dataIlo = await resIlo.json();

            const resCo = await fetch(`${APIconfig}/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=co_summary`);
            const dataCo = await resCo.json();

            const resAction = await fetch(`${APIconfig}/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=action_summary`);
            const dataAction = await resAction.json();

            const resSig = await fetch(`${APIconfig}/faculty/get_signatories.php?schedule_id=${scheduleId}&_t=${Date.now()}`); // ◄ FORCE FRESH FETCH
            const dataSig = await resSig.json();

            const iloData: IloRow[] = dataIlo.summary_data || [];
            const coData: CoRow[] = dataCo.summary_data || [];
            const actionData: ActionRow[] = dataAction.summary_data || [];

            // FIXED: Point these variables to read from your dedicated dataSig response object [INDEX: 0.1.32]
            const chairPerson = dataSig.signatories?.chairperson || "No Assigned Program Head";
            const deptHead = dataSig.signatories?.department_head || "No Assigned Department Chair";
            const deanName = dataSig.signatories?.dean || "No Assigned Dean";

            const printWindow = window.open("", "_blank");
            if (!printWindow) {
                alert("Popup blocker prevented compiling the print document template layout.");
                return;
            }

            // 4. Inject compilation templates using pure unescaped string literals [INDEX: 0.1.2]
            printWindow.document.write(`
                <html>
                <head>
                    <title>${period.toUpperCase()} PERIOD SUMMARY REPORT</title>
                    <style>
                    /* Cleaned up outer layout margins to shift everything upward */
                    @page {
                        margin: 1.2cm 1.5cm 1.5cm 1.5cm;
                    }
                    body { 
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                        color: #1e293b; 
                        font-size: 10px; /* Streamlined default layout text size */
                        padding: 0; 
                        margin: 0;
                        line-height: 1.4; 
                    }
                            
                    .header-banner-container { 
                        width: 100%; 
                        text-align: center; 
                        margin-top: -15px; /* Pulls header image up closer to top margin edge */
                        margin-bottom: 20px; /* Reduced bottom gap space layout */
                    }
                    .header-banner-container img { 
                        width: 100%; 
                        height: auto; 
                        max-width: 100%; 
                        display: block; 
                        margin: 0 auto; 
                    }
                    .metadata-subtitle { 
                        font-size: 8px; /* Slightly more compact descriptive subtext font size */
                        font-weight: 600; 
                        color: #64748b; 
                        text-align: left; 
                        margin-top: 6px; 
                        text-transform: uppercase; 
                        letter-spacing: 0.5px; 
                    }
                            
                    .section { 
                        margin-bottom: 20px; 
                        page-break-inside: avoid; 
                    }
                    .section-title { 
                        font-size: 10px;
                        font-weight: 900; 
                        text-transform: uppercase; 
                        margin-bottom: 8px; 
                        color: #0f172a; 
                        border-left: 3px solid #1b4d3e; 
                        padding-left: 6px; 
                        text-align: left;
                    }
                            
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 12px; 
                        page-break-inside: avoid; 
                    }
                            
                    /* COMPACTED TABLE HEADERS ACCENT COLORS AND FONT METRICS */
                    th { 
                        background-color: #1b4d3e !important; 
                        color: #ffffff !important; 
                        border: 1px solid #cbd5e1; 
                        font-weight: 800; 
                        text-transform: uppercase; 
                        font-size: 8.5px; /* Compact table header font layout */
                        padding: 6px 6px;  /* Reduced cell padding to save space */
                        text-align: left; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                            
                    /* COMPACTED DATA CELLS BODY ROWS AND TEXT COLORS */
                    td { 
                        border: 1px solid #cbd5e1; 
                        padding: 5px 6px;  /* Reduced internal padding to shrink body text grid */
                        font-size: 9px;   /* Smaller, compact body typography scale matching dashboards */
                        color: #334155; 
                    }
                            
                    .hover-row-text { font-weight: 700; color: #0f172a; }
                    .text-center { text-align: center; }
                    .font-black { font-weight: 900; }
                            
                    .attained-status { color: #16a34a !important; font-weight: 900; text-transform: uppercase; }
                    .not-attained-status { color: #dc2626 !important; font-weight: 900; text-transform: uppercase; }
                            
                    .bg-yellow-cell { 
                        background-color: rgba(254, 240, 138, 0.35) !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                            
                    /* SIGNATORY SECTION COMPONENT STRUCTURAL BOUNDS */
                    .signatory-board { 
                        width: 100%; 
                        margin-top: 30px; 
                        page-break-inside: avoid; 
                        border-collapse: collapse; 
                    }
                    .signatory-row-block { 
                        width: 50%; 
                        padding: 10px 40px 15px 0px; 
                        vertical-align: top; 
                        border: none; 
                    }
                    .sig-meta-header { 
                        font-size: 8.5px; 
                        font-weight: 800; 
                        color: #475569; 
                        text-transform: uppercase; 
                        letter-spacing: 0.5px; 
                    }
                    .sig-printed-name { 
                        font-size: 10px; 
                        font-weight: 700; 
                        color: #0f172a; 
                        margin-top: 20px; 
                        text-transform: uppercase; 
                        text-align: center;
                        margin-right: 60px;
                    }
                    .sig-underline-marker { 
                        width: 85%; 
                        border-bottom: 1px solid #64748b; 
                        margin-top: 4px; 
                    }
                </style>
                </head>
                <body>
                    <div class="header-banner-container">
                        ${headerBase64 ? `<img src="${headerBase64}" alt="CvSU Academic Header Branding" />` : ""}
                        <div class="metadata-subtitle">Class Schedule ID: ${scheduleId}</div>
                        <div class="metadata-subtitle"> Compiled on: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

                    <!-- 1. LEARNING OUTCOME COMPILATION TABLE [INDEX: 0.1.10] -->
                    <div class="section">
                        <div class="section-title">Learning Outcomes Summary Grid</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 25%;">Course Outcome</th>
                                    <th style="width: 35%;">Intended Learning Outcome</th>
                                    <th style="text-align: center; width: 15%;">Attainment Score</th>
                                    <th style="text-align: center; width: 15%;">Target Percentage</th>
                                    <th style="text-align: center; width: 10%;">Remarks Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${iloData.length === 0 ? '<tr><td colspan="5" class="text-center">No active mapped rows found.</td></tr>' : 
                                  iloData.map(row => `
                                    <tr>
                                        <td class="bg-yellow-cell hover-row-text">CO ${row.co_name || "—"}</td>
                                        <td class="hover-row-text">ILO ${row.ilo_name}</td>
                                        <td class="text-center font-black ${row.remarks === "ATTAINED" ? "text-emerald-600" : "text-rose-500"}">${Math.round(row.attainment_score)}%</td>
                                        <td class="text-center" style="color: #94a3b8;">${Math.round(row.attainment_target)}%</td>
                                        <td class="text-center ${row.remarks === "ATTAINED" ? "attained-status" : "not-attained-status"}">${row.remarks}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>

                    <!-- 2. COURSE OUTCOME SUMMARY ACCURATE TO THE SCREEN DASHBOARD [INDEX: 0.1.11] -->
                    <div class="section">
                        <div class="section-title">Course Outcomes (CO) Aggregated Summary Sheet</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40%;">Course Outcome</th>
                                    <th style="text-align: center; width: 20%;">Average Attainment Score</th>
                                    <th style="text-align: center; width: 20%;">Target Percentage</th>
                                    <th style="text-align: center; width: 20%;">Status Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${coData.length === 0 ? '<tr><td colspan="4" class="text-center">No active course outcome metrics aggregated.</td></tr>' : 
                                  coData.map(row => `
                                    <tr>
                                        <td class="bg-yellow-cell hover-row-text">CO ${row.co_name}</td>
                                        <td class="text-center font-black">${Math.round(row.attainment_score)}%</td>
                                        <td class="text-center" style="color: #94a3b8;">${Math.round(row.attainment_target)}%</td>
                                        <td class="text-center ${row.remarks === "ATTAINED" ? "attained-status" : "not-attained-status"}">${row.remarks}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>

                    <!-- 3. ACTION PLAN SUMMARY TABLE ACCURATE TO SCREEN [INDEX: 0.1.11, 0.1.12] -->
                    <div class="section">
                        <div class="section-title">Action Plan Summary Dashboard</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 18%; text-align: center;">Intended LO #</th>
                                    <th style="width: 44%;">Action Plan Summary</th>
                                    <th style="width: 18%; text-align: center;">Proposed Timeline</th>
                                    <th style="width: 20%;">Comment Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${actionData.length === 0 ? '<tr><td colspan="4" class="text-center">No action strategies configured.</td></tr>' : 
                                  actionData.map(row => `
                                    <tr>
                                        <td class="text-center hover-row-text">ILO ${row.ilo_name}</td>
                                        <td style="color: #475569; font-weight: 500; font-size: 9.5px;">${row.action_plan_summary || "—"}</td>
                                        <td class="bg-yellow-cell font-black text-center">${row.proposed_timeline || "—"}</td>
                                        <td style="color: #475569;">${row.comment || "—"}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>

                    <!-- 4. AUTOMATED 2x2 SIGNATORY MATRIX WORKFLOW [INDEX: 0.1.12, 0.1.13] -->
                    <table class="signatory-board">
                        <tr>
                            <td class="signatory-row-block">
                                <div class="sig-meta-header">Prepared By:</div>
                                <div class="sig-printed-name">${currentUserName}</div>
                                <div class="sig-underline-marker"></div>
                                <div class="sig-meta-header" style="margin-top: 4px; font-size: 7.5px; color: #64748b; text-align: center; margin-right: 55px;">Faculty Member</div>
                            </td>
                            <td class="signatory-row-block">
                                <div class="sig-meta-header">Assessed By:</div>
                                <div class="sig-printed-name">${chairPerson}</div>
                                <div class="sig-underline-marker"></div>
                                <div class="sig-meta-header" style="margin-top: 4px; font-size: 7.5px; color: #64748b; text-align: center; margin-right: 55px;">Program Coordinator</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="signatory-row-block" style="padding-top: 20px;">
                                <div class="sig-meta-header">Endorsed By:</div>
                                <div class="sig-printed-name">${deptHead}</div>
                                <div class="sig-underline-marker"></div>
                                <div class="sig-meta-header" style="margin-top: 4px; font-size: 7.5px; color: #64748b; text-align: center; margin-right: 55px;">Department Chairperson</div>
                            </td>
                            <td class="signatory-row-block" style="padding-top: 20px;">
                                <div class="sig-meta-header">Noted By:</div>
                                <div class="sig-printed-name">${deanName}</div>
                                <div class="sig-underline-marker"></div>
                                <div class="sig-meta-header" style="margin-top: 4px; font-size: 7.5px; color: #64748b; text-align: center; margin-right: 55px;">College Dean</div>
                            </td>
                        </tr>
                    </table>
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
