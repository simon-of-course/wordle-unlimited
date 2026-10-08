(() => {
  "use strict";

  const STORAGE_KEY = "wortle-player-v1";
  const GAME_ROWS = 6;
  const config = window.WORTLE_SUPABASE_CONFIG ?? {};
  const nicknameDialog = document.querySelector("#nickname-dialog");
  const nicknameForm = document.querySelector("#nickname-form");
  const nicknameInput = document.querySelector("#nickname-input");
  const nicknameError = document.querySelector("#nickname-error");
  const cancelNickname = document.querySelector("#cancel-nickname");
  const closeNickname = document.querySelector("#close-nickname");
  const leaderboardDialog = document.querySelector("#leaderboard-dialog");
  const leaderboardStatus = document.querySelector("#leaderboard-status");
  const playerSummary = document.querySelector("#player-summary");
  const listElements = {
    fewest: document.querySelector("#leaderboard-fewest"),
    most: document.querySelector("#leaderboard-most"),
    kd: document.querySelector("#leaderboard-kd")
  };
  const emptyState = () => ({
    nickname: null,
    auth: null,
    gamesPlayed: 0,
    solved: 0,
    attempts: 0,
    points: 0,
    pendingGames: []
  });

  let state;
  let remoteProfile = null;
  let refreshTimer = null;
  let syncPromise = null;
  let isSavingNickname = false;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      throw new Error(`Dein Spielstand konnte nicht gespeichert werden: ${error.message}`);
    }
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Dein lokaler Spielstand ist beschädigt. Bitte lösche die Website-Daten und lade die Seite neu.");
    }
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.pendingGames)) {
      throw new Error("Dein lokaler Spielstand hat ein ungültiges Format. Bitte lösche die Website-Daten und lade die Seite neu.");
    }

    const loaded = { ...emptyState(), ...parsed };
    for (const key of ["gamesPlayed", "solved", "attempts", "points"]) {
      if (!Number.isSafeInteger(loaded[key]) || loaded[key] < 0) {
        throw new Error("Deine lokalen Statistiken sind ungültig. Bitte lösche die Website-Daten und lade die Seite neu.");
      }
    }
    if (loaded.nickname !== null && (typeof loaded.nickname !== "string" || !/^[A-Za-z0-9_.-]{2,16}$/u.test(loaded.nickname))) {
      throw new Error("Dein gespeicherter Spitzname ist ungültig. Bitte ändere ihn in deinem Profil.");
    }
    const validGame = (game) => game && typeof game.id === "string"
      && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(game.id)
      && typeof game.solved === "boolean"
      && Number.isInteger(game.attempts)
      && game.attempts >= 1
      && game.attempts <= GAME_ROWS
      && (game.solved || game.attempts === GAME_ROWS);
    if (!loaded.pendingGames.every(validGame)) {
      throw new Error("Deine lokal gespeicherten Spielergebnisse sind ungültig. Bitte lösche die Website-Daten und lade die Seite neu.");
    }
    return loaded;
  }

  function setLeaderboardStatus(text) {
    leaderboardStatus.textContent = text;
  }

  function setSyncStatus(text) {
    document.querySelector("#profile-status").textContent = text;
  }

  function renderProfile() {
    const profile = remoteProfile ?? state;
    if (!state.nickname) {
      playerSummary.textContent = "Lege einen Spitznamen für dein Spielprofil fest.";
      return;
    }
    const solved = Number(profile.solved_words ?? profile.solved ?? 0);
    const points = Number(profile.points ?? state.points);
    playerSummary.textContent = `${state.nickname}  ·  ${points} Punkte  ·  ${solved} gelöst`;
  }

  function configuredUrl() {
    if (typeof config.url !== "string" || typeof config.anonKey !== "string" || !config.url || !config.anonKey) return null;
    let parsed;
    try {
      parsed = new URL(config.url);
    } catch {
      throw new Error("Die Supabase-Projekt-URL in supabase-config.js ist ungültig.");
    }
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      throw new Error("Die Supabase-Projekt-URL muss HTTPS verwenden.");
    }
    return parsed.origin;
  }

  async function readResponse(response) {
    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        if (response.ok) throw new Error("Supabase hat eine ungültige Antwort gesendet.");
      }
    }
    if (!response.ok) {
      const detail = body?.msg ?? body?.message ?? body?.error_description ?? body?.error;
      if (response.status === 409 || /nickname|unique/i.test(String(detail ?? ""))) {
        throw new Error("Dieser Spitzname wird bereits verwendet. Bitte wähle einen anderen.");
      }
      if (/anonymous.*(disabled|not enabled)|anonymous sign.ins/i.test(String(detail ?? ""))) {
        throw new Error("Anonyme Anmeldungen sind in Supabase nicht aktiviert. Aktiviere „Anonymous Sign-Ins“ im Auth-Bereich.");
      }
      throw new Error(detail || `Supabase-Anfrage fehlgeschlagen (HTTP ${response.status}).`);
    }
    return body;
  }

  async function authRequest(path, body) {
    const baseUrl = configuredUrl();
    if (!baseUrl) throw new Error("Supabase ist noch nicht konfiguriert.");
    const response = await fetch(`${baseUrl}/auth/v1/${path}`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return readResponse(response);
  }

  function storeSession(session) {
    if (!session?.access_token || !session?.refresh_token) {
      throw new Error("Supabase hat keine gültige anonyme Sitzung zurückgegeben.");
    }
    state.auth = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: Date.now() + Number(session.expires_in ?? 3600) * 1000
    };
    saveState();
    return state.auth;
  }

  async function getSession() {
    if (state.auth?.accessToken && state.auth.expiresAt > Date.now() + 60_000) return state.auth;

    if (state.auth?.refreshToken) {
      try {
        const refreshed = await authRequest("token?grant_type=refresh_token", {
          refresh_token: state.auth.refreshToken
        });
        return storeSession(refreshed);
      } catch (error) {
        throw new Error(`Deine Online-Sitzung konnte nicht erneuert werden: ${error.message}`);
      }
    }

    const signedIn = await authRequest("signup", { data: {} });
    return storeSession(signedIn);
  }

  async function rpc(name, parameters = {}, authenticated = true) {
    const baseUrl = configuredUrl();
    if (!baseUrl) throw new Error("Supabase ist noch nicht konfiguriert.");
    const headers = {
      apikey: config.anonKey,
      "Content-Type": "application/json"
    };
    if (authenticated) {
      const session = await getSession();
      headers.Authorization = `Bearer ${session.accessToken}`;
    }
    const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers,
      body: JSON.stringify(parameters)
    });
    return readResponse(response);
  }

  function openNicknameDialog(required = false) {
    if (!nicknameDialog.open) nicknameDialog.showModal();
    nicknameInput.value = state.nickname ?? "";
    nicknameError.textContent = "";
    cancelNickname.hidden = required || !state.nickname;
    closeNickname.hidden = required || !state.nickname;
    window.setTimeout(() => nicknameInput.focus(), 0);
  }

  function renderEntries(element, entries, type) {
    element.replaceChildren();
    if (!entries.length) {
      const item = document.createElement("li");
      item.className = "leaderboard-empty";
      item.textContent = "Noch keine Einträge.";
      element.append(item);
      return;
    }
    entries.forEach((entry, index) => {
      const item = document.createElement("li");
      const place = document.createElement("span");
      place.className = "place";
      place.textContent = `${index + 1}.`;
      const name = document.createElement("span");
      name.className = "player-name";
      name.textContent = entry.nickname;
      const score = document.createElement("span");
      score.className = "player-score";
      if (type === "fewest") score.textContent = `${Number(entry.average_attempts).toFixed(2)} Vers.`;
      if (type === "most") score.textContent = `${entry.solved_words} Wörter`;
      if (type === "kd") score.textContent = `${Number(entry.kd_ratio).toFixed(2)} K/D`;
      item.append(place, name, score);
      element.append(item);
    });
  }

  async function refreshLeaderboards() {
    try {
      if (!configuredUrl()) {
        setLeaderboardStatus("Online-Bestenlisten noch nicht verbunden. Trage Projekt-URL und öffentlichen Schlüssel in supabase-config.js ein.");
        return;
      }
      setLeaderboardStatus("Bestenlisten werden geladen …");
      const result = await rpc("leaderboard_data", {}, false);
      if (!result || typeof result !== "object") throw new Error("Die Bestenliste hat ein ungültiges Format.");
      renderEntries(listElements.fewest, Array.isArray(result.fewest) ? result.fewest : [], "fewest");
      renderEntries(listElements.most, Array.isArray(result.most) ? result.most : [], "most");
      renderEntries(listElements.kd, Array.isArray(result.kd) ? result.kd : [], "kd");
      setLeaderboardStatus(`Gemeinsam online · Aktualisiert um ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      setLeaderboardStatus(`Bestenliste konnte nicht geladen werden: ${error.message}`);
    }
  }

  async function refreshProfile() {
    const profile = await rpc("get_my_profile");
    if (profile && typeof profile === "object") {
      remoteProfile = profile;
      if (!state.nickname && typeof profile.nickname === "string") {
        state.nickname = profile.nickname;
        saveState();
      }
      renderProfile();
    }
  }

  async function syncPendingGames() {
    if (!state.nickname || !configuredUrl()) return;
    if (!syncPromise) {
      syncPromise = (async () => {
        while (true) {
          const nickname = state.nickname;
          await rpc("set_nickname", { p_nickname: nickname });
          while (state.pendingGames.length) {
            const game = state.pendingGames[0];
            await rpc("record_game", {
              p_game_id: game.id,
              p_solved: game.solved,
              p_attempts: game.attempts
            });
            state.pendingGames.shift();
            saveState();
          }
          await refreshProfile();
          if (nickname === state.nickname && state.pendingGames.length === 0) break;
        }
      })().finally(() => {
        syncPromise = null;
      });
    }
    return syncPromise;
  }

  async function saveNickname(nickname) {
    const cleaned = nickname.trim();
    if (!/^[A-Za-z0-9_.-]{2,16}$/u.test(cleaned)) {
      throw new Error("Nutze 2–16 Buchstaben, Zahlen, Punkte, Bindestriche oder Unterstriche.");
    }
    const previousNickname = state.nickname;
    state.nickname = cleaned;
    saveState();
    renderProfile();
    try {
      await syncPendingGames();
    } catch (error) {
      if (error.message.includes("wird bereits verwendet")) {
        state.nickname = previousNickname;
        saveState();
        renderProfile();
        throw error;
      }
      setSyncStatus(`Lokal gespeichert; Online-Synchronisierung fehlgeschlagen: ${error.message}`);
    }
  }

  function addCompletedGame({ solved, attempts }) {
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > GAME_ROWS) {
      throw new Error("Die Anzahl der Spielversuche ist ungültig.");
    }
    const points = solved ? 100 + (GAME_ROWS - attempts) * 10 : 0;
    const id = makeGameId();
    state.gamesPlayed += 1;
    state.attempts += attempts;
    if (solved) state.solved += 1;
    state.points += points;
    state.pendingGames.push({ id, solved, attempts });
    saveState();
    remoteProfile = null;
    renderProfile();
    void syncPendingGames().catch((error) => setSyncStatus(`Ergebnis lokal gespeichert; Online-Synchronisierung fehlgeschlagen: ${error.message}`));
    return points;
  }

  function makeGameId() {
    if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (typeof globalThis.crypto?.getRandomValues === "function") {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  nicknameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSavingNickname) return;
    if (!nicknameForm.reportValidity()) return;
    isSavingNickname = true;
    nicknameError.textContent = "";
    const button = nicknameForm.querySelector("[type='submit']");
    button.disabled = true;
    try {
      await saveNickname(nicknameInput.value);
      nicknameDialog.close();
    } catch (error) {
      nicknameError.textContent = error.message;
    } finally {
      isSavingNickname = false;
      button.disabled = false;
    }
  });

  function closeNicknameIfAllowed() {
    if (state?.nickname) nicknameDialog.close();
    else nicknameError.textContent = "Bitte gib zuerst einen Spitznamen ein.";
  }
  cancelNickname.addEventListener("click", closeNicknameIfAllowed);
  closeNickname.addEventListener("click", closeNicknameIfAllowed);
  nicknameDialog.addEventListener("cancel", (event) => {
    if (!state?.nickname) {
      event.preventDefault();
      nicknameError.textContent = "Bitte gib zuerst einen Spitznamen ein.";
    }
  });

  document.querySelector("#profile-button").addEventListener("click", () => openNicknameDialog());
  document.querySelector("#edit-nickname").addEventListener("click", () => {
    leaderboardDialog.close();
    openNicknameDialog();
  });
  document.querySelector("#leaderboard-button").addEventListener("click", () => {
    leaderboardDialog.showModal();
    void refreshLeaderboards();
    if (refreshTimer) window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(() => {
      if (leaderboardDialog.open) void refreshLeaderboards();
    }, 30_000);
  });
  document.querySelector("#close-leaderboard").addEventListener("click", () => leaderboardDialog.close());
  document.querySelector("#refresh-leaderboards").addEventListener("click", () => void refreshLeaderboards());
  leaderboardDialog.addEventListener("close", () => {
    if (refreshTimer) window.clearInterval(refreshTimer);
    refreshTimer = null;
  });
  leaderboardDialog.addEventListener("click", (event) => {
    if (event.target === leaderboardDialog) leaderboardDialog.close();
  });
  window.addEventListener("online", () => {
    void syncPendingGames().catch((error) => setSyncStatus(`Online-Synchronisierung fehlgeschlagen: ${error.message}`));
  });

  let initializationError = null;
  try {
    state = loadState();
    renderProfile();
  } catch (error) {
    initializationError = error;
    state = emptyState();
    setSyncStatus(error.message);
    console.error("Lokales Spielerprofil konnte nicht geladen werden:", error);
  }

  window.WortleLeaderboard = {
    addCompletedGame,
    async initialize() {
      if (initializationError) return;
      try {
        if (!configuredUrl()) {
          renderProfile();
          if (!state.nickname) openNicknameDialog(true);
          return;
        }
        await refreshProfile();
        if (!state.nickname) openNicknameDialog(true);
        else await syncPendingGames();
      } catch (error) {
        setSyncStatus(`Online-Profil nicht erreichbar: ${error.message}`);
        if (!state.nickname) openNicknameDialog(true);
      }
    }
  };
})();
