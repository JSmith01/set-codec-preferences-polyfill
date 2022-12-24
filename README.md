# Polyfills to allow a browser to use `RTCRtpTransceiver.prototype.setCodecPreferences()`

The spec: https://w3c.github.io/webrtc-pc/#dom-rtcrtptransceiver-setcodecpreferences

The polyfill is tested against Firefox that is the only modern browser that doesn't support the API.
Safari claims to support it but recognizes codec configuration objects only from what it provides
via `getCapabilities` call.


## RTCRtpSender.getCapabilities / RTCRtpReceiver.getCapabilities

To allow a browser to use `RTCRtpTransceiver.prototype.setCodecPreferences` it should also
allow to get capabilities. Unfortunately the polyfill requires to complete a promise for its
initialization. So if you need to run some code immediately on a startup please check
`window.__RTCRtpTransceiverGetCapabilitiesInit`. If it's a promise you have to wait until
it fulfills. The value of `window.__RTCRtpTransceiverGetCapabilitiesInit` is set to `true`
after the promise fulfills. However, most of the time this polyfill behaves like
a synchronous API as it should.

An article to read about API:
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender/getCapabilities
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpReceiver/getCapabilities


## RTCRtpTransceiver.prototype.setCodecPreferences

Should work as specified. Needs for `getCapabilities` API to be already available before
the first call, otherwise it won't check if provided codecs list is fine or not.
Some issues might occur with a resulting SDP if RTX is removed from the offer/answer. A browser
tries to create SSRC and ssrc group for a section track and a RTX for it. Polyfill would remove
the codec information only, and won't touch nor additional SSRC neither ssrc-group attribute.
