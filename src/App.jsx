import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "personal_bingo_react_v1";

const THEMES = {
  midnight: {
    name: "Midnight",
    vars: {
      "--bg": "#10131a",
      "--bg-2": "#151b25",
      "--panel": "#1b2330",
      "--panel-2": "#253042",
      "--text": "#eef3ff",
      "--muted": "#a8b5cb",
      "--accent": "#7aa2ff",
      "--accent-2": "#a6c0ff",
      "--done": "#4ac27a",
      "--danger": "#e06767",
    },
  },
  rose: {
    name: "Rose",
    vars: {
      "--bg": "#1d1217",
      "--bg-2": "#281821",
      "--panel": "#33202c",
      "--panel-2": "#432b39",
      "--text": "#fff0f5",
      "--muted": "#d7b6c3",
      "--accent": "#ff8eb2",
      "--accent-2": "#ffc0d3",
      "--done": "#62d59c",
      "--danger": "#ff6b7d",
    },
  },
  mint: {
    name: "Mint",
    vars: {
      "--bg": "#101815",
      "--bg-2": "#16201c",
      "--panel": "#1f2c27",
      "--panel-2": "#2a3a34",
      "--text": "#edfff8",
      "--muted": "#b1d2c5",
      "--accent": "#74e8bc",
      "--accent-2": "#b7ffe1",
      "--done": "#4ed884",
      "--danger": "#e87676",
    },
  },
  peach: {
    name: "Peach",
    vars: {
      "--bg": "#1d1512",
      "--bg-2": "#261b18",
      "--panel": "#32231f",
      "--panel-2": "#43302a",
      "--text": "#fff4ef",
      "--muted": "#ddc0b2",
      "--accent": "#ffb088",
      "--accent-2": "#ffd2bd",
      "--done": "#6bcb84",
      "--danger": "#ef7272",
    },
  },
  gold: {
    name: "Gold",
    vars: {
      "--bg": "#18150d",
      "--bg-2": "#211c10",
      "--panel": "#2d2716",
      "--panel-2": "#3b341d",
      "--text": "#fff8df",
      "--muted": "#d9cda0",
      "--accent": "#f2cd68",
      "--accent-2": "#ffe8a7",
      "--done": "#7ccd70",
      "--danger": "#ee7a67",
    },
  },
  lavender: {
    name: "Lavender",
    vars: {
      "--bg": "#16131d",
      "--bg-2": "#1d1827",
      "--panel": "#282138",
      "--panel-2": "#342b49",
      "--text": "#f5efff",
      "--muted": "#c7badf",
      "--accent": "#b493ff",
      "--accent-2": "#d8c2ff",
      "--done": "#74d59f",
      "--danger": "#ef7f98",
    },
  },
  earth: {
    name: "Earth",
    vars: {
      "--bg": "#161410",
      "--bg-2": "#1f1b15",
      "--panel": "#2b261d",
      "--panel-2": "#383127",
      "--text": "#f5efe3",
      "--muted": "#c2b59f",
      "--accent": "#c79a63",
      "--accent-2": "#e4c39d",
      "--done": "#77bb6d",
      "--danger": "#d97364",
    },
  },
};

const sampleItems = [
  "Late to something",
  "Spills a drink",
  "Says “literally”",
  "Mentions old drama",
  "Unexpected coincidence",
  "Someone starts singing",
  "Phone battery crisis",
  "Brings up an inside joke",
  "Changes the plan",
  "Random nostalgia dump",
  "",
  "Awkward silence",
  "Forgets what they were saying",
  "Bad pun lands anyway",
  "Talks about work",
  "Mentions the weather",
  "Free food appears",
  "Overexplains something",
  "Says “that’s crazy”",
  "Someone loses something",
  "Brings up a trip",
  "Unexpected compliment",
  "Someone says “fair enough”",
  "Old memory resurfaces",
  "Plans that never happen",
];

function createEmptyBoard() {
  return {
    title: "Personal Bingo",
    theme: "midnight",
    cells: Array.from({ length: 25 }, (_, index) => ({
      id: `cell-${index}`,
      index,
      text: "",
      done: false,
      free: false,
    })),
  };
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createShareTemplate(board) {
  return {
    title: board.title,
    theme: board.theme,
    cells: board.cells.map((cell, index) => ({
      id: `cell-${index}`,
      index,
      text: cell.text,
      free: !!cell.free,
      done: false,
    })),
  };
}

function encodeSharePayload(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeSharePayload(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function sanitizeBoard(raw) {
  const base = createEmptyBoard();

  if (!raw || typeof raw !== "object") return base;

  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim().slice(0, 80)
      : base.title;

  const theme = THEMES[raw.theme] ? raw.theme : base.theme;

  let cells = Array.isArray(raw.cells) ? raw.cells.slice(0, 25) : base.cells;

  if (cells.length < 25) {
    while (cells.length < 25) {
      cells.push({
        id: `cell-${cells.length}`,
        index: cells.length,
        text: "",
        done: false,
        free: false,
      });
    }
  }

  cells = cells.map((cell, index) => ({
    id: typeof cell?.id === "string" ? cell.id : `cell-${index}`,
    index,
    text: typeof cell?.text === "string" ? cell.text.slice(0, 250) : "",
    done: !!cell?.done,
    free: !!cell?.free,
  }));

  return { title, theme, cells };
}

function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyBoard();
    return sanitizeBoard(JSON.parse(raw));
  } catch {
    return createEmptyBoard();
  }
}

function CellModal({
  open,
  cell,
  cellIndex,
  onClose,
  onSave,
  onClear,
  onToggleDone,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open && cell) {
      setValue(cell.text || "");
    }
  }, [open, cell]);

  if (!open || !cell) return null;

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div
        className="modal modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Edit Square {cellIndex + 1}</h2>
        <p>Edit the text, or mark this square as complete.</p>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write something for this square..."
          autoFocus
        />

        <div className="modal-actions">
          <button onClick={onToggleDone}>
            {cell.done ? "Mark Undone" : "Mark Done"}
          </button>
          <button
            className="primary"
            onClick={() => onSave(value.trim())}
          >
            Save
          </button>
        </div>

        <div className="modal-actions-3">
          <button onClick={onClear}>Clear</button>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function RenameModal({ open, title, onClose, onSave }) {
  const [value, setValue] = useState(title ?? "");

  useEffect(() => {
    if (open) setValue(title ?? "");
  }, [open, title]);

  if (!open) return null;

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal modal-pop" onClick={(e) => e.stopPropagation()}>
        <h2>Rename Board</h2>
        <p>Give your bingo board a custom title.</p>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={80}
          placeholder="Board title"
          autoFocus
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            onClick={() => onSave(value.trim() || "Personal Bingo")}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ open, onClose, onImport }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal modal-pop" onClick={(e) => e.stopPropagation()}>
        <h2>Import Board</h2>
        <p>Paste exported board JSON here. It will replace your current board.</p>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Paste board JSON here...'
          autoFocus
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => onImport(value)}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  return <div className={`toast ${message ? "show" : ""}`}>{message}</div>;
}

function CellButton({ cell, index, onClick, onLongPress }) {
  const timerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);

  const startPress = () => {
    longPressTriggeredRef.current = false;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress(index);
    }, 450);
  };

  const endPress = () => {
    clearTimeout(timerRef.current);
  };

  const handleClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onClick(index);
  };

  return (
    <button
      className={[
        "cell",
        !cell.text.trim() ? "empty" : "",
        cell.done ? "done" : "",
        cell.free ? "free" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onClick={handleClick}
    >
      <span className="cell-content">{cell.text.trim() || "Tap to edit"}</span>
    </button>
  );
}

export default function App() {
  const [board, setBoard] = useState(() => loadBoard());
  const [activeCellIndex, setActiveCellIndex] = useState(null);
  const [showRename, setShowRename] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [toast, setToast] = useState("");

  const toastTimerRef = useRef(null);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("board");

    if (!shared) return;

    try {
      const decoded = decodeSharePayload(shared);
      const clean = sanitizeBoard(decoded);

      setBoard((prev) => {
        // Only auto-load shared board if current board is still basically empty
        const hasMeaningfulContent = prev.cells.some(
          (cell) => cell.text.trim() || cell.done || cell.free
        );

        return hasMeaningfulContent ? prev : clean;
      });

      showToast("Shared board loaded");
    } catch {
      showToast("Couldn’t load shared board");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  useEffect(() => {
    const theme = THEMES[board.theme] || THEMES.midnight;
    Object.entries(theme.vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [board.theme]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setActiveCellIndex(null);
        setShowRename(false);
        setShowImport(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const activeCell =
    activeCellIndex !== null ? board.cells[activeCellIndex] : null;

  const completedCount = useMemo(
    () => board.cells.filter((cell) => cell.done).length,
    [board.cells]
  );

  function shuffleBoard() {
    setBoard((prev) => {
      const cells = [...prev.cells];

      const centerIndex = 12;
      const centerCell = cells[centerIndex];

      // Preserve free center if present
      if (centerCell.free) {
        const otherCells = cells.filter((_, i) => i !== centerIndex);
        const shuffled = shuffleArray(otherCells);

        const nextCells = [];
        let pointer = 0;

        for (let i = 0; i < 25; i++) {
          if (i === centerIndex) {
            nextCells.push({ ...centerCell, index: i, id: `cell-${i}` });
          } else {
            nextCells.push({
              ...shuffled[pointer],
              index: i,
              id: `cell-${i}`,
            });
            pointer++;
          }
        }

        return { ...prev, cells: nextCells };
      }

      const shuffled = shuffleArray(cells).map((cell, i) => ({
        ...cell,
        index: i,
        id: `cell-${i}`,
      }));

      return { ...prev, cells: shuffled };
    });

    showToast("Board shuffled");
  }

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 1800);
  }

  function updateCell(index, updater) {
    setBoard((prev) => ({
      ...prev,
      cells: prev.cells.map((cell, i) =>
        i === index ? { ...cell, ...updater(cell) } : cell
      ),
    }));
  }

  function openCellModal(index) {
    setActiveCellIndex(index);
  }

  function toggleDone(index) {
    updateCell(index, (cell) => ({ done: !cell.done }));
    const nextDone = !board.cells[index].done;
    showToast(nextDone ? "Marked done" : "Marked undone");
  }

  function saveActiveCell(nextText) {
    if (activeCellIndex === null) return;
    updateCell(activeCellIndex, () => ({ text: nextText }));
    setActiveCellIndex(null);
    showToast("Square saved");
  }

  function clearActiveCell() {
    if (activeCellIndex === null) return;

    const cell = board.cells[activeCellIndex];
    updateCell(activeCellIndex, () => ({
      text: cell.free ? "FREE SPACE" : "",
      done: cell.free ? true : false,
    }));
    setActiveCellIndex(null);
    showToast("Square cleared");
  }

  function toggleDoneActiveCell() {
    if (activeCellIndex === null) return;
    toggleDone(activeCellIndex);
  }

  function handleRename(nextTitle) {
    setBoard((prev) => ({ ...prev, title: nextTitle }));
    setShowRename(false);
    showToast("Board renamed");
  }

  function fillSample() {
    setBoard((prev) => ({
      ...prev,
      cells: prev.cells.map((cell, i) => ({
        ...cell,
        text: sampleItems[i] || "",
        done: false,
        free: false,
      })),
    }));
    showToast("Sample board filled");
  }

  function toggleFreeCenter() {
    setBoard((prev) => {
      const cells = [...prev.cells];
      const center = cells[12];

      cells[12] = center.free
        ? { ...center, free: false, text: "", done: false }
        : { ...center, free: true, text: "FREE SPACE", done: true };

      return { ...prev, cells };
    });

    showToast(
      board.cells[12].free ? "Free center removed" : "Free center enabled"
    );
  }

  function clearChecks() {
    setBoard((prev) => ({
      ...prev,
      cells: prev.cells.map((cell) => ({
        ...cell,
        done: cell.free ? true : false,
      })),
    }));
    showToast("Checks cleared");
  }

  function resetBoard() {
    if (!window.confirm("Reset the entire board?")) return;
    setBoard(createEmptyBoard());
    setActiveCellIndex(null);
    showToast("Board reset");
  }

  function exportBoardData() {
    return JSON.stringify(board, null, 2);
  }

  async function copyBoardJson() {
    try {
      await navigator.clipboard.writeText(exportBoardData());
      showToast("Board JSON copied");
    } catch {
      showToast("Clipboard failed");
    }
  }

  async function exportBoard() {
    const json = exportBoardData();
    const blob = new Blob([json], { type: "application/json" });
    const safeName =
      (board.title || "bingo-board").replace(/[^\w\- ]+/g, "").trim() ||
      "bingo-board";
    const filename = `${safeName}.json`;

    const file = new File([blob], filename, { type: "application/json" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: board.title,
          text: "Here’s my bingo board.",
          files: [file],
        });
        showToast("Board shared");
        return;
      } catch {
        // fall through to download
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Board exported");
  }

  async function shareUniversalBoard() {
    try {
      const template = createShareTemplate(board);
      const encoded = encodeSharePayload(template);
      const url = `${window.location.origin}${window.location.pathname}?board=${encodeURIComponent(encoded)}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: template.title || "Shared Bingo Board",
            text: "Here’s a bingo board template for you.",
            url,
          });
          showToast("Board link shared");
          return;
        } catch {
          // fall through to clipboard
        }
      }

      await navigator.clipboard.writeText(url);
      showToast("Share link copied");
    } catch {
      showToast("Couldn’t create share link");
    }
  }

  async function shareBoardText() {
    const json = exportBoardData();

    if (navigator.share) {
      try {
        await navigator.share({
          title: board.title,
          text: json,
        });
        showToast("Board shared");
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(json);
      showToast("Board JSON copied");
    } catch {
      showToast("Couldn’t share board");
    }
  }

  function importBoardFromText(text) {
    if (!text.trim()) {
      showToast("Paste JSON first");
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const clean = sanitizeBoard(parsed);
      setBoard(clean);
      setShowImport(false);
      setActiveCellIndex(null);
      showToast("Board imported");
    } catch {
      showToast("Invalid board JSON");
    }
  }

  return (
    <>
      <div className="app">
        <div className="header card">
          <div className="title-wrap">
            <div className="title-main">
              <h1>{board.title}</h1>
              <div className="subtitle">
                Tap a square to edit it. Long-press to mark done or undone.
              </div>
            </div>
            <button className="soft" onClick={() => setShowRename(true)}>
              Rename
            </button>
          </div>

          <div className="pill-row">
            <div className="stat-pill">{completedCount} / 25 complete</div>
            <div className="stat-pill">
              Theme: {THEMES[board.theme]?.name ?? "Midnight"}
            </div>

            <select
              className="theme-select"
              value={board.theme}
              onChange={(e) =>
                setBoard((prev) => ({ ...prev, theme: e.target.value }))
              }
              aria-label="Theme picker"
            >
              {Object.entries(THEMES).map(([key, theme]) => (
                <option key={key} value={key}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>

          <div className="controls">
            <button onClick={toggleFreeCenter}>Toggle Free Center</button>
            <button onClick={clearChecks}>Clear Checks</button>
            <button className="primary" onClick={exportBoard}>
              Export Board
            </button>
            <button onClick={() => setShowImport(true)}>Import Board</button>
            <button onClick={fillSample}>Fill Sample</button>
            <button onClick={shuffleBoard}>Shuffle Board</button>
            <button className="primary" onClick={shareUniversalBoard}>
              Share Universal Board
            </button>
            <button onClick={copyBoardJson}>Copy Board JSON</button>
            <button onClick={shareBoardText}>Share Board</button>
            <button className="danger" onClick={resetBoard}>
              Reset Board
            </button>
          </div>
        </div>

        <div className="grid-shell card">
          <div className="grid">
            {board.cells.map((cell, index) => (
              <CellButton
                key={cell.id}
                cell={cell}
                index={index}
                onClick={openCellModal}
                onLongPress={toggleDone}
              />
            ))}
          </div>

          <div className="hint">
            Tip: long-press any tile for a quick checkoff without opening the
            editor.
          </div>
        </div>
      </div>

      <CellModal
        open={activeCellIndex !== null}
        cell={activeCell}
        cellIndex={activeCellIndex}
        onClose={() => setActiveCellIndex(null)}
        onSave={saveActiveCell}
        onClear={clearActiveCell}
        onToggleDone={toggleDoneActiveCell}
      />

      <RenameModal
        open={showRename}
        title={board.title}
        onClose={() => setShowRename(false)}
        onSave={handleRename}
      />

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={importBoardFromText}
      />

      <Toast message={toast} />
    </>
  );
}