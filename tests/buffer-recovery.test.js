const test = require('node:test');
const assert = require('node:assert/strict');
const addBufferRecovery = require('../assets/js/buffer-recovery.js');

function withFakeTimers(runTest) {
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    let now = 0;
    let nextTimerId = 1;
    const timers = new Map();

    global.setTimeout = function (callback, delay) {
        const timerId = nextTimerId++;
        timers.set(timerId, { callback, dueAt: now + delay });
        return timerId;
    };
    global.clearTimeout = function (timerId) {
        timers.delete(timerId);
    };

    function advance(milliseconds) {
        const targetTime = now + milliseconds;
        while (true) {
            const nextTimer = [...timers.entries()]
                .filter(([, timer]) => timer.dueAt <= targetTime)
                .sort((first, second) => first[1].dueAt - second[1].dueAt)[0];
            if (!nextTimer) {
                break;
            }
            const [timerId, timer] = nextTimer;
            timers.delete(timerId);
            now = timer.dueAt;
            timer.callback();
        }
        now = targetTime;
    }

    try {
        runTest(advance);
    } finally {
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
    }
}

function createVideo() {
    const listeners = new Map();
    const video = {
        currentTime: 0,
        currentSrc: 'https://example.test/clip-720.mp4',
        src: 'https://example.test/clip-720.mp4',
        paused: false,
        ended: false,
        isConnected: true,
        readyState: 1,
        networkState: 2,
        buffered: { length: 0, end: () => 0 },
        seekable: { length: 0 },
        loadCount: 0,
        addEventListener(name, handler) {
            if (!listeners.has(name)) {
                listeners.set(name, new Set());
            }
            listeners.get(name).add(handler);
        },
        removeEventListener(name, handler) {
            listeners.get(name)?.delete(handler);
        },
        dispatch(name) {
            for (const handler of [...(listeners.get(name) || [])]) {
                handler();
            }
        },
        load() {
            this.loadCount++;
            this.dispatch('loadedmetadata');
        },
        play() {
            return Promise.resolve();
        }
    };
    return video;
}

test('does not recover during a long initial download, then recovers a later stall', () => {
    withFakeTimers((advance) => {
        const video = createVideo();
        const stopRecovery = addBufferRecovery(video, 'https://example.test/clip-480.mp4');

        video.dispatch('waiting');
        advance(10000);
        assert.equal(video.loadCount, 0);

        video.dispatch('playing');
        video.dispatch('waiting');
        advance(3000);
        assert.equal(video.src, 'https://example.test/clip-480.mp4');
        assert.equal(video.loadCount, 1);

        stopRecovery();
    });
});

test('waits while the buffered range is growing and recovers after it stops', () => {
    withFakeTimers((advance) => {
        const video = createVideo();
        let bufferedEnd = 5;
        video.buffered = { length: 1, end: () => bufferedEnd };
        const stopRecovery = addBufferRecovery(video, 'https://example.test/clip-480.mp4');

        video.dispatch('playing');
        video.dispatch('waiting');
        bufferedEnd = 7;
        advance(3000);
        assert.equal(video.loadCount, 0);

        advance(3000);
        assert.equal(video.src, 'https://example.test/clip-480.mp4');
        assert.equal(video.loadCount, 1);

        stopRecovery();
    });
});

test('cleanup cancels a pending recovery', () => {
    withFakeTimers((advance) => {
        const video = createVideo();
        const stopRecovery = addBufferRecovery(video, 'https://example.test/clip-480.mp4');

        video.dispatch('playing');
        video.dispatch('waiting');
        stopRecovery();
        advance(3000);

        assert.equal(video.loadCount, 0);
    });
});