"""
CampusBite — Professional University Presentation Generator
Course: CSE326 Web Development
Presenter: Pirzada Salik
Generates presentation/CampusBite_Project_Presentation.pptx with 12 widescreen slides,
native vector cards, actual application screenshots, and comprehensive speaker notes.
"""

import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ─── COLOR PALETTE & STYLES ──────────────────────────────────────────────
COLOR_BG = RGBColor(251, 249, 246)         # #FBF9F6 Warm Off-White
COLOR_WHITE = RGBColor(255, 255, 255)      # #FFFFFF Pure White
COLOR_ORANGE = RGBColor(234, 88, 12)       # #EA580C Primary Brand Orange
COLOR_ORANGE_DARK = RGBColor(194, 65, 12)  # #C2410C Deep Orange
COLOR_ORANGE_LIGHT = RGBColor(255, 237, 213)# #FFEDD5 Soft Orange Fill
COLOR_CHARCOAL = RGBColor(15, 23, 42)      # #0F172A Dark Charcoal Headers
COLOR_BODY = RGBColor(51, 65, 85)          # #334155 Body Text Slate
COLOR_MUTED = RGBColor(100, 116, 139)      # #64748B Muted / Secondary
COLOR_BORDER = RGBColor(226, 232, 240)     # #E2E8F0 Subtle Border
COLOR_GREEN = RGBColor(22, 163, 74)        # #16A34A Success Green
COLOR_GREEN_LIGHT = RGBColor(220, 252, 231)# #DCFCE7 Soft Green Fill
COLOR_CARD_ALT = RGBColor(248, 250, 252)   # #F8FAFC Subtle Gray Fill

FONT_PRIMARY = "Segoe UI"
FONT_HEADING = "Segoe UI"

# ─── SCREENSHOT PATHS ───────────────────────────────────────────────────
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PHOTOS_DIR = os.path.join(BASE_DIR, "docs", "photos")

SHOT_LANDING = os.path.join(PHOTOS_DIR, "Screenshot 2026-11-08 230837.png")
SHOT_MENU = os.path.join(PHOTOS_DIR, "Screenshot 2026-11-08 230859.png")
SHOT_CART = os.path.join(PHOTOS_DIR, "Screenshot 2026-11-08 230919.png")
SHOT_CHECKOUT = os.path.join(PHOTOS_DIR, "Screenshot 2026-11-08 230932.png")
SHOT_ORDERS = os.path.join(PHOTOS_DIR, "Screenshot 2026-11-08 230958.png")
SHOT_ADMIN_DASH = os.path.join(PHOTOS_DIR, "Screenshot 2026-11-08 231018.png")
SHOT_ADMIN_QUEUE = os.path.join(PHOTOS_DIR, "Screenshot 2026-11-08 231033.png")

def create_deck():
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank slide layout

    total_slides = 12

    # ─── HELPER: SET SLIDE BACKGROUND ───────────────────────────────────
    def set_slide_background(slide):
        bg = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5)
        )
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background() # No border
        return bg

    # ─── HELPER: ADD FOOTER ─────────────────────────────────────────────
    def add_footer(slide, slide_num):
        # Footer line
        line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.015)
        )
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_BORDER
        line.line.fill.background()

        # Left brand footer
        tb_left = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(8.0), Inches(0.35))
        tf_left = tb_left.text_frame
        tf_left.word_wrap = True
        tf_left.margin_left = tf_left.margin_top = tf_left.margin_right = tf_left.margin_bottom = 0
        p_left = tf_left.paragraphs[0]
        
        r1 = p_left.add_run()
        r1.text = "CampusBite "
        r1.font.name = FONT_PRIMARY
        r1.font.size = Pt(10)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_ORANGE

        r2 = p_left.add_run()
        r2.text = "— Smart Canteen Ordering System  |  CSE326 Web Development"
        r2.font.name = FONT_PRIMARY
        r2.font.size = Pt(10)
        r2.font.color.rgb = COLOR_MUTED

        # Right page number
        tb_right = slide.shapes.add_textbox(Inches(9.0), Inches(7.05), Inches(3.533), Inches(0.35))
        tf_right = tb_right.text_frame
        tf_right.word_wrap = True
        tf_right.margin_left = tf_right.margin_top = tf_right.margin_right = tf_right.margin_bottom = 0
        p_right = tf_right.paragraphs[0]
        p_right.alignment = PP_ALIGN.RIGHT
        r3 = p_right.add_run()
        r3.text = f"Slide {slide_num} of {total_slides}"
        r3.font.name = FONT_PRIMARY
        r3.font.size = Pt(10)
        r3.font.bold = True
        r3.font.color.rgb = COLOR_MUTED

    # ─── HELPER: ADD STANDARD HEADER ────────────────────────────────────
    def add_header(slide, category, title, subtitle):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.0))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Eyebrow Category
        p_cat = tf.paragraphs[0]
        p_cat.space_after = Pt(2)
        r_cat = p_cat.add_run()
        r_cat.text = category.upper()
        r_cat.font.name = FONT_HEADING
        r_cat.font.size = Pt(11)
        r_cat.font.bold = True
        r_cat.font.color.rgb = COLOR_ORANGE

        # Main Title
        p_title = tf.add_paragraph()
        p_title.space_after = Pt(3)
        r_title = p_title.add_run()
        r_title.text = title
        r_title.font.name = FONT_HEADING
        r_title.font.size = Pt(22)
        r_title.font.bold = True
        r_title.font.color.rgb = COLOR_CHARCOAL

        # Subtitle
        p_sub = tf.add_paragraph()
        r_sub = p_sub.add_run()
        r_sub.text = subtitle
        r_sub.font.name = FONT_PRIMARY
        r_sub.font.size = Pt(13)
        r_sub.font.color.rgb = COLOR_MUTED

    # ─── HELPER: ADD CARD CONTAINER ─────────────────────────────────────
    def add_card(slide, left, top, width, height, bg_color=COLOR_WHITE, border_color=COLOR_BORDER):
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
        )
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        return card

    # ─── HELPER: SET SPEAKER NOTES ──────────────────────────────────────
    def set_notes(slide, notes_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = notes_text.strip()

    # =========================================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Left content block
    tb1 = s1.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(6.8), Inches(5.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    tf1.margin_left = tf1.margin_top = tf1.margin_right = tf1.margin_bottom = 0

    p_badge = tf1.paragraphs[0]
    p_badge.space_after = Pt(14)
    r_badge = p_badge.add_run()
    r_badge.text = "  CSE326 WEB DEVELOPMENT ACADEMIC PROJECT  "
    r_badge.font.name = FONT_HEADING
    r_badge.font.size = Pt(11)
    r_badge.font.bold = True
    r_badge.font.color.rgb = COLOR_ORANGE

    p_title = tf1.add_paragraph()
    p_title.space_after = Pt(6)
    r_title = p_title.add_run()
    r_title.text = "CampusBite"
    r_title.font.name = FONT_HEADING
    r_title.font.size = Pt(48)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_ORANGE

    p_sub = tf1.add_paragraph()
    p_sub.space_after = Pt(16)
    r_sub = p_sub.add_run()
    r_sub.text = "Smart Canteen Ordering System"
    r_sub.font.name = FONT_HEADING
    r_sub.font.size = Pt(22)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_CHARCOAL

    p_desc = tf1.add_paragraph()
    p_desc.space_after = Pt(28)
    r_desc = p_desc.add_run()
    r_desc.text = (
        "An asynchronous, framework-free web platform engineered to eliminate "
        "peak-hour campus dining queues through digital ordering, transparent pricing, "
        "and real-time kitchen telemetry."
    )
    r_desc.font.name = FONT_PRIMARY
    r_desc.font.size = Pt(13)
    r_desc.font.color.rgb = COLOR_BODY

    # Meta card
    meta_box = add_card(s1, Inches(0.8), Inches(4.5), Inches(5.8), Inches(1.8), bg_color=COLOR_WHITE)
    tb_meta = s1.shapes.add_textbox(Inches(1.0), Inches(4.65), Inches(5.4), Inches(1.5))
    tf_meta = tb_meta.text_frame
    tf_meta.word_wrap = True
    tf_meta.margin_left = tf_meta.margin_top = tf_meta.margin_right = tf_meta.margin_bottom = 0

    def add_meta_row(tf, label, val):
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.space_after = Pt(4)
        r_lbl = p.add_run()
        r_lbl.text = f"{label.upper()}: "
        r_lbl.font.name = FONT_HEADING
        r_lbl.font.size = Pt(10.5)
        r_lbl.font.bold = True
        r_lbl.font.color.rgb = COLOR_MUTED
        r_v = p.add_run()
        r_v.text = val
        r_v.font.name = FONT_PRIMARY
        r_v.font.size = Pt(11)
        r_v.font.bold = True
        r_v.font.color.rgb = COLOR_CHARCOAL

    add_meta_row(tf_meta, "Student Presenter", "Pirzada Salik")
    add_meta_row(tf_meta, "Course & Code", "CSE326 — Web Development")
    add_meta_row(tf_meta, "Official Team", "[INSERT OFFICIAL TEAM NAME]")
    add_meta_row(tf_meta, "University", "[INSERT UNIVERSITY NAME]")

    # Right side: Screenshot container with drop card
    card_img = add_card(s1, Inches(7.0), Inches(1.2), Inches(5.5), Inches(5.1), bg_color=COLOR_WHITE)
    if os.path.exists(SHOT_LANDING):
        s1.shapes.add_picture(SHOT_LANDING, Inches(7.15), Inches(1.35), Inches(5.2), Inches(4.0))

    # Caption badge under image
    tb_cap = s1.shapes.add_textbox(Inches(7.15), Inches(5.5), Inches(5.2), Inches(0.6))
    tf_cap = tb_cap.text_frame
    tf_cap.word_wrap = True
    p_cap = tf_cap.paragraphs[0]
    p_cap.alignment = PP_ALIGN.CENTER
    r_cap_badge = p_cap.add_run()
    r_cap_badge.text = "● LIVE PRODUCTION APP  |  "
    r_cap_badge.font.name = FONT_HEADING
    r_cap_badge.font.size = Pt(10)
    r_cap_badge.font.bold = True
    r_cap_badge.font.color.rgb = COLOR_GREEN
    r_cap_txt = p_cap.add_run()
    r_cap_txt.text = "Native HTML5 + CSS3 + Vanilla ES6+ & Node.js"
    r_cap_txt.font.name = FONT_PRIMARY
    r_cap_txt.font.size = Pt(10)
    r_cap_txt.font.color.rgb = COLOR_MUTED

    set_notes(s1, """
Good morning respected faculty members and fellow classmates. My name is Pirzada Salik, and today I am excited to present CampusBite — a Smart Canteen Ordering System developed for our CSE326 Web Development course.

Campus dining is an essential part of university student life. However, during standard 15-minute lecture breaks, campus canteens face extreme physical bottlenecks. CampusBite solves this by digitizing the entire dining journey: from online menu discovery and transparent cart calculations to live kitchen telemetry and pickup tracking.

Over the next 8 minutes, I will guide you through the problem we tackled, the engineering and architectural decisions behind our framework-free tech stack, our live MongoDB Atlas integration, automated testing validation, and a live demonstration walkthrough. Let's begin.
""")

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Context & Motivation", "The Problem with Traditional Canteen Ordering", 
               "Why peak-hour campus dining operations break down during lecture intervals")
    add_footer(s2, 2)

    # 4 Structured Problem Cards (2x2 Grid)
    cards_data = [
        ("01", "Peak-Hour Counter Congestion",
         "Lecture breaks release hundreds of students simultaneously into the canteen. Physical counters become overwhelmed as students attempt to view physical menus, place orders, and pay all at once."),
        ("02", "Manual Order Taking & Verbal Friction",
         "Handwritten slips and verbal orders lead to miscommunication, misplaced tokens, and wrong dishes prepared. Cash change shortages further delay transactions at payment registers."),
        ("03", "Zero Real-Time Status Visibility",
         "After paying, students wait in crowded waiting areas without knowing whether their food is queued, preparing, or ready. This creates anxiety, counter crowding, and missed class time."),
        ("04", "Administrative Operational Blind Spots",
         "Kitchen staff have no live visibility into incoming queue depth or item demand. Sold-out dishes cannot be dynamically hidden, resulting in frustrating manual cancellations and refunds.")
    ]

    card_positions = [
        (Inches(0.8), Inches(1.65)),
        (Inches(6.8), Inches(1.65)),
        (Inches(0.8), Inches(4.0)),
        (Inches(6.8), Inches(4.0))
    ]

    for (num, title, desc), (c_left, c_top) in zip(cards_data, card_positions):
        c = add_card(s2, c_left, c_top, Inches(5.7), Inches(2.1), bg_color=COLOR_WHITE)
        tb = s2.shapes.add_textbox(c_left + Inches(0.25), c_top + Inches(0.2), Inches(5.2), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.space_after = Pt(4)
        r_num = p1.add_run()
        r_num.text = f"{num}  "
        r_num.font.name = FONT_HEADING
        r_num.font.size = Pt(13)
        r_num.font.bold = True
        r_num.font.color.rgb = COLOR_ORANGE

        r_title = p1.add_run()
        r_title.text = title
        r_title.font.name = FONT_HEADING
        r_title.font.size = Pt(14.5)
        r_title.font.bold = True
        r_title.font.color.rgb = COLOR_CHARCOAL

        p2 = tf.add_paragraph()
        r_desc = p2.add_run()
        r_desc.text = desc
        r_desc.font.name = FONT_PRIMARY
        r_desc.font.size = Pt(11.5)
        r_desc.font.color.rgb = COLOR_BODY

    # Bottom summary callout
    callout = add_card(s2, Inches(0.8), Inches(6.25), Inches(11.7), Inches(0.65), bg_color=COLOR_ORANGE_LIGHT, border_color=COLOR_ORANGE)
    tb_c = s2.shapes.add_textbox(Inches(1.0), Inches(6.32), Inches(11.3), Inches(0.5))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    p_c = tf_c.paragraphs[0]
    p_c.alignment = PP_ALIGN.CENTER
    r_ci = p_c.add_run()
    r_ci.text = "CORE INSIGHT: "
    r_ci.font.name = FONT_HEADING
    r_ci.font.size = Pt(11.5)
    r_ci.font.bold = True
    r_ci.font.color.rgb = COLOR_ORANGE_DARK
    r_ct = p_c.add_run()
    r_ct.text = "The bottleneck in campus dining is not kitchen cooking speed — it is the synchronous friction of physical order placement and lack of status visibility."
    r_ct.font.name = FONT_PRIMARY
    r_ct.font.size = Pt(11.5)
    r_ct.font.color.rgb = COLOR_CHARCOAL

    set_notes(s2, """
To understand why CampusBite was needed, let's look at the daily reality of traditional university canteens.

Whenever classes dismiss, hundreds of students arrive at the canteen within a tight 10 to 15-minute window. This causes four distinct operational problems:
First, peak-hour counter congestion. Everyone crowds the register at the exact same moment to look at the printed menu, place an order, and pay.
Second, manual order-taking friction. Verbal and paper tickets lead to misplaced tickets, billing mistakes, and wasted time searching for cash change.
Third, zero real-time status visibility. Once a student pays, they have no idea whether their meal will take 5 minutes or 25 minutes. They are forced to wait near the counter, causing secondary crowd congestion.
And fourth, operational blind spots for canteen staff. Kitchen operators cannot see incoming queue depth or predict peak dish demands.

CampusBite was engineered specifically to decouple order placement from counter presence, turning chaotic physical queues into an orderly, asynchronous digital workflow.
""")

    # =========================================================================
    # SLIDE 3: OUR SOLUTION
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Product Overview", "Introducing CampusBite — Smart Digital Ordering",
               "A full-stack, contactless canteen management ecosystem designed for modern campuses")
    add_footer(s3, 3)

    # Left Column: Solution Highlights Card
    left_card = add_card(s3, Inches(0.8), Inches(1.65), Inches(5.4), Inches(5.1), bg_color=COLOR_WHITE)
    tb_sol = s3.shapes.add_textbox(Inches(1.05), Inches(1.85), Inches(4.9), Inches(4.7))
    tf_sol = tb_sol.text_frame
    tf_sol.word_wrap = True
    tf_sol.margin_left = tf_sol.margin_top = tf_sol.margin_right = tf_sol.margin_bottom = 0

    def add_solution_item(tf, title, desc):
        p_t = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p_t.space_after = Pt(2)
        r_t = p_t.add_run()
        r_t.text = f"✓  {title}"
        r_t.font.name = FONT_HEADING
        r_t.font.size = Pt(13.5)
        r_t.font.bold = True
        r_t.font.color.rgb = COLOR_ORANGE
        
        p_d = tf.add_paragraph()
        p_d.space_after = Pt(10)
        r_d = p_d.add_run()
        r_d.text = desc
        r_d.font.name = FONT_PRIMARY
        r_d.font.size = Pt(11)
        r_d.font.color.rgb = COLOR_BODY

    add_solution_item(tf_sol, "Digital Menu Discovery", 
                      "Students browse categorized items with live stock badges, prices, and base preparation times.")
    add_solution_item(tf_sol, "Transparent Cart & Pricing", 
                      "Persistent client cart computing exact subtotal, 5% GST, and flat ₹10 convenience fee with zero ambiguity.")
    add_solution_item(tf_sol, "Unique Order Token Engine", 
                      "Issues unique tokens (e.g. #CB-521323) upon checkout for quick, error-free counter food pickup.")
    add_solution_item(tf_sol, "Live 4-Stage Status Tracking", 
                      "Students track orders through Placed, Preparing, Ready, and Completed via automated 4.5s API polling.")
    add_solution_item(tf_sol, "Centralized Kitchen Command", 
                      "Single dashboard for canteen operators to adjust item availability, manage queue, and monitor revenue.")

    # Right Column: Screenshot Card
    right_card = add_card(s3, Inches(6.5), Inches(1.65), Inches(6.0), Inches(5.1), bg_color=COLOR_WHITE)
    if os.path.exists(SHOT_LANDING):
        s3.shapes.add_picture(SHOT_LANDING, Inches(6.65), Inches(1.8), Inches(5.7), Inches(4.2))
    
    tb_sc = s3.shapes.add_textbox(Inches(6.65), Inches(6.1), Inches(5.7), Inches(0.5))
    tf_sc = tb_sc.text_frame
    tf_sc.word_wrap = True
    p_sc = tf_sc.paragraphs[0]
    p_sc.alignment = PP_ALIGN.CENTER
    r_sc = p_sc.add_run()
    r_sc.text = "Actual Landing Page (/index.html) — Live Food Categories & Real-Time Stock Status"
    r_sc.font.name = FONT_PRIMARY
    r_sc.font.size = Pt(10.5)
    r_sc.font.bold = True
    r_sc.font.color.rgb = COLOR_MUTED

    set_notes(s3, """
CampusBite introduces a modern digital transformation for university dining.

Instead of rushing to a physical counter, students open CampusBite from any browser on their mobile phone or laptop. They browse a clean, categorized menu showing live dish availability and base preparation times. They add items to their cart, review an exact, transparent bill with 5% GST and campus convenience fees, and confirm their order in seconds.

Upon checkout, the system issues a unique, 6-digit order token — such as `#CB-521323`. The student can sit comfortably in the library or campus quad while tracking their order through four clear stages: Placed, Preparing, Ready, and Completed.

Meanwhile, canteen staff manage incoming orders on a centralized dashboard. They can adjust item availability with a single click, advance order statuses as meals are cooked, and monitor daily revenue streams.

The screenshot on the right is captured directly from our running application — clean, modern, and built entirely using standard web technologies.
""")

    # =========================================================================
    # SLIDE 4: KEY FEATURES — ONE PLATFORM, TWO EXPERIENCES
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Core Functionality", "One Platform, Two Dedicated Experiences",
               "Tailored, synchronized workflows for students and canteen administrators")
    add_footer(s4, 4)

    # Left Column: Student Experience
    card_stu = add_card(s4, Inches(0.8), Inches(1.65), Inches(5.7), Inches(4.9), bg_color=COLOR_WHITE)
    tb_stu = s4.shapes.add_textbox(Inches(1.05), Inches(1.85), Inches(5.2), Inches(4.5))
    tf_stu = tb_stu.text_frame
    tf_stu.word_wrap = True
    tf_stu.margin_left = tf_stu.margin_top = tf_stu.margin_right = tf_stu.margin_bottom = 0

    p_st = tf_stu.paragraphs[0]
    p_st.space_after = Pt(10)
    r_st_icon = p_st.add_run()
    r_st_icon.text = "STUDENT PORTAL  "
    r_st_icon.font.name = FONT_HEADING
    r_st_icon.font.size = Pt(15)
    r_st_icon.font.bold = True
    r_st_icon.font.color.rgb = COLOR_ORANGE
    r_st_sub = p_st.add_run()
    r_st_sub.text = "(Self-Service Ordering)"
    r_st_sub.font.name = FONT_PRIMARY
    r_st_sub.font.size = Pt(12)
    r_st_sub.font.color.rgb = COLOR_MUTED

    stu_features = [
        ("User Authentication", "Secure registration & login with persistent session cookies"),
        ("Menu Search & Filters", "6 food categories (Burgers, Pizza, Snacks, Indian, Drinks, Desserts)"),
        ("Persistent Shopping Cart", "Client-side storage with quantity clamps (1–20 per item)"),
        ("Counter Payment Support", "Select 'Cash at Counter' or 'UPI at Counter' (GPay/PhonePe)"),
        ("Live Kitchen Tracking", "Visual progress stepper with estimated prep time countdown"),
        ("Self-Service Cancellation", "Immediate cancellation allowed exclusively in 'Placed' status"),
        ("Order History Ledger", "Access all past and active orders with digital receipts")
    ]

    for title, desc in stu_features:
        p = tf_stu.add_paragraph()
        p.space_after = Pt(4)
        rt = p.add_run()
        rt.text = f"• {title}: "
        rt.font.name = FONT_HEADING
        rt.font.size = Pt(11)
        rt.font.bold = True
        rt.font.color.rgb = COLOR_CHARCOAL
        rd = p.add_run()
        rd.text = desc
        rd.font.name = FONT_PRIMARY
        rd.font.size = Pt(10.5)
        rd.font.color.rgb = COLOR_BODY

    # Right Column: Admin Experience
    card_adm = add_card(s4, Inches(6.8), Inches(1.65), Inches(5.7), Inches(4.9), bg_color=COLOR_WHITE)
    tb_adm = s4.shapes.add_textbox(Inches(7.05), Inches(1.85), Inches(5.2), Inches(4.5))
    tf_adm = tb_adm.text_frame
    tf_adm.word_wrap = True
    tf_adm.margin_left = tf_adm.margin_top = tf_adm.margin_right = tf_adm.margin_bottom = 0

    p_at = tf_adm.paragraphs[0]
    p_at.space_after = Pt(10)
    r_at_icon = p_at.add_run()
    r_at_icon.text = "CANTEEN ADMIN PORTAL  "
    r_at_icon.font.name = FONT_HEADING
    r_at_icon.font.size = Pt(15)
    r_at_icon.font.bold = True
    r_at_icon.font.color.rgb = COLOR_CHARCOAL
    r_at_sub = p_at.add_run()
    r_at_sub.text = "(Kitchen Operations)"
    r_at_sub.font.name = FONT_PRIMARY
    r_at_sub.font.size = Pt(12)
    r_at_sub.font.color.rgb = COLOR_MUTED

    adm_features = [
        ("Command Overview Dashboard", "Live KPIs: Total Orders, Gross Revenue, Active In-Kitchen volume"),
        ("Live Kitchen Order Queue", "Sortable order stream with direct status dropdown controls"),
        ("4-Stage Lifecycle Control", "Enforce transitions: Placed ➔ Preparing ➔ Ready ➔ Completed"),
        ("Counter Payment Settlement", "Collect and verify Cash/UPI; auto-settles to 'Paid' on completion"),
        ("Menu Management CRUD", "Add dishes, update prices, edit prep times, and toggle sold-out state"),
        ("Sales & Demand Analytics", "7-day revenue trajectory bar charts and top-selling food items"),
        ("Role-Based Route Guards", "Strict authorization blocking unauthorized student access to admin APIs")
    ]

    for title, desc in adm_features:
        p = tf_adm.add_paragraph()
        p.space_after = Pt(4)
        rt = p.add_run()
        rt.text = f"• {title}: "
        rt.font.name = FONT_HEADING
        rt.font.size = Pt(11)
        rt.font.bold = True
        rt.font.color.rgb = COLOR_CHARCOAL
        rd = p.add_run()
        rd.text = desc
        rd.font.name = FONT_PRIMARY
        rd.font.size = Pt(10.5)
        rd.font.color.rgb = COLOR_BODY

    # Architecture boundary callout
    tb_b = s4.shapes.add_textbox(Inches(0.8), Inches(6.6), Inches(11.7), Inches(0.35))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p_b = tf_b.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    rb = p_b.add_run()
    rb.text = "Architectural Scope: Single centralized canteen administration. No separate multi-vendor panel required."
    rb.font.name = FONT_PRIMARY
    rb.font.size = Pt(10)
    rb.font.bold = True
    rb.font.color.rgb = COLOR_MUTED

    set_notes(s4, """
CampusBite is structured around two dedicated experiences: the Student experience and the Administrator experience.

For students, the platform provides a complete self-service portal. They can register, log in, filter dishes by category, customize orders with special kitchen instructions, select counter payment options, and monitor their order progress. If their plans change, they can even cancel their order directly from their dashboard — provided the kitchen hasn't started preparation yet.

For canteen operators, CampusBite acts as an operational command center. Staff can view active orders in real time, transition order statuses as food moves through the kitchen, mark payments collected at the counter, toggle out-of-stock items instantaneously, and analyze 7-day revenue trends.

Importantly, we architected this as a focused single-canteen administration system, avoiding unnecessary multi-vendor abstractions while delivering production-grade reliability.
""")

    # =========================================================================
    # SLIDE 5: STUDENT EXPERIENCE — VISUAL ORDERING JOURNEY
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "User Experience & Flow", "Student Experience: From Browsing to Ordering",
               "A 3-step streamlined path from campus discovery to order token generation")
    add_footer(s5, 5)

    # 3 Horizontal Cards with Screenshots
    step_width = Inches(3.7)
    step_gap = Inches(0.3)
    left_start = Inches(0.8)

    steps_data = [
        ("STEP 1: DISCOVER", "Menu Catalogue", SHOT_MENU,
         "Instant category filtering, search by dish name, live availability indicators, and base preparation times (5m, 10m)."),
        ("STEP 2: REVIEW", "Shopping Cart", SHOT_CART,
         "Transparent bill calculation: Item subtotal (₹434.00), 5% GST (₹21.70), and flat ₹10.00 campus fee = ₹465.70."),
        ("STEP 3: CHECKOUT", "Payment & Notes", SHOT_CHECKOUT,
         "Select 'Cash at Counter' or 'UPI at Counter', add optional kitchen instructions, and submit with duplicate protection.")
    ]

    for i, (tag, title, img_path, desc) in enumerate(steps_data):
        c_left = left_start + i * (step_width + step_gap)
        c = add_card(s5, c_left, Inches(1.65), step_width, Inches(5.1), bg_color=COLOR_WHITE)

        # Step Header
        tb_h = s5.shapes.add_textbox(c_left + Inches(0.15), Inches(1.75), step_width - Inches(0.3), Inches(0.65))
        tf_h = tb_h.text_frame
        tf_h.word_wrap = True
        tf_h.margin_left = tf_h.margin_top = tf_h.margin_right = tf_h.margin_bottom = 0

        p_tag = tf_h.paragraphs[0]
        r_tag = p_tag.add_run()
        r_tag.text = tag
        r_tag.font.name = FONT_HEADING
        r_tag.font.size = Pt(10)
        r_tag.font.bold = True
        r_tag.font.color.rgb = COLOR_ORANGE

        p_t = tf_h.add_paragraph()
        r_t = p_t.add_run()
        r_t.text = title
        r_t.font.name = FONT_HEADING
        r_t.font.size = Pt(14)
        r_t.font.bold = True
        r_t.font.color.rgb = COLOR_CHARCOAL

        # Screenshot
        if os.path.exists(img_path):
            s5.shapes.add_picture(img_path, c_left + Inches(0.15), Inches(2.45), step_width - Inches(0.3), Inches(2.3))

        # Description
        tb_d = s5.shapes.add_textbox(c_left + Inches(0.15), Inches(4.85), step_width - Inches(0.3), Inches(1.8))
        tf_d = tb_d.text_frame
        tf_d.word_wrap = True
        tf_d.margin_left = tf_d.margin_top = tf_d.margin_right = tf_d.margin_bottom = 0
        p_d = tf_d.paragraphs[0]
        r_d = p_d.add_run()
        r_d.text = desc
        r_d.font.name = FONT_PRIMARY
        r_d.font.size = Pt(10.5)
        r_d.font.color.rgb = COLOR_BODY

    set_notes(s5, """
Let's look at the actual student journey through these three high-resolution screenshots captured directly from our running application.

In Step 1, the student visits the Menu Catalogue. They can filter across categories like Beverages, Burgers, and Indian Food, or use the instant search bar. Every dish displays high-definition imagery, pricing, and base preparation times so students can make informed dining decisions.

In Step 2, items added to the cart are reviewed. Notice the bill breakdown on the right: the item subtotal of ₹434, the exactly calculated 5% GST of ₹21.70, and our flat ₹10 campus convenience fee, totaling ₹465.70.

In Step 3, the student proceeds to Checkout. Since our campus canteen uses counter payments, the student selects either Cash at Counter or UPI at Counter (for Google Pay, PhonePe, or Paytm). They can attach kitchen notes — such as 'extra spicy' or 'pack separately' — and submit their order.

All of this is implemented using pure HTML5 and vanilla JavaScript — zero front-end frameworks, zero external UI libraries.
""")

    # =========================================================================
    # SLIDE 6: ORDER TRACKING & ADMIN OPERATIONS
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Operational Synchronization", "Complete Order Visibility & Kitchen Workflow",
               "Real-time coordination connecting student status tracking with kitchen fulfillment")
    add_footer(s6, 6)

    # Left Card: Student Tracking View
    c_trk = add_card(s6, Inches(0.8), Inches(1.65), Inches(5.7), Inches(3.9), bg_color=COLOR_WHITE)
    tb_th = s6.shapes.add_textbox(Inches(1.0), Inches(1.75), Inches(5.3), Inches(0.6))
    tf_th = tb_th.text_frame
    p_th = tf_th.paragraphs[0]
    r_th = p_th.add_run()
    r_th.text = "STUDENT VIEW: ORDER STATUS & TRACKING"
    r_th.font.name = FONT_HEADING
    r_th.font.size = Pt(12)
    r_th.font.bold = True
    r_th.font.color.rgb = COLOR_ORANGE

    if os.path.exists(SHOT_ORDERS):
        s6.shapes.add_picture(SHOT_ORDERS, Inches(0.95), Inches(2.25), Inches(5.4), Inches(2.7))

    tb_tc = s6.shapes.add_textbox(Inches(1.0), Inches(5.05), Inches(5.3), Inches(0.45))
    tf_tc = tb_tc.text_frame
    p_tc = tf_tc.paragraphs[0]
    r_tc = p_tc.add_run()
    r_tc.text = "Unique token #CB-521323 with live kitchen tracking trigger & pickup indicators."
    r_tc.font.name = FONT_PRIMARY
    r_tc.font.size = Pt(10)
    r_tc.font.color.rgb = COLOR_MUTED

    # Right Card: Admin Queue View
    c_que = add_card(s6, Inches(6.8), Inches(1.65), Inches(5.7), Inches(3.9), bg_color=COLOR_WHITE)
    tb_qh = s6.shapes.add_textbox(Inches(7.0), Inches(1.75), Inches(5.3), Inches(0.6))
    tf_qh = tb_qh.text_frame
    p_qh = tf_qh.paragraphs[0]
    r_qh = p_qh.add_run()
    r_qh.text = "ADMIN VIEW: LIVE KITCHEN ORDER QUEUE"
    r_qh.font.name = FONT_HEADING
    r_qh.font.size = Pt(12)
    r_qh.font.bold = True
    r_qh.font.color.rgb = COLOR_CHARCOAL

    if os.path.exists(SHOT_ADMIN_QUEUE):
        s6.shapes.add_picture(SHOT_ADMIN_QUEUE, Inches(6.95), Inches(2.25), Inches(5.4), Inches(2.7))

    tb_qc = s6.shapes.add_textbox(Inches(7.0), Inches(5.05), Inches(5.3), Inches(0.45))
    tf_qc = tb_qc.text_frame
    p_qc = tf_qc.paragraphs[0]
    r_qc = p_qc.add_run()
    r_qc.text = "Kitchen coordinators advance statuses, inspect items, and track elapsed order times."
    r_qc.font.name = FONT_PRIMARY
    r_qc.font.size = Pt(10)
    r_qc.font.color.rgb = COLOR_MUTED

    # Bottom Banner: Finite State Machine Flow
    c_fsm = add_card(s6, Inches(0.8), Inches(5.65), Inches(11.7), Inches(1.25), bg_color=COLOR_WHITE)
    tb_fsm = s6.shapes.add_textbox(Inches(1.0), Inches(5.75), Inches(11.3), Inches(1.05))
    tf_fsm = tb_fsm.text_frame
    tf_fsm.word_wrap = True

    p_fh = tf_fsm.paragraphs[0]
    p_fh.space_after = Pt(4)
    r_fh = p_fh.add_run()
    r_fh.text = "ORDER LIFECYCLE STATE MACHINE (SERVER-ENFORCED):"
    r_fh.font.name = FONT_HEADING
    r_fh.font.size = Pt(11)
    r_fh.font.bold = True
    r_fh.font.color.rgb = COLOR_ORANGE

    p_flow = tf_fsm.add_paragraph()
    r_fl1 = p_flow.add_run()
    r_fl1.text = "1. Placed  ➔  2. Preparing  ➔  3. Ready  ➔  4. Completed\n"
    r_fl1.font.name = FONT_HEADING
    r_fl1.font.size = Pt(13)
    r_fl1.font.bold = True
    r_fl1.font.color.rgb = COLOR_CHARCOAL

    r_fl2 = p_flow.add_run()
    r_fl2.text = (
        "• Cancellation Guard: Allowed ONLY in 'Placed' state. Once 'Preparing' begins, kitchen lock prevents cancellation.\n"
        "• Update Protocol: Client polls GET /api/orders/:id every 4.5 seconds for instant reflection without WebSocket overhead."
    )
    r_fl2.font.name = FONT_PRIMARY
    r_fl2.font.size = Pt(10)
    r_fl2.font.color.rgb = COLOR_BODY

    set_notes(s6, """
Here we see how CampusBite synchronizes the student and the kitchen staff.

On the left, the student sees their personal Orders page. Each order receives a unique, human-readable token like `#CB-521323`. Students can click 'Live Kitchen Tracking' to view a real-time progress bar. The client polls our REST API every 4.5 seconds to refresh the order state smoothly without the complexity and resource overhead of persistent WebSockets.

On the right is the Administrator's Live Kitchen Order Queue. Kitchen staff see incoming orders immediately, complete with customer names, ordered items, and total bills. Using the status dropdown, the kitchen manager transitions orders through our strict state machine:
First, Placed. While in Placed, students can cancel if needed.
Second, Preparing. Once the kitchen switches the order to Preparing, the backend locks cancellation permanently.
Third, Ready. When cooking is finished, the order is marked Ready, alerting the student to approach the counter.
And fourth, Completed. When the food is handed over, the order moves to Completed, automatically marking the counter payment as Paid. Completed orders cannot be reopened.
""")

    # =========================================================================
    # SLIDE 7: SYSTEM ARCHITECTURE
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "System Architecture", "System Architecture: Three-Tier Foundation",
               "Framework-free engineering meeting CSE326 faculty requirements with production rigor")
    add_footer(s7, 7)

    # 3 Horizontal Tier Cards
    tier_width = Inches(3.7)
    tier_gap = Inches(0.3)

    tiers_data = [
        ("TIER 1: PRESENTATION", "Client Browser",
         [("Frontend Stack", "Pure HTML5, Semantic CSS3, Vanilla ES6+ JavaScript"),
          ("No Frameworks", "Zero React, Vue, Angular, TypeScript, Tailwind, or Bootstrap"),
          ("DOM & State", "Native Fetch API, DOM manipulation, responsive CSS Grid & Flexbox"),
          ("Persistence", "Session cookies & localStorage for responsive client state")]),
        ("TIER 2: APPLICATION", "Node.js + Express 5",
         [("Server Runtime", "Node.js v24 LTS + Express.js 5.3 REST API engine"),
          ("Security Layers", "Helmet security headers, express-rate-limit protection"),
          ("Clean Structure", "Controllers delegate logic to services (orderService, menuService)"),
          ("Session Auth", "express-session authenticated via connect-mongo & bcryptjs")]),
        ("TIER 3: DATA TIER", "MongoDB Atlas Cloud",
         [("Cloud Cluster", "AWS-hosted MongoDB Atlas with TLS encryption & replica sets"),
          ("Official Driver", "Native MongoDB Node.js Driver v7 (Strictly No Mongoose)"),
          ("Direct Operations", "BSON ObjectIds, native aggregation pipelines, atomic updates"),
          ("Index Optimization", "Unique email, unique orderNumber, and query status indexes")])
    ]

    for i, (tag, title, bullets) in enumerate(tiers_data):
        c_left = left_start + i * (tier_width + tier_gap)
        c = add_card(s7, c_left, Inches(1.65), tier_width, Inches(3.9), bg_color=COLOR_WHITE)

        tb = s7.shapes.add_textbox(c_left + Inches(0.2), Inches(1.8), tier_width - Inches(0.4), Inches(3.5))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        r1 = p1.add_run()
        r1.text = tag
        r1.font.name = FONT_HEADING
        r1.font.size = Pt(10)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_ORANGE

        p2 = tf.add_paragraph()
        p2.space_after = Pt(10)
        r2 = p2.add_run()
        r2.text = title
        r2.font.name = FONT_HEADING
        r2.font.size = Pt(14)
        r2.font.bold = True
        r2.font.color.rgb = COLOR_CHARCOAL

        for b_lbl, b_txt in bullets:
            p = tf.add_paragraph()
            p.space_after = Pt(4)
            r_bl = p.add_run()
            r_bl.text = f"• {b_lbl}: "
            r_bl.font.name = FONT_HEADING
            r_bl.font.size = Pt(10.5)
            r_bl.font.bold = True
            r_bl.font.color.rgb = COLOR_CHARCOAL
            r_bt = p.add_run()
            r_bt.text = b_txt
            r_bt.font.name = FONT_PRIMARY
            r_bt.font.size = Pt(10)
            r_bt.font.color.rgb = COLOR_BODY

    # Bottom Request Flow Banner
    c_fl = add_card(s7, Inches(0.8), Inches(5.75), Inches(11.7), Inches(1.15), bg_color=COLOR_WHITE)
    tb_fl = s7.shapes.add_textbox(Inches(1.0), Inches(5.85), Inches(11.3), Inches(0.95))
    tf_fl = tb_fl.text_frame
    tf_fl.word_wrap = True

    p_fh = tf_fl.paragraphs[0]
    p_fh.space_after = Pt(3)
    r_fh = p_fh.add_run()
    r_fh.text = "END-TO-END HTTP REQUEST / RESPONSE PIPELINE:"
    r_fh.font.name = FONT_HEADING
    r_fh.font.size = Pt(10.5)
    r_fh.font.bold = True
    r_fh.font.color.rgb = COLOR_ORANGE

    p_fp = tf_fl.add_paragraph()
    r_fp1 = p_fp.add_run()
    r_fp1.text = "Student/Admin Browser  ➔  Express Router  ➔  Auth Middleware  ➔  Controllers  ➔  Services  ➔  MongoDB Atlas\n"
    r_fp1.font.name = FONT_HEADING
    r_fp1.font.size = Pt(12)
    r_fp1.font.bold = True
    r_fp1.font.color.rgb = COLOR_CHARCOAL

    r_fp2 = p_fp.add_run()
    r_fp2.text = "Every endpoint responds with uniform JSON shape: { success: true|false, data?: ..., message?: ... }"
    r_fp2.font.name = FONT_PRIMARY
    r_fp2.font.size = Pt(10.5)
    r_fp2.font.color.rgb = COLOR_MUTED

    set_notes(s7, """
Let's examine the system architecture of CampusBite. The application is built upon a clean, decoupled three-tier architecture adhering strictly to the CSE326 course requirements.

At the Presentation Tier, we run a pure, framework-free frontend. We use standard HTML5, CSS3 with CSS variables and responsive Grid layouts, and vanilla ECMAScript 6+. We do not use React, Angular, Vue, Tailwind, or jQuery. Everything is native, lightweight, and loads instantly.

At the Application Tier, we have a Node.js server running Express.js 5. The server enforces security through Helmet headers, rate-limits sensitive authentication endpoints, and manages user sessions. The backend follows a clean separation of concerns: route handlers pass requests through authentication middleware into thin controllers, which delegate business logic to isolated domain services.

At the Data Tier, we connect directly to a cloud MongoDB Atlas cluster using the official MongoDB Node.js driver — no Mongoose ORM. Session state is stored persistently in MongoDB via connect-mongo, ensuring logins survive server restarts.

This request pipeline guarantees that every incoming API call is validated, authorized, and processed with predictable latency.
""")

    # =========================================================================
    # SLIDE 8: DATABASE DESIGN — MONGODB COLLECTIONS
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Database Engineering", "Database Design: Collections & Document Schemas",
               "High-performance document storage using the official MongoDB Node.js driver")
    add_footer(s8, 8)

    # 4 Collection Cards (2x2 Grid)
    coll_data = [
        ("users", "User Authentication & Profiles",
         [("Fields", "_id, name, email, passwordHash, role, createdAt"),
          ("Roles", "'student' | 'admin' (strictly validated)"),
          ("Security", "Passwords hashed via bcrypt (10 rounds); never stored in plain text"),
          ("Indexes", "Unique index on email (prevents duplicate registrations)")]),
        ("menuItems", "Food Catalogue & Availability",
         [("Fields", "_id, name, description, price, category, isAvailable, preparationTime"),
          ("Categories", "Burgers, Pizza, Snacks, Indian Food, Beverages, Desserts"),
          ("Prep Times", "Individual dish cooking durations in minutes (e.g. 5m, 12m)"),
          ("Indexes", "Secondary indexes on category and isAvailable for fast lookups")]),
        ("orders", "Order Lifecycle & Transactions",
         [("Fields", "orderNumber, userId, items[], subtotal, tax, campusFee, totalAmount"),
          ("State Machine", "status: 'Placed' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled'"),
          ("Payment", "paymentMethod ('Cash/UPI at Counter'), paymentStatus ('Pending'|'Paid')"),
          ("Integrity", "Unique index on orderNumber; sparse index on idempotencyKey")]),
        ("sessions", "MongoDB Session Persistence",
         [("Engine", "connect-mongo v6 storing Express session state directly in Atlas"),
          ("Fields", "_id (session ID), session (JSON payload), expires (timestamp)"),
          ("Durability", "User authentication persists seamlessly across server reboots"),
          ("TTL Index", "Automatic background expiration of inactive sessions")])
    ]

    for (c_name, c_title, c_specs), (c_left, c_top) in zip(coll_data, card_positions):
        c = add_card(s8, c_left, c_top, Inches(5.7), Inches(2.35), bg_color=COLOR_WHITE)
        tb = s8.shapes.add_textbox(c_left + Inches(0.25), c_top + Inches(0.18), Inches(5.2), Inches(2.0))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.space_after = Pt(2)
        r_cn = p1.add_run()
        r_cn.text = f"db.{c_name}  "
        r_cn.font.name = FONT_HEADING
        r_cn.font.size = Pt(13.5)
        r_cn.font.bold = True
        r_cn.font.color.rgb = COLOR_ORANGE

        r_ct = p1.add_run()
        r_ct.text = f"— {c_title}"
        r_ct.font.name = FONT_PRIMARY
        r_ct.font.size = Pt(11)
        r_ct.font.color.rgb = COLOR_MUTED

        for s_lbl, s_val in c_specs:
            p = tf.add_paragraph()
            p.space_after = Pt(3)
            r_sl = p.add_run()
            r_sl.text = f"• {s_lbl}: "
            r_sl.font.name = FONT_HEADING
            r_sl.font.size = Pt(10.5)
            r_sl.font.bold = True
            r_sl.font.color.rgb = COLOR_CHARCOAL
            r_sv = p.add_run()
            r_sv.text = s_val
            r_sv.font.name = FONT_PRIMARY
            r_sv.font.size = Pt(10)
            r_sv.font.color.rgb = COLOR_BODY

    set_notes(s8, """
Moving to the database design: CampusBite stores all persistent data across four core collections in MongoDB Atlas.

First is the 'users' collection. It stores user credentials with roles of either 'student' or 'admin'. To prevent duplicate accounts, a unique index is enforced on the email field. Passwords are never stored in plain text; they are hashed with bcrypt.

Second is the 'menuItems' collection. Each document contains the dish name, description, price, category, estimated prep time, and an 'isAvailable' boolean flag. We created secondary indexes on category and availability to enable lightning-fast menu queries.

Third is the 'orders' collection. When an order is placed, we embed a snapshot of the ordered items containing the item name, price, and quantity at the time of purchase. This guarantees historical financial integrity even if menu prices change later. The collection features a unique index on orderNumber and a sparse index on idempotencyKey.

Finally, the 'sessions' collection is maintained automatically by connect-mongo. When a user logs in, Express creates a session cookie that maps to this collection. MongoDB uses a TTL index to expire inactive sessions automatically.
""")

    # =========================================================================
    # SLIDE 9: IMPORTANT ENGINEERING LOGIC
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Backend Algorithms & Logic", "Engineering Beyond the Interface: Backend Integrity",
               "Defensive programming, zero client trust, and mathematical precision")
    add_footer(s9, 9)

    # Left Column: 4 Logic Principles
    c_lp = add_card(s9, Inches(0.8), Inches(1.65), Inches(6.0), Inches(5.1), bg_color=COLOR_WHITE)
    tb_lp = s9.shapes.add_textbox(Inches(1.05), Inches(1.85), Inches(5.5), Inches(4.7))
    tf_lp = tb_lp.text_frame
    tf_lp.word_wrap = True
    tf_lp.margin_left = tf_lp.margin_top = tf_lp.margin_right = tf_lp.margin_bottom = 0

    def add_logic_item(tf, num, title, desc):
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.space_after = Pt(2)
        r_n = p.add_run()
        r_n.text = f"{num}.  {title}\n"
        r_n.font.name = FONT_HEADING
        r_n.font.size = Pt(12)
        r_n.font.bold = True
        r_n.font.color.rgb = COLOR_ORANGE

        r_d = p.add_run()
        r_d.text = desc
        r_d.font.name = FONT_PRIMARY
        r_d.font.size = Pt(10.5)
        r_d.font.color.rgb = COLOR_BODY
        p.space_after = Pt(8)

    add_logic_item(tf_lp, "1", "Zero-Client-Trust Price Recalculation",
                   "Client sends only menuItemId and quantity. The server queries authoritative prices directly from MongoDB, recalculating subtotals to completely prevent client-side tampering.")
    add_logic_item(tf_lp, "2", "Idempotency-Based Duplicate Prevention",
                   "Every checkout submits an idempotencyKey. Rapid double-clicks or browser retries return the existing order without creating duplicate kitchen tickets or double charges.")
    add_logic_item(tf_lp, "3", "Controlled State Machine & Auto-Settlement",
                   "State transitions follow strict rules: Placed ➔ Preparing ➔ Ready ➔ Completed. Transition to Completed automatically marks counter payment as 'Paid'.")
    add_logic_item(tf_lp, "4", "Smart Preparation Time Estimation Algorithm",
                   "Estimated Time = Max(dishPrepTimes) + (totalItems - 1)*2 + (activeQueueOrders)*3. Clamped realistically between 5 and 45 minutes.")

    # Right Column: Calculation Example Box
    c_ex = add_card(s9, Inches(7.1), Inches(1.65), Inches(5.4), Inches(5.1), bg_color=COLOR_WHITE)
    tb_ex = s9.shapes.add_textbox(Inches(7.35), Inches(1.85), Inches(4.9), Inches(4.7))
    tf_ex = tb_ex.text_frame
    tf_ex.word_wrap = True
    tf_ex.margin_left = tf_ex.margin_top = tf_ex.margin_right = tf_ex.margin_bottom = 0

    p_eh = tf_ex.paragraphs[0]
    p_eh.space_after = Pt(6)
    r_eh = p_eh.add_run()
    r_eh.text = "ACTUAL CALCULATION EXAMPLE (FROM CART):"
    r_eh.font.name = FONT_HEADING
    r_eh.font.size = Pt(11)
    r_eh.font.bold = True
    r_eh.font.color.rgb = COLOR_CHARCOAL

    math_rows = [
        ("Thick Cold Coffee w/ Ice Cream", "1 × ₹85.00", "= ₹85.00"),
        ("Masala Chai & Ginger Infusion", "1 × ₹30.00", "= ₹30.00"),
        ("Fiery Jalapeno & Corn Pizza", "1 × ₹169.00", "= ₹169.00"),
        ("Dal Makhani & Jeera Rice Bowl", "1 × ₹150.00", "= ₹150.00"),
        ("───────────────────────", "─────────", "─────────"),
        ("Subtotal", "Sum of items", "₹434.00"),
        ("GST Tax (5%)", "₹434.00 × 0.05", "₹21.70"),
        ("Campus Convenience Fee", "Fixed Counter Fee", "₹10.00"),
        ("───────────────────────", "─────────", "─────────"),
        ("TOTAL PAYABLE", "Server-Enforced", "₹465.70")
    ]

    for label, formula, result in math_rows:
        p = tf_ex.add_paragraph()
        p.space_after = Pt(2)
        is_total = "TOTAL" in label
        r1 = p.add_run()
        r1.text = f"{label:<25} "
        r1.font.name = "Consolas" if "──" in label else FONT_PRIMARY
        r1.font.size = Pt(11 if is_total else 9.5)
        r1.font.bold = is_total or "Subtotal" in label
        r1.font.color.rgb = COLOR_ORANGE if is_total else COLOR_CHARCOAL

        r2 = p.add_run()
        r2.text = f"{result:>12}"
        r2.font.name = FONT_HEADING
        r2.font.size = Pt(12 if is_total else 9.5)
        r2.font.bold = is_total or "Subtotal" in label
        r2.font.color.rgb = COLOR_ORANGE if is_total else COLOR_CHARCOAL

    p_note = tf_ex.add_paragraph()
    p_note.space_before = Pt(8)
    r_nt = p_note.add_run()
    r_nt.text = "✓ Exactly matches the live cart & checkout screenshots shown on Slide 5."
    r_nt.font.name = FONT_PRIMARY
    r_nt.font.size = Pt(9.5)
    r_nt.font.bold = True
    r_nt.font.color.rgb = COLOR_GREEN

    set_notes(s9, """
A critical principle in modern software engineering is 'never trust the client.' In CampusBite, we implemented several rigorous defensive engineering mechanisms.

First, server-side price recalculation. When a student checks out, the frontend sends only the item IDs and quantities. The backend fetches live prices directly from the database and recalculates everything from scratch. If an attacker attempts to modify prices in the browser's developer tools, the tampered values are completely ignored.

Second, our financial math is exact. For example, in the order shown on our cart screenshot: an item subtotal of ₹434 plus 5% GST of ₹21.70 and the ₹10 campus fee produces an exact total of ₹465.70.

Third, idempotency protection. We generate a unique idempotency key when the checkout page loads. If a student accidentally double-clicks the checkout button, the server catches the duplicate key and returns the original order instead of billing them twice.

Finally, our smart preparation time algorithm dynamically factors in the most complex dish in the cart, adds 2 minutes for each additional item, and adds 3 minutes for every active order currently in the kitchen queue, clamping the result realistically between 5 and 45 minutes.
""")

    # =========================================================================
    # SLIDE 10: SECURITY & QUALITY ASSURANCE
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Reliability & Quality Assurance", "Security Architecture & Comprehensive QA Testing",
               "Multi-layered defensive safeguards backed by automated integration & E2E verification")
    add_footer(s10, 10)

    # Left Column: Security Architecture
    c_sec = add_card(s10, Inches(0.8), Inches(1.65), Inches(5.7), Inches(5.1), bg_color=COLOR_WHITE)
    tb_sec = s10.shapes.add_textbox(Inches(1.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tf_sec = tb_sec.text_frame
    tf_sec.word_wrap = True
    tf_sec.margin_left = tf_sec.margin_top = tf_sec.margin_right = tf_sec.margin_bottom = 0

    p_sh = tf_sec.paragraphs[0]
    p_sh.space_after = Pt(10)
    r_sh = p_sh.add_run()
    r_sh.text = "DEFENSE-IN-DEPTH SECURITY ARCHITECTURE"
    r_sh.font.name = FONT_HEADING
    r_sh.font.size = Pt(13)
    r_sh.font.bold = True
    r_sh.font.color.rgb = COLOR_ORANGE

    sec_items = [
        ("Password Hashing", "bcryptjs with 10 salt rounds; plain text passwords never reach DB"),
        ("Session Hardening", "HTTP-only, SameSite cookies preventing Cross-Site Scripting (XSS)"),
        ("Role-Based Access Control", "requireAuth, requireAdmin & protectAdminPages route guards"),
        ("Cross-Student Privacy", "HTTP 403 Forbidden enforced if student accesses other orders"),
        ("Brute-Force Rate Limiting", "loginLimiter restricts login attempts to 10 requests / 15 minutes"),
        ("HTTP Security Headers", "Helmet-configured CSP, X-Content-Type-Options, & Frameguard"),
        ("Server-Side Input Validation", "Strict type, range, and sanitization checks on all payloads")
    ]

    for title, desc in sec_items:
        p = tf_sec.add_paragraph()
        p.space_after = Pt(4)
        rt = p.add_run()
        rt.text = f"• {title}: "
        rt.font.name = FONT_HEADING
        rt.font.size = Pt(10.5)
        rt.font.bold = True
        rt.font.color.rgb = COLOR_CHARCOAL
        rd = p.add_run()
        rd.text = desc
        rd.font.name = FONT_PRIMARY
        rd.font.size = Pt(10)
        rd.font.color.rgb = COLOR_BODY

    # Right Column: Verified QA Test Suites
    c_qa = add_card(s10, Inches(6.8), Inches(1.65), Inches(5.7), Inches(5.1), bg_color=COLOR_WHITE)
    tb_qa = s10.shapes.add_textbox(Inches(7.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tf_qa = tb_qa.text_frame
    tf_qa.word_wrap = True
    tf_qa.margin_left = tf_qa.margin_top = tf_qa.margin_right = tf_qa.margin_bottom = 0

    p_qh = tf_qa.paragraphs[0]
    p_qh.space_after = Pt(10)
    r_qh = p_qh.add_run()
    r_qh.text = "VERIFIED AUTOMATED QA SUITES (100% PASS)"
    r_qh.font.name = FONT_HEADING
    r_qh.font.size = Pt(13)
    r_qh.font.bold = True
    r_qh.font.color.rgb = COLOR_GREEN

    qa_suites = [
        ("41 / 41 Integration Tests", "npm test",
         "Verifies technology compliance (0 prohibited frameworks), port binding, security headers, auth lifecycle, pricing enforcement, idempotency, privacy locks, and all 8 frontend routes."),
        ("8 / 8 End-to-End Workflows", "npm run test:e2e",
         "Validates complete student journeys: ordering, polling tracking, admin status transitions, counter cash settlement, cross-student privacy rejection, price tampering blocks."),
        ("8 / 8 Live Atlas Cloud Metrics", "npm run audit:atlas",
         "13 internal deep verification steps: ping, CRUD permissions, indexing, menu seeding, reconnect persistence, student auth, Atlas session storage, aggregation analytics, and graceful offline failover.")
    ]

    for title, cmd, desc in qa_suites:
        p1 = tf_qa.add_paragraph()
        p1.space_after = Pt(2)
        r_t = p1.add_run()
        r_t.text = f"✓ {title}  "
        r_t.font.name = FONT_HEADING
        r_t.font.size = Pt(12)
        r_t.font.bold = True
        r_t.font.color.rgb = COLOR_CHARCOAL
        r_c = p1.add_run()
        r_c.text = f"[{cmd}]"
        r_c.font.name = "Consolas"
        r_c.font.size = Pt(10)
        r_c.font.bold = True
        r_c.font.color.rgb = COLOR_ORANGE

        p2 = tf_qa.add_paragraph()
        p2.space_after = Pt(8)
        r_d = p2.add_run()
        r_d.text = desc
        r_d.font.name = FONT_PRIMARY
        r_d.font.size = Pt(10)
        r_d.font.color.rgb = COLOR_BODY

    set_notes(s10, """
Security and reliability were prioritized from day one.

From a security standpoint: we use bcrypt with 10 salt rounds to hash all user passwords. Sessions are secured with HTTP-only cookies stored in MongoDB Atlas, meaning they cannot be read by malicious client-side scripts. Our role-based access control middleware guards all admin APIs and pages. Furthermore, we enforce strict ownership checks — if Student A tries to look up or cancel Student B's order, the server immediately returns a 403 Forbidden.

To ensure system stability, we built three comprehensive automated test suites:
First, our unit and integration test suite has 41 out of 41 tests passing, covering compliance, security headers, and the order state machine.
Second, our end-to-end workflow suite has 8 out of 8 complete user workflows passing with zero errors.
And third, our live cloud Atlas audit suite passed all 8 core reliability metrics across 13 deep verification steps, confirming seamless cloud persistence, reconnect safety, and aggregation pipeline analytics.

Everything is automated and verifiable with simple npm commands.
""")

    # =========================================================================
    # SLIDE 11: DEMONSTRATION & FUTURE ROADMAP
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Live Demonstration & Scope", "Live Demonstration & Architectural Roadmap",
               "Demonstrating end-to-end capabilities today, expanding features tomorrow")
    add_footer(s11, 11)

    # Top Half: Demonstration Flow Card
    c_demo = add_card(s11, Inches(0.8), Inches(1.65), Inches(11.7), Inches(2.2), bg_color=COLOR_WHITE)
    tb_demo = s11.shapes.add_textbox(Inches(1.05), Inches(1.75), Inches(11.2), Inches(2.0))
    tf_demo = tb_demo.text_frame
    tf_demo.word_wrap = True

    p_dh = tf_demo.paragraphs[0]
    p_dh.space_after = Pt(4)
    r_dh = p_dh.add_run()
    r_dh.text = "LIVE CLASSROOM DEMONSTRATION SEQUENCE (7–10 MINUTES):"
    r_dh.font.name = FONT_HEADING
    r_dh.font.size = Pt(12)
    r_dh.font.bold = True
    r_dh.font.color.rgb = COLOR_ORANGE

    demo_steps = [
        ("1. Student Login", "Authenticate as student salik@gmail.com; session cookie issued"),
        ("2. Menu Selection", "Filter by 'Beverages' & 'Burgers'; add items to cart"),
        ("3. Checkout", "Select 'Cash at Counter', review bill, receive token #CB-XXXXXX"),
        ("4. Admin Queue", "Switch to /admin-orders.html; kitchen updates Placed ➔ Preparing"),
        ("5. Live Tracking", "Student /orders.html reflects Preparing with countdown via polling"),
        ("6. Completion", "Kitchen marks Ready ➔ Completed; payment auto-settles to Paid")
    ]

    p_ds = tf_demo.add_paragraph()
    for s_num, s_desc in demo_steps:
        r_sn = p_ds.add_run()
        r_sn.text = f"{s_num}: "
        r_sn.font.name = FONT_HEADING
        r_sn.font.size = Pt(10.5)
        r_sn.font.bold = True
        r_sn.font.color.rgb = COLOR_CHARCOAL
        r_sd = p_ds.add_run()
        r_sd.text = f"{s_desc}    |    "
        r_sd.font.name = FONT_PRIMARY
        r_sd.font.size = Pt(10)
        r_sd.font.color.rgb = COLOR_BODY

    # Bottom Half: Future Scope Card (Clearly Labeled as Roadmap)
    c_fut = add_card(s11, Inches(0.8), Inches(4.0), Inches(11.7), Inches(2.75), bg_color=COLOR_WHITE)
    tb_fut = s11.shapes.add_textbox(Inches(1.05), Inches(4.15), Inches(11.2), Inches(2.5))
    tf_fut = tb_fut.text_frame
    tf_fut.word_wrap = True

    p_fh = tf_fut.paragraphs[0]
    p_fh.space_after = Pt(6)
    r_fh = p_fh.add_run()
    r_fh.text = "FUTURE ARCHITECTURAL ROADMAP (PLANNED ENHANCEMENTS):"
    r_fh.font.name = FONT_HEADING
    r_fh.font.size = Pt(12)
    r_fh.font.bold = True
    r_fh.font.color.rgb = COLOR_CHARCOAL

    future_items = [
        ("Multi-Vendor Stalls", "Extend data model with stallId to support distinct canteen vendor portals"),
        ("Online Payment Gateway", "Integrate Razorpay or Paytm UPI Intent for direct in-app payments"),
        ("WebSockets / Server-Sent Events", "Push notifications replacing 4.5s polling for ultra-low latency updates"),
        ("SMS & WhatsApp Alerts", "Twilio-powered SMS when order transitions to 'Ready' for counter pickup"),
        ("Predictive Demand Analytics", "Machine learning forecasting ingredient requirements based on weekday schedules")
    ]

    for f_title, f_desc in future_items:
        p = tf_fut.add_paragraph()
        p.space_after = Pt(3)
        rf_t = p.add_run()
        rf_t.text = f"• {f_title}: "
        rf_t.font.name = FONT_HEADING
        rf_t.font.size = Pt(10.5)
        rf_t.font.bold = True
        rf_t.font.color.rgb = COLOR_ORANGE
        rf_d = p.add_run()
        rf_d.text = f"{f_desc} (Planned enhancement — not in current baseline)"
        rf_d.font.name = FONT_PRIMARY
        rf_d.font.size = Pt(10)
        rf_d.font.color.rgb = COLOR_BODY

    set_notes(s11, """
Now, we are ready for the live demonstration. Our demonstration follows the natural lifecycle of a campus meal:
First, a student logs into the portal.
Second, they browse the menu, customize their cart, and proceed to checkout.
Third, an order token is generated.
Fourth, we switch to the Administrator screen, where the kitchen manager moves the order from Placed to Preparing and then Ready.
Fifth, the student's screen updates via polling to show their meal is ready for collection.
And sixth, the order is marked Completed, settling the payment and updating our real-time revenue analytics.

Looking ahead to future scope: we have structured CampusBite's modular architecture so it can easily expand. Planned enhancements include multi-canteen vendor portals for university food courts, integrated payment gateways like Razorpay, WebSocket push updates, SMS pickup alerts, and predictive sales analytics.
""")

    # =========================================================================
    # SLIDE 12: CONCLUSION & Q&A
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)

    # Main Card
    c_con = add_card(s12, Inches(1.5), Inches(1.0), Inches(10.333), Inches(5.5), bg_color=COLOR_WHITE)
    tb_con = s12.shapes.add_textbox(Inches(2.0), Inches(1.3), Inches(9.333), Inches(4.9))
    tf_con = tb_con.text_frame
    tf_con.word_wrap = True

    p_cb = tf_con.paragraphs[0]
    p_cb.space_after = Pt(4)
    r_cb = p_cb.add_run()
    r_cb.text = "CSE326 ACADEMIC PROJECT SUMMARY"
    r_cb.font.name = FONT_HEADING
    r_cb.font.size = Pt(12)
    r_cb.font.bold = True
    r_cb.font.color.rgb = COLOR_ORANGE

    p_ct = tf_con.add_paragraph()
    p_ct.space_after = Pt(16)
    r_ct = p_ct.add_run()
    r_ct.text = "CampusBite — Making Campus Dining Smarter"
    r_ct.font.name = FONT_HEADING
    r_ct.font.size = Pt(32)
    r_ct.font.bold = True
    r_ct.font.color.rgb = COLOR_CHARCOAL

    con_bullets = [
        ("Eliminated Congestion", "Asynchronous digital ordering replaces chaotic physical counter bottlenecks"),
        ("Operational Clarity", "Live 4-stage tracking gives students certainty and kitchen staff full queue control"),
        ("Strict Compliance", "100% compliant with CSE326 rules: HTML5, CSS3, Vanilla JS, Node.js, MongoDB Atlas"),
        ("Production Reliability", "Validated by 41 integration tests, 8 E2E workflows, and live Atlas persistence")
    ]

    for b_title, b_desc in con_bullets:
        p = tf_con.add_paragraph()
        p.space_after = Pt(6)
        rb_t = p.add_run()
        rb_t.text = f"✓  {b_title}: "
        rb_t.font.name = FONT_HEADING
        rb_t.font.size = Pt(12.5)
        rb_t.font.bold = True
        rb_t.font.color.rgb = COLOR_ORANGE
        rb_d = p.add_run()
        rb_d.text = b_desc
        rb_d.font.name = FONT_PRIMARY
        rb_d.font.size = Pt(12)
        rb_d.font.color.rgb = COLOR_BODY

    # Thank you & Q&A Box
    p_ty = tf_con.add_paragraph()
    p_ty.space_before = Pt(24)
    p_ty.alignment = PP_ALIGN.CENTER
    r_ty = p_ty.add_run()
    r_ty.text = "Thank You!  —  Questions & Answers\n"
    r_ty.font.name = FONT_HEADING
    r_ty.font.size = Pt(22)
    r_ty.font.bold = True
    r_ty.font.color.rgb = COLOR_ORANGE

    r_tm = p_ty.add_run()
    r_tm.text = "Pirzada Salik  |  Course Code: CSE326  |  [INSERT UNIVERSITY NAME]"
    r_tm.font.name = FONT_PRIMARY
    r_tm.font.size = Pt(12)
    r_tm.font.color.rgb = COLOR_MUTED

    set_notes(s12, """
To conclude: CampusBite successfully bridges the gap between hungry campus students and busy canteen operators.

By digitizing the ordering journey, we have eliminated chaotic peak-hour counter queues, provided complete operational visibility, and streamlined kitchen preparation. We accomplished this while strictly adhering to our CSE326 course constraints — proving that modern, robust, and beautiful web applications can be built using pure, native web standards without relying on heavy frontend frameworks.

The application is fully functional, backed by a live MongoDB Atlas cloud database, and backed by a comprehensive QA test suite.

Thank you for your time and attention. I would now be delighted to answer any questions from the faculty and class.
""")

    # ─── SAVE PRESENTATION ──────────────────────────────────────────────
    out_path = os.path.join(BASE_DIR, "presentation", "CampusBite_Project_Presentation.pptx")
    prs.save(out_path)
    print(f"Presentation successfully created at: {out_path}")
    print(f"Total slides: {len(prs.slides)}")

if __name__ == "__main__":
    create_deck()
