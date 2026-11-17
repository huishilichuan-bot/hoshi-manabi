/* ほしまなび — チェス（エンジン + 画面 + 友だち対戦リンク） */
(() => {
  "use strict";

  const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const FILES = "abcdefgh";

  const colorOf = (p) => (p ? (p < "a" ? "w" : "b") : null);
  const other = (c) => (c === "w" ? "b" : "w");
  const sqName = (sq) => FILES[sq & 7] + (8 - (sq >> 3));
  const nameToSq = (n) => {
    if (!/^[a-h][1-8]$/.test(n)) return -1;
    return (8 - Number(n[1])) * 8 + FILES.indexOf(n[0]);
  };

  class Chess {
    constructor(fen) {
      this.load(fen || START_FEN);
    }

    load(fen) {
      const parts = String(fen).trim().split(/\s+/);
      if (parts.length < 4) throw new Error("bad fen");
      const rows = parts[0].split("/");
      if (rows.length !== 8) throw new Error("bad fen rows");
      const board = new Array(64).fill("");
      rows.forEach((row, r) => {
        let f = 0;
        for (const ch of row) {
          if (/[1-8]/.test(ch)) f += Number(ch);
          else if (/[prnbqkPRNBQK]/.test(ch)) {
            if (f > 7) throw new Error("bad fen row");
            board[r * 8 + f] = ch;
            f += 1;
          } else throw new Error("bad fen char");
        }
        if (f !== 8) throw new Error("bad fen width");
      });
      if (board.filter((p) => p === "K").length !== 1 || board.filter((p) => p === "k").length !== 1) {
        throw new Error("bad kings");
      }
      if (parts[1] !== "w" && parts[1] !== "b") throw new Error("bad turn");
      this.board = board;
      this.turn = parts[1];
      const c = parts[2] || "-";
      this.castling = { K: c.includes("K"), Q: c.includes("Q"), k: c.includes("k"), q: c.includes("q") };
      this.ep = parts[3] && parts[3] !== "-" ? nameToSq(parts[3]) : -1;
      this.half = Number(parts[4] || 0) || 0;
      this.full = Number(parts[5] || 1) || 1;
      this.stack = [];
      this.keys = [this.key()];
      this.kings = { w: board.indexOf("K"), b: board.indexOf("k") };
    }

    key() {
      let s = "";
      for (let i = 0; i < 64; i++) s += this.board[i] || ".";
      return s + this.turn + (this.castling.K ? "K" : "") + (this.castling.Q ? "Q" : "") +
        (this.castling.k ? "k" : "") + (this.castling.q ? "q" : "") + this.ep;
    }

    fen() {
      const rows = [];
      for (let r = 0; r < 8; r++) {
        let row = "";
        let empty = 0;
        for (let f = 0; f < 8; f++) {
          const p = this.board[r * 8 + f];
          if (!p) empty += 1;
          else {
            if (empty) row += empty;
            empty = 0;
            row += p;
          }
        }
        if (empty) row += empty;
        rows.push(row);
      }
      let c = (this.castling.K ? "K" : "") + (this.castling.Q ? "Q" : "") + (this.castling.k ? "k" : "") + (this.castling.q ? "q" : "");
      return `${rows.join("/")} ${this.turn} ${c || "-"} ${this.ep >= 0 ? sqName(this.ep) : "-"} ${this.half} ${this.full}`;
    }

    attacked(sq, by) {
      const b = this.board;
      const r = sq >> 3, f = sq & 7;
      const white = by === "w";
      const pr = white ? r + 1 : r - 1;
      if (pr >= 0 && pr < 8) {
        const pawn = white ? "P" : "p";
        if (f > 0 && b[pr * 8 + f - 1] === pawn) return true;
        if (f < 7 && b[pr * 8 + f + 1] === pawn) return true;
      }
      const kn = white ? "N" : "n";
      for (const [dr, df] of KN) {
        const rr = r + dr, ff = f + df;
        if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === kn) return true;
      }
      const kg = white ? "K" : "k";
      for (const [dr, df] of KG) {
        const rr = r + dr, ff = f + df;
        if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === kg) return true;
      }
      const bq = white ? "B" : "b", rq = white ? "R" : "r", qq = white ? "Q" : "q";
      for (const [dr, df] of DIAG) {
        let rr = r + dr, ff = f + df;
        while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
          const p = b[rr * 8 + ff];
          if (p) {
            if (p === bq || p === qq) return true;
            break;
          }
          rr += dr; ff += df;
        }
      }
      for (const [dr, df] of ORTH) {
        let rr = r + dr, ff = f + df;
        while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
          const p = b[rr * 8 + ff];
          if (p) {
            if (p === rq || p === qq) return true;
            break;
          }
          rr += dr; ff += df;
        }
      }
      return false;
    }

    inCheck(c) {
      c = c || this.turn;
      return this.attacked(this.kings[c], other(c));
    }

    pseudo(capturesOnly) {
      const out = [];
      const b = this.board;
      const us = this.turn;
      const white = us === "w";
      const add = (from, to, p, c, flag, promo) => out.push({ from, to, p, c: c || "", flag: flag || "", promo: promo || "" });
      for (let sq = 0; sq < 64; sq++) {
        const p = b[sq];
        if (!p || colorOf(p) !== us) continue;
        const r = sq >> 3, f = sq & 7;
        const t = p.toLowerCase();
        if (t === "p") {
          const dir = white ? -1 : 1;
          const startRow = white ? 6 : 1;
          const promoRow = white ? 0 : 7;
          const r1 = r + dir;
          if (r1 >= 0 && r1 < 8) {
            const one = r1 * 8 + f;
            if (!b[one]) {
              if (r1 === promoRow) {
                for (const pr of ["q", "r", "b", "n"]) add(sq, one, p, "", "promo", pr);
              } else if (!capturesOnly) {
                add(sq, one, p);
                if (r === startRow) {
                  const two = (r + 2 * dir) * 8 + f;
                  if (!b[two]) add(sq, two, p, "", "double");
                }
              }
            }
            for (const df of [-1, 1]) {
              const ff = f + df;
              if (ff < 0 || ff > 7) continue;
              const to = r1 * 8 + ff;
              const cap = b[to];
              if (cap && colorOf(cap) !== us) {
                if (r1 === promoRow) {
                  for (const pr of ["q", "r", "b", "n"]) add(sq, to, p, cap, "promo", pr);
                } else add(sq, to, p, cap);
              } else if (to === this.ep && !cap) {
                add(sq, to, p, white ? "p" : "P", "ep");
              }
            }
          }
        } else if (t === "n" || t === "k") {
          for (const [dr, df] of t === "n" ? KN : KG) {
            const rr = r + dr, ff = f + df;
            if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
            const to = rr * 8 + ff;
            const cap = b[to];
            if (cap && colorOf(cap) === us) continue;
            if (capturesOnly && !cap) continue;
            add(sq, to, p, cap);
          }
          if (t === "k" && !capturesOnly) {
            const them = other(us);
            if (white && sq === 60) {
              if (this.castling.K && b[63] === "R" && !b[61] && !b[62] &&
                !this.attacked(60, them) && !this.attacked(61, them) && !this.attacked(62, them)) add(60, 62, p, "", "castleK");
              if (this.castling.Q && b[56] === "R" && !b[59] && !b[58] && !b[57] &&
                !this.attacked(60, them) && !this.attacked(59, them) && !this.attacked(58, them)) add(60, 58, p, "", "castleQ");
            } else if (!white && sq === 4) {
              if (this.castling.k && b[7] === "r" && !b[5] && !b[6] &&
                !this.attacked(4, them) && !this.attacked(5, them) && !this.attacked(6, them)) add(4, 6, p, "", "castleK");
              if (this.castling.q && b[0] === "r" && !b[3] && !b[2] && !b[1] &&
                !this.attacked(4, them) && !this.attacked(3, them) && !this.attacked(2, them)) add(4, 2, p, "", "castleQ");
            }
          }
        } else {
          const dirs = t === "b" ? DIAG : t === "r" ? ORTH : DIAG.concat(ORTH);
          for (const [dr, df] of dirs) {
            let rr = r + dr, ff = f + df;
            while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
              const to = rr * 8 + ff;
              const cap = b[to];
              if (cap) {
                if (colorOf(cap) !== us) add(sq, to, p, cap);
                break;
              }
              if (!capturesOnly) add(sq, to, p);
              rr += dr; ff += df;
            }
          }
        }
      }
      return out;
    }

    make(m) {
      const b = this.board;
      const us = this.turn;
      this.stack.push({ m, castling: { ...this.castling }, ep: this.ep, half: this.half, full: this.full, kings: { ...this.kings } });
      b[m.from] = "";
      if (m.flag === "ep") {
        b[us === "w" ? m.to + 8 : m.to - 8] = "";
      }
      let placed = m.p;
      if (m.flag === "promo") placed = us === "w" ? m.promo.toUpperCase() : m.promo;
      b[m.to] = placed;
      if (m.flag === "castleK") {
        if (us === "w") { b[63] = ""; b[61] = "R"; } else { b[7] = ""; b[5] = "r"; }
      } else if (m.flag === "castleQ") {
        if (us === "w") { b[56] = ""; b[59] = "R"; } else { b[0] = ""; b[3] = "r"; }
      }
      if (m.p === "K") { this.castling.K = false; this.castling.Q = false; this.kings.w = m.to; }
      if (m.p === "k") { this.castling.k = false; this.castling.q = false; this.kings.b = m.to; }
      if (m.from === 63 || m.to === 63) this.castling.K = false;
      if (m.from === 56 || m.to === 56) this.castling.Q = false;
      if (m.from === 7 || m.to === 7) this.castling.k = false;
      if (m.from === 0 || m.to === 0) this.castling.q = false;
      this.ep = m.flag === "double" ? (m.from + m.to) >> 1 : -1;
      this.half = m.p === "P" || m.p === "p" || m.c ? 0 : this.half + 1;
      if (us === "b") this.full += 1;
      this.turn = other(us);
      this.keys.push(this.key());
    }

    undo() {
      const s = this.stack.pop();
      if (!s) return null;
      const m = s.m;
      const b = this.board;
      this.turn = colorOf(m.p);
      const us = this.turn;
      b[m.from] = m.p;
      b[m.to] = "";
      if (m.flag === "ep") {
        b[us === "w" ? m.to + 8 : m.to - 8] = m.c;
      } else if (m.c) {
        b[m.to] = m.c;
      }
      if (m.flag === "castleK") {
        if (us === "w") { b[61] = ""; b[63] = "R"; } else { b[5] = ""; b[7] = "r"; }
      } else if (m.flag === "castleQ") {
        if (us === "w") { b[59] = ""; b[56] = "R"; } else { b[3] = ""; b[0] = "r"; }
      }
      this.castling = s.castling;
      this.ep = s.ep;
      this.half = s.half;
      this.full = s.full;
      this.kings = s.kings;
      this.keys.pop();
      return m;
    }

    moves() {
      const us = this.turn;
      const res = [];
      for (const m of this.pseudo(false)) {
        this.make(m);
        if (!this.attacked(this.kings[us], other(us))) res.push(m);
        this.undo();
      }
      return res;
    }

    insufficient() {
      const pieces = this.board.filter((p) => p && p.toLowerCase() !== "k");
      if (!pieces.length) return true;
      if (pieces.length === 1 && /[nbNB]/.test(pieces[0])) return true;
      return false;
    }

    repetition() {
      const k = this.keys[this.keys.length - 1];
      let n = 0;
      for (const x of this.keys) if (x === k) n += 1;
      return n >= 3;
    }

    status() {
      const legal = this.moves();
      if (!legal.length) return this.inCheck() ? "checkmate" : "stalemate";
      if (this.half >= 100) return "draw50";
      if (this.insufficient()) return "insufficient";
      if (this.repetition()) return "repetition";
      return null;
    }
  }

  /* ---------- AI ---------- */
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const PST = {
    p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    ke: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50],
  };

  function evaluate(ch) {
    const b = ch.board;
    let score = 0;
    let nonPawn = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (p && p.toLowerCase() !== "p" && p.toLowerCase() !== "k") nonPawn += VAL[p.toLowerCase()];
    }
    const endgame = nonPawn <= 1600;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p) continue;
      const t = p.toLowerCase();
      const white = p < "a";
      const idx = white ? i : (7 - (i >> 3)) * 8 + (i & 7);
      const table = t === "k" && endgame ? PST.ke : PST[t];
      const v = VAL[t] + table[idx];
      score += white ? v : -v;
    }
    return ch.turn === "w" ? score : -score;
  }

  const MATE = 100000;
  class Timeout extends Error {}

  function orderMoves(moves, pv) {
    return moves
      .map((m) => {
        let s = 0;
        if (m.c) s += 10 * VAL[m.c.toLowerCase()] - VAL[m.p.toLowerCase()] + 1000;
        if (m.flag === "promo") s += VAL[m.promo] + 800;
        if (pv && m.from === pv.from && m.to === pv.to && m.promo === pv.promo) s += 100000;
        return { m, s };
      })
      .sort((a, b) => b.s - a.s)
      .map((x) => x.m);
  }

  function search(ch, opts) {
    const deadline = Date.now() + (opts.timeMs || 1000);
    let nodes = 0;
    const tick = () => {
      nodes += 1;
      if ((nodes & 1023) === 0 && Date.now() > deadline) throw new Timeout();
    };

    function quiesce(alpha, beta, qd) {
      tick();
      const stand = evaluate(ch);
      if (stand >= beta) return beta;
      if (stand > alpha) alpha = stand;
      if (qd <= 0) return alpha;
      const us = ch.turn;
      for (const m of orderMoves(ch.pseudo(true))) {
        ch.make(m);
        if (ch.attacked(ch.kings[us], other(us))) { ch.undo(); continue; }
        const sc = -quiesce(-beta, -alpha, qd - 1);
        ch.undo();
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }

    function negamax(depth, alpha, beta, ply) {
      tick();
      if (ply > 0 && (ch.half >= 100 || ch.repetition())) return 0;
      if (depth <= 0) return quiesce(alpha, beta, 6);
      const us = ch.turn;
      let legal = 0;
      let best = -MATE * 2;
      for (const m of orderMoves(ch.pseudo(false))) {
        ch.make(m);
        if (ch.attacked(ch.kings[us], other(us))) { ch.undo(); continue; }
        legal += 1;
        const sc = -negamax(depth - 1, -beta, -alpha, ply + 1);
        ch.undo();
        if (sc > best) best = sc;
        if (sc > alpha) alpha = sc;
        if (alpha >= beta) break;
      }
      if (!legal) return ch.inCheck() ? -MATE + ply : 0;
      return best;
    }

    const rootMoves = ch.moves();
    if (!rootMoves.length) return null;
    let bestMove = rootMoves[0];
    let pv = null;
    const noise = opts.noise || 0;
    for (let depth = 1; depth <= (opts.maxDepth || 2); depth++) {
      try {
        let alpha = -MATE * 2;
        let iterBest = null;
        let iterScore = -MATE * 2;
        for (const m of orderMoves(rootMoves, pv)) {
          ch.make(m);
          let sc = -negamax(depth - 1, -MATE * 2, -alpha + noise, 1);
          ch.undo();
          if (noise) sc += Math.random() * noise;
          if (sc > iterScore) { iterScore = sc; iterBest = m; }
          if (sc > alpha) alpha = sc;
        }
        if (iterBest) { bestMove = iterBest; pv = iterBest; }
        if (iterScore > MATE - 100) break;
      } catch (e) {
        if (e instanceof Timeout) {
          // keep stack consistent: unwind any partial makes
          break;
        }
        throw e;
      }
    }
    return bestMove;
  }

  function cpuMove(ch, diff) {
    // ensure stack depth restored after timeout
    const depthBefore = ch.stack.length;
    const unwind = () => { while (ch.stack.length > depthBefore) ch.undo(); };
    const legal = ch.moves();
    if (!legal.length) return null;
    let m;
    if (diff === "easy") {
      const caps = legal.filter((x) => x.c && VAL[x.c.toLowerCase()] >= 300);
      if (caps.length && Math.random() < 0.35) m = caps[Math.floor(Math.random() * caps.length)];
      else m = legal[Math.floor(Math.random() * legal.length)];
    } else if (diff === "normal") {
      m = safeSearch(ch, { maxDepth: 1, timeMs: 400, noise: 60 }, unwind) || legal[0];
    } else if (diff === "hard") {
      m = safeSearch(ch, { maxDepth: 3, timeMs: 1000, noise: 10 }, unwind) || legal[0];
    } else {
      m = safeSearch(ch, { maxDepth: 7, timeMs: 2500 }, unwind) || legal[0];
    }
    unwind();
    return legal.find((x) => x.from === m.from && x.to === m.to && x.promo === m.promo) || legal[0];
  }

  function safeSearch(ch, opts, unwind) {
    try {
      const r = search(ch, opts);
      unwind();
      return r;
    } catch (e) {
      unwind();
      return null;
    }
  }

  /* ---------- share code ---------- */
  function encodeState(obj) {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decodeState(code) {
    if (!code || code.length > 2000) throw new Error("too long");
    let s = code.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const obj = JSON.parse(new TextDecoder().decode(bytes));
    if (!obj || typeof obj.f !== "string") throw new Error("bad");
    new Chess(obj.f); // validate
    return obj;
  }

  window.GFChessEngine = { Chess, cpuMove, search, evaluate, encodeState, decodeState, sqName, START_FEN };

  /* ---------- UI ---------- */
  const GLYPH = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
  const PNAME = { q: "クイーン", r: "ルーク", b: "ビショップ", n: "ナイト" };
  const FRIEND_KEY = "gaman-chokin:friendchess";

  let ui = null;

  function pieceHtml(p) {
    if (!p) return "";
    return `<span class="pc ${p < "a" ? "w" : "b"}">${GLYPH[p.toLowerCase()]}\uFE0E</span>`;
  }

  function open(opts) {
    const GF = window.GF;
    const friend = opts.friend || null;
    const ch = new Chess(friend ? friend.f : START_FEN);
    const myColor = friend ? friend.myColor : "w";
    const adv = GF.advantage();
    ui = {
      ch,
      diff: opts.diff || "normal",
      friend,
      myColor,
      selected: -1,
      targets: [],
      lastMove: friend && friend.lm ? { from: friend.lm[0], to: friend.lm[1] } : null,
      hints: friend ? 0 : adv.chessHints,
      undos: friend ? 0 : adv.chessUndo,
      hintMove: null,
      thinking: false,
      over: false,
      movedThisTurn: false,
      plies: 0,
    };
    const diffName = GF.diffName(ui.diff);
    const title = friend ? "友だちとチェス" : `チェス（${diffName}）`;
    const body = GF.openLayer(title, () => { ui = null; });
    const topName = friend
      ? GF.esc((myColor === "w" ? friend.b : friend.w) || "あいて")
      : `CPU・${diffName}`;
    const meName = friend ? GF.esc((myColor === "w" ? friend.w : friend.b) || "あなた") : "あなた";
    body.innerHTML = `
      <div class="ch-wrap">
        <div class="ch-player top"><span class="ch-dot ${myColor === "w" ? "b" : "w"}"></span><b>${topName}</b><span class="ch-caps" id="ch-caps-top"></span></div>
        <div class="ch-board${myColor === "b" ? " flipped" : ""}" id="ch-board" role="grid" aria-label="チェス盤"></div>
        <div class="ch-player"><span class="ch-dot ${myColor}"></span><b>${meName}</b><span class="ch-caps" id="ch-caps-me"></span></div>
        <div class="ch-status" id="ch-status" aria-live="polite"></div>
        <div class="ch-actions" id="ch-actions"></div>
        <div id="ch-extra"></div>
      </div>`;
    const boardEl = document.getElementById("ch-board");
    boardEl.addEventListener("click", (e) => {
      const cell = e.target.closest(".sq");
      if (cell) onSquare(Number(cell.dataset.sq));
    });
    document.getElementById("ch-actions").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.act === "hint") doHint();
      if (b.dataset.act === "undo") doUndo();
      if (b.dataset.act === "resign") doResign();
      if (b.dataset.act === "share") doShare();
    });
    if (friend) {
      // was the game already over when opened?
      const st = ch.status();
      if (st) { ui.over = true; }
    }
    render();
    if (!friend && ch.turn !== myColor) cpuTurn();
    if (friend && ch.turn !== myColor && !ui.over) {
      ui.movedThisTurn = true;
    }
    if (friend && ui.over) finishFriend(ch.status());
    return ui;
  }

  function render() {
    if (!ui) return;
    const { ch } = ui;
    const boardEl = document.getElementById("ch-board");
    if (!boardEl) return;
    const checkSq = ch.inCheck() ? ch.kings[ch.turn] : -1;
    const order = [];
    for (let i = 0; i < 64; i++) order.push(ui.myColor === "b" ? 63 - i : i);
    boardEl.innerHTML = order
      .map((sq) => {
        const light = ((sq >> 3) + (sq & 7)) % 2 === 0;
        const cls = ["sq", light ? "l" : "d"];
        if (sq === ui.selected) cls.push("sel");
        if (ui.lastMove && (sq === ui.lastMove.from || sq === ui.lastMove.to)) cls.push("last");
        if (sq === checkSq) cls.push("incheck");
        if (ui.hintMove && (sq === ui.hintMove.from || sq === ui.hintMove.to)) cls.push("hint");
        const tgt = ui.targets.find((m) => m.to === sq);
        if (tgt) cls.push(tgt.c ? "cap" : "tgt");
        const coord = (ui.myColor === "b" ? (sq & 7) === 7 : (sq & 7) === 0) ? `<i class="rk">${8 - (sq >> 3)}</i>` : "";
        const fileC = (ui.myColor === "b" ? sq >> 3 === 0 : sq >> 3 === 7) ? `<i class="fl">${FILES[sq & 7]}</i>` : "";
        return `<button type="button" class="${cls.join(" ")}" data-sq="${sq}" aria-label="${sqName(sq)}">${pieceHtml(ch.board[sq])}${coord}${fileC}</button>`;
      })
      .join("");
    // captured
    const start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const count = (c) => {
      const res = [];
      for (const t of ["q", "r", "b", "n", "p"]) {
        const pc = c === "w" ? t.toUpperCase() : t;
        const have = ch.board.filter((x) => x === pc).length;
        for (let i = have; i < start[t]; i++) res.push(pc);
      }
      return res;
    };
    const oppColor = ui.myColor === "w" ? "b" : "w";
    document.getElementById("ch-caps-me").innerHTML = count(oppColor).map(pieceHtml).join("");
    document.getElementById("ch-caps-top").innerHTML = count(ui.myColor).map(pieceHtml).join("");
    renderStatus();
    renderActions();
  }

  function renderStatus(text) {
    const el = document.getElementById("ch-status");
    if (!el || !ui) return;
    if (text) { el.textContent = text; return; }
    const { ch } = ui;
    if (ui.over) return;
    if (ui.thinking) { el.textContent = "CPUが考え中…"; return; }
    if (ui.friend && ui.movedThisTurn) { el.textContent = "相手の番です。下のボタンでリンクを送ってください"; return; }
    const mine = ch.turn === ui.myColor;
    el.textContent = (mine ? "あなたの番" : "あいての番") + (ch.inCheck() ? "（チェック！）" : "");
  }

  function renderActions() {
    const el = document.getElementById("ch-actions");
    if (!el || !ui) return;
    if (ui.friend) {
      el.innerHTML = ui.movedThisTurn || ui.over
        ? `<button type="button" class="btn-primary small" data-act="share">🔗 リンクを送る</button>`
        : `<span class="muted">1手指したら、リンクを相手に送りましょう</span>`;
      return;
    }
    if (ui.over) { el.innerHTML = ""; return; }
    el.innerHTML = `
      <button type="button" class="btn-ghost" data-act="hint" ${ui.hints > 0 && !ui.thinking ? "" : "disabled"}>💡 ヒント ${ui.hints}</button>
      <button type="button" class="btn-ghost" data-act="undo" ${ui.undos > 0 && !ui.thinking && ui.ch.stack.length >= 2 ? "" : "disabled"}>↩ 待った ${ui.undos}</button>
      <button type="button" class="btn-ghost" data-act="resign" ${ui.thinking ? "disabled" : ""}>🏳 投了</button>`;
  }

  function onSquare(sq) {
    if (!ui || ui.over || ui.thinking) return;
    if (ui.friend && ui.movedThisTurn) return;
    const { ch } = ui;
    if (ch.turn !== ui.myColor) return;
    const p = ch.board[sq];
    const tg = ui.targets.filter((m) => m.to === sq);
    if (ui.selected >= 0 && tg.length) {
      if (tg.length > 1) {
        choosePromotion(tg);
      } else {
        playerMove(tg[0]);
      }
      return;
    }
    if (p && colorOf(p) === ui.myColor) {
      ui.selected = sq;
      ui.targets = ch.moves().filter((m) => m.from === sq);
    } else {
      ui.selected = -1;
      ui.targets = [];
    }
    render();
  }

  function choosePromotion(options) {
    const extra = document.getElementById("ch-extra");
    extra.innerHTML = `<div class="ch-promo"><p>どれに成る？</p><div>${["q", "r", "b", "n"]
      .map((t) => `<button type="button" data-pr="${t}">${pieceHtml(ui.myColor === "w" ? t.toUpperCase() : t)}<small>${PNAME[t]}</small></button>`)
      .join("")}</div></div>`;
    extra.querySelectorAll("[data-pr]").forEach((b) =>
      b.addEventListener("click", () => {
        const m = options.find((x) => x.promo === b.dataset.pr);
        extra.innerHTML = "";
        if (m) playerMove(m);
      })
    );
  }

  function playerMove(m) {
    const { ch } = ui;
    ch.make(m);
    ui.plies += 1;
    ui.lastMove = { from: m.from, to: m.to };
    ui.selected = -1;
    ui.targets = [];
    ui.hintMove = null;
    const st = ch.status();
    if (ui.friend) {
      ui.movedThisTurn = true;
      saveFriend();
      if (st) { ui.over = true; render(); finishFriend(st); return; }
      render();
      return;
    }
    if (st) { render(); finish(st); return; }
    render();
    cpuTurn();
  }

  function cpuTurn() {
    if (!ui) return;
    ui.thinking = true;
    renderStatus();
    renderActions();
    const myUi = ui;
    setTimeout(() => {
      if (ui !== myUi) return;
      const t0 = Date.now();
      const m = cpuMove(ui.ch, ui.diff);
      const wait = Math.max(0, 350 - (Date.now() - t0));
      setTimeout(() => {
        if (ui !== myUi) return;
        ui.thinking = false;
        if (m) {
          ui.ch.make(m);
          ui.lastMove = { from: m.from, to: m.to };
        }
        const st = ui.ch.status();
        render();
        if (st) finish(st);
      }, wait);
    }, 60);
  }

  function doHint() {
    if (!ui || ui.hints <= 0 || ui.thinking || ui.over) return;
    ui.hints -= 1;
    const depthBefore = ui.ch.stack.length;
    let m = null;
    try { m = search(ui.ch, { maxDepth: 3, timeMs: 900 }); } catch (e) { m = null; }
    while (ui.ch.stack.length > depthBefore) ui.ch.undo();
    ui.hintMove = m ? { from: m.from, to: m.to } : null;
    render();
    if (m) renderStatus(`ヒント：${sqName(m.from)} → ${sqName(m.to)}`);
  }

  function doUndo() {
    if (!ui || ui.undos <= 0 || ui.thinking || ui.over) return;
    if (ui.ch.stack.length < 2) return;
    ui.ch.undo();
    ui.ch.undo();
    ui.undos -= 1;
    const last = ui.ch.stack[ui.ch.stack.length - 1];
    ui.lastMove = last ? { from: last.m.from, to: last.m.to } : null;
    ui.selected = -1;
    ui.targets = [];
    ui.hintMove = null;
    render();
  }

  function doResign() {
    if (!ui || ui.over) return;
    finish("resign");
  }

  function finish(st) {
    const GF = window.GF;
    ui.over = true;
    const { ch } = ui;
    let win = false;
    let text = "";
    if (st === "checkmate") {
      win = ch.turn !== ui.myColor;
      text = win ? "チェックメイト！あなたの勝ち🎉" : "チェックメイト…CPUの勝ち";
    } else if (st === "resign") {
      text = "投了しました";
    } else {
      const why = { stalemate: "ステイルメイト", draw50: "50手ルール", insufficient: "駒が足りない", repetition: "同じ形が3回" }[st] || "";
      text = `引き分け（${why}）`;
    }
    const reward = GF.reportGame("chess", ui.diff, win, { finished: st !== "resign", draw: !win && st !== "resign" && st !== "checkmate" });
    renderActions();
    renderStatus(text);
    GF.showResult({
      win,
      title: win ? "勝利！" : st === "checkmate" || st === "resign" ? "CPUの勝ち" : "引き分け",
      text,
      reward,
      onRetry: () => open({ diff: ui ? ui.diff : "normal" }),
    });
  }

  /* ---------- friend mode ---------- */
  function friendPayload() {
    const f = ui.friend;
    return { v: 1, f: ui.ch.fen(), w: f.w || "", b: f.b || "", lm: ui.lastMove ? [ui.lastMove.from, ui.lastMove.to] : null, n: (f.n || 0) + 1 };
  }

  function saveFriend() {
    try {
      const p = friendPayload();
      p.myColor = ui.myColor;
      localStorage.setItem(FRIEND_KEY, JSON.stringify(p));
    } catch (_) { /* ignore */ }
  }

  function shareUrl() {
    const base = location.href.split("#")[0].split("?")[0];
    return `${base}#chess=${encodeState(friendPayload())}`;
  }

  function doShare() {
    const GF = window.GF;
    const url = shareUrl();
    const meName = (ui.myColor === "w" ? ui.friend.w : ui.friend.b) || "友だち";
    const text = ui.over ? `${meName}とのほしまなびチェス、決着！` : `${meName}がチェスで1手指しました。あなたの番です！`;
    const extra = document.getElementById("ch-extra");
    extra.innerHTML = `<div class="ch-share">
        <p class="fine-print">このリンクをLINEなどで相手に送ってください。相手が開くと続きから指せます（サーバーなし・無料）。</p>
        <input id="ch-link" readonly value="${GF.esc(url)}" />
        <button type="button" class="btn-ghost" id="ch-copy">コピー</button>
      </div>`;
    document.getElementById("ch-copy").addEventListener("click", () => GF.copyText(url));
    if (navigator.share) {
      navigator.share({ title: "ほしまなび チェス", text, url }).catch(() => {});
    } else {
      GF.copyText(url);
    }
  }

  function finishFriend(st) {
    const { ch } = ui;
    let text;
    if (st === "checkmate") {
      const winner = ch.turn === "w" ? "黒" : "白";
      text = `チェックメイト！${winner}の勝ち`;
    } else {
      text = "引き分け";
    }
    renderStatus(text);
    renderActions();
  }

  function openFromHash(code) {
    const GF = window.GF;
    let data;
    try {
      data = decodeState(code);
    } catch (e) {
      GF.toast("対戦リンクを読み込めませんでした");
      return false;
    }
    const tmp = new Chess(data.f);
    const myColor = tmp.turn;
    const nick = GF.getNick();
    if (myColor === "w" && !data.w) data.w = nick || "あなた";
    if (myColor === "b" && !data.b) data.b = nick || "あなた";
    open({ friend: { ...data, myColor } });
    const from = myColor === "w" ? data.b : data.w;
    GF.toast(`${from || "友だち"}からのチェス！あなたは${myColor === "w" ? "白" : "黒"}`);
    return true;
  }

  function startFriendGame(name) {
    const nick = (name || "").trim().slice(0, 12) || "わたし";
    open({ friend: { v: 1, f: START_FEN, w: nick, b: "", lm: null, n: 0, myColor: "w" } });
  }

  function resumeFriend() {
    try {
      const raw = localStorage.getItem(FRIEND_KEY);
      if (!raw) return false;
      const d = JSON.parse(raw);
      new Chess(d.f);
      open({ friend: d });
      ui.movedThisTurn = new Chess(d.f).turn !== d.myColor;
      ui.lastMove = d.lm ? { from: d.lm[0], to: d.lm[1] } : null;
      ui.friend.n = Math.max(0, (d.n || 1) - 1);
      render();
      return true;
    } catch (_) {
      return false;
    }
  }

  function hasFriendGame() {
    return !!localStorage.getItem(FRIEND_KEY);
  }

  window.GFChess = { open, openFromHash, startFriendGame, resumeFriend, hasFriendGame, _ui: () => ui };
})();
