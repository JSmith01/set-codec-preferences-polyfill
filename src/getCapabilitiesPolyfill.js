import { getCodecsFromSection, splitSdpToSections } from './utils.js';

/**
 * @param {string[]} section
 * @returns {RTCRtpHeaderExtensionCapability[]}
 */
function getExtensions(section) {
    return section.filter(line => line.startsWith('a=extmap:'))
        .map(line => {
            const [rawId, uri] = line.slice(line.indexOf(':') + 1).split(' ');
            const [, direction] = rawId.split('/');
            return { direction: direction || 'sendrecv', uri };
        });
}

/**
 * @param {'audio' | 'video'} kind
 * @returns {Promise<RTCRtpCapabilities>}
 */
function findCapabilities(kind) {
    const pc = new RTCPeerConnection();
    pc.addTransceiver(kind);
    return pc.createOffer().then(offer => {
        const sections = splitSdpToSections(offer.sdp);

        return {
            codecs: getCodecsFromSection(sections[1] || []).map(([, v]) => v),
            headerExtensions: getExtensions(sections[1] || [])
        };
    })
}

/**
 * @returns {Promise<{getCapabilitiesReceiver: Function, getCapabilitiesSender: Function}>}
 */
function initGetCapabilities() {
    return Promise.all([
        findCapabilities('audio'),
        findCapabilities('video'),
    ]).then (([capabilitiesAudio, capabilitiesVideo]) => {
        const makeGetCapabilities = isSender => function getCapabilities(kind) {
            if (arguments.length === 0) {
                throw new TypeError(`Failed to execute 'getCapabilities' on '${this.name}': At least 1 argument required, but only 0 passed`);
            }
            if (kind !== 'audio' && kind !== 'video') return null;

            const capabilities = kind === 'audio' ? capabilitiesAudio : capabilitiesVideo;
            const onlyDirection = isSender ? 'sendonly' : 'recvonly';

            return {
                codecs: capabilities.codecs,
                headerExtensions: capabilities.headerExtensions.filter(
                    ext => ext.direction === 'sendrecv' || ext.direction === onlyDirection
                )
            };
        };

        return {
            getCapabilitiesSender: makeGetCapabilities(true),
            getCapabilitiesReceiver: makeGetCapabilities(false),
        };
    });
}

if (
    typeof window === 'object' &&
    typeof RTCRtpSender === 'function' && (
        typeof RTCRtpSender.getCapabilities !== 'function' ||
        typeof RTCRtpReceiver.getCapabilities !== 'function'
    )
) {
    if (!window.__RTCRtpTransceiverGetCapabilitiesInit) {
        window.__RTCRtpTransceiverGetCapabilitiesInit = initGetCapabilities().then(data => {
            window.__RTCRtpTransceiverGetCapabilitiesInit = true;
            if (typeof RTCRtpSender.getCapabilities !== 'function') {
                Object.defineProperty(RTCRtpSender, 'getCapabilities', { value: data.getCapabilitiesSender });
            }
            if (typeof RTCRtpReceiver.getCapabilities !== 'function') {
                Object.defineProperty(RTCRtpReceiver, 'getCapabilities', { value: data.getCapabilitiesReceiver });
            }
        });
    }
}
