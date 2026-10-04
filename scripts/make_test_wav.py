import math, struct, wave
with wave.open('/tmp/soundguard-test.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(16000)
    frames = [int(12000 * math.sin(2 * math.pi * (220 + 80 * math.sin(i / 400)) * i / 16000)) for i in range(16000)]
    f.writeframes(b''.join(struct.pack('<h', x) for x in frames))
