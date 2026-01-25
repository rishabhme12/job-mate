# Add advance filters: Hide - viewed, applied, company based on some title, category, number of applicants etc. Filters like last x hours etc ect (based on url)
# Include certain key works in title/jd.
# Tagging for all jobs in list view.
# more taggings like size of company etc etc



# Add advance filter
    1. Hide - viewed, applied, title key words, company name keywords
    2. Show jobs with specifc keywork in title
    3. Show posted in last x hours and x days
    All these filters withtin smooth seamless clean UI feels embedded in linked page.


    4. show more taggings along with role type, like applicant count,company size, location, industry, founded year or similar

JobMate Product Backlog (Definitive)
🎨 UI/UX Philosophy
"Seamlessly Embedded": All filters and insights should look like native LinkedIn features. We will inject a "JobMate Control Bar" gracefully above the job list and a "JobMate Insight Panel" within the job details.

🚀 Priority 1: Smart Filters (List View)
Goal: Rapidly remove noise so the user only scrolls through relevant jobs.

1. 🛡️ The "Ghost" Protocol (Hide Filters)
User Story: "I assume these jobs don't exist."

Hide Viewed/Applied: Auto-dim or hide jobs with Viewed or Applied status.
Hide Company: User-defined blacklist (e.g., "CyberCoders", "Revature").
Hide Negative Keywords: Filter out titles with "Senior", "Lead", "Staff".
Hide "Easy Apply": Option to hide (or show only) Easy Apply jobs.
Hide jobs where applied > x (x is configurable)

2. 🔍 Precision Search (Title & Time)
User Story: "Show me specific roles posted recently."

Multi-Keyword Title Match: Allow Data Engineer OR ETL Engineer. (Implemented via our own JS filter on the list, distinct from LinkedIn's broad search).
Time Filter: "Posted within X hours". (Implemented via f_TPR URL parameter for accuracy, e.g., r43200 for 12 hours).
Sticky Settings: Remember my filters between sessions.
🚀 Priority 2: Deep Insights (Expanded View)
Goal: Provide decision-making data instantly upon clicking a job.

3. 📊 Insight Dashboard
User Story: "Give me the stats before I read the JD."

Applicant Count: Scrape and display "43 applicants".
Company Vitals: Show Size ("1000-5000") and on linkedin count also eg 310 people work here so, Industry ("Fintech"), and Founded Year (if available).
Hiring Trends: (New Idea) Show "Total Views" vs "Total Applies" if available to gauge competition heat.

4. 🔗 "Direct Link" Finder
Idea: Bypass LinkedIn "Easy Apply". Because easy apply just create bulk load of application on linkedin, so its sometime better tomdireclty apply to career site.

Value: If the company name is unique, add a small "Search Career Page" icon next to the company name that opens a Google search for [Company Name] [job location] [job title] careers.


🔧 Technical Implementation Strategy
A. URL-Based "Smart Filters"
We will hijack the LinkedIn URL where possible for robustness:

Time: ?f_TPR=r{seconds} (Allows granular "Last 12h" which native UI doesn't show).
Remote/Hybrid: ?f_WT={1,2,3}.
Location: ?geoId={id}.
B. DOM-Based "Visual Filters"
For things LinkedIn can't do:

Keyword/Company Hiding: Pure CSS/JS hiding in 
content.js
.
Viewed Dimmer: CSS opacity rule.
C. Data Extraction
Detail Observer: When #job-details text changes, re-run scraper for Applicant/Company stats.