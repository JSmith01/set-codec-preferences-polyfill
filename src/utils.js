/**
 * @param {'audio' | 'video'} kind
 * @param {string} line
 * @returns {[string, RTCRtpCodecCapability]}
 */
function parseRtpmapLine(kind, line) {
    const [id, codecName] = line.slice(line.indexOf(':') + 1).split(' ');
    const [codec, clockRate, channels] = codecName.split('/');
    const codecInfo = Object.assign({
        mimeType: kind + '/' + codec,
        clockRate: Number(clockRate),
    }, kind === 'audio' ? { channels: channels > 0 ? Number(channels) : 1 } : {});

    return [id, codecInfo];
}

/**
 * @param {string[]} section
 * @returns {[id: string, codecInfo: RTCRtpCodecCapability][]}
 */
function getCodecsFromSection(section) {
    if (!section[0]?.startsWith('m=')) return [];

    const [kind , , , ...codecIds] = section[0].slice(section[0].indexOf('=') + 1).split(' ');

    const codecsMap = new Map(
        section.filter(line => line.startsWith('a=rtpmap:')).map(line => parseRtpmapLine(kind, line))
    );

    section.filter(line => line.startsWith('a=fmtp:')).forEach(
        fmtp => {
            const [id, ...sdpFmtpLine] = fmtp.slice(fmtp.indexOf(':') + 1).split(' ');
            const codecInfo = codecsMap.get(id);
            if (codecInfo) {
                codecInfo.sdpFmtpLine = sdpFmtpLine.join(' ');
            }
        }
    );

    return codecIds.map(id => [id, codecsMap.get(id)]);
}

/**
 * @param {string} sdp
 * @returns {string[][]}
 */
function splitSdpToSections(sdp) {
    const sections = sdp.split(/^m=/m);

    return sections.map((section, i) =>
        section.split('\n').map(
            (line, j) => (i > 0 && j === 0 ? 'm=' + line : line).trim()
        ).filter(Boolean)
    ).filter(section => section.length > 0);
}

/**
 * @param o1
 * @param o2
 * @returns {boolean}
 */
function shallowEqualObjects(o1, o2) {
    if (typeof o1 !== 'object' || o1 === null || typeof o2 !== 'object' || o2 === null) {
        return o1 === o2;
    }

    const keys1 = Object.keys(o1);
    if (Object.keys(o2).length !== keys1.length) return false;

    return keys1.every(key => o2.hasOwnProperty(key) && o2[key] === o1[key]);
}

/**
 * @param {RTCRtpCodecCapability} c1
 * @param {RTCRtpCodecCapability} c2
 * @returns {boolean}
 */
function areCodecsEqual(c1, c2) {
    return shallowEqualObjects(
        {...c1, mimeType: c1.mimeType.toLowerCase() },
        {...c2, mimeType: c2.mimeType.toLowerCase() }
    );
}

/**
 * @param {string[][]} splittedSdp
 * @returns {string}
 */
function joinSplittedSdp(splittedSdp) {
    return splittedSdp.map(lines => lines.join('\r\n') + '\r\n').join('');
}

const getTwoBytes = () => (Math.random() * 65536 | 0).toString(16).padStart(4, '0');
const getUuidV4 = () => [
    getTwoBytes() + getTwoBytes(),
    getTwoBytes(),
    getTwoBytes(),
    getTwoBytes(),
    getTwoBytes() + getTwoBytes() + getTwoBytes()
].join('-');

export { splitSdpToSections, getCodecsFromSection, joinSplittedSdp, areCodecsEqual, getUuidV4 };
