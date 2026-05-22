from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from database import db
from bson import ObjectId
from core.deps import get_current_user
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from datetime import datetime

router = APIRouter(prefix="/api/v1/process", tags=["Report"])

@router.get("/{process_id}/export-pdf")
async def export_pdf(process_id: str, user: dict = Depends(get_current_user)):
    # ── Fetch Process ─────────────────────────────────────────────────────────
    p = await db.processes.find_one({"_id": ObjectId(process_id)})
    if not p:
        raise HTTPException(404, "Process not found")

    step1 = p.get("steps_data", {}).get("step1", {})
    step2 = p.get("steps_data", {}).get("step2", {})
    step3 = p.get("steps_data", {}).get("step3", {})
    step4 = p.get("steps_data", {}).get("step4", {})
    step5 = p.get("steps_data", {}).get("step5", {})
    step6 = p.get("steps_data", {}).get("step6", {})
    step7 = p.get("steps_data", {}).get("step7", {})

    selected_archetype = None
    if step6 and step6.get("archetypes"):
        selected_archetype = next(
            (a for a in step6["archetypes"] if a.get("is_selected")), None
        )

    overall_gsda = 0
    if step5:
        overall_gsda = round((
            step5.get("standardization", 0) +
            step5.get("digitization", 0) +
            step5.get("data_availability", 0) +
            step5.get("automation_feasibility", 0)
        ) / 4, 1)

    # ── Build PDF ─────────────────────────────────────────────────────────────
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    BLUE   = colors.HexColor("#1F3864")
    LBLUE  = colors.HexColor("#2E75B6")
    GREY   = colors.HexColor("#F2F2F2")

    title_style = ParagraphStyle("title",
        fontSize=22, textColor=BLUE, fontName="Helvetica-Bold",
        alignment=TA_CENTER, spaceAfter=6)
    sub_style = ParagraphStyle("sub",
        fontSize=10, textColor=colors.grey,
        alignment=TA_CENTER, spaceAfter=20)
    section_style = ParagraphStyle("section",
        fontSize=13, textColor=BLUE, fontName="Helvetica-Bold",
        spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle("body",
        fontSize=10, textColor=colors.black,
        leading=14, spaceAfter=6)
    label_style = ParagraphStyle("label",
        fontSize=9, textColor=colors.grey, spaceAfter=2)

    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph("AuRA — AI Discovery Platform", title_style))
    story.append(Paragraph("Process Assessment Report", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=LBLUE))
    story.append(Spacer(1, 12))

    # ── Process Info ──────────────────────────────────────────────────────────
    story.append(Paragraph("Process Overview", section_style))
    info_data = [
        ["Process Name",   step2.get("process_name", "—")],
        ["Department",     step2.get("department", "—")],
        ["Process Owner",  step2.get("process_owner", "—")],
        ["Assessment Date",step1.get("assessment_date", "—")],
        ["Currency",       step1.get("currency", "INR")],
        ["Status",         p.get("status", "—").replace("_", " ").title()],
    ]
    info_table = Table(info_data, colWidths=[2*inch, 4.5*inch])
    info_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (0,-1), GREY),
        ("FONTNAME",    (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,-1), 10),
        ("TEXTCOLOR",   (0,0), (0,-1), BLUE),
        ("ROWBACKGROUNDS",(1,0),(1,-1),[colors.white, GREY]),
        ("GRID",        (0,0), (-1,-1), 0.5, colors.lightgrey),
        ("PADDING",     (0,0), (-1,-1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # ── Volumetrics ───────────────────────────────────────────────────────────
    story.append(Paragraph("Volumetrics", section_style))
    vol_data = [
        ["Metric", "Value"],
        ["Avg Time per Transaction", f"{step3.get('avg_time_per_transaction_mins', 0)} mins"],
        ["No. of FTEs", str(step3.get("fte_count", 0))],
        ["SLA Breach Rate", f"{step3.get('sla_breach_rate_pct', 0)}%"],
        ["Monthly Volume", str(step3.get("monthly_transaction_volume", 0))],
        ["Annual Cost Est.", f"₹ {int(step3.get('annual_cost_estimate', 0)):,}"],
    ]
    vol_table = Table(vol_data, colWidths=[3*inch, 3.5*inch])
    vol_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1,0), LBLUE),
        ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
        ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",    (0,0), (-1,-1), 10),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, GREY]),
        ("GRID",        (0,0), (-1,-1), 0.5, colors.lightgrey),
        ("PADDING",     (0,0), (-1,-1), 8),
    ]))
    story.append(vol_table)
    story.append(Spacer(1, 12))

    # ── GSDA Scores ───────────────────────────────────────────────────────────
    story.append(Paragraph("GSDA Evaluation", section_style))
    gsda_data = [
        ["Dimension", "Score"],
        ["Standardization",        f"{step5.get('standardization', 0)}/5"],
        ["Digitization",           f"{step5.get('digitization', 0)}/5"],
        ["Data Availability",      f"{step5.get('data_availability', 0)}/5"],
        ["Automation Feasibility", f"{step5.get('automation_feasibility', 0)}/5"],
        ["Overall GSDA Score",     f"{overall_gsda}/5"],
    ]
    gsda_table = Table(gsda_data, colWidths=[3*inch, 3.5*inch])
    gsda_table.setStyle(TableStyle([
        ("BACKGROUND",  (0,0), (-1,0), LBLUE),
        ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
        ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTNAME",    (0,-1), (-1,-1), "Helvetica-Bold"),
        ("BACKGROUND",  (0,-1), (-1,-1), colors.HexColor("#D5F5E3")),
        ("FONTSIZE",    (0,0), (-1,-1), 10),
        ("ROWBACKGROUNDS",(0,1),(-1,-2),[colors.white, GREY]),
        ("GRID",        (0,0), (-1,-1), 0.5, colors.lightgrey),
        ("PADDING",     (0,0), (-1,-1), 8),
    ]))
    story.append(gsda_table)
    story.append(Spacer(1, 12))

    # ── Recommended Archetype ─────────────────────────────────────────────────
    if selected_archetype:
        story.append(Paragraph("Recommended AI Archetype", section_style))
        arch_data = [
            ["Archetype",   selected_archetype.get("archetype_name", "—")],
            ["Fit Score",   f"{selected_archetype.get('fit_score', 0)}%"],
            ["Complexity",  selected_archetype.get("implementation_complexity", "—")],
            ["Description", selected_archetype.get("description", "—")],
            ["Tools",       ", ".join(selected_archetype.get("recommended_tools", []))],
        ]
        arch_table = Table(arch_data, colWidths=[2*inch, 4.5*inch])
        arch_table.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (0,-1), GREY),
            ("FONTNAME",    (0,0), (0,-1), "Helvetica-Bold"),
            ("TEXTCOLOR",   (0,0), (0,-1), BLUE),
            ("FONTSIZE",    (0,0), (-1,-1), 10),
            ("GRID",        (0,0), (-1,-1), 0.5, colors.lightgrey),
            ("PADDING",     (0,0), (-1,-1), 8),
        ]))
        story.append(arch_table)
        story.append(Spacer(1, 12))

    # ── Executive Summary ─────────────────────────────────────────────────────
    if step7:
        story.append(Paragraph("Executive Summary", section_style))
        story.append(Paragraph(step7.get("summary", ""), body_style))
        story.append(Spacer(1, 8))

        if step7.get("next_steps"):
            story.append(Paragraph("Next Steps:", section_style))
            for i, s in enumerate(step7["next_steps"], 1):
                story.append(Paragraph(f"{i}. {s}", body_style))

        if step7.get("roi_estimate"):
            story.append(Spacer(1, 8))
            story.append(Paragraph("ROI Estimate:", section_style))
            story.append(Paragraph(step7["roi_estimate"], body_style))

    # ── Activity Breakdown ────────────────────────────────────────────────────
    activities = step4.get("activities", [])
    if activities:
        story.append(Paragraph("Activity Breakdown", section_style))
        act_data = [["Activity Name","Description","Source System","Automation Level"]]
        for a in activities:
            desc = a.get("data_needed", a.get("description", ""))
            act_data.append([
                a.get("activity_name", ""),
                (desc[:60] + "...") if len(desc) > 60 else desc,
                a.get("integration_readiness", a.get("source_system", "")),
                a.get("ai_automation_potential", a.get("existing_automation_level", "")),
            ])
        act_table = Table(act_data, colWidths=[1.8*inch, 2.5*inch, 1.2*inch, 1.2*inch])
        act_table.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,0), LBLUE),
            ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
            ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1,-1), 9),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, GREY]),
            ("GRID",        (0,0), (-1,-1), 0.5, colors.lightgrey),
            ("PADDING",     (0,0), (-1,-1), 6),
        ]))
        story.append(act_table)

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    story.append(Paragraph(
        f"Generated by AuRA AI Discovery Platform — {datetime.utcnow().strftime('%d %b %Y')}",
        ParagraphStyle("footer", fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=AuRA_Report_{process_id}.pdf"}
    )