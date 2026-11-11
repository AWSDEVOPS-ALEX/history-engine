#!/usr/bin/env python3
"""Build episodes/ep02-singapore.json from the Singapore script."""

import json, pathlib

OUT = pathlib.Path("episodes/ep02-singapore.json")

# ── helpers ──────────────────────────────────────────────────────────────────

def narr(text: str, visual: dict, *, date: str = None, mascot: dict = None, labels: list = None, shots: list = None) -> dict:
    s: dict = {"type": "narration", "speaker": "NARRATOR", "text": text, "visual": visual}
    if date:   s["date"] = date
    if mascot: s["mascot"] = mascot
    if labels: s["labels"] = labels
    if shots:  s["shots"] = shots
    return s

def skit_seg(speaker_id: str, text: str, visual: dict, *, date: str = None) -> dict:
    s: dict = {"type": "skit", "speaker": speaker_id, "text": text, "visual": visual}
    if date: s["date"] = date
    return s

def gray(text: str, icon: str = None, *, bg: str = None, cam: dict = None, props: list = None, **kw) -> dict:
    v: dict = {"kind": "gray"}
    if icon:  v["props"] = [{"icon": icon, "x": 52, "y": 56, "t": 0.4, "scale": 0.7}]
    if bg:    v["bg"] = bg
    if cam:   v["cam"] = cam
    if props: v["props"] = props
    return narr(text, v, **kw)

def map_seg(text: str, from_: dict, to: dict, events: list = None, *, date: str = None, mascot: dict = None) -> dict:
    v: dict = {"kind": "map", "from": from_, "to": to, "events": events or []}
    return narr(text, v, date=date, mascot=mascot)

# Map event helpers — use word-based timing (0-based word index)
def co(word: int, label: str, lon: float, lat: float, icon: str = None, *, src: str = None, side: str = "right", persist: bool = False, focus: bool = False, zoom: float = None) -> dict:
    e: dict = {"type": "callout", "at": [lon, lat], "t": 0, "word": word, "label": label, "side": side, "persist": persist, "focus": focus}
    if icon: e["icon"] = icon
    if src:  e["src"] = src
    if zoom: e["zoom"] = zoom
    return e

def nat(word: int, code: str, lon: float, lat: float, label: str = None) -> dict:
    e: dict = {"type": "nation", "at": [lon, lat], "t": 0, "word": word, "code": code}
    if label: e["label"] = label
    return e

def lbl(word: int, text: str, lon: float, lat: float, *, size: int = 36, caps: bool = True, style: str = "region") -> dict:
    return {"type": "label", "at": [lon, lat], "t": 0, "word": word, "text": text, "size": size, "caps": caps, "style": style}

def move_ev(word: int, path: list, icon: str = "ship", *, trail: bool = True) -> dict:
    return {"type": "move", "path": path, "t": 0, "word": word, "icon": icon, "dur": 2.0, "trail": trail}

def flow_ev(word: int, path: list, *, color: str = "#2255aa", width: float = 2.5) -> dict:
    return {"type": "flow", "path": path, "t": 0, "word": word, "color": color, "width": width}

def pulse_ev(word: int, lon: float, lat: float, *, color: str = "#ffcc00") -> dict:
    return {"type": "pulse", "at": [lon, lat], "t": 0, "word": word, "color": color}

def pin_ev(word: int, lon: float, lat: float, label: str = None) -> dict:
    e: dict = {"type": "pin", "at": [lon, lat], "t": 0, "word": word}
    if label: e["label"] = label
    return e

def action(text: str, name: str, *, bg: str = None, **kw) -> dict:
    v: dict = {"kind": "action", "name": name}
    if bg: v["bg"] = bg
    v.update(kw)
    return narr(text, v)

def crowd(text: str, set_name: str, act: str, n: int = 8, *, seed: int = 1, **kw) -> dict:
    v: dict = {"kind": "crowd", "set": set_name, "action": act, "n": n, "seed": seed}
    return narr(text, v, **kw)

def portrait(text: str, src: str, caption: str, *, year: str = None, **kw) -> dict:
    v: dict = {"kind": "portrait", "src": src, "caption": caption}
    if year: v["year"] = year
    return narr(text, v, **kw)

def scroll(text: str, dates: list, *, roll: str = "close", **kw) -> dict:
    return narr(text, {"kind": "scroll", "dates": dates, "roll": roll}, **kw)

def doc_card(text: str, title: str, subtitle: str = "", *, bg: str = "study", **kw) -> dict:
    return narr(text, {"kind": "document", "title": title, "subtitle": subtitle, "bg": bg}, **kw)

def scene(set_name: str, cast_list: list, *, cam: dict = None) -> dict:
    v: dict = {"kind": "scene", "set": set_name, "cast": cast_list}
    if cam: v["cam"] = cam
    return v

def cast_char(char_id: str, x: int, pose: str, *, flip: bool = False, enter: str = None) -> dict:
    c: dict = {"id": char_id, "x": x, "pose": pose}
    if flip:  c["flip"] = True
    if enter: c["enter"] = enter
    return c

# ── mascot helper ─────────────────────────────────────────────────────────────
M = {"pose": "talk"}  # default mascot

# ── camera regions ────────────────────────────────────────────────────────────
# Map: lon/lat/zoom  (consistent: lon = x-axis, lat = y-axis)
WORLD     = {"lon": 100, "lat": 10,   "zoom": 1.8}
SEA       = {"lon": 109, "lat": 4,    "zoom": 4.2}
MALACCA   = {"lon": 104, "lat": 2,    "zoom": 5.5}
SG_ISLAND = {"lon": 103.82, "lat": 1.35, "zoom": 9}
SG_CITY   = {"lon": 103.82, "lat": 1.3,  "zoom": 11}
JOHOR     = {"lon": 103.7, "lat": 1.9,   "zoom": 7.5}
MALAYSIA  = {"lon": 109, "lat": 4,    "zoom": 4.8}
ASIA      = {"lon": 100, "lat": 25,   "zoom": 2.6}
JURONG    = {"lon": 103.7, "lat": 1.33, "zoom": 12}
TAIWAN    = {"lon": 121, "lat": 23.5, "zoom": 7}
TAIWAN_CL = {"lon": 121, "lat": 23.5, "zoom": 10}

# ── cast ──────────────────────────────────────────────────────────────────────
CAST = [
    {"id": "NARRATOR", "look": {}, "voice": ""},
    {"id": "MOTHER_1", "look": {"skin": "#c89060", "robe": "#8a4a2a", "trim": "#c9a95a", "hair": "#1e1a17", "bun": True}},
    {"id": "FATHER_1", "look": {"skin": "#d0a070", "robe": "#2b4a3a", "trim": "#7fae7a", "hair": "#1e1a17"}},
    {"id": "BRIT_OFF",  "look": {"skin": "#f0d8b8", "robe": "#8a0020", "trim": "#c9a95a", "hair": "#a08060", "hat": "tallhat", "hatColor": "#1e1a17"}},
    {"id": "SG_CLERK",  "look": {"skin": "#c89060", "robe": "#2b4a6b", "trim": "#f2d27a", "hair": "#1e1a17"}},
    {"id": "DAUGHTER",  "look": {"skin": "#c89060", "robe": "#7a3b7a", "trim": "#c9a95a", "hair": "#1e1a17", "bun": True}},
    {"id": "FATHER_2",  "look": {"skin": "#d0a070", "robe": "#2b4a3a", "trim": "#7fae7a", "hair": "#1e1a17", "glasses": True}},
    {"id": "SON",       "look": {"skin": "#c89060", "robe": "#2b4a6b", "trim": "#f2d27a", "hair": "#1e1a17"}},
    {"id": "MOTHER_2",  "look": {"skin": "#c89060", "robe": "#8a4a2a", "trim": "#c9a95a", "hair": "#1e1a17", "bun": True, "glasses": True}},
    {"id": "EXEC",      "look": {"skin": "#f0d8b8", "robe": "#2b4a6b", "trim": "#c9a95a", "hair": "#a08060", "glasses": True}},
    {"id": "EDB_OFF",   "look": {"skin": "#c89060", "robe": "#2b4a6b", "trim": "#f2d27a", "hair": "#1e1a17"}},
    {"id": "CUSTOMER",  "look": {"skin": "#e8c09a", "robe": "#a04020", "trim": "#f2d27a", "hair": "#1e1a17"}},
    {"id": "SALESMAN",  "look": {"skin": "#c89060", "robe": "#2b4a6b", "trim": "#c9a95a", "hair": "#1e1a17", "glasses": True}},
]

# ── segments ──────────────────────────────────────────────────────────────────

segments = []
_id_counters: dict = {}

def seg_id(ch: str) -> str:
    _id_counters[ch] = _id_counters.get(ch, 0) + 1
    return f"{ch}-s{_id_counters[ch]:02d}"

def add(ch: str, s: dict):
    s["id"] = seg_id(ch)
    segments.append(s)

# ═══════════════════════════════════════════════════════════════════════════════
# HOOK
# ═══════════════════════════════════════════════════════════════════════════════

add("hook", portrait(
    "On the ninth of August 1965, a prime minister sat in front of television cameras and broke down in tears.",
    src="archive/lee-kuan-yew-1965.jpg",
    caption="Lee Kuan Yew, 9 August 1965",
    year="1965",
    date="1965"
))

add("hook", map_seg(
    "His country had just been thrown out of the nation it had joined only two years earlier. It was now on its own.",
    SEA, SG_ISLAND,
    [
        nat(10, "sg", 103.82, 1.35),
        co(10, "Singapore", 103.82, 1.35, focus=True, zoom=10),
    ],
    date="1965"
))

add("hook", gray(
    "And on paper, it had almost no chance.",
    "warning", bg="sky",
    mascot={"pose": "confused"}
))

add("hook", map_seg(
    "It was a small island, smaller than the city of London. No oil. No gold. No farmland. Not even enough fresh water for its own people.",
    SG_ISLAND, SG_CITY,
    [
        co(0, "1 city-state", 103.82, 1.35, icon="castle", focus=True, zoom=11),
        co(6, "No oil", 103.7, 1.3, icon="dollar", side="left"),
        co(10, "No farmland", 103.9, 1.4, icon="wheat"),
    ]
))

add("hook", gray(
    "Nearly one in ten workers had no job. Many families lived in crowded wooden slums that could burn down in an afternoon.",
    "fire", bg="village",
    mascot={"pose": "confused"}
))

add("hook", action(
    "The average person earned around five hundred dollars a year. About the same as Mexico or South Africa at the time.",
    "bars",
    bg="street",
    bars=[
        {"label": "Singapore", "value": 500,  "color": "#c0392b", "flag": "sg"},
        {"label": "Mexico",    "value": 490,  "color": "#e67e22"},
        {"label": "USA",       "value": 3600, "color": "#3498db", "flag": "us"},
        {"label": "UK",        "value": 1400, "color": "#2ecc71", "flag": "gb"},
    ],
    hideValues=False,
    labels=[{"text": "GDP per person, 1965 (USD)", "x": 50, "y": 10, "at": 0.4, "size": 54}]
))

add("hook", gray("That country was Singapore.", "globe", bg="sky", mascot={"pose": "talk"}))

add("hook", action(
    "Now look at it today. In 2026, the average Singaporean produces more than a hundred and seven thousand dollars a year.",
    "bars",
    bg="skyline",
    bars=[
        {"label": "Singapore", "value": 107000, "color": "#f2d27a", "flag": "sg"},
        {"label": "USA",       "value": 86000,  "color": "#3498db", "flag": "us"},
        {"label": "UK",        "value": 49000,  "color": "#2ecc71", "flag": "gb"},
        {"label": "Germany",   "value": 55000,  "color": "#e67e22", "flag": "de"},
    ],
    hideValues=False,
    labels=[{"text": "GDP per person, 2026 (USD)", "x": 50, "y": 10, "at": 0.4, "size": 54}]
))

add("hook", gray(
    "That is more than the average American. More than the British, the French and the Germans. One of the highest figures on Earth.",
    "crown", bg="skyline",
    mascot={"pose": "happy"}
))

add("hook", crowd(
    "It has one of the busiest ports in the world, one of the cleanest governments in the world, and most families own their own home.",
    "port", "cheer", n=10, seed=22
))

add("hook", gray(
    "So how does a swamp with nothing go from five hundred dollars to more than a hundred thousand in one lifetime?",
    "scroll", bg="sky",
    mascot={"pose": "confused"}
))

add("hook", gray("It wasn't oil. It wasn't luck. And it definitely wasn't easy.", "diamond", bg="sky"))

add("hook", scroll(
    "To understand it, we have to go back to the moment someone first noticed this little island was in exactly the right place.",
    dates=["1819", "1959", "1965", "1971", "Today"],
    date="1819"
))

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 1 — The swamp in the right place
# ═══════════════════════════════════════════════════════════════════════════════

add("ch1", gray("Look at a map of Asia.", "globe", bg="study", mascot={"pose": "point"}))

add("ch1", map_seg(
    "Between India and China there is a narrow strip of sea called the Strait of Malacca.",
    WORLD, SEA,
    [
        lbl(0, "India", 77, 20),
        lbl(0, "China", 110, 32),
        lbl(5, "Strait of Malacca", 100, 3),
        flow_ev(8, [[73, 20], [82, 8], [100, 3], [103, 2]]),
    ]
))

add("ch1", map_seg(
    "For centuries, almost every ship carrying spices, silk, tea and later oil between the Indian Ocean and the Pacific had to squeeze through it.",
    SEA, MALACCA,
    [
        flow_ev(0, [[70, 10], [90, 5], [103, 2]]),
        flow_ev(5, [[103, 2], [112, 5], [120, 15]]),
        co(10, "Strait of Malacca", 100, 3, icon="ship", side="left", persist=True),
    ]
))

add("ch1", map_seg(
    "And right at the bottom of that strait, at the very tip of the Malay Peninsula, sits one small island.",
    MALACCA, SG_ISLAND,
    [
        pulse_ev(5, 103.82, 1.35),
        nat(8, "sg", 103.82, 1.35),
    ]
))

add("ch1", portrait(
    "In 1819, a British official named Stamford Raffles landed there and set up a trading post for the British East India Company.",
    src="archive/raffles-portrait.jpg",
    caption="Stamford Raffles, 1819",
    year="1819",
    date="1819"
))

add("ch1", gray(
    "His idea was simple. Make it a free port. No taxes on trade. Let every ship stop, buy, sell and move on.",
    "ship", bg="port",
    date="1819"
))

add("ch1", map_seg(
    "It worked. Merchants came from China, India, the Malay world, the Middle East and Europe.",
    SG_ISLAND, SEA,
    [
        move_ev(0, [[110, 22], [103.82, 1.35]]),
        move_ev(2, [[74, 15],  [103.82, 1.35]]),
        move_ev(4, [[115, 4],  [103.82, 1.35]]),
        move_ev(6, [[55, 25],  [103.82, 1.35]]),
        co(8, "Free port - no taxes", 103.82, 1.35, icon="banknotes", focus=True),
    ]
))

add("ch1", gray(
    "Singapore became one of the great trading hubs of the British Empire, a city of warehouses, docks and shophouses.",
    "factory", bg="port"
))

add("ch1", gray(
    "But here's the catch. Singapore didn't make much. It moved other people's goods.",
    "scroll", bg="study",
    mascot={"pose": "confused"}
))

add("ch1", gray(
    "It bought rubber and tin from the Malayan mainland and sold them on. It earned a living as a middleman.",
    "bag", bg="market"
))

add("ch1", gray(
    "And the British army and navy based there spent a lot of money and gave a lot of jobs.",
    "soldier", bg="port"
))

add("ch1", gray(
    "By the 1950s, that model was running out of road. The population had exploded, and there weren't nearly enough jobs or homes.",
    "exclaim", bg="street",
    mascot={"pose": "confused"}
))

add("ch1", map_seg(
    "In 1959, around two hundred thousand people were unemployed. That's roughly one in seven people on the whole island.",
    SG_ISLAND, SG_CITY,
    [
        co(0, "200,000 jobless", 103.82, 1.35, icon="exclaim", focus=True, zoom=11),
        co(5, "1 in 7 workers", 103.75, 1.3, side="left"),
    ],
    date="1959"
))

add("ch1", crowd("Hundreds of thousands lived in crowded shophouses or squatter villages made of wood and zinc.", "village", "stand", n=12, seed=7))

# Skit — kampong overcrowding
add("ch1", skit_seg("MOTHER_1", "Why are we sleeping in shifts again?", scene("home", [
    cast_char("MOTHER_1", 35, "talk"),
    cast_char("FATHER_1", 65, "confused", flip=True),
])))
add("ch1", skit_seg("FATHER_1", "Because there are eleven of us and one room.", scene("home", [
    cast_char("MOTHER_1", 35, "confused"),
    cast_char("FATHER_1", 65, "talk", flip=True),
])))
add("ch1", skit_seg("MOTHER_1", "And when the baby comes?", scene("home", [
    cast_char("MOTHER_1", 35, "talk"),
    cast_char("FATHER_1", 65, "happy", flip=True),
])))
add("ch1", skit_seg("FATHER_1", "Then we sleep in very short shifts.", scene("home", [
    cast_char("MOTHER_1", 35, "happy"),
    cast_char("FATHER_1", 65, "talk", flip=True),
])))

add("ch1", gray(
    "That same year, 1959, Singapore won the right to govern itself. The new government, led by Lee Kuan Yew, inherited every one of those problems.",
    "scroll", bg="street",
    date="1959"
))

add("ch1", crowd(
    "In May 1961, a fire swept through the wooden village of Bukit Ho Swee. Around sixteen thousand people lost their homes in a single day.",
    "village", "run", n=14, seed=11,
    date="1961"
))

add("ch1", gray(
    "The Housing and Development Board had been set up just a year earlier. It had the families rehoused in new concrete flats within about nine months.",
    "house", bg="home",
    mascot={"pose": "happy"}
))

add("ch1", gray(
    "Remember that. It's the first clue to how this country works.",
    "lightbulb", bg="sky",
    mascot={"pose": "point"}
))

add("ch1", gray(
    "But the government knew housing alone wouldn't fix anything. Singapore needed jobs, and it believed it couldn't survive as a tiny island on its own.",
    "exclaim", bg="study",
    mascot={"pose": "confused"}
))

add("ch1", map_seg(
    "So in 1963, Singapore joined its neighbours to form a new country: Malaysia.",
    SG_CITY, MALAYSIA,
    [
        nat(5, "my", 109, 4),
        nat(5, "sg", 103.82, 1.35),
        co(10, "Malaysia + Singapore", 109, 3, icon="shield"),
    ],
    date="1963"
))

add("ch1", gray("A big market. A big hinterland. Safety in numbers.", "shield", bg="market"))
add("ch1", gray("It lasted less than two years.", "broken", bg="sky", mascot={"pose": "confused"}))

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 2 — Kicked out
# ═══════════════════════════════════════════════════════════════════════════════

add("ch2", gray("From the start, the marriage was unhappy.", "heart", bg="street", mascot={"pose": "confused"}))

add("ch2", gray(
    "Singapore's leaders and the leaders in Kuala Lumpur disagreed about politics, about money, and above all about how a country of many races should be run.",
    "scroll", bg="street"
))

add("ch2", crowd(
    "In 1964, riots between communities broke out in Singapore, and people were killed.",
    "street", "protest", n=14, seed=4,
    date="1964"
))

add("ch2", gray(
    "Malaysia's prime minister decided the only way to avoid more bloodshed was to cut Singapore loose.",
    "broken", bg="street",
    mascot={"pose": "angry"}
))

add("ch2", gray(
    "The deal was negotiated in secret. On the morning of the ninth of August 1965, it was announced on the radio.",
    "scroll", bg="study",
    date="1965"
))

add("ch2", gray("Singapore was out.", "exclaim", bg="sky", mascot={"pose": "angry"}))

add("ch2", portrait(
    "Later that day, Lee Kuan Yew faced the press. Fighting back tears, he called it a moment of anguish.",
    src="archive/lee-kuan-yew-1965.jpg",
    caption="A moment of anguish - Lee Kuan Yew",
    year="1965",
    date="1965"
))

add("ch2", gray(
    "He had spent years arguing that Singapore could not survive alone. Now it had to.",
    "broken", bg="street",
    mascot={"pose": "confused"}
))

add("ch2", map_seg(
    "Think about what was lost overnight. The big market of the Malaysian mainland was now a foreign country, with its own tariffs.",
    MALAYSIA, SG_ISLAND,
    [
        nat(0, "sg", 103.82, 1.35),
        co(0, "Singapore alone", 103.82, 1.35, icon="island", focus=True, zoom=9, persist=True),
        co(8, "No access to Malay market", 103.3, 1.9, side="left"),
    ]
))

add("ch2", gray(
    "Next door, Indonesia was in an undeclared conflict with Malaysia, and trade with Singapore had been badly disrupted.",
    "sword", bg="sea",
    mascot={"pose": "confused"}
))

add("ch2", gray(
    "The island imported most of its food. It drew much of its water through pipes from across the border, from the very neighbour that had just shown it the door.",
    "water", bg="study",
    mascot={"pose": "confused"}
))

add("ch2", gray("And then, two years later, came the second blow.", "broken", bg="sky"))

add("ch2", gray(
    "Britain was running short of money and pulling back from Asia. In 1967 it announced it would close its bases east of Suez. Soon after, it brought the deadline forward to 1971.",
    "ship", bg="port",
    date="1967"
))

# Skit — British withdrawal
add("ch2", skit_seg("BRIT_OFF", "I'm afraid we're leaving.", scene("port", [
    cast_char("BRIT_OFF", 32, "talk"),
    cast_char("SG_CLERK", 68, "confused", flip=True),
])))
add("ch2", skit_seg("SG_CLERK", "When?", scene("port", [
    cast_char("BRIT_OFF", 32, "happy"),
    cast_char("SG_CLERK", 68, "talk", flip=True),
])))
add("ch2", skit_seg("BRIT_OFF", "1971.", scene("port", [
    cast_char("BRIT_OFF", 32, "talk"),
    cast_char("SG_CLERK", 68, "angry", flip=True),
])))
add("ch2", skit_seg("SG_CLERK", "How many jobs is that?", scene("port", [
    cast_char("BRIT_OFF", 32, "confused"),
    cast_char("SG_CLERK", 68, "talk", flip=True),
])))
add("ch2", skit_seg("BRIT_OFF", "About thirty thousand.", scene("port", [
    cast_char("BRIT_OFF", 32, "talk"),
    cast_char("SG_CLERK", 68, "angry", flip=True),
])))
add("ch2", skit_seg("SG_CLERK", "And how much of the economy?", scene("port", [
    cast_char("BRIT_OFF", 32, "happy"),
    cast_char("SG_CLERK", 68, "talk", flip=True),
])))
add("ch2", skit_seg("BRIT_OFF", "Roughly a fifth.", scene("port", [
    cast_char("BRIT_OFF", 32, "talk"),
    cast_char("SG_CLERK", 68, "confused", flip=True),
])))
add("ch2", skit_seg("SG_CLERK", "Anything else?", scene("port", [
    cast_char("BRIT_OFF", 32, "confused"),
    cast_char("SG_CLERK", 68, "talk", flip=True),
])))
add("ch2", skit_seg("BRIT_OFF", "Good luck.", scene("port", [
    cast_char("BRIT_OFF", 32, "happy"),
    cast_char("SG_CLERK", 68, "angry", flip=True),
])))

add("ch2", gray(
    "That's not an exaggeration. The British military accounted for about a fifth of Singapore's economy and more than thirty thousand jobs.",
    "exclaim", bg="port",
    mascot={"pose": "confused"}
))

add("ch2", gray(
    "No hinterland. No resources. A shaky water supply. And the biggest employer packing its bags.",
    "broken", bg="sky",
    mascot={"pose": "angry"}
))

add("ch2", gray(
    "Most experts at the time would not have bet on Singapore. So the government did something unusual. It stopped trying to look like a normal country.",
    "lightbulb", bg="study",
    mascot={"pose": "point"}
))

# Subscribe CTA
add("ch2", narr(
    "Quick pause. If you're enjoying this, subscribe to Farthing Explains. It's free, and it takes up even less space than Singapore.",
    {"kind": "gray", "props": [{"icon": "heart", "x": 52, "y": 56, "t": 0.4, "scale": 0.7}], "bg": "sky"},
    mascot={"pose": "happy"}
))

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 3 — Water, homes and iron rules
# ═══════════════════════════════════════════════════════════════════════════════

add("ch3", gray("Start with the scariest problem: water.", "water", bg="home", mascot={"pose": "point"}))

add("ch3", gray(
    "Singapore gets plenty of rain, but it's too small to store much of it. So it relied on pipes from the Malaysian state of Johor.",
    "water", bg="study"
))

add("ch3", map_seg(
    "Under a deal signed in 1962, Singapore can draw up to 250 million gallons a day from the Johor River, at a price of three Malaysian cents per thousand gallons.",
    SG_ISLAND, JOHOR,
    [
        flow_ev(0, [[103.5, 1.6], [103.82, 1.35]], color="#44aaff"),
        co(0, "Johor River", 103.5, 1.6, icon="water", side="left", persist=True),
        nat(0, "my", 103.5, 1.6),
        nat(0, "sg", 103.82, 1.35),
        co(8, "1962 water deal", 103.65, 1.4, icon="scroll"),
    ],
    date="1962"
))

add("ch3", gray(
    "That price has not changed since 1962. The deal runs until 2061. And Johor still supplies around forty percent of Singapore's water.",
    "water", bg="study"
))

add("ch3", gray(
    "But every Singaporean leader knew that a country whose taps can be turned off by a neighbour is not fully free.",
    "exclaim", bg="sky",
    mascot={"pose": "confused"}
))

add("ch3", gray(
    "So Singapore spent decades building what it calls its four national taps: rain caught in reservoirs, water from Johor, seawater turned fresh, and the strangest one of all.",
    "water", bg="study"
))

# Skit — NEWater
add("ch3", skit_seg("DAUGHTER", "Dad, where does this water come from?", scene("home", [
    cast_char("DAUGHTER", 35, "talk"),
    cast_char("FATHER_2", 65, "happy", flip=True),
])))
add("ch3", skit_seg("FATHER_2", "Some of it comes from the sewers.", scene("home", [
    cast_char("DAUGHTER", 35, "confused"),
    cast_char("FATHER_2", 65, "talk", flip=True),
])))
add("ch3", skit_seg("DAUGHTER", "I'm not thirsty anymore.", scene("home", [
    cast_char("DAUGHTER", 35, "angry"),
    cast_char("FATHER_2", 65, "happy", flip=True),
])))
add("ch3", skit_seg("FATHER_2", "It's cleaned so thoroughly it meets drinking-water standards. They call it NEWater.", scene("home", [
    cast_char("DAUGHTER", 35, "confused"),
    cast_char("FATHER_2", 65, "talk", flip=True),
])))
add("ch3", skit_seg("DAUGHTER", "They gave toilet water a brand name?", scene("home", [
    cast_char("DAUGHTER", 35, "talk"),
    cast_char("FATHER_2", 65, "happy", flip=True),
])))
add("ch3", skit_seg("FATHER_2", "And it works.", scene("home", [
    cast_char("DAUGHTER", 35, "happy"),
    cast_char("FATHER_2", 65, "talk", flip=True),
])))

add("ch3", gray(
    "It really does. Recycled water called NEWater now meets up to forty percent of Singapore's demand. Most goes to factories, but some is topped up into the reservoirs.",
    "water", bg="factory",
    mascot={"pose": "happy"}
))

add("ch3", gray("Next, homes.", "house", bg="home", mascot={"pose": "point"}))

add("ch3", crowd(
    "Remember that fire at Bukit Ho Swee? The Housing and Development Board kept building at that speed, block after block, for decades.",
    "skyline", "stand", n=10, seed=14
))

add("ch3", gray(
    "Then came the clever part. The government didn't want Singaporeans to rent. It wanted them to own.",
    "lightbulb", bg="home",
    mascot={"pose": "point"}
))

add("ch3", gray(
    "In the 1960s it let families buy their flats, and from 1968 they could pay using their compulsory retirement savings, the Central Provident Fund.",
    "piggybank", bg="bank",
    date="1968"
))

add("ch3", gray(
    "Every worker had to save part of their wages in that fund, and their employer added more. That gave the country a mountain of savings to invest, and gave families a stake in the country's future.",
    "money", bg="bank"
))

# Skit — new flat
add("ch3", skit_seg("SON", "Mum, is this flat really ours?", scene("home", [
    cast_char("SON", 35, "happy"),
    cast_char("MOTHER_2", 65, "talk", flip=True),
])))
add("ch3", skit_seg("MOTHER_2", "Ours, and the bank's, and your father's pension's.", scene("home", [
    cast_char("SON", 35, "confused"),
    cast_char("MOTHER_2", 65, "talk", flip=True),
])))
add("ch3", skit_seg("SON", "So it's ours.", scene("home", [
    cast_char("SON", 35, "happy"),
    cast_char("MOTHER_2", 65, "happy", flip=True),
])))
add("ch3", skit_seg("MOTHER_2", "It's ours.", scene("home", [
    cast_char("SON", 35, "happy"),
    cast_char("MOTHER_2", 65, "talk", flip=True),
])))

add("ch3", crowd(
    "Today more than eighty percent of Singaporeans live in public housing, and the vast majority of those flats are owned by the families living in them.",
    "skyline", "cheer", n=10, seed=19
))

add("ch3", gray("And third: the iron rules.", "scroll", bg="study", mascot={"pose": "point"}))

add("ch3", doc_card(
    "Singapore decided corruption would be treated as a serious crime, not a cost of doing business. A tough anti-corruption law was passed in 1960, and an independent bureau was given real teeth.",
    "Prevention of Corruption Act",
    "Singapore, 1960",
    bg="study",
    date="1960"
))

add("ch3", gray(
    "Today Transparency International ranks Singapore the third least corrupt country in the world.",
    "crown", bg="study",
    mascot={"pose": "happy"}
))

add("ch3", gray(
    "It also tamed its labour disputes. New laws in the late 1960s limited strikes, and by the late 1970s strikes had almost disappeared.",
    "scroll", bg="factory"
))

add("ch3", gray(
    "Critics say these rules came with a price, and we'll get to that. But for a foreign company deciding where to build a factory, the message was clear.",
    "exclaim", bg="sky",
    mascot={"pose": "point"}
))

add("ch3", gray(
    "Here, the rules are the rules. And here, you won't need to pay a bribe.",
    "shield", bg="sky",
    mascot={"pose": "happy"}
))

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 4 — Inviting the world in
# ═══════════════════════════════════════════════════════════════════════════════

add("ch4", gray(
    "Most poor countries in the 1960s were suspicious of big foreign companies. They put up tariffs, protected local firms and tried to make everything at home.",
    "factory", bg="factory",
    mascot={"pose": "talk"}
))

add("ch4", gray(
    "Argentina did exactly that, as we saw in our last episode.",
    "broken", bg="pampas"
))

add("ch4", gray(
    "Singapore did the opposite. It went looking for the biggest companies in the world and asked them to come.",
    "lightbulb", bg="factory",
    mascot={"pose": "point"}
))

add("ch4", gray(
    "The job went to the Economic Development Board, set up in 1961 on the advice of a Dutch economist, Albert Winsemius.",
    "scroll", bg="study",
    date="1961"
))

add("ch4", map_seg(
    "Its first big project was a swamp in the west of the island called Jurong. Crocodiles in the creeks. Almost nothing else.",
    SG_ISLAND, JURONG,
    [
        co(0, "Jurong swamp", 103.68, 1.33, icon="exclaim", focus=True, zoom=12),
        pulse_ev(5, 103.7, 1.33),
    ]
))

add("ch4", gray(
    "The government drained it, flattened hills, laid roads and built an industrial estate before there were any tenants. Critics called it Goh's Folly, after the finance minister.",
    "factory", bg="factory",
    mascot={"pose": "confused"}
))

add("ch4", gray(
    "At first, they had a point. Very few investors came. Goh reportedly had the board hold opening ceremonies for new factories day after day, just to show the world things were happening.",
    "broken", bg="factory",
    mascot={"pose": "confused"}
))

# Skit — EDB pitch
add("ch4", skit_seg("EXEC", "So why should I build my factory here?", scene("factory", [
    cast_char("EXEC", 35, "talk"),
    cast_char("EDB_OFF", 65, "happy", flip=True),
])))
add("ch4", skit_seg("EDB_OFF", "Our workers speak English. The land is ready. Power and water are connected.", scene("factory", [
    cast_char("EXEC", 35, "happy"),
    cast_char("EDB_OFF", 65, "talk", flip=True),
])))
add("ch4", skit_seg("EXEC", "And taxes?", scene("factory", [
    cast_char("EXEC", 35, "talk"),
    cast_char("EDB_OFF", 65, "happy", flip=True),
])))
add("ch4", skit_seg("EDB_OFF", "For new industries, up to ninety percent off your profits tax, for up to fifteen years.", scene("factory", [
    cast_char("EXEC", 35, "happy"),
    cast_char("EDB_OFF", 65, "talk", flip=True),
])))
add("ch4", skit_seg("EXEC", "And bribes?", scene("factory", [
    cast_char("EXEC", 35, "talk"),
    cast_char("EDB_OFF", 65, "angry", flip=True),
])))
add("ch4", skit_seg("EDB_OFF", "Try one and you'll go to jail.", scene("factory", [
    cast_char("EXEC", 35, "confused"),
    cast_char("EDB_OFF", 65, "talk", flip=True),
])))
add("ch4", skit_seg("EXEC", "Where do I sign?", scene("factory", [
    cast_char("EXEC", 35, "happy"),
    cast_char("EDB_OFF", 65, "happy", flip=True),
])))

add("ch4", doc_card(
    "That package was real. A 1967 law offered new export industries tax relief on up to ninety percent of their profits for up to fifteen years.",
    "Economic Expansion Incentives Act",
    "Singapore, 1967",
    bg="study",
    date="1967"
))

add("ch4", gray(
    "From 1968, the big names started to arrive. National Semiconductor came first, and Texas Instruments, Hewlett-Packard and General Electric followed.",
    "factory", bg="factory",
    mascot={"pose": "happy"},
    date="1968"
))

add("ch4", crowd(
    "By the end of the 1960s, Jurong had 181 factories in production. Goh's Folly wasn't a folly anymore.",
    "factory", "cheer", n=10, seed=33
))

add("ch4", gray(
    "The British bases were turned into something useful too. Their land was converted for business, and their naval dockyards became commercial shipyards.",
    "ship", bg="port"
))

add("ch4", action(
    "The country climbed the ladder step by step: from basic goods in the 1960s, to electronics in the 1970s, to hard disk drives in the 1980s.",
    "loop",
    bg="factory",
    items=[
        {"icon": "factory", "label": "1960s: basic goods"},
        {"icon": "factory", "label": "1970s: electronics"},
        {"icon": "factory", "label": "1980s: hard drives"},
    ]
))

add("ch4", gray(
    "By the 1980s, Singapore was the world's leading producer of hard disk drives.",
    "factory", bg="factory",
    mascot={"pose": "happy"}
))

add("ch4", gray(
    "From 1965 to the mid-1980s, the economy grew by around ten percent a year.",
    "money", bg="skyline"
))

add("ch4", crowd(
    "Meanwhile, the old port never stopped growing. In 2025 it handled a record 44 million containers, and it's regularly ranked the world's leading container port.",
    "port", "cheer", n=12, seed=27
))

add("ch4", gray(
    "And from the 1970s, banks followed the ships. Singapore turned itself into a financial centre for the whole region.",
    "money", bg="bank"
))

add("ch4", action(
    "The result? Around five hundred dollars per person in 1965. Around thirteen thousand by 1990. Around fifty-six thousand by 2015. More than a hundred and seven thousand today.",
    "crash",
    bg="street",
    item="Singapore GDP per person (USD)",
    cycle=True
))

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 5 — The price of the miracle
# ═══════════════════════════════════════════════════════════════════════════════

add("ch5", gray(
    "So is Singapore a paradise? Ask Singaporeans, and many will tell you it's more complicated.",
    "question", bg="skyline",
    mascot={"pose": "confused"}
))

add("ch5", gray(
    "Start with the cost of living. Land is scarce, so almost everything that needs space is expensive.",
    "exclaim", bg="skyline"
))

add("ch5", gray(
    "Want a car? Before you even buy one, you need a government permit just to own it for ten years.",
    "exclaim", bg="street",
    mascot={"pose": "confused"}
))

add("ch5", action(
    "In October 2026, the permit for a small car cost about 132,000 Singapore dollars. That's the permit. Not the car.",
    "pricetag",
    bg="shop",
    item="COE permit, Cat A, Oct 2026 (SGD)",
    from_=50000,
    to=132000
))

# Skit — car showroom
add("ch5", skit_seg("CUSTOMER", "How much for this little car?", scene("shop", [
    cast_char("CUSTOMER", 35, "talk"),
    cast_char("SALESMAN", 65, "happy", flip=True),
])))
add("ch5", skit_seg("SALESMAN", "The car, or the right to drive the car?", scene("shop", [
    cast_char("CUSTOMER", 35, "confused"),
    cast_char("SALESMAN", 65, "talk", flip=True),
])))
add("ch5", skit_seg("CUSTOMER", "There's a difference?", scene("shop", [
    cast_char("CUSTOMER", 35, "confused"),
    cast_char("SALESMAN", 65, "happy", flip=True),
])))
add("ch5", skit_seg("SALESMAN", "About a hundred and thirty thousand dollars of difference.", scene("shop", [
    cast_char("CUSTOMER", 35, "angry"),
    cast_char("SALESMAN", 65, "talk", flip=True),
])))
add("ch5", skit_seg("CUSTOMER", "I'll take the bus.", scene("shop", [
    cast_char("CUSTOMER", 35, "talk"),
    cast_char("SALESMAN", 65, "happy", flip=True),
])))
add("ch5", skit_seg("SALESMAN", "Everyone says that. The bus is very good.", scene("shop", [
    cast_char("CUSTOMER", 35, "happy"),
    cast_char("SALESMAN", 65, "talk", flip=True),
])))

add("ch5", gray(
    "The work is intense too. In 2015, Singaporeans worked around 2,300 hours a year, far more than most people in Europe.",
    "scroll", bg="factory",
    mascot={"pose": "confused"}
))

add("ch5", gray(
    "The wealth isn't spread evenly. Inequality is high for a rich country, and the economy depends heavily on foreign workers, many of them on low wages.",
    "broken", bg="street"
))

add("ch5", gray(
    "And then there's politics. One party has governed Singapore since independence.",
    "scroll", bg="study"
))

add("ch5", gray(
    "Critics, including press-freedom groups, say the media and the opposition have operated under tight limits for decades.",
    "exclaim", bg="study",
    mascot={"pose": "confused"}
))

add("ch5", gray(
    "Supporters reply that the same stability is exactly what made the miracle possible: long-term plans that weren't torn up every few years.",
    "shield", bg="study",
    mascot={"pose": "point"}
))

add("ch5", gray(
    "Remember Argentina, where every new government undid the last one's work? Singapore is close to the opposite.",
    "broken", bg="pampas"
))

add("ch5", gray(
    "There's one more risk. A country that lives by trade can also be hurt by trade. When the world economy stumbles, Singapore feels it fast.",
    "exclaim", bg="port",
    mascot={"pose": "confused"}
))

add("ch5", gray(
    "That's the bargain. Extraordinary wealth and order, paid for with high costs, hard work and a lot of trust in the people in charge.",
    "scroll", bg="sky",
    mascot={"pose": "talk"}
))

# ═══════════════════════════════════════════════════════════════════════════════
# CHAPTER 6 — The answer
# ═══════════════════════════════════════════════════════════════════════════════

add("ch6", gray("So let's put it together.", "lightbulb", bg="plaza", mascot={"pose": "point"}))

add("ch6", scroll(
    "A swamp in the right place. A free port. A fire that taught the government to build fast. A divorce nobody wanted. An army that packed up and left.",
    dates=["Free port 1819", "Fire 1961", "Kicked out 1965", "British leave 1971"]
))

add("ch6", gray(
    "So how did a country with nothing get richer than America? Most economists point to a few things working together.",
    "question", bg="plaza",
    mascot={"pose": "confused"}
))

add("ch6", action(
    "First, it turned its weakness into a sales pitch. With no natural resources to fight over, it sold the one thing it could control: being the easiest, safest, cleanest place in Asia to do business.",
    "loop",
    bg="plaza",
    items=[
        {"icon": "shield",    "label": "No corruption"},
        {"icon": "factory",   "label": "Ready land"},
        {"icon": "banknotes", "label": "Tax relief"},
        {"icon": "gold",      "label": "Open doors"},
    ]
))

add("ch6", gray(
    "Second, it opened its doors when most poor countries were closing theirs. Instead of protecting weak local firms, it brought in the world's best companies and learned from them.",
    "factory", bg="factory",
    mascot={"pose": "point"}
))

add("ch6", gray(
    "Third, it kept the rules stable. Low corruption, plans that lasted decades, and money that people trusted.",
    "shield", bg="study",
    mascot={"pose": "happy"}
))

add("ch6", gray(
    "And fourth, it gave ordinary people a stake. Compulsory savings and home ownership meant most families owned a piece of the country's success.",
    "house", bg="home",
    mascot={"pose": "happy"}
))

add("ch6", gray(
    "Singapore's own leaders will tell you there's a fifth ingredient: paranoia. A small country that never feels safe never stops planning.",
    "exclaim", bg="sky",
    mascot={"pose": "confused"}
))

add("ch6", action(
    "That's the real contrast with Argentina. Argentina was born rich and kept losing trust. Singapore was born poor and built trust brick by brick.",
    "scales",
    bg="plaza",
    tilt=-18,
    left={"icon": "broken", "label": "Argentina: lost trust"},
    right={"icon": "shield", "label": "Singapore: built trust"}
))

add("ch6", gray(
    "Natural wealth can make you rich for a while. Trust, it turns out, compounds.",
    "diamond", bg="sky",
    mascot={"pose": "happy"}
))

add("ch6", crowd(
    "If you made it this far, thank you. Subscribe to Farthing Explains for more stories about how money makes and breaks countries.",
    "skyline", "cheer", n=14, seed=42
))

add("ch6", map_seg(
    "Next time: a small island that makes almost all of the world's most advanced computer chips, and why that makes it one of the most valuable, and most nervous, places on Earth. See you there.",
    TAIWAN, TAIWAN_CL,
    [
        nat(5, "tw", 121, 23.5),
        co(5, "Taiwan - Next time", 121, 23.5, icon="factory", focus=True, zoom=10),
    ]
))

# ── assemble episode ──────────────────────────────────────────────────────────

MASCOT_SPEC = {
    "skin": "#e8c09a", "robe": "#2b4a6b", "trim": "#f2d27a",
    "hair": "#2b2622", "hat": "scholar", "hatColor": "#2b4a6b",
    "staff": "chronicler"
}

episode = {
    "title": "Singapore Had Nothing. Now It's Richer Than America.",
    "fps": 30,
    "mascot": MASCOT_SPEC,
    "narratorVoice": "",
    "cast": CAST,
    "sfxMode": "scenes",
    "sfxVolume": 0.7,
    "music": "music/bed.mp3",
    "musicVolume": 0.08,
    "segments": segments,
}

OUT.write_text(json.dumps(episode, indent=2, ensure_ascii=False))
print(f"Wrote {len(segments)} segments -> {OUT}")
