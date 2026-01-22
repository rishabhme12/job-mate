/**
 * JobMate Keyword Engine
 * A deterministic rule-based classifier for Engineering Jobs.
 */

const KEYWORD_BUCKETS = {
    'Backend': ['backend', 'back-end', 'java', 'spring', 'python', 'django', 'flask', 'fastapi', 'node', 'express', 'nestjs', 'golang', 'go lang', 'ruby', 'rails', 'php', 'laravel', 'c#', '.net', 'sql', 'database', 'postgresql', 'mysql', 'redis', 'api', 'microservices', 'server-side', 'elasticsearch', 'opensearch'],
    'Frontend': ['frontend', 'front-end', 'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind', 'sass', 'webpack', 'vite', 'redux', 'ui/ux', 'web design', 'figma'],
    'Mobile': ['mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', 'dart', 'objective-c', 'app developer', 'mobile developer'],
    'Data': ['data engineer', 'data scientist', 'data analyst', 'big data', 'sql', 'spark', 'hadoop', 'kafka', 'airflow', 'etl', 'pandas', 'numpy', 'tableau', 'power bi', 'snowflake', 'databricks', 'warehouse', 'redshift', 'dbt', 'elasticsearch', 'opensearch', 'solr', 'lucene', 'vector database', 'python', 'pipeline', 'glue', 'athena', 'kinesis', 'snaplogic', 'data integration', 'informatica', 'iics', 'powercenter'],
    'DevOps': ['devops', 'sre', 'site reliability', 'cloud', 'aws', 'amazon web services', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'linux', 'bash', 'scripting', 'infrastructure', 'sysadmin'],
    'Embedded/Systems': ['embedded', 'firmware', 'kernel', 'driver', 'dpdk', 'tcp/ip', 'rtos', 'microcontroller', 'fpga', 'verilog', 'assembly', 'distributed systems', 'low latency'],
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
                const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(cleanTitle)) {
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
            const dataScore = scores['Data'] || 0;
            const fullstackScore = scores['Fullstack'] || 0;

            // If Backend is close to DevOps (e.g. DevOps=20, Backend=18), pick Backend.
            // Why? Because a Backend Engineer *uses* DevOps tools. A DevOps Engineer *is* the toolsmith.
            // Hard to distinguish, but usually if Python/Java/Code is heavy, it's Backend.
            // NEW LOGIC: Find the best alternative, don't just pick the first one.
            const candidates = [
                { type: 'Backend', score: backendScore },
                { type: 'Data', score: dataScore },
                { type: 'Fullstack', score: fullstackScore }
            ];

            // Filter those who pass the threshold
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
