import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// KeywordEngine assigns to window; in Node we need a global window for the script to load
beforeAll(() => { if (typeof globalThis.window === 'undefined') globalThis.window = {}; });
afterAll(() => { delete globalThis.window; });

describe('KeywordEngine', () => {
    let KeywordEngine;
    beforeAll(async () => {
        const mod = await import('../../keyword_engine.js');
        KeywordEngine = mod.KeywordEngine;
    });

    it('U-7: normalize lowercases and strips non-word chars', () => {
        expect(KeywordEngine.normalize('Back-End Engineer')).toBe('back-end engineer');
        expect(KeywordEngine.normalize('C++ Developer')).toContain('c');
    });

    it('U-8: classify returns Backend for "Backend Engineer"', () => {
        const out = KeywordEngine.classify('Backend Engineer', 'We use Java and Spring.');
        expect(out).toBe('Backend');
    });

    it('U-9: classify returns Data Engineering for ETL title', () => {
        const out = KeywordEngine.classify('Data Engineer - ETL Pipelines', 'Spark, Airflow, Python.');
        expect(out).toBe('Data Engineering');
    });

    it('U-10: classify returns Not Sure for low/no match', () => {
        const out = KeywordEngine.classify('Chief of Staff', 'Coordinating meetings and travel.');
        expect(out).toBe('Not Sure');
    });

    it('U-14: Senior Data Engineer with backend-heavy JD returns Data Engineering', () => {
        // Long body so both Backend and Data Engineering get body scores; title-priority rule must prefer Data Engineering.
        const body = 'Role: Senior Data Engineer. Location: India/Remote. Python, RDF/SPARQL, YASR, YASGUI, SQL, REST & GraphQL, ETL/ELT, GCP, BQ, GKE, Helm, Dataproc, Terraform, IAM, Apache Jena, React, Machine Learning and Knowledge Graphs. Build APIs and database pipelines.';
        const out = KeywordEngine.classify('Senior Data Engineer', body);
        expect(out).toBe('Data Engineering');
    });

    it('U-15: frontend/backend near-tie returns Fullstack', () => {
        const body = `
            We are looking for a skilled Web Developer to design, maintain, and optimize our websites and web applications.
            The ideal candidate should have strong front-end and back-end development experience.
            Design responsive company websites and landing pages.
            Optimize user experience across browsers and devices.
            Strong proficiency in HTML, CSS, JavaScript, and at least one framework.
            Experience with PHP, WordPress, MySQL, and API integrations.
        `;
        const out = KeywordEngine.classify('Web Developer - PH', body);
        expect(out).toBe('Fullstack');
    });
});
