import { SerialPort } from 'serialport';
import { db } from '../config/initDb';

// ── Configurare ───────────────────────────────────────────────────────────────
// Schimba COM_PORT cu portul ESP32-ului tau (vezi Device Manager pe Windows)
// Exemple: 'COM3', 'COM4', 'COM7'
const COM_PORT = 'COM3';
const BAUD_RATE = 115200;

// ── Serial port ───────────────────────────────────────────────────────────────
let port: SerialPort | null = null;

function openPort() {
  port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE, autoOpen: false });

  port.open((err) => {
    if (err) {
      console.warn(`⚠️  ADMO Box not connected on ${COM_PORT}: ${err.message}`);
      port = null;
      return;
    }
    console.log(`🔌 ADMO Box connected on ${COM_PORT}`);
  });

  port.on('data', (data: Buffer) => {
    console.log(`[BOX] ${data.toString().trim()}`);
  });

  port.on('close', () => {
    console.warn('⚠️  Serial port closed — box disconnected');
    port = null;
  });
}

export function sendAlert() {
  if (!port || !port.isOpen) {
    console.warn('⚠️  Cannot send alert — box not connected');
    return;
  }
  port.write('alert\n', (err) => {
    if (err) console.error('Serial write error:', err.message);
    else console.log('📢 Alert sent to ADMO Box');
  });
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
// Checks every minute if a medication time matches the current time
let lastAlertMinute = '';

async function checkSchedule() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Avoid triggering twice in the same minute
  if (timeStr === lastAlertMinute) return;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = dayNames[now.getDay()];

  try {
    const meds = await db('medications').where({ active: true });

    for (const med of meds) {
      const days: string[] = JSON.parse(med.days || '[]');
      if (days.length > 0 && !days.includes(today)) continue;

      const times = await db('medication_times')
        .where({ medication_id: med.id })
        .whereRaw('SUBSTR(time, 1, 5) = ?', [timeStr]);

      if (times.length > 0) {
        console.log(`⏰ Medication time: ${med.name} at ${timeStr} — sending alert`);
        sendAlert();
        lastAlertMinute = timeStr;

        // Log to history
        await db('medication_history').insert({
          id: require('crypto').randomUUID(),
          medication_id: med.id,
          user_id: med.user_id,
          status: 'Taken',
          scheduled_time: timeStr,
          taken_at: timeStr,
          date: now.toISOString().slice(0, 10),
        });
        break; // one alert at a time — button has 40s cooldown
      }
    }
  } catch (err: any) {
    console.error('Scheduler error:', err.message);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
export function startDispenser() {
  openPort();
  // Check every 10 seconds (precise enough for HH:MM matching)
  setInterval(checkSchedule, 10_000);
  console.log('⏱️  Medication scheduler started');
}
