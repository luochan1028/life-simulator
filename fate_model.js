/* =====================================================================
   命运模型 v2 · 前端 JS 实现
   ===================================================================== */

// ===== 1. 学历体系 =====
const EDUCATION_LEVELS = {
  "文盲":    { human_capital: 15, signal: 5,  ai_risk_base: 95, health_literacy: 15 },
  "小学":    { human_capital: 22, signal: 12, ai_risk_base: 90, health_literacy: 25 },
  "初中":    { human_capital: 35, signal: 25, ai_risk_base: 82, health_literacy: 40 },
  "高中":    { human_capital: 48, signal: 42, ai_risk_base: 72, health_literacy: 55 },
  "职高":    { human_capital: 52, signal: 45, ai_risk_base: 68, health_literacy: 58 },
  "大专":    { human_capital: 62, signal: 58, ai_risk_base: 60, health_literacy: 65 },
  "本科":    { human_capital: 78, signal: 80, ai_risk_base: 45, health_literacy: 78 },
  "硕士":    { human_capital: 92, signal: 93, ai_risk_base: 30, health_literacy: 85 },
  "博士":    { human_capital: 100, signal: 100, ai_risk_base: 18, health_literacy: 90 },
};

// ===== 2. 家庭背景 =====
const FAMILY_PRESETS = {
  "贫困": { wealth: 10, social: 15, medical: 25, inheritance: 0,   education_bonus: -10 },
  "普通": { wealth: 40, social: 40, medical: 55, inheritance: 5,   education_bonus:   0 },
  "中产": { wealth: 70, social: 68, medical: 75, inheritance: 15,  education_bonus:  +8 },
  "富裕": { wealth: 92, social: 88, medical: 92, inheritance: 40,  education_bonus: +15 },
};

// ===== 3. 人生策略（影响行为系数）=====
const STRATEGIES = {
  stable:   { name: "稳定保守",   effort: 0.85, career: 0.55, savings: 0.28, invest: 0.4,
              consumption: 0.55, risk: 0.25, skill_upgrade: 0.3, geo: 0.3, health_cost: 0.9 },
  hard:     { name: "努力奋斗",   effort: 1.2,  career: 0.9,  savings: 0.25, invest: 0.65,
              consumption: 0.55, risk: 0.55, skill_upgrade: 0.8, geo: 0.7, health_cost: 0.75 },
  radical:  { name: "激进冒险",   effort: 1.3,  career: 1.2,  savings: 0.12, invest: 1.0,
              consumption: 0.7,  risk: 1.2,  skill_upgrade: 0.9, geo: 1.0, health_cost: 0.6 },
  balanced: { name: "平衡生活",   effort: 1.0,  career: 0.7,  savings: 0.22, invest: 0.55,
              consumption: 0.6,  risk: 0.5,  skill_upgrade: 0.6, geo: 0.6, health_cost: 1.0 },
  lieflat:  { name: "躺平低欲望", effort: 0.55, career: 0.2,  savings: 0.18, invest: 0.2,
              consumption: 0.55, risk: 0.2,  skill_upgrade: 0.1, geo: 0.2, health_cost: 1.1 },
};

// ===== 4. 中国宏观场景预设 =====
const MACRO_SCENES = {
  cn2025: {
    name: "中国2025",
    scene_start: 2025,
    gdp_growth: 4.5, inflation: 2.5, unemployment: 5.2, interest: 3.0,
    house_price_growth: 1.5, wage_growth: 4.5, gini: 46.5,
    aging: 15.6, birth_rate: 1.0, urbanization: 67,
    ai_adoption: 35, tech_revolution_speed: 60,
    industry_mix: { labor: 0.15, capital: 0.38, knowledge: 0.37, ai: 0.10 },
    global_trade: 65, geopolitical_risk: 55,
    currency_stability: 78, supply_chain: 80,
    global_demand: 68, usd_cycle: 60,
    edu_return: 11, edu_inflation: 7, skill_mismatch: 35,
    social_safety: 60, medical_system: 65,
    disaster_risk: 18, policy_stability: 75, reform_speed: 45,
  },
  cn2035: {
    name: "中国2035",
    scene_start: 2035,
    gdp_growth: 3.2, inflation: 3.0, unemployment: 7.0, interest: 2.2,
    house_price_growth: -0.5, wage_growth: 3.0, gini: 50.0,
    aging: 24.5, birth_rate: 0.9, urbanization: 75,
    ai_adoption: 70, tech_revolution_speed: 80,
    industry_mix: { labor: 0.07, capital: 0.28, knowledge: 0.38, ai: 0.27 },
    global_trade: 60, geopolitical_risk: 60,
    currency_stability: 75, supply_chain: 70,
    global_demand: 65, usd_cycle: 55,
    edu_return: 14, edu_inflation: 8, skill_mismatch: 45,
    social_safety: 65, medical_system: 72,
    disaster_risk: 20, policy_stability: 72, reform_speed: 55,
  },
  cn2045: {
    name: "中国2045",
    scene_start: 2045,
    gdp_growth: 1.8, inflation: 2.5, unemployment: 8.5, interest: 1.5,
    house_price_growth: -2.0, wage_growth: 1.5, gini: 52.0,
    aging: 35.0, birth_rate: 0.85, urbanization: 82,
    ai_adoption: 88, tech_revolution_speed: 70,
    industry_mix: { labor: 0.03, capital: 0.22, knowledge: 0.35, ai: 0.40 },
    global_trade: 55, geopolitical_risk: 65,
    currency_stability: 72, supply_chain: 65,
    global_demand: 62, usd_cycle: 50,
    edu_return: 16, edu_inflation: 9, skill_mismatch: 55,
    social_safety: 70, medical_system: 75,
    disaster_risk: 22, policy_stability: 68, reform_speed: 50,
  },
  cn1995: {
    name: "中国1995",
    scene_start: 1995,
    gdp_growth: 10.5, inflation: 15.0, unemployment: 3.5, interest: 9.0,
    house_price_growth: 10.0, wage_growth: 12.0, gini: 35.0,
    aging: 6.5, birth_rate: 1.9, urbanization: 30,
    ai_adoption: 2, tech_revolution_speed: 30,
    industry_mix: { labor: 0.45, capital: 0.35, knowledge: 0.18, ai: 0.02 },
    global_trade: 40, geopolitical_risk: 30,
    currency_stability: 70, supply_chain: 50,
    global_demand: 70, usd_cycle: 70,
    edu_return: 20, edu_inflation: 1, skill_mismatch: 15,
    social_safety: 50, medical_system: 45,
    disaster_risk: 25, policy_stability: 80, reform_speed: 65,
  },
};

// ===== 5. 人物构建 =====
function buildPerson(opts) {
  const family = FAMILY_PRESETS[opts.family];
  const edu = EDUCATION_LEVELS[opts.education];
  return {
    name: opts.name,
    birth_year: opts.birth_year,
    education: opts.education,
    family: opts.family,
    // 个人特质
    iq: opts.iq,
    ambition: opts.ambition,
    discipline: opts.discipline,
    resilience: opts.resilience,
    social: opts.social,
    risk_tolerance: opts.risk_tolerance,
    health_baseline: opts.health_baseline,
    // 医疗
    medical_access: opts.medical_access + family.medical * 0.3,
    doctor_luck: opts.doctor_luck,
    heredity_risk: opts.heresy_risk || opts.heredity_risk || 30,
    // 计算派生
    family_wealth: family.wealth,
    family_social: family.social,
    education_hc: edu.human_capital + family.education_bonus,
    education_signal: edu.signal + family.education_bonus * 0.8,
    ai_risk_base: edu.ai_risk_base,
    health_literacy: edu.health_literacy,
    inheritance: family.inheritance,
    strategy: opts.strategy || "hard",
  };
}

// ===== 6. 伪随机（可复现）=====
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ===== 7. 宏观引擎：逐年演化 =====
class MacroEngine {
  constructor(base, seed) {
    this.base = { ...base };
    this.current = { ...base, industry_mix: { ...base.industry_mix } };
    this.seed = seed;
    this.rand = mulberry32(seed);
    this.cycle_phase = 0; // 0繁荣 1过热 2衰退 3复苏
    this.years_in_phase = 0;
    this.year = base.scene_start;
    this.t = 0;
  }
  step() {
    this.t += 1;
    this.year += 1;

    // 经济周期：每 3-5 年切换
    this.years_in_phase += 1;
    if (this.years_in_phase >= 3 + Math.floor(this.rand() * 3)) {
      this.cycle_phase = (this.cycle_phase + 1) % 4;
      this.years_in_phase = 0;
    }
    const phase_mod = [
      { gdp: +1.2, unemp: -0.8, infl: +0.3, wage: +1.0, trade: +2 }, // 繁荣
      { gdp: +0.3, unemp: -0.4, infl: +2.5, wage: +1.5, trade: -1 }, // 过热
      { gdp: -2.5, unemp: +2.0, infl: -1.5, wage: -2.5, trade: -5 }, // 衰退
      { gdp: +1.5, unemp: -1.0, infl: +0.5, wage: +0.8, trade: +3 }, // 复苏
    ][this.cycle_phase];

    // 长期趋势（t 每年推进）
    const aging_trend = this.base.aging + this.t * 0.35;
    const ai_trend = Math.min(98, this.base.ai_adoption + this.t * 1.4);
    const urban_trend = Math.min(90, this.base.urbanization + this.t * 0.25);
    // 产业结构：劳动密集下降，AI密集上升
    const mix_t = Math.min(1, this.t / 50);
    const labor_share = Math.max(0.02, this.base.industry_mix.labor - mix_t * (this.base.industry_mix.labor * 0.8));
    const ai_share = Math.min(0.55, this.base.industry_mix.ai + mix_t * 0.40);
    const capital_share = Math.max(0.10, this.base.industry_mix.capital - mix_t * 0.15);
    const knowledge_share = 1 - labor_share - ai_share - capital_share;

    // 随机扰动
    const n = (vol) => (this.rand() - 0.5) * 2 * vol;
    const gdp = this.base.gdp_growth + phase_mod.gdp - this.t * 0.025 + n(1.2);
    const inflation = Math.max(-1, this.base.inflation + phase_mod.infl + n(1.0));
    const unemployment = Math.max(1.5, this.base.unemployment + phase_mod.unemp + n(0.9));
    const wage_growth = Math.max(-2, this.base.wage_growth + phase_mod.wage - this.t * 0.02 + n(1.0));
    const house_price = this.base.house_price_growth + phase_mod.gdp * 0.5 - this.t * 0.04 + n(2.0);
    const interest = this.base.interest + (inflation - 2) * 0.3;

    // 国际
    const global_trade = Math.max(20, Math.min(100, this.base.global_trade + phase_mod.trade + n(3)));
    const geo = Math.max(15, Math.min(95, this.base.geopolitical_risk + this.t * 0.08 + n(3)));
    const supply_chain = Math.max(25, Math.min(100, this.base.supply_chain - this.t * 0.05 + n(3)));
    const global_demand = Math.max(25, Math.min(100, this.base.global_demand + phase_mod.trade * 0.3 + n(2.5)));

    // 教育
    const edu_return = this.base.edu_return + (ai_trend - this.base.ai_adoption) * 0.08 + n(0.3);
    const edu_inflation = this.base.edu_inflation + this.t * 0.03 + n(0.2);
    const skill_mismatch = this.base.skill_mismatch + (ai_trend - this.base.ai_adoption) * 0.15 + n(1.5);

    // 偶发国际危机
    const crisis = this.rand() < 0.07;

    return {
      year: this.year,
      phase: ["繁荣", "过热", "衰退", "复苏"][this.cycle_phase],
      phase_idx: this.cycle_phase,
      gdp: round1(gdp),
      inflation: round1(inflation),
      unemployment: round1(unemployment),
      wage_growth: round1(wage_growth),
      house_price: round1(house_price),
      interest: round1(interest),
      aging: round1(aging_trend),
      urbanization: round1(urban_trend),
      ai_adoption: round1(ai_trend),
      industry_mix: {
        labor: +labor_share.toFixed(3),
        capital: +capital_share.toFixed(3),
        knowledge: +knowledge_share.toFixed(3),
        ai: +ai_share.toFixed(3),
      },
      global_trade: round1(global_trade),
      geopolitical_risk: round1(geo),
      supply_chain: round1(supply_chain),
      global_demand: round1(global_demand),
      edu_return: round1(edu_return),
      edu_inflation: round1(edu_inflation),
      skill_mismatch: round1(skill_mismatch),
      social_safety: round1(this.base.social_safety),
      medical_system: round1(this.base.medical_system),
      policy_stability: round1(this.base.policy_stability),
      gini: round1(this.base.gini + this.t * 0.05),
      crisis,
    };
  }
}
function round1(x) { return Math.round(x * 10) / 10; }

// ===== 8. 主模拟器 =====
class FateSimulator {
  constructor(person, macro_base, seed) {
    this.person = person;
    this.macro_base = macro_base;
    this.seed = seed || 2025;
    this.strategy = STRATEGIES[person.strategy || "hard"];
    this.rand = mulberry32(this.seed + 17);
    this.history = [];
  }
  run() {
    const p = this.person;
    const macro = new MacroEngine(this.macro_base, this.seed);
    // 初始财富
    let wealth = (p.family_wealth || 30) * 3000 + (p.inheritance || 0) * 1000;
    let career_level = 15 + p.education_hc * 0.15;
    let health = p.health_baseline + p.medical_access * 0.05 - p.heredity_risk * 0.2;
    health = Math.min(100, Math.max(0, health));
    let social_cap = 20 + (p.family_social || 40) * 0.5 + p.social * 0.3;
    const start_age = Math.max(18, (this.macro_base.scene_start + 1) - p.birth_year);
    const end_age = 75;
    const events = [];

    for (let age = start_age; age <= end_age; age++) {
      const m = macro.step();
      const year = p.birth_year + age;

      // ===== 收入 =====
      // 基础工资（随 GDP/工资增长 累计）
      const yearFromStart = age - start_age;
      const wage_index = Math.pow(1 + m.wage_growth / 100, yearFromStart);
      const base_wage = 3600 * wage_index;

      // 教育溢价：人力资本 × 文凭信号 × 产业结构教育敏感度
      const ind_sensitivity =
        m.industry_mix.labor * 0.4 +
        m.industry_mix.capital * 0.9 +
        m.industry_mix.knowledge * 1.5 +
        m.industry_mix.ai * 1.9;
      const edu_mult = (p.education_hc / 50) * (p.education_signal / 50)
                      * ind_sensitivity * (m.edu_return / 10);

      // 个人努力
      const personal_mult =
        (p.iq / 60) * 0.2 +
        (p.ambition / 60) * 0.25 +
        (p.discipline / 60) * 0.25 +
        (p.social / 60) * 0.15 +
        (p.resilience / 60) * 0.15;
      const strat_effort = this.strategy.effort * (0.8 + p.ambition / 250);

      // 年龄曲线
      const age_curve = 0.6 + Math.exp(-Math.pow((age - 42) / 22, 2)) * 0.7;

      // 收入
      let income = base_wage * Math.max(0.3, edu_mult) * Math.max(0.4, personal_mult)
                  * strat_effort * age_curve * 12; // 年收入

      // 职业等级推进
      if (age < 62) {
        const promotion_rate = 0.05 * this.strategy.career * (p.ambition / 60)
                              * (1 + m.gdp / 10);
        career_level = Math.min(100, career_level + promotion_rate * 20);
        income *= (0.8 + career_level / 100);
      } else {
        career_level = Math.max(0, career_level - 1.2); // 退休后衰减
        income *= 0.6;
      }

      // ===== 失业与 AI 替代 =====
      let unemployed = false;
      // 失业率：基础失业率 × 学历脆弱性 × AI 替代
      const edu_guard = 1 - (p.education_signal / 100);
      const ai_risk = p.ai_risk_base * m.industry_mix.ai * (m.ai_adoption / 50);
      const personal_shield = (p.resilience + this.strategy.skill_upgrade * 40) / 150;
      const job_loss_prob = Math.min(0.6, (m.unemployment / 100)
                                        * (0.3 + edu_guard)
                                        * (0.8 + ai_risk / 100)
                                        - personal_shield * 0.15);
      if (this.rand() < job_loss_prob) {
        unemployed = true;
        income *= (0.15 + m.social_safety / 250);
        career_level = Math.max(0, career_level - 6);
        events.push({ age, year, type: "career", msg: "失业 / 职业危机" });
      }

      // AI 替代风险指数（用于显示）
      const ai_risk_index = Math.min(100,
        ai_risk + (m.skill_mismatch - 20) * 0.5 - p.education_hc * 0.3 - this.strategy.skill_upgrade * 20);

      // ===== 财富 =====
      const consumption = income * (1 - this.strategy.savings) + 18000;
      // 投资收益
      const cycle_factor = [1.15, 1.0, 0.70, 1.05][m.phase_idx];
      const real_return = (m.gdp / 10 + (m.interest - m.inflation) / 100)
                         * (0.4 + this.strategy.invest) * cycle_factor;
      // 高风险策略在衰退期大亏
      if (m.phase_idx === 2 && this.strategy.risk > 0.8) real_return -= 0.12;
      if (m.phase_idx === 0 && this.strategy.risk > 0.8) real_return += 0.10;
      wealth = Math.max(0, wealth * (1 + real_return) + income - consumption);

      // 继承（40 岁左右）
      if (age === 42 && p.inheritance > 0) {
        const inherit = p.inheritance * 10000 * (1 + m.gdp / 100);
        wealth += inherit;
        events.push({ age, year, type: "wealth", msg: `家庭资助 / 继承 ${Math.round(inherit)}` });
      }

      // 房产购置压力：30 岁前后
      if (age === 32) {
        const house_ratio = 1 - (p.family_wealth / 100) * 0.5;
        const debt = 800000 * house_ratio;
        wealth -= debt;
        events.push({ age, year, type: "wealth", msg: `买房 / 举债 -${Math.round(debt)}` });
      }

      // ===== 健康 =====
      const aging_penalty = age > 45 ? (age - 45) * 0.28 : 0;
      const work_strain = (1 - this.strategy.health_cost) * 3;
      health -= aging_penalty + work_strain;

      // 就医：每年一定概率有健康事件
      const health_event_prob = (age > 50 ? 0.12 : age > 40 ? 0.06 : 0.02)
                              + p.heredity_risk / 500;
      let health_event = null;
      if (this.rand() < health_event_prob) {
        // 严重程度由"就医条件"与"医生运气"决定
        const severity = Math.max(0, 8 - p.medical_access / 15 - p.doctor_luck / 25 - p.health_literacy / 30);
        health -= severity + this.rand() * 3;
        health_event = severity > 4 ? "大病/住院" : severity > 2 ? "慢性病加重" : "小病";
        events.push({ age, year, type: "health", msg: health_event + `（-${Math.round(severity + 2)} 健康点）` });
      }

      // 医疗体系兜底：medical_system 越高，健康缓慢恢复
      if (health < 60) {
        health += (m.medical_system / 200) * this.strategy.health_cost;
      }
      health = Math.min(100, Math.max(0, health + this.rand() * 2 - 1));

      // ===== 社交 =====
      social_cap = Math.min(100, social_cap + this.strategy.geo * 0.3 + p.social * 0.02);
      if (age === 28) events.push({ age, year, type: "career", msg: "建立家庭" });
      if (age === 55) events.push({ age, year, type: "career", msg: "中年转型 / 职业瓶颈" });
      if (m.crisis) events.push({ age, year, type: "crisis", msg: `国际/经济危机（${m.phase}）` });

      // ===== 幸福 =====
      const income_rank = Math.min(1, income / 180000);
      const happiness =
        income_rank * 25 +
        (career_level / 100) * 15 +
        (health / 100) * 25 +
        (social_cap / 100) * 15 +
        Math.min(1, m.social_safety / 100) * 10 +
        (1 - m.geopolitical_risk / 120) * 10;

      // ===== 存入 =====
      this.history.push({
        age, year,
        phase: m.phase,
        income: Math.round(income),
        wealth: Math.round(wealth),
        career: round1(career_level),
        health: round1(health),
        social: round1(social_cap),
        happy: round1(happiness),
        ai_risk: round1(Math.max(0, ai_risk_index)),
        unemployment: m.unemployment,
        gdp: m.gdp,
        inflation: m.inflation,
        ai_adoption: m.ai_adoption,
        unemployed,
        crisis: m.crisis,
      });
    }

    // 汇总
    const total_income = this.history.reduce((a, b) => a + b.income, 0);
    const peak_wealth = this.history.reduce((m, x) => x.wealth > m ? x.wealth : m, 0);
    const unemp_years = this.history.filter(x => x.unemployed).length;
    const avg_happy = this.history.reduce((a, b) => a + b.happy, 0) / this.history.length;
    const mid_ai = this.history.filter(x => x.age >= 40 && x.age <= 55)
                   .reduce((a, b) => a + b.ai_risk, 0)
                   / Math.max(1, this.history.filter(x => x.age >= 40 && x.age <= 55).length);

    return {
      person: p,
      history: this.history,
      summary: {
        name: p.name,
        strategy: this.strategy.name,
        education: p.education,
        family: p.family,
        total_income: Math.round(total_income),
        final_wealth: Math.round(this.history[this.history.length - 1].wealth),
        peak_wealth: Math.round(peak_wealth),
        avg_happiness: round1(avg_happy),
        final_health: round1(this.history[this.history.length - 1].health),
        unemployment_years: unemp_years,
        mid_ai_risk: round1(mid_ai),
        events: events.slice(0, 40),
      }
    };
  }
}

// ===== 9. 构建人物（从表单） =====
function personFromForm() {
  return buildPerson({
    name: document.getElementById("in-name").value || "某人",
    birth_year: +document.getElementById("in-birth").value,
    education: document.getElementById("in-edu").value,
    family: document.getElementById("in-family").value,
    iq: +document.getElementById("in-iq").value,
    ambition: +document.getElementById("in-ambition").value,
    discipline: +document.getElementById("in-discipline").value,
    resilience: +document.getElementById("in-resilience").value,
    social: +document.getElementById("in-social").value,
    risk_tolerance: +document.getElementById("in-risk").value,
    health_baseline: +document.getElementById("in-h0").value,
    medical_access: +document.getElementById("in-medical").value,
    doctor_luck: +document.getElementById("in-luck-doctor").value,
    heredity_risk: +document.getElementById("in-heredity").value,
    strategy: document.getElementById("in-strategy").value,
  });
}

// ===== 10. 宏观参数从表单 =====
function macroFromForm() {
  const sceneKey = document.getElementById("in-scene").value;
  const base = sceneKey === "cn_custom"
    ? { ...MACRO_SCENES.cn2025 }
    : { ...MACRO_SCENES[sceneKey] };

  // 如果是自定义场景，覆盖为表单值
  const overrides = {
    gdp_growth: +document.getElementById("in-gdp").value,
    inflation: +document.getElementById("in-inflation").value,
    unemployment: +document.getElementById("in-unemp").value,
    wage_growth: +document.getElementById("in-wage").value,
    house_price_growth: +document.getElementById("in-house").value,
    ai_adoption: +document.getElementById("in-ai").value,
    aging: +document.getElementById("in-ageing").value,
    social_safety: +document.getElementById("in-safety").value,
    edu_return: +document.getElementById("in-eduret").value,
    edu_inflation: +document.getElementById("in-edudec").value,
    gini: +document.getElementById("in-gini").value,
    policy_stability: +document.getElementById("in-policy").value,
    geopolitical_risk: +document.getElementById("in-geo").value,
    medical_system: +document.getElementById("in-medicalsys").value,
  };
  Object.assign(base, overrides);
  return base;
}

// ===== 11. Chart.js 图表 =====
const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#c0c4f0", font: { size: 11 } } },
    tooltip: { mode: "index", intersect: false },
  },
  interaction: { mode: "index", intersect: false },
  scales: {
    x: { ticks: { color: "#8888a8", font: { size: 10 } }, grid: { color: "rgba(59,59,122,0.3)" } },
    y: { ticks: { color: "#8888a8", font: { size: 10 } }, grid: { color: "rgba(59,59,122,0.3)" } },
  },
  elements: { point: { radius: 1.5, hoverRadius: 4 }, line: { borderWidth: 2, tension: 0.3 } },
};

const COLORS = {
  gold: "#ffd700",
  pink: "#ff6b9d",
  blue: "#4fd1ff",
  purple: "#c06cff",
  green: "#8bffa8",
  orange: "#ffa84f",
  white: "#e4e6ff",
};

let charts = {};

function ensureChart(id, datasets, labels) {
  if (charts[id]) {
    charts[id].data.datasets = datasets;
    if (labels) charts[id].data.labels = labels;
    charts[id].update();
    return;
  }
  const ctx = document.getElementById(id).getContext("2d");
  charts[id] = new Chart(ctx, {
    type: "line",
    data: { labels: labels || [], datasets },
    options: chartOpts,
  });
}

function makeDataset(label, values, color, fill) {
  return {
    label,
    data: values,
    borderColor: color,
    backgroundColor: fill ? color + "33" : "transparent",
    fill: !!fill,
    tension: 0.3,
  };
}

// ===== 12. 渲染 =====
function runSingle() {
  const person = personFromForm();
  const macro = macroFromForm();
  const sim = new FateSimulator(person, macro, 2025);
  const result = sim.run();
  const h = result.history;
  const ages = h.map(x => x.age);

  // 主图表
  const wealth_ds = [makeDataset("财富（元）", h.map(x => x.wealth), COLORS.gold, true)];
  ensureChart("chart-wealth", wealth_ds, ages);
  ensureChart("chart-career", [
    makeDataset("职业等级", h.map(x => x.career), COLORS.blue, true),
    makeDataset("年收入 / 1000", h.map(x => x.income / 1000), COLORS.pink),
  ], ages);
  ensureChart("chart-health", [
    makeDataset("健康", h.map(x => x.health), COLORS.green, true),
    makeDataset("幸福", h.map(x => x.happy), COLORS.gold),
  ], ages);
  ensureChart("chart-happy", [
    makeDataset("幸福感", h.map(x => x.happy), COLORS.pink, true),
    makeDataset("社交资本", h.map(x => x.social), COLORS.purple),
  ], ages);
  ensureChart("chart-ai", [
    makeDataset("AI 替代风险指数", h.map(x => x.ai_risk), COLORS.orange, true),
    makeDataset("失业率 (%)", h.map(x => x.unemployment), COLORS.pink),
  ], ages);
  ensureChart("chart-macro", [
    makeDataset("GDP 增速 (%)", h.map(x => x.gdp), COLORS.gold),
    makeDataset("通胀 (%)", h.map(x => x.inflation), COLORS.orange),
    makeDataset("AI 渗透率", h.map(x => x.ai_adoption), COLORS.purple),
  ], ages);

  // KPI
  document.getElementById("kpi-wealth").textContent = fmtMoney(result.summary.final_wealth);
  document.getElementById("kpi-wealth-peak").textContent = "峰值 " + fmtMoney(result.summary.peak_wealth);
  document.getElementById("kpi-happy").textContent = result.summary.avg_happiness;
  document.getElementById("kpi-happy-range").textContent = `终局健康 ${result.summary.final_health}`;
  document.getElementById("kpi-unemp").textContent = result.summary.unemployment_years + " 年";
  document.getElementById("kpi-unemp-sub").textContent = `策略: ${result.summary.strategy}`;
  document.getElementById("kpi-ai").textContent = result.summary.mid_ai_risk + "%";
  document.getElementById("kpi-ai-sub").textContent = `学历: ${result.summary.education}`;

  // 事件时间线
  const tl = document.getElementById("timeline");
  tl.innerHTML = "";
  const items = result.summary.events.slice(0, 20);
  if (items.length === 0) {
    tl.innerHTML = `<div class="timeline-item"><span class="year">—</span><span class="event">这一生较为平稳。尝试把 AI 渗透率拉到 80，看看会发生什么。</span></div>`;
  } else {
    items.forEach(e => {
      const row = document.createElement("div");
      row.className = "timeline-item " + e.type;
      const tag = { crisis: "危机", health: "健康", career: "职业", wealth: "财富" }[e.type] || "事件";
      row.innerHTML = `<span class="year">${e.age}岁(${e.year})</span><span class="tag">${tag}</span><span class="event">${e.msg}</span>`;
      tl.appendChild(row);
    });
  }

  return { person, macro, result };
}

function fmtMoney(n) {
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(1) + " 亿";
  if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(0) + " 万";
  return Math.round(n).toString();
}

// ===== 13. 策略对比 =====
function runStrategyCompare() {
  const person = personFromForm();
  const macro = macroFromForm();
  const results = [];
  for (const key of Object.keys(STRATEGIES)) {
    const p = { ...person, strategy: key };
    const sim = new FateSimulator(p, macro, 2025 + key.length);
    const r = sim.run();
    results.push({ strategy: STRATEGIES[key].name, wealth: r.summary.final_wealth, happy: r.summary.avg_happiness, unemp: r.summary.unemployment_years });
  }
  const max_wealth = Math.max(...results.map(r => r.wealth), 1);

  // 高亮最优
  const best_wealth = results.reduce((m, r) => r.wealth > m.wealth ? r : m, results[0]);
  const best_happy = results.reduce((m, r) => r.happy > m.happy ? r : m, results[0]);

  const container = document.getElementById("strategy-compare");
  container.innerHTML = `<div class="strategy-row">
    <div>策略</div><div>终局财富（相对）</div><div class="num">幸福</div><div class="num">失业</div>
  </div>`;
  results.forEach(r => {
    const is_wealth_best = r.strategy === best_wealth.strategy;
    const is_happy_best = r.strategy === best_happy.strategy;
    const bar_class = is_wealth_best ? "bar" : (is_happy_best ? "bar blue" : "bar");
    const row = document.createElement("div");
    row.className = "strategy-row";
    row.innerHTML = `
      <div class="name">${r.strategy}${is_wealth_best ? " 💰" : ""}${is_happy_best ? " 😊" : ""}</div>
      <div class="bar-container"><div class="${bar_class}" style="width:${Math.round(r.wealth / max_wealth * 100)}%"></div></div>
      <div class="num">${r.happy.toFixed(0)}</div>
      <div class="num">${r.unemp}</div>
    `;
    container.appendChild(row);
  });

  // 在主图上叠加对比曲线（财富）
  const datasets = [];
  const colors = [COLORS.gold, COLORS.blue, COLORS.pink, COLORS.purple, COLORS.green];
  let i = 0;
  let labels = null;
  for (const key of Object.keys(STRATEGIES)) {
    const p = { ...person, strategy: key };
    const sim = new FateSimulator(p, macro, 2025);
    const r = sim.run();
    datasets.push(makeDataset(STRATEGIES[key].name, r.history.map(x => x.wealth), colors[i], i === 0));
    if (!labels) labels = r.history.map(x => x.age);
    i++;
  }
  ensureChart("chart-wealth", datasets, labels);
  // 幸福对比
  const h_ds = []; i = 0;
  let h_labels = null;
  for (const key of Object.keys(STRATEGIES)) {
    const p = { ...person, strategy: key };
    const sim = new FateSimulator(p, macro, 2025);
    const r = sim.run();
    h_ds.push(makeDataset(STRATEGIES[key].name, r.history.map(x => x.happy), colors[i], i === 2));
    if (!h_labels) h_labels = r.history.map(x => x.age);
    i++;
  }
  ensureChart("chart-happy", h_ds, h_labels);

  return results;
}

// ===== 14. 不同学历对比 =====
function runEducationTest() {
  const person = personFromForm();
  const macro = macroFromForm();
  const edus = ["文盲", "小学", "初中", "高中", "大专", "本科", "硕士", "博士"];
  const datasets = [];
  const colors = [COLORS.orange, COLORS.pink, COLORS.gold, COLORS.green, COLORS.blue, COLORS.purple, "#ffffff", "#ffe970"];
  let i = 0;
  let labels = null;
  for (const edu of edus) {
    const simulated = buildPerson({
      name: person.name, birth_year: person.birth_year, education: edu, family: person.family,
      iq: person.iq, ambition: person.ambition, discipline: person.discipline,
      resilience: person.resilience, social: person.social, risk_tolerance: person.risk_tolerance,
      health_baseline: person.health_baseline,
      medical_access: person.medical_access, doctor_luck: person.doctor_luck,
      heredity_risk: person.heredity_risk, strategy: "hard",
    });
    const sim = new FateSimulator(simulated, macro, 2026);
    const r = sim.run();
    datasets.push(makeDataset(edu, r.history.map(x => x.wealth), colors[i], i === 2));
    if (!labels) labels = r.history.map(x => x.age);
    i++;
  }
  ensureChart("chart-wealth", datasets, labels);

  // AI 风险按学历
  const ai_ds = []; i = 0;
  let ai_labels = null;
  for (const edu of edus) {
    const simulated = buildPerson({
      name: person.name, birth_year: person.birth_year, education: edu, family: person.family,
      iq: person.iq, ambition: person.ambition, discipline: person.discipline,
      resilience: person.resilience, social: person.social, risk_tolerance: person.risk_tolerance,
      health_baseline: person.health_baseline,
      medical_access: person.medical_access, doctor_luck: person.doctor_luck,
      heredity_risk: person.heredity_risk, strategy: "hard",
    });
    const sim = new FateSimulator(simulated, macro, 2026);
    const r = sim.run();
    ai_ds.push(makeDataset(edu, r.history.map(x => x.ai_risk), colors[i], false));
    if (!ai_labels) ai_labels = r.history.map(x => x.age);
    i++;
  }
  ensureChart("chart-ai", ai_ds, ai_labels);
}

// ===== 15. 事件绑定 & 初始化 =====
function bindRangeDisplay(id, outId) {
  const el = document.getElementById(id);
  const out = document.getElementById(outId);
  if (el && out) el.addEventListener("input", () => { out.textContent = el.value; });
}

// 场景预设变化时，把预设值填到滑块
function applySceneToForm(sceneKey) {
  if (sceneKey === "cn_custom") return;
  const scene = MACRO_SCENES[sceneKey];
  document.getElementById("in-gdp").value = scene.gdp_growth;
  document.getElementById("in-inflation").value = scene.inflation;
  document.getElementById("in-unemp").value = scene.unemployment;
  document.getElementById("in-wage").value = scene.wage_growth;
  document.getElementById("in-house").value = scene.house_price_growth;
  document.getElementById("in-ai").value = scene.ai_adoption;
  document.getElementById("in-ageing").value = scene.aging;
  document.getElementById("in-safety").value = scene.social_safety;
  document.getElementById("in-eduret").value = scene.edu_return;
  document.getElementById("in-edudec").value = scene.edu_inflation;
  document.getElementById("in-gini").value = scene.gini;
  document.getElementById("in-policy").value = scene.policy_stability;
  document.getElementById("in-geo").value = scene.geopolitical_risk;
  document.getElementById("in-medicalsys").value = scene.medical_system;
  // 更新显示
  document.querySelectorAll(".right-panel input[type=range]").forEach(r => {
    const out = document.getElementById("out-" + r.id.replace("in-", ""));
    if (out) out.textContent = r.value;
  });
}

function resetForm() {
  document.getElementById("in-name").value = "小明";
  document.getElementById("in-birth").value = 2007;
  document.getElementById("in-edu").value = "初中";
  document.getElementById("in-family").value = "普通";
  ["in-iq", "in-ambition", "in-discipline", "in-resilience"].forEach(id => document.getElementById(id).value = 60);
  document.getElementById("in-social").value = 55;
  document.getElementById("in-risk").value = 50;
  document.getElementById("in-h0").value = 75;
  document.getElementById("in-medical").value = 60;
  document.getElementById("in-luck-doctor").value = 50;
  document.getElementById("in-heredity").value = 30;
  document.getElementById("in-strategy").value = "hard";
  document.getElementById("in-scene").value = "cn2025";
  applySceneToForm("cn2025");
  document.querySelectorAll("input[type=range]").forEach(r => {
    const out = document.getElementById("out-" + r.id.replace("in-", ""));
    if (out) out.textContent = r.value;
  });
  document.getElementById("out-name").textContent = "小明";
  document.getElementById("out-birth").textContent = "2007";
  runSingle();
}

function init() {
  // 绑定所有 range 的显示
  ["iq", "ambition", "discipline", "resilience", "social", "risk",
   "h0", "medical", "luck-doctor", "heredity",
   "gdp", "inflation", "unemp", "wage", "house", "ai", "ageing",
   "safety", "eduret", "edudec", "gini", "policy", "geo", "medicalsys"
  ].forEach(k => {
    const el = document.getElementById("in-" + k);
    const out = document.getElementById("out-" + k);
    if (el && out) el.addEventListener("input", () => out.textContent = el.value);
  });
  document.getElementById("in-name").addEventListener("input", e =>
    document.getElementById("out-name").textContent = e.target.value);
  document.getElementById("in-birth").addEventListener("input", e =>
    document.getElementById("out-birth").textContent = e.target.value);

  // 场景切换 → 填充
  document.getElementById("in-scene").addEventListener("change", e => {
    applySceneToForm(e.target.value);
  });

  // 按钮
  document.getElementById("btn-run").addEventListener("click", runSingle);
  document.getElementById("btn-compare").addEventListener("click", runStrategyCompare);
  document.getElementById("btn-edu-test").addEventListener("click", runEducationTest);
  document.getElementById("btn-reset").addEventListener("click", resetForm);

  // 首次运行
  applySceneToForm("cn2025");
  runSingle();
}

window.addEventListener("DOMContentLoaded", init);

// ============================================================
// 🔶 名人人生剧本分析模块
// ============================================================

const CELEBRITY_TEMPLATES = {
  zhoutao: {
    name: "周涛",
    birth_year: 1968,
    education: "硕士",
    field: "媒体/文艺",
    iq: 82, ambition: 88, discipline: 92, resilience: 88,
    social: 90, risk: 68, health0: 78,
    family_wealth: 65, family_social: 70,
    forks: [
      { title: "18 岁 · 上什么大学 / 去哪个城市",
        real_name: "考北广（中国传媒大学），去北京", real_strategy: "hard", real_edu: "硕士", real_field: "媒体/文艺",
        alt_name: "留在安徽本地，读师范/机关，做稳定工作", alt_strategy: "stable", alt_edu: "本科", alt_field: "教育" },
      { title: "24 岁 · 职业选择",
        real_name: "进北京电视台（BTV）做主持人", real_strategy: "hard", real_edu: "硕士", real_field: "媒体/文艺",
        alt_name: "去公安局做文职（铁饭碗，但天花板低）", alt_strategy: "stable", alt_edu: "本科", alt_field: "公务员" },
      { title: "30 岁 · 平台跃迁",
        real_name: "跳央视，主持《综艺大观》，登春晚", real_strategy: "hard", real_edu: "硕士", real_field: "媒体/文艺",
        alt_name: "留守北京电视台，稳做地方台一姐", alt_strategy: "balanced", alt_edu: "硕士", alt_field: "媒体/文艺" },
      { title: "35-45 岁 · 婚姻与职业进阶",
        real_name: "离婚再婚，转管理岗（央视文艺中心副主任）", real_strategy: "hard", real_edu: "硕士", real_field: "媒体/文艺",
        alt_name: "维持第一段婚姻，只做主持人到退休", alt_strategy: "balanced", alt_edu: "硕士", alt_field: "媒体/文艺" },
      { title: "48 岁 · 是否离开体制",
        real_name: "离开央视，转北京演艺集团，再转保利演出", real_strategy: "hard", real_edu: "硕士", real_field: "媒体/文艺",
        alt_name: "留在央视做副主任到退休，稳而保守", alt_strategy: "stable", alt_edu: "硕士", alt_field: "媒体/文艺" },
      { title: "55 岁+ · 是否激进转型艺人",
        real_name: "适度主持 + 管理，偶尔上综艺", real_strategy: "balanced", real_edu: "硕士", real_field: "媒体/文艺",
        alt_name: "全面转型演员/综艺，大胆市场化", alt_strategy: "radical", alt_edu: "硕士", alt_field: "媒体/文艺" },
    ],
  },
  dongmingzhu: {
    name: "董明珠",
    birth_year: 1954,
    education: "本科",
    field: "制造/实业",
    iq: 85, ambition: 95, discipline: 95, resilience: 92,
    social: 82, risk: 75, health0: 75,
    family_wealth: 35, family_social: 35,
    forks: [
      { title: "30 岁 · 婚姻变故后的职业选择",
        real_name: "南下珠海，进格力做销售", real_strategy: "hard", real_edu: "本科", real_field: "制造/实业",
        alt_name: "留在南京，做普通行政/稳定工作", alt_strategy: "stable", alt_edu: "本科", alt_field: "公务员" },
      { title: "40 岁 · 是否接下销售重担",
        real_name: "独闯安徽市场，做销售员→销售经理", real_strategy: "hard", real_edu: "本科", real_field: "制造/实业",
        alt_name: "回格力总部做行政/后勤，安稳度日", alt_strategy: "stable", alt_edu: "本科", real_field: "制造/实业" },
      { title: "50 岁 · 是否接任总经理",
        real_name: "接任总经理，全面接管格力经营", real_strategy: "hard", real_edu: "本科", real_field: "制造/实业",
        alt_name: "退居二线做副总是不是更稳？", alt_strategy: "balanced", alt_edu: "本科", alt_field: "制造/实业" },
      { title: "60 岁 · 是否坚持做制造业",
        real_name: "坚持深耕空调制造，打造品牌", real_strategy: "hard", real_edu: "本科", real_field: "制造/实业",
        alt_name: "转型房地产/金融赚快钱", alt_strategy: "radical", alt_edu: "本科", alt_field: "房地产" },
      { title: "65+ 岁 · 是否退休交班",
        real_name: "继续掌舵，亲力亲为", real_strategy: "hard", real_edu: "本科", real_field: "制造/实业",
        alt_name: "退休，交给职业经理人", alt_strategy: "stable", alt_edu: "本科", alt_field: "制造/实业" },
    ],
  },
  mayun: {
    name: "马云",
    birth_year: 1964,
    education: "本科",
    field: "互联网/科技",
    iq: 80, ambition: 95, discipline: 85, resilience: 95,
    social: 95, risk: 90, health0: 75,
    family_wealth: 40, family_social: 50,
    forks: [
      { title: "20 岁 · 高考三次，坚持还是放弃",
        real_name: "坚持考大学，最终上杭州师范学院", real_strategy: "hard", real_edu: "本科", real_field: "教育",
        alt_name: "放弃高考，做小生意/体力活", alt_strategy: "stable", alt_edu: "高中", alt_field: "消费/零售" },
      { title: "30 岁 · 是否辞职创业",
        real_name: "从大学辞职，创办海博翻译社，再去美国接触互联网", real_strategy: "hard", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "留在大学做老师，安稳一生", alt_strategy: "stable", alt_edu: "本科", alt_field: "教育" },
      { title: "35 岁 · 是否放弃做中国黄页",
        real_name: "离开中国黄页，去北京外经贸部做网站", real_strategy: "hard", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "死守中国黄页，坚持一个模式", alt_strategy: "stable", alt_edu: "本科", alt_field: "互联网/科技" },
      { title: "40 岁 · 是否回杭州创办阿里巴巴",
        real_name: "回杭州，18 人团队 + 50 万起步，创办阿里巴巴", real_strategy: "radical", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "留在北京做外经贸部项目，稳定", alt_strategy: "stable", alt_edu: "本科", alt_field: "互联网/科技" },
      { title: "50 岁 · 是否激进扩张金融/云",
        real_name: "做大支付宝 → 蚂蚁集团，布局云计算", real_strategy: "radical", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "只做电商主业，保守稳健", alt_strategy: "stable", alt_edu: "本科", alt_field: "互联网/科技" },
      { title: "55+ 岁 · 是否退休做教育/公益",
        real_name: "退休，做教育和公益", real_strategy: "balanced", real_edu: "本科", real_field: "教育",
        alt_name: "继续当 CEO，激进扩张到全球", alt_strategy: "radical", alt_edu: "本科", alt_field: "互联网/科技" },
    ],
  },
  zhangyiming: {
    name: "张一鸣",
    birth_year: 1983,
    education: "本科",
    field: "互联网/科技",
    iq: 95, ambition: 92, discipline: 90, resilience: 90,
    social: 78, risk: 88, health0: 78,
    family_wealth: 45, family_social: 40,
    forks: [
      { title: "22 岁 · 大学毕业后去哪儿",
        real_name: "不考研，直接加入创业公司（酷讯）", real_strategy: "hard", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "考公务员/进国企，稳", alt_strategy: "stable", alt_edu: "本科", alt_field: "公务员" },
      { title: "26 岁 · 是否独立创业",
        real_name: "创办九九房（房产搜索）", real_strategy: "hard", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "留在大公司（比如百度）做工程师慢慢晋升", alt_strategy: "stable", alt_edu: "本科", alt_field: "互联网/科技" },
      { title: "28 岁 · 是否离开九九房，做新方向",
        real_name: "做内涵段子/今日头条", real_strategy: "radical", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "死守九九房房产搜索", alt_strategy: "stable", alt_edu: "本科", alt_field: "互联网/科技" },
      { title: "32 岁 · 是否all-in 短视频",
        real_name: "all-in 抖音/短视频，与腾讯系竞争", real_strategy: "radical", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "只做今日头条图文，稳定现金牛", alt_strategy: "stable", alt_edu: "本科", alt_field: "互联网/科技" },
      { title: "37 岁 · 是否退休卸任 CEO",
        real_name: "卸任 CEO，做长远战略/研究", real_strategy: "balanced", real_edu: "本科", real_field: "互联网/科技",
        alt_name: "继续做 CEO，激进全球化/AI 扩张", alt_strategy: "radical", alt_edu: "本科", alt_field: "互联网/科技" },
    ],
  },
};

let forkCount = 0; // 记录当前岔路口数量

function addForkUI(forkData) {
  const container = document.getElementById("forks-container");
  const idx = forkCount++;
  const div = document.createElement("div");
  div.className = "fork-card";
  div.dataset.forkIdx = idx;
  div.innerHTML = `
    <h4>第 ${idx + 1} 个岔路口</h4>
    <div class="field"><label>岔路口标题（如：30 岁 · 去北京还是留上海）</label>
      <input type="text" class="fork-title" value="${forkData ? forkData.title : ""}"></div>
    <div class="fork-path real">
      <div class="label">⭐ 实际走的路（他选了什么）</div>
      <input type="text" class="fork-real-name" placeholder="路径名称" value="${forkData ? forkData.real_name : ""}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <select class="fork-real-strategy">
          <option value="stable">稳定保守</option>
          <option value="hard" selected>努力奋斗</option>
          <option value="radical">激进冒险</option>
          <option value="balanced">平衡生活</option>
          <option value="lieflat">躺平低欲望</option>
        </select>
        <select class="fork-real-field">
          <option value="媒体/文艺">媒体/文艺</option><option value="制造/实业">制造/实业</option>
          <option value="互联网/科技">互联网/科技</option><option value="金融">金融</option>
          <option value="学术/科研">学术/科研</option><option value="医疗">医疗</option>
          <option value="教育">教育</option><option value="房地产">房地产</option>
          <option value="公务员">公务员</option><option value="消费/零售">消费/零售</option>
        </select>
      </div>
    </div>
    <div class="fork-path alt">
      <div class="label">💭 另一条可选的路（他没走的）</div>
      <input type="text" class="fork-alt-name" placeholder="路径名称" value="${forkData ? forkData.alt_name : ""}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <select class="fork-alt-strategy">
          <option value="stable" selected>稳定保守</option>
          <option value="hard">努力奋斗</option>
          <option value="radical">激进冒险</option>
          <option value="balanced">平衡生活</option>
          <option value="lieflat">躺平低欲望</option>
        </select>
        <select class="fork-alt-field">
          <option value="媒体/文艺">媒体/文艺</option><option value="制造/实业">制造/实业</option>
          <option value="互联网/科技">互联网/科技</option><option value="金融">金融</option>
          <option value="学术/科研">学术/科研</option><option value="医疗">医疗</option>
          <option value="教育">教育</option><option value="房地产">房地产</option>
          <option value="公务员">公务员</option><option value="消费/零售">消费/零售</option>
        </select>
      </div>
    </div>
  `;
  container.appendChild(div);
  // 设置默认选中值
  if (forkData) {
    div.querySelector(".fork-real-strategy").value = forkData.real_strategy;
    div.querySelector(".fork-real-field").value = forkData.real_field;
    div.querySelector(".fork-alt-strategy").value = forkData.alt_strategy;
    div.querySelector(".fork-alt-field").value = forkData.alt_field;
  }
}

function removeLastFork() {
  const container = document.getElementById("forks-container");
  if (container.children.length > 1) container.removeChild(container.lastChild);
}

function clearAllForks() {
  document.getElementById("forks-container").innerHTML = "";
  forkCount = 0;
}

function loadTemplate(key) {
  const t = CELEBRITY_TEMPLATES[key];
  if (!t) return;
  document.getElementById("celeb-name").value = t.name;
  document.getElementById("celeb-birth").value = t.birth_year;
  document.getElementById("celeb-edu").value = t.education;
  document.getElementById("celeb-field").value = t.field;
  document.getElementById("celeb-iq").value = t.iq;
  document.getElementById("celeb-ambition").value = t.ambition;
  document.getElementById("celeb-discipline").value = t.discipline;
  document.getElementById("celeb-resilience").value = t.resilience;
  document.getElementById("celeb-social").value = t.social;
  document.getElementById("celeb-risk").value = t.risk;
  document.getElementById("celeb-h0").value = t.health0;
  document.getElementById("celeb-fw").value = t.family_wealth;
  document.getElementById("celeb-fs").value = t.family_social;

  // 同步显示
  ["name", "birth", "iq", "ambition", "discipline", "resilience", "social", "risk", "h0", "fw", "fs"]
    .forEach(k => {
      const el = document.getElementById("celeb-" + k);
      const out = document.getElementById("celeb-out-" + k);
      if (out && el) out.textContent = el.value;
    });

  clearAllForks();
  t.forks.forEach(f => addForkUI(f));
}

function readCelebrityFromForm() {
  const base = {
    name: document.getElementById("celeb-name").value || "某人",
    birth_year: parseInt(document.getElementById("celeb-birth").value) || 1970,
    education: document.getElementById("celeb-edu").value,
    field: document.getElementById("celeb-field").value,
    iq: parseFloat(document.getElementById("celeb-iq").value),
    ambition: parseFloat(document.getElementById("celeb-ambition").value),
    discipline: parseFloat(document.getElementById("celeb-discipline").value),
    resilience: parseFloat(document.getElementById("celeb-resilience").value),
    social: parseFloat(document.getElementById("celeb-social").value),
    risk: parseFloat(document.getElementById("celeb-risk").value),
    health0: parseFloat(document.getElementById("celeb-h0").value),
    family_wealth: parseFloat(document.getElementById("celeb-fw").value),
    family_social: parseFloat(document.getElementById("celeb-fs").value),
  };

  const forks = [];
  document.querySelectorAll(".fork-card").forEach(card => {
    forks.push({
      title: card.querySelector(".fork-title").value || "岔路口",
      real_name: card.querySelector(".fork-real-name").value || "实际路径",
      real_strategy: card.querySelector(".fork-real-strategy").value,
      real_field: card.querySelector(".fork-real-field").value,
      alt_name: card.querySelector(".fork-alt-name").value || "对比路径",
      alt_strategy: card.querySelector(".fork-alt-strategy").value,
      alt_field: card.querySelector(".fork-alt-field").value,
    });
  });
  return { base, forks };
}

function buildCelebPerson(base, strategy, field, education) {
  // 名人信息 -> buildPerson 的参数格式
  return buildPerson({
    name: base.name,
    birth_year: base.birth_year,
    education: education || base.education,
    family: "中产", // 名人默认用中产家庭起点（可在 base 中调整）
    // 个人特质
    iq: base.iq,
    ambition: base.ambition,
    discipline: base.discipline,
    resilience: base.resilience,
    social: base.social,
    risk_tolerance: base.risk,
    health_baseline: base.health0,
    // 医疗
    medical_access: 70,
    doctor_luck: 60,
    heredity_risk: 30,
    // 人生策略
    strategy: strategy || "hard",
  });
}

function scoreResult(summary, history) {
  // 综合得分：幸福 40% + 职业 30% + 财富 20% + 健康 10%
  const happy = summary.avg_happiness;
  const career = history[history.length - 1].career;
  const wealth = Math.min(100, Math.log10(Math.max(1, summary.final_wealth)) * 12);
  const health = summary.final_health;
  const total = happy * 0.4 + career * 0.3 + wealth * 0.2 + health * 0.1;
  return { happy, career, wealth, health, total: Math.max(0, Math.min(100, total)) };
}

function runCelebrityAnalysis() {
  const { base, forks } = readCelebrityFromForm();
  if (forks.length === 0) {
    alert("请先添加至少一个人生岔路口");
    return;
  }

  // 为每个岔路口构建两条路径
  const scenarios = []; // {name, person, is_real, fork_idx, is_alt}
  // 也构建一个"全局最优路径"：所有都选最好的策略

  // 为所有岔路口分别模拟
  forks.forEach((f, i) => {
    // 实际路径（base + 她选的 strategy/field）
    const pReal = buildCelebPerson(base, f.real_strategy, f.real_field, base.education);
    pReal.name = f.real_name;
    scenarios.push({ fork_idx: i, fork_title: f.title, name: "⭐ " + f.real_name, person: pReal, is_real: true });

    // 对比路径
    const pAlt = buildCelebPerson(base, f.alt_strategy, f.alt_field, base.education);
    pAlt.name = f.alt_name;
    scenarios.push({ fork_idx: i, fork_title: f.title, name: "💭 " + f.alt_name, person: pAlt, is_real: false });
  });

  // 跑模拟
  const macro = macroFromForm();
  const results = scenarios.map((sc, i) => {
    const sim = new FateSimulator(sc.person, macro, 1950 + i);
    const result = sim.run();
    const scored = scoreResult(result.summary, result.history);
    return { ...sc, result, scored };
  });

  // 渲染结果
  renderCelebrityResult(base, forks, results);
}

function renderCelebrityResult(base, forks, results) {
  const resultDiv = document.getElementById("celeb-result");
  resultDiv.style.display = "block";

  // 全量路径按 total 排序
  const sorted = results.slice().sort((a, b) => b.scored.total - a.scored.total);
  const realPaths = results.filter(r => r.is_real);
  const avg_real_score = realPaths.reduce((s, r) => s + r.scored.total, 0) / realPaths.length;
  // 真实路径排名：取所有 real 路径中最好的排名
  const best_real_score = Math.max(...realPaths.map(r => r.scored.total));
  const real_rank = sorted.findIndex(r => r.is_real && r.scored.total === best_real_score) + 1;

  // 正确选择率
  let correct = 0, total_forks = forks.length;
  const fork_analysis = [];
  for (let i = 0; i < total_forks; i++) {
    const pair = results.filter(r => r.fork_idx === i);
    if (pair.length < 2) continue;
    const real = pair.find(r => r.is_real);
    const alt = pair.find(r => !r.is_real);
    const diff = real.scored.total - alt.scored.total;
    let verdict = "correct";
    if (diff > 3) verdict = "correct";
    else if (diff < -3) verdict = "wrong";
    else verdict = "neutral";

    if (verdict === "correct") correct += 1;
    else if (verdict === "wrong") correct += 0;
    else correct += 0.5;
    fork_analysis.push({ fork: forks[i], real, alt, verdict, diff });
  }
  const correct_rate = (correct / total_forks * 100).toFixed(0);

  // KPI
  document.getElementById("celeb-kpi-rank").textContent = "第 " + real_rank + " 名";
  document.getElementById("celeb-kpi-rank-sub").textContent = "共 " + sorted.length + " 条路径";
  document.getElementById("celeb-kpi-score").textContent = avg_real_score.toFixed(1);
  document.getElementById("celeb-kpi-rate").textContent = correct_rate + "%";
  document.getElementById("celeb-kpi-rate-sub").textContent = "（" + correct + " / " + total_forks + " 个关键分岔）";

  // 排名表
  const rankingDiv = document.getElementById("celeb-ranking");
  let html = `<div class="ranking-row header"><div>名次</div><div>路径</div><div class="num">综合</div><div class="num">幸福</div><div class="num">职业</div><div class="num">健康</div></div>`;
  sorted.forEach((r, i) => {
    const cls = (r.scored.total === sorted[0].scored.total) ? "best" : (r.is_real ? "real" : "");
    html += `<div class="ranking-row ${cls}"><div class="rank">${i + 1}</div>
      <div class="path-name">${r.is_real ? "<span class='tag-mini'>⭐ 真实路径</span>" : ""} ${r.name}<br><span style='font-size:11px;color:#a0a4ff'>岔口：${r.fork_title}</span></div>
      <div class="num"><b style='color:#ffd700'>${r.scored.total.toFixed(1)}</b></div>
      <div class="num">${r.scored.happy.toFixed(0)}</div>
      <div class="num">${r.scored.career.toFixed(0)}</div>
      <div class="num">${r.scored.health.toFixed(0)}</div></div>`;
  });
  rankingDiv.innerHTML = html;

  // 每个岔路口的分析
  const forksDiv = document.getElementById("celeb-forks");
  html = "";
  fork_analysis.forEach(fa => {
    const badge = fa.verdict === "correct" ? '<span class="badge ok">✅ 她选对了</span>' :
                  fa.verdict === "wrong" ? '<span class="badge bad">❌ 另一条更好</span>' :
                  '<span class="badge meh">➖ 差不多</span>';
    html += `<div class="fork-result ${fa.verdict}">
      <div class="title">${fa.fork.title} ${badge}</div>
      <div class="desc">对比两条路的综合得分：</div>
      <div class="compare-line">⭐ 她实际走的：<b>${fa.real.name}</b> → 综合 <b style="color:#ffd700">${fa.real.scored.total.toFixed(1)}</b>（幸福 ${fa.real.scored.happy.toFixed(0)}，职业 ${fa.real.scored.career.toFixed(0)}）</div>
      <div class="compare-line">💭 她没走的：<b>${fa.alt.name}</b> → 综合 <b style="color:#4fd1ff">${fa.alt.scored.total.toFixed(1)}</b>（幸福 ${fa.alt.scored.happy.toFixed(0)}，职业 ${fa.alt.scored.career.toFixed(0)}）</div>
      <div class="compare-line" style="margin-top:4px;color:${fa.diff > 0 ? '#ffd700' : (fa.diff < 0 ? '#ff6b9d' : '#a0a4ff')}">
        → 分差：${fa.diff > 0 ? "+" : ""}${fa.diff.toFixed(1)} 分（${fa.diff > 0 ? "她的选择更好" : (fa.diff < 0 ? "其实应该走另一条" : "两条差不多")}）
      </div>
    </div>`;
  });
  forksDiv.innerHTML = html;

  // 建议
  const adviceDiv = document.getElementById("celeb-advice");
  const wrong_forks = fork_analysis.filter(f => f.verdict === "wrong");
  const neutral_forks = fork_analysis.filter(f => f.verdict === "neutral");
  html = `<div class="advice-item"><strong>关于 ${base.name} 的人生剧本总结：</strong>
    在 ${total_forks} 个关键分岔点中，她的选择在 <b style="color:#ffd700">${correct_rate}%</b> 的时候是对的或有利的。
    综合得分 <b style="color:#ffd700">${avg_real_score.toFixed(1)}</b>，属于中上水平的人生剧本。</div>`;
  if (wrong_forks.length > 0) {
    html += `<div class="advice-item"><strong>⚠️ 模型认为，如果这样选会更好：</strong><br>`;
    wrong_forks.forEach(w => {
      html += `• 在 <b>${w.fork.title}</b> 时，如果选择「<b style="color:#4fd1ff">${w.alt.name}</b>」而不是「${w.real.name}」，综合得分会 <b style="color:#ff6b9d">+${(-w.diff).toFixed(1)}</b> 分<br>`;
    });
    html += `</div>`;
  }
  if (neutral_forks.length > 0) {
    html += `<div class="advice-item"><strong>💭 这几个岔路口，两条路差别不大：</strong><br>`;
    neutral_forks.forEach(n => {
      html += `• <b>${n.fork.title}</b>：两条路得分差距在 3 分以内，属于"怎么选都不亏"的节点。<br>`;
    });
    html += `</div>`;
  }

  // 全局最优路径 vs 她实际的路径差距
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  html += `<div class="advice-item"><strong>🏆 全局最优路径（得分最高的那一条）：</strong><br>
    「<b style="color:#ffd700">${best.name}</b>」综合 <b style="color:#ffd700">${best.scored.total.toFixed(1)}</b>（幸福 ${best.scored.happy.toFixed(0)}，职业 ${best.scored.career.toFixed(0)}）<br>
    <b>最差路径</b>：「${worst.name}」综合 ${worst.scored.total.toFixed(1)}<br>
    最优-最差点距 <b style="color:#ffd700">${(best.scored.total - worst.scored.total).toFixed(1)}</b> 分，说明她的时代窗口里，"选择"的权重很重要。</div>`;

  html += `<div class="advice-item"><strong>📖 最后解读（仅供模型娱乐，不要当真）：</strong><br>
    ${base.name} 的人生剧本里，她在 <b>去大城市 / 去大平台 / 在关键风口大胆决策</b> 这几件事上是典型的加分项；
    可能的遗憾点通常是 <b>在中年后是否足够激进地抓住新趋势</b>（这几乎是所有成功者的共同谜题——激进导致翻车还是保守导致错过？）。
    模型不是算命，关键是：人生最重要的不是手里的牌，而是每个关键岔路口的判断 —— 这个工具就是帮你看清"如果选另一条"会怎样。</div>`;
  adviceDiv.innerHTML = html;
}

// 名人模块的初始化 —— 加在原始 init 之后
document.addEventListener("DOMContentLoaded", function () {
  // 名人模块滑块显示同步
  ["iq", "ambition", "discipline", "resilience", "social", "risk", "h0", "fw", "fs"]
    .forEach(k => {
      const el = document.getElementById("celeb-" + k);
      const out = document.getElementById("celeb-out-" + k);
      if (el && out) {
        el.addEventListener("input", () => out.textContent = el.value);
      }
    });
  document.getElementById("celeb-name").addEventListener("input", e =>
    document.getElementById("celeb-out-name").textContent = e.target.value);
  document.getElementById("celeb-birth").addEventListener("input", e =>
    document.getElementById("celeb-out-birth").textContent = e.target.value);

  // 按钮绑定
  document.getElementById("btn-load-celeb").addEventListener("click", () => {
    const key = document.getElementById("celeb-template").value;
    if (key !== "custom") loadTemplate(key);
    else {
      // 自定义模式：清空后给一个空模板
      clearAllForks();
      for (let i = 0; i < 3; i++) addForkUI(null);
    }
  });
  document.getElementById("btn-clear-celeb").addEventListener("click", () => {
    clearAllForks();
    for (let i = 0; i < 3; i++) addForkUI(null);
  });
  document.getElementById("btn-add-fork").addEventListener("click", () => addForkUI(null));
  document.getElementById("btn-del-fork").addEventListener("click", removeLastFork);
  document.getElementById("btn-analyze-celeb").addEventListener("click", runCelebrityAnalysis);

  // 默认加载周涛
  loadTemplate("zhoutao");
});
