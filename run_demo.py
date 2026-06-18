"""
命运模型 v2 —— 演示脚本
=============================================================

核心演示：一个「初中毕业」的普通人，在不同国家/不同时代下，
          采取不同人生策略，最终命运有多大差异。

          这正是用户要求的：把"国家宏观经济"和"国际形势"放进来，
          尤其是关注"初中毕业证"在不同国家/时代下的价值。
"""

from fate_model import (
    Person, build_person, build_country,
    FateSimulator, compare_all,
    print_results, print_life_curve,
    EDUCATION_LEVELS,
)


# ============================================================
# 实验 一：同一个「初中毕业者」在 5 个不同的宏观环境下
# ============================================================
def experiment_same_person_different_country():
    print("\n" + "=" * 90)
    print(" 实验 1：同一个人（初中毕业，普通家庭，努力奋斗）")
    print("         分别生活在中国2025 / 中国2035 / 日本1995 / 美国2025 / 越南2025")
    print("=" * 90)

    person = build_person("张小明", education="初中", strategy="努力奋斗",
                       birth_year=2007, kind="普通家庭")
    print(person.summary())

    countries = ["中国2025", "中国2035（AI高速发展）",
                "日本1995（泡沫破裂+老龄化）", "美国2025",
                "越南2025（追赶期人口红利）"]

    # 为每个国家单独跑，打印人生曲线
    results = []
    for cp in countries:
        sim = FateSimulator(person, country_preset=cp, seed=2025)
        sim.run()
        print_life_curve(sim)
        results.append(sim.summary())

    print_results(results, sort_key="final_wealth")
    print_results(results, sort_key="average_happiness")
    # 导出 JSON 供二次分析
    with open("/workspace/experiment1.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    print("\n已导出 → /workspace/experiment1.json")


# ============================================================
# 实验 二：不同学历的人在同一个国家（中国2035）下的对比
# ============================================================
def experiment_different_education_same_country():
    print("\n" + "=" * 90)
    print(" 实验 2：在【中国2035（AI高速发展）下")
    print("         对比 文盲 / 小学 / 初中 / 高中 / 本科 / 硕士")
    print("         同一家庭背景（普通），同一策略（努力奋斗）")
    print("=" * 90)

    people = []
    for edu in ["文盲", "小学", "初中", "高中", "本科", "硕士"]:
        people.append(build_person(f"某{edu}毕业生", education=edu,
                                 strategy="努力奋斗",
                                 birth_year=2017, kind="普通家庭"))

    for p in people:
        print(p.summary())

    results = compare_all(people, country_presets=["中国2035（AI高速发展）"], seed=2026)

    # 打印每个人的人生曲线
    for p in people:
        sim = FateSimulator(p, country_preset="中国2035（AI高速发展）", seed=2026)
        sim.run()
        print_life_curve(sim)

    print_results(results, sort_key="final_wealth")
    print_results(results, sort_key="average_happiness")

    with open("/workspace/experiment2.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    print("\n已导出 → /workspace/experiment2.json")


# ============================================================
# 实验 三：「初中毕业者」在 同一个国家 不同策略的最优解
# ============================================================
def experiment_different_strategies():
    print("\n" + "=" * 90)
    print(" 实验 3：同一个初中毕业生在同一个国家（中国2025）")
    print("         5 种人生策略对比：")
    print("         稳定保守 / 努力奋斗 / 激进冒险 / 平衡生活 / 躺平低欲望")
    print("=" * 90)

    strategies = ["稳定保守", "努力奋斗", "激进冒险（创业/炒币）",
                "平衡生活", "躺平低欲望"]
    people = []
    for strat in strategies:
        people.append(build_person(f"李{strat[:2]}", education="初中",
                                   strategy=strat,
                                   birth_year=2007, kind="普通家庭"))

    results = compare_all(people, country_presets=["中国2025"], seed=2027)
    print_results(results, sort_key="final_wealth")
    print_results(results, sort_key="average_happiness")

    with open("/workspace/experiment3.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    print("\n已导出 → /workspace/experiment3.json")


# ============================================================
# 实验 四：综合大对比 —— 3 种出身 × 4 种学历 × 5 个国家
# ============================================================
def experiment_big_grid():
    print("\n" + "=" * 90)
    print(" 实验 4：综合大对比 —— 所有出身 × 学历 × 国家")
    print("=" * 90)

    backgrounds = ["贫困家庭", "普通家庭", "富裕家庭"]
    educations = ["小学", "初中", "本科", "硕士"]
    countries = ["中国2025", "中国2035（AI高速发展）", "日本1995（泡沫破裂+老龄化）",
               "美国2025", "越南2025（追赶期人口红利）"]

    people = []
    for bg in backgrounds:
        for edu in educations:
            people.append(build_person(
                f"{bg[:2]}{edu}", education=edu, strategy="努力奋斗",
                birth_year=2007, kind=bg))

    results = compare_all(people, country_presets=countries, seed=2028)

    # 只打印最富前 12 和最穷后 12
    print_results(results[:12] + results[-12:], sort_key="final_wealth")

    with open("/workspace/experiment4.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    print("\n已导出完整对比网格 → /workspace/experiment4.json")


# ============================================================
# 实验 五：关键因子贡献度（敏感性分析）
# ============================================================
def experiment_sensitivity():
    print("\n" + "=" * 90)
    print(" 实验 5：敏感性分析 —— 提升一个因子 +20 分，")
    print("         对「初中毕业者」在「中国2035」终局财富的影响")
    print("=" * 90)

    baseline = build_person("基准小明", education="初中", strategy="努力奋斗",
                       birth_year=2007, kind="普通家庭")
    base_sim = FateSimulator(baseline, country_preset="中国2035（AI高速发展）", seed=2029)
    base_sim.run()
    baseline_wealth = base_sim.summary()["final_wealth"]
    print(f"基准终局财富：{baseline_wealth:,.0f}")
    print()

    tests = [
        ("升级学历到本科", lambda p: Person(**{**p, "education": "本科"})),
        ("家庭财富 +20", lambda p: Person(**{**p, "family_wealth": p.family_wealth + 20})),
        ("智商 +20", lambda p: Person(**{**p, "iq": p.iq + 20})),
        ("野心 +20", lambda p: Person(**{**p, "ambition": p.ambition + 20})),
        ("自律 +20", lambda p: Person(**{**p, "discipline": p.discipline + 20})),
        ("换策略到激进冒险", lambda p: Person(**{**p, "strategy": "激进冒险（创业/炒币）"})),
        ("换策略到躺平低欲望", lambda p: Person(**{**p, "strategy": "躺平低欲望"})),
        ("换国家到越南2025", None)],

    # 需要把 Person 的 build_person 直接构造，不使用 lambda 引用 Person(**)
    # 改用显式构造
    results = []
    for label, modifier in tests:
        # 重新构造
        if "学历" in label:
            p = build_person("小明", education="本科", strategy="努力奋斗", birth_year=2007, kind="普通家庭")
        elif "家庭" in label:
            p = build_person("小明", education="初中", strategy="努力奋斗", birth_year=2007, kind="普通家庭")
            # 手动覆盖
            p.family_wealth += 20
        elif "智商" in label:
            p = build_person("小明", education="初中", strategy="努力奋斗", birth_year=2007, kind="普通家庭")
            p.iq += 20
        elif "野心" in label:
            p = build_person("小明", education="初中", strategy="努力奋斗", birth_year=2007, kind="普通家庭")
            p.ambition += 20
        elif "自律" in label:
            p = build_person("小明", education="初中", strategy="努力奋斗", birth_year=2007, kind="普通家庭")
            p.discipline += 20
        elif "激进冒险" in label:
            p = build_person("小明", education="初中", strategy="激进冒险（创业/炒币）", birth_year=2007, kind="普通家庭")
        elif "躺平" in label:
            p = build_person("小明", education="初中", strategy="躺平低欲望", birth_year=2007, kind="普通家庭")
        else:  # 越南
            p = build_person("小明", education="初中", strategy="努力奋斗", birth_year=2007, kind="普通家庭")

        sim = FateSimulator(p, country_preset="中国2035（AI高速发展）", seed=2029)
        sim.run()
        w = sim.summary()["final_wealth"]
        delta = w - baseline_wealth
        pct = delta / max(1.0, baseline_wealth) * 100
        results.append((label, w, delta, pct))

    for label, w, delta, pct in sorted(results, key=lambda x: -x[3], reverse=True):
        sign = "+" if delta >= 0 else ""
        bar = "█" * int(min(100, abs(pct)) // 2)
        print(f"{label:35s} 终局财富 {w:>12,.0f} ({sign}{delta:>+10,.0f} {sign}{pct:>+6.1f}% |{bar:50s}")


import json


if __name__ == "__main__":
    # 按顺序跑
    experiment_same_person_different_country()
    experiment_different_education_same_country()
    experiment_different_strategies()
    experiment_big_grid()
    experiment_sensitivity()
    print("\n" + "=" * 90)
    print(" 所有实验完成。JSON 结果文件：")
    print("   /workspace/experiment1.json —— 同一人在 5 国")
    print("   /workspace/experiment2.json —— 6 种学历在同一国")
    print("   /workspace/experiment3.json —— 5 种策略对比")
    print("   /workspace/experiment4.json —— 3 出身 × 2 学历 × 5 国完整网格")
    print("=" * 90)
