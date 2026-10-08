const WORDS = [
  "ABEND", "ACKER", "ADLER", "ALARM", "ALTER", "AMPEL", "ANGST", "APFEL",
  "ATMEN", "AUGEN", "BAUCH", "BAUER", "BEINE", "BERGE", "BESEN", "BIBER",
  "BIRNE", "BLATT", "BLICK", "BLUME", "BOHNE", "BRAND", "BREIT", "BRIEF",
  "BRISE", "BROTE", "BRUCH", "CHAOS", "DATEN", "DECKE", "DICHT", "DIEBE",
  "DRAHT", "DRECK", "DURST", "EBENE", "EICHE", "EIMER", "EISEN", "ELCHE",
  "ENKEL", "ERNST", "ETAGE", "FADEN", "FAHRT", "FALLE", "FARBE", "FAUST",
  "FEDER", "FEIER", "FIGUR", "FIRMA", "FLAIR", "FLECK", "FLORA", "FLUSS",
  "FOLGE", "FOLIE", "FRAGE", "FRECH", "FROST", "GABEL", "GASSE", "GEBEN",
  "GEIST", "GELBE", "GENAU", "GENIE", "GERNE", "GESTE", "GLANZ", "GLATT",
  "GLEIS", "GLÜCK", "GNADE", "GRILL", "GRUBE", "GRÜNE", "GRUND", "GUMMI",
  "GURKE", "HAARE", "HAFEN", "HAKEN", "HALLE", "HARFE", "HASEN", "HAUBE",
  "HAUCH", "HEBEL", "HEBEN", "HEIDE", "HEUTE", "HILFE", "HIRSE", "HOBBY",
  "HONIG", "HOTEL", "HUMOR", "HUNDE", "IDEAL", "IMAGE", "IMKER", "INDEX",
  "INSEL", "JACKE", "JAGEN", "JAHRE", "JEDER", "JETZT", "JUNGE", "KABEL",
  "KAMIN", "KANAL", "KANNE", "KARTE", "KASSE", "KATER", "KATZE", "KEGEL",
  "KEHLE", "KEINE", "KELCH", "KERZE", "KETTE", "KIOSK", "KISTE", "KLANG",
  "KLEID", "KLEIN", "KLIMA", "KNAPP", "KNICK", "KOBRA", "KOCHT", "KOHLE",
  "KOMMA", "KOPIE", "KRAFT", "KRANK", "KRANZ", "KRASS", "KRAUT", "KREBS",
  "KREIS", "KRONE", "KÜCHE", "KUGEL", "KUNDE", "KUNST", "KURVE", "LAGER",
  "LAMPE", "LÄNGE", "LASER", "LAUNE", "LAUTE", "LEBEN", "LEBER", "LEDER",
  "LEERE", "LEHRE", "LEISE", "LEITE", "LERNE", "LESEN", "LETZT", "LICHT",
  "LIEBE", "LIEGE", "LIEST", "LINDE", "LINIE", "LIPPE", "LISTE", "LOGIK",
  "LOKAL", "LÖSEN", "LUNGE", "LYRIK", "MACHE", "MACHT", "MAGEN", "MAJOR",
  "MALEN", "MALER", "MANGO", "MARKE", "MASSE", "MATHE", "MAUER", "MEERE",
  "MEILE", "MEINE", "MEIST", "MENSA", "MERKE", "MIETE", "MILCH", "MINZE",
  "MITTE", "MÖBEL", "MORAL", "MOTOR", "MÜHLE", "MÜNZE", "MUSIK", "MUTIG",
  "NACHT", "NAGEL", "NARBE", "NASEN", "NATUR", "NEBEL", "NEBEN", "NEHME",
  "NEIGE", "NETTE", "NEUEN", "NEUES", "NICHT", "NOTEN", "OCHSE", "OLIVE",
  "OPTIK", "ORGEL", "OSTEN", "PACKE", "PAKET", "PANIK", "PAPST", "PAPPE",
  "PAUSE", "PEDAL", "PERLE", "PFERD", "PFUND", "PHASE", "PIANO", "PILOT",
  "PINIE", "PLAGE", "PLANE", "PLATZ", "POKAL", "POLAR", "POSTE", "PRIMA",
  "PRINZ", "PROBE", "PROFI", "PROSA", "PROST", "PUMPE", "PUNKT", "PUPPE",
  "QUARK", "QUASI",   "RABEN", "RADAR", "RADIO", "RASEN", "RATEN",
  "RAUPE", "RAUTE", "REGEN", "REGEL", "REGIE", "REIHE", "REICH", "REIFE",
  "REISE", "REIZE", "RENNE", "RENTE", "RIESE", "RINDE", "RINGE", "RINNE",
  "RITUS", "RODEL", "ROHRE", "ROLLE", "ROMAN", "ROSEN", "ROUTE", "RÜCKE",
  "RUDER", "RUINE", "RUMPF", "RUNDE", "SACHE", "SAHNE", "SALAT", "SALBE",
  "SALDO", "SALON", "SALTO", "SAMEN", "SANFT", "SATIN", "SAUER", "SAUNA",
  "SEGEL", "SEGEN", "SEHEN", "SEIDE", "SEIFE", "SEITE", "SELBE", "SELIG",
  "SENAT", "SENDE", "SENKE", "SERIE", "SETZE", "SICHT", "SIEGE", "SIEHE",
  "SIEHT", "SILBE", "SINNE", "SINUS", "SITZE", "SKALA", "SOCKE", "SOLAR",
  "SONNE", "SORGE", "SORTE", "SPALT", "SPARE", "SPECK", "SPEER", "SPIEL",
  "SPION", "SPITZ", "SPORT", "SPRAY", "SPRIT", "SPULE", "STAAT", "STAHL",
  "STARK", "STAUB", "STEAK", "STEHE", "STEIG", "STEIN", "STERN", "STICH",
  "STIER", "STIFT", "STILL", "STOCK", "STOFF", "STOLZ", "STROM", "STUFE",
  "STUHL", "STUMM", "STURM", "STUTE", "SUCHE", "SUCHT", "SUMME", "SÜDEN",
  "TAFEL", "TALER", "TANNE", "TANZT", "TASSE", "TASTE", "TAUBE", "TAUCH",
  "TEICH", "TEILE", "TEMPO", "TENOR", "TEUER", "THEMA", "TIGER", "TIMER",
  "TITEL", "TOAST", "TOKEN", "TONNE", "TOPAS", "TORTE", "TRAUM", "TREFF",
  "TREND", "TRICK", "TROST", "TROTZ", "TUPFE", "TURBO", "TURNE", "TUTOR",
  "UMBAU", "UMWEG", "UNART", "UNION", "UNSER", "UNTEN", "URALT", "URBAN",
  "VATER", "VEGAN", "VIDEO", "VIELE", "VILLA", "VIRUS", "VITAL", "VOGEL",
  "VOLLE", "VORAN", "VORNE", "WAAGE", "WACHE", "WACHS", "WAGEN", "WAHRE",
  "WALZE", "WANNE", "WARUM", "WECKE", "WEDEL", "WEGEN", "WEHEN", "WEIHE",
  "WEILE", "WEISE", "WEITE", "WELLE", "WENDE", "WERDE", "WERFT", "WERKE",
  "WESEN", "WETTE", "WICHT", "WIESE", "WILDE", "WILLE", "WINDE", "WINKE",
  "WISCH", "WITWE", "WITZE", "WOCHE", "WOGEN", "WOLKE", "WOLLE", "WORTE",
  "WUCHS", "WUNDE", "WÜRDE", "WÜRZE", "WURST", "ZANGE", "ZEBRA", "ZEHEN",
  "ZEIGE", "ZEILE", "ZELLE", "ZELTE", "ZIEGE", "ZIEHE", "ZIELE", "ZIEHT",
  "ZINNE", "ZITAT", "ZOGEN"
];

const ROWS = 6;
const COLUMNS = 5;
const LETTERS = /^[A-ZÄÖÜ]{5}$/u;
const KEY_ROWS = ["QWERTZUIOPÜ", "ASDFGHJKLÖÄ", "YXCVBNM"];

const board = document.querySelector("#board");
const keyboard = document.querySelector("#keyboard");
const message = document.querySelector("#message");
const helpDialog = document.querySelector("#help-dialog");
const nicknameDialog = document.querySelector("#nickname-dialog");
const leaderboardDialog = document.querySelector("#leaderboard-dialog");
const deviceHint = document.querySelector("#device-hint");
const touchPointer = window.matchMedia("(pointer: coarse)");

let answer = "";
let currentGuess = "";
let guesses = [];
let gameOver = false;
let lastAnswer = "";
let gameId = 0;
const keyStates = new Map();

function buildBoard() {
  board.replaceChildren();
  for (let row = 0; row < ROWS; row += 1) {
    const rowElement = document.createElement("div");
    rowElement.className = "board-row";
    rowElement.setAttribute("aria-label", `Versuch ${row + 1}`);
    for (let column = 0; column < COLUMNS; column += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${row}-${column}`;
      tile.setAttribute("aria-hidden", "true");
      rowElement.append(tile);
    }
    board.append(rowElement);
  }
}

function buildKeyboard() {
  keyboard.replaceChildren();
  KEY_ROWS.forEach((letters, rowIndex) => {
    const row = document.createElement("div");
    row.className = "keyboard-row";

    if (rowIndex === 2) {
      row.append(makeKey("ENTER", "Enter", "wide"));
    }

    for (const letter of letters) {
      row.append(makeKey(letter, letter));
    }

    if (rowIndex === 2) {
      row.append(makeKey("⌫", "Backspace", "wide"));
    }
    keyboard.append(row);
  });
}

function makeKey(label, value, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `key ${extraClass}`.trim();
  button.textContent = label;
  button.setAttribute("aria-label", value === "Backspace" ? "Löschen" : value);
  button.addEventListener("click", () => handleKey(value));
  return button;
}

function newGame() {
  gameId += 1;
  const options = WORDS.filter((word) => word !== lastAnswer);
  answer = options[Math.floor(Math.random() * options.length)];
  lastAnswer = answer;
  currentGuess = "";
  guesses = [];
  gameOver = false;
  keyStates.clear();
  message.textContent = "";
  buildBoard();
  buildKeyboard();
  updateCurrentRow();
}

function updateCurrentRow() {
  const row = guesses.length;
  if (row >= ROWS) return;

  for (let column = 0; column < COLUMNS; column += 1) {
    const tile = document.querySelector(`#tile-${row}-${column}`);
    const letter = currentGuess[column] ?? "";
    tile.textContent = letter;
    tile.classList.toggle("filled", Boolean(letter));
  }
}

function handleKey(key) {
  if (gameOver) return;

  if (key === "Enter") {
    submitGuess();
  } else if (key === "Backspace") {
    currentGuess = Array.from(currentGuess).slice(0, -1).join("");
    message.textContent = "";
    updateCurrentRow();
  } else if (/^[A-ZÄÖÜ]$/u.test(key) && currentGuess.length < COLUMNS) {
    currentGuess += key;
    message.textContent = "";
    updateCurrentRow();
  }
}

function scoreGuess(guess) {
  const result = Array(COLUMNS).fill("absent");
  const remaining = Array.from(answer);

  for (let index = 0; index < COLUMNS; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct";
      remaining[index] = null;
    }
  }

  for (let index = 0; index < COLUMNS; index += 1) {
    if (result[index] === "correct") continue;
    const match = remaining.indexOf(guess[index]);
    if (match !== -1) {
      result[index] = "present";
      remaining[match] = null;
    }
  }
  return result;
}

function revealGuess(guess, result, row) {
  const activeGameId = gameId;
  Array.from(guess).forEach((letter, column) => {
    const tile = document.querySelector(`#tile-${row}-${column}`);
    window.setTimeout(() => {
      if (activeGameId !== gameId) return;
      tile.classList.add("reveal", result[column]);
      setKeyState(letter, result[column]);
    }, column * 220);
  });
}

function setKeyState(letter, state) {
  const rank = { absent: 0, present: 1, correct: 2 };
  if (rank[state] <= (rank[keyStates.get(letter)] ?? -1)) return;
  keyStates.set(letter, state);
  const key = [...keyboard.querySelectorAll(".key")]
    .find((button) => button.getAttribute("aria-label") === letter);
  if (key) {
    key.classList.remove("absent", "present", "correct");
    key.classList.add(state);
  }
}

function submitGuess() {
  if (currentGuess.length !== COLUMNS) {
    message.textContent = "Bitte gib fünf Buchstaben ein.";
    return;
  }
  if (!LETTERS.test(currentGuess)) {
    message.textContent = "Bitte verwende nur Buchstaben.";
    return;
  }

  const row = guesses.length;
  const guess = currentGuess;
  const activeGameId = gameId;
  const result = scoreGuess(guess);
  guesses.push(guess);
  currentGuess = "";
  revealGuess(guess, result, row);

  if (guess === answer) {
    gameOver = true;
    const completionMessage = recordCompletedGame(true);
    window.setTimeout(() => {
      if (activeGameId !== gameId) return;
      message.textContent = guesses.length === 1
        ? `Fantastisch – gleich beim ersten Versuch!${completionMessage}`
        : `Richtig! Gut gemacht.${completionMessage}`;
    }, COLUMNS * 220);
  } else if (guesses.length === ROWS) {
    gameOver = true;
    const completionMessage = recordCompletedGame(false);
    window.setTimeout(() => {
      if (activeGameId !== gameId) return;
      message.textContent = `Schade! Gesucht war ${answer}.${completionMessage}`;
    }, COLUMNS * 220);
  }
}

function recordCompletedGame(solved) {
  try {
    const points = window.WortleLeaderboard.addCompletedGame({
      solved,
      attempts: guesses.length
    });
    return solved ? ` +${points} Punkte` : "";
  } catch (error) {
    console.error("Das Spielergebnis konnte nicht gespeichert werden:", error);
    return " Ergebnis konnte nicht gespeichert werden.";
  }
}

function updateDeviceProfile() {
  const hasTouch = touchPointer.matches || navigator.maxTouchPoints > 0;
  const isMobile = window.innerWidth <= 699 || (hasTouch && window.innerWidth <= 1024);

  document.documentElement.dataset.device = isMobile ? "mobile" : "desktop";
  document.documentElement.dataset.input = hasTouch ? "touch" : "keyboard";
  deviceHint.textContent = hasTouch
    ? "Tippe die Buchstaben an oder nutze eine verbundene Tastatur."
    : "Rate mit deiner Tastatur oder klicke die Buchstaben an.";
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || helpDialog.open || nicknameDialog.open || leaderboardDialog.open) return;
  const key = event.key.toLocaleUpperCase("de-DE");
  if (key === "ENTER" || key === "BACKSPACE" || /^[A-ZÄÖÜ]$/u.test(key)) {
    event.preventDefault();
    handleKey(event.key === "Enter" ? "Enter" : event.key === "Backspace" ? "Backspace" : key);
  }
});

document.querySelector("#new-game-button").addEventListener("click", newGame);
document.querySelector("#footer-new-game").addEventListener("click", newGame);
document.querySelector("#help-button").addEventListener("click", () => helpDialog.showModal());
document.querySelector("#close-help").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

window.addEventListener("resize", updateDeviceProfile, { passive: true });
touchPointer.addEventListener("change", updateDeviceProfile);
updateDeviceProfile();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./service-worker.js")
    .catch((error) => console.error("Offline-Spiel konnte nicht eingerichtet werden:", error));
}

newGame();
window.WortleLeaderboard.initialize();
