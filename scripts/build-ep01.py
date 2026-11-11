"""Builds episodes/ep01-argentina.json from the Farthing Explains Ep 1 script.
Spoken text only; stage directions live in the visuals. Run: python3 scripts/build-ep01.py"""
import json, copy

BA = [-58.38, -34.6]; ROS = [-60.65, -32.95]; COR = [-64.18, -31.42]; MEN = [-68.83, -32.89]
TUC = [-65.2, -26.8]; BB = [-62.27, -38.72]; LON = [-0.13, 51.5]; PAR = [2.35, 48.86]
GEN = [8.93, 44.4]; BCN = [2.17, 41.39]; NY = [-74.0, 40.7]; HAM = [9.99, 53.55]
BRA = [-47.9, -15.8]; SHA = [121.47, 31.23]; FALK = [-59.5, -51.7]; PAMPAS = [-61.5, -35.0]

V_WORLD = {"lon": -20, "lat": 15, "zoom": 1.3}
V_ATL = {"lon": -25, "lat": 5, "zoom": 1.7}
V_SAM = {"lon": -60, "lat": -25, "zoom": 3.0}
V_ARG = {"lon": -63, "lat": -33, "zoom": 5.5}
V_PAMPAS = {"lon": -61.5, "lat": -35, "zoom": 7}

MASCOT = json.load(open("episodes/demo-mali.json"))["mascot"]

def look(skin, robe, trim="#e0b84a", **k):
    d = {"skin": skin, "robe": robe, "trim": trim}; d.update(k); return d

CAST = [
    {"id": "BRITISH_INVESTOR", "look": look("#f0cfb0", "#3a3a48", "#b23a2a", hat="tallhat", hatColor="#1e1a17", prop="coin")},
    {"id": "RANCH_OWNER", "look": look("#d9a878", "#8a5a2b", hat="brim", hatColor="#5a3d2b", beard="short", beardColor="#3a2a1e", belt="#3a2a1e")},
    {"id": "GENERAL", "look": look("#e0b48c", "#5b6b3a", hat="peaked", hatColor="#4a5a30")},
    {"id": "CLERK", "look": look("#f0cfb0", "#6b7b8b", "#d9d9d9", hair="#3a2a1e", glasses=True, prop="scroll")},
    {"id": "WORKER", "look": look("#c89a6a", "#2d5a7b", "#9aa0a6", hat="cap", hatColor="#2d5a7b")},
    {"id": "FACTORY_OWNER", "look": look("#e8c4a0", "#4a3a3a", hat="tallhat", hatColor="#2b2622", beard="short", beardColor="#9a9a9a")},
    {"id": "SHOPPER", "look": look("#d9a878", "#b23a2a", hair="#3a2a1e", prop="coin")},
    {"id": "SHOPKEEPER", "look": look("#e8c4a0", "#f4f1ea", "#2f7f7a", hair="#5a3d2b", beard="short", beardColor="#5a3d2b")},
    {"id": "CUSTOMER", "look": look("#c89a6a", "#4f6d8f", hair="#2b2622")},
    {"id": "BANK_TELLER", "look": look("#f0cfb0", "#2b3a55", hair="#3a2a1e", glasses=True)},
    {"id": "GRANDSON", "look": look("#d9a878", "#e07b1f", hair="#2b2622")},
    {"id": "GRANDMOTHER", "look": look("#e8c4a0", "#7a3b5a", hair="#c9c9c9", bun=True, glasses=True)},
]

def P(icon, x, y, t=0.2, scale=None, anim=None):
    d = {"icon": icon, "x": x, "y": y, "t": t}
    if scale: d["scale"] = scale
    if anim: d["anim"] = anim
    return d

def gray(*props, icon=None):
    v = {"kind": "gray", "props": list(props)}
    if icon: v.update(icon=icon, iconX=58, iconY=50, iconScale=0.8)
    return v

def mp(frm, to=None, *events, keys=None, intro=None, rivers=None):
    v = {"kind": "map", "from": frm, "events": list(events)}
    if to: v["to"] = to
    if keys: v["keys"] = keys
    if intro: v["intro"] = intro
    if rivers: v["rivers"] = rivers
    return v

def scene(set_, *cast, props=None):
    v = {"kind": "scene", "set": set_, "cast": [dict(c) for c in cast]}
    if props: v["props"] = props
    return v

def setv(s): return {"kind": "set", "set": s}
def L(text, x, y, at=0.3, size=72, **k): d = {"text": text, "x": x, "y": y, "at": at, "size": size}; d.update(k); return d
def ev(type_, **k): d = {"type": type_}; d.update(k); return d

RAIL = [ev("flow", path=[BA, ROS, COR], t=0.4, color="#ffffff"), ev("flow", path=[BA, [-63, -33.5], MEN], t=0.8, color="#ffffff"),
        ev("flow", path=[BA, [-60.5, -36.5], BB], t=1.2, color="#ffffff"), ev("flow", path=[ROS, [-63.5, -29], TUC], t=1.6, color="#ffffff")]

segs = []
counter = {}
def add(ch, text, visual, speaker="NARRATOR", type_="narration", mascot="talk", date=None, labels=None, poses=None, mood=None, cta=None, side=None):
    counter[ch] = counter.get(ch, 0) + 1
    s = {"id": f"c{ch:02d}-s{counter[ch]:02d}", "type": type_, "speaker": speaker, "text": text, "visual": copy.deepcopy(visual)}
    if date: s["date"] = date
    if labels: s["labels"] = labels
    if mood: s["mood"] = mood
    if cta: s["ctaText"] = cta
    no_mascot = type_ == "skit" or visual["kind"] in ("portrait", "photo", "scroll")
    if mascot and not no_mascot:
        s["mascot"] = {"pose": mascot}
        if poses: s["mascot"]["poses"] = poses
        if side: s["mascot"]["side"] = side
    segs.append(s)

def skit(ch, set_, a, b, lines, date=None, props=None, enter_b=None):
    """lines: list of (speaker, text, pose_a, pose_b)"""
    for i, (spk, text, pa, pb) in enumerate(lines):
        ca = {"id": a, "x": 32, "pose": pa}
        cb = {"id": b, "x": 68, "pose": pb, "flip": True}
        if i == 0 and enter_b: cb["enter"] = enter_b
        add(ch, text, scene(set_, ca, cb, props=props), speaker=spk, type_="skit", date=date)

# ---------------- Chapter 1: Hook ----------------
add(1, "In 1913, if you were a young European looking for a better life, there was one country that kept coming up.",
    mp({"lon": -30, "lat": 10, "zoom": 1.2}, {"lon": -58, "lat": -30, "zoom": 3.2}, ev("pin", at=BA, t=2.6, label="Buenos Aires"), intro="clouds"), date="1913")
add(1, "Not America. Not Canada. Argentina.",
    mp({"lon": -62, "lat": -5, "zoom": 1.3}, None, ev("fill", countries=["United States of America"], t=0.1, color="#9aa0a6"),
       ev("fill", countries=["Canada"], t=0.8, color="#9aa0a6"), ev("fill", countries=["Argentina"], t=1.5, color="#e0a526"),
       ev("label", at=[-66, -36], text="Argentina", t=1.7, style="region", rotate=-75, size=44)), mascot="point", side="left")
add(1, "It had some of the richest farmland on Earth.", gray(P("wheat", 42, 58, 0.2, 1.3), P("cattle", 66, 60, 0.7, 1.3)),
    labels=[L("richest farmland", 52, 22, 0.4, emph="underline")])
add(1, "Its capital was building wide boulevards, grand opera houses and the first subway in Latin America.", setv("palace"),
    labels=[L("opera houses", 30, 18, 1.4, color="#f5c518"), L("first subway in Latin America", 44, 36, 3.2, size=58)])
add(1, "And on average, Argentines earned more than the French and more than the Germans.",
    gray(P("bag", 40, 56, 0.2, 0.5), P("coins", 64, 58, 0.6, 0.6)), labels=[L("more than France", 50, 20, 1.2), L("more than Germany", 52, 32, 2.6)], mascot="point")
add(1, "Even in 1947, after two world wars, Argentina was still one of the ten richest countries on the planet.",
    gray(P("crown", 52, 56, 0.4, 0.7)), date="1947", labels=[L("top 10", 52, 22, 2.6, size=90, color="#f5c518", emph="circle")])
add(1, "Now look at it today. Argentina has defaulted on its debts nine times.", gray(P("stamp", 52, 54, 1.8, 1.6, "shake")),
    date="Today", labels=[L("9 defaults", 52, 22, 2.4, size=86, emph="underline")], mascot="confused")
add(1, "In 1989, prices in its shops rose by around five thousand percent in a single year.",
    gray(P("banknotes", 52, 58, 0.3, 1.6, "pulse")), date="1989", labels=[L("5,000%", 52, 22, 2.6, size=110, color="#e0402b", emph="box")], mascot="angry")
add(1, "And many Argentines still keep their savings in US dollars, hidden at home, because they do not trust their own money.",
    {"kind": "set", "set": "home"}, labels=[L("dollars at home", 40, 20, 1.6)])
add(1, "So how does a country go from richer than France to broke, again and again?", gray(icon="question"), mascot="confused")
add(1, "It wasn't a war. It wasn't a famine. It wasn't a single bad leader.",
    gray(P("sword", 30, 56, 0.1, 0.45), P("wheat", 52, 58, 1.1, 1.3), P("crown", 74, 56, 2.2, 0.45)), mascot="shrug",
    labels=[L("not a war", 30, 22, 0.2, size=56), L("not a famine", 52, 22, 1.2, size=56), L("not one leader", 74, 22, 2.3, size=56)])
add(1, "To find out, we have to go back to the moment Argentina found its fortune.",
    {"kind": "scroll", "dates": ["1870", "1930", "1946", "1989", "2001", "Today"], "highlight": 0, "roll": "close"})

# ---------------- Chapter 2: The boom ----------------
add(2, "And it all started with grass.", mp(V_SAM, {"lon": -62, "lat": -34, "zoom": 4.5}, ev("fill", countries=["Argentina"], t=0.3, color="#8fc45a")), date="1870")
add(2, "This is the Pampas. A sea of flat, fertile grassland bigger than most countries in Europe.",
    mp({"lon": -62, "lat": -34, "zoom": 4.5}, V_PAMPAS, ev("label", at=[-62, -31.6], text="the Pampas", t=0.6, style="region", rotate=-8, size=90),
       ev("scatter", around=PAMPAS, icon="wheat", n=7, spread=2.2, t=2.2, size=0.45)), mascot="point")
add(2, "No mountains to cross, no thick forest to clear. Just endless grass, rain and rich black soil.",
    mp(V_PAMPAS, {"lon": -61, "lat": -35.5, "zoom": 7.5}, ev("scatter", around=[-60.5, -36], icon="cattle", n=6, spread=2, t=1.5, size=0.5)))
add(2, "For most of history, that grass fed wild cattle and not much else.",
    mp({"lon": -61, "lat": -35.5, "zoom": 7.5}, None, ev("move", path=[[-63.5, -36.5], [-61, -35], [-59, -34.6]], icon="cattle", count=4, t=0.4, dur=3.5, trail=False)))
add(2, "Argentina had the land, but it had a problem.", gray(P("cattle", 46, 58, 0.2, 1.3)), mascot="shrug", labels=[L("a problem", 60, 22, 1.2, emph="underline")])
add(2, "The people who wanted to buy its beef and grain lived on the other side of an ocean.",
    mp({"lon": -45, "lat": -20, "zoom": 2.2}, V_ATL, ev("pin", at=BA, t=0.4), ev("pin", at=LON, t=2.4, label="London"),
       ev("arrow", **{"from": BA, "to": LON}, t=3.0, color="#ffd34d")), mascot="point")
add(2, "And meat goes bad long before a sailing ship can cross the Atlantic.",
    mp(V_ATL, None, ev("move", path=[BA, [-35, -15], [-25, 15], [-12, 40], LON], icon="ship", t=0.3, dur=4.5),
       ev("label", at=[-30, 0], text="weeks at sea", t=1.5)), mascot="confused")
add(2, "Then, in the 1870s, everything changed at once.", gray(icon="exclaim"), mascot="point", date="1870s")
add(2, "First came the railways.", mp({"lon": -62, "lat": -33, "zoom": 4.8}, V_ARG, ev("icon", at=BA, icon="train", t=0.3, size=0.8)))
add(2, "British investors poured money into Argentina, and British companies laid thousands of kilometres of track.",
    mp(V_ARG, None, *RAIL, ev("move", path=[BA, ROS, COR], icon="train", t=1.0, dur=4, trail=False), ev("icon", at=[-57, -31], icon="banknotes", t=0.3, size=0.7)))
add(2, "Every line ran the same way: from the farms in the interior straight to the port of Buenos Aires.",
    mp(V_ARG, None, *[dict(e, t=0) for e in RAIL], ev("pin", at=BA, t=2.2, label="Buenos Aires"),
       ev("arrow", **{"from": COR, "to": BA}, t=1.0, color="#ffd34d"), ev("arrow", **{"from": MEN, "to": BA}, t=1.4, color="#ffd34d")), mascot="point")
add(2, "Second came the cold. French engineers had worked out how to freeze meat on board a ship.",
    gray(P("ship", 44, 58, 0.4, 1.6), P("cattle", 66, 62, 1.6, 1.0)), labels=[L("frozen", 56, 22, 2.4, size=86, color="#9fd4ff", emph="box")])
add(2, "Suddenly, a steak from the Pampas could reach a dinner table in London or Paris, still fresh.",
    mp(V_ATL, None, ev("move", path=[BA, [-35, -15], [-25, 15], [-12, 40], LON], icon="ship", t=0.3, dur=4), ev("pin", at=LON, t=3.5, label="London & Paris")))
skit(2, "sea", "BRITISH_INVESTOR", "RANCH_OWNER", [
    ("BRITISH_INVESTOR", "So, we build the railway. You send the beef. We buy the beef.", "point", "talk"),
    ("RANCH_OWNER", "And who owns the railway?", "talk", "confused"),
    ("BRITISH_INVESTOR", "We do.", "happy", "talk"),
    ("RANCH_OWNER", "And the ships?", "talk", "confused"),
    ("BRITISH_INVESTOR", "Also us.", "happy", "shrug"),
    ("RANCH_OWNER", "And the banks that lend me the money?", "talk", "angry"),
    ("BRITISH_INVESTOR", "Do you want to get rich or not?", "shrug", "talk"),
    ("RANCH_OWNER", "Pass me the pen.", "happy", "happy")], date="1880", enter_b="right")
add(2, "It was a fantastic deal for both sides, at least at first.", mp(V_ATL, None, ev("flow", path=[BA, [-30, -5], [-15, 30], LON], t=0.2, color="#ffd34d", width=8),
    ev("flow", path=[LON, [-20, 30], [-35, -5], BA], t=1.0, color="#ffffff")), mascot="happy")
add(2, "Argentina became one of the biggest exporters of beef, wheat, corn and wool in the world.",
    mp(V_ATL, None, ev("icon", at=PAMPAS, icon="cattle", t=0.4, size=0.8), ev("icon", at=[-64, -30], icon="wheat", t=1.0, size=0.8),
       ev("flow", path=[BA, [-25, 10], LON], t=1.6, color="#ffd34d"), ev("flow", path=[BA, [-20, 15], PAR], t=2.0, color="#ffd34d"), ev("flow", path=[BA, [-22, 20], HAM], t=2.4, color="#ffd34d")))
add(2, "Money flowed in faster than the country could spend it.", gray(P("banknotes", 40, 58, 0.2, 1.4, "bob"), P("coins", 66, 58, 0.8, 0.6), P("bag", 52, 40, 1.6, 0.4)), mascot="happy")
add(2, "And people followed the money. Between 1870 and 1914, nearly six million Europeans sailed to Argentina, mostly from Italy and Spain.",
    mp({"lon": -20, "lat": 5, "zoom": 1.6}, None, ev("pin", at=GEN, t=0.6, label="Italy"), ev("pin", at=BCN, t=1.0, label="Spain"),
       ev("move", path=[GEN, [0, 35], [-25, 5], BA], icon="ship", count=3, t=1.4, dur=5), ev("move", path=[BCN, [-15, 30], [-30, 0], BA], icon="ship", count=2, t=2.0, dur=5),
       ev("counter", at=[-30, 20], **{"from": 0, "to": 5900000}, t=3.0, dur=2.5, suffix=" people")))
add(2, "More than three million of them stayed.", mp(V_ARG, None, ev("scatter", around=[-59.5, -34], icon="house", n=8, spread=1.6, t=0.3, size=0.45),
    ev("label", at=[-62, -29.5], text="3 million stayed", t=0.8)))
add(2, "By the 1890s, in parts of Buenos Aires, you were more likely to hear Italian than the local Spanish.", setv("market"),
    labels=[L("Ciao!", 30, 24, 1.0, color="#9fe08a"), L("Buongiorno!", 58, 18, 1.8, color="#9fe08a"), L("¡Hola!", 74, 30, 3.0, size=56)], date="1890s")
add(2, "Buenos Aires earned a nickname: the Paris of South America.", setv("palace"), labels=[L("the Paris of South America", 46, 22, 1.2, color="#f5c518", emph="underline")])
add(2, "Its rich families shipped their furniture from France, sent their sons to European universities and built mansions that would not look out of place on the Champs-Élysées.",
    scene("palace", props=[P("chest", 30, 72, 0.6, 0.35), P("book", 48, 70, 2.2, 0.3), P("castle", 66, 66, 4.0, 1.4)]))
add(2, "There was a saying in Europe at the time. If someone was extremely wealthy, people said they were as rich as an Argentine.",
    gray(P("bag", 52, 58, 0.4, 0.5)), labels=[L("as rich as an Argentine", 50, 22, 3.6, color="#f5c518", emph="box")], mascot="happy")
add(2, "By 1913, the country was a success story that the whole world was watching. But look closely at that map again.",
    mp(V_ARG, None, *[dict(e, t=0) for e in RAIL]), date="1913", poses=[{"t": 3.5, "pose": "point"}])
add(2, "Every railway line led to one port. Almost every ship sailed to the same few buyers.",
    mp(V_ARG, {"lon": -45, "lat": -10, "zoom": 2.4}, *[dict(e, t=0) for e in RAIL], ev("pin", at=BA, t=0.4, label="one port"),
       ev("arrow", **{"from": BA, "to": [-20, 20]}, t=2.6, color="#ffd34d")))
add(2, "And almost all the best land belonged to a small group of very rich families.",
    mp(V_PAMPAS, None, ev("scatter", around=PAMPAS, icon="crown", n=4, spread=2, t=0.6, size=0.55), ev("label", at=[-61.5, -32.8], text="a few families", t=1.8)))
add(2, "Argentina had built a machine that turned grass into gold. It just hadn't built much of anything else.",
    gray(P("wheat", 36, 58, 0.3, 1.2), P("coins", 64, 58, 1.4, 0.6)), labels=[L("grass → gold", 50, 22, 1.0, color="#f5c518")], poses=[{"t": 3.2, "pose": "shrug"}])
add(2, "As long as the world kept buying, that didn't matter. Then, one day, the world stopped buying.",
    mp(V_WORLD, None, ev("flow", path=[BA, [-25, 10], LON], t=0, color="#ffd34d")), poses=[{"t": 2.8, "pose": "confused"}])

# ---------------- Chapter 3: The cracks ----------------
add(3, "In October 1929, the New York stock market crashed, and the Great Depression spread around the world.",
    mp({"lon": -60, "lat": 30, "zoom": 2.4}, V_WORLD, ev("pin", at=NY, t=0.4, label="New York"), ev("battle", at=NY, t=1.8),
       ev("pulse", at=LON, t=3.0, color="#e0402b"), ev("pulse", at=BA, t=3.6, color="#e0402b"), ev("pulse", at=PAR, t=4.0, color="#e0402b")), date="1929")
add(3, "Factories closed. Families stopped buying.", gray(P("factory", 38, 58, 0.1, 1.4), P("bag", 66, 58, 1.2, 0.4)), mascot="confused")
add(3, "And the price of beef and wheat, the two things Argentina sold, collapsed.",
    gray(P("cattle", 38, 60, 0.3, 1.2), P("wheat", 62, 60, 0.9, 1.2)), labels=[L("collapsed", 50, 22, 2.6, color="#e0402b", emph="underline")], mascot="angry")
add(3, "For a country that earned almost everything from exports, this was a disaster.", mp(V_ATL, None, ev("flow", path=[BA, [-25, 10], LON], t=0, color="#e0402b", width=2)), mascot="confused")
add(3, "Britain, its biggest customer, began favouring food from its own empire.",
    mp(V_WORLD, {"lon": 30, "lat": 10, "zoom": 1.2}, ev("fill", countries=["United Kingdom", "Canada", "Australia", "India", "South Africa", "New Zealand"], t=0.4, color="#e88a9a", stagger=0.25),
       ev("flow", path=[[134, -25], [80, -10], [40, 10], LON], t=2.2, color="#ffd34d"), ev("flow", path=[[-100, 55], [-50, 55], LON], t=2.6, color="#ffd34d")), side="left")
add(3, "The ships that used to leave Buenos Aires full now left half empty.", mp(V_ATL, None, ev("move", path=[BA, [-30, 0], [-15, 35], LON], icon="ship", t=0.3, dur=4),
    ev("label", at=[-30, -5], text="half empty", t=1.4)))
add(3, "And then something happened that would shape the next fifty years.", gray(icon="exclaim"), mascot="point")
add(3, "Argentina had become a democracy in 1912, when it gave men the secret ballot.", gray(P("scroll", 52, 58, 0.4, 1.6)), date="1912",
    labels=[L("secret ballot", 52, 22, 2.6, emph="underline")])
add(3, "But in September 1930, with the economy falling apart, the army marched into Buenos Aires and removed the elected president.",
    scene("night-city", {"id": "GENERAL", "x": 46, "pose": "angry", "enter": "left"}), mood="night", date="1930")
add(3, "It was the country's first military coup of the twentieth century. It would not be the last.",
    gray(P("flag", 52, 58, 0.3, 1.5)), labels=[L("coup #1", 52, 22, 1.4, size=86, emph="circle")], poses=[{"t": 3.2, "pose": "confused"}])
skit(3, "study", "GENERAL", "CLERK", [
    ("GENERAL", "Don't worry. We're only here until things calm down.", "talk", "confused"),
    ("CLERK", "How long is that?", "talk", "talk"),
    ("GENERAL", "A few months. A year at most.", "shrug", "talk"),
    ("CLERK", "Temporary. Got it.", "talk", "happy")], date="1930")
add(3, "Over the next half century, the army took power again and again.", {"kind": "scroll", "dates": ["1930", "1943", "1955", "1962", "1966", "1976"]})
add(3, "Elected governments came and went. And every new government tore up the plans of the one before it.",
    gray(P("scroll", 40, 58, 0.3, 1.4), P("fire", 62, 60, 2.6, 1.4)), labels=[L("plans torn up", 52, 22, 2.8)], mascot="angry")
add(3, "That pattern, more than any single policy, is the thread that runs through this whole story. Remember it.",
    gray(icon="exclaim"), labels=[L("remember this", 52, 20, 3.8, emph="circle")], mascot="point")
add(3, "But first, Argentina tried to fix its biggest weakness.", gray(P("wheat", 52, 58, 0.3, 1.4)))
add(3, "If selling food to the world was too risky, maybe the answer was to stop depending on the world altogether.",
    mp(V_WORLD, V_SAM, ev("fill", countries=["Argentina"], t=2.0, color="#e0a526"), ev("label", at=[-66, -36], text="go it alone", t=3.2)))
add(3, "Quick pause. If you're enjoying the story so far, subscribe to the channel. It's free, and unlike the peso, it holds its value.",
    setv("sky"), type_="cta", mascot="happy", cta="It's free. And unlike the peso, it holds its value.")

# ---------------- Chapter 4: The Perón years ----------------
add(4, "In 1946, Argentina elected a former army colonel named Juan Domingo Perón.",
    {"kind": "portrait", "src": "archive/peron.jpg", "name": "Juan Domingo Perón"}, date="1946")
add(4, "And no single person has shaped the country's economy more, for better or for worse, depending on who you ask.", gray(P("scales", 52, 56, 0.4, 0.6, "shake")), mascot="shrug")
add(4, "Perón's big idea was simple. Argentina should stop being a farm for Europe and start making things for itself.",
    gray(P("wheat", 36, 58, 0.3, 1.3), P("factory", 64, 58, 2.6, 1.4)), labels=[L("farm → factory", 50, 22, 2.8)])
add(4, "Instead of selling beef and buying cars, radios and machines from abroad, it would build its own factories and make them at home.",
    mp(V_ARG, None, ev("arrow", **{"from": [-40, -20], "to": BA}, t=0.3, color="#e0402b"), ev("icon", at=BA, icon="factory", t=2.6, size=0.8),
       ev("icon", at=COR, icon="factory", t=3.2, size=0.8), ev("icon", at=ROS, icon="factory", t=3.8, size=0.8)))
add(4, "To protect those new factories, the government made imported goods expensive with high taxes and strict limits.",
    gray(P("shield", 40, 56, 0.4, 0.55), P("factory", 64, 60, 0.8, 1.3)), labels=[L("import taxes", 52, 20, 2.6, emph="underline")])
add(4, "It bought the British-owned railways and put them in state hands.",
    mp(V_ARG, None, *[dict(e, t=0) for e in RAIL], ev("move", path=[COR, ROS, BA], icon="train", t=0.4, dur=3, trail=False), ev("flag", at=BA, t=1.8, color="#74acdf")), date="1948")
add(4, "It took control of the grain trade, buying crops from farmers at low prices and selling them abroad at higher ones,",
    gray(P("wheat", 30, 58, 0.3, 1.2), P("coins", 52, 60, 1.6, 0.4), P("ship", 74, 58, 3.0, 1.3)), labels=[L("buy low", 30, 22, 1.4, size=58), L("sell high", 72, 22, 3.2, size=58)])
add(4, "using the difference to pay for industry and social programmes.", gray(P("factory", 40, 58, 0.2, 1.3), P("heart", 64, 56, 1.4, 0.45)))
add(4, "For working people, especially in the cities, life got noticeably better.", scene("factory", {"id": "WORKER", "x": 48, "pose": "happy"}), mascot="happy")
add(4, "Wages rose. Workers got paid holidays, pensions and new rights.", scene("factory", {"id": "WORKER", "x": 48, "pose": "happy"}),
    labels=[L("wages ↑", 24, 30, 0.2, color="#9fe08a"), L("paid holidays", 48, 14, 1.2), L("pensions", 70, 32, 2.2)])
add(4, "Millions of Argentines felt, for the first time, that the country's wealth belonged to them too.", gray(P("heart", 52, 56, 0.4, 0.6, "pulse")))
skit(4, "factory", "WORKER", "FACTORY_OWNER", [
    ("WORKER", "Boss, our new radios are ready! Made right here in Argentina!", "happy", "talk"),
    ("FACTORY_OWNER", "Wonderful. How do they compare to the foreign ones?", "talk", "talk"),
    ("WORKER", "Twice the price. But I helped build it, and next month I get my first paid holiday.", "shrug", "confused"),
    ("FACTORY_OWNER", "And who will buy them?", "talk", "confused"),
    ("WORKER", "Everyone. The foreign ones cost three times as much now.", "point", "talk"),
    ("FACTORY_OWNER", "Then let's build another factory.", "happy", "happy")], date="1950")
add(4, "This is where historians and economists still argue, and both sides have a real case.",
    gray(P("scales", 52, 56, 0.3, 0.6)), labels=[L("supporters", 28, 22, 1.4, color="#9fe08a"), L("critics", 74, 22, 2.2, color="#ff9b8a")])
add(4, "Supporters say Perón gave ordinary workers dignity and a share of the national wealth that the old ranching elite never would have.",
    gray(P("heart", 40, 56, 0.6, 0.5), P("coins", 64, 60, 2.6, 0.45)), labels=[L("supporters say", 44, 20, 0.2, color="#9fe08a")])
add(4, "They point out that the factories, unions and welfare system he built became the backbone of Argentina's middle class.",
    gray(P("factory", 30, 58, 0.3, 1.2), P("house", 52, 58, 1.2, 1.3), P("heart", 74, 56, 2.2, 0.4)))
add(4, "Critics say the plan had a hidden cost. Protected factories never had to compete, so many stayed inefficient.",
    gray(P("shield", 40, 56, 0.4, 0.5), P("factory", 64, 60, 1.6, 1.2, "shake")), labels=[L("critics say", 44, 20, 0.2, color="#ff9b8a")])
add(4, "Paying farmers less discouraged them from growing more, just when the country needed exports to pay for factory machines.",
    gray(P("wheat", 40, 60, 0.3, 1.2), P("banknotes", 64, 60, 2.0, 1.2)), mascot="confused")
add(4, "And when the money ran short, the government did something that would become a very bad habit.", gray(icon="question"), mascot="confused")
add(4, "It printed more of it.", gray(P("press", 52, 56, 0.1, 2.4, "none"), P("banknotes", 70, 64, 0.6, 1.0, "bob")),
    labels=[L("PRINT", 50, 20, 0.4, size=100, color="#e0402b", emph="box")], mascot="angry")
add(4, "In 1955, Perón himself was overthrown by another military coup. He went into exile for almost eighteen years.",
    scene("night-city", {"id": "GENERAL", "x": 46, "pose": "angry", "enter": "right"}), mood="night", date="1955")
add(4, "But his movement never went away.", gray(P("flag", 52, 58, 0.2, 1.5)))
add(4, "For decades, Argentine politics would swing back and forth between his followers and his opponents,", gray(P("scales", 52, 56, 0.3, 0.6, "shake")))
add(4, "each side undoing what the other had built.", gray(P("factory", 40, 58, 0.2, 1.2), P("fire", 62, 60, 1.2, 1.3)), mascot="angry")
add(4, "And underneath all of that swinging, one problem kept growing quietly in the background.", gray(P("banknotes", 52, 58, 0.4, 1.5, "pulse")))

# ---------------- Chapter 5: The money machine ----------------
add(5, "That problem was inflation, prices rising year after year.", setv("shop"), labels=[L("inflation", 44, 22, 1.0, size=90, color="#e0402b", emph="underline")])
add(5, "And to understand why it never went away, you need to understand a trap.", gray(icon="question"), mascot="point")
add(5, "Imagine a government that promises more than it can afford: more jobs, more pensions, more support for factories.",
    gray(P("factory", 30, 58, 3.4, 1.1), P("heart", 52, 56, 4.4, 0.4), P("coins", 74, 60, 5.4, 0.45)))
add(5, "Taxes don't cover it. Borrowing is hard because lenders don't trust you.", gray(P("bag", 38, 58, 0.2, 0.45), P("scales", 64, 56, 1.8, 0.5, "shake")))
add(5, "So the central bank simply creates more money to pay the bills.", gray(P("press", 50, 56, 0.2, 2.2), P("banknotes", 70, 64, 1.4, 1.0)))
add(5, "For a while, it feels great. Everyone has more pesos.", gray(P("banknotes", 34, 60, 0.2, 1.2), P("banknotes", 56, 56, 0.6, 1.3), P("banknotes", 76, 62, 1.0, 1.1)), mascot="happy")
add(5, "But there are no more goods in the shops than before. So shopkeepers raise prices.", setv("shop"), labels=[L("prices ↑", 40, 22, 2.8, size=90, color="#e0402b")], mascot="confused")
add(5, "Workers demand higher wages to keep up. The government prints even more to pay them. And round and round it goes.",
    gray(P("factory", 34, 46, 0.2, 1.0), P("press", 66, 46, 2.4, 1.6), P("banknotes", 50, 72, 4.0, 1.0)), labels=[L("the loop", 50, 18, 4.6, emph="circle")])
add(5, "Through the 1950s, 60s and 70s, Argentina was stuck in this loop.", {"kind": "scroll", "dates": ["1950s", "1960s", "1970s"]})
add(5, "Civilian governments and military ones took turns, and almost all of them leaned on the printing press.", gray(P("press", 52, 56, 0.6, 2.2, "none")))
add(5, "In 1976 the army seized power once more and ran a brutal dictatorship until 1983.", scene("night-city", {"id": "GENERAL", "x": 46, "pose": "angry"}), mood="night", date="1976")
add(5, "It borrowed heavily from foreign banks, and Argentina's debt ballooned.",
    mp(V_ATL, None, ev("flow", path=[NY, [-40, 0], BA], t=0.3, color="#e0402b"), ev("flow", path=[LON, [-25, 10], BA], t=0.8, color="#e0402b"),
       ev("icon", at=BA, icon="banknotes", t=2.0, size=0.9)))
add(5, "When the generals finally gave up power after losing the Falklands War against Britain in 1982,",
    mp({"lon": -62, "lat": -42, "zoom": 5}, {"lon": -61, "lat": -47, "zoom": 6.5}, ev("pin", at=FALK, t=1.2, label="Falklands"), ev("battle", at=[-58.5, -51.0], t=2.4)), date="1982")
add(5, "they left behind a mountain of debt and an economy close to breaking.", gray(P("banknotes", 52, 58, 0.2, 2.2, "shake")), labels=[L("mountain of debt", 52, 20, 1.6)], mascot="confused")
add(5, "The new democratic governments inherited that mess. They tried new currencies, price freezes and emergency plans. None of them stuck.",
    gray(P("banknotes", 30, 58, 2.2, 1.0), P("scroll", 52, 58, 3.4, 1.2), P("hourglass", 74, 56, 4.4, 0.35)), date="1983", poses=[{"t": 5.2, "pose": "shrug"}])
add(5, "And in 1989, the loop finally spun out of control.", gray(P("press", 52, 56, 0.2, 2.2, "shake")), date="1989", mascot="angry")
add(5, "In July 1989 alone, prices rose by about two hundred percent. In one month.", gray(icon="exclaim"), labels=[L("200% in one month", 52, 20, 2.6, size=80, color="#e0402b", emph="box")])
add(5, "Over the whole year, they rose by around five thousand percent.", gray(P("banknotes", 52, 60, 0.3, 2.0, "shake")), labels=[L("5,000%", 52, 22, 1.8, size=120, color="#e0402b", emph="circle")], mascot="angry")
skit(5, "shop", "SHOPPER", "SHOPKEEPER", [
    ("SHOPPER", "Good morning! How much for the bread?", "happy", "talk"),
    ("SHOPKEEPER", "Ten thousand australes.", "talk", "talk"),
    ("SHOPPER", "Perfect, I'll come back after work.", "happy", "shrug")], date="9 a.m.")
skit(5, "shop", "SHOPPER", "SHOPKEEPER", [
    ("SHOPPER", "I'm back! Ten thousand, right?", "happy", "talk"),
    ("SHOPKEEPER", "Twelve thousand.", "confused", "shrug"),
    ("SHOPPER", "It's the same bread!", "angry", "talk"),
    ("SHOPKEEPER", "Same bread. Different money.", "angry", "shrug")], date="5 p.m.")
add(5, "That's not much of an exaggeration. People rushed to spend their salaries the day they got paid, before the money lost value.",
    setv("shop"), labels=[L("spend it fast!", 44, 22, 3.6, color="#f5c518")])
add(5, "Supermarkets used loudspeakers to announce new prices during the day.", setv("shop"), labels=[L("NEW PRICES!", 44, 20, 1.0, size=96, color="#e0402b")])
add(5, "Some shops simply closed, because by the time they restocked, they had lost money on everything they sold.", setv("shop"), mood="night",
    labels=[L("CLOSED", 44, 24, 1.4, size=110, color="#e0402b", emph="box")], mascot="confused")
add(5, "Argentina needed something drastic. And in 1991, it tried the most drastic idea of all.", gray(icon="exclaim"), date="1991", mascot="point")

# ---------------- Chapter 6: One peso, one dollar ----------------
add(6, "The plan was called Convertibility. From 1991, one Argentine peso would be worth exactly one US dollar.",
    gray(P("banknotes", 34, 60, 1.6, 1.1), P("scales", 52, 54, 2.6, 0.55), P("dollar", 70, 60, 3.2, 1.5)), labels=[L("1 peso = 1 dollar", 52, 20, 3.8, size=80, color="#f5c518", emph="box")])
add(6, "Not roughly. Exactly. And by law, the central bank could only print a peso if it had a real dollar in the vault to back it.",
    gray(P("chest", 44, 58, 2.0, 0.45), P("dollar", 66, 60, 3.6, 1.4)), mascot="point")
add(6, "In other words, Argentina took the printing press away from itself.", gray(P("press", 52, 56, 0.2, 2.2, "none"), P("stamp", 52, 60, 2.6, 1.2)), labels=[L("locked", 52, 20, 2.8)])
add(6, "And it worked. Almost overnight, inflation collapsed. Within a few years, prices were barely rising at all.",
    setv("shop"), labels=[L("stable prices", 44, 22, 2.6, color="#9fe08a", emph="underline")], mascot="happy")
add(6, "Foreign money poured back in.", mp(V_ATL, None, ev("flow", path=[NY, [-40, 0], BA], t=0.1, color="#9fe08a"), ev("flow", path=[[-3.7, 40.4], [-25, 0], BA], t=0.4, color="#9fe08a"),
    ev("flow", path=[LON, [-25, 10], BA], t=0.7, color="#9fe08a")), mascot="happy")
add(6, "Around the same time, the government sold off state companies, from the phone network to the national airline.",
    gray(P("train", 34, 58, 0.6, 1.2), P("factory", 56, 58, 1.4, 1.2), P("stamp", 76, 56, 3.0, 0.9)), labels=[L("SOLD", 52, 20, 3.4, size=90, color="#e0402b")], date="1990")
add(6, "Argentines who had lived through 1989 could finally save in their own banks again.", scene("bank", {"id": "CUSTOMER", "x": 46, "pose": "happy"}), mascot="happy")
add(6, "But a currency tied to the dollar has a catch.", gray(icon="question"), mascot="point")
add(6, "When the dollar got strong in the late 1990s, the peso got strong with it, whether that suited Argentina or not.",
    gray(P("dollar", 40, 58, 0.4, 1.5, "pulse"), P("banknotes", 64, 58, 1.6, 1.2, "pulse")), labels=[L("strong peso", 52, 20, 2.2)])
add(6, "Its exports became expensive.", gray(P("cattle", 40, 60, 0.1, 1.2), P("wheat", 62, 60, 0.3, 1.2)), labels=[L("too expensive", 52, 22, 0.6, color="#e0402b")], mascot="confused")
add(6, "Then in 1999, its biggest neighbour and trading partner, Brazil, cut the value of its own currency.",
    mp(V_SAM, None, ev("fill", countries=["Brazil"], t=0.6, color="#5fb06a"), ev("pin", at=BRA, t=1.2, label="Brazil"), ev("fill", countries=["Argentina"], t=0, color="#e0a526")), date="1999")
add(6, "Suddenly, Brazilian goods were cheap and Argentine goods were not.",
    mp(V_SAM, None, ev("fill", countries=["Brazil"], t=0, color="#5fb06a"), ev("fill", countries=["Argentina"], t=0, color="#e0a526"),
       ev("flow", path=[[-47, -22], [-55, -30], BA], t=0.4, color="#9fe08a")), mascot="confused")
add(6, "Argentina slipped into recession.", gray(icon="exclaim"), labels=[L("recession", 52, 20, 0.4, size=96, color="#e0402b", emph="underline")], mascot="confused")
add(6, "To keep paying its bills and defend the one-to-one promise, the government borrowed more and more in dollars.",
    gray(P("dollar", 30, 60, 1.6, 1.2), P("dollar", 52, 54, 2.4, 1.4), P("dollar", 74, 60, 3.2, 1.6)))
add(6, "And investors began to wonder whether the promise could last.", gray(icon="question"), mascot="confused")
skit(6, "bank", "CUSTOMER", "BANK_TELLER", [
    ("CUSTOMER", "Hello! I'd like to take out my savings, please.", "happy", "talk"),
    ("BANK_TELLER", "Of course. You can have two hundred and fifty pesos.", "talk", "talk"),
    ("CUSTOMER", "I have twenty thousand in here.", "confused", "talk"),
    ("BANK_TELLER", "Yes. Two hundred and fifty. This week.", "talk", "shrug"),
    ("CUSTOMER", "And next week?", "angry", "talk"),
    ("BANK_TELLER", "Two hundred and fifty. Probably.", "angry", "shrug")], date="2001")
add(6, "That was real. In December 2001, with people rushing to pull their money out,", setv("bank"), date="2001")
add(6, "the government froze bank accounts and limited withdrawals to 250 pesos a week.", setv("bank"), labels=[L("250 pesos a week", 44, 22, 1.6, size=80, color="#e0402b", emph="box")])
add(6, "Argentines called it the corralito, the little fence. It made people furious.", gray(P("shield", 52, 56, 0.4, 0.5)),
    labels=[L("corralito", 50, 20, 0.6, size=90, color="#f5c518"), L("= the little fence", 52, 32, 2.0, size=56)], mascot="angry")
add(6, "Protesters filled the streets banging pots and pans.", setv("night-city"), mood="night", labels=[L("CLANG!", 34, 30, 0.6, size=90, color="#f5c518"), L("CLANG!", 62, 22, 1.4, size=80, color="#f5c518")])
add(6, "The president resigned and left the palace by helicopter.", setv("palace"), mood="night")
add(6, "In under two weeks, Argentina went through five presidents.",
    gray(*[P("crown", 22 + i * 14, 58, 0.6 + i * 0.5, 0.3) for i in range(5)]), labels=[L("5 presidents", 52, 22, 3.2, emph="underline")], mascot="confused")
add(6, "And the country stopped paying its debts: around 132 billion dollars, at the time the largest government default in history.",
    gray(P("stamp", 52, 56, 1.8, 2.0, "shake")), labels=[L("$132 billion", 52, 22, 2.8, size=96, color="#e0402b")])
add(6, "The peso was cut loose from the dollar and lost most of its value.", gray(P("scales", 52, 56, 0.2, 0.6, "shake")), mascot="confused")
add(6, "Savings people thought were safe in dollars were turned back into pesos worth a fraction as much.", gray(P("dollar", 38, 58, 0.2, 1.4), P("banknotes", 66, 60, 2.6, 0.8)))
add(6, "Unemployment passed twenty percent. By late 2002, more than half of all Argentines were living below the poverty line.",
    gray(P("factory", 52, 58, 0.2, 1.4)), labels=[L("20%+ unemployed", 50, 18, 0.6, size=64), L("over half below the poverty line", 50, 30, 3.0, size=56)], date="2002", mascot="confused")
add(6, "If this story is giving you something to think about, hit subscribe. No fences, no withdrawal limits.",
    setv("sky"), type_="cta", mascot="happy", cta="No fences. No withdrawal limits.")

# ---------------- Chapter 7: After the crash ----------------
add(7, "And then, just like in 1870, the grass came to the rescue. Or rather, the soybeans.",
    mp(V_ARG, V_PAMPAS, ev("scatter", around=PAMPAS, icon="soy", n=8, spread=2.4, t=2.6, size=0.5)), date="2003", poses=[{"t": 3.0, "pose": "happy"}])
add(7, "In the 2000s, China's booming cities needed food, and the price of soybeans soared.",
    mp({"lon": 30, "lat": -5, "zoom": 1.2}, None, ev("pin", at=SHA, t=0.6, label="China"), ev("flow", path=[BA, [-20, -38], [20, -38], [80, -15], SHA], t=1.4, color="#9fe08a", width=7)))
add(7, "Argentina's farms were perfectly placed to grow them.", mp(V_PAMPAS, None, ev("scatter", around=PAMPAS, icon="soy", n=10, spread=2.6, t=0.3, size=0.45)))
add(7, "Money flowed back in, the economy grew fast, and for a few years it looked like the comeback story of the century.",
    gray(P("coins", 40, 58, 0.3, 0.5), P("banknotes", 64, 58, 1.2, 1.2)), labels=[L("comeback", 52, 20, 3.4, color="#9fe08a", emph="underline")], mascot="happy")
add(7, "But the old habits came back too. Governments spent heavily when times were good.", gray(P("banknotes", 52, 58, 0.3, 1.6, "bob")), mascot="confused")
add(7, "When the commodity boom faded, they turned once again to printing money. Inflation crept back, then galloped.",
    gray(P("press", 52, 56, 1.6, 2.2, "shake")), labels=[L("inflation", 52, 20, 3.4, color="#e0402b")], mascot="angry")
add(7, "In 2014, a long legal fight with foreign creditors pushed Argentina into default again.", gray(P("scales", 40, 56, 0.4, 0.5), P("stamp", 64, 58, 2.6, 1.2)), date="2014")
add(7, "In 2020, it defaulted for the ninth time in its history.", gray(P("stamp", 52, 56, 0.6, 2.0, "shake")), date="2020", labels=[L("default #9", 52, 22, 1.4, size=90, emph="circle")])
add(7, "By the end of 2023, prices were rising at more than two hundred percent a year.", gray(icon="exclaim"), date="2023", labels=[L("211% a year", 52, 22, 1.8, size=100, color="#e0402b", emph="box")])
add(7, "And ordinary Argentines did what generations before them had learned to do.", setv("home"))
skit(7, "home", "GRANDSON", "GRANDMOTHER", [
    ("GRANDSON", "Grandma, why don't you put your savings in the bank?", "talk", "talk"),
    ("GRANDMOTHER", "I did. In 1989. And in 2001.", "confused", "shrug"),
    ("GRANDSON", "So where is your money now?", "talk", "talk"),
    ("GRANDMOTHER", "Somewhere safe.", "confused", "happy"),
    ("GRANDSON", "In pesos?", "talk", "talk"),
    ("GRANDMOTHER", "Don't be ridiculous. In dollars.", "confused", "angry")], props=[P("dollar", 50, 70, 2.0, 1.2)])
add(7, "Economists estimate Argentines hold a huge amount of their savings in US dollars outside the banking system,",
    gray(*[P("dollar", 26 + i * 12, 54 + (i % 2) * 10, 0.4 + i * 0.4, 1.3) for i in range(5)]))
add(7, "in safety boxes, in drawers and under mattresses.", setv("home"), labels=[L("safety boxes", 30, 20, 0.2, size=56), L("drawers", 52, 30, 1.0, size=56), L("mattresses", 72, 20, 1.8, size=56)])
add(7, "When a country's own people won't hold its money, that tells you everything about trust.", gray(P("heart", 52, 56, 0.3, 0.6, "shake")),
    labels=[L("trust", 52, 20, 3.0, size=96, emph="underline")])
add(7, "In late 2023, Argentines elected Javier Milei, an economist who campaigned with a chainsaw as a symbol of cutting government spending.",
    gray(P("chainsaw", 52, 58, 2.6, 2.4)), date="2023", labels=[L("Javier Milei", 52, 20, 0.8, size=80, color="#f5c518")])
add(7, "His government slashed spending and stopped financing the budget by printing money.", gray(P("chainsaw", 36, 58, 0.2, 2.0), P("press", 66, 58, 1.8, 1.8, "none")),
    labels=[L("spending cut", 36, 22, 0.6, size=60), L("no printing", 66, 22, 2.4, size=60)])
add(7, "Inflation fell sharply: from about 118 percent in 2024 to about 31.5 percent in 2025, the lowest in years,",
    gray(P("banknotes", 52, 60, 0.2, 1.2)), labels=[L("118%", 34, 22, 1.8, size=96, color="#e0402b"), L("→ 31.5%", 66, 22, 4.0, size=96, color="#9fe08a")], date="2025")
add(7, "though it was still running at around a third a year by mid-2026.", gray(P("hourglass", 52, 56, 0.4, 0.5)), date="2026", labels=[L("about 33% a year", 52, 22, 0.8)])
add(7, "Supporters say this is the first serious attempt in decades to break the cycle.", gray(P("scales", 52, 56, 0.2, 0.55)), labels=[L("supporters say", 44, 20, 0.2, color="#9fe08a")])
add(7, "Critics point to the pain of the cuts, on wages, pensions and public services, and argue the gains could still unravel.",
    gray(P("scales", 52, 56, 0.2, 0.55, "shake")), labels=[L("critics say", 44, 20, 0.2, color="#ff9b8a")])
add(7, "Economists will be arguing about it for years.", gray(icon="question"), mascot="shrug")
add(7, "Which brings us back to our question. Why did a country that was once richer than France keep falling?",
    mp(V_WORLD, V_SAM, ev("fill", countries=["Argentina"], t=1.6, color="#e0a526"), ev("pin", at=BA, t=2.4)), mascot="confused")

# ---------------- Chapter 8: The answer ----------------
add(8, "Let's put the whole story together.", {"kind": "scroll", "dates": ["1870", "1930", "1946", "1989", "2001", "Today"], "highlight": 5})
add(8, "A sea of grass. British railways all pointing to one port. Frozen beef sailing to London.",
    mp(V_ARG, {"lon": -45, "lat": -10, "zoom": 2.2}, *[dict(e, t=0) for e in RAIL], ev("move", path=[BA, [-30, 0], [-15, 35], LON], icon="ship", t=2.6, dur=3)))
add(8, "Millions of immigrants and a city that called itself the Paris of South America.", setv("palace"))
add(8, "A crash in New York, a coup in Buenos Aires. Factories, wages, and a printing press.",
    gray(P("factory", 30, 58, 2.6, 1.0), P("coins", 52, 60, 3.4, 0.4), P("press", 74, 56, 4.0, 1.5)))
add(8, "Prices that changed between breakfast and dinner. One peso for one dollar.", setv("shop"))
add(8, "A little fence around everyone's savings. And a grandmother's mattress full of dollars.", scene("home", props=[P("dollar", 40, 70, 2.4, 1.3), P("dollar", 56, 68, 2.8, 1.3)]))
add(8, "So what actually happened to Argentina? There's no single villain. Most economists point to three problems that fed on each other.",
    gray(icon="question"), mascot="confused", poses=[{"t": 3.0, "pose": "point"}])
add(8, "First, the country got rich selling a few crops to a few buyers.", gray(P("wheat", 40, 60, 0.6, 1.2), P("cattle", 64, 60, 1.0, 1.2)),
    labels=[L("1. few exports", 50, 20, 0.2, color="#f5c518", emph="underline")])
add(8, "That made it wealthy when prices were high, and fragile when they fell.", gray(P("scales", 52, 56, 0.2, 0.55, "shake")))
add(8, "It never fully built the wide base of industries and skills that keeps richer countries steady through bad years.",
    gray(P("factory", 40, 58, 1.6, 1.2), P("book", 64, 56, 2.6, 0.35)))
add(8, "Second, the rules never stayed the same for long.", gray(P("scroll", 52, 58, 0.4, 1.4, "shake")), labels=[L("2. policy swings", 50, 20, 0.2, color="#f5c518", emph="underline")])
add(8, "Coups, counter-coups and governments that undid each other's work meant no plan lasted long enough to pay off.",
    gray(P("flag", 34, 58, 0.2, 1.3), P("scroll", 54, 58, 1.6, 1.2), P("fire", 72, 60, 2.6, 1.2)))
add(8, "Investors, farmers and families learned not to plan more than a few years ahead.", gray(P("hourglass", 52, 56, 0.4, 0.5, "spin")))
add(8, "And third, again and again, governments paid their bills by printing money.", gray(P("press", 52, 56, 0.6, 2.2)),
    labels=[L("3. no trust in money", 50, 20, 0.2, color="#f5c518", emph="underline")])
add(8, "Every time, prices rose, savings melted, and trust broke a little more.", gray(P("banknotes", 40, 60, 0.4, 1.2, "shake"), P("heart", 64, 56, 2.4, 0.4, "shake")), mascot="confused")
add(8, "Once people stop trusting a country's money, it is incredibly hard to win them back. Argentina has spent more than half a century trying.",
    gray(P("heart", 40, 56, 0.4, 0.45), P("hourglass", 64, 56, 3.6, 0.4)))
add(8, "The lesson isn't really about Argentina.", mp(V_SAM, V_WORLD, ev("pin", at=BA, t=0)), mascot="point")
add(8, "Natural wealth can make a country rich for a while. What keeps it rich are boring things:", gray(P("coins", 52, 58, 0.4, 0.55)))
add(8, "stable rules, money people trust, and an economy that doesn't depend on one lucky product.",
    gray(P("scroll", 30, 58, 0.1, 1.1), P("banknotes", 52, 60, 1.2, 1.0), P("factory", 74, 58, 2.6, 1.1)), mascot="point")
add(8, "Argentina still has the Pampas. It still has the soil, the farms and some of the most educated people in Latin America.",
    mp(V_PAMPAS, {"lon": -62, "lat": -34, "zoom": 5}, ev("scatter", around=PAMPAS, icon="wheat", n=6, spread=2.2, t=0.4, size=0.45), ev("scatter", around=[-60, -36], icon="cattle", n=4, spread=1.6, t=1.4, size=0.5)))
add(8, "Whether it can finally hold on to its wealth this time is a question nobody can answer yet.", gray(icon="question"), mascot="shrug")
add(8, "If you made it all the way here, thank you. Subscribe to Farthing Explains for more stories about how money makes and breaks countries.",
    setv("sky"), type_="cta", mascot="happy", cta="Thanks for watching. Subscribe to Farthing Explains.")
add(8, "Next time, we'll look at a country with almost no natural resources at all that somehow became one of the richest on Earth. See you there.",
    mp(V_SAM, {"lon": 10, "lat": 30, "zoom": 1.2}), mascot="happy")


# ======================= v8: shots inside lines, witnesses, crowds, bubbles, documents =======================
BY_ID = {s["id"]: s for s in segs}

def widx(sid, w):
    """Word index in a segment's text: an int, or the first word matching a string."""
    if isinstance(w, int): return w
    words = [x.strip(".,!?;:'\"").lower() for x in BY_ID[sid]["text"].split()]
    return words.index(w.lower())

def shot(sid, w, visual, labels=None, bubbles=None):
    d = {"word": widx(sid, w), "visual": visual}
    if labels: d["labels"] = labels
    if bubbles: d["bubbles"] = bubbles
    BY_ID[sid].setdefault("shots", []).append(d)

def main(sid, visual, labels="keep", mascot="keep"):
    BY_ID[sid]["visual"] = visual
    if labels != "keep": BY_ID[sid]["labels"] = labels
    if mascot is None: BY_ID[sid].pop("mascot", None)
    elif mascot != "keep": BY_ID[sid]["mascot"] = {"pose": mascot}

def move_labels(sid):
    l = BY_ID[sid].pop("labels", None) or []
    return l

def cam(x=50, y=55, a=1.0, b=1.12): return {"x": x, "y": y, "from": a, "to": b}
def crowd(set_, action="stand", n=7, seed=1, c=None, props=None):
    v = {"kind": "crowd", "set": set_, "action": action, "n": n, "seed": seed}
    if c: v["cam"] = c
    if props: v["props"] = props
    return v
def doc(title, sub=None, stamp=None, at=1.6, seal=True, presenter=None):
    v = {"kind": "document", "title": title, "seal": seal}
    if sub: v["sub"] = sub
    if stamp: v.update(stamp=stamp, stampAt=at)
    if presenter: v["presenter"] = presenter
    return v
def photo(src, caption): return {"kind": "photo", "src": src, "caption": caption}
def setc(name, c=None, props=None):
    v = {"kind": "set", "set": name}
    if c: v["cam"] = c
    if props: v["props"] = props
    return v
def bub(x, y, icon, t=0.6, tail=None, text=None, scale=None):
    b = {"x": x, "y": y, "icon": icon, "t": t}
    if tail: b["tail"] = tail
    if text: b["text"] = text
    if scale: b["scale"] = scale
    return b
def gr(*props): return {"kind": "gray", "props": list(props)}

# ---- Chapter 1
shot("c01-s01", "looking", crowd("port", "stand", 8, 3, cam(50, 60, 1.0, 1.15)))
shot("c01-s01", "there", mp({"lon": -50, "lat": -10, "zoom": 1.6}, {"lon": -60, "lat": -32, "zoom": 3.4}, ev("pin", at=BA, t=0.8, label="Buenos Aires")))
main("c01-s03", setc("fields", cam(50, 65, 1.0, 1.18)))
lab = move_labels("c01-s04")
main("c01-s04", setc("street", cam(50, 50, 1.0, 1.12)))
shot("c01-s04", "grand", setc("palace", cam(50, 40, 1.05, 1.2)), [L("opera houses", 36, 20, 0.2, color="#f5c518")])
shot("c01-s04", "first", photo("archive/buenos-aires-1910.jpg", "Avenida de Mayo, Buenos Aires, 1910"), [L("first subway in Latin America", 50, 16, 0.3, size=60)])
lab = move_labels("c01-s06")
shot("c01-s06", "argentina", mp(V_WORLD, {"lon": -40, "lat": -10, "zoom": 1.7}, ev("fill", countries=["Argentina"], t=0.2, color="#e0a526")), [L("top 10", 50, 20, 1.0, size=90, color="#f5c518", emph="circle")])
lab = move_labels("c01-s07")
main("c01-s07", mp(V_SAM, V_ARG, ev("pin", at=BA, t=0.4, label="Today")))
shot("c01-s07", "argentina", doc("Payment due", "Republic of Argentina", "DEFAULT", 0.9), [L("9 defaults", 50, 10, 1.6, size=86, emph="underline")])
lab = move_labels("c01-s08")
main("c01-s08", setc("shop", cam(40, 45, 1.0, 1.15)))
shot("c01-s08", "five", gr(P("banknotes", 52, 58, 0.1, 1.6, "pulse")), [L("5,000%", 52, 22, 0.4, size=110, color="#e0402b", emph="box")])
shot("c01-s09", "hidden", scene("home", {"id": "GRANDMOTHER", "x": 46, "pose": "shrug"}, props=[P("dollar", 46, 80, 0.4, 1.2)]),
     bubbles=[bub(64, 28, "dollar", 1.0, [50, 44], "safe here")])
lab = move_labels("c01-s11")
main("c01-s11", setc("battlefield", cam(50, 55, 1.0, 1.1)), [L("not a war", 50, 20, 0.2, size=70)])
shot("c01-s11", 4, setc("fields", cam(50, 60, 1.0, 1.1)), [L("not a famine", 50, 20, 0.1, size=70)])
shot("c01-s11", 8, setc("palace", cam(50, 45, 1.0, 1.1)), [L("not one bad leader", 50, 20, 0.1, size=70)])

# ---- Chapter 2
shot("c02-s03", "just", setc("fields", cam(50, 70, 1.0, 1.2)))
shot("c02-s04", "wild", setc("fields", cam(60, 70, 1.1, 1.25), [P("cattle", 40, 72, 0.1, 1.2), P("cattle", 60, 76, 0.4, 1.3), P("cattle", 78, 70, 0.7, 1.0)]))
main("c02-s08", setc("port", cam(55, 45, 1.0, 1.15)))
lab = move_labels("c02-s12")
shot("c02-s12", "french", setc("port", cam(55, 40, 1.15, 1.4)), [L("frozen", 50, 18, 1.2, size=96, color="#9fd4ff", emph="box")])
for i in range(14, 22): BY_ID[f"c02-s{i:02d}"]["visual"]["set"] = "port"
shot("c02-s25", "mostly", crowd("port", "stand", 9, 5, cam(50, 60, 1.0, 1.15)), [L("Italy & Spain", 30, 18, 0.3, size=64)])
main("c02-s26", photo("archive/immigrants-hotel.jpg", "Immigrants' Hotel, Buenos Aires, c. 1912"))
shot("c02-s26", 4, mp(V_ARG, None, ev("scatter", around=[-59.5, -34], icon="house", n=8, spread=1.6, t=0.1, size=0.45), ev("label", at=[-62, -29.5], text="3 million stayed", t=0.3)))
lab = move_labels("c02-s27")
main("c02-s27", photo("archive/buenos-aires-1900.jpg", "Buenos Aires, c. 1900"))
shot("c02-s27", "you", crowd("street", "stand", 7, 8, cam(50, 55, 1.0, 1.1)), [L("Ciao!", 26, 26, 0.3, color="#9fe08a"), L("Buongiorno!", 56, 16, 1.0, color="#9fe08a"), L("¡Hola!", 76, 30, 2.0, size=56)])
lab = move_labels("c02-s30")
shot("c02-s30", "if", crowd("street", "stand", 6, 11), [L("as rich as an Argentine", 50, 14, 2.4, color="#f5c518", emph="box")], [bub(30, 34, "bag", 0.3, [22, 55])])

# ---- Chapter 3
BY_ID["c03-s01"]["date"] = "October 1929"
shot("c03-s01", 9, crowd("street", "run", 8, 13))
main("c03-s02", setc("factory", cam(50, 50, 1.0, 1.15)), [L("closed", 50, 20, 0.4, size=90, color="#e0402b", emph="box")])
shot("c03-s02", "families", setc("shop", cam(45, 50, 1.0, 1.12)), [L("no buyers", 44, 20, 0.2, size=70)])
shot("c03-s06", "now", setc("port", cam(55, 45, 1.0, 1.2)), [L("half empty", 50, 18, 0.3, size=70)])
main("c03-s08", doc("Sáenz Peña Law", "secret ballot for men, 1912"), [])
BY_ID["c03-s09"]["date"] = "September 1930"
shot("c03-s09", 9, photo("archive/coup-1930.jpg", "Buenos Aires, 6 September 1930"))
BY_ID["c03-s14"]["bubbles"] = [bub(80, 24, "hourglass", 0.4, [70, 42], "temporary?")]

# ---- Chapter 4
BY_ID["c04-s01"]["date"] = "1946"
main("c04-s01", crowd("street", "cheer", 9, 17, cam(50, 55, 1.0, 1.12)), mascot=None)
shot("c04-s01", 4, {"kind": "portrait", "src": "archive/peron.jpg", "name": "Juan Domingo Perón"})
lab = move_labels("c04-s03")
shot("c04-s03", 5, setc("fields", cam(50, 60, 1.0, 1.12)), [L("a farm for Europe", 44, 18, 0.3, size=66)])
shot("c04-s03", 13, setc("factory", cam(50, 50, 1.0, 1.15)), [L("make things", 44, 18, 0.2, size=66)])
lab = move_labels("c04-s05")
shot("c04-s05", 7, doc("Import Tariffs", "radios · cars · machines", "TAXED", 1.0))
main("c04-s11", crowd("street", "cheer", 9, 19, cam(50, 55, 1.0, 1.1)))
main("c04-s26", crowd("street", "cheer", 8, 23), mascot=None)

# ---- Chapter 5
main("c05-s01", setc("shop", cam(40, 45, 1.0, 1.15)))
main("c05-s03", doc("Government promises", "jobs · pensions · factories"), [])
shot("c05-s06", "everyone", crowd("street", "cheer", 8, 29, props=[P("banknotes", 30, 30, 0.2, 0.9, "bob"), P("banknotes", 70, 26, 0.5, 0.9, "bob")]))
BY_ID["c05-s17"]["date"] = "July 1989"
main("c05-s17", crowd("shop", "run", 8, 31))
lab = move_labels("c05-s17")
shot("c05-s17", "prices", gr(P("banknotes", 52, 60, 0.1, 1.8, "shake")), [L("200% in one month", 52, 22, 0.3, size=88, color="#e0402b", emph="box")])
lab = move_labels("c05-s26")
shot("c05-s26", "people", crowd("shop", "run", 8, 37, props=[P("banknotes", 50, 30, 0.2, 1.0, "bob")]), [L("spend it fast!", 44, 16, 1.0, color="#f5c518")])
main("c05-s27", setc("shop", cam(50, 30, 1.0, 1.2)))

# ---- Chapter 6
main("c06-s01", doc("Convertibility Law", "1 peso = 1 US dollar", "LAW", 2.4), [])
main("c06-s04", crowd("shop", "cheer", 7, 41))
main("c06-s06", doc("State companies", "phones · airline · railways", "SOLD", 2.6), [])
BY_ID["c06-s22"]["date"] = "December 2001"
main("c06-s22", crowd("bank", "queue", 8, 43, cam(30, 55, 1.0, 1.12)))
main("c06-s23", doc("Notice to customers", "withdrawals: 250 pesos a week", "FROZEN", 2.0), [])
lab = move_labels("c06-s25")
main("c06-s25", crowd("street", "protest", 9, 47, cam(50, 55, 1.0, 1.1)), [L("CLANG!", 30, 24, 0.5, size=90, color="#f5c518"), L("CLANG!", 66, 18, 1.2, size=86, color="#f5c518")], mascot=None)
shot("c06-s25", "banging", photo("archive/cacerolazo-2001.jpg", "Cacerolazo, Buenos Aires, 2001"))
lab = move_labels("c06-s31")
main("c06-s31", gr(P("factory", 52, 58, 0.2, 1.4)), [L("20%+ unemployed", 50, 20, 0.6, size=70)])
shot("c06-s31", "by", crowd("street", "queue", 8, 53), [L("over half below the poverty line", 50, 16, 0.4, size=58)])

# ---- Chapter 7
lab = move_labels("c07-s04")
shot("c07-s04", 8, crowd("street", "cheer", 8, 59), [L("comeback", 50, 16, 0.6, color="#9fe08a", emph="underline")])
BY_ID["c07-s14"]["bubbles"] = [bub(80, 22, "dollar", 0.3, [70, 42], "in dollars")]
BY_ID["c07-s20"]["date"] = "Late 2023"
main("c07-s20", crowd("street", "cheer", 9, 61, cam(50, 55, 1.0, 1.1)), mascot=None)
shot("c07-s20", "chainsaw", gr(P("chainsaw", 52, 58, 0.1, 2.4)))

# ---- Chapter 8
main("c08-s03", crowd("port", "stand", 8, 67, cam(50, 60, 1.0, 1.12)))
shot("c08-s03", 3, photo("archive/buenos-aires-1910.jpg", "Avenida de Mayo, Buenos Aires, 1910"))
main("c08-s04", crowd("street", "run", 8, 71))
shot("c08-s04", 5, photo("archive/coup-1930.jpg", "Buenos Aires, 6 September 1930"))
shot("c08-s04", 10, gr(P("factory", 30, 58, 0.1, 1.0), P("coins", 52, 60, 0.6, 0.4), P("press", 74, 56, 1.1, 1.5)))
shot("c08-s05", 7, doc("Convertibility Law", "1 peso = 1 US dollar", "LAW", 0.8))

# ======================= v10: action scenes that act out the line =======================
def act(name, **k):
    d = {"kind": "action", "name": name}; d.update(k); return d
def drop_shots(sid): BY_ID[sid].pop("shots", None)

# prices
main("c01-s08", act("pricetag", **{"from": 100, "to": 5100}, item="prices, 1989"))
drop_shots("c01-s08")
shot("c01-s08", "five", gr(P("banknotes", 52, 58, 0.1, 1.6, "pulse")), [L("5,000%", 52, 22, 0.4, size=110, color="#e0402b", emph="box")])
BY_ID["c01-s08"]["visual"]["bg"] = "shop"
shot("c05-s07", "so", act("pricetag", **{"from": 100, "to": 140}, item="same goods, new price"))
main("c05-s18", act("pricetag", **{"from": 100, "to": 5100}, item="1989"), labels=[L("5,000%", 50, 16, 2.0, size=110, color="#e0402b", emph="circle")])
main("c05-s27", act("pricetag", **{"from": 1000, "to": 1300}, item="NEW PRICE!"))
# trains
main("c02-s09", act("train", cargo="wheat"))
shot("c02-s23", "beef", act("train", cargo="cattle"))
main("c04-s06", act("train", cargo="flag"))
shot("c08-s02", "british", act("train", cargo="wheat"))
shot("c08-s02", "frozen", act("voyage"))
# ships
main("c02-s13", act("voyage"))
# money raining in
main("c02-s24", act("moneyrain", bg="street"))
BY_ID["c05-s06"]["shots"] = [x for x in BY_ID["c05-s06"].get("shots", []) if x["visual"]["kind"] != "crowd"]
shot("c05-s06", "everyone", act("moneyrain", bg="street"))
BY_ID["c07-s04"]["shots"] = []
shot("c07-s04", 8, act("moneyrain", bg="skyline"), [L("comeback", 50, 16, 0.6, color="#9fe08a", emph="underline")])
# the printing press
main("c04-s24", act("press"), labels=[L("PRINT", 30, 20, 0.3, size=100, color="#e0402b", emph="box")])
main("c05-s05", act("press", bg="bank")); drop_shots("c05-s05")
drop_shots("c05-s10"); shot("c05-s10", "leaned", act("press"))
drop_shots("c07-s06"); shot("c07-s06", "printing", act("press")); shot("c07-s06", "inflation", act("pricetag", **{"from": 100, "to": 300}))
main("c08-s14", act("press")); drop_shots("c08-s14")
# the loop
main("c05-s08", act("loop", items=[{"icon": "factory", "label": "higher wages"}, {"icon": "press", "label": "print more"}, {"icon": "banknotes", "label": "higher prices"}]), labels=[])
drop_shots("c05-s08")
# votes and coups
main("c03-s08", act("ballot", item="1912"), labels=[])
shot("c03-s08", "secret", doc("Sáenz Peña Law", "secret ballot for men, 1912"))
BY_ID["c03-s09"]["shots"] = []
shot("c03-s09", 9, act("march", bg="street"))
shot("c03-s09", 16, photo("archive/coup-1930.jpg", "Buenos Aires, 6 September 1930"))
main("c03-s16", act("ballot", item="ELECTION")); drop_shots("c03-s16")
shot("c03-s16", "and", gr(P("scroll", 40, 58, 0.1, 1.4), P("fire", 62, 60, 0.6, 1.4)), [L("plans torn up", 52, 22, 0.8)])
main("c04-s01", act("ballot", item="1946"))
main("c04-s25", act("march", bg="plaza"))
main("c05-s11", act("march", bg="plaza"))
main("c07-s20", act("ballot", item="2023"))
# arguments
main("c04-s18", act("scales", left={"icon": "heart", "label": "supporters"}, right={"icon": "shield", "label": "critics"}), labels=[])
drop_shots("c04-s18")
main("c04-s27", act("scales", left={"icon": "flag", "label": "his followers"}, right={"icon": "flag", "label": "his opponents"})); drop_shots("c04-s27")
# 1929
main("c03-s01", act("crash", item="NEW YORK STOCKS"))
BY_ID["c03-s01"]["shots"] = []
shot("c03-s01", 10, mp({"lon": -60, "lat": 30, "zoom": 2.0}, V_WORLD, ev("pulse", at=NY, t=0.1, color="#e0402b"), ev("pulse", at=LON, t=0.4, color="#e0402b"),
     ev("pulse", at=BA, t=0.7, color="#e0402b"), ev("pulse", at=PAR, t=0.9, color="#e0402b"), ev("pulse", at=SHA, t=1.1, color="#e0402b")))
main("c08-s04", act("crash", item="NEW YORK, 1929"))
# 1991 law, vault, 2001
main("c06-s02", act("vault", item="dollars")); drop_shots("c06-s02")
main("c06-s24", act("fence", bg="bank"), labels=[L("corralito", 50, 14, 0.8, size=90, color="#f5c518"), L("= the little fence", 52, 26, 2.0, size=56)])
main("c06-s26", act("helicopter"))
BY_ID["c06-s26"].pop("mood", None)
main("c06-s28", doc("Debt payment", "around US$132 billion", "DEFAULT", 1.4), labels=[]); drop_shots("c06-s28")
main("c08-s06", act("fence", bg="street"))
shot("c08-s06", "and", act("mattress"))
# 2000s and today
main("c07-s03", act("harvest"))
main("c07-s18", act("mattress"))
BY_ID["c01-s09"]["shots"] = []
shot("c01-s09", "hidden", act("mattress"))
main("c07-s21", act("chainsaw", item="SPENDING"), labels=[]); drop_shots("c07-s21")
main("c07-s22", act("bars", bars=[{"label": "2023", "value": 211.4, "color": "#e0402b"}, {"label": "2024", "value": 117.8, "color": "#e88a3a"}, {"label": "2025", "value": 31.5, "color": "#5fb06a"}]), labels=[])
drop_shots("c07-s22")

# ---- More archive moments (placeholders until the photos are saved in public/archive/)
shot("c02-s10", "and", photo("archive/retiro-station.jpg", "Retiro station, Buenos Aires, late 1800s"))
BY_ID["c02-s12"]["shots"] = [x for x in BY_ID["c02-s12"]["shots"] if x["visual"]["kind"] != "set"]
shot("c02-s12", "french", photo("archive/frozen-ship.jpg", "Le Frigorifique, the first refrigerated ship, 1877"))
shot("c02-s12", "on", setc("port", cam(55, 40, 1.15, 1.4)), [L("frozen", 50, 18, 0.3, size=96, color="#9fd4ff", emph="box")])
shot("c02-s28", "the", photo("archive/buenos-aires-1915.jpg", "Buenos Aires, 1915"))
shot("c04-s11", "for", photo("archive/cgt-1953.jpg", "Workers' rally, Buenos Aires, 1953"))
shot("c04-s19", "dignity", photo("archive/peron-evita.jpg", "Juan and Eva Perón"))
shot("c05-s11", "ran", photo("archive/junta-1976.jpg", "The military junta, 1976"))
shot("c06-s04", "within", photo("archive/menem.jpg", "President Carlos Menem (right) at the White House"))
shot("c07-s20", 5, photo("archive/milei.jpg", "Javier Milei"))

# ---- Camera cuts on long idea cards: halfway through, cut in close on the main prop (wide → close, as Ethos does)
import re as _re
def _wfrac(text, k):
    ws = text.split(); wt = [len(_re.sub(r"[^\w]", "", w)) + 2.5 for w in ws]
    return sum(wt[:k]) / sum(wt)
for sg in segs:
    v = sg["visual"]
    n = len(sg["text"].split())
    if sg.get("shots") or v["kind"] != "gray" or n < 15 or not v.get("props"): continue
    k = n // 2
    while k < int(n * 0.68) and not _re.search(r"[.,:;]$", sg["text"].split()[k - 1]): k += 1
    if not _re.search(r"[.,:;]$", sg["text"].split()[k - 1]): k = n // 2
    est = n / 2.5 + 0.35
    cut = _wfrac(sg["text"], k) * est
    p0 = max(v["props"], key=lambda p: p.get("scale", 1))
    close = {"kind": "gray", "props": [dict(p, t=0.05) for p in v["props"]], "cam": {"x": p0["x"], "y": p0["y"], "from": 1.35, "to": 1.5}}
    sh = {"word": k, "visual": close}
    late = [l for l in sg.get("labels", []) if l.get("at", 0) >= cut - 0.2]
    if late:
        sg["labels"] = [l for l in sg["labels"] if l not in late]
        sh["labels"] = [dict(l, at=max(0.1, l["at"] - cut)) for l in late]
    sg["shots"] = [sh]

# ---- No plain grey: every idea card and document sits in a real environment, varied through each chapter
ENV = {
    "c01": ["skyline", "pampas", "plaza", "countryside", "street"],
    "c02": ["pampas", "estancia", "port", "countryside", "fields"],
    "c03": ["street", "plaza", "port", "countryside", "skyline"],
    "c04": ["plaza", "estancia", "street", "countryside", "factory"],
    "c05": ["street", "skyline", "plaza", "countryside", "shop"],
    "c06": ["skyline", "plaza", "street", "countryside", "bank"],
    "c07": ["pampas", "skyline", "countryside", "plaza", "estancia"],
    "c08": ["countryside", "plaza", "pampas", "skyline", "estancia"],
}
DOC_ENV = ["study", "plaza", "bank", "study"]
_k = {}
for sg in segs:
    ch = sg["id"][:3]
    vs = [sg["visual"]] + [x["visual"] for x in sg.get("shots", [])]
    if not any(v["kind"] in ("gray", "document") for v in vs): continue
    i = _k.get(ch, 0); _k[ch] = i + 1
    bg = ENV[ch][i % len(ENV[ch])]
    icons = {pp["icon"] for v in vs for pp in v.get("props", [])}
    if icons & {"wheat", "cattle", "soy"}: bg = ["pampas", "estancia", "fields"][i % 3]   # farm things on farmland
    elif icons & {"ship"}: bg = "port"
    elif icons & {"factory"} and i % 2: bg = "factory"
    for v in vs:
        if v["kind"] == "gray" and "bg" not in v: v["bg"] = bg
        if v["kind"] == "document" and "bg" not in v: v["bg"] = DOC_ENV[i % len(DOC_ENV)]

# Italy and Spain: start close on Europe so the two pins sit apart, then pull out over the Atlantic
_v = BY_ID["c02-s25"]["visual"]
_v["from"] = {"lon": 4, "lat": 42, "zoom": 6}
_v.pop("to", None)
_v["keys"] = [{"t": 2.2, "view": {"lon": 4, "lat": 42, "zoom": 6}}, {"t": 5.5, "view": {"lon": -28, "lat": 5, "zoom": 1.7}}]
for _e in _v["events"]:
    if _e["type"] == "move": _e["t"] = _e["t"] + 1.6
    if _e["type"] == "counter": _e["t"] = 5.2; _e["at"] = [-32, 14]

# ---- Map callouts: as a thing is mentioned it pops out of the map at its place, and the camera
#      eases in towards it (Ethos does this with its round picture badges).
def co(sid, word, at, icon=None, label=None, focus=True, zoom=None, side=None, src=None, shot_word=None, pos=None):
    seg = BY_ID[sid]
    v = seg["visual"] if shot_word is None else next(x["visual"] for x in seg.get("shots", []) if x["word"] == widx(sid, shot_word))
    e = {"type": "callout", "at": at, "t": 0, "word": widx(sid, word), "focus": focus}
    if icon: e["icon"] = icon
    if src: e["src"] = src
    if label: e["label"] = label
    if zoom: e["zoom"] = zoom
    if side: e["side"] = side
    if pos: e["pos"] = pos
    v.setdefault("events", []).append(e)
def drop_labels(sid, text):
    v = BY_ID[sid]["visual"]; v["events"] = [e for e in v.get("events", []) if not (e["type"] == "label" and e.get("text") == text)]

co("c02-s01", "grass", PAMPAS, "wheat", "grass")
co("c02-s02", "grassland", [-60.5, -36.5], "wheat", "fertile grassland", zoom=1.3, pos="below", side="right")
co("c02-s03", "mountains", [-62.5, -33.5], "mound", "no mountains", focus=False, side="left")
co("c02-s03", "soil", [-60, -36.5], "wheat", "rich black soil", side="right")
co("c02-s04", "cattle", [-60, -36], "cattle", "wild cattle")
co("c02-s06", "beef", BA, "cattle", "beef and grain", focus=False, side="right")
co("c02-s06", "ocean", LON, "coins", "the buyers", focus=False, side="left")
co("c02-s07", "bad", [-30, -5], "fire", "meat spoils", focus=False)
co("c02-s10", "money", BA, "banknotes", "British money", side="right")
co("c02-s10", "track", COR, "train", "thousands of km of track", side="left")
co("c02-s11", "farms", COR, "wheat", "the farms", side="left")
co("c02-s11", "port", BA, "ship", "one port", side="right")
co("c02-s22", "deal", BA, "coins", "Argentina sells", focus=False, side="right")
co("c02-s22", "both", LON, "coins", "Britain profits", focus=False, side="left")
co("c02-s23", "beef", [-60, -36], "cattle", "beef", focus=False, side="right")
co("c02-s23", "wheat", [-63, -31], "wheat", "wheat & corn", focus=False, side="left")
co("c02-s31", "success", BA, "crown", "a success story")
co("c02-s32", "port", BA, "ship", "one port", side="right")
co("c02-s32", "buyers", LON, "coins", "a few buyers", focus=False, side="left")
drop_labels("c02-s33", "a few families")
co("c02-s33", "families", PAMPAS, "crown", "a few rich families")
co("c02-s35", "stopped", LON, "stamp", "stopped buying", focus=False, side="left")
co("c03-s04", "disaster", BA, "exclaim", "disaster")
co("c03-s05", "empire", [80, 20], "crown", "its own empire", focus=False, side="left")
co("c03-s06", "half", BA, "ship", "half empty")
drop_labels("c03-s19", "go it alone")
co("c03-s19", "stop", BA, "shield", "go it alone")
co("c04-s04", "factories", BA, "factory", "make it at home")
co("c05-s12", "banks", NY, "banknotes", "foreign banks", focus=False, side="right")
co("c05-s12", "ballooned", BA, "scales", "debt balloons", side="left")
co("c05-s13", "falklands", FALK, "soldier", "Falklands War, 1982", side="left", pos="above")
co("c06-s05", "money", BA, "dollar", "money returns")
co("c06-s11", "cut", BRA, "banknotes", "Brazil devalues")
co("c06-s12", "cheap", BRA, "bag", "cheap", focus=False, side="right")
co("c06-s12", "not", BA, "bag", "expensive", focus=False, side="left")
co("c07-s01", "soybeans", PAMPAS, "soy", "soybeans")
co("c07-s02", "cities", SHA, "house", "booming cities", focus=False, side="left")
co("c07-s02", "soybeans", PAMPAS, "soy", "soy prices soar", focus=False, side="right")
co("c07-s27", "falling", BA, "question", "why?")
co("c08-s02", "grass", PAMPAS, "wheat", "a sea of grass", focus=False)
co("c08-s20", "soil", [-61, -35], "wheat", "the soil", side="left", focus=False)
co("c08-s20", "educated", BA, "book", "educated people", side="right")

# ---- Country flags: when a country is named over a map, its flag is planted at its place
def nat(sid, word, code, at, label=None, shot_word=None):
    seg = BY_ID[sid]
    v = seg["visual"] if shot_word is None else next(x["visual"] for x in seg.get("shots", []) if x["word"] == widx(sid, shot_word))
    e = {"type": "nation", "at": at, "t": 0, "word": widx(sid, word) if word is not None else 0, "code": code}
    if label: e["label"] = label
    v.setdefault("events", []).append(e)
ARG_C = [-64, -34]; USA_C = [-98, 39]; CAN_C = [-105, 58]; UK_C = [-2, 53]; FR_C = [2.5, 46.5]; CN_C = [104, 35]; BR_C = [-50, -10]
nat("c01-s01", "country", "ar", ARG_C)
nat("c01-s02", 1, "us", [-90, 36], "United States")
nat("c01-s02", 3, "ca", [-95, 56], "Canada")
nat("c01-s02", 4, "ar", [-63, -38], "Argentina")
nat("c01-s07", 0, "ar", [-64, -36])
nat("c02-s06", "ocean", "gb", UK_C, "Britain")
nat("c02-s10", "british", "gb", [-55.5, -31.5], "British")
nat("c02-s22", "deal", "ar", ARG_C)
nat("c02-s22", "both", "gb", UK_C)
nat("c02-s23", "argentina", "ar", [-66, -38])
nat("c02-s25", "italy", "it", [12.5, 42.5])
nat("c02-s25", "spain", "es", [-3.7, 40.2])
nat("c03-s05", "britain", "gb", UK_C, "Britain")
nat("c03-s19", "stop", "ar", ARG_C)
nat("c05-s12", "foreign", "us", USA_C)
nat("c05-s12", "banks", "gb", UK_C)
nat("c05-s13", "britain", "gb", [-57.5, -50.5])
nat("c05-s13", "generals", "ar", [-68, -40])
nat("c06-s11", "brazil", "br", BR_C, "Brazil")
nat("c06-s12", "brazilian", "br", BR_C)
nat("c06-s12", "argentine", "ar", ARG_C)
nat("c07-s02", "china's", "cn", CN_C)
nat("c07-s27", "france", "fr", FR_C, "France")
nat("c08-s20", "argentina", "ar", ARG_C)

# ---- Real photos inside the map badges (falls back to the drawing until the photo is saved)
BADGE = {
    ("c02-s01", "grass"): "pampas", ("c02-s02", "fertile grassland"): "pampas", ("c02-s03", "rich black soil"): "pampas",
    ("c08-s02", "a sea of grass"): "pampas", ("c08-s20", "the soil"): "pampas",
    ("c02-s04", "wild cattle"): "cattle", ("c02-s06", "beef and grain"): "cattle", ("c02-s23", "beef"): "cattle",
    ("c02-s23", "wheat & corn"): "wheat", ("c02-s11", "the farms"): "wheat",
    ("c02-s10", "thousands of km of track"): "retiro-station", ("c02-s11", "one port"): "buenos-aires-1900", ("c02-s32", "one port"): "buenos-aires-1900",
    ("c02-s06", "the buyers"): "london-docks", ("c02-s22", "Britain profits"): "london-docks", ("c02-s32", "a few buyers"): "london-docks",
    ("c02-s35", "stopped buying"): "london-docks",
    ("c02-s33", "a few rich families"): "estancia",
    ("c05-s13", "Falklands War, 1982"): "falklands", ("c06-s05", "money returns"): "dollars",
    ("c07-s01", "soybeans"): "soy", ("c07-s02", "soy prices soar"): "soy", ("c07-s02", "booming cities"): "shanghai",
}
for (sid, label), name in BADGE.items():
    for e in BY_ID[sid]["visual"].get("events", []):
        if e["type"] == "callout" and e.get("label") == label:
            e["src"] = f"archive/{name}.jpg" if name in ("retiro-station", "buenos-aires-1900") else f"archive/badges/{name}.jpg"

# ---- Calm pacing, like Ethos: the opening is one slow shot (clouds part, the camera sinks onto
#      South America, Buenos Aires is pinned), and no picture inside a line lasts under 2.6 seconds.
BY_ID["c01-s01"].pop("shots", None)
BY_ID["c01-s01"]["visual"] = mp({"lon": -30, "lat": 5, "zoom": 1.15}, {"lon": -60, "lat": -30, "zoom": 3.0},
    ev("pin", at=BA, t=5.6, label="Buenos Aires"), intro="clouds")
BY_ID["c01-s01"]["visual"]["introDur"] = 4.0
MIN_SHOT = 2.6
for sg in segs:
    if not sg.get("shots"): continue
    n = len(sg["text"].split()); est = n / 2.5 + 0.35
    intro = sg["visual"].get("introDur", 3.2) if sg["visual"].get("intro") else 0
    keep, last = [], max(0.0, intro - MIN_SHOT)
    for sh in sorted(sg["shots"], key=lambda x: x["word"]):
        at = _wfrac(sg["text"], sh["word"]) * est
        if at - last >= MIN_SHOT and est - at >= MIN_SHOT:
            keep.append(sh); last = at
    sg["shots"] = keep
    if not keep: sg.pop("shots")

# ======================= A stronger hook (first 60 seconds) =======================
# 1. Europeans dreaming of a new life: a badge over Europe as the clouds clear, then Buenos Aires pinned
BY_ID["c01-s01"]["visual"]["events"].append({"type": "callout", "at": [10, 47], "t": 0, "word": widx("c01-s01", "looking"), "src": "archive/immigrants-hotel.jpg", "icon": "ship", "label": "young Europeans", "focus": False, "side": "right"})
# 2. "Not America. Not Canada. Argentina." — each one crossed out on the map, then Argentina lights up
AMERICAS = {"lon": -85, "lat": 22, "zoom": 1.5}
ARG_WIDE = {"lon": -64, "lat": -30, "zoom": 2.6}
BY_ID["c01-s02"]["visual"] = {"kind": "map", "from": AMERICAS, "keys": [{"t": 0.9, "view": AMERICAS}, {"t": 2.3, "view": ARG_WIDE}], "events": [
    {"type": "fill", "countries": ["United States of America"], "t": 0, "word": 1, "color": "#8a8f99"},
    {"type": "label", "at": [-98, 39], "text": "✗", "t": 0, "word": 1, "size": 190, "color": "#e0402b"},
    {"type": "fill", "countries": ["Canada"], "t": 0, "word": 3, "color": "#8a8f99"},
    {"type": "label", "at": [-105, 58], "text": "✗", "t": 0, "word": 3, "size": 190, "color": "#e0402b"},
    {"type": "fill", "countries": ["Argentina"], "t": 0, "word": 4, "color": "#e0a526"},
    {"type": "pulse", "at": BA, "t": 0, "word": 4, "color": "#ffd34d"},
    {"type": "label", "at": [-66, -36], "text": "Argentina", "t": 0, "word": 4, "style": "region", "rotate": -75, "size": 60},
]}
# 3. the richest farmland, seen from above
BY_ID["c01-s03"]["visual"] = mp({"lon": -61, "lat": -34, "zoom": 5}, {"lon": -61, "lat": -35, "zoom": 7})
co("c01-s03", "farmland", PAMPAS, "wheat", "the Pampas", src="archive/badges/pampas.jpg", pos="below", side="right")
# 5. richer than France and Germany: a race of bars
main("c01-s05", act("bars", hideValues=True, bg="plaza", bars=[{"label": "Argentina", "value": 104, "color": "#74acdf", "flag": "ar"}, {"label": "France", "value": 92, "color": "#4f6d8f", "flag": "fr"}, {"label": "Germany", "value": 96, "color": "#3a3a48", "flag": "de"}]),
     labels=[L("income per person, 1913", 50, 10, 0.4, size=60)])
# 7. today: nine defaults, stamped
for sh in BY_ID["c01-s07"].get("shots", []):
    if sh["visual"]["kind"] == "document": sh["visual"]["stamp"] = "DEFAULT ×9"
# 10. rich, broke, rich, broke — the boom-and-bust line
main("c01-s10", act("crash", cycle=True, item="ARGENTINA", bg="skyline"), labels=[L("boom → bust → boom → bust", 50, 10, 0.8, size=60, color="#ffd34d")])
# 11. not a war, not a famine, not one leader — each crossed out
BY_ID["c01-s11"]["labels"].append(L("✗", 50, 48, 0.7, size=230, color="#e0402b"))
for sh in BY_ID["c01-s11"].get("shots", []):
    sh.setdefault("labels", []).append(L("✗", 50, 48, 0.6, size=230, color="#e0402b"))

# ---- Smooth map camera: every map drifts gently, and a map that follows a map starts exactly where
#      the last one ended, so the camera glides on instead of jumping (as in Ethos).
def last_visual(sg):
    sh = sg.get("shots") or []
    return sorted(sh, key=lambda x: x["word"])[-1]["visual"] if sh else sg["visual"]
def end_view(v):
    if v.get("keys"): return v["keys"][-1]["view"]
    return v.get("to") or v["from"]
for sg in segs:
    for v in [sg["visual"]] + [x["visual"] for x in sg.get("shots", [])]:
        if v["kind"] == "map" and not v.get("to") and not v.get("keys"):
            f0 = v["from"]; v["to"] = {"lon": f0["lon"] + 6 / f0["zoom"], "lat": f0["lat"] - 2 / f0["zoom"], "zoom": round(f0["zoom"] * 1.18, 3)}
for a, b in zip(segs, segs[1:]):
    pv, cv = last_visual(a), b["visual"]
    if pv["kind"] != "map" or cv["kind"] != "map" or cv.get("intro") or cv.get("keys"): continue
    e = end_view(pv); f0 = cv["from"]
    near = abs(e["lon"] - f0["lon"]) < 45 and abs(e["lat"] - f0["lat"]) < 35 and 0.33 < e["zoom"] / f0["zoom"] < 3
    if near: cv["from"] = dict(e)
# chapter-opening maps fly in through the clouds
for sid in ["c02-s01", "c07-s01"]:
    BY_ID[sid]["visual"]["intro"] = "clouds"

# ---- Badges stay on: when a map line follows a map line in the same place, the badges from the
#      last line are still there (already open, no pop), so they don't vanish at the cut.
for a, b in zip(segs, segs[1:]):
    pv, cv = last_visual(a), b["visual"]
    if pv["kind"] != "map" or cv["kind"] != "map" or cv["from"] != end_view(pv): continue
    for e in pv.get("events", []):
        if e["type"] == "callout" and not e.get("persist"):
            q = {k: v for k, v in e.items() if k != "word"}; q.update(t=0, focus=False, persist=True)
            cv.setdefault("events", []).insert(0, q)

# ---- One consistent guide who comes and goes. He appears to open a chapter, ask a question, react
#      (pose changes), or present the subscribe breaks. Action scenes, crowds, photos and documents
#      play without him so the picture tells the story.
FULL = {"action", "crowd", "photo", "portrait", "document", "scroll"}
first_in_ch = {}
for i, sg in enumerate(segs):
    ch = sg["id"][:3]
    if sg["type"] == "narration" and ch not in first_in_ch and sg["visual"]["kind"] != "scroll": first_in_ch[ch] = i
want = []
for i, sg in enumerate(segs):
    m = sg.get("mascot")
    if sg["type"] == "skit": want.append(False); continue
    if sg["type"] == "cta": want.append(True); continue
    k = sg["visual"]["kind"]
    need = ("?" in sg["text"]) or (m and m.get("poses")) or first_in_ch.get(sg["id"][:3]) == i \
        or (m and m.get("pose") in ("confused", "angry", "shrug") and k in ("gray", "map", "set"))
    if k in FULL and "?" not in sg["text"]: need = False
    want.append(bool(need))
# no blinking: a one-segment gap between two appearances is filled when the scene allows him
for i in range(1, len(segs) - 1):
    if not want[i] and want[i - 1] and want[i + 1] and segs[i]["type"] == "narration" and segs[i]["visual"]["kind"] not in FULL:
        want[i] = True
for sg, w in zip(segs, want):
    if w: sg.setdefault("mascot", {"pose": "talk"})
    else: sg.pop("mascot", None)
print(f"guide on {sum(want)} of {len(segs)} segments")

# ---- Witnesses: a person from each era takes the guide's place
def witness(**k):
    d = {"trim": "#e0b84a"}; d.update(k); return d
GUIDES = {
    "c02": witness(skin="#c89a6a", robe="#9a3324", trim="#e0b84a", hat="brim", hatColor="#3a2a1e", beard="short", beardColor="#2b2622", belt="#3a2a1e", pattern="diamonds"),  # gaucho
    "c03": witness(skin="#f0cfb0", robe="#5f6168", trim="#d9d9d9", hat="cap", hatColor="#45474d", hair="#3a2a1e"),  # 1930 office worker
    "c04": witness(skin="#d9a878", robe="#3d6e94", trim="#9aa0a6", hat="cap", hatColor="#2d5a7b", hair="#2b2622"),  # factory worker
    "c05": witness(skin="#e8c4a0", robe="#c0567a", trim="#f4f1ea", hair="#5a3d2b", bun=True),  # 1989 shopper
    "c06": witness(skin="#e0b48c", robe="#2b3a55", trim="#d9d9d9", hair="#2b2622", glasses=True),  # 2001 saver
    "c07": witness(skin="#d9a878", robe="#2f7f7a", trim="#f5c518", hair="#2b2622", bun=True),  # young porteña today
}

ep = {"title": "Argentina Was Richer Than France. What Happened?", "fps": 30, "mascot": MASCOT, "narratorVoice": "", "sfxMode": "scenes", "sfxVolume": 0.7, "music": "music/bed.mp3", "musicVolume": 0.08,
      "cast": [dict(c, voice="") for c in CAST], "segments": segs}
json.dump(ep, open("episodes/ep01-argentina.json", "w"), indent=1, ensure_ascii=False)
words = sum(len(s["text"].split()) for s in segs)
shots = sum(1 + len(s.get("shots", [])) for s in segs)
print(f"{len(segs)} segments, {shots} shots, {words} spoken words, ~{words/148:.1f} min at 148 wpm")
