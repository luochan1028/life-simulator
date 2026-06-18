"""
周涛的人生剧本模拟（适配 fate_model v2 的 API）
========================================================

时间线（基于公开信息整理）：
  1968    — 出生于安徽淮南，父母/祖父母均为知识分子（中产知识家庭）
  ~1988   — 考入北京广播学院播音系（当年安徽仅录 1 人）
  1992    — 先被分到公安局做文职 → 后去 BTV 做主播
  1995    — 调入央视《综艺大观》
  1996    — 首次主持央视春晚（→ 连续 16 年）
  2004    — 再婚（路云，文化产业商人）
  2008    — 北京奥运会开幕式解说
  2009    — 升央视文艺中心副主任
  2016    — 离开央视，任北京演艺集团首席演出官
  2021    — 任保利文化集团艺术总监
  2024    — 主演电视剧《老家伙》

方法：
  (a) 用 "真实周涛" 参数跑一次，得到基准结局。
  (b) 在 5 个关键人生分岔点，保持其他不变，只改"当时可以选的其他路"。
  (c) 比较 6 条路径，得到每个阶段的最优解与她的"正确选择率"。

注：模型用 flat 字段 API（person.iq, person.ambition...）而不是 v1 的 nested dict。
"""

import json
from dataclasses import dataclass, field, replace
from typing import List, Dict
from fate_model import Person, FateSimulator, STRATEGIES, build_country, EDUCATION_LEVELS


# ============================================================
# 1. 周涛真实画像 —— 基于公开信息打分（0-100）
# ============================================================
def real_zhou_tao(strategy: str) -> Person:
    """构建一个"真实"周涛的基础画像。"""
    return Person(
        name="周涛（真实路径）",
        birth_year=1968,
        education="硕士",     # 北广 + 在职硕士
        field="媒体/文艺",
        gender="女",

        # 个人特质：她持续做了16年春晚主持 + 奥运会解说 + 升管理层
        iq=82,                 # 考进北广本身是智力门槛
        ambition=88,           # 从安徽进京、跳央视、再转管理，显然有野心
        discipline=92,         # 连续 16 年春晚的自律
        resilience=88,         # 两次婚姻 + 职业切换都没翻车
        social_skill=90,       # 主持需要极强的社交与控场
        risk_tolerance=68,     # 敢于放弃铁饭碗跳台，中等偏上
        health_baseline=78,    # 长期高压但保养不错

        # 家庭：父母均知识分子（父中学高级教师，母文化局局长）
        family_wealth=65,
        family_social=70,

        strategy=strategy,
    )


# ============================================================
# 2. 6 条对比路径 —— 每条路径只改核心因子，其他不变
# ============================================================
def build_scenarios() -> List[Dict]:
    """
    返回 list of dict。每个 dict 包含：
      name: str  路径名
      note: str  备注
      person: Person
    """
    base = real_zhou_tao("努力奋斗")
    scenarios = []

    # ✅ ① 真实路径
    scenarios.append({
        "name": "✅ 真实路径：考北广→BTV→央视→央视春晚→转管理→保利",
        "note": "她实际走的那条。努力奋斗 + 关键节点敢于跳槽。",
        "person": replace(base, name="真实周涛 · 努力奋斗"),
    })

    # ❓ ② 18 岁时的另一条路：不考北广，留在安徽当老师（当时最主流选择）
    p = replace(base, name="周涛 · 留在安徽本地")
    p.education = "大专"
    p.field = "教育"
    p.iq = 78; p.ambition = 60; p.risk_tolerance = 40
    p.family_wealth = 60; p.family_social = 65
    p.strategy = "稳定保守"
    scenarios.append({
        "name": "❓ 岔路A：留在安徽本地做老师 / 机关",
        "note": "1980 年代最主流的选择，但永远失去央视舞台。",
        "person": p,
    })

    # ❓ ③ 24 岁时的另一条路：留在公安系统做文职（她真被分到过公安）
    p = replace(base, name="周涛 · 留在公安系统铁饭碗")
    p.education = "本科"
    p.field = "政府/体制"
    p.ambition = 70; p.risk_tolerance = 35
    p.strategy = "稳定保守"
    scenarios.append({
        "name": "❓ 岔路B：留在公安系统做文职，不去 BTV",
        "note": "她真被分到过公安局做文职，最后主动放弃了。",
        "person": p,
    })

    # ❓ ④ 27 岁时的另一条路：留在 BTV，拒绝央视挖角
    p = replace(base, name="周涛 · 留守 BTV")
    p.field = "地方媒体"
    p.ambition = 75; p.risk_tolerance = 50
    p.strategy = "努力奋斗"
    scenarios.append({
        "name": "❓ 岔路C：留守北京电视台，拒绝央视",
        "note": "BTV 也是大台但少了国家级曝光。",
        "person": p,
    })

    # ❓ ⑤ 30-40 岁另一条路：不离婚，第一段婚姻维持到底
    p = replace(base, name="周涛 · 维持第一段婚姻，不转管理岗")
    p.risk_tolerance = 45
    p.ambition = 75
    p.family_social = 65
    p.strategy = "平衡生活"
    scenarios.append({
        "name": "❓ 岔路D：不离婚，只做主持人做到退休",
        "note": "放弃再婚 + 放弃走管理线，职业天花板降一格。",
        "person": p,
    })

    # ❓ ⑥ 48 岁另一条路：留在央视做到退休
    p = replace(base, name="周涛 · 留在央视到退休")
    p.field = "体制内媒体"
    p.risk_tolerance = 50
    p.strategy = "稳定保守"
    scenarios.append({
        "name": "❓ 岔路E：留在央视做副主任到退休，不转北京演艺集团",
        "note": "放弃市场化转型，职业更稳定但自由度低。",
        "person": p,
    })

    # ❓ ⑦ 55 岁+的另一条路：更早更激进转型演员
    p = replace(base, name="周涛 · 45 岁就开始全面转型艺人")
    p.field = "影视演员"
    p.risk_tolerance = 88
    p.discipline = 95
    p.strategy = "激进冒险（创业/炒币）"
    scenarios.append({
        "name": "❓ 岔路F：45 岁就彻底转型演员 / 综艺",
        "note": "可能高曝光，也可能口碑翻车（像不少主持人转型演员失败）。",
        "person": p,
    })

    return scenarios


# ============================================================
# 3. 运行 6 条路径 —— 用中国 1995（高速增长）模板
# ============================================================
def run_all(scenarios: List[Dict], seed: int = 1968) -> List[Dict]:
    results = []
    for i, sc in enumerate(scenarios):
        # 相同 seed + i 保证随机性基本一致
        sim = FateSimulator(sc["person"],
                             country_preset="中国2025",
                             seed=seed + i)
        sim.run()
        summary = sim.summary()
        # 取最后一年的快照作为「终局」状态
        final = sim.history[-1]
        results.append({
            "scenario": sc["name"],
            "note": sc["note"],
            "strategy": sc["person"].strategy,
            "final_wealth": summary["final_wealth"],
            "final_career": final["career_level"],
            "final_health": final["health"],
            "final_social_capital": final["social_capital"],
            "final_happiness": summary["average_happiness"],
            "peak_wealth": summary["peak_wealth"],
            "unemployment_years": summary["unemployment_years"],
        })
    return results


# ============================================================
# 4. 综合打分 —— 人生综合质量
# ============================================================
def composite_score(r: Dict) -> float:
    """综合打分：60% 幸福 + 30% 职业 + 10% 健康。
    财富已经被幸福间接反映（收入 → 幸福），这里不单独加权。
    """
    return (r["final_happiness"] * 0.60
            + r["final_career"] * 0.30
            + r["final_health"] * 0.10)


# ============================================================
# 5. 输出报告
# ============================================================
def print_report(results: List[Dict]) -> None:
    print("\n" + "=" * 100)
    print("  周涛 · 人生剧本模拟 —— 7 条路径对比")
    print("  中国宏观：1986-2043 （她 18 岁 → 75 岁，GDP 从 10%+ 放缓到 3%）")
    print("=" * 100)

    results_sorted = sorted(results, key=composite_score, reverse=True)

    # 表格
    print(f"{'排名':<4} {'路径':<66} {'策略':<14} {'幸福':>6} {'职业':>6} {'健康':>6} {'综合':>6}")
    print("-" * 100)
    for i, r in enumerate(results_sorted):
        marker = "⭐" if "真实路径" in r["scenario"] else " "
        print(f"{i+1:<3}{marker} {r['scenario']:<65} {r['strategy']:<14} "
              f"{r['final_happiness']:>6.1f} {r['final_career']:>6.1f} "
              f"{r['final_health']:>6.1f} {composite_score(r):>6.1f}")
    print()

    # 真实路径排名
    real = next(r for r in results if "真实路径" in r["scenario"])
    real_rank = next(i + 1 for i, r in enumerate(results_sorted) if r is real)
    print(f"真实周涛的综合排名：第 {real_rank} / {len(results)} 名")
    print(f"她的综合得分：{composite_score(real):.1f}（满分约 100）")
    print()

    # 分岔点复盘
    print("-" * 100)
    print("  关键人生分岔点 —— 她选的路 vs 其他可选路")
    print("-" * 100)

    forks = [
        ("① 18 岁 · 去哪里上大学",
         real, next(r for r in results if "留在安徽本地" in r["scenario"]),
         "考北广 / 去北京  vs  留在安徽本地做老师 / 机关"),
        ("② 24 岁 · 做铁饭碗还是主持人",
         real, next(r for r in results if "公安系统" in r["scenario"]),
         "进电视台做主持人  vs  留在公安局做文职"),
        ("③ 27 岁 · 去央视还是留 BTV",
         real, next(r for r in results if "留守北京电视台" in r["scenario"]),
         "跳央视主持《综艺大观》  vs  留守 BTV"),
        ("④ 30-40 岁 · 婚姻与职业",
         real, next(r for r in results if "不离婚" in r["scenario"]),
         "离婚再婚 + 转管理岗  vs  维持第一段婚姻，只做主持"),
        ("⑤ 48 岁 · 是否离开体制",
         real, next(r for r in results if "留在央视做副主任" in r["scenario"]),
         "转市场化机构（北京演艺集团 / 保利）  vs  留在央视到退休"),
        ("⑥ 55 岁+ · 是否激进转演员",
         real, next(r for r in results if "转型演员" in r["scenario"]),
         "适度主持+管理  vs  45 岁就全面转型演员/综艺"),
    ]

    correct = 0.0
    total = 0
    for stage, actual, alt, desc in forks:
        a, b = composite_score(actual), composite_score(alt)
        total += 1
        if a - b > 2:
            correct += 1; verdict = "✅ 她选对了（明显更好）"
        elif b - a > 2:
            verdict = "❌ 另一条路其实更好"
        else:
            correct += 0.5; verdict = "➖ 两条路差不多（都可）"
        print(f"{stage}  — {desc}")
        print(f"        实际选择综合分 {a:>5.1f}   vs   对比路径 {b:>5.1f}   →   {verdict}")
        # 细项
        dH = actual["final_happiness"] - alt["final_happiness"]
        dC = actual["final_career"] - alt["final_career"]
        dHeal = actual["final_health"] - alt["final_health"]
        print(f"        ⇒ 幸福差 {dH:+.1f}，职业差 {dC:+.1f}，健康差 {dHeal:+.1f}")
        print()

    rate = correct / total * 100
    print("=" * 100)
    print(f"  ✨ 她的综合『正确选择率』 = {correct:.1f} / {total} = {rate:.0f}%")
    print("=" * 100)
    print()

    # 每个阶段的建议
    print("💡 综合建议：每个岔路口真正最优的选择")
    print("-" * 100)
    for stage, actual, alt, desc in forks:
        top = actual if composite_score(actual) > composite_score(alt) else alt
        is_real = top is actual
        print(f"{stage} → {'✅ 她选对了（' if is_real else '⚠️ 模型建议另一条路：（'}{top['scenario'].split('：', 1)[-1]}）")
        print(f"         综合分 {composite_score(top):.1f}（幸福 {top['final_happiness']:.1f}，职业 {top['final_career']:.1f}，健康 {top['final_health']:.1f}）")
    print()

    best = results_sorted[0]
    print(f"\n★ 全局最优路径：{best['scenario']}")
    print(f"    策略：{best['strategy']}")
    print(f"    终局幸福 {best['final_happiness']:.1f}，职业 {best['final_career']:.1f}，健康 {best['final_health']:.1f}")

    # 最意外的发现：哪条路得分最高 / 最低
    worst = results_sorted[-1]
    print(f"★ 全局最差路径：{worst['scenario']}")
    print(f"    策略：{worst['strategy']}")
    print(f"    终局幸福 {worst['final_happiness']:.1f}，职业 {worst['final_career']:.1f}，健康 {worst['final_health']:.1f}")


if __name__ == "__main__":
    scenarios = build_scenarios()
    results = run_all(scenarios)

    print_report(results)

    # 存 JSON
    with open("/workspace/周涛_模拟结果.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=lambda x: str(x))
    print("\n完整 JSON 已导出 → /workspace/周涛_模拟结果.json")
