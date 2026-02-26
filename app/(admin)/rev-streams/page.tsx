'use client';

import { useEffect, useMemo, useState } from 'react';

import { useApiData } from '../components/use-api-data';

const revenueStreams = [
  {
    id: 'harmony',
    emoji: '🤖',
    title: 'HARMONY - Teacher/Studio Intelligent Assistant',
    unlocksTitle: 'What It Unlocks for Simply Music',
    unlocks: [
      'Built-in AI support for teaching',
      'Faster teacher planning with less prep time',
      'A clear platform advantage with smarter lesson guidance',
      'A premium subscription option with added value',
    ],
    teachersTitle: 'What It Offers Teachers',
    teachers: [
      'Add notes after each lesson',
      'Prep lesson outlines in seconds',
      'Check schedule and modify schedule quickly',
      'Swap or adjust student schedules based on availability',
      'Mark students paid/unpaid and answer: who has paid',
      'See time until lessons start and what time your day ends',
      'Check a student timezone before lessons begin',
      'Read alerts and messages in one assistant flow',
      'Check whether a student logged practice for the week',
      'Get the next best lesson to prepare as a teacher',
      'Set in-lesson reminders for a specific student',
      'Get student-specific progression ideas and reinforcement options',
      'Discover repertoire expansion and alternate key suggestions',
    ],
    studentsTitle: 'What It Offers Parents/Students',
    students: [
      'More personalized lessons that feel tailored to the student, not generic',
      'More consistent progression with fewer stalls, clearer milestones, and better continuity week to week',
    ],
    revenue: { simplyMusic: 40, platform: 60 },
    bundleTitle: 'Studio Bundle Pricing Available',
    bundleNote:
      'Studios can bundle HARMONY seats for reduced per-teacher pricing.',
    supportNote:
      'Clean Commit LLC carries AI compute cost, orchestration, scaling, and optimization.',
  },
  {
    id: 'lessonRooms',
    emoji: '🎥',
    title: 'Lesson Rooms (powered with HARMONY)',
    subtitle: 'Live Teaching Infrastructure + Intelligent Prep',
    unlocksTitle: 'What It Unlocks for Simply Music',
    unlocks: [
      'Fully branded teaching environment',
      'Global online expansion',
      'Scalable remote teaching model',
      'Stronger teacher retention',
      'Deep curriculum integration during live sessions',
      'Automatic lesson-day preparation integrated directly into the room',
      'This becomes a teaching control center',
    ],
    teachersTitle: 'What It Offers Teachers',
    teachers: [
      'Professional live lesson space',
      'Integrated with billing and licensing',
      'Ideal for makeup lessons, out-of-town lessons, lessons during illness, and hybrid teaching models',
      'Quick-send curriculum content directly into the lesson',
      'Autoplay curriculum videos during sessions',
      'Automatic lesson prep for that specific student on that specific day',
      "Harmony prepares each lesson with suggested curriculum, review items, progress-based reinforcement, and an AI-supported day outline before the room opens",
      'No external Zoom juggling',
      'Stable hosting and bandwidth',
    ],
    studentsTitle: 'What It Offers Parents/Students',
    students: [
      'Consistent branded learning experience',
      'Seamless curriculum access during lessons',
      'Structured, guided sessions',
      'Continuity during travel or illness',
    ],
    revenue: { simplyMusic: 40, platform: 60 },
    bundleTitle: 'Studio Bundle Pricing Available',
    bundleNote:
      'Studios can bundle Online Lesson Rooms with Harmony AI for discounted per-teacher pricing.',
    dayPassNote:
      'Flexible day-pass access for makeup lessons and temporary coverage during illness, travel, or scheduling changes.',
    supportNote:
      'Clean Commit LLC carries live infrastructure, scaling, curriculum streaming, prep integration, and support.',
  },
  {
    id: 'marketplace',
    emoji: '📦',
    title: 'Content Marketplace (Digital Growth Engine)',
    unlocksTitle: 'What It Unlocks for Simply Music',
    unlocks: [
      'Simply Music Approved Teacher Content Marketplace',
      'Continuous curriculum expansion',
      'Monetized specialization tracks',
      'Recurring digital product revenue',
      'Global reach without physical overhead',
    ],
    advancedTitle: 'Advanced Capabilities Included',
    advanced: [
      'Content AI idea suggestions based on teaching tracks, progression gaps, and expansion opportunities',
      'Curriculum prerequisite checks ensure members own required titles before purchasing related content, and intelligently suggest adding missing prerequisites during checkout',
      'Smart bundle logic with ownership detection and intelligent discounts at checkout',
      'Increased average order value with reduced purchase friction',
      'Intelligent commerce tailored to music education',
    ],
    creatorsTitle: 'What It Offers to Simply Music Assigned Creators',
    creators: [
      'Sell their own content',
      'Earn additional income',
      'Build authority within the network',
      'Expand beyond weekly lesson income',
      'Create scalable digital assets instead of trading time for time',
    ],
    teachersTitle: 'What It Offers to Simply Music Teachers',
    teachers: [
      'Access to expanding, high-quality lesson content',
      'Fresh material without reinventing curriculum',
      'Specialized packs for specific student needs',
      'Skill-targeted reinforcement tracks',
      'New keys, variations, and extensions of existing curriculum',
      'Smart bundles that automatically discount content they already own',
      'More variety, depth, and efficiency without added prep burden',
    ],
    studentsTitle: 'What It Offers Parents/Students',
    students: [
      'Learn songs in new keys with clear, guided progression',
      'Progress into more complex arrangements with confidence',
      'Explore fresh musical ideas, including new chord voicings and textures',
      'Build skills with auxiliary patterns, piano riffs, and creative extensions',
      'Get targeted content that matches current lesson goals and musical interests',
      'Stay motivated with more variety, momentum, and visible growth milestones',
    ],
    revenue: { simplyMusic: 50, packCreators: 25, platform: 25 },
    supportNote:
      'Clean Commit LLC carries marketplace infrastructure, hosting, AI suggestion tools, smart bundling logic, payment handling, and ongoing support.',
  },
  {
    id: 'stripe',
    emoji: '💳',
    title: 'Stripe Facilitation (Teacher Billing Layer)',
    unlocksTitle: 'What It Unlocks for Simply Music',
    unlocks: [
      'Teachers bill students directly inside the ecosystem',
      'Centralized visibility into teaching activity',
      'Recurring billing automation',
      'Clean reporting across the network',
      'Data insights on lesson volume and pricing patterns',
      'Structured subscription and lesson billing logic',
      'Professional-grade billing flexibility with built-in adjustment and refund tools',
    ],
    teachersTitle: 'What It Offers Teachers',
    teachers: [
      'Easy recurring billing',
      'Automated invoices and payment tracking',
      'Auto-proration for missed or adjusted lessons',
      'Create one-off charges anytime for extras, events, or special adjustments',
      'Issue full or partial refunds instantly when needed',
      'Clean correction tools for billing adjustments',
      'No more manually marking who paid and who has not',
      'Handles students paying different fee structures without manual tracking',
      'Less admin, more teaching',
      'Option to pass Stripe & processing fees to parents',
      'No more remembering who pays what',
      'No more spreadsheet juggling',
    ],
    studentsTitle: 'What It Offers Parents/Students',
    students: [
      'Seamless payment experience',
      'Secure billing',
      'Clear subscription visibility',
      'Automatic adjustments when needed',
      'Transparent correction process for billing updates',
      'Confidence that payments are handled professionally and fairly',
    ],
    revenue: { simplyMusic: 1, platform: 1 },
    supportNote:
      'Clean Commit LLC carries billing infrastructure, automation, and support. A 2% processing fee is added to each teacher-processed transaction. You gain structured financial intelligence across the network.',
  },
  {
    id: 'practiceApp',
    emoji: '📱',
    title: 'Practice App (Student Practice Companion)',
    unlocksTitle: 'What It Unlocks for Simply Music',
    unlocks: [
      'A recurring student-focused subscription layer beyond lessons',
      'Higher retention through weekly guided practice support',
      'A direct way to increase value between lessons',
      'Practice completion data that can inform coaching and curriculum decisions',
      'A scalable digital product for every active student',
    ],
    teachersTitle: 'What It Offers Teachers',
    teachers: [
      'Visibility into student practice activity between lessons',
      'Less time chasing accountability manually',
      'Suggested focus areas before each lesson based on app usage',
      'A consistent reinforcement system for assignments and review',
    ],
    studentsTitle: 'What It Offers Parents/Students',
    students: [
      'Clear daily and weekly practice guidance',
      'Progress tracking with visible milestones',
      'Motivation tools that keep momentum between lessons',
      'A simple routine that improves lesson readiness and confidence',
    ],
    revenue: { simplyMusic: 40, platform: 60 },
    supportNote:
      'Clean Commit LLC carries app infrastructure, updates, hosting, analytics instrumentation, and ongoing support.',
  },
  {
    id: 'selfLearner',
    emoji: '🎹',
    title: 'pianoonline.com - Self-Learner Lessons',
    subtitle: 'Self-Learner Channel (Level 1-3 Core + Expansion Engine)',
    unlocksTitle: 'What It Unlocks for Simply Music',
    unlocks: [
      'Structured, guided, AI-assisted self-learner path',
      'Progressive experience that remains teacher-safe',
      'Milestone-based progression with completion gates',
      'No skipping ahead and no unrestricted full library browsing',
      'Licensing protection while growing a direct-to-student channel',
      'Ongoing subscription value after Level 3 completion',
      'Recurring expansion via monthly content and AI-curated tracks',
    ],
    studentsTitle: 'What It Offers Learners',
    students: [
      'Skill mastery tracks',
      'Improvisation tracks',
      'Alternate key expansion',
      'Technique boosters',
      'Genre exploration packs',
      'Composition basics',
      'Seasonal repertoire',
    ],
    revenue: { simplyMusic: 60, platform: 30 },
    supportNote:
      'Monthly self-learner subscription channel with guided progression, expansion content, and ongoing platform support.',
  },
];

const scenarioTemplates = [
  { scenario: 'Current', teacherOffset: 0 },
  { scenario: 'Slow Growth', teacherOffset: 150 },
  { scenario: 'Future / Rapid', teacherOffset: 400 },
] as const;

const DEFAULT_SCENARIO_SETTINGS = {
  teacherCount: 588,
  studentsPerTeacher: 15,
  marketplacePurchaseRate: 10,
  stripePercent: 50,
  packsPerMonth: 2,
  lessonRoomPercent: 10,
  dayPassPercent: 10,
  harmonyPercent: 30,
  practiceAppAdoptionRate: 30,
  practiceAppPrice: 5,
  selfLearnerStudents: 500,
  selfLearnerPrice: 25,
};

const SCENARIO_SETTINGS_KEY = 'sm_rev_streams_scenario_settings';
const REVENUE_SPLITS_KEY = 'sm_rev_streams_revenue_splits';
const PRESETS_KEY = 'sm_rev_streams_presets';
const PRACTICE_APP_INCLUDED_KEY = 'sm_rev_streams_practice_app_included';
const ROYALTIES_ASSUMPTIONS_KEY = 'sm_assumptions';

type RoyaltiesTeacherRow = {
  id: string;
  name: string;
  region: string;
  lastStudents: number;
  currentStudents: number;
};

type RoyaltyTier = {
  min: number;
  max: number | null;
  rate: number;
};

type RoyaltiesAssumptions = {
  teacherCount: number;
  avgStudentsPerTeacher: number;
  lessonsPerStudent: number;
  teacherFee: number;
  studentFee: number;
};

const DEFAULT_ROYALTY_TIERS: RoyaltyTier[] = [
  { min: 1, max: 15, rate: 3.0 },
  { min: 16, max: 25, rate: 2.75 },
  { min: 26, max: 35, rate: 2.5 },
  { min: 36, max: null, rate: 2.25 },
];

const BASE_RATE_CATEGORIES = [
  {
    title: 'Partnership & Delivery',
    items: [
      'Dedicated Developement Team',
      'Team Level Responsiveness',
      'Rapid Developement & Updates',
      'No nickel-and-diming for software updates/feature requests',
      'Ongoing partnership strategy support & growth advisory',
    ],
  },
  {
    title: 'Infrastructure & Reliability',
    items: [
      'Core platform hosting & infrastructure management',
      'Server monitoring, uptime oversight, and performance tuning',
      'Security management (SSL, firewall, protection layers)',
      'Ongoing system maintenance and stability updates',
      'Platform bug fixes and issue resolution',
    ],
  },
  {
    title: 'Platform Core',
    items: [
      'Fully Responsive Admin System',
      'Core dashboard functionality (teacher + admin)',
      'Student management system',
      'Integrated Scheduling For Admin/Teachers',
      'Lesson scheduling tools',
      'Attendance tracking',
      'Lesson notes storage system',
      'Basic reporting & activity tracking',
    ],
  },
  {
    title: 'Web & Mobile Experiences',
    items: [
      'Fully Responsive Corporate Site',
      'Teacher Replicated Personal Sites (option)',
      'iOS & Andriod Mobile Companion App',
      'QR Code Teacher Linkage',
    ],
  },
  {
    title: 'Billing & Payments',
    items: [
      'Integration of Stipe Payment Processing',
      'Stripe connection framework (billing infrastructure only)',
      'Recurring billing system setup & maintenance',
      'Parent/student billing visibility portal',
      'Integration of PayPal and BNPL payment options',
    ],
  },
  {
    title: 'Lesson Delivery & Curriculum',
    items: [
      'Screen share & curriculum display capability',
      'Lesson recording storage & archive access',
      'MIDI connection framework (basic connection support)',
      'Curriculum assignment tools',
    ],
  },
  {
    title: 'Commitment',
    items: [
      'The system is maintained and continuously improved',
      'We actively support your operational success',
      'We advocate for growth, scalability, and long-term strength',
    ],
  },
] as const;

const SHARED_INITIATIVE_CATEGORIES = [
  ...revenueStreams.map(stream => ({
    title: stream.title,
    items: stream.unlocks,
  })),
  {
    title: 'Monetization Foundations',
    items: [
      'Teacher marketplace or lesson pack sales',
      'Curriculum monetization architecture',
      'Monetized on-demand lesson libraries',
      'Premium student practice subscriptions',
      'Subscription bundle creation and packaging strategy',
      'Membership tier structuring & pricing model development',
      'Automated upsell funnel systems',
      'Affiliate or referral revenue integrations',
    ],
  },
  {
    title: 'Product & Feature Expansion',
    items: [
      'Paid add-on feature modules',
      'Custom integrations that unlock paid features',
      'AI-assisted lesson planning tools for subscription tiers',
      'Practice tracking gamification systems',
      'Student progress analytics tied to retention revenue',
      'Performance exam and certification modules',
      'Advanced MIDI scoring engine development',
      'Integrated Lesson Room (live video engine)',
      'Advanced branded mobile app versions',
      'White-label licensing options',
      'Revenue-based reporting dashboards',
    ],
  },
  {
    title: 'Go-to-Market & Growth',
    items: [
      'Rapid development tied to monetized launches',
      'Launch strategy & monetization architecture consulting',
      'Expansion into new paid digital product lines',
    ],
  },
];

type StreamId = (typeof revenueStreams)[number]['id'];
type RevenueSplitSettings = Record<
  StreamId,
  {
    simplyMusic: number;
    packCreators?: number;
    platform: number;
  }
>;

type RevStreamsPreset = {
  name: string;
  scenarioSettings: typeof DEFAULT_SCENARIO_SETTINGS;
  revenueSplits: RevenueSplitSettings;
};

const DEFAULT_REVENUE_SPLITS: RevenueSplitSettings = {
  harmony: { simplyMusic: 40, platform: 60 },
  lessonRooms: { simplyMusic: 40, platform: 60 },
  marketplace: { simplyMusic: 50, packCreators: 25, platform: 25 },
  stripe: { simplyMusic: 1, platform: 1 },
  practiceApp: { simplyMusic: 40, platform: 60 },
  selfLearner: { simplyMusic: 60, platform: 30 },
};

function normalizeRevenueSplits(
  splits?: Partial<RevenueSplitSettings>
): RevenueSplitSettings {
  return {
    ...DEFAULT_REVENUE_SPLITS,
    ...(splits ?? {}),
    harmony: {
      ...DEFAULT_REVENUE_SPLITS.harmony,
      ...(splits?.harmony ?? {}),
    },
    lessonRooms: {
      ...DEFAULT_REVENUE_SPLITS.lessonRooms,
      ...(splits?.lessonRooms ?? {}),
    },
    marketplace: {
      ...DEFAULT_REVENUE_SPLITS.marketplace,
      ...(splits?.marketplace ?? {}),
    },
    stripe: {
      ...DEFAULT_REVENUE_SPLITS.stripe,
      ...(splits?.stripe ?? {}),
    },
    practiceApp: {
      ...DEFAULT_REVENUE_SPLITS.practiceApp,
      ...(splits?.practiceApp ?? {}),
    },
    selfLearner: {
      ...DEFAULT_REVENUE_SPLITS.selfLearner,
      ...(splits?.selfLearner ?? {}),
    },
  };
}

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function getAlignmentPercentForBaseRate(baseRate: number) {
  if (baseRate === 6000) return 100;
  if (baseRate === 8000) return 100;
  if (baseRate === 10000) return 85;
  if (baseRate === 12000) return 65;
  if (baseRate === 15000) return 45;
  if (baseRate === 18000) return 25;
  return 40;
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function formatCount(value: number | null | undefined) {
  const safeValue = Number(value);
  if (!Number.isFinite(safeValue)) {
    return '0';
  }
  if (Number.isInteger(safeValue)) {
    return safeValue.toLocaleString();
  }
  return safeValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function buildScenarioData(
  settings: typeof DEFAULT_SCENARIO_SETTINGS,
  revenueSplits: RevenueSplitSettings
) {
  const safeSplits = normalizeRevenueSplits(revenueSplits);
  const baseTeachers = Math.max(0, settings.teacherCount);
  const teacherAnnualBilling = 1200;
  const ph3AnnualCost = 264000;

  const marketplaceTeacherBuyerPercent = settings.marketplacePurchaseRate;
  const marketplaceStudentBuyerPercent = settings.marketplacePurchaseRate;
  const marketplacePricePerPack = 19;
  const marketplaceSmShare = safeSplits.marketplace.simplyMusic / 100;
  const marketplaceCreatorShare =
    (safeSplits.marketplace.packCreators ?? 0) / 100;
  const marketplacePlatformShare = safeSplits.marketplace.platform / 100;

  const stripeSmShare = safeSplits.stripe.simplyMusic / 100;
  const stripePlatformShare = safeSplits.stripe.platform / 100;

  const lessonRoomPrice = 39;
  const lessonRoomSmShare = safeSplits.lessonRooms.simplyMusic / 100;
  const lessonRoomPlatformShare = safeSplits.lessonRooms.platform / 100;

  const dayPassPrice = 9;
  const dayPassesPerTeacherPerMonth = 2;
  const dayPassSmShare = safeSplits.lessonRooms.simplyMusic / 100;
  const dayPassPlatformShare = safeSplits.lessonRooms.platform / 100;

  const harmonyPrice = 19;
  const harmonySmShare = safeSplits.harmony.simplyMusic / 100;
  const harmonyPlatformShare = safeSplits.harmony.platform / 100;

  const practiceAppSmShare = safeSplits.practiceApp.simplyMusic / 100;
  const practiceAppPlatformShare = safeSplits.practiceApp.platform / 100;
  const selfLearnerSmShare = safeSplits.selfLearner.simplyMusic / 100;
  const selfLearnerPlatformShare = safeSplits.selfLearner.platform / 100;

  const netSurplusRows = scenarioTemplates.map(template => {
    const teachers = Math.max(0, baseTeachers + template.teacherOffset);
    const students = teachers * settings.studentsPerTeacher;
    const teacherBuyers = teachers * (marketplaceTeacherBuyerPercent / 100);
    const studentBuyers = students * (marketplaceStudentBuyerPercent / 100);
    const totalBuyers = teacherBuyers + studentBuyers;
    const revenuePerPack = totalBuyers * marketplacePricePerPack;
    const marketplaceGrossMonthly = revenuePerPack * settings.packsPerMonth;
    const marketplaceSmMonthly = marketplaceGrossMonthly * marketplaceSmShare;
    const marketplacePlatformMonthly =
      marketplaceGrossMonthly * marketplacePlatformShare;

    const stripeBilledMonthly =
      teachers * teacherAnnualBilling * (settings.stripePercent / 100);
    const stripeSmMonthly = stripeBilledMonthly * stripeSmShare;
    const stripePlatformMonthly = stripeBilledMonthly * stripePlatformShare;

    const lessonTeachers = teachers * (settings.lessonRoomPercent / 100);
    const lessonGrossMonthly = lessonTeachers * lessonRoomPrice;
    const lessonSmMonthly = lessonGrossMonthly * lessonRoomSmShare;
    const lessonPlatformMonthly = lessonGrossMonthly * lessonRoomPlatformShare;

    const dayPassTeachers = teachers * (settings.dayPassPercent / 100);
    const dayPassesMonthly = dayPassTeachers * dayPassesPerTeacherPerMonth;
    const dayPassGrossMonthly = dayPassesMonthly * dayPassPrice;
    const dayPassSmMonthly = dayPassGrossMonthly * dayPassSmShare;
    const dayPassPlatformMonthly = dayPassGrossMonthly * dayPassPlatformShare;

    const harmonyTeachers = teachers * (settings.harmonyPercent / 100);
    const harmonyGrossMonthly = harmonyTeachers * harmonyPrice;
    const harmonySmMonthly = harmonyGrossMonthly * harmonySmShare;
    const harmonyPlatformMonthly = harmonyGrossMonthly * harmonyPlatformShare;

    const practiceAppStudents =
      students * (settings.practiceAppAdoptionRate / 100);
    const practiceAppGrossMonthly = practiceAppStudents * settings.practiceAppPrice;
    const practiceAppSmMonthly = practiceAppGrossMonthly * practiceAppSmShare;
    const practiceAppPlatformMonthly =
      practiceAppGrossMonthly * practiceAppPlatformShare;

    const selfLearnerGrossMonthly =
      settings.selfLearnerStudents * settings.selfLearnerPrice;
    const selfLearnerSmMonthly = selfLearnerGrossMonthly * selfLearnerSmShare;
    const selfLearnerPlatformMonthly =
      selfLearnerGrossMonthly * selfLearnerPlatformShare;

    const monthlyToSm =
      marketplaceSmMonthly +
      stripeSmMonthly +
      lessonSmMonthly +
      dayPassSmMonthly +
      harmonySmMonthly +
      practiceAppSmMonthly +
      selfLearnerSmMonthly;
    const annualToSm = monthlyToSm * 12;
    const netAnnualSurplus = annualToSm - ph3AnnualCost;
    const netMonthlySurplus = netAnnualSurplus / 12;

    const monthlyToPlatform =
      marketplacePlatformMonthly +
      stripePlatformMonthly +
      lessonPlatformMonthly +
      dayPassPlatformMonthly +
      harmonyPlatformMonthly +
      practiceAppPlatformMonthly +
      selfLearnerPlatformMonthly;
    const annualToPlatform = monthlyToPlatform * 12;

    return {
      ...template,
      teachers,
      students,
      teacherBuyers,
      studentBuyers,
      totalBuyers,
      revenuePerPack,
      marketplaceGrossMonthly,
      marketplaceSmMonthly,
      marketplacePlatformMonthly,
      stripeBilledMonthly,
      stripeSmMonthly,
      stripePlatformMonthly,
      lessonTeachers,
      lessonGrossMonthly,
      lessonSmMonthly,
      lessonPlatformMonthly,
      dayPassTeachers,
      dayPassesMonthly,
      dayPassGrossMonthly,
      dayPassSmMonthly,
      dayPassPlatformMonthly,
      harmonyTeachers,
      harmonyGrossMonthly,
      harmonySmMonthly,
      harmonyPlatformMonthly,
      practiceAppStudents,
      practiceAppGrossMonthly,
      practiceAppSmMonthly,
      practiceAppPlatformMonthly,
      selfLearnerGrossMonthly,
      selfLearnerSmMonthly,
      selfLearnerPlatformMonthly,
      monthlyToSm,
      annualToSm,
      netAnnualSurplus,
      netMonthlySurplus,
      monthlyToPlatform,
      annualToPlatform,
    };
  });

  return {
    netSurplusRows: netSurplusRows.map(row => ({
      scenario: row.scenario,
      teachers: formatCount(row.teachers),
      monthlyToSm: formatMoney(row.monthlyToSm),
      annualToSm: formatMoney(row.annualToSm),
      ph3AnnualCost: formatMoney(ph3AnnualCost),
      netAnnualSurplus: formatMoney(row.netAnnualSurplus),
      netMonthlySurplus: formatMoney(row.netMonthlySurplus),
    })),
    platformIncomeRows: netSurplusRows.map(row => ({
      scenario: row.scenario,
      teachers: formatCount(row.teachers),
      monthlyToPlatform: formatMoney(row.monthlyToPlatform),
      annualToPlatform: formatMoney(row.annualToPlatform),
    })),
    smBreakdownRows: netSurplusRows.map(row => ({
      scenario: row.scenario,
      marketplace: formatMoney(row.marketplaceSmMonthly),
      stripe: formatMoney(row.stripeSmMonthly),
      lessonRooms: formatMoney(row.lessonSmMonthly),
      dayPasses: formatMoney(row.dayPassSmMonthly),
      harmony: formatMoney(row.harmonySmMonthly),
      practiceApp: formatMoney(row.practiceAppSmMonthly),
      selfLearner: formatMoney(row.selfLearnerSmMonthly),
      totalMonthly: formatMoney(row.monthlyToSm),
    })),
    platformBreakdownRows: netSurplusRows.map(row => ({
      scenario: row.scenario,
      marketplace: formatMoney(row.marketplacePlatformMonthly),
      stripe: formatMoney(row.stripePlatformMonthly),
      lessonRooms: formatMoney(row.lessonPlatformMonthly),
      dayPasses: formatMoney(row.dayPassPlatformMonthly),
      harmony: formatMoney(row.harmonyPlatformMonthly),
      practiceApp: formatMoney(row.practiceAppPlatformMonthly),
      selfLearner: formatMoney(row.selfLearnerPlatformMonthly),
      totalMonthly: formatMoney(row.monthlyToPlatform),
    })),
    creatorPayoutRows: netSurplusRows.map(row => ({
      scenario: row.scenario,
      marketplaceGrossMonthly: row.marketplaceGrossMonthly,
      totalCreatorPayoutMonthly: row.marketplaceGrossMonthly * marketplaceCreatorShare,
    })),
    scenarioDetails: netSurplusRows.map(row => ({
      heading: `Scenario - ${row.scenario} - ${formatCount(row.teachers)} Teachers`,
      students: `${formatCount(row.teachers)} x ${formatCount(settings.studentsPerTeacher)} = ${formatCount(row.students)}`,
      items: [
        {
          title: 'Marketplace Content',
          points: [
            `Buyers per pack: ${formatCount(settings.marketplacePurchaseRate)}% teachers = ${formatCount(row.teacherBuyers)}, ${formatCount(settings.marketplacePurchaseRate)}% students = ${formatCount(row.studentBuyers)}, total buyers = ${formatCount(row.totalBuyers)}`,
            `Revenue per pack: ${formatCount(row.totalBuyers)} x $19 = ${formatMoney(row.revenuePerPack)}`,
            `Creator Share Per Pack: ${formatMoney(row.revenuePerPack * marketplaceCreatorShare)}`,
            `${formatCount(settings.packsPerMonth)} packs per month: ${formatMoney(row.marketplaceGrossMonthly)} gross`,
            `SM Revenue Share (${formatCount(safeSplits.marketplace.simplyMusic)}%): ${formatMoney(row.marketplaceSmMonthly)}/month`,
            `Pack Creator Share (${formatCount(safeSplits.marketplace.packCreators ?? 0)}%): ${formatMoney(row.marketplaceGrossMonthly * marketplaceCreatorShare)}/month`,
          ],
        },
        {
          title: 'Stripe Facilitation',
          points: [
            `${formatCount(row.teachers)} x $1,200 x ${formatCount(settings.stripePercent)}% = ${formatMoney(row.stripeBilledMonthly)} billed`,
            `${formatCount(safeSplits.stripe.simplyMusic)}% to SM: ${formatMoney(row.stripeSmMonthly)}/month`,
          ],
        },
        {
          title: 'Lesson Rooms',
          points: [
            `${formatCount(settings.lessonRoomPercent)}% adoption: ${formatCount(row.lessonTeachers)} teachers`,
            `${formatCount(row.lessonTeachers)} x $39 = ${formatMoney(row.lessonGrossMonthly)} gross`,
            `SM Revenue Share (${formatCount(safeSplits.lessonRooms.simplyMusic)}%): ${formatMoney(row.lessonSmMonthly)}/month`,
          ],
        },
        {
          title: 'Day Passes',
          points: [
            `${formatCount(settings.dayPassPercent)}% of teachers use 2 passes/month: ${formatCount(row.dayPassTeachers)} teachers x 2 = ${formatCount(row.dayPassesMonthly)} passes`,
            `${formatCount(row.dayPassesMonthly)} x $9 = ${formatMoney(row.dayPassGrossMonthly)} gross`,
            `SM Revenue Share (${formatCount(safeSplits.lessonRooms.simplyMusic)}%): ${formatMoney(row.dayPassSmMonthly)}/month`,
          ],
        },
        {
          title: 'Harmony AI',
          points: [
            `${formatCount(settings.harmonyPercent)}% adoption: ${formatCount(row.harmonyTeachers)} teachers`,
            `${formatCount(row.harmonyTeachers)} x $19 = ${formatMoney(row.harmonyGrossMonthly)} gross`,
            `SM Revenue Share (${formatCount(safeSplits.harmony.simplyMusic)}%): ${formatMoney(row.harmonySmMonthly)}/month`,
          ],
        },
        {
          title: 'Practice App',
          points: [
            `${formatCount(row.students)} students x ${formatCount(settings.practiceAppAdoptionRate)}% adoption = ${formatCount(row.practiceAppStudents)} active users`,
            `${formatCount(row.practiceAppStudents)} x $${formatCount(settings.practiceAppPrice)} = ${formatMoney(row.practiceAppGrossMonthly)} gross`,
            `SM Revenue Share (${formatCount(safeSplits.practiceApp.simplyMusic)}%): ${formatMoney(row.practiceAppSmMonthly)}/month`,
          ],
        },
        {
          title: 'Self-Learner Channel',
          points: [
            `${formatCount(settings.selfLearnerStudents)} learners x $${formatCount(settings.selfLearnerPrice)} = ${formatMoney(row.selfLearnerGrossMonthly)} gross`,
            `SM Revenue Share (${formatCount(safeSplits.selfLearner.simplyMusic)}%): ${formatMoney(row.selfLearnerSmMonthly)}/month`,
            `Platform Share (${formatCount(safeSplits.selfLearner.platform)}%): ${formatMoney(row.selfLearnerPlatformMonthly)}/month`,
          ],
        },
      ],
      totals: [
        `Total monthly to Simply Music: ${formatMoney(row.monthlyToSm)}`,
        `Annual surplus: ${formatMoney(row.netAnnualSurplus)}`,
      ],
    })),
  };
}

function RevenueSplit({
  simplyMusic,
  packCreators,
  platform,
  isVisible,
}: {
  simplyMusic: number;
  packCreators?: number;
  platform: number;
  isVisible: boolean;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--c-9a9892)]">
        Revenue Participation
      </p>
      <div className={`mt-3 grid gap-3 ${packCreators != null ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div className="rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            Simply Music
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--c-1f1f1d)]">
            {simplyMusic}%
          </p>
        </div>
        {packCreators != null ? (
          <div className="rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Creators
            </p>
            <p className="mt-1 text-xl font-semibold text-[var(--c-1f1f1d)]">
              {packCreators}%
            </p>
          </div>
        ) : null}
        <div className="rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            Platform
          </p>
          <p className="mt-1 text-xl font-semibold text-[var(--c-1f1f1d)]">
            {platform}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RevStreamsPage() {
  const [activeStreamIndex, setActiveStreamIndex] = useState<number | null>(null);
  const [showRevenueSplit, setShowRevenueSplit] = useState(true);
  const [showAllCards, setShowAllCards] = useState(true);
  const [showScenarioInputs, setShowScenarioInputs] = useState(true);
  const [selectedBreakdownScenario, setSelectedBreakdownScenario] =
    useState('Current');
  const [scenarioSettings, setScenarioSettings] = useState(
    DEFAULT_SCENARIO_SETTINGS
  );
  const [revenueSplits, setRevenueSplits] = useState<RevenueSplitSettings>(
    DEFAULT_REVENUE_SPLITS
  );
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<RevStreamsPreset[]>([]);
  const [presetMessage, setPresetMessage] = useState('');
  const [lastLoadedPresetName, setLastLoadedPresetName] = useState<string | null>(null);
  const [draggedPresetIndex, setDraggedPresetIndex] = useState<number | null>(null);
  const [practiceAppIncludedInBaseFee, setPracticeAppIncludedInBaseFee] =
    useState(false);
  const [showRoyaltiesModal, setShowRoyaltiesModal] = useState(false);
  const [showBaseRateModal, setShowBaseRateModal] = useState(false);
  const [showBaseRateFlexOptions, setShowBaseRateFlexOptions] = useState(false);
  const [showExtendedBaseRateOptions, setShowExtendedBaseRateOptions] =
    useState(false);
  const [flexReducedBaseRate, setFlexReducedBaseRate] = useState(12000);
  const [flexReducedMonths, setFlexReducedMonths] = useState(3);
  const [flexRevStreamMonthly, setFlexRevStreamMonthly] = useState(12000);
  const [flexAlignmentPercent, setFlexAlignmentPercent] = useState(
    getAlignmentPercentForBaseRate(12000)
  );
  const [royaltiesAssumptions, setRoyaltiesAssumptions] =
    useState<RoyaltiesAssumptions>({
      teacherCount: 588,
      avgStudentsPerTeacher: 7.8,
      lessonsPerStudent: 2.3,
      teacherFee: 9,
      studentFee: 4,
    });
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  const { data: royaltiesData } = useApiData<{ subscriptions: RoyaltiesTeacherRow[] }>(
    '/api/teachers-subscriptions',
    { subscriptions: [] },
  );
  const royaltiesRows = royaltiesData.subscriptions;
  const royaltiesBaseAvgStudents = useMemo(() => {
    if (royaltiesRows.length === 0) {
      return 0;
    }
    const total = royaltiesRows.reduce((sum, row) => sum + row.currentStudents, 0);
    return total / royaltiesRows.length;
  }, [royaltiesRows]);
  const royaltiesCombinedScale =
    royaltiesBaseAvgStudents > 0 && royaltiesRows.length > 0
      ? (royaltiesAssumptions.avgStudentsPerTeacher / royaltiesBaseAvgStudents) *
        (royaltiesAssumptions.teacherCount / royaltiesRows.length)
      : 1;
  const royaltiesScaledRows = useMemo(
    () =>
      royaltiesRows.map(row => ({
        ...row,
        currentStudents: Math.max(
          0,
          Number((row.currentStudents * royaltiesCombinedScale).toFixed(2)),
        ),
      })),
    [royaltiesRows, royaltiesCombinedScale],
  );
  const royaltyRateForStudents = (students: number) =>
    DEFAULT_ROYALTY_TIERS.find(
      tier => students >= tier.min && (tier.max === null || students <= tier.max),
    )?.rate ?? 3;
  const royaltiesTotals = useMemo(
    () =>
      royaltiesScaledRows.reduce(
        (acc, row) => {
          const tierRate = royaltyRateForStudents(row.currentStudents);
          const oldTotal =
            row.currentStudents * royaltiesAssumptions.lessonsPerStudent * tierRate;
          const newTotal = row.currentStudents * royaltiesAssumptions.teacherFee;
          const studentAccessTotal =
            row.currentStudents * royaltiesAssumptions.studentFee;
          acc.oldTotal += oldTotal;
          acc.newTotal += newTotal;
          acc.studentAccessTotal += studentAccessTotal;
          acc.students += row.currentStudents;
          return acc;
        },
        { oldTotal: 0, newTotal: 0, studentAccessTotal: 0, students: 0 },
      ),
    [royaltiesScaledRows, royaltiesAssumptions],
  );
  const royaltiesCombinedTotal =
    royaltiesTotals.newTotal + royaltiesTotals.studentAccessTotal;
  const royaltiesDelta = royaltiesCombinedTotal - royaltiesTotals.oldTotal;
  const flexStandardBaseRate = 22000;
  const flexStandardTotal = flexStandardBaseRate * Math.max(0, flexReducedMonths);
  const flexReducedTotal = flexReducedBaseRate * Math.max(0, flexReducedMonths);
  const flexDeferredBalance = Math.max(0, flexStandardTotal - flexReducedTotal);
  const flexMonthlyAlignment = Math.max(
    0,
    flexRevStreamMonthly * (flexAlignmentPercent / 100),
  );
  const flexEstimatedMonths =
    flexDeferredBalance > 0 && flexMonthlyAlignment > 0
      ? flexDeferredBalance / flexMonthlyAlignment
      : null;
  const flexOneMonthProgressPercent =
    flexDeferredBalance > 0
      ? Math.min(100, (flexMonthlyAlignment / flexDeferredBalance) * 100)
      : 100;

  useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem(SCENARIO_SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(
          storedSettings
        ) as Partial<typeof DEFAULT_SCENARIO_SETTINGS>;
        setScenarioSettings(current => ({
          ...current,
          ...parsed,
        }));
      }
    } catch {
      // ignore
    }

    try {
      const storedSplits = window.localStorage.getItem(REVENUE_SPLITS_KEY);
      if (storedSplits) {
        const parsed = JSON.parse(storedSplits) as Partial<RevenueSplitSettings>;
        setRevenueSplits(normalizeRevenueSplits(parsed));
      }
    } catch {
      // ignore
    }
    try {
      const storedPresets = window.localStorage.getItem(PRESETS_KEY);
      if (storedPresets) {
        const parsed = JSON.parse(storedPresets) as RevStreamsPreset[];
        setPresets(
          parsed.slice(0, 5).map(preset => ({
            ...preset,
            scenarioSettings: {
              ...DEFAULT_SCENARIO_SETTINGS,
              ...(preset.scenarioSettings ?? {}),
            },
            revenueSplits: normalizeRevenueSplits(preset.revenueSplits),
          }))
        );
      }
    } catch {
      // ignore
    }
    try {
      const storedPracticeAppIncluded = window.localStorage.getItem(
        PRACTICE_APP_INCLUDED_KEY
      );
      if (storedPracticeAppIncluded != null) {
        setPracticeAppIncludedInBaseFee(storedPracticeAppIncluded === 'true');
      }
    } catch {
      // ignore
    }
    try {
      const storedRoyaltiesAssumptions = window.localStorage.getItem(
        ROYALTIES_ASSUMPTIONS_KEY
      );
      if (storedRoyaltiesAssumptions) {
        const parsed = JSON.parse(storedRoyaltiesAssumptions) as Partial<RoyaltiesAssumptions>;
        setRoyaltiesAssumptions(current => ({
          ...current,
          ...parsed,
        }));
      }
    } catch {
      // ignore
    }
    setHasHydratedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    try {
      window.localStorage.setItem(
        SCENARIO_SETTINGS_KEY,
        JSON.stringify(scenarioSettings)
      );
    } catch {
      // ignore
    }
  }, [scenarioSettings, hasHydratedStorage]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    try {
      window.localStorage.setItem(
        REVENUE_SPLITS_KEY,
        JSON.stringify(revenueSplits)
      );
    } catch {
      // ignore
    }
  }, [revenueSplits, hasHydratedStorage]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    try {
      window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch {
      // ignore
    }
  }, [presets, hasHydratedStorage]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    try {
      window.localStorage.setItem(
        PRACTICE_APP_INCLUDED_KEY,
        String(practiceAppIncludedInBaseFee)
      );
    } catch {
      // ignore
    }
  }, [practiceAppIncludedInBaseFee, hasHydratedStorage]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    try {
      window.localStorage.setItem(
        ROYALTIES_ASSUMPTIONS_KEY,
        JSON.stringify(royaltiesAssumptions)
      );
    } catch {
      // ignore
    }
  }, [royaltiesAssumptions, hasHydratedStorage]);

  useEffect(() => {
    if (!presetMessage) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setPresetMessage('');
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [presetMessage]);

  const effectiveScenarioSettings = practiceAppIncludedInBaseFee
    ? {
        ...scenarioSettings,
        practiceAppAdoptionRate: 0,
        practiceAppPrice: 0,
      }
    : scenarioSettings;

  const {
    netSurplusRows,
    platformIncomeRows,
    smBreakdownRows,
    platformBreakdownRows,
    creatorPayoutRows,
    scenarioDetails,
  } =
    buildScenarioData(effectiveScenarioSettings, revenueSplits);

  useEffect(() => {
    if (!smBreakdownRows.some(row => row.scenario === selectedBreakdownScenario)) {
      setSelectedBreakdownScenario(smBreakdownRows[0]?.scenario ?? 'Current');
    }
  }, [smBreakdownRows, selectedBreakdownScenario]);

  const selectedSmBreakdown =
    smBreakdownRows.find(row => row.scenario === selectedBreakdownScenario) ??
    smBreakdownRows[0];
  const selectedPlatformBreakdown =
    platformBreakdownRows.find(
      row => row.scenario === selectedBreakdownScenario
    ) ?? platformBreakdownRows[0];
  const selectedCreatorPayout =
    creatorPayoutRows.find(row => row.scenario === selectedBreakdownScenario) ??
    creatorPayoutRows[0];
  const currentMonthlyFromRevStreams = Number(
    (netSurplusRows.find(row => row.scenario === 'Current')?.monthlyToSm ?? '$0').replace(
      /[^0-9.-]/g,
      '',
    ),
  );
  const creatorCount = Math.max(0, Math.round(scenarioSettings.packsPerMonth));
  const perCreatorMonthlyPayout =
    creatorCount > 0 && selectedCreatorPayout
      ? selectedCreatorPayout.totalCreatorPayoutMonthly / creatorCount
      : 0;

  const handleSettingChange = (
    key: keyof typeof DEFAULT_SCENARIO_SETTINGS,
    value: string
  ) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const percentKeys: Array<keyof typeof DEFAULT_SCENARIO_SETTINGS> = [
      'marketplacePurchaseRate',
      'stripePercent',
      'lessonRoomPercent',
      'dayPassPercent',
      'harmonyPercent',
      'practiceAppAdoptionRate',
    ];
    const oneDecimalKeys: Array<keyof typeof DEFAULT_SCENARIO_SETTINGS> = [
      'studentsPerTeacher',
    ];
    const twentyFiveStepKeys: Array<keyof typeof DEFAULT_SCENARIO_SETTINGS> = [];
    const nextValue = percentKeys.includes(key)
      ? Math.round(parsed)
      : oneDecimalKeys.includes(key)
        ? Number(parsed.toFixed(1))
      : twentyFiveStepKeys.includes(key)
        ? Math.max(0, Math.round(parsed / 25) * 25)
        : parsed;

    setScenarioSettings(current => ({
      ...current,
      [key]: nextValue,
    }));
  };

  const handleRevenueSplitChange = (
    streamId: StreamId,
    key: 'simplyMusic' | 'platform' | 'packCreators',
    value: string
  ) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const nextValue = Math.max(0, Math.round(parsed));
    setRevenueSplits(current => {
      const nextForStream = {
        ...current[streamId],
        [key]: nextValue,
      };
      return {
        ...current,
        [streamId]: nextForStream,
      };
    });
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) {
      setPresetMessage('Enter a preset name.');
      return;
    }
    setPresets(current => {
      const existingIndex = current.findIndex(
        preset => preset.name.toLowerCase() === name.toLowerCase()
      );
      const nextPreset: RevStreamsPreset = {
        name,
        scenarioSettings,
        revenueSplits: normalizeRevenueSplits(revenueSplits),
      };
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = nextPreset;
        setPresetMessage(`Updated preset "${name}".`);
        return next;
      }
      if (current.length >= 5) {
        setPresetMessage('Preset limit reached (5). Remove one to add another.');
        return current;
      }
      setPresetMessage(`Saved preset "${name}".`);
      return [...current, nextPreset];
    });
    setPresetName('');
  };

  const handleLoadPreset = (preset: RevStreamsPreset) => {
    setScenarioSettings({
      ...DEFAULT_SCENARIO_SETTINGS,
      ...preset.scenarioSettings,
    });
    setRevenueSplits(normalizeRevenueSplits(preset.revenueSplits));
    setLastLoadedPresetName(preset.name);
    setPresetMessage(`Loaded preset "${preset.name}".`);
  };

  const handleRemovePreset = (name: string) => {
    setPresets(current => current.filter(preset => preset.name !== name));
    setPresetMessage(`Removed preset "${name}".`);
  };

  const handleReorderPresets = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }
    setPresets(current => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleRoyaltiesAssumptionChange = (
    key: keyof RoyaltiesAssumptions,
    value: string
  ) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    setRoyaltiesAssumptions(current => ({
      ...current,
      [key]:
        key === 'avgStudentsPerTeacher' || key === 'lessonsPerStudent'
          ? Math.max(0, Number(parsed.toFixed(1)))
          : Math.max(0, parsed),
    }));
  };

  const handleOverwritePreset = (name: string) => {
    setPresets(current =>
      current.map(preset =>
        preset.name === name
          ? {
              ...preset,
              scenarioSettings,
              revenueSplits: normalizeRevenueSplits(revenueSplits),
            }
          : preset
      )
    );
    setPresetMessage(`Saved current values over preset "${name}".`);
  };

  return (
    <div className="space-y-8">
      <section className="relative rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
        <div className="absolute right-6 top-6 flex items-center gap-2 md:right-10 md:top-8">
          <button
            type="button"
            onClick={() => setShowAllCards(current => !current)}
            aria-pressed={showAllCards}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] shadow-sm transition hover:bg-[var(--c-fafafa)]"
          >
            <span className="sr-only">
              {showAllCards ? 'Enable single-card blur mode' : 'Unblur all cards'}
            </span>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path
                d="M2.5 10s2.7-4 7.5-4 7.5 4 7.5 4-2.7 4-7.5 4-7.5-4-7.5-4z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowRevenueSplit(current => !current)}
            aria-pressed={showRevenueSplit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] shadow-sm transition hover:bg-[var(--c-fafafa)]"
          >
            <span className="sr-only">
              {showRevenueSplit ? 'Hide revenue percentages' : 'Show revenue percentages'}
            </span>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path
                d="M6.5 13.5l7-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="14" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Platform Revenue Acceleration Streams
        </p>
        <div className="mt-3 space-y-1">
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] md:text-4xl">
            Built to Increase Simply Music Revenue
          </h1>
          <p className="text-xl font-medium text-[var(--c-6f6c65)] md:text-2xl">
            Not Just Replace Infrastructure
          </p>
        </div>
        {activeStreamIndex === null && !showAllCards ? (
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/60 backdrop-blur-[6px]" />
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {revenueStreams.map((stream, index) => {
          const split = revenueSplits[stream.id] ?? DEFAULT_REVENUE_SPLITS[stream.id];
          return (
          <article
            key={stream.title}
            onClick={() => setActiveStreamIndex(index)}
            className="relative flex h-full cursor-pointer flex-col rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition md:p-8"
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setActiveStreamIndex(index);
              }
            }}
            aria-pressed={activeStreamIndex === index}
          >
            <div className="flex flex-col gap-3">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-semibold leading-tight text-[var(--c-1f1f1d)]">
                  {stream.title}
                </h2>
                {'subtitle' in stream && stream.subtitle ? (
                  <p className="text-base font-medium text-[var(--c-6f6c65)] md:text-lg">
                    {stream.subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <div className="pt-4 first:pt-0">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                  {stream.unlocksTitle}
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[var(--c-3a3935)]">
                  {stream.unlocks.map(point => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>

              {stream.advancedTitle && stream.advanced ? (
                <div className="pt-4 first:pt-0">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    {stream.advancedTitle}
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[var(--c-3a3935)]">
                    {stream.advanced.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stream.creatorsTitle && stream.creators ? (
                <div className="pt-4 first:pt-0">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    {stream.creatorsTitle}
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[var(--c-3a3935)]">
                    {stream.creators.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stream.teachersTitle && stream.teachers ? (
                <div className="pt-4 first:pt-0">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    {stream.teachersTitle}
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[var(--c-3a3935)]">
                    {stream.teachers.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {stream.studentsTitle && stream.students ? (
                <div className="pt-4 first:pt-0">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    {stream.studentsTitle}
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[var(--c-3a3935)]">
                    {stream.students.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

            </div>

            {showRevenueSplit ? (
              <div className="mt-auto space-y-4 pt-5">
                {'dayPassNote' in stream && stream.dayPassNote ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                      Flexible Day-Pass Access
                    </p>
                    <p className="mt-2 text-sm text-[var(--c-6f6c65)]">{stream.dayPassNote}</p>
                  </div>
                ) : null}
                {'bundleTitle' in stream && stream.bundleTitle && 'bundleNote' in stream && stream.bundleNote ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                      {stream.bundleTitle}
                    </p>
                    <p className="mt-2 text-sm text-[var(--c-6f6c65)]">{stream.bundleNote}</p>
                  </div>
                ) : null}
                <p className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                  {stream.supportNote}
                </p>
                <RevenueSplit
                  simplyMusic={split.simplyMusic}
                  packCreators={split.packCreators}
                  platform={split.platform}
                  isVisible={showRevenueSplit}
                />
              </div>
            ) : null}

            {activeStreamIndex !== index && !showAllCards ? (
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/60 backdrop-blur-[6px]" />
            ) : null}
          </article>
          );
        })}
      </section>

      {showRevenueSplit ? (
        <>
          <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-6 shadow-sm md:px-10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                Rev Split Percentages
              </p>
              <button
                type="button"
                onClick={() => {
                  setFlexRevStreamMonthly(
                    Number.isFinite(currentMonthlyFromRevStreams)
                      ? currentMonthlyFromRevStreams
                      : 0,
                  );
                  setShowBaseRateModal(true);
                }}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 text-sm font-medium text-[var(--c-1f1f1d)] transition hover:bg-[var(--c-fafafa)]"
              >
                Base Rate Scope
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {revenueStreams.map(stream => {
                const split = revenueSplits[stream.id] ?? DEFAULT_REVENUE_SPLITS[stream.id];
                return (
                <article
                  key={stream.id}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    {stream.title}
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-[var(--c-6f6c65)]">
                        Simply Music %
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={split.simplyMusic}
                        onChange={event =>
                          handleRevenueSplitChange(
                            stream.id,
                            'simplyMusic',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                      />
                    </label>
                    {split.packCreators != null ? (
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-[var(--c-6f6c65)]">
                          Creators %
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={split.packCreators}
                          onChange={event =>
                            handleRevenueSplitChange(
                              stream.id,
                              'packCreators',
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                        />
                      </label>
                    ) : null}
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-[var(--c-6f6c65)]">
                        Platform %
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={split.platform}
                        onChange={event =>
                          handleRevenueSplitChange(
                            stream.id,
                            'platform',
                            event.target.value
                          )
                        }
                        className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                      />
                    </label>
                  </div>
                </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-6 shadow-sm md:px-10">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                Scenario Inputs
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRoyaltiesModal(true)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 text-sm font-medium text-[var(--c-1f1f1d)] transition hover:bg-[var(--c-fafafa)]"
                >
                  Base Subscriptions
                </button>
                <label className="space-y-1">
                  <span className="sr-only">Scenario</span>
                  <select
                    value={selectedBreakdownScenario}
                    onChange={event => setSelectedBreakdownScenario(event.target.value)}
                    className="w-full min-w-[180px] rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                  >
                    {smBreakdownRows.map(row => (
                      <option key={row.scenario} value={row.scenario}>
                        {row.scenario}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => setShowScenarioInputs(current => !current)}
                  aria-expanded={showScenarioInputs}
                  aria-controls="scenario-inputs-controls"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] shadow-sm transition hover:bg-[var(--c-fafafa)]"
                >
                  <span className="sr-only">
                    {showScenarioInputs ? 'Hide scenario inputs' : 'Show scenario inputs'}
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform ${showScenarioInputs ? 'rotate-90' : ''}`}
                  >
                    <path
                      d="M7 5l6 5-6 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {showScenarioInputs ? (
              <div
                id="scenario-inputs-controls"
                className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Teacher Count
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={scenarioSettings.teacherCount}
                  onChange={event =>
                    handleSettingChange('teacherCount', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Students Per Teacher
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={scenarioSettings.studentsPerTeacher}
                  onChange={event =>
                    handleSettingChange('studentsPerTeacher', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Marketplace Purchase Rate (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={scenarioSettings.marketplacePurchaseRate}
                  onChange={event =>
                    handleSettingChange('marketplacePurchaseRate', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Stripe Percent (%)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={scenarioSettings.stripePercent}
                  onChange={event =>
                    handleSettingChange('stripePercent', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Packs Per Month
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={scenarioSettings.packsPerMonth}
                  onChange={event =>
                    handleSettingChange('packsPerMonth', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Lesson Room % Adoption
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={scenarioSettings.lessonRoomPercent}
                  onChange={event =>
                    handleSettingChange('lessonRoomPercent', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Day Passes % Adoption
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={scenarioSettings.dayPassPercent}
                  onChange={event =>
                    handleSettingChange('dayPassPercent', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Harmony % Adoption
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={scenarioSettings.harmonyPercent}
                  onChange={event =>
                    handleSettingChange('harmonyPercent', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Practice App % Adoption
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={
                    practiceAppIncludedInBaseFee
                      ? 0
                      : scenarioSettings.practiceAppAdoptionRate
                  }
                  disabled={practiceAppIncludedInBaseFee}
                  onChange={event =>
                    handleSettingChange('practiceAppAdoptionRate', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Practice App Price ($)
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={practiceAppIncludedInBaseFee ? 0 : scenarioSettings.practiceAppPrice}
                  disabled={practiceAppIncludedInBaseFee}
                  onChange={event =>
                    handleSettingChange('practiceAppPrice', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Self-Learner Students
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={scenarioSettings.selfLearnerStudents}
                  onChange={event =>
                    handleSettingChange('selfLearnerStudents', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Self-Learner Price ($)
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={scenarioSettings.selfLearnerPrice}
                  onChange={event =>
                    handleSettingChange('selfLearnerPrice', event.target.value)
                  }
                  className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                />
              </label>
              <label className="md:col-span-2 lg:col-span-3 mt-1 flex items-center justify-between rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-3">
                <span className="text-sm font-medium text-[var(--c-3a3935)]">
                  Practice App Included In Student Base License Fee
                </span>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={practiceAppIncludedInBaseFee}
                  onClick={() =>
                    setPracticeAppIncludedInBaseFee(current => !current)
                  }
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    practiceAppIncludedInBaseFee
                      ? 'bg-[var(--c-1f1f1d)]'
                      : 'bg-[var(--c-e5e3dd)]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      practiceAppIncludedInBaseFee ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-6 shadow-sm md:px-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grow">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  Presets
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={event => {
                      setPresetName(event.target.value);
                      if (presetMessage) {
                        setPresetMessage('');
                      }
                    }}
                    placeholder={presetMessage || 'Preset name'}
                    className="w-full min-w-[220px] flex-1 rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-9a9892)]"
                  />
                  <button
                    type="button"
                    onClick={handleSavePreset}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 text-sm font-medium text-[var(--c-1f1f1d)] transition hover:bg-[var(--c-fafafa)]"
                  >
                    Save Current
                  </button>
                </div>
              </div>
            </div>
            {presets.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {presets.map((preset, index) => (
                  <div
                    key={preset.name}
                    draggable
                    onDragStart={() => setDraggedPresetIndex(index)}
                    onDragOver={event => {
                      event.preventDefault();
                    }}
                    onDrop={event => {
                      event.preventDefault();
                      if (draggedPresetIndex != null) {
                        handleReorderPresets(draggedPresetIndex, index);
                      }
                      setDraggedPresetIndex(null);
                    }}
                    onDragEnd={() => setDraggedPresetIndex(null)}
                    className={`inline-flex items-center rounded-xl border ${lastLoadedPresetName === preset.name ? 'border-[var(--c-d8d6d0)] bg-[var(--c-ffffff)] shadow-sm' : 'border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)]'} ${draggedPresetIndex === index ? 'opacity-70' : ''}`}
                    title="Drag to reorder preset"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className={`px-3 py-2 text-sm font-medium ${lastLoadedPresetName === preset.name ? 'text-[var(--c-1f1f1d)]' : 'text-[var(--c-1f1f1d)]'}`}
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOverwritePreset(preset.name)}
                      className="border-l border-[var(--c-e5e3dd)] px-2 py-2 text-xs text-[var(--c-6f6c65)] hover:text-[var(--c-1f1f1d)]"
                      aria-label={`Save over preset ${preset.name}`}
                      title="Save over this preset"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePreset(preset.name)}
                      className="border-l border-[var(--c-e5e3dd)] px-2 py-2 text-xs text-[var(--c-6f6c65)] hover:text-[var(--c-1f1f1d)]"
                      aria-label={`Remove preset ${preset.name}`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                Financial Model
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)] md:text-4xl">
                Simply Music Rev Stream Income
              </h2>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--c-ecebe7)]">
                <table className="min-w-full table-fixed border-collapse text-left text-sm">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[20%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Scenario</th>
                      <th className="px-4 py-3 font-semibold">Teachers</th>
                      <th className="px-4 py-3 font-semibold">Monthly</th>
                      <th className="px-4 py-3 font-semibold">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netSurplusRows.map(row => {
                      const isCurrent = row.scenario === 'Current';
                      return (
                        <tr
                          key={row.scenario}
                          className={`border-t border-[var(--c-ecebe7)] ${isCurrent ? 'font-semibold text-[var(--c-1f1f1d)]' : 'text-[var(--c-3a3935)]'}`}
                        >
                          <td className="px-4 py-3">{row.scenario}</td>
                          <td className="px-4 py-3">{row.teachers}</td>
                          <td className="px-4 py-3">{row.monthlyToSm}</td>
                          <td className="px-4 py-3">{row.annualToSm}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                Financial Model
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)] md:text-4xl">
                Platform Rev Stream Income
              </h2>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--c-ecebe7)]">
                <table className="min-w-full table-fixed border-collapse text-left text-sm">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[20%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Scenario</th>
                      <th className="px-4 py-3 font-semibold">Teachers</th>
                      <th className="px-4 py-3 font-semibold">Monthly</th>
                      <th className="px-4 py-3 font-semibold">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformIncomeRows.map(row => {
                      const isCurrent = row.scenario === 'Current';
                      return (
                        <tr
                          key={row.scenario}
                          className={`border-t border-[var(--c-ecebe7)] ${isCurrent ? 'font-semibold text-[var(--c-1f1f1d)]' : 'text-[var(--c-3a3935)]'}`}
                        >
                          <td className="px-4 py-3">{row.scenario}</td>
                          <td className="px-4 py-3">{row.teachers}</td>
                          <td className="px-4 py-3">{row.monthlyToPlatform}</td>
                          <td className="px-4 py-3">{row.annualToPlatform}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                Rev Share Breakdown
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Simply Music (Monthly)
              </h3>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--c-ecebe7)]">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Revenue Stream</th>
                      <th className="px-4 py-3 font-semibold">Adoption Rate</th>
                      <th className="px-4 py-3 font-semibold">Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSmBreakdown ? (
                      <>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Marketplace</td>
                          <td className="px-4 py-3">{scenarioSettings.marketplacePurchaseRate}%</td>
                          <td className="px-4 py-3">{selectedSmBreakdown.marketplace}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Stripe</td>
                          <td className="px-4 py-3">{scenarioSettings.stripePercent}%</td>
                          <td className="px-4 py-3">{selectedSmBreakdown.stripe}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Lesson Rooms</td>
                          <td className="px-4 py-3">{scenarioSettings.lessonRoomPercent}%</td>
                          <td className="px-4 py-3">{selectedSmBreakdown.lessonRooms}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Day Passes</td>
                          <td className="px-4 py-3">{scenarioSettings.dayPassPercent}%</td>
                          <td className="px-4 py-3">{selectedSmBreakdown.dayPasses}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Harmony</td>
                          <td className="px-4 py-3">{scenarioSettings.harmonyPercent}%</td>
                          <td className="px-4 py-3">{selectedSmBreakdown.harmony}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Practice App</td>
                          <td className="px-4 py-3">{effectiveScenarioSettings.practiceAppAdoptionRate}%</td>
                          <td className="px-4 py-3">{selectedSmBreakdown.practiceApp}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Self-Learner</td>
                          <td className="px-4 py-3">—</td>
                          <td className="px-4 py-3">{selectedSmBreakdown.selfLearner}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-1f1f1d)]">
                          <td className="px-4 py-3 font-semibold">Total</td>
                          <td className="px-4 py-3 font-semibold">—</td>
                          <td className="px-4 py-3 font-semibold">{selectedSmBreakdown.totalMonthly}</td>
                        </tr>
                      </>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                Rev Share Breakdown
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Platform (Monthly)
              </h3>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--c-ecebe7)]">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Revenue Stream</th>
                      <th className="px-4 py-3 font-semibold">Adoption Rate</th>
                      <th className="px-4 py-3 font-semibold">Monthly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlatformBreakdown ? (
                      <>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Marketplace</td>
                          <td className="px-4 py-3">{scenarioSettings.marketplacePurchaseRate}%</td>
                          <td className="px-4 py-3">{selectedPlatformBreakdown.marketplace}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Stripe</td>
                          <td className="px-4 py-3">{scenarioSettings.stripePercent}%</td>
                          <td className="px-4 py-3">{selectedPlatformBreakdown.stripe}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Lesson Rooms</td>
                          <td className="px-4 py-3">{scenarioSettings.lessonRoomPercent}%</td>
                          <td className="px-4 py-3">{selectedPlatformBreakdown.lessonRooms}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Day Passes</td>
                          <td className="px-4 py-3">{scenarioSettings.dayPassPercent}%</td>
                          <td className="px-4 py-3">{selectedPlatformBreakdown.dayPasses}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Harmony</td>
                          <td className="px-4 py-3">{scenarioSettings.harmonyPercent}%</td>
                          <td className="px-4 py-3">{selectedPlatformBreakdown.harmony}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Practice App</td>
                          <td className="px-4 py-3">{effectiveScenarioSettings.practiceAppAdoptionRate}%</td>
                          <td className="px-4 py-3">{selectedPlatformBreakdown.practiceApp}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]">
                          <td className="px-4 py-3">Self-Learner</td>
                          <td className="px-4 py-3">—</td>
                          <td className="px-4 py-3">{selectedPlatformBreakdown.selfLearner}</td>
                        </tr>
                        <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-1f1f1d)]">
                          <td className="px-4 py-3 font-semibold">Total</td>
                          <td className="px-4 py-3 font-semibold">—</td>
                          <td className="px-4 py-3 font-semibold">{selectedPlatformBreakdown.totalMonthly}</td>
                        </tr>
                      </>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Rev Share Breakdown
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Marketplace Creator Payout (Monthly)
            </h3>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Scenario: {selectedBreakdownScenario} · Creators/Lesson Packs:{' '}
              {creatorCount.toLocaleString()}
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--c-ecebe7)]">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Creator</th>
                    <th className="px-4 py-3 font-semibold">Share %</th>
                    <th className="px-4 py-3 font-semibold">Monthly Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {creatorCount > 0 ? (
                    Array.from({ length: creatorCount }, (_, index) => (
                      <tr
                        key={`creator-${index + 1}`}
                        className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]"
                      >
                        <td className="px-4 py-3">Creator {index + 1}</td>
                        <td className="px-4 py-3">
                          {(100 / creatorCount).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                          %
                        </td>
                        <td className="px-4 py-3">
                          {formatMoney(perCreatorMonthlyPayout)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-6f6c65)]">
                      <td className="px-4 py-3" colSpan={3}>
                        Set `Packs Per Month` above 0 to generate creator rows.
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-[var(--c-ecebe7)] text-[var(--c-1f1f1d)]">
                    <td className="px-4 py-3 font-semibold">Total</td>
                    <td className="px-4 py-3 font-semibold">
                      {creatorCount > 0 ? '100%' : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatMoney(selectedCreatorPayout?.totalCreatorPayoutMonthly ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6">
            {scenarioDetails.map(detail => (
              <article
                key={detail.heading}
                className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm md:p-8"
              >
                <h3 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {detail.heading}
                </h3>
                <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                  <span className="font-semibold text-[var(--c-1f1f1d)]">Students: </span>
                  {detail.students}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {detail.items.map(item => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4"
                    >
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                        {item.title}
                      </p>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-[var(--c-3a3935)]">
                        {item.points.map(point => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
                  <ul className="list-disc space-y-2 pl-5 text-base text-[var(--c-3a3935)]">
                    {detail.totals.map(total => (
                      <li key={total} className="font-medium">
                        {total}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : null}

      {showRoyaltiesModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          onClick={() => setShowRoyaltiesModal(false)}
        >
          <div
            className="w-full max-w-[1500px] rounded-3xl border border-[#c7c3bc] bg-[#ece9e4] p-4 shadow-2xl md:p-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex justify-end pb-2">
              <button
                type="button"
                onClick={() => setShowRoyaltiesModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c7c3bc] bg-[#f7f5f1] text-[var(--c-6f6c65)]"
                aria-label="Close royalties snapshot"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Old Model Total</p>
                <p className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">{formatCurrency(royaltiesTotals.oldTotal)}</p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">Based on tiered $/lesson rates</p>
              </div>
              <div className="rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Teacher Fee Total</p>
                <p className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">{formatCurrency(royaltiesTotals.newTotal)}</p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {formatCount(royaltiesTotals.students)} students billed at ${formatCount(royaltiesAssumptions.teacherFee)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Student Access Total</p>
                <p className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">{formatCurrency(royaltiesTotals.studentAccessTotal)}</p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {formatCount(royaltiesTotals.students)} students billed at ${formatCount(royaltiesAssumptions.studentFee)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Combined Total</p>
                <p className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">{formatCurrency(royaltiesCombinedTotal)}</p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Net change vs old model: {formatCurrency(royaltiesDelta)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Teachers</p>
                <p className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">
                  {formatCount(royaltiesAssumptions.teacherCount)}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">Studios modeled in this scenario</p>
              </div>
              <div className="rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Students</p>
                <p className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">
                  {formatCount(royaltiesTotals.students)}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">Based on teacher count and average roster</p>
              </div>
              <div className="rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Lessons</p>
                <p className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">
                  {Math.round(
                    royaltiesTotals.students * royaltiesAssumptions.lessonsPerStudent,
                  ).toLocaleString('en-US')}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">Total lessons per month modeled</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#c7c3bc] bg-[#f3f1ee] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">Assumptions</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <label className="flex items-center gap-2">
                  Teachers
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={royaltiesAssumptions.teacherCount}
                    onChange={event =>
                      handleRoyaltiesAssumptionChange('teacherCount', event.target.value)
                    }
                    className="w-24 rounded-full border border-[#c7c3bc] bg-[#f7f5f1] px-3 py-2 text-center text-sm text-[var(--c-1f1f1d)]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  Avg Students
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={royaltiesAssumptions.avgStudentsPerTeacher}
                    onChange={event =>
                      handleRoyaltiesAssumptionChange(
                        'avgStudentsPerTeacher',
                        event.target.value,
                      )
                    }
                    className="w-24 rounded-full border border-[#c7c3bc] bg-[#f7f5f1] px-3 py-2 text-center text-sm text-[var(--c-1f1f1d)]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  Lessons/Student
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={royaltiesAssumptions.lessonsPerStudent}
                    onChange={event =>
                      handleRoyaltiesAssumptionChange(
                        'lessonsPerStudent',
                        event.target.value,
                      )
                    }
                    className="w-24 rounded-full border border-[#c7c3bc] bg-[#f7f5f1] px-3 py-2 text-center text-sm text-[var(--c-1f1f1d)]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  Teacher Fee
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={royaltiesAssumptions.teacherFee}
                    onChange={event =>
                      handleRoyaltiesAssumptionChange('teacherFee', event.target.value)
                    }
                    className="w-24 rounded-full border border-[#c7c3bc] bg-[#f7f5f1] px-3 py-2 text-center text-sm text-[var(--c-1f1f1d)]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  Student Fee
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={royaltiesAssumptions.studentFee}
                    onChange={event =>
                      handleRoyaltiesAssumptionChange('studentFee', event.target.value)
                    }
                    className="w-24 rounded-full border border-[#c7c3bc] bg-[#f7f5f1] px-3 py-2 text-center text-sm text-[var(--c-1f1f1d)]"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showBaseRateModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          onClick={() => setShowBaseRateModal(false)}
        >
          <div
            className="w-full max-w-[1180px] max-h-[85vh] overflow-y-auto rounded-3xl border border-[#c7c3bc] bg-[#ece9e4] p-4 shadow-2xl md:p-5"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowBaseRateModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c7c3bc] bg-[#f7f5f1] text-[var(--c-6f6c65)]"
                aria-label="Close base rate scope"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {showBaseRateFlexOptions ? (
              <section className="mb-4 rounded-2xl border border-[#c7c3bc] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                    Base Rate Flex Option
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setShowExtendedBaseRateOptions(current => !current)
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#c7c3bc] bg-[#f7f5f1] text-[var(--c-6f6c65)]"
                    aria-label={
                      showExtendedBaseRateOptions
                        ? 'Hide lower base options'
                        : 'Show lower base options'
                    }
                    title={
                      showExtendedBaseRateOptions
                        ? 'Hide $8k/$10k options'
                        : 'Show $8k/$10k options'
                    }
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-base text-[var(--c-6f6c65)]">
                  To support early-stage momentum, Simply Music may elect to begin with a temporarily reduced base rate during the initial launch period. The difference between the standard base rate and the temporary base rate is structured as a Deferred Balance. This Deferred Balance is not billed separately. Instead, it is aligned through RevStream performance.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                      Reduced Base Option
                    </span>
                    <select
                      value={flexReducedBaseRate}
                      onChange={event => {
                        const nextBaseRate = Number(event.target.value);
                        setFlexReducedBaseRate(nextBaseRate);
                        setFlexAlignmentPercent(
                          getAlignmentPercentForBaseRate(nextBaseRate)
                        );
                      }}
                      className="w-full rounded-xl border border-[#c7c3bc] bg-[#f7f5f1] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                    >
                      {showExtendedBaseRateOptions || flexReducedBaseRate === 6000 ? (
                        <option value={6000}>$6,000/month</option>
                      ) : null}
                      {showExtendedBaseRateOptions || flexReducedBaseRate === 8000 ? (
                        <option value={8000}>$8,000/month</option>
                      ) : null}
                      {showExtendedBaseRateOptions || flexReducedBaseRate === 10000 ? (
                        <option value={10000}>$10,000/month</option>
                      ) : null}
                      <option value={12000}>$12,000/month</option>
                      <option value={15000}>$15,000/month</option>
                      <option value={18000}>$18,000/month</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                      Alignment Period (Months)
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={flexReducedMonths}
                      onChange={event =>
                        setFlexReducedMonths(Math.max(1, Math.round(Number(event.target.value) || 1)))
                      }
                      className="w-full rounded-xl border border-[#c7c3bc] bg-[#f7f5f1] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-[#d5d1ca] bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">Standard Total</p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                      {formatCurrency(flexStandardTotal)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#d5d1ca] bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">Reduced Total Paid</p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                      {formatCurrency(flexReducedTotal)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#d5d1ca] bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">Deferred Balance</p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                      {formatCurrency(flexDeferredBalance)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#d5d1ca] bg-white p-4">
                  <p className="text-base uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                    Performance Alignment Structure
                  </p>
                  <ul className="mt-2 list-disc pl-6 text-[1.1rem] leading-relaxed text-[var(--c-6f6c65)]">
                    <li>
                      During the initial reduced-base period, the difference between the standard base rate and the reduced base rate accumulates as a Deferred Balance.
                    </li>
                    <li>
                      As RevStream revenue is generated, a higher percentage of RevStream is allocated toward offsetting the Deferred Balance.
                    </li>
                    <li>
                      Once the Deferred Balance reaches zero, RevStream percentages normalize to the standard agreed split.
                    </li>
                  </ul>
                </div>

                <div className="mt-4 rounded-xl border border-[#d5d1ca] bg-white p-4">
                  <p className="text-base uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                    Base Rate Stabilization Simulation
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                        RevStream Monthly ($X)
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={Math.max(0, Math.round(flexRevStreamMonthly)).toLocaleString('en-US')}
                        onChange={event =>
                          setFlexRevStreamMonthly(
                            Math.max(
                              0,
                              Number(
                                event.target.value.replace(/[^0-9.-]/g, ''),
                              ) || 0,
                            ),
                          )
                        }
                        className="w-full rounded-xl border border-[#c7c3bc] bg-[#ffffff] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                        Alignment Allocation (Y%)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={flexAlignmentPercent}
                        onChange={event =>
                          setFlexAlignmentPercent(
                            Math.min(100, Math.max(0, Number(event.target.value) || 0)),
                          )
                        }
                        className="w-full rounded-xl border border-[#c7c3bc] bg-[#ffffff] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      />
                    </label>
                  </div>

                  <p className="my-6 text-[1.65rem] leading-tight text-[var(--c-3a3935)]">
                    If RevStream generates <span className="font-semibold">{formatCurrency(flexRevStreamMonthly)}</span> per month, and <span className="font-semibold">{formatCount(flexAlignmentPercent)}%</span> is allocated (<span className="font-semibold">{formatCurrency(flexMonthlyAlignment)}</span>) toward balance alignment, estimated catch-up timeline is{' '}
                    <span className="font-semibold">
                      {flexEstimatedMonths != null
                        ? `${formatCount(flexEstimatedMonths)} months`
                        : 'not available'}
                    </span>.
                  </p>

                  <div className="mt-4 rounded-xl border border-[#d5d1ca] bg-[#f1efea] p-3">
                    <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                      <span>Balance Stabilization Progress</span>
                      <span>{formatCount(flexOneMonthProgressPercent)}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[#ddd9d2]">
                      <div
                        className="h-2 rounded-full bg-[var(--c-1f1f1d)] transition-all"
                        style={{ width: `${flexOneMonthProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-[#c7c3bc] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  PLATFORM Base Monthly Rate
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setShowBaseRateFlexOptions(current => !current)
                  }
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[#c7c3bc] bg-[#f7f5f1] px-3 text-sm font-medium text-[var(--c-1f1f1d)] transition hover:bg-[#ffffff]"
                >
                  Base Rate Flex Options
                </button>
              </div>
              <h2 className="mt-2 text-5xl font-semibold text-[var(--c-1f1f1d)]">$22,000</h2>
              <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                The Base Rate covers the core Simply Music platform infrastructure and our ongoing commitment to the stability, care, and growth of your company.
              </p>
              <div className="mt-4 space-y-7">
                {BASE_RATE_CATEGORIES.map(category => (
                  <div
                    key={category.title}
                    className="rounded-xl border border-[#d8d4cd] bg-[#f8f6f2] p-4"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {category.title}
                    </p>
                    <ul className="mt-2 grid gap-x-6 gap-y-4 md:grid-cols-2 list-disc pl-5 text-sm text-[var(--c-3a3935)]">
                      {category.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-4 text-center text-2xl font-medium text-[var(--c-1f1f1d)]">
              &quot;We are fully invested in Simply Music&apos;s progress&quot;
            </p>

            <section className="mt-4 rounded-2xl border border-[#c7c3bc] bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Shared Revenue Stream Initiatives
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                New initiatives are designed to create additional income for both parties, they are treated as shared revenue opportunities.
              </p>
              <div className="mt-4 space-y-7">
                {SHARED_INITIATIVE_CATEGORIES.map(category => (
                  <div
                    key={category.title}
                    className="rounded-xl border border-[#d8d4cd] bg-[#f8f6f2] p-4"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {category.title}
                    </p>
                    <ul className="mt-2 grid gap-x-6 gap-y-4 md:grid-cols-2 list-disc pl-5 text-sm text-[var(--c-3a3935)]">
                      {category.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}

    </div>
  );
}
