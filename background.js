// JobMate Background Worker (Transformers.js)

import { pipeline, env } from './transformers.min.js';

// Configuration: Skip local checks since we are in an extension
env.allowLocalModels = false;
env.useBrowserCache = true;
// Service Workers cannot create Blobs/Workers easily, so run single-threaded
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.simd = false;

// Singleton for the pipeline
class Classifier {
    static task = 'zero-shot-classification';
    // REVERT: Back to MobileBERT which user said was faster/working
    static model = 'Xenova/mobilebert-uncased-mnli';
    static instance = null;

    static async getInstance(progressCallback = null) {
        if (this.instance === null) {
            console.log("JobMate: Loading MobileBERT...");
            this.instance = await pipeline(this.task, this.model, {
                quantized: true, // Keep quantization for speed
                progress_callback: (x) => {
                    // Logs only for debug
                    if (x.status === 'progress') console.log(`DL: ${Math.round(x.progress)}%`);
                }
            });
            console.log("JobMate: MobileBERT Ready.");
        }
        return this.instance;
    }
}

// Detailed Labels (Restoring precision)
// Note: More labels = slightly slower, but user wants accuracy.
const LABELS = [
    'Backend Engineer',
    'Frontend Engineer',
    'Fullstack Engineer',
    'Mobile Android iOS Engineer',
    'Data Engineer Database', // Removed "Scientist" to avoid AI overlap
    'Artificial Intelligence Machine Learning Engineer', // Stronger signal for AI
    'DevOps Cloud Engineer',
    'Cyber Security',
    'QA Tester',
    'Product Manager',
    'Sales Marketing HR',
    'Other'
];

async function classify(text) {
    try {
        console.log("JobMate: classify() called. Getting instance...");
        const classifier = await Classifier.getInstance();

        // Truncate to 512 characters. MobileBERT input limit is 512 TOKENS.
        // SENDING TOO MUCH TEXT SLOWS IT DOWN EXPONENTIALLY.
        // 512 chars is plenty for a title + summary.
        const truncated = text.substring(0, 512);
        console.log("JobMate: Inference on", truncated.length, "chars");

        const startTime = Date.now();
        const output = await classifier(truncated, LABELS);
        console.log("JobMate: Done in", (Date.now() - startTime) / 1000, "s");

        const topLabel = output.labels[0];
        console.log("JobMate: Top Label:", topLabel);
        return getShortTag(topLabel);
    } catch (e) {
        console.error("Classification Error:", e);
        return "Error";
    }
}

function getShortTag(label) {
    // Priority: AI/ML is often misclassified as Data because of "Data Scientist", 
    // but if it has ANY AI keywords, tag as AI/ML.
    if (label.includes('AI') || label.includes('Machine') || label.includes('Artificial')) return 'AI/ML';

    // Check key terms even if the Label was something else (Correcting Model Bias)
    // Actually, we are checking the *Model Output Label*, not the input text.

    if (label.includes('Backend')) return 'Backend';
    if (label.includes('Frontend')) return 'Frontend';
    if (label.includes('Fullstack')) return 'Fullstack';
    if (label.includes('Mobile')) return 'Mobile';
    if (label.includes('Data')) return 'Data';
    if (label.includes('Security')) return 'Security';
    if (label.includes('DevOps') || label.includes('Cloud')) return 'DevOps/Cloud';
    if (label.includes('QA') || label.includes('Quality')) return 'QA';
    if (label.includes('Product')) return 'Product';
    if (label.includes('Sales') || label.includes('Marketing') || label.includes('HR')) return 'Non-Tech';

    // For general "Software Engineering", try to be more specific if possible (future improvement),
    // but at least don't lump AI/Data into it if the model found those.
    // If the model output "Data Scientist", the 'Data' check above catches it.
    // If the model output "Software Engineer", we return "Engineering".
    return 'Engineering';
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'classify') {
        console.log("JobMate: Message received", request.text.substring(0, 50));
        classify(request.text).then(result => {
            console.log("JobMate: Sending response", result);
            sendResponse({ result })
        });
        return true; // Keep channel open
    }
});
