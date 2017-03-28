const utils = {
  version: '1.0.2'
};

utils.pad = function (n, width, z) {
  z = z || '0';
  width = width || 2;
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

module.exports = utils;