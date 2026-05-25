// End-to-end test of the edit feature against Supabase.
// - Signs in with a test account (prompts in terminal).
// - For each of the 6 modules with edit screens, performs:
//     1. INSERT (mimics the add.tsx submit)
//     2. SELECT by id (mimics edit.tsx fetch)
//     3. UPDATE (mimics edit.tsx submit)
//     4. SELECT to verify update
//     5. Soft-delete to clean up (deleted_at)
//
// Run with:  node scripts/test-edit-feature.mjs
// Reads EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY from .env

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

// --- Load .env -------------------------------------------------------------
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, anonKey, {
  db: { schema: "kemala_security" },
  auth: { persistSession: false },
});

// --- Prompts (password is read with echo off) -----------------------------
const ask = (q) =>
  new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(q, (a) => {
      rl.close();
      resolve(a);
    });
  });

const askHidden = (q) =>
  new Promise((resolve) => {
    process.stdout.write(q);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setEncoding("utf8");
    if (stdin.isTTY) stdin.setRawMode(true);
    let buf = "";
    const onData = (ch) => {
      ch = String(ch);
      if (ch === "\n" || ch === "\r" || ch === "\u0004") {
        if (stdin.isTTY) stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(buf);
      } else if (ch === "\u0003") {
        process.exit(1);
      } else if (ch === "\u007f") {
        buf = buf.slice(0, -1);
      } else {
        buf += ch;
      }
    };
    stdin.on("data", onData);
  });

// --- Helpers (mirror app code) ---------------------------------------------
const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const formatTime = (d) => d.toTimeString().slice(0, 5);

let pass = 0;
let fail = 0;
const results = [];

async function pickSekuriti() {
  const { data, error } = await supabase
    .from("list_sekuriti")
    .select("id, name")
    .is("deleted_at", null)
    .limit(1);
  if (error) throw new Error("list_sekuriti SELECT failed: " + error.message);
  if (!data || data.length === 0)
    throw new Error("No rows in list_sekuriti — add one before running test");
  return data[0];
}

async function pickMobil() {
  const { data, error } = await supabase
    .from("list_mobil")
    .select("*")
    .is("deleted_at", null)
    .limit(1);
  if (error) throw new Error("list_mobil SELECT failed: " + error.message);
  if (!data || data.length === 0) return null;
  return data[0];
}

async function runCase(name, insertRow, updateRow, table) {
  const tag = `[${name}]`;
  try {
    // 1. INSERT
    const { data: inserted, error: insErr } = await supabase
      .from(table)
      .insert(insertRow)
      .select()
      .single();
    if (insErr) throw new Error("INSERT: " + insErr.message);
    const id = inserted.id;

    // 2. SELECT-by-id (simulates edit page fetch)
    const { data: fetched, error: selErr } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();
    if (selErr) throw new Error("SELECT-by-id: " + selErr.message);

    // 3. UPDATE
    const { error: updErr } = await supabase
      .from(table)
      .update(updateRow)
      .eq("id", id);
    if (updErr) throw new Error("UPDATE: " + updErr.message);

    // 4. Verify
    const { data: verified, error: vErr } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();
    if (vErr) throw new Error("VERIFY SELECT: " + vErr.message);

    for (const [k, v] of Object.entries(updateRow)) {
      // Normalize time strings: Postgres TIME returns "HH:MM:SS" but the app
      // sends "HH:MM". Compare only the HH:MM prefix for time-like values.
      const isTime = typeof v === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(v);
      const expected = isTime ? String(v).slice(0, 5) : String(v);
      const actual = isTime
        ? String(verified[k]).slice(0, 5)
        : String(verified[k]);
      if (actual !== expected) {
        throw new Error(
          `Field "${k}" not updated. expected=${JSON.stringify(v)} got=${JSON.stringify(verified[k])}`,
        );
      }
    }

    // 5. Soft delete
    await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    console.log(`${tag} PASS  (id=${id})`);
    pass++;
    results.push({ name, ok: true });
  } catch (e) {
    console.log(`${tag} FAIL  ${e.message}`);
    fail++;
    results.push({ name, ok: false, err: e.message });
  }
}

async function main() {
  console.log("Supabase URL:", url);
  const email = await ask("Test account email: ");
  const password = await askHidden("Test account password: ");

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword(
    {
      email,
      password,
    },
  );
  if (authErr || !auth?.session) {
    console.error("Sign in failed:", authErr?.message);
    process.exit(1);
  }
  console.log("Signed in as:", auth.user.email);

  const sek = await pickSekuriti();
  const mobil = await pickMobil();
  console.log(`Using list_sekuriti.id = ${sek.id} (${sek.name})`);
  if (mobil) console.log(`Using list_mobil.id = ${mobil.id}`);
  else
    console.log("(no list_mobil row — pemakaian-mobil test will be skipped)");

  const now = new Date();
  const tanggal = formatDate(now);
  const waktu = formatTime(now);
  const STAMP = "TEST_EDIT_" + Date.now();

  // 1. orang_masuk
  await runCase(
    "orang_masuk",
    {
      tanggal,
      waktu,
      nama: STAMP + "_nama",
      asal: STAMP + "_asal",
      keperluan: STAMP + "_kep",
      sekuriti_id: sek.id,
    },
    {
      nama: STAMP + "_nama_EDITED",
      asal: STAMP + "_asal_EDITED",
      keperluan: STAMP + "_kep_EDITED",
    },
    "orang_masuk",
  );

  // 2. orang_keluar
  await runCase(
    "orang_keluar",
    {
      tanggal,
      waktu,
      nama: STAMP + "_nama",
      keterangan: STAMP + "_ket",
      sekuriti_id: sek.id,
    },
    {
      nama: STAMP + "_nama_EDITED",
      keterangan: STAMP + "_ket_EDITED",
    },
    "orang_keluar",
  );

  // 3. barang_masuk
  await runCase(
    "barang_masuk",
    {
      tanggal,
      waktu,
      pengirim: STAMP + "_pengirim",
      penerima: STAMP + "_penerima",
      barang: STAMP + "_brg",
      keterangan: STAMP + "_ket",
      sekuriti_id: sek.id,
    },
    {
      pengirim: STAMP + "_pengirim_EDITED",
      penerima: STAMP + "_penerima_EDITED",
      barang: STAMP + "_brg_EDITED",
      keterangan: STAMP + "_ket_EDITED",
    },
    "barang_masuk",
  );

  // 4. barang_keluar
  await runCase(
    "barang_keluar",
    {
      tanggal,
      waktu,
      pemilik_barang: STAMP + "_pemilik",
      tujuan: STAMP + "_tuj",
      barang: STAMP + "_brg",
      keterangan: STAMP + "_ket",
      sekuriti_id: sek.id,
    },
    {
      pemilik_barang: STAMP + "_pemilik_EDITED",
      tujuan: STAMP + "_tuj_EDITED",
      barang: STAMP + "_brg_EDITED",
      keterangan: STAMP + "_ket_EDITED",
    },
    "barang_keluar",
  );

  // 5. izin_keluar (jam_masuk must be after jam_keluar; durasi_keluar required)
  await runCase(
    "izin_keluar",
    {
      tanggal,
      jam_keluar: "08:00",
      jam_masuk: "09:30",
      durasi_keluar: 90,
      nama: STAMP + "_nama",
      keperluan: STAMP + "_kep",
      sekuriti_id: sek.id,
    },
    {
      nama: STAMP + "_nama_EDITED",
      keperluan: STAMP + "_kep_EDITED",
      jam_masuk: "10:00",
      durasi_keluar: 120,
    },
    "izin_keluar",
  );

  // 6. pemakaian_mobil (requires list_mobil row)
  if (mobil) {
    await runCase(
      "pemakaian_mobil",
      {
        tanggal_pakai: tanggal,
        waktu_pakai: waktu,
        mobil_id: mobil.id,
        nama_peminjam: STAMP + "_drv",
        keperluan: STAMP + "_kep",
        sekuriti_id: sek.id,
      },
      {
        nama_peminjam: STAMP + "_drv_EDITED",
        keperluan: STAMP + "_kep_EDITED",
      },
      "pemakaian_mobil",
    );
  }

  console.log("\n--------------------------------------------------");
  console.log(`Result: ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    for (const r of results.filter((r) => !r.ok))
      console.log(`  - ${r.name}: ${r.err}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
