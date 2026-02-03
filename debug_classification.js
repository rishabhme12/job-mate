
const KEYWORD_BUCKETS = {
    'Backend': ['backend', 'back-end', 'java', 'spring', 'python', 'django', 'flask', 'fastapi', 'node', 'express', 'nestjs', 'golang', 'go lang', 'ruby', 'rails', 'php', 'laravel', 'c#', '.net', 'sql', 'database', 'postgresql', 'mysql', 'redis', 'api', 'microservices', 'server-side', 'elasticsearch', 'opensearch', 'graphql'],
    'Frontend': ['frontend', 'front-end', 'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind', 'sass', 'webpack', 'vite', 'redux', 'ui/ux', 'web design', 'figma'],
    'Mobile': ['mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', 'dart', 'objective-c', 'app developer', 'mobile developer'],
    'Data Engineering': ['data engineer', 'big data', 'spark', 'pyspark', 'hadoop', 'kafka', 'airflow', 'etl', 'hivesql', 'snowflake', 'databricks', 'warehouse', 'lakehouse', 'delta lake', 'iceberg', 'redshift', 'dbt', 'pipeline', 'glue', 'athena', 'kinesis', 'snaplogic', 'informatica', 'iics', 'powercenter', 'scala', 'flink', 'data platform', 'python', 'sql', 'postgresql', 'nosql', 'database', 'api', 'pandas', 'numpy', 'scraping', 'scrapy', 'web scraping'],
    'Data Analytics': ['data analyst', 'business analyst', 'business intelligence', 'bi', 'tableau', 'power bi', 'looker', 'quicksight', 'dashboard', 'visualization', 'analytics', 'reporting', 'excel', 'sheets', 'statistics', 'a/b testing', 'mixpanel', 'sql', 'python'],
    'Data Science': ['data scientist', 'data science', 'pandas', 'numpy', 'scipy', 'scikit-learn', 'matplotlib', 'seaborn', 'jupyter', 'modeling', 'predictive', 'statistical', 'r programming', 'mathematics', 'python', 'sql'],
    'DevOps': ['devops', 'sre', 'site reliability', 'cloud', 'aws', 'amazon web services', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'linux', 'bash', 'scripting', 'infrastructure', 'sysadmin', 'prometheus', 'grafana', 'datadog', 'elk', 'python', 'bash'],
    'Embedded/Systems': ['embedded', 'firmware', 'kernel', 'driver', 'dpdk', 'tcp/ip', 'rtos', 'microcontroller', 'fpga', 'verilog', 'assembly', 'distributed systems', 'low latency', 'c', 'c++'],
    'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'nlp', 'computer vision', 'pytorch', 'tensorflow', 'keras', 'hugging face', 'llm', 'generative ai', 'rag', 'transformer', 'neural network', 'python'],
    'QA': ['qa', 'quality assurance', 'test', 'automation', 'selenium', 'cypress', 'playwright', 'junit', 'pytest', 'manual testing', 'sdet'],
    'Security': ['security', 'cyber', 'infosec', 'penetration', 'vulnerability', 'cryptography', 'network security', 'ciso', 'soc'],
    'Product': ['product manager', 'product owner', 'technical product manager', 'roadmap', 'agile', 'scrum', 'user stories', 'backlog', 'stakeholder'],
    'Fullstack': ['fullstack', 'full-stack', 'full stack']
};

const TITLE_ONLY_WEIGHT = 100;
const TITLE_HINT_WEIGHT = 40;
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

        let winner = 'Not Sure';
        let maxScore = -1;
        for (const category in scores) {
            if (scores[category] > maxScore) {
                maxScore = scores[category];
                winner = category;
            }
        }

        if (winner === 'DevOps') {
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

// Test Case: The Misclassified Data Engineer Role (Again)
const title = "Senior Data Engineer";
const description = `
ABOUT THE PYTHON DATA ENGINEER ROLE:

We are looking for a skilled Python Data Engineer to join our team and work on building high-performance applications and scalable data solutions. In this role, you will be responsible for designing, developing, and maintaining robust Python-based applications, optimizing data pipelines, and integrating various APIs and databases.

This is more than just a coding role—it requires strategic thinking, creativity, and a passion for data-driven decision-making to drive results and innovation.

KEY RESPONSIBILITIES:

Develop, test, and maintain efficient Python applications.
Write optimized SQL queries and work with relational databases to manage and analyse large datasets.
Implement and integrate APIs, web scraping techniques, and database queries to extract data from various sources.
Design, develop, and maintain ETL pipelines for efficient data extraction, transformation, and loading.
Collaborate with cross-functional teams to understand technical requirements and deliver high-quality solutions.
Ensure code quality, performance, and scalability through best practices and code reviews.
Stay updated with the latest advancements in Python, data engineering, and backend development.

REQUIRED QUALIFICATIONS:

3–5+ years of expertise in Python is a must have.
Proficiency in Python frameworks and libraries such as Pandas, NumPy, and Scrapy.
Experience with Data Visualization tools such as Power BI, Tableau
Strong understanding of relational databases and SQL.
Experience working with cloud platforms such as AWS
Strong problem-solving skills and the ability to work in a collaborative team environment.
Bachelor / Master degree in Computer Science, Engineering, or a related field.
`;

console.log("--- Debugging Misclassification ---");
const result = KeywordEngine.classify(title, description);
console.log(`Final Classification: ${result}`);
