/**
 * JobMate Keyword Engine
 * A deterministic rule-based classifier for Engineering Jobs.
 */

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
    'Fullstack': ['fullstack', 'full-stack', 'full stack'] // Special case: often overrides others
};

// Negative lookahead/lookbehind is hard in simple iterators, so we use scoring.
// Some keywords are "stronger" than others.
// Dynamic Scoring Constants
// If description is short (scraper failed), we rely 100% on Title.
// If description is long, we let the Body content override the Title if there's enough evidence.
const TITLE_ONLY_WEIGHT = 100;
const TITLE_HINT_WEIGHT = 40;  // Title is just a hint if we have body text
const BODY_MATCH_WEIGHT = 2;   // Every body keyword is worth 2 points

class KeywordEngine {

    static normalize(text) {
        return text.toLowerCase().replace(/[^\w\s\+\-\.]/g, ''); // Keep +, -, . for C++, .NET, Node.js
    }

    static classify(title, description) {
        const cleanTitle = this.normalize(title);
        const cleanDesc = this.normalize(description);

        const scores = {};

        // Initialize scores
        for (const category in KEYWORD_BUCKETS) {
            scores[category] = 0;
        }

        // Determine Weights based on available data
        let currentTitleWeight = TITLE_HINT_WEIGHT;
        let currentBodyWeight = BODY_MATCH_WEIGHT;

        // EDGE CASE: If description is missing or very short (scraper failed context/auth wall),
        // we MUST rely on the Title.
        if (cleanDesc.length < 200) {
            console.log("JobMate: Short Description detected. Relying on Title.");
            currentTitleWeight = TITLE_ONLY_WEIGHT;
            currentBodyWeight = 0; // Ignore body noise if it's just "About Us" or empty
        }

        // 1. Scan Job Title
        for (const category in KEYWORD_BUCKETS) {
            const keywords = KEYWORD_BUCKETS[category];
            for (const kw of keywords) {
                // MATCHING UPDATE: Allow optional plural 's' or 'es' at the end.
                // e.g. "pipeline" matches "pipelines", "api" matches "apis"
                const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`, 'i');
                if (regex.test(cleanTitle)) {
                    scores[category] += currentTitleWeight;
                }
            }
        }

        // 2. Scan Body (Frequency Counting)
        if (currentBodyWeight > 0) {
            for (const category in KEYWORD_BUCKETS) {
                const keywords = KEYWORD_BUCKETS[category];
                for (const kw of keywords) {
                    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es)?\\b`, 'gi');
                    const matches = (cleanDesc.match(regex) || []).length;
                    scores[category] += matches * currentBodyWeight;
                }
            }
        }


        console.log(`JobMate Classification: Title='${cleanTitle}'`);
        console.table(scores); // Nice table in console

        // 3. Post-Processing / Tie Breaking
        // "Fullstack" usually implies matches in both backend and frontend.
        // If "Fullstack" score is > 0 (even just from title), it often overrides pure backend/frontend.
        if (scores['Fullstack'] > 0 || (cleanTitle.includes('full') && cleanTitle.includes('stack'))) {
            // Check if we have strong backend AND frontend signals?
            // Actually, usually title is enough.
            if (scores['Fullstack'] >= currentTitleWeight) {
                return 'Fullstack';
            }
        }

        // Tie-Breaking Rule for DevOps
        // "DevOps" often wins just because of keywords like AWS, Cloud, Docker, CI/CD which are valid for Backend/Data too.
        // Rule: If DevOps is the winner, but Backend or Data is *close* (within 20% or 5 points), 
        // we prefer Backend/Data because those are the "primary" roles.

        let winner = 'Not Sure';
        let maxScore = -1;

        for (const category in scores) {
            if (scores[category] > maxScore) {
                maxScore = scores[category];
                winner = category;
            }
        }

        if (winner === 'DevOps') {
            const backendScore = scores['Backend'] || 0;
            const fullstackScore = scores['Fullstack'] || 0;
            const dataEngScore = scores['Data Engineering'] || 0;
            const dataAnalyticsScore = scores['Data Analytics'] || 0;
            const dataScienceScore = scores['Data Science'] || 0;

            // NEW LOGIC: Find the best alternative
            const candidates = [
                { type: 'Backend', score: backendScore },
                { type: 'Fullstack', score: fullstackScore },
                { type: 'Data Engineering', score: dataEngScore },
                { type: 'Data Analytics', score: dataAnalyticsScore },
                { type: 'Data Science', score: dataScienceScore }
            ];

            // Filter those who pass the threshold (60% of DevOps score)
            const qualifiers = candidates.filter(c => c.score > maxScore * 0.6);

            if (qualifiers.length > 0) {
                // Return the one with the highest score
                qualifiers.sort((a, b) => b.score - a.score);
                return qualifiers[0].type;
            }
        }

        // Standard Max Score check
        if (maxScore < 3) return 'Not Sure';

        return winner;
    }
}

// Make it available globally
window.KeywordEngine = KeywordEngine;
