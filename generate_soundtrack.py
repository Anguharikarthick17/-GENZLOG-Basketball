import math
import numpy as np
import wave
import os

SAMPLE_RATE = 44100
TOTAL_DURATION = 20.0  # Exactly 20.0 seconds
TOTAL_SAMPLES = int(SAMPLE_RATE * TOTAL_DURATION)

# Stereo buffers
left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

def add_tone(start_s, duration_s, freq_start, freq_end, volume=0.2, pan=0.0, wave_type='sine'):
    start_idx = int(start_s * SAMPLE_RATE)
    num_samples = int(duration_s * SAMPLE_RATE)
    if start_idx >= TOTAL_SAMPLES:
        return
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    actual_samples = end_idx - start_idx
    if actual_samples <= 0:
        return

    t = np.linspace(0, duration_s * (actual_samples / num_samples), actual_samples, False)
    freq = np.linspace(freq_start, freq_end, actual_samples)
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE

    if wave_type == 'sine':
        sig = np.sin(phase)
    elif wave_type == 'triangle':
        sig = 2 * np.abs(2 * (phase / (2 * np.pi) - np.floor(phase / (2 * np.pi) + 0.5))) - 1
    elif wave_type == 'saw':
        sig = 2 * (phase / (2 * np.pi) - np.floor(phase / (2 * np.pi) + 0.5))
    else:
        sig = np.sin(phase)

    # Envelope
    env = np.ones(actual_samples)
    fade_in = int(min(0.02 * SAMPLE_RATE, actual_samples // 4))
    fade_out = int(min(0.05 * SAMPLE_RATE, actual_samples // 2))
    if fade_in > 0:
        env[:fade_in] = np.linspace(0, 1, fade_in)
    if fade_out > 0:
        env[-fade_out:] = np.linspace(1, 0, fade_out)

    sig = sig * env * volume
    left_gain = math.sqrt(0.5 * (1.0 - pan))
    right_gain = math.sqrt(0.5 * (1.0 + pan))

    left[start_idx:end_idx] += sig * left_gain
    right[start_idx:end_idx] += sig * right_gain

def add_kick(start_s, volume=0.45):
    start_idx = int(start_s * SAMPLE_RATE)
    duration_s = 0.22
    num_samples = int(duration_s * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    actual_samples = end_idx - start_idx
    if actual_samples <= 0:
        return

    t = np.linspace(0, duration_s * (actual_samples / num_samples), actual_samples, False)
    # Exponential frequency drop from 140Hz to 42Hz
    freq = 42 + 98 * np.exp(-t * 22)
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    sig = np.sin(phase)

    # Punch transient + envelope
    env = np.exp(-t * 14)
    sig = sig * env * volume

    left[start_idx:end_idx] += sig * 0.7
    right[start_idx:end_idx] += sig * 0.7

def add_hat(start_s, volume=0.12, pan=0.2):
    start_idx = int(start_s * SAMPLE_RATE)
    duration_s = 0.045
    num_samples = int(duration_s * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    actual_samples = end_idx - start_idx
    if actual_samples <= 0:
        return

    t = np.linspace(0, duration_s, actual_samples, False)
    noise = np.random.uniform(-1, 1, actual_samples)
    env = np.exp(-t * 85)
    sig = noise * env * volume

    left_gain = math.sqrt(0.5 * (1.0 - pan))
    right_gain = math.sqrt(0.5 * (1.0 + pan))
    left[start_idx:end_idx] += sig * left_gain
    right[start_idx:end_idx] += sig * right_gain

def add_whoosh(start_s, duration_s=0.65, volume=0.22, reverse=False):
    start_idx = int(start_s * SAMPLE_RATE)
    num_samples = int(duration_s * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    actual_samples = end_idx - start_idx
    if actual_samples <= 0:
        return

    t = np.linspace(0, duration_s, actual_samples, False)
    noise = np.random.uniform(-1, 1, actual_samples)
    # Envelope
    if reverse:
        env = (t / duration_s) ** 2
    else:
        env = np.sin(np.pi * (t / duration_s))

    # Swept resonant band
    center_freq = 600 + 800 * np.sin(np.pi * (t / duration_s))
    sig = noise * env * volume * 0.4
    # Add subtle low sine body
    sig += np.sin(2 * np.pi * (160 + 240 * (t / duration_s)) * t) * env * volume * 0.3

    left[start_idx:end_idx] += sig * 0.7
    right[start_idx:end_idx] += sig * 0.7

def add_swish(start_s, volume=0.42):
    start_idx = int(start_s * SAMPLE_RATE)
    duration_s = 0.45
    num_samples = int(duration_s * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    actual_samples = end_idx - start_idx
    if actual_samples <= 0:
        return

    t = np.linspace(0, duration_s, actual_samples, False)
    noise = np.random.uniform(-1, 1, actual_samples)
    # Swish envelope: sharp attack, double flutter
    env = np.exp(-t * 9) * (1.0 + 0.3 * np.sin(2 * np.pi * 32 * t))
    sig = noise * env * volume

    # Soft metallic rim ring harmonic
    rim = np.sin(2 * np.pi * 380 * t) * np.exp(-t * 18) * 0.18
    sig += rim

    left[start_idx:end_idx] += sig * 0.7
    right[start_idx:end_idx] += sig * 0.7

def add_chime(start_s, volume=0.35):
    # Two-tone uplifting confirmation: C6 (1046.5Hz) & E6 (1318.5Hz)
    add_tone(start_s, 0.6, 1046.5, 1046.5, volume * 0.7, pan=-0.15, wave_type='triangle')
    add_tone(start_s + 0.1, 0.75, 1318.5, 1318.5, volume * 0.85, pan=0.15, wave_type='triangle')
    add_tone(start_s + 0.22, 0.9, 1568.0, 1568.0, volume * 0.5, pan=0.0, wave_type='sine')

def add_click(start_s, volume=0.25):
    start_idx = int(start_s * SAMPLE_RATE)
    duration_s = 0.02
    num_samples = int(duration_s * SAMPLE_RATE)
    end_idx = min(TOTAL_SAMPLES, start_idx + num_samples)
    actual_samples = end_idx - start_idx
    if actual_samples <= 0:
        return

    t = np.linspace(0, duration_s, actual_samples, False)
    sig = np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 300) * volume
    left[start_idx:end_idx] += sig * 0.7
    right[start_idx:end_idx] += sig * 0.7

# =============================================================================
# COMPOSE 20-SECOND MODERN PRODUCT TRACK
# =============================================================================

# 1. Sound Effects Synchronized with Actions
add_whoosh(0.1, 1.1, volume=0.25)          # Scene 1: Introduction push-in
add_click(3.5, volume=0.3)                  # Scene 2: Click Choose File
add_click(4.6, volume=0.25)                 # Scene 2: Select pitch_deck_q4.pdf
add_whoosh(6.3, 0.8, volume=0.22)           # Scene 3: Drag aim across court
add_whoosh(8.5, 0.6, volume=0.2)            # Scene 3: Drag to right wing
add_whoosh(10.0, 0.9, volume=0.28)          # Scene 4: Basketball release flight
add_swish(11.2, volume=0.45)                # Scene 4: Net swish basket!
add_chime(15.8, volume=0.38)                # Scene 5: Upload 100% complete chime
add_whoosh(17.2, 1.2, volume=0.2)           # Scene 6: Outro brand resolve

# 2. Rhythmic Instrumental Music (120 BPM: Beat = 0.5s)
# Kick on beats during energetic sections: 3.0s to 9.5s and 11.5s to 17.5s
for beat_idx in range(6, 19):  # 3.0s to 9.5s
    add_kick(beat_idx * 0.5, volume=0.38)
    add_hat(beat_idx * 0.5 + 0.25, volume=0.1)

# Drop / anticipation pause between 9.5s and 11.2s for the basketball shot
# Re-ignite beat upon basket swish at 11.5s:
for beat_idx in range(23, 34):  # 11.5s to 17.0s
    add_kick(beat_idx * 0.5, volume=0.42)
    add_hat(beat_idx * 0.5 + 0.25, volume=0.12)
    add_hat(beat_idx * 0.5 + 0.125, volume=0.07, pan=-0.3)
    add_hat(beat_idx * 0.5 + 0.375, volume=0.07, pan=0.3)

# 3. Melodic Bassline & Chords (D minor progression: Dm - Bb - C - Am)
# Bass notes
bass_pattern = [
    (1.0, 2.0, 73.42),   # D2
    (3.0, 1.5, 73.42),   # D2
    (4.5, 1.5, 58.27),   # Bb1
    (6.0, 2.0, 65.41),   # C2
    (8.0, 1.8, 73.42),   # D2
    (11.5, 2.0, 73.42),  # D2 after basket
    (13.5, 1.5, 58.27),  # Bb1
    (15.0, 1.8, 65.41),  # C2
    (16.8, 2.2, 73.42),  # D2
]
for start, dur, freq in bass_pattern:
    add_tone(start, dur, freq, freq, volume=0.22, wave_type='triangle')
    add_tone(start, dur, freq * 2, freq * 2, volume=0.08, wave_type='sine')

# Atmospheric chords / synth pads
chords = [
    (0.0, 3.0, [293.66, 349.23, 440.0]),   # Dm
    (3.0, 3.0, [233.08, 293.66, 349.23]),  # Bb
    (6.0, 3.5, [261.63, 329.63, 392.0]),   # C
    (9.5, 1.8, [293.66, 349.23, 440.0]),   # Dm (anticipation)
    (11.3, 3.0, [349.23, 440.0, 523.25]),  # F major lift on basket
    (14.3, 2.7, [261.63, 329.63, 392.0]),  # C major upload success
    (17.0, 2.8, [293.66, 369.99, 440.0]),  # D major bright resolve
]
for start, dur, freqs in chords:
    for f in freqs:
        add_tone(start, dur, f, f, volume=0.08, pan=np.random.uniform(-0.3, 0.3), wave_type='sine')

# Master volume envelope with smooth fade out in final 1.0s
master_fade_start = int(18.8 * SAMPLE_RATE)
fade_len = TOTAL_SAMPLES - master_fade_start
fade_curve = np.linspace(1.0, 0.0, fade_len)
left[master_fade_start:] *= fade_curve
right[master_fade_start:] *= fade_curve

# Peak normalize to -1.0 dB
max_val = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-6)
norm_factor = (10 ** (-1.0 / 20.0)) / max_val
left = np.clip(left * norm_factor, -1.0, 1.0)
right = np.clip(right * norm_factor, -1.0, 1.0)

# Convert to 16-bit PCM stereo
left_pcm = (left * 32767).astype(np.int16)
right_pcm = (right * 32767).astype(np.int16)
stereo_pcm = np.empty((TOTAL_SAMPLES * 2,), dtype=np.int16)
stereo_pcm[0::2] = left_pcm
stereo_pcm[1::2] = right_pcm

os.makedirs('/Users/angu/Documents/bb/output', exist_ok=True)
out_path = '/Users/angu/Documents/bb/output/soundtrack.wav'
with wave.open(out_path, 'wb') as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    wf.writeframes(stereo_pcm.tobytes())

print(f'Soundtrack created successfully: {out_path} ({TOTAL_DURATION}s, {SAMPLE_RATE}Hz, Stereo)')
