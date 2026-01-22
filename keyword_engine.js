/**
 * JobMate Keyword Engine
 * A deterministic rule-based classifier for Engineering Jobs.
 */

const KEYWORD_BUCKETS = {
    'Backend': ['backend', 'back-end', 'java', 'spring', 'python', 'django', 'flask', 'fastapi', 'node', 'express', 'nestjs', 'golang', 'go lang', 'ruby', 'rails', 'php', 'laravel', 'c#', '.net', 'sql', 'database', 'postgresql', 'mysql', 'redis', 'api', 'microservices', 'server-side'],
    'Frontend': ['frontend', 'front-end', 'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind', 'sass', 'webpack', 'vite', 'redux', 'ui/ux', 'web design', 'figma'],
    'Mobile': ['mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', 'dart', 'objective-c', 'app developer', 'mobile developer'],
    'Data': ['data engineer', 'data scientist', 'data analyst', 'big data', 'sql', 'spark', 'hadoop', 'kafka', 'airflow', 'etl', 'pandas', 'numpy', 'tableau', 'power bi', 'snowflake', 'databricks', 'warehouse', 'redshift', 'dbt'],
    'DevOps': ['devops', 'sre', 'site reliability', 'cloud', 'aws', 'amazon web services', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'linux', 'bash', 'scripting', 'infrastructure', 'sysadmin'],
    'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'nlp', 'computer vision', 'pytorch', 'tensorflow', 'keras', 'hugging face', 'llm', 'generative ai', 'scikit-learn', 'model training', 'rag', 'transformer'],
    'QA': ['qa', 'quality assurance', 'test', 'automation', 'selenium', 'cypress', 'playwright', 'junit', 'pytest', 'manual testing', 'sdet'],
    'Security': ['security', 'cyber', 'infosec', 'penetration', 'vulnerability', 'cryptography', 'network security', 'ciso', 'soc'],
    'Product': ['product manager', 'product owner', 'technical product manager', 'roadmap', 'agile', 'scrum', 'user stories', 'backlog', 'stakeholder'],
    'Fullstack': ['fullstack', 'full-stack', 'full stack'] // Special case: often overrides others
};

// Negative lookahead/lookbehind is hard in simple iterators, so we use scoring.
// Some keywords are "stronger" than others.
const TITLE_WEIGHT = 50; // Title match = 50 points
const BODY_WEIGHT = 1;   // Body match = 1 point

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

        // 1. Scan Job Title (Heavy Weighing)
        // If the title explicitly says "Backend Engineer", we want that to win even if the body mentions "React" once.
        for (const category in KEYWORD_BUCKETS) {
            const keywords = KEYWORD_BUCKETS[category];
            for (const kw of keywords) {
                if (cleanTitle.includes(kw)) {
                    scores[category] += TITLE_WEIGHT;
                }
            }
        }

        // 2. Scan Body (Frequency Counting)
        for (const category in KEYWORD_BUCKETS) {
            const keywords = KEYWORD_BUCKETS[category];
            for (const kw of keywords) {
                // Regex to count occurrences (word boundary check is safer but slower, simple includes is fast)
                // For speed, we'll split by spaces or just use split.
                // Actually, split is slow. Let's strictly use checking presence?
                // No, frequency matters. "Java" mentioned 10 times vs "Javascript" mentioned 1 time.

                const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                const matches = (cleanDesc.match(regex) || []).length;
                scores[category] += matches * BODY_WEIGHT;
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
            if (scores['Fullstack'] >= TITLE_WEIGHT) {
                return 'Fullstack';
            }
        }

        // Find winner
        let maxScore = 0;
        let winner = 'Not Sure';

        for (const category in scores) {
            if (scores[category] > maxScore) {
                maxScore = scores[category];
                winner = category;
            }
        }

        // Threshold?
        if (maxScore < 3) return 'Not Sure'; // Too generic

        return winner;
    }
}

// Make it available globally
window.KeywordEngine = KeywordEngine;
