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

export function sendAlert(): boolean {
  if (!port || !port.isOpen) {
    console.warn('⚠️  Cannot send alert — box not connected');
    return false;
  }
  port.write('alert\n', (err) => {
    if (err) console.error('Serial write error:', err.message);
    else console.log('📢 Alert sent to ADMO Box');
  });
  return true;
}

// ── Scheduler ──────────────────────────────────────────────────────────────
// DEMO: checks every 10s if the current time matches one of the 3 dispenser
// slots (morning / noon / evening) and sends ONE alert per slot.
const pad = (n: number) => String(n).padStart(2, '0');
let lastFired = ''; // "YYYY-MM-DD HH:MM" — avoids firing twice in the same minute

async function checkSchedule() {
  const now = new Date();
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${timeStr}`;
  if (key === lastFired) return;

  try {
    const slot = await db('dispenser_slots').where({ enabled: true, time: timeStr }).first();
    if (slot) {
      lastFired = key;
      console.log(`⏰ ${slot.slot} (${timeStr}) — sending alert`);
      sendAlert();
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
