(function () {
    'use strict';

    const TOCS_URL = 'https://raw.githubusercontent.com/Turtle358/callingpoint-data/refs/heads/main/tocs.json';

    const DEFAULT_BRAND = {
        colour: '#2E2A74',
        secondary_colour: '#FFFFFF',
        manager: ''
    };

    const BUS_BRAND = {
        colour: '#DC241F',
        secondary_colour: '#FFFFFF',
        manager: 'bus'
    };

    const WALK_BRAND = {
        colour: '#2E2A74',
        secondary_colour: '#FFFFFF',
        manager: 'walk'
    };

    const ICONS = {
        walk: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <circle cx="13.5" cy="4.5" r="2"/>
            <path d="M9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
        </svg>`,
        train: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>`,
        bus: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>`,
        map: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
            <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
        </svg>`,
        chevronDown: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>`
    };

    let cachedTocs = null;

    async function loadTocs() {
        if (cachedTocs) return cachedTocs;
        try {
            const response = await fetch(TOCS_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            cachedTocs = Array.isArray(data) ? data : [];
        } catch (_) {
            cachedTocs = [];
        }
        return cachedTocs;
    }

    function findTocEntry(tocs, operatorName, operatorCode) {
        if (!Array.isArray(tocs) || tocs.length === 0) return null;

        const code = (operatorCode || '').trim().toLowerCase();
        const name = (operatorName || '').trim().toLowerCase();

        if (code) {
            const byCode = tocs.find((t) =>
                (t.code && t.code.toLowerCase() === code) ||
                (t.acronym && t.acronym.replace(/\s+/g, '').toLowerCase() === code.replace(/\s+/g, ''))
            );
            if (byCode) return byCode;
        }

        if (!name) return null;

        const exact = tocs.find((t) =>
            (t.name && t.name.toLowerCase() === name) ||
            (t.code && t.code.toLowerCase() === name) ||
            (t.acronym && t.acronym.replace(/\s+/g, '').toLowerCase() === name.replace(/\s+/g, ''))
        );
        if (exact) return exact;

        const cleanName = name.replace(/\b(railways?|trains?|line)\b/g, '').trim();
        return tocs.find((t) => {
            if (!t.name) return false;
            const tocName = t.name.toLowerCase();
            const cleanToc = tocName.replace(/\b(railways?|trains?|line)\b/g, '').trim();
            return (cleanName && cleanToc && (cleanName.includes(cleanToc) || cleanToc.includes(cleanName))) ||
                name.includes(tocName) ||
                tocName.includes(name);
        }) || null;
    }

    function resolveBrandForLeg(leg, tocs) {
        if (leg.isWalk) return WALK_BRAND;

        const op = (leg.operatorName || '').trim();
        if (leg.mode === 'BUS' || (/^[a-zA-Z]{0,2}\d+[a-zA-Z]?$/.test(op) && op.toLowerCase() !== 'c2c')) {
            return BUS_BRAND;
        }

        const toc = findTocEntry(tocs, leg.operatorName, leg.operatorCode);
        if (toc) {
            return {
                colour: toc.colour || DEFAULT_BRAND.colour,
                secondary_colour: toc.secondary_colour || DEFAULT_BRAND.secondary_colour,
                manager: (toc.manager || '').toLowerCase()
            };
        }

        return {
            colour: DEFAULT_BRAND.colour,
            secondary_colour: DEFAULT_BRAND.secondary_colour,
            manager: leg.mode === 'TRAIN' ? 'gbr' : ''
        };
    }

    function getPrimaryBrand(legs, tocs) {
        for (const leg of legs) {
            if (!leg.isWalk && (leg.operatorName || leg.operatorCode)) {
                return resolveBrandForLeg(leg, tocs);
            }
        }
        return WALK_BRAND;
    }

    function createManagerLogo(manager) {
        if (!manager) return null;

        const wrap = document.createElement('div');
        wrap.className = 'manager-logo-wrap';

        const img = document.createElement('img');
        img.className = 'manager-logo';

        switch (manager) {
            case 'gbr':
                img.src = './icons/GBR.svg';
                img.alt = 'Great British Railways';
                img.classList.add('manager-logo-gbr');
                break;
            case 'national':
            case 'open-access':
                img.src = './icons/National_Rail_logo_red.svg';
                img.alt = 'National Rail';
                break;
            case 'tfl':
            case 'tfl-national':
                img.src = './icons/tfl.svg';
                img.alt = 'Transport for London';
                break;
            case 'wales':
                img.src = './icons/tfw_logo.svg';
                img.alt = 'Transport for Wales';
                break;
            case 'scot':
                img.src = './icons/scotrail_small.svg';
                img.alt = 'ScotRail';
                img.classList.add('manager-logo-round');
                break;
            default:
                return null;
        }

        wrap.appendChild(img);
        return wrap;
    }


    function extractPayloadToken(rawSource) {
        if (!rawSource) return null;
        let candidate = rawSource.trim();

        try {
            if (candidate.includes('safelinks.protection.outlook.com') || candidate.includes('url=')) {
                const parsed = new URL(candidate.startsWith('http') ? candidate : 'https://placeholder.local/?' + candidate.replace(/^\?/, ''));
                const unwrapped = parsed.searchParams.get('url');
                if (unwrapped) {
                    candidate = decodeURIComponent(unwrapped);
                }
            }
        } catch (_) {
        }

        const match = candidate.match(/v1\.([A-Za-z0-9\-_+=]+)/);
        return match ? match[1] : null;
    }

    async function decodeGzipBase64Url(base64Url) {
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const remainder = base64.length % 4;
        if (remainder === 2) base64 += '==';
        else if (remainder === 3) base64 += '=';
        else if (remainder !== 0) throw new Error('Malformed Base64URL payload length.');

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        if (typeof DecompressionStream === 'undefined') {
            throw new Error('This browser does not support native GZIP decompression.');
        }

        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        writer.write(bytes);
        writer.close();

        const buffer = await new Response(stream.readable).arrayBuffer();
        const jsonString = new TextDecoder('utf-8').decode(buffer);
        return JSON.parse(jsonString);
    }

    function normalizeJourney(raw) {
        const root = raw && raw.journey ? raw.journey : raw;
        if (!root || typeof root !== 'object') {
            throw new Error('Decoded payload is not a valid journey object.');
        }

        const rawLegs = Array.isArray(root.legs) ? root.legs : (Array.isArray(root.l) ? root.l : []);
        if (rawLegs.length === 0) {
            throw new Error('No journey legs found in this link.');
        }

        let lastCheckedLiveTime = root.lastCheckedLiveTime || root.lastUpdated || '';

        const legs = rawLegs.map((leg) => {
            if (!lastCheckedLiveTime && leg.lastCheckedLiveTime) {
                lastCheckedLiveTime = leg.lastCheckedLiveTime;
            }

            const mode = (leg.transportMode || leg.mode || leg.m || 'TRAIN').toString().toUpperCase();
            const operatorName = leg.operatorName || leg.operator || leg.op || '';
            const operatorCode = leg.operatorCode || leg.tocCode || leg.oc || '';
            const fromName = leg.fromStationName || leg.fromName || leg.from || leg.f || 'Unknown origin';
            const toName = leg.toStationName || leg.toName || leg.to || leg.t || 'Unknown destination';
            const departTime = leg.departTime || leg.departureTime || leg.scheduledDepartureTime || leg.dt || '';
            const arriveTime = leg.arriveTime || leg.arrivalTime || leg.scheduledArrivalTime || leg.at || '';
            const liveDepartTime = leg.liveDepartTime || leg.expectedDepartureTime || leg.edt || '';
            const liveArriveTime = leg.liveArriveTime || leg.expectedArrivalTime || leg.eat || '';
            const departurePlatform = leg.departurePlatform || leg.platform || leg.p || '';
            const arrivalPlatform = leg.arrivalPlatform || leg.ap || '';
            const destination = leg.destination || leg.headsign || leg.trainDestination || leg.dest || toName;
            const duration = leg.duration || (typeof leg.durationMinutes === 'number' ? `${leg.durationMinutes} min` : (leg.dur || ''));

            const parseStops = (list) => Array.isArray(list)
                ? list.map((st) => {
                    if (typeof st === 'string') return { name: st, time: '' };
                    return {
                        name: st.stationName || st.locationName || st.name || st.n || '',
                        time: st.scheduledTime || st.departureTime || st.time || st.t || ''
                    };
                }).filter((st) => st.name)
                : [];

            const intermediateStops = parseStops(leg.intermediateStops || leg.stops || leg.s);
            const previousStops = parseStops(leg.previousStops || leg.previousCallingPoints || leg.ps);

            const isWalk = mode.includes('WALK') ||
                operatorName.toLowerCase().includes('walk') ||
                (!operatorName && !operatorCode && mode === 'TUBE/WALK');

            return {
                mode,
                isWalk,
                operatorName,
                operatorCode,
                fromName,
                toName,
                departTime,
                arriveTime,
                liveDepartTime,
                liveArriveTime,
                departurePlatform,
                arrivalPlatform,
                destination,
                duration,
                intermediateStops,
                previousStops,
                intermediateCount: leg.intermediateStopCount || intermediateStops.length,
                previousCount: leg.previousStopCount || previousStops.length
            };
        });

        return {
            departureDate: root.departureDate || root.date || root.d || '',
            departTime: root.departTime || root.dep || legs[0].departTime || '--:--',
            arriveTime: root.arriveTime || root.arr || legs[legs.length - 1].arriveTime || '--:--',
            duration: root.duration || root.dur || '',
            lastCheckedLiveTime,
            legs
        };
    }

    function formatHeaderLocation(fullLocation) {
        const clean = (fullLocation || '').trim();
        if (!clean) return 'Unknown location';
        const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
        const shortened = parts.slice(0, 2).join(', ') || clean;
        return titleCaseAllCaps(shortened);
    }

    function titleCaseAllCaps(value) {
        if (value !== value.toUpperCase()) return value;
        return value.replace(/\b[A-Z]{4,}\b/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
    }

    function formatJourneyDate(isoDate) {
        if (!isoDate) return 'Today';
        const parsed = new Date(isoDate);
        if (Number.isNaN(parsed.getTime())) return 'Today';

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const targetStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

        if (targetStart.getTime() === todayStart.getTime()) return 'Today';
        if (targetStart.getTime() === tomorrowStart.getTime()) return 'Tomorrow';

        return parsed.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function formatLastUpdated(rawTime) {
        if (!rawTime) return 'Shared journey snapshot';
        const numeric = Number(rawTime);
        const date = Number.isFinite(numeric) && numeric > 0 ? new Date(numeric) : new Date(rawTime);
        if (Number.isNaN(date.getTime())) return 'Shared journey snapshot';
        return `Last updated: ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }

    function buildWalkTitle(leg) {
        const dur = (leg.duration || '').trim();
        if (!dur) return 'Walk';
        return dur.toLowerCase().startsWith('walk') ? dur : `Walk ${dur}`;
    }

    function buildOsmSearchUrl(from, to) {
        const query = encodeURIComponent(`${from} to ${to}`);
        return `https://www.openstreetmap.org/search?query=${query}`;
    }

    function renderTimeAndStatus(scheduledTime, liveTime) {
        const container = document.createElement('div');
        container.className = 'station-time-col';

        const timeEl = document.createElement('div');
        timeEl.className = 'station-time';
        timeEl.textContent = scheduledTime || '--:--';

        const statusEl = document.createElement('div');
        statusEl.className = 'station-status';

        if (!liveTime || liveTime.toLowerCase() === 'on time' || liveTime === scheduledTime) {
            statusEl.textContent = 'On time';
            statusEl.classList.add('status-ontime');
        } else if (liveTime.toLowerCase() === 'cancelled') {
            timeEl.classList.add('struck');
            statusEl.textContent = 'Cancelled';
            statusEl.classList.add('status-cancelled');
        } else {
            timeEl.classList.add('struck');
            statusEl.textContent = liveTime.startsWith('Exp') ? liveTime : `Exp ${liveTime}`;
            statusEl.classList.add('status-delayed');
        }

        container.appendChild(timeEl);
        container.appendChild(statusEl);
        return container;
    }

    function createWalkCard(leg) {
        const card = document.createElement('div');
        card.className = 'leg-transfer';

        const icon = document.createElement('div');
        icon.className = 'transfer-icon';
        icon.innerHTML = ICONS.walk;

        const title = document.createElement('div');
        title.className = 'transfer-title';
        title.textContent = buildWalkTitle(leg);

        const mapLink = document.createElement('a');
        mapLink.className = 'map-btn';
        mapLink.href = buildOsmSearchUrl(leg.fromName, leg.toName);
        mapLink.target = '_blank';
        mapLink.rel = 'noopener noreferrer';
        mapLink.setAttribute('aria-label', `View walking route from ${leg.fromName} to ${leg.toName}`);
        mapLink.title = 'View route on OpenStreetMap';
        mapLink.innerHTML = ICONS.map;

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(mapLink);
        return card;
    }

    function createChangeCard(stationName, waitMinutes) {
        const card = document.createElement('div');
        card.className = 'leg-change';

        const icon = document.createElement('img');
        icon.className = 'change-icon-img';
        icon.src = './icons/transfer.svg';
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');

        const info = document.createElement('div');
        info.className = 'change-info';

        const title = document.createElement('div');
        title.className = 'change-title';
        title.textContent = `Change at ${formatHeaderLocation(stationName)}`;
        info.appendChild(title);

        if (waitMinutes > 0) {
            const sub = document.createElement('div');
            sub.className = 'change-subtitle';
            sub.textContent = `${waitMinutes} minute${waitMinutes === 1 ? '' : 's'} to change`;
            info.appendChild(sub);
        }

        card.appendChild(icon);
        card.appendChild(info);
        return card;
    }

    function calculateChangeMinutes(arrTimeStr, depTimeStr) {
        if (!arrTimeStr || !depTimeStr || !arrTimeStr.includes(':') || !depTimeStr.includes(':')) return 0;
        const [ah, am] = arrTimeStr.split(':').map(Number);
        const [dh, dm] = depTimeStr.split(':').map(Number);
        if ([ah, am, dh, dm].some(Number.isNaN)) return 0;
        let diff = (dh * 60 + dm) - (ah * 60 + am);
        if (diff < 0) diff += 24 * 60;
        return diff > 0 && diff < 240 ? diff : 0;
    }

    function createTransitLeg(leg, tocs) {
        const brand = resolveBrandForLeg(leg, tocs);
        const wrapper = document.createElement('div');
        wrapper.className = 'leg-transit';

        const header = document.createElement('div');
        header.className = 'transit-header';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'transit-header-left';

        const modeIcon = document.createElement('div');
        modeIcon.className = 'mode-icon';
        modeIcon.innerHTML = leg.mode === 'BUS' ? ICONS.bus : ICONS.train;

        const meta = document.createElement('div');
        meta.className = 'operator-meta';

        const pill = document.createElement('span');
        pill.className = 'toc-pill';
        pill.style.backgroundColor = brand.colour;
        pill.style.color = brand.secondary_colour;
        pill.textContent = leg.operatorName || (leg.mode === 'BUS' ? 'Bus' : 'National Rail');

        const dest = document.createElement('div');
        dest.className = 'train-destination';
        dest.textContent = `to ${leg.destination || leg.toName}`;

        meta.appendChild(pill);
        meta.appendChild(dest);
        headerLeft.appendChild(modeIcon);
        headerLeft.appendChild(meta);
        header.appendChild(headerLeft);

        const managerLogo = createManagerLogo(brand.manager);
        if (managerLogo) {
            header.appendChild(managerLogo);
        }

        wrapper.appendChild(header);

        const timeline = document.createElement('div');
        timeline.className = 'transit-timeline';

        if (leg.previousCount > 0) {
            const prevRow = document.createElement('div');
            prevRow.className = 'timeline-row';

            const gutter = document.createElement('div');
            gutter.className = 'timeline-gutter';
            const topStem = document.createElement('div');
            topStem.className = 'timeline-stem-top';
            topStem.style.backgroundColor = brand.colour;
            gutter.appendChild(topStem);

            const toggleCell = document.createElement('div');
            toggleCell.className = 'stops-toggle-cell';

            if (leg.previousStops.length > 0) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'stops-toggle-btn';
                btn.setAttribute('aria-expanded', 'false');
                btn.innerHTML = `<span>View ${leg.previousCount} station${leg.previousCount === 1 ? '' : 's'} before boarding</span>${ICONS.chevronDown}`;

                const prevList = document.createElement('div');
                prevList.className = 'intermediate-stops hidden';
                leg.previousStops.forEach((st) => {
                    prevList.appendChild(createSubStopRow(st, brand.colour));
                });

                btn.addEventListener('click', () => {
                    const expanded = btn.getAttribute('aria-expanded') === 'true';
                    btn.setAttribute('aria-expanded', String(!expanded));
                    prevList.classList.toggle('hidden', expanded);
                });

                toggleCell.appendChild(btn);
                prevRow.appendChild(gutter);
                prevRow.appendChild(toggleCell);
                timeline.appendChild(prevRow);
                timeline.appendChild(prevList);
            } else {
                const label = document.createElement('span');
                label.className = 'stops-toggle-btn';
                label.style.cursor = 'default';
                label.textContent = `${leg.previousCount} station${leg.previousCount === 1 ? '' : 's'} before boarding`;
                toggleCell.appendChild(label);
                prevRow.appendChild(gutter);
                prevRow.appendChild(toggleCell);
                timeline.appendChild(prevRow);
            }
        }

        const boardRow = document.createElement('div');
        boardRow.className = 'timeline-row';

        const boardGutter = document.createElement('div');
        boardGutter.className = 'timeline-gutter';
        if (leg.previousCount === 0) {
            const stem = document.createElement('div');
            stem.className = 'timeline-stem-top';
            stem.style.backgroundColor = brand.colour;
            boardGutter.appendChild(stem);
        }
        const boardNode = document.createElement('div');
        boardNode.className = 'timeline-node';
        const boardLine = document.createElement('div');
        boardLine.className = 'timeline-line-segment';
        boardGutter.appendChild(boardNode);
        boardGutter.appendChild(boardLine);

        const boardMain = document.createElement('div');
        boardMain.className = 'station-main';
        const boardName = document.createElement('div');
        boardName.className = 'station-name';
        boardName.textContent = leg.fromName;
        boardMain.appendChild(boardName);

        if (leg.departurePlatform) {
            const plat = document.createElement('div');
            plat.className = 'station-platform';
            plat.textContent = `Platform ${leg.departurePlatform}`;
            boardMain.appendChild(plat);
        }

        const boardTimeCol = renderTimeAndStatus(leg.departTime, leg.liveDepartTime);

        boardRow.appendChild(boardGutter);
        boardRow.appendChild(boardMain);
        boardRow.appendChild(boardTimeCol);
        timeline.appendChild(boardRow);

        if (leg.intermediateCount > 0) {
            const midRow = document.createElement('div');
            midRow.className = 'timeline-row';

            const midGutter = document.createElement('div');
            midGutter.className = 'timeline-gutter';
            const midLine = document.createElement('div');
            midLine.className = 'timeline-line-segment';
            midGutter.appendChild(midLine);

            const midCell = document.createElement('div');
            midCell.className = 'stops-toggle-cell';

            if (leg.intermediateStops.length > 0) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'stops-toggle-btn';
                btn.setAttribute('aria-expanded', 'false');
                btn.innerHTML = `<span>View ${leg.intermediateCount} station${leg.intermediateCount === 1 ? '' : 's'}</span>${ICONS.chevronDown}`;

                const stopsList = document.createElement('div');
                stopsList.className = 'intermediate-stops hidden';
                leg.intermediateStops.forEach((st) => {
                    stopsList.appendChild(createSubStopRow(st, null));
                });

                btn.addEventListener('click', () => {
                    const expanded = btn.getAttribute('aria-expanded') === 'true';
                    btn.setAttribute('aria-expanded', String(!expanded));
                    stopsList.classList.toggle('hidden', expanded);
                });

                midCell.appendChild(btn);
                midRow.appendChild(midGutter);
                midRow.appendChild(midCell);
                timeline.appendChild(midRow);
                timeline.appendChild(stopsList);
            } else {
                const label = document.createElement('span');
                label.className = 'stops-toggle-btn';
                label.style.cursor = 'default';
                label.textContent = `${leg.intermediateCount} intermediate station${leg.intermediateCount === 1 ? '' : 's'}`;
                midCell.appendChild(label);
                midRow.appendChild(midGutter);
                midRow.appendChild(midCell);
                timeline.appendChild(midRow);
            }
        }

        const alightRow = document.createElement('div');
        alightRow.className = 'timeline-row';

        const alightGutter = document.createElement('div');
        alightGutter.className = 'timeline-gutter';
        const alightNode = document.createElement('div');
        alightNode.className = 'timeline-node';
        alightGutter.appendChild(alightNode);

        const alightMain = document.createElement('div');
        alightMain.className = 'station-main alighting';
        const alightName = document.createElement('div');
        alightName.className = 'station-name';
        alightName.textContent = leg.toName;
        alightMain.appendChild(alightName);

        if (leg.arrivalPlatform) {
            const plat = document.createElement('div');
            plat.className = 'station-platform';
            plat.textContent = `Platform ${leg.arrivalPlatform}`;
            alightMain.appendChild(plat);
        }

        const alightTimeCol = renderTimeAndStatus(leg.arriveTime, leg.liveArriveTime);
        alightTimeCol.classList.add('alighting');

        alightRow.appendChild(alightGutter);
        alightRow.appendChild(alightMain);
        alightRow.appendChild(alightTimeCol);
        timeline.appendChild(alightRow);

        wrapper.appendChild(timeline);
        return wrapper;
    }

    function createSubStopRow(stop, stemColor) {
        const row = document.createElement('div');
        row.className = 'intermediate-stop-row';

        const gutter = document.createElement('div');
        gutter.className = 'timeline-gutter';
        const dot = document.createElement('div');
        dot.className = 'timeline-node small';
        const line = document.createElement('div');
        line.className = 'timeline-line-segment';
        if (stemColor) line.style.backgroundColor = stemColor;
        gutter.appendChild(dot);
        gutter.appendChild(line);

        const name = document.createElement('div');
        name.className = 'intermediate-stop-name';
        name.textContent = stop.name;

        const time = document.createElement('div');
        time.className = 'intermediate-stop-time';
        time.textContent = stop.time || '';

        row.appendChild(gutter);
        row.appendChild(name);
        row.appendChild(time);
        return row;
    }

    function setLoadingState(isLoading) {
        const loadingCard = document.getElementById('loading-card');
        if (loadingCard) {
            loadingCard.classList.toggle('hidden', !isLoading);
        }
        if (isLoading) {
            document.getElementById('error-banner').classList.add('hidden');
            document.getElementById('summary-card').classList.add('hidden');
            document.getElementById('timeline-card').classList.add('hidden');
            document.getElementById('footer-status').classList.add('hidden');
        }
    }

    function renderJourney(journey, tocs) {
        const primaryBrand = getPrimaryBrand(journey.legs, tocs);
        const topBar = document.getElementById('top-brand-bar');
        const metaTheme = document.getElementById('meta-theme-color');
        if (topBar) topBar.style.backgroundColor = primaryBrand.colour;
        if (metaTheme) metaTheme.setAttribute('content', primaryBrand.colour);

        const origin = journey.legs[0].fromName;
        const destination = journey.legs[journey.legs.length - 1].toName;

        const fromEl = document.getElementById('from-name');
        const toEl = document.getElementById('to-name');
        fromEl.textContent = formatHeaderLocation(origin);
        fromEl.title = origin;
        toEl.textContent = formatHeaderLocation(destination);
        toEl.title = destination;

        document.getElementById('journey-date').textContent = formatJourneyDate(journey.departureDate);

        const parts = [`${journey.departTime} — ${journey.arriveTime}`];
        if (journey.duration) parts.push(journey.duration);
        document.getElementById('journey-summary').textContent = parts.join('  •  ');

        const legsContainer = document.getElementById('legs-container');
        legsContainer.innerHTML = '';

        const isWalkOnly = journey.legs.length === 1 && journey.legs[0].isWalk;
        const timelineHeading = document.getElementById('timeline-heading');
        if (timelineHeading) {
            timelineHeading.textContent = isWalkOnly ? 'Walking route' : 'Journey timeline';
        }

        journey.legs.forEach((leg, index) => {
            if (index > 0) {
                const prevLeg = journey.legs[index - 1];
                if (!prevLeg.isWalk && !leg.isWalk) {
                    const waitMins = calculateChangeMinutes(prevLeg.arriveTime, leg.departTime);
                    legsContainer.appendChild(createChangeCard(leg.fromName, waitMins));
                }
            }

            if (leg.isWalk) {
                legsContainer.appendChild(createWalkCard(leg));
            } else {
                legsContainer.appendChild(createTransitLeg(leg, tocs));
            }
        });

        const footerStatus = document.getElementById('footer-status');
        if (footerStatus) {
            footerStatus.textContent = formatLastUpdated(journey.lastCheckedLiveTime);
            footerStatus.classList.remove('hidden');
        }

        setLoadingState(false);
        document.getElementById('error-banner').classList.add('hidden');
        document.getElementById('summary-card').classList.remove('hidden');
        document.getElementById('timeline-card').classList.remove('hidden');
    }

    function showError(message) {
        setLoadingState(false);
        const banner = document.getElementById('error-banner');
        const msgEl = document.getElementById('error-message');
        if (msgEl) msgEl.textContent = message;
        banner.classList.remove('hidden');
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => toast.classList.remove('visible'), 2600);
    }

    async function renderFromLocation() {
        setLoadingState(true);

        const rawSource = window.location.hash || window.location.search || window.location.href;
        const token = extractPayloadToken(rawSource);

        if (!token) {
            showError('No shared journey data was found in this link. Please open the original link shared from CallingPoint.');
            return;
        }

        try {
            const [tocs, decoded] = await Promise.all([
                loadTocs(),
                decodeGzipBase64Url(token)
            ]);
            const normalized = normalizeJourney(decoded);
            renderJourney(normalized, tocs);
        } catch (err) {
            showError(`Unable to load shared journey: ${err.message}`);
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const shareBtn = document.getElementById('btn-share');
        if (shareBtn) {
            shareBtn.addEventListener('click', async () => {
                const shareUrl = window.location.href;
                try {
                    if (navigator.share) {
                        await navigator.share({ title: 'CallingPoint Shared Journey', url: shareUrl });
                    } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(shareUrl);
                        showToast('Journey link copied to clipboard');
                    }
                } catch (_) {
                    showToast('Unable to copy link');
                }
            });
        }

        await renderFromLocation();
        window.addEventListener('hashchange', renderFromLocation);
    });
})();