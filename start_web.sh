#!/bin/bash
# 启动网页版"命运模拟器"
# 用法: ./start_web.sh [端口]
PORT=${1:-8080}

cd "$(dirname "$0")"

echo "=========================================="
echo "  命运模型 · 网页版"
echo "  📁 工作目录: $(pwd)"
echo "  🌐 浏览器访问: http://localhost:${PORT}"
echo "=========================================="
echo ""
echo "  核心文件："
echo "    index.html     — 三栏布局的主页面"
echo "    fate_model.js  — 模拟器核心（宏观经济 + 学历价值 + 健康医疗）"
echo "    run_demo.py    — 原始 Python 版（保留用于命令行对比）"
echo ""
echo "  功能："
echo "    · 自定义人物画像（学历、出身、健康、性格）"
echo "    · 中国 2025/2035/2045/1995 四个时代预设"
echo "    · 15+ 个可调宏观参数（GDP、通胀、AI 渗透率、医疗体系…）"
echo "    · 5 种人生策略对比（稳定/奋斗/激进/平衡/躺平）"
echo "    · 8 种学历的财富/AI风险对比"
echo "    · 7 张曲线图 + 人生关键事件时间线"
echo ""
echo "  按 Ctrl+C 退出服务器"
echo ""

# 检查是否有 python3
if command -v python3 >/dev/null 2>&1; then
    python3 -m http.server "${PORT}"
elif command -v python >/dev/null 2>&1; then
    python -m SimpleHTTPServer "${PORT}"
else
    echo "❌ 未找到 Python，无法启动 HTTP 服务器。"
    echo "   你也可以直接用浏览器打开: $(pwd)/index.html"
    exit 1
fi
