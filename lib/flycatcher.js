var CACHE = (function () {
  /**
   * config  schema:
   * {
   *   maxSize: 2,// cache max size
   *   proxy: function (newEntry, cacheEntry, ind, arr) { return newEntry.id === oldEntry.id; },// proxy to select a cache entries
   *   evictionStrategy: {
   *     metric: function (entry, index) { return index; },// metric for evict priority
   *     evictOrder: function (entry1, entry2) { return entry1.metric - entry2.metric }// To order the cache in order of evict priority
   *   },
   *   cache: []// collection of objects pointer to be cached
   * }
   */
  function Cache(config) {
    this.maxSize = (config ? config.maxSize : 0);
    if (config.maxSize < 1) { throw "cache size must be larger than 1"; }
    this.cache = (config.cache ? config.cache : []);
    // hash schema:
    // {
    //   cacheIndex: 0,// hash table cache index
    //   metric: new Date()// metric for cache eviction
    // }
    this.hash = [];
    this.proxy = config.proxy;// proxy
    this.evictionStrategy = {
      maxSize: this.maxSize,
      metric: (
        config.evictionStrategy && config.evictionStrategy.metric ? 
        config.evictionStrategy.metric : 
        function (hashEntry) { return hashEntry.cacheIndex; }
      ),
      order: (
        config.evictionStrategy && config.evictionStrategy.order ?
        config.evictionStrategy.order :
        function (reg1, reg2) { return reg1.metric - reg2.metric; }
      )
    };
    this.onHit = config.onHit;
  }
  Cache.prototype._evictEntryByHashIndex = function (hashIndex) {
    this.hash.filter(function (entry, index) {
      return index <= hashIndex;
    }).forEach(function (entry, index) {
      this.cache = this.cache.slice(0, entry.cacheIndex)
                       .concat(this.cache.slice(entry.cacheIndex + 1));
    }.bind(this));
    this.hash = this.hash.slice(hashIndex + 1).map(function (entry, ind) {
      entry.cacheIndex -= (entry.cacheIndex ? (hashIndex + 1) : 0);
      return entry;
    });
    return hashIndex + 1;
  }
  Cache.prototype._updateHash = function (index) {
    this.hash = _updateHashMetricsByCacheIndex(
      index, this.hash, this.evictionStrategy.metric
    );
    if (!this.hash.some(function (reg) { return reg.cacheIndex === index; })) {
      if (this.cache.length > this.evictionStrategy.maxSize) {
        index -= this._evictEntryByHashIndex(
          this.hash.length - this.evictionStrategy.maxSize
        );
      }
      this.hash.push({
        cacheIndex: index,
        metric: this.evictionStrategy.metric({cacheIndex: index})
      });
    }
    return this.hash.sort(this.evictionStrategy.order);
  }
  function _updateHashMetricsByCacheIndex(cacheIndex, hash, metric) {
    return hash.map(function (entry) {
      return (entry.cacheIndex === cacheIndex ? {
        cacheIndex: cacheIndex,
        metric: metric(entry)
      } : entry);
    });
  }
  Cache.prototype._hitEntry = function (found) {
    this.cache[found.at] = data;
    this._updateHash(found.at);
  };
  Cache.prototype._newEntry = function (data) {
    this.cache.push(data);
    this._updateHash(this.cache.length - 1);
  };
  Cache.prototype.update = function (data) {
    if(
      this.cache.map(function (entry, index, arr) {
        if (this.proxy(data, entry, index, arr)) {
          return {at: index};
        } else {
          return {at: false};
        }
      }.bind(this)).filter(function (entry) {
        return entry.at !== false;
      }).map(function (found) {
        this.cache[found.at] = data;
        this._updateHash(found.at);
      }.bind(this)).length < 1
    ) {
      this.cache.push(data);
      this._updateHash(this.cache.length - 1);
    }
    return this;
  };
  /**
   * Looks a possible data entry inside the cache
   * the data would be used alognside with the proxy
   */
  Cache.prototype.find = function (data) {
    return this.cache.filter(function (entry, ind, arr) {
      return this.proxy(data, entry, ind, arr);
    }.bind({proxy: this.proxy}));
  };

  return {
    generic: Cache,
    lruFactory: function (size, proxy) {
      if (!size) { throw "LRU cache initialized without memory"; }
      return new CACHE.generic({
        proxy: proxy || function (data, reg) { return data.id === reg.id; },
        maxSize: size,
        evictionStrategy: {
          metric: function () { return new Date().getTime(); }
        }
      });
    },
    lfuFactory: function (size, proxy) {
      if (!size) { throw "LFU cache initialized without memory"; }
      return new CACHE.generic({
        proxy: proxy || function (data, reg) { return data.id === reg.id; },
        maxSize: size,
        evictionStrategy: {
          metric: function (hashEntry) {
            return (hashEntry.metric ? hashEntry.metric + 1 : 1);
          }
        }
      });
    }
  };
}())

;

if (module === undefined) {
  var module = {};
}
module.exports = CACHE;
