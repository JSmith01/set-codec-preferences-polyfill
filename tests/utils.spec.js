import { getUuidV4, areCodecsEqual, joinSplittedSdp, splitSdpToSections } from '../src/utils';

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
