"""Generates the scene sound effects in public/sfx/ from code (no licences needed).
Run: python3 scripts/make-sfx.py   (needs numpy + scipy; already generated in the zip)
Replace any .wav with your own of the same name to change that sound everywhere."""
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(7)

def t(sec): return np.arange(int(SR * sec)) / SR
def noise(sec): return rng.standard_normal(int(SR * sec))
def bp(x, lo, hi, order=4): return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)
def lp(x, f, order=4): return sosfilt(butter(order, f, "lowpass", fs=SR, output="sos"), x)
def hp(x, f, order=4): return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x)
def env(n, a=0.01, r=0.1):
    e = np.ones(n); ai = int(SR * a); ri = int(SR * r)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e
def decay(sec, k): return np.exp(-t(sec) * k)
def place(buf, x, at):
    i = int(at * SR); n = min(len(x), len(buf) - i)
    if n > 0: buf[i:i + n] += x[:n]
def save(name, x, peak=0.7):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    wavfile.write(f"public/sfx/{name}.wav", SR, (x * 32767).astype(np.int16))
    print("sfx", name, f"{len(x) / SR:.1f}s")

def thud(sec=0.35, f0=70):
    tt = t(sec); f = f0 * (1 + 1.5 * np.exp(-tt * 30))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(sec, 12) + lp(noise(sec), 400) * decay(sec, 40) * 0.6

# steam train: chuffs speeding up a little, plus a two-tone whistle
d = 5.0; x = np.zeros(int(SR * d)); at = 0.05; gap = 0.42
while at < d - 0.3:
    place(x, bp(noise(0.25), 150, 1800) * decay(0.25, 14), at); at += gap; gap = max(0.3, gap * 0.985)
wt = t(1.1); wh = (np.sin(2 * np.pi * 740 * wt) + 0.7 * np.sin(2 * np.pi * 932 * wt) + 0.2 * bp(noise(1.1), 600, 1200)) * env(len(wt), 0.08, 0.35)
place(x, wh * 0.45, 0.6)
save("train", x * env(len(x), 0.2, 0.6), 0.6)

# ship horn: deep, slow attack
h = t(2.4); horn = sum(np.sin(2 * np.pi * 98 * k * h) / k for k in range(1, 7))
save("horn", lp(horn, 900) * env(len(h), 0.25, 0.7), 0.55)

# sea waves: slow swells of filtered noise
d = 6.0; w = lp(noise(d), 900) * (0.55 + 0.45 * np.sin(2 * np.pi * t(d) / 3.0 - 1.5) ** 2)
save("waves", w * env(len(w), 0.6, 1.0), 0.45)

# crowd murmur (talking) and cheer (rising, with claps)
d = 4.0; m = bp(noise(d), 250, 2600) * (0.6 + 0.4 * lp(np.abs(noise(d)), 6))
voices = sum(np.sin(2 * np.pi * (180 + 90 * k) * t(d) + 3 * np.sin(2 * np.pi * (4 + k) * t(d))) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.7 + 0.3 * k) * t(d) + k)) for k in range(6))
save("murmur", (m + 0.08 * lp(voices, 1500)) * env(int(SR * d), 0.5, 0.8), 0.4)
c = bp(noise(d), 400, 4000) * np.linspace(0.4, 1, int(SR * d)) ** 1.5
for k in range(40): place(c, hp(noise(0.03), 1500) * decay(0.03, 120) * 2, rng.uniform(0.3, d - 0.2))
save("cheer", c * env(len(c), 0.3, 0.9), 0.45)

# cash register "ka-ching"
x = np.zeros(int(SR * 1.4)); place(x, hp(noise(0.06), 2000) * decay(0.06, 80), 0)
bell = sum(np.sin(2 * np.pi * f * t(1.2)) * a for f, a in [(2093, 1), (2637, 0.6), (4186, 0.3)]) * decay(1.2, 4)
place(x, bell * 0.6, 0.08)
save("register", x, 0.55)

# printing press: a thump and clack every 22 frames (0.733 s), like the animation
d = 6.0; x = np.zeros(int(SR * d))
for k in range(int(d / 0.733)):
    place(x, thud(0.3, 55), k * 0.733 + 0.25)
    place(x, hp(noise(0.05), 1800) * decay(0.05, 70) * 0.5, k * 0.733 + 0.3)
save("press", x, 0.55)

# rubber stamp / gavel thud
x = thud(0.5, 60); place(x, hp(noise(0.05), 1200) * decay(0.05, 60) * 0.4, 0)
save("stamp", x, 0.7)

# market crash: falling whoosh into a low boom
d = 2.2; sweep = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 80, int(SR * 1.4))) / SR) * 0.3
x = np.zeros(int(SR * d)); place(x, (bp(noise(1.4), 200, 3000) * np.linspace(0.2, 1, int(SR * 1.4)) + sweep) * env(int(SR * 1.4), 0.05, 0.1), 0)
place(x, thud(0.8, 45) * 1.2, 1.35)
save("crash", x, 0.6)

# helicopter: rotor chop
d = 5.0; chop = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * t(d)))
x = lp(noise(d), 500) * (0.3 + 0.7 * lp(chop, 60)) + 0.15 * np.sin(2 * np.pi * 70 * t(d))
save("heli", x * env(len(x), 0.4, 1.0), 0.5)

# chainsaw: buzzy two-stroke engine revving
d = 3.0; tt = t(d); f = 95 + 40 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * tt))
saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
x = lp(saw + 0.3 * bp(noise(d), 1500, 5000), 3500)
save("chainsaw", x * env(len(x), 0.1, 0.4), 0.4)

# ballot: paper slides in, soft drop
x = np.zeros(int(SR * 0.8)); place(x, hp(noise(0.3), 2500) * np.hanning(int(SR * 0.3)), 0); place(x, thud(0.3, 110) * 0.5, 0.32)
save("ballot", x, 0.45)

# vault: creak then heavy clunk
d = 1.8; tt = t(1.1); f = 140 + 60 * np.sin(2 * np.pi * 1.3 * tt) + 20 * rng.standard_normal(len(tt)).cumsum() / 400
creak = bp(2 * ((np.cumsum(f) / SR) % 1) - 1, 300, 2500) * env(len(tt), 0.1, 0.2)
x = np.zeros(int(SR * d)); place(x, creak * 0.5, 0); place(x, thud(0.6, 50) * 1.2, 1.15)
save("vault", x, 0.6)

# paper rustle
x = hp(noise(0.7), 1800) * (0.4 + 0.6 * np.abs(lp(noise(0.7), 30))) * env(int(SR * 0.7), 0.05, 0.2)
save("paper", x, 0.35)

# soft whoosh for scene changes
d = 0.9; x = bp(noise(d), 300, 3000) * np.hanning(int(SR * d))
save("softwhoosh", x, 0.3)
