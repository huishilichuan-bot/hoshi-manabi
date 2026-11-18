# 漢字の書き取りデータを作る（学年別の漢字・書き順・例のことば）
# 出典：KanjiVG（© Ulrich Apel, CC BY-SA 3.0）、KANJIDIC2・JMdict（© EDRDG, CC BY-SA 4.0）、JmdictFurigana（CC BY-SA 4.0）
# 使い方：python3 tools/build_kanji.py /workspace/kdata
import json, re, sys, os
from collections import defaultdict
SRC = sys.argv[1] if len(sys.argv) > 1 else "/workspace/kdata"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kd = json.load(open(f"{SRC}/kanjidic2-en-3.6.2.json"))["characters"]
info = {}
for c in kd:
    g = c["misc"].get("grade")
    if g and g <= 8: info[c["literal"]] = {"g": g, "freq": c["misc"].get("frequency") or 9999, "sc": c["misc"]["strokeCounts"][0]}
# 中学（常用の残り1110字）は使われる多さの順に中1・中2・中3へ分ける
jh = sorted([k for k, v in info.items() if v["g"] == 8], key=lambda k: (info[k]["freq"], k))
n = len(jh); cut = [0, n // 3, 2 * n // 3, n]
for i in range(3):
    for k in jh[cut[i]:cut[i + 1]]: info[k]["G"] = 7 + i
for k, v in info.items():
    if v["g"] <= 6: v["G"] = v["g"]
# 書き順（KanjiVG）
def strokes(k):
    f = f"{SRC}/kvg/kanji/{ord(k):05x}.svg"
    if not os.path.exists(f): return None
    x = open(f, encoding="utf-8").read()
    ps = re.findall(r'<path id="kvg:[0-9a-f]+-s(\d+)"[^>]*?\sd="([^"]+)"', x)
    ps = sorted(ps, key=lambda p: int(p[0]))
    return [re.sub(r"(\d)\.(\d)\d+", r"\1.\2", d) for _, d in ps]   # 小数1けたに丸める（見た目は同じ）
ST = {}; bad = []
for k, v in info.items():
    s = strokes(k)
    if not s: bad.append((k, "nodata")); continue
    if len(s) != v["sc"]: bad.append((k, f"kvg{len(s)}/kd{v['sc']}"))
    ST[k] = s
# 例のことば（JMdict のよく使う語＋ふりがなの区切り）
PRI = json.load(open(f"{SRC}/kpri.json"))   # JMdict の使われる多さ（nf01＝いちばん多い〜49）
jm = json.load(open(f"{SRC}/jmdict-eng-common-3.6.2.json"))["words"]
fur = {}
for e in json.load(open(f"{SRC}/JmdictFurigana.json", encoding="utf-8-sig")):
    fur[(e["text"], e["reading"])] = e["furigana"]
HARD = re.compile(r"\b(sex|sexual|naked|nude|porn|prostitut|rape|vulgar|penis|vagina|breast|feces|excrement|shit|urine|fart|drunk|alcohol|liquor|sake|beer|tobacco|cigarette|smok|gambl|drug|narcotic|kill|murder|suicide|corpse|dead body|execution|torture|slave|bomb|gun|weapon|terror|crime|criminal|prison|jail|blood|die|dies|died|death|dead|funeral|grave|war\b|battle|enemy|abortion|divorce|adultery|mistress|lover|kiss|hell|devil|demon|ghost|curse|insult|stupid|idiot|fool|ugly|fat\b|poison|disease|cancer|illness|sick|virus|injur|wound|naked|underwear|bath|toilet|attack|assault|threat|blackmail|extort|accus|defendant|fetus|embryo|arrest|restrain|detention|nuclear|riot|violen|hostage|kidnap|thief|theft|steal|robber|fraud|bribe|scandal|gang|mafia|corrupt|abuse|harass|bully|hate|despis|resent|grudge|revenge|lie|liar|cheat|shame|disgrace|insane|mad\b|lunatic|cripple|blind|deaf|dumb|retard|beggar|whore|concubine|womb|pregnan|childbirth|menstru|erect|lewd|obscene|lust|seduc|flirt|harlot|geisha|bar\b|cabaret|conception|fertiliz|ovum|sperm|widow|orphan|hanging|strangl|stab|slash|behead|massacre|slaughter|exile|banish|interrogat|lawsuit|prosecut|espionage|spy|reconnais)\w*", re.I)
BADMISC = {"arch", "obs", "rare", "derog", "vulg", "sens", "X", "sl", "uk", "col", "joc", "obsc", "male", "fem", "hum", "pol", "hon", "dated", "id", "proverb", "yoji"}
GOODPOS = re.compile(r"^(n|v1|v5.*|adj-i|adj-na|vs)$")
words = defaultdict(list)
for e in jm:
    kforms = [k for k in e["kanji"] if k["common"]]
    if not kforms: continue
    senses = e["sense"]
    if not senses: continue
    s0 = senses[0]
    if set(s0["misc"]) & BADMISC: continue
    if not any(GOODPOS.match(p) for p in s0["partOfSpeech"]): continue
    gl = " ; ".join(g["text"] for s in senses[:3] for g in s["gloss"])
    soft = bool(HARD.search(gl))
    for kf in kforms[:1]:
        t = kf["text"]
        if not (1 <= len(t) <= 4): continue
        ks = [ch for ch in t if "\u4e00" <= ch <= "\u9fff"]
        if not ks or any(ch not in info for ch in ks): continue
        if not re.fullmatch(r"[\u4e00-\u9fff]+[\u3040-\u309f]{0,3}", t): continue  # 漢字＋送りがなの形だけ（カタカナ・記号・々・まん中のかなは使わない）
        if t not in PRI: continue
        rd = [k for k in e["kana"] if k["common"] and ("*" in k["appliesToKanji"] or t in k["appliesToKanji"])]
        if not rd: continue
        r = rd[0]["text"]
        fg = fur.get((t, r))
        if not fg: continue
        maxG = max(info[ch]["G"] for ch in ks)
        for i, seg in enumerate(fg):
            if seg["ruby"] in info and seg.get("rt"):
                words[seg["ruby"]].append({"t": t, "r": r, "f": [[s["ruby"], s.get("rt", "")] for s in fg], "i": i, "maxG": maxG, "soft": soft, "nk": len(ks), "len": len(t), "gl": gl[:60], "pri": PRI[t]})
def score(k, w):
    G = info[k]["G"]
    nf, ichi, news, spec = w["pri"]
    sc = nf + (0 if ichi else (40 if G <= 3 else 22 if G <= 6 else 8))
    if w["soft"]: sc += 100
    if w["maxG"] > G: sc += 50          # 習っていない字を含む語は後回し
    sc += abs(w["nk"] - 2) * 3 if w["nk"] > 1 else 0
    if G >= 7 and w["len"] == 1 and not w["pri"][1]: sc += 30
    if w["nk"] == 1 and w["len"] == 1: sc -= 8 if G <= 6 else 2   # 「山」「花」のような1字の語
    if w["nk"] == 1 and w["len"] > 1: sc -= 14 if G <= 6 else 4    # 「歩く」のような送りがなつき
    sc += sum(info[c]["freq"] for c in w["t"] if c in info and c != k) / 300
    return sc
# ふりがなの区切り：漢字1字ずつ・かなはそのまま（JmdictFurigana になければ、かなの位置から割り出す）
def align(t, r):
    fg = fur.get((t, r))
    if fg: return [[x["ruby"], x.get("rt", "")] for x in fg]
    parts = re.findall(r"[\u4e00-\u9fff]|[\u3040-\u309f]+", t)
    rx = "".join("(.+?)" if re.match(r"[\u4e00-\u9fff]", p) else "(" + re.escape(p) + ")" for p in parts)
    m = re.fullmatch(rx, r)
    if not m: return None
    return [[p, m.group(i + 1) if re.match(r"[\u4e00-\u9fff]", p) else ""] for i, p in enumerate(parts)]
MAN = {}
WARN = []
for line in open(os.path.join(ROOT, "tools", "kanji_manual.txt"), encoding="utf-8"):
    if not line.strip() or line.startswith("#"): continue
    g, rest = line.split(" ", 1)
    for it in rest.split():
        k, t, r = it.split(":")
        f = align(t, r)
        if not f: WARN.append(("align", t, r)); continue
        i = [j for j, x in enumerate(f) if x[0] == k]
        if not i: WARN.append(("target", k, t)); continue
        if info[k]["G"] != int(g): WARN.append(("grade", k, info[k]["G"], g)); continue
        mg = max(info[c]["G"] for c in t if c in info)
        if mg > int(g): WARN.append(("higher-grade kanji", t, mg))
        if any("\u4e00" <= c <= "\u9fff" and c not in info for c in t): WARN.append(("non-joyo", t))
        if k in MAN: WARN.append(("dup", k))
        MAN[k] = {"t": t, "r": r, "f": f, "i": i[0], "maxG": max(info[c]["G"] for c in t if c in info), "soft": False}
out = {}
miss = []
for k, v in info.items():
    if k not in ST: continue
    cand = [w for w in words.get(k, []) if w["maxG"] <= max(v["G"], 6 if v["G"] <= 6 else v["G"]) or True]
    cand = sorted({(w["t"], w["r"]): w for w in cand}.values(), key=lambda w: score(k, w))
    cand = [w for w in cand if not w["soft"] and w["maxG"] <= v["G"]] or [w for w in cand if not w["soft"]]
    if k in MAN: cand = [MAN[k]] + [w for w in cand if w["t"] != MAN[k]["t"] and w["maxG"] <= v["G"]]
    if not cand: miss.append(k); continue
    out[k] = cand[:3]
# 書き出し
os.makedirs(f"{ROOT}/kanji", exist_ok=True)
byG = defaultdict(list)
for k, v in info.items():
    if k in out: byG[v["G"]].append(k)
for G in byG: byG[G].sort(key=lambda k: (info[k]["freq"], k))
lines = ["// 漢字の書き取り：学年ごとの漢字と例のことば（自動生成：tools/build_kanji.py）",
         "// 出典：KANJIDIC2・JMdict（© EDRDG, CC BY-SA 4.0）、JmdictFurigana（CC BY-SA 4.0）。この表も CC BY-SA 4.0。",
         "(function (root) {", "  const HM = root.HM;", "  HM.KANJI = {"]
for G in sorted(byG):
    ents = []
    for k in byG[G]:
        ws = ["/".join([w["t"], w["r"], str(w["i"]), ".".join(a + ":" + b for a, b in w["f"])]) for w in out[k]]
        ents.append(k + str(info[k]["sc"]) + "=" + ";".join(ws))
    lines.append("    " + str(G) + ": " + json.dumps("|".join(ents), ensure_ascii=False) + ",")
lines += ["  };", "})(typeof window !== \"undefined\" ? window : globalThis);", ""]
open(f"{ROOT}/q-kanji-data.js", "w").write("\n".join(lines))
for G in sorted(byG):
    d = {k: ST[k] for k in byG[G]}
    open(f"{ROOT}/kanji/g{G}.js", "w").write("/* 書き順データ（KanjiVG © Ulrich Apel, CC BY-SA 3.0 から作成。このファイルも CC BY-SA 3.0） */\n(window.HMK_Q = window.HMK_Q || []).push(" + json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ");\nif (window.HMK && window.HMK.flush) window.HMK.flush();\n")
print("manual", len(MAN), "warnings", WARN)
for G in range(1, 7):
    lack = [k for k, v in info.items() if v["G"] == G and k not in MAN]
    if lack: print("manual missing", G, "".join(lack))
print("grades", {G: len(byG[G]) for G in sorted(byG)})
print("stroke-count mismatch", len([b for b in bad if b[1] != "nodata"]), bad[:30])
print("no word", len(miss), "".join(miss[:80]))
for G in sorted(byG):
    print(G, " ".join(k + ":" + out[k][0]["t"] + "(" + out[k][0]["r"] + ")" for k in byG[G][:25]))
