# Flight Prep app 3.8.2 (15 NOV 2026) – update and set-up

The app files hold **no flight data and no company data**. Flights and library files are loaded from the Files app on your iPad and are
never uploaded anywhere. **Never put a flight file or a library file in the GitHub repository – the repository is public.**

## Updating the app (you already have it online)
1. Unzip the app zip. All app files are in ONE folder – there are no sub-folders to keep.
2. In your repository on GitHub: **Add file → Upload files**, select **all** files of the folder, **Commit changes**. They replace the old ones.
3. Wait 1–2 minutes. Open the app with internet and tap **Update now** when it offers it (or close and reopen the app twice).
   **FLIGHTS** shows "Flight Prep 3.8.2".
4. Load the new `regs_library.json` once (FLIGHTS → Load …). It carries the DocuNet link list for the references.

Old files you can delete from the repository (no longer used): `wx.yml`, `wx_fetch.py`, `notam_fetch.py`, `stations.txt`, any old app zip.

## First set-up (a new repository)
1. Free account at https://github.com. You make the account yourself.
2. **+ → New repository**, name `flight-prep`, **Public**, **Create repository**.
3. **uploading an existing file** → select all files of the unzipped folder → **Commit changes**.
4. **Settings → Pages** → Source **Deploy from a branch**, Branch **main**, folder **/(root)** → **Save**.
5. After 1–2 minutes the page shows the address `https://YOUR-NAME.github.io/flight-prep/`.
6. iPad: open the address in **Safari** → **Share → Add to Home Screen**. Open it once with internet; after that it works offline.
7. A new address is a new app for the iPad: its storage starts empty. Load your library files and flight files again (FLIGHTS → Load),
   and enter the 1-hour one-engine distance again in Settings (sliders icon). You can delete the old Home Screen icon.
8. For the STD timeline alerts: open the STD−60 page once and tap **Allow notifications** (iPadOS 16.4 or later, only from the Home Screen icon).

## Loading a flight
- **Flight file from Claude** (`*_flight.json`): save it to the Files app, then **FLIGHTS → Load OFP (PDF), flight or library files**.
- **OFP alone**: the same button takes the OFP PDF and builds the flight in the app, offline, with the stored libraries.

## Library files (load once, used by every flight)
`apt_*.json` airport packs · `fir_library.json` FIR comms · `regs_library.json` country rules + DocuNet link list · `mel_library.json` MEL ·
`route_*.json` route packs. Select several at once; FLIGHTS lists what is stored.

## New in 3.8.2
- The STD timeline also works for a flight you build in the app from the OFP alone (PDF or pasted): the iPad keeps the timeline from the
  last flight file Claude sent, and uses the STD of the OFP. A **New STD** moves the whole timeline (and the bubble) to start one hour
  before the new time, on the flight's day; **Use OFP STD** goes back.

## New in 3.8.1
- **Timeline bubble**: from STD−60 a round bubble stays on every page with the current phase, the time left, the UTC time it runs out and
  the full phase title. Drag it anywhere (the place is remembered); tap it for Acknowledge / Hold / Complete; **−** hides it to a tab on the
  right edge (tap the tab to bring it back); **×** closes it for the flight (STD−60 page → Show the bubble). The ring empties as time runs out:
  blue running, red in the last minute, amber on hold, green when complete. When a phase starts, the action card opens next to the bubble.

## New in 3.8.0
- **STD−60** page (Preparation, after DASH): the departure timeline counted back from the STD of the flight. It starts by itself at STD−60;
  each phase starts with a chime and a card on top of any page: **Acknowledge** (seen), **Hold** (reminds you again every 2 min until done)
  or **Complete**. A countdown for every phase, the off-block target window, **New STD** for a delay, **Test alert**, saved per flight.
- The phases and their wording come **inside the flight file** that Claude builds for you (from your company manual). The app code holds
  none of it, so the page appears only with a flight file that carries the timeline.
- Alerts run while Flight Prep is open on screen (iPad web apps pause when the screen locks or the app is in the background). Use
  Settings → **Keep screen on**. When you come back, every phase that started meanwhile shows as DUE and the card comes up.

## New in 3.7.0
- **Update weather** button (DASH and WX · NOTAM): with internet the app reads the TAF and METAR of every airfield of the flight itself
  (MET Norway and VATSIM), shows them as LIVE with time and source and keeps them on the iPad for that flight. The OFP weather is never
  overwritten. Nothing to set up in the repository.
- **DASH** shows the departure and the arrival airfield; all the others open with one button.
- **WX · NOTAM** in flight order: departure – key en-route airfields (the fewest 1-hour airfields that cover the route, and ETOPS) – arrival and
  alternates – all other airfields behind a button. The airfield name is next to every code, on the NOTAMs too.
- **WPTS**: every waypoint card is open, smaller type; a waypoint without its own frequencies repeats the list of its FIR.
- **DEP / ARR**: the Brief | CCI / AOI | AGC bar stays at the top while you scroll.
- **MAP**: the vertical profile fills its box in landscape; a clear line to the RETURN (green) and AHEAD (blue) airport; tap a box to go there.
- **NOW**: knows the date of the flight (no more "LANDED" before the flight); the CPDLC chip names the next log-on and its time; COMMS shows
  the frequencies of the waypoint you are on.
- **References**: a tap opens DocuNet at that section – the DocuNet app by default; hold the reference for the card with the captured text
  (the card lets you choose app / web / card).
- **OFP-only flights**: each alternate with its weather in one row; one ground chart, the other charts and the full Lido text behind a button.
- A flight file that already carries library content is no longer given it a second time.

Preparation aid only – the OFP, official Emirates documentation and ATC prevail.

## 3.8.3 (15 NOV 2026)
- STD timeline: a STD typed by hand is the next time that clock time comes up (or up to 3 h ago = a delay already running), whatever the date of the loaded flight. Timeline starts 1 h before it. "Use OFP STD" goes back to the flight's own STD.

## 3.8.4 (15 NOV 2026)
- Fuel check timer: every 30 min (was 55).
- Timer bubbles: every running timer (fuel check, quick-start or your own) gets a draggable bubble on every page with countdown, UTC due time and its full title. − hides it to the edge tab (still running), × closes it (still running) until Done / Stop on the Timers page; "Bubble" on the Timers page brings a closed one back. Tap a bubble = Timers.

## 3.8.5 (15 NOV 2026)
- Fix: tapping the edge tab (timer bubbles and STD timeline) always brings the bubble back (the tab no longer redraws its nodes every second).
- DUE text fits inside the timer bubble.

## 3.8.6 (16 NOV 2026)
- STD timeline: × closes the bubble for the current phase only; every next phase brings the bubble back with its card next to it.

## 3.9.0 (16 NOV 2026)
- New GND (ground phase) item after DASH, aircraft-from-above icon. Two pages: Checklist (own cockpit flow cards: tick items with UTC time, Mark complete, Reset card, edit / add / delete cards, clear all ticks, restore defaults; cards kept on the iPad, ticks per flight) and OTP (the former STD−60 timeline). Old #turn links open GND · OTP.

## 3.9.1 (16 NOV 2026)
- Fix: checklist ticks are kept after a reload (default cards now have fixed ids and are saved at once).

## 3.9.2 (16 NOV 2026)
- OTP bubble: under the time, the checklist card in progress and its count (no due time). Tap it = draggable pop-up of that card (NEXT item highlighted, tick, Mark complete, All cards). Last item ticked: the pop-up and the line move on to the next card. Pop-up fits the screen and remembers its position.

## 3.9.3 (16 NOV 2026)
- Sound alerts off now also silences the OTP alerts: no chime, and OTP notifications are sent silent.

## 3.9.4 (16 NOV 2026)
- DEP / ARR: Departure card | Departure briefing (and Arrival card | Arrival briefing) tabs. The briefing pictures come in the flight files (data.brief) and the iPad keeps the last ones (fp.brief.def); no pictures in the app code.

## 3.9.5 (16 NOV 2026)
- WX·NOTAM: Weather & NOTAM | OFP weather charts tabs. Every picture page of the OFP in OFP order (data.wxcharts in the flight file, added by tool2/add_wxcharts.py); number buttons; full-screen viewer with pinch / double-tap zoom, pan, swipe / ‹ ›.
- Drawing on the charts: ✎ Draw, red / blue pen, yellow highlighter, Undo, Clear; kept per flight on the iPad (fp.wxd.<flight id>); shown in the list too.

## 3.9.6 (16 NOV 2026)
- OFP weather charts: chart names (read from the chart when the flight file is built, data.wxcharts[].title), overview grid (default) | full-size list, ✎ marked badge on cards, ⌫ eraser for single marks.

## 3.11.0 (17 NOV 2026) – NAT (North Atlantic) page
- New fp_nat.js: NAT in the IN FLIGHT group (shown when the flight file has data.nat or the 'nat' library is loaded). Tabs: In-flight checklist · This flight · Procedures · Contingency.
- Checklist from the 'nat' library (fpapp.library.v1, kind 'nat': check / timers / html.proc / html.cont / html.wptcheck / sources / flags). Phases timed by anchors OEP±n, EXIT±n, BDY±n, EL<min>±n from FPCore.toMin(); the current phase opens and is marked NOW. Ticks with UTC stamp in fp.nat.<id>, waypoint checks in fp.natw.<id>.
- "Start NAT timer bubbles": the next timer as a bubble, the others hidden to the edge tab (Timers board).
- data.nat (entry, exit, bdy, wpts, summary, notes, ots, timers) is built per flight from the OFP. Company text only in the library / flight files.

## 3.10.0 (17 NOV 2026) – cold weather / icing
- New fp_cold.js. DEP and ARR get a "❄ Icing" tab (through fp_brief.js v1.1, which also now hides the card's own section bar / briefed button on the other tabs). NOW gets an "Icing – in-flight procedure" card.
- DEP: worksheet v2.0 (fillable, per flight and leg: fp.cold.ws.<id>.dep / .ret; HOT expiry + live countdown; "Start HOT timer bubbles" puts two timers in FPCore.S.timers), original sheet and the 10.3.1.3 flow in the full-screen pen viewer, OM-C 10.3 procedure, A350 actions, HOT tables (50 pictures + notes, Table 57, allowance tables 53-56), departure airport part.
- ARR: cold weather arrival (OM-C 10.4.1 with a correction helper: next colder row, next higher column, extrapolation above 5000 ft) + the next departure's set (worksheet / procedure / A350 / HOT / airport).
- Tab highlight from the OFP METAR / TAF: +3 °C or colder (METAR temp or TAF TN) or SN/SG/PL/GS/GR/IC/FZxx = amber dot; +10 °C or colder with moisture = blue dot.
- fp_wxc.js v1.3: view(list, i, key) opens the same viewer (zoom + pen) for any pictures; ink per key.
- Company content only in the 'cold' library file (fpapp.library.v1, kind 'cold', replaced whole) and in data.cold of the flight files (tool2/add_cold.py, airport html in deice/apt/).
- fp_cold.js v1.1: icing conditions per FCOM GEN Definitions (OAT/TN ≤ +10 °C with cloud, fog/mist ≤ 1600 m, any precipitation, or freezing precipitation) on every airport with weather: badge on WX·NOTAM tiles and weather cards (FPCold.badge, works without the library) and on the DEP/ARR tab banner. Amber = also ≤ +3 °C or snow / freezing / ice precipitation.
