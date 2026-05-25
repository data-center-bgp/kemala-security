// Simulates the useFocusEffect refresh pattern used in all add-entry screens.
// Verifies that when a screen is re-focused after time advances past midnight,
// the date/time state is updated to the latest value.

const formatDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const formatTime = (d) => d.toTimeString().slice(0, 5);

// --- Simulated React hooks ---
let realNow = new Date("2026-05-25T23:55:00");
const stubbedNow = () => new Date(realNow.getTime());

function createScreen() {
  // useState(new Date()) — captures "now" at mount time
  let date = stubbedNow();
  let time = stubbedNow();

  // The focus handler defined inside useFocusEffect(useCallback(...))
  const onFocus = () => {
    const now = stubbedNow();
    date = now;
    time = now;
  };

  return {
    get date() {
      return date;
    },
    get time() {
      return time;
    },
    focus: onFocus,
  };
}

// --- Test 1: mount before midnight, submit after midnight WITHOUT refocus ---
// (old buggy behavior would persist here without the fix; we still demonstrate stale state if no focus)
realNow = new Date("2026-05-25T23:55:00");
const screenA = createScreen();
console.log(
  "[T1] mounted at:        ",
  formatDate(screenA.date),
  formatTime(screenA.time),
);
// Advance clock 10 minutes past midnight
realNow = new Date("2026-05-26T00:05:00");
console.log(
  "[T1] state before focus:",
  formatDate(screenA.date),
  formatTime(screenA.time),
  "(would be stale without focus)",
);

// --- Test 2: re-focus the screen after midnight (the actual fix path) ---
screenA.focus();
console.log(
  "[T1] state after focus: ",
  formatDate(screenA.date),
  formatTime(screenA.time),
);

const expectedDate = "2026-05-26";
const expectedTime = "00:05";
const passDate = formatDate(screenA.date) === expectedDate;
const passTime = formatTime(screenA.time) === expectedTime;

console.log("");
console.log("Expected date:", expectedDate, "→", passDate ? "PASS" : "FAIL");
console.log("Expected time:", expectedTime, "→", passTime ? "PASS" : "FAIL");

// --- Test 3: izin-keluar style (3 fields: date + jamKeluar + jamMasuk) ---
function createIzinScreen() {
  let date = stubbedNow();
  let jamKeluar = stubbedNow();
  let jamMasuk = stubbedNow();
  const onFocus = () => {
    const now = stubbedNow();
    date = now;
    jamKeluar = now;
    jamMasuk = now;
  };
  return {
    get date() {
      return date;
    },
    get jamKeluar() {
      return jamKeluar;
    },
    get jamMasuk() {
      return jamMasuk;
    },
    focus: onFocus,
  };
}

realNow = new Date("2026-05-25T23:58:00");
const screenB = createIzinScreen();
realNow = new Date("2026-05-26T00:10:00");
screenB.focus();
console.log("");
console.log("[T3 izin-keluar]");
console.log("  date:     ", formatDate(screenB.date));
console.log("  jamKeluar:", formatTime(screenB.jamKeluar));
console.log("  jamMasuk: ", formatTime(screenB.jamMasuk));

const t3pass =
  formatDate(screenB.date) === "2026-05-26" &&
  formatTime(screenB.jamKeluar) === "00:10" &&
  formatTime(screenB.jamMasuk) === "00:10";
console.log("T3 →", t3pass ? "PASS" : "FAIL");

// --- Test 4: re-focusing well after submission still keeps it current ---
realNow = new Date("2026-05-26T08:30:00");
screenA.focus();
console.log("");
console.log("[T4 later in the day]");
console.log(
  "  date:",
  formatDate(screenA.date),
  "time:",
  formatTime(screenA.time),
);
const t4pass =
  formatDate(screenA.date) === "2026-05-26" &&
  formatTime(screenA.time) === "08:30";
console.log("T4 →", t4pass ? "PASS" : "FAIL");

const allPass = passDate && passTime && t3pass && t4pass;
console.log("");
console.log(allPass ? "✓ ALL TESTS PASSED" : "✗ SOME TESTS FAILED");
process.exit(allPass ? 0 : 1);
