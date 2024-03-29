import {
    getUuidV4,
    areCodecsEqual,
    joinSplittedSdp,
    splitSdpToSections,
    getCodecsFromSection
} from '../src/utils';

describe('getUuidV4', function () {
    it('should get uuid v4', function () {
        expect(getUuidV4()).toBeDefined();
        expect(getUuidV4().length).toBe(36);
    });
});

describe('areCodecsEqual', function () {
    it('should be equal if mimeType case is the same or different', function () {
        const codec1 = { clockRate: 90000, mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0' };
        const codec1a = { clockRate: 90000, mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0' };
        const codec2 = { clockRate: 90000, mimeType: 'video/vp9', sdpFmtpLine: 'profile-id=0' };
        expect(areCodecsEqual(codec1, codec2)).toBeTruthy();
        expect(areCodecsEqual(codec1, codec1a)).toBeTruthy();
        expect(areCodecsEqual(codec1, codec1)).toBeTruthy();
    });

    it('should be different if attributes differ', function () {
        const codec1 = { clockRate: 90000, mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0' };
        const codec2 = { clockRate: 90000, mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=1' };
        expect(areCodecsEqual(codec1, codec2)).toBeFalsy();
    });

    it('should be different if attributes count differ', function () {
        const codec1 = { clockRate: 90000, mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0', channels: 1 };
        const codec2 = { clockRate: 90000, mimeType: 'video/VP9', sdpFmtpLine: 'profile-id=0' };
        expect(areCodecsEqual(codec1, codec2)).toBeFalsy();
    });
});

const simpleSdp = 'v=0\r\nm=audio\r\na=msid:1\r\nm=video\r\na=msid:2\r\n';

describe('joinSplittedSdp', function () {
    it('should return empty on empty input', function () {
        expect(joinSplittedSdp([])).toBe('');
    });

    it('should get valid output for sections', function () {
        expect(joinSplittedSdp([['v=0'], ['m=audio', 'a=msid:1'], ['m=video', 'a=msid:2']]))
            .toBe(simpleSdp);
    });
});

describe('splitSdpToSections', function () {
    it('should return empty array on empty SDP', function () {
        expect(splitSdpToSections('').length).toBe(0);
    });

    it('should get proper amount of sections on SDP', function () {
        const res = splitSdpToSections(simpleSdp);
        console.log(res);
        expect(res.length).toBe(3);
        expect(res[0].length).toBe(1);
        expect(res[1].length).toBe(2);
        expect(res[1][0]).toBe('m=audio');
        expect(res[2].length).toBe(2);
        expect(res[2][0]).toBe('m=video');
    });
});

const sdpVideo = "v=0\r\no=- 4837610254693835119 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 102 122 127 121 125 107 108 109 124 120 39 40 45 46 98 99 100 101 123 119 114 115 116\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:E3XY\r\na=ice-pwd:AVEvOrfCUuAwmDEAHUCYPO/1\r\na=ice-options:trickle\r\na=fingerprint:sha-256 2D:B3:8F:E0:E0:6F:73:EA:0D:AC:40:FA:23:74:94:E6:22:34:FC:F2:40:AF:FA:EC:20:D4:39:A9:42:06:10:96\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 urn:3gpp:video-orientation\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=sendrecv\r\na=msid:- 22f0fa9a-a4f9-4dd9-988f-5310583cca57\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 VP8/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:102 H264/90000\r\na=rtcp-fb:102 goog-remb\r\na=rtcp-fb:102 transport-cc\r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack\r\na=rtcp-fb:102 nack pli\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtpmap:122 rtx/90000\r\na=fmtp:122 apt=102\r\na=rtpmap:127 H264/90000\r\na=rtcp-fb:127 goog-remb\r\na=rtcp-fb:127 transport-cc\r\na=rtcp-fb:127 ccm fir\r\na=rtcp-fb:127 nack\r\na=rtcp-fb:127 nack pli\r\na=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r\na=rtpmap:121 rtx/90000\r\na=fmtp:121 apt=127\r\na=rtpmap:125 H264/90000\r\na=rtcp-fb:125 goog-remb\r\na=rtcp-fb:125 transport-cc\r\na=rtcp-fb:125 ccm fir\r\na=rtcp-fb:125 nack\r\na=rtcp-fb:125 nack pli\r\na=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:107 rtx/90000\r\na=fmtp:107 apt=125\r\na=rtpmap:108 H264/90000\r\na=rtcp-fb:108 goog-remb\r\na=rtcp-fb:108 transport-cc\r\na=rtcp-fb:108 ccm fir\r\na=rtcp-fb:108 nack\r\na=rtcp-fb:108 nack pli\r\na=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r\na=rtpmap:109 rtx/90000\r\na=fmtp:109 apt=108\r\na=rtpmap:124 H264/90000\r\na=rtcp-fb:124 goog-remb\r\na=rtcp-fb:124 transport-cc\r\na=rtcp-fb:124 ccm fir\r\na=rtcp-fb:124 nack\r\na=rtcp-fb:124 nack pli\r\na=fmtp:124 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r\na=rtpmap:120 rtx/90000\r\na=fmtp:120 apt=124\r\na=rtpmap:39 H264/90000\r\na=rtcp-fb:39 goog-remb\r\na=rtcp-fb:39 transport-cc\r\na=rtcp-fb:39 ccm fir\r\na=rtcp-fb:39 nack\r\na=rtcp-fb:39 nack pli\r\na=fmtp:39 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=4d001f\r\na=rtpmap:40 rtx/90000\r\na=fmtp:40 apt=39\r\na=rtpmap:45 AV1/90000\r\na=rtcp-fb:45 goog-remb\r\na=rtcp-fb:45 transport-cc\r\na=rtcp-fb:45 ccm fir\r\na=rtcp-fb:45 nack\r\na=rtcp-fb:45 nack pli\r\na=rtpmap:46 rtx/90000\r\na=fmtp:46 apt=45\r\na=rtpmap:98 VP9/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 profile-id=0\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:100 VP9/90000\r\na=rtcp-fb:100 goog-remb\r\na=rtcp-fb:100 transport-cc\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 nack pli\r\na=fmtp:100 profile-id=2\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:123 H264/90000\r\na=rtcp-fb:123 goog-remb\r\na=rtcp-fb:123 transport-cc\r\na=rtcp-fb:123 ccm fir\r\na=rtcp-fb:123 nack\r\na=rtcp-fb:123 nack pli\r\na=fmtp:123 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\na=rtpmap:119 rtx/90000\r\na=fmtp:119 apt=123\r\na=rtpmap:114 red/90000\r\na=rtpmap:115 rtx/90000\r\na=fmtp:115 apt=114\r\na=rtpmap:116 ulpfec/90000\r\na=ssrc-group:FID 3274292217 742541381\r\na=ssrc:3274292217 cname:X/GbGIb1g01jpj9R\r\na=ssrc:3274292217 msid:- 22f0fa9a-a4f9-4dd9-988f-5310583cca57\r\na=ssrc:742541381 cname:X/GbGIb1g01jpj9R\r\na=ssrc:742541381 msid:- 22f0fa9a-a4f9-4dd9-988f-5310583cca57\r\n";
const sdpAudio = "v=0\r\no=- 7237872714077063296 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 103 104 9 0 8 106 105 13 110 112 113 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:Evjt\r\na=ice-pwd:zQaEHOqqQsIWQj09hh0YtwtG\r\na=ice-options:trickle\r\na=fingerprint:sha-256 34:55:DC:5F:B3:BD:B7:3A:F8:31:AB:0F:45:1C:DE:65:8D:9B:4A:00:4A:A8:4C:6B:7F:87:56:D3:BA:2E:2B:AD\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=sendrecv\r\na=msid:- 93f794a9-20f0-42d1-8c99-b7900a170948\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:9 G722/8000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:110 telephone-event/48000\r\na=rtpmap:112 telephone-event/32000\r\na=rtpmap:113 telephone-event/16000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:295951551 cname:pCTmUEYfDCP7HTZ6\r\na=ssrc:295951551 msid:- 93f794a9-20f0-42d1-8c99-b7900a170948\r\n";

describe('getCodecsFromSection', function () {
    it('should not output anything for common or empty section', function () {
        expect(getCodecsFromSection([]).length).toBe(0);
        expect(getCodecsFromSection(['v=0']).length).toBe(0);
    });

    it('should get video codecs', function () {
        const sections = splitSdpToSections(sdpVideo);
        const res = getCodecsFromSection(sections[1]);
        expect(res.length).toBe(25);
        const av1codec = res.find(([id]) => id === '45')?.[1];
        expect(av1codec.mimeType).toBe('video/AV1');
        expect(av1codec.clockRate).toBe(90000);
        expect(av1codec.channels).toBeUndefined();
        expect(av1codec.sdpFmtpLine).toBeUndefined();
        const av1RtxCodec = res.find(([id]) => id === '46')?.[1];
        expect(av1RtxCodec.mimeType).toBe('video/rtx');
        expect(av1RtxCodec.sdpFmtpLine).toBe('apt=45');
    });

    it('should get audio codecs', function () {
        const sections = splitSdpToSections(sdpAudio);
        const res = getCodecsFromSection(sections[1]);
        expect(res.length).toBe(14);
        expect(res.every(([, codecInfo]) => !!codecInfo.channels)).toBeTruthy();
        const redCodec = res.find(([id]) => id === '63')?.[1];
        expect(redCodec.mimeType).toBe('audio/red');
        expect(redCodec.clockRate).toBe(48000);
        expect(redCodec.channels).toBe(2);
        expect(redCodec.sdpFmtpLine).toBe('111/111');
        const pcmuCodec = res.find(([id]) => id === '0')?.[1];
        expect(pcmuCodec.mimeType).toBe('audio/PCMU');
        expect(pcmuCodec.clockRate).toBe(8000);
        expect(pcmuCodec.channels).toBe(1);
        expect(pcmuCodec.sdpFmtpLine).toBeUndefined();
    });
});
