import { areCodecsEqual, getCodecsFromSection, splitSdpToSections, joinSplittedSdp } from './utils.js';

const preferenceKey = typeof Symbol === 'function' ? Symbol.for('[[PreferredCodecs]]') : '[[PreferredCodecs]]';

/**
 * @param {RTCRtpCodecCapability[]} codecs
 */
function setCodecPreferences(codecs) {
    if (arguments.length === 0) {
        throw new TypeError(`Failed to execute 'setCodecPreferences' on '${this.name}': At least 1 argument required, but only 0 passed`);
    }

    if (codecs.length === 0) {
        delete this[preferenceKey];
        return;
    }

    // TODO add validation
    Object.defineProperty(this, preferenceKey, { value: codecs, enumerable: false });
}

/**
 * @param {string[]} sdpSection
 * @param {string[]} deletedCodecIds
 * @returns {*}
 */
function dropCodecsFromSection(sdpSection, deletedCodecIds) {
    const checkAttribute = /^a=([\w\-]+):(\d+)\b/;

    return sdpSection.filter(line => {
        const match = line.match(checkAttribute);
        if (!match || (match[1] !== 'rtpmap' && match[1] !== 'fmtp' && match[1] !== 'rtcp-fb')) return true;

        return !deletedCodecIds.includes(match[2]);
    });
}

/**
 * @param {RTCSessionDescription} description
 * @returns {RTCSessionDescription}
 */
function adjustDescription(description) {
    if (description.type === 'rollback') return  description;

    /** @this {RTCPeerConnection} */
    const transceivers = this.getTransceivers();
    if (transceivers.every(transceiver => !transceiver.hasOwnProperty(preferenceKey))) {
        return description;
    }

    const mangledSdp = splitSdpToSections(description.sdp);
    let counter = 0;
    mangledSdp.forEach((section, i) => {
        if (!section[0].startsWith('m=audio ') && !section[0].startsWith('m=video ')) return;
        if (!transceivers[counter] || !transceivers[counter].hasOwnProperty(preferenceKey)) return;

        const preferredCodecs = transceivers[counter][preferenceKey];
        const codecs = getCodecsFromSection(section);

        const matchedCodecs = codecs.map(
            ([codecId, codecInfo]) =>
                [codecId, codecInfo, preferredCodecs.findIndex(
                    preferredCodec => areCodecsEqual(codecInfo, preferredCodec)
                )]
        );

        const codecsLeft = matchedCodecs.filter(codecEntry => codecEntry[2] !== -1);
        codecsLeft.sort((a, b) => a[2] - b[2]);

        const codecIdsToWrite = codecsLeft.map(([id]) => id);
        const [kind , port, proto] = section[0].split(' ');
        section[0] = [kind, port, proto, ...codecIdsToWrite].join(' ');

        const deletedCodecIds = matchedCodecs
            .filter(codecEntry => codecEntry[2] === -1)
            .map(([id]) => id);
        mangledSdp[i] = dropCodecsFromSection(section, deletedCodecIds);

        counter++;
    });

    return new RTCSessionDescription({
        type: description.type,
        sdp: joinSplittedSdp(mangledSdp)
    });
}

const createWrapped = wrappedCall => function(...args) {
    /** @this {RTCPeerConnection} */
    if (args.length > 0 && typeof args[0] === 'function') {
        return wrappedCall.call(this, function(description) {
            args[0](adjustDescription.call(this, description));
        }, ...args.slice(1));
    } else {
        return wrappedCall.call(this, ...args).then(
            description => adjustDescription.call(this, description)
        );
    }
}

if (
    typeof RTCPeerConnection === 'function' &&
    typeof RTCRtpTransceiver === 'function' &&
    typeof RTCRtpTransceiver.prototype.setCodecPreferences !== 'function'
) {
    RTCRtpTransceiver.prototype.setCodecPreferences = setCodecPreferences;
    RTCPeerConnection.prototype.createOffer = createWrapped(RTCPeerConnection.prototype.createOffer);
    RTCPeerConnection.prototype.createAnswer = createWrapped(RTCPeerConnection.prototype.createAnswer);
}
