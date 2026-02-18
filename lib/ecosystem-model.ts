export type EcosystemInputs = {
  teacherCount: number;
  avgStudentsPerTeacher: number;
  studentFeeNine: number;
  studentFeeFour: number;
  teacherLicenseFee: number;
  avgStudentTuitionMonthly: number;
  avgStudentTuitionAdoptionRatePercent: number;
  lessonPackPrice: number;
  lessonPackAdoptionRatePercent: number;
  packsCreatedPerMonth: number;
  packCompanyPercent: number;
  packUsPercent: number;
  packCreatorPercent: number;
  annualCurriculumEstimate: number;
  percentTeachersUsingOnlineRoom: number;
  onlineRoomMonthlyCost: number;
  onlineRoomUsSharePercent: number;
  percentTeachersUsingDayPass: number;
  avgDayPassesPerMonth: number;
  dayPassCost: number;
  annualGrowthRatePercent: number;
  projectionYears: number;
  useVariableGrowthRates: boolean;
  graduatedRateFirstPercent: number;
  graduatedRateSecondPercent: number;
  graduatedRateThirdPercent: number;
  graduatedRateAbovePercent: number;
};

export type GraduatedCutResult = {
  totalUsCut: number;
  effectiveRate: number;
};

export type GraduatedTierBreakdown = {
  label: string;
  rate: number;
  revenueInTier: number;
  ccCoCut: number;
};

export type GraduatedRates = {
  firstPercent: number;
  secondPercent: number;
  thirdPercent: number;
  abovePercent: number;
};

const defaultGraduatedRates: GraduatedRates = {
  firstPercent: 12,
  secondPercent: 9,
  thirdPercent: 7.25,
  abovePercent: 5.75,
};

function normalizeGraduatedRates(
  rates?: Partial<GraduatedRates>,
): { first: number; second: number; third: number; above: number } {
  const merged = { ...defaultGraduatedRates, ...(rates ?? {}) };
  return {
    first: merged.firstPercent / 100,
    second: merged.secondPercent / 100,
    third: merged.thirdPercent / 100,
    above: merged.abovePercent / 100,
  };
}

export type EcosystemModel = {
  totalStudents: number;
  monthlySubscriptionRevenue: number;
  annualSubscriptionRevenue: number;
  subscriptionGraduatedCut: number;
  subscriptionEffectiveRate: number;
  monthlyTuitionVolume: number;
  annualTuitionVolume: number;
  usStripeShare: number;
  monthlyPackRevenue: number;
  annualPackRevenue: number;
  companyPackShare: number;
  usPackShare: number;
  creatorPackShare: number;
  annualCurriculumUsShare: number;
  teachersUsingRoom: number;
  annualRoomRevenue: number;
  usRoomShare: number;
  teachersUsingDayPass: number;
  annualDayPassRevenue: number;
  totalUsAnnualIncome: number;
  curriculumIncludedInGraduated: boolean;
};

export type ProjectionPoint = {
  year: number;
  totalUsIncome: number;
  totalEcosystemRevenue?: number;
};

export const defaultEcosystemInputs: EcosystemInputs = {
  teacherCount: 750,
  avgStudentsPerTeacher: 20,
  studentFeeNine: 9,
  studentFeeFour: 4,
  teacherLicenseFee: 4,
  avgStudentTuitionMonthly: 150,
  avgStudentTuitionAdoptionRatePercent: 65,
  lessonPackPrice: 49,
  lessonPackAdoptionRatePercent: 10,
  packsCreatedPerMonth: 2,
  packCompanyPercent: 65,
  packUsPercent: 25,
  packCreatorPercent: 10,
  annualCurriculumEstimate: 450000,
  percentTeachersUsingOnlineRoom: 40,
  onlineRoomMonthlyCost: 19,
  onlineRoomUsSharePercent: 30,
  percentTeachersUsingDayPass: 50,
  avgDayPassesPerMonth: 2,
  dayPassCost: 7,
  annualGrowthRatePercent: 11.5,
  projectionYears: 5,
  useVariableGrowthRates: true,
  graduatedRateFirstPercent: 9.75,
  graduatedRateSecondPercent: 7.75,
  graduatedRateThirdPercent: 5.75,
  graduatedRateAbovePercent: 3.75,
};

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number): string {
  return percentFormatter.format(Number.isFinite(value) ? value : 0);
}

export function calculateGraduatedRevenueCut(
  annualRevenue: number,
  rates?: Partial<GraduatedRates>,
): GraduatedCutResult {
  const revenue = Math.max(0, annualRevenue);
  const normalized = normalizeGraduatedRates(rates);
  let remaining = revenue;
  let totalUsCut = 0;

  const firstBracket = Math.min(remaining, 250_000);
  totalUsCut += firstBracket * normalized.first;
  remaining -= firstBracket;

  const secondBracket = Math.min(remaining, 250_000);
  totalUsCut += secondBracket * normalized.second;
  remaining -= secondBracket;

  const thirdBracket = Math.min(remaining, 500_000);
  totalUsCut += thirdBracket * normalized.third;
  remaining -= thirdBracket;

  if (remaining > 0) {
    totalUsCut += remaining * normalized.above;
  }

  const effectiveRate = revenue > 0 ? totalUsCut / revenue : 0;
  return { totalUsCut, effectiveRate };
}

export function buildGraduatedTierBreakdown(
  annualRevenue: number,
  rates?: Partial<GraduatedRates>,
): { tiers: GraduatedTierBreakdown[]; totalCcCoCut: number; effectiveRate: number } {
  const revenue = Math.max(0, annualRevenue);
  const normalized = normalizeGraduatedRates(rates);
  let remaining = revenue;
  const tiers: GraduatedTierBreakdown[] = [];

  const takeTier = (label: string, limit: number | null, rate: number) => {
    const amount =
      limit === null ? Math.max(0, remaining) : Math.min(remaining, limit);
    const ccCoCut = amount * rate;
    tiers.push({ label, rate, revenueInTier: amount, ccCoCut });
    remaining -= amount;
  };

  takeTier('First $250,000', 250_000, normalized.first);
  takeTier('Next $250,000', 250_000, normalized.second);
  takeTier('Next $500,000', 500_000, normalized.third);
  takeTier('Above $1,000,000', null, normalized.above);

  const totalCcCoCut = tiers.reduce((sum, tier) => sum + tier.ccCoCut, 0);
  const effectiveRate = revenue > 0 ? totalCcCoCut / revenue : 0;

  return { tiers, totalCcCoCut, effectiveRate };
}

export function calculateEcosystemModel(inputs: EcosystemInputs): EcosystemModel {
  const totalStudents = inputs.teacherCount * inputs.avgStudentsPerTeacher;
  const monthlySubscriptionRevenue =
    totalStudents * inputs.studentFeeNine +
    totalStudents * inputs.studentFeeFour;
  const monthlyLicenseRevenue = inputs.teacherCount * inputs.teacherLicenseFee;
  const annualSubscriptionRevenue = monthlySubscriptionRevenue * 12;

  const graduatedMonthly = calculateGraduatedRevenueCut(
    monthlySubscriptionRevenue + monthlyLicenseRevenue,
    {
      firstPercent: inputs.graduatedRateFirstPercent,
      secondPercent: inputs.graduatedRateSecondPercent,
      thirdPercent: inputs.graduatedRateThirdPercent,
      abovePercent: inputs.graduatedRateAbovePercent,
    },
  );
  const graduated = {
    totalUsCut: graduatedMonthly.totalUsCut * 12,
    effectiveRate: graduatedMonthly.effectiveRate,
  };

  const monthlyTuitionVolume =
    totalStudents *
    (inputs.avgStudentTuitionAdoptionRatePercent / 100) *
    inputs.avgStudentTuitionMonthly;
  const annualTuitionVolume = monthlyTuitionVolume * 12;
  const usStripeShare = annualTuitionVolume * 0.01;

  const monthlyPackRevenue =
    totalStudents *
    (inputs.lessonPackAdoptionRatePercent / 100) *
    inputs.lessonPackPrice *
    inputs.packsCreatedPerMonth;
  const annualPackRevenue = monthlyPackRevenue * 12;
  const companyPackShare = annualPackRevenue * (inputs.packCompanyPercent / 100);
  const usPackShare = annualPackRevenue * (inputs.packUsPercent / 100);
  const creatorPackShare = annualPackRevenue * (inputs.packCreatorPercent / 100);

  const annualCurriculumUsShare = inputs.annualCurriculumEstimate * 0.0575;

  const teachersUsingRoom =
    inputs.teacherCount * (inputs.percentTeachersUsingOnlineRoom / 100);
  const percentTeachersUsingDayPass = Number.isFinite(
    inputs.percentTeachersUsingDayPass,
  )
    ? inputs.percentTeachersUsingDayPass
    : 0;
  const avgDayPassesPerMonth = Number.isFinite(inputs.avgDayPassesPerMonth)
    ? inputs.avgDayPassesPerMonth
    : 0;
  const dayPassCost = Number.isFinite(inputs.dayPassCost)
    ? inputs.dayPassCost
    : 0;
  const teachersUsingDayPass =
    inputs.teacherCount * (percentTeachersUsingDayPass / 100);
  const annualDayPassRevenue =
    teachersUsingDayPass * avgDayPassesPerMonth * dayPassCost * 12;
  const annualRoomRevenue =
    teachersUsingRoom * inputs.onlineRoomMonthlyCost * 12 +
    annualDayPassRevenue;
  const usRoomShare = annualRoomRevenue * (inputs.onlineRoomUsSharePercent / 100);

  const totalUsAnnualIncome =
    graduated.totalUsCut +
    usStripeShare +
    usPackShare +
    annualCurriculumUsShare +
    usRoomShare;

  return {
    totalStudents,
    monthlySubscriptionRevenue,
    annualSubscriptionRevenue,
    subscriptionGraduatedCut: graduated.totalUsCut,
    subscriptionEffectiveRate: graduated.effectiveRate,
    monthlyTuitionVolume,
    annualTuitionVolume,
    usStripeShare,
    monthlyPackRevenue,
    annualPackRevenue,
    companyPackShare,
    usPackShare,
    creatorPackShare,
    annualCurriculumUsShare,
    teachersUsingRoom,
    annualRoomRevenue,
    usRoomShare,
    teachersUsingDayPass,
    annualDayPassRevenue,
    totalUsAnnualIncome,
    curriculumIncludedInGraduated: false,
  };
}

export function buildProjectionData(inputs: EcosystemInputs): ProjectionPoint[] {
  const years = Math.max(1, Math.round(inputs.projectionYears));
  const baseGrowthRate = inputs.annualGrowthRatePercent / 100;
  const baseTotalStudents = inputs.teacherCount * inputs.avgStudentsPerTeacher;
  const variableOffsets = [0, -0.03, -0.01, 0, -0.02, 0, -0.05];
  const growthFactors: number[] = [];

  return Array.from({ length: years }, (_, index) => {
    const year = index + 1;
    const yearlyRate = (() => {
      if (!inputs.useVariableGrowthRates || year < 2) {
        return baseGrowthRate;
      }
      const rawRate =
        baseGrowthRate + variableOffsets[(year - 2) % variableOffsets.length];
      if (baseGrowthRate < 0.07) {
        const softFloor = Math.max(0, baseGrowthRate - 0.015);
        return Math.max(rawRate, softFloor);
      }
      return Math.max(0, rawRate);
    })();
    const previousFactor = growthFactors[index - 1] ?? 1;
    const growthFactor = previousFactor * (1 + yearlyRate);
    growthFactors.push(growthFactor);

    const teacherCount = inputs.teacherCount * growthFactor;
    const totalStudents = baseTotalStudents * growthFactor;

    const annualSubscriptionRevenue =
      (totalStudents * inputs.studentFeeNine + totalStudents * inputs.studentFeeFour) *
      12;
    const annualCurriculumEstimate = inputs.annualCurriculumEstimate * growthFactor;
    const monthlySubscriptionRevenue =
      totalStudents * inputs.studentFeeNine + totalStudents * inputs.studentFeeFour;
    const monthlyLicenseRevenue = teacherCount * inputs.teacherLicenseFee;
    const subscriptionRevenueForGraduated = monthlySubscriptionRevenue;
    const { totalUsCut } = calculateGraduatedRevenueCut(
      subscriptionRevenueForGraduated + monthlyLicenseRevenue,
      {
        firstPercent: inputs.graduatedRateFirstPercent,
        secondPercent: inputs.graduatedRateSecondPercent,
        thirdPercent: inputs.graduatedRateThirdPercent,
        abovePercent: inputs.graduatedRateAbovePercent,
      },
    );

    const annualTuitionVolume =
      totalStudents *
      (inputs.avgStudentTuitionAdoptionRatePercent / 100) *
      inputs.avgStudentTuitionMonthly *
      12;
    const usStripeShare = annualTuitionVolume * 0.01;

    const annualPackRevenue =
      totalStudents *
      (inputs.lessonPackAdoptionRatePercent / 100) *
      inputs.lessonPackPrice *
      inputs.packsCreatedPerMonth *
      12;
    const usPackShare = annualPackRevenue * (inputs.packUsPercent / 100);

    const teachersUsingRoom =
      teacherCount * (inputs.percentTeachersUsingOnlineRoom / 100);
    const percentTeachersUsingDayPass = Number.isFinite(
      inputs.percentTeachersUsingDayPass,
    )
      ? inputs.percentTeachersUsingDayPass
      : 0;
    const avgDayPassesPerMonth = Number.isFinite(inputs.avgDayPassesPerMonth)
      ? inputs.avgDayPassesPerMonth
      : 0;
    const dayPassCost = Number.isFinite(inputs.dayPassCost)
      ? inputs.dayPassCost
      : 0;
    const teachersUsingDayPass =
      teacherCount * (percentTeachersUsingDayPass / 100);
    const annualRoomRevenue =
      teachersUsingRoom * inputs.onlineRoomMonthlyCost * 12 +
      teachersUsingDayPass *
        avgDayPassesPerMonth *
        dayPassCost *
        12;
    const usRoomShare =
      annualRoomRevenue * (inputs.onlineRoomUsSharePercent / 100);

    const annualCurriculumUsShare = annualCurriculumEstimate * 0.0575;

    const totalUsIncome =
      totalUsCut * 12 +
      usStripeShare +
      usPackShare +
      usRoomShare +
      annualCurriculumUsShare;

    const totalEcosystemRevenue =
      annualSubscriptionRevenue +
      annualPackRevenue +
      annualRoomRevenue +
      annualCurriculumEstimate;

    return {
      year,
      totalUsIncome,
      totalEcosystemRevenue,
    };
  });
}
