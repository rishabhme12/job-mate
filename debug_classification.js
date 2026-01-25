
const KEYWORD_BUCKETS = {
    'Backend': ['backend', 'back-end', 'java', 'spring', 'python', 'django', 'flask', 'fastapi', 'node', 'express', 'nestjs', 'golang', 'go lang', 'ruby', 'rails', 'php', 'laravel', 'c#', '.net', 'sql', 'database', 'postgresql', 'mysql', 'redis', 'api', 'microservices', 'server-side', 'elasticsearch', 'opensearch', 'graphql'],
    'Frontend': ['frontend', 'front-end', 'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind', 'sass', 'webpack', 'vite', 'redux', 'ui/ux', 'web design', 'figma'],
    'Mobile': ['mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', 'dart', 'objective-c', 'app developer', 'mobile developer'],
    'Data Engineering': ['data engineer', 'big data', 'spark', 'pyspark', 'hadoop', 'kafka', 'airflow', 'etl', 'hivesql', 'snowflake', 'databricks', 'warehouse', 'lakehouse', 'delta lake', 'iceberg', 'redshift', 'dbt', 'pipeline', 'glue', 'athena', 'kinesis', 'snaplogic', 'informatica', 'iics', 'powercenter', 'scala', 'flink', 'data platform'],
    'Data Analytics': ['data analyst', 'business analyst', 'business intelligence', 'bi', 'tableau', 'power bi', 'looker', 'quicksight', 'dashboard', 'visualization', 'analytics', 'reporting', 'excel', 'sheets', 'statistics', 'a/b testing', 'mixpanel'],
    'Data Science': ['data scientist', 'data science', 'pandas', 'numpy', 'scipy', 'scikit-learn', 'matplotlib', 'seaborn', 'jupyter', 'modeling', 'predictive', 'statistical', 'r programming', 'mathematics'],
    'DevOps': ['devops', 'sre', 'site reliability', 'cloud', 'aws', 'amazon web services', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'linux', 'bash', 'scripting', 'infrastructure', 'sysadmin', 'prometheus', 'grafana', 'datadog', 'elk'],
    'Embedded/Systems': ['embedded', 'firmware', 'kernel', 'driver', 'dpdk', 'tcp/ip', 'rtos', 'microcontroller', 'fpga', 'verilog', 'assembly', 'distributed systems', 'low latency'],
    'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'nlp', 'computer vision', 'pytorch', 'tensorflow', 'keras', 'hugging face', 'llm', 'generative ai', 'rag', 'transformer', 'neural network'],
    'QA': ['qa', 'quality assurance', 'test', 'automation', 'selenium', 'cypress', 'playwright', 'junit', 'pytest', 'manual testing', 'sdet'],
    'Security': ['security', 'cyber', 'infosec', 'penetration', 'vulnerability', 'cryptography', 'network security', 'ciso', 'soc'],
    'Product': ['product manager', 'product owner', 'technical product manager', 'roadmap', 'agile', 'scrum', 'user stories', 'backlog', 'stakeholder'],
    'Fullstack': ['fullstack', 'full-stack', 'full stack']
};

const TITLE_ONLY_WEIGHT = 100;
const TITLE_HINT_WEIGHT = 20;
const BODY_MATCH_WEIGHT = 2;

class KeywordEngine {
    static normalize(text) {
        return text.toLowerCase().replace(/[^\w\s\+\-\.]/g, '');
    }

    static classify(title, description) {
        const cleanTitle = this.normalize(title);
        const cleanDesc = this.normalize(description);
        const scores = {};

        for (const category in KEYWORD_BUCKETS) {
            scores[category] = 0;
        }

        let currentTitleWeight = TITLE_HINT_WEIGHT;
        let currentBodyWeight = BODY_MATCH_WEIGHT;

        if (cleanDesc.length < 200) {
            console.log("JobMate: Short Description detected. Relying on Title.");
            currentTitleWeight = TITLE_ONLY_WEIGHT;
            currentBodyWeight = 0;
        }

        // 1. Scan Job Title
        console.log("--- Title Matches ---");
        for (const category in KEYWORD_BUCKETS) {
            const keywords = KEYWORD_BUCKETS[category];
            for (const kw of keywords) {
                // MATCHING UPDATE: Allow optional plural 's' or 'es' at the end.
                const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`, 'i');
                if (regex.test(cleanTitle)) {
                    scores[category] += currentTitleWeight;
                    console.log(`[${category}] Title Match: '${kw}' (+${currentTitleWeight})`);
                }
            }
        }

        // 2. Scan Body
        console.log("\n--- Body Matches ---");
        if (currentBodyWeight > 0) {
            for (const category in KEYWORD_BUCKETS) {
                const keywords = KEYWORD_BUCKETS[category];
                for (const kw of keywords) {
                    // MATCHING UPDATE: Allow optional plural 's' or 'es' at the end.
                    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`, 'gi');
                    const matches = (cleanDesc.match(regex) || []).length;
                    if (matches > 0) {
                        scores[category] += matches * currentBodyWeight;
                        console.log(`[${category}] Body Match: '${kw}' (x${matches}) (+${matches * currentBodyWeight})`);
                    }
                }
            }
        }

        console.log("\n--- Final Scores ---");
        console.table(scores);

        // Tie-Breaking Strategy Logic (replicated)
        let winner = 'Not Sure';
        let maxScore = -1;
        for (const category in scores) {
            if (scores[category] > maxScore) {
                maxScore = scores[category];
                winner = category;
            }
        }

        if (winner === 'DevOps') {
            // ... Logic ...
            const candidates = [
                { type: 'Backend', score: scores['Backend'] || 0 },
                { type: 'Fullstack', score: scores['Fullstack'] || 0 },
                { type: 'Data Engineering', score: scores['Data Engineering'] || 0 },
                { type: 'Data Analytics', score: scores['Data Analytics'] || 0 },
                { type: 'Data Science', score: scores['Data Science'] || 0 }
            ];
            const qualifiers = candidates.filter(c => c.score > maxScore * 0.6);
            if (qualifiers.length > 0) {
                qualifiers.sort((a, b) => b.score - a.score);
                console.log(`\nOverriding DevOps with ${qualifiers[0].type} (Score: ${qualifiers[0].score})`);
                return qualifiers[0].type;
            }
        }

        if (maxScore < 3) return 'Not Sure';

        return winner;
    }
}

const jobTitle = "Software Engineer- Data Platform(Remote)";
const jobDesc = `
Granica logo
Granica
Share
Show more options
Software Engineer- Data Platform(Remote)
India · 22 hours ago · 91 people clicked apply
Promoted by hirer · Responses managed off LinkedIn


 Remote
Matches your job preferences, workplace type is Remote.

 Full-time
Matches your job preferences, job type is Full-time.

Apply

Save
Save Software Engineer- Data Platform(Remote) at Granica
How your profile and resume fit this job
Get AI-powered advice on this job and more exclusive features with Premium. Reactivate Premium: 50% Off


Show match details

Tailor my resume

Help me stand out
About the job
About Granica

Granica is an AI research and infrastructure company focused on reliable, steerable representations for enterprise data.

We earn trust through Crunch, a policy-driven health layer that keeps large tabular datasets efficient, reliable, and reversible. On this foundation, we’re building Large Tabular Models—systems that learn cross-column and relational structure to deliver trustworthy answers and automation with built-in provenance and governance.

Join Granica’s core engineering team to design and scale systems powering data workflows, automation, and analytics. This is a deep engineering role—not feature delivery.

What You’ll Do-

Build backend APIs and scalable data pipelines (Python, PySpark).
Work with modern data lakehouse/warehouse tech (Iceberg, Delta Lake, Snowflake, Databricks).
Orchestrate workflows (Airflow) and optimize big data frameworks.
Manage infra as code (Terraform) and ensure reliability with monitoring/logging.
Collaborate across teams and with customers to solve complex data challenges and design seamless integration solutions.
Drive best practices in scalability, reliability, and cost efficiency.

What We're Looking For-

5+ years in software/data engineering or infrastructure roles
Strong Python skills (backend APIs a plus)
Proven ability to build scalable data pipelines from scratch
Hands-on with Apache Iceberg/Delta Lake + Snowflake/Databricks
Workflow orchestration expertise (Airflow, Luigi, etc.)
Big data frameworks experience (Spark, Hadoop)
Familiar with monitoring/analytics tools (Prometheus, Grafana, ELK, Datadog)
Skilled in designing scalable, reliable, cost-efficient systems
Experience with large-scale distributed data architectures
Thrives in fast-paced startup environments
Excellent problem-solving, communication, and customer-facing skills

Nice-to-Haves

Hands-on experience with Terraform or other infrastructure-as-code tools.
Familiarity with security and privacy best practices in data processing pipelines.
Exposure to cloud platforms (AWS, GCP, Azure) and containerisation (Docker, Kubernetes).

Why Granica

Fundamental Research Meets Enterprise Impact. Work at the intersection of science and engineering, turning foundational research into deployed systems serving enterprise workloads at exabyte scale.
AI by Design. Build the infrastructure that defines how efficiently the world can create and apply intelligence.
Real Ownership. Design primitives that will underpin the next decade of AI infrastructure.
High-Trust Environment. Deep technical work, minimal bureaucracy, shared mission.
Enduring Horizon. Backed by NEA, Bain Capital, and various luminaries from tech and business. We are building a generational company for decades, not quarters or a product cycle.

Compensation & Benefits

Competitive salary, meaningful equity, and substantial bonus for top performers
Flexible time off plus comprehensive health coverage for you and your family
Support for research, publication, and deep technical exploration

At Granica, you will shape the fundamental infrastructure that makes intelligence itself efficient, structured, and enduring. Join us to build the foundational data systems that power the future of enterprise AI!
`;

const result = KeywordEngine.classify(jobTitle, jobDesc);
console.log(`\nFinal Classification: ${result}`);
