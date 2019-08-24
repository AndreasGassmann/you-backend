var fs = require("fs");

function Store(path) {
  this.path = path;
  if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
  this.Store = JSON.parse(fs.readFileSync(path));
}

Store.prototype.get = function(key) {
  if (!key) return clone(this.Store);
  return clone(this.Store[key]);
};

Store.prototype.set = function(key, value) {
  this.Store[key] = clone(value);
  this.save();
};

Store.prototype.del = function(key) {
  delete this.Store[key];
  this.save();
};

Store.prototype.save = function() {
  fs.writeFileSync(this.path, JSON.stringify(this.Store));
};

function clone(data) {
  // JSON.parse(undefined) throws an error, so handle it explicitly
  if (data === undefined) return undefined;
  return JSON.parse(JSON.stringify(data));
}

export function init(path) {
  return new Store(path);
}
