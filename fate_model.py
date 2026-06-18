"""
命运模型 v2 —— 「人放在真实的国家/国际宏观经济系统里」
===========================================================

核心方程（年度递归）：
  Income(t)  = base_wage(t) × edu_boost(t) × industry_cycle(t)
               × ambition × effort_strategy − inflation_penalty(t)
  Wealth(t)  = Wealth(t−1) × (1 + real_return(t)) + Income(t) − consumption(t)
  Career(t)  = Career(t−1) + promotion_chance(t) − obsolescence_risk(t)
  Happiness(t) = w_income × rank(Income) + w_health × Health + w_social × Social
               − w_uncertainty × macro_uncertainty(t)

关键增强（相对 v1）：
  1. COUNTRY 配置：每个国家有 GDP增速、通胀、失业率、产业结构、
     教育回报率曲线、社会保障强度、人口老龄化、科技 adoption
  2. ERA 轨迹：每一年的国家宏观状况在波动（繁荣→过热→衰退→复苏）
  3. INTERNATIONAL：全球贸易、地缘风险、美元周期、供应链冲击
  4. 学历价值子模型：初中/高中/本科/硕士 在 劳动密集/资本密集/
     知识密集 / AI密集 四个产业阶段的回报率完全不同
  5. 科技替代风险：AI adoption 越高，低学历岗位被替代概率越高
"""

import json
import math
import random
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple


# ============================================================
# 1. 学历体系（中国为主） —— 不同学历的"信号价值"和"人力资本"
# ============================================================
EDUCATION_LEVELS: Dict[str, Dict[str, float]] = {
    # base_human_capital: 基础人力资本（决定工资基数）
    # credential_signal:    文凭信号价值（决定入职门槛/晋升门槛通过概率）
    # resilience:           抗衰退能力（被裁员的难度倒数）
    # ai_risk_exposure:     被 AI 替代的暴露度（越高越危险）
    "文盲":    {"base_hc": 20, "signal": 10, "resilience": 30, "ai_risk": 90},
    "小学":    {"base_hc": 25, "signal": 15, "resilience": 35, "ai_risk": 88},
    "初中":    {"base_hc": 35, "signal": 25, "resilience": 45, "ai_risk": 82},
    "高中":    {"base_hc": 45, "signal": 40, "resilience": 55, "ai_risk": 72},
    "职高":    {"base_hc": 48, "signal": 42, "resilience": 60, "ai_risk": 68},
    "大专":    {"base_hc": 58, "signal": 55, "resilience": 65, "ai_risk": 60},
    "本科":    {"base_hc": 75, "signal": 78, "resilience": 75, "ai_risk": 45},
    "硕士":    {"base_hc": 90, "signal": 92, "resilience": 85, "ai_risk": 30},
    "博士":    {"base_hc": 100, "signal": 100, "resilience": 92, "ai_risk": 18},
}


# ============================================================
# 2. 产业阶段 —— 不同产业阶段对人力资本的定价完全不同
# ============================================================
INDUSTRY_STAGES: Dict[str, Dict[str, float]] = {
    # 权重越高，说明该产业阶段在国家 GDP 中占比越大
    # edu_sensitivity 越大 → 学历对收入的溢价越显著
    # ai_risk_factor   越大 → AI 浪潮对该产业工人的冲击越强
    "劳动密集": {"edu_sensitivity": 0.4, "ai_risk_factor": 1.2, "wage_growth": 0.5},
    "资本密集": {"edu_sensitivity": 0.8, "ai_risk_factor": 0.9, "wage_growth": 0.8},
    "知识密集": {"edu_sensitivity": 1.4, "ai_risk_factor": 0.6, "wage_growth": 1.2},
    "AI密集":   {"edu_sensitivity": 1.8, "ai_risk_factor": 1.5, "wage_growth": 1.8},
}


# ============================================================
# 3. 国家 / 时代配置 —— 核心！这是你要求的"国家宏观经济"部分
# ============================================================
@dataclass
class Country:
    name: str
    year_start: int = 2025
    year_end: int = 2065

    # 基础宏观经济参数（作为初始值，之后会随周期波动）
    gdp_growth: float = 5.0          # % GDP 年增速
    inflation: float = 2.5            # % CPI
    unemployment: float = 5.0         # % 失业率
    interest_rate: float = 3.5        # % 政策利率
    house_price_growth: float = 3.0   # % 房价年增速
    wage_growth: float = 4.0          # % 平均名义工资增速
    inequality_gini: float = 42.0     # 基尼系数（越高越不平等）

    # 产业结构（四个产业阶段占比，加起来=1）
    industry_mix: Dict[str, float] = field(default_factory=lambda: {
        "劳动密集": 0.20, "资本密集": 0.35, "知识密集": 0.35, "AI密集": 0.10
    })

    # 人口 / 社会 / 科技
    population_aging: float = 15.0    # 65岁以上人口占比 %
    birth_rate: float = 1.2            # 总和生育率
    urbanization: float = 65.0         # 城镇化率 %
    social_safety_net: float = 60.0    # 社会保障强度（失业救济/医保覆盖…）0-100
    ai_adoption: float = 30.0          # AI 在企业中渗透率 0-100
    tech_revolution_speed: float = 50.0  # 科技革命速度 0-100

    # 国际贸易 / 国际形势（0-100，越高越有利）
    global_trade_openness: float = 70.0  # 贸易开放度
    geopolitical_risk: float = 40.0      # 地缘政治风险（越高越差）
    currency_stability: float = 80.0     # 汇率稳定性
    supply_chain_integrity: float = 75.0 # 供应链完整性
    global_demand: float = 70.0          # 全球总需求
    usd_cycle: float = 50.0              # 美元周期（高=美元强，新兴市场承压）

    # 教育体系特征
    # edu_inflation：学历贬值速度（高=人人都有文凭，文凭就不值钱）
    # edu_return：教育投资的平均社会回报率（% per 额外一年教育）
    edu_inflation: float = 6.0
    edu_return: float = 10.0
    skill_mismatch: float = 30.0        # 技能与岗位错配率 %

    # 国家整体"风险/幸运"参数
    disaster_risk: float = 15.0         # 自然灾害/疫情/金融危机发生的基线 %
    policy_stability: float = 70.0      # 政策稳定性 0-100
    reform_speed: float = 40.0          # 改革速度 0-100

    def to_dict(self) -> Dict:
        return {k: getattr(self, k) for k in self.__dataclass_fields__}


# ============================================================
# 4. 预设国家 / 时代 —— 可直接调用
# ============================================================
def build_country(preset: str) -> Country:
    presets = {
        "中国2025": Country(
            name="中国2025", year_start=2025, year_end=2065,
            gdp_growth=4.5, inflation=2.5, unemployment=5.2,
            interest_rate=3.0, house_price_growth=1.5, wage_growth=4.5,
            inequality_gini=46.5,
            industry_mix={"劳动密集": 0.15, "资本密集": 0.38, "知识密集": 0.37, "AI密集": 0.10},
            population_aging=15.6, birth_rate=1.0, urbanization=67.0,
            social_safety_net=58.0, ai_adoption=35.0, tech_revolution_speed=60.0,
            global_trade_openness=65.0, geopolitical_risk=55.0,
            currency_stability=78.0, supply_chain_integrity=80.0,
            global_demand=68.0, usd_cycle=60.0,
            edu_inflation=7.0, edu_return=11.0, skill_mismatch=35.0,
            disaster_risk=18.0, policy_stability=75.0, reform_speed=45.0,
        ),
        "中国2035（AI高速发展）": Country(
            name="中国2035（AI高速发展）", year_start=2035, year_end=2075,
            gdp_growth=3.5, inflation=2.8, unemployment=7.0,
            interest_rate=2.5, house_price_growth=0.0, wage_growth=3.0,
            inequality_gini=50.0,
            industry_mix={"劳动密集": 0.08, "资本密集": 0.27, "知识密集": 0.35, "AI密集": 0.30},
            population_aging=25.0, birth_rate=0.9, urbanization=78.0,
            social_safety_net=65.0, ai_adoption=70.0, tech_revolution_speed=80.0,
            global_trade_openness=60.0, geopolitical_risk=60.0,
            currency_stability=75.0, supply_chain_integrity=70.0,
            global_demand=65.0, usd_cycle=55.0,
            edu_inflation=8.0, edu_return=14.0, skill_mismatch=45.0,
            disaster_risk=20.0, policy_stability=70.0, reform_speed=55.0,
        ),
        "日本1995（泡沫破裂+老龄化）": Country(
            name="日本1995（泡沫破裂+老龄化）", year_start=1995, year_end=2035,
            gdp_growth=0.8, inflation=0.3, unemployment=4.5,
            interest_rate=0.5, house_price_growth=-2.0, wage_growth=0.5,
            inequality_gini=38.0,
            industry_mix={"劳动密集": 0.10, "资本密集": 0.42, "知识密集": 0.40, "AI密集": 0.08},
            population_aging=14.0, birth_rate=1.4, urbanization=78.0,
            social_safety_net=80.0, ai_adoption=20.0, tech_revolution_speed=35.0,
            global_trade_openness=75.0, geopolitical_risk=35.0,
            currency_stability=85.0, supply_chain_integrity=75.0,
            global_demand=70.0, usd_cycle=50.0,
            edu_inflation=4.0, edu_return=8.0, skill_mismatch=25.0,
            disaster_risk=12.0, policy_stability=80.0, reform_speed=30.0,
        ),
        "美国2025": Country(
            name="美国2025", year_start=2025, year_end=2065,
            gdp_growth=2.2, inflation=3.0, unemployment=4.2,
            interest_rate=5.0, house_price_growth=4.0, wage_growth=3.5,
            inequality_gini=48.0,
            industry_mix={"劳动密集": 0.08, "资本密集": 0.25, "知识密集": 0.42, "AI密集": 0.25},
            population_aging=17.0, birth_rate=1.7, urbanization=83.0,
            social_safety_net=50.0, ai_adoption=60.0, tech_revolution_speed=75.0,
            global_trade_openness=60.0, geopolitical_risk=45.0,
            currency_stability=95.0, supply_chain_integrity=70.0,
            global_demand=75.0, usd_cycle=80.0,
            edu_inflation=7.5, edu_return=12.0, skill_mismatch=40.0,
            disaster_risk=16.0, policy_stability=60.0, reform_speed=35.0,
        ),
        "越南2025（追赶期人口红利）": Country(
            name="越南2025（追赶期人口红利）", year_start=2025, year_end=2065,
            gdp_growth=6.5, inflation=4.0, unemployment=2.5,
            interest_rate=6.0, house_price_growth=7.0, wage_growth=7.5,
            inequality_gini=39.0,
            industry_mix={"劳动密集": 0.35, "资本密集": 0.32, "知识密集": 0.25, "AI密集": 0.08},
            population_aging=8.0, birth_rate=2.0, urbanization=40.0,
            social_safety_net=40.0, ai_adoption=15.0, tech_revolution_speed=35.0,
            global_trade_openness=85.0, geopolitical_risk=40.0,
            currency_stability=65.0, supply_chain_integrity=65.0,
            global_demand=70.0, usd_cycle=60.0,
            edu_inflation=3.0, edu_return=15.0, skill_mismatch=50.0,
            disaster_risk=25.0, policy_stability=65.0, reform_speed=50.0,
        ),
    }
    return presets[preset]


# ============================================================
# 5. 宏观经济引擎 —— 让国家经济随时间"活"起来
# ============================================================
class MacroEngine:
    """模拟一个国家在 40-50 年尺度内的经济演变"""

    def __init__(self, country: Country, seed: int = 2025):
        self.country = country
        self.rng = random.Random(seed)
        self.t = 0
        # 经济周期相位（0繁荣/1过热/2衰退/3复苏），每 4-8 年切换
        self.cycle_phase = 0
        self.years_in_phase = 0
        self.history: List[Dict[str, float]] = []

    def _sample_shock(self, base: float, vol: float, floor: float = -100.0,
                     ceiling: float = 100.0) -> float:
        """围绕基准做随机扰动"""
        shock = self.rng.gauss(0, vol)
        return max(floor, min(ceiling, base + shock))

    def _advance_cycle(self) -> None:
        self.years_in_phase += 1
        # 每个相位持续 3-6 年
        if self.years_in_phase >= self.rng.randint(3, 6):
            self.cycle_phase = (self.cycle_phase + 1) % 4
            self.years_in_phase = 0

    def step(self) -> Dict[str, float]:
        """推进一年，返回当年的宏观经济快照"""
        c = self.country
        self._advance_cycle()
        phase_mods = {
            0: {"gdp": +1.2, "unemp": -0.8, "inflation": +0.3, "wage": +1.0, "trade": +2},
            1: {"gdp":  0.0, "unemp": -0.5, "inflation": +2.0, "wage": +1.5, "trade": -1},
            2: {"gdp": -2.5, "unemp": +2.0, "inflation": -1.5, "wage": -2.0, "trade": -5},
            3: {"gdp": +1.5, "unemp": -1.0, "inflation": +0.5, "wage": +0.5, "trade": +3},
        }[self.cycle_phase]

        year = c.year_start + self.t

        # ---- 结构性漂移（长期趋势，非周期）----
        # 人口老龄化上升、出生率下降、AI adoption上升、
        # 劳动密集→AI密集 产业升级、城镇化趋缓
        aging_trend = c.population_aging + self.t * 0.35
        birth_trend = max(0.8, c.birth_rate - self.t * 0.008)
        ai_trend = min(95.0, c.ai_adoption + self.t * 1.4)
        tech_trend = min(95.0, c.tech_revolution_speed + self.t * 0.6)
        urban_trend = min(90.0, c.urbanization + self.t * 0.25)

        # 产业结构随 AI adoption 升级
        labor_share = max(0.03, c.industry_mix["劳动密集"] - self.t * 0.004)
        ai_share = min(0.55, c.industry_mix["AI密集"] + self.t * 0.006)
        capital_share = c.industry_mix["资本密集"] - self.t * 0.001
        knowledge_share = 1.0 - labor_share - ai_share - capital_share
        industry_mix = {
            "劳动密集": labor_share, "资本密集": capital_share,
            "知识密集": max(0.05, knowledge_share), "AI密集": ai_share,
        }

        # ---- 周期波动 ----
        gdp = self._sample_shock(c.gdp_growth + phase_mods["gdp"] - self.t * 0.02, 1.5, -8, 15)
        inflation = self._sample_shock(c.inflation + phase_mods["inflation"], 1.0, -3, 12)
        unemployment = self._sample_shock(c.unemployment + phase_mods["unemp"], 1.0, 1.5, 15)
        wage_growth = self._sample_shock(c.wage_growth + phase_mods["wage"] - self.t * 0.015, 1.2, -4, 12)
        house_price = self._sample_shock(c.house_price_growth + phase_mods["gdp"] * 0.5 - self.t * 0.03, 2.0, -10, 15)

        # ---- 国际形势（部分独立于本国周期）----
        global_trade = self._sample_shock(c.global_trade_openness + phase_mods["trade"] - self.t * 0.05, 3.0, 20, 100)
        geopolitical = self._sample_shock(c.geopolitical_risk + self.t * 0.10, 4.0, 15, 95)
        currency_stab = self._sample_shock(c.currency_stability, 2.5, 30, 100)
        supply_chain = self._sample_shock(c.supply_chain_integrity - self.t * 0.05, 3.0, 25, 100)
        global_demand = self._sample_shock(c.global_demand + phase_mods["trade"] * 0.3, 2.5, 30, 100)
        usd = self._sample_shock(c.usd_cycle, 5.0, 20, 95)

        # ---- 教育回报的结构性变化 ----
        # 随 AI adoption 上升，学历溢价扩大（高学历受益、低学历受损）
        edu_return = c.edu_return + (ai_trend - c.ai_adoption) * 0.08 + self.rng.gauss(0, 0.3)
        edu_inflation = c.edu_inflation + self.t * 0.03 + self.rng.gauss(0, 0.2)
        skill_mismatch = c.skill_mismatch + (ai_trend - c.ai_adoption) * 0.15

        # ---- 偶发国际危机 —— 约每 15 年一次（贸易战/疫情/金融危机）----
        crisis_flag = False
        if self.rng.random() < 0.07:
            crisis_flag = True
            gdp -= 3.0; inflation += 2.0; unemployment += 2.0
            global_demand -= 10.0; supply_chain -= 15.0; geopolitical += 15.0

        snapshot = {
            "year": year,
            "phase": {0: "繁荣", 1: "过热", 2: "衰退", 3: "复苏"}[self.cycle_phase],
            "gdp_growth": round(gdp, 2),
            "inflation": round(inflation, 2),
            "unemployment": round(unemployment, 2),
            "wage_growth": round(wage_growth, 2),
            "house_price_growth": round(house_price, 2),
            "interest_rate": round(c.interest_rate + (inflation - 2.0) * 0.3, 2),
            "population_aging": round(aging_trend, 2),
            "birth_rate": round(birth_trend, 2),
            "urbanization": round(urban_trend, 2),
            "ai_adoption": round(ai_trend, 2),
            "tech_revolution_speed": round(tech_trend, 2),
            "industry_mix": {k: round(v, 3) for k, v in industry_mix.items()},
            "global_trade_openness": round(global_trade, 2),
            "geopolitical_risk": round(geopolitical, 2),
            "currency_stability": round(currency_stab, 2),
            "supply_chain_integrity": round(supply_chain, 2),
            "global_demand": round(global_demand, 2),
            "usd_cycle": round(usd, 2),
            "edu_return": round(edu_return, 2),
            "edu_inflation": round(edu_inflation, 2),
            "skill_mismatch": round(skill_mismatch, 2),
            "social_safety_net": round(c.social_safety_net, 2),
            "inequality_gini": round(c.inequality_gini + self.t * 0.05, 2),
            "crisis": crisis_flag,
            "disaster_risk": round(c.disaster_risk, 2),
        }
        self.history.append(snapshot)
        self.t += 1
        return snapshot


# ============================================================
# 6. 人物画像（v2） —— 明确加入"学历"字段，其他因子更简化
# ============================================================
@dataclass
class Person:
    name: str
    birth_year: int
    education: str        # "初中" / "本科" / ...（必须在 EDUCATION_LEVELS 中）
    field: str = "通用"   # 专业 / 行业方向："制造业" "服务业" "科技" "通用"…
    gender: str = "男"

    # 个人特质 0-100
    iq: float = 60.0
    ambition: float = 60.0
    discipline: float = 60.0
    resilience: float = 60.0
    social_skill: float = 55.0
    risk_tolerance: float = 50.0
    health_baseline: float = 75.0

    # 家庭背景
    family_wealth: float = 40.0
    family_social: float = 40.0

    # 主动人生策略（由外部 STRATEGIES 注入）
    strategy: str = "努力奋斗"

    def summary(self) -> str:
        edu = EDUCATION_LEVELS[self.education]
        return (f"【{self.name}】出生 {self.birth_year}  |  学历: {self.education}  "
                f"(人力资本 {edu['base_hc']}, 文凭信号 {edu['signal']})  "
                f"| 专业: {self.field}  | 策略: {self.strategy}\n"
                f"   智商 {self.iq:.0f} | 野心 {self.ambition:.0f} | 自律 {self.discipline:.0f} | "
                f"逆商 {self.resilience:.0f} | 社交 {self.social_skill:.0f} | 风险偏好 {self.risk_tolerance:.0f}\n"
                f"   家庭财富 {self.family_wealth:.0f} | 家庭社会资本 {self.family_social:.0f} | "
                f"健康基线 {self.health_baseline:.0f}")


# ============================================================
# 7. 人生策略（v2）—— 与宏观环境交互
# ============================================================
STRATEGIES: Dict[str, Dict[str, float]] = {
    # effort: 努力强度系数
    # career_mobility: 职业向上流动的主动性
    # savings_rate: 储蓄率
    # investment_ability: 投资能力（金融财富积累系数）
    # consumption_taste: 消费偏好（高=花得多，短期幸福高）
    # risk_tolerance: 风险偏好（高=在经济波动中敢上杠杆/敢创业）
    # skill_upgrade: 持续学习与技能升级强度
    # geographic_mobility: 地域流动性（是否愿意去机会更多的城市）
    "稳定保守": {
        "effort": 0.85, "career_mobility": 0.5, "savings_rate": 0.22,
        "investment_ability": 0.5, "consumption_taste": 0.6,
        "risk_tolerance": 0.3, "skill_upgrade": 0.35, "geographic_mobility": 0.3,
    },
    "努力奋斗": {
        "effort": 1.15, "career_mobility": 0.8, "savings_rate": 0.25,
        "investment_ability": 0.7, "consumption_taste": 0.55,
        "risk_tolerance": 0.55, "skill_upgrade": 0.75, "geographic_mobility": 0.7,
    },
    "激进冒险（创业/炒币）": {
        "effort": 1.25, "career_mobility": 1.1, "savings_rate": 0.10,
        "investment_ability": 1.0, "consumption_taste": 0.45,
        "risk_tolerance": 1.2, "skill_upgrade": 0.9, "geographic_mobility": 1.0,
    },
    "平衡生活": {
        "effort": 0.95, "career_mobility": 0.7, "savings_rate": 0.20,
        "investment_ability": 0.6, "consumption_taste": 0.7,
        "risk_tolerance": 0.5, "skill_upgrade": 0.6, "geographic_mobility": 0.55,
    },
    "躺平低欲望": {
        "effort": 0.55, "career_mobility": 0.25, "savings_rate": 0.15,
        "investment_ability": 0.3, "consumption_taste": 0.5,
        "risk_tolerance": 0.25, "skill_upgrade": 0.15, "geographic_mobility": 0.2,
    },
}


# ============================================================
# 8. 主模拟器 v2：人 × 国家经济 × 国际形势
# ============================================================
class FateSimulator:
    def __init__(self, person: Person, country_preset: str = "中国2025",
                 seed: int = 2025):
        self.person = person
        self.country = build_country(country_preset)
        self.macro = MacroEngine(self.country, seed=seed)
        self.strategy = STRATEGIES[person.strategy]
        self.rng = random.Random(seed + hash(person.name) % 1000)
        self.history: List[Dict] = []

    # ---------- 学历定价：核心方程 ----------
    def _education_multiplier(self, macro: Dict) -> float:
        """
        给定当年宏观环境，返回该学历的收入倍数。
        - ai_adoption 越高 → 学历溢价越分化（高学历更高、低学历更低）
        - skill_mismatch 越高 → 低学历越吃亏
        - edu_inflation 越高 → 所有人的文凭贬值（高学历仍然相对更好）
        """
        edu = EDUCATION_LEVELS[self.person.education]
        hc = edu["base_hc"] / 50.0            # 50 分为基准线
        signal = edu["signal"] / 50.0

        # 产业阶段加权：知识密集 / AI密集 对学历最敏感
        industry_weight = sum(
            macro["industry_mix"][stage] * INDUSTRY_STAGES[stage]["edu_sensitivity"]
            for stage in INDUSTRY_STAGES
        )

        # AI 分化效应：AI adoption 越↑，学历差距越↑
        ai_level = macro["ai_adoption"] / 50.0   # 2025 年 ≈ 1.0
        # 低于"本科"的学历在高 AI 环境下受损，高于本科反而受益
        edu_rank = list(EDUCATION_LEVELS.keys()).index(self.person.education)
        total_levels = len(EDUCATION_LEVELS)
        ai_bias = 1.0 + (edu_rank - total_levels / 2) * 0.015 * ai_level

        # 教育回报率的年度波动（高通胀/高失业削弱工资谈判力）
        cycle_boost = (macro["edu_return"] / self.country.edu_return)

        # 失业伤害：失业率每超自然失业率 1%，低收入者收入再减 2%
        unemp_penalty = max(0.0, (macro["unemployment"] - 3.0)) * 0.02 * \
                        (1.0 - (edu_rank / total_levels))

        return hc * signal * industry_weight * ai_bias * cycle_boost * (1 - unemp_penalty)

    # ---------- AI 替代风险 ----------
    def _ai_displacement_prob(self, macro: Dict) -> float:
        """当年被 AI 或自动化替代的概率（%）"""
        edu = EDUCATION_LEVELS[self.person.education]
        base_risk = edu["ai_risk"]
        ai_intensity = sum(
            macro["industry_mix"][stage] * INDUSTRY_STAGES[stage]["ai_risk_factor"]
            for stage in INDUSTRY_STAGES
        )
        personal_resilience = (self.person.resilience + self.strategy["skill_upgrade"] * 40) / 150
        return max(0.0, min(95.0, (base_risk * ai_intensity * (macro["ai_adoption"] / 50.0)
                                   - personal_resilience * 30)))

    # ---------- 推进一年 ----------
    def step(self, prev: Dict, macro: Dict, age: int) -> Dict:
        s = self.strategy
        p = self.person

        # ----- 工资收入 -----
        base_wage = 3000 * (1 + macro["wage_growth"] / 100) ** (age - 18)
        edu_mult = self._education_multiplier(macro)
        personal_mult = (p.iq / 60) * (p.ambition / 60) * (p.discipline / 60) * s["effort"]
        unemployment_hit = 0.0
        income = base_wage * edu_mult * personal_mult * 12  # 年收入（元）

        # 失业可能性：高失业率 + 低学历 = 高失业概率
        job_keeping_chance = 1.0 - (macro["unemployment"] / 100) * \
            (1.0 - (EDUCATION_LEVELS[p.education]["resilience"] / 100))
        # 被 AI 替代风险
        ai_risk_pct = self._ai_displacement_prob(macro)
        job_keeping_chance -= ai_risk_pct / 200
        job_keeping_chance = max(0.55, min(0.99, job_keeping_chance))

        if self.rng.random() > job_keeping_chance:
            # 失业：当年收入降到低保/失业救济水平
            income *= (0.20 + macro["social_safety_net"] / 250)
            unemployment_hit = 1.0

        # ----- 职业成长 -----
        career_level = prev.get("career_level", 30.0)
        if not unemployment_hit:
            promotion_chance = 0.05 + 0.008 * s["career_mobility"] + \
                               0.005 * (p.ambition / 60) + 0.01 * (macro["gdp_growth"] / 5)
            career_level = min(100.0, career_level + promotion_chance * 20)
        else:
            career_level = max(0.0, career_level - 5)

        # ----- 财富积累 -----
        wealth = prev.get("wealth", p.family_wealth * 2000)
        consumption = income * (1 - s["savings_rate"]) + 12000
        # 投资收益：与利率、GDP、风险偏好相关；衰退期风险偏好高的反而受伤
        cycle_factor = {"繁荣": 1.1, "过热": 0.95, "衰退": 0.75, "复苏": 1.05}[macro["phase"]]
        real_return = (macro["gdp_growth"] / 10 + (macro["interest_rate"] - macro["inflation"]) / 100) * \
                      (0.5 + s["investment_ability"]) * cycle_factor
        # 高风险策略在衰退期可能血亏，在繁荣期可能超额收益
        if macro["phase"] == "衰退" and s["risk_tolerance"] > 0.8:
            real_return -= 0.12
        if macro["phase"] == "繁荣" and s["risk_tolerance"] > 0.8:
            real_return += 0.08

        wealth = max(0.0, wealth * (1 + real_return) + income - consumption)

        # ----- 健康 -----
        health = prev.get("health", p.health_baseline)
        aging_penalty = max(0.0, (age - 40) * 0.2) if age > 40 else 0.0
        work_strain = 0.5 * s["effort"]      # 过度努力伤健康
        health = min(100.0, max(0.0, health - aging_penalty - work_strain + self.rng.gauss(0, 2.5)))
        # 危机/失业年份健康大幅下降
        if macro["crisis"] or unemployment_hit:
            health -= 5.0

        # ----- 社会资本 -----
        social_cap = prev.get("social_capital", p.family_social)
        social_cap = min(100.0, social_cap + s["geographic_mobility"] * 0.3 + p.social_skill * 0.02)

        # ----- 幸福感（多维）-----
        income_rank = min(1.0, income / 150000)   # 15w 以上开始边际递减
        happiness = (
            0.25 * income_rank * 100
            + 0.20 * career_level
            + 0.25 * health
            + 0.15 * social_cap
            + 0.15 * (100 - macro["geopolitical_risk"] * 0.3 - macro["unemployment"] * 1.5)
        )
        happiness = min(100.0, max(0.0, happiness + self.rng.gauss(0, 4)))

        return {
            "age": age,
            "year": macro["year"],
            "phase": macro["phase"],
            "gdp_growth": macro["gdp_growth"],
            "inflation": macro["inflation"],
            "unemployment": macro["unemployment"],
            "wage_growth": macro["wage_growth"],
            "ai_adoption": macro["ai_adoption"],
            "income": round(income, 0),
            "consumption": round(consumption, 0),
            "wealth": round(wealth, 0),
            "career_level": round(career_level, 1),
            "health": round(health, 1),
            "social_capital": round(social_cap, 1),
            "happiness": round(happiness, 1),
            "unemployed": int(unemployment_hit),
            "ai_displacement_risk": round(ai_risk_pct, 2),
            "education_multiplier": round(self._education_multiplier(macro), 3),
            "crisis": macro["crisis"],
            "geopolitical_risk": macro["geopolitical_risk"],
            "global_trade_openness": macro["global_trade_openness"],
            "skill_mismatch": macro["skill_mismatch"],
            "supply_chain_integrity": macro["supply_chain_integrity"],
        }

    # ---------- 跑一生 ----------
    def run(self) -> List[Dict]:
        age_start = 18
        age_end = 70
        prev = {"wealth": self.person.family_wealth * 2000,
                "career_level": 25.0,
                "health": self.person.health_baseline,
                "social_capital": self.person.family_social}

        self.history = []
        for age in range(age_start, age_end + 1):
            macro = self.macro.step()
            prev = self.step(prev, macro, age)
            self.history.append(prev)
        return self.history

    # ---------- 摘要 ----------
    def summary(self) -> Dict:
        if not self.history:
            return {}
        h = self.history
        # 关键统计
        total_income = sum(x["income"] for x in h)
        final_wealth = h[-1]["wealth"]
        peak_wealth = max(x["wealth"] for x in h)
        avg_happiness = sum(x["happiness"] for x in h) / len(h)
        avg_health = sum(x["health"] for x in h) / len(h)
        unemp_years = sum(x["unemployed"] for x in h)
        crisis_years = sum(1 for x in h if x["crisis"])
        avg_ai_risk = sum(x["ai_displacement_risk"] for x in h) / len(h)
        # 关键年龄：30/45/60 岁的快照
        key_snaps = {}
        for a in [30, 45, 60, 70]:
            for snap in h:
                if snap["age"] == a:
                    key_snaps[str(a)] = {k: snap[k] for k in
                                         ("income", "wealth", "career_level", "health",
                                          "happiness", "phase", "ai_adoption")}
                    break
        return {
            "name": self.person.name,
            "education": self.person.education,
            "strategy": self.person.strategy,
            "country": self.country.name,
            "total_income_lifetime": round(total_income, 0),
            "final_wealth": round(final_wealth, 0),
            "peak_wealth": round(peak_wealth, 0),
            "average_happiness": round(avg_happiness, 1),
            "average_health": round(avg_health, 1),
            "unemployment_years": unemp_years,
            "crisis_years_lived": crisis_years,
            "avg_ai_displacement_risk": round(avg_ai_risk, 1),
            "snapshots": key_snaps,
        }


# ============================================================
# 9. 多策略 / 多国家 对比
# ============================================================
def compare_all(people: List[Person], country_presets: List[str],
                seed: int = 2025) -> List[Dict]:
    results = []
    for p in people:
        for cp in country_presets:
            sim = FateSimulator(p, country_preset=cp, seed=seed)
            sim.run()
            results.append(sim.summary())
    return results


# ============================================================
# 10. 文本可视化（无依赖）
# ============================================================
def text_bar(label: str, value: float, max_val: float, width: int = 38) -> str:
    ratio = min(1.0, value / max_val) if max_val > 0 else 0
    filled = int(width * ratio)
    return f"{label:30s} |{'█' * filled}{'·' * (width - filled)}| {value:>12,.0f}"


def print_results(results: List[Dict], sort_key: str = "final_wealth") -> None:
    results = sorted(results, key=lambda x: -x[sort_key])
    max_w = max(r[sort_key] for r in results) if results else 1
    print("\n" + "=" * 92)
    print(f" 对比结果（按 {sort_key} 从高到低）")
    print("=" * 92)
    for r in results:
        label = f"{r['name']}({r['education']}) · {r['strategy']} @{r['country']}"
        # 对不同指标不同的显示上限
        if "happiness" in sort_key or "health" in sort_key:
            print(f"{label:60s}  {r[sort_key]:>8.1f}  (失业{r['unemployment_years']}年)")
        else:
            print(text_bar(label, r[sort_key], max_w))
    print("-" * 92)
    best = results[0]
    print(f"★ 最优：{best['name']} 在 {best['country']} 采取 {best['strategy']}")
    print(f"   {sort_key} = {best[sort_key]:,.0f}  |  平均幸福 {best['average_happiness']:.1f}  "
          f"|  失业 {best['unemployment_years']} 年  |  AI替代风险 {best['avg_ai_displacement_risk']:.1f}%")


def print_life_curve(sim: FateSimulator) -> None:
    print("\n" + "=" * 92)
    print(f" 人生曲线：{sim.person.name}（{sim.person.education}）@ {sim.country.name} · {sim.person.strategy}")
    print("=" * 92)
    print(f"{'年龄':>4s} | {'年份':>5s} | {'阶段':>5s} | {'年收入':>10s} | {'财富':>12s} | "
          f"{'职业':>5s} | {'健康':>5s} | {'幸福':>5s} | {'AI替代':>6s} | 失业")
    print("-" * 92)
    for h in sim.history:
        if h["age"] % 5 != 0 and h["age"] not in (22, 30, 40, 50, 60, 70):
            continue
        flag = "✓" if h["unemployed"] else "·"
        crisis = " ⚠危" if h["crisis"] else ""
        print(f"{h['age']:>4d} | {h['year']:>5d} | {h['phase']:>5s} | "
              f"{h['income']:>10,.0f} | {h['wealth']:>12,.0f} | "
              f"{h['career_level']:>5.1f} | {h['health']:>5.1f} | {h['happiness']:>5.1f} | "
              f"{h['ai_displacement_risk']:>5.1f}% | {flag}{crisis}")


# ============================================================
# 11. 构造典型的"普通人"样本
# ============================================================
def build_person(name: str, education: str, strategy: str, birth_year: int = 2007,
                kind: str = "普通家庭") -> Person:
    """
    kind: "普通家庭" / "富裕家庭" / "贫困家庭" —— 控制出身起点
    birth_year: 出生年份（默认 2007 = 2025 年 18 岁，进入劳动力市场）
    """
    presets = {
        "普通家庭": dict(iq=60, ambition=60, discipline=60, resilience=60,
                        social_skill=55, risk_tolerance=50, health_baseline=75,
                        family_wealth=40, family_social=40),
        "富裕家庭": dict(iq=70, ambition=70, discipline=70, resilience=70,
                        social_skill=70, risk_tolerance=60, health_baseline=80,
                        family_wealth=85, family_social=75),
        "贫困家庭": dict(iq=50, ambition=45, discipline=50, resilience=55,
                        social_skill=40, risk_tolerance=40, health_baseline=65,
                        family_wealth=15, family_social=20),
    }
    base = presets[kind]
    return Person(name=name, birth_year=birth_year, education=education,
                  strategy=strategy, **base)
