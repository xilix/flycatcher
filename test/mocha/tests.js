var assert = require("assert");
var CACHE = require("../../lib/flycatcher");

describe("CACHE", function () {
  describe("LRU", function () {
    describe("Add new elements if it don't exist", function() {
      var lruCache = new CACHE.generic({
        proxy: function (data, reg) { return data.id === reg.id; },
        maxSize: 3,
        evictionStrategy: {
          metric: function () { return new Date().getTime(); }
        }
      }); 
      lruCache.update({id: 2, val: "a"});
      lruCache.update({id: 1, val: "b"});
      lruCache.update({id: 3, val: "c"});
      it("First not modified", function () {
        assert.deepEqual(lruCache.cache[0], {id: 2, val: "a"});
      });
      it("Second not modified", function () {
        assert.deepEqual(lruCache.cache[1], {id: 1, val: "b"});
      });
      it("Third inserted", function () {
        assert.deepEqual(lruCache.cache[2], {id: 3, val: "c"});
      });
      it("First not modified", function () {
        assert.deepEqual(lruCache.cache[lruCache.hash[0].cacheIndex].val, "a");
      });
      it("Second not modified", function () {
        assert.deepEqual(lruCache.cache[lruCache.hash[1].cacheIndex].val, "b");
      });
      it("Third inserted", function () {
        assert.deepEqual(lruCache.cache[lruCache.hash[2].cacheIndex].val, "c");
      });
      it("there is no mememory leak", function () {
        assert.deepEqual(lruCache.cache.length, lruCache.hash.length);
      });
    });
    describe( "Update an existent element", function() {
      var lruCache = new CACHE.generic({
        proxy: function (data, reg) { return data.id === reg.id; },
        maxSize: 3,
        evictionStrategy: {
          metric: function () { return new Date().getTime(); }
        }
      }); 
      lruCache.update({id: 2, val: "a"});
      lruCache.update({id: 1, val: "b"});
      lruCache.update({id: 3, val: "c"});

      it("First not modified", function (done) {
        setTimeout(function() {
          lruCache.update({id: 1, val: "x"});
          assert.deepEqual(lruCache.cache[0], {id: 2, val: "a"});
          done();
        }, 5);
      });
      it("Second modified", function (done) {
        setTimeout(function() {
          lruCache.update({id: 1, val: "x"});
          assert.deepEqual(lruCache.cache[1], {id: 1, val: "x"});
          done();
        }, 5);
      });
      it("Third not modified", function (done) {
        setTimeout(function() {
          lruCache.update({id: 1, val: "x"});
          assert.deepEqual(lruCache.cache[2], {id: 3, val: "c"});
          done();
        }, 5);
      });
      it("a the first to be inserted", function (done) {
        setTimeout(function() {
          lruCache.update({id: 1, val: "x"});
          assert.deepEqual(lruCache.cache[lruCache.hash[0].cacheIndex].val, "a");
          done();
        }, 5);
      });
      it("c the last to be inserted but not the recentest", function (done) {
        setTimeout(function() {
          lruCache.update({id: 1, val: "x"});
          assert.deepEqual(lruCache.cache[lruCache.hash[1].cacheIndex].val, "c");
          done();
        }, 5);
      });
      it("former b now x is the recentest", function (done) {
        setTimeout(function() {
          lruCache.update({id: 1, val: "x"});
          assert.deepEqual(lruCache.cache[lruCache.hash[2].cacheIndex].val, "x");
          done();
        }, 5);
      });
    });
    describe( "Add a new element that makes the cache to overflow", function() {
      var lruCache = new CACHE.generic({
        proxy: function (data, reg) { return data.id === reg.id; },
        maxSize: 3,
        evictionStrategy: {
          metric: function () { return new Date().getTime(); }
        }
      }); 
      setTimeout(function() { lruCache.update({id: 2, val: "a"}); }, 1);
      setTimeout(function() { lruCache.update({id: 1, val: "b"}); }, 2);
      setTimeout(function() { lruCache.update({id: 3, val: "c"}); }, 3);

      it("b it wasn't the oldest one, so it still exists", function (done) {
        setTimeout(function() {
          lruCache.update({id: 4, val: "d"});
          assert.deepEqual(lruCache.cache[0], {id: 1, val: "b"});
          done();
        }, 5);
      });
      it("c it wasn't the oldest one, so it still exists", function (done) {
        setTimeout(function() {
          lruCache.update({id: 4, val: "d"});
          assert.deepEqual(lruCache.cache[1], {id: 3, val: "c"});
          done();
        }, 5);
      });
      it("the former a have disapered as is the oldest one. now there is a new d", function (done) {
        setTimeout(function() {
          lruCache.update({id: 4, val: "d"});
          assert.deepEqual(lruCache.cache[2], {id: 4, val: "d"});
          done();
        }, 5);
      });
      it("as a it don't exist anumore now b is the oldest one", function (done) {
        setTimeout(function() {
          lruCache.update({id: 4, val: "d"});
          assert.deepEqual(lruCache.cache[lruCache.hash[0].cacheIndex].val, "b");
          done();
        }, 5);
      });
      it("c is no longer the newest one", function (done) {
        setTimeout(function() {
          lruCache.update({id: 4, val: "d"});
          assert.deepEqual(lruCache.cache[lruCache.hash[1].cacheIndex].val, "c");
          done();
        }, 5);
      });
      it("the new d now is the newest one", function (done) {
        setTimeout(function() {
          lruCache.update({id: 4, val: "d"});
          assert.deepEqual(lruCache.cache[lruCache.hash[2].cacheIndex].val, "d");
          done();
        }, 5);
      });
    });
    describe("find an existing elment", function() {
      var lruCache = new CACHE.generic({
        proxy: function (data, reg) { return data.id === reg.id; },
        maxSize: 3,
        evictionStrategy: {
          metric: function () { return new Date().getTime(); }
        }
      }); 
      lruCache.update({id: 2, val: "a"});
      lruCache.update({id: 1, val: "b"});
      lruCache.update({id: 3, val: "c"});
      it('retrives the element according to the proxy function', function () {
        assert.deepEqual(lruCache.find({id: 1}), [{id: 1, val: "b"}]);
      });
      it('empty array if the element doesn\'t exist', function () {
        assert.deepEqual(lruCache.find({id: 5}), []);
      });
    });
  });
  describe("LFU", function () {
    describe("cache test", function() {
      lfuCache = new CACHE.generic({
        proxy: function (data, reg) { return data.id === reg.id; },
        maxSize: 3,
        evictionStrategy: {
          metric: function (hashEntry) {
            return (hashEntry.metric ? hashEntry.metric + 1 : 1);
          }
        }
      });
      lfuCache.update({id: 2, val: "a"});
      lfuCache.update({id: 2, val: "a"});
      lfuCache.update({id: 2, val: "a"});
      lfuCache.update({id: 1, val: "b"});
      lfuCache.update({id: 3, val: "c"});
      lfuCache.update({id: 3, val: "c"});
      lfuCache.update({id: 4, val: "d"});
      it("b it wasn't the oldest one, so it still exists", function () {
        assert.deepEqual(lfuCache.cache[0], {id: 2, val: "a"});
      });
      it("c it wasn't the oldest one, so it still exists", function () {
        assert.deepEqual(lfuCache.cache[1], {id: 3, val: "c"});
      });
      it("the former a have disapered as is the oldest one. now there is a new d", function () {
        assert.deepEqual(lfuCache.cache[2], {id: 4, val: "d"});
      });
      it("as a it don't exist anumore now b is the oldest one", function () {
        assert.deepEqual(lfuCache.cache[lfuCache.hash[0].cacheIndex].val, "d");
      });
      it("c is no longer the newest one", function () {
        assert.deepEqual(lfuCache.cache[lfuCache.hash[1].cacheIndex].val, "c");
      });
      it("the new d now is the newest one", function () {
        assert.deepEqual(lfuCache.cache[lfuCache.hash[2].cacheIndex].val, "a");
      });
    });
  });
});


