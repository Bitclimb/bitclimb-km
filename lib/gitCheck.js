const debug = require('debug')('bitclimb-km:gitCheck');
const vizion = require('vizion');
const exec = require('./exec');
const pm2json = process.env.pm2_json;
let state = 'ready';
let timer;
const gitupdate = reply => {
  debug('gitupdate called');
  vizion.update({ folder: process.cwd() }, (err, newmeta) => {
    if (err) {
      debug('Got error', err.message);
      throw new Error(err);
    } else {
      reply({ update: newmeta, action: 'restarting...' });
      exec('restart');
    }
  });
};
const isUpdated = (pmx, cb) => {
  debug('isUpdated called');

  vizion.isUpToDate({ folder: process.env.pm_cwd }, (err, meta) => {
    if (err) {
      debug('Got error', err.message);
      throw new Error(err);
    }
    if (!meta.is_up_to_date) {
      debug('isUpdated is false');
      cb(false);
      pmx.action(`GitPull: #${meta.new_revision.slice(0, 5)}`, gitupdate);
    } else {
      debug('isUpdated is true');
      cb(true);
    }
  });
};

exports.start = (pmx, ms) => {
  if (!pm2json) {
    return;
  }

  const runner = () => {
    isUpdated(pmx, r => {
      if (r && state == 'ready') {
        timer = setTimeout(runner, ms);
      }
    });
  };
  process.nextTick(runner);
};
exports.stop = () => {
  clearTimeout(timer);
  state = 'close';
};
