const utils = {
  version: '1.0.2'
};

utils.pad = function (n, width, z) {
  z = z || '0';
  width = width || 2;
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

utils.getTimestamp = function () {
  const date = new Date();
  return "" + date.getFullYear() + "/" + utils.pad(date.getMonth(), 2) + "/" + utils.pad(date.getDate()) + " " +
    utils.pad(date.getHours()) + ":" + utils.pad(date.getMinutes()) + ":" + utils.pad(date.getSeconds());
}

module.exports = utils;