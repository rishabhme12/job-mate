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
Hide promoted jobs

2. 🔍 Precision Search (Title & Time)
User Story: "Show me specific roles posted recently."

Multi-Keyword Title Match: Allow Data Engineer OR ETL Engineer. (Implemented via our own JS filter on the list, distinct from LinkedIn's broad search).
Time Filter: "Posted within X hours". (Implemented via f_TPR URL parameter for accuracy, e.g., r43200 for 12 hours).
Sticky Settings: Remember my filters between sessions.
Actively reviweing candidates

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


Improvemtns
(world recommend trying top 5 other extensions)
1. Search filter-->Pro search and place next to searc icon - also remove active and cross icon as ot may not makes sense (or rather we can prefill the values based on url)
2. Hide reposted filter
4. mainatain list of blocked companies
6. Bug - page filter still qctive stae on reload even though its not applied which is okay
6. check if saved jobs can be added as filter fe or be
7. button colliding with other buttons so we need to think right positioning
8. think about making a development system - which is conservative like engineering team - it plans, design and execute write test cases, maintaomn docs, regression test and qa sign off before giving prod green light. Also daily/weekly regresison testing plan - automated
9. think how we can make whole development -  linkedin in ui agnostic or atleast be safe most of the time
10. Add these filters at other places of job listing not just job search

New:

Improvements:
change name, description, add assets - search listing banner, store listing banners videos etc
accurate jobs/offerletter - linkedin pro search and filters and more to get increase calls and interview and find and apply most relavant listings
1. Add walkthrough journey (walkthrough/activatio) - very important 
11. filters dont appear every time we launch jobs page, appear after a refresh
2. Start building asset to promote/market - Articles, videos, usecase screenshot, posts on PH/reddit
3. promote positive user ratings volumne
4. promote users to write reviews on platforms where it will boost downloads
5. some journey to collect feedback/suggestions from users
6. Improve listing quality - content, assets - Logo, banner, videos
7. test - dark/light theme, other languages, country specific linkedin
8. Freshness should show values and should be in green state if any time restructions are applied. also can we make linkedin time filters show the right value.
9. Should work on AI powered new search interface linkedin
10. respoted filters


