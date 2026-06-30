"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get deriveBudgetDisplay () {
        return deriveBudgetDisplay;
    },
    get deriveHistoryTimeline () {
        return deriveHistoryTimeline;
    },
    get derivePercentileLabel () {
        return derivePercentileLabel;
    },
    get derivePersonalityDescription () {
        return derivePersonalityDescription;
    },
    get deriveStyleAttributes () {
        return deriveStyleAttributes;
    },
    get deriveStyleRadar () {
        return deriveStyleRadar;
    },
    get deriveWeeklyGrowth () {
        return deriveWeeklyGrowth;
    },
    get formatBrandAffinityList () {
        return formatBrandAffinityList;
    }
});
const STYLE_AXES = [
    'Minimalist',
    'Classic',
    'Streetwear',
    'Formal',
    'Casual',
    'Avant-garde'
];
const STYLE_ATTRIBUTE_KEYS = [
    'Minimalist',
    'Classic',
    'Streetwear',
    'Avant-garde',
    'Casual'
];
const CATEGORY_STYLE_WEIGHTS = {
    casual: {
        Casual: 1,
        Streetwear: 0.45
    },
    formal: {
        Formal: 1,
        Classic: 0.75
    },
    luxury: {
        Classic: 0.65,
        'Avant-garde': 0.55,
        Minimalist: 0.35
    },
    sportswear: {
        Streetwear: 0.85,
        Casual: 0.55
    },
    athleisure: {
        Casual: 0.75,
        Streetwear: 0.5
    },
    minimalist: {
        Minimalist: 1
    },
    vintage: {
        Classic: 0.7,
        'Avant-garde': 0.45
    },
    streetwear: {
        Streetwear: 1,
        Casual: 0.4
    },
    business: {
        Formal: 0.8,
        Classic: 0.7,
        Minimalist: 0.35
    },
    workwear: {
        Classic: 0.65,
        Formal: 0.55
    },
    outerwear: {
        Classic: 0.45,
        Casual: 0.4
    },
    accessories: {
        Classic: 0.35,
        Minimalist: 0.3
    }
};
const PERSONALITY_STYLE_WEIGHTS = {
    'Minimal Professional': {
        Minimalist: 0.35,
        Classic: 0.25
    },
    'Business Casual': {
        Classic: 0.3,
        Formal: 0.25,
        Casual: 0.2
    },
    'Streetwear Enthusiast': {
        Streetwear: 0.4,
        Casual: 0.25
    },
    'Luxury Executive': {
        Classic: 0.35,
        Formal: 0.3,
        Minimalist: 0.2
    },
    'Athletic Lifestyle': {
        Casual: 0.3,
        Streetwear: 0.35
    }
};
const PERSONALITY_DESCRIPTIONS = {
    Minimalist: 'Clean lines · Curated palette · Less-is-more dressing',
    Classic: 'Timeless silhouettes · Quality fabrics · Enduring style',
    'Smart Casual': 'Polished basics · Versatile layers · Effortless polish',
    'Business Casual': 'Office-ready · Structured layers · Professional ease',
    Streetwear: 'Bold silhouettes · Urban edge · Trend-forward energy',
    Luxury: 'Premium fabrics · Elevated tailoring · Statement elegance',
    Athleisure: 'Performance comfort · Active polish · Sport-luxe balance',
    Contemporary: 'Modern mix · Current silhouettes · Adaptive wardrobe',
    Creative: 'Expressive styling · Art-driven combinations · Visual impact',
    Formal: 'Tailored precision · Occasion-ready · Elevated presentation',
    Edgy: 'High contrast · Rule-breaking layers · Distinctive attitude',
    Urban: 'City-ready layers · Street influence · Functional style',
    'Developing Profile': 'Signals are building · Keep engaging to refine your DNA'
};
const BUDGET_RANGE_LABELS = {
    ECONOMY: {
        min: 20,
        max: 50,
        label: '$20 – $50'
    },
    MID_RANGE: {
        min: 50,
        max: 300,
        label: '$50 – $300'
    },
    PREMIUM: {
        min: 300,
        max: 800,
        label: '$300 – $800'
    },
    LUXURY: {
        min: 800,
        max: 2000,
        label: '$800+'
    }
};
const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];
function normalizeKey(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}
function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(value)));
}
function buildStyleScores(categoryAffinity, fashionPersonality) {
    const scores = Object.fromEntries(STYLE_AXES.map((axis)=>[
            axis,
            0
        ]));
    for (const [category, weight] of Object.entries(categoryAffinity || {})){
        const mapping = CATEGORY_STYLE_WEIGHTS[normalizeKey(category)];
        if (!mapping) {
            continue;
        }
        const categoryWeight = Number(weight) || 0;
        for (const [axis, axisWeight] of Object.entries(mapping)){
            scores[axis] += categoryWeight * axisWeight;
        }
    }
    const personalityWeights = PERSONALITY_STYLE_WEIGHTS[fashionPersonality] || {};
    for (const [axis, boost] of Object.entries(personalityWeights)){
        scores[axis] += boost;
    }
    const maxScore = Math.max(...Object.values(scores), 0.01);
    return Object.fromEntries(STYLE_AXES.map((axis)=>[
            axis,
            clamp(scores[axis] / maxScore * 100)
        ]));
}
function deriveStyleAttributes(categoryAffinity, fashionPersonality) {
    const scores = buildStyleScores(categoryAffinity, fashionPersonality);
    return Object.fromEntries(STYLE_ATTRIBUTE_KEYS.map((key)=>[
            key,
            scores[key] ?? 0
        ]));
}
function deriveStyleRadar(categoryAffinity, fashionPersonality) {
    return buildStyleScores(categoryAffinity, fashionPersonality);
}
function derivePersonalityDescription(fashionPersonality) {
    if (!fashionPersonality) {
        return 'Complete face, body, and shopping signals to unlock your fashion personality.';
    }
    if (fashionPersonality.includes('+')) {
        const [primary, secondary] = fashionPersonality.split('+').map((part)=>part.trim());
        const primaryDescription = PERSONALITY_DESCRIPTIONS[primary];
        const secondaryDescription = PERSONALITY_DESCRIPTIONS[secondary];
        if (primaryDescription && secondaryDescription) {
            return `${primaryDescription} blended with ${secondary.toLowerCase()} influences.`;
        }
    }
    return PERSONALITY_DESCRIPTIONS[fashionPersonality] || 'Personalized style signals · Derived from your real wardrobe activity';
}
function derivePercentileLabel(confidenceScore) {
    const score = Number(confidenceScore) || 0;
    if (score >= 92) {
        return 'Top 3% of users this week';
    }
    if (score >= 85) {
        return 'Top 8% of users this week';
    }
    if (score >= 75) {
        return 'Top 15% of users this week';
    }
    if (score >= 65) {
        return 'Top 30% of users this week';
    }
    return 'Growing your style profile';
}
function deriveBudgetDisplay(budgetRange, averageSpending) {
    const tier = String(budgetRange || 'MID_RANGE').toUpperCase();
    const range = BUDGET_RANGE_LABELS[tier] || BUDGET_RANGE_LABELS.MID_RANGE;
    const spend = Number(averageSpending);
    return {
        budgetRangeLabel: range.label,
        budgetMin: range.min,
        budgetMax: range.max,
        averageSpending: Number.isFinite(spend) && spend > 0 ? Math.round(spend) : null,
        spendProgress: Number.isFinite(spend) && spend > 0 ? clamp((spend - range.min) / (range.max - range.min) * 100) : 0
    };
}
function monthKey(date) {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) {
        return null;
    }
    return `${value.getFullYear()}-${value.getMonth()}`;
}
function formatMonthLabel(date) {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) {
        return null;
    }
    return MONTH_LABELS[value.getMonth()];
}
function deriveHistoryTimeline(historyItems, currentScore, currentUpdatedAt) {
    const now = new Date();
    const months = [];
    for(let index = 5; index >= 0; index -= 1){
        const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
        months.push({
            key: monthKey(date),
            label: MONTH_LABELS[date.getMonth()],
            date
        });
    }
    const scoreByMonth = new Map();
    for (const item of historyItems || []){
        const archivedAt = item.archivedAt || item.archived_at;
        const key = monthKey(archivedAt);
        if (!key) {
            continue;
        }
        const score = Number(item.fashionConfidenceScore ?? item.fashion_confidence_score ?? 0);
        if (!scoreByMonth.has(key)) {
            scoreByMonth.set(key, score);
        }
    }
    const currentKey = monthKey(currentUpdatedAt || now);
    const normalizedCurrent = clamp(Number(currentScore) || 0);
    if (currentKey) {
        scoreByMonth.set(currentKey, normalizedCurrent);
    }
    let lastKnownScore = normalizedCurrent;
    return months.map((month, index)=>{
        const storedScore = scoreByMonth.get(month.key);
        if (storedScore !== undefined) {
            lastKnownScore = clamp(storedScore);
        } else if (index === months.length - 1) {
            lastKnownScore = normalizedCurrent;
        }
        return {
            month: month.label,
            score: lastKnownScore
        };
    });
}
function deriveWeeklyGrowth(historyItems, currentScore) {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const normalizedCurrent = clamp(Number(currentScore) || 0);
    let baseline = null;
    for (const item of historyItems || []){
        const archivedAt = new Date(item.archivedAt || item.archived_at).getTime();
        if (Number.isNaN(archivedAt) || archivedAt > weekAgo) {
            continue;
        }
        const score = Number(item.fashionConfidenceScore ?? item.fashion_confidence_score ?? 0);
        if (baseline === null || archivedAt > baseline.archivedAt) {
            baseline = {
                archivedAt,
                score
            };
        }
    }
    if (!baseline) {
        const earliest = [
            ...historyItems || []
        ].map((item)=>({
                archivedAt: new Date(item.archivedAt || item.archived_at).getTime(),
                score: Number(item.fashionConfidenceScore ?? item.fashion_confidence_score ?? 0)
            })).filter((item)=>!Number.isNaN(item.archivedAt)).sort((left, right)=>left.archivedAt - right.archivedAt)[0];
        baseline = earliest || {
            archivedAt: weekAgo,
            score: normalizedCurrent
        };
    }
    return clamp(normalizedCurrent - clamp(baseline.score));
}
function formatBrandAffinityList(brandAffinity) {
    if (!brandAffinity || typeof brandAffinity !== 'object') {
        return [];
    }
    return Object.entries(brandAffinity).sort(([, left], [, right])=>right - left).slice(0, 6).map(([key, weight])=>{
        const normalized = String(key).replace(/^brand[-_]/i, '').replace(/[-_]/g, ' ').trim();
        const name = normalized.split(' ').filter(Boolean).map((part)=>part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        return {
            key,
            name: name || 'Brand',
            percentage: clamp(Number(weight) * 100)
        };
    });
}

//# sourceMappingURL=fashion-dna-analytics.util.js.map