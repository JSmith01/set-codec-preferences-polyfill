import {
    areCodecsEqual,
    getCodecsFromSection,
    getUuidV4,
    joinSplittedSdp,
    splitSdpToSections,
} from './utils.js';

const preferenceKey = typeof Symbol === 'function' ? Symbol.for('[[PreferredCodecs]]') : '[[PreferredCodecs]]';
const streamsKey = typeof Symbol === 'function' ? Symbol.for('[[AssociatedMediaStreamIds]]') : '[[AssociatedMediaStreamIds]]';

/**
 * @this {RTCRtpTransceiver}
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
 * @this {RTCRtpSender}
 * @param {MediaStream} streams
 */
function setStreams(...streams) {
    const incorrectInput = streams.findIndex(stream => !stream instanceof MediaStream);
    if (streams.length > 0 && incorrectInput !== -1) {
        throw new TypeError(`Failed to execute 'setStreams' on 'RTCRtpSender': parameter ${incorrectInput} is not of type 'MediaStream'`);
    }

    if (streams.length > 0) {
        Object.defineProperty(this, streamsKey, { value: streams.map(stream => stream.id), enumerable: false });
    } else {
        Object.defineProperty(this, streamsKey, { value: [], enumerable: false });
    }
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
 * @param {string[]} section
 * @param {RTCRtpCodecCapability[]} preferredCodecs
 */
function alterCodecs(section, preferredCodecs) {
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
    const [kind, port, proto] = section[0].split(' ');
    section[0] = [kind, port, proto, ...codecIdsToWrite].join(' ');

    const deletedCodecIds = matchedCodecs
        .filter(codecEntry => codecEntry[2] === -1)
        .map(([id]) => id);

    return dropCodecsFromSection(section, deletedCodecIds);
}

/**
 * @param {string[]} section
 * @param {string[]} streamIds
 * @param {string} trackId
 */
function alterStreamIds(section, streamIds, trackId) {
    let existingMsidLineIdx = section.findIndex(line => line.startsWith('a=msid:'));
    let newTrackId = trackId;
    if (existingMsidLineIdx === -1) {
        existingMsidLineIdx = section.length;
    } else {
        const attrLine = section[existingMsidLineIdx].split(' ');
        newTrackId = attrLine[1] ?? trackId;
    }

    const newMsidLines = (streamIds.length > 0 ? streamIds : ['-'])
        .map(streamId => `a=msid:${streamId} ${newTrackId}`);

    const result = section.filter(line => !line.startsWith('a=msid:'));

    result.splice(existingMsidLineIdx, 0, ...newMsidLines);

    return result;
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
        const transceiver = transceivers[counter];
        if (!transceiver) return;

        if (transceiver.hasOwnProperty(preferenceKey)) {
            const preferredCodecs = transceiver[preferenceKey];
            mangledSdp[i] = alterCodecs(section, preferredCodecs);
        }

        if (transceiver.sender?.hasOwnProperty(streamsKey)) {
            const streamIds = transceiver.sender[streamsKey];
            mangledSdp[i] = alterStreamIds(
                mangledSdp[i],
                streamIds,
                transceiver.sender.track?.id ?? getUuidV4()
            );
        }

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
    (typeof RTCRtpTransceiver.prototype.setCodecPreferences !== 'function' ||
        typeof RTCRtpSender.prototype.setStreams !== 'function')
) {
    if (typeof RTCRtpTransceiver.prototype.setCodecPreferences !== 'function') {
        RTCRtpTransceiver.prototype.setCodecPreferences = setCodecPreferences;
    }
    if (typeof RTCRtpSender.prototype.setStreams !== 'function') {
        RTCRtpSender.prototype.setStreams = setStreams;
    }
    RTCPeerConnection.prototype.createOffer = createWrapped(RTCPeerConnection.prototype.createOffer);
    RTCPeerConnection.prototype.createAnswer = createWrapped(RTCPeerConnection.prototype.createAnswer);
}
