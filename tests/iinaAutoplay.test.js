const test = require("node:test");
const assert = require("node:assert/strict");
const { buildIinaAutoplayUrl } = require("../src/modules/iinaAutoplay");

const hash = "0123456789abcdef0123456789abcdef01234567";
const stream = `http://127.0.0.1:8090/stream/S01E03.mkv?link=${hash}&index=3&play`;

test("rewrites a selected episode into a playlist from its index", () => {
  const result = buildIinaAutoplayUrl(
    `iina://weblink?url=${encodeURIComponent(stream)}`,
  );
  assert.equal(
    new URL(result).searchParams.get("url"),
    `http://127.0.0.1:8090/playlist/episodes.m3u?hash=${hash}&index=3`,
  );
});

test("preserves server port and IINA-specific query parameters", () => {
  const source = `iina://weblink?url=${encodeURIComponent(stream.replace(":8090", ":9000"))}&new_window=1`;
  const result = new URL(buildIinaAutoplayUrl(source));
  assert.equal(result.searchParams.get("new_window"), "1");
  assert.ok(
    result.searchParams
      .get("url")
      .startsWith("http://127.0.0.1:9000/playlist/"),
  );
});

test("leaves regular online video alone", () => {
  assert.equal(
    buildIinaAutoplayUrl(
      "iina://weblink?url=https%3A%2F%2Fexample.com%2Fmovie.mp4",
    ),
    null,
  );
});

test("leaves other players and other IINA actions alone", () => {
  assert.equal(
    buildIinaAutoplayUrl(
      `vlc://weblink?url=${encodeURIComponent(stream)}`,
    ),
    null,
  );
  assert.equal(
    buildIinaAutoplayUrl(
      `iina://open?url=${encodeURIComponent(stream)}`,
    ),
    null,
  );
});

test("requires valid torrent hash and file index", () => {
  assert.equal(
    buildIinaAutoplayUrl(
      `iina://weblink?url=${encodeURIComponent(stream.replace("&index=3", ""))}`,
    ),
    null,
  );
  assert.equal(
    buildIinaAutoplayUrl(
      `iina://weblink?url=${encodeURIComponent(stream.replace(hash, "invalid"))}`,
    ),
    null,
  );
});

test("returns null on malformed input", () => {
  assert.equal(buildIinaAutoplayUrl("not a url"), null);
  assert.equal(buildIinaAutoplayUrl("iina://weblink?url=%not-url"), null);
});

test("does not replace a GStreamer HLS manifest", () => {
  assert.equal(
    buildIinaAutoplayUrl(
      `iina://weblink?url=${encodeURIComponent(`http://localhost:8090/gst/${hash}/master.m3u8?index=3`)}`,
    ),
    null,
  );
});
