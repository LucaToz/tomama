"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { DEFAULT_COPY, mergeCopy } from "@/lib/copy";
import { createEmptySong, getSongPhotos, MAX_EXTRA_PHOTOS } from "@/lib/songs";
import { Lock, LogOut, Save, Music, Image as ImageIcon, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import styles from "./page.module.css";

export default function AdminPortal() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  
  const [vaultCode, setVaultCode] = useState("");
  const [copy, setCopy] = useState({ ...DEFAULT_COPY });
  const [songs, setSongs] = useState([]);
  const [activeSongId, setActiveSongId] = useState(null); // per espandere una canzone alla volta
  const [uploading, setUploading] = useState({ songId: null, field: null });
  const [saveStatus, setSaveStatus] = useState({ success: null, message: "" });

  // Controlla se la sessione admin è già attiva
  useEffect(() => {
    fetch("/api/admin/check")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthenticated(true);
          loadConfig();
        } else {
          setLoadingCheck(false);
        }
      })
      .catch(() => {
        setLoadingCheck(false);
      });
  }, []);

  const loadConfig = () => {
    fetch("/api/config", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setVaultCode(data.vaultCode || "");
        setCopy(mergeCopy(data.copy));
        setSongs(data.songs || []);
        setLoadingCheck(false);
      })
      .catch(() => {
        setLoadingCheck(false);
      });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        loadConfig();
      } else {
        setLoginError(data.error || "Password non corretta");
      }
    } catch (err) {
      setLoginError("Errore durante la connessione al server");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setSongs([]);
    setVaultCode("");
    setCopy({ ...DEFAULT_COPY });
  };

  const updateCopyField = (key, value) => {
    setCopy((prev) => ({ ...prev, [key]: value }));
  };

  const updateSongField = (id, field, value) => {
    setSongs((prevSongs) =>
      prevSongs.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const updateSongPhotoAt = (id, index, value) => {
    setSongs((prevSongs) =>
      prevSongs.map((s) => {
        if (s.id !== id) return s;
        const slots = Array.from({ length: MAX_EXTRA_PHOTOS }, (_, i) => getSongPhotos(s)[i] || "");
        slots[index] = value || "";
        const { photo2, ...rest } = s;
        return { ...rest, photos: slots.filter(Boolean) };
      })
    );
  };

  const addSong = () => {
    const nextId = songs.reduce((max, s) => Math.max(max, s.id), 0) + 1;
    const newSong = createEmptySong(nextId);
    setSongs((prev) => [...prev, newSong]);
    setActiveSongId(nextId);
  };

  const deleteSong = (id) => {
    if (!window.confirm("Eliminare questo pezzo?")) return;
    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (activeSongId === id) setActiveSongId(null);
  };

  const moveSong = (index, direction) => {
    setSongs((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const handleFileUpload = async (songId, field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ songId, field });

    try {
      let url;

      const modeRes = await fetch("/api/upload");
      const { blobEnabled } = await modeRes.json();

      if (blobEnabled) {
        const pathname = `uploads/${Date.now()}-${sanitizeFileName(file.name)}`;
        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          multipart: file.size > 4.5 * 1024 * 1024,
          ...(file.type ? { contentType: file.type } : {}),
        });
        url = blob.url;
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Errore di caricamento");
        }
        url = data.url;
      }

      if (url) {
        if (field.startsWith("photos.")) {
          const index = Number(field.split(".")[1]);
          updateSongPhotoAt(songId, index, url);
        } else {
          updateSongField(songId, field, url);
        }
      } else {
        alert("Errore di caricamento: risposta senza URL");
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("client token")
          ? "Upload fallito: sessione scaduta o Blob non configurato. Riprova il login."
          : err.message;
      alert(`Errore durante l'upload: ${message}`);
    } finally {
      setUploading({ songId: null, field: null });
      e.target.value = "";
    }
  };

  const handleSaveConfig = async () => {
    setLoadingSave(true);
    setSaveStatus({ success: null, message: "" });
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaultCode, copy, songs }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ success: true, message: "Configurazione salvata con successo!" });
        setTimeout(() => setSaveStatus({ success: null, message: "" }), 3000);
      } else {
        setSaveStatus({ success: false, message: `Errore nel salvataggio: ${data.error}` });
      }
    } catch (err) {
      setSaveStatus({ success: false, message: `Errore di connessione: ${err.message}` });
    } finally {
      setLoadingSave(false);
    }
  };

  if (loadingCheck) {
    return (
      <div className={styles.adminLoading}>
        <div className={styles.spinner} />
        <p>verifica autorizzazione...</p>
      </div>
    );
  }

  // Schermata di Login
  if (!authenticated) {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <Lock size={32} className={styles.lockIcon} />
            <h1>Tomama Diario Admin</h1>
            <p>Accesso riservato. Inserisci la password.</p>
          </div>
          
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <input
              type="password"
              placeholder="PASSWORD DI ACCESSO"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.passwordInput}
              autoFocus
            />
            {loginError && <p className={styles.loginError}>{loginError}</p>}
            <button type="submit" className={styles.loginBtn}>
              Accedi
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Principale
  return (
    <div className={styles.adminLayout}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Tomama</h1>
          <span>Control Panel</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Esci">
          <LogOut size={16} /> Esci
        </button>
      </header>

      <main className={styles.mainContent}>
        {/* Sezione Cassaforte */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Cassaforte</h2>
            <p>Imposta il codice necessario per sbloccare il diario dal frontend.</p>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.inputGroup}>
              <label htmlFor="vaultCode">Codice di Sblocco</label>
              <input
                id="vaultCode"
                type="text"
                value={vaultCode}
                onChange={(e) => setVaultCode(e.target.value.toUpperCase())}
                placeholder="TOMAMA"
                className={styles.vaultCodeInput}
              />
              <span className={styles.helpText}>Il codice verrà automaticamente convertito in maiuscolo.</span>
            </div>
          </div>
        </section>

        {/* Testi interfaccia */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Testi dell&apos;app</h2>
            <p>Schermata di sblocco, header del diario e sezione finale.</p>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.copyBlock}>
              <h3 className={styles.copyBlockTitle}>Schermata sblocco</h3>
              <div className={styles.copyGrid}>
                <div className={styles.inputGroup}>
                  <label>Titolo principale</label>
                  <input
                    type="text"
                    value={copy.vaultEyebrow}
                    onChange={(e) => updateCopyField("vaultEyebrow", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Sottotitolo</label>
                  <input
                    type="text"
                    value={copy.vaultSub}
                    onChange={(e) => updateCopyField("vaultSub", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Placeholder codice</label>
                  <input
                    type="text"
                    value={copy.vaultPlaceholder}
                    onChange={(e) => updateCopyField("vaultPlaceholder", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Pulsante</label>
                  <input
                    type="text"
                    value={copy.vaultButton}
                    onChange={(e) => updateCopyField("vaultButton", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Messaggio errore</label>
                  <input
                    type="text"
                    value={copy.vaultError}
                    onChange={(e) => updateCopyField("vaultError", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3 className={styles.copyBlockTitle}>Header diario</h3>
              <div className={styles.copyGrid}>
                <div className={styles.inputGroup}>
                  <label>Timbro</label>
                  <input
                    type="text"
                    value={copy.diaryStamp}
                    onChange={(e) => updateCopyField("diaryStamp", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Nome band</label>
                  <input
                    type="text"
                    value={copy.diaryBand}
                    onChange={(e) => updateCopyField("diaryBand", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Sottotitolo</label>
                  <input
                    type="text"
                    value={copy.diarySub}
                    onChange={(e) => updateCopyField("diarySub", e.target.value)}
                  />
                  <span className={styles.helpText}>Usa {"{count}"} per il numero di pezzi.</span>
                </div>
              </div>
            </div>

            <div className={styles.copyBlock}>
              <h3 className={styles.copyBlockTitle}>Fine diario</h3>
              <div className={styles.copyGrid}>
                <div className={styles.inputGroup}>
                  <label>Titolo sezione player</label>
                  <input
                    type="text"
                    value={copy.playlistTitle}
                    onChange={(e) => updateCopyField("playlistTitle", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Nota footer</label>
                  <input
                    type="text"
                    value={copy.diaryFooter}
                    onChange={(e) => updateCopyField("diaryFooter", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Testo caricamento</label>
                  <input
                    type="text"
                    value={copy.loadingText}
                    onChange={(e) => updateCopyField("loadingText", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sezione Canzoni */}
        <section className={styles.songsSection}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeader}>
              <h2>I Pezzi ({songs.length})</h2>
              <p>Aggiungi, elimina, riordina e modifica ogni traccia.</p>
            </div>
            <button type="button" onClick={addSong} className={styles.addSongBtn}>
              <Plus size={16} /> Aggiungi pezzo
            </button>
          </div>

          <div className={styles.songsList}>
            {songs.map((song, index) => {
              const isExpanded = activeSongId === song.id;
              return (
                <div key={song.id} className={`${styles.songCard} ${isExpanded ? styles.expanded : ""}`}>
                  <div
                    onClick={() => setActiveSongId(isExpanded ? null : song.id)}
                    className={styles.songCardHeader}
                  >
                    <div className={styles.songTitleArea}>
                      <span className={styles.songIndex}>#{String(index + 1).padStart(2, "0")}</span>
                      <h3>{song.title || `Traccia ${song.id} (Senza titolo)`}</h3>
                    </div>
                    <div className={styles.songHeaderIcons}>
                      <div className={styles.songActions} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveSong(index, -1)}
                          disabled={index === 0}
                          title="Sposta su"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => moveSong(index, 1)}
                          disabled={index === songs.length - 1}
                          title="Sposta giù"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => deleteSong(song.id)}
                          title="Elimina pezzo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {song.audioSrc ? <Music size={14} className={styles.indicatorActive} /> : <Music size={14} className={styles.indicatorInactive} />}
                      {song.photo || getSongPhotos(song).length > 0 ? (
                        <ImageIcon size={14} className={styles.indicatorActive} />
                      ) : (
                        <ImageIcon size={14} className={styles.indicatorInactive} />
                      )}
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Dettaglio Campi Modificabili */}
                  {isExpanded && (
                    <div className={styles.songCardBody}>
                      <div className={styles.row}>
                        <div className={styles.inputGroup}>
                          <label>Titolo Brano</label>
                          <input
                            type="text"
                            value={song.title || ""}
                            onChange={(e) => updateSongField(song.id, "title", e.target.value)}
                            placeholder="Titolo del pezzo"
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label>Durata (es. "2:41")</label>
                          <input
                            type="text"
                            value={song.duration || ""}
                            onChange={(e) => updateSongField(song.id, "duration", e.target.value)}
                            placeholder="Durata"
                          />
                        </div>
                      </div>

                      {/* Cover Photo */}
                      <div className={styles.fileFieldRow}>
                        <div className={styles.inputGroup}>
                          <label>Foto Copertina (Polaroid 1)</label>
                          <div className={styles.fileInputWrapper}>
                            <input
                              type="text"
                              value={song.photo || ""}
                              onChange={(e) => updateSongField(song.id, "photo", e.target.value)}
                              placeholder="/songs/song1.jpg o URL"
                              className={styles.urlInput}
                            />
                            <label className={styles.uploadBtnLabel}>
                              Scegli File
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(song.id, "photo", e)}
                                className={styles.hiddenFileInput}
                              />
                            </label>
                          </div>
                          {uploading.songId === song.id && uploading.field === "photo" && (
                            <p className={styles.uploadingText}>Caricamento in corso...</p>
                          )}
                        </div>
                        {song.photo && (
                          <div className={styles.previewContainer}>
                            <img src={song.photo} alt="Preview cover" className={styles.thumbnail} />
                          </div>
                        )}
                      </div>

                      {/* Foto extra (fino a 3) */}
                      <div className={styles.extraPhotosBlock}>
                        <p className={styles.extraPhotosLabel}>
                          Foto extra (max {MAX_EXTRA_PHOTOS}) — compaiono impilate nel diario
                        </p>
                        {Array.from({ length: MAX_EXTRA_PHOTOS }, (_, photoIndex) => {
                          const photoValue = getSongPhotos(song)[photoIndex] || "";
                          const fieldKey = `photos.${photoIndex}`;
                          return (
                            <div key={fieldKey} className={styles.fileFieldRow}>
                              <div className={styles.inputGroup}>
                                <label>Foto extra {photoIndex + 1}</label>
                                <div className={styles.fileInputWrapper}>
                                  <input
                                    type="text"
                                    value={photoValue}
                                    onChange={(e) => updateSongPhotoAt(song.id, photoIndex, e.target.value)}
                                    placeholder="/uploads/foto.jpg o URL"
                                    className={styles.urlInput}
                                  />
                                  <label className={styles.uploadBtnLabel}>
                                    Scegli File
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleFileUpload(song.id, fieldKey, e)}
                                      className={styles.hiddenFileInput}
                                    />
                                  </label>
                                </div>
                                {uploading.songId === song.id && uploading.field === fieldKey && (
                                  <p className={styles.uploadingText}>Caricamento in corso...</p>
                                )}
                              </div>
                              {photoValue ? (
                                <div className={styles.previewContainer}>
                                  <img src={photoValue} alt={`Preview foto ${photoIndex + 1}`} className={styles.thumbnail} />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {/* Audio File */}
                      <div className={styles.fileFieldRow}>
                        <div className={styles.inputGroup}>
                          <label>File Audio (WAV/MP3)</label>
                          <div className={styles.fileInputWrapper}>
                            <input
                              type="text"
                              value={song.audioSrc || ""}
                              onChange={(e) => updateSongField(song.id, "audioSrc", e.target.value)}
                              placeholder="URL sorgente audio"
                              className={styles.urlInput}
                            />
                            <label className={styles.uploadBtnLabel}>
                              Scegli File
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileUpload(song.id, "audioSrc", e)}
                                className={styles.hiddenFileInput}
                              />
                            </label>
                          </div>
                          {uploading.songId === song.id && uploading.field === "audioSrc" && (
                            <p className={styles.uploadingText}>Caricamento in corso...</p>
                          )}
                        </div>
                        {song.audioSrc && (
                          <div className={styles.previewAudioContainer}>
                            <audio controls src={song.audioSrc} className={styles.audioPreviewPlayer} />
                          </div>
                        )}
                      </div>

                      {/* Punchline */}
                      <div className={styles.inputGroup}>
                        <label>Testo Punchline (Frase a macchina da scrivere)</label>
                        <input
                          type="text"
                          value={song.punchline || ""}
                          onChange={(e) => updateSongField(song.id, "punchline", e.target.value)}
                          placeholder="es. lavorare tanto, sognare il giusto"
                        />
                      </div>

                      {/* Lyrics */}
                      <div className={styles.inputGroup}>
                        <label>Testo Completo (Lyrics)</label>
                        <textarea
                          rows={6}
                          value={song.lyrics || ""}
                          onChange={(e) => updateSongField(song.id, "lyrics", e.target.value)}
                          placeholder="Incolla qui il testo completo. Usa l'invio per andare a capo."
                          className={styles.lyricsTextarea}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Controllo di Salvataggio Persistente in Basso */}
      <footer className={styles.actionFooter}>
        <div className={styles.footerInner}>
          {saveStatus.success === true && (
            <div className={`${styles.statusAlert} ${styles.success}`}>
              <CheckCircle size={18} />
              <span>{saveStatus.message}</span>
            </div>
          )}
          {saveStatus.success === false && (
            <div className={`${styles.statusAlert} ${styles.error}`}>
              <AlertCircle size={18} />
              <span>{saveStatus.message}</span>
            </div>
          )}
          {saveStatus.success === null && (
            <span className={styles.unsavedChangesText}>Ci sono modifiche non salvate? Clicca per applicare.</span>
          )}

          <button
            onClick={handleSaveConfig}
            disabled={loadingSave}
            className={styles.saveBtn}
          >
            {loadingSave ? (
              <>
                <div className={styles.btnSpinner} /> Salvataggio...
              </>
            ) : (
              <>
                <Save size={16} /> Salva Modifiche
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
